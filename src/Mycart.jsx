import React, { useCallback, useContext, useEffect, useRef, useState } from "react";
import { MyCart } from "./CartContext";
import { Link } from "react-router-dom";
import { getApiUrl } from './apiUrl.js';
import "./Mycart.css";

export default function Mycart() {
  const { myCart, setMyCart } = useContext(MyCart);
  const [cartLoading, setCartLoading] = useState(true);
  const [cartError, setCartError] = useState('');
  const customerId = localStorage.getItem('user_id');
  const apiUrl = getApiUrl();

  
  const [tableNumber, setTableNumber] = useState("");
  const [pickupTime, setPickupTime] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryLatitude, setDeliveryLatitude] = useState(null);
  const [deliveryLongitude, setDeliveryLongitude] = useState(null);
  const [paymentNumber, setPaymentNumber] = useState("");
  const [checkoutIndex, setCheckoutIndex] = useState(null);
  const [orderType, setOrderType] = useState('dineIn');
  const [loadingPay, setLoadingPay] = useState(false);
  const [payMessage, setPayMessage] = useState(null);
  const [paymentSession, setPaymentSession] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [autocompleteLoading, setAutocompleteLoading] = useState(false);
  const [showLocationChoice, setShowLocationChoice] = useState(false);
  const [deliveryLocationMode, setDeliveryLocationMode] = useState(null);

  const [pickupDay, setPickupDay] = useState("");
  const [pickupHour, setPickupHour] = useState("12");
  const [pickupPeriod, setPickupPeriod] = useState("PM");

  const getAvailablePickupDays = () => {
    const today = new Date();
    const days = [];
    for (let i = 0; i < 3; i += 1) {
      const day = new Date(today);
      day.setDate(today.getDate() + i);
      const year = day.getFullYear();
      const month = `${day.getMonth() + 1}`.padStart(2, '0');
      const date = `${day.getDate()}`.padStart(2, '0');
      days.push(`${year}-${month}-${date}`);
    }
    return days;
  };

  const buildPickupDateTime = (day, hour, period) => {
    if (!day || !hour || !period) return null;
    const normalizedHour = Number(hour);
    if (Number.isNaN(normalizedHour) || normalizedHour < 1 || normalizedHour > 12) return null;
    let hour24 = normalizedHour % 12;
    if (period === 'PM') hour24 += 12;
    const dateTime = new Date(`${day}T${hour24.toString().padStart(2, '0')}:00:00`);
    if (Number.isNaN(dateTime.getTime())) return null;
    return `${dateTime.getFullYear()}-${String(dateTime.getMonth() + 1).padStart(2, '0')}-${String(dateTime.getDate()).padStart(2, '0')} ${String(dateTime.getHours()).padStart(2, '0')}:${String(dateTime.getMinutes()).padStart(2, '0')}:00`;
  };

  const searchAddressSuggestions = async (query) => {
    if (!query) {
      setAddressSuggestions([]);
      return;
    }

    setAutocompleteLoading(true);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&addressdetails=1&limit=5`, {
        headers: { 'User-Agent': 'HotelManagementSystem/1.0' }
      });
      const results = await response.json();
      setAddressSuggestions(results.map((item) => ({
        label: item.display_name,
        lat: item.lat,
        lon: item.lon,
      })));
    } catch (err) {
      console.error('Address lookup failed:', err);
      setAddressSuggestions([]);
    } finally {
      setAutocompleteLoading(false);
    }
  };

  const handleDeliveryAddressChange = (e) => {
    const value = e.target.value;
    setDeliveryAddress(value);
    setDeliveryLatitude(null);
    setDeliveryLongitude(null);
    searchAddressSuggestions(value);
  };

  const handleAddressSuggestionClick = (suggestion) => {
    setDeliveryAddress(suggestion.label);
    setDeliveryLatitude(suggestion.lat);
    setDeliveryLongitude(suggestion.lon);
    setAddressSuggestions([]);
  };

  const handleUseCurrentLocation = async () => {
    setLocationLoading(true);
    setLocationError(null);
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported');
      setLocationLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`, {
          headers: { 'User-Agent': 'HotelManagementSystem/1.0' }
        });
        const data = await response.json();
        const address = data.display_name || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
        setDeliveryAddress(address);
        setDeliveryLatitude(latitude);
        setDeliveryLongitude(longitude);
        setLocationLoading(false);
      },
      (error) => {
        setLocationError('Unable to get location: ' + error.message);
        setLocationLoading(false);
      }
    );
  };

  useEffect(() => {
    if (!pickupDay) {
      const days = getAvailablePickupDays();
      if (days.length > 0) {
        setPickupDay(days[0]);
      }
    }
  }, []);


  const handleTableNumberChange = (e) => {
    setTableNumber(e.target.value);
  };
  const handlePickupTimeChange = (e) => {
    setPickupTime(e.target.value);
  };
  const handleContactNumberChange = (e) => {
    setContactNumber(e.target.value);
  };
  const handlePaymentNumberChange = (e) => {
    setPaymentNumber(e.target.value);
  }

  const total = myCart.reduce(
    (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 1),
    0
  );

  const loadDatabaseCart = async () => {
    setCartLoading(true);
    setCartError('');

    if (!customerId) {
      setMyCart([]);
      setCartLoading(false);
      return;
    }

    try {
      const res = await fetch(`${apiUrl}/fetch_cart.php?customer_id=${customerId}`);
      const data = await res.json();
      if (data.status === 'success' && Array.isArray(data.cart)) {
        setMyCart(data.cart);
      } else {
        setMyCart([]);
      }
    } catch (err) {
      setCartError('Unable to load cart. Please refresh the page.');
      setMyCart([]);
    } finally {
      setCartLoading(false);
    }
  };

  useEffect(() => {
    loadDatabaseCart();
  }, [customerId]);

  const handleRemove = async (cartItem) => {
    const confirmed = window.confirm('Remove item from cart?');
    if (!confirmed) return;

    const fd = new FormData();
    fd.append('cart_item_id', cartItem.cart_item_id);
    fd.append('customer_id', customerId);

    try {
      const res = await fetch(`${apiUrl}/remove_from_cart.php`, { method: 'POST', body: fd });
      const data = await res.json();
      if (data.status === 'success') {
        loadDatabaseCart();
      } else {
        setCartError(data.message || 'Unable to remove item.');
      }
    } catch (err) {
      setCartError('Unable to remove item from cart. Please try again later.');
    }
  };

  const handleIncrement = (itemToUpdate) => {
    setMyCart((prevCart) =>
      prevCart.map((item) =>
        item.cart_item_id === itemToUpdate.cart_item_id
          ? { ...item, quantity: Number(item.quantity || 1) + 1 }
          : item
      )
    );
  };

  const handleDecrement = (itemToUpdate) => {
    if (Number(itemToUpdate.quantity || 1) <= 1) return;
    setMyCart((prevCart) =>
      prevCart.map((item) =>
        item.cart_item_id === itemToUpdate.cart_item_id
          ? { ...item, quantity: Number(item.quantity || 1) - 1 }
          : item
      )
    );
  };

  const formatCurrency = (value) =>
    new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 2,
    }).format(value);

  const handleBuy = (indexToBuy) => {
    setCheckoutIndex(indexToBuy);
    setPayMessage(null);
  };

  const handleBuyAll = () => {
    setCheckoutIndex('all');
    setPayMessage(null);
  };

  const handlePay = async () => {
    if (!paymentNumber || paymentNumber.trim().length < 9) {
      setPayMessage({ type: 'error', text: 'Enter a valid phone number' });
      return;
    }

    if (orderType === 'dineIn' && !tableNumber.trim()) {
      setPayMessage({ type: 'error', text: 'Enter a table number for dine-in orders' });
      return;
    }

    if (orderType === 'takeAway') {
      if (!pickupDay) {
        setPayMessage({ type: 'error', text: 'Choose a pickup day' });
        return;
      }
      const chosenPickupTime = buildPickupDateTime(pickupDay, pickupHour, pickupPeriod);
      if (!chosenPickupTime) {
        setPayMessage({ type: 'error', text: 'Pickup time must be later than the current time' });
        return;
      }
      if (!contactNumber.trim()) {
        setPayMessage({ type: 'error', text: 'Enter contact number for pickup orders' });
        return;
      }
      setPickupTime(chosenPickupTime);
    }

    if (orderType === 'delivery') {
      if (!deliveryAddress.trim()) {
        setPayMessage({ type: 'error', text: 'Enter delivery address for delivery orders' });
        return;
      }
      if (deliveryLatitude === null || deliveryLongitude === null) {
        setPayMessage({ type: 'error', text: 'Location coordinates are required. Please select a delivery location.' });
        return;
      }
      if (!contactNumber.trim()) {
        setPayMessage({ type: 'error', text: 'Enter contact number for delivery orders' });
        return;
      }
    }

    let normalizedPhone = paymentNumber.replace(/[^0-9]/g, '');
    if (normalizedPhone.startsWith('0')) {
      normalizedPhone = '254' + normalizedPhone.substring(1);
    } else if (!normalizedPhone.startsWith('254')) {
      normalizedPhone = '254' + normalizedPhone;
    }

    if (!/^254\d{9}$/.test(normalizedPhone)) {
      setPayMessage({ type: 'error', text: 'Payment number must be 254XXXXXXXXX' });
      return;
    }

    // determine whether paying for a single item or all items
    let itemsToSend = myCart;
    let amountToSend = Math.round(total);
    if (checkoutIndex === 'all') {
      itemsToSend = myCart;
      amountToSend = Math.round(total);
    } else if (typeof checkoutIndex === 'number') {
      const single = myCart[checkoutIndex];
      if (single) {
        const qty = Number(single.quantity || 1);
        const price = Number(single.price || 0);
        itemsToSend = [{ ...single, quantity: qty }];
        amountToSend = Math.round(price * qty);
      }
    }

    const payload = {
      phone: normalizedPhone,
      amount: amountToSend,
      customerId: customerId,
      items: itemsToSend,
      orderType,
      tableNumber,
      pickupTime: orderType === 'takeAway' ? buildPickupDateTime(pickupDay, pickupHour, pickupPeriod) : null,
      deliveryAddress: orderType === 'delivery' ? deliveryAddress : null,
      deliveryLatitude: orderType === 'delivery' ? deliveryLatitude : null,
      deliveryLongitude: orderType === 'delivery' ? deliveryLongitude : null,
      contactNumber: orderType === 'takeAway' || orderType === 'delivery' ? contactNumber : null
    };

    try {
      setLoadingPay(true);
      setPayMessage(null);
      
      const pushRes = await fetch(`${apiUrl}/stk-push.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const pushData = await pushRes.json();

      if (pushData.status === 'success') {
        // Keep the payment session so user can check status explicitly
        setPaymentSession({ checkoutRequestID: pushData.checkoutRequestID || pushData.checkoutRequestId || null, orderId: pushData.orderId || null });
        setPayMessage({ type: 'info', text: 'STK prompt sent. Click "Check payment" when you finish.' });
      } else {
        setPayMessage({ type: 'error', text: pushData.message || 'Payment initiation failed' });
      }

    } catch (error) {
      setPayMessage({ type: 'error', text: 'Unable to start payment. Please try again later.' });
    } finally {
      setLoadingPay(false);
    }
  };

    const checkPayment = async () => {
      if (!paymentSession) return;
      const idPart = paymentSession.orderId ? `orderId=${paymentSession.orderId}` : `checkoutRequestID=${encodeURIComponent(paymentSession.checkoutRequestID)}`;
      try {
        setLoadingPay(true);
        const res = await fetch(`${apiUrl}/check_payment.php?${idPart}`);
        const json = await res.json();
        if (json.status === 'success') {
          const status = json.paymentStatus || json.transaction?.result_code === 0 ? 'Paid' : (json.paymentStatus || 'Pending');
          if (status === 'Paid') {
            setPayMessage({ type: 'success', text: 'Payment confirmed. Thank you!' });
            // Refresh cart and reset state
            await loadDatabaseCart();
            setPaymentNumber('');
            setCheckoutIndex(null);
            setPaymentSession(null);
          } else if (status === 'Failed') {
            setPayMessage({ type: 'error', text: 'Payment failed or cancelled.' });
          } else {
            setPayMessage({ type: 'info', text: 'Payment still pending. Try again in a few seconds.' });
          }
        } else {
          setPayMessage({ type: 'error', text: json.message || 'Unable to check payment' });
        }
      } catch (err) {
        setPayMessage({ type: 'error', text: 'Unable to verify payment status right now. Please try again later.' });
      } finally {
        setLoadingPay(false);
      }
    };

    const cancelPayment = () => {
      setPaymentSession(null);
      setPayMessage({ type: 'info', text: 'Payment check cancelled.' });
    };



  return (
    <main className="my-cart-page">
      <section className="my-cart-header">
        <Link to="/categories" className="mobile-back-button">
          ← Back
        </Link>
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
      {cartLoading && <p className="loading-text">Loading cart...</p>}
      {cartError && <p className="error-message">{cartError}</p>}

      {paymentSession && (
        <div className="payment-session-panel">
          <p>Payment session started. Checkout ID: {paymentSession.checkoutRequestID || '—'}</p>
          <div className="payment-session-actions">
            <button className="secondary-button" onClick={checkPayment} disabled={loadingPay}>Check payment</button>
            <button className="secondary-button" onClick={cancelPayment} disabled={loadingPay}>Cancel</button>
          </div>
        </div>
      )}

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
            <div>
              <h2>Items in Cart</h2>
              <p>Update item quantities and proceed to checkout.</p>
            </div>
            <div className="cart-heading-actions">
              <button type="button" className="primary-button pay-all-button" onClick={handleBuyAll} disabled={myCart.length === 0}>
                Pay All
              </button>
            </div>
          </div>

          {checkoutIndex === 'all' && (
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
                  <div className="checkout-row">
                    <label htmlFor="pickupDay" className="checkout-label">Pickup Day</label>
                    <select id="pickupDay" value={pickupDay} onChange={(e) => setPickupDay(e.target.value)}>
                      {getAvailablePickupDays().map((day) => (
                        <option key={day} value={day}>{day}</option>
                      ))}
                    </select>
                  </div>

                  <div className="checkout-row pickup-time-row">
                    <div>
                      <label htmlFor="pickupHour" className="checkout-label">Pickup Time</label>
                      <select id="pickupHour" value={pickupHour} onChange={(e) => setPickupHour(e.target.value)}>
                        {Array.from({ length: 12 }, (_, i) => i + 1).map((hour) => (
                          <option key={hour} value={hour}>{hour}:00</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="pickupPeriod" className="checkout-label">AM / PM</label>
                      <select id="pickupPeriod" value={pickupPeriod} onChange={(e) => setPickupPeriod(e.target.value)}>
                        <option value="AM">AM</option>
                        <option value="PM">PM</option>
                      </select>
                    </div>
                  </div>

                  <p className="pickup-summary">
                    Selected pickup: {buildPickupDateTime(pickupDay, pickupHour, pickupPeriod) || 'Choose a valid future time'}
                  </p>

                  <label>Contact Of the Picker</label>
                  <input type="text" placeholder="Enter contact number" value={contactNumber} onChange={handleContactNumberChange} />
                </div>
              )}
              {orderType === 'delivery' && (
                <div>
                  {deliveryLocationMode === null ? (
                    <button
                      type="button"
                      className="location-selector-button"
                      onClick={() => setShowLocationChoice(true)}
                    >
                      {deliveryAddress ? deliveryAddress : 'Select Delivery Location'}
                    </button>
                  ) : deliveryLocationMode === 'current' ? (
                    <div className="selected-delivery-location">
                      <p className="location-label">Current Location:</p>
                      <p className="location-text">{deliveryAddress}</p>
                      <button
                        type="button"
                        className="change-location-button"
                        onClick={() => {
                          setDeliveryLocationMode(null);
                          setDeliveryAddress('');
                          setDeliveryLatitude(null);
                          setDeliveryLongitude(null);
                        }}
                      >
                        Change Location
                      </button>
                    </div>
                  ) : (
                    <div className="location-input-wrapper">
                      <label htmlFor="deliveryAddress">Delivery Address</label>
                      <input
                        id="deliveryAddress"
                        type="text"
                        placeholder="Type delivery address"
                        value={deliveryAddress}
                        onChange={handleDeliveryAddressChange}
                        autoComplete="off"
                      />
                      {autocompleteLoading && <p className="info-message">Searching addresses...</p>}
                      {addressSuggestions.length > 0 && (
                        <ul className="suggestions-list">
                          {addressSuggestions.map((suggestion, idx) => (
                            <li key={idx} onClick={() => handleAddressSuggestionClick(suggestion)}>
                              {suggestion.label}
                            </li>
                          ))}
                        </ul>
                      )}
                      <button
                        type="button"
                        className="change-location-button"
                        onClick={() => {
                          setDeliveryLocationMode(null);
                          setDeliveryAddress('');
                          setDeliveryLatitude(null);
                          setDeliveryLongitude(null);
                          setAddressSuggestions([]);
                        }}
                      >
                        Back to Options
                      </button>
                    </div>
                  )}
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
                            onClick={() => handleDecrement(item)}
                          >
                            -
                          </button>
                          <span className="quantity-value">{item.quantity}</span>
                          <button
                            type="button"
                            className="quantity-button"
                            onClick={() => handleIncrement(item)}
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
                        onClick={() => handleRemove(item)}
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
                            <div className="checkout-row">
                              <label htmlFor="pickupDay" className="checkout-label">Pickup Day</label>
                              <select id="pickupDay" value={pickupDay} onChange={(e) => setPickupDay(e.target.value)}>
                                {getAvailablePickupDays().map((day) => (
                                  <option key={day} value={day}>{day}</option>
                                ))}
                              </select>
                            </div>

                            <div className="checkout-row pickup-time-row">
                              <div>
                                <label htmlFor="pickupHour" className="checkout-label">Pickup Time</label>
                                <select id="pickupHour" value={pickupHour} onChange={(e) => setPickupHour(e.target.value)}>
                                  {Array.from({ length: 12 }, (_, i) => i + 1).map((hour) => (
                                    <option key={hour} value={hour}>{hour}:00</option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label htmlFor="pickupPeriod" className="checkout-label">AM / PM</label>
                                <select id="pickupPeriod" value={pickupPeriod} onChange={(e) => setPickupPeriod(e.target.value)}>
                                  <option value="AM">AM</option>
                                  <option value="PM">PM</option>
                                </select>
                              </div>
                            </div>

                            <p className="pickup-summary">
                              Selected pickup: {buildPickupDateTime(pickupDay, pickupHour, pickupPeriod) || 'Choose a valid future time'}
                            </p>

                            <label>Contact Of the Picker</label>
                            <input type="text" placeholder="Enter contact number" value={contactNumber} onChange={handleContactNumberChange} />
                          </div>
                        )}
                        {orderType === 'delivery' && (
                          <div>
                            {deliveryLocationMode === null ? (
                              <button
                                type="button"
                                className="location-selector-button"
                                onClick={() => setShowLocationChoice(true)}
                              >
                                {deliveryAddress ? '✓ ' + deliveryAddress : 'Select Delivery Location'}
                              </button>
                            ) : deliveryLocationMode === 'current' ? (
                              <div className="selected-delivery-location">
                                <p className="location-label">Current Location:</p>
                                <p className="location-text">{deliveryAddress}</p>
                                <button
                                  type="button"
                                  className="change-location-button"
                                  onClick={() => {
                                    setDeliveryLocationMode(null);
                                    setDeliveryAddress('');
                                    setDeliveryLatitude(null);
                                    setDeliveryLongitude(null);
                                  }}
                                >
                                  Change Location
                                </button>
                              </div>
                            ) : (
                              <div className="location-input-wrapper">
                                <label htmlFor="deliveryAddress">Delivery Address</label>
                                <input
                                  id="deliveryAddress"
                                  type="text"
                                  placeholder="Type delivery address"
                                  value={deliveryAddress}
                                  onChange={handleDeliveryAddressChange}
                                  autoComplete="off"
                                />
                                {autocompleteLoading && <p className="info-message">Searching addresses...</p>}
                                {addressSuggestions.length > 0 && (
                                  <ul className="suggestions-list">
                                    {addressSuggestions.map((suggestion, idx) => (
                                      <li key={idx} onClick={() => handleAddressSuggestionClick(suggestion)}>
                                        {suggestion.label}
                                      </li>
                                    ))}
                                  </ul>
                                )}
                                <button
                                  type="button"
                                  className="change-location-button"
                                  onClick={() => {
                                    setDeliveryLocationMode(null);
                                    setDeliveryAddress('');
                                    setDeliveryLatitude(null);
                                    setDeliveryLongitude(null);
                                    setAddressSuggestions([]);
                                  }}
                                >
                                  Back to Options
                                </button>
                              </div>
                            )}
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
                            {loadingPay ? 'Processing…' : `Pay ${formatCurrency(subtotal)}`}
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

      {showLocationChoice && (
        <div className="modal-overlay" onClick={() => setShowLocationChoice(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Select Delivery Location</h2>
              <button type="button" className="modal-close" onClick={() => setShowLocationChoice(false)}>×</button>
            </div>

            {locationError && <p className="error-message">{locationError}</p>}

            <div className="location-options">
              <button
                type="button"
                className="location-option-button"
                onClick={async () => {
                  await handleUseCurrentLocation();
                  setDeliveryLocationMode('current');
                  setShowLocationChoice(false);
                }}
                disabled={locationLoading}
              >
                {locationLoading ? 'Getting your location...' : 'Use My Current Location'}
              </button>

              <button
                type="button"
                className="location-option-button"
                onClick={() => {
                  setDeliveryLocationMode('type');
                  setShowLocationChoice(false);
                }}
              >
                Type Address
              </button>
            </div>

            <div className="modal-actions">
              <button type="button" className="secondary-button" onClick={() => setShowLocationChoice(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </main>
  );
}