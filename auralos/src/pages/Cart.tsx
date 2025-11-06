import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { products } from '../data/products';
import ProductCard from '../components/ProductCard';

export default function Cart() {
  const { items, removeItem, updateQuantity, getTotal, getDiscount } = useCart();

  const subtotal = getTotal();
  const discount = getDiscount();
  const shipping = subtotal >= 99 ? 0 : 10;
  const total = subtotal - discount + shipping;

  const recommendedProducts = products
    .sort(() => 0.5 - Math.random())
    .slice(0, 4);

  if (items.length === 0) {
    return (
      <main style={{ padding: '40px 20px', minHeight: '60vh' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <h1 style={{ fontSize: '36px', marginBottom: '40px' }}>Shopping Cart</h1>
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <i className="fas fa-shopping-bag" style={{ fontSize: '80px', color: '#e0e0e0', marginBottom: '20px' }}></i>
            <h2 style={{ fontSize: '28px', marginBottom: '15px' }}>Your cart is empty</h2>
            <p style={{ fontSize: '16px', color: '#666', marginBottom: '30px' }}>
              Add some items to get started!
            </p>
            <Link to="/" className="btn-primary">Continue Shopping</Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main style={{ padding: '40px 20px', minHeight: '60vh' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '36px', marginBottom: '40px' }}>Shopping Cart</h1>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr',
          gap: '40px'
        }} className="cart-content">
          {/* Cart Items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {items.map(item => {
              const product = products.find(p => p.id === item.productId);
              if (!product) return null;

              const itemTotal = product.price * item.quantity;

              return (
                <div
                  key={`${item.productId}-${item.size}`}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '120px 1fr auto',
                    gap: '20px',
                    padding: '20px',
                    backgroundColor: '#f5f5f5',
                    borderRadius: '4px'
                  }}
                  className="cart-item"
                >
                  <div>
                    <img
                      src={product.image}
                      alt={product.name}
                      style={{ width: '100%', borderRadius: '4px' }}
                    />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '18px', marginBottom: '5px' }}>{product.name}</h3>
                    <p style={{ fontSize: '13px', color: '#666', marginBottom: '5px' }}>{product.type}</p>
                    <p style={{ fontSize: '13px', color: '#666', marginBottom: '5px' }}>
                      Color: {product.color}
                    </p>
                    <p style={{ fontSize: '13px', color: '#666' }}>Size: {item.size}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px' }}>
                      ${itemTotal.toFixed(2)}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'flex-end', marginBottom: '15px' }}>
                      <button
                        onClick={() => {
                          if (item.quantity > 1) {
                            updateQuantity(item.productId, item.size, item.quantity - 1);
                          }
                        }}
                        style={{
                          width: '30px',
                          height: '30px',
                          border: '1px solid #e0e0e0',
                          backgroundColor: '#fff',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '16px'
                        }}
                      >
                        <i className="fas fa-minus"></i>
                      </button>
                      <span style={{ minWidth: '30px', textAlign: 'center' }}>{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.productId, item.size, item.quantity + 1)}
                        style={{
                          width: '30px',
                          height: '30px',
                          border: '1px solid #e0e0e0',
                          backgroundColor: '#fff',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '16px'
                        }}
                      >
                        <i className="fas fa-plus"></i>
                      </button>
                    </div>
                    <button
                      onClick={() => {
                        if (confirm('Remove this item from your cart?')) {
                          removeItem(item.productId, item.size);
                        }
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#8B0000',
                        fontSize: '13px',
                        textDecoration: 'underline',
                        cursor: 'pointer'
                      }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Cart Summary */}
          <div style={{
            backgroundColor: '#f5f5f5',
            padding: '30px',
            borderRadius: '4px',
            height: 'fit-content',
            position: 'sticky',
            top: '100px'
          }}>
            <h2 style={{ fontSize: '24px', marginBottom: '20px' }}>Order Summary</h2>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '15px',
              fontSize: '14px'
            }}>
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '15px',
              fontSize: '14px'
            }}>
              <span>Shipping</span>
              <span>{shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`}</span>
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '15px',
              fontSize: '14px'
            }}>
              <span>BOGO 40% Discount</span>
              <span style={{ color: '#8B0000' }}>-${discount.toFixed(2)}</span>
            </div>

            <div style={{ borderTop: '1px solid #e0e0e0', margin: '15px 0' }} />

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '20px',
              fontWeight: 'bold',
              marginBottom: '20px'
            }}>
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>

            {subtotal < 99 && (
              <p style={{ fontSize: '12px', color: '#8B0000', marginBottom: '20px' }}>
                Add ${(99 - subtotal).toFixed(2)} more for FREE shipping!
              </p>
            )}

            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
              <input
                type="text"
                placeholder="Enter promo code"
                style={{
                  flex: 1,
                  padding: '10px',
                  border: '1px solid #e0e0e0',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              />
              <button className="btn-secondary" style={{ padding: '10px 20px' }}>Apply</button>
            </div>

            <button
              onClick={() => alert('Checkout functionality would be implemented here.')}
              className="btn-primary"
              style={{ width: '100%', padding: '15px', fontSize: '16px', marginBottom: '15px' }}
            >
              Proceed to Checkout
            </button>

            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <Link to="/" style={{ fontSize: '14px', textDecoration: 'underline', color: '#666' }}>
                Continue Shopping
              </Link>
            </div>

            <div style={{ textAlign: 'center', paddingTop: '20px', borderTop: '1px solid #e0e0e0' }}>
              <p style={{ fontSize: '13px', marginBottom: '10px', color: '#666' }}>
                <i className="fas fa-lock"></i> Secure Checkout
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
                <i className="fab fa-cc-visa" style={{ fontSize: '24px' }}></i>
                <i className="fab fa-cc-mastercard" style={{ fontSize: '24px' }}></i>
                <i className="fab fa-cc-amex" style={{ fontSize: '24px' }}></i>
                <i className="fab fa-cc-paypal" style={{ fontSize: '24px' }}></i>
              </div>
            </div>
          </div>
        </div>

        {/* Recommended Products */}
        <section style={{ marginTop: '60px' }}>
          <h2 style={{ fontSize: '28px', marginBottom: '30px' }}>You May Also Like</h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '30px'
          }}>
            {recommendedProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

