import React, { useEffect, useState, useRef, useContext, useMemo, useCallback } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { ApiConfig } from "../../api/apiConfig/apiConfig";
import { ProfileContext } from "../../context/ProfileProvider";
import AuthService from "../../api/services/AuthService";

const UserHeader = () => {
  // eslint-disable-next-line no-unused-vars
  const { themeUpdated, setThemeUpdated } = useContext(ProfileContext);

  const [searchPair, setSearchPair] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [allPairs, setAllPairs] = useState([]);
  const [pairsLoading, setPairsLoading] = useState(false);
  const [pairsFetched, setPairsFetched] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef(null);

  // Check if current page is an auth page (no nav should be active)
  const isAuthPage = ['/login', '/signup', '/forgot_password', '/account-verification'].some(
    path => location.pathname.startsWith(path)
  );

  // Helper to check if a path is active (returns false on auth pages)
  const isActive = (path, exact = true) => {
    if (isAuthPage) return false;
    return exact ? location.pathname === path : location.pathname.includes(path);
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

  const filteredPairs = useMemo(() => {
    if (!searchPair) return allPairs;
    return allPairs.filter((item) =>
      item?.base_currency?.toLowerCase()?.includes(searchPair?.toLowerCase())
    );
  }, [searchPair, allPairs]);
  // Outside click closes dropdown and mobile nav
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenDropdown(null);
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  const toggleNavbar = () => setIsOpen(!isOpen);

  const closeNavbar = () => {
    setIsOpen(false);
    setOpenDropdown(null);
  };

  const toggleDropdown = (key) =>
    setOpenDropdown(openDropdown === key ? null : key);

  const dropdownCloseTimerRef = useRef(null);
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

  useEffect(() => {
    return () => {
      if (dropdownCloseTimerRef.current) clearTimeout(dropdownCloseTimerRef.current);
    };
  }, []);

  const nextPage = (data) => {
    localStorage.setItem("RecentPair", JSON.stringify(data));
    navigate(`/trade/${data?.base_currency}_${data?.quote_currency}`);
    window.location.reload();
  };

  const loginPage = () => navigate(`/login`);
  const signupPage = () => navigate(`/signup`);

  return (
    <header className="sticky-top">
      <div className="container-fluid">
        <div className="row">
          <div className="col-lg-2 logo_s">
            <div className="logo">
              <Link to="/">
                <img className='lightlogo' src="/images/logo_light.svg" alt="logo" />
                <img className='darkogo' src="/images/logo-black.svg" alt="logo" />
              </Link>
            </div>
          </div>

          <div className="col-lg-6 navigation_s">
            <div className="navigation" ref={dropdownRef}>
              <nav className="navbar navbar-expand-lg">
                <button className="navbar-toggler" type="button" onClick={toggleNavbar}>
                  <span className="navbar-toggler-icon">
                    <img src="/images/toggle_icon.svg" alt="toggle" />
                  </span>
                </button>

                <div className={`collapse navbar-collapse ${isOpen ? "show" : ""}`} id="mainNavbar">
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

                    {/* Futures Dropdown */}
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

                    {/* Earning Dropdown */}
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
                    <li className={`nav-item dropdown mbl ${isActive("/earning") || isActive("/refer_earn") ? "active" : ""}`}>
                      <span
                        className={`nav-link dropdown-toggle ${isActive("/earning") || isActive("/refer_earn") ? "active" : ""}`}
                        role="button"
                        style={{ cursor: "pointer" }}
                        onClick={() => toggleDropdown("download")}
                      >
                        <img src="/images/download_icon2.svg" alt="scan" width={12} /> Download
                      </span>
                      <ul className={`dropdown-menu ${openDropdown === "download" ? "show" : ""}`}>
                        <li>
                          <div className='qrcode'>
                            <div className="scan_img"><img src="/images/scan.png" alt="scan" /></div>
                            <p>Scan to Download App iOS & Android</p>
                            <button className='btn'>Download</button>
                          </div>
                        </li>
                      </ul>
                    </li>
                    {/* <li className="nav-item mbl">
                      <Link
                        className="nav-link"
                        to="/#"
                        onClick={(e) => {
                          e.preventDefault();
                          setThemeUpdated((prev) => !prev);
                          closeNavbar();
                        }}
                        role="button"
                        aria-label="Toggle theme"
                      >
                        Theme <span><img src="/images/themeicon.svg" alt="theme" /></span>
                      </Link>
                    </li> */}
                       <li className="nav-item mbl">
                      <Link
                        className="nav-link"
                        to="/#"
                        onClick={(e) => {
                          e.preventDefault();
                          setThemeUpdated((prev) => !prev);
                          closeNavbar();
                        }}
                        role="button"
                        aria-label="Toggle theme"
                      >
                        Theme <span><img src="/images/themeicon.svg" alt="theme" /></span>
                      </Link>
                    </li>
                  </ul>
                </div>
              </nav>
            </div>
          </div>

          <div className="col-lg-4">
            <div className="header_right">

              <div className="button_outer">
                <a className="search_icon" href="#" data-bs-toggle="modal" data-bs-target="#exampleModal" onClick={fetchPairs}>
                  <i className="ri-search-line"></i>
                </a>
                <button className="login_btn sign_btn" onClick={loginPage}>
                  <Link to="/login">Log In</Link>
                </button>
                <button className="login_btn" onClick={signupPage}>
                  <Link to="/signup">Sign Up</Link>
                </button>
                <div className="themecolor_icon" onClick={() => (setThemeUpdated(!themeUpdated))}>
                  <i className="ri-moon-line dark-text"></i>
                  <i className="ri-sun-line light-text"></i>
                </div>


                <div className="downloadtabs">
                  <img src="/images/download_icon2.svg" alt="download" />
                  <div className='scantophdr'>
                    <div className='qrcode'>
                      <div className="scan_img"><img src="/images/scan.png" alt="scan" /></div>
                      <p>Scan to Download App iOS & Android</p>
                      <button className='btn'>Download</button>
                    </div>
                  </div>
                </div>
                {/* <div className="themeicon"><img src="/images/themeicon.svg" alt="theme" /></div> */}
              </div>
            </div>
          </div>

          {/* Modal Search */}
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
                        <div >
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
    </header>
  );
};

export default UserHeader;
