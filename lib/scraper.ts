import axios from 'axios';
import * as cheerio from 'cheerio';

// Rotate through multiple user agents to avoid being detected as a bot
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
];

function getRandomUA(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

// Clean Amazon URL — strip tracking params, normalize to product URL
function cleanAmazonUrl(rawUrl: string): string {
  try {
    const url = new URL(rawUrl);
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
  const headers = {
    'User-Agent': ua,
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'en-IN,en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
    'Upgrade-Insecure-Requests': '1',
  };

  try {
    const response = await axios.get(url, {
      headers,
      timeout: 20000,
      validateStatus: (status) => status < 500, // Handle 404/403 as potential block cases
    });
    
    let html = response.data;
    
    // Check if Amazon returned a CAPTCHA page or a block
    if (html.includes('Type the characters you see in this image') || 
        html.includes('robot check') ||
        html.includes('validateCaptcha') ||
        response.status === 503 ||
        response.status === 403) {
      throw new Error('BLOCKED_OR_CAPTCHA');
    }
    
    return html;
  } catch (error: any) {
    const isBlock = error.message === 'BLOCKED_OR_CAPTCHA' || 
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
  original_price: number;
  our_price: number;
  prepaid_price: number;
  images: string[];
  description: string;
  specs: Record<string, string>;
  amazon_url: string;
  asin: string;
  stock: number;
}

export async function scrapeAmazonProduct(rawUrl: string): Promise<ScrapedProduct> {
  const cleanUrl = cleanAmazonUrl(rawUrl);
  const html = await fetchWithRetry(cleanUrl);
  const $ = cheerio.load(html);

  // ── 1. EXTRACT TITLE ────────────────────────────────────────────────
  const name = (
    $('#productTitle').text().trim() ||
    $('h1.a-spacing-none span').first().text().trim() ||
    $('h1').first().text().trim() ||
    $('meta[name="title"]').attr('content') ||
    'Amazon Product'
  ).replace(/\s+/g, ' ');

  if (!name || name === 'Amazon Product') {
    throw new Error('Could not extract product name. The page may have changed or is blocked.');
  }

  // ── 2. EXTRACT PRICE ──────────────────────────────────────────
  const rawPrice =
    $('.a-price-whole').first().text().replace(/[^0-9]/g, '') ||
    $('#corePrice_feature_div .a-offscreen').first().text().replace(/[^0-9]/g, '') ||
    $('.apexPriceToPay .a-offscreen').first().text().replace(/[^0-9]/g, '') ||
    $('#priceblock_ourprice').text().replace(/[^0-9]/g, '') ||
    $('#priceblock_dealprice').text().replace(/[^0-9]/g, '');

  let original_price = rawPrice ? parseInt(rawPrice, 10) : 0;

  // Regex fallback if selectors fail
  if (!original_price) {
    const m = html.match(/"priceAmount":"([0-9.]+)"/) || html.match(/₹\s*([0-9,]+)/);
    if (m) original_price = parseFloat(m[1].replace(/,/g, ''));
  }

  if (!original_price || isNaN(original_price)) {
    throw new Error('Could not extract product price. Amazon may be hiding it or the selector changed.');
  }

  const our_price = Math.round(original_price * 0.90);
  const prepaid_price = Math.max(0, our_price - 1000);

  // ── 3. EXTRACT IMAGES (HI-RES) ──────────────────────────────────────
  const images: string[] = [];
  const seenUrls = new Set<string>();

  const addImage = (src: string) => {
    if (!src || src.includes('gif') || src.includes('pixel') || src.length < 20) return;
    // Upgrade to 1500px high-res version
    const hiRes = src.replace(/\._[A-Z0-9_,]+_\./g, '._SL1500_.').replace(/\._AC_[A-Z0-9_,]+_/, '._AC_SL1500_');
    if (!seenUrls.has(hiRes)) {
      seenUrls.add(hiRes);
      images.push(hiRes);
    }
  };

  // Main image
  const mainImg = $('#landingImage').attr('data-old-hires') || $('#landingImage').attr('src') || $('#imgBlkFront').attr('src');
  if (mainImg) addImage(mainImg);

  // Carousel thumbnails
  $('li.a-spacing-small.item img, #altImages li img').each((_, el) => {
    const src = $(el).attr('data-old-hires') || $(el).attr('src');
    if (src) addImage(src);
  });

  // Script-based fallback for images
  const allScripts = $('script').toArray().map(s => $(s).html() || '');
  for (const script of allScripts) {
    if (script.includes('"hiRes"') || script.includes('"large"')) {
      const hiResMatches = [...script.matchAll(/"hiRes"\s*:\s*"(https:[^"]+)"/g)];
      hiResMatches.forEach(m => addImage(m[1]));
    }
  }

  if (images.length === 0) throw new Error('Could not extract product images.');

  // ── 4. EXTRACT DESCRIPTION ─────────────────────────────────────────
  const bullets: string[] = [];
  $('#feature-bullets ul li span.a-list-item').each((_, el) => {
    const text = $(el).text().trim().replace(/\s+/g, ' ');
    if (text && text.length > 5 && !text.toLowerCase().includes('make sure this fits')) {
      bullets.push(text);
    }
  });
  const description = bullets.slice(0, 10).join('\n') || name;

  // ── 5. SPECIFICATIONS ────────────────────────────────────────────
  const specs: Record<string, string> = {};
  const specTableSelectors = [
    '#productDetails_techSpec_section_1 tr',
    '#productDetails_techSpec_section_2 tr',
    '.a-keyvalue.prodDetTable tr',
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

  // ── 6. BRAND & CATEGORY ──────────────────────────────────────────
  const brand = (
    specs['Brand'] ||
    specs['Manufacturer'] ||
    $('#bylineInfo').text().replace(/Visit the|Store|Brand:/gi, '').trim() ||
    ''
  ).trim();

  const breadcrumbText = $('#wayfinding-breadcrumbs_feature_div').text().toLowerCase();
  const nameLower = name.toLowerCase();
  let category = 'Other';

  if (breadcrumbText.includes('smartphone') || nameLower.includes('phone')) category = 'Smartphones';
  else if (breadcrumbText.includes('tablet') || nameLower.includes('ipad')) category = 'Tablets';
  else if (breadcrumbText.includes('laptop')) category = 'Laptops';
  else if (breadcrumbText.includes('watch')) category = 'Smartwatches';
  else if (breadcrumbText.includes('audio') || nameLower.includes('buds')) category = 'Audio';
  else if (breadcrumbText.includes('accessories')) category = 'Accessories';

  // ── 7. STOCK & ASIN ─────────────────────────────────────────────────
  const availability = $('#availability span').text().trim().toLowerCase();
  const isOut = availability.includes('unavailable') || availability.includes('out of stock');
  const asinMatch = rawUrl.match(/\/dp\/([A-Z0-9]{10})/);

  return {
    name,
    brand,
    category,
    original_price,
    our_price,
    prepaid_price,
    images: images.slice(0, 10),
    description,
    specs,
    amazon_url: cleanUrl,
    asin: asinMatch ? asinMatch[1] : 'AMAZON',
    stock: isOut ? 0 : 20,
  };
}

// Clean Flipkart URL
function cleanFlipkartUrl(rawUrl: string): string {
  try {
    const url = new URL(rawUrl);
    return `${url.origin}${url.pathname}`;
  } catch {
    return rawUrl;
  }
}

export async function scrapeFlipkartProduct(rawUrl: string): Promise<ScrapedProduct> {
  const cleanUrl = cleanFlipkartUrl(rawUrl);
  const html = await fetchWithRetry(cleanUrl);
  const $ = cheerio.load(html);

  const name = (
    $('span.B_NuCI').text().trim() ||
    $('span.VU-Z7G').text().trim() ||
    $('h1').text().trim()
  ).replace(/\s+/g, ' ');

  if (!name) throw new Error('Could not extract Flipkart product name.');

  const priceText = (
    $('.Nx9bqj._4b5DiR').first().text() ||
    $('._30jeq3._16Jk6d').first().text() ||
    $('._30jeq3').first().text()
  ).replace(/[₹,\s]/g, '');

  const original_price = parseFloat(priceText) || 0;
  if (original_price === 0) throw new Error('Could not extract Flipkart price.');

  const our_price = Math.round(original_price * 0.90);
  const prepaid_price = Math.max(0, our_price - 1000);

  const imageUrls: string[] = [];
  const seenUrls = new Set<string>();

  $('img').each((_, el) => {
    const src = $(el).attr('src') || '';
    if (src.includes('imghp') || src.includes('static-assets')) return;
    if (src.includes('/image/') && (src.includes('?q=') || src.includes('jpeg'))) {
      const hiRes = src.replace(/\?q=[0-9]+/, '?q=90').replace(/128\/128/, '832/832');
      if (!seenUrls.has(hiRes)) {
        seenUrls.add(hiRes);
        imageUrls.push(hiRes);
      }
    }
  });

  const bullets: string[] = [];
  $('._241uSg li, ._21lOLz li').each((_, el) => {
    const text = $(el).text().trim();
    if (text) bullets.push(text);
  });

  const specs: Record<string, string> = {};
  $('._1493uW tr, ._1K_KIB tr').each((_, row) => {
    const key = $(row).find('td').first().text().trim();
    const value = $(row).find('td').last().text().trim();
    if (key && value) specs[key] = value;
  });

  const brand = specs['Brand'] || name.split(' ')[0];
  const nameLower = name.toLowerCase();
  let category = 'Other';
  if (nameLower.includes('phone') || nameLower.includes('mobile')) category = 'Smartphones';
  else if (nameLower.includes('laptop')) category = 'Laptops';

  return {
    name,
    brand,
    category,
    original_price,
    our_price,
    prepaid_price,
    images: imageUrls.slice(0, 8),
    description: bullets.join('\n'),
    specs,
    amazon_url: cleanUrl,
    asin: 'FLIPKART',
    stock: 20,
  };
}

export async function scrapeProduct(url: string): Promise<ScrapedProduct> {
  if (url.includes('amazon.in')) {
    return scrapeAmazonProduct(url);
  } else if (url.includes('flipkart.com')) {
    return scrapeFlipkartProduct(url);
  } else {
    throw new Error('❌ Unsupported URL. Only Amazon.in and Flipkart.com are supported.');
  }
}
