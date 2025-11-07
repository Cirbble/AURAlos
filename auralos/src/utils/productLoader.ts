import aldoProductsData from '../assets/aldo_products_bedrock.jsonl?raw';

export interface AldoProduct {
  name: string;
  price: string;
  description: string;
  category: string;
  url: string;
  images: string[];
  downloadedImages: string[];
}

export interface SearchableProduct extends AldoProduct {
  id: string;
  localImages: string[];
}

let cachedProducts: SearchableProduct[] | null = null;

export function loadAldoProducts(): SearchableProduct[] {
  if (cachedProducts) {
    return cachedProducts;
  }

  try {
    // Parse JSONL data (each line is a separate JSON object)
    const lines = aldoProductsData.trim().split('\n');
    const products: SearchableProduct[] = lines.map((line, index) => {
      const product: AldoProduct = JSON.parse(line);
      
      // Generate local image paths based on downloadedImages
      // For Vite, we'll use the public folder approach
      const localImages = product.downloadedImages.map(imageName => 
        `/images/${imageName}`
      );

      return {
        ...product,
        id: `aldo-${index}`,
        localImages
      };
    });

    cachedProducts = products;
    return products;
  } catch (error) {
    console.error('Error loading ALDO products:', error);
    return [];
  }
}

export function searchProducts(query: string, limit: number = 3): SearchableProduct[] {
  const products = loadAldoProducts();
  
  if (!query.trim()) {
    return products.slice(0, limit);
  }

  const searchTerms = query.toLowerCase().split(' ');
  
  // Score products based on relevance
  const scoredProducts = products.map(product => {
    let score = 0;
    const searchableText = `${product.name} ${product.description} ${product.category}`.toLowerCase();
    
    // Exact name match gets highest score
    if (product.name.toLowerCase().includes(query.toLowerCase())) {
      score += 100;
    }
    
    // Category match
    if (product.category.toLowerCase().includes(query.toLowerCase())) {
      score += 50;
    }
    
    // Description matches
    searchTerms.forEach(term => {
      if (searchableText.includes(term)) {
        score += 10;
      }
    });
    
    // Boost score for certain keywords
    const keywords = {
      'shoe': ['shoe', 'boot', 'sneaker', 'heel', 'loafer'],
      'bag': ['bag', 'purse', 'clutch', 'tote', 'satchel'],
      'accessory': ['accessory', 'jewelry', 'earring', 'necklace', 'ring', 'pin'],
      'black': ['black'],
      'white': ['white'],
      'brown': ['brown'],
      'casual': ['casual', 'everyday', 'comfort'],
      'formal': ['formal', 'dress', 'elegant'],
      'sport': ['sport', 'athletic', 'gym', 'pilates']
    };
    
    Object.entries(keywords).forEach(([category, terms]) => {
      if (searchTerms.some(term => terms.includes(term))) {
        if (searchableText.includes(category)) {
          score += 25;
        }
      }
    });
    
    return { product, score };
  });
  
  // Sort by score and return top results
  return scoredProducts
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(item => item.product);
}

export function getRandomProducts(count: number = 3): SearchableProduct[] {
  const products = loadAldoProducts();
  const shuffled = [...products].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}