export interface Product {
  id: number;
  name: string;
  type: string;
  price: number;
  category: 'womens' | 'mens';
  subcategory: string;
  color: string;
  colors: string[];
  sizes: string[];
  image: string;
  url?: string;
  badge?: string;
  promo?: string;
  description: string;
  features: string[];
}

export interface CartItem {
  productId: number;
  size: string;
  quantity: number;
  addedAt: number;
}

