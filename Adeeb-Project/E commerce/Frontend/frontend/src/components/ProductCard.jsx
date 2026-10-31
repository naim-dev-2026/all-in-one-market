import React from 'react';

const ProductCard = ({ product, onAddToCart }) => {
  const hasDiscount = product.sale_price !== null && product.sale_price !== undefined && product.sale_price !== '';
  const isOutOfStock = product.inventory === 0;

  // 📡 CRUCIAL BUG FIX: Formats the image path correctly directly with your backend media URL
  const formatImageSrc = (image) => {
    const BACKEND_URL = 'http://127.0.0.1:8000';
    if (!image) return 'https://unsplash.com';
    return image.startsWith('http') ? image : `${BACKEND_URL}${image}`;
  };

  return (
    <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      
      {/* Floating Red Sale Offer Tag */}
      {hasDiscount && !isOutOfStock && (
        <span style={{ position: 'absolute', top: '12px', left: '12px', backgroundColor: '#dc2626', color: '#fff', fontSize: '11px', fontWeight: '700', padding: '4px 10px', borderRadius: '20px', textTransform: 'uppercase', letterSpacing: '0.5px', zIndex: 5 }}>
          Sale Offer
        </span>
      )}

      {/* 🖼️ COMPACT IMAGE FRAME LAYER FIXED */}
      <div style={{ width: '100%', height: '220px', backgroundColor: '#f8fafc', overflow: 'hidden', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <img 
          src={formatImageSrc(product.image)} 
          alt={product.title} 
          style={{ 
            width: '100%', 
            height: '100%', 
            objectFit: 'cover', // 🚀 Locks the photo to stretch and fill the whole frame cleanly
            display: 'block',
            opacity: isOutOfStock ? 0.5 : 1 
          }} 
        />
      </div>

      <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <h3 style={{ margin: '0 0 6px 0', fontSize: '16px', fontWeight: '700', color: '#0f172a', lineHeight: '1.4' }}>{product.title}</h3>
        <p style={{ margin: '0 0 20px 0', fontSize: '13px', color: '#64748b', lineHeight: '1.5', flex: 1 }}>{product.description || 'No supplementary specifications provided.'}</p>
        
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '16px' }}>
          {hasDiscount ? (
            <>
              <span style={{ fontSize: '20px', fontWeight: '800', color: '#16a34a' }}>${product.sale_price}</span>
              <span style={{ fontSize: '14px', color: '#94a3b8', textDecoration: 'line-through', fontWeight: '500' }}>${product.price}</span>
            </>
          ) : (
            <span style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a' }}>${product.price}</span>
          )}
        </div>

        {isOutOfStock ? (
          <button disabled style={{ width: '100%', padding: '12px', backgroundColor: '#f1f5f9', color: '#94a3b8', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: 'not-allowed' }}>
            Sold Out
          </button>
        ) : (
          <button onClick={() => onAddToCart(product)} style={{ width: '100%', padding: '12px', backgroundColor: '#2563eb', color: '#ffffff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', outline: 'none' }}>
            Add to Cart
          </button>
        )}
      </div>
    </div>
  );
};

export default ProductCard;
