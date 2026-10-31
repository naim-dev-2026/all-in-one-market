import React, { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';

const API_BASE_URL = 'http://127.0.0.1:8000';

const labelStyle = { display: 'block', fontSize: '14px', fontWeight: '500', color: '#4f566b', marginBottom: '6px' };
const inputStyle = { width: '100%', padding: '10px 12px', boxSizing: 'border-box', border: '1px solid #d9d9d9', borderRadius: '6px', fontSize: '14px', color: '#333', outline: 'none' };
const fieldErrorStyle = { color: '#df1b1b', margin: '4px 0 0', fontSize: '12px' };

const Login = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleForgotPassword = (e) => {
    e.preventDefault();
    alert('Password reset link feature coming soon!');
  };

  const showFieldError = (name) => {
    const err = errors[name];
    if (!err) return null;
    return <p style={fieldErrorStyle}>{Array.isArray(err) ? err.join(' ') : String(err)}</p>;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    setMessage('');
    setErrors({});
    setSubmitting(true);

    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/accounts/login/`,
        formData,
        { headers: { 'Content-Type': 'application/json' } }
      );

      const data = response.data;

      localStorage.setItem('access_token', data.access);
      localStorage.setItem('refresh_token', data.refresh);
      localStorage.setItem('user_is_staff', String(data.is_staff === true));
      localStorage.setItem('user_name', data.full_name || '');

      setIsSuccess(true);
      setMessage('Login successful!');
      setFormData({ email: '', password: '' });

      setTimeout(() => {
        if (data.is_staff === true) {
          navigate('/merchant');
        } else {
          navigate('/home');
        }
      }, 800);
    } catch (error) {
      setIsSuccess(false);
      const data = error.response?.data;
      if (data && typeof data === 'object') {
        setErrors(data);
        setMessage(
          data.detail ||
            data.non_field_errors?.[0] ||
            (error.response.status === 401 ? 'Invalid email or password.' : '')
        );
      } else if (error.response) {
        setMessage(`Server error (${error.response.status}). Please try again.`);
      } else {
        setMessage('Cannot reach the server. Ensure Django is running on port 8000.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f4f6f8', padding: '40px 20px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', color: '#333' }}>
      <div style={{ maxWidth: '400px', margin: '60px auto 0', backgroundColor: '#ffffff', borderRadius: '12px', padding: '35px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05), 0 10px 15px rgba(0, 0, 0, 0.03)', border: '1px solid #e1e4e8' }}>

        <h2 style={{ fontSize: '26px', fontWeight: '600', color: '#1a1f36', marginBottom: '8px', textAlign: 'center' }}>Sign In</h2>
        <p style={{ color: '#697386', fontSize: '14px', textAlign: 'center', marginBottom: '25px' }}>Access your customer shopping dashboard</p>

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

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label htmlFor="email" style={labelStyle}>Email Address</label>
            <input id="email" type="email" name="email" placeholder="you@example.com" value={formData.email} onChange={handleChange} required style={inputStyle} />
            {showFieldError('email')}
          </div>

          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label htmlFor="password" style={{ fontSize: '14px', fontWeight: '500', color: '#4f566b' }}>Password</label>
              <button onClick={handleForgotPassword} type="button" style={{ background: 'none', border: 'none', color: '#5469d4', fontSize: '13px', fontWeight: '500', cursor: 'pointer', padding: 0 }}>
                Forgot password?
              </button>
            </div>
            <input id="password" type="password" name="password" placeholder="••••••••" value={formData.password} onChange={handleChange} required style={inputStyle} />
            {showFieldError('password')}
          </div>

          <button
            type="submit"
            disabled={submitting}
            style={{ width: '100%', padding: '12px', backgroundColor: submitting ? '#a5b0e8' : '#5469d4', color: '#ffffff', border: 'none', borderRadius: '6px', cursor: submitting ? 'not-allowed' : 'pointer', fontWeight: '600', fontSize: '14px', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.08)', outline: 'none' }}
          >
            {submitting ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div style={{ marginTop: '25px', borderTop: '1px solid #e1e4e8', paddingTop: '15px', textAlign: 'center', fontSize: '14px', color: '#697386' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: '#5469d4', fontWeight: '500', textDecoration: 'none' }}>
            Sign up
          </Link>
        </div>

      </div>
    </div>
  );
};

export default Login;