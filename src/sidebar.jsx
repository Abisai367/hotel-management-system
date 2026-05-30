import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FaThLarge, FaUtensils, FaComments, FaFileInvoice, FaBars, FaTimes, FaPlus } from 'react-icons/fa';
import { FaGear, FaBell, FaHeadset } from "react-icons/fa6";
import './sidebar.css'

export default function Sidebar() {
  const [isDark, setIsDark] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [user, setUser] = useState({ role: '', fullName: '', profileImage: '' });
  const navigate = useNavigate();

  useEffect(() => {
    const role = localStorage.getItem('user_role') || '';
    const fullName = localStorage.getItem('full_name') || '';
    const profileImage = localStorage.getItem('profile_image') || '';
    setUser({ role, fullName, profileImage });

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    setIsDark(mediaQuery.matches);
    const handler = (e) => setIsDark(e.matches);
    mediaQuery.addEventListener("change", handler);

    const resizeHandler = () => {
      if (window.innerWidth > 1000) {
        setNavOpen(false);
      }
    };
    window.addEventListener('resize', resizeHandler);

    return () => {
      mediaQuery.removeEventListener("change", handler);
      window.removeEventListener('resize', resizeHandler);
    };
  }, []);

  const handleToggle = () => {
    setNavOpen((prev) => !prev);
  };

  const handleNavClick = () => {
    if (window.innerWidth <= 1000) {
      setNavOpen(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user_role');
    localStorage.removeItem('full_name');
    localStorage.removeItem('profile_image');
    localStorage.removeItem('shift_schedule');
    localStorage.removeItem('user_id');
    localStorage.removeItem('myCart');
    localStorage.removeItem('cartItems');
    window.dispatchEvent(new Event('authchange'));
    navigate('/login', { replace: true });
  };

  const baseUrl = import.meta.env.BASE_URL || '/';
  const isAdmin = user.role.toLowerCase() === 'admin';

  if (!user.role) {
    return null;
  }

  return (
    <>
      <aside className={`sidebar ${navOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <img
            src={user.profileImage}
            alt="User avatar"
            className="sidebar-logo"
          />
          <div className="sidebar-title">
            <span className="title-main">{user.fullName ? user.fullName.split(' ')[0] : 'Welcome'}</span>
            <span className="title-sub">{isAdmin ? 'Administrator' : 'Customer'}</span>
          </div>
          <button className="sidebar-toggle" onClick={handleToggle} aria-label="Toggle sidebar">
            {navOpen ? <FaTimes /> : <FaBars />}
          </button>
        </div>

        <nav className="sidebar-nav">
          <ul className="nav-menu" onClick={handleNavClick}>
            <Link to="/categories"><li className="nav-item"><FaUtensils className="nav-icon"/> Foods</li></Link>
            <Link to="/MyCart"><li className="nav-item"><FaFileInvoice className="nav-icon"/> My Cart</li></Link>
            {isAdmin && (
              <Link to="/upload"><li className="nav-item"><FaPlus className="nav-icon"/> Add Product</li></Link>
            )}
            {isAdmin && (
              <Link to="/add-employee"><li className="nav-item"><FaThLarge className="nav-icon"/> Add Employee</li></Link>
            )}
            <li className="nav-item"><FaComments className="nav-icon"/> Messages</li>
            <li className="nav-item"><FaBell className="nav-icon"/> Notifications</li>
            <li className="nav-item"><FaHeadset className="nav-icon"/> Support</li>
          </ul>
        </nav>

        <div className="sidebar-user-actions">
          <div className="sidebar-user-block">
            <div className="sidebar-user-avatar-wrapper">
              <img
                className="sidebar-user-avatar"
                src={user.profileImage}
                alt="User profile"
              />
            </div>
            <div>
              <p className="sidebar-user-name">{user.fullName || 'Guest User'}</p>
              <p className="sidebar-user-role">{user.role || 'Visitor'}</p>
            </div>
          </div>
          <div className="sidebar-action-buttons">
            <button type="button" className="sidebar-account-btn">View Account</button>
            <button type="button" className="sidebar-logout-btn" onClick={handleLogout}>Logout</button>
          </div>
        </div>
      </aside>
      <div className={`backdrop ${navOpen ? 'visible' : ''}`} onClick={() => setNavOpen(false)} />
    </>
  );
}
