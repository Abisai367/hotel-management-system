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

  const baseUrl = import.meta.env.BASE_URL || '/';
  const apiUrl = import.meta.env.VITE_API_URL?.trim().replace(/\/+$/, '') || `${baseUrl}api`.replace(/\/+/g, '/');
  const imageBaseUrl = apiUrl.replace(/\/api$/, '');

  const getProductImageUrl = (productPath) => {
    const rawPath = productPath?.toString().trim();
    if (!rawPath) return '';

    const normalized = rawPath.replace(/\\/g, '/');
    const candidates = [];

    if (/^https?:\/\//i.test(normalized)) {
      candidates.push(normalized);
      return candidates[0];
    }

    if (normalized.startsWith('/')) {
      candidates.push(`${baseUrl}${normalized.replace(/^\/+/, '')}`);
    }

    if (/^uploads\//i.test(normalized)) {
      candidates.push(`${baseUrl}${normalized.replace(/^\/+/, '')}`);
    }

    candidates.push(`${baseUrl}uploads/products/${encodeURIComponent(normalized)}`);

    candidates.push(`${baseUrl}uploads/${encodeURIComponent(normalized)}`);

    return candidates[0] || '';
  };

  const placeholderImage = `data:image/svg+xml,%3Csvg width='600' height='400' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='600' height='400' fill='%23333'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23f3f5f7' font-family='Poppins, sans-serif' font-size='28'%3ENo image available%3C/text%3E%3C/svg%3E`;

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
        console.error('Error fetching products:', error);
        setProducts([]);
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
                  src={imageUrl || placeholderImage}
                  alt={product.product_name || 'Product image'}
                  onError={(e) => {
                    const src = e.currentTarget.src || '';
                    const fallback = placeholderImage;
                    if (src === fallback) return;

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
                    candidates.push(fallback);

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
