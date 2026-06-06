import React, { useEffect, useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import './CategoriesDisplay.css';
import { MyCart } from "./CartContext";
import {FaFacebook, FaTwitter, FaInstagram} from 'react-icons/fa';
import { getApiUrl } from './apiUrl.js';

const capitalizeFirstWord = (value) => {
  if (!value || typeof value !== 'string') return "";
  const sanitized = value.trim().replace(/\s+/g, ' ');
  const [first, ...rest] = sanitized.split(' ');
  return [first.charAt(0).toUpperCase() + first.slice(1), ...rest].join(' ');
};

const CategoryDisplay = () => {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [authNotice, setAuthNotice] = useState('');
  const { myCart, setMyCart } = useContext(MyCart);
  const navigate = useNavigate();

  const apiUrl = getApiUrl();
  const customerId = localStorage.getItem('user_id');
  const [cartError, setCartError] = useState('');

  const getProductImageUrl = (productPath) => {
    const rawPath = productPath?.toString().trim();
    if (!rawPath) return '';
    return rawPath;
  };

  const loadCart = async () => {
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
    } catch (err) {
      setCartError('Could not load cart items. Please try again later.');
      setMyCart([]);
    }
  };

  useEffect(() => {
    loadCart();
  }, [customerId]);

  const placeholderImage = `data:image/svg+xml,%3Csvg width='600' height='400' xmlns='http://w3.org width='600' height='400' fill='%23333'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23f3f5f7' font-family='Poppins, sans-serif' font-size='28'%3ENo image available%3C/text%3E%3C/svg%3E`;

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch(`${apiUrl}/index.php`);
        if (!response.ok) {
          const text = await response.text();
          throw new Error(`Server error: ${response.status} ${response.statusText} ${text}`);
        }
        const data = await response.json();
        setProducts(Array.isArray(data) ? data : []);
      } catch (error) {
        setProducts([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const isProductInCart = (product) => {
    return myCart.some((item) => Number(item.product_id) === Number(product.product_id));
  };

  const isAuthenticated = () => Boolean(localStorage.getItem('user_role') && customerId);
  const isAdmin = () => localStorage.getItem('user_role')?.toLowerCase() === 'admin';

  const handleCart = async (product) => {
    if (!isAuthenticated()) {
      const proceed = window.confirm(
        'You must be logged in to add items to cart. Continue to login screen?'
      );
      if (proceed) {
        navigate('/login');
      } else {
        setAuthNotice('You cannot add items to cart until you login.');
      }
      return;
    }

    setCartError('');

    try {
      const formData = new FormData();
      formData.append('customer_id', customerId);
      formData.append('product_id', product.product_id);
      formData.append('quantity', 1);

      const response = await fetch(`${apiUrl}/add_to_cart.php`, {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();

      if (data.status === 'success') {
        await loadCart();
      } else {
        setCartError(data.message || 'Unable to add product to cart.');
      }
    } catch (err) {
      setCartError('Unable to add item to cart. Please try again.');
    }
  };

  return (
    <div className="categories-container">
      <div className="categories-header">
        <h1 className="category-title">PRODUCTS</h1>
        <div className="category-actions">
          <Link to="/MyCart"><button className="btn btn-primary">My Cart</button></Link>
          {isAdmin() && (
            <Link to="/upload"><button className="btn btn-secondary">Add Product</button></Link>
          )}
        </div>
      </div>
      {!isAuthenticated() && (
        <div className="guest-cta">
          <p>Sign up or login to enjoy our services and save items to your cart.</p>
          <div className="guest-cta-buttons">
            <Link to="/register" className="btn btn-secondary">Sign Up</Link>
            <Link to="/login" className="btn btn-primary">Log In</Link>
          </div>
        </div>
      )}
      {authNotice && <div className="auth-notice">{authNotice}</div>}
      {cartError && <div className="error-message">{cartError}</div>}
      {isLoading ? (
        <ul className="products-grid skeleton-grid" aria-busy="true" aria-label="Loading products">
          {Array.from({ length: 6 }).map((_, index) => (
            <li className="product-item skeleton-card" key={`skeleton-${index}`}>
              <div className="skeleton-image" />
              <div className="skeleton-line short" />
              <div className="skeleton-line medium" />
              <div className="skeleton-line" />
              <div className="product-footer">
                <div className="skeleton-line tiny" />
                <div className="skeleton-line button" />
              </div>
            </li>
          ))}
        </ul>
      ) : products.length > 0 ? (
        <ul className="products-grid">
          {products.map((product, index) => {
            const imageUrl = getProductImageUrl(product.product_path);
            return (
              <li className="product-item" key={product.product_name || product.product_path || index}>
                <img
                  className="img"
                  loading="lazy"
                  src={imageUrl || placeholderImage}
                  alt={product.product_name || 'Product image'}
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = placeholderImage;
                  }}
                />
                <h2 className="product-name">{capitalizeFirstWord(product.product_name || product.name || 'Unnamed product')}</h2>
                <p className="product-description">{product.description}</p>
                <div className="product-footer">
                  <span className="product-price">Kshs. {product.price}</span>
                  <button
                    className="add-to-cart"
                    onClick={() => handleCart(product)}
                    disabled={isProductInCart(product)}
                  >
                    {isProductInCart(product) ? '✓ Added' : 'Add to Cart'}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="no-results">No products found. Please check back later.</div>
      )}
      <div className="categories-footer">
        <hr className="footer-divider" />
        <p>Follow us on our social media platforms</p>
        <div className="social-icons">
          <a href="https://www.facebook.com/Joe Dickson" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
            <FaFacebook className="social-icon" />
          </a>
          <a href="https://www.twitter.com/@DicksonAbisai" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
            <FaTwitter className="social-icon" />
          </a>
          <a href="https://www.instagram.com/abisai.dickson" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
            <FaInstagram className="social-icon" />
          </a>
        </div>
        <p>&copy; {new Date().getFullYear()} Hotel Management System. All rights reserved.</p>
      </div>
    </div>
  );
}

export default CategoryDisplay;
