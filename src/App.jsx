import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import UploadCategories from './UploadCategories.jsx';
import CategoriesDisplay from './CategoriesDisplay.jsx';
import Sidebar from './sidebar.jsx';
import Mycart from './Mycart.jsx';
import Login from './Login.jsx';
import SignUp from './SignUp.jsx';
import AddEmployee from './AddEmployee.jsx';
import AdminDashboard from './AdminDashboard.jsx';
import ManageEmployees from './ManageEmployees.jsx';
import ChatRoom from './ChatRoom.jsx';
import ErrorScreen from './ErrorScreen.jsx';
import { MyCart } from './CartContext';
import { getApiUrl } from './apiUrl.js';
import './App.css';

function App() {
  const [myCart, setMyCart] = useState([]);
  const [auth, setAuth] = useState(() => !!localStorage.getItem('user_role'));
  const [loading, setLoading] = useState(false);
  const [roleLoaded, setRoleLoaded] = useState(!!localStorage.getItem('user_role'));
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const maxRetries = 15;
  const apiUrl = getApiUrl();

  const loadUserCart = async () => {
    const customerId = localStorage.getItem('user_id');
    if (!customerId) {
      setMyCart([]);
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/fetch_cart.php?customer_id=${customerId}`);
      const data = await response.json();
      if (data.status === 'success' && Array.isArray(data.cart)) {
        setMyCart(data.cart);
      } else {
        setMyCart([]);
      }
    } catch (error) {
      setMyCart([]);
    }
  };

  useEffect(() => {
    const onAuthChange = () => {
      const role = localStorage.getItem('user_role');
      const hasRole = Boolean(role && role.trim());
      setAuth(hasRole);
      setRoleLoaded(hasRole);
      if (!hasRole) {
        setLoading(false);
        setMyCart([]);
        return;
      }
      setLoading(true);

      let attempts = 0;
      const roleCheckInterval = setInterval(() => {
        const currentRole = localStorage.getItem('user_role');
        if (currentRole && currentRole.trim()) {
          setRoleLoaded(true);
          setLoading(false);
          clearInterval(roleCheckInterval);
        } else if (attempts >= maxRetries) {
          setLoading(false);
          clearInterval(roleCheckInterval);
        }
        attempts++;
      }, 200);
    };
    window.addEventListener('authchange', onAuthChange);
    return () => window.removeEventListener('authchange', onAuthChange);
  }, []);

  useEffect(() => {
    if (auth) {
      loadUserCart();
    } else {
      setMyCart([]);
    }
  }, [auth]);

  useEffect(() => {
    if (auth && !roleLoaded) {
      setLoading(true);
      let attempts = 0;
      const interval = setInterval(() => {
        const role = localStorage.getItem('user_role');
        if (role && role.trim()) {
          setRoleLoaded(true);
          setLoading(false);
          clearInterval(interval);
        } else if (attempts >= maxRetries) {
          setLoading(false);
          clearInterval(interval);
        }
        attempts++;
      }, 200);
      return () => clearInterval(interval);
    }
  }, [auth, roleLoaded]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const isAuthenticated = () => auth && roleLoaded;
  const isAdminOrEmployee = () => {
    const role = localStorage.getItem('user_role');
    return role === 'Admin' || role === 'admin' || role === 'Employee' || role === 'Supervisor';
  };
  const isStrictAdmin = () => {
    const role = localStorage.getItem('user_role');
    return role === 'Admin' || role === 'admin';
  };

  return (
    <MyCart.Provider value={{ myCart, setMyCart }}>
      <Router>
        {(loading || (auth && !roleLoaded)) ? (
          <div className="app-loading-screen">
            <div className="loading-spinner"></div>
            <p className="loading-text">Loading your privileges...</p>
          </div>
        ) : (
          <div className="app-layout">
            {isAuthenticated() && <Sidebar />}
            <main className="main-content">
            {!isOnline && (
              <div className="network-status-banner">
                No internet connection. Some features may be limited.
              </div>
            )}
            <Routes>
              <Route path="/login" element={!isAuthenticated() ? <Login /> : <Navigate to="/categories" replace />} />
              <Route path="/register" element={!isAuthenticated() ? <SignUp /> : <Navigate to="/categories" replace />} />
              <Route path="/" element={<Navigate to="/categories" replace />} />
              <Route path="/categories" element={<CategoriesDisplay />} />
              <Route path="/MyCart" element={<Mycart />} />
              <Route 
                path="/upload" 
                element={isAuthenticated() && isStrictAdmin() ? <UploadCategories /> : <Navigate to="/login" />} 
              />
              <Route 
                path="/admin" 
                element={isAuthenticated() && isStrictAdmin() ? <AdminDashboard /> : <Navigate to="/login" />} 
              />
              <Route 
                path="/add-employee" 
                element={isAuthenticated() && isStrictAdmin() ? <AddEmployee /> : <Navigate to="/login" />} 
              />
              <Route 
                path="/manage-employees" 
                element={isAuthenticated() && isStrictAdmin() ? <ManageEmployees /> : <Navigate to="/login" />} 
              />
              <Route path="/messages" element={isAuthenticated() ? <ChatRoom /> : <Navigate to="/login" />} />
              <Route path="/service-unavailable" element={<ErrorScreen code={503} />} />
              <Route path="*" element={<ErrorScreen code={404} />} />
            </Routes>
          </main>
          </div>
        )}
      </Router>
    </MyCart.Provider>
  );
}

export default App;
