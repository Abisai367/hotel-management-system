import React, { useState, useEffect } from "react";
import { FaThLarge, FaUtensils, FaComments, FaFileInvoice, FaBars, FaTimes } from 'react-icons/fa';
import { FaGear, FaBell, FaHeadset } from "react-icons/fa6";
import './sidebar.css'
import { Link } from "react-router-dom";

export default function Sidebar() {
  const [isDark, setIsDark] = useState(false);
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    setIsDark(mediaQuery.matches);
    const handler = (e) => setIsDark(e.matches);
    mediaQuery.addEventListener("change", handler);

    const resizeHandler = () => {
      if (window.innerWidth > 768) {
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
    if (window.innerWidth <= 768) {
      setNavOpen(false);
    }
  };

  return (
    <aside className={`sidebar ${navOpen ? 'open' : ''}`}>
      <div className="sidebar-header">
        <img src={isDark ? "/projectpics/darkmode.jpg" : "/projectpics/lightmode.png"} alt="Our Logo" className="sidebar-logo"/>
        <div className="sidebar-title"> 
          <span className="title-main">Five</span> 
          <span className="title-sub">Star Hotel</span>
        </div>
        <button className="sidebar-toggle" onClick={handleToggle} aria-label="Toggle sidebar">
          {navOpen ? <FaTimes /> : <FaBars />}
        </button>
      </div>

      <nav className="sidebar-nav">
        <ul className="nav-menu" onClick={handleNavClick}>
            <li className="nav-item"><FaThLarge className="nav-icon"/> Dashboard</li>
            <Link to="/categories"> <li className="nav-item"><FaUtensils className="nav-icon"/> Foods</li> </Link>
            <li className="nav-item"><FaComments className="nav-icon"/> Messages</li>
            <li className="nav-item active"><FaFileInvoice className="nav-icon"/> Bills</li>
            <li className="nav-item"><FaGear className="nav-icon"/> Settings</li>
        </ul>
      </nav>

      <div className="sidebar-footer">
        <p className="footer-label">Others</p>
        <ul className="nav-menu" onClick={handleNavClick}>
            <li className="nav-item"><FaBell className="nav-icon"/> Notification</li>
            <li className="nav-item"><FaHeadset className="nav-icon"/> Support</li>
        </ul>
      </div>
    </aside>
  );
}
