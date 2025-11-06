const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const https = require('https');

async function scrapeAldoFromLinks() {
    // Read product links from file
    const linksFile = path.join(__dirname, 'scrapping_links.json');
    
    if (!fs.existsSync(linksFile)) {
        console.log('❌ scrapping_links.json file not found. Please run the main scraper first to generate links.');
        return;
    }

    let productLinks;
    try {
        const linksData = fs.readFileSync(linksFile, 'utf8');
        productLinks = JSON.parse(linksData);
    } catch (error) {
        console.log('❌ Error reading scrapping_links.json:', error.message);
        return;
    }

    console.log(`📄 Loaded ${productLinks.length} product links from scrapping_links.json`);

    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: { width: 1920, height: 1080 },
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    try {
        // Create images directory
        const imageDir = path.join(__dirname, 'images_from_links');
        if (!fs.existsSync(imageDir)) {
            fs.mkdirSync(imageDir, { recursive: true });
        }

        const products = [];

        for (let i = 0; i < productLinks.length; i++) {
            const productUrl = productLinks[i];
            const progress = ((i + 1) / productLinks.length * 100).toFixed(1);
            console.log(`\n🔍 Scraping product ${i + 1}/${productLinks.length} (${progress}%)`);
            console.log(`URL: ${productUrl}`);

            try {
                await page.goto(productUrl, { waitUntil: 'networkidle2', timeout: 30000 });
                await page.waitForTimeout(3000);

                // Handle cookies if they appear
                try {
                    const cookieButton = await page.$('#onetrust-accept-btn-handler');
                    if (cookieButton) {
                        await cookieButton.click();
                        await page.waitForTimeout(2000);
                    }
                } catch (e) {
                    // Cookie banner not found or already handled
                }

                // Try to expand any accordion sections that might contain product details
                try {
                    // Look for accordion buttons or expandable sections
                    const accordionButtons = await page.$$('button[aria-expanded="false"], .accordion-button, .expandable-section');
                    for (const button of accordionButtons) {
                        try {
                            await button.click();
                            await page.waitForTimeout(500);
                        } catch (e) {
                            // Button might not be clickable
                        }
                    }
                } catch (e) {
                    // No accordion buttons found
                }

                // Wait a bit more for any dynamic content to load
                await page.waitForTimeout(2000);

                // Debug: Save page content to see what's actually there
                const pageContent = await page.content();
                console.log(`📄 Page content length: ${pageContent.length} characters`);
                
                // Debug: Check what elements are actually on the page
                const elementCounts = await page.evaluate(() => {
                    return {
                        totalElements: document.querySelectorAll('*').length,
                        divs: document.querySelectorAll('div').length,
                        paragraphs: document.querySelectorAll('p').length,
                        spans: document.querySelectorAll('span').length,
                        accordions: document.querySelectorAll('[class*="accordion"]').length,
                        details: document.querySelectorAll('[class*="detail"]').length,
                        shared: document.querySelectorAll('[class*="shared"]').length
                    };
                });
                console.log(`🔍 Element counts:`, elementCounts);

                const productData = await page.evaluate(() => {
                    // Clean function to get text content without extra whitespace
                    function cleanText(element) {
                        if (!element) return null;
                        return element.textContent?.trim().replace(/\s+/g, ' ') || null;
                    }

                    // Get product name from h1 or title
                    let name = null;
                    const h1 = document.querySelector('h1');
                    if (h1) {
                        name = cleanText(h1);
                    }
                    
                    // If name is too long or contains weird content, try to extract just the product name
                    if (name && name.length > 100) {
                        const titleMatch = document.title.match(/^([^|]+)/);
                        if (titleMatch) {
                            name = titleMatch[1].trim();
                        }
                    }

                    // Get price - look for elements containing $ and numbers
                    let price = null;
                    const priceElements = Array.from(document.querySelectorAll('*'))
                        .filter(el => {
                            const text = el.textContent;
                            return text && 
                                   text.includes('$') && 
                                   text.match(/\$\d+/) &&
                                   text.length < 50 && // Avoid long text blocks
                                   !text.toLowerCase().includes('shipping') &&
                                   !text.toLowerCase().includes('free');
                        })
                        .sort((a, b) => a.textContent.length - b.textContent.length); // Prefer shorter text

                    if (priceElements.length > 0) {
                        const priceText = cleanText(priceElements[0]);
                        const priceMatch = priceText?.match(/\$[\d,]+(?:\.\d{2})?/);
                        if (priceMatch) {
                            price = priceMatch[0];
                        }
                    }

                    // Get product images
                    const images = Array.from(document.querySelectorAll('img'))
                        .map(img => img.src)
                        .filter(src => src && 
                                      src.startsWith('http') && 
                                      !src.includes('logo') && 
                                      !src.includes('icon') &&
                                      (src.includes('aldo') || src.includes('product') || src.includes('cdn')))
                        .slice(0, 6); // Limit to 6 images

                    // Try to find color options
                    const colorOptions = [];
                    
                    // Look for color swatches or variant options
                    const colorElements = Array.from(document.querySelectorAll('*'))
                        .filter(el => {
                            const className = el.className;
                            const dataAttrs = el.dataset;
                            return (typeof className === 'string' && 
                                   (className.includes('color') || 
                                    className.includes('swatch') || 
                                    className.includes('variant'))) ||
                                   dataAttrs.color ||
                                   dataAttrs.variant;
                        });

                    for (const el of colorElements) {
                        const colorName = el.dataset.color || 
                                         el.getAttribute('title') || 
                                         el.getAttribute('alt') ||
                                         cleanText(el);
                        
                        if (colorName && 
                            colorName.length > 0 && 
                            colorName.length < 30 && 
                            !colorName.includes('$') &&
                            !colorOptions.includes(colorName)) {
                            colorOptions.push(colorName);
                        }
                    }

                    // Get product description and details
                    let description = null;
                    let productDetails = null;
                    let debugInfo = {
                        accordionFound: false,
                        infoListsCount: 0,
                        sectionsFound: [],
                        fallbackAttempts: []
                    };
                    
                    // Debug: Log all elements with "accordion" in class name
                    const allAccordionElements = Array.from(document.querySelectorAll('[class*="accordion"]'));
                    debugInfo.allAccordionClasses = allAccordionElements.map(el => el.className);
                    
                    // Debug: Log all elements with "shared" in class name
                    const allSharedElements = Array.from(document.querySelectorAll('[class*="shared"]'));
                    debugInfo.allSharedClasses = allSharedElements.map(el => el.className);
                    
                    // Debug: Look for any elements that might contain product details
                    const productDetailElements = Array.from(document.querySelectorAll('[class*="product"], [class*="detail"], [id*="product"], [id*="detail"]'));
                    debugInfo.productDetailClasses = productDetailElements.map(el => ({
                        tag: el.tagName.toLowerCase(),
                        className: el.className,
                        id: el.id,
                        hasText: el.textContent && el.textContent.trim().length > 20
                    })).slice(0, 20);
                    
                    // First, try to get structured product details from accordion
                    const accordionElement = document.querySelector('.shared-accordion__description');
                    if (accordionElement) {
                        debugInfo.accordionFound = true;
                        const materials = [];
                        const features = [];
                        
                        // Use standard approach to find materials and features
                        const infoLists = accordionElement.querySelectorAll('.product-details-accordion__info-list');
                        debugInfo.infoListsCount = infoLists.length;
                        
                        infoLists.forEach(list => {
                            const title = list.querySelector('.product-details-accordion__info-list-title');
                            const items = list.querySelectorAll('.product-details-accordion__info-list-items li');
                            
                            if (title && items.length > 0) {
                                const titleText = cleanText(title).toLowerCase();
                                const itemTexts = Array.from(items).map(item => cleanText(item)).filter(Boolean);
                                
                                debugInfo.sectionsFound.push({
                                    title: titleText,
                                    itemCount: itemTexts.length
                                });
                                
                                if (titleText.includes('material')) {
                                    materials.push(...itemTexts);
                                } else if (titleText.includes('feature')) {
                                    features.push(...itemTexts);
                                }
                            }
                        });
                        
                        // Build structured description
                        if (materials.length > 0 || features.length > 0) {
                            let structuredDesc = '';
                            if (materials.length > 0) {
                                structuredDesc += 'Materials: ' + materials.join(', ') + '. ';
                            }
                            if (features.length > 0) {
                                structuredDesc += 'Features: ' + features.join(', ') + '.';
                            }
                            productDetails = structuredDesc.trim();
                        }

                        // Try to get product description specifically from product details accordion
                        // Look for description within the same accordion structure
                        const descriptionSections = accordionElement.querySelectorAll('.product-details-accordion__info-list');
                        descriptionSections.forEach(section => {
                            const title = section.querySelector('.product-details-accordion__info-list-title');
                            if (title) {
                                const titleText = cleanText(title).toLowerCase();
                                // Look for description, details, or product info sections
                                if (titleText.includes('description') || 
                                    titleText.includes('details') || 
                                    titleText.includes('product info') ||
                                    titleText.includes('about')) {
                                    
                                    const content = section.querySelector('.product-details-accordion__info-list-items');
                                    if (content) {
                                        const text = cleanText(content);
                                        if (text && text.length > 20 && text.length < 1000 && !description) {
                                            description = text;
                                        }
                                    }
                                }
                            }
                        });
                    }
                    
                    // If no description found in accordion, try broader selectors
                    if (!description) {
                        const broadDescriptionSelectors = [
                            '.product-description',
                            '.product-details',
                            '.description',
                            '[data-testid="product-description"]',
                            '.product-info .description',
                            '.product-content p',
                            '.pdp-description',
                            '.product-summary',
                            '.product-detail-description',
                            '.product-details .description',
                            '.product-info .product-description',
                            '.pdp-product-description'
                        ];
                        
                        for (const selector of broadDescriptionSelectors) {
                            const element = document.querySelector(selector);
                            if (element) {
                                const text = cleanText(element);
                                debugInfo.fallbackAttempts.push({
                                    selector: selector,
                                    found: !!text,
                                    length: text ? text.length : 0
                                });
                                
                                if (text && text.length > 20 && text.length < 2000) {
                                    description = text;
                                    break;
                                }
                            } else {
                                debugInfo.fallbackAttempts.push({
                                    selector: selector,
                                    found: false,
                                    length: 0
                                });
                            }
                        }
                    }
                    
                    // If still no description, try to find any paragraph with substantial content
                    if (!description) {
                        const paragraphs = Array.from(document.querySelectorAll('p'))
                            .map(p => cleanText(p))
                            .filter(text => text && 
                                          text.length > 50 && 
                                          text.length < 2000 &&
                                          !text.includes('$') &&
                                          !text.toLowerCase().includes('shipping') &&
                                          !text.toLowerCase().includes('return') &&
                                          !text.toLowerCase().includes('size guide') &&
                                          !text.toLowerCase().includes('size conversion') &&
                                          !text.toLowerCase().includes('general guideline') &&
                                          !text.toLowerCase().includes('accurate fit') &&
                                          !text.toLowerCase().includes('fit guide') &&
                                          !text.toLowerCase().includes('sizing chart') &&
                                          !text.toLowerCase().includes('measurement') &&
                                          !text.toLowerCase().includes('regular rings are designed') &&
                                          !text.toLowerCase().includes('midi rings are') &&
                                          !text.toLowerCase().includes('worn at the base') &&
                                          !text.toLowerCase().includes('ring sizing') &&
                                          !text.toLowerCase().includes('jewelry sizing') &&
                                          !text.toLowerCase().includes('newsletter') &&
                                          !text.toLowerCase().includes('cookie') &&
                                          !text.toLowerCase().includes('accept') &&
                                          !text.toLowerCase().includes('privacy') &&
                                          !text.toLowerCase().includes('terms') &&
                                          !text.toLowerCase().includes('policy') &&
                                          !text.toLowerCase().includes('subscribe') &&
                                          !text.toLowerCase().includes('email') &&
                                          !text.toLowerCase().includes('sign up') &&
                                          !text.toLowerCase().includes('account') &&
                                          !text.toLowerCase().includes('login') &&
                                          !text.toLowerCase().includes('register') &&
                                          // French content filtering
                                          !text.toLowerCase().includes('ces témoins sont nécessaires') &&
                                          !text.toLowerCase().includes('témoins sont nécessaires') &&
                                          !text.toLowerCase().includes('fonctionnement du site web') &&
                                          !text.toLowerCase().includes('supportent ses performances') &&
                                          !text.toLowerCase().includes('nous utilisons des témoins') &&
                                          !text.toLowerCase().includes('accepter les témoins') &&
                                          !text.toLowerCase().includes('politique de confidentialité') &&
                                          !text.toLowerCase().includes('conditions d\'utilisation') &&
                                          !text.toLowerCase().includes('en continuant') &&
                                          !text.toLowerCase().includes('ce site web') &&
                                          !text.toLowerCase().includes('votre navigateur'));
                        
                        if (paragraphs.length > 0) {
                            // Take the longest paragraph as it's likely the description
                            description = paragraphs.reduce((longest, current) => 
                                current.length > longest.length ? current : longest
                            );
                        }
                    }

                    // Final validation - reject descriptions that are clearly not product descriptions
                    if (description) {
                        const descLower = description.toLowerCase();
                        if (descLower.includes('when you accept') ||
                            descLower.includes('we use cookies') ||
                            descLower.includes('by continuing') ||
                            descLower.includes('this website') ||
                            descLower.includes('your browser') ||
                            descLower.includes('click here') ||
                            descLower.includes('learn more') ||
                            descLower.includes('find out more') ||
                            descLower.includes('size conversion is a general guideline') ||
                            descLower.includes('general guideline and may not be') ||
                            descLower.includes('for a more accurate fit') ||
                            descLower.includes('sizing information') ||
                            descLower.includes('fit may vary') ||
                            descLower.includes('our regular rings are designed') ||
                            descLower.includes('midi rings are smalle') ||
                            descLower.includes('worn at the base of your fingers') ||
                            descLower.includes('whereas midi rings') ||
                            descLower.includes('limited-edition stranger things') ||
                            descLower.includes('pillow walk') ||
                            descLower.includes('dual density foam') ||
                            descLower.includes('you\'ll have to feel it') ||
                            descLower.includes('feel it to believe it') ||
                            descLower.includes('our limited-edition') ||
                            // French content filtering
                            descLower.includes('ces témoins sont nécessaires') ||
                            descLower.includes('témoins sont nécessaires') ||
                            descLower.includes('fonctionnement du site web') ||
                            descLower.includes('supportent ses performances') ||
                            descLower.includes('ils ne pe') ||
                            descLower.includes('nous utilisons des témoins') ||
                            descLower.includes('accepter les témoins') ||
                            descLower.includes('politique de confidentialité') ||
                            descLower.includes('conditions d\'utilisation') ||
                            descLower.includes('en continuant') ||
                            descLower.includes('ce site web') ||
                            descLower.includes('votre navigateur') ||
                            descLower.startsWith('accept') ||
                            descLower.startsWith('by using') ||
                            descLower.startsWith('this site') ||
                            descLower.startsWith('the size conversion') ||
                            descLower.startsWith('size conversion') ||
                            descLower.startsWith('our regular rings') ||
                            descLower.startsWith('our limited-edition') ||
                            descLower.startsWith('ces témoins') ||
                            descLower.startsWith('nous utilisons')) {
                            description = null;
                        }
                    }

                    // Combine descriptions
                    let finalDescription = null;
                    if (productDetails && description) {
                        finalDescription = description + ' | ' + productDetails;
                    } else if (productDetails) {
                        finalDescription = productDetails;
                    } else if (description) {
                        finalDescription = description;
                    }

                    // Try different accordion selectors since we found 67 accordion elements
                    if (!description && !productDetails) {
                        // Try broader accordion selectors
                        const alternativeAccordionSelectors = [
                            '[class*="accordion"]',
                            '[class*="collapsible"]',
                            '[class*="expandable"]',
                            '[class*="toggle"]',
                            'details',
                            '[role="tabpanel"]'
                        ];
                        
                        for (const selector of alternativeAccordionSelectors) {
                            const elements = document.querySelectorAll(selector);
                            for (const element of elements) {
                                const text = cleanText(element);
                                if (text && text.length > 50 && text.length < 1000) {
                                    // Check if this looks like product content
                                    const textLower = text.toLowerCase();
                                    if ((textLower.includes('material') || 
                                         textLower.includes('feature') || 
                                         textLower.includes('leather') || 
                                         textLower.includes('sole') || 
                                         textLower.includes('lace') || 
                                         textLower.includes('boot') || 
                                         textLower.includes('shoe')) &&
                                        !textLower.includes('cookie') &&
                                        !textLower.includes('témoins') &&
                                        !textLower.includes('javascript') &&
                                        !textLower.includes('google_tag') &&
                                        !textLower.includes('ttq.identify') &&
                                        !textLower.includes('function') &&
                                        !textLower.includes('var ') &&
                                        !textLower.includes('return ')) {
                                        description = text;
                                        debugInfo.foundViaAlternativeAccordion = selector;
                                        break;
                                    }
                                }
                            }
                            if (description) break;
                        }
                    }
                    
                    // If still no description, try to find ANY substantial text content (but filter out JS)
                    if (!finalDescription) {
                        const allTextElements = Array.from(document.querySelectorAll('p, div, span, li'))
                            .map(el => ({
                                tag: el.tagName.toLowerCase(),
                                className: el.className,
                                text: cleanText(el),
                                length: cleanText(el) ? cleanText(el).length : 0
                            }))
                            .filter(item => item.text && 
                                          item.length > 30 && 
                                          item.length < 500 &&
                                          !item.text.includes('google_tag') &&
                                          !item.text.includes('ttq.identify') &&
                                          !item.text.includes('javascript') &&
                                          !item.text.includes('function(') &&
                                          !item.text.includes('var ') &&
                                          !item.text.includes('return ') &&
                                          !item.text.includes('&&') &&
                                          !item.text.includes('||') &&
                                          !item.text.includes('undefined'))
                            .sort((a, b) => b.length - a.length);
                        
                        debugInfo.allTextElements = allTextElements.slice(0, 10); // Top 10 longest texts
                        
                        // Try to find product-related text
                        for (const textEl of allTextElements) {
                            const text = textEl.text.toLowerCase();
                            if (!text.includes('cookie') && 
                                !text.includes('témoins') && 
                                !text.includes('shipping') && 
                                !text.includes('return') &&
                                !text.includes('size guide') &&
                                !text.includes('newsletter') &&
                                !text.includes('account') &&
                                !text.includes('login') &&
                                !text.includes('privacy') &&
                                !text.includes('terms')) {
                                finalDescription = textEl.text;
                                debugInfo.foundViaTextSearch = true;
                                break;
                            }
                        }
                    }

                    return {
                        name: name,
                        price: price,
                        description: finalDescription,
                        productDetails: productDetails,
                        images: images,
                        colorOptions: colorOptions,
                        url: window.location.href,
                        debugInfo: debugInfo
                    };
                });

                // Clean up the data
                if (productData.name && productData.name.length > 100) {
                    // Try to extract just the product name from long titles
                    const words = productData.name.split(' ');
                    productData.name = words.slice(0, 3).join(' '); // Take first 3 words
                }

                console.log(`Product: ${productData.name || 'Unknown'}`);
                console.log(`Price: ${productData.price || 'No price found'}`);
                console.log(`Description: ${productData.description ? `${productData.description.substring(0, 100)}...` : 'No description found'}`);
                console.log(`Images: ${productData.images.length}`);
                console.log(`Colors: ${productData.colorOptions.length}`);
                
                // Debug information
                if (!productData.description) {
                    console.log(`🔍 Debug Info:`);
                    console.log(`   Accordion found: ${productData.debugInfo.accordionFound}`);
                    console.log(`   Info lists count: ${productData.debugInfo.infoListsCount}`);
                    console.log(`   Sections found: ${JSON.stringify(productData.debugInfo.sectionsFound)}`);
                    console.log(`   Fallback attempts: ${productData.debugInfo.fallbackAttempts.length}`);
                    console.log(`   All accordion classes: ${JSON.stringify(productData.debugInfo.allAccordionClasses)}`);
                    console.log(`   All shared classes: ${JSON.stringify(productData.debugInfo.allSharedClasses)}`);
                    console.log(`   Found via text search: ${productData.debugInfo.foundViaTextSearch || false}`);
                    console.log(`   Found via alternative accordion: ${productData.debugInfo.foundViaAlternativeAccordion || 'No'}`);
                    
                    // Show product detail elements found
                    if (productData.debugInfo.productDetailClasses) {
                        console.log(`   Product detail elements found:`);
                        productData.debugInfo.productDetailClasses.slice(0, 5).forEach((el, idx) => {
                            console.log(`     ${idx + 1}. ${el.tag}#${el.id}.${el.className} (hasText: ${el.hasText})`);
                        });
                    }
                    
                    // Show first few fallback attempts
                    productData.debugInfo.fallbackAttempts.slice(0, 5).forEach(attempt => {
                        console.log(`     ${attempt.selector}: ${attempt.found ? `Found (${attempt.length} chars)` : 'Not found'}`);
                    });
                    
                    // Show top text elements found
                    if (productData.debugInfo.allTextElements) {
                        console.log(`   Top text elements found:`);
                        productData.debugInfo.allTextElements.slice(0, 3).forEach((el, idx) => {
                            console.log(`     ${idx + 1}. ${el.tag}.${el.className}: "${el.text.substring(0, 60)}..." (${el.length} chars)`);
                        });
                    }
                }

                if (productData.name || productData.price) {
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
                        name: productData.name,
                        price: productData.price,
                        description: productData.description,
                        productDetails: productData.productDetails,
                        url: productData.url,
                        images: productData.images,
                        colorOptions: productData.colorOptions,
                        downloadedImages: downloadedImages
                    });

                    console.log(`✅ Successfully scraped: ${productData.name}`);
                } else {
                    console.log(`⚠ No valid data found for this product`);
                }

                // Save progress every 10 products
                if ((i + 1) % 10 === 0) {
                    const progressFile = path.join(__dirname, 'aldo_products_from_links_progress.json');
                    fs.writeFileSync(progressFile, JSON.stringify(products, null, 2));
                    console.log(`💾 Progress saved: ${products.length} products`);
                }

                // Delay between requests
                await page.waitForTimeout(2000);

            } catch (error) {
                console.log(`❌ Error scraping ${productUrl}: ${error.message}`);
            }
        }

        // Save results
        const outputFile = path.join(__dirname, 'aldo_products_from_links.json');
        fs.writeFileSync(outputFile, JSON.stringify(products, null, 2));
        console.log(`\n🎉 Scraping completed! Saved ${products.length} products to ${outputFile}`);
        console.log(`📁 Images saved to: ${imageDir}`);

        // Print summary
        console.log('\n📊 Final Summary:');
        console.log(`✅ Total products scraped: ${products.length}`);
        console.log(`📷 Total images downloaded: ${products.reduce((sum, p) => sum + p.downloadedImages.length, 0)}`);
        console.log(`🎨 Products with color options: ${products.filter(p => p.colorOptions.length > 0).length}`);
        console.log(`📝 Products with descriptions: ${products.filter(p => p.description).length}`);
        
        // Show first few products as examples
        console.log('\n📝 Sample products:');
        products.slice(0, 5).forEach((product, index) => {
            console.log(`${index + 1}. ${product.name} - ${product.price}`);
            console.log(`   📷 ${product.downloadedImages.length} images, 🎨 ${product.colorOptions.length} colors`);
            if (product.description) {
                console.log(`   📝 ${product.description.substring(0, 80)}...`);
            }
        });
        
        if (products.length > 5) {
            console.log(`... and ${products.length - 5} more products`);
        }

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
scrapeAldoFromLinks();