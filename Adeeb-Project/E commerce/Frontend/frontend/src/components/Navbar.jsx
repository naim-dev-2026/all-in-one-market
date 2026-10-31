import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000';

const Navbar = ({ isStaff, userName, cartCount = 0, categories = [], onOpenDrawer, onLogout, onSearchSubmit, onCartClick }) => {
  const [localSearch, setLocalSearch] = useState('');
  const [localCategory, setLocalCategory] = useState('all');
  
  // 🔍 AUTOCOMPLETE ENGINE LOCAL STORAGE STATES
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const handleSearchTrigger = (e) => {
    e.preventDefault();
    setShowDropdown(false);
    if (onSearchSubmit) {
      onSearchSubmit(localSearch, localCategory);
    }
  };

  // 📡 ASYNC AUTOCOMPLETE ENGINE STREAMER LAYER (Includes a defensive typing check)
  useEffect(() => {
    const fetchSuggestions = async () => {
      const trimmedQuery = localSearch.trim();
      if (trimmedQuery.length < 2) {
        setSuggestions([]);
        return;
      }
      try {
        const response = await axios.get(`${API_BASE_URL}/api/accounts/autocomplete/?q=${encodeURIComponent(trimmedQuery)}`);
        setSuggestions(Array.isArray(response.data) ? response.data : []);
      } catch (err) {
        console.error("Autocomplete stream pipeline error:", err);
      }
    };

    // ⚡ DEBOUNCING MECHANISM LAYER: Waits 250ms for user typing pauses to prevent server database overload
    const delayTimer = setTimeout(() => {
      fetchSuggestions();
    }, 250);

    return () => clearTimeout(delayTimer);
  }, [localSearch]);

  // Handle clicking outside of the search area to close the dropdown panel smoothly
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSuggestionClick = (title) => {
    setLocalSearch(title);
    setSuggestions([]);
    setShowDropdown(false);
    if (onSearchSubmit) {
      onSearchSubmit(title, localCategory);
    }
  };

  return (
    <header style={{ display: 'flex', flexDirection: 'column', width: '100%', fontFamily: '"Amazon Ember", Arial, sans-serif', position: 'sticky', top: 0, zIndex: 1000, boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
      
      {/* 🔮 MAIN NAV BAR - DEEP PREMIUM PURPLE THEME */}
      <div style={{ backgroundColor: '#2d124d', height: '65px', padding: '0 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px' }}>
        
        {/* Left Side: Category Menu Trigger, Brand Title, Location */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <button 
            onClick={onOpenDrawer}
            style={{ background: 'none', border: 'none', color: '#ffffff', fontSize: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px', borderRadius: '4px', outline: 'none' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.15)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            ☰
          </button>

          {/* CUSTOM BRAND LOGO */}
          <Link to="/home" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', padding: '4px 8px', borderRadius: '2px', cursor: 'pointer' }}>
            <span style={{ fontSize: '20px', fontWeight: '900', color: '#ffffff', letterSpacing: '-0.5px' }}>All in one</span>
            <span style={{ color: '#febd69', fontSize: '13px', fontWeight: '700', alignSelf: 'flex-end', paddingBottom: '2px', marginLeft: '2px' }}>.market</span>
          </Link>

          {/* Delivery Region Indicator */}
          <div style={{ display: 'flex', alignItems: 'center', padding: '4px 8px', borderRadius: '2px', color: '#ffffff' }}>
            <span style={{ fontSize: '16px', marginRight: '4px', marginTop: '6px' }}>📍</span>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '10px', color: '#e2d8f0', fontWeight: '400' }}>Deliver to</span>
              <span style={{ fontSize: '12px', color: '#ffffff', fontWeight: '700', marginTop: '-2px' }}>Bangladesh</span>
            </div>
          </div>
        </div>

        {/* Center Search Console Box Form Block */}
        <div ref={dropdownRef} style={{ flex: 1, maxWidth: '750px', position: 'relative' }}>
          <form onSubmit={handleSearchTrigger} style={{ display: 'flex', height: '40px', borderRadius: '4px', overflow: 'hidden', backgroundColor: '#ffffff' }}>
            <select 
              value={localCategory}
              onChange={(e) => setLocalCategory(e.target.value)}
              style={{ backgroundColor: '#f3f3f3', border: 'none', borderRight: '1px solid #cbd5e1', padding: '0 12px', fontSize: '12px', color: '#555', cursor: 'pointer', outline: 'none' }}
            >
              <option value="all">All</option>
              {Array.isArray(categories) && categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
            
            <input 
              type="text" 
              placeholder="Search All in one.market" 
              value={localSearch}
              onFocus={() => setShowDropdown(true)}
              onChange={(e) => { setLocalSearch(e.target.value); setShowDropdown(true); }}
              style={{ flex: 1, border: 'none', padding: '0 12px', fontSize: '14px', outline: 'none', color: '#111' }} 
            />
            
            <button type="submit" style={{ backgroundColor: '#febd69', border: 'none', width: '45px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', outline: 'none' }}>
              <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#333' }}>🔍</span>
            </button>
          </form>

          {/* 🌟 NEW: INTERACTIVE ABSOLUTE OVERLAY AUTO-SUGGESTION PANEL */}
          {showDropdown && suggestions.length > 0 && (
            <ul style={{ position: 'absolute', top: '44px', left: 0, right: 0, backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', margin: 0, padding: '6px 0', listStyle: 'none', zIndex: 9999, maxHeight: '300px', overflowY: 'auto' }}>
              {suggestions.map((item) => (
                <li 
                  key={item.id}
                  onClick={() => handleSuggestionClick(item.title)}
                  style={{ padding: '10px 16px', fontSize: '14px', color: '#1e293b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', transition: 'background-color 0.15s ease' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <span style={{ opacity: 0.6 }}>🔍</span>
                  <span style={{ fontWeight: '500' }}>{item.title}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Right Side: Account Hooks, Manager Links, Cart Metrics */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', padding: '8px', gap: '4px', color: '#ffffff', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
            <span>🇧🇩</span>
            <span style={{ fontSize: '12px', color: '#ffffff' }}>EN</span>
            <span style={{ fontSize: '9px', color: '#bbb' }}>▼</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', padding: '6px 8px', borderRadius: '2px', color: '#ffffff' }}>
            <span style={{ fontSize: '10px', color: '#e2d8f0', fontWeight: '400' }}>Hello, {userName}</span>
            <span style={{ fontSize: '12px', fontWeight: '700', color: '#ffffff', marginTop: '-2px', display: 'flex', alignItems: 'center', gap: '3px' }}>
              Account & Lists <span style={{ fontSize: '9px', color: '#bbb' }}>▼</span>
            </span>
          </div>

          {/* Secure Admin Portal Shortcut */}
          {isStaff && (
            <Link to="/merchant" style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', padding: '6px 8px' }}>
              <span style={{ fontSize: '10px', color: '#bbf7d0', fontWeight: '400' }}>Merchant</span>
              <span style={{ fontSize: '12px', fontWeight: '700', marginTop: '-2px', color: '#4ade80' }}>Console Hub</span>
            </Link>
          )}

          {/* 🛒 FIXED INTERACTIVE CART BUTTON */}
          <div 
            onClick={onCartClick}
            style={{ display: 'flex', alignItems: 'center', padding: '6px 8px', color: '#ffffff', cursor: 'pointer', position: 'relative', borderRadius: '4px', transition: 'all 0.2s' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', marginRight: '4px' }}>
              <span style={{ position: 'absolute', top: '-10px', color: '#febd69', fontSize: '15px', fontWeight: '800' }}>{cartCount}</span>
              <span style={{ fontSize: '24px', marginTop: '4px' }}>🛒</span>
            </div>
            <span style={{ fontSize: '12px', fontWeight: '700', color: '#ffffff', alignSelf: 'flex-end', paddingBottom: '2px' }}>Cart</span>
          </div>

          <button onClick={onLogout} style={{ marginLeft: '5px', padding: '8px 12px', backgroundColor: '#febd69', color: '#111', border: '1px solid #cea147', borderRadius: '3px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', outline: 'none' }}>
            Log Out
          </button>
        </div>

      </div>

    </header>
  );
};

export default Navbar;
