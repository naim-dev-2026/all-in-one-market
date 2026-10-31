import React, { useState } from 'react';
import apiClient from '../api/client';

const Register = () => {
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    phone_number: '',
    address: '',
    birth_year: '',
    password: '',
    password_confirm: '',
    has_agreed_to_terms: false,
  });

  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setIsError(false);
    setErrors({});

    try {
      // Django mounts the accounts app under api/accounts/ (see main urls.py).
      const response = await apiClient.post('/api/accounts/register/', formData);

      setMessage(response.data.message || 'Registration successful!');
      setFormData({
        email: '',
        full_name: '',
        phone_number: '',
        address: '',
        birth_year: '',
        password: '',
        password_confirm: '',
        has_agreed_to_terms: false,
      });
    } catch (error) {
      setIsError(true);
      if (error.response && error.response.data) {
        setErrors(error.response.data);
        if (error.response.status === 404) {
          setMessage('Register URL not found (404). Check the path in Django urls.py.');
        }
      } else {
        setMessage('Something went wrong. Please check your connection.');
      }
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f4f6f8', padding: '40px 20px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', color: '#333' }}>
      <div style={{ maxWidth: '480px', margin: '0 auto', backgroundColor: '#ffffff', borderRadius: '12px', padding: '35px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05), 0 10px 15px rgba(0, 0, 0, 0.03)', border: '1px solid #e1e4e8' }}>

        <h2 style={{ fontSize: '26px', fontWeight: '600', color: '#1a1f36', marginBottom: '8px', textAlign: 'center' }}>Create Account</h2>
        <p style={{ color: '#697386', fontSize: '14px', textAlign: 'center', marginBottom: '25px' }}>Get started with your shopping profile</p>

        {message && (
          <div
            style={{
              padding: '12px',
              backgroundColor: isError ? '#fdecea' : '#edf7ed',
              border: isError ? '1px solid #f5c6cb' : '1px solid #c3e6cb',
              borderRadius: '6px',
              color: isError ? '#7a1f1f' : '#1e4620',
              fontSize: '14px',
              marginBottom: '20px',
              fontWeight: '500',
            }}
          >
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Full Name */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#4f566b', marginBottom: '6px' }}>Full Name *</label>
            <input type="text" name="full_name" placeholder="John Doe" value={formData.full_name} onChange={handleChange} required style={{ width: '100%', padding: '10px 12px', boxSizing: 'border-box', border: '1px solid #d9d9d9', borderRadius: '6px', fontSize: '14px', color: '#333', outline: 'none' }} />
            {errors.full_name && <p style={{ color: '#df1b1b', margin: '4px 0 0', fontSize: '12px' }}>{errors.full_name}</p>}
          </div>

          {/* Email */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#4f566b', marginBottom: '6px' }}>Email Address *</label>
            <input type="email" name="email" placeholder="you@example.com" value={formData.email} onChange={handleChange} required style={{ width: '100%', padding: '10px 12px', boxSizing: 'border-box', border: '1px solid #d9d9d9', borderRadius: '6px', fontSize: '14px', color: '#333', outline: 'none' }} />
            {errors.email && <p style={{ color: '#df1b1b', margin: '4px 0 0', fontSize: '12px' }}>{errors.email}</p>}
          </div>

          {/* Phone Number */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#4f566b', marginBottom: '6px' }}>Phone Number</label>
            <input type="text" name="phone_number" placeholder="+1 (555) 000-0000" value={formData.phone_number} onChange={handleChange} style={{ width: '100%', padding: '10px 12px', boxSizing: 'border-box', border: '1px solid #d9d9d9', borderRadius: '6px', fontSize: '14px', color: '#333', outline: 'none' }} />
          </div>

          {/* Delivery Address */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#4f566b', marginBottom: '6px' }}>Delivery Address</label>
            <textarea name="address" placeholder="123 Street, City, Country" value={formData.address} onChange={handleChange} style={{ width: '100%', padding: '10px 12px', boxSizing: 'border-box', border: '1px solid #d9d9d9', borderRadius: '6px', fontSize: '14px', color: '#333', outline: 'none', height: '60px', resize: 'none' }} />
          </div>

          {/* Birth Year */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#4f566b', marginBottom: '6px' }}>Birth Year</label>
            <input type="number" name="birth_year" placeholder="e.g. 1995" value={formData.birth_year} onChange={handleChange} style={{ width: '100%', padding: '10px 12px', boxSizing: 'border-box', border: '1px solid #d9d9d9', borderRadius: '6px', fontSize: '14px', color: '#333', outline: 'none' }} />
          </div>

          {/* Password */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#4f566b', marginBottom: '6px' }}>Password *</label>
            <input type="password" name="password" placeholder="••••••••" value={formData.password} onChange={handleChange} required style={{ width: '100%', padding: '10px 12px', boxSizing: 'border-box', border: '1px solid #d9d9d9', borderRadius: '6px', fontSize: '14px', color: '#333', outline: 'none' }} />
            {errors.password && <p style={{ color: '#df1b1b', margin: '4px 0 0', fontSize: '12px' }}>{errors.password}</p>}
          </div>

          {/* Confirm Password */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#4f566b', marginBottom: '6px' }}>Confirm Password *</label>
            <input type="password" name="password_confirm" placeholder="••••••••" value={formData.password_confirm} onChange={handleChange} required style={{ width: '100%', padding: '10px 12px', boxSizing: 'border-box', border: '1px solid #d9d9d9', borderRadius: '6px', fontSize: '14px', color: '#333', outline: 'none' }} />
            {errors.password_confirm && <p style={{ color: '#df1b1b', margin: '4px 0 0', fontSize: '12px' }}>{errors.password_confirm}</p>}
          </div>

          {/* Terms Checkbox */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'flex', alignItems: 'center', fontSize: '14px', color: '#4f566b', cursor: 'pointer' }}>
              <input type="checkbox" name="has_agreed_to_terms" checked={formData.has_agreed_to_terms} onChange={handleChange} style={{ marginRight: '10px', width: '16px', height: '16px', cursor: 'pointer' }} />
              I agree to the Terms & Conditions *
            </label>
            {errors.has_agreed_to_terms && <p style={{ color: '#df1b1b', margin: '4px 0 0', fontSize: '12px' }}>{errors.has_agreed_to_terms}</p>}
          </div>

          {/* Sign Up Button */}
          <button type="submit" style={{ width: '100%', padding: '12px', backgroundColor: '#5469d4', color: '#ffffff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '14px', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.08)', outline: 'none' }}>
            Sign Up
          </button>
        </form>

        <div style={{ marginTop: '20px', borderTop: '1px solid #e1e4e8', paddingTop: '15px', textAlign: 'center', fontSize: '14px', color: '#697386' }}>
          Already have an account? <span style={{ color: '#5469d4', fontWeight: '500', cursor: 'pointer' }}>Sign in</span>
        </div>

      </div>
    </div>
  );
};

export default Register;