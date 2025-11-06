import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { CartItem } from '../types/product';
import { products } from '../data/products';

interface CartContextType {
  items: CartItem[];
  addItem: (productId: number, size: string, quantity?: number) => boolean;
  removeItem: (productId: number, size: string) => void;
  updateQuantity: (productId: number, size: string, quantity: number) => void;
  clearCart: () => void;
  getTotal: () => number;
  getCount: () => number;
  getDiscount: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    const stored = localStorage.getItem('cart');
    return stored ? JSON.parse(stored) : [];
  });

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(items));
  }, [items]);

  const addItem = (productId: number, size: string, quantity = 1): boolean => {
    const product = products.find(p => p.id === productId);
    if (!product) return false;

    setItems(prevItems => {
      const existingItem = prevItems.find(
        item => item.productId === productId && item.size === size
      );

      if (existingItem) {
        return prevItems.map(item =>
          item.productId === productId && item.size === size
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }

      return [...prevItems, { productId, size, quantity, addedAt: Date.now() }];
    });

    return true;
  };

  const removeItem = (productId: number, size: string) => {
    setItems(prevItems =>
      prevItems.filter(item => !(item.productId === productId && item.size === size))
    );
  };

  const updateQuantity = (productId: number, size: string, quantity: number) => {
    setItems(prevItems =>
      prevItems.map(item =>
        item.productId === productId && item.size === size
          ? { ...item, quantity: Math.max(1, quantity) }
          : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const getTotal = (): number => {
    return items.reduce((total, item) => {
      const product = products.find(p => p.id === item.productId);
      return total + (product ? product.price * item.quantity : 0);
    }, 0);
  };

  const getCount = (): number => {
    return items.reduce((count, item) => count + item.quantity, 0);
  };

  const getDiscount = (): number => {
    // Calculate BOGO 40% discount
    const sortedItems = [...items]
      .map(item => ({
        ...item,
        product: products.find(p => p.id === item.productId)
      }))
      .filter(item => item.product)
      .sort((a, b) => (b.product?.price || 0) - (a.product?.price || 0));

    let discount = 0;
    let itemCount = 0;

    sortedItems.forEach(item => {
      for (let i = 0; i < item.quantity; i++) {
        itemCount++;
        if (itemCount % 2 === 0) {
          discount += (item.product?.price || 0) * 0.4;
        }
      }
    });

    return discount;
  };

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        getTotal,
        getCount,
        getDiscount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

