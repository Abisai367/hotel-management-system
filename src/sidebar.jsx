import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FaThLarge, FaUtensils, FaComments, FaFileInvoice, FaBars, FaTimes, FaPlus, FaTasks } from 'react-icons/fa';
import { FaGear, FaBell, FaHeadset } from "react-icons/fa6";
import { isAdminRole, isStaffRole, roleLabel } from './roles.js';
import './sidebar.css'

export default function Sidebar() {
  const [isDark, setIsDark] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1000);
  const [user, setUser] = useState({ role: '', fullName: '', profileImage: '' });
  const navigate = useNavigate();

  useEffect(() => {
    const role = sessionStorage.getItem('user_role') || '';
    const fullName = sessionStorage.getItem('full_name') || '';
    const profileImage = sessionStorage.getItem('profile_image') || '';
    setUser({ role, fullName, profileImage });

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    setIsDark(mediaQuery.matches);
    const handler = (e) => setIsDark(e.matches);
    mediaQuery.addEventListener("change", handler);

    const resizeHandler = () => {
      setWindowWidth(window.innerWidth);
      if (window.innerWidth > 1000) {
        setNavOpen(false);
      }
    };
    window.addEventListener('resize', resizeHandler);
    resizeHandler();

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
    sessionStorage.removeItem('user_role');
    sessionStorage.removeItem('full_name');
    sessionStorage.removeItem('profile_image');
    sessionStorage.removeItem('shift_schedule');
    sessionStorage.removeItem('user_id');
    sessionStorage.removeItem('salary');
    sessionStorage.removeItem('myCart');
    sessionStorage.removeItem('cartItems');
    window.dispatchEvent(new Event('authchange'));
    navigate('/login', { replace: true });
  };

  const baseUrl = import.meta.env.BASE_URL || '/';
  const defaultProfile = 'https://res.cloudinary.com/dmae5wpe9/image/upload/v1780127792/esi53lgjgdwvr9jcbno4.png';
  const rawRole = user.role?.trim() || '';
  const isAdmin = isAdminRole(rawRole);
  const isStaff = isStaffRole(rawRole);
  const displayedRole = roleLabel(rawRole);

  const isMobileView = windowWidth <= 1000;

  if (!user.role) {
    return null;
  }

  return (
    <>
      {isMobileView && (
        <div className="sidebar-topbar">
          <div className="sidebar-topbar-left">
            <button className="topbar-menu-btn" onClick={handleToggle} aria-label="Toggle menu">
              {navOpen ? <FaTimes /> : <FaBars />}
            </button>
            <div className="sidebar-topbar-title">Menu</div>
          </div>
          <div className="sidebar-topbar-links">
            <Link to="/categories" className="sidebar-topbar-link" onClick={handleNavClick}>Foods</Link>
            <Link to="/MyCart" className="sidebar-topbar-link" onClick={handleNavClick}>Cart</Link>
            <Link to="/messages" className="sidebar-topbar-link" onClick={handleNavClick}>Messages</Link>
          </div>
        </div>
      )}
      <aside className={`sidebar ${navOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <img
            src={user.profileImage || defaultProfile}
            alt="User avatar"
            className="sidebar-logo"
          />
          <div className="sidebar-title">
            <span className="title-main">{user.fullName ? user.fullName.split(' ')[0] : 'Welcome'}</span>
            <span className="title-sub">{displayedRole}</span>
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
              <Link to="/admin"><li className="nav-item"><FaThLarge className="nav-icon"/> Dashboard</li></Link>
            )}
            {isStaff && !isAdmin && (
              <Link to="/staff-dashboard"><li className="nav-item"><FaTasks className="nav-icon"/> Work Dashboard</li></Link>
            )}
            {isAdmin && (
              <Link to="/staff-dashboard"><li className="nav-item"><FaTasks className="nav-icon"/> Staff View</li></Link>
            )}
            {isAdmin && (
              <Link to="/upload"><li className="nav-item"><FaPlus className="nav-icon"/> Manage Products</li></Link>
            )}
            {isAdmin && (
              <Link to="/add-employee"><li className="nav-item"><FaThLarge className="nav-icon"/> Add Employee</li></Link>
            )}
            {isAdmin && (
              <Link to="/manage-employees"><li className="nav-item"><FaThLarge className="nav-icon"/> Manage Employees</li></Link>
            )}
            <Link to="/messages"><li className="nav-item"><FaComments className="nav-icon"/> Messages</li></Link>
            <li className="nav-item"><FaBell className="nav-icon"/> Notifications</li>
            <li className="nav-item"><FaHeadset className="nav-icon"/> Support</li>
          </ul>
        </nav>

        <div className="sidebar-user-actions">
          <div className="sidebar-user-block">
            <div className="sidebar-user-avatar-wrapper">
              <img
                className="sidebar-user-avatar"
                src={user.profileImage || defaultProfile}
                alt="User profile"
              />
            </div>
            <div>
              <p className="sidebar-user-name">{user.fullName || 'Guest User'}</p>
              <p className="sidebar-user-role">{displayedRole || 'Visitor'}</p>
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
