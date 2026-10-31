import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import apiClient from '../api/client';

const MerchantLogin = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setIsError(false);
    setErrors({});

    try {
      const response = await apiClient.post('/api/accounts/login/', formData);
      const isStaffUser = response.data.is_staff;

      if (!isStaffUser || String(isStaffUser) !== 'true') {
        setIsError(true);
        setMessage('Access Denied: Restricted to store owners and system administrators.');
        localStorage.clear();
        return;
      }

      // Remove any old customer session before saving the owner's data
      localStorage.clear();

      localStorage.setItem('access_token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);
      localStorage.setItem('user_is_staff', 'true');
      localStorage.setItem('user_name', response.data.full_name || 'Administrator');

      setIsError(false);
      setMessage('Administrative authentication verified! Entering console...');
      
      setTimeout(() => {
        navigate('/merchant');
      }, 1000);

    } catch (error) {
      setIsError(true);
      if (error.response && error.response.data) {
        setErrors(error.response.data);
      } else {
        setMessage('Connection timed out. Verify your backend is running.');
      }
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0f172a', padding: '40px 20px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', color: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: '400px', backgroundColor: '#1e293b', borderRadius: '12px', padding: '40px 35px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)', border: '1px solid #334155' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <span style={{ fontSize: '32px' }}>🛡️</span>
          <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#f1f5f9', marginTop: '12px' }}>Merchant Console</h2>
          <p style={{ color: '#94a3b8', fontSize: '13px' }}>Authorized administrative credentials required</p>
        </div>

        {message && (
          <div style={{ padding: '12px', backgroundColor: isError ? '#7f1d1d' : '#064e3b', borderRadius: '6px', color: isError ? '#fca5a5' : '#a7f3d0', fontSize: '13px', marginBottom: '20px', textAlign: 'center' }}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '18px' }}>
            <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '6px' }}>Admin Email Address</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} required style={{ width: '100%', padding: '10px 14px', boxSizing: 'border-box', border: '1px solid #334155', borderRadius: '6px', color: '#fff', backgroundColor: '#0f172a', outline: 'none' }} />
          </div>

          <div style={{ marginBottom: '26px' }}>
            <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '6px' }}>Security Password</label>
            <input type="password" name="password" value={formData.password} onChange={handleChange} required style={{ width: '100%', padding: '10px 14px', boxSizing: 'border-box', border: '1px solid #334155', borderRadius: '6px', color: '#fff', backgroundColor: '#0f172a', outline: 'none' }} />
          </div>

          <button type="submit" style={{ width: '100%', padding: '12px', backgroundColor: '#3b82f6', color: '#ffffff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>
            Authenticate & Open Console
          </button>
        </form>
      </div>
    </div>
  );
};

export default MerchantLogin;