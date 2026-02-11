import React, { useState, useEffect } from 'react';
import P2pSidebar from './P2pSidebar';
import './p2p.css';

const P2pLayout = ({ children, title }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 992);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 992);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div 
      className="p2p-layout-wrapper"
      // style={{ backgroundImage: 'url(/images/p2p/p2pBg.png)' }}
    >
      {/* Sidebar */}
      <P2pSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      {/* Main Content */}
      <div className={`p2p-main-content ${isMobile ? 'p2p-mobile' : ''}`}>
        {/* Mobile Header */}
        {isMobile && (
          <div className="p2p-mobile-header">
            <button 
              className="p2p-hamburger"
              onClick={() => setSidebarOpen(true)}
            >
              <span className="p2p-hamburger-line"></span>
              <span className="p2p-hamburger-line"></span>
              <span className="p2p-hamburger-line"></span>
            </button>
            <div className="p2p-mobile-logo">
              {/* <div className="p2p-mobile-logo-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
                  <polyline points="22,7 13.5,15.5 8.5,10.5 2,17"/>
                  <polyline points="16,7 22,7 22,13"/>
                </svg>
              </div> */}
              {/* <span className="p2p-mobile-logo-text">Dexigo</span> */}
            </div>
            {title && <span className="p2p-page-title">{title}</span>}
            {!title && <div className="p2p-spacer"></div>}
          </div>
        )}

        {/* Page Content */}
        <div className="p2p-page-content">
          {children}
        </div>
      </div>
    </div>
  );
};

export default P2pLayout;
