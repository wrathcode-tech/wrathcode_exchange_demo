import React, { useEffect, useState } from "react";
import LoaderHelper from "../../../customComponents/Loading/LoaderHelper";
import AuthService from "../../../api/services/AuthService";
import { ApiConfig } from "../../../api/apiConfig/apiConfig";
import { alertErrorMessage, alertSuccessMessage } from "../../../customComponents/CustomAlertMessage";
import { useNavigate } from "react-router-dom";
import P2pLayout from "./P2pLayout";
import "./p2p.css";

const P2pDashboard = () => {
  const navigate = useNavigate();
  const [buyOrderList, setBuyOrderList] = useState([]);
  const [sellOrderList, setSellOrderList] = useState([]);
  const [selectedRow, setSelectedRow] = useState(null);
  const [selectedPaymentTab, setSelectedPaymentTab] = useState("Buy");
  const [selectedCurrency, setSelectedCurrency] = useState("USDT");
  const [selectedFiat, setSelectedFiat] = useState("INR");
  const [selectedPaymentType, setSelectedPaymentType] = useState("All payments");
  const [selectedRowData, setSelectedRowData] = useState({});
  const [buyerSelectedPaymentMethod, setBuyerSelectedPaymentMethod] = useState("");
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState("");

  const [paymentMethods, setPaymentMethods] = useState([]);
  const [fiatList, setFiatList] = useState([]);
  const [cryptoList, setCryptoList] = useState([]);
  const [userPaymentMethods, setUserPaymentMethods] = useState([]);

  // User info states
  const [userKycStatus, setUserKycStatus] = useState(0); // 0 = not verified, 2 = verified
  const [userRegistrationDays, setUserRegistrationDays] = useState(0);
  const [cryptoBalances, setCryptoBalances] = useState({});

  const [fiatAmount, setFiatAmount] = useState("");
  const [quoteAmount, setQuoteAmount] = useState("");

  // Validation error states
  const [errors, setErrors] = useState({
    fiatAmount: "",
    quoteAmount: "",
    paymentMethod: ""
  });

  // Loading states
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [loadingFilters, setLoadingFilters] = useState(true);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [itemsPerPage] = useState(10);

  // Mobile filter toggle
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const toggleRow = (id, data) => {
    setSelectedRow((prev) => (prev === id ? null : id));
    setSelectedRowData(data);
    setBuyerSelectedPaymentMethod('');
    setSelectedPaymentMethodId('');
    setFiatAmount('');
    setQuoteAmount('');
    setErrors({ fiatAmount: "", quoteAmount: "", paymentMethod: "" });
  };

  // Get sell orders for buyer (when user wants to BUY)
  const getSellOrders = async (page = currentPage) => {
    try {
      setLoadingOrders(true);
      const params = {
        fiat: selectedFiat,
        crypto: selectedCurrency,
        paymentType: selectedPaymentType,
        page: page,
        limit: itemsPerPage
      };
      const result = await AuthService.p2pSellOrderForBuyer(params);
      // API returns: { success, message, data: { ads, pagination, filters } }
      if (result?.success && result?.data) {
        setBuyOrderList(result.data.ads || []);
        // Update pagination from API response
        if (result.data.pagination) {
          setTotalPages(result.data.pagination.totalPages || 0);
          setTotalCount(result.data.pagination.totalCount || 0);
          setCurrentPage(result.data.pagination.currentPage || 1);
        }
      } else {
        setBuyOrderList([]);
        setTotalPages(0);
        setTotalCount(0);
      }
    } catch (error) {
      console.error('Error fetching sell orders:', error);
      setBuyOrderList([]);
      setTotalPages(0);
      setTotalCount(0);
    } finally {
      setLoadingOrders(false);
    }
  };

  // Get buy orders for seller (when user wants to SELL)
  const getBuyOrders = async (page = currentPage) => {
    try {
      setLoadingOrders(true);
      const params = {
        fiat: selectedFiat,
        crypto: selectedCurrency,
        paymentType: selectedPaymentType,
        page: page,
        limit: itemsPerPage
      };
      const result = await AuthService.p2pBuyOrderForSeller(params);
      // API returns: { success, message, data: { ads, pagination, filters } }
      if (result?.success && result?.data) {
        setSellOrderList(result.data.ads || []);
        // Update pagination from API response
        if (result.data.pagination) {
          setTotalPages(result.data.pagination.totalPages || 0);
          setTotalCount(result.data.pagination.totalCount || 0);
          setCurrentPage(result.data.pagination.currentPage || 1);
        }
      } else {
        setSellOrderList([]);
        setTotalPages(0);
        setTotalCount(0);
      }
    } catch (error) {
      console.error('Error fetching buy orders:', error);
      setSellOrderList([]);
      setTotalPages(0);
      setTotalCount(0);
    } finally {
      setLoadingOrders(false);
    }
  };

  const loadFilters = async () => {
    try {
      setLoadingFilters(true);
      const [paymentRes, fiatRes, cryptoRes, userPaymentRes, profileRes, walletRes] = await Promise.all([
        AuthService.getAllPaymentMethods(),
        AuthService.getFiatCurrency(),
        AuthService.getCurrency(),
        AuthService.getUserPaymentMethods(),
        AuthService.getDetails(),
        AuthService.getUserfunds('p2p')
      ]);

      // Handle payment methods - extract data from response
      const allPayments = [{ _id: 'all', name: 'All payments' }];
      const paymentData = paymentRes?.success ? paymentRes.data : (paymentRes?.data || paymentRes || []);
      if (Array.isArray(paymentData) && paymentData.length > 0) {
        setPaymentMethods([...allPayments, ...paymentData]);
      } else {
        setPaymentMethods(allPayments);
      }

      // Handle user's payment methods (for sell orders)
      if (userPaymentRes?.success) {
        setUserPaymentMethods(userPaymentRes?.data || []);
      }

      // Handle user profile - KYC status and registration days
      if (profileRes) {
        const userData = profileRes?.data || profileRes;
        setUserKycStatus(userData?.kycVerified || 0);
        // Calculate registration days
        if (userData?.createdAt) {
          const registrationDate = new Date(userData.createdAt);
          const today = new Date();
          const diffTime = Math.abs(today - registrationDate);
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          setUserRegistrationDays(diffDays);
        }
      }

      // Handle P2P wallet balances from getUserfunds('p2p')
      if (walletRes?.success && walletRes?.data) {
        const walletData = walletRes.data;
        if (Array.isArray(walletData)) {
          const balanceMap = {};
          walletData.forEach(wallet => {
            if (wallet?.short_name) {
              balanceMap[wallet.short_name] = parseFloat(wallet.balance) || 0;
            }
          });
          setCryptoBalances(balanceMap);
        }
      }

      // Handle fiat currencies - set INR as default if exists, otherwise first item
      const fiatData = fiatRes?.success ? fiatRes.data : (fiatRes?.data || fiatRes || []);
      if (Array.isArray(fiatData) && fiatData.length > 0) {
        setFiatList(fiatData);
        // Check if INR exists in the list
        const inrCurrency = fiatData.find(f => f.short_name === 'INR');
        if (inrCurrency) {
          setSelectedFiat('INR');
        } else if (fiatData[0]?.short_name) {
          setSelectedFiat(fiatData[0].short_name);
        }
      }

      // Handle crypto currencies - set USDT as default if exists, otherwise first item
      const cryptoData = cryptoRes?.success ? cryptoRes.data : (cryptoRes?.data || cryptoRes || []);
      if (Array.isArray(cryptoData) && cryptoData.length > 0) {
        setCryptoList(cryptoData);
        // Check if USDT exists in the list
        const usdtCurrency = cryptoData.find(c => c.short_name === 'USDT');
        if (usdtCurrency) {
          setSelectedCurrency('USDT');
        } else if (cryptoData[0]?.short_name) {
          setSelectedCurrency(cryptoData[0].short_name);
        }
      }
    } catch (error) {
      console.error('Error loading filters:', error);
    } finally {
      setLoadingFilters(false);
    }
  };

  // Load filters on mount
  useEffect(() => {
    loadFilters();
  }, []);

  // Load orders when filters change or after filters are loaded (reset to page 1)
  useEffect(() => {
    if (!loadingFilters) {
      if (selectedPaymentTab === "Buy") {
        getSellOrders(1);
      } else {
        getBuyOrders(1);
      }
    }
  }, [selectedFiat, selectedCurrency, selectedPaymentType, loadingFilters]);

  const toFixedFormat = (data, decimal = 2) => {
    return parseFloat(data?.toFixed(decimal));
  };

  // Display label as-is from backend (already formatted)
  const formatLabel = (text) => {
    return text;
  };

  // Get display fields for a payment method (excluding internal fields)
  const getPaymentDisplayFields = (paymentMethod) => {
    const excludeKeys = ['_id', 'templateId', 'type', 'name', 'qrCode', 'userId', 'createdAt', 'updatedAt', '__v'];
    return Object.entries(paymentMethod).filter(
      ([key, value]) => !excludeKeys.includes(key) && value && value !== ''
    );
  };

  // Get user's payment methods that match the ad's accepted payment types (for SELL orders)
  const getMatchingUserPaymentMethods = () => {
    if (!selectedRowData?.paymentMethodType || !userPaymentMethods.length) {
      return [];
    }
    // Filter user's payment methods to only show ones that match ad's accepted types
    const adPaymentTypes = selectedRowData.paymentMethodType;
    return userPaymentMethods.filter(userPm => {
      const userType = userPm.type || '';
      const userName = userPm.name || '';
      return adPaymentTypes.includes(userType) || adPaymentTypes.includes(userName);
    });
  };

  const amountInput = (value, type, price) => {
    let cleanedValue = value.toString().replace(/[^0-9.]/g, "");

    // If empty, clear both fields
    if (!cleanedValue) {
      setFiatAmount("");
      setQuoteAmount("");
      return;
    }

    if (type === "fiat") {
      const fiat = parseInt(cleanedValue);
      setFiatAmount(fiat || "");
      const crypto = fiat ? (fiat / price) : "";
      setQuoteAmount(crypto ? Number(crypto.toFixed(2)) : "");
    } else {
      let crypto = parseFloat(cleanedValue);
      if (cleanedValue.includes(".")) {
        const [intPart, decimalPart] = cleanedValue.split(".");
        crypto = Number(`${intPart}.${decimalPart.slice(0, 2)}`);
      }
      setQuoteAmount(crypto || "");
      const fiat = crypto ? (crypto * price) : "";
      setFiatAmount(fiat ? parseInt(fiat) : "");
    }
  };

  const handleBuyOrder = async () => {
    // Reset errors
    let newErrors = { fiatAmount: "", quoteAmount: "", paymentMethod: "" };
    let hasError = false;

    try {
      // Validate adId - must be valid MongoDB ObjectId (24 hex characters)
      const objectIdRegex = /^[0-9a-fA-F]{24}$/;
      if (!selectedRowData?._id || !objectIdRegex.test(selectedRowData._id)) {
        return alertErrorMessage("Invalid ad. Please refresh and try again.");
      }

      // Validate amount - required, positive, min 1, max 100,000,000
      const amount = parseFloat(fiatAmount);
      if (!fiatAmount || isNaN(amount)) {
        newErrors.fiatAmount = "Please enter a valid amount";
        hasError = true;
      } else if (amount <= 0) {
        newErrors.fiatAmount = "Amount must be greater than 0";
        hasError = true;
      } else if (amount < 1) {
        newErrors.fiatAmount = "Amount must be at least 1";
        hasError = true;
      } else if (amount > 100000000) {
        newErrors.fiatAmount = "Amount cannot exceed 100,000,000";
        hasError = true;
      } else if (amount < selectedRowData?.minLimit || amount > selectedRowData?.maxLimit) {
        newErrors.fiatAmount = `Amount must be between ${selectedRowData?.minLimit} - ${selectedRowData?.maxLimit}`;
        hasError = true;
      }

      // Validate crypto amount against available volume
      const convertedCrypto = Number((amount / selectedRowData?.fixedPrice).toFixed(2));
      if (!hasError && convertedCrypto > selectedRowData?.remainingVolume) {
        newErrors.quoteAmount = `Max available: ${selectedRowData?.remainingVolume} ${selectedRowData?.qouteCurrency}`;
        hasError = true;
      }

      // Validate methodType - required, min 2 chars, max 50 chars
      if (!buyerSelectedPaymentMethod) {
        newErrors.paymentMethod = "Please select a payment method";
        hasError = true;
      } else if (buyerSelectedPaymentMethod.trim().length < 2) {
        newErrors.paymentMethod = "Payment method must be at least 2 characters";
        hasError = true;
      } else if (buyerSelectedPaymentMethod.trim().length > 50) {
        newErrors.paymentMethod = "Payment method cannot exceed 50 characters";
        hasError = true;
      }

      // Set errors and return if validation failed
      setErrors(newErrors);
      if (hasError) {
        return;
      }

      LoaderHelper.loaderStatus(true);

      // Round amount to 2 decimal places for fiat
      const payload = {
        adId: selectedRowData._id,
        amount: parseFloat(amount.toFixed(2)),
        methodType: buyerSelectedPaymentMethod.trim()
      };

      const response = await AuthService.buyFromAd(payload);

      if (response?.success) {
        alertSuccessMessage(response?.message || "Order created successfully. Complete payment within time limit.");
        setSelectedRow(null);
        setSelectedRowData({});
        setFiatAmount("");
        setQuoteAmount("");
        setBuyerSelectedPaymentMethod("");
        setErrors({ fiatAmount: "", quoteAmount: "", paymentMethod: "" });
        getSellOrders(1);
        navigate(`/p2p-order-details/${response?.data?.orderId}`);
      } else {
        alertErrorMessage(response?.message || "Unable to create order. Try again.");
      }

    } catch (error) {
      console.error("Buy Submit Error:", error);
      alertErrorMessage(error?.response?.data?.message || "Something went wrong while creating the order.");
    } finally {
      LoaderHelper.loaderStatus(false);
    }
  };

  // Handle sell order submission (user is SELLING crypto)
  const handleSellOrder = async () => {
    // Reset errors
    let newErrors = { fiatAmount: "", quoteAmount: "", paymentMethod: "" };
    let hasError = false;

    try {
      // Check KYC verification status
      const isKycVerified = userKycStatus === 2;
      if (!isKycVerified) {
        return alertErrorMessage("KYC verification is required to sell. Please complete your KYC verification.");
      }

      // Check registration days condition
      const hasRegistrationCondition = selectedRowData?.counterpartyCondition?.isRegisteredCond && 
                                       selectedRowData?.counterpartyCondition?.registerDays > userRegistrationDays;
      if (hasRegistrationCondition) {
        return alertErrorMessage(`Your account must be registered for at least ${selectedRowData?.counterpartyCondition?.registerDays} days to trade with this advertiser. Your account: ${userRegistrationDays} days.`);
      }

      // Validate adId - must be valid MongoDB ObjectId (24 hex characters)
      const objectIdRegex = /^[0-9a-fA-F]{24}$/;
      if (!selectedRowData?._id || !objectIdRegex.test(selectedRowData._id)) {
        return alertErrorMessage("Invalid ad. Please refresh and try again.");
      }

      // Validate crypto amount - required, positive, 4 decimals, min 0.0001, max 999999999
      const cryptoAmount = parseFloat(quoteAmount);
      const MIN_CRYPTO_AMOUNT = 0.0001;

      if (!quoteAmount || isNaN(cryptoAmount)) {
        newErrors.quoteAmount = "Please enter a valid crypto amount";
        hasError = true;
      } else if (cryptoAmount <= 0) {
        newErrors.quoteAmount = "Amount must be greater than 0";
        hasError = true;
      } else if (cryptoAmount < MIN_CRYPTO_AMOUNT) {
        newErrors.quoteAmount = `Minimum amount is ${MIN_CRYPTO_AMOUNT}`;
        hasError = true;
      } else if (cryptoAmount > 999999999) {
        newErrors.quoteAmount = "Amount exceeds maximum allowed value";
        hasError = true;
      } else if (cryptoAmount > selectedRowData?.remainingVolume) {
        newErrors.quoteAmount = `Max available: ${selectedRowData?.remainingVolume} ${selectedRowData?.qouteCurrency}`;
        hasError = true;
      }

      // Check if user has sufficient crypto balance
      const availableBalance = cryptoBalances[selectedRowData?.qouteCurrency] || 0;
      if (!hasError && cryptoAmount > availableBalance) {
        newErrors.quoteAmount = `Insufficient balance. Available: ${availableBalance.toFixed(4)} ${selectedRowData?.qouteCurrency}`;
        hasError = true;
      }

      // Validate fiat amount against limits
      const calculatedFiat = cryptoAmount * selectedRowData?.fixedPrice;
      if (!hasError && (calculatedFiat < selectedRowData?.minLimit || calculatedFiat > selectedRowData?.maxLimit)) {
        newErrors.fiatAmount = `Amount must be between ${selectedRowData?.minLimit} - ${selectedRowData?.maxLimit} ${selectedRowData?.fiatCurrency}`;
        hasError = true;
      }

      // Validate paymentId - required, must be valid ObjectId
      if (!selectedPaymentMethodId) {
        newErrors.paymentMethod = "Please select your payment method";
        hasError = true;
      } else if (!objectIdRegex.test(selectedPaymentMethodId)) {
        newErrors.paymentMethod = "Invalid payment method selected";
        hasError = true;
      }

      // Set errors and return if validation failed
      setErrors(newErrors);
      if (hasError) {
        return;
      }

      LoaderHelper.loaderStatus(true);

      // Round crypto amount to 4 decimal places
      const payload = {
        adId: selectedRowData._id,
        amount: parseFloat(cryptoAmount.toFixed(4)),
        paymentId: selectedPaymentMethodId
      };

      const response = await AuthService.sellFromAd(payload);

      if (response?.success) {
        alertSuccessMessage(response?.message || "Sell order created successfully.");
        setSelectedRow(null);
        setSelectedRowData({});
        setFiatAmount("");
        setQuoteAmount("");
        setBuyerSelectedPaymentMethod("");
        setSelectedPaymentMethodId("");
        setErrors({ fiatAmount: "", quoteAmount: "", paymentMethod: "" });
        getBuyOrders(1);
        navigate(`/p2p-order-details/${response?.data?.orderId}`);
      } else {
        alertErrorMessage(response?.message || "Unable to create sell order. Try again.");
      }

    } catch (error) {
      console.error("Sell Submit Error:", error);
      alertErrorMessage(error?.response?.data?.message || "Something went wrong while creating the sell order.");
    } finally {
      LoaderHelper.loaderStatus(false);
    }
  };

  useEffect(() => {
    if (!loadingFilters) {
      if (selectedPaymentTab === "Buy") getSellOrders(1);
      if (selectedPaymentTab === "Sell") getBuyOrders(1);
    }
  }, [selectedPaymentTab]);

  // Get current orders (server-side pagination - no slicing needed)
  const currentItems = selectedPaymentTab === "Buy" ? buyOrderList : sellOrderList;

  // Handle pagination with API call
  const paginate = (pageNumber) => {
    if (pageNumber < 1 || pageNumber > totalPages || pageNumber === currentPage) return;
    if (selectedPaymentTab === "Buy") {
      getSellOrders(pageNumber);
    } else {
      getBuyOrders(pageNumber);
    }
  };

  const getInitial = (name) => {
    return name ? name.charAt(0).toUpperCase() : 'U';
  };

  return (
    <P2pLayout title="Dashboard">
      <div className="p2p-dashboard-container">
        {/* Buy/Sell Toggle */}
        <div className="p2p-buy-sell-toggle">
          <div className="p2p-toggle-wrapper">
            <button
              className={`p2p-toggle-btn ${selectedPaymentTab === "Buy" ? "p2p-active-buy" : ""}`}
              onClick={() => setSelectedPaymentTab("Buy")}
              disabled={loadingOrders}
            >
              BUY
            </button>
            <button
              className={`p2p-toggle-btn ${selectedPaymentTab === "Sell" ? "p2p-active-sell" : ""}`}
              onClick={() => setSelectedPaymentTab("Sell")}
              disabled={loadingOrders}
            >
              SELL
            </button>
          </div>
        </div>

        {/* Mobile Filter Toggle */}
        <div className="p2p-mobile-filter-header">
          <button
            className={`p2p-mobile-filter-toggle ${showMobileFilters ? 'active' : ''}`}
            onClick={() => setShowMobileFilters(!showMobileFilters)}
          >
            <i className="ri-filter-3-line"></i>
            <span>Filters</span>
            <i className={`ri-arrow-${showMobileFilters ? 'up' : 'down'}-s-line`}></i>
          </button>
          <div className="p2p-mobile-active-filters">
            <span className="p2p-active-filter-tag">{selectedCurrency}</span>
            <span className="p2p-active-filter-tag">{selectedFiat}</span>
          </div>
        </div>

        {/* Filter Section */}
        <div className={`p2p-filter-section ${showMobileFilters ? 'show' : ''}`}>
          <div className="p2p-filter-group">
            <span className="p2p-filter-label">Fiat</span>
            <select
              className="p2p-filter-select"
              value={selectedFiat}
              onChange={(e) => setSelectedFiat(e.target.value)}
            >
              {fiatList.map((fiat) => (
                <option key={fiat._id} value={fiat.short_name}>
                  {fiat.short_name}
                </option>
              ))}
            </select>
          </div>

          <div className="p2p-filter-group">
            <span className="p2p-filter-label">Token</span>
            <select
              className="p2p-filter-select"
              value={selectedCurrency}
              onChange={(e) => setSelectedCurrency(e.target.value)}
            >
              {cryptoList.map((crypto) => (
                <option key={crypto._id} value={crypto.short_name}>
                  {crypto.short_name}
                </option>
              ))}
            </select>
          </div>

          <div className="p2p-filter-group">
            <span className="p2p-filter-label">Payment Type</span>
            <select
              className="p2p-filter-select"
              value={selectedPaymentType}
              onChange={(e) => setSelectedPaymentType(e.target.value)}
            >
              {paymentMethods.map((method) => (
                <option key={method._id} value={method.name}>
                  {method.name}
                </option>
              ))}
            </select>
          </div>

          <button
            className="p2p-find-orders-btn"
            onClick={() => {
              selectedPaymentTab === "Buy" ? getSellOrders() : getBuyOrders();
              setShowMobileFilters(false);
            }}
          >
            Refresh <i className="ri-refresh-line"></i>
          </button>
        </div>

        {/* Desktop Table View */}
        <div className="p2p-orders-table-wrapper">
          <table className="p2p-orders-table">
            <thead>
              <tr>
                <th>Advertisers (Completion rate)</th>
                <th>Price</th>
                <th>Limit/Available</th>
                <th>Payment</th>
                <th>
                  Trade
                  <span className="p2p-trade-fee-badge">0 Fee</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {loadingOrders ? (
                <tr>
                  <td colSpan="5">
                    <div className="p2p-loading-container">
                      <div className="spinner-border text-primary" role="status" />
                      <p style={{ color: '#6b7280', marginTop: '12px', fontSize: '13px' }}></p>
                    </div>
                  </td>
                </tr>
              ) : currentItems.length === 0 ? (
                <tr>
                  <td colSpan="5">
                    <div className="p2p-empty-state-card">
                      <i className="ri-exchange-line" style={{ fontSize: '48px', color: '#6b7280' }}></i>
                      <p>No {selectedPaymentTab === "Buy" ? "buy" : "sell"} orders available</p>
                      <span style={{ color: '#6b7280', fontSize: '13px' }}>Try adjusting your filters</span>
                    </div>
                  </td>
                </tr>
              ) : currentItems.map((ad) => (
                <React.Fragment key={ad._id}>
                  <tr>
                    <td>
                      <div className="p2p-advertiser-cell">
                        <div className="p2p-advertiser-avatar">
                          {getInitial(ad.user?.userName)}
                        </div>
                        <div className="p2p-advertiser-info">
                          <h4>{ad.user?.userName}</h4>
                          <div className="p2p-advertiser-stats">
                            {ad.user?.totalTrades} orders | {ad.user?.completionPercentage}% completion
                          </div>
                          {/* <div className="p2p-advertiser-rating">
                            <span className="p2p-star-icon">★★★★★</span>
                            <span className="p2p-rating-value">{ad.user?.positiveFeedbackPercentage}</span>
                          </div> */}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="p2p-price-value">{ad.fixedPrice} {ad.fiatCurrency}</span>
                    </td>
                    <td>
                      <div className="p2p-limit-cell">
                        <div className="p2p-limit-row">
                          <span className="p2p-limit-label">Available</span>
                          <span className="p2p-limit-value">{toFixedFormat(ad.remainingVolume, 2)} {ad.qouteCurrency}</span>
                        </div>
                        <div className="p2p-limit-row">
                          <span className="p2p-limit-label">Limit</span>
                          <span className="p2p-limit-value">₹ {ad.minLimit?.toLocaleString()} - ₹ {ad.maxLimit?.toLocaleString()}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="p2p-payment-badges">
                        {ad.paymentMethodType?.map((method, idx) => (
                          <span key={idx} className="p2p-payment-badge">{method}</span>
                        ))}
                      </div>
                    </td>
                    <td className="p2p-trade-cell">
                      {(() => {
                        // Check KYC status
                        const isKycVerified = userKycStatus === 2;
                        // Check registration days condition
                        const hasRegistrationCondition = ad?.counterpartyCondition?.isRegisteredCond && ad?.counterpartyCondition?.registerDays > userRegistrationDays;

                        if (!isKycVerified) {
                          return (
                            <button
                              className="p2p-verification-btn"
                              onClick={() => navigate('/user_profile/kyc')}
                            >
                              <i className="ri-shield-check-line"></i>
                              Verification Required
                            </button>
                          );
                        }

                        if (hasRegistrationCondition) {
                          return (
                            <div className="p2p-trade-restricted">
                              {selectedPaymentTab === "Buy" ? (
                                <button className="p2p-buy-btn disabled" disabled>
                                  BUY {ad.qouteCurrency}
                                </button>
                              ) : (
                                <button className="p2p-sell-btn disabled" disabled>
                                  SELL {ad.qouteCurrency}
                                </button>
                              )}
                              <div className="p2p-condition-tooltip">
                                <i className="ri-question-line"></i>
                                <div className="p2p-tooltip-content">
                                  <span>Account must be registered for at least {ad?.counterpartyCondition?.registerDays} days</span>
                                  <span className="p2p-tooltip-sub">Your account: {userRegistrationDays} days</span>
                                </div>
                              </div>
                            </div>
                          );
                        }

                        return selectedPaymentTab === "Buy" ? (
                          <button className="p2p-buy-btn" onClick={() => toggleRow(ad._id, ad)}>
                            BUY {ad.qouteCurrency}
                          </button>
                        ) : (
                          <button className="p2p-sell-btn" onClick={() => toggleRow(ad._id, ad)}>
                            SELL {ad.qouteCurrency}
                          </button>
                        );
                      })()}
                    </td>
                  </tr>

                  {selectedRow === ad._id && (
                    <tr className="p2p-expanded-row">
                      <td colSpan="5">
                        <div className="p2p-expanded-content">
                          <div className="p2p-expanded-left">
                            <div className="p2p-expanded-user-info">
                              <div className="p2p-expanded-avatar">
                                {getInitial(ad.user?.userName)}
                              </div>
                              <div className="p2p-expanded-user-details">
                                <h5>{ad.user?.userName}</h5>
                                <p>{ad.user?.totalTrades} Orders | {ad.user?.completionPercentage}% completion</p>
                              </div>
                            </div>

                            <div className="p2p-expanded-stats">
                              <div className="p2p-stat-item">
                                <span className="p2p-stat-value">{ad.fixedPrice} {ad.fiatCurrency}</span>
                                <span className="p2p-stat-label">Price</span>
                              </div>
                              <div className="p2p-stat-item">
                                <span className="p2p-stat-value">{ad.paymentTimeLimit} Minutes</span>
                                <span className="p2p-stat-label">Payment Time Limit</span>
                              </div>
                              <div className="p2p-stat-item">
                                <span className="p2p-stat-value">{toFixedFormat(ad.remainingVolume, 3)} {ad.qouteCurrency}</span>
                                <span className="p2p-stat-label">Available</span>
                              </div>
                            </div>

                            <div className="p2p-expanded-payments">
                              <h6>Payment method</h6>
                              <div className="p2p-expanded-payment-badges">
                                {ad.paymentMethodType?.map((method, idx) => (
                                  <span key={idx} className="p2p-expanded-payment-badge">{method}</span>
                                ))}
                              </div>
                            </div>

                            <div className="p2p-expanded-remarks">
                              <h6>Merchant Remarks</h6>
                              <p>{ad.remarks || "No remarks available"}</p>
                            </div>
                          </div>

                          <div className="p2p-expanded-right">
                            {/* Buy Tab: Pay Fiat, Receive Crypto | Sell Tab: Pay Crypto, Receive Fiat */}
                            {selectedPaymentTab === "Buy" ? (
                              <>
                                {/* You Pay - Fiat */}
                                <div className={`p2p-expanded-form-group ${errors.fiatAmount ? 'has-error' : ''}`}>
                                  <div className="p2p-input-header">
                                    <label>You Pay:</label>
                                    <span className="p2p-input-range">{ad.minLimit} - {ad.maxLimit} {ad.fiatCurrency}</span>
                                  </div>
                                  <div className="p2p-expanded-input-wrapper">
                                    <input
                                      type="number"
                                      placeholder="0"
                                      value={fiatAmount}
                                      onChange={(e) => {
                                        amountInput(e.target.value, "fiat", ad.fixedPrice);
                                        if (errors.fiatAmount) setErrors(prev => ({ ...prev, fiatAmount: "" }));
                                      }}
                                      onWheel={(e) => e.target.blur()}
                                    />
                                    <span className="p2p-input-currency">{ad.fiatCurrency}</span>
                                  </div>
                                  {errors.fiatAmount && (
                                    <div className="p2p-expanded-input-error">{errors.fiatAmount}</div>
                                  )}
                                </div>

                                {/* You Receive - Crypto */}
                                <div className={`p2p-expanded-form-group ${errors.quoteAmount ? 'has-error' : ''}`}>
                                  <div className="p2p-input-header">
                                    <label>You Receive:</label>
                                  </div>
                                  <div className="p2p-expanded-input-wrapper">
                                    <input
                                      type="number"
                                      placeholder="0"
                                      value={quoteAmount}
                                      onChange={(e) => {
                                        amountInput(e.target.value, "quote", ad.fixedPrice);
                                        if (errors.quoteAmount) setErrors(prev => ({ ...prev, quoteAmount: "" }));
                                      }}
                                      onWheel={(e) => e.target.blur()}
                                    />
                                    <span className="p2p-input-currency">{ad.qouteCurrency}</span>
                                  </div>
                                  {errors.quoteAmount && (
                                    <div className="p2p-expanded-input-error">{errors.quoteAmount}</div>
                                  )}
                                </div>
                              </>
                            ) : (
                              <>
                                {/* You Pay - Crypto */}
                                <div className={`p2p-expanded-form-group ${errors.quoteAmount ? 'has-error' : ''}`}>
                                  <div className="p2p-input-header">
                                    <label>You Pay:</label>
                                    <span className="p2p-input-range">Ad volume: {toFixedFormat(ad.remainingVolume, 4)} {ad.qouteCurrency}</span>
                                  </div>
                                  <div className="p2p-expanded-input-wrapper">
                                    <input
                                      type="number"
                                      placeholder="0"
                                      value={quoteAmount}
                                      onChange={(e) => {
                                        amountInput(e.target.value, "quote", ad.fixedPrice);
                                        if (errors.quoteAmount) setErrors(prev => ({ ...prev, quoteAmount: "" }));
                                      }}
                                      onWheel={(e) => e.target.blur()}
                                    />
                                    <span className="p2p-input-currency">{ad.qouteCurrency}</span>
                                  </div>
                                  {errors.quoteAmount && (
                                    <div className="p2p-expanded-input-error">{errors.quoteAmount}</div>
                                  )}
                                  <span className="p2p-available-balance">
                                    Available: {(cryptoBalances[ad.qouteCurrency] || 0).toFixed(4)} {ad.qouteCurrency}
                                  </span>
                                  {Number(quoteAmount) > 0 && (() => {
                                    const vol = Number(quoteAmount);
                                    const p2pFee = cryptoList.find(c => (c.short_name || '') === (ad.qouteCurrency || ''))?.p2p_fee ?? 0;
                                    const feeAmount = (vol * p2pFee) / 100;
                                    const totalRequired = vol + feeAmount;
                                    const available = cryptoBalances[ad.qouteCurrency] || 0;
                                    const insufficient = totalRequired > available;
                                    const shortfall = insufficient ? (totalRequired - available).toFixed(2) : 0;
                                    return (
                                      <div className="p2p-create-post-fee-breakdown-box">
                                        <div className="p2p-create-post-fee-breakdown-row">
                                          <span>Volume</span>
                                          <span>{vol.toFixed(2)} {ad.qouteCurrency}</span>
                                        </div>
                                        <div className="p2p-create-post-fee-breakdown-row">
                                          <span>Fee ({p2pFee}%)</span>
                                          <span>{feeAmount.toFixed(2)} {ad.qouteCurrency}</span>
                                        </div>
                                        <div className="p2p-create-post-fee-breakdown-row p2p-create-post-fee-breakdown-total">
                                          <span>Total required</span>
                                          <span>{totalRequired.toFixed(2)} {ad.qouteCurrency}</span>
                                        </div>
                                        {insufficient && (
                                          <div className="p2p-create-post-insufficient-funds">Insufficient balance. Add {shortfall} {ad.qouteCurrency} (fee) to place this order.</div>
                                        )}
                                      </div>
                                    );
                                  })()}
                                </div>

                                {/* You Receive - Fiat */}
                                <div className={`p2p-expanded-form-group ${errors.fiatAmount ? 'has-error' : ''}`}>
                                  <div className="p2p-input-header">
                                    <label>You Receive:</label>
                                    <span className="p2p-input-range">{ad.minLimit} - {ad.maxLimit} {ad.fiatCurrency}</span>
                                  </div>
                                  <div className="p2p-expanded-input-wrapper">
                                    <input
                                      type="number"
                                      placeholder="0"
                                      value={fiatAmount}
                                      onChange={(e) => {
                                        amountInput(e.target.value, "fiat", ad.fixedPrice);
                                        if (errors.fiatAmount) setErrors(prev => ({ ...prev, fiatAmount: "" }));
                                      }}
                                      onWheel={(e) => e.target.blur()}
                                    />
                                    <span className="p2p-input-currency">{ad.fiatCurrency}</span>
                                  </div>
                                  {errors.fiatAmount && (
                                    <div className="p2p-expanded-input-error">{errors.fiatAmount}</div>
                                  )}
                                </div>
                              </>
                            )}

                            <div className={`p2p-expanded-form-group ${errors.paymentMethod ? 'has-error' : ''}`}>
                              <div className="p2p-input-header">
                                <label>Payment Method</label>
                                <div className="p2p-price-info">
                                  <span>Price {ad.fixedPrice} {ad.fiatCurrency}</span>
                                </div>
                              </div>
                              <button
                                className="p2p-payment-selector-full"
                                data-bs-toggle="modal"
                                data-bs-target="#p2pPaymentModal"
                                onClick={() => {
                                  if (errors.paymentMethod) setErrors(prev => ({ ...prev, paymentMethod: "" }));
                                }}
                              >
                                <div className="p2p-payment-selector-left">
                                  <span className="p2p-payment-indicator"></span>
                                  {buyerSelectedPaymentMethod || "Select Payment Method"}
                                </div>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <polyline points="9,18 15,12 9,6" />
                                </svg>
                              </button>
                              {errors.paymentMethod && (
                                <div className="p2p-expanded-input-error">
                                  {errors.paymentMethod}
                                </div>
                              )}
                            </div>

                            <div className="p2p-expanded-form-actions">
                              {selectedPaymentTab === "Buy" ? (
                                <button
                                  className="p2p-confirm-buy-btn"
                                  onClick={handleBuyOrder}
                                >
                                  Buy {ad.qouteCurrency}
                                </button>
                              ) : (
                                <button
                                  className="p2p-confirm-sell-btn"
                                  onClick={handleSellOrder}
                                  disabled={
                                    userKycStatus !== 2 ||
                                    (ad?.counterpartyCondition?.isRegisteredCond && 
                                     ad?.counterpartyCondition?.registerDays > userRegistrationDays) ||
                                    (quoteAmount && parseFloat(quoteAmount) > (cryptoBalances[ad.qouteCurrency] || 0))
                                  }
                                >
                                  Sell {ad.qouteCurrency}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p2p-pagination-wrapper">
              <div className="p2p-pagination-info">
                Showing {currentItems.length} of {totalCount} results
              </div>
              <div className="p2p-pagination-controls">
                <button
                  className="p2p-page-btn"
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1 || loadingOrders}
                >
                  &lt;
                </button>

                {/* First page */}
                {currentPage > 2 && (
                  <>
                    <button
                      className="p2p-page-btn"
                      onClick={() => paginate(1)}
                      disabled={loadingOrders}
                    >
                      1
                    </button>
                    {currentPage > 3 && <span className="p2p-page-dots">...</span>}
                  </>
                )}

                {/* Page numbers around current page */}
                {[...Array(totalPages)].map((_, idx) => {
                  const pageNum = idx + 1;
                  // Show current page and one page before/after
                  if (pageNum >= currentPage - 1 && pageNum <= currentPage + 1) {
                    return (
                      <button
                        key={pageNum}
                        className={`p2p-page-btn ${currentPage === pageNum ? 'p2p-active' : ''}`}
                        onClick={() => paginate(pageNum)}
                        disabled={loadingOrders}
                      >
                        {pageNum}
                      </button>
                    );
                  }
                  return null;
                })}

                {/* Last page */}
                {currentPage < totalPages - 1 && (
                  <>
                    {currentPage < totalPages - 2 && <span className="p2p-page-dots">...</span>}
                    <button
                      className={`p2p-page-btn ${currentPage === totalPages ? 'p2p-active' : ''}`}
                      onClick={() => paginate(totalPages)}
                      disabled={loadingOrders}
                    >
                      {totalPages}
                    </button>
                  </>
                )}

                <button
                  className="p2p-page-btn"
                  onClick={() => paginate(currentPage + 1)}
                  disabled={currentPage === totalPages || loadingOrders}
                >
                  &gt;
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Mobile Card View */}
        <div className="p2p-mobile-orders-list">
          {loadingOrders ? (
            <div className="p2p-loading-container">
              <div className="spinner-border text-primary" role="status" />
              <p style={{ color: '#6b7280', marginTop: '12px', fontSize: '13px' }}></p>
            </div>
          ) : currentItems.length === 0 ? (
            <div className="p2p-empty-state-card">
              <i className="ri-exchange-line" style={{ fontSize: '48px', color: '#6b7280' }}></i>
              <p>No {selectedPaymentTab === "Buy" ? "sell" : "buy"} orders available</p>
              <span style={{ color: '#6b7280', fontSize: '13px' }}>Try adjusting your filters</span>
            </div>
          ) : currentItems.map((ad) => (
            <div key={ad._id} className="p2p-mobile-order-card">
              <div className="p2p-mobile-card-header">
                <div className="p2p-mobile-card-user">
                  <div className="p2p-mobile-card-avatar">
                    {getInitial(ad.user?.userName)}
                  </div>
                  <div className="p2p-mobile-card-user-info">
                    <h4>{ad.user?.userName}</h4>
                    <p>{ad.user?.totalTrades} orders | {ad.user?.completionPercentage}% completion</p>
                    {/* <div className="p2p-rating">
                      <span>★★★★★</span>
                      <span>{ad.user?.positiveFeedbackPercentage}</span>
                    </div> */}
                  </div>
                </div>
                <div className="p2p-mobile-card-price">
                  <div className="p2p-value">{ad.fixedPrice}</div>
                  <div className="p2p-currency">{ad.fiatCurrency}</div>
                </div>
              </div>

              <div className="p2p-mobile-card-details">
                <div className="p2p-mobile-detail-item">
                  <span className="p2p-mobile-detail-label">Available</span>
                  <span className="p2p-mobile-detail-value">{toFixedFormat(ad.remainingVolume, 2)} {ad.qouteCurrency}</span>
                </div>
                <div className="p2p-mobile-detail-item">
                  <span className="p2p-mobile-detail-label">Limit</span>
                  <span className="p2p-mobile-detail-value">₹ {ad.minLimit?.toLocaleString()} - ₹ {ad.maxLimit?.toLocaleString()}</span>
                </div>
                <div className="p2p-mobile-detail-item">
                  <span className="p2p-mobile-detail-label">Payment</span>
                  <span className="p2p-mobile-detail-value">
                        {ad.paymentMethodType?.map((method, idx) => (
                  <span key={idx} className="p2p-mobile-payment-badge">{method}</span>
                ))}
                  </span>
                </div>
              </div>

              {/* <div className="p2p-mobile-card-payments">
            
              </div> */}

              <div className="p2p-mobile-card-action">
                {(() => {
                  const isKycVerified = userKycStatus === 2;
                  const hasRegistrationCondition = ad?.counterpartyCondition?.isRegisteredCond && ad?.counterpartyCondition?.registerDays > userRegistrationDays;

                  if (!isKycVerified) {
                    return (
                      <button
                        className="p2p-mobile-verification-btn"
                        onClick={() => navigate('/user_profile/kyc')}
                      >
                        <i className="ri-shield-check-line"></i>
                        Verification Required
                      </button>
                    );
                  }

                  if (hasRegistrationCondition) {
                    return (
                      <div className="p2p-mobile-trade-restricted">
                        {selectedPaymentTab === "Buy" ? (
                          <button className="p2p-mobile-buy-btn disabled" disabled>
                            BUY {ad.qouteCurrency}
                          </button>
                        ) : (
                          <button className="p2p-mobile-sell-btn disabled" disabled>
                            SELL {ad.qouteCurrency}
                          </button>
                        )}
                        <div className="p2p-mobile-condition-info">
                          <i className="ri-question-line"></i>
                          <span>Account must be {ad?.counterpartyCondition?.registerDays}+ days old (yours: {userRegistrationDays})</span>
                        </div>
                      </div>
                    );
                  }

                  return selectedPaymentTab === "Buy" ? (
                    <button className="p2p-mobile-buy-btn" onClick={(e) => { e.stopPropagation(); toggleRow(ad._id, ad); }}>
                      BUY {ad.qouteCurrency}
                    </button>
                  ) : (
                    <button className="p2p-mobile-sell-btn" onClick={(e) => { e.stopPropagation(); toggleRow(ad._id, ad); }}>
                      SELL {ad.qouteCurrency}
                    </button>
                  );
                })()}
              </div>

              {selectedRow === ad._id && (
                <div className="p2p-mobile-expanded-section">
                  <div className="p2p-expanded-right">
                    {/* Buy Tab: Pay Fiat, Receive Crypto | Sell Tab: Pay Crypto, Receive Fiat */}
                    {selectedPaymentTab === "Buy" ? (
                      <>
                        {/* You Pay - Fiat */}
                        <div className={`p2p-expanded-form-group ${errors.fiatAmount ? 'has-error' : ''}`}>
                          <div className="p2p-input-header">
                            <label>You Pay:</label>
                            <span className="p2p-input-range">{ad.minLimit} - {ad.maxLimit} {ad.fiatCurrency}</span>
                          </div>
                          <div className="p2p-expanded-input-wrapper">
                            <input
                              type="number"
                              placeholder="0"
                              value={fiatAmount}
                              onChange={(e) => {
                                amountInput(e.target.value, "fiat", ad.fixedPrice);
                                if (errors.fiatAmount) setErrors(prev => ({ ...prev, fiatAmount: "" }));
                              }}
                              onWheel={(e) => e.target.blur()}
                            />
                            <span className="p2p-input-currency">{ad.fiatCurrency}</span>
                          </div>
                          {errors.fiatAmount && (
                            <div className="p2p-expanded-input-error">{errors.fiatAmount}</div>
                          )}
                        </div>

                        {/* You Receive - Crypto */}
                        <div className={`p2p-expanded-form-group ${errors.quoteAmount ? 'has-error' : ''}`}>
                          <div className="p2p-input-header">
                            <label>You Receive:</label>
                          </div>
                          <div className="p2p-expanded-input-wrapper">
                            <input
                              type="number"
                              placeholder="0"
                              value={quoteAmount}
                              onChange={(e) => {
                                amountInput(e.target.value, "quote", ad.fixedPrice);
                                if (errors.quoteAmount) setErrors(prev => ({ ...prev, quoteAmount: "" }));
                              }}
                              onWheel={(e) => e.target.blur()}
                            />
                            <span className="p2p-input-currency">{ad.qouteCurrency}</span>
                          </div>
                          {errors.quoteAmount && (
                            <div className="p2p-expanded-input-error">{errors.quoteAmount}</div>
                          )}
                        </div>
                      </>
                    ) : (
                      <>
                        {/* You Pay - Crypto */}
                        <div className={`p2p-expanded-form-group ${errors.quoteAmount ? 'has-error' : ''}`}>
                          <div className="p2p-input-header">
                            <label>You Pay:</label>
                            <span className="p2p-input-range">Ad volume: {toFixedFormat(ad.remainingVolume, 4)} {ad.qouteCurrency}</span>
                          </div>
                          <div className="p2p-expanded-input-wrapper">
                            <input
                              type="number"
                              placeholder="0"
                              value={quoteAmount}
                              onChange={(e) => {
                                amountInput(e.target.value, "quote", ad.fixedPrice);
                                if (errors.quoteAmount) setErrors(prev => ({ ...prev, quoteAmount: "" }));
                              }}
                              onWheel={(e) => e.target.blur()}
                            />
                            <span className="p2p-input-currency">{ad.qouteCurrency}</span>
                          </div>
                          {errors.quoteAmount && (
                            <div className="p2p-expanded-input-error">{errors.quoteAmount}</div>
                          )}
                          <span className="p2p-available-balance">
                            Available: {(cryptoBalances[ad.qouteCurrency] || 0).toFixed(4)} {ad.qouteCurrency}
                          </span>
                          {Number(quoteAmount) > 0 && (() => {
                            const vol = Number(quoteAmount);
                            const p2pFee = cryptoList.find(c => (c.short_name || '') === (ad.qouteCurrency || ''))?.p2p_fee ?? 0;
                            const feeAmount = (vol * p2pFee) / 100;
                            const totalRequired = vol + feeAmount;
                            const available = cryptoBalances[ad.qouteCurrency] || 0;
                            const insufficient = totalRequired > available;
                            const shortfall = insufficient ? (totalRequired - available).toFixed(2) : 0;
                            return (
                              <div className="p2p-create-post-fee-breakdown-box">
                                <div className="p2p-create-post-fee-breakdown-row">
                                  <span>Volume</span>
                                  <span>{vol.toFixed(2)} {ad.qouteCurrency}</span>
                                </div>
                                <div className="p2p-create-post-fee-breakdown-row">
                                  <span>Fee ({p2pFee}%)</span>
                                  <span>{feeAmount.toFixed(2)} {ad.qouteCurrency}</span>
                                </div>
                                <div className="p2p-create-post-fee-breakdown-row p2p-create-post-fee-breakdown-total">
                                  <span>Total required</span>
                                  <span>{totalRequired.toFixed(2)} {ad.qouteCurrency}</span>
                                </div>
                                {insufficient && (
                                  <div className="p2p-create-post-insufficient-funds">Insufficient balance. Add {shortfall} {ad.qouteCurrency} (fee) to place this order.</div>
                                )}
                              </div>
                            );
                          })()}
                        </div>

                        {/* You Receive - Fiat */}
                        <div className={`p2p-expanded-form-group ${errors.fiatAmount ? 'has-error' : ''}`}>
                          <div className="p2p-input-header">
                            <label>You Receive:</label>
                            <span className="p2p-input-range">{ad.minLimit} - {ad.maxLimit} {ad.fiatCurrency}</span>
                          </div>
                          <div className="p2p-expanded-input-wrapper">
                            <input
                              type="number"
                              placeholder="0"
                              value={fiatAmount}
                              onChange={(e) => {
                                amountInput(e.target.value, "fiat", ad.fixedPrice);
                                if (errors.fiatAmount) setErrors(prev => ({ ...prev, fiatAmount: "" }));
                              }}
                              onWheel={(e) => e.target.blur()}
                            />
                            <span className="p2p-input-currency">{ad.fiatCurrency}</span>
                          </div>
                          {errors.fiatAmount && (
                            <div className="p2p-expanded-input-error">{errors.fiatAmount}</div>
                          )}
                        </div>
                      </>
                    )}

                    <div className={`p2p-expanded-form-group ${errors.paymentMethod ? 'has-error' : ''}`}>
                      {/* <div className="p2p-input-header" style={{ borderRadius: '10px', border: '1px solid #2a2a3a' }}>
                        <label>Payment Method</label>
                        <div className="p2p-price-info">
                          <span>Price {ad.fixedPrice} {ad.fiatCurrency}</span>
                        </div>
                      </div> */}
                      <button
                        className="p2p-payment-selector-full"
                        data-bs-toggle="modal"
                        data-bs-target="#p2pPaymentModal"
                        onClick={() => {
                          if (errors.paymentMethod) setErrors(prev => ({ ...prev, paymentMethod: "" }));
                        }}
                      >
                        <div className="p2p-payment-selector-left">
                          <span className="p2p-payment-indicator"></span>
                          {buyerSelectedPaymentMethod || "Select Payment Method"}
                        </div>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="9,18 15,12 9,6" />
                        </svg>
                      </button>
                      {errors.paymentMethod && (
                        <div className="p2p-expanded-input-error">{errors.paymentMethod}</div>
                      )}
                    </div>

                    <div className="p2p-expanded-form-actions">
                      <button className="p2p-cancel-btn" onClick={() => toggleRow(ad._id, ad)}>
                        Cancel
                      </button>
                      {selectedPaymentTab === "Buy" ? (
                        <button className="p2p-confirm-buy-btn" onClick={handleBuyOrder}>
                          Buy {ad.qouteCurrency}
                        </button>
                      ) : (
                        <button 
                          className="p2p-confirm-sell-btn" 
                          onClick={handleSellOrder}
                          disabled={
                            userKycStatus !== 2 ||
                            (ad?.counterpartyCondition?.isRegisteredCond && 
                             ad?.counterpartyCondition?.registerDays > userRegistrationDays) ||
                            (quoteAmount && parseFloat(quoteAmount) > (cryptoBalances[ad.qouteCurrency] || 0))
                          }
                        >
                          Sell {ad.qouteCurrency}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Mobile Pagination */}
          {totalPages > 1 && (
            <div className="p2p-pagination-wrapper p2p-mobile">
              <div className="p2p-pagination-info">
                Page {currentPage} of {totalPages}
              </div>
              <div className="p2p-pagination-controls">
                <button
                  className="p2p-page-btn"
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1 || loadingOrders}
                >
                  &lt;
                </button>

                <span className="p2p-page-current">{currentPage}</span>

                <button
                  className="p2p-page-btn"
                  onClick={() => paginate(currentPage + 1)}
                  disabled={currentPage === totalPages || loadingOrders}
                >
                  &gt;
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Payment Method Modal */}
      <div className="modal selectpaymetpop fade" id="p2pPaymentModal" tabIndex="-1">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content p2p-modal-content">
            <div className="modal-header p2p-modal-header">
              <h5 className="p2p-modal-title">
                {selectedPaymentTab === "Buy" ? "Select Payment Method" : "Select Your Payment Method"}
              </h5>
              <button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal"></button>
            </div>
            <div className="modal-body p2p-modal-body">
              <div className="p2p-modal-options">
                {selectedPaymentTab === "Buy" ? (
                  // For BUY orders: Show seller's accepted payment methods
                  paymentMethods?.filter(pm => pm.name !== "All payments").map((pm) => (
                    selectedRowData?.paymentMethodType?.includes(pm?.name) && (
                      <label
                        key={pm?.name}
                        className={`p2p-payment-option ${buyerSelectedPaymentMethod === pm?.name ? 'p2p-selected' : ''}`}
                      >
                        <span>{pm?.name}</span>
                        <input
                          data-bs-dismiss="modal"
                          type="checkbox"
                          checked={buyerSelectedPaymentMethod === pm?.name}
                          onChange={() => {
                            setBuyerSelectedPaymentMethod(buyerSelectedPaymentMethod === pm?.name ? "" : pm?.name);
                            setSelectedPaymentMethodId("");
                          }}
                        />
                      </label>
                    )
                  ))
                ) : (
                  // For SELL orders: Show user's payment methods that match ad's accepted types
                  getMatchingUserPaymentMethods().length > 0 ? (
                    getMatchingUserPaymentMethods().map((userPm) => (
                      <label
                        key={userPm._id}
                        className={`p2p-payment-option-full ${selectedPaymentMethodId === userPm._id ? 'p2p-selected' : ''}`}
                      >
                        <div className="p2p-user-payment-card">
                          <div className="p2p-user-payment-header">
                            <span className="p2p-payment-name">{userPm.name}</span>
                            <input
                              data-bs-dismiss="modal"
                              type="checkbox"
                              checked={selectedPaymentMethodId === userPm._id}
                              onChange={() => {
                                if (selectedPaymentMethodId === userPm._id) {
                                  setSelectedPaymentMethodId("");
                                  setBuyerSelectedPaymentMethod("");
                                } else {
                                  setSelectedPaymentMethodId(userPm._id);
                                  setBuyerSelectedPaymentMethod(userPm.name);
                                }
                              }}
                            />
                          </div>
                          <div className="p2p-user-payment-details">
                            {getPaymentDisplayFields(userPm).map(([key, value]) => (
                              <div key={key} className="p2p-payment-field">
                                <span className="p2p-payment-field-label">{formatLabel(key)}</span>
                                <span className="p2p-payment-field-value">{value}</span>
                              </div>
                            ))}
                          </div>
                          {userPm.qrCode && (
                            <div className="p2p-payment-qr-preview">
                              <img
                                src={`${ApiConfig.baseImage}${userPm.qrCode}`}
                                alt="QR Code"
                                onError={(e) => e.target.style.display = 'none'}
                              />
                            </div>
                          )}
                        </div>
                      </label>
                    ))
                  ) : (
                    <div className="p2p-no-payment-methods">
                      <i className="ri-bank-card-line"></i>
                      <p>No matching payment methods found</p>
                      <span>The buyer accepts: {selectedRowData?.paymentMethodType?.join(", ")}</span>
                      <button
                        className="p2p-add-payment-btn"
                        data-bs-dismiss="modal"
                        onClick={() => navigate('/p2p-profile')}
                      >
                        Add Payment Method
                      </button>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </P2pLayout>
  );
};

export default P2pDashboard;
