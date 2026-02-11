import React, { useEffect, useState, useCallback, useContext, useMemo } from 'react';
import { ApiConfig } from '../../../api/apiConfig/apiConfig';
import AuthService from '../../../api/services/AuthService';
import LoaderHelper from '../../../customComponents/Loading/LoaderHelper';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { alertErrorMessage, alertSuccessMessage } from '../../../customComponents/CustomAlertMessage';
import { ProfileContext } from '../../../context/ProfileProvider';

// Helper to capitalize wallet name
const capitalizeWallet = (str) => {
  if (!str) return 'Wallet';
  return str.charAt(0).toUpperCase() + str.slice(1) + ' Wallet';
};

const WalletPage = () => {
  const { walletType } = useParams();
  const navigate = useNavigate();
  const { setCurrentPage } = useContext(ProfileContext);

  // State declarations
  const [portfolioData, setPortfolioData] = useState({});
  const [fundData, setFundData] = useState([]);
  const [selectedCurrency, setSelectedCurrency] = useState({});
  const [currencyData, setCurrencyData] = useState([]);
  const [availableWalletTypes, setAvailableWalletTypes] = useState([]);
  const [fromWalletType, setFromWalletType] = useState(walletType || "");
  const [toWalletType, setToWalletType] = useState("");
  const [selectedCurrBalance, setSelectedCurrBalance] = useState({});
  const [transferAmount, setTransferAmount] = useState("");
  const [showBalance, setShowBalance] = useState(true);
  const [hideAssets, setHideAssets] = useState(false);
  const [search, setSearch] = useState("");
  const [transferCoinSearch, setTransferCoinSearch] = useState("");
  const [isValidWallet, setIsValidWallet] = useState(null); // null = loading, true/false = validated

  // Derive wallet label from available types
  const walletLabel = useMemo(() => {
    return capitalizeWallet(walletType);
  }, [walletType]);

  // Safely round number up to 8 decimals, return "0.00" if <= 0 or invalid
  const safeRound = useCallback((value, decimals = 8) => {
    const num = parseFloat(value);
    if (isNaN(num) || num <= 0) {
      return "0.00";
    }
    return parseFloat(num.toFixed(decimals));
  }, []);

  const fiveDecimal = useCallback((data) => {
    if (typeof data === "number") {
      if (data <= 0) return "0.00";
      return parseFloat(data.toFixed(8));
    }
    return "N/A";
  }, []);

  // API Handlers
  const handleUserFunds = useCallback(async (type) => {
    try {
      const result = await AuthService.getUserfunds(type);
      if (result?.success) {
        const wallets = result?.data || [];
        setFundData(wallets);
        setCurrencyData(prev => {
          if (!prev || prev.length === 0) {
            return wallets;
          }
          return prev;
        });
      }
    } catch {
      // Silent fail
    }
  }, []);

  const fetchPortfolio = useCallback(async () => {
    try {
      const result = await AuthService.estimatedPortfolio(walletType);
      if (result?.success) {
        setPortfolioData(result?.data || {});
      }
    } catch {
      // Silent fail
    }
  }, [walletType]);

  const getWalletTypes = useCallback(async () => {
    try {
      const result = await AuthService.availableWalletTypes();
      if (result?.success) {
        const types = result?.data || [];
        setAvailableWalletTypes(types);
        
        // Validate if current walletType exists in available types
        const isValid = types.includes(walletType);
        setIsValidWallet(isValid);
        
        if (!isValid) {
          navigate('/user_profile/asset_overview');
          return;
        }
        
        // Set default "to" wallet (first one that's not current wallet)
        const defaultTo = types.find(t => t !== walletType) || "";
        setToWalletType(defaultTo);
      } else {
        setIsValidWallet(false);
        navigate('/user_profile/asset_overview');
      }
    } catch {
      setIsValidWallet(false);
      navigate('/user_profile/asset_overview');
    }
  }, [walletType, navigate]);

  const getWalletBalance = useCallback(async () => {
    if (!selectedCurrency?.currency_id || !fromWalletType || !toWalletType) return;
    try {
      LoaderHelper.loaderStatus(true);
      const result = await AuthService.getPerticularWalletBalance(selectedCurrency?.currency_id, fromWalletType, toWalletType);
      if (result?.success) {
        setSelectedCurrBalance(result?.data || {});
      } else {
        alertErrorMessage(result?.message || "Failed to fetch balance");
      }
    } catch (error) {
      alertErrorMessage(error?.message || "Failed to fetch wallet balance");
    } finally {
      LoaderHelper.loaderStatus(false);
    }
  }, [selectedCurrency?.currency_id, fromWalletType, toWalletType]);

  const handleWalletTransfer = useCallback(async () => {
    if (!fromWalletType || !toWalletType || !selectedCurrency?.currency_id || !+transferAmount) {
      alertErrorMessage("Please fill all required fields");
      return;
    }
    try {
      LoaderHelper.loaderStatus(true);
      const result = await AuthService.walletTransfer(fromWalletType, toWalletType, selectedCurrency?.currency_id, +transferAmount);
      if (result?.success) {
        alertSuccessMessage(result?.message || "Transfer successful");
        setTransferAmount("");
        // Refresh data
        fetchPortfolio();
        handleUserFunds(walletType);
      } else {
        alertErrorMessage(result?.message || "Transfer failed");
      }
    } catch (error) {
      alertErrorMessage(error?.message || "Transfer failed");
    } finally {
      LoaderHelper.loaderStatus(false);
    }
  }, [fromWalletType, toWalletType, selectedCurrency?.currency_id, transferAmount, fetchPortfolio, handleUserFunds, walletType]);

  const handleInterchangeWallet = useCallback(() => {
    setFromWalletType(toWalletType);
    setToWalletType(fromWalletType);
  }, [fromWalletType, toWalletType]);

  // Sort and filter logic - currencies with balance on top
  const sortedFundData = useMemo(() => {
    const data = [...(fundData || [])];
    
    // Sort: non-zero total balance on top, then by total balance descending
    return data.sort((a, b) => {
      const totalA = (parseFloat(a?.balance) || 0) + (parseFloat(a?.locked_balance) || 0);
      const totalB = (parseFloat(b?.balance) || 0) + (parseFloat(b?.locked_balance) || 0);

      // Non-zero balances first
      if (totalA > 0 && totalB === 0) return -1;
      if (totalA === 0 && totalB > 0) return 1;

      // Both have balance or both are zero - sort by total balance descending
      return totalB - totalA;
    });
  }, [fundData]);

  const finalFundData = sortedFundData.filter((item) =>
    (item?.short_name?.toLowerCase()?.includes(search?.toLowerCase()) ||
      item?.currency?.toLowerCase()?.includes(search?.toLowerCase()))
  );

  const filteredCoinList = hideAssets
    ? finalFundData.filter(item => ((parseFloat(item?.balance) || 0) + (parseFloat(item?.locked_balance) || 0)) > 0)
    : finalFundData;

  // Effects
  useEffect(() => {
    // Set current page for sidebar
    setCurrentPage(walletLabel);

    const initData = async () => {
      LoaderHelper.loaderStatus(true);
      await getWalletTypes(); // This validates the wallet type
      await fetchPortfolio();
      await handleUserFunds(walletType);
      LoaderHelper.loaderStatus(false);
    };

    initData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [walletType]);

  useEffect(() => {
    if (Object.keys(selectedCurrency || {}).length > 0 && fromWalletType && toWalletType) {
      getWalletBalance();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCurrency, fromWalletType, toWalletType]);

  // Update fromWalletType when walletType changes
  useEffect(() => {
    setFromWalletType(walletType);
  }, [walletType]);

  // Helper to capitalize first letter
  const capitalize = (str) => {
    if (typeof str !== 'string' || str.length === 0) return 'N/A';
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  // Render action buttons based on wallet type
  const renderActionButtons = (item) => {
    const openTransferModal = (e) => {
      e.preventDefault();
      setSelectedCurrency(item);
      setFromWalletType(walletType);
      const defaultTo = availableWalletTypes.find(t => t !== walletType) || 'main';
      setToWalletType(defaultTo);
    };

    
    switch (walletType) {
      case 'spot':
        return (
          <>
            <a
              href="#/"
              className="btn-link text-white"
              data-bs-toggle="modal"
              data-bs-target="#walletTransferModal"
              onClick={openTransferModal}
            >
              Transfer
            </a>
            <Link to={`/trade/${item?.short_name}_USDT`} className="btn-link text-white">
              Trade
            </Link>
          </>
        );

      case 'p2p':
        return (
          <>
            <a
              href="#/"
              className="btn-link text-white"
              data-bs-toggle="modal"
              data-bs-target="#walletTransferModal"
              onClick={openTransferModal}
            >
              Transfer
            </a>
            <Link to="/p2p-dashboard" className="btn-link text-white">
              P2P Trade
            </Link>
          </>
        );

      case 'earning':
        return (
          <>
            <a
              href="#/"
              className="btn-link text-white"
              data-bs-toggle="modal"
              data-bs-target="#walletTransferModal"
              onClick={openTransferModal}
            >
              Transfer
            </a>
            <Link to="/earning" className="btn-link text-white">
              Earning
            </Link>
          </>
        );

      case 'swap':
        return (
          <>
            <a
              href="#/"
              className="btn-link text-white"
              data-bs-toggle="modal"
              data-bs-target="#walletTransferModal"
              onClick={openTransferModal}
            >
              Transfer
            </a>
            <Link to="/user_profile/swap" className="btn-link text-white">
              Swap
            </Link>
          </>
        );

      case 'main':
        return (
          <>
            <a
              href="#/"
              className="btn-link text-white"
              data-bs-toggle="modal"
              data-bs-target="#walletTransferModal"
              onClick={openTransferModal}
            >
              Transfer
            </a>
            <Link to="/asset_managemnet/deposit" className="btn-link text-white">
              Deposit
            </Link>
            <Link to="/asset_managemnet/withdraw" className="btn-link text-white">
              Withdraw
            </Link>
          </>
        );

      case 'futures':
        return (
          <>
            <a
              href="#/"
              className="btn-link text-white"
              data-bs-toggle="modal"
              data-bs-target="#walletTransferModal"
              onClick={openTransferModal}
            >
              Transfer
            </a>
            <Link to="/usd_futures/header" className="btn-link text-white">
              Futures
            </Link>
          </>
        );

      default:
        return (
          <a
            href="#/"
            className="btn-link text-white"
            data-bs-toggle="modal"
            data-bs-target="#walletTransferModal"
            onClick={openTransferModal}
          >
            Transfer
          </a>
        );
    }
  };

  // Show loading or nothing while validating
  if (isValidWallet === null) {
    return null; // Loading state
  }

  if (isValidWallet === false) {
    return null; // Will redirect
  }

  

  return (
    <>
      <div className="dashboard_right">
        <div className='row'>
          <div className="col-sm-10">
            <div className='overview_section'>
              <div className='estimated_balance'>
                <h6>
                  {walletLabel} Balance
                  <button type="button" onClick={() => setShowBalance(prev => !prev)}>
                    <i className={showBalance ? "ri-eye-line" : "ri-eye-off-line"}></i>
                  </button>
                </h6>
                <div className="wallet-header d-flex flex-wrap align-items-center justify-content-between">
                  <div>
                    <div className="wallet-title">
                      {showBalance ? safeRound(portfolioData?.dollarPrice) : "****"} USDT
                    </div>
                    <div className="wallet-sub mt-1">
                      ≈ {showBalance ? safeRound(portfolioData?.currencyPrice) : "****"} {portfolioData?.Currency || "USD"}
                    </div>
                  </div>

                  <div className="d-flex gap-2 mt-3 mt-md-0">
                    <button className="btn btn-deposit px-4" onClick={() => navigate("/asset_managemnet/deposit")}>Deposit</button>
                    <button className="btn btn-outline-custom px-4" onClick={() => navigate("/asset_managemnet/withdraw")}>Withdraw</button>
                    <button className="btn btn-outline-custom px-4" data-bs-toggle="modal" data-bs-target="#walletTransferModal" onClick={(e) => {
                      e.preventDefault();
                      Object.keys(selectedCurrency || {})?.length > 0 ? setSelectedCurrency(selectedCurrency) : setSelectedCurrency(fundData[0] || {});
                      setFromWalletType(walletType);
                      const defaultTo = availableWalletTypes.find(t => t !== walletType) || 'main';
                      setToWalletType(defaultTo);
                    }}>Transfer</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="dashboard_listing_section Overview_mid">
          <div className="assets_wallets_section">
            <div className='row'>
              <div className="col-sm-10">
                <div className="market_section">
                  {/* Header */}
                  <div className="coin_view_top">
                    <div className="wallet_tabs">
                      <span className="tab_btn active">{walletLabel} Assets</span>
                    </div>
                    <div className="coin_right">
                      <div className="searchBar custom-tabs">
                        <i className="ri-search-2-line"></i>
                        <input
                          type="search"
                          className="custom_search"
                          placeholder="Search Crypto"
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                        />
                      </div>

                      <div className="checkbox">
                        <input
                          type="checkbox"
                          checked={hideAssets}
                          onChange={() => setHideAssets(prev => !prev)}
                        />
                        Hide 0 Balance
                      </div>
                    </div>
                  </div>

                  {/* Crypto Table */}
                  <div className="dashboard_summary">
                    <div className='desktop_view'>
                      <div className="table-responsive">
                        <table>
                          <thead>
                            <tr>
                              <th>Coin</th>
                              <th>Available Balance</th>
                              <th>In-Order Balance</th>
                              <th>Total Balance</th>
                              <th className="right_td">Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredCoinList?.length > 0 ? (
                              filteredCoinList.map((item, index) => (
                                <tr key={item?.currency_id || index}>
                                  <td>
                                    <div className="td_first">
                                      <div className="icon">
                                        <img
                                          src={ApiConfig?.baseImage + item?.icon_path}
                                          height="30"
                                          alt={item?.short_name || "icon"}
                                          onError={(e) => { e.target.src = "/images/default_coin.png"; }}
                                        />
                                      </div>
                                      <div className="price_heading">
                                        {item?.short_name}
                                        <br />
                                        <span>{item?.currency}</span>
                                      </div>
                                    </div>
                                  </td>
                                  <td>{safeRound(item?.balance)}</td>
                                  <td>{safeRound(item?.locked_balance)}</td>
                                  <td>{safeRound((parseFloat(item?.balance) || 0) + (parseFloat(item?.locked_balance) || 0))}</td>
                                  <td className="right_td">
                                    <div className='d-flex gap-3 justify-content-end'>
                                      {renderActionButtons(item)}
                                    </div>
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr className="no-data-row2">
                                <td colSpan="5">
                                  <div className="no-data-wrapper">
                                    <div className="no_data_vector">
                                      <img src="/images/Group 1171275449 (1).svg" alt="no-data" />
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                    <div className='mobile_view'>
                      <div className="table-responsive">
                        <table>
                          <thead>
                            <tr>
                              <th>Coin</th>
                              <th>Available/In-Order</th>
                              <th>Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredCoinList?.length > 0 ? (
                              filteredCoinList.map((item, index) => (
                                <tr key={item?.currency_id || index}>
                                  <td>
                                    <div className="td_first">
                                      <div className="icon">
                                        <img
                                          src={ApiConfig?.baseImage + item?.icon_path}
                                          height="30"
                                          alt={item?.short_name || "icon"}
                                          onError={(e) => { e.target.src = "/images/default_coin.png"; }}
                                        />
                                      </div>
                                      <div className="price_heading">
                                        {item?.short_name}
                                        <br />
                                        <span>{item?.currency}</span>
                                      </div>
                                    </div>
                                  </td>
                                  <td>{safeRound(item?.balance)}<br />{safeRound(item?.locked_balance)}</td>
                                  <td>{safeRound((parseFloat(item?.balance) || 0) + (parseFloat(item?.locked_balance) || 0))}</td>
                                </tr>
                              ))
                            ) : (
                              <tr className="no-data-row2">
                                <td colSpan="3">
                                  <div className="no-data-wrapper">
                                    <div className="no_data_vector">
                                      <img src="/images/Group 1171275449 (1).svg" alt="no-data" />
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
            </div>
          </div>
        </div>
      </div>

      {/* Wallet Transfer Modal */}
      <div className="modal fade kyc_modal" id="walletTransferModal" tabIndex="-1">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Wallet Transfer</h5>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              ></button>
            </div>

            <div className="modal-body">
              <div className='wallet_transfer'>
                <div className='wallet_form'>
                  <div className='form_select'>
                    <div className='currencyicon'>
                      <img src="/images/dollaricon.svg" alt="dollaricon" />
                    </div>
                    <div className='formfiled'>
                      <label>From</label>
                      <div className='select_spot'>
                        <select value={fromWalletType} onChange={(e) => setFromWalletType(e.target.value)}>
                          {availableWalletTypes?.length > 0 ? availableWalletTypes.filter(w => w !== toWalletType).map((wallet, idx) => (
                            <option key={idx} value={wallet}>{capitalize(wallet)}</option>
                          )) : <option>N/A</option>}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className='form_select refreshcntr'>
                    <div className='currencyicon'>
                      <img src="/images/arrowbottom.svg" alt="arrowbottom" />
                    </div>
                    <div className='formfiled'></div>
                    <div className='currencyicon' style={{ cursor: 'pointer' }} onClick={handleInterchangeWallet}>
                      <img src="/images/refreshicon.svg" alt="refreshicon" />
                    </div>
                  </div>

                  <div className='form_select'>
                    <div className='currencyicon'>
                      <img src="/images/dollaricon.svg" alt="dollaricon" />
                    </div>
                    <div className='formfiled'>
                      <label>To</label>
                      <div className='select_spot'>
                        <select value={toWalletType} onChange={(e) => setToWalletType(e.target.value)}>
                          {availableWalletTypes?.length > 0 ? availableWalletTypes.filter(w => w !== fromWalletType).map((wallet, idx) => (
                            <option key={idx} value={wallet}>{capitalize(wallet)}</option>
                          )) : <option>N/A</option>}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                <div className='crypto_selectcoin'>
                  <h6>Crypto</h6>
                  <div className='coin_cryptofiled'>
                    <button
                      type="button"
                      onClick={() => {
                        window.$("#walletTransferModal").modal("hide");
                        window.$("#walletTransferModal").one("hidden.bs.modal", function () {
                          window.$("#wallet_crypto_modal").modal("show");
                        });
                      }}
                    >
                      {Object.keys(selectedCurrency || {}).length > 0 ? (
                        <span>
                          <img
                            src={ApiConfig?.baseImage + selectedCurrency?.icon_path}
                            alt={selectedCurrency?.short_name || "crypto"}
                            width="20px"
                            onError={(e) => { e.target.src = "/images/default_coin.png"; }}
                          />
                          {selectedCurrency?.short_name || selectedCurrency?.currency || 'Crypto'}
                        </span>
                      ) : (
                        <span><img src="/images/tether_icon.png" alt="Crypto" />Crypto</span>
                      )}
                      <i className="ri-arrow-down-s-fill"></i>
                    </button>
                  </div>
                </div>

                <div className='crypto_selectcoin'>
                  <h6>Quantity</h6>
                  <div className="price_max_total">
                    <input
                      type="number"
                      placeholder="Amount"
                      value={transferAmount}
                      onChange={(e) => setTransferAmount(e.target.value)}
                      onWheel={(e) => e.target.blur()}
                    />
                    <div className='d-flex gap-0'>
                      {selectedCurrency?.short_name || "USDT"}
                      <button type="button" onClick={() => setTransferAmount(selectedCurrBalance?.fromWallet?.balance || 0)}>All</button>
                    </div>
                  </div>
                </div>

                <legend>Balance：<span>{fiveDecimal(selectedCurrBalance?.fromWallet?.balance || 0)} {selectedCurrency?.short_name || "USDT"}</span></legend>

                <button
                  className='btn'
                  type="button"
                  onClick={handleWalletTransfer}
                  disabled={!transferAmount || Number(transferAmount) <= 0 || Number(transferAmount) > (selectedCurrBalance?.fromWallet?.balance || 0)}
                >
                  Transfer
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Crypto Selection Modal */}
      <div className="modal fade search_form search_coin search_form_modal_2" id="wallet_crypto_modal" tabIndex="-1" aria-labelledby="walletCryptoModalLabel" aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h4 className="modal-title" id="walletCryptoModalLabel">Select Crypto</h4>
              <button
                type="button"
                className="btn-close"
                aria-label="Close"
                onClick={() => {
                  window.$("#wallet_crypto_modal").modal("hide");
                  window.$("#wallet_crypto_modal").one("hidden.bs.modal", function () {
                    window.$("#walletTransferModal").modal("show");
                  });
                }}
              ></button>
            </div>
            <div className="modal-body">
              <form onSubmit={(e) => e.preventDefault()}>
                <input
                  type="text"
                  placeholder="Search coin name"
                  value={transferCoinSearch}
                  onChange={(e) => setTransferCoinSearch(e.target.value)}
                />
              </form>

              <div className="hot_trading_t">
                <div className='table-responsive'>
                  <table>
                    <tbody>
                      {currencyData?.length > 0 ? currencyData.filter((item) => {
                        if (!transferCoinSearch) return true;
                        const searchTerm = transferCoinSearch.toLowerCase();
                        const currencyName = (item?.currency || '').toLowerCase();
                        const shortName = (item?.short_name || '').toLowerCase();
                        return currencyName.includes(searchTerm) || shortName.includes(searchTerm);
                      }).map((item, index) => (
                        <tr
                          key={item?.currency_id || item?.id || index}
                          onClick={() => {
                            setSelectedCurrency(item);
                            setTransferCoinSearch("");
                            window.$("#wallet_crypto_modal").modal("hide");
                            window.$("#wallet_crypto_modal").one("hidden.bs.modal", function () {
                              window.$("#walletTransferModal").modal("show");
                            });
                          }}
                          style={{ cursor: 'pointer' }}
                        >
                          <td>
                            <div className="td_first">
                              <div className="icon">
                                <img
                                  src={ApiConfig?.baseImage + item?.icon_path}
                                  alt={item?.short_name || "icon"}
                                  width="30px"
                                  onError={(e) => { e.target.src = "/images/default_coin.png"; }}
                                />
                              </div>
                              <div className="price_heading">{item?.short_name}<br /></div>
                            </div>
                          </td>
                          <td className="right_t price_tb">{item?.currency}</td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan="2" className="text-center">No coins found</td>
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
    </>
  );
};

export default WalletPage;

