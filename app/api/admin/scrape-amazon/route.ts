import { NextResponse } from 'next/server';
import { scrapeAmazonProduct } from '@/lib/scraper';
import { createClient } from '@/lib/supabase/server';
import { generateSlug } from '@/lib/utils';
import axios from 'axios';
import { z } from 'zod';

const requestSchema = z.object({
  url: z.string().url().refine((val) => val.includes('amazon.in'), {
    message: "URL must be an amazon.in link",
  }),
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
      timeout: 10000,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1)' },
    });

    const buffer = Buffer.from(response.data);
    const contentType = String(response.headers['content-type'] || 'image/jpeg');
    const ext = contentType.includes('png') ? 'png' : 'jpg';
    const fileName = `${productSlug}-${index + 1}-${Date.now()}.${ext}`;
    const filePath = `${fileName}`; // bucket root

    const { error } = await supabase.storage
      .from('product-images')
      .upload(filePath, buffer, {
        contentType,
        upsert: true,
      });

    if (error) {
      console.error(`Failed to upload image ${index}:`, error.message);
      return null;
    }

    const { data } = supabase.storage.from('product-images').getPublicUrl(filePath);
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

    const scrapedData = await scrapeAmazonProduct(result.data.url);
    const supabase = createClient(true);

    let slug = generateSlug(scrapedData.name);
    let isUnique = false;
    let counter = 1;
    let finalSlug = slug;

    // Slug uniqueness check
    while (!isUnique) {
      const { data } = await supabase.from('products').select('id').eq('slug', finalSlug).single();
      if (!data) {
        isUnique = true;
      } else {
        counter++;
        finalSlug = `${slug}-${counter}`;
      }
    }

    // Re-upload images
    const uploadedImages: string[] = [];
    for (let i = 0; i < scrapedData.images.length; i++) {
      const publicUrl = await reuploadImageToSupabase(scrapedData.images[i], supabase, finalSlug, i);
      if (publicUrl) uploadedImages.push(publicUrl);
    }

    return NextResponse.json({
      success: true,
      product: {
        ...scrapedData,
        slug: finalSlug,
        images: uploadedImages, // Replace amazon URLs with our Supabase public URLs
      }
    });

  } catch (error: any) {
    console.error('Scraping error:', error);
    return NextResponse.json({ error: error.message || 'Failed to scrape product' }, { status: 500 });
  }
}
