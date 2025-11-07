const fs = require('fs');
const path = require('path');

// Read all scraped files
const accessories = JSON.parse(fs.readFileSync(path.join(__dirname, 'aldo_accessories_progress.json'), 'utf8'));
const bags = JSON.parse(fs.readFileSync(path.join(__dirname, 'aldo_bags_products.json'), 'utf8'));
const women = JSON.parse(fs.readFileSync(path.join(__dirname, 'aldo_women_products.json'), 'utf8'));
const men = JSON.parse(fs.readFileSync(path.join(__dirname, 'aldo_mens_products.json'), 'utf8'));

console.log('Loaded products:');
console.log(`  Accessories: ${accessories.length}`);
console.log(`  Bags: ${bags.length}`);
console.log(`  Women: ${women.length}`);
console.log(`  Men: ${men.length}`);

// Function to check if item has valid description
function hasValidDescription(item) {
    return item.description && 
           item.description.trim().length > 0 && 
           item.description !== 'label' &&
           item.description !== 'No description';
}

// Process each category
function processCategory(items, category) {
    return items
        .filter(item => hasValidDescription(item))
        .map(item => ({
            name: item.name,
            price: item.price,
            description: item.description,
            category: category,
            url: item.url,
            images: item.images,
            downloadedImages: item.downloadedImages
        }));
}

// Process all categories
const processedAccessories = processCategory(accessories, 'accessory');
const processedBags = processCategory(bags, 'bag');
const processedWomen = processCategory(women, 'woman shoe');
const processedMen = processCategory(men, 'man shoe');

console.log('\nFiltered products (with valid descriptions):');
console.log(`  Accessories: ${processedAccessories.length} (removed ${accessories.length - processedAccessories.length})`);
console.log(`  Bags: ${processedBags.length} (removed ${bags.length - processedBags.length})`);
console.log(`  Women: ${processedWomen.length} (removed ${women.length - processedWomen.length})`);
console.log(`  Men: ${processedMen.length} (removed ${men.length - processedMen.length})`);

// Combine all
const allProducts = [
    ...processedAccessories,
    ...processedBags,
    ...processedWomen,
    ...processedMen
];

console.log(`\nTotal products: ${allProducts.length}`);

// Write as JSONL (one JSON object per line)
const jsonlContent = allProducts.map(item => JSON.stringify(item)).join('\n');
fs.writeFileSync(path.join(__dirname, 'aldo_products_bedrock.jsonl'), jsonlContent);

console.log('\n✅ Created: aldo_products_bedrock.jsonl');
console.log(`   Total products: ${allProducts.length}`);

// Also save as regular JSON for reference
fs.writeFileSync(path.join(__dirname, 'aldo_products_combined.json'), JSON.stringify(allProducts, null, 2));
console.log('✅ Created: aldo_products_combined.json (for reference)');

// Print summary
console.log('\nBreakdown by category:');
const breakdown = {
    'accessory': processedAccessories.length,
    'bag': processedBags.length,
    'woman shoe': processedWomen.length,
    'man shoe': processedMen.length
};

Object.entries(breakdown).forEach(([category, count]) => {
    console.log(`  ${category}: ${count}`);
});

// Show sample
console.log('\nSample product from JSONL:');
console.log(JSON.stringify(allProducts[0], null, 2));

