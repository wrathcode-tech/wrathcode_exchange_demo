import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import Slider from 'react-slick';
import LoaderHelper from '../../../customComponents/Loading/LoaderHelper';
import AuthService from '../../../api/services/AuthService';
import { alertErrorMessage, alertSuccessMessage } from '../../../customComponents/CustomAlertMessage';
import { ApiConfig } from '../../../api/apiConfig/apiConfig';
import { Link, useNavigate } from 'react-router-dom';
import { $ } from 'react-jquery-plugin';
import moment from 'moment';
import { Helmet } from 'react-helmet-async';
import { usePlatformStatus } from '../../../context/PlatformStatusProvider';

function Earning() {
  const { getStatus } = usePlatformStatus();
  const isStakingDisabled = !getStatus('staking').enabled;
  // Ref for component mount state
  const isMountedRef = useRef(true);
  const navigate = useNavigate();

  // State management
  const [packageList, setPackageList] = useState([]);
  const [search, setSearch] = useState("");
  const [packageDetails, setPackageDetails] = useState({});
  const [walletType, setWalletType] = useState([]);
  const [selectedWallet, setSelectedWallet] = useState("");
  const [walletBalance, setWalletBalance] = useState(0);
  const [subscriptionAmount, setSubscriptionAmount] = useState("");
  const [searchPackage] = useState("");

  const [subscribedActivePackages, setSubscribedActivePackages] = useState([]);
  const [subscribedCompletedPackage, setSubscribedCompletedPackage] = useState([]);
  const [portfolio, setPortfolio] = useState([]); // Array of currency-wise portfolio
  const [portfolioSummary, setPortfolioSummary] = useState({}); // Summary in USDT

  // Loading states
  const [isSubscribing, setIsSubscribing] = useState(false);

  // Pagination states
  const [skipActive] = useState(0);
  const [skipCompleted] = useState(0);
  const limit = 10;

  // Agreement checkbox
  const [agreeTerms, setAgreeTerms] = useState(false);

  // Expand row states for mobile view
  const [showActiveExpandedRows, setShowActiveExpandedRows] = useState({});
  const [showCompletedExpandedRows, setShowCompletedExpandedRows] = useState({});

  // Store all packages for selected currency (for duration selection)
  const [selectedCurrencyPackages, setSelectedCurrencyPackages] = useState([]);

  const token = localStorage.getItem("token");

  // Utility functions
  const formatToNineDecimals = useCallback((data) => {
    if (typeof data === "number" && !isNaN(data)) {
      return parseFloat(data.toFixed(9));
    }
    return 0;
  }, []);

  const formatNumber = useCallback((num, decimals = 2) => {
    if (num === null || num === undefined || isNaN(num)) return "0.00";
    return parseFloat(num).toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  }, []);

  // Filtered subscribed packages based on search
  const filteredActivePackages = useMemo(() => {
    if (!search.trim()) return subscribedActivePackages;
    const searchLower = search.toLowerCase().trim();
    return subscribedActivePackages.filter(item =>
      item?.currency?.toLowerCase().includes(searchLower) ||
      item?.wallet_type?.toLowerCase().includes(searchLower) ||
      item?.status?.toLowerCase().includes(searchLower)
    );
  }, [subscribedActivePackages, search]);

  const filteredCompletedPackages = useMemo(() => {
    if (!search.trim()) return subscribedCompletedPackage;
    const searchLower = search.toLowerCase().trim();
    return subscribedCompletedPackage.filter(item =>
      item?.currency?.toLowerCase().includes(searchLower) ||
      item?.credited_wallet_type?.toLowerCase().includes(searchLower) ||
      item?.status?.toLowerCase().includes(searchLower)
    );
  }, [subscribedCompletedPackage, search]);

  // API calls with proper error handling
  const getPackageList = useCallback(async () => {
    try {
      LoaderHelper.loaderStatus(true);
      const result = await AuthService.packageList();
      if (!isMountedRef.current) return;

      if (result?.success) {
        setPackageList(result?.data || []);
      }
    } catch (error) {
      console.error("Error fetching package list:", error);
    } finally {
      if (isMountedRef.current) {
        LoaderHelper.loaderStatus(false);
      }
    }
  }, []);

  const earningPortfolio = useCallback(async () => {
    if (!token) return;
    try {
      const result = await AuthService.earningPortfolio();
      if (!isMountedRef.current) return;

      if (result?.success) {
        setPortfolio(result?.data || []);
      }
    } catch (error) {
      console.error("Error fetching earning portfolio:", error);
    }
  }, [token]);

  const earningPortfolioSummary = useCallback(async () => {
    if (!token) return;
    try {
      const result = await AuthService.earningPortfolioSummary();
      if (!isMountedRef.current) return;

      if (result?.success) {
        setPortfolioSummary(result?.data || {});
      }
    } catch (error) {
      console.error("Error fetching earning portfolio summary:", error);
    }
  }, [token]);

  const subscribedPackageList = useCallback(async (status = "ACTIVE", skip = 0) => {
    if (!token) return;
    try {
      LoaderHelper.loaderStatus(true);
      const result = await AuthService.subscribedPackageList(skip, limit);
      if (!isMountedRef.current) return;

      if (result?.success) {
        const allData = result?.data || [];
        const completedPackage = allData.filter((item) => item?.status === "COMPLETED");
        const activePackage = allData.filter((item) => item?.status === "ACTIVE");

        setSubscribedActivePackages(activePackage);
        setSubscribedCompletedPackage(completedPackage);
      }
    } catch (error) {
      console.error("Error fetching subscribed packages:", error);
    } finally {
      if (isMountedRef.current) {
        LoaderHelper.loaderStatus(false);
      }
    }
  }, [token]);


  const getWalletType = useCallback(async () => {
    try {
      LoaderHelper.loaderStatus(true);
      const result = await AuthService.availableWalletTypes();
      if (!isMountedRef.current) return;

      if (result?.success) {
        const types = result?.data || [];
        setWalletType(types);
        if (types.length > 0) {
          setSelectedWallet(types[0]);
        }
      }
    } catch (error) {
      console.error("Error fetching wallet types:", error);
    } finally {
      if (isMountedRef.current) {
        LoaderHelper.loaderStatus(false);
      }
    }
  }, []);

  const getWalletBalance = useCallback(async () => {
    if (!packageDetails?.currency_id || !selectedWallet) return;

    try {
      LoaderHelper.loaderStatus(true);
      const result = await AuthService.getWalletBalance(packageDetails.currency_id, selectedWallet);
      if (!isMountedRef.current) return;

      if (result?.success) {
        setWalletBalance(formatToNineDecimals(result?.data?.balance || 0));
      }
    } catch (error) {
      console.error("Error fetching wallet balance:", error);
    } finally {
      if (isMountedRef.current) {
        LoaderHelper.loaderStatus(false);
      }
    }
  }, [packageDetails?.currency_id, selectedWallet, formatToNineDecimals]);

  // Subscription handlers
  const resetInput = useCallback(() => {
    setSubscriptionAmount("");
    setPackageDetails({});
    setAgreeTerms(false);
    setSelectedCurrencyPackages([]);
  }, []);

  const subscribeEarningPackage = useCallback(async () => {
    if (isStakingDisabled) return;
    if (!packageDetails?._id) {
      alertErrorMessage("Please select a package");
      return;
    }
    if (!subscriptionAmount || parseFloat(subscriptionAmount) <= 0) {
      alertErrorMessage("Please enter a valid subscription amount");
      return;
    }
    if (!selectedWallet) {
      alertErrorMessage("Please select a wallet");
      return;
    }
    if (parseFloat(subscriptionAmount) > walletBalance) {
      alertErrorMessage("Insufficient balance in selected wallet");
      return;
    }
    if (packageDetails?.min_amount && parseFloat(subscriptionAmount) < packageDetails.min_amount) {
      alertErrorMessage(`Minimum subscription amount is ${packageDetails.min_amount} ${packageDetails.currency}`);
      return;
    }
    if (packageDetails?.max_amount && parseFloat(subscriptionAmount) > packageDetails.max_amount) {
      alertErrorMessage(`Maximum subscription amount is ${packageDetails.max_amount} ${packageDetails.currency}`);
      return;
    }
    if (!agreeTerms) {
      alertErrorMessage("Please agree to the Earn Service Agreement");
      return;
    }

    try {
      setIsSubscribing(true);
      LoaderHelper.loaderStatus(true);
      const result = await AuthService.subscribeEarningPackage(
        packageDetails._id,
        parseFloat(subscriptionAmount),
        selectedWallet
      );

      if (!isMountedRef.current) return;

      if (result?.success) {
        resetInput();
        $("#more_details").modal('hide');
        $("#package_details").modal('hide');
        alertSuccessMessage(result?.message || "Subscription successful!");
        // Refresh data
        subscribedPackageList();
        earningPortfolio();
        earningPortfolioSummary();
      } else {
        alertErrorMessage(result?.message || "Subscription failed");
      }
    } catch (error) {
      console.error("Error subscribing to package:", error);
      alertErrorMessage(error?.message || "An error occurred during subscription");
    } finally {
      if (isMountedRef.current) {
        setIsSubscribing(false);
        LoaderHelper.loaderStatus(false);
      }
    }
  }, [isStakingDisabled, packageDetails, subscriptionAmount, selectedWallet, walletBalance, agreeTerms, resetInput, subscribedPackageList, earningPortfolio, earningPortfolioSummary]);

  // UI handlers
  const showPackageDetails = useCallback((data, allCurrencyPackages = null) => {
    if (!token) {
      navigate('/login');
      return;
    }
    resetInput();
    setPackageDetails(data);

    // Find all packages for this currency from packageList
    if (allCurrencyPackages) {
      // Sort by duration_days ascending
      const sortedPackages = [...allCurrencyPackages].sort((a, b) => a.duration_days - b.duration_days);
      setSelectedCurrencyPackages(sortedPackages);
    } else {
      // Find from packageList by currency_id
      const currencyGroup = packageList.find(group =>
        Array.isArray(group) && group.some(pkg => pkg.currency_id === data.currency_id)
      );
      if (currencyGroup) {
        const sortedPackages = [...currencyGroup].sort((a, b) => a.duration_days - b.duration_days);
        setSelectedCurrencyPackages(sortedPackages);
      } else {
        setSelectedCurrencyPackages([data]);
      }
    }

    $("#package_details").modal('show');
    getWalletType();
  }, [token, navigate, resetInput, getWalletType, packageList]);

  // Handle duration selection in modal
  const handleDurationSelect = useCallback((pkg) => {
    setPackageDetails(pkg);
    setSubscriptionAmount(""); // Reset amount when duration changes
  }, []);

  const handleMaxAmount = useCallback(() => {
    if (walletBalance > 0) {
      const maxAmount = packageDetails?.max_amount
        ? Math.min(walletBalance, packageDetails.max_amount)
        : walletBalance;
      setSubscriptionAmount(maxAmount.toString());
    }
  }, [walletBalance, packageDetails?.max_amount]);

  const handleSubscriptionAmountChange = useCallback((e) => {
    const value = e.target.value;
    // Allow only numbers and decimal point
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setSubscriptionAmount(value);
    }
  }, []);

  // Memoized filtered data
  const filteredPackageList = useMemo(() => {
    if (!packageList || !Array.isArray(packageList)) return [];
    return packageList.filter(group =>
      Array.isArray(group) && group.some(item =>
        item?.currency?.toLowerCase().includes(searchPackage.toLowerCase()) ||
        item?.currency_fullname?.toLowerCase().includes(searchPackage.toLowerCase())
      )
    );
  }, [packageList, searchPackage]);

  // Flatten packages for "All Products" table
  const allPackagesFlat = useMemo(() => {
    if (!packageList || !Array.isArray(packageList)) return [];
    return packageList.flat().filter(Boolean);
  }, [packageList]);

  // Group packages by currency for display
  const groupedPackages = useMemo(() => {
    const groups = {};
    allPackagesFlat.forEach(pkg => {
      const key = pkg.currency_id || pkg.currency;
      if (!groups[key]) {
        groups[key] = {
          currency: pkg.currency,
          currency_fullname: pkg.currency_fullname,
          icon_path: pkg.icon_path,
          packages: []
        };
      }
      groups[key].packages.push(pkg);
    });
    return Object.values(groups);
  }, [allPackagesFlat]);

  // Calculate returns based on return percentage for the duration
  // return_percentage is the TOTAL return for that specific duration (not annual)
  // Total Return = Amount * return_percentage / 100
  // Daily Return = Total Return / duration_days
  const totalReturns = useMemo(() => {
    if (!subscriptionAmount || !packageDetails?.return_percentage) return "0.00";
    const amount = parseFloat(subscriptionAmount) || 0;
    const returnPercentage = packageDetails.return_percentage || 0;
    // Total return = Amount * percentage / 100
    const total = amount * returnPercentage / 100;
    return formatToNineDecimals(total);
  }, [subscriptionAmount, packageDetails, formatToNineDecimals]);

  const dailyReturns = useMemo(() => {
    if (!subscriptionAmount || !packageDetails?.return_percentage || !packageDetails?.duration_days) return "0.00";
    const amount = parseFloat(subscriptionAmount) || 0;
    const returnPercentage = packageDetails.return_percentage || 0;
    const days = packageDetails.duration_days || 1;
    // Daily return = (Amount * percentage / 100) / days
    const daily = (amount * returnPercentage / 100) / days;
    return formatToNineDecimals(daily);
  }, [subscriptionAmount, packageDetails, formatToNineDecimals]);

  const totalReceivable = useMemo(() => {
    if (!subscriptionAmount) return "0.00";
    const amount = parseFloat(subscriptionAmount) || 0;
    const returns = parseFloat(totalReturns) || 0;
    return formatToNineDecimals(amount + returns);
  }, [subscriptionAmount, totalReturns, formatToNineDecimals]);

  // Slider settings
  const getSliderSettings = useCallback((packageNumber) => {
    const slidesToShow = Math.min(packageNumber, 3);
    return {
      dots: true,
      infinite: packageNumber > 3,
      speed: 600,
      slidesToShow: slidesToShow,
      slidesToScroll: 1,
      autoplay: false,
      autoplaySpeed: 3000,
      arrows: false,
      responsive: [
        {
          breakpoint: 1366,
          settings: {
            slidesToShow: Math.min(packageNumber, 2),
            dots: true,
            arrows: false,
          },
        },
        {
          breakpoint: 1024,
          settings: {
            slidesToShow: 1,
            dots: true,
            arrows: false,
          },
        },
        {
          breakpoint: 600,
          settings: {
            slidesToShow: 1,
            dots: true,
            arrows: false,
          },
        },
      ],
    };
  }, []);

  // Effects
  useEffect(() => {
    isMountedRef.current = true;
    getPackageList();
    if (token) {
      earningPortfolio();
      earningPortfolioSummary();
      subscribedPackageList();
    }

    return () => {
      isMountedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedWallet && packageDetails?.currency_id) {
      getWalletBalance();
    }
  }, [selectedWallet, packageDetails?.currency_id, getWalletBalance]);

  useEffect(() => {
 window.scrollTo(0, 0);
  }, []);

  return (
    <>
      <Helmet>
        <title>Rewards & Yield – URG-X Earning Platform</title>
        <meta
          name="description"
          content="Access URG-X earning programs: rewards, staking and yield-based crypto solutions on a trusted platform."
        />
        <meta
          name="keywords"
          content="crypto yield, earn with crypto, URG-X earning, crypto rewards platform"
        />
      </Helmet>

      <section className='earning_outer_s'>
        <div className='earning_section_cate'>
          <div className='earning_right_tab'>
            <div className='toptabs_hd'>
              <div className='container'>
                <ul className="nav nav-tabs" id="myTab" role="tablist">
                  <li className="nav-item" role="presentation">
                    <button className="nav-link active" id="home-tab" data-bs-toggle="tab" data-bs-target="#home" type="button" role="tab" aria-controls="home" aria-selected="true">Earning</button>
                  </li>
                  <li className="nav-item" role="presentation">
                    <button className="nav-link" id="profile-tab" data-bs-toggle="tab" data-bs-target="#profile" type="button" role="tab" aria-controls="profile" aria-selected="false">Earning Dashboard</button>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className='container'>
            <div className="tab-content" id="myTabContent">
              {/* Earning Tab */}
              <div className="tab-pane fade show active" id="home" role="tabpanel" aria-labelledby="home-tab">
                <div className='exchange_earning_bnr'>
                  <div className='earningbnr_cnt'>
                    <h2>URG-X Earning</h2>
                    <p>New user exclusive: Up to <span>600% APR</span></p>
                    {!token && (
                      <button className='signbtn' onClick={() => navigate('/register')}>Sign Up Now</button>
                    )}
                  </div>
                  <div className='earning_bnr'>
                    <img src="/images/earining_bnr_vector.png" alt="Exchange Earning" />
                  </div>
                </div>

                <div className='earning_list_block'>
                  {filteredPackageList?.length > 0 ? (
                    filteredPackageList.slice(0, 1).map((packages, groupIndex) => {
                      const groupSlidesCount = packages.length;
                      const groupSettings = getSliderSettings(groupSlidesCount);

                      return (
                        <div key={groupIndex} className="slider_group_wrapper">
                          <Slider {...groupSettings}>
                            {packages.map((item) => (
                              <div key={item._id} className="currency_list_b ">
                                <ul>
                                  <li className="currency_list_b_li">
                                    <div className="currency_bit">
                                      <div className="currency_bit_inner">
                                        <img
                                          src={ApiConfig?.baseImage + item?.icon_path}
                                          className="img-fluid"
                                          alt={item?.currency_fullname}
                                          onError={(e) => { e.target.src = '/images/default-coin.png'; }}
                                        />
                                        <h2>
                                          {item?.currency}
                                          <span>({item?.currency_fullname})</span>
                                        </h2>
                                      </div>
                                      <span className='newtag'>Trending<i className="ri-fire-line"></i></span>
                                    </div>
                                    <ul className='usd_detail_list'>
                                      <li><span>{item?.duration_days}</span> Days</li>
                                      <li className='pricevalue'><span>% APY</span>{item?.return_percentage?.toFixed(2)}</li>
                                    </ul>
                                    <div className="currency_bit_footer">
                                      <button className="subscribe_btn">
                                        {token ? (
                                          <a href="#/" onClick={(e) => { e.preventDefault(); showPackageDetails(item, packages); }}>Subscribe</a>
                                        ) : (
                                          <Link to="/login">Login</Link>
                                        )}
                                      </button>
                                    </div>
                                  </li>
                                </ul>
                              </div>
                            ))}
                          </Slider>
                        </div>
                      );
                    })
                  ) : (
                    <div className='d-flex justify-content-center'>
                      <div className="no_data_outer">
                        <div className="table-responsive">
                          <div className="no_data_vector">
                            <img src="/images/no_data_vector.svg" className="dark_img" alt="no-data" />
                            <img src="/images/no_data_vector_light.png" className="light_img" alt="no-data" />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* All Products Section */}
                  <div className='all_product_data'>
                    <h3>All Plans</h3>

                    {/* Desktop View */}
                    <div className='desktop_view'>  
                      <div className="table-responsive">
                      <table className="table">
                        <thead>
                          <tr>
                            <th>Token</th>
                            <th>Est. APR</th>
                            <th>Duration</th>
                            <th className='action_td'>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {groupedPackages.length > 0 ? (
                            groupedPackages.map((group, index) => {
                              const minApr = Math.min(...group.packages.map(p => p.return_percentage || 0));
                              const maxApr = Math.max(...group.packages.map(p => p.return_percentage || 0));
                              const minDays = Math.min(...group.packages.map(p => p.duration_days || 0));
                              const maxDays = Math.max(...group.packages.map(p => p.duration_days || 0));

                              return (
                                <tr key={group.currency + index}>
                                  <td>
                                    <div className="td_div">
                                      <img
                                        alt={group.currency}
                                        src={ApiConfig?.baseImage + group.icon_path}
                                        className="img-fluid icon_img coinimg me-2"
                                        onError={(e) => { e.target.src = '/images/default-coin.png'; }}
                                      />
                                      {group.currency}
                                    </div>
                                  </td>
                                  <td>{minApr.toFixed(2)}% ~ {maxApr.toFixed(2)}%</td>
                                  <td>{minDays}/{maxDays} days</td>
                                  <td className='action_td'>
                                    <span className="btn custom-btn subscribebtn">
                                      <button onClick={() => showPackageDetails(group.packages[0], group.packages)}>
                                        Subscribe
                                      </button>
                                    </span>
                                  </td>
                                </tr>
                              );
                            })
                          ) : (
                            <tr className="no-data-row">
                              <td colSpan="4">
                                <div className="no-data-wrapper">
                                  <div className="no_data_vector">
                                    <img src="/images/no_data_vector.svg" className="dark_img" alt="no-data" />
                                    <img src="/images/no_data_vector_light.png" className="light_img" alt="no-data" />
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>


                    {/* Mobile View */}
                    <div className='mobile_view'>
                      <div className="table-responsive">
                      <table className="table">
                        <thead>
                          <tr>
                            <th>Token</th>
                            <th>Est. APR</th>
                            <th className='action_td'>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {groupedPackages.length > 0 ? (
                            groupedPackages.map((group, index) => {
                              const minApr = Math.min(...group.packages.map(p => p.return_percentage || 0));
                              const maxApr = Math.max(...group.packages.map(p => p.return_percentage || 0));
                              const minDays = Math.min(...group.packages.map(p => p.duration_days || 0));
                              const maxDays = Math.max(...group.packages.map(p => p.duration_days || 0));

                              return (
                                <tr key={group.currency + index} onClick={() => showPackageDetails(group.packages[0], group.packages)} style={{ cursor: 'pointer' }}>
                                  <td>
                                    <div className="td_div">
                                      {/* <span className="star_btn btn_icon">
                                        <i className="ri ri-star-line me-2"></i>
                                      </span> */}
                                      <img
                                        alt={group.currency}
                                        src={ApiConfig?.baseImage + group.icon_path}
                                        className="img-fluid icon_img coinimg me-2"
                                        onError={(e) => { e.target.src = '/images/default-coin.png'; }}
                                      />
                                      {group.currency}
                                    </div>
                                  </td>
                                  <td>{minApr.toFixed(2)}% ~ {maxApr.toFixed(2)}%</td>
                                  <td className='action_td'>
                                    <span className="btn custom-btn subscribebtn">
                                      <button onClick={() => showPackageDetails(group.packages[0], group.packages)}>
                                        Subscribe
                                      </button>
                                    </span>
                                  </td>
                                </tr>
                              );
                            })
                          ) : (
                            <tr className="no-data-row">
                              <td colSpan="3">
                                <div className="no-data-wrapper">
                                  <div className="no_data_vector">
                                    <img src="/images/no_data_vector.svg" className="dark_img" alt="no-data" />
                                    <img src="/images/no_data_vector_light.png" className="light_img" alt="no-data" />
                                  </div>
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
            </div>

            {/* Earning Dashboard Tab */}
            <div className="tab-pane fade" id="profile" role="tabpanel" aria-labelledby="profile-tab">
              <div className='exchange_earning_bnr'>
                <div className='earningbnr_cnt'>
                  <h2>URG-X Earning Balance</h2>
                  <p>View your total earnings, rewards, and growth in one place.</p>
                  {!token && (
                    <button className='signbtn' onClick={() => navigate('/register')}>Sign Up Now</button>
                  )}
                </div>
                <div className='earning_bnr'>
                  <img src="/images/earning_balance_vector.png" alt="Exchange Earning" />
                </div>
              </div>

              <ul className='balance_list_s'>
                <li>
                  <div className='balance_cnt'>
                    <h4>{formatNumber(portfolioSummary?.total_invested || 0)} $</h4>
                    <p>Total Invested</p>
                  </div>
                  <div className='balance_vector'>
                    <img src="/images/wallet_coins_balance.svg" alt="Earning Balance" />
                  </div>
                </li>
                <li>
                  <div className='balance_cnt'>
                    <h4>{formatNumber(portfolioSummary?.total_expected_return || 0)} $</h4>
                    <p>Expected Return</p>
                  </div>
                  <div className='balance_vector'>
                    <img src="/images/wallet_coins_balance2.svg" alt="Earning Balance" />
                  </div>
                </li>
                <li>
                  <div className='balance_cnt'>
                    <h4>{formatNumber(portfolioSummary?.total_running_investment || 0)} $</h4>
                    <p>Running Investment</p>
                  </div>
                  <div className='balance_vector'>
                    <img src="/images/wallet_coins_balance3.svg" alt="Earning Balance" />
                  </div>
                </li>
                <li>
                  <div className='balance_cnt'>
                    <h4>{formatNumber(portfolioSummary?.total_bonus_remaining || 0)} $</h4>
                    <p>Bonus Remaining</p>
                  </div>
                  <div className='balance_vector'>
                    <img src="/images/wallet_coins_balance4.svg" alt="Earning Balance" />
                  </div>
                </li>
              </ul>

              <div className="wallet_balance_tb">
                <div className="user_list_top walletbalance_t">
                  <div className="user_list_l">
                    <h4>Earning Assets</h4>
                  </div>
                </div>

                <div className='table-responsive'>

                  {portfolio?.length > 0 ? (
                    portfolio.map((item, index) => (
                      <ul className='earning_assets_list' key={item._id || index}>
                        <li>
                          <span>
                            <img
                              src={ApiConfig?.baseImage + item?.icon_path}
                              alt={item?.currency}
                              width="20"
                              height="20"
                              style={{ marginRight: '8px', verticalAlign: 'middle' }}
                              onError={(e) => { e.target.src = '/images/default-coin.png'; }}
                            />
                            {item?.currency}
                          </span>
                          {item?.currency_fullname}
                        </li>
                        <li><span>Total Invested</span>{formatNumber(item?.invested_amount || 0)} {item?.currency}</li>
                        <li><span>Expected Return</span>{formatNumber(item?.expected_return || 0)} {item?.currency}</li>
                        <li><span>Running</span>{formatNumber(item?.running_investment || 0)} {item?.currency}</li>
                        <li><span>Bonus Remaining</span>{formatNumber(item?.bonus_remaining || 0)} {item?.currency}</li>
                      </ul>
                    ))
                  ) : (
                    <>
                     
                      <div className="no-data-wrapper" style={{ padding: '40px 20px', textAlign: 'center' }}>
                        <div className="no_data_s">
                          <img src="/images/no_data_vector.svg" className="img-fluid dark_img" alt="" />
                          <img src="/images/no_data_vector_light.png" className="img-fluid light_img" alt="" />
                          <small className=" mt-2">Start investing to see your portfolio</small>
                        </div>
                      </div>
                    </>
                  )}
                  
                </div>
              </div>

              <div className="dashboard_recent_s productdata position_order">
                <div className='d-flex justify-content-between align-items-center'>
                  <h4>Earning Balance History</h4>
                  <div className="searchBar custom-tabs">
                    <i className="ri-search-2-line"></i>
                    <input
                      type="search"
                      className="custom_search"
                      placeholder="Search token"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                </div>

                <div className="user_list_top rowtable">
                  <div className="user_list_l earning_section_cate responsive-table">
                    <ul className="position_list nav nav-tabs" id="earningHistoryTab" role="tablist">
                      <li className="nav-item" role="presentation">
                        <button
                          className="nav-link active"
                          id="active-tab"
                          data-bs-toggle="tab"
                          data-bs-target="#activeTab"
                          type="button"
                          role="tab"
                        >
                          Active
                        </button>
                      </li>
                      <li className="nav-item" role="presentation">
                        <button
                          className="nav-link"
                          id="completed-tab"
                          data-bs-toggle="tab"
                          data-bs-target="#completedTab"
                          type="button"
                          role="tab"
                        >
                          Completed
                        </button>
                      </li>
                    </ul>
                  </div>
                </div>

                <div className='table-responsive recenttable_s'>
                  <div className="tab-content" id="earningHistoryTabContent">
                    {/* Active Subscriptions */}
                    <div className="tab-pane fade show active" id="activeTab" role="tabpanel">

                      <div className='order_history_mobile_view'>
                        {filteredActivePackages?.length > 0 ? (
                          filteredActivePackages.map((item, index) => (
                            <div className='d-flex mb-3' key={item._id || index}>
                              <div className='order_datalist'>
                                <ul className='listdata'>
                                  <li>
                                    <span className='date'>{item?.currency}</span>
                                    <span className='date_light'>{moment(item.start_date).format("DD/MM/YYYY")}</span>
                                  </li>
                                  <li>
                                    <span>Subscription Amount</span>
                                    <span>{formatToNineDecimals(parseFloat(item?.invested_amount?.$numberDecimal || 0))} {item?.currency}</span>
                                  </li>
                                  <li>
                                    <span>Receivable Amount</span>
                                    <span>{formatToNineDecimals(parseFloat(item?.expected_return?.$numberDecimal || 0))} {item?.currency}</span>
                                  </li>
                                  <li>
                                    <span>Status</span>
                                    <span className='text-white '> <strong>{item?.status}</strong></span>
                                  </li>
                                  {showActiveExpandedRows[index] && (
                                    <>
                                      <li>
                                        <span>Deducted From</span>
                                        <span >{item?.wallet_type?.charAt(0).toUpperCase() + item?.wallet_type?.slice(1)} Wallet</span>
                                      </li>
                                      <li>
                                        <span>Duration</span>
                                        <span>{item?.duration_days} days</span>
                                      </li>
                                      <li>
                                        <span>Start Date</span>
                                        <span>{moment(item.start_date).format("YYYY-MM-DD")}</span>
                                      </li>
                                      <li>
                                        <span>Mature Date</span>
                                        <span>{moment(item.end_date).format("YYYY-MM-DD")}</span>
                                      </li>
                                      <li>
                                        <span>Bonus Amount</span>
                                        <span >+{formatToNineDecimals(parseFloat(item?.expected_return?.$numberDecimal || 0) - parseFloat(item?.invested_amount?.$numberDecimal || 0))}</span>
                                      </li>
                                    </>
                                  )}
                                </ul>
                                <button
                                  type="button"
                                  className="view_more_btn"
                                  onClick={() => setShowActiveExpandedRows({ ...showActiveExpandedRows, [index]: !showActiveExpandedRows[index] })}
                                >
                                  {showActiveExpandedRows[index] ? <i className="ri-arrow-down-s-line"></i> : <i className="ri-arrow-up-s-line"></i>}
                                </button>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="no-data-wrapper">
                            <div className="no_data_s">
                              <img src="/images/no_data_vector.svg" className="dark_img" alt="no-data" />
                              <img src="/images/no_data_vector_light.png" className="light_img" alt="no-data" />
                            </div>
                            {!token && <p>Please <Link to='/login'>Login</Link> to continue</p>}
                          </div>
                        )}
                      </div>

                      <div className='desktop_view'>
                        <div className="table-responsive">
                        <table>
                          <thead>
                            <tr>
                              <th>S.No</th>
                              <th>Currency</th>
                              <th>Deducted From</th>
                              <th>Duration</th>
                              <th>Start Date</th>
                              <th>Mature Date</th>
                              <th>Subscription Amount</th>
                              <th>Bonus Amount</th>
                              <th>Receivable Amount</th>
                              <th>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredActivePackages?.length > 0 ? (
                              filteredActivePackages.map((item, index) => (
                                <tr key={item._id || index}>
                                  <td>{skipActive + index + 1}</td>
                                  <td>{item?.currency}</td>
                                  <td >
                                    {item?.wallet_type?.charAt(0).toUpperCase() + item?.wallet_type?.slice(1)} Wallet
                                  </td>
                                  <td>{item?.duration_days} days</td>
                                  <td>{moment(item.start_date).format("YYYY-MM-DD")}</td>
                                  <td>{moment(item.end_date).format("YYYY-MM-DD")}</td>
                                  <td>{formatToNineDecimals(parseFloat(item?.invested_amount?.$numberDecimal || 0))}</td>
                                  <td>
                                    +{formatToNineDecimals(parseFloat(item?.expected_return?.$numberDecimal || 0) - parseFloat(item?.invested_amount?.$numberDecimal || 0))}
                                  </td>
                                  <td>{formatToNineDecimals(parseFloat(item?.expected_return?.$numberDecimal || 0))}</td>
                                  <td className='text-white'><strong>{item?.status}</strong> </td>
                                </tr>
                              ))
                            ) : (
                              <tr rowSpan="5" className="no-data-row">
                                <td colSpan="10">
                                  <div className="no-data-wrapper">
                                    <div className="no_data_s">
                                      <img src="/images/no_data_vector.svg" className="dark_img" alt="no-data" />
                                      <img src="/images/no_data_vector_light.png" className="light_img" alt="no-data" />
                                    </div>
                                    {!token && <p>Please <Link to='/login'>Login</Link> to continue</p>}
                                  </div>
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                        </div>
                      </div>
                    </div>

                    {/* Completed Subscriptions */}
                    <div className="tab-pane fade" id="completedTab" role="tabpanel">

                      <div className='order_history_mobile_view'>
                        {filteredCompletedPackages?.length > 0 ? (
                          filteredCompletedPackages.map((item, index) => (
                            <div className='d-flex mb-3' key={item._id || index}>
                              <div className='order_datalist'>
                                <ul className='listdata'>
                                  <li>
                                    <span className='date'>{item?.currency}</span>
                                    <span className='date_light'>{moment(item.start_date).format("DD/MM/YYYY")}</span>
                                  </li>
                                  <li>
                                    <span>Subscription Amount</span>
                                    <span>{formatToNineDecimals(parseFloat(item?.invested_amount?.$numberDecimal || 0))} {item?.currency}</span>
                                  </li>
                                  <li>
                                    <span>Received Amount</span>
                                    <span className='text-success'>{formatToNineDecimals(parseFloat(item?.expected_return?.$numberDecimal || 0))} {item?.currency}</span>
                                  </li>
                                  <li>
                                    <span>Status</span>
                                    <span className='text-success'>{item?.status}</span>
                                  </li>
                                  {showCompletedExpandedRows[index] && (
                                    <>
                                      <li>
                                        <span>Received In</span>
                                        <span className='text-success'>{item?.credited_wallet_type?.charAt(0).toUpperCase() + item?.credited_wallet_type?.slice(1)} Wallet</span>
                                      </li>
                                      <li>
                                        <span>Duration</span>
                                        <span>{item?.duration_days} days</span>
                                      </li>
                                      <li>
                                        <span>Start Date</span>
                                        <span>{moment(item.start_date).format("YYYY-MM-DD")}</span>
                                      </li>
                                      <li>
                                        <span>Mature Date</span>
                                        <span>{moment(item.end_date).format("YYYY-MM-DD")}</span>
                                      </li>
                                      <li>
                                        <span>Bonus</span>
                                        <span className='text-success'>+{formatToNineDecimals(parseFloat(item?.expected_return?.$numberDecimal || 0) - parseFloat(item?.invested_amount?.$numberDecimal || 0))}</span>
                                      </li>
                                    </>
                                  )}
                                </ul>
                                <button
                                  type="button"
                                  className="view_more_btn"
                                  onClick={() => setShowCompletedExpandedRows({ ...showCompletedExpandedRows, [index]: !showCompletedExpandedRows[index] })}
                                >
                                  {showCompletedExpandedRows[index] ? <i className="ri-arrow-down-s-line"></i> : <i className="ri-arrow-up-s-line"></i>}
                                </button>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="no-data-wrapper">
                            <div className="no_data_s">
                              <img src="/images/no_data_vector.svg" className="dark_img" alt="no-data" />
                              <img src="/images/no_data_vector_light.png" className="light_img" alt="no-data" />
                            </div>
                            {!token && <p>Please <Link to='/login'>Login</Link> to continue</p>}
                          </div>
                        )}
                      </div>

                      <div className='desktop_view'>
                      <div className="table-responsive">
                        <table>
                          <thead>
                            <tr>
                              <th>S.No</th>
                              <th>Currency</th>
                              <th>Received In</th>
                              <th>Duration</th>
                              <th>Start Date</th>
                              <th>Mature Date</th>
                              <th>Subscription Amount</th>
                              <th>Bonus</th>
                              <th>Received Amount</th>
                              <th>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredCompletedPackages?.length > 0 ? (
                              filteredCompletedPackages.map((item, index) => (
                                <tr key={item._id || index}>
                                  <td>{skipCompleted + index + 1}</td>
                                  <td>{item?.currency}</td>
                                  <td className='text-success'>
                                    {item?.credited_wallet_type?.charAt(0).toUpperCase() + item?.credited_wallet_type?.slice(1)} Wallet
                                  </td>
                                  <td>{item?.duration_days} days</td>
                                  <td>{moment(item.start_date).format("YYYY-MM-DD")}</td>
                                  <td>{moment(item.end_date).format("YYYY-MM-DD")}</td>
                                  <td>{formatToNineDecimals(parseFloat(item?.invested_amount?.$numberDecimal || 0))}</td>
                                  <td className='text-success'>
                                    +{formatToNineDecimals(parseFloat(item?.expected_return?.$numberDecimal || 0) - parseFloat(item?.invested_amount?.$numberDecimal || 0))}
                                  </td>
                                  <td className='text-success'>
                                    {formatToNineDecimals(parseFloat(item?.expected_return?.$numberDecimal || 0))}
                                  </td>
                                  <td className='text-success'>{item?.status}</td>
                                </tr>
                              ))
                            ) : (
                              <tr rowSpan="5" className="no-data-row">
                                <td colSpan="10">
                                  <div className="no-data-wrapper">
                                    <div className="no_data_s">
                                      <img src="/images/no_data_vector.svg" className="dark_img" alt="no-data" />
                                      <img src="/images/no_data_vector_light.png" className="light_img" alt="no-data" />
                                    </div>
                                    {!token && <p>Please <Link to='/login'>Login</Link> to continue</p>}
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
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>
      </section>

      {/* <!-- Modal earning popup start --> */}
      <div
        className="modal fade earningpopup"
        id="package_details"
        tabIndex="-1"
        aria-labelledby="exampleModalLabel"
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
                onClick={resetInput}
              ></button>
            </div>

            <div className="modal-body text-center">
              <div className='earining_popup_exchange'>
                <div className='lft_pop_cnt'>
                  <h3>
                    <img
                      src={packageDetails?.icon_path ? ApiConfig?.baseImage + packageDetails?.icon_path : "/images/tether_icon.png"}
                      alt={packageDetails?.currency || "coin"}
                      onError={(e) => { e.target.src = '/images/tether_icon.png'; }}
                    />
                    {packageDetails?.currency || "N/A"}
                  </h3>

                  <ul className='daylist'>
                    {selectedCurrencyPackages.length > 0 ? (
                      selectedCurrencyPackages.map((pkg) => (
                        <li
                          key={pkg._id}
                          className={packageDetails?._id === pkg._id ? 'active' : ''}
                          onClick={() => handleDurationSelect(pkg)}
                          style={{ cursor: 'pointer' }}
                        >
                          <span>{pkg.duration_days} Day</span>
                          {pkg.return_percentage?.toFixed(2)}%
                        </li>
                      ))
                    ) : (
                      <li className='active'>
                        <span>{packageDetails?.duration_days || 0} Day</span>
                        {packageDetails?.return_percentage?.toFixed(2) || "0.00"}%
                      </li>
                    )}
                  </ul>

                  <ul className='termslist'>
                    <li>Reference <span className='text-green'>{packageDetails?.return_percentage?.toFixed(2) || "0.00"}%</span></li>
                    <li>Term<span><strong>{packageDetails?.duration_days || 0} days</strong></span></li>
                  </ul>

                  <div className='payment_method_f'>

                    <div className='payment_inquery'>
                      <h3>Payment Method</h3>
                      <div className='select_option'>
                        <select
                          value={selectedWallet}
                          onChange={(e) => setSelectedWallet(e.target.value)}
                        >
                          {walletType.map((wallet, index) => (
                            <option key={index} value={wallet}>
                              {wallet?.charAt(0).toUpperCase() + wallet?.slice(1)}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className='payment_inquery'>
                      <h3>Subscription Amount </h3>
                      <div className='amount_input'>
                        <input
                          type='text'
                          placeholder={`Enter Subscription Amount (Min ${packageDetails?.min_amount} ${packageDetails?.currency})`}
                          value={subscriptionAmount}
                          onChange={handleSubscriptionAmountChange}
                        />
                        <span className='max text-green' onClick={handleMaxAmount} style={{ cursor: 'pointer' }}>Max</span>
                      </div>
                    </div>

                  </div>

                  <ul className='termslist border-0'>
                    <li>Funding Account <span>{walletBalance} {packageDetails?.currency}<i className="ri-add-circle-line"></i></span></li>
                    <li>Max Account<span className='text-light'>{packageDetails?.max_amount || "Unlimited"} {packageDetails?.currency}</span></li>
                  </ul>

                </div>

                <div className='right_cnt_pop'>
                  <h4>Preview</h4>

                  <ul className='subscriptionlist'>
                    <li>Subscription Date<span>{moment().format("D/M/YYYY, HH:mm")}</span></li>
                    <li>Accrual Date <span>{moment().add(1, 'days').format("D/M/YYYY, HH:mm")}</span></li>
                    <li>Profit Distribution Date <span>{moment().add(packageDetails?.duration_days || 0, 'days').format("D/M/YYYY, 17:30")}</span></li>
                    <li>Date of Maturity <span>{moment().add(packageDetails?.duration_days || 0, 'days').format("D/M/YYYY")}</span></li>
                  </ul>

                  <ul className='termslist border-0'>
                    <li>Redemption Period <span>{packageDetails?.duration_days || 0} days</span></li>
                    <li>Profit Received<span>At Maturity</span></li>
                  </ul>

                  <div className='estimated'>
                    <h4>Estimated Returns</h4>

                    <ul className='termslist border-0 mb-0'>
                      <li>Daily Earnings <span>{dailyReturns} {packageDetails?.currency} / D</span></li>
                      <li>Total Earnings ({packageDetails?.duration_days || 0}D) <span className='text-green'>+{totalReturns} {packageDetails?.currency}</span></li>
                      <li>Total Receivable <span className='text-green'>{totalReceivable} {packageDetails?.currency}</span></li>
                    </ul>

                    <ul className='estimatedlist'>
                      <li>* At maturity, your funds are seamlessly transferred to you earning balance.</li>
                      <li>* Early withdrawals are not permitted. In case of cancellation before maturity, profits will not be applicable.</li>
                    </ul>
                    <label>
                      <input
                        type='checkbox'
                        checked={agreeTerms}
                        onChange={(e) => setAgreeTerms(e.target.checked)}
                      /> I have read and agree to the <a href='/terms'>Earn Service Agreement.</a>
                    </label>
                    <button
                      className='subscribebtn'
                      onClick={subscribeEarningPackage}
                      disabled={isStakingDisabled || isSubscribing || !agreeTerms || !subscriptionAmount || parseFloat(subscriptionAmount) <= 0}
                    >
                      {isSubscribing ? 'Processing...' : isStakingDisabled ? 'Staking Disabled' : 'Subscription'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* <!-- Modal   more details Pop Up End --> */}
    </>
  );
}

export default Earning;
