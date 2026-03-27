import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import AuthService from "../../../api/services/AuthService";
import { alertErrorMessage, alertSuccessMessage } from "../../../customComponents/CustomAlertMessage";
import LoaderHelper from "../../../customComponents/Loading/LoaderHelper";
import { ApiConfig } from "../../../api/apiConfig/apiConfig";
import { $ } from "react-jquery-plugin";
import BigNumber from "bignumber.js";
import moment from "moment";
import { Link, useNavigate } from "react-router-dom";

// Configure BigNumber for precision
BigNumber.config({
  DECIMAL_PLACES: 9,
  ROUNDING_MODE: BigNumber.ROUND_DOWN,
  EXPONENTIAL_AT: [-15, 20]
});

const Swap = () => {
  const navigate = useNavigate();
  const conversionRateRef = useRef(null);
  const isMountedRef = useRef(true);

  // State management
  const [currencyList, setCurrencyList] = useState([]);
  const [conversionRate, setConversionRate] = useState(0);
  const [transactionHistory, setTransactionHistory] = useState([]);
  const [fromCurrency, setFromCurrency] = useState(null);
  const [receiveCurrency, setReceiveCurrency] = useState(null);
  const [fromSearch, setFromSearch] = useState("");
  const [receiveSearch, setReceiveSearch] = useState("");
  const [fromCurrencyAmount, setFromCurrencyAmount] = useState("");
  const [receiveCurrencyAmount, setReceiveCurrencyAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSwapping, setIsSwapping] = useState(false);
  const [modalType, setModalType] = useState("from"); // 'from' or 'to'
  const [historySearch, setHistorySearch] = useState("");
  const [kycStatus, setKycStatus] = useState(null); // null = loading, 0 = not submitted, 1 = pending, 2 = verified, 3 = rejected, 4 = partial rejection

  // Check if user is logged in
  const isLoggedIn = useMemo(() => {
    return !!localStorage.getItem("token");
  }, []);

  // Check if KYC is verified
  const isKycVerified = useMemo(() => {
    return kycStatus === 2 || kycStatus === "2";
  }, [kycStatus]);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (conversionRateRef.current) {
        clearTimeout(conversionRateRef.current);
      }
    };
  }, []);

  // Format number with specified decimal places
  const formatNumber = useCallback((value, decimals = 8) => {
    if (value === null || value === undefined || value === "") return "";
    const num = new BigNumber(value);
    if (num.isNaN() || !num.isFinite()) return "0";
    return num.decimalPlaces(decimals, BigNumber.ROUND_DOWN).toFixed();
  }, []);

  // Safe number parsing
  const safeParseNumber = useCallback((value) => {
    if (value === null || value === undefined || value === "") return new BigNumber(0);
    const num = new BigNumber(value);
    return num.isNaN() || !num.isFinite() ? new BigNumber(0) : num;
  }, []);

  // Fetch KYC status
  const fetchKycStatus = useCallback(async () => {
    if (!isLoggedIn) return;
    
    try {
      const result = await AuthService.getKycStatus();
      if (!isMountedRef.current) return;
      
      if (result?.success) {
        // Map status string to number
        const statusMap = {
          'draft': 0,
          'submitted': 1,
          'under_review': 1,
          'approved': 2,
          'rejected': 3,
          'partial_reject': 4
        };
        const status = result?.data?.status || result?.status;
        setKycStatus(statusMap[status] ?? 0);
      }
    } catch (error) {
      console.error("Failed to fetch KYC status:", error);
    }
  }, [isLoggedIn]);

  // Fetch available currencies
  const getAvailableCurrency = useCallback(async (shouldResetSelection = true) => {
    if (!isLoggedIn) return;

    try {
      setIsLoading(true);
      LoaderHelper.loaderStatus(true);

      const result = await AuthService.baseCurrencyList();

      if (!isMountedRef.current) return;

      if (!result?.success) {
        alertErrorMessage(result?.message || "Failed to fetch currencies");
        return;
      }

      const currencies = result?.data || [];

      if (currencies.length === 0) {
        alertErrorMessage("No currencies available for swap");
        return;
      }

      // Sort currencies: non-zero balances first, then by balance descending
      const sortedCurrencies = [...currencies].sort((a, b) => {
        const balA = safeParseNumber(a.balance);
        const balB = safeParseNumber(b.balance);

        if (balA.isGreaterThan(0) && balB.isEqualTo(0)) return -1;
        if (balA.isEqualTo(0) && balB.isGreaterThan(0)) return 1;

        return balB.minus(balA).toNumber();
      });

      setCurrencyList(sortedCurrencies);

      // Set default selections only if needed
      if (shouldResetSelection && sortedCurrencies.length >= 2) {
        setFromCurrency(sortedCurrencies[0]);
        setReceiveCurrency(sortedCurrencies[1]);
      } else if (shouldResetSelection && sortedCurrencies.length === 1) {
        setFromCurrency(sortedCurrencies[0]);
        setReceiveCurrency(null);
      } else if (!shouldResetSelection) {
        // Update existing selections with fresh balance data
        if (fromCurrency?.currency_id) {
          const updatedFromCurrency = sortedCurrencies.find(
            (c) => c.currency_id === fromCurrency.currency_id
          );
          if (updatedFromCurrency) {
            setFromCurrency(updatedFromCurrency);
          }
        }
        if (receiveCurrency?.currency_id) {
          const updatedReceiveCurrency = sortedCurrencies.find(
            (c) => c.currency_id === receiveCurrency.currency_id
          );
          if (updatedReceiveCurrency) {
            setReceiveCurrency(updatedReceiveCurrency);
          }
        }
      }
    } catch (error) {
      console.error("Failed to fetch currency list:", error);
      if (isMountedRef.current) {
        alertErrorMessage("Failed to fetch currencies. Please try again.");
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
        LoaderHelper.loaderStatus(false);
      }
    }
  }, [isLoggedIn, safeParseNumber, fromCurrency?.currency_id, receiveCurrency?.currency_id]);

  // Fetch conversion rate
  const getConversionRate = useCallback(async () => {
    if (!fromCurrency?.short_name || !receiveCurrency?.short_name) {
      setConversionRate(0);
      return;
    }

    if (fromCurrency.short_name === receiveCurrency.short_name) {
      setConversionRate(1);
      return;
    }

    try {
      LoaderHelper.loaderStatus(true);

      const result = await AuthService.getConversionRate(
        fromCurrency.short_name,
        receiveCurrency.short_name
      );

      if (!isMountedRef.current) return;

      if (!result?.success) {
        setConversionRate(0);
        alertErrorMessage(result?.message || "Failed to get conversion rate");
        return;
      }

      const rate = safeParseNumber(result?.data?.rate);
      setConversionRate(rate.isGreaterThan(0) ? rate.toNumber() : 0);
    } catch (error) {
      console.error("Failed to fetch conversion rate:", error);
      if (isMountedRef.current) {
        setConversionRate(0);
        alertErrorMessage("Failed to fetch conversion rate");
      }
    } finally {
      if (isMountedRef.current) {
        LoaderHelper.loaderStatus(false);
      }
    }
  }, [fromCurrency?.short_name, receiveCurrency?.short_name, safeParseNumber]);

  // Fetch transaction history
  const getBuySellHistory = useCallback(async () => {
    if (!isLoggedIn) return;

    try {
      LoaderHelper.loaderStatus(true);

      const result = await AuthService.quickBuySellHistory(0, 10);

      if (!isMountedRef.current) return;

      if (result?.success && Array.isArray(result?.data)) {
        setTransactionHistory(result.data);
      } else {
        setTransactionHistory([]);
      }
    } catch (error) {
      console.error("Failed to fetch transaction history:", error);
    } finally {
      if (isMountedRef.current) {
        LoaderHelper.loaderStatus(false);
      }
    }
  }, [isLoggedIn]);

  // Select currency handler
  const selectCurrency = useCallback((currency, type) => {
    if (!currency) return;

    if (type === "from") {
      // Prevent selecting same currency
      if (receiveCurrency?.currency_id === currency.currency_id) {
        alertErrorMessage("Cannot select the same currency for both sides");
        return;
      }
      setFromCurrency(currency);
    } else {
      // Prevent selecting same currency
      if (fromCurrency?.currency_id === currency.currency_id) {
        alertErrorMessage("Cannot select the same currency for both sides");
        return;
      }
      setReceiveCurrency(currency);
    }

    // Close modal
    $("#search_coin").modal("hide");
  }, [fromCurrency?.currency_id, receiveCurrency?.currency_id]);

  // Interchange currencies
  const handleInterchangeWallet = useCallback(() => {
    if (!fromCurrency || !receiveCurrency) return;

    const tempFrom = fromCurrency;
    const tempTo = receiveCurrency;

    setFromCurrency(tempTo);
    setReceiveCurrency(tempFrom);

    // Clear amounts on interchange
    setFromCurrencyAmount("");
    setReceiveCurrencyAmount("");
  }, [fromCurrency, receiveCurrency]);

  // Handle max amount - available for future use with Max button
  // eslint-disable-next-line no-unused-vars
  const handleMaxAmount = useCallback((type) => {
    if (!conversionRate || conversionRate <= 0) {
      alertErrorMessage("Conversion rate not available");
      return;
    }

    const rate = new BigNumber(conversionRate);

    if (type === "from") {
      const balance = safeParseNumber(fromCurrency?.balance);
      const fee = safeParseNumber(fromCurrency?.swappingFee);
      const minAmount = safeParseNumber(fromCurrency?.minSwapping);
      const maxAmount = safeParseNumber(fromCurrency?.maxSwapping);

      // Calculate max usable amount (balance - fee)
      let maxUsable = BigNumber.maximum(balance.minus(fee), new BigNumber(0));

      // Apply max limit if set
      if (maxAmount.isGreaterThan(0)) {
        maxUsable = BigNumber.minimum(maxUsable, maxAmount);
      }

      // Ensure minimum is met
      if (maxUsable.isLessThan(minAmount)) {
        alertErrorMessage(`Insufficient balance. Minimum required: ${formatNumber(minAmount.plus(fee))} ${fromCurrency?.short_name}`);
        return;
      }

      const receiveAmount = maxUsable.multipliedBy(rate);

      setFromCurrencyAmount(formatNumber(maxUsable));
      setReceiveCurrencyAmount(formatNumber(receiveAmount));
    } else {
      const receiveBalance = safeParseNumber(receiveCurrency?.balance);
      const fromAmount = receiveBalance.dividedBy(rate);

      setReceiveCurrencyAmount(formatNumber(receiveBalance));
      setFromCurrencyAmount(formatNumber(fromAmount));
    }
  }, [conversionRate, fromCurrency, receiveCurrency, safeParseNumber, formatNumber]);

  // Handle input change
  const handleSwapInput = useCallback((e) => {
    const { name, value } = e.target;

    // Allow empty value
    if (value === "") {
      setFromCurrencyAmount("");
      setReceiveCurrencyAmount("");
      return;
    }

    // Validate input - allow numbers with decimals
    const sanitizedValue = value.replace(/[^0-9.]/g, "");

    // Prevent multiple decimal points
    const parts = sanitizedValue.split(".");
    const cleanValue = parts.length > 2
      ? parts[0] + "." + parts.slice(1).join("")
      : sanitizedValue;

    const inputAmount = safeParseNumber(cleanValue);

    if (inputAmount.isLessThan(0)) return;

    const rate = safeParseNumber(conversionRate);

    if (name === "fromSwap") {
      setFromCurrencyAmount(cleanValue);

      if (rate.isGreaterThan(0)) {
        const receiveAmount = inputAmount.multipliedBy(rate);
        setReceiveCurrencyAmount(formatNumber(receiveAmount));
      } else {
        setReceiveCurrencyAmount("");
      }
    } else if (name === "toSwap") {
      setReceiveCurrencyAmount(cleanValue);

      if (rate.isGreaterThan(0)) {
        const fromAmount = inputAmount.dividedBy(rate);
        setFromCurrencyAmount(formatNumber(fromAmount));
      } else {
        setFromCurrencyAmount("");
      }
    }
  }, [conversionRate, safeParseNumber, formatNumber]);

  // Validation logic
  const validationResult = useMemo(() => {
    if (!fromCurrency || !receiveCurrency) {
      return { isValid: false, error: "Please select currencies" };
    }

    if (!conversionRate || conversionRate <= 0) {
      return { isValid: false, error: "Conversion rate not available" };
    }

    const amount = safeParseNumber(fromCurrencyAmount);
    const receiveAmount = safeParseNumber(receiveCurrencyAmount);
    const fee = safeParseNumber(fromCurrency?.swappingFee);
    const balance = safeParseNumber(fromCurrency?.balance);
    const minAmount = safeParseNumber(fromCurrency?.minSwapping);
    const maxAmount = safeParseNumber(fromCurrency?.maxSwapping);
    const totalRequired = amount.plus(fee);

    if (amount.isLessThanOrEqualTo(0)) {
      return { isValid: false, error: null };
    }

    if (amount.isLessThan(minAmount)) {
      return {
        isValid: false,
        error: `Minimum amount is ${formatNumber(minAmount)} ${fromCurrency?.short_name}`
      };
    }

    if (maxAmount.isGreaterThan(0) && amount.isGreaterThan(maxAmount)) {
      return {
        isValid: false,
        error: `Maximum amount is ${formatNumber(maxAmount)} ${fromCurrency?.short_name}`
      };
    }

    if (totalRequired.isGreaterThan(balance)) {
      return {
        isValid: false,
        error: "Insufficient balance",
        showDeposit: true
      };
    }

    if (receiveAmount.isLessThanOrEqualTo(0)) {
      return { isValid: false, error: "Invalid receive amount" };
    }

    return { isValid: true, error: null };
  }, [fromCurrency, receiveCurrency, conversionRate, fromCurrencyAmount, receiveCurrencyAmount, safeParseNumber, formatNumber]);

  // Show order details modal
  const showMoreDetails = useCallback(() => {
    if (!validationResult.isValid) {
      if (validationResult.error) {
        alertErrorMessage(validationResult.error);
      }
      return;
    }
    $("#more_details").modal("show");
  }, [validationResult]);

  // Handle swap execution
  const handleCurrencySwapping = useCallback(async () => {
    if (!validationResult.isValid) {
      alertErrorMessage(validationResult.error || "Invalid swap parameters");
      return;
    }

    if (isSwapping) return;

    const amount = safeParseNumber(fromCurrencyAmount);

    try {
      setIsSwapping(true);
      LoaderHelper.loaderStatus(true);

      const result = await AuthService.swapToken(
        fromCurrency?.currency_id,
        receiveCurrency?.currency_id,
        amount.toNumber()
      );

      if (!isMountedRef.current) return;

      if (result?.success) {
        alertSuccessMessage(result?.message || "Swap completed successfully");
        $("#more_details").modal("hide");

        // Reset form
        setFromCurrencyAmount("");
        setReceiveCurrencyAmount("");

        // Refresh data
        await Promise.all([
          getAvailableCurrency(false),
          getBuySellHistory()
        ]);
      } else {
        alertErrorMessage(result?.message || "Swap failed. Please try again.");
      }
    } catch (error) {
      console.error("Swap failed:", error);
      if (isMountedRef.current) {
        alertErrorMessage("Swap failed. Please try again.");
      }
    } finally {
      if (isMountedRef.current) {
        setIsSwapping(false);
        LoaderHelper.loaderStatus(false);
      }
    }
  }, [
    validationResult,
    isSwapping,
    fromCurrencyAmount,
    fromCurrency?.currency_id,
    receiveCurrency?.currency_id,
    safeParseNumber,
    getAvailableCurrency,
    getBuySellHistory
  ]);

  // Open modal for currency selection
  const openCurrencyModal = useCallback((type) => {
    setModalType(type);
    setFromSearch("");
    setReceiveSearch("");
    $("#search_coin").modal("show");
  }, []);

  // Filter currencies for modal
  const filteredCurrencies = useMemo(() => {
    const searchTerm = modalType === "from" ? fromSearch : receiveSearch;

    return currencyList.filter((item) => {
      const matchesSearch = !searchTerm ||
        item?.short_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item?.currency?.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesSearch;
    });
  }, [currencyList, modalType, fromSearch, receiveSearch]);

  // Filter transaction history
  const filteredHistory = useMemo(() => {
    if (!historySearch) return transactionHistory;

    const search = historySearch.toLowerCase();
    return transactionHistory.filter((item) =>
      item?.from?.toLowerCase().includes(search) ||
      item?.to?.toLowerCase().includes(search)
    );
  }, [transactionHistory, historySearch]);

  // Effect: Fetch currencies and history on mount
  useEffect(() => {
    if (isLoggedIn) {
      getAvailableCurrency(true);
      getBuySellHistory();
      fetchKycStatus();
    }
  }, [isLoggedIn]); // eslint-disable-line react-hooks/exhaustive-deps

  // Effect: Fetch conversion rate when currencies change
  useEffect(() => {
    if (fromCurrency?.short_name && receiveCurrency?.short_name) {
      // Clear amounts when currencies change
      setFromCurrencyAmount("");
      setReceiveCurrencyAmount("");

      // Debounce conversion rate fetch
      if (conversionRateRef.current) {
        clearTimeout(conversionRateRef.current);
      }

      conversionRateRef.current = setTimeout(() => {
        getConversionRate();
      }, 300);
    }

    return () => {
      if (conversionRateRef.current) {
        clearTimeout(conversionRateRef.current);
      }
    };
  }, [fromCurrency?.short_name, receiveCurrency?.short_name]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    window.scrollTo(0, 0);
 }, []);

  // Render login prompt for non-authenticated users
  const renderLoginPrompt = () => (
    <button className="btn" onClick={() => navigate("/login")}>
      Sign Up/Log In
    </button>
  );

  // Render swap button based on state
  const renderSwapButton = () => {
    if (!isLoggedIn) {
      return renderLoginPrompt();
    }

    // KYC not verified - show verify KYC button
    if (!isKycVerified) {
      return (
        <button
          className="btn"
          onClick={() => navigate("/user_profile/kyc")}
        >
          {kycStatus === 1 ? "KYC Pending Verification" : "Complete KYC to Swap"}
        </button>
      );
    }

    if (isSwapping) {
      return (
        <button className="btn" disabled>
          Processing...
        </button>
      );
    }

    return (
      <button
        className="btn"
        onClick={showMoreDetails}
        disabled={!validationResult.isValid}
      >
        Swap Now
      </button>
    );
  };

  return (
    <>
      <div className="dashboard_right">

        <div className="swap_outer_section">

          <h3>Quick Swap</h3>
          <div className="d-flex cnt_amountsl ">
            <ul className="swaplist">
              <li>
                <span>Minimum Amount | Maximum Amount</span>
                {fromCurrency ? (
                  `${formatNumber(fromCurrency?.minSwapping || 0)} | ${formatNumber(fromCurrency?.maxSwapping || 0)} ${fromCurrency?.short_name || "USDT"}`
                ) : (
                  "1 | 500 USDT"
                )}
              </li>
              <li>
                <span>Swapping Fee</span>
                {fromCurrency ? (
                  `${formatNumber(fromCurrency?.swappingFee || 0)}%`
                ) : (
                  "0.00%"
                )}
              </li>
            </ul>
            <div className="swap_bitcoin">
              <img src="/images/bitcoinswap.svg" className="img-fluid" alt="swapbitcoin" />
            </div>
          </div>


          <div className="swap_usdtdata">
            <div className="d-flex">
              <div className="swap_ustd_bl">
                <div className="from">
                  <p>From<i className="ri-information-line"></i></p>
                  <p>
                    Available {formatNumber(fromCurrency?.balance || 0, 4)} {fromCurrency?.short_name || "USDT"}
                    {isLoggedIn && (
                      <Link to="/asset_managemnet/deposit" style={{ color: "#f3bb2c" }}>
                        <i className="ri-add-circle-fill"></i>

                      </Link>
                    )}
                    {isLoggedIn && (
                      <Link to="/user_profile/asset_overview" style={{ color: "#f3bb2c" }}>
                        <i className="ri-exchange-line"></i>
                      </Link>
                    )}
                  </p>
                </div>
                <div className="from">
                  <button onClick={() => openCurrencyModal("from")}>
                    <img
                      src={fromCurrency?.icon_path ? ApiConfig?.baseImage + fromCurrency?.icon_path : "/images/tether_icon.png"}
                      className="img-fluid"
                      alt={fromCurrency?.short_name || "USDT"}
                    />
                    {fromCurrency?.short_name || "USDT"}
                    <i className="ri-arrow-drop-down-fill"></i>
                  </button>
                  <input

                    type="text"
                    inputMode="decimal"
                    name="fromSwap"
                    value={fromCurrencyAmount}
                    onChange={handleSwapInput}
                    placeholder={`0`}
                    style={{
                      color: "#fff",
                      background: "transparent",
                      border: "none",
                      textAlign: "right",
                      fontSize: "18px",
                      fontWeight: "600",
                      width: "100%",
                      outline: "none"
                    }}
                  />
                </div>
                {validationResult.error && fromCurrencyAmount && (
                  <small className="text-danger d-block mt-1">
                    {validationResult.error}
                    {/* {validationResult.showDeposit && isLoggedIn && (
                      <Link to="/asset_managemnet/deposit" className="ms-1">
                        Deposit now<i className="ri-arrow-right-up-line"></i>
                      </Link>
                    )} */}
                  </small>
                )}
              </div>

              <div className="swap_ustd_bl">
                <div className="from">
                  <p>To<i className="ri-information-line"></i></p>
                  <p>
                    Available {formatNumber(receiveCurrency?.balance || 0, 4)} {receiveCurrency?.short_name || "BTC"}
                  </p>
                </div>
                <div className="from">
                  <button onClick={() => openCurrencyModal("to")}>
                    <img
                      src={receiveCurrency?.icon_path ? ApiConfig?.baseImage + receiveCurrency?.icon_path : "/images/bitcoin_icon.png"}
                      className="img-fluid"
                      alt={receiveCurrency?.short_name || "BTC"}
                    />
                    {receiveCurrency?.short_name || "BTC"}
                    <i className="ri-arrow-drop-down-fill"></i>
                  </button>
                  <input
                    type="text"
                    inputMode="decimal"
                    name="toSwap"
                    value={receiveCurrencyAmount}
                    onChange={handleSwapInput}
                    placeholder="0"
                    style={{
                      color: "#fff",
                      background: "transparent",
                      border: "none",
                      textAlign: "right",
                      fontSize: "18px",
                      fontWeight: "600",
                      width: "100%",
                      outline: "none"
                    }}
                  />
                </div>
              </div>

              <div className="vector_icon" onClick={handleInterchangeWallet} style={{ cursor: "pointer" }}>
                <img src="/images/wallet_icon2.png" alt="wallet" />
              </div>

            </div>

            <p>
              <span>Conversion Rate (Approx.)</span>
              {fromCurrency?.short_name && receiveCurrency?.short_name && conversionRate > 0 ? (
                ` 1 ${fromCurrency?.short_name} ≈ ${formatNumber(conversionRate)} ${receiveCurrency?.short_name}`
              ) : (
                " Rate not available"
              )}
            </p>

            {renderSwapButton()}

          </div>


        </div>


        <div className="dashboard_recent_s swap_tb_his">
          <div className="user_list_top">
            <div className="d-flex-between  mb-3  custom_dlflex">
              <h4>Recent Transactions  <small><Link to="/user_profile/swap_history" className="mx-2 text-white"><small>View All<i className="ri-arrow-right-line"></i></small></Link></small></h4>
             
              <div className="searchBar custom-tabs">
                <i className="ri-search-2-line"></i>
                <input
                  type="search"
                  className="custom_search"
                  placeholder="Search Crypto"
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                />
                
              </div>
             
             
            </div>
          </div>
          <div className="desktop_view2">
            <div className='table-responsive'>
             {filteredHistory.length > 0 ? <table>
                <thead>
                  <tr>
                    <th>S.No</th>
                    <th>Date</th>
                    <th>Swapping Currencies</th>
                    <th>Pay Amount</th>
                    <th>Get Amount</th>
                    <th>Swapping Fee</th>
                    <th>Conversion Rate</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHistory.length > 0 ? (
                    filteredHistory.map((item, index) => (
                      <tr key={item?._id || index}>
                        <td>{index + 1}</td>
                        <td>{moment(item?.createdAt).format("YYYY-MM-DD hh:mm A")}</td>
                        <td>{item?.from} <i className="ri-arrow-right-double-line"></i> {item?.to}</td>
                        <td>{formatNumber(item?.pay_amount)} {item?.from}</td>
                        <td>{formatNumber(item?.get_amount)} {item?.to}</td>
                        <td>{formatNumber(item?.fee)} {item?.from}</td>
                        <td>1 {item?.from} {"=>"} {formatNumber(item?.conversion_rate)} {item?.to}</td>
                        <td className="text-success">Completed</td>
                      </tr>
                    ))
                  ) : (
                    <tr rowSpan="5" className="no-data-row">
                          <td colSpan="12">
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
              :
              <div className="table_responsive_2">
                        <div className="favouriteData">
                          <img src="/images/no_data_vector.svg" className="img-fluid dark_img" width="96" height="96" alt="No data" /><img src="/images/no_data_vector_light.png" className="img-fluid light_img" width="96" height="96" alt="No data" />
                        </div>
                        </div>}

            </div>
          </div>

          <div className="mobile_view">
            <div className='table-responsive'>
             {filteredHistory.length > 0 ? <table>
                <thead>
                  <tr>
                    <th>Swapping Currencies</th>
                    <th>Pay Amount</th>
                    <th>Get Amount/Fee</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHistory.length > 0 ? (
                    filteredHistory.map((item, index) => (
                      <tr key={item?._id || index}>
                        <td>{item?.from} <i className="ri-arrow-right-double-line"></i> {item?.to}</td>
                        <td>{formatNumber(item?.pay_amount)} {item?.from}</td>
                        <td>{formatNumber(item?.get_amount)} {item?.to}<br/>{formatNumber(item?.fee)} {item?.to}</td>
                      </tr>
                    ))
                  ) : (
                    <tr rowSpan="1" className="no-data-row">
                    <td colSpan="12">
                      <div className="no-data-wrapper">
                        <div className="no_data_vector">
                        <img src="/images/no_data_vector.svg" className="img-fluid dark_img" width="96" height="96" alt="No data" /><img src="/images/no_data_vector_light.png" className="img-fluid light_img" width="96" height="96" alt="No data" />
                        </div>

                      </div>

                    </td>
                  </tr>
                  )}
                </tbody>
              </table>
              :   <div className="table_responsive_2">
                          <div className="favouriteData">
                            <img src="/images/no_data_vector.svg" className="img-fluid dark_img" width="96" height="96" alt="No data" /><img src="/images/no_data_vector_light.png" className="img-fluid light_img" width="96" height="96" alt="No data" />
                          </div>
                          </div>}

            </div>
          </div>


        </div>

      </div>

      {/* <!-- Modal  more details Pop Up Start --> */}


      <div className="modal fade search_form search_form_modal_2 search_coin"
        id="search_coin" tabIndex="-1" aria-labelledby="exampleModalLabel">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h4>Select Crypto</h4>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              />
            </div>

            <div className="modal-body">
              <form onSubmit={(e) => e.preventDefault()}>
                <input
                  type="text"
                  className="searchfield"
                  placeholder="Search coin name"
                  value={modalType === "from" ? fromSearch : receiveSearch}
                  onChange={(e) => {
                    if (modalType === "from") {
                      setFromSearch(e.target.value);
                    } else {
                      setReceiveSearch(e.target.value);
                    }
                  }}
                />
              </form>

              <div className="hot_trading_t">
                <div className="table-responsive">
                  <table>
                    <tbody>
                      {filteredCurrencies.length > 0 ? (
                        filteredCurrencies.map((item, index) => {
                          const isSelected = modalType === "from"
                            ? fromCurrency?.currency_id === item?.currency_id
                            : receiveCurrency?.currency_id === item?.currency_id;
                          const isDisabled = modalType === "from"
                            ? receiveCurrency?.currency_id === item?.currency_id
                            : fromCurrency?.currency_id === item?.currency_id;

                          return (
                            <tr
                              key={item?.currency_id || index}
                              className={`swap-select-crypto-row ${isSelected ? "selected" : ""} ${isDisabled ? "disabled" : ""}`}
                              onClick={() => !isDisabled && selectCurrency(item, modalType)}
                            >
                              <td>
                                <div className="td_first">
                                  <div className="icon">
                                    <img
                                      src={item?.icon_path ? ApiConfig?.baseImage + item?.icon_path : "/images/tether_icon.png"}
                                      alt={item?.short_name || "icon"}
                                      width="30"
                                    />
                                  </div>
                                  <div className="price_heading">
                                    {item?.short_name}
                                    <span>/{item?.currency}</span>
                                  </div>
                                </div>
                              </td>
                              <td className="right_t price_tb">
                                {formatNumber(item?.balance || 0, 4)}
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan="2" className="text-center py-3">
                            {isLoading ? "Loading..." : "No currencies found"}
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

      {/* Order Details Modal */}
      <div className="modal fade search_form search_coin" id="more_details" tabIndex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5>Order details</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div className="modal-body modal-swap ">
              <div className="hot_trading_t model_height">
                <table>
                  <tbody>
                    <tr>
                      <td>Swapping</td>
                      <td className="right_t price_tb">
                        {formatNumber(fromCurrencyAmount)} {fromCurrency?.short_name}
                        <i className="ri-arrow-right-double-line"></i>
                        {formatNumber(receiveCurrencyAmount)} {receiveCurrency?.short_name}
                      </td>
                    </tr>
                    <tr>
                      <td>Swapping Fee ({formatNumber(fromCurrency?.swappingFee || 0)}%)</td>
                      <td className="right_t price_tb">
                        {formatNumber(
                          safeParseNumber(receiveCurrencyAmount)
                            .multipliedBy(safeParseNumber(fromCurrency?.swappingFee || 0))
                            .dividedBy(100)
                            .toNumber()
                        )} {receiveCurrency?.short_name}
                      </td>
                    </tr>
                    <tr>
                      <td>Deductable Amount</td>
                      <td className="right_t price_tb">
                        {formatNumber(fromCurrencyAmount)} {fromCurrency?.short_name}
                      </td>
                    </tr>
                    <tr>
                      <td>Receivable Amount (Approx.)</td>
                      <td className="right_t price_tb">
                        {formatNumber(
                          safeParseNumber(receiveCurrencyAmount)
                            .minus(
                              safeParseNumber(receiveCurrencyAmount)
                                .multipliedBy(safeParseNumber(fromCurrency?.swappingFee || 0))
                                .dividedBy(100)
                            )
                            .toNumber()
                        )} {receiveCurrency?.short_name}
                      </td>
                    </tr>
                    <tr>
                      <td colSpan="2" className="">
                        <small>
                          <i className="ri-information-2-line"></i> This is an internal transfer. The final disbursed amount will be based on the current market rate at the time of execution. Minor fluctuations may occur between placing the order and its execution.
                        </small>
                      </td>
                    </tr>
                  </tbody>
                </table>
                <div className="mt-3">
                  <form>
                    <button
                      className="swap_button "
                      onClick={handleCurrencySwapping}
                      disabled={isSwapping || !validationResult.isValid}
                    >
                      {isSwapping ? "Processing..." : "Confirm Order"}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* <!-- Modal   more details Pop Up End --> */}

    </>


  );
};

export default Swap;
