import React, { useEffect, useState, useContext } from "react";
import './CategoriesDisplay.css';
import { Link } from "react-router-dom";
import { MyCart } from "./CartContext";

const capitalizeFirstWord = (value) => {
  if (!value || typeof value !== 'string') return "";
  const sanitized = value.trim().replace(/\s+/g, ' ');
  const [first, ...rest] = sanitized.split(' ');
  return [first.charAt(0).toUpperCase() + first.slice(1), ...rest].join(' ');
};

const CategoryDisplay = () => {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { myCart, setMyCart } = useContext(MyCart);
  const [itemsToDelete, setItemsToDelete] = useState([]);

  const rawApiUrl = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.trim().replace(/\/+$/, '') : 'https://fivestarhotel.rf.gd/api';
  const apiUrl = rawApiUrl;
  const baseUrl = import.meta.env.BASE_URL || '/';
  const imageBaseUrl = rawApiUrl.replace(/\/api$/, '');

  const getProductImageUrl = (productPath) => {
    const rawPath = productPath?.toString().trim();
    if (!rawPath) {
      return '';
    }

    const normalizedPath = rawPath.replace(/\\/g, '/');

    if (/^https?:\/\//i.test(normalizedPath)) {
      return normalizedPath;
    }

    if (normalizedPath.startsWith('/')) {
      return `${baseUrl}${normalizedPath.replace(/^\/+/, '')}`;
    }

    if (/^uploads\//i.test(normalizedPath)) {
      return `${baseUrl}${normalizedPath.replace(/^\/+/, '')}`;
    }

    return `${baseUrl}uploads/products/${encodeURIComponent(normalizedPath)}`;
  };

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || '/api';
        const response = await fetch(`${apiUrl}/index.php`);
        const data = await response.json();
        setProducts(data);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const isProductInCart = (product) => {
  return myCart.some(
    (item) => item.product_name === product.product_name && item.price === product.price
  );
};

const handleCart = (product) => {
  const newProduct = {
    product_name: product.product_name,
    description: product.description,
    price: product.price,
    product_path: getProductImageUrl(product.product_path),
    quantity: 1,
  };

  setMyCart((prevCart = []) => {
    const exists = prevCart.some(
      (item) => item.product_name === newProduct.product_name && item.price === newProduct.price
    );

    if (exists) {
      return prevCart;
    }

    const updatedCart = [...prevCart, newProduct];
    console.log("Updated Cart:", updatedCart);
    return updatedCart;
  });
};

  return (
    <div className="categories-container">
      <div className="categories-header">
        <h1 className="category-title">PRODUCTS</h1>
        <div className="category-actions">
          <Link to="/MyCart"><button className="btn btn-primary">My Cart</button></Link>
          <Link to="/"><button className="btn btn-secondary">Add Product</button></Link>
        </div>
      </div>
      {isLoading ? (
        <div className="loading">Loading products...</div>
      ) : (
        <ul className="products-grid">
          {products.map((product, index) => {
            const imageUrl = getProductImageUrl(product.product_path);
            return (
              <li className="product-item" key={product.product_name || product.product_path || index}>
                <img
                  className="img"
                  loading="lazy"
                  src={imageUrl || `${baseUrl}projectpics/lightmode.png`}
                  alt={product.product_name || 'Product image'}
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = `${baseUrl}projectpics/lightmode.png`;
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
      )}
    </div>
  );
};

export default CategoryDisplay;
