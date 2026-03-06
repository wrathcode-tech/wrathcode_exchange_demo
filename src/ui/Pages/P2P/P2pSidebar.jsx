import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import './p2p.css';

const P2pSidebar = ({ isOpen, onClose }) => {
  const location = useLocation();

  const menuItems = [
    {
      path: '/p2p-dashboard',
      label: 'Dashboard',
      icon: (
        <img src="/images/p2p/p2phome_icon.svg" />
      ),
    },
    {
      path: '/p2p-create-post',
      label: 'Add post',
      icon: (
        <img src="/images/p2p/adspost_icon.svg" />
      ),
    },
    {
      path: '/p2p-my-ads',
      label: 'My Ads',
      icon: (
        <img src="/images/p2p/ads_icon.svg" />
      ),
    },
    {
      path: '/p2p-orders',
      label: 'P2P Orders',
      icon: (
        <img src="/images/p2p/order_iconp2p.svg" />
      ),
    },
    // {
    //   path: '/p2p-profile',
    //   hash: '#payment-methods',
    //   label: 'Payment Method',
    //   icon: (
    //     <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    //       <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
    //       <line x1="1" y1="10" x2="23" y2="10"/>
    //     </svg>
    //   ),
    // },
    {
      path: '/p2p-profile',
      label: 'Profile',
      icon: (
        <img src="/images/p2p/p2p_profile_icon.svg" />
      ),
    },
  ];

  const isActive = (path, hash) => {
    if (hash) {
      return location.pathname === path && location.hash === hash;
    }
    return location.pathname === path && !location.hash;
  };

  return (
    <>
      {/* Overlay for mobile */}
      <div
        className={`p2p-sidebar-overlay ${isOpen ? 'p2p-visible' : ''}`}
        onClick={onClose}
      />

      <aside className={`p2p-sidebar ${isOpen ? 'p2p-open' : ''}`}>
        <button className="p2p-sidebar-close" onClick={onClose}>
          ×
        </button>



        <nav className="p2p-sidebar-nav mt-5">
          {menuItems.map((item, index) => (
            <NavLink
              key={index}
              to={item.hash ? `${item.path}${item.hash}` : item.path}
              className={({ isActive: active }) =>
                `p2p-nav-item ${active || isActive(item.path, item.hash) ? 'active' : ''}`
              }
              onClick={onClose}
            >
              <span className="p2p-nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p2p-sidebar-footer">
          <a href="/" className="p2p-back-link">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            <span>Back to Exchange</span>
          </a>
        </div>
      </aside>
    </>
  );
};

export default P2pSidebar;
