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
    if (!rawPath) return '';

    const normalized = rawPath.replace(/\\/g, '/');
    // Build a list of likely candidate URLs. We will try these in order on image errors.
    const candidates = [];

    // If it's already an absolute URL, prefer it first
    if (/^https?:\/\//i.test(normalized)) {
      candidates.push(normalized);
      return candidates[0];
    }

    // If it starts with a slash, assume it's root-relative
    if (normalized.startsWith('/')) {
      candidates.push(`${baseUrl}${normalized.replace(/^\/+/, '')}`);
    }

    // If server already returns uploads/ path, use it directly
    if (/^uploads\//i.test(normalized)) {
      candidates.push(`${baseUrl}${normalized.replace(/^\/+/, '')}`);
    }

    // Common server location for stored product images
    candidates.push(`${baseUrl}uploads/products/${encodeURIComponent(normalized)}`);

    // Also try using the raw filename under uploads (in case server stores differently)
    candidates.push(`${baseUrl}uploads/${encodeURIComponent(normalized)}`);

    // Return the first candidate by default; the <img> onError will try the others.
    return candidates[0] || '';
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
          <Link to="/upload"><button className="btn btn-secondary">Add Product</button></Link>
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
                    const src = e.currentTarget.src || '';
                    // If the src already equals the fallback logo, don't loop
                    const fallback = `${baseUrl}projectpics/lightmode.png`;
                    if (src === fallback) return;

                    // If our getProductImageUrl returned a single string, try alternate paths
                    const candidates = [];
                    const rawPath = (product.product_path || '').toString().trim();
                    if (rawPath) {
                      const normalized = rawPath.replace(/\\/g, '/');
                      if (!/^https?:\/\//i.test(normalized)) {
                        if (normalized.startsWith('/')) candidates.push(`${baseUrl}${normalized.replace(/^\/+/, '')}`);
                        if (/^uploads\//i.test(normalized)) candidates.push(`${baseUrl}${normalized.replace(/^\/+/, '')}`);
                        candidates.push(`${baseUrl}uploads/products/${encodeURIComponent(normalized)}`);
                        candidates.push(`${baseUrl}uploads/${encodeURIComponent(normalized)}`);
                      }
                    }

                    // Append the general fallback as last resort
                    candidates.push(fallback);

                    // Find next candidate that's different from current src
                    const next = candidates.find(c => c && c !== src) || fallback;
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = next;
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
