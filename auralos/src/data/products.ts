import type { Product } from '../types/product';

export const products: Product[] = [
  // Women's Best Sellers
  {
    id: 1,
    name: "Kaydienh",
    type: "Knee-high boot, Block heel",
    price: 182,
    category: "womens",
    subcategory: "boots",
    color: "Dark Brown",
    colors: ["Dark Brown", "Black"],
    sizes: ["6", "6.5", "7", "7.5", "8", "8.5", "9", "9.5", "10"],
    image: "https://via.placeholder.com/400x500/8B4513/FFFFFF?text=Kaydienh+Boot",
    badge: "Pillow Walk",
    promo: "BOGO 40% off at cart",
    description: "Elevate your style with these elegant knee-high boots featuring a comfortable block heel.",
    features: [
      "Premium leather upper",
      "Pillow Walk comfort technology",
      "Block heel for stability",
      "Side zipper closure",
      "Non-slip rubber outsole"
    ]
  },
  {
    id: 2,
    name: "Ggloriaa",
    type: "Satchel bag",
    price: 75,
    category: "womens",
    subcategory: "bags",
    color: "Brown",
    colors: ["Brown", "Black", "Tan"],
    sizes: ["One Size"],
    image: "https://via.placeholder.com/400x500/A0522D/FFFFFF?text=Ggloriaa+Bag",
    promo: "BOGO 40% off at cart",
    description: "A versatile satchel bag perfect for everyday use.",
    features: [
      "Faux leather construction",
      "Multiple interior pockets",
      "Adjustable shoulder strap",
      "Top handle option",
      "Secure magnetic closure"
    ]
  },
  {
    id: 3,
    name: "Tywyn",
    type: "Ankle boot, Block heel",
    price: 182,
    category: "womens",
    subcategory: "boots",
    color: "Black",
    colors: ["Black", "Brown"],
    sizes: ["5.5", "6", "6.5", "7", "7.5", "8", "8.5", "9", "9.5", "10"],
    image: "https://via.placeholder.com/400x500/000000/FFFFFF?text=Tywyn+Boot",
    badge: "Pillow Walk",
    promo: "BOGO 40% off at cart",
    description: "Classic ankle boots with modern comfort features.",
    features: [
      "Leather upper",
      "Pillow Walk insole",
      "2.5 inch block heel",
      "Inside zip closure",
      "Cushioned footbed"
    ]
  },
  {
    id: 4,
    name: "Surgoine",
    type: "Satchel bag",
    price: 78,
    category: "womens",
    subcategory: "bags",
    color: "Black",
    colors: ["Black", "Navy", "Burgundy"],
    sizes: ["One Size"],
    image: "https://via.placeholder.com/400x500/1C1C1C/FFFFFF?text=Surgoine+Bag",
    promo: "BOGO 40% off at cart",
    description: "Sophisticated satchel with structured silhouette.",
    features: [
      "Structured design",
      "Premium vegan leather",
      "Multiple compartments",
      "Detachable shoulder strap",
      "Gold-tone hardware"
    ]
  },
  {
    id: 5,
    name: "Lededanten",
    type: "Loafer, Block heel",
    price: 122,
    category: "womens",
    subcategory: "heels",
    color: "Medium Brown",
    colors: ["Medium Brown", "Black", "Burgundy"],
    sizes: ["6", "6.5", "7", "7.5", "8", "8.5", "9", "9.5", "10"],
    image: "https://via.placeholder.com/400x500/8B7355/FFFFFF?text=Lededanten+Loafer",
    badge: "Pillow Walk",
    promo: "BOGO 40% off at cart",
    description: "Contemporary loafers with a sophisticated heel.",
    features: [
      "Premium suede upper",
      "Pillow Walk technology",
      "1.5 inch block heel",
      "Slip-on design",
      "Cushioned insole"
    ]
  },
  {
    id: 6,
    name: "Uliana",
    type: "Slingback heel, Block heel",
    price: 122,
    category: "womens",
    subcategory: "heels",
    color: "Dark Brown",
    colors: ["Dark Brown", "Black", "Nude"],
    sizes: ["5.5", "6", "6.5", "7", "7.5", "8", "8.5", "9", "9.5", "10"],
    image: "https://via.placeholder.com/400x500/654321/FFFFFF?text=Uliana+Heel",
    badge: "Pillow Walk",
    promo: "BOGO 40% off at cart",
    description: "Elegant slingback heels for any occasion.",
    features: [
      "Leather upper",
      "Pillow Walk comfort",
      "2 inch block heel",
      "Adjustable slingback strap",
      "Pointed toe design"
    ]
  },
  {
    id: 7,
    name: "Noemia",
    type: "Ankle boot, Block heel",
    price: 182,
    category: "womens",
    subcategory: "boots",
    color: "Black",
    colors: ["Black", "Dark Brown"],
    sizes: ["6", "6.5", "7", "7.5", "8", "8.5", "9", "9.5", "10"],
    image: "https://via.placeholder.com/400x500/0A0A0A/FFFFFF?text=Noemia+Boot",
    badge: "Pillow Walk",
    promo: "BOGO 40% off at cart",
    description: "Versatile ankle boots perfect for any season.",
    features: [
      "Premium leather",
      "Pillow Walk insole",
      "Block heel for comfort",
      "Side zipper",
      "Almond toe shape"
    ]
  },

  // Men's Best Sellers
  {
    id: 8,
    name: "Zappa",
    type: "Ankle boot",
    price: 180,
    category: "mens",
    subcategory: "boots",
    color: "Black",
    colors: ["Black", "Brown", "Dark Brown", "Cognac"],
    sizes: ["7", "7.5", "8", "8.5", "9", "9.5", "10", "10.5", "11", "11.5", "12"],
    image: "https://via.placeholder.com/400x500/000000/FFFFFF?text=Zappa+Boot",
    promo: "BOGO 40% off at cart",
    description: "Classic men's ankle boots with modern styling.",
    features: [
      "Full-grain leather upper",
      "Leather lining",
      "Lace-up closure",
      "Rubber sole",
      "Cushioned footbed"
    ]
  },
  {
    id: 9,
    name: "Kole",
    type: "Loafer",
    price: 135,
    category: "mens",
    subcategory: "dress",
    color: "Open Brown",
    colors: ["Open Brown", "Black"],
    sizes: ["7", "8", "9", "10", "11", "12", "13"],
    image: "https://via.placeholder.com/400x500/8B6914/FFFFFF?text=Kole+Loafer",
    badge: "Pillow Walk",
    promo: "BOGO 40% off at cart",
    description: "Sophisticated loafers for the modern gentleman.",
    features: [
      "Premium leather",
      "Pillow Walk comfort",
      "Slip-on design",
      "Leather sole",
      "Classic penny loafer style"
    ]
  },
  {
    id: 10,
    name: "Marcos",
    type: "Ankle boot, Block heel",
    price: 195,
    category: "mens",
    subcategory: "boots",
    color: "Dark Brown",
    colors: ["Dark Brown", "Black"],
    sizes: ["8", "8.5", "9", "9.5", "10", "10.5", "11", "11.5", "12"],
    image: "https://via.placeholder.com/400x500/4A2511/FFFFFF?text=Marcos+Boot",
    promo: "BOGO 40% off at cart",
    description: "Rugged yet refined ankle boots.",
    features: [
      "Suede leather upper",
      "Block heel design",
      "Side zip closure",
      "Cushioned insole",
      "Durable rubber outsole"
    ]
  },
  {
    id: 11,
    name: "Arturo",
    type: "Loafer",
    price: 160,
    category: "mens",
    subcategory: "dress",
    color: "Open Black",
    colors: ["Open Black", "Brown", "Tan", "Navy"],
    sizes: ["7", "7.5", "8", "8.5", "9", "9.5", "10", "10.5", "11", "11.5", "12"],
    image: "https://via.placeholder.com/400x500/2C2C2C/FFFFFF?text=Arturo+Loafer",
    badge: "Pillow Walk",
    promo: "BOGO 40% off at cart",
    description: "Elegant loafers with superior comfort.",
    features: [
      "Premium leather upper",
      "Pillow Walk technology",
      "Slip-on style",
      "Leather lining",
      "Flexible construction"
    ]
  },
  {
    id: 12,
    name: "Zeddyy",
    type: "Chelsea boot",
    price: 165,
    category: "mens",
    subcategory: "boots",
    color: "Wheat",
    colors: ["Wheat", "Black", "Brown"],
    sizes: ["7", "8", "9", "10", "11", "12"],
    image: "https://via.placeholder.com/400x500/D2B48C/FFFFFF?text=Zeddyy+Boot",
    badge: "Pillow Walk",
    promo: "BOGO 40% off at cart",
    description: "Classic Chelsea boots with modern comfort.",
    features: [
      "Suede upper",
      "Pillow Walk insole",
      "Elastic side panels",
      "Pull-on tab",
      "Durable sole"
    ]
  },
  {
    id: 13,
    name: "Braz",
    type: "Oxford shoe",
    price: 160,
    category: "mens",
    subcategory: "dress",
    color: "Cognac",
    colors: ["Cognac", "Black", "Brown", "Dark Brown"],
    sizes: ["7", "7.5", "8", "8.5", "9", "9.5", "10", "10.5", "11", "11.5", "12"],
    image: "https://via.placeholder.com/400x500/A0522D/FFFFFF?text=Braz+Oxford",
    promo: "BOGO 40% off at cart",
    description: "Timeless Oxford shoes for formal occasions.",
    features: [
      "Full-grain leather",
      "Goodyear welt construction",
      "Leather sole",
      "Lace-up closure",
      "Classic cap-toe design"
    ]
  },
  {
    id: 14,
    name: "Draco",
    type: "Combat boot, Lug sole",
    price: 170,
    category: "mens",
    subcategory: "boots",
    color: "Medium Brown",
    colors: ["Medium Brown", "Black"],
    sizes: ["8", "9", "10", "11", "12"],
    image: "https://via.placeholder.com/400x500/6B4423/FFFFFF?text=Draco+Boot",
    promo: "BOGO 40% off at cart",
    description: "Rugged combat boots with lug sole traction.",
    features: [
      "Durable leather upper",
      "Lug sole for traction",
      "Lace-up closure",
      "Padded collar",
      "Combat boot styling"
    ]
  }
];

