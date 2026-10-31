import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from './Navbar';
import SidebarDrawer from './SidebarDrawer';
import ProductCard from './ProductCard';
import Footer from './Footer';


const API_BASE_URL = 'http://127.0.0.1:8000';
const CART_KEY = 'cart_items';
const PLACEHOLDER_IMAGE =
  "data:image/svg+xml;utf8,<svg xmlns='http://w3.org' width='400' height='300'><rect width='100%25' height='100%25' fill='%23e2e8f0'/></svg>";

const readCart = () => {
  try {
    const raw = localStorage.getItem(CART_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const Home = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchKey, setSearchKey] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [cart, setCart] = useState(readCart);
  const [toast, setToast] = useState('');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState(null);
  const toastTimer = useRef(null);

  const isStaff = localStorage.getItem('user_is_staff') === 'true';
  const userName = localStorage.getItem('user_name') || 'Customer';
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleLogout = () => {
    ['access_token', 'refresh_token', 'user_is_staff', 'user_name'].forEach((key) =>
      localStorage.removeItem(key)
    );
    window.location.href = '/login';
  };

  const showToast = (text) => {
    setToast(text);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 2000);
  };

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  const handleAddToCart = (product) => {
    const hasDiscount = product.sale_price !== null && product.sale_price !== undefined && product.sale_price !== '';
    const unitPrice = Number(hasDiscount ? product.sale_price : product.price);

    const existing = cart.find((item) => item.id === product.id);
    const currentQty = existing ? existing.quantity : 0;

    if (currentQty >= product.inventory) {
      showToast(`Only ${product.inventory} in stock.`);
      return;
    }

    const nextCart = existing
      ? cart.map((item) => (item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item))
      : [
          ...cart,
          {
            id: product.id,
            title: product.title,
            price: unitPrice,
            image: product.image || null,
            quantity: 1,
          },
        ];

    setCart(nextCart);
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(nextCart));
    } catch {
      // fallback
    }
    showToast(`"${product.title}" added to cart.`);
  };

  const fetchCatalogData = async (searchWord = '', catId = 'all') => {
    setLoading(true);
    setLoadFailed(false);
    try {
      let url = `${API_BASE_URL}/api/store/products/?`;
      if (searchWord) url += `search=${encodeURIComponent(searchWord)}&`;
      if (catId && catId !== 'all') url += `category=${catId}&`;

      const [prodRes, catRes] = await Promise.all([
        axios.get(url),
        axios.get(`${API_BASE_URL}/api/store/categories/`),
      ]);
      setProducts(Array.isArray(prodRes.data) ? prodRes.data : prodRes.data.results || []);
      setCategories(Array.isArray(catRes.data) ? catRes.data : catRes.data.results || []);
    } catch (err) {
      console.error(err);
      setLoadFailed(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalogData(searchKey, selectedCategory);
  }, [searchKey, selectedCategory]);

  const handleSearchSubmit = (searchWord, catId) => {
    setSearchKey(searchWord);
    setSelectedCategory(catId);
  };

  const nestedCategories = useMemo(() => {
    const normalizeSub = (s) => {
      const full = typeof s === 'object' && s !== null ? s : categories.find((c) => String(c.id) === String(s));
      if (!full) return null;
      const name = full.name || '';
      return { ...full, cleanName: name.includes('>') ? name.split('>').slice(1).join('>').trim() : name };
    };

    const childIds = new Set();
    categories.forEach((cat) => {
      (cat.sub_categories || []).forEach((s) => {
        const id = typeof s === 'object' && s !== null ? s.id : s;
        childIds.add(String(id));
      });
    });

    const mainCats = [];
    const subCatsByParent = {};

    categories.forEach((cat) => {
      const name = cat.name || '';
      if (cat.sub_categories && cat.sub_categories.length > 0) {
        mainCats.push({ ...cat, cleanName: name, subItems: cat.sub_categories.map(normalizeSub).filter(Boolean) });
      } else if (childIds.has(String(cat.id))) {
        return;
      } else if (name.includes('>')) {
        const parts = name.split('>');
        const parentName = parts[0].trim();
        const childName = parts.slice(1).join('>').trim();
        if (!subCatsByParent[parentName]) subCatsByParent[parentName] = [];
        subCatsByParent[parentName].push({ ...cat, cleanName: childName });
      } else if (!categories.some((c) => (c.name || '').startsWith(name + ' >'))) {
        mainCats.push({ ...cat, cleanName: name, subItems: [] });
      }
    });

    Object.keys(subCatsByParent).forEach((parentName) => {
      const match = mainCats.find((m) => m.name === parentName);
      if (match) match.subItems = [...match.subItems, ...subCatsByParent[parentName]];
    });

    return mainCats;
  }, [categories]);

  const visibleProducts = useMemo(() => products.filter((p) => p.is_active !== false), [products]);

  const selectedCategoryName = useMemo(() => {
    if (selectedCategory === 'all') return searchKey ? `Search Results for "${searchKey}"` : 'All Products';
    return categories.find((c) => String(c.id) === String(selectedCategory))?.name || 'Products';
  }, [selectedCategory, categories, searchKey]);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: 'Inter, -apple-system, sans-serif', width: '100%' }}>
      <Navbar isStaff={isStaff} userName={userName} cartCount={cartCount} categories={categories} onOpenDrawer={() => setIsDrawerOpen(true)} onLogout={handleLogout} onSearchSubmit={handleSearchSubmit} onCartClick={() => navigate('/checkout')} />
      <SidebarDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} selectedCategory={selectedCategory} onSelectCategory={setSelectedCategory} nestedCategories={nestedCategories} expandedCategory={expandedCategory} onToggleExpand={(id) => setExpandedCategory(expandedCategory === id ? null : id)} />
      
      {/* 🚀 FIXED FULL-WIDTH CONTAINER FLUID DESIGN (No more white gaps on side borders) */}
      <main style={{ width: '100%', padding: '40px 40px', boxSizing: 'border-box' }}>
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ margin: 0, fontSize: '26px', fontWeight: '800', color: '#0f172a' }}>{selectedCategoryName}</h2>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '14px' }}>Browse live verified inventory records matching your preferences.</p>
        </div>

        {toast && <div style={{ position: 'fixed', bottom: '30px', right: '30px', backgroundColor: '#1e293b', color: '#ffffff', padding: '12px 24px', borderRadius: '8px', fontSize: '14px', fontWeight: '600', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', zIndex: 9999 }}>{toast}</div>}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}><h3>Streaming dynamic database nodes...</h3></div>
        ) : loadFailed ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#ef4444', backgroundColor: '#fef2f2', borderRadius: '12px', border: '1px solid #fee2e2' }}><h3>System Sync failure. Ensure your local server is online.</h3></div>
        ) : visibleProducts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', color: '#64748b' }}><h3>No products match your search criteria keyword query.</h3></div>
        ) : (
          /* 🏆 INFINITE RESPONSIVE FULL SCREEN SPREAD AUTO GRID MATRICES */
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '32px', width: '100%' }}>
            {visibleProducts.map((p) => <ProductCard key={p.id} product={p} onAddToCart={handleAddToCart} />)}
          </div>
        )}
      </main>
      <Footer /> 
    </div>
  );
};

export default Home;
