import React, { useEffect, useState, useCallback, useContext, useMemo } from 'react';
import { ApiConfig } from '../../../api/apiConfig/apiConfig';
import AuthService from '../../../api/services/AuthService';
import LoaderHelper from '../../../customComponents/Loading/LoaderHelper';
import { Link, useNavigate } from 'react-router-dom';
import { alertErrorMessage, alertSuccessMessage } from '../../../customComponents/CustomAlertMessage';
import { ProfileContext } from '../../../context/ProfileProvider';

const AssetOverview = () => {
  const navigate = useNavigate();
  
  // Use estimatedPortfolio from context (already fetched once on login)
  const { estimatedPortfolio: contextEstimatedPortfolio } = useContext(ProfileContext);

  // State declarations
  const [fundData, setfundData] = useState([]);
  const [selectedCurrency, setSelectedCurrency] = useState({});
  const [currencyData, setCurrencyData] = useState([]);
  const [walletType, setWalletType] = useState([]);
  const [fromWalletType, setFromWalletType] = useState("");
  const [toWalletType, setToWalletType] = useState("");
  const [selectedCurrBalance, setSelectedCurrBalance] = useState({});
  const [transferAmount, setTransferAmount] = useState("");
  const [showBalance, setShowBalance] = useState(true);
  const [activeTab, setActiveTab] = useState("assets");
  const [hideAssets, setHideAssets] = useState(false);
  const [search, setSearch] = useState("");
  const [transferCoinSearch, setTransferCoinSearch] = useState("");
  const [accountBalances, setAccountBalances] = useState({});

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
        setfundData(wallets);
        setCurrencyData(prev => {
          if (!prev || prev.length === 0) {
            // setSelectedCurrency(wallets[0] || {});
            return wallets;
          }
          return prev;
        });
      }
    } catch {
      // Silent fail
    }
  }, []);


  const getWalletType = useCallback(async () => {
    try {
      const result = await AuthService.availableWalletTypes();
      if (result?.success) {
        setWalletType(result?.data || []);
        setFromWalletType(result?.data?.[0] || "");
        setToWalletType(result?.data?.[1] || "");
      }
    } catch {
      // Silent fail
    }
  }, []);

  const fetchAccountBalances = useCallback(async () => {
    LoaderHelper.loaderStatus(true);
    try {
      const result = await AuthService.allWalletsPortfolio();
      if (result?.success) {
        setAccountBalances(result?.data?.wallets || {});
      }
    } catch {
      // Silent fail
    } finally {
      LoaderHelper.loaderStatus(false);
    }
  }, []);

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
        fetchAccountBalances();
      } else {
        alertErrorMessage(result?.message || "Transfer failed");
      }
    } catch (error) {
      alertErrorMessage(error?.message || "Transfer failed");
    } finally {
      LoaderHelper.loaderStatus(false);
    }
  }, [fromWalletType, toWalletType, selectedCurrency?.currency_id, transferAmount]);

  const handleInterchangeWallet = useCallback(() => {
    setFromWalletType(toWalletType);
    setToWalletType(fromWalletType);
  }, [fromWalletType, toWalletType]);

  // Sort and filter logic - currencies with balance on top
  const sortedFundData = useMemo(() => {
    const data = [...(fundData || [])];
    
    // Sort: non-zero total balance on top, then by total balance descending
    return data.sort((a, b) => {
      const totalA = (parseFloat(a?.balance) || 0) + (parseFloat(a?.bonus) || 0) + (parseFloat(a?.locked_balance) || 0);
      const totalB = (parseFloat(b?.balance) || 0) + (parseFloat(b?.bonus) || 0) + (parseFloat(b?.locked_balance) || 0);

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
    ? finalFundData.filter(item => ((parseFloat(item?.balance) || 0) + (parseFloat(item?.bonus) || 0) + (parseFloat(item?.locked_balance) || 0)) > 0)
    : finalFundData;

  // Effects
  useEffect(() => {
    funcInSequence();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const funcInSequence = async () => {
    LoaderHelper.loaderStatus(true);
    await getWalletType();
    await handleUserFunds("");
    LoaderHelper.loaderStatus(false);
  };

  useEffect(() => {
    if (Object.keys(selectedCurrency || {}).length > 0 && fromWalletType && toWalletType) {
      getWalletBalance();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCurrency, fromWalletType, toWalletType]);

  // Helper to capitalize first letter
  const capitalize = (str) => {
    if (typeof str !== 'string' || str.length === 0) return 'N/A';
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  useEffect(() => {
    window.scrollTo(0, 0);
 }, []);

  return (
    <>
      <div className="dashboard_right">
        <div className='row'>
          <div className="col-sm-10">
            <div className='overview_section'>
              <div className='estimated_balance'>
                <h6>
                  Estimated Balance
                  <button type="button" onClick={() => setShowBalance(prev => !prev)}>
                    <i className={showBalance ? "ri-eye-line" : "ri-eye-off-line"}></i>
                  </button>
                </h6>
                <div className="wallet-header d-flex flex-wrap align-items-center justify-content-between">
                  <div>
                    <div className="wallet-title">
                      {showBalance ? safeRound(contextEstimatedPortfolio?.dollarPrice) : "****"} USDT
                    </div>
                    <div className="wallet-sub mt-1">
                      ≈ {showBalance ? safeRound(contextEstimatedPortfolio?.currencyPrice) : "****"} {contextEstimatedPortfolio?.Currency || "USD"}
                      <span onClick={() => navigate("/asset_managemnet/deposit")} className='cursor-pointer'>
                        Deposit crypto instantly with one-click <i className="ri-arrow-right-s-line"></i>
                      </span>
                    </div>
                  </div>

                  <div className="d-flex gap-2 mt-3 mt-md-0">
                    <button className="btn btn-deposit px-4" onClick={() => navigate("/asset_managemnet/deposit")}>Deposit</button>
                    <button className="btn btn-outline-custom px-4" onClick={() => navigate("/asset_managemnet/withdraw")}>Withdraw</button>
                    <button className="btn btn-outline-custom px-4" data-bs-toggle="modal" data-bs-target="#kycModal" onClick={(e) => {
                      e.preventDefault();
                      Object.keys(selectedCurrency || {})?.length > 0 ? setSelectedCurrency(selectedCurrency) : setSelectedCurrency(fundData[0] || {});
                      setFromWalletType('spot');
                      setToWalletType('main');
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
                  {/* Tabs Header */}
                  <div className="coin_view_top">
                    <div className="wallet_tabs">
                      <button
                        className={activeTab === "assets" ? "tab_btn active" : "tab_btn"}
                        onClick={() => setActiveTab("assets")}
                      >
                        Crypto
                      </button>

                      <button
                        className={activeTab === "account" ? "tab_btn active" : "tab_btn"}
                        onClick={() => {
                          setActiveTab("account");
                          if (Object.keys(accountBalances).length === 0) {
                            fetchAccountBalances();
                          }
                        }}
                      >
                        Account
                      </button>
                    </div>
                    {activeTab !== "account" && (
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
                    )}
                  </div>

                  {/* Crypto Tab */}
                  {activeTab === "assets" && (
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
                                        <a
                                          href="#/"
                                          className="btn-link text-white"
                                          data-bs-toggle="modal"
                                          data-bs-target="#kycModal"
                                          onClick={(e) => {
                                            e.preventDefault();
                                            setSelectedCurrency(item);
                                            setFromWalletType('spot');
                                            setToWalletType('main');
                                          }}
                                        >
                                          Transfer
                                        </a>
                                        <Link to={`/trade/${item?.short_name}_USDT`} className="btn-link text-white">
                                          Trade
                                        </Link>
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
                                <th>Available/In-Order Balance</th>
                                <th>Total Balance</th>
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
                  )}

                  {/* Account Tab */}
                  {activeTab === "account" && (
                    <div className="dashboard_summary dummy_tab account_table">
                      <div className='d-flex gap-3 justify-content-between account_tabcnt'>
                        <div className="table-responsive">
                          <table>
                            <thead>
                              <tr>
                                <th>Account</th>
                                <th>Amount</th>
                                <th>Ratio</th>
                                <th className="right_td">Action</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(() => {
                                const accountTypes = [
                                  { key: 'main', label: 'Main', className: '' },
                                  { key: 'spot', label: 'Spot', className: 'spot' },
                                  { key: 'swap', label: 'Swap', className: 'swap' },
                                  { key: 'earning', label: 'Earning', className: 'staking' },
                                  { key: 'futures', label: 'Futures', className: 'futures' }
                                ];

                                const totalBalance = accountTypes.reduce((sum, acc) => {
                                  return sum + (accountBalances[acc.key]?.dollarPrice || 0);
                                }, 0);

                                return accountTypes.map((account, index) => {
                                  const balance = accountBalances[account.key] || { dollarPrice: 0, currencyPrice: 0, Currency: 'USD' };
                                  const ratio = totalBalance > 0
                                    ? ((balance.dollarPrice / totalBalance) * 100).toFixed(2)
                                    : '0.00';

                                  return (
                                    <tr key={index}>
                                      <td>
                                        <div className={`td_first ${account.className}`}>
                                          {account.label}
                                        </div>
                                      </td>
                                      <td className="amount_td">
                                        {safeRound(balance?.currencyPrice)} {balance.Currency}
                                        <span>${safeRound(balance?.dollarPrice)}</span>
                                      </td>
                                      <td>{ratio}%</td>
                                      <td className="right_td">
                                        <div className='d-flex gap-3 justify-content-end'>
                                          <a
                                            href="#/"
                                            className="btn-link text-white"
                                            data-bs-toggle="modal"
                                            data-bs-target="#kycModal"
                                            onClick={(e) => {
                                              e.preventDefault();
                                              if (account.key === 'main') {
                                                setFromWalletType('main');
                                                setToWalletType('spot');
                                              } else {
                                                setFromWalletType(account.key);
                                                setToWalletType('main');
                                              }
                                            }}
                                          >
                                            Transfer
                                          </a>
                                          <Link to="/user_profile/wallet_transfer_History" className="btn-link text-white">
                                            History
                                          </Link>
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                });
                              })()}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Wallet Transfer Modal */}
      <div className="modal fade kyc_modal" id="kycModal" tabIndex="-1">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="kycTitle">Wallet Transfer</h5>
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
                          {walletType?.length > 0 ? walletType.filter(w => w !== toWalletType).map((wallet, idx) => (
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
                          {walletType?.length > 0 ? walletType.filter(w => w !== fromWalletType).map((wallet, idx) => (
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
                        window.$("#kycModal").modal("hide");
                        window.$("#kycModal").one("hidden.bs.modal", function () {
                          window.$("#assets_crypto_modal").modal("show");
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
      <div className="modal fade search_form search_coin search_form_modal_2" id="assets_crypto_modal" tabIndex="-1" aria-labelledby="assetsCryptoModalLabel" aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h4 className="modal-title" id="assetsCryptoModalLabel">Select Crypto</h4>
              <button
                type="button"
                className="btn-close"
                aria-label="Close"
                onClick={() => {
                  window.$("#assets_crypto_modal").modal("hide");
                  window.$("#assets_crypto_modal").one("hidden.bs.modal", function () {
                    window.$("#kycModal").modal("show");
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
                            window.$("#assets_crypto_modal").modal("hide");
                            window.$("#assets_crypto_modal").one("hidden.bs.modal", function () {
                              window.$("#kycModal").modal("show");
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

export default AssetOverview;
