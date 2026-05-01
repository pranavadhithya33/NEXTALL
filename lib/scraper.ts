import axios from 'axios';
import * as cheerio from 'cheerio';

// Rotate through multiple user agents to avoid being detected as a bot
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2.1 Safari/605.1.15',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0',
];

function getRandomUA(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

// Clean Amazon URL — strip tracking params, normalize to product URL
function cleanAmazonUrl(rawUrl: string): string {
  try {
    const url = new URL(rawUrl);
    // Keep only the ASIN path: /dp/XXXXXXXXXX
    const asinMatch = url.pathname.match(/\/dp\/([A-Z0-9]{10})/);
    if (asinMatch) {
      return `https://www.amazon.in/dp/${asinMatch[1]}`;
    }
    return rawUrl;
  } catch {
    return rawUrl;
  }
}

async function fetchWithRetry(url: string, attempt = 1): Promise<string> {
  const ua = getRandomUA();
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': ua,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-IN,en-GB;q=0.9,en-US;q=0.8,en;q=0.7,hi;q=0.6',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'sec-ch-ua': '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'DNT': '1',
      },
      timeout: 20000,
      maxRedirects: 5,
    });
    
    // Check if Amazon returned a CAPTCHA page
    if (response.data.includes('Type the characters you see in this image') || 
        response.data.includes('robot check') ||
        response.data.includes('validateCaptcha')) {
      throw new Error('CAPTCHA_DETECTED');
    }
    
    return response.data;
  } catch (error: any) {
    // If it's a CAPTCHA or a block (503/403/429), try proxy on second attempt
    const isBlock = error.message === 'CAPTCHA_DETECTED' || 
                   error.response?.status === 503 || 
                   error.response?.status === 403 || 
                   error.response?.status === 429 ||
                   error.code === 'ECONNABORTED';

    if (attempt === 1 && isBlock) {
      console.log('Direct fetch blocked or timed out, trying proxy...');
      try {
        const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
        const proxyRes = await axios.get(proxyUrl, { timeout: 30000 });
        return proxyRes.data;
      } catch (proxyError) {
        console.error('Proxy fetch also failed:', proxyError);
        // Fallback to retry logic if proxy fails
      }
    }

    if (attempt < 3) {
      const delay = isBlock ? 2000 : 5000;
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
      return fetchWithRetry(url, attempt + 1);
    }
    throw error;
  }
}

export interface ScrapedProduct {
  name: string;
  brand: string;
  category: string;
  originalPrice: number;
  ourPrice: number;
  prepaidPrice: number;
  images: string[];  // Raw Amazon CDN URLs — will be re-uploaded to Supabase
  description: string;
  specs: Record<string, string>;
  amazonUrl: string;
  asin: string;
}

export async function scrapeAmazonProduct(rawUrl: string): Promise<ScrapedProduct> {
  const cleanUrl = cleanAmazonUrl(rawUrl);
  const html = await fetchWithRetry(cleanUrl);
  const $ = cheerio.load(html);

  // ── Product Name ──────────────────────────────────────────────
  const name = (
    $('#productTitle').text().trim() ||
    $('h1.a-spacing-none span').first().text().trim() ||
    $('h1').first().text().trim()
  ).replace(/\s+/g, ' ');

  if (!name) throw new Error('Could not extract product name. The page may have changed or is not a product page.');

  // ── Price Extraction (multiple fallback selectors) ─────────────
  const priceSelectors = [
    '#corePriceDisplay_desktop_feature_div .a-price-whole',
    '#corePrice_feature_div .a-price-whole',
    '#priceblock_ourprice',
    '#priceblock_dealprice',
    '.priceToPay .a-price-whole',
    '#apex_offerDisplay_desktop .a-price-whole',
    '.a-price.a-text-price.a-size-medium .a-offscreen',
    '#price_inside_buybox',
    '#newBuyBoxPrice',
  ];

  let originalPriceRaw = '';
  for (const selector of priceSelectors) {
    const el = $(selector).first();
    if (el.length && el.text().trim()) {
      originalPriceRaw = el.text().trim();
      break;
    }
  }

  // Also try the .a-offscreen inside the main price block (most reliable)
  if (!originalPriceRaw) {
    const offscreen = $('#corePriceDisplay_desktop_feature_div .a-offscreen').first().text().trim() ||
                      $('#corePrice_feature_div .a-offscreen').first().text().trim();
    if (offscreen) originalPriceRaw = offscreen;
  }

  const originalPrice = parseFloat(originalPriceRaw.replace(/[₹,\s\u20B9]/g, '').split('.')[0]) || 0;
  if (originalPrice === 0) throw new Error('Could not extract product price. Please try a different Amazon product URL or add the product manually.');

  const ourPrice = Math.round(originalPrice * 0.90);
  const prepaidPrice = ourPrice - 1000;  // Flat ₹1,000 off for prepaid

  // ── Image Extraction (most comprehensive approach) ─────────────
  const imageUrls: string[] = [];
  const seenUrls = new Set<string>();

  const addImage = (url: string) => {
    if (!url || seenUrls.has(url) || url.includes('sprite') || url.includes('Spinner') || url.length < 20) return;
    // Convert any thumbnail URL to the hi-res version
    const hiRes = url
      .replace(/\._[A-Z0-9_,]+_\./, '.')  // Remove Amazon image size params
      .replace(/\._AC_[A-Z0-9_,]+_/, '._AC_SL1500_');  // Request 1500px version
    seenUrls.add(hiRes);
    imageUrls.push(hiRes);
  };

  // Method 1: data-old-hires attribute on thumbnail images
  $('[data-old-hires]').each((_, el) => {
    addImage($(el).attr('data-old-hires') || '');
  });

  // Method 2: Parse the inline colorImages JavaScript object Amazon embeds in a <script> tag
  const allScripts = $('script').toArray().map(s => $(s).html() || '');
  for (const script of allScripts) {
    if (script.includes('"hiRes"') || script.includes('"large"')) {
      // Extract all "hiRes" values
      const hiResMatches = [...script.matchAll(/"hiRes"\s*:\s*"(https:[^"]+)"/g)];
      hiResMatches.forEach(m => addImage(m[1]));

      // Extract "large" values as fallback
      if (imageUrls.length === 0) {
        const largeMatches = [...script.matchAll(/"large"\s*:\s*"(https:[^"]+)"/g)];
        largeMatches.forEach(m => addImage(m[1]));
      }
    }

    // Another Amazon script pattern: 'ImageBlockATF' object
    if (script.includes('ImageBlockATF') || script.includes('colorImages')) {
      const urlMatches = [...script.matchAll(/https:\/\/m\.media-amazon\.com\/images\/I\/[A-Za-z0-9._%-]+\.jpg/g)];
      urlMatches.forEach(m => {
        if (!m[0].includes('sprite')) addImage(m[0]);
      });
    }
  }

  // Method 3: Main product image src (fallback)
  if (imageUrls.length === 0) {
    const mainSrc = $('#landingImage').attr('src') || $('#imgBlkFront').attr('src') || '';
    if (mainSrc) addImage(mainSrc);
  }

  if (imageUrls.length === 0) throw new Error('Could not extract product images. Please add images manually after saving.');

  // ── Description (bullet points) ───────────────────────────────
  const bullets: string[] = [];
  $('#feature-bullets ul li span.a-list-item').each((_, el) => {
    const text = $(el).text().trim().replace(/\s+/g, ' ');
    if (text && text.length > 10 && !text.includes('Make sure this fits')) {
      bullets.push(text);
    }
  });

  // ── Specifications (table parsing) ────────────────────────────
  const specs: Record<string, string> = {};
  const specTableSelectors = [
    '#productDetails_techSpec_section_1 tr',
    '#productDetails_techSpec_section_2 tr',
    '#productDetails_db_sections tr',
    '.a-keyvalue.prodDetTable tr',
    '#detailBullets_feature_div li',
  ];

  for (const selector of specTableSelectors) {
    $(selector).each((_, row) => {
      const th = $(row).find('th').text().trim().replace(/\s+/g, ' ');
      const td = $(row).find('td').text().trim().replace(/\s+/g, ' ').replace(/[\n\t]/g, '');
      if (th && td && td.length < 500) {
        specs[th] = td;
      }
    });
  }

  // Also parse detail bullets (Amazon sometimes puts specs here)
  $('#detailBullets_feature_div li').each((_, el) => {
    const text = $(el).text().trim().replace(/\s+/g, ' ');
    const parts = text.split(':');
    if (parts.length >= 2) {
      const key = parts[0].replace(/[•]/g, '').trim();
      const value = parts.slice(1).join(':').trim();
      if (key && value) specs[key] = value;
    }
  });

  // ── Brand ─────────────────────────────────────────────────────
  const brand = (
    specs['Brand'] ||
    specs['Manufacturer'] ||
    specs['Item model number']?.split('-')[0] ||
    $('#bylineInfo').text().replace(/Visit the|Store|Brand:/gi, '').trim() ||
    ''
  ).trim();

  // ── Category Inference ────────────────────────────────────────
  const breadcrumbText = $('#wayfinding-breadcrumbs_feature_div').text().toLowerCase();
  const nameLower = name.toLowerCase();
  let category = 'Other';

  if (breadcrumbText.includes('smartphone') || breadcrumbText.includes('mobile phone') ||
      nameLower.includes('5g') || nameLower.includes('4g') ||
      ['samsung', 'apple', 'oneplus', 'realme', 'redmi', 'poco', 'vivo', 'oppo', 'motorola', 'iqoo', 'nothing']
        .some(b => nameLower.includes(b))) {
    category = 'Smartphones';
  } else if (breadcrumbText.includes('tablet') || nameLower.includes('ipad') || nameLower.includes('tab ')) {
    category = 'Tablets';
  } else if (breadcrumbText.includes('laptop') || breadcrumbText.includes('notebook') ||
             nameLower.includes('macbook') || nameLower.includes('vivobook')) {
    category = 'Laptops';
  } else if (breadcrumbText.includes('smartwatch') || breadcrumbText.includes('wearable') ||
             nameLower.includes('watch') || nameLower.includes('band')) {
    category = 'Smartwatches';
  } else if (breadcrumbText.includes('headphone') || breadcrumbText.includes('earphone') ||
             breadcrumbText.includes('speaker') || nameLower.includes('buds') ||
             nameLower.includes('airpods') || nameLower.includes('neckband')) {
    category = 'Audio';
  } else if (breadcrumbText.includes('accessories') || breadcrumbText.includes('charger') ||
             breadcrumbText.includes('cable') || breadcrumbText.includes('case')) {
    category = 'Accessories';
  }

  // ── ASIN ──────────────────────────────────────────────────────
  const asinMatch = rawUrl.match(/\/dp\/([A-Z0-9]{10})/);
  const asin = asinMatch ? asinMatch[1] : '';

  return {
    name,
    brand,
    category,
    originalPrice,
    ourPrice,
    prepaidPrice,
    images: imageUrls.slice(0, 8),  // Max 8 images
    description: bullets.join('\n'),
    specs,
    amazonUrl: cleanUrl,
    asin,
  };
}
