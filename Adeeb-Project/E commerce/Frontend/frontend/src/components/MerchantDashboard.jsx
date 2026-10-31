import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

const API_BASE_URL = 'http://127.0.0.1:8000';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB

const labelStyle = {
  display: 'block',
  fontSize: '14px',
  fontWeight: '500',
  color: '#4f566b',
  marginBottom: '6px',
};

const inputStyle = {
  width: '100%',
  padding: '10px 12px',
  boxSizing: 'border-box',
  border: '1px solid #d9d9d9',
  borderRadius: '6px',
  fontSize: '14px',
  color: '#333',
  backgroundColor: '#fff',
  outline: 'none',
};

const errorStyle = { color: '#df1b1b', margin: '4px 0 0', fontSize: '12px' };
const fieldWrap = { marginBottom: '18px' };

const initialForm = {
  category: '',
  title: '',
  description: '',
  price: '',
  sale_price: '',
  inventory: '1',
};

const MerchantDashboard = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(initialForm);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [categories, setCategories] = useState([]);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(true);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // New category state
  const [newCategory, setNewCategory] = useState('');
  const [categoryError, setCategoryError] = useState('');
  const [addingCategory, setAddingCategory] = useState(false);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('access_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/store/categories/`, {
          headers: getAuthHeaders(),
        });
        const list = Array.isArray(response.data)
          ? response.data
          : response.data.results || [];
        setCategories(list);
        if (list.length > 0) {
          setFormData((prev) => ({ ...prev, category: list[0].id }));
        }
      } catch (err) {
        console.error('Failed to retrieve product categories.', err);
        setIsSuccess(false);
        setMessage(
          err.response?.status === 401
            ? 'Your session expired. Please log in again.'
            : 'Could not load categories. Check that the server is running.'
        );
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/secret-owner-login');
  };

  // Create a new category from this page
  const handleAddCategory = async () => {
    const name = newCategory.trim();
    if (!name || addingCategory) return;

    setCategoryError('');
    setAddingCategory(true);
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/store/categories/`,
        { name },
        { headers: getAuthHeaders() }
      );
      const created = response.data;
      setCategories((prev) => [...prev, created]);
      setFormData((prev) => ({ ...prev, category: created.id }));
      setNewCategory('');
      setIsSuccess(true);
      setMessage(`Category "${created.name}" created.`);
    } catch (error) {
      const data = error.response?.data;
      if (data?.name) {
        setCategoryError(Array.isArray(data.name) ? data.name.join(' ') : String(data.name));
      } else if (data?.detail) {
        setCategoryError(data.detail);
      } else {
        setCategoryError('Could not create category. Please try again.');
      }
    } finally {
      setAddingCategory(false);
    }
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
    const fileInput = document.getElementById('product-image-input');
    if (fileInput) fileInput.value = '';
  };

  const handleFileChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) {
      clearImage();
      return;
    }
    if (!file.type.startsWith('image/')) {
      setErrors((prev) => ({ ...prev, image: 'Please choose an image file.' }));
      clearImage();
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setErrors((prev) => ({ ...prev, image: 'Image must be smaller than 5 MB.' }));
      clearImage();
      return;
    }
    setErrors((prev) => ({ ...prev, image: undefined }));
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const fieldError = (name) => {
    const err = errors[name];
    if (!err) return null;
    return <p style={errorStyle}>{Array.isArray(err) ? err.join(' ') : String(err)}</p>;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    setMessage('');
    setErrors({});

    if (
      formData.sale_price &&
      Number(formData.sale_price) >= Number(formData.price)
    ) {
      setIsSuccess(false);
      setErrors({ sale_price: 'Sale price must be lower than the regular price.' });
      return;
    }

    const dataPayload = new FormData();
    dataPayload.append('category', formData.category);
    dataPayload.append('title', formData.title);
    dataPayload.append('description', formData.description);
    dataPayload.append('price', formData.price);
    dataPayload.append('inventory', formData.inventory);
    dataPayload.append('is_active', 'true'); // new products are visible to customers
    if (formData.sale_price) dataPayload.append('sale_price', formData.sale_price);
    if (imageFile) dataPayload.append('image', imageFile);

    setSubmitting(true);
    try {
      await axios.post(`${API_BASE_URL}/api/store/products/`, dataPayload, {
        headers: getAuthHeaders(),
      });

      // Go to the products list and show a success message there
      navigate('/merchant/products', {
        state: { message: 'Product successfully added to your inventory!' },
      });
    } catch (error) {
      setIsSuccess(false);
      const data = error.response?.data;
      if (error.response?.status === 401) {
        setMessage('Your session expired. Please log in again.');
      } else if (data && typeof data === 'object') {
        setErrors(data);
        setMessage(
          data.detail ||
            data.non_field_errors?.[0] ||
            'Please fix the highlighted fields.'
        );
      } else if (error.response) {
        setMessage(`Server error (${error.response.status}). Please try again.`);
      } else {
        setMessage(
          'Cannot reach the server. Check that Django is running and CORS is configured.'
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#f4f6f8',
        padding: '40px 20px',
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        color: '#333',
      }}
    >
      <div
        style={{
          maxWidth: '520px',
          margin: '0 auto',
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          padding: '35px',
          boxShadow:
            '0 4px 6px rgba(0, 0, 0, 0.05), 0 10px 15px rgba(0, 0, 0, 0.03)',
          border: '1px solid #e1e4e8',
        }}
      >
        <h2
          style={{
            fontSize: '26px',
            fontWeight: '600',
            color: '#1a1f36',
            marginBottom: '8px',
            textAlign: 'center',
          }}
        >
          Merchant Inventory Control
        </h2>
        <p
          style={{
            color: '#697386',
            fontSize: '14px',
            textAlign: 'center',
            marginBottom: '12px',
          }}
        >
          Upload and manage item listings on your platform
        </p>

        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <Link
            to="/merchant/products"
            style={{
              fontSize: '14px',
              color: '#5469d4',
              textDecoration: 'none',
              fontWeight: '600',
            }}
          >
            View my products &rarr;
          </Link>
        </div>

        {message && (
          <div
            role="alert"
            style={{
              padding: '12px',
              backgroundColor: isSuccess ? '#edf7ed' : '#fde8e8',
              border: isSuccess ? '1px solid #c3e6cb' : '1px solid #f8b4b4',
              borderRadius: '6px',
              color: isSuccess ? '#1e4620' : '#9b1c1c',
              fontSize: '14px',
              marginBottom: '20px',
              fontWeight: '500',
              textAlign: 'center',
            }}
          >
            {message}
          </div>
        )}

        {/* Add New Category */}
        <div
          style={{
            padding: '16px',
            backgroundColor: '#f8f9fc',
            border: '1px solid #e1e4e8',
            borderRadius: '8px',
            marginBottom: '24px',
          }}
        >
          <label htmlFor="new-category" style={labelStyle}>
            Add New Category
          </label>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              id="new-category"
              type="text"
              placeholder="e.g. Electronics"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddCategory();
                }
              }}
              style={{ ...inputStyle, flex: 1 }}
            />
            <button
              type="button"
              onClick={handleAddCategory}
              disabled={addingCategory || !newCategory.trim()}
              style={{
                padding: '10px 16px',
                backgroundColor:
                  addingCategory || !newCategory.trim() ? '#a5b0e8' : '#5469d4',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '600',
                cursor:
                  addingCategory || !newCategory.trim() ? 'not-allowed' : 'pointer',
              }}
            >
              {addingCategory ? 'Adding...' : 'Add'}
            </button>
          </div>
          {categoryError && <p style={errorStyle}>{categoryError}</p>}
        </div>

        <form onSubmit={handleSubmit}>
          {/* Category */}
          <div style={fieldWrap}>
            <label htmlFor="category" style={labelStyle}>
              Assigned Category *
            </label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              required
              style={inputStyle}
            >
              {categories.length === 0 ? (
                <option value="">No categories yet. Add one above.</option>
              ) : (
                categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))
              )}
            </select>
            {fieldError('category')}
          </div>

          {/* Title */}
          <div style={fieldWrap}>
            <label htmlFor="title" style={labelStyle}>
              Product Title *
            </label>
            <input
              id="title"
              type="text"
              name="title"
              placeholder="e.g. Ergonomic Office Chair"
              value={formData.title}
              onChange={handleInputChange}
              required
              style={inputStyle}
            />
            {fieldError('title')}
          </div>

          {/* Description */}
          <div style={fieldWrap}>
            <label htmlFor="description" style={labelStyle}>
              Item Description
            </label>
            <textarea
              id="description"
              name="description"
              placeholder="Provide operational features, sizes, material parameters..."
              value={formData.description}
              onChange={handleInputChange}
              style={{ ...inputStyle, height: '70px', resize: 'none' }}
            />
            {fieldError('description')}
          </div>

          {/* Prices */}
          <div style={{ display: 'flex', gap: '16px', marginBottom: '18px' }}>
            <div style={{ flex: 1 }}>
              <label htmlFor="price" style={labelStyle}>
                Price ($) *
              </label>
              <input
                id="price"
                type="number"
                step="0.01"
                min="0"
                name="price"
                placeholder="89.99"
                value={formData.price}
                onChange={handleInputChange}
                required
                style={inputStyle}
              />
              {fieldError('price')}
            </div>
            <div style={{ flex: 1 }}>
              <label htmlFor="sale_price" style={labelStyle}>
                Sale Price ($)
              </label>
              <input
                id="sale_price"
                type="number"
                step="0.01"
                min="0"
                name="sale_price"
                placeholder="69.99"
                value={formData.sale_price}
                onChange={handleInputChange}
                style={inputStyle}
              />
              {fieldError('sale_price')}
            </div>
          </div>

          {/* Inventory */}
          <div style={fieldWrap}>
            <label htmlFor="inventory" style={labelStyle}>
              Warehouse Stock Quantity *
            </label>
            <input
              id="inventory"
              type="number"
              step="1"
              min="0"
              name="inventory"
              value={formData.inventory}
              onChange={handleInputChange}
              required
              style={inputStyle}
            />
            {fieldError('inventory')}
          </div>

          {/* Image */}
          <div style={{ marginBottom: '25px' }}>
            <label htmlFor="product-image-input" style={labelStyle}>
              Product Image Showcase
            </label>
            <input
              id="product-image-input"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              style={{ width: '100%', fontSize: '14px', color: '#697386' }}
            />
            {fieldError('image')}
            {imagePreview && (
              <div style={{ marginTop: '12px', textAlign: 'center' }}>
                <img
                  src={imagePreview}
                  alt="Selected product preview"
                  style={{
                    maxWidth: '100%',
                    maxHeight: '180px',
                    borderRadius: '6px',
                    border: '1px solid #e1e4e8',
                  }}
                />
                <div>
                  <button
                    type="button"
                    onClick={clearImage}
                    style={{
                      marginTop: '8px',
                      background: 'none',
                      border: 'none',
                      color: '#5469d4',
                      fontSize: '13px',
                      cursor: 'pointer',
                    }}
                  >
                    Remove image
                  </button>
                </div>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: submitting ? '#a5b0e8' : '#5469d4',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: submitting ? 'not-allowed' : 'pointer',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.08)',
              transition: 'background-color 0.15s ease',
            }}
          >
            {submitting ? 'Publishing...' : 'Publish Product Listing'}
          </button>

          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <button
              type="button"
              onClick={handleLogout}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '14px',
                color: '#5469d4',
                cursor: 'pointer',
              }}
            >
              Log out
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MerchantDashboard;