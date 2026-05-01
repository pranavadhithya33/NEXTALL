const { scrapeProduct } = require('./lib/scraper');

async function test() {
  const amazonUrl = "https://www.amazon.in/Motorola-Smartphone-Dimensity-Processor-Amazonite/dp/B0F46SJ5SB/";
  const flipkartUrl = "https://www.flipkart.com/apple-iphone-15-black-128-gb/p/itm534062e787401";

  try {
    console.log("--- Testing Amazon Scraper ---");
    const p1 = await scrapeProduct(amazonUrl);
    console.log("Success!");
    console.log("Name:", p1.name);
    console.log("Price:", p1.original_price);
    console.log("Images:", p1.images.length);

    console.log("\n--- Testing Flipkart Scraper ---");
    const p2 = await scrapeProduct(flipkartUrl);
    console.log("Success!");
    console.log("Name:", p2.name);
    console.log("Price:", p2.original_price);
    console.log("Images:", p2.images.length);
  } catch (err) {
    console.error("Scraper Failed:", err.message);
  }
}

test();
