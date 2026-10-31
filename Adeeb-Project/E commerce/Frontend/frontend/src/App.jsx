import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import Home from './components/Home';
import MerchantProducts from './components/MerchantProducts';
import Checkout from './components/Checkout'; // 🚀 IMPORTED THE NEW CHECKOUT PIECE

// 🔒 ROUTE GUARD LAYER: Redirects non-authenticated users instantly back to login
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('access_token');
  return token ? children : <Navigate to="/login" replace />;
};

// 🔒 OWNER GUARD LAYER: Prevents regular customers from hacking into the admin portal
const StaffRoute = ({ children }) => {
  const token = localStorage.getItem('access_token');
  const isStaff = localStorage.getItem('user_is_staff') === 'true';
  return token && isStaff ? children : <Navigate to="/home" replace />;
};

const App = () => {
  return (
    <Router>
      <Routes>
        {/* Public Authentication Paths */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* 🛍️ Secure Customer Storefront Path */}
        <Route 
          path="/home" 
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          } 
        />

        {/* 💳 Secure Checkout Invoice Path */}
        <Route 
          path="/checkout" 
          element={
            <ProtectedRoute>
              <Checkout />
            </ProtectedRoute>
          } 
        />

        {/* 🛡️ Secure Restricted Merchant Dashboard Console */}
        <Route 
          path="/merchant" 
          element={
            <StaffRoute>
              <MerchantProducts />
            </StaffRoute>
          } 
        />

        {/* Catch-all Routing Rule */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
};

export default App;
