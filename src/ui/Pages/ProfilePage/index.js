import React, { useContext, useEffect, useState, useMemo } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { ProfileContext } from "../../../context/ProfileProvider";
import { Helmet } from "react-helmet-async";

// Helper to capitalize wallet name
const capitalizeWallet = (str) => {
  if (!str) return 'Wallet';
  return str.charAt(0).toUpperCase() + str.slice(1) + ' Wallet';
};

const ProfilePage = (props) => {

  const location = useLocation();
  const { currentPage, setCurrentPage, walletTypes } = useContext(ProfileContext);

  // Dynamic wallet page detection
  useEffect(() => {
    const path = location.pathname;

    if (path.includes("/user_profile/dashboard")) setCurrentPage("Dashboard");
    else if (path.includes("asset_overview")) setCurrentPage("Overview");
    else if (path.includes("wallet/")) {
      // Extract wallet type from path and set dynamic page name
      const walletMatch = path.match(/wallet\/([^/]+)/);
      if (walletMatch && walletMatch[1]) {
        setCurrentPage(capitalizeWallet(walletMatch[1]));
      }
    }
    else if (path.includes("spot_orders")) setCurrentPage("Spot Order");
    else if (path.includes("transaction_history")) setCurrentPage("Transaction History");
    else if (path.includes("open_orders")) setCurrentPage("Open Order");
    else if (path.includes("swap_history")) setCurrentPage("Swap History");
    else if (path.includes("profile_setting")) setCurrentPage("Settings");
    else if (path.includes("kyc")) setCurrentPage("Verification");
    else if (path.includes("bank")) setCurrentPage("Bank Details");
    else if (path.includes("currency_preference")) setCurrentPage("Currency Preference");
    else if (path.includes("support")) setCurrentPage("Support");
    else if (path.includes("two_factor_autentication")) setCurrentPage("Security");
    else if (path.includes("password_security")) setCurrentPage("Reset Password");
    else if (path.includes("arbitrage_bot") || path.includes("arbitrage_dashboard")) setCurrentPage("Arbitrage Bot");
    else if (path.includes("wallet_transfer_History")) setCurrentPage("Wallet Transfer History");
    else if (path.includes("swap")) setCurrentPage("Quick Swap");
    else if (path.includes("notification")) setCurrentPage("Notification");
    else if (path.includes("activity_logs")) setCurrentPage("Activity logs");
    else if (path.includes("earning_plan_history")) setCurrentPage("Earning Plan History");
    else if (path.includes("bonus_history")) setCurrentPage("Bonus History");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // Check if current page is a wallet page
  const isWalletPage = useMemo(() => {
    return currentPage?.includes('Wallet') && currentPage !== 'Wallet Transfer History';
  }, [currentPage]);

  const [isActive, setIsActive] = useState(false);

  const navigate = useNavigate();

  const toggleContent = (page) => {
    setIsActive(!isActive);
    if (page) {

      setCurrentPage(page)
    }
  };

  const [openSection, setOpenSection] = useState(null);

  const toggleSection = (section) => {
    setOpenSection(openSection === section ? null : section);
  };

  // Icon mapping for current page
  const getPageIcon = useMemo(() => {
    const iconMap = {
      "Dashboard": "/images/dasboard_home.svg",
      "Overview": "/images/dashboard_assets.svg",
      "Spot Order": "/images/dashboard_order.svg",
      "Open Order": "/images/dashboard_order.svg",
      "Transaction History": "/images/dashboard_order.svg",
      "Swap History": "/images/dashboard_order.svg",
      "Wallet Transfer History": "/images/dashboard_order.svg",
      "Earning Plan History": "/images/dashboard_order.svg",
      "Bonus History": "/images/dashboard_order.svg",
      "Settings": "/images/dashboard_profile.svg",
      "Verification": "/images/dashboard_profile.svg",
      "kyc": "/images/dashboard_profile.svg",
      "Bank Details": "/images/dashboard_profile.svg",
      "Currency Preference": "/images/dashboard_profile.svg",
      "Support": "/images/dashboard_profile.svg",
      "Earning": "/images/earning_icon3.svg",
      "Security": "/images/dashboard_security.svg",
      "Reset Password": "/images/dashboard_security.svg",
      "Quick Swap": "/images/quick-swap.svg",
      "Notification": "/images/dashboard_notification.svg",
      "Activity logs": "/images/dashboard_logs.svg",
    };

    // Check if it's a wallet page
    if (currentPage?.includes('Wallet') && currentPage !== 'Wallet Transfer History') {
      return "/images/dashboard_assets.svg";
    }

    return iconMap[currentPage] || "/images/dasboard_home.svg";
  }, [currentPage]);

  const logOut = () => {
    localStorage.clear();
    navigate("/");
    // window.location.reload()
  }

  return (
    <>
      <Helmet>
        <title> Wrathcode | The world class new generation crypto asset exchange</title>
      </Helmet>
      <div className="mobile_view" id="toggleBtn" onClick={() => toggleContent()}>
        <img src={getPageIcon} alt={currentPage} width={20} height={20} style={{ marginRight: '8px' }} />
        <div className="d-flex align-items-center justify-content-between w-100">
        {currentPage}
        <span><i className="ri-arrow-down-s-line"></i></span>
        </div>
      </div>


      <div className="dashboard">


        <div id="content" className={isActive ? "active flex-shrink-0 leftside_menu" : "flex-shrink-0 leftside_menu"} >

          <ul className="list-unstyled ps-0 navi_sidebar">
            <li onClick={() => toggleContent("Dashboard")} className={`${currentPage === "Dashboard" && "active"} mb-1`}>
              <Link to="dashboard">
                <img className='darkicon' src="/images/dasboard_home.svg" alt="home" />
                <img className='lighticon' src="/images/dasboard_home_light.svg" alt="home" /> <div className="dashboard_menu_hd"> Dashboard
                  {/* <p>View your balances, latest features, and market overview at a glance. </p> */}
                </div>

              </Link>
            </li>

            <li className="mb-1">
              <button
                className="btn btn-toggle collapsed"
                onClick={() => toggleSection("assets")}
              >
                <img className='darkicon' src="/images/dashboard_assets.svg" alt="assets" />
                <img className='lighticon' src="/images/dashboard_assets_light.svg" alt="assets" />
                <div className={`dashboard_menu_hd ${(currentPage === "Overview" || isWalletPage) && "active_ul"}`}>
                  Assets
                  {/* <p>Manage your crypto holdings, track values, and monitor your asset portfolio.</p> */}
                </div>
                <span>
                  <i className="ri-arrow-down-s-line"></i>
                </span>
              </button>
              <div className={`collapse ${openSection === "assets" ? "show" : ""}`}>
                <ul className="btn-toggle-nav list-unstyled fw-normal pb-1 small">
                  <li onClick={() => toggleContent("Overview")} className={`${(currentPage === "Overview") && "active"} `}>
                    <Link to="asset_overview" className="rounded">
                      Overview
                    </Link>
                  </li>
                  {/* Dynamic wallet links from backend */}
                  {walletTypes?.length > 0 && walletTypes.map((wallet) => {
                    const walletLabel = capitalizeWallet(wallet);
                    return (
                      <li 
                        key={wallet} 
                        onClick={() => toggleContent(walletLabel)} 
                        className={`${(currentPage === walletLabel) && "active"} `}
                      >
                        <Link to={`wallet/${wallet}`} className="rounded">
                          {walletLabel}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </li>

            <li className="mb-1">
              <button
                className="btn btn-toggle collapsed "
                onClick={() => toggleSection("orders")}
              >
                <img className='darkicon' src="/images/dashboard_order.svg" alt="orders" />
                <img className='lighticon' src="/images/dashboard_order_light.svg" alt="orders" />
                <div className={`dashboard_menu_hd ${(currentPage === "Spot Order" || currentPage === "Open Order" || currentPage === "Transaction History" || currentPage === "Swap History" || currentPage === "Earning Plan History") && "active_ul"}`}>
                  Orders
                  {/* <p>Check your transaction history and spot orders.</p> */}
                  </div>
                <span>
                  <i className="ri-arrow-down-s-line"></i>
                </span>
              </button>
              <div className={`collapse ${openSection === "orders" ? "show" : ""}`}>
                <ul className="btn-toggle-nav list-unstyled fw-normal pb-1 small">
                  <li onClick={() => toggleContent("Spot Order")} className={`${(currentPage === "Spot Order") && "active"} `}>
                    <Link to="spot_orders" className="rounded">
                      Spot Order
                    </Link>
                  </li>
                  <li onClick={() => toggleContent("Open Order")} className={`${(currentPage === "Open Order") && "active"} `}>
                    <Link to="open_orders" className="rounded">
                      Open Order
                    </Link>
                  </li>
                  <li onClick={() => toggleContent("Transaction History")} className={`${(currentPage === "Transaction History") && "active"} `}>
                    <Link to="transaction_history" className="rounded">
                      Transaction History
                    </Link>
                  </li>

                  <li onClick={() => toggleContent("Swap History")} className={`${(currentPage === "Swap History") && "active"} `}>
                    <Link to="swap_history" className="rounded">
                      Swap History
                    </Link>
                  </li>

                  <li onClick={() => toggleContent("Wallet Transfer History")} className={`${(currentPage === "Wallet Transfer History") && "active"} `}>
                    <Link to="wallet_transfer_History" className="rounded">
                      Internal Wallet Transfer
                    </Link>
                  </li>
                  <li onClick={() => toggleContent("Earning Plan History")} className={`${(currentPage === "Earning Plan History") && "active"} `}>
                    <Link to="earning_plan_history" className="rounded">
                      Earning History
                    </Link>
                  </li>
                  {/* <li onClick={() => toggleContent("Bonus History")} className={`${(currentPage === "Bonus History") && "active"} `}>
                    <Link to="bonus_history" className="rounded">
                      Bonus History
                    </Link>
                  </li> */}
                  {/* <li onClick={() => toggleContent("Launchpad Transactions")} className={`${(currentPage === "Launchpad Transactions") && "active"} `}>
                    <Link to="launchpad_transactions" className="rounded">
                      Launchpad Transactions
                    </Link>
                  </li> */}
                </ul>
              </div>
            </li>

            <li className="mb-1">
              <button
                className="btn btn-toggle collapsed"
                onClick={() => toggleSection("profile")}
              >
                <img className='darkicon' src="/images/dashboard_profile.svg" alt="profile" />
                <img className='lighticon' src="/images/dashboard_profile_light.svg" alt="profile" />
                <div className={`dashboard_menu_hd ${(currentPage === "Settings" || currentPage === "kyc" || currentPage === "Currency Preference" || currentPage === "Support") && "active_ul"}`}>
                  Account
                  {/* <p>Update your personal info, manage account details and portofilio currency.</p> */}
                </div>
                <span>
                  <i className="ri-arrow-down-s-line"></i>
                </span>
              </button>
              <div className={`collapse ${openSection === "profile" ? "show" : ""}`}>
                <ul className="btn-toggle-nav list-unstyled fw-normal pb-1 small">
                  <li onClick={() => toggleContent("Settings")} className={`${(currentPage === "Settings") && "active"} `}>
                    <Link to="profile_setting" className="rounded">
                      Settings
                    </Link>
                  </li>
                  {/* <li onClick={() => toggleContent("Verification")} className={`${(currentPage === "Verification") && "active"} `}>
                    <Link to="verification" className="rounded">
                      Verification
                    </Link>
                  </li> */}
                  <li onClick={() => toggleContent("Verification")}
                    className={`${(currentPage === "Verification") && "active"} `}>
                    <Link to="kyc" className="rounded">
                     Verification
                    </Link>
                  </li>
                  {/* <li onClick={() => toggleContent("Bank Details")} className={`${(currentPage === "Bank Details") && "active"} `}>
                    <Link to="bank" className="rounded">
                      Bank Details
                    </Link>
                  </li> */}
                  {/* <li onClick={() => toggleContent("Currency Preference")} className={`${(currentPage === "Currency Preference") && "active"} `}>
                    <Link to="currency_preference" className="rounded">
                      Currency Preference
                    </Link>
                  </li> */}
                  <li onClick={() => toggleContent("Support")} className={`${(currentPage === "Support") && "active"} `}>
                    <Link to="support" className="rounded">
                      Support
                    </Link>
                  </li>

                </ul>
              </div>
            </li>
            <li onClick={() => toggleContent("Earning")} className={`${currentPage === "Earning" && "active"} mb-1`}>
              <Link to="/earning">
                <img className='darkicon' src="/images/earning_icon3.svg" alt="Earning" width={26} />
                <div className="dashboard_menu_hd">
                  Earning
                  {/* <p>Monitor earnings from staking, referrals, and trading activities.</p> */}
                </div>
              </Link>
            </li>
            {/* <li onClick={() => toggleContent("giveaway")} className={`${currentPage === "giveaway" && "active"} mb-1`}>
              <Link to="giveaway">
                <img className='darkicon' src="/images/earning_icon3.svg" alt="giveaway" width={26} />
                <div className="dashboard_menu_hd">
                  Giveaways
                 
                </div>
              </Link>
            </li> */}

            {/* <li
              onClick={() => toggleContent("launchpadTransactions")}
              className={`${currentPage === "launchpadTransactions" && "active"} mb-1`}>
              <Link to="/launchpadTransactions">
                <img
                  className="darkicon"
                  src="/images/earning_icon3.svg"
                  alt="Earning"
                  width={26}
                />
                <div className="dashboard_menu_hd">
                  Launchpad Transactions
                  <p>Track all your token purchase and investment transactions in one place.</p>
                </div>
              </Link>
            </li> */}

           

            <li onClick={() => toggleContent("Security")} className={`${currentPage === "Security" && "active"} mb-1`}>
              <Link to="two_factor_autentication">
                <img className='darkicon' src="/images/dashboard_security.svg" alt="two factor authentication" width={20} height={20} />
                <img className='lighticon' src="/images/dashboard_security_light.svg" alt="two factor authentication" width={20} height={20} />
                <div className="dashboard_menu_hd">
               Security

                  {/* <p>Instantly swap your cryptocurrencies with real-time conversion rates.</p> */}
                </div>

              </Link>
            </li>
    
            <li onClick={() => toggleContent("Quick Swap")} className={`${currentPage === "Quick Swap" && "active"} mb-1`}>
              <Link to="swap">
                <img className='darkicon' src="/images/quick-swap.svg" alt="quick swap" width={20} height={20} />
                <img className='lighticon' src="/images/dashboard_swap_light.svg" alt="quick swap" width={20} height={20} />
                <div className="dashboard_menu_hd">
                  Quick Swap

                  {/* <p>Instantly swap your cryptocurrencies with real-time conversion rates.</p> */}
                </div>

              </Link>
            </li>


       

            <li onClick={() => toggleContent("Notification")} className={`${currentPage === "Notification" && "active"} mb-1`}>
              <Link to="notification">
                <img className='darkicon' src="/images/dashboard_notification.svg" alt="notification" />
                <img className='lighticon' src="/images/dashboard_notification_light.svg" alt="security" />
                <div className="dashboard_menu_hd">
                  Notification
                  {/* <p>Stay updated with alerts, trade notifications, system updates, and news.</p> */}
                </div>
              </Link>
            </li>

            <li onClick={() => toggleContent("Activity logs")} className={`${currentPage === "Activity logs" && "active"} mb-1`}>
              <Link to="activity_logs">
                <img className='darkicon' src="/images/dashboard_logs.svg" alt="activity" />
                <img className='lighticon' src="/images/dashboard_activity_light.svg" alt="activity logs" />
                <div className="dashboard_menu_hd">
                  Activity logs

                  {/* <p>Review your login history, device access logs, and recent account activity.</p> */}
                </div>
              </Link>
            </li>
          </ul>
          <div className="logout_btn" onClick={logOut}>
            <Link to="#/">Logout<i className="ri-logout-circle-r-line"></i></Link>
          </div>
        </div>
        <Outlet />
      </div>
    </>
  )
}

export default ProfilePage
