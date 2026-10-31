import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const API_BASE_URL = 'http://127.0.0.1:8000';
const CART_KEY = 'cart_items';

const readCart = () => {
  try {
    const raw = localStorage.getItem(CART_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const Cart = () => {
  const navigate = useNavigate();
  const [cart, setCart] = useState(readCart);
  const [notice, setNotice] = useState('');

  const isLoggedIn = !!localStorage.getItem('access_token');

  const saveCart = (next) => {
    setCart(next);
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(next));
    } catch {
      // storage unavailable: cart still works for this visit
    }
  };

  const changeQty = (id, delta) => {
    const next = cart
      .map((item) => (item.id === id ? { ...item, quantity: item.quantity + delta } : item))
      .filter((item) => item.quantity > 0);
    saveCart(next);
  };

  const removeItem = (id) => saveCart(cart.filter((item) => item.id !== id));

  const clearCart = () => {
    if (window.confirm('Remove all items from your cart?')) saveCart([]);
  };

  const imageSrc = (image) => {
    if (!image) return null;
    return image.startsWith('http') ? image : `${API_BASE_URL}${image}`;
  };

  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleCheckout = () => {
    if (!isLoggedIn) {
      navigate('/login', { state: { from: '/cart' } });
      return;
    }
    // UPDATED: Navigates straight to the checkout component view route now
    navigate('/checkout');
  };

  const qtyBtn = { width: '30px', height: '30px', border: '1px solid #cbd5e1', borderRadius: '6px', backgroundColor: '#fff', fontSize: '16px', fontWeight: '600', cursor: 'pointer', color: '#334155' };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f4f6f8', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <nav style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #e1e4e8', padding: '15px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#1a1f36' }}>Your Cart</h1>
        <Link to="/home" style={{ color: '#5469d4', fontWeight: '600', fontSize: '14px', textDecoration: 'none' }}>
          ← Continue shopping
        </Link>
      </nav>

      <main style={{ maxWidth: '1000px', margin: '40px auto', padding: '0 20px' }}>
        {cart.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e1e4e8', color: '#697386' }}>
            <h3 style={{ marginTop: 0, color: '#1a1f36' }}>Your cart is empty</h3>
            <p>Browse the store and add something you like.</p>
            <Link to="/home" style={{ display: 'inline-block', marginTop: '8px', padding: '12px 24px', backgroundColor: '#5469d4', color: '#ffffff', borderRadius: '8px', fontWeight: '600', fontSize: '14px', textDecoration: 'none' }}>
              Browse products
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', flexWrap: 'wrap' }}>

            {/* Items */}
            <div style={{ flex: '2 1 480px', backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e1e4e8', overflow: 'hidden' }}>
              {cart.map((item) => (
                <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '18px 20px', borderBottom: '1px solid #f1f5f9' }}>
                  <div style={{ width: '72px', height: '72px', borderRadius: '8px', backgroundColor: '#e2e8f0', overflow: 'hidden', flexShrink: 0 }}>
                    {imageSrc(item.image) && (
                      <img src={imageSrc(item.image)} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    )}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: '700', color: '#1a1f36', fontSize: '15px' }}>{item.title}</div>
                    <div style={{ color: '#697386', fontSize: '13px', marginTop: '4px' }}>${item.price.toFixed(2)} each</div>
                    <button onClick={() => removeItem(item.id)} style={{ marginTop: '8px', padding: 0, background: 'none', border: 'none', color: '#dc2626', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                      Remove
                    </button>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <button onClick={() => changeQty(item.id, -1)} style={qtyBtn} aria-label="Decrease quantity">−</button>
                    <span style={{ minWidth: '20px', textAlign: 'center', fontWeight: '600', color: '#1a1f36' }}>{item.quantity}</span>
                    <button onClick={() => changeQty(item.id, 1)} style={qtyBtn} aria-label="Increase quantity">+</button>
                  </div>

                  <div style={{ width: '80px', textAlign: 'right', fontWeight: '700', color: '#1a1f36' }}>
                    ${(item.price * item.quantity).toFixed(2)}
                  </div>
                </div>
              ))}

              <div style={{ padding: '14px 20px', textAlign: 'right' }}>
                <button onClick={clearCart} style={{ background: 'none', border: 'none', color: '#697386', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                  Clear cart
                </button>
              </div>
            </div>

            {/* Summary */}
            <div style={{ flex: '1 1 260px', backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e1e4e8', padding: '24px' }}>
              <h3 style={{ margin: '0 0 18px', fontSize: '17px', color: '#1a1f36' }}>Order summary</h3>

              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#697386', fontSize: '14px', marginBottom: '10px' }}>
                <span>Items ({itemCount})</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#1a1f36', fontSize: '17px', fontWeight: '800', paddingTop: '14px', borderTop: '1px solid #e1e4e8' }}>
                <span>Total</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>

              {notice && (
                <div style={{ marginTop: '16px', padding: '10px 12px', backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', color: '#92400e', fontSize: '13px', fontWeight: '600' }}>
                  {notice}
                </div>
              )}

              <button onClick={handleCheckout} style={{ width: '100%', marginTop: '18px', padding: '13px', backgroundColor: '#5469d4', color: '#ffffff', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' }}>
                {isLoggedIn ? 'Proceed to checkout' : 'Sign in to checkout'}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Cart;
