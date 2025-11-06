const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const https = require('https');

async function scrapeAldo() {
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: { width: 1920, height: 1080 },
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    try {
        console.log('🚀 Navigating to Aldo men\'s collection...');
        await page.goto('https://www.aldoshoes.com/en-ca/collections/mens', { 
            waitUntil: 'networkidle2', 
            timeout: 30000 
        });

        // Handle cookies
        try {
            await page.waitForSelector('#onetrust-accept-btn-handler', { timeout: 5000 });
            await page.click('#onetrust-accept-btn-handler');
            console.log('✓ Accepted cookies');
            await page.waitForTimeout(2000);
        } catch (e) {
            console.log('No cookie banner found');
        }

        // Wait for page to load completely
        await page.waitForTimeout(5000);

        console.log('📄 Analyzing page structure...');
        
        // Get all the page info first
        const pageInfo = await page.evaluate(() => {
            return {
                title: document.title,
                url: window.location.href,
                allElements: Array.from(document.querySelectorAll('*'))
                    .filter(el => el.tagName && el.className)
                    .slice(0, 50)
                    .map(el => ({
                        tag: el.tagName,
                        class: typeof el.className === 'string' ? el.className : el.className.toString(),
                        id: el.id,
                        text: el.textContent?.trim().substring(0, 100)
                    })),
                links: Array.from(document.querySelectorAll('a'))
                    .filter(a => a.href && a.href.includes('product'))
                    .slice(0, 20)
                    .map(a => ({
                        href: a.href,
                        text: a.textContent?.trim().substring(0, 50),
                        classes: typeof a.className === 'string' ? a.className : a.className.toString()
                    }))
            };
        });

        console.log('Page title:', pageInfo.title);
        console.log('Found', pageInfo.links.length, 'product links');
        console.log('Sample links:', pageInfo.links.slice(0, 3));

        if (pageInfo.links.length === 0) {
            console.log('❌ No product links found. Page elements:');
            console.log(pageInfo.allElements.slice(0, 10));
            
            // Save screenshot for debugging
            await page.screenshot({ path: 'debug_page.png', fullPage: true });
            console.log('📸 Debug screenshot saved as debug_page.png');
            return;
        }

        // Create images directory
        const imageDir = path.join(__dirname, 'images');
        if (!fs.existsSync(imageDir)) {
            fs.mkdirSync(imageDir, { recursive: true });
        }

        const products = [];
        const maxProducts = Math.min(pageInfo.links.length, 10); // Limit for testing

        for (let i = 0; i < maxProducts; i++) {
            const productUrl = pageInfo.links[i].href;
            console.log(`\n🔍 Scraping product ${i + 1}/${maxProducts}: ${productUrl}`);

            try {
                await page.goto(productUrl, { waitUntil: 'networkidle2', timeout: 30000 });
                await page.waitForTimeout(3000);

                const productData = await page.evaluate(() => {
                    // Get product name - try multiple approaches
                    let name = null;
                    const nameSelectors = ['h1', '.product-title', '.pdp-product-name', '[data-testid="product-name"]'];
                    for (const selector of nameSelectors) {
                        const el = document.querySelector(selector);
                        if (el && el.textContent?.trim()) {
                            name = el.textContent.trim();
                            break;
                        }
                    }

                    // Get price - look for $ symbol
                    let price = null;
                    const priceElements = Array.from(document.querySelectorAll('*'))
                        .filter(el => el.textContent && el.textContent.includes('$'))
                        .filter(el => el.textContent.match(/\$\d+/));
                    
                    if (priceElements.length > 0) {
                        price = priceElements[0].textContent.trim();
                    }

                    // Get all images
                    const images = Array.from(document.querySelectorAll('img'))
                        .map(img => img.src)
                        .filter(src => src && src.startsWith('http'))
                        .filter(src => !src.includes('logo') && !src.includes('icon'))
                        .slice(0, 5);

                    // Try to find color options
                    const colorOptions = Array.from(document.querySelectorAll('*'))
                        .filter(el => el.getAttribute && (
                            el.getAttribute('data-color') || 
                            el.getAttribute('title')?.toLowerCase().includes('color') ||
                            (el.className && typeof el.className === 'string' && el.className.includes('color'))
                        ))
                        .map(el => el.getAttribute('data-color') || el.getAttribute('title') || el.textContent?.trim())
                        .filter(color => color && color.length > 0 && color.length < 30);

                    return {
                        name,
                        price,
                        images,
                        colorOptions: [...new Set(colorOptions)], // Remove duplicates
                        url: window.location.href
                    };
                });

                if (productData.name || productData.price) {
                    console.log(`✓ Found: ${productData.name || 'Unknown'} - ${productData.price || 'No price'}`);
                    console.log(`  Images: ${productData.images.length}, Colors: ${productData.colorOptions.length}`);

                    // Download images
                    const downloadedImages = [];
                    for (let j = 0; j < productData.images.length; j++) {
                        try {
                            const imageUrl = productData.images[j];
                            const extension = imageUrl.split('.').pop().split('?')[0] || 'jpg';
                            const safeName = productData.name ? 
                                productData.name.replace(/[^a-z0-9]/gi, '_').toLowerCase() : 
                                `product_${i + 1}`;
                            const filename = `${safeName}_${j + 1}.${extension}`;
                            
                            await downloadImage(imageUrl, path.join(imageDir, filename));
                            downloadedImages.push(filename);
                            console.log(`  📷 Downloaded: ${filename}`);
                        } catch (error) {
                            console.log(`  ❌ Failed to download image ${j + 1}: ${error.message}`);
                        }
                    }

                    products.push({
                        ...productData,
                        downloadedImages
                    });
                } else {
                    console.log(`⚠ No data found for ${productUrl}`);
                }

                // Delay between requests
                await page.waitForTimeout(2000);

            } catch (error) {
                console.log(`❌ Error scraping ${productUrl}: ${error.message}`);
            }
        }

        // Save results
        const outputFile = path.join(__dirname, 'aldo_products.json');
        fs.writeFileSync(outputFile, JSON.stringify(products, null, 2));
        console.log(`\n✅ Scraping completed! Saved ${products.length} products to ${outputFile}`);

    } catch (error) {
        console.error('❌ Scraping failed:', error);
        await page.screenshot({ path: 'error_screenshot.png', fullPage: true });
    } finally {
        await browser.close();
    }
}

function downloadImage(url, filepath) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(filepath);
        https.get(url, (response) => {
            response.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve();
            });
        }).on('error', (err) => {
            fs.unlink(filepath, () => {});
            reject(err);
        });
    });
}

// Run the scraper
scrapeAldo();