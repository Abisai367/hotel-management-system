import React, { useContext, useEffect, useState} from "react";
import { MyCart } from "./CartContext";
import { Link } from "react-router-dom";
import ScrollReveal from "scrollreveal";
import "./Mycart.css";

export default function Mycart() {
  const { myCart, setMyCart } = useContext(MyCart);
  const baseUrl = import.meta.env.BASE_URL || '/';
  
  const [tableNumber, setTableNumber] = useState("");
  const [pickupTime, setPickupTime] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [paymentNumber, setPaymentNumber] = useState("");
  const [checkoutIndex, setCheckoutIndex] = useState(null);
  const [orderType, setOrderType] = useState('dineIn');
  const [loadingPay, setLoadingPay] = useState(false);
  const [payMessage, setPayMessage] = useState(null);


  const handleTableNumberChange = (e) => {
    setTableNumber(e.target.value);
  };
  const handlePickupTimeChange = (e) => {
    setPickupTime(e.target.value);
  };
  const handleContactNumberChange = (e) => {
    setContactNumber(e.target.value);
  };
  const handleDeliveryAddressChange = (e) => {
    setDeliveryAddress(e.target.value);
  };
  const handlePaymentNumberChange = (e) => {
    setPaymentNumber(e.target.value);
  }
  const total = myCart.reduce(
    (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 1),
    0
  );

  const handleRemove = (indexToRemove) => {
    const updatedCart = myCart.filter((_, index) => index !== indexToRemove);
    setMyCart(updatedCart);
  };

  const handleIncrement = (indexToUpdate) => {
    const updatedCart = myCart.map((item, index) =>
      index === indexToUpdate
        ? { ...item, quantity: Number(item.quantity || 1) + 1 }
        : item
    );
    setMyCart(updatedCart);
  };
  const handleDecrement = (indexToUpdate) => {
    const updatedCart = myCart.map((item, index) => {
      if (index !== indexToUpdate) return item;
      const quantity = Math.max(1, Number(item.quantity || 1) - 1);
      return { ...item, quantity };
    });
    setMyCart(updatedCart);
  };

  const formatCurrency = (value) =>
    new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 2,
    }).format(value);

  const handleBuy = (indexToBuy) => {
    setCheckoutIndex(indexToBuy);
  };

  const handlePay = async () => {
    if (!paymentNumber || paymentNumber.trim().length < 9) {
      setPayMessage({ type: 'error', text: 'Enter a valid phone number' });
      return;
    }

    const payload = {
      phone: paymentNumber.replace(/[^0-9]/g, ''),
      amount: total,
      items: myCart,
      orderType,
      tableNumber,
      pickupTime,
      deliveryAddress,
      contactNumber
    };

    try {
      setLoadingPay(true);
      setPayMessage(null);
      const apiUrl = import.meta.env.VITE_API_URL || 'https://fivestarhotel.rf.gd/api';
      const res = await fetch(`${apiUrl}/stkpush.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.status === 'success') {
        setPayMessage({ type: 'success', text: data.message || 'Payment initiated. Check your phone.' });
        
      setMyCart([]);
        setCheckoutIndex(null);
      } else {
        setPayMessage({ type: 'error', text: data.message || 'Payment failed to start' });
      }
    } catch (err) {
      setPayMessage({ type: 'error', text: 'Unable to reach server. Try again later.' });
    } finally {
      setLoadingPay(false);
    }
  };



  useEffect(() => {
    const sr = ScrollReveal({ reset: false });
    sr.reveal(".my-cart-header", {
      distance: "30px",
      origin: "top",
      duration: 700,
      easing: "ease-in-out",
    });
    sr.reveal(".cart-items-panel, .empty-cart-panel", {
      distance: "20px",
      origin: "bottom",
      duration: 650,
      interval: 120,
      easing: "ease-in-out",
    });
    return () => sr.destroy();
  }, []);

  return (
    <main className="my-cart-page">
      <section className="my-cart-header">
        <div>
          <p className="page-badge">Shopping Cart</p>
          <h1>My Cart</h1>
          <p className="page-copy">
            Review your selected items, update quantities, and proceed to checkout.
          </p>
        </div>
        <div className="header-actions">
          <span>{myCart.length} item{myCart.length === 1 ? "" : "s"}</span>
          <span className="header-total">{formatCurrency(total)}</span>
        </div>
      </section>

      {myCart.length === 0 ? (
        <section className="empty-cart-panel">
          <div>
            <h2>Your cart is empty</h2>
            <p>Browse products and add what you love to complete your order.</p>
            <Link to="/categories">
              <button className="primary-button">Continue Shopping</button>
            </Link>
          </div>
        </section>
      ) : (
        <section className="cart-items-panel">
          <div className="cart-section-heading">
            <h2>Items in Cart</h2>
            <p>Update item quantities and proceed to checkout.</p>
          </div>
          <ul className="cart-items">
            {myCart.map((item, index) => {
              const price = Number(item.price || 0);
              const subtotal = price * Number(item.quantity || 1);
              return (
                <li className="cart-item" key={`${item.product_name}-${index}`}>
                    <div className="item-media">
                      {item.product_path ? (
                        <img src={item.product_path} alt={item.product_name} />
                      ) : (
                        <div className="product-image-placeholder" aria-hidden="true" />
                      )}
                    </div>
                  <div className="item-info">
                    <div className="item-top">
                      <div>
                        <h3>{item.product_name}</h3>
                        <p className="item-description">{item.description}</p>
                      </div>
                      <div className="item-price-large">{formatCurrency(price)}</div>
                    </div>

                    <div className="item-actions-row">
                      <div className="quantity-group">
                        <span className="quantity-label">Quantity</span>
                        <div className="quantity-controls">
                          <button
                            type="button"
                            className="quantity-button"
                            onClick={() => handleDecrement(index)}
                          >
                            -
                          </button>
                          <span className="quantity-value">{item.quantity}</span>
                          <button
                            type="button"
                            className="quantity-button"
                            onClick={() => handleIncrement(index)}
                          >
                            +
                          </button>
                        </div>
                      </div>
                      <div className="item-subtotal">
                        <span>Subtotal</span>
                        <strong>{formatCurrency(subtotal)}</strong>
                      </div>
                    </div>

                    <div className="item-actions">
                      <button
                        type="button"
                        className="secondary-button"
                        onClick={() => handleRemove(index)}
                      >
                        Remove
                      </button>
                      <button type="button" className="primary-button outline" onClick={() => handleBuy(index)}>
                        Buy Now
                      </button>
                    </div>
                    {checkoutIndex === index && (
                      <div className="checkout-panel">
                        <div className="checkout-row">
                          <label htmlFor="orderType" className="checkout-label">Order Type</label>
                          <select id="orderType" value={orderType} onChange={(e) => setOrderType(e.target.value)}>
                            <option value="dineIn">Dine In</option>
                            <option value="takeAway">Take Away</option>
                            <option value="delivery">Delivery</option>
                          </select>
                        </div>

                        {orderType === 'dineIn' && (
                          <input type="text" placeholder="Enter table number" value={tableNumber} onChange={handleTableNumberChange} />
                        )}
                        {orderType === 'takeAway' && (
                          <div>
                            <input type="text" placeholder="Enter pickup time" value={pickupTime} onChange={handlePickupTimeChange} />
                            <label>Contact Of the Picker</label>
                            <input type="text" placeholder="Enter contact number" value={contactNumber} onChange={handleContactNumberChange} />
                          </div>
                        )}
                        {orderType === 'delivery' && (
                          <div>
                            <input type="text" placeholder="Enter delivery address" value={deliveryAddress} onChange={handleDeliveryAddressChange} />
                            <label>Contact Of the Receiver</label>
                            <input type="text" placeholder="Enter contact number" value={contactNumber} onChange={handleContactNumberChange} />
                          </div>
                        )}

                        <div className="payment-number">
                          <label>Payment Number</label>
                          <input type="text" placeholder="Enter payment number" value={paymentNumber} onChange={handlePaymentNumberChange} />
                        </div>

                        <div className="checkout-actions">
                          <button type="button" className="secondary-button" onClick={() => setCheckoutIndex(null)} disabled={loadingPay}>Cancel</button>
                          <button type="button" className="primary-button" onClick={handlePay} disabled={loadingPay}>
                            {loadingPay ? 'Processing…' : `Pay ${formatCurrency(total)}`}
                          </button>
                        </div>

                        {payMessage && (
                          <p className={payMessage.type === 'error' ? 'error-message' : 'success-message'}>{payMessage.text}</p>
                        )}
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </main>
  );
}
