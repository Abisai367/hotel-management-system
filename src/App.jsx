import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import UploadCategories from './UploadCategories.jsx';
import CategoriesDisplay from './CategoriesDisplay.jsx';
import Sidebar from './sidebar.jsx';
import Mycart from './Mycart.jsx';
import { MyCart } from './CartContext';
import './App.css';

function App() {
  const [myCart, setMyCart] = useState(() => {
    const savedCart = localStorage.getItem('myCart');
    return savedCart ? JSON.parse(savedCart) : [];
  });

  useEffect(() => {
    localStorage.setItem('myCart', JSON.stringify(myCart));
  }, [myCart]);

  return (
    <MyCart.Provider value={{ myCart, setMyCart }}>
      <Router>
        <div className="app-layout">
          <Sidebar />
          <main className="main-content">
            <Routes>
              <Route path="/upload" element={<UploadCategories />} />
              <Route path="/" element={<CategoriesDisplay />} />
              <Route path="/MyCart" element={<Mycart />} />
              <Route path="/categories" element={<CategoriesDisplay />} />
            </Routes>
          </main>
        </div>
      </Router>
    </MyCart.Provider>
  );
}

export default App;
