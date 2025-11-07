const fs = require('fs');
const path = require('path');

// Read JSONL file
const lines = fs.readFileSync('aldo_products_bedrock.jsonl', 'utf8').split('\n').filter(l => l.trim());
const products = lines.map((line, index) => JSON.parse(line));

// Helper to parse price
function parsePrice(priceStr) {
  const match = priceStr.match(/\$(\d+)/);
  return match ? parseInt(match[1]) : 0;
}

// Helper to determine image folder
function getImageFolder(category) {
  if (category === 'accessory') return '../scrapping/images_accessories/';
  if (category === 'bag') return '../scrapping/images_bags/';
  if (category === 'woman shoe') return '../scrapping_woman/images_woman/';
  if (category === 'man shoe') return '../scrapping/images_men/';
  return '../scrapping/';
}

// Helper to map category to our format
function mapCategory(category) {
  if (category === 'woman shoe') return 'womens';
  if (category === 'man shoe') return 'mens';
  return 'womens'; // default
}

// Helper to extract color from URL
function extractColorFromUrl(url, productName) {
  if (!url) return null;
  // Extract the last part of the URL path (e.g., "blyth-black" from "/products/blyth-black")
  const parts = url.split('/');
  const lastPart = parts[parts.length - 1].split('?')[0]; // Remove query params
  
  // Split by dash and capitalize each word
  const segments = lastPart.split('-');
  
  // Remove segments that match the product name (case-insensitive)
  const productNameLower = productName.toLowerCase().replace(/\s+/g, '-');
  let colorSegments = segments.filter(seg => 
    !productNameLower.includes(seg.toLowerCase())
  );
  
  // Remove purely numeric segments (product IDs)
  colorSegments = colorSegments.filter(seg => !/^\d+$/.test(seg));
  
  // If we have color segments, capitalize and join them
  if (colorSegments.length > 0) {
    const color = colorSegments
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    return color;
  }
  
  return null;
}

// Convert to products.ts format
const convertedProducts = products.map((p, index) => {
  // Use the first high-quality online image from ALDO
  const mainImage = p.images && p.images.length > 0 ? p.images[0] : '';
  
  // Extract color from URL
  const extractedColor = extractColorFromUrl(p.url, p.name);
  const productColor = extractedColor || 'Various';
  
  // Create unique product name with color variant
  const productName = extractedColor ? `${p.name} (${extractedColor})` : p.name;

  return {
    id: index + 1,
    name: productName,
    type: p.category === 'accessory' ? 'Accessory' : (p.category === 'bag' ? 'Bag' : 'Shoe'),
    price: parsePrice(p.price),
    category: mapCategory(p.category),
    subcategory: p.category,
    color: productColor,
    colors: [productColor],
    sizes: [],
    image: mainImage,
    url: p.url,
    description: p.description || '',
    features: []
  };
});

// Generate TypeScript file
const tsContent = `import type { Product } from '../types/product';

export const products: Product[] = ${JSON.stringify(convertedProducts, null, 2)};
`;

// Write to products.ts in auralos/src/data/
fs.writeFileSync('../auralos/src/data/products.ts', tsContent, 'utf8');

console.log(`✅ Converted ${convertedProducts.length} products to products.ts`);
console.log(`📁 Image paths use relative paths from src/data/`);
console.log(`🔗 Product URLs link to ALDO website`);

