import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';

const API_BASE_URL = 'http://127.0.0.1:8000';
const LOW_STOCK_LIMIT = 5;

const ORDER_STATUSES = [
  { value: 'pending', label: 'Pending' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
];

const MerchantProducts = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // App states
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState({});
  const [orders, setOrders] = useState([]);
  const [ordersLoadFailed, setOrdersLoadFailed] = useState(false);
  const [edits, setEdits] = useState({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(location.state?.message || '');
  const [isError, setIsError] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [activeTab, setActiveTab] = useState('inventory');

  const getAuthHeaders = () => {
    const token = localStorage.getItem('access_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const showSuccess = (text) => {
    setIsError(false);
    setMessage(text);
  };

  const showError = (error, fallback) => {
    setIsError(true);
    if (error.response?.status === 401) {
      setMessage('Your session expired. Please log in again.');
      return;
    }
    const data = error.response?.data;
    if (data && typeof data === 'object') {
      const parts = Object.entries(data).map(([key, value]) =>
        `${key}: ${Array.isArray(value) ? value.join(' ') : String(value)}`
      );
      setMessage(parts.join(' | ') || fallback);
    } else {
      setMessage(fallback);
    }
  };

  // Load products, categories and orders together
  const loadData = async () => {
    try {
      const [productRes, categoryRes, orderRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/store/products/`, { headers: getAuthHeaders() }),
        axios.get(`${API_BASE_URL}/api/store/categories/`, { headers: getAuthHeaders() }),
        axios
          .get(`${API_BASE_URL}/api/store/merchant/orders/`, { headers: getAuthHeaders() })
          .catch(() => null),
      ]);

      const productList = Array.isArray(productRes.data) ? productRes.data : productRes.data.results || [];
      const categoryList = Array.isArray(categoryRes.data) ? categoryRes.data : categoryRes.data.results || [];

      const categoryMap = {};
      categoryList.forEach((c) => {
        categoryMap[c.id] = c.name;
      });

      setCategories(categoryMap);
      setProducts(productList);

      if (orderRes) {
        const orderList = Array.isArray(orderRes.data) ? orderRes.data : orderRes.data.results || [];
        setOrders(orderList);
        setOrdersLoadFailed(false);
      } else {
        setOrders([]);
        setOrdersLoadFailed(true);
      }
    } catch (error) {
      showError(error, 'Could not load data. Check that the server is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Login guard: no token means the owner is not signed in
    if (!localStorage.getItem('access_token')) {
      navigate('/secret-owner-login');
      return;
    }
    loadData();
  }, []);

  // ----- edit helpers -----
  const toDraft = (p) => ({
    price: String(p.price),
    sale_price: p.sale_price == null ? '' : String(p.sale_price),
    inventory: String(p.inventory),
  });

  const getDraft = (p) => edits[p.id] || toDraft(p);

  const isDirty = (p) => {
    const d = getDraft(p);
    const original = toDraft(p);
    return (
      Number(d.price) !== Number(original.price) ||
      d.sale_price !== original.sale_price ||
      Number(d.inventory) !== Number(original.inventory)
    );
  };

  const handleDraftChange = (p, field, value) => {
    setEdits((prev) => ({
      ...prev,
      [p.id]: { ...(prev[p.id] || toDraft(p)), [field]: value },
    }));
  };

  // ----- inventory actions -----
  const saveProduct = async (p) => {
    const d = getDraft(p);
    setMessage('');

    const price = Number(d.price);
    const inventory = Number(d.inventory);
    const salePriceText = d.sale_price.trim();
    const noSale =
      salePriceText === '' ||
      salePriceText.toLowerCase() === 'none' ||
      salePriceText.toLowerCase() === 'null';

    if (d.price === '' || Number.isNaN(price) || price < 0) {
      setIsError(true);
      setMessage('Enter a valid price.');
      return;
    }
    if (!noSale && (Number.isNaN(Number(salePriceText)) || Number(salePriceText) < 0)) {
      setIsError(true);
      setMessage('Enter a valid sale price, or leave it empty.');
      return;
    }
    if (!noSale && Number(salePriceText) >= price) {
      setIsError(true);
      setMessage('Sale price must be lower than the regular price.');
      return;
    }
    if (d.inventory === '' || !Number.isInteger(inventory) || inventory < 0) {
      setIsError(true);
      setMessage('Stock must be a whole number, 0 or more.');
      return;
    }

    setBusyId(`product-${p.id}`);
    try {
      const response = await axios.patch(
        `${API_BASE_URL}/api/store/products/${p.id}/`,
        {
          price: d.price,
          sale_price: noSale ? null : salePriceText,
          inventory,
        },
        { headers: getAuthHeaders() }
      );
      setProducts((prev) => prev.map((item) => (item.id === p.id ? response.data : item)));
      setEdits((prev) => {
        const next = { ...prev };
        delete next[p.id];
        return next;
      });
      showSuccess(`"${p.title}" successfully updated.`);
    } catch (error) {
      showError(error, 'Could not save changes. Please try again.');
    } finally {
      setBusyId(null);
    }
  };

  const toggleActive = async (p) => {
    setMessage('');
    setBusyId(`product-${p.id}`);
    try {
      const response = await axios.patch(
        `${API_BASE_URL}/api/store/products/${p.id}/`,
        { is_active: !p.is_active },
        { headers: getAuthHeaders() }
      );
      setProducts((prev) =>
        prev.map((item) => (item.id === p.id ? { ...item, is_active: response.data.is_active } : item))
      );
    } catch (error) {
      showError(error, 'Could not update the product status.');
    } finally {
      setBusyId(null);
    }
  };

  const deleteProduct = async (p) => {
    if (!window.confirm(`Delete "${p.title}"? This cannot be undone.`)) return;
    setMessage('');
    setBusyId(`product-${p.id}`);
    try {
      await axios.delete(`${API_BASE_URL}/api/store/products/${p.id}/`, {
        headers: getAuthHeaders(),
      });
      setProducts((prev) => prev.filter((item) => item.id !== p.id));
      showSuccess(`"${p.title}" successfully deleted.`);
    } catch (error) {
      showError(error, 'Could not delete the product.');
    } finally {
      setBusyId(null);
    }
  };

  // ----- order actions -----
  const handleOrderStatusChange = async (orderId, newStatus) => {
    setMessage('');
    setBusyId(`order-${orderId}`);
    try {
      const response = await axios.patch(
        `${API_BASE_URL}/api/store/merchant/orders/${orderId}/`,
        { status: newStatus },
        { headers: getAuthHeaders() }
      );
      setOrders((prev) => prev.map((ord) => (ord.id === orderId ? { ...ord, ...response.data } : ord)));
      showSuccess(`Order #${orderId} marked as ${newStatus}.`);
    } catch (error) {
      showError(error, 'Could not update the order status.');
    } finally {
      setBusyId(null);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/secret-owner-login');
  };

  const imageSrc = (image) => {
    if (!image) return null;
    return image.startsWith('http') ? image : `${API_BASE_URL}${image}`;
  };

  // ----- order display helpers (tolerant of different field names) -----
  const orderCustomer = (o) =>
    o.customer_name ||
    o.full_name ||
    o.name ||
    o.email ||
    o.user_email ||
    (typeof o.user === 'string' ? o.user : '') ||
    '—';

  const orderTotal = (o) => {
    const value = o.total_price ?? o.total ?? o.total_amount;
    return value == null || Number.isNaN(Number(value)) ? '—' : Number(value).toFixed(2);
  };

  const orderItemsText = (o) => {
    if (!Array.isArray(o.items) || o.items.length === 0) return '—';
    return o.items
      .map((i) => `${i.title || i.product_title || i.product?.title || 'Item'} × ${i.quantity ?? 1}`)
      .join(', ');
  };

  const orderDate = (o) => {
    const raw = o.created_at || o.date;
    if (!raw) return '—';
    const d = new Date(raw);
    return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString();
  };

  // ----- calculations -----
  const total = products.length;
  const activeCount = products.filter((p) => p.is_active).length;
  const hiddenCount = total - activeCount;
  const lowStockCount = products.filter((p) => p.inventory <= LOW_STOCK_LIMIT).length;

  // ----- styles -----
  const cellStyle = { padding: '14px 20px', borderBottom: '1px solid #e2e8f0', fontSize: '14px', color: '#334155', verticalAlign: 'middle', backgroundColor: '#ffffff', textAlign: 'left' };
  const headStyle = { padding: '14px 20px', color: '#475569', fontWeight: '600', backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'left', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' };

  const miniInput = {
    width: '85px',
    padding: '8px 10px',
    border: '1px solid #cbd5e1',
    borderRadius: '6px',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
    color: '#0f172a',
    backgroundColor: '#fff',
    textAlign: 'center',
  };

  const statusDropdownStyle = {
    padding: '8px 12px',
    border: '1px solid #cbd5e1',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '600',
    backgroundColor: '#fff',
    color: '#334155',
    outline: 'none',
    cursor: 'pointer',
  };

  const btn = (bg, disabled) => ({
    padding: '8px 14px',
    backgroundColor: disabled ? '#cbd5e1' : bg,
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'background-color 0.2s',
  });

  const stockBadge = (inventory) => {
    if (inventory === 0) return { text: 'Out of stock', bg: '#fee2e2', color: '#991b1b' };
    if (inventory <= LOW_STOCK_LIMIT) return { text: 'Low stock', bg: '#fef3c7', color: '#92400e' };
    return null;
  };

  const getOrderStatusBadge = (status) => {
    switch (status) {
      case 'shipped':
        return { bg: '#e0f2fe', color: '#0369a1', text: 'Shipped' };
      case 'delivered':
        return { bg: '#dcfce7', color: '#166534', text: 'Delivered' };
      case 'cancelled':
        return { bg: '#fee2e2', color: '#991b1b', text: 'Cancelled' };
      default:
        return { bg: '#f1f5f9', color: '#475569', text: 'Pending' };
    }
  };

  const summaryBox = (label, value, color) => (
    <div key={label} style={{ flex: 1, minWidth: '160px', padding: '24px', borderRadius: '12px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)', textAlign: 'center' }}>
      <div style={{ fontSize: '32px', fontWeight: '700', color, marginBottom: '6px' }}>{value}</div>
      <div style={{ fontSize: '13px', fontWeight: '500', color: '#64748b' }}>{label}</div>
    </div>
  );

  const navItems = [
    {
      key: 'inventory',
      label: 'Product Catalog',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
          <line x1="12" y1="22.08" x2="12" y2="12" />
        </svg>
      ),
    },
    {
      key: 'orders',
      label: 'Orders & Dispatch',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="1" y="3" width="15" height="13" />
          <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
          <circle cx="5.5" cy="18.5" r="2.5" />
          <circle cx="18.5" cy="18.5" r="2.5" />
        </svg>
      ),
    },
  ];

  if (loading) {
    return (
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif', color: '#64748b', zIndex: 9999 }}>
        <h3>Syncing catalog metrics...</h3>
      </div>
    );
  }

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', display: 'flex', overflow: 'hidden', backgroundColor: '#f8fafc', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>

      {/* Sidebar */}
      <aside style={{ width: '260px', flexShrink: 0, backgroundColor: '#0f172a', color: '#f8fafc', display: 'flex', flexDirection: 'column', borderRight: '1px solid #1e293b', height: '100vh', zIndex: 100 }}>

        {/* Brand */}
        <div style={{ padding: '24px 20px', borderBottom: '1px solid #1e293b', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg, #3b82f6, #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: '700', color: '#ffffff', flexShrink: 0 }}>
            M
          </div>
          <div>
            <div style={{ fontSize: '16px', fontWeight: '700', color: '#f8fafc', lineHeight: 1.2 }}>Merchant Hub</div>
            <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>Admin Console</div>
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ padding: '20px 12px', flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', padding: '0 12px', marginBottom: '8px' }}>
            Store
          </div>

          {navItems.map((item) => {
            const isActive = activeTab === item.key;
            return (
              <button
                key={item.key}
                onClick={() => setActiveTab(item.key)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 14px',
                  textAlign: 'left',
                  border: 'none',
                  borderLeft: isActive ? '3px solid #3b82f6' : '3px solid transparent',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  backgroundColor: isActive ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                  color: isActive ? '#ffffff' : '#94a3b8',
                  outline: 'none',
                  transition: 'background-color 0.2s, color 0.2s',
                }}
              >
                {item.icon}
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Logout */}
        <div style={{ padding: '16px 12px', borderTop: '1px solid #1e293b' }}>
          <button
            onClick={handleLogout}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '12px', backgroundColor: 'transparent', color: '#cbd5e1', border: '1px solid #334155', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', outline: 'none' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Exit Secure Portal
          </button>
        </div>
      </aside>

      {/* Main data viewport */}
      <div style={{ flex: 1, minWidth: 0, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <header style={{ height: '80px', flexShrink: 0, backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 40px', zIndex: 10 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#0f172a' }}>
              {activeTab === 'inventory' ? 'Product Catalog' : 'Orders & Dispatch'}
            </h2>
          </div>

          {activeTab === 'inventory' && (
            <button onClick={() => navigate('/merchant/upload')} style={{ padding: '12px 20px', backgroundColor: '#4f46e5', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', boxShadow: '0 2px 4px rgba(79, 70, 229, 0.2)' }}>
              ➕ Add New Product
            </button>
          )}
        </header>

        <main style={{ padding: '40px', overflowY: 'auto', flex: 1 }}>

          {/* Message banner (shared by both tabs) */}
          {message && (
            <div style={{ padding: '14px 20px', backgroundColor: isError ? '#fef2f2' : '#f0fdf4', border: isError ? '1px solid #fecaca' : '1px solid #bbf7d0', borderRadius: '8px', color: isError ? '#991b1b' : '#166534', fontSize: '14px', marginBottom: '28px', fontWeight: '600', textAlign: 'center' }}>
              {message}
            </div>
          )}

          {activeTab === 'orders' ? (
            <div>
              {ordersLoadFailed && (
                <div style={{ padding: '14px 20px', backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', color: '#92400e', fontSize: '14px', marginBottom: '24px', fontWeight: '600' }}>
                  Could not load orders. Check that /api/store/merchant/orders/ exists on your server.
                </div>
              )}

              <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)', overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', margin: 0, minWidth: '950px' }}>
                  <thead>
                    <tr>
                      <th style={{ ...headStyle, width: '90px' }}>Order</th>
                      <th style={headStyle}>Customer</th>
                      <th style={headStyle}>Items</th>
                      <th style={{ ...headStyle, width: '110px' }}>Total</th>
                      <th style={{ ...headStyle, width: '120px' }}>Date</th>
                      <th style={{ ...headStyle, width: '130px' }}>Status</th>
                      <th style={{ ...headStyle, width: '170px' }}>Update Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ ...cellStyle, textAlign: 'center', color: '#64748b', padding: '40px 20px' }}>
                          No orders yet.
                        </td>
                      </tr>
                    ) : (
                      orders.map((o) => {
                        const statusBadge = getOrderStatusBadge(o.status);
                        const isBusy = busyId === `order-${o.id}`;
                        return (
                          <tr key={o.id}>
                            <td style={{ ...cellStyle, fontWeight: '600', color: '#0f172a' }}>#{o.id}</td>
                            <td style={cellStyle}>{orderCustomer(o)}</td>
                            <td style={{ ...cellStyle, maxWidth: '280px' }}>{orderItemsText(o)}</td>
                            <td style={cellStyle}>{orderTotal(o)}</td>
                            <td style={cellStyle}>{orderDate(o)}</td>
                            <td style={cellStyle}>
                              <span style={{ fontSize: '12px', fontWeight: '600', padding: '4px 10px', borderRadius: '6px', backgroundColor: statusBadge.bg, color: statusBadge.color, whiteSpace: 'nowrap' }}>
                                {statusBadge.text}
                              </span>
                            </td>
                            <td style={cellStyle}>
                              <select
                                value={o.status || 'pending'}
                                onChange={(e) => handleOrderStatusChange(o.id, e.target.value)}
                                disabled={isBusy}
                                style={{ ...statusDropdownStyle, opacity: isBusy ? 0.6 : 1 }}
                              >
                                {ORDER_STATUSES.map((s) => (
                                  <option key={s.value} value={s.value}>
                                    {s.label}
                                  </option>
                                ))}
                              </select>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div>
              {/* Summary cards */}
              <div style={{ display: 'flex', gap: '24px', marginBottom: '32px', flexWrap: 'wrap' }}>
                {summaryBox('Total Uploaded', total, '#0f172a')}
                {summaryBox('Live in Storefront', activeCount, '#16a34a')}
                {summaryBox('Hidden Items', hiddenCount, '#64748b')}
                {summaryBox('Low Stock Alerts', lowStockCount, '#dc2626')}
              </div>

              {/* Product table */}
              <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)', overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', margin: 0, minWidth: '950px' }}>
                  <thead>
                    <tr>
                      <th style={{ ...headStyle, width: '90px' }}>Media</th>
                      <th style={headStyle}>Product Details</th>
                      <th style={{ ...headStyle, width: '130px' }}>Regular Price</th>
                      <th style={{ ...headStyle, width: '130px' }}>Sale Price</th>
                      <th style={{ ...headStyle, width: '220px' }}>Available Stock</th>
                      <th style={{ ...headStyle, width: '260px', textAlign: 'center' }}>Administrative Management</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((p) => {
                      const draft = getDraft(p);
                      const dirty = isDirty(p);
                      const badge = stockBadge(Number(draft.inventory));
                      const isBusy = busyId === `product-${p.id}`;

                      return (
                        <tr key={p.id} style={{ opacity: p.is_active ? 1 : 0.55 }}>
                          <td style={cellStyle}>
                            <div style={{ width: '56px', height: '56px', backgroundColor: '#f8fafc', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              {p.image ? (
                                <img src={imageSrc(p.image)} alt={p.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              ) : (
                                <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600' }}>None</span>
                              )}
                            </div>
                          </td>
                          <td style={cellStyle}>
                            <div style={{ fontWeight: '600', color: '#0f172a', fontSize: '15px', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                              {p.title}
                              {!p.is_active && (
                                <span style={{ fontSize: '11px', fontWeight: '600', padding: '2px 8px', borderRadius: '6px', backgroundColor: '#e2e8f0', color: '#475569' }}>
                                  Hidden
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '500' }}>
                              Category: <span style={{ color: '#5469d4', fontWeight: '600' }}>{categories[p.category] || p.category}</span>
                            </div>
                          </td>
                          <td style={cellStyle}>
                            <input type="number" step="0.01" value={draft.price} onChange={(e) => handleDraftChange(p, 'price', e.target.value)} disabled={isBusy} style={miniInput} />
                          </td>
                          <td style={cellStyle}>
                            <input type="text" placeholder="None" value={draft.sale_price} onChange={(e) => handleDraftChange(p, 'sale_price', e.target.value)} disabled={isBusy} style={miniInput} />
                          </td>
                          <td style={cellStyle}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <input type="number" value={draft.inventory} onChange={(e) => handleDraftChange(p, 'inventory', e.target.value)} disabled={isBusy} style={{ ...miniInput, width: '75px' }} />
                              {badge && (
                                <span style={{ fontSize: '12px', fontWeight: '600', padding: '4px 10px', borderRadius: '6px', backgroundColor: badge.bg, color: badge.color, whiteSpace: 'nowrap' }}>
                                  {badge.text}
                                </span>
                              )}
                            </div>
                          </td>
                          <td style={{ ...cellStyle, textAlign: 'center' }}>
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                              <button onClick={() => saveProduct(p)} disabled={!dirty || isBusy} style={btn('#2563eb', !dirty || isBusy)}>
                                {isBusy ? '...' : 'Save'}
                              </button>
                              <button onClick={() => toggleActive(p)} disabled={isBusy} style={btn(p.is_active ? '#475569' : '#16a34a', isBusy)}>
                                {p.is_active ? 'Hide' : 'Activate'}
                              </button>
                              <button onClick={() => deleteProduct(p)} disabled={isBusy} style={btn('#dc2626', isBusy)}>
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default MerchantProducts;