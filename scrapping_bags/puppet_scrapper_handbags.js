const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const https = require('https');

class AldoHandbagsScraper {
    constructor() {
        this.baseUrl = 'https://www.aldoshoes.com/en-ca/collections/womens-handbags';
        this.products = [];
        this.imageDir = path.join(__dirname, 'images');
    }

    async init() {
        // Create images directory if it doesn't exist
        if (!fs.existsSync(this.imageDir)) {
            fs.mkdirSync(this.imageDir, { recursive: true });
        }

        this.browser = await puppeteer.launch({
            headless: false,
            defaultViewport: { width: 1920, height: 1080 },
            args: [
                '--no-sandbox', 
                '--disable-setuid-sandbox',
                '--disable-blink-features=AutomationControlled',
                '--disable-features=VizDisplayCompositor'
            ]
        });
        
        this.page = await this.browser.newPage();
        
        // Set realistic headers
        await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        await this.page.setExtraHTTPHeaders({
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
        });
        
        // Remove webdriver property
        await this.page.evaluateOnNewDocument(() => {
            Object.defineProperty(navigator, 'webdriver', {
                get: () => undefined,
            });
        });
    }

    async downloadImage(url, filename) {
        return new Promise((resolve, reject) => {
            const file = fs.createWriteStream(path.join(this.imageDir, filename));
            https.get(url, (response) => {
                response.pipe(file);
                file.on('finish', () => {
                    file.close();
                    resolve(filename);
                });
            }).on('error', (err) => {
                fs.unlink(path.join(this.imageDir, filename), () => {});
                reject(err);
            });
        });
    }

    async scrapeProducts() {
        console.log('Navigating to Aldo women\'s handbags collection...');
        await this.page.goto(this.baseUrl, { waitUntil: 'networkidle2', timeout: 30000 });

        // Handle cookie consent if present
        try {
            await this.page.waitForSelector('#onetrust-accept-btn-handler', { timeout: 5000 });
            await this.page.click('#onetrust-accept-btn-handler');
            console.log('Accepted cookies');
            await this.page.waitForTimeout(2000);
        } catch (e) {
            console.log('No cookie consent found or already accepted');
        }

        // Wait longer and try multiple selectors for products
        console.log('Waiting for products to load...');
        
        let productSelector = null;
        const possibleSelectors = [
            '.product-item',
            '.product-card',
            '.grid-product',
            '[data-testid="product-card"]',
            '.product',
            '.ProductItem',
            'article',
            '.collection-product-card'
        ];

        for (const selector of possibleSelectors) {
            try {
                await this.page.waitForSelector(selector, { timeout: 5000 });
                productSelector = selector;
                console.log(`Found products using selector: ${selector}`);
                break;
            } catch (e) {
                console.log(`Selector ${selector} not found, trying next...`);
            }
        }

        if (!productSelector) {
            console.log('No product selector found. Let me check the page structure...');
            
            // Debug: Get page content to understand structure
            const pageContent = await this.page.evaluate(() => {
                return {
                    title: document.title,
                    url: window.location.href,
                    bodyClasses: document.body.className,
                    allLinks: Array.from(document.querySelectorAll('a')).slice(0, 10).map(a => ({
                        href: a.href,
                        text: a.textContent?.trim().substring(0, 50)
                    })),
                    possibleProductElements: Array.from(document.querySelectorAll('*')).filter(el => 
                        el.className && typeof el.className === 'string' && (
                            el.className.includes('product') || 
                            el.className.includes('item') ||
                            el.className.includes('card')
                        )
                    ).slice(0, 10).map(el => ({
                        tagName: el.tagName,
                        className: el.className,
                        textContent: el.textContent?.trim().substring(0, 100)
                    }))
                };
            });
            
            console.log('Page debug info:', JSON.stringify(pageContent, null, 2));
            return;
        }

        // Scroll to load more products
        await this.autoScroll();

        console.log('Extracting product information...');
        
        const productData = await this.page.evaluate((selector) => {
            const products = document.querySelectorAll(selector);
            console.log(`Found ${products.length} product elements`);
            
            return Array.from(products).map((product, index) => {
                // Try multiple ways to get product link
                let link = null;
                const linkSelectors = [
                    'a[href*="/products/"]',
                    'a[href*="/product/"]',
                    'a[href*="handbags"]',
                    'a[href*="bag"]',
                    'a',
                    '.product-link'
                ];
                
                for (const linkSel of linkSelectors) {
                    const linkEl = product.querySelector(linkSel);
                    if (linkEl && linkEl.href && linkEl.href.includes('aldo')) {
                        link = linkEl.href;
                        break;
                    }
                }
                
                // Try to get basic product info from listing page
                const name = product.querySelector('h3, h2, .product-title, .product-name, [data-testid="product-name"]')?.textContent?.trim();
                const price = product.querySelector('.price, .product-price, [data-testid="price"]')?.textContent?.trim();
                const image = product.querySelector('img')?.src;
                
                return {
                    index,
                    link,
                    name,
                    price,
                    image,
                    html: product.outerHTML.substring(0, 200) // Debug info
                };
            }).filter(item => item.link);
        }, productSelector);

        console.log(`Found ${productData.length} products with links`);
        console.log('Sample product data:', productData.slice(0, 2));

        if (productData.length === 0) {
            console.log('No products found. Saving page screenshot for debugging...');
            await this.page.screenshot({ path: path.join(__dirname, 'debug_screenshot.png'), fullPage: true });
            return;
        }

        for (let i = 0; i < Math.min(productData.length, 20); i++) { // Limit to first 20 for testing
            console.log(`Scraping product ${i + 1}/${productData.length}: ${productData[i].name || 'Unknown'}`);
            await this.scrapeProductDetails(productData[i].link, productData[i]);
            
            // Add delay to avoid being blocked
            await this.page.waitForTimeout(2000);
        }
    }

    async scrapeProductDetails(productUrl, listingData = {}) {
        try {
            console.log(`Navigating to: ${productUrl}`);
            await this.page.goto(productUrl, { waitUntil: 'networkidle2', timeout: 30000 });
            
            const productData = await this.page.evaluate(() => {
                // Try multiple selectors for product name
                const nameSelectors = [
                    'h1.product-title',
                    '.product-name',
                    'h1',
                    '.pdp-product-name',
                    '[data-testid="product-name"]',
                    '.product-details h1',
                    '.product-info h1'
                ];
                
                let name = null;
                for (const selector of nameSelectors) {
                    const element = document.querySelector(selector);
                    if (element && element.textContent?.trim()) {
                        name = element.textContent.trim();
                        break;
                    }
                }
                
                // Try multiple selectors for price
                const priceSelectors = [
                    '.price',
                    '.product-price',
                    '[data-testid="price"]',
                    '.price-current',
                    '.current-price',
                    '.pdp-price',
                    '.product-price-current'
                ];
                
                let price = null;
                for (const selector of priceSelectors) {
                    const element = document.querySelector(selector);
                    if (element && element.textContent?.trim()) {
                        price = element.textContent.trim();
                        break;
                    }
                }
                
                // Get all product images - be more aggressive
                const allImages = Array.from(document.querySelectorAll('img'));
                const images = allImages
                    .map(img => img.src || img.getAttribute('data-src') || img.getAttribute('data-lazy'))
                    .filter(src => src && src.startsWith('http'))
                    .filter(src => !src.includes('logo') && !src.includes('icon'))
                    .filter(src => src.includes('aldo') || src.includes('product') || src.includes('cdn'))
                    .slice(0, 8); // Get more images
                
                // Try multiple selectors for color options
                const colorSelectors = [
                    '.color-option',
                    '.swatch',
                    '[data-color]',
                    '.color-swatch',
                    '.variant-option',
                    '.product-option'
                ];
                
                let colorOptions = [];
                for (const selector of colorSelectors) {
                    const elements = document.querySelectorAll(selector);
                    if (elements.length > 0) {
                        colorOptions = Array.from(elements)
                            .map(el => el.getAttribute('data-color') || el.getAttribute('title') || el.getAttribute('alt') || el.textContent?.trim())
                            .filter(color => color && color.length > 0 && color.length < 50);
                        if (colorOptions.length > 0) break;
                    }
                }
                
                // Try to get bag type/style
                let bagType = null;
                const bagTypeSelectors = [
                    '.product-type',
                    '.bag-type',
                    '.style-type',
                    '[data-testid="product-type"]'
                ];
                
                for (const selector of bagTypeSelectors) {
                    const element = document.querySelector(selector);
                    if (element && element.textContent?.trim()) {
                        bagType = element.textContent.trim();
                        break;
                    }
                }
                
                // Try to get dimensions or size info
                let dimensions = null;
                const dimensionSelectors = [
                    '.dimensions',
                    '.size-info',
                    '.product-dimensions',
                    '[data-testid="dimensions"]'
                ];
                
                for (const selector of dimensionSelectors) {
                    const element = document.querySelector(selector);
                    if (element && element.textContent?.trim()) {
                        dimensions = element.textContent.trim();
                        break;
                    }
                }
                
                // Try to get material info
                let material = null;
                const materialSelectors = [
                    '.material',
                    '.product-material',
                    '.fabric',
                    '[data-testid="material"]'
                ];
                
                for (const selector of materialSelectors) {
                    const element = document.querySelector(selector);
                    if (element && element.textContent?.trim()) {
                        material = element.textContent.trim();
                        break;
                    }
                }
                
                // Debug info
                const debugInfo = {
                    title: document.title,
                    h1Elements: Array.from(document.querySelectorAll('h1')).map(h => h.textContent?.trim()).slice(0, 3),
                    priceElements: Array.from(document.querySelectorAll('*')).filter(el => 
                        el.textContent && el.textContent.includes('$')
                    ).slice(0, 5).map(el => ({
                        tag: el.tagName,
                        class: el.className,
                        text: el.textContent?.trim().substring(0, 50)
                    })),
                    imageCount: allImages.length,
                    filteredImageCount: images.length
                };
                
                return {
                    name,
                    price,
                    images,
                    colorOptions,
                    bagType,
                    dimensions,
                    material,
                    url: window.location.href,
                    debugInfo
                };
            });

            // Use listing data as fallback
            if (!productData.name && listingData.name) {
                productData.name = listingData.name;
            }
            if (!productData.price && listingData.price) {
                productData.price = listingData.price;
            }
            if (productData.images.length === 0 && listingData.image) {
                productData.images = [listingData.image];
            }

            console.log(`Product data:`, {
                name: productData.name,
                price: productData.price,
                bagType: productData.bagType,
                material: productData.material,
                imageCount: productData.images.length,
                colorCount: productData.colorOptions.length
            });

            if (productData.name || productData.price) {
                // Download images
                const downloadedImages = [];
                for (let j = 0; j < productData.images.length; j++) {
                    try {
                        const imageUrl = productData.images[j];
                        if (!imageUrl.startsWith('http')) continue;
                        
                        const imageExtension = imageUrl.split('.').pop().split('?')[0] || 'jpg';
                        const safeName = productData.name ? this.sanitizeFilename(productData.name) : `handbag_${Date.now()}`;
                        const filename = `${safeName}_${j + 1}.${imageExtension}`;
                        
                        await this.downloadImage(imageUrl, filename);
                        downloadedImages.push(filename);
                        console.log(`Downloaded image: ${filename}`);
                    } catch (error) {
                        console.log(`Failed to download image ${j + 1}:`, error.message);
                    }
                }

                this.products.push({
                    ...productData,
                    downloadedImages
                });

                console.log(`✓ Scraped: ${productData.name || 'Unknown Handbag'}`);
            } else {
                console.log(`⚠ No product data found. Debug info:`, productData.debugInfo);
            }
        } catch (error) {
            console.log(`❌ Error scraping product ${productUrl}:`, error.message);
        }
    }

    async autoScroll() {
        await this.page.evaluate(async () => {
            await new Promise((resolve) => {
                let totalHeight = 0;
                const distance = 100;
                const timer = setInterval(() => {
                    const scrollHeight = document.body.scrollHeight;
                    window.scrollBy(0, distance);
                    totalHeight += distance;

                    if (totalHeight >= scrollHeight) {
                        clearInterval(timer);
                        resolve();
                    }
                }, 100);
            });
        });
        
        // Wait for any lazy-loaded content
        await this.page.waitForTimeout(2000);
    }

    sanitizeFilename(filename) {
        return filename.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    }

    async saveResults() {
        const outputFile = path.join(__dirname, 'aldo_handbags_products.json');
        fs.writeFileSync(outputFile, JSON.stringify(this.products, null, 2));
        console.log(`Saved ${this.products.length} products to ${outputFile}`);
        console.log(`Images saved to ${this.imageDir}`);
    }

    async close() {
        if (this.browser) {
            await this.browser.close();
        }
    }

    async run() {
        try {
            console.log('🚀 Starting Aldo handbags scraper...');
            await this.init();
            console.log('✓ Browser initialized');
            
            await this.scrapeProducts();
            console.log('✓ Product scraping completed');
            
            await this.saveResults();
            console.log('✓ Results saved');
            
        } catch (error) {
            console.error('❌ Scraping failed:', error);
            
            // Save debug screenshot if possible
            try {
                if (this.page) {
                    await this.page.screenshot({ path: path.join(__dirname, 'error_screenshot.png'), fullPage: true });
                    console.log('📸 Error screenshot saved');
                }
            } catch (screenshotError) {
                console.log('Could not save screenshot:', screenshotError.message);
            }
        } finally {
            await this.close();
            console.log('🏁 Browser closed');
        }
    }
}

// Run the scraper
const scraper = new AldoHandbagsScraper();
scraper.run().then(() => {
    console.log('Scraping completed!');
}).catch(error => {
    console.error('Scraper error:', error);
});