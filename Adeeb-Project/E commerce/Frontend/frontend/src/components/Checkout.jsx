import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000';
const CART_KEY = 'cart_items';

const Checkout = () => {
  const navigate = useNavigate();
  const [addressLine, setAddressLine] = useState('');
  const [city, setCity] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // 📦 Securely extract the active cart items out of local state
  const cart = useMemo(() => {
    try {
      const raw = localStorage.getItem(CART_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, []);

  const totalAmount = useMemo(() => {
    return cart.reduce((sum, item) => sum + (Number(item.price) * item.quantity), 0);
  }, [cart]);

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!addressLine.trim() || !city.trim() || !zipCode.trim() || !contactPhone.trim()) {
      setErrorMessage('Please fill out all the delivery and contact fields.');
      return;
    }

    const token = localStorage.getItem('access_token');
    if (!token) {
      setErrorMessage('Session missing. Redirecting to login page...');
      setTimeout(() => navigate('/login'), 2000);
      return;
    }

    setIsSubmitting(true);
    try {
      // 📡 UNIFIED PAYLOAD (Combines address lines safely for Django models)
      const fullShippingAddress = `${addressLine.trim()}, ${city.trim()}, ZIP: ${zipCode.trim()}`;
      
      const payload = {
        items: cart.map(item => ({ id: item.id, quantity: item.quantity })),
        shipping_address: fullShippingAddress,
        contact_phone: contactPhone.trim()
      };

      const response = await axios.post(`${API_BASE_URL}/api/store/checkout/`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      localStorage.removeItem(CART_KEY);
      alert(`🎉 Order Placed Successfully! Order ID: #${response.data.order_id}`);
      navigate('/home');

    } catch (err) {
      console.error(err);
      setErrorMessage(err.response?.data?.error || 'Order processing pipeline failure. Please retry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 🛑 GUARD LAYER: Blocks zero-value orders or empty basket submissions immediately
  if (cart.length === 0) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        backgroundColor: '#ffffff', // 🚀 Pure solid full-bleed background sheet canvas
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        fontFamily: 'Inter, system-ui, sans-serif', 
        padding: '40px 20px',
        boxSizing: 'border-box',
        width: '100vw'
      }}>
        {/* 🏆 FULL-SCREEN MINIMALIST RETAIL ASSEMBLY FRAME */}
        <div style={{ 
          textAlign: 'center',
          maxWidth: '800px', 
          width: '100%',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}>
          {/* Enhanced Grand Visual Icon Header */}
          <div style={{ 
            fontSize: '96px', 
            marginBottom: '32px', 
            display: 'inline-block',
            lineHeight: 1,
            userSelect: 'none'
          }}>
            🛒
          </div>
          
          <h2 style={{ 
            color: '#0f172a', 
            margin: '0 0 16px 0', 
            fontSize: '36px', 
            fontWeight: '900', 
            letterSpacing: '-1px',
            lineHeight: '1.2'
          }}>
            Your Shopping Cart is Empty
          </h2>
          
          {/* Elegant Minimalist Separator Rule Stripe */}
          <div style={{ width: '80px', height: '4px', backgroundColor: '#febd69', borderRadius: '2px', marginBottom: '24px' }} />
          
          <p style={{ 
            color: '#475569', 
            margin: '0 0 48px 0', 
            fontSize: '16px', 
            lineHeight: '1.7',
            fontWeight: '500',
            maxWidth: '560px' 
          }}>
            You haven't added any products to your shelf basket yet. Explore our storefront listings to discover premium verified deals live.
          </p>
          
          {/* Premium High-Contrast Action Button link opening structure */}
          <Link 
            to="/home" 
            style={{ 
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              padding: '18px 48px', 
              backgroundColor: '#2d124d', 
              color: '#ffffff', 
              textDecoration: 'none', 
              borderRadius: '12px', 
              fontSize: '16px',
              fontWeight: '700', 
              boxShadow: '0 10px 25px -5px rgba(45, 18, 77, 0.3)', 
              transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
              outline: 'none'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#febd69'; 
              e.currentTarget.style.color = '#131921'; 
              e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(254, 189, 105, 0.45)';
              e.currentTarget.style.transform = 'translateY(-3px)'; 
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#2d124d'; 
              e.currentTarget.style.color = '#ffffff';
              e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(45, 18, 77, 0.3)';
              e.currentTarget.style.transform = 'translateY(0px)';
            }}
          >
            <span>🛍️</span> Return to Storefront
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: 'Inter, system-ui, sans-serif', padding: '40px 20px' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        
        <div style={{ marginBottom: '32px' }}>
          <Link to="/home" style={{ textDecoration: 'none', color: '#2563eb', fontWeight: '600', fontSize: '14px' }}>← Continue Browsing Marketplace</Link>
          <h1 style={{ margin: '12px 0 0 0', fontSize: '28px', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.5px' }}>Delivery & Payment Information</h1>
        </div>

        {errorMessage && (
          <div style={{ padding: '14px 20px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#991b1b', fontSize: '14px', marginBottom: '24px', fontWeight: '600' }}>
            {errorMessage}
          </div>
        )}

        <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap-reverse' }}>
          
          {/* LEFT PANEL: INPUT FIELDS CONNECTED TO HOOK VARIABLES */}
          <form onSubmit={handlePlaceOrder} style={{ flex: 1, minWidth: '320px', backgroundColor: '#ffffff', padding: '32px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.01)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>Shipping Address</label>
              <input 
                type="text"
                placeholder="Street name, House/Holding number, Apartment..."
                value={addressLine}
                onChange={(e) => setAddressLine(e.target.value)}
                style={{ padding: '12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '14px', outline: 'none' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '16px' }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>City</label>
                <input 
                  type="text"
                  placeholder="Dhaka, Chittagong..."
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  style={{ padding: '12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '14px', outline: 'none' }}
                />
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>ZIP Code</label>
                <input 
                  type="text"
                  placeholder="1216, 1000..."
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                  style={{ padding: '12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '14px', outline: 'none' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>Phone Number</label>
              <input 
                type="tel"
                placeholder="01XXXXXXXXX"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                style={{ padding: '12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '14px', outline: 'none' }}
              />
            </div>

            <button 
              type="submit" 
              disabled={isSubmitting}
              style={{ width: '100%', padding: '14px', backgroundColor: isSubmitting ? '#cbd5e1' : '#22c55e', color: '#ffffff', border: 'none', borderRadius: '6px', fontSize: '15px', fontWeight: '700', cursor: isSubmitting ? 'not-allowed' : 'pointer', transition: 'background-color 0.2s', marginTop: '12px', outline: 'none' }}
            >
              {isSubmitting ? 'Processing Transaction...' : 'Place Order'}
            </button>

            <Link to="/home" style={{ textAlign: 'center', color: '#64748b', fontSize: '13px', display: 'block', marginTop: '12px', textDecoration: 'none' }}>
              Back to Cart
            </Link>
          </form> 

          {/* RIGHT PANEL: BASKET SUMMARY */}
          <div style={{ width: '340px', backgroundColor: '#ffffff', padding: '32px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.01)', height: 'fit-content' }}>
            <h2 style={{ margin: '0 0 20px 0', fontSize: '16px', fontWeight: '700', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Items Summary</h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', borderBottom: '1px solid #e2e8f0', paddingBottom: '20px', marginBottom: '20px', maxHeight: '280px', overflowY: 'auto' }}>
              {cart.map((item) => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                  <div style={{ flex: 1, paddingRight: '12px' }}>
                    <div style={{ fontWeight: '600', color: '#1e293b' }}>{item.title}</div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>{item.quantity} x ${Number(item.price).toFixed(2)}</div>
                  </div>
                  <div style={{ fontWeight: '700', color: '#0f172a' }}>${(Number(item.price) * item.quantity).toFixed(2)}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontSize: '15px', fontWeight: '700', color: '#334155' }}>Total Amount Due:</span>
              <span style={{ fontSize: '24px', fontWeight: '800', color: '#16a34a' }}>${totalAmount.toFixed(2)}</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Checkout;
