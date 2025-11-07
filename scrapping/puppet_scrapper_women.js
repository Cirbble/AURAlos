const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const https = require('https');

class AldoWomenScraper {
    constructor() {
        this.baseUrl = 'https://www.aldoshoes.com/en-ca/collections/womens';
        this.products = [];
        this.imageDir = path.join(__dirname, 'images_women');
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
        console.log('Navigating to Aldo women\'s collection...');
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

        // Wait for products to load
        console.log('Waiting for products to load...');
        
        // Debug: Find what's actually on the page
        const pageStructure = await this.page.evaluate(() => {
            const allElements = Array.from(document.querySelectorAll('*'));
            const classNames = new Set();
            
            allElements.forEach(el => {
                if (el.className && typeof el.className === 'string') {
                    el.className.split(' ').forEach(cls => {
                        if (cls && (cls.includes('product') || cls.includes('item') || cls.includes('card') || cls.includes('image-button'))) {
                            classNames.add(cls);
                        }
                    });
                }
            });
            
            return {
                productClasses: Array.from(classNames),
                buttons: document.querySelectorAll('button').length,
                links: document.querySelectorAll('a[href*="/products/"]').length,
                imageButtons: document.querySelectorAll('.image-button').length
            };
        });
        
        console.log('Page structure:', pageStructure);

        let productSelector = null;
        const possibleSelectors = [
            'a[href*="/products/"]',  // Try links to products first
            '.image-button',
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
                const count = await this.page.evaluate((sel) => {
                    return document.querySelectorAll(sel).length;
                }, selector);
                
                if (count > 0) {
                    productSelector = selector;
                    console.log(`Found ${count} products using selector: ${selector}`);
                    break;
                }
            } catch (e) {
                console.log(`Selector ${selector} not found, trying next...`);
            }
        }

        if (!productSelector) {
            console.log('No product selector found. Saving debug screenshot...');
            await this.page.screenshot({ path: path.join(__dirname, 'debug_women_screenshot.png'), fullPage: true });
            
            // Save HTML for debugging
            const html = await this.page.content();
            fs.writeFileSync(path.join(__dirname, 'debug_women.html'), html);
            console.log('Saved debug HTML to debug_women.html');
            return;
        }

        // Scroll to load more products
        try {
            await this.autoScroll();
        } catch (error) {
            console.log('Scroll error (continuing anyway):', error.message);
        }

        // Wait a bit to ensure page is stable
        await this.page.waitForTimeout(1000);

        console.log('Extracting product information...');
        
        const productData = await this.page.evaluate((selector) => {
            const products = document.querySelectorAll(selector);
            console.log(`Found ${products.length} product elements`);
            
            return Array.from(products).map((product, index) => {
                let link = null;
                let name = null;
                let price = null;
                let image = null;
                
                // If selector is already a link
                if (product.tagName === 'A' && product.href && product.href.includes('/products/')) {
                    link = product.href;
                    // Try to get name from alt text or nearby elements
                    const img = product.querySelector('img');
                    if (img) {
                        image = img.src;
                        name = img.alt || null;
                    }
                } else {
                    // Try to find link within element
                    const linkSelectors = [
                        'a[href*="/products/"]',
                        'a[href*="/product/"]',
                        'a'
                    ];
                    
                    for (const linkSel of linkSelectors) {
                        const linkEl = product.querySelector(linkSel);
                        if (linkEl && linkEl.href && linkEl.href.includes('aldo')) {
                            link = linkEl.href;
                            break;
                        }
                    }
                    
                    name = product.querySelector('h3, h2, .product-title, .product-name, [data-testid="product-name"]')?.textContent?.trim();
                    price = product.querySelector('.price, .product-price, [data-testid="price"]')?.textContent?.trim();
                    image = product.querySelector('img')?.src;
                }
                
                return {
                    index,
                    link,
                    name: name || 'Unknown',
                    price,
                    image
                };
            }).filter(item => item.link && item.link.includes('aldoshoes.com/'));
        }, productSelector);

        console.log(`Found ${productData.length} products with links`);

        if (productData.length === 0) {
            console.log('No products found. Saving page screenshot for debugging...');
            await this.page.screenshot({ path: path.join(__dirname, 'debug_women_screenshot.png'), fullPage: true });
            return;
        }

        for (let i = 0; i < productData.length; i++) {
            console.log(`Scraping product ${i + 1}/${productData.length}: ${productData[i].name || 'Unknown'}`);
            await this.scrapeProductDetails(productData[i].link, productData[i]);
            
            // Add delay to avoid being blocked
            await this.page.waitForTimeout(2000);
            
            // Save progress every 10 products
            if ((i + 1) % 10 === 0) {
                await this.saveProgress();
            }
        }
    }

    async scrapeProductDetails(productUrl, listingData = {}) {
        try {
            console.log(`Navigating to: ${productUrl}`);
            await this.page.goto(productUrl, { waitUntil: 'networkidle2', timeout: 30000 });
            
            // Wait for content to load
            await this.page.waitForTimeout(3000);
            
            // Try to expand accordion sections
            try {
                const accordionButtons = await this.page.$$('button[aria-expanded="false"], .accordion-button');
                for (const button of accordionButtons) {
                    try {
                        await button.click();
                        await this.page.waitForTimeout(500);
                    } catch (e) {
                        // Button might not be clickable
                    }
                }
            } catch (e) {
                // No accordion buttons found
            }
            
            await this.page.waitForTimeout(2000);
            
            const productData = await this.page.evaluate(() => {
                function cleanText(element) {
                    if (!element) return null;
                    return element.textContent?.trim().replace(/\s+/g, ' ') || null;
                }
                
                // Get product name
                let name = null;
                const nameSelectors = [
                    'h1.product-title',
                    '.product-name',
                    'h1',
                    '.pdp-product-name',
                    '[data-testid="product-name"]'
                ];
                
                for (const selector of nameSelectors) {
                    const element = document.querySelector(selector);
                    if (element && element.textContent?.trim()) {
                        name = cleanText(element);
                        break;
                    }
                }
                
                // Get price
                let price = null;
                const priceSelectors = [
                    '.price',
                    '.product-price',
                    '[data-testid="price"]',
                    '.price-current',
                    '.current-price'
                ];
                
                for (const selector of priceSelectors) {
                    const element = document.querySelector(selector);
                    if (element && element.textContent?.trim()) {
                        price = cleanText(element);
                        break;
                    }
                }
                
                // Get product images
                const allImages = Array.from(document.querySelectorAll('img'));
                const images = allImages
                    .map(img => img.src || img.getAttribute('data-src'))
                    .filter(src => src && src.startsWith('http'))
                    .filter(src => !src.includes('logo') && !src.includes('icon'))
                    .filter(src => src.includes('aldo') || src.includes('product') || src.includes('cdn'))
                    .slice(0, 8);
                
                // Get color options
                let colorOptions = [];
                const colorSelectors = [
                    '.color-option',
                    '.swatch',
                    '[data-color]',
                    '.color-swatch',
                    '.variant-option'
                ];
                
                for (const selector of colorSelectors) {
                    const elements = document.querySelectorAll(selector);
                    if (elements.length > 0) {
                        colorOptions = Array.from(elements)
                            .map(el => el.getAttribute('data-color') || el.getAttribute('title') || el.getAttribute('alt') || cleanText(el))
                            .filter(color => color && color.length > 0 && color.length < 50);
                        if (colorOptions.length > 0) break;
                    }
                }
                
                // EXTRACT DESCRIPTION FROM product-details-accordion__description fixed-body-m
                let description = null;
                
                // Target the specific class mentioned by user
                const descriptionElement = document.querySelector('.product-details-accordion__description.fixed-body-m');
                if (descriptionElement) {
                    description = cleanText(descriptionElement);
                    console.log('Found description using specific class');
                }
                
                // Fallback: try other accordion description selectors
                if (!description) {
                    const alternativeSelectors = [
                        '.product-details-accordion__description',
                        '.shared-accordion__description',
                        '.accordion__description'
                    ];
                    
                    for (const selector of alternativeSelectors) {
                        const element = document.querySelector(selector);
                        if (element) {
                            description = cleanText(element);
                            console.log(`Found description using selector: ${selector}`);
                            break;
                        }
                    }
                }
                
                // Additional fallback for product description
                if (!description) {
                    const fallbackSelectors = [
                        '.product-description',
                        '.product-details',
                        '[data-testid="product-description"]'
                    ];
                    
                    for (const selector of fallbackSelectors) {
                        const element = document.querySelector(selector);
                        if (element) {
                            const text = cleanText(element);
                            if (text && text.length > 20 && text.length < 2000) {
                                description = text;
                                console.log(`Found description using fallback: ${selector}`);
                                break;
                            }
                        }
                    }
                }
                
                return {
                    name,
                    price,
                    description,
                    images,
                    colorOptions,
                    url: window.location.href
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
                description: productData.description ? `${productData.description.substring(0, 60)}...` : 'No description',
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
                        
                        // Extract extension more carefully
                        let imageExtension = 'jpg';
                        try {
                            const urlParts = imageUrl.split('?')[0].split('.');
                            const ext = urlParts[urlParts.length - 1];
                            if (ext && ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext.toLowerCase())) {
                                imageExtension = ext.toLowerCase();
                            }
                        } catch (e) {
                            // Use default jpg
                        }
                        
                        const safeName = productData.name ? this.sanitizeFilename(productData.name) : `product_${Date.now()}`;
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

                console.log(`✓ Scraped: ${productData.name || 'Unknown Product'}`);
            }
        } catch (error) {
            console.log(`❌ Error scraping product ${productUrl}:`, error.message);
        }
    }

    async autoScroll() {
        try {
            await this.page.evaluate(async () => {
                await new Promise((resolve) => {
                    let totalHeight = 0;
                    const distance = 100;
                    let scrollAttempts = 0;
                    const maxAttempts = 100; // Prevent infinite loop
                    
                    const timer = setInterval(() => {
                        const scrollHeight = document.body.scrollHeight;
                        window.scrollBy(0, distance);
                        totalHeight += distance;
                        scrollAttempts++;

                        if (totalHeight >= scrollHeight || scrollAttempts >= maxAttempts) {
                            clearInterval(timer);
                            resolve();
                        }
                    }, 100);
                });
            });
            
            await this.page.waitForTimeout(2000);
        } catch (error) {
            console.log('AutoScroll error:', error.message);
            // Continue anyway, we might have loaded enough products
        }
    }

    sanitizeFilename(filename) {
        return filename.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    }

    async saveProgress() {
        const progressFile = path.join(__dirname, 'aldo_women_progress.json');
        fs.writeFileSync(progressFile, JSON.stringify(this.products, null, 2));
        console.log(`💾 Progress saved: ${this.products.length} products`);
    }

    async saveResults() {
        const outputFile = path.join(__dirname, 'aldo_women_products.json');
        fs.writeFileSync(outputFile, JSON.stringify(this.products, null, 2));
        console.log(`Saved ${this.products.length} products to ${outputFile}`);
        console.log(`Images saved to ${this.imageDir}`);
        
        // Print summary
        console.log('\n📊 Summary:');
        console.log(`✅ Total products scraped: ${this.products.length}`);
        console.log(`📷 Total images downloaded: ${this.products.reduce((sum, p) => sum + p.downloadedImages.length, 0)}`);
        console.log(`📝 Products with descriptions: ${this.products.filter(p => p.description).length}`);
    }

    async close() {
        if (this.browser) {
            await this.browser.close();
        }
    }

    async run() {
        try {
            console.log('🚀 Starting Aldo women\'s scraper...');
            await this.init();
            console.log('✓ Browser initialized');
            
            await this.scrapeProducts();
            console.log('✓ Product scraping completed');
            
            await this.saveResults();
            console.log('✓ Results saved');
            
        } catch (error) {
            console.error('❌ Scraping failed:', error);
            
            try {
                if (this.page) {
                    await this.page.screenshot({ path: path.join(__dirname, 'error_women_screenshot.png'), fullPage: true });
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
const scraper = new AldoWomenScraper();
scraper.run().then(() => {
    console.log('Scraping completed!');
}).catch(error => {
    console.error('Scraper error:', error);
});

