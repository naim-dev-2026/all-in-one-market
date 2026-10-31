import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  // Smooth scroll-to-top handler function
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer style={{ width: '100%', fontFamily: '"Amazon Ember", Arial, sans-serif', marginTop: '60px' }}>
      
      {/* 🔼 BACK TO TOP LINK BAR */}
      <div 
        onClick={scrollToTop}
        style={{ backgroundColor: '#37185c', height: '45px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', fontSize: '13px', fontWeight: '600', cursor: 'pointer', transition: 'background-color 0.2s' }}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#43206c'}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#37185c'}
      >
        Back to top
      </div>

      {/* 🔮 MAIN PURPLE CORRESPONDENCE CORE */}
      <div style={{ backgroundColor: '#2d124d', padding: '40px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        
        {/* Simplified Branding Elements */}
        <div style={{ display: 'flex', alignItems: 'center', cursor: 'default' }}>
          <span style={{ fontSize: '20px', fontWeight: '900', color: '#ffffff', letterSpacing: '-0.5px' }}>All in one</span>
          <span style={{ color: '#febd69', fontSize: '13px', fontWeight: '700', alignSelf: 'flex-end', paddingBottom: '2px', marginLeft: '2px' }}>.market</span>
        </div>

        {/* Clean, Simple Informational Shortcut Text Grid */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '30px', flexWrap: 'wrap', fontSize: '13px', fontWeight: '500' }}>
          {['About Us', 'Privacy Notice', 'Conditions of Use', 'Help Directory'].map((text) => (
            <span 
              key={text} 
              style={{ color: '#e2d8f0', cursor: 'pointer', transition: 'color 0.15s' }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#febd69'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#e2d8f0'}
            >
              {text}
            </span>
          ))}
        </div>

        {/* Minimalist Regional & Localization Grid parameters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', fontSize: '12px', color: '#cbd5e1', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px', width: '100%', maxWidth: '400px', justifyContent: 'center' }}>
          <span style={{ padding: '6px 12px', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '4px' }}>🌐 English</span>
          <span style={{ padding: '6px 12px', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '4px' }}>💲 USD - U.S. Dollar</span>
          <span style={{ padding: '6px 12px', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '4px' }}>🇧🇩 Bangladesh</span>
        </div>

        {/* Copyright Attribution Line */}
        <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '10px' }}>
          &copy; {new Date().getFullYear()} All in one.market Full-Stack Portfolio Operations. All rights reserved.
        </div>

      </div>

    </footer>
  );
};

export default Footer;
