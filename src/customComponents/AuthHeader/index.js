import React, { useContext, useEffect, useRef, useState, useMemo, useCallback } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { ApiConfig } from "../../api/apiConfig/apiConfig";
import { ProfileContext } from "../../context/ProfileProvider";
import AuthService from "../../api/services/AuthService";


const AuthHeader = () => {
  const { 
    setCurrentPage, 
    estimatedPortfolio, 
    notifications, 
    notificationCounts,
    themeUpdated,
    setThemeUpdated
  } = useContext(ProfileContext);
  
  const [showBalance, setShowBalance] = useState(true);
  const [searchPair, setSearchPair] = useState("");
  const [allPairs, setAllPairs] = useState([]);
  const [pairsLoading, setPairsLoading] = useState(false);
  const [pairsFetched, setPairsFetched] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  // Check if current page is an auth page (no nav should be active)
  const isAuthPage = ['/login', '/signup', '/forgot_password', '/account-verification'].some(
    path => location.pathname.startsWith(path)
  );

  // Helper to check if a path is active
  const isActive = (path, exact = true) => {
    if (isAuthPage) return false;
    return exact ? location.pathname === path : location.pathname.includes(path);
  };
  
  // Check if Dashboard should be active (user_profile pages except swap)
  const isDashboardActive = location.pathname.startsWith('/user_profile') && 
                            location.pathname !== '/user_profile/swap';

  // eslint-disable-next-line no-unused-vars
  const logOut = () => {
    localStorage.clear();
    navigate("/", { replace: true, state: null });
    window.location.reload();
  };

  // Fetch pairs from API when modal opens
  const fetchPairs = useCallback(async () => {
    if (pairsFetched || pairsLoading) return;
    setPairsLoading(true);
    try {
      const result = await AuthService.getPairs();
      if (result?.success) {
        setAllPairs(result.data || []);
        setPairsFetched(true);
      }
    } catch (error) {
      console.error("Failed to fetch pairs:", error);
    } finally {
      setPairsLoading(false);
    }
  }, [pairsFetched, pairsLoading]);

  // Filter pairs based on search
  const filteredPairs = useMemo(() => {
    if (!searchPair) return allPairs;
    return allPairs.filter((item) => 
      item?.base_currency?.toLowerCase()?.includes(searchPair?.toLowerCase())
    );
  }, [searchPair, allPairs]);

  const [isOpenNav, setIsOpenNav] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [showNotification, setShowNotification] = useState(false);
  const dropdownRef = useRef(null);
  const notificationRef = useRef(null);
  const dropdownCloseTimerRef = useRef(null);

  const toggleNavbar = () => setIsOpenNav(!isOpenNav);

  const openDropdownHover = (key) => {
    if (dropdownCloseTimerRef.current) {
      clearTimeout(dropdownCloseTimerRef.current);
      dropdownCloseTimerRef.current = null;
    }
    if (window.innerWidth >= 992) setOpenDropdown(key);
  };

  const closeDropdownHover = () => {
    if (window.innerWidth < 992) return;
    dropdownCloseTimerRef.current = setTimeout(() => setOpenDropdown(null), 200);
  };

  const closeNavbar = () => {
    setIsOpenNav(false);
    setOpenDropdown(null);
    setShowNotification(false);
  };

  const toggleDropdown = (key) => {
    setOpenDropdown(openDropdown === key ? null : key);
  };

  useEffect(() => {
    return () => {
      if (dropdownCloseTimerRef.current) clearTimeout(dropdownCloseTimerRef.current);
    };
  }, []);

  const toggleTheme = () => {
    setThemeUpdated((prev) => !prev);
  };

  // Outside click handler (desktop + mobile) – close nav dropdown and notification panel
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpenNav(false);
        setOpenDropdown(null);
      }
      // Notification: close only when click is OUTSIDE both icon and panel content (content par click = close mat karo)
      const isInsideNotification = notificationRef.current?.contains(event.target) ||
        event.target.closest?.('.header_notification');
      if (!isInsideNotification) {
        setShowNotification(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  const openAsserOverview = () => {
    navigate(`/user_profile/asset_overview`);
  };

  const [isOpen, setIsOpen] = useState(false);
  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const closeSidebar = () => {
    setIsOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest("#depositSidebar, .deposit-btn")) {
        closeSidebar();
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  // eslint-disable-next-line no-unused-vars
  const [openSection, setOpenSection] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const toggleSection = (section) => {
    setOpenSection(openSection === section ? null : section);
  };

  const nextPage = (data) => {
    localStorage.setItem("RecentPair", JSON.stringify(data));
    navigate(`/trade/${data?.base_currency}_${data?.quote_currency}`);
    window.location.reload();
  };

  const openNotification = () => {
    navigate(`/user_profile/notification`);
    setCurrentPage("Notification");
  };

  return (
    <>
      <header className="sticky-top afterloginheader">
        <div className="container-fluid">
          <div className="row">
            <div className="col-sm-12 col-md-12 col-lg-2 logo_s">
              <div className="logo "><Link to="/">
                <img className='lightlogo' src="/images/logo_light.svg" alt="logo" />
                <img className='darkogo' src="/images/logo-black.svg" alt="logo" />
              </Link></div>
            </div>
            <div className="col-sm-12 col-md-12 col-lg-6 navigation_s">
              <div className="navigation">
                <nav className="navbar navbar-expand-lg" ref={dropdownRef}>
                  <div className="container-fluid">
                    {/* Toggle Button */}
                    <button
                      className="navbar-toggler"
                      type="button"
                      onClick={toggleNavbar}
                      aria-controls="mainNavbar"
                      aria-expanded={isOpenNav}
                      aria-label="Toggle navigation"
                    >
                      <span className="navbar-toggler-icon">
                        <img src="/images/toggle_icon.svg" alt="Toggle" />
                      </span>
                    </button>

                    {/* Navbar Links */}
                    <div className={`collapse navbar-collapse ${isOpenNav ? "show" : ""}`} id="mainNavbar">
                      <ul className="navbar-nav me-auto mb-2 mb-lg-0">
                        <li className="nav-item">
                          <Link 
                            className={`nav-link ${isActive("/") ? "active" : ""}`} 
                            to="/" 
                            onClick={closeNavbar}
                          >
                            Home
                          </Link>
                        </li>
                        <li className="nav-item">
                          <Link 
                            className={`nav-link ${isActive("/market") ? "active" : ""}`} 
                            to="/market" 
                            onClick={closeNavbar}
                          >
                            Market
                          </Link>
                        </li>

                        {/* Trade Dropdown */}
                        <li
                          className={`nav-item dropdown ${isActive('/trade', false) || isActive('/p2p', false) ? "active" : ""}`}
                          onMouseEnter={() => openDropdownHover("trade")}
                          onMouseLeave={closeDropdownHover}
                        >
                          <span
                            className={`nav-link dropdown-toggle ${isActive('/trade', false) || isActive('/p2p', false) ? "active" : ""}`}
                            role="button"
                            style={{ cursor: "pointer" }}
                            onClick={() => toggleDropdown("trade")}
                          >
                            Trade
                          </span>
                          <ul className={`dropdown-menu ${openDropdown === "trade" ? "show" : ""}`} onMouseEnter={() => openDropdownHover("trade")} onMouseLeave={closeDropdownHover}>
                            <li>
                              <Link className="dropdown-item" to="/trade/Header" onClick={closeNavbar}>
                                <i className="ri-line-chart-line" />
                                <span className="dropdown-item-content">
                                  <span className="dropdown-item-text">Spot Trading</span>
                                  <span className="dropdown-item-desc">Trade spot pairs with instant execution</span>
                                </span>
                              </Link>
                            </li>
                            <li>
                              <Link className="dropdown-item" to="/p2p-dashboard" onClick={closeNavbar}>
                                <i className="ri-team-line" />
                                <span className="dropdown-item-content">
                                  <span className="dropdown-item-text">P2P</span>
                                  <span className="dropdown-item-desc">Buy and sell crypto with other users</span>
                                </span>
                              </Link>
                            </li>
                          </ul>
                        </li>

                        <li
                          className={`nav-item dropdown ${isActive('/usd_futures', false) || isActive('/coin_futures', false) || isActive('/options', false) ? "active" : ""}`}
                          onMouseEnter={() => openDropdownHover("futures")}
                          onMouseLeave={closeDropdownHover}
                        >
                          <span
                            className={`nav-link dropdown-toggle ${isActive('/usd_futures', false) || isActive('/coin_futures', false) || isActive('/options', false) ? "active" : ""}`}
                            role="button"
                            style={{ cursor: "pointer" }}
                            onClick={() => toggleDropdown("futures")}
                          >
                            Futures
                          </span>
                          <ul className={`dropdown-menu ${openDropdown === "futures" ? "show" : ""}`} onMouseEnter={() => openDropdownHover("futures")} onMouseLeave={closeDropdownHover}>
                            <li>
                              <Link className="dropdown-item" to="/usd_futures/header" onClick={closeNavbar}>
                                <i className="ri-bar-chart-2-line" />
                                <span className="dropdown-item-content">
                                  <span className="dropdown-item-text">USDⓈ-M Futures</span>
                                  <span className="dropdown-item-desc">Trade perpetual futures with leverage</span>
                                </span>
                              </Link>
                            </li>
                          </ul>
                        </li>

                        <li
                          className={`nav-item dropdown ${isActive("/earning") || isActive("/refer_earn") ? "active" : ""}`}
                          onMouseEnter={() => openDropdownHover("earning")}
                          onMouseLeave={closeDropdownHover}
                        >
                          <span
                            className={`nav-link dropdown-toggle ${isActive("/earning") || isActive("/refer_earn") ? "active" : ""}`}
                            role="button"
                            style={{ cursor: "pointer" }}
                            onClick={() => toggleDropdown("earning")}
                          >
                            Earning
                          </span>
                          <ul className={`dropdown-menu ${openDropdown === "earning" ? "show" : ""}`} onMouseEnter={() => openDropdownHover("earning")} onMouseLeave={closeDropdownHover}>
                            <li>
                              <Link className="dropdown-item" to="/earning" onClick={closeNavbar}>
                                <i className="ri-money-dollar-circle-line" />
                                <span className="dropdown-item-content">
                                  <span className="dropdown-item-text">Earning</span>
                                  <span className="dropdown-item-desc">Staking, savings and earn rewards</span>
                                </span>
                              </Link>
                            </li>
                            <li>
                              <Link className="dropdown-item" to="/refer_earn" onClick={closeNavbar}>
                                <i className="ri-gift-line" />
                                <span className="dropdown-item-content">
                                  <span className="dropdown-item-text">Refer & Earn</span>
                                  <span className="dropdown-item-desc">Invite friends and earn commission</span>
                                </span>
                              </Link>
                            </li>
                          </ul>
                        </li>

                        <li className="nav-item">
                          <Link 
                            className={`nav-link ${isActive("/user_profile/swap") ? "active" : ""}`} 
                            to="/user_profile/swap" 
                            onClick={closeNavbar}
                          >
                            Quick Swap
                          </Link>
                        </li>
                        <li className="nav-item">
                          <Link 
                            className={`nav-link ${isActive("/launchpad") ? "active" : ""}`} 
                            to="/launchpad" 
                            onClick={closeNavbar}
                          >
                            Launchpad<i className="ri-rocket-fill" style={{ color: "#f3bb2c" }}></i>
                          </Link>
                        </li>

                        <li className="nav-item mememenu">
                          <Link 
                            className={`nav-link ${isActive("/meme") ? "active" : ""}`} 
                            to="/meme" 
                            onClick={closeNavbar}
                          >
                            Meme+
                          </Link>
                        </li>

                        <li className="nav-item">
                          <Link 
                            className={`nav-link ${isActive("/blogs") ? "active" : ""}`} 
                            to="/blogs" 
                            onClick={closeNavbar}
                          >
                            Blogs & News
                          </Link>
                        </li>
                        <li
                          className={`nav-item dropdown mbl ${isActive("/earning") || isActive("/refer_earn") ? "active" : ""}`}
                          onMouseEnter={() => openDropdownHover("download")}
                          onMouseLeave={closeDropdownHover}
                        >
                          <span
                            className={`nav-link dropdown-toggle ${isActive("/earning") || isActive("/refer_earn") ? "active" : ""}`}
                            role="button"
                            style={{ cursor: "pointer" }}
                            onClick={() => toggleDropdown("download")}
                          >
                            <img src="/images/download_icon2.svg" alt="scan" width={12} /> Download
                          </span>
                          <ul className={`dropdown-menu ${openDropdown === "download" ? "show" : ""}`} onMouseEnter={() => openDropdownHover("download")} onMouseLeave={closeDropdownHover}>
                            <li>
                            <div className='qrcode'>
                          <div className="scan_img"><img src="/images/scan.png" alt="scan" /></div>
                          <p>Scan to Download App iOS & Android</p>
                          <button className='btn'>Download</button>
                        </div>
                            </li>
                          </ul>
                        </li>
                        <li className="nav-item mbl">
                          <Link
                            className="nav-link"
                            to="/#"
                            onClick={(e) => {
                              e.preventDefault();
                              toggleTheme();
                              closeNavbar();
                            }}
                            role="button"
                            aria-label="Toggle theme"
                          >
                            <i className="ri-moon-line dark-text"></i>
                            <i className="ri-sun-line light-text"></i>
                          </Link>
                        </li>
                            {/* <li className="nav-item mbl">
                          <Link className="nav-link" to="/#">
                            Theme <span><img src="/images/themeicon.svg" alt="theme" /></span>
                          </Link>
                        </li> */}
                      </ul>
                    </div>
                  </div>
                </nav>
              </div>
            </div>

            <div className="col-sm-12 col-md-4  col-lg-4">
              <div className="header_right">
                <div className="button_outer">
                  {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
                  <a className="search_icon" href="#" data-bs-toggle="modal" data-bs-target="#exampleModal" onClick={() => { closeNavbar(); fetchPairs(); }}><i className="ri-search-line"></i></a>
                  <a className="login_btn deposit-btn" href="#/" onClick={() => { closeNavbar(); toggleSidebar(); }}><i className="ri-download-2-line"></i>Deposit</a>
                  <div className="user_login dashbtn">
                    <Link to="/user_profile/dashboard" className={isDashboardActive ? 'active' : ''} onClick={closeNavbar}>
                      Dashboard
                    </Link>
                  </div>

                </div>
                <div className="icon_notificaton_r">
                  <ul>
                    <li
                      ref={notificationRef}
                      className={`notification_nav ${showNotification ? 'open' : ''}`}
                      role="button"
                      tabIndex={0}
                      onClick={(e) => { e.stopPropagation(); setShowNotification((prev) => !prev); }}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setShowNotification((prev) => !prev); } }}
                      aria-label="Notifications"
                      aria-expanded={showNotification}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none">
                        <path d="M12.75 5.69531V10.5234H11.25V5.69531H12.75ZM4.7344 13.0312C4.32815 13.7188 4.0508 14.4531 3.90236 15.2344C3.75393 16.0156 3.74221 16.8047 3.86721 17.6016L4.00783 18.3984H19.9922L20.1563 17.6016C20.2969 16.8047 20.2969 16.0156 20.1563 15.2344C20.0156 14.4531 19.7344 13.7188 19.3125 13.0312C19.1406 12.75 18.9922 12.3867 18.8672 11.9414C18.7422 11.4961 18.6797 11.1016 18.6797 10.7578V8.64844C18.6797 7.46094 18.375 6.34375 17.7656 5.29688C17.1719 4.29688 16.375 3.5 15.375 2.90625C14.3438 2.29688 13.2266 1.99219 12.0235 1.99219C10.8203 1.99219 9.69533 2.29688 8.64846 2.90625C7.64846 3.5 6.85158 4.29688 6.25783 5.29688C5.66408 6.32812 5.36721 7.44531 5.36721 8.64844V10.7578C5.36721 11.1016 5.30471 11.4961 5.17971 11.9414C5.05471 12.3867 4.90627 12.75 4.7344 13.0312ZM17.1797 8.67188V10.7578C17.1797 11.2266 17.2617 11.75 17.4258 12.3281C17.5899 12.9062 17.7891 13.3984 18.0235 13.8047C18.6016 14.7578 18.836 15.7891 18.7266 16.8984H5.2969C5.20315 15.7891 5.44533 14.7578 6.02346 13.8047C6.25783 13.3984 6.45705 12.9102 6.62111 12.3398C6.78518 11.7695 6.86721 11.2422 6.86721 10.7578V8.64844C6.86721 7.97656 6.99611 7.32422 7.25393 6.69141C7.51174 6.05859 7.88283 5.5 8.36721 5.01562C8.85158 4.53125 9.41018 4.15625 10.043 3.89062C10.6758 3.625 11.336 3.49219 12.0235 3.49219C12.9453 3.49219 13.8008 3.72656 14.5899 4.19531C15.3789 4.66406 16.0078 5.29297 16.4766 6.08203C16.9453 6.87109 17.1797 7.73438 17.1797 8.67188ZM9.75002 19.0078C9.75002 19.3047 9.80861 19.5898 9.9258 19.8633C10.043 20.1367 10.2071 20.3789 10.418 20.5898C10.6289 20.8008 10.8711 20.9648 11.1446 21.082C11.418 21.1992 11.7031 21.2578 12 21.2578C12.625 21.2422 13.1563 21.0156 13.5938 20.5781C14.0313 20.1406 14.25 19.6172 14.25 19.0078H15.75C15.75 19.6797 15.5821 20.3008 15.2461 20.8711C14.9102 21.4414 14.4531 21.8984 13.875 22.2422C13.2969 22.5859 12.6719 22.7578 12 22.7578C11.5 22.7578 11.0196 22.6602 10.5586 22.4648C10.0977 22.2695 9.69533 21.9961 9.35158 21.6445C9.00783 21.293 8.7383 20.8867 8.54299 20.4258C8.34768 19.9648 8.25002 19.4922 8.25002 19.0078H9.75002Z" fill="white" />
                      </svg>
                      {notificationCounts?.unseen > 0 && (
                        <span className="notification_count">{notificationCounts.unseen}</span>
                      )}
                      <div
                        className="annousment_s header_notification"
                        onClick={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                        role="presentation"
                      >
                        {notifications?.length > 0 ? notifications?.map((item, index) => (
                          <div key={item?._id || index} className={`annousment_left ${!item?.isSeen && "active"}`} onClick={() => !item?.isSeen && openNotification()} >
                            <img src="/images/notification_icon.svg" alt="Notification Icon" />
                            {`${item?.title?.slice(0, 20)}...`}
                            : <span>  {!item?.isSeen && "Read Now"}</span>
                          </div>
                        )) : <div className="favouriteData">
                          <img src="/images/no_data_vector.svg" className="img-fluid dark_img" width="96" height="96" alt="No data" /><img src="/images/no_data_vector_light.png" className="img-fluid light_img" width="96" height="96" alt="No data" />
                        </div>}
                        {notifications?.length > 0 && <div className="more_btn"><Link to="/user_profile/notification">More<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-arrow-right" viewBox="0 0 16 16">
                          <path fillRule="evenodd" d="M1 8a.5.5 0 0 1 .5-.5h11.793l-3.147-3.146a.5.5 0 0 1 .708-.708l4 4a.5.5 0 0 1 0 .708l-4 4a.5.5 0 0 1-.708-.708L13.293 8.5H1.5A.5.5 0 0 1 1 8"></path>
                        </svg></Link></div>}
                      </div>
                    </li>
                    <li className='wallet_tb' onClick={openAsserOverview}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 50 50" fill="none">
                        <path d="M45.5575 25.9365H43.6845V24.0635C43.6845 20.973 40.875 19.381 38.0655 19.381H9.96954C6.22354 19.381 2.47754 17.1335 2.47754 12.8255C2.47754 8.51752 6.22354 6.27002 9.96954 6.27002H39.189C42.935 6.27002 45.5575 8.89252 45.5575 12.8255V17.508H43.6845V12.825C43.6845 9.92202 41.999 8.14252 39.189 8.14252H9.96954C7.16004 8.14252 4.35054 9.73452 4.35054 12.825C4.35054 15.9155 7.16004 17.5075 9.96954 17.5075H38.065C41.811 17.5075 45.557 19.755 45.557 24.063L45.5575 25.9365Z" fill="white" />
                        <path d="M39.002 43.7304H9.03304C5.00604 43.7304 2.47754 41.123 2.47754 36.97V12.825H4.35054V36.97C4.35054 40.0605 6.03604 41.799 9.03304 41.799H39.0015C41.811 41.799 43.684 39.8675 43.684 36.97V35.0385H45.557V36.97C45.5575 40.9295 42.8415 43.7304 39.002 43.7304Z" fill="white" />
                        <path d="M37.5969 10.0154H8.56494V11.8884H37.5969V10.0154Z" fill="white" />
                        <path d="M37.5969 13.7615H17.9299V15.6345H37.5969V13.7615Z" fill="white" />
                        <path d="M45.5576 36.2385H39.9386C36.8481 36.2385 34.3196 33.71 34.3196 30.6195C34.3196 27.5285 36.8481 25 39.9386 25H45.5576C47.1496 25 48.3671 26.2175 48.3671 27.8095V33.4285C48.3671 35.021 47.1496 36.2385 45.5576 36.2385ZM39.9386 26.873C37.8781 26.873 36.1926 28.5585 36.1926 30.619C36.1926 32.6795 37.8781 34.365 39.9386 34.365H45.5576C46.1196 34.365 46.4941 33.9905 46.4941 33.4285V27.8095C46.4941 27.2475 46.1196 26.873 45.5576 26.873H39.9386Z" fill="white" />
                        <path d="M40.8749 33.4286C39.2829 33.4286 38.0654 32.2111 38.0654 30.6191C38.0654 29.0271 39.2829 27.8096 40.8749 27.8096C42.4669 27.8096 43.6844 29.0271 43.6844 30.6191C43.6844 32.2111 42.4669 33.4286 40.8749 33.4286ZM40.8749 29.6826C40.3129 29.6826 39.9384 30.0571 39.9384 30.6191C39.9384 31.1811 40.3129 31.5556 40.8749 31.5556C41.4369 31.5556 41.8114 31.1811 41.8114 30.6191C41.8114 30.0571 41.4369 29.6826 40.8749 29.6826Z" fill="white" />
                      </svg>
                      <div className='wallet_profile_tab' onClick={(e) => e.stopPropagation()}>
                        <h3>Total Assets
                          {showBalance ?
                            <i className="ri-eye-line mx-2" onClick={() => setShowBalance(false)}></i>
                            :
                            <i className="ri-eye-close-line mx-2" onClick={() => setShowBalance(true)}></i>
                          }
                        </h3>
                        <ul className='wallet_price_list'>
                          <li>{showBalance ? (estimatedPortfolio?.dollarPrice?.toFixed(8)) || 0 : "*********"}  USD</li>
                          <li>≈ {showBalance ? estimatedPortfolio?.currencyPrice?.toFixed(8) || 0 : "*********"}{" "}{estimatedPortfolio?.Currency || "---"}</li>
                        </ul>
                        <div className='wallet_btn_small'>
                          <Link to="/asset_managemnet/deposit">Deposit<svg xmlns="http://www.w3.org/2000/svg" width="20" height="18" viewBox="0 0 20 18" fill="none">
                            <path d="M18.75 10.25C18.5858 10.2499 18.4232 10.2822 18.2715 10.345C18.1198 10.4077 17.982 10.4998 17.8659 10.6159C17.7498 10.732 17.6577 10.8698 17.595 11.0215C17.5322 11.1732 17.4999 11.3358 17.5 11.5V15.25H2.5V11.5C2.5 11.1685 2.3683 10.8505 2.13388 10.6161C1.89946 10.3817 1.58152 10.25 1.25 10.25C0.91848 10.25 0.600537 10.3817 0.366117 10.6161C0.131696 10.8505 2.00941e-07 11.1685 2.00941e-07 11.5V16.5C-9.29127e-05 16.6642 0.0321757 16.8268 0.0949611 16.9785C0.157747 17.1302 0.249817 17.268 0.365909 17.3841C0.482001 17.5002 0.619837 17.5923 0.771536 17.655C0.923235 17.7178 1.08582 17.7501 1.25 17.75H18.75C18.9142 17.7501 19.0768 17.7178 19.2285 17.655C19.3802 17.5923 19.518 17.5002 19.6341 17.3841C19.7502 17.268 19.8423 17.1302 19.905 16.9785C19.9678 16.8268 20.0001 16.6642 20 16.5V11.5C20.0001 11.3358 19.9678 11.1732 19.905 11.0215C19.8423 10.8698 19.7502 10.732 19.6341 10.6159C19.518 10.4998 19.3802 10.4077 19.2285 10.345C19.0768 10.2822 18.9142 10.2499 18.75 10.25Z" fill="white" />
                            <path d="M9.11558 12.3838C9.23162 12.4999 9.3694 12.592 9.52104 12.6548C9.67268 12.7177 9.83522 12.75 9.99937 12.75C10.1635 12.75 10.3261 12.7177 10.4777 12.6548C10.6293 12.592 10.7671 12.4999 10.8832 12.3838L14.6332 8.63379C14.8665 8.39917 14.9972 8.0816 14.9968 7.75072C14.9963 7.41984 14.8647 7.10264 14.6307 6.86866C14.3967 6.63469 14.0795 6.50305 13.7486 6.50259C13.4178 6.50212 13.1002 6.63289 12.8656 6.86621L11.2494 8.48242V1.5C11.2494 1.16848 11.1177 0.850537 10.8833 0.616117C10.6488 0.381696 10.3309 0.25 9.99937 0.25C9.66785 0.25 9.34991 0.381696 9.11549 0.616117C8.88106 0.850537 8.74937 1.16848 8.74937 1.5V8.48242L7.13316 6.86621C6.89854 6.63289 6.58097 6.50212 6.25009 6.50259C5.9192 6.50305 5.602 6.63469 5.36803 6.86866C5.13406 7.10264 5.00241 7.41984 5.00195 7.75072C5.00149 8.0816 5.13226 8.39917 5.36558 8.63379L9.11558 12.3838Z" fill="white" />
                          </svg></Link>
                          <Link to="/asset_managemnet/withdraw">Withdraw<svg xmlns="http://www.w3.org/2000/svg" width="20" height="18" viewBox="0 0 20 18" fill="none">
                            <path d="M18.75 10.25C18.5858 10.2499 18.4232 10.2822 18.2715 10.345C18.1198 10.4077 17.982 10.4998 17.8659 10.6159C17.7498 10.732 17.6577 10.8698 17.595 11.0215C17.5322 11.1732 17.4999 11.3358 17.5 11.5V15.25H2.5V11.5C2.5 11.1685 2.3683 10.8505 2.13388 10.6161C1.89946 10.3817 1.58152 10.25 1.25 10.25C0.91848 10.25 0.600537 10.3817 0.366117 10.6161C0.131696 10.8505 2.00941e-07 11.1685 2.00941e-07 11.5V16.5C-9.29127e-05 16.6642 0.0321757 16.8268 0.0949611 16.9785C0.157747 17.1302 0.249817 17.268 0.365909 17.3841C0.482001 17.5002 0.619837 17.5923 0.771536 17.655C0.923235 17.7178 1.08582 17.7501 1.25 17.75H18.75C18.9142 17.7501 19.0768 17.7178 19.2285 17.655C19.3802 17.5923 19.518 17.5002 19.6341 17.3841C19.7502 17.268 19.8423 17.1302 19.905 16.9785C19.9678 16.8268 20.0001 16.6642 20 16.5V11.5C20.0001 11.3358 19.9678 11.1732 19.905 11.0215C19.8423 10.8698 19.7502 10.732 19.6341 10.6159C19.518 10.4998 19.3802 10.4077 19.2285 10.345C19.0768 10.2822 18.9142 10.2499 18.75 10.25Z" fill="white" />
                            <path d="M7.13316 6.13379L8.74937 4.51758V11.5C8.74937 11.8315 8.88106 12.1495 9.11549 12.3839C9.34991 12.6183 9.66785 12.75 9.99937 12.75C10.3309 12.75 10.6488 12.6183 10.8833 12.3839C11.1177 12.1495 11.2494 11.8315 11.2494 11.5V4.51758L12.8656 6.13379C13.1002 6.36711 13.4178 6.49787 13.7486 6.49741C14.0795 6.49695 14.3967 6.3653 14.6307 6.13133C14.8647 5.89736 14.9963 5.58016 14.9968 5.24928C14.9972 4.91839 14.8665 4.60083 14.6332 4.36621L10.8832 0.616206C10.7671 0.500108 10.6293 0.408011 10.4777 0.345176C10.3261 0.282341 10.1635 0.25 9.99937 0.25C9.83522 0.25 9.67268 0.282341 9.52104 0.345176C9.3694 0.408011 9.23162 0.500108 9.11558 0.616206L5.36558 4.36621C5.13226 4.60083 5.00149 4.91839 5.00195 5.24928C5.00241 5.58016 5.13406 5.89736 5.36803 6.13133C5.602 6.3653 5.9192 6.49695 6.25009 6.49741C6.58097 6.49787 6.89854 6.36711 7.13316 6.13379Z" fill="white" />
                          </svg></Link>
                        </div>
                        <ul className='ac_wallet_info'>
                          <li><Link to='/user_profile/asset_overview' onClick={() => setCurrentPage("Overview")}>Account
                            <i className="ri-arrow-right-line"></i>
                          </Link></li>
                        </ul>
                      </div>
                    </li>
                    <li className='downloadtabs'>
                      <img src="/images/download_icon2.svg" alt="download" />
                      <div className='scantophdr'>
                        <div className='qrcode'>
                          <div className="scan_img"><img src="/images/scan.png" alt="scan" /></div>
                          <p>Scan to Download App iOS & Android</p>
                          <button className='btn'>Download</button>
                        </div>
                      </div>
                    </li>
                    <li className="themetbs" role="button" tabIndex={0} onClick={toggleTheme} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleTheme(); } }} aria-label="Toggle theme">
                      <i className="ri-moon-line dark_img"></i>
                      <i className="ri-sun-line light_img"></i>
                    </li>
                  
                  
                    {/* <li className="themetbs"><img src="/images/themeicon.svg" alt="theme" /></li> */}
                  </ul>
                </div>
              </div>
            </div>

            {/* <!--Search Bar Modal --> */}
            <div 
              className="modal fade search_form search_form_modal_2" 
              id="exampleModal" 
              tabIndex="-1" 
              aria-labelledby="exampleModalLabel" 
              aria-hidden="true"
              onFocus={fetchPairs}
            >
              <div className="modal-dialog">
                <div className="modal-content">
                  <div className="modal-header">
                    <h5 className="modal-title" id="kycTitle">Hot Trading Pairs </h5>
                    <button type="button" className="btn-close" data-bs-dismiss="modal"></button>
                  </div>
                  <div className="modal-body" onClick={fetchPairs}>
                    <form>
                      <input 
                        type="search" 
                        className="searchfield"
                        placeholder="Search here..." 
                        value={searchPair} 
                        onChange={(e) => setSearchPair(e.target.value)} 
                        onFocus={fetchPairs}
                      />
                    </form>
                    <div className="hot_trading_t">
                      <div className='table-responsive'>
                        {pairsLoading ? (
                          <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
                            <div className="spinner-border text-primary" role="status" />
                          </div>
                        ) : (
                          <table>
                            <tbody>
                              {filteredPairs?.length > 0 ? filteredPairs.map((item, index) => {
                                return (
                                  <tr key={item?._id || index}>
                                    <td onClick={() => nextPage(item)} data-bs-dismiss="modal">
                                      <div className="td_first">
                                        <div className="icon"><img src={ApiConfig?.baseImage + item?.icon_path} alt="icon" /></div>
                                        <div className="price_heading"> {item?.base_currency} / {item?.quote_currency} <br /> <span>{item?.base_currency_fullname}</span></div>
                                      </div>
                                    </td>
                                    <td className="right_t price_tb">{item?.buy_price}<span className={`${item?.change_percentage > 0 ? "green" : "red"}`}>{item?.change_percentage}%</span></td>
                                  </tr>
                                )
                              }) : (
                                <tr rowSpan="5" className="no-data-row">
                                  <td className="w-100" >
                                  <div className="no-data-wrapper mt-5">
                                    <div className="no_data_s">
                                      <img src="/images/no_data_vector.svg" className="img-fluid dark_img" width="96" height="96" alt="" /><img src="/images/no_data_vector_light.png" className="img-fluid light_img" width="96" height="96" alt="" />
                                    </div>
                                  </div>
                                </td>
                              </tr>
                              )}
                            </tbody>
                          </table>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header >
      <div className={`sidebar_deposit ${isOpen ? "open" : ""}`} id="depositSidebar">
        <button className="close-btn" onClick={closeSidebar}>&times;</button>
        <h2>I have crypto assets</h2>
        <div className="deposit_list">
          <Link to='/asset_managemnet/deposit' className="deposit_option" onClick={closeSidebar}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="18" viewBox="0 0 20 18" fill="none"><path d="M18.75 10.25C18.5858 10.2499 18.4232 10.2822 18.2715 10.345C18.1198 
            10.4077 17.982 10.4998 17.8659 10.6159C17.7498 10.732 17.6577 10.8698 17.595 11.0215C17.5322 11.1732 17.4999 11.3358 17.5 11.5V15.25H2.5V11.5C2.5 11.1685 2.3683 10.8505 
            2.13388 10.6161C1.89946 10.3817 1.58152 10.25 1.25 10.25C0.91848 10.25 0.600537 10.3817 0.366117 10.6161C0.131696 10.8505 2.00941e-07 11.1685 2.00941e-07 11.5V16.5C-9.29127e-05 
            16.6642 0.0321757 16.8268 0.0949611 16.9785C0.157747 17.1302 0.249817 17.268 0.365909 17.3841C0.482001 17.5002 0.619837 17.5923 0.771536 17.655C0.923235 17.7178 1.08582 17.7501 
            1.25 17.75H18.75C18.9142 17.7501 19.0768 17.7178 19.2285 17.655C19.3802 17.5923 19.518 17.5002 19.6341 17.3841C19.7502 17.268 19.8423 17.1302 19.905 16.9785C19.9678 16.8268 
            20.0001 16.6642 20 16.5V11.5C20.0001 11.3358 19.9678 11.1732 19.905 11.0215C19.8423 10.8698 19.7502 10.732 19.6341 10.6159C19.518 10.4998 19.3802 10.4077 19.2285 10.345C19.0768
             10.2822 18.9142 10.2499 18.75 10.25Z" fill="white"></path>
              <path d="M9.11558 12.3838C9.23162 12.4999 9.3694 12.592 9.52104 12.6548C9.67268 12.7177 9.83522 12.75 9.99937 12.75C10.1635 12.75 10.3261 12.7177 10.4777 12.6548C10.6293 
            12.592 10.7671 12.4999 10.8832 12.3838L14.6332 8.63379C14.8665 8.39917 14.9972 8.0816 14.9968 7.75072C14.9963 7.41984 14.8647 7.10264 14.6307 6.86866C14.3967 6.63469 
            14.0795 6.50305 13.7486 6.50259C13.4178 6.50212 13.1002 6.63289 12.8656 6.86621L11.2494 8.48242V1.5C11.2494 1.16848 11.1177 0.850537 10.8833 0.616117C10.6488 0.381696 
            10.3309 0.25 9.99937 0.25C9.66785 0.25 9.34991 0.381696 9.11549 0.616117C8.88106 0.850537 8.74937 1.16848 8.74937 1.5V8.48242L7.13316 6.86621C6.89854 6.63289 6.58097 
            6.50212 6.25009 6.50259C5.9192 6.50305 5.602 6.63469 5.36803 6.86866C5.13406 7.10264 5.00241 7.41984 5.00195 7.75072C5.00149 8.0816 5.13226 8.39917 
            5.36558 8.63379L9.11558 12.3838Z" fill="white"></path></svg>
            <div className="deposit_cnt">
              Deposit Crypto
              <p>Send crypto to your URG-X Account</p>
            </div>
          </Link>
        </div>
        <h2 className='mt-4'>Withdraw crypto assets</h2>
        <div className="deposit_list">
          <Link to='/asset_managemnet/withdraw' className="deposit_option" onClick={closeSidebar}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="18" viewBox="0 0 20 18" fill="none">
              <path d="M18.75 10.25C18.5858 10.2499 18.4232 10.2822 18.2715 10.345C18.1198 10.4077 17.982 10.4998 17.8659 10.6159C17.7498 10.732
            17.6577 10.8698 17.595 11.0215C17.5322 11.1732 17.4999 11.3358 17.5 11.5V15.25H2.5V11.5C2.5 11.1685 2.3683 10.8505 2.13388 10.6161C1.89946
             10.3817 1.58152 10.25 1.25 10.25C0.91848 10.25 0.600537 10.3817 0.366117 10.6161C0.131696 10.8505 2.00941e-07 11.1685 2.00941e-07
              11.5V16.5C-9.29127e-05 16.6642 0.0321757 16.8268 0.0949611 16.9785C0.157747 17.1302 0.249817 17.268 0.365909 17.3841C0.482001 17.5002
               0.619837 17.5923 0.771536 17.655C0.923235 17.7178 1.08582 17.7501 1.25 17.75H18.75C18.9142 17.7501 19.0768 17.7178 19.2285 17.655C19.3802
                17.5923 19.518 17.5002 19.6341 17.3841C19.7502 17.268 19.8423 17.1302 19.905 16.9785C19.9678 16.8268 20.0001 16.6642 20 16.5V11.5C20.0001
                 11.3358 19.9678 11.1732 19.905 11.0215C19.8423 10.8698 19.7502 10.732 19.6341 10.6159C19.518 10.4998 19.3802 10.4077 19.2285 10.345C19.0768
                  10.2822 18.9142 10.2499 18.75 10.25Z" fill="white"></path><path d="M7.13316 6.13379L8.74937 4.51758V11.5C8.74937 11.8315 8.88106
                   12.1495 9.11549 12.3839C9.34991 12.6183 9.66785 12.75 9.99937 12.75C10.3309 12.75 10.6488 12.6183 10.8833 12.3839C11.1177 12.1495
                    11.2494 11.8315 11.2494 11.5V4.51758L12.8656 6.13379C13.1002 6.36711 13.4178 6.49787 13.7486 6.49741C14.0795 6.49695 14.3967 6.3653
                     14.6307 6.13133C14.8647 5.89736 14.9963 5.58016 14.9968 5.24928C14.9972 4.91839 14.8665 4.60083 14.6332 4.36621L10.8832 0.616206C10.7671
                      0.500108 10.6293 0.408011 10.4777 0.345176C10.3261 0.282341 10.1635 0.25 9.99937 0.25C9.83522 0.25 9.67268 0.282341 9.52104
                       0.345176C9.3694 0.408011 9.23162 0.500108 9.11558 0.616206L5.36558 4.36621C5.13226 4.60083 5.00149 4.91839 5.00195 5.24928C5.00241
                        5.58016 5.13406 5.89736 5.36803 6.13133C5.602 6.3653 5.9192 6.49695
            6.25009 6.49741C6.58097 6.49787 6.89854 6.36711 7.13316 6.13379Z" fill="white"></path></svg>
            <div className="deposit_cnt">
              Withdraw Crypto
              <p>Withdraw crypto to your preferred wallet</p>
            </div>
          </Link>
        </div>

      </div>
    </>
  )
}

export default AuthHeader
