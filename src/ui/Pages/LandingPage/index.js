import React, { useState, useContext, useEffect, useRef, useCallback } from "react";
import { ApiConfig } from "../../../api/apiConfig/apiConfig";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { SocketContext } from "../../../customComponents/SocketContext";
import LoaderHelper from "../../../customComponents/Loading/LoaderHelper";
import AuthService from "../../../api/services/AuthService";
import { alertErrorMessage, alertSuccessMessage } from "../../../customComponents/CustomAlertMessage";
import { useGoogleLogin } from "@react-oauth/google";
import { ProfileContext } from "../../../context/ProfileProvider";
import { usePlatformStatus } from "../../../context/PlatformStatusProvider";
import { Helmet } from "react-helmet-async";
import { $ } from "react-jquery-plugin";
import "./home.css";

const FEATURE_LABELS = {
  spot_trading: 'Spot Trading',
  futures_trading: 'Futures Trading',
  p2p_trading: 'P2P Trading',
  staking: 'Staking',
  launchpad: 'Launchpad',
  swap: 'Swap',
  deposit: 'Deposit',
  withdrawal: 'Withdrawal',
};

const LandingPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { socket, marketData, subscribeToMarket, unsubscribeFromMarket } = useContext(SocketContext);
  const { setLoginDetails } = useContext(ProfileContext);
  const { platformStatus, loading } = usePlatformStatus();
  const googlecaptchaRef = useRef(null);
  const videoRef = useRef(null);

  // State declarations
  const [topGainers, setTopGainers] = useState([]);
  const [newListings, setNewListings] = useState([]);
  const [memePairs, setMemePairs] = useState([]);
  const [activeMobileTab, setActiveMobileTab] = useState(0);
  const [showDisabledFeaturesModal, setShowDisabledFeaturesModal] = useState(false);

  // Disabled features popup: show when there are disabled features (exclude full_maintenance)
  const disabledFeatures = React.useMemo(() => {
    if (!platformStatus) return [];
    return Object.entries(platformStatus)
      .filter(([key, item]) => key !== 'full_maintenance' && item?.enabled === false)
      .map(([key]) => ({ key, label: FEATURE_LABELS[key] || key }));
  }, [platformStatus]);

  useEffect(() => {
    if (loading || disabledFeatures.length === 0) return;
    const dismissed = sessionStorage.getItem('disabledFeaturesPopupDismissed');
    if (!dismissed) setShowDisabledFeaturesModal(true);
  }, [loading, disabledFeatures.length]);

  // Show Bootstrap modal when popup should be visible
  useEffect(() => {
    if (!showDisabledFeaturesModal || disabledFeatures.length === 0) return;
    const el = document.getElementById('disabledFeaturesModal');
    if (!el) return;
    const $el = $(el);
    $el.modal('show');
    const onHidden = () => {
      setShowDisabledFeaturesModal(false);
      sessionStorage.setItem('disabledFeaturesPopupDismissed', '1');
      $el.off('hidden.bs.modal', onHidden);
    };
    $el.on('hidden.bs.modal', onHidden);
    return () => $el.off('hidden.bs.modal', onHidden);
  }, [showDisabledFeaturesModal, disabledFeatures.length]);

  // Navigate to trade page
  const nextPage = useCallback((data) => {
    if (!data?.base_currency || !data?.quote_currency) return;
    try {
      localStorage.setItem('RecentPair', JSON.stringify(data));
      navigate(`/trade/${data.base_currency}_${data.quote_currency}`);
    } catch {
      // Silent fail for localStorage errors
    }
  }, [navigate]);

  // Format number safely
  const formatNumber = useCallback((data, decimal = 5) => {
    try {
      const num = typeof data === "string" ? Number(data) : data;
      if (typeof num === "number" && !isNaN(num) && isFinite(num)) {
        return parseFloat(num.toFixed(decimal));
      }
      return "0.00";
    } catch {
      return "0.00";
    }
  }, []);

  // Google login handler
  const handleLoginGoogle = useCallback(async (tokenResponse) => {
    if (!tokenResponse) return;
    LoaderHelper.loaderStatus(true);
    try {
      const result = await AuthService.googleLogin(tokenResponse);
      if (result?.success) {
        alertSuccessMessage(result?.message);
        localStorage.setItem("token", result.data?.token || "");
        localStorage.setItem("userId", result.data?.userId || "");
        setLoginDetails(result?.data);
        const redirectPath = location?.state?.redirectTo || "/user_profile/dashboard";
        navigate(redirectPath, { replace: true });
        window.location.reload();
      } else {
        alertErrorMessage(result?.message || "Login failed");
      }
    } catch {
      alertErrorMessage("Login failed. Please try again.");
    } finally {
      LoaderHelper.loaderStatus(false);
    }
  }, [location?.state?.redirectTo, navigate, setLoginDetails]);

  // Google login hook
  useGoogleLogin({
    onSuccess: tokenResponse => {
      if (tokenResponse?.access_token) {
        if (googlecaptchaRef.current) {
          googlecaptchaRef.current.showCaptcha?.();
        }
        handleLoginGoogle(tokenResponse);
      }
    },
    onError: () => {
      // Silent fail for Google login errors
    }
  });

  // Video playback speed
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = 0.6;
    }
  }, []);

  // Subscribe to market data (server-push, no polling needed)
  useEffect(() => {
    if (!socket) return;

    // Subscribe to market updates
    subscribeToMarket();

    return () => {
      unsubscribeFromMarket();
    };
  }, [socket, subscribeToMarket, unsubscribeFromMarket]);

  // Update local state from context marketData
  useEffect(() => {
    try {
      const pairs = marketData?.pairs || [];
      if (pairs.length === 0) return;

      // Meme Pairs - filter by pairType "meme"
      const memes = pairs
        .filter((item) => item?.pairType === "meme")
        .slice(0, 5);
      setMemePairs(memes);

      // Top Gainers - sorted from highest to lowest change percentage
      const gainers = [...pairs]
        .sort((a, b) => (b?.change_percentage || 0) - (a?.change_percentage || 0))
        .slice(0, 5);
      setTopGainers(gainers);

      // New Listings - sorted by creation date (newest first)
      const listings = [...pairs]
        .sort((a, b) => {
          const dateA = new Date(a?.createdAt || a?.created_at || 0);
          const dateB = new Date(b?.createdAt || b?.created_at || 0);
          return dateB - dateA;
        })
        .slice(0, 5);
      setNewListings(listings);
    } catch {
      // Silent fail for data processing errors
    }
  }, [marketData]);

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  return (

    <>

      <Helmet>
        <title>Join Wrathcode Today – Trade Crypto + Get Exclusive Rewards</title>

        <meta
          name="description"
          content="Sign up with Wrathcode, complete verification and deposit to unlock exclusive rewards. Trade top cryptocurrencies like Bitcoin, Ethereum & more in a trusted environment. Limited time offer."
        />

        <meta
          name="keywords"
          content="crypto rewards platform, Bitcoin Ethereum trading rewards, verified crypto exchange Wrathcode, crypto offer trade reward"
        />
      </Helmet>






      <div className="hero_section_main">
        <video
          ref={videoRef}
          className="bg-video"
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
        >
          <source
            src="https://img.bgstatic.com/video/msg/herobanner-1732092714.webm"
            type="video/webm"
          />
        </video>

        <div className="container">
          <div className="row">
            <div className="banner_content">
              <h1>The Smarter Way to Buy, <span className="sub_heading">Trade &amp; Invest</span> in Crypto</h1>
              <p>A powerful crypto platform designed for speed, security, and smarter investing — all in one place.</p>

              <div className="d-flex download_button">
                <button className="btn" onClick={() => navigate("/signup")}>Get Started</button>
                <button className="btn platform" onClick={() => navigate("/trade/BTC_USDT")}>Explore Platform</button>
              </div>

            </div>
            <div className="banner_img">
              <img className="bitcoin_right animation" src="images/new-images/banner_vectror_ani.svg" alt="decoration" />
              <img className="crypto_cntr animation" src="images/new-images/banner_vectror_ani3.svg" alt="decoration" />
              <div className="banner_img_main">
                <img src="images/new-images/banner_img.svg" alt="banner" />
              </div>
              <img className="bitcoin_left animation" src="images/new-images/banner_vectror_ani2.svg" alt="decoration" />
            </div>
          </div>
        </div>
      </div>

      <div className="currency_logo">
        <ul>
          <li>
            <div className="cnt">
              <span>Instantly Convert</span>
              <h3>USDT to INR</h3>
            </div>
            <div className="icon_crypto">
              <img src="images/new-images/cryptoadd_vector.png" alt="crypto" />
            </div>
          </li>
          <li>
            <div className="cnt">
              <span>Spend and Earn upto 100%</span>
              <h3>Crypto Cashback</h3>
            </div>
            <div className="icon_crypto">
              <img src="images/new-images/cryptoadd_vector2.png" alt="crypto" />
            </div>
          </li>
          <li>
            <div className="cnt">
              <span>Experience Seamless</span>
              <h3>Crypto Withdrawals</h3>
            </div>
            <div className="icon_crypto">
              <img src="images/new-images/cryptoadd_vector3.png" alt="crypto" />
            </div>
          </li>
          <li>
            <div className="cnt">
              <h3>Buy USDT (Tether)</h3>
              <span>at Lowest Price</span>
            </div>
            <div className="icon_crypto">
              <img src="images/new-images/cryptoadd_vector4.png" alt="crypto" />
            </div>
          </li>
          <li>
            <div className="cnt">
              <span>Registered with</span>
              <h3>F.I.U. of India</h3>
            </div>
            <div className="icon_crypto">
              <img src="images/new-images/cryptoadd_vector5.png" alt="crypto" />
            </div>
          </li>
          <li>
            <div className="cnt">
              <span>Spend and Earn upto 100%</span>
              <h3>Crypto Cashback</h3>
            </div>
            <div className="icon_crypto">
              <img src="images/new-images/cryptoadd_vector2.png" alt="crypto" />
            </div>
          </li>
          <li>
            <div className="cnt">
              <span>Experience Seamless</span>
              <h3>Crypto Withdrawals</h3>
            </div>
            <div className="icon_crypto">
              <img src="images/new-images/cryptoadd_vector3.png" alt="crypto" />
            </div>
          </li>
          <li>
            <div className="cnt">
              <h3>Buy USDT (Tether)</h3>
              <span>at Lowest Price</span>
            </div>
            <div className="icon_crypto">
              <img src="images/new-images/cryptoadd_vector4.png" alt="crypto" />
            </div>
          </li>
          <li>
            <div className="cnt">
              <span>Registered with</span>
              <h3>F.I.U. of India</h3>
            </div>
            <div className="icon_crypto">
              <img src="images/new-images/cryptoadd_vector5.png" alt="crypto" />
            </div>
          </li>
        </ul>
      </div>



      <div className="crypto_section trending_crypto">
        <div className="container">
          <h2>Trending Cryptocurrencies</h2>
          <p>Real-time market movers powered by live data and smart analytics.</p>

          <div className="crypto_tabs_mbl">
            <ul>
              <li className={activeMobileTab === 0 ? "active" : ""}><button onClick={() => setActiveMobileTab(0)}>Meme Coins</button></li>
              <li className={activeMobileTab === 1 ? "active" : ""}><button onClick={() => setActiveMobileTab(1)}>Top Gainers</button></li>
              <li className={activeMobileTab === 2 ? "active" : ""}><button onClick={() => setActiveMobileTab(2)}>New Listings</button></li>
            </ul>
          </div>

          <div className="crypto_dashboard">
            {/* Meme Pairs */}
            <div className={`hot_spot_outer ${activeMobileTab === 0 ? 'active' : ''}`}>
              <div className="top_heading">
                <h4>Meme Coins</h4>
              </div>
              <div className="hot_trading_s">
                <div className="table-responsive">
                  <table>
                    {memePairs?.length > 0 ? (
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th className="text-end">Price</th>
                        </tr>
                      </thead>
                    ) : ""}
                    <tbody>
                      {memePairs?.length > 0 ? (
                        memePairs.map((item, index) => (
                          <tr key={item?._id || index} onClick={() => nextPage(item)}>
                            <td className="first_coloum">
                              <div className="td_first">
                                <div className="icon">
                                  <img
                                    alt={item?.base_currency}
                                    src={ApiConfig.baseImage + item?.icon_path}
                                    width="28"
                                    className="img-fluid icon_img coinimg me-2"
                                  />
                                </div>
                                <div className="price_heading">
                                  {item?.base_currency} / {item?.quote_currency}
                                </div>
                              </div>
                            </td>
                            <td className="price_right_top text-end">
                              {formatNumber(item?.buy_price, 5)}
                              <span className={item?.change_percentage >= 0 ? "green" : "red"}>
                                {" "}{item?.change_percentage >= 0 ? "▲" : "▼"} {formatNumber(item?.change_percentage, 3)}%
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="3" className="p-0">
                            <div className="favouriteData text-center">
                              <img
                                src="/images/no_data_vector.svg"
                                className="img-fluid"
                                width="96"
                                height="96"
                                alt="no data"
                              />
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            {/* TOP GAINERS */}
            <div className={`hot_spot_outer ${activeMobileTab === 1 ? 'active' : ''}`}>
              <div className="top_heading">
                <h4>Top Gainers</h4>
              </div>

              <div className="hot_trading_s">
                <div className="table-responsive">
                  <table>
                    {topGainers?.length > 0 ? (
                      <thead>
                      <tr>
                        <th>Name</th>
                        <th className="text-end">Price</th>
                      </tr>
                    </thead>
                    ) : ""}
                    <tbody>
                      {topGainers?.length > 0 ? (
                        topGainers.map((item, index) => (
                          <tr key={item?._id || index} onClick={() => nextPage(item)}>
                            <td className="first_coloum">
                              <div className="td_first">
                                <div className="icon">
                                  <img
                                    alt={item?.base_currency}
                                    src={ApiConfig.baseImage + item?.icon_path}
                                    width="30"
                                    className="img-fluid icon_img coinimg me-2"
                                  />
                                </div>
                                <div className="price_heading">
                                  {item?.base_currency} / {item?.quote_currency}
                                </div>
                              </div>
                            </td>
                            <td className="price_right_top text-end">
                              {formatNumber(item?.buy_price, 5)}
                              <span className={item?.change_percentage >= 0 ? "green" : "red"}>
                                {" "}{item?.change_percentage >= 0 ? "▲" : "▼"} {formatNumber(item?.change_percentage, 3)}%
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                        <td colSpan="3" className="p-0">
                          <div className="favouriteData text-center">
                            <img
                              src="/images/no_data_vector.svg"
                              className="img-fluid"
                              width="96"
                              height="96"
                              alt="no data"
                            />
                          </div>
                        </td>
                      </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            {/* NEW LISTINGS */}
            <div className={`hot_spot_outer ${activeMobileTab === 2 ? 'active' : ''}`}>
              <div className="top_heading">
                <h4>New Listings</h4>
              </div>

              <div className="hot_trading_s">
                <div className="table-responsive">
                  <table>
                    {newListings?.length > 0 ? (
                      <thead>
                      <tr>
                        <th>Name</th>
                        <th className="text-end">Price</th>
                      </tr>
                    </thead>
                    ) : ""}
                    <tbody>
                      {newListings?.length > 0 ? (
                        newListings.map((item, index) => (
                          <tr key={item?._id || index} onClick={() => nextPage(item)}>
                            <td className="first_coloum">
                              <div className="td_first">
                                <div className="icon">
                                  <img
                                    alt={item?.base_currency}
                                    src={ApiConfig.baseImage + item?.icon_path}
                                    width="30"
                                    className="img-fluid icon_img coinimg me-2"
                                  />
                                </div>
                                <div className="price_heading">
                                  {item?.base_currency} / {item?.quote_currency}
                                </div>
                              </div>
                            </td>
                            <td className="price_right_top text-end">
                              {formatNumber(item?.buy_price, 5)}
                              <span className={item?.change_percentage >= 0 ? "green" : "red"}>
                                {" "}{item?.change_percentage >= 0 ? "▲" : "▼"} {formatNumber(item?.change_percentage, 3)}%
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                        <td colSpan="3" className="p-0">
                          <div className="favouriteData text-center">
                            <img
                              src="/images/no_data_vector.svg"
                              className="img-fluid"
                              width="96"
                              height="96"
                              alt="no data"
                            />
                          </div>
                        </td>
                      </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          <div className="viewmorebtn">
            <NavLink to="/market">View More <i className="ri-arrow-right-line"></i></NavLink>
          </div>

        </div>
      </div>



      <section className="crypto_exchange_section">
        <div className="container">
          <div className="cryptofuture_s">
            <div className="crypto_future_cnt">
              <h2>A Crypto Exchange Built for <span>the Future</span></h2>
              <p>Securely store, manage, and grow your digital assets with next-generation wallet technology
                designed for speed, privacy, and total control.</p>
              <ul className="listcrypto">
                <li><i className="ri-checkbox-circle-fill"></i> Lowest transaction fees in the market</li>
                <li><i className="ri-checkbox-circle-fill"></i> Instant deposits and withdrawals</li>
                <li><i className="ri-checkbox-circle-fill"></i> Advanced 256-bit encryption security</li>
                <li><i className="ri-checkbox-circle-fill"></i> Real-time portfolio tracking</li>
                <li><i className="ri-checkbox-circle-fill"></i> Multi-asset wallet support</li>
              </ul>
              <button className="downloadbtn">Download App</button>
            </div>

            <div className="exchange_future_s">
              <img className="animation_effect summary_data" src="images/new-images/crypto_summry.svg" alt="" />
              <img src="images/new-images/crypto_mobile.svg" alt="crypto exchange" />
              <img className="animation_effect bitcoin2" src="images/new-images/crypto_bitcoin.svg" alt="" />
            </div>

          </div>

          <div className="cryptofuture_s reverse_security">

            <div className="exchange_future_s">
              <img src="images/new-images/verification_mobile.svg" alt="Bulletproof" />
              <img className="animation_effect bitcoin" src="images/new-images/lock_vector.svg" alt="" />
            </div>

            <div className="crypto_future_cnt">
              <h2><span>Bulletproof</span> Security, Built by Design</h2>
              <p>Your assets and data are protected by industry-leading security protocols, advanced encryption, and continuous monitoring — so you can trade with complete peace of mind.</p>

              <ul className="security_list">
                <li>
                  <h3>0.</h3>
                  <p>Security Incidents</p>
                </li>
                <li>
                  <h3>256<span>bits</span></h3>
                  <p>AES Encryption</p>
                </li>
                <li>
                  <h3>100<span>%</span></h3>
                  <p>Encrypted Data</p>
                </li>
                <li>
                  <h3>CISA<span>+</span></h3>
                  <p>Security Compliance</p>
                </li>
              </ul>

            </div>

          </div>


        </div>
      </section>


      <div className="profit_costs_cta_outer platform_trading_s">
        <div className="container">

          <div className="d-flex invest_tradetop">
            <h2>Fully Equipped to Buy, <span>Trade & Invest</span> in Crypto.</h2>
            <div className="d-flex download_button">
              <button className="btn">Download App</button>
              <button className="btn platform" onClick={() => navigate("/login")}>Browse All Features</button>
            </div>
          </div>

          <section className="crypto_features">
            <div className="card borderlft assetstrade">
              <div className="content">
                <h4>Buy 100+ Crypto Assets</h4>
                <p>Trade top cryptocurrencies and emerging tokens with deep liquidity and real-time pricing across global markets.</p>
                <NavLink className="learnbtn" to="/market">Learn more <i className="ri-arrow-right-line"></i></NavLink>
              </div>
              <div className="crypto_app_mbl"><img src="images/new-images/crypto_assets.png" alt="Crypto App" className="phone" /></div>
            </div>

            <div className="card">
              <div className="trade_icon"><img src="images/new-images/secure_wallet.png" alt="Secure and Encrypted Wallet" className="phone" /></div>
              <h4>Secure &amp; Encrypted Wallet</h4>
              <p>Protect your assets with enterprise-grade security, multi-layer encryption, and full ownership of your funds.</p>
            </div>

            <div className="card borderlft border_btm">
              <div className="trade_icon"><img src="images/new-images/receive_send.svg" alt="Send and Receive Instantly" className="phone" /></div>
              <h4>Send &amp; Receive Instantly</h4>
              <p>Transfer crypto effortlessly with fast confirmations, low fees, and seamless wallet-to-wallet transactions.</p>
            </div>

            <div className="card borderlft border_btm">
              <div className="trade_icon"><img src="images/new-images/invest_icon.png" alt="Invest in Real Time" className="phone" /></div>
              <h4>Invest in Real Time</h4>
              <p>Track market movements, execute trades instantly, and manage your investments as the market evolves.</p>
            </div>

            <div className="card border_btm">
              <div className="trade_icon"><img src="images/new-images/analyze_charts.png" alt="Watch and Analyze Charts" className="phone" /></div>
              <h4>Watch &amp; Analyze Charts</h4>
              <p>Make informed decisions using advanced charts, live indicators, and professional-grade analytics tools.</p>
            </div>

          </section>


          <div className="row cta_register_s">
            <div className="col-sm-5">
              <div className="profit_cost_cnt">
                <h2>Built to Support the Most Trusted <span>Cryptocurrencies</span></h2>
                <p>Seamlessly buy, store, and trade leading digital assets through native blockchain integrations designed for speed, reliability, and performance.</p>

                <div className="d-flex download_button">
                  <button className="btn">Download App</button>
                  <button className="btn platform" onClick={() => navigate("/market")}>Browse All Cryptos</button>
                </div>

              </div>
            </div>
            <div className="col-sm-7">
              <div className="supportvector">
                <img className="animation_effect bitcoin1" src="images/new-images/bitcoin_crypto2.png" alt="" />
                <img className="bitcoin" src="images/new-images/support_crypto_vector.png" alt="Supported Cryptocurrencies" />
                <img className="animation_effect bitcoin2" src="images/new-images/bitcoin_crypto3.png" alt="" />
                <img className="animation_effect bitcoin3" src="images/new-images/bitcoin_crypto4.png" alt="" />
              </div>
            </div>

          </div>
        </div>


      </div>

      <div className="latest_resources">
        <div className="container">
          <div className="d-flex invest_tradetop">
            <div className="resourceslft">
              <h2>Latest <span>Resources.</span></h2>
              <p>Stay informed with expert insights, product updates, and deep-dive guides designed to help you trade smarter and stay ahead in the crypto market.</p>
            </div>

          </div>

          <div className="row">
            <div className="col-sm-4">
              <div className="resources_news">
                <div className="news_img">
                  <img className="blogimg" src="images/new-images/platform_trade.png" alt="Trade Bitcoin" />
                </div>
                <div className="resources_cnt">
                  <h3>The Best Platform to Trade Bitcoin</h3>
                  <p>Experience lightning-fast trades with our advanced matching engine. Trade BTC, ETH, and 200+ cryptocurrencies with deep liquidity and minimal slippage.</p>
                </div>
              </div>
            </div>

            <div className="col-sm-4">
              <div className="resources_news">
                <div className="news_img">
                  <img className="blogimg" src="images/new-images/secure_crypto.png" alt="Bank-Grade Security" />
                </div>
                <div className="resources_cnt">
                  <h3>Bank-Grade Security for Your Assets</h3>
                  <p>Your funds are protected with multi-signature cold storage, 2FA authentication, and real-time threat monitoring. We've never been compromised.</p>
                </div>
              </div>
            </div>

            <div className="col-sm-4">
              <div className="resources_news">
                <div className="news_img">
                  <img className="blogimg" src="images/new-images/secure_crypto2.png" alt="Earn Passive Income" />
                </div>
                <div className="resources_cnt">
                  <h3>Earn Passive Income on Your Crypto</h3>
                  <p>Put your idle assets to work with competitive staking rewards and flexible earning plans. Earn up to 12% APY on your holdings.</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>


      <div className="trusted_partner">
        <div className="partner_logos">
          <div className="logos_slide">

            <div className="gallery_crypto">
              <img className="cryptoicon" src="images/new-images/cryptogallery.png" alt="P2P" />
              <h4>P2P</h4>
              <p>Maximize your capital efficiency</p>
              <Link className="learnbtn" to="/p2p">Find out more <i className="ri-arrow-right-line"></i></Link>
            </div>

            <div className="gallery_crypto">
              <img className="cryptoicon" src="images/new-images/cryptogallery2.png" alt="Launchpad" />
              <h4>Launchpad</h4>
              <p>Lowest prices across the network</p>
              <Link className="learnbtn" to="/launchpad">Find out more <i className="ri-arrow-right-line"></i></Link>
            </div>

            <div className="gallery_crypto">
              <img className="cryptoicon" src="images/new-images/cryptogallery3.png" alt="Earning" />
              <h4>Earning</h4>
              <p>One-click trading for all memes</p>
              <Link className="learnbtn" to="/earning">Find out more <i className="ri-arrow-right-line"></i></Link>
            </div>

            <div className="gallery_crypto">
              <img className="cryptoicon" src="images/new-images/cryptogallery4.png" alt="Staking" />
              <h4>Staking</h4>
              <p>Trade US stock tokens with USDT</p>
              <Link className="learnbtn" to="/earning">Find out more <i className="ri-arrow-right-line"></i></Link>
            </div>

            <div className="gallery_crypto">
              <img className="cryptoicon" src="images/new-images/cryptogallery5.png" alt="Futures Trading" />
              <h4>Futures Trading</h4>
              <p>Ultra-low latency, seamless execution</p>
              <Link className="learnbtn" to="/usd_futures/BTC_USDT">Find out more <i className="ri-arrow-right-line"></i></Link>
            </div>

            <div className="gallery_crypto">
              <img className="cryptoicon" src="images/new-images/cryptogallery6.png" alt="Spot Trading" />
              <h4>Spot Trading</h4>
              <p>Over 100+ tokens at your fingertips</p>
              <Link className="learnbtn" to="/trade/BTC_USDT">Find out more <i className="ri-arrow-right-line"></i></Link>
            </div>

            <div className="gallery_crypto">
              <img className="cryptoicon" src="images/new-images/cryptogallery7.png" alt="Earn" />
              <h4>Earn</h4>
              <p>Up to 36% APY in USDT with zero risk</p>
              <Link className="learnbtn" to="/earning">Find out more <i className="ri-arrow-right-line"></i></Link>
            </div>

            <div className="gallery_crypto">
              <img className="cryptoicon" src="images/new-images/cryptogallery4.png" alt="Staking" />
              <h4>Staking</h4>
              <p>Trade US stock tokens with USDT</p>
              <Link className="learnbtn" to="/earning">Find out more <i className="ri-arrow-right-line"></i></Link>
            </div>

            <div className="gallery_crypto">
              <img className="cryptoicon" src="images/new-images/cryptogallery5.png" alt="Futures Trading" />
              <h4>Futures Trading</h4>
              <p>Ultra-low latency, seamless execution</p>
              <Link className="learnbtn" to="/usd_futures/BTC_USDT">Find out more <i className="ri-arrow-right-line"></i></Link>
            </div>

            <div className="gallery_crypto">
              <img className="cryptoicon" src="images/new-images/cryptogallery6.png" alt="Spot Trading" />
              <h4>Spot Trading</h4>
              <p>Over 100+ tokens at your fingertips</p>
              <Link className="learnbtn" to="/trade/BTC_USDT">Find out more <i className="ri-arrow-right-line"></i></Link>
            </div>

            <div className="gallery_crypto">
              <img className="cryptoicon" src="images/new-images/cryptogallery7.png" alt="Earn" />
              <h4>Earn</h4>
              <p>Up to 36% APY in USDT with zero risk</p>
              <Link className="learnbtn" to="/earning">Find out more <i className="ri-arrow-right-line"></i></Link>
            </div>

          </div>
        </div>
      </div>


      <footer>
        <div className="container">
          <div className="row">
            <div className="col-sm-5 col-md-5 col-lg-5">
              <div className="footer_logo">
                <img className='darklogo' src="/images/logo_light.svg" alt="logo" />
              </div>
              <p>Wrathcode is a blockchain-based banking platform for crypto traders and investors, and aims to connect the world of traditional finance and cryptocurrencies.</p>
              <ul className="social_media">
                <li><a href="#"><i className="ri-facebook-circle-line"></i></a></li>
                <li><a href="#"><i className="ri-twitter-x-line"></i></a></li>
                <li><a href="#"><i className="ri-instagram-line"></i></a></li>
                <li><a href="#"><i className="ri-telegram-2-fill"></i></a></li>
                <li><a href="#"><i className="ri-youtube-line"></i></a></li>
              </ul>
            </div>
            <div className="col-sm-7 col-md-7 col-lg-7">
              <div className="row">

                <div className="col-sm-6">
                  <div className="address_footer">
                    <h5><span>Head Office</span></h5>
                    <div className="address_cnt">
                      <p>1st floor, JDA Complex, Plot no. 11, Sector 4, Vidyadhar Nagar, Jaipur, Rajasthan 302039</p>
                    </div>
                  </div>

                </div>

                <div className="col-sm-6">
                  <div className="address_footer">
                    <h5>Contact Us</h5>
                    <div className="address_cntemail">
                      <address>
                        <img src="/images/email-icon.png" alt="email" /> 
                       <div className="emaildiv">
                        support@wrathcode.com
                       <span className="admin_email">admin@wrathcode.com</span>
                       </div></address>

                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>

        </div>

      </footer>

      {/* Disabled Features Popup - Same style as TwofactorPage Security Notice */}
      {disabledFeatures.length > 0 && (
        <div className="modal fade search_form" id="disabledFeaturesModal" tabIndex="-1" aria-hidden="true" data-bs-backdrop="static">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="ri-error-warning-line" style={{ color: '#ffc107', marginRight: '8px' }}></i>
                  Service Notice
                </h5>
                <p>Please read carefully before proceeding</p>
                <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
              </div>
              <div className="modal-body">
                <div className="verify_authenticator_s remove_authenticator_s">
                  <div style={{
                    width: '70px',
                    height: '70px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #ffc107 0%, #ff9800 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 20px'
                  }}>
                    <i className="ri-tools-fill" style={{ fontSize: '35px', color: '#fff' }}></i>
                  </div>
                  <div style={{ marginBottom: '20px' }}>
                    <p style={{ color: '#fff', marginBottom: '12px', fontSize: '14px' }}>
                      <i className="ri-information-line" style={{ color: '#ffc107', marginRight: '8px' }}></i>
                      The following features are temporarily unavailable:
                    </p>
                    <ul style={{ color: '#fff', fontSize: '14px', marginBottom: '15px', paddingLeft: '1.5rem', lineHeight: 1.6 }}>
                      {disabledFeatures.map(({ key, label }) => (
                        <li key={key}>{label}</li>
                      ))}
                    </ul>
                    <p style={{ color: '#fff', marginBottom: '0', fontSize: '14px' }}>
                      <i className="ri-time-line" style={{ color: '#ffc107', marginRight: '8px' }}></i>
                      We are working to improve them, and they will be enabled soon. Thank you for your patience.
                    </p>
                  </div>
                </div>

                <form className="profile_form" onSubmit={(e) => e.preventDefault()}>
                  <button
                    className="submit"
                    type="button"
                    data-bs-dismiss="modal"
                  >
                    I Understand, Continue
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

    </>
  );
};

export default LandingPage;
