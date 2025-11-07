import { loadAldoProducts, type SearchableProduct } from '../utils/productLoader';

export interface SearchResult {
  product: SearchableProduct;
  matchScore: number;
  reasoning: string;
  pros: string[];
  cons: string[];
}

export interface ImageAnalysisResult {
  description: string;
  suggestedSearchTerms: string[];
}

// Hardcoded image analysis based on common fashion items
export function analyzeImageDescription(fileName?: string): ImageAnalysisResult {
  const defaultResult = {
    description: "I can see you've uploaded an image of a fashion item. Let me help you find similar products!",
    suggestedSearchTerms: ['shoes', 'accessories', 'bags']
  };

  if (!fileName) return defaultResult;

  const name = fileName.toLowerCase();
  
  // Try to detect item type from filename
  if (name.includes('shoe') || name.includes('boot') || name.includes('sneaker') || name.includes('heel')) {
    return {
      description: "I can see you've uploaded an image of footwear. It looks like a stylish shoe that would pair well with many outfits!",
      suggestedSearchTerms: ['shoes', 'boots', 'heels', 'casual shoes', 'dress shoes']
    };
  }
  
  if (name.includes('bag') || name.includes('purse') || name.includes('clutch') || name.includes('tote')) {
    return {
      description: "I can see you've uploaded an image of a bag. It appears to be a versatile accessory that would complement various styles!",
      suggestedSearchTerms: ['bags', 'purses', 'accessories', 'handbags']
    };
  }
  
  if (name.includes('jewelry') || name.includes('earring') || name.includes('necklace') || name.includes('ring')) {
    return {
      description: "I can see you've uploaded an image of jewelry. It looks like a beautiful accessory piece!",
      suggestedSearchTerms: ['jewelry', 'accessories', 'earrings', 'necklaces']
    };
  }

  return defaultResult;
}

export function performHardcodedSearch(_query: string, _imageContext?: string, isRefined: boolean = false): SearchResult[] {
  const allProducts = loadAldoProducts();
  
  let finalProducts: SearchableProduct[];
  
  if (isRefined) {
    // Refined search returns: Thevoid, Zethan, Hawkinshigh
    const thevoid = allProducts.find(p => p.name.toLowerCase() === 'thevoid');
    const zethan = allProducts.find(p => p.name.toLowerCase() === 'zethan');
    const hawkinshigh = allProducts.find(p => p.name.toLowerCase() === 'hawkinshigh');
    
    finalProducts = [thevoid, zethan, hawkinshigh].filter(Boolean) as SearchableProduct[];
  } else {
    // Initial search returns: Aston, Brando, Roll4yourlife
    const hardcodedProducts: SearchableProduct[] = [];
    
    // Find Brando
    const brando = allProducts.find(p => p.name.toLowerCase() === 'brando');
    if (brando) hardcodedProducts.push(brando);
    
    // Find Roll4yourlife
    const roll4yourlife = allProducts.find(p => p.name.toLowerCase() === 'roll4yourlife');
    if (roll4yourlife) hardcodedProducts.push(roll4yourlife);
    
    // Since Aston doesn't exist in the JSONL, create a mock product with Aston images
    const astonMockProduct: SearchableProduct = {
      id: 'aston-mock',
      name: 'Aston',
      price: 'Unit price $180',
      description: 'Classic leather loafer with sophisticated styling and premium craftsmanship. Perfect for business meetings or casual elegance.',
      category: 'man shoe',
      url: 'https://www.aldoshoes.com/en-ca/products/aston-black',
      images: ['/images/aston_1.jpg'],
      downloadedImages: ['aston_1.jpg', 'aston_2.jpg', 'aston_3.jpg', 'aston_4.jpg', 'aston_5.jpg', 'aston_6.jpg'],
      localImages: ['/images/aston_1.jpg', '/images/aston_2.jpg', '/images/aston_3.jpg', '/images/aston_4.jpg', '/images/aston_5.jpg', '/images/aston_6.jpg']
    };
    
    // Add Aston as the first product
    finalProducts = [astonMockProduct, ...hardcodedProducts];
  }
  
  // Ensure we have exactly 3 products
  while (finalProducts.length < 3) {
    const fallbackProduct = allProducts.find(p => !finalProducts.some(fp => fp.id === p.id));
    if (fallbackProduct) {
      finalProducts.push(fallbackProduct);
    } else {
      break;
    }
  }
  
  // Generate specific pros/cons and reasoning for each hardcoded product
  return finalProducts.slice(0, 3).map((product, index) => {
    const reasoning = generateReasoning(product, _query, index);
    const { pros, cons } = getSpecificProsAndCons(product.name, index);
    
    return {
      product,
      matchScore: Math.max(0.95 - (index * 0.1), 0.75), // Decreasing match scores
      reasoning,
      pros,
      cons
    };
  });
}

function generateReasoning(product: SearchableProduct, _query: string, rank: number): string {
  switch (product.name.toLowerCase()) {
    case 'aston':
      return rank === 0 
        ? 'This classic leather loafer represents the perfect balance of sophistication and versatility, making it our top recommendation for discerning professionals'
        : 'The Aston offers timeless elegance with premium Italian leather construction that elevates any wardrobe';
    
    case 'brando':
      return rank === 0
        ? 'This espresso suede ankle boot combines modern style with exceptional comfort, perfect for the contemporary gentleman'
        : 'The Brando delivers understated luxury with its rich suede texture and lightweight design for effortless sophistication';
    
    case 'roll4yourlife':
      return rank === 0
        ? 'This distinctive loafer features unique red stitching details and innovative cupsole technology for unmatched comfort and style'
        : 'The Roll4yourlife stands out with its character-defining penny strap and lightweight construction that transitions seamlessly from office to evening';
    
    case 'thevoid':
      return rank === 0
        ? 'This breathable sneaker combines urban style with exceptional comfort, featuring airflow panels and a cushioned gum sole for all-day wear'
        : 'The Thevoid offers a fresh take on casual footwear with its clean white leather and breathable design perfect for active lifestyles';
    
    case 'zethan':
      return rank === 0
        ? 'This bold burgundy sneaker makes a statement with its high-gloss patent leather and textured mesh, perfect for those who dare to stand out'
        : 'The Zethan delivers eye-catching style with its unique material combination and sleek cupsole for confident city strolls';
    
    case 'hawkinshigh':
      return rank === 0
        ? 'This exclusive Stranger Things collaboration brings nostalgic varsity style with unique details like the removable Hawkins tag and tiger print sock liner'
        : 'The Hawkinshigh celebrates retro cool with its limited-edition design that appeals to fans and sneaker enthusiasts alike';
    
    default:
      return `This ${product.name} offers excellent quality and style that matches your preferences`;
  }
}



function getSpecificProsAndCons(productName: string, _index: number): { pros: string[], cons: string[] } {
  switch (productName.toLowerCase()) {
    case 'aston':
      return {
        pros: [
          'Premium Italian leather construction',
          'Timeless design that never goes out of style',
          'Exceptional comfort with cushioned insole',
          'Versatile enough for both business and casual wear'
        ],
        cons: [
          'Higher price point than competitors',
          'Requires regular leather conditioning'
        ]
      };
    
    case 'brando':
      return {
        pros: [
          'Rich espresso suede with luxurious texture',
          'Lightweight construction for all-day comfort',
          'Sleek ankle boot design perfect for modern style',
          'Durable leather outsole with excellent grip'
        ],
        cons: [
          'Suede material requires special care and protection',
          'Limited color options available'
        ]
      };
    
    case 'roll4yourlife':
      return {
        pros: [
          'Distinctive red stitching adds unique character',
          'Lightweight cupsole technology for superior comfort',
          'Sleek black leather that pairs with everything',
          'Penny strap detail elevates the classic loafer style'
        ],
        cons: [
          'May run slightly narrow for wider feet',
          'Leather sole can be slippery on wet surfaces'
        ]
      };
    
    case 'thevoid':
      return {
        pros: [
          'Breathable airflow-driven side panels keep feet cool',
          'Gum cupsole provides excellent cushioning',
          'Clean white leather design with urban edge',
          'Lightweight construction perfect for all-day wear'
        ],
        cons: [
          'White leather shows dirt and scuffs easily',
          'Casual style may not suit formal occasions'
        ]
      };
    
    case 'zethan':
      return {
        pros: [
          'Eye-catching burgundy patent leather finish',
          'Textured mesh panels add visual interest',
          'Sleek rubber cupsole for city comfort',
          'Bold statement piece that stands out'
        ],
        cons: [
          'Patent leather can crease with heavy wear',
          'Bold color may limit outfit versatility'
        ]
      };
    
    case 'hawkinshigh':
      return {
        pros: [
          'Exclusive Stranger Things x ALDO collaboration',
          'Retro varsity design with nostalgic appeal',
          'Removable Hawkins tag for customization',
          'Unique tiger print sock liner detail'
        ],
        cons: [
          'Limited edition may have restricted availability',
          'Themed design might not appeal to everyone'
        ]
      };
    
    default:
      // Fallback for any other products
      return {
        pros: ['High-quality materials', 'Stylish design', 'Comfortable fit'],
        cons: ['Limited availability', 'Premium pricing']
      };
  }
}

export function generateConversationResponse(_userMessage: string, conversationHistory: string[]): string {
  const responses = [
    "That's helpful! Tell me more about the style you prefer - are you looking for something casual or more formal?",
    "Great! What's your budget range? And do you have any color preferences?",
    "Perfect! Are you shopping for a special occasion or everyday wear?",
    "Excellent! Do you prefer classic styles or are you open to trendy, fashion-forward pieces?",
    "That gives me a good idea! What size range should I focus on?",
    "I have enough information to show you the perfect matches! Let me find the best options for you."
  ];
  
  // Return different responses based on conversation length
  const responseIndex = Math.min(conversationHistory.length, responses.length - 1);
  return responses[responseIndex];
}