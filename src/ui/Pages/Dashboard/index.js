import React, { useCallback, useEffect, useState, useContext } from 'react'
import "swiper/css";
import "swiper/css/pagination";
import { ApiConfig } from '../../../api/apiConfig/apiConfig';
import AuthService from '../../../api/services/AuthService';
import { SocketContext } from "../../../customComponents/SocketContext";
import { Link, useNavigate } from 'react-router-dom';
import DashboardHeader from '../../../customComponents/DashboardHeader';
import LoaderHelper from '../../../customComponents/Loading/LoaderHelper';
import { alertErrorMessage } from '../../../customComponents/CustomAlertMessage';
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination } from "swiper";


const Dashboard = (props) => {
  const { socket, marketData, subscribeToMarket, unsubscribeFromMarket } = useContext(SocketContext);
  const navigate = useNavigate();
  const [coinData, setCoinData] = useState([]);
  const [favCoins, setfavCoins] = useState([]);
  const [estimatedportfolio, setEstimatedportfolio] = useState();
  const [showBalance, setShowBalance] = useState(false);
  const [highlightCoins, setHighlightCoins] = useState({ new: {}, topGainer: {}, topLoser: {}, topVolumne: {} });

  const formatNumber = useCallback((data, decimal = 5) => {
    const num = typeof data === "string" ? Number(data) : data;
    if (typeof num === "number" && !isNaN(num)) {
      return parseFloat(num.toFixed(decimal));
    }
    return "0.00";
  }, []);

  const favoriteList = useCallback(async () => {
    try {
      const result = await AuthService.favoriteList();
      if (result?.success) {
        setfavCoins(result?.data?.pairs || []);
      }
    } catch {
      // Silent fail for favorite list
    }
  }, []);

  const estimatedPortfolio = useCallback(async (type) => {
    try {
      const result = await AuthService.estimatedPortfolio(type);
      if (result?.success) {
        setEstimatedportfolio(result?.data);
      }
    } catch {
      // Silent fail for portfolio
    }
  }, []);

  // Subscribe to market data (server-push, no polling needed)
  useEffect(() => {
    if (socket) {
      subscribeToMarket();

      return () => {
        unsubscribeFromMarket();
      };
    }
  }, [socket, subscribeToMarket, unsubscribeFromMarket]);

  // Update local state from context marketData
  useEffect(() => {
    const pairs = marketData?.pairs;
    if (!pairs || !Array.isArray(pairs) || pairs.length === 0) return;
    
    setCoinData(pairs);

    const topGainer = pairs.reduce((max, item) => {
      return parseFloat(item?.change || 0) > parseFloat(max?.change || 0) ? item : max;
    }, pairs[0]);

    const topLoser = pairs.reduce((min, item) => {
      return parseFloat(item?.change || 0) < parseFloat(min?.change || 0) ? item : min;
    }, pairs[0]);

    const newest = [...pairs].reverse()[0];

    const validVolumePairs = pairs.filter(item => item?.volume !== undefined && item?.volume !== null);
    const highestVolumePair = validVolumePairs.length > 0 
      ? validVolumePairs.reduce((max, item) => {
          return parseFloat(item?.volume || 0) > parseFloat(max?.volume || 0) ? item : max;
        }, validVolumePairs[0])
      : {};

    setHighlightCoins({
      new: newest || {},
      topGainer: topGainer || {},
      topLoser: topLoser || {},
      topVolumne: highestVolumePair || {}
    });
  }, [marketData]);

  const handleAddFav = useCallback(async (e, pairId) => {
    e.stopPropagation();
    if (!pairId) return;

    LoaderHelper.loaderStatus(true);
    try {
      const result = await AuthService.favoriteCoin(pairId);
      if (result?.success) {
        favoriteList();
      } else {
        alertErrorMessage(result?.message || "Failed to update favorite");
      }
    } catch {
      alertErrorMessage("Failed to update favorite");
    }
    LoaderHelper.loaderStatus(false);
  }, [favoriteList]);


  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    estimatedPortfolio("");
    favoriteList();
  }, [estimatedPortfolio, favoriteList]);

  // Helper to render coin row for desktop
  const renderDesktopRow = useCallback((item, index) => {
    if (!item) return null;
    const changePercent = parseFloat(item?.change_percentage || 0);
    return (
      <tr key={item?._id || index}>
    
        <td>
          <div className="td_first">
          <span className="star_btn btn_icon active">
              <i
                className={favCoins.includes(item?._id) ? "ri ri-star-fill text-warning me-2" : "ri ri-star-line me-2"}
                onClick={(e) => handleAddFav(e, item?._id)}
              />
            </span>
            <div className="icon">
              <img 
                src={ApiConfig?.baseImage + item?.icon_path} 
                height="30px" 
                alt={item?.base_currency || "icon"} 
                onError={(e) => { e.target.src = "/images/default_coin.png"; }}
              />
            </div>
            <div className="price_heading">
              {item?.base_currency} <br /> <span>{item?.base_currency_fullname}</span>
            </div>
          </div>
        </td>
        <td>{formatNumber(item?.buy_price, 5)} <br /> <span className='fontWeight'>{item?.quote_currency}</span></td>
        <td>{formatNumber(item?.high, 5)}</td>
        <td className={changePercent >= 0 ? "green" : "red"}>
          {changePercent >= 0 ? "+" : ""}{formatNumber(item?.change_percentage, 5)}%
        </td>
        <td className="right_t">
          <Link to={`/trade/${item?.base_currency}_${item?.quote_currency}`}>Trade</Link>
        </td>
      </tr>
    );
  }, [favCoins, formatNumber, handleAddFav]);

  // Helper to render coin row for mobile
  const renderMobileRow = useCallback((item, index) => {
    if (!item) return null;
    const changePercent = parseFloat(item?.change_percentage || 0);
    return (
      <tr key={item?._id || index}>
        <td>
          <div className="td_first">
            <div className="icon">
              <img 
                src={ApiConfig?.baseImage + item?.icon_path} 
                height="30px" 
                alt={item?.base_currency || "icon"}
                onError={(e) => { e.target.src = "/images/default_coin.png"; }}
              />
            </div>
            <div className="price_heading">
              {item?.base_currency} <br /> <span>{item?.base_currency_fullname}</span>
            </div>
          </div>
        </td>
        <td>{formatNumber(item?.buy_price, 5)} <br /> <span className='fontWeight'>{item?.quote_currency}</span></td>
        <td className="right_t">
          {formatNumber(item?.high, 5)}
          <div className={changePercent >= 0 ? "green" : "red"}>
            {changePercent >= 0 ? "+" : ""}{formatNumber(item?.change_percentage, 5)}%
          </div>
        </td>
      </tr>
    );
  }, [formatNumber]);

  // No data row component (for tables that don't use SpotMarketsNoData)
  const NoDataRow = () => (
    <tr className="no-data-row">
      <td colSpan="12">
        <div className="no-data-wrapper">
          <div className="no_data_s">
            <img src="/images/no_data_vector.svg" className="img-fluid dark_img" width="96" height="96" alt="No data available" /><img src="/images/no_data_vector_light.png" className="img-fluid light_img" width="96" height="96" alt="No data available" />
          </div>
        </div>
      </td>
    </tr>
  );

  // Single no-data block for Spot Markets (one for whole section, no duplicate desktop/mobile)
  const SpotMarketsNoData = () => (
    <div className="spot_markets_no_data">
      <div className="no-data-wrapper">
        <div className="no_data_s">
          <img src="/images/no_data_vector.svg" className="img-fluid dark_img" width="96" height="96" alt="No data available" /><img src="/images/no_data_vector_light.png" className="img-fluid light_img" width="96" height="96" alt="No data available" />
        </div>
      </div>
    </div>
  );

  // Highlight card component
  const HighlightCard = ({ title, data, linkTo }) => {
    const change = parseFloat(data?.change || 0);
    return (
      <div className='div_tag'>
        <div className="balance_chart_left">
          <div className="d-flex justify-content-between">
            <h4>{title}</h4>
            <Link to={linkTo}><i className="ri-arrow-right-s-line"></i></Link>
          </div>
          <div className="select_price">
            <ul className='wallet_price_list'>
              <li>
                <h3 className={change >= 0 ? "text-success" : "text-danger"}>
                  {data?.buy_price || "0.00"} {data?.quote_currency || "---"} | {data?.change || "0.00"}%
                </h3>
              </li>
              <li><span>≈ {data?.base_currency_fullname || "---"}</span></li>
            </ul>
            <div className="dashboardsummary_bottom">
              <h4>{data?.base_currency || "---"}/{data?.quote_currency || "---"}</h4>
              <Link 
                className="btn" 
                to={`/trade/${data?.base_currency || "BTC"}_${data?.quote_currency || "USDT"}`}
              >
                Make Trade
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="dashboard_right">
        <DashboardHeader props={props} />
        
        {/* Desktop View - Highlight Cards */}
        <div className="estimated_balance dash_balance desktop_view">
          <HighlightCard title="Newest (Pair)" data={highlightCoins?.new} linkTo="/market" />
          <HighlightCard title="Top gainer (24h)" data={highlightCoins?.topGainer} linkTo="/market" />
          <HighlightCard title="Top Loser (24h)" data={highlightCoins?.topLoser} linkTo="/market" />
          <HighlightCard title="High Volume (24H)" data={highlightCoins?.topVolumne} linkTo="/market" />
        </div>

        {/* Mobile View - Highlight Cards Swiper */}
        <div className="estimated_balance dash_balance mobile_view">
          <Swiper
            modules={[Pagination]}
            pagination={{ clickable: true }}
            spaceBetween={20}
            slidesPerView={1}
          >
            <SwiperSlide>
              <HighlightCard title="Newest (Pair)" data={highlightCoins?.new} linkTo="/market" />
            </SwiperSlide>
            <SwiperSlide>
              <HighlightCard title="Top gainer (24h)" data={highlightCoins?.topGainer} linkTo="/market" />
            </SwiperSlide>
            <SwiperSlide>
              <HighlightCard title="Top Loser (24h)" data={highlightCoins?.topLoser} linkTo="/market" />
            </SwiperSlide>
            <SwiperSlide>
              <HighlightCard title="High Volume (24H)" data={highlightCoins?.topVolumne} linkTo="/market" />
            </SwiperSlide>
          </Swiper>
        </div>

        <div className="dashboard_listing_section">
          <div className="listing_left_outer">
            {/* Deposit Section */}
            <div className="crypto_deposit">
              <h4>Start by depositing some crypto</h4>
              <ul>
                <li>
                  <div className="estimate_cnt">
                    <h5>Estimated Portfolio</h5>
                    <h4>
                      {showBalance ? formatNumber(estimatedportfolio?.dollarPrice, 8) || 0 : "*********"} USD{" "}
                      <span>
                        {showBalance ? formatNumber(estimatedportfolio?.currencyPrice, 8) || 0 : "*********"}{" "}
                        {estimatedportfolio?.Currency || "---"}
                      </span>
                      {showBalance ? (
                        <i className="ri-eye-close-line mx-1" onClick={() => setShowBalance(false)} />
                      ) : (
                        <i className="ri-eye-line mx-1" onClick={() => setShowBalance(true)} />
                      )}
                    </h4>
                  </div>
                  <div className="estimated_portfolio">
                    <Link className="deposit_btn" to="/asset_managemnet/deposit">Deposit</Link>
                    <Link className="deposit_btn withdraw" to="/asset_managemnet/withdraw">Withdraw</Link>
                  </div>
                </li>
              </ul>
            </div>

            {/* Market Section */}
            <div className="market_section maindashboard">
              <div className="top_heading">
                <h4>Spot Markets</h4>
                <Link className="more_btn" to="/market">More {">"}</Link>
              </div>
              <div className="dashboard_summary">
                <ul className="nav nav-tabs" id="myTab" role="tablist">
                  <li className="nav-item" role="presentation">
                    <button className="nav-link" id="favorite-tab" data-bs-toggle="tab" data-bs-target="#favorite"
                      type="button" role="tab" aria-controls="favorite" aria-selected="false">Favorite</button>
                  </li>
                  <li className="nav-item" role="presentation">
                    <button className="nav-link active" id="home-tab" data-bs-toggle="tab" data-bs-target="#home"
                      type="button" role="tab" aria-controls="home" aria-selected="true">Trending</button>
                  </li>
                  <li className="nav-item" role="presentation">
                    <button className="nav-link" id="profile-tab" data-bs-toggle="tab" data-bs-target="#profile"
                      type="button" role="tab" aria-controls="profile" aria-selected="false">Hot</button>
                  </li>
                  <li className="nav-item" role="presentation">
                    <button className="nav-link" id="contact-tab" data-bs-toggle="tab" data-bs-target="#contact"
                      type="button" role="tab" aria-controls="contact" aria-selected="false">New Listing</button>
                  </li>
                  <li className="nav-item" role="presentation">
                    <button className="nav-link" id="gainers-tab" data-bs-toggle="tab" data-bs-target="#gainers"
                      type="button" role="tab" aria-controls="gainers" aria-selected="false">Top Gainers</button>
                  </li>
                </ul>

                <div className="tab-content" id="myTabContent">
                  {/* Trending Tab */}
                  <div className="tab-pane fade show active" id="home" role="tabpanel" aria-labelledby="home-tab">
                    {coinData?.length > 0 ? (
                      <>
                        <div className='desktop_view'>
                          <div className='table-responsive'>
                            <table>
                              <thead>
                                <tr>
                                  <th>Coin</th>
                                  <th>Price</th>
                                  <th>24H High</th>
                                  <th>24H Change</th>
                                  <th className="right_t">Trade</th>
                                </tr>
                              </thead>
                              <tbody>
                                {coinData.map((item, index) => renderDesktopRow(item, index))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                        <div className='mobile_view'>
                          <div className='table-responsive'>
                            <table>
                              <thead>
                                <tr>
                                  <th>Coin</th>
                                  <th>Price</th>
                                  <th className="right_t">24 High/Change</th>
                                </tr>
                              </thead>
                              <tbody>
                                {coinData.map((item, index) => renderMobileRow(item, index))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </>
                    ) : (
                      <SpotMarketsNoData />
                    )}
                  </div>

                  {/* Hot Tab */}
                  <div className="tab-pane fade" id="profile" role="tabpanel" aria-labelledby="profile-tab">
                    {coinData?.length > 0 ? (
                      <>
                        <div className='desktop_view'>
                          <div className='table-responsive'>
                            <table>
                              <thead>
                                <tr>
                                  <th>Coin</th>
                                  <th>Price</th>
                                  <th>24H High</th>
                                  <th>24H Change</th>
                                  <th className="right_t">Trade</th>
                                </tr>
                              </thead>
                              <tbody>
                                {coinData.slice(0, 5).map((item, index) => renderDesktopRow(item, index))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                        <div className='mobile_view'>
                          <div className='table-responsive'>
                            <table>
                              <thead>
                                <tr>
                                  <th>Coin</th>
                                  <th>Price</th>
                                  <th className="right_t">24H High/Change</th>
                                </tr>
                              </thead>
                              <tbody>
                                {coinData.slice(0, 5).map((item, index) => renderMobileRow(item, index))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </>
                    ) : (
                      <SpotMarketsNoData />
                    )}
                  </div>

                  {/* New Listing Tab */}
                  <div className="tab-pane fade" id="contact" role="tabpanel" aria-labelledby="contact-tab">
                    {coinData?.length > 0 ? (
                      <>
                        <div className='desktop_view'>
                          <div className='table-responsive'>
                            <table>
                              <thead>
                                <tr>
                                  <th>Coin</th>
                                  <th>Price</th>
                                  <th>24H High</th>
                                  <th>24H Change</th>
                                  <th className="right_t">Trade</th>
                                </tr>
                              </thead>
                              <tbody>
                                {[...coinData].reverse().slice(0, 7).map((item, index) => renderDesktopRow(item, index))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                        <div className='mobile_view'>
                          <div className='table-responsive'>
                            <table>
                              <thead>
                                <tr>
                                  <th>Coin</th>
                                  <th>Price</th>
                                  <th className="right_t">24H High/Change</th>
                                </tr>
                              </thead>
                              <tbody>
                                {[...coinData].reverse().slice(0, 7).map((item, index) => renderMobileRow(item, index))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </>
                    ) : (
                      <SpotMarketsNoData />
                    )}
                  </div>

                  {/* Favorite Tab */}
                  <div className="tab-pane fade" id="favorite" role="tabpanel" aria-labelledby="favorite-tab">
                    {coinData?.length > 0 && favCoins?.length > 0 && coinData.filter(item => favCoins.includes(item?._id)).length > 0 ? (
                      <>
                        <div className='desktop_view'>
                          <div className='table-responsive'>
                            <table>
                              <thead>
                                <tr>
                                  <th>Coin</th>
                                  <th>Price</th>
                                  <th>24H High</th>
                                  <th>24H Change</th>
                                  <th className="right_t">Trade</th>
                                </tr>
                              </thead>
                              <tbody>
                                {coinData.filter(item => favCoins.includes(item?._id)).map((item, index) => renderDesktopRow(item, index))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                        <div className='mobile_view'>
                          <div className='table-responsive'>
                            <table>
                              <thead>
                                <tr>
                                  <th>Coin</th>
                                  <th>Price</th>
                                  <th className='right_t'>24H High/Change</th>
                                </tr>
                              </thead>
                              <tbody>
                                {coinData.filter(item => favCoins.includes(item?._id)).map((item, index) => renderMobileRow(item, index))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </>
                    ) : (
                      <SpotMarketsNoData />
                    )}
                  </div>

                  {/* Top Gainers Tab */}
                  <div className="tab-pane fade" id="gainers" role="tabpanel" aria-labelledby="gainers-tab">
                    {coinData?.length > 0 && coinData.filter(item => parseFloat(item?.change_percentage || 0) > 0).slice(0, 10).length > 0 ? (
                      <>
                        <div className='desktop_view'>
                          <div className='table-responsive'>
                            <table>
                              <thead>
                                <tr>
                                  <th>Coin</th>
                                  <th>Price</th>
                                  <th>24H High</th>
                                  <th>24H Change</th>
                                  <th className="right_t">Trade</th>
                                </tr>
                              </thead>
                              <tbody>
                                {coinData
                                  .filter(item => parseFloat(item?.change_percentage || 0) > 0)
                                  .slice(0, 10)
                                  .map((item, index) => renderDesktopRow(item, index))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                        <div className='mobile_view'>
                          <div className='table-responsive'>
                            <table>
                              <thead>
                                <tr>
                                  <th>Coin</th>
                                  <th>Price</th>
                                  <th className="right_t">24H High/Change</th>
                                </tr>
                              </thead>
                              <tbody>
                                {coinData
                                  .filter(item => parseFloat(item?.change_percentage || 0) > 0)
                                  .slice(0, 10)
                                  .map((item, index) => renderMobileRow(item, index))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </>
                    ) : (
                      <SpotMarketsNoData />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar - Features */}
          <div className="dashboard_right_side">
            <div className="new_features_s">
              <div className="features_block">
                {props?.userDetails?.kycVerified === 0 && (
                  <div className="block_features" onClick={() => navigate("/user_profile/kyc")}>
                    <img className='darkimg' src="/images/user.gif" alt="Complete Identity Verification" />
                    <div className="features_cnt">
                      <h5>Complete Identity Verification <span><i className="ri-arrow-right-s-line"></i></span></h5>
                      <p>Verify your identity to secure your account, protect your data, and unlock full access to all features and services without any limitations.</p>
                    </div>
                  </div>
                )}
                <div className="block_features" onClick={() => navigate("/refer_earn")}>
                  <img className='darkimg' src="/images/add.gif" alt="Invite Friends" />
                  <div className="features_cnt">
                    <h5>Invite Friends for Rewards <span><i className="ri-arrow-right-s-line"></i></span></h5>
                    <p>Invite your friends to join, expand your community, and earn amazing rewards for every successful referral.</p>
                  </div>
                </div>

                {props?.userDetails?.["2fa"] === 0 && (
                  <div className="block_features" onClick={() => navigate("/user_profile/two_factor_autentication")}>
                    <img className='darkimg' src="/images/key.gif" alt="2FA Authentication" />
                    <div className="features_cnt">
                      <h5>2-Factor Authentication (2FA) <span><i className="ri-arrow-right-s-line"></i></span></h5>
                      <p>Enable 2-Factor Authentication to add an extra security layer and prevent unauthorized access to your account.</p>
                    </div>
                  </div>
                )}
                <div className="block_features" onClick={() => navigate("/asset_managemnet/deposit")}>
                  <img className='darkimg' src="/images/increase.gif" alt="Deposit crypto" />
                  <div className="features_cnt">
                    <h5>Deposit crypto with one-click <span><i className="ri-arrow-right-s-line"></i></span></h5>
                    <p>Deposit crypto instantly with one-click and get fast access to digital assets without complex steps or delays.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Dashboard
