import { NextResponse } from 'next/server';
import { scrapeAmazonProduct } from '@/lib/scraper';
import { createClient } from '@/lib/supabase/server';
import { generateSlug } from '@/lib/utils';
import axios from 'axios';
import { z } from 'zod';

const requestSchema = z.object({
  url: z.string().url().refine(
    (val) => (val.includes('amazon.in') && /\/dp\/[A-Z0-9]{10}/i.test(val)) || val.includes('flipkart.com'),
    {
      message: "❌ Invalid URL. Please provide a direct Amazon.in product link (with /dp/) or a Flipkart.com product link.",
    }
  ),
});

async function reuploadImageToSupabase(
  imageUrl: string,
  supabase: ReturnType<typeof createClient>,
  productSlug: string,
  index: number
): Promise<string | null> {
  try {
    const response = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1)',
        'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
        'Referer': 'https://www.amazon.in/',
      },
    });

    const buffer = Buffer.from(response.data);
    const contentType = String(response.headers['content-type'] || 'image/jpeg');
    const ext = contentType.includes('png') ? 'png' : 'jpg';
    const fileName = `${productSlug}-${index + 1}-${Date.now()}.${ext}`;

    const { error } = await supabase.storage
      .from('product-images')
      .upload(fileName, buffer, {
        contentType,
        upsert: true,
      });

    if (error) {
      console.error(`Failed to upload image ${index}:`, error.message);
      return null;
    }

    const { data } = supabase.storage.from('product-images').getPublicUrl(fileName);
    return data.publicUrl;
  } catch (err) {
    console.error(`Image download failed for index ${index}:`, err);
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = requestSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
    }

    // Extract clean /dp/ASIN URL
    const asinMatch = result.data.url.match(/\/dp\/([A-Z0-9]{10})/i);
    const cleanUrl = asinMatch
      ? `https://www.amazon.in/dp/${asinMatch[1]}`
      : result.data.url;

    let scrapedData;
    try {
      const { scrapeProduct } = await import('@/lib/scraper');
      scrapedData = await scrapeProduct(result.data.url);
    } catch (scrapeError: any) {
      // If scraping fails with 503/blocked, return structured error
      const msg = scrapeError.message || '';
      if (msg.includes('503') || msg.includes('CAPTCHA') || msg.includes('robot')) {
        return NextResponse.json({
          error: '⚠️ Amazon blocked this request right now. This happens sometimes. Wait 30–60 seconds and try again with a different product URL, or use "Add Product" to enter details manually.'
        }, { status: 503 });
      }
      if (msg.includes('price')) {
        return NextResponse.json({
          error: '⚠️ Could not read the price from this Amazon page. Try a different product URL or add the product manually.'
        }, { status: 422 });
      }
      throw scrapeError;
    }

    const supabase = createClient(true);

    let slug = generateSlug(scrapedData.name);
    let isUnique = false;
    let counter = 1;
    let finalSlug = slug;

    while (!isUnique) {
      const { data } = await supabase.from('products').select('id').eq('slug', finalSlug).single();
      if (!data) {
        isUnique = true;
      } else {
        counter++;
        finalSlug = `${slug}-${counter}`;
      }
    }

    // Re-upload images to Supabase (parallel, max 6)
    const imagePromises = scrapedData.images.slice(0, 6).map((imgUrl, i) =>
      reuploadImageToSupabase(imgUrl, supabase, finalSlug, i)
    );
    const uploadedImages = (await Promise.all(imagePromises)).filter(Boolean) as string[];

    return NextResponse.json({
      success: true,
      product: {
        ...scrapedData,
        slug: finalSlug,
        images: uploadedImages,
      }
    });

  } catch (error: any) {
    console.error('Scraping error:', error);
    return NextResponse.json({
      error: error.message || 'Failed to scrape product. Try again or add the product manually.'
    }, { status: 500 });
  }
}
