import React, { useContext, useEffect, useState } from 'react'
import AuthService from '../../../api/services/AuthService';
import { ApiConfig } from '../../../api/apiConfig/apiConfig';
import { $ } from 'react-jquery-plugin';
import LoaderHelper from '../../../customComponents/Loading/LoaderHelper';
import { alertErrorMessage, alertSuccessMessage, alertWarningMessage } from '../../../customComponents/CustomAlertMessage';
import QRCode from 'qrcode.react';
import moment from 'moment';
import { Link } from 'react-router-dom';
import { ProfileContext } from '../../../context/ProfileProvider';
import { usePlatformStatus } from '../../../context/PlatformStatusProvider';

const DepositPage = () => {
  const { getStatus } = usePlatformStatus();
  const isDepositDisabled = !getStatus('deposit').enabled;

  const [availableCurrency, setAvailableCurrency] = useState([]);
  const [allData, setAllData] = useState([]);
  const [searchPair, setSearchPair] = useState("");
  const [selectedCurrency, setSelectedCurrency] = useState({});
  const [selectedNetwork, setSelectedNetwork] = useState("");
  const [depositAddress, setDepositAddress] = useState("");
  const [recentDepositHistory, setRecentDepositHistory] = useState([]);
  const [allCoinData, setAllCoinData] = useState([]);
  const [modalData, setModalData] = useState({});
  const [loadingDeposit, setLoadingDeposit] = useState(false);

  function shortenAddress(address, length = 4) {
    if (!address || address.length < 10) return address; // Ensure it's a valid address
    return `${address.slice(0, length + 2)}...${address.slice(-length)}`;
  }


  const getDepositActiveCoins = async () => {
    LoaderHelper.loaderStatus(true);
    await AuthService.depositActiveCoins().then(async (result) => {
      if (result?.success) {
        try {
          setAvailableCurrency(result?.data)
          setAllData(result?.data)

        } catch (error) {

        }
      }
    });
    LoaderHelper.loaderStatus(false);
  };

  const allCoins = async () => {
    LoaderHelper.loaderStatus(true);
    await AuthService.allCoins().then(async (result) => {
      if (result?.success) {
        try {
          setAllCoinData(result?.data)

        } catch (error) {

        }
      }
    });
    LoaderHelper.loaderStatus(false);
  };

  const depositHistory = async (type) => {
    LoaderHelper.loaderStatus(true);
    await AuthService.depositHistory(0, 5).then(async (result) => {
      if (result?.success) {
        try {
          setRecentDepositHistory(result?.data);

          if (type === "showModal") {

            $("#deposit_confirmed").modal('show');
            let filteredData = result?.data?.slice(0, 1)[0];
            const shortTxHash = shortenAddress(filteredData?.transaction_hash);
            setModalData({ ...filteredData, shortTxHash })
          }



        } catch (error) {

        }
      }
    });
    LoaderHelper.loaderStatus(false);
  };



  const [checkDepositStatus, setCheckDepositStatus] = useState(false);

  const completeDeposit = async () => {
    setCheckDepositStatus(true)
    await new Promise((resolve) => {
      setTimeout(() => {
        handleVerifyDeposit("checkPayment")
        resolve();

      }, 10000);
    });
    // handleVerifyDeposit("checkPayment")

  }

  const handleVerifyDeposit = async (status) => {
    setLoadingDeposit(true)
    await AuthService.verifyDeposit(status, selectedNetwork, selectedCurrency?._id).then(async (result) => {
      if (result?.success) {
        if (result?.message === "New Transactions Fetched") {
          alertSuccessMessage("New deposit fetched");
          depositHistory("showModal")


        } else {
          if (status === "checkPayment") {
            alertWarningMessage("New deposit not found. Please check after some time.");
          }
        }

        LoaderHelper.loaderStatus(false);
      }
      if (status === "checkPayment") {
        setCheckDepositStatus(false)
        AuthService.transfer_funds(result?.data, result?.currency)
      }
    })
    setLoadingDeposit(false)
  };


  const handleSelectDepositCoin = (item) => {
    if (isDepositDisabled) {
      alertWarningMessage('Deposit is temporarily disabled');
      return;
    }
    setSelectedCurrency(item);
    setSelectedNetwork("");
    setDepositAddress("");
    $("#search_coin").modal('hide');
  };

  const handleSelectNetwork = (item) => {
    if (isDepositDisabled) {
      alertWarningMessage('Deposit is temporarily disabled');
      return;
    }
    setSelectedNetwork(item);
    $("#network_pop_up").modal('hide');
    getDepostAddress(false, item);
  };


  const handleDepositModal = (item) => {


    const shortAddress = shortenAddress(item?.from_address);
    const shortToAddress = shortenAddress(item?.to_address);
    const shortTxHash = shortenAddress(item?.transaction_hash);

    setModalData({ ...item, shortAddress, shortTxHash, shortToAddress });

    $("#recent_table").modal('show');

  };


  const getDepostAddress = async (generate, selectedNetwork) => {
    setDepositAddress("");
    LoaderHelper.loaderStatus(true);
    await AuthService.generateAddress(generate, selectedNetwork).then((result) => {
      if (result?.success) {
        LoaderHelper.loaderStatus(false);
        try {
          setDepositAddress(result?.data);
        } catch (error) {
          LoaderHelper.loaderStatus(false);
        }
      }
      else {
        LoaderHelper.loaderStatus(false);
        alertErrorMessage(result?.message)
        setDepositAddress('');
      }
    });
  };

  const copytext = (data) => {
    navigator.clipboard.writeText(data);
    alertSuccessMessage("Copied!!");
  };


  const [announcments, setAnnouncments] = useState([]);
  const handleNotifications = async () => {
    LoaderHelper.loaderStatus(true);
    await AuthService.notifications().then(async (result) => {
      if (result?.data?.length > 0) {
        try {
          let announcement = result?.data?.filter((item) => item?.type === "announcement")
          if (announcement?.length === 1) {
            setAnnouncments([...announcement, ...announcement]);
          } else if (announcement?.length > 1) {
            setAnnouncments(announcement?.reverse());
          }

        } catch (error) {

        }
      }
    });
    LoaderHelper.loaderStatus(false);
  };

  useEffect(() => {
    if (searchPair) {
      const filteredPair = allData?.filter((item) => item?.short_name?.toLowerCase()?.includes(searchPair?.toLowerCase()));
      setAvailableCurrency(filteredPair)

    } else {
      setAvailableCurrency(allData)
    }
  }, [searchPair]);


  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    getDepositActiveCoins()
    allCoins()
    handleNotifications()
    depositHistory()
    handleVerifyDeposit()

  }, []);
  return (
    <>

      <div className="dashboard_right">
        <div className="deposit_crypto_block_coin">
          <div className="deposit_crypto_left">
            <div className={`select_coin_option ${Object.keys(selectedCurrency).length > 0 && "select-option"}`}>
              <h2>Select Coin</h2>
              <div className="search_icon_s" data-bs-toggle="modal" data-bs-target="#search_coin">
                <i className="ri-search-line"></i> {Object.keys(selectedCurrency).length > 0 ? `${selectedCurrency?.short_name} ${selectedCurrency?.name} ` : "Search Coin"}
              </div>
              {/* <!-- Modal Search Coin Start --> */}

              <div className="modal fade search_form search_coin search_form_modal_2" id="search_coin" tabIndex="-1" aria-labelledby="exampleModalLabel" >
                <div className="modal-dialog modal-dialog-centered">
                  <div className="modal-content">
                    <div className="modal-header">
                      <h4>Select Crypto</h4>
                      <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div className="modal-body">
                      <form>
                        <input type="text" placeholder="Search coin name " value={searchPair} onChange={(e) => setSearchPair(e.target.value)} />
                      </form>

                      <div className="hot_trading_t">
                        <div className='table-responsive'>
                          <table>
                            <tbody>
                              {availableCurrency?.length > 0 ? availableCurrency?.map((item) => {
                                return (
                                  <tr onClick={() => handleSelectDepositCoin(item)} data-bs-dismiss="modal" >
                                    <td>
                                      <div className="td_first">
                                        <div className="icon"><img src={ApiConfig?.baseImage + item?.icon_path} alt="icon" width="30px" /></div>
                                        <div className="price_heading"> {item?.short_name} <br /> </div>
                                      </div>
                                    </td>
                                    <td className="right_t price_tb">{item?.name}</td>
                                  </tr>
                                )
                              }) : ""}

                            </tbody>
                          </table>
                        </div>

                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* <!-- Modal Search Coin Start End --> */}

              <div className="coin_items_select">
                {allData?.slice(0, 4)?.map((item) => {
                  return (
                    <div className="coin_items_list" onClick={() => handleSelectDepositCoin(item)} >
                      <img src={ApiConfig?.baseImage + item?.icon_path} alt="icon" />{item?.short_name}
                    </div>
                  )
                })}
              </div>
            </div>
            <div className={`select_network_s ${selectedNetwork && "select-option"}`}>
              <h2>Select Network</h2>
              {Object.keys(selectedCurrency).length > 0 ? <div className="search_icon_s" data-bs-toggle="modal" data-bs-target="#network_pop_up">{selectedNetwork || "Select Network"}</div> : <div className="search_icon_s" >{selectedNetwork || "Select Network"}</div>}

              {/* <div className="d-flex items-center justify-content-between top_space">

                <div className="typography-body3">Contract address ending in</div>
                <a href="#">uSpse {">"}</a>

              </div> */}

              {/* <!-- Modal Network Pop Up Start --> */}

              <div className="modal fade search_form search_coin" id="network_pop_up" tabIndex="-1" aria-labelledby="exampleModalLabel">
                <div className="modal-dialog">
                  <div className="modal-content">
                    <div className="modal-header">
                      <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div className="modal-body">

                      <div className="network_top_p">
                        <svg className="bn-svg h-m w-m flex-shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path fillRule="evenodd" clip-rule="evenodd"
                            d="M12 21a9 9 0 100-18 9 9 0 000 18zm-1.25-5.5V18h2.5v-2.5h-2.5zm0-9.5v7h2.5V6h-2.5z" fill="currentColor">
                          </path></svg>
                        <p>Please note that only supported networks on Wrathcode Exchange platform are shown, if you deposit via another
                          network your assets may be lost.  </p>

                      </div>
                      <div className="hot_trading_t">
                        <div className='table-responsive'>
                          <table>
                            <tbody>
                              {selectedCurrency?.chain?.filter((chain) => selectedCurrency?.deposit_status?.[chain] === "ACTIVE").map((item) => {
                                const minDep = selectedCurrency?.min_deposit?.[item];
                                const maxDep = selectedCurrency?.max_deposit?.[item];
                                return (
                                  <tr key={item} onClick={() => handleSelectNetwork(item)} data-bs-dismiss="modal" >
                                    <td>
                                      <div className="td_first">
                                        <div className="price_heading"> {item} <br /> <span></span></div>
                                      </div>
                                    </td>
                                    <td className="right_t price_tb">
                                      {(minDep != null || maxDep != null) && (
                                        <>{minDep ?? "—"} - {maxDep ?? "—"} {selectedCurrency?.short_name}<br /></>
                                      )}
                                      <span>≈ 2 mins</span>
                                    </td>
                                  </tr>

                                )
                              })}

                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* <!-- Modal Network Pop Up End --> */}

            </div>
            <div className="select_network_s ">
              <h2 className={` ${selectedNetwork && "active_input"}`}>Deposit Address</h2>
              {isDepositDisabled ? (
                <div className="deposit_disabled_msg">
                  <p>Deposit is temporarily disabled. Please try again later.</p>
                </div>
              ) : depositAddress ?
                <>
                  <div className="deposit_address_s">

                    <div className="network_top_p">
                      <p>If you deposit via another network your assets may be lost</p>
                    </div>

                    <div className="d-flex items-center justify-content-between scaner_block_s">

                      <div className="typography-body3">

                        <div className="scan_img">
                          <QRCode value={depositAddress} className="qr_img img-fluid" width="50px" />
                          {/* <img src="/images/scan.png" alt="scan" /> */}
                        </div>
                      </div>
                      <div className="scan_cnt_l">
                        <span>Address</span>
                        <address>
                          <p>{depositAddress}</p>

                          <div className="scan_copy" onClick={() => { navigator.clipboard.writeText(depositAddress); alertSuccessMessage("Deposit Address Copied!!"); }}>
                            <svg id="deposit_crypto_address_copy" className="bn-svg icon-normal-pointer qrcode-copy text-IconNormal" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path fillRule="evenodd" clip-rule="evenodd" d="M9 3h11v13h-3V6H9V3zM4 8v13h11V8.02L4 8z" fill="currentColor"></path></svg>
                          </div>
                        </address>
                      </div>
                    </div>
                  </div>


                  <div className="more_btn" data-bs-toggle="modal" data-bs-target="#more_details">
                    More Details {">"}
                  </div>

                </> : selectedNetwork && <>



                  <div className="d-flex items-center justify-content-start scaner_block_s">


                    <div className={`col-sm-6 login_btn ${isDepositDisabled ? 'disabled' : ''}`} onClick={() => { if (isDepositDisabled) { alertWarningMessage('Deposit is temporarily disabled'); return; } getDepostAddress(true, selectedNetwork); }}>
                      <input type="button" value={isDepositDisabled ? "Deposit Disabled" : "Generate Address"} disabled={isDepositDisabled} />

                    </div>
                  </div>


                </>}

              {depositAddress && !isDepositDisabled && <> <div className="coin_items_select mt-5">

                {checkDepositStatus ?
                  <div className="spinner-border text-white" role="status">
                    <span className="sr-only"></span>
                  </div> :
                  <div className="col-sm-6 login_btn" onClick={() => { completeDeposit() }}>
                    <input type="button" value="Transfer Completed" />
                  </div>
                }

              </div>
                <small className="text-success" >
                  {checkDepositStatus ? "Transaction in progress! Blockchain validation is underway. This may take a few minutes" : "Click here once transaction status completed on your end"}
                </small>
              </>}

              {/* <!-- Modal scaner more details Pop Up Start --> */}

              <div className="modal fade search_form search_coin" id="more_details" tabIndex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
                <div className="modal-dialog modal-dialog-centered">
                  <div className="modal-content">
                    <div className="modal-header">
                      <h2>More Info</h2>
                      <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div className="modal-body">
                      <div className="hot_trading_t">
                        <div className='table-responsive'>
                          <table>
                            <tbody>
                              <tr>
                                <td>Minimum deposit</td>
                                <td className="right_t price_tb"> {typeof selectedCurrency?.min_deposit === 'object' ? (selectedCurrency?.min_deposit?.[selectedNetwork] ?? '—') : selectedCurrency?.min_deposit} {selectedCurrency?.short_name}</td>
                              </tr>
                              <tr>
                                <td>Maximum deposit</td>
                                <td className="right_t price_tb">{typeof selectedCurrency?.max_deposit === 'object' ? (selectedCurrency?.max_deposit?.[selectedNetwork] ?? '—') : selectedCurrency?.max_deposit} {selectedCurrency?.short_name}</td>
                              </tr>
                              <tr>
                                <td>Wallet</td>
                                <td className="right_t price_tb">Main Wallet</td>
                              </tr>
                              <tr>
                                <td>Credited (Trading enabled)</td>
                                <td className="right_t price_tb">After 2 network confirmations</td>
                              </tr>
                              <tr>
                                <td>Do not send NFTs to this address</td>
                              </tr>
                              <tr>
                                <td>Do not transact with Sanctioned Entities</td>
                              </tr>
                              <tr>
                                <td>This is {selectedNetwork} deposit address type. Transferring to an unsupported network could result in loss of deposit.</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* <!-- Modal  scaner more details Pop Up End --> */}

            </div>
          </div>

          <div className="deposit_crypto_right">
            <h2>FAQ</h2>

            <div className="accordion accordion-flush" id="accordionFlushExample">
              <div className="accordion-item">
                <h2 className="accordion-header">
                  <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#flush-collapseOne" aria-expanded="false" aria-controls="flush-collapseOne">
                    How to deposit crypto?
                  </button>
                </h2>
                <div id="flush-collapseOne" className="accordion-collapse collapse" data-bs-parent="#accordionFlushExample">
                  <div className="accordion-body">To deposit cryptocurrency, you need to send it from your external wallet to the deposit address provided by Wrathcode Exchange platform. Always double-check the address and network before confirming the transaction.</div>
                </div>
              </div>
              <div className="accordion-item">
                <h2 className="accordion-header">
                  <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#flush-collapseTwo" aria-expanded="false" aria-controls="flush-collapseTwo">
                    How to Deposit Crypto Step-by-step Guide
                  </button>
                </h2>
                <div id="flush-collapseTwo" className="accordion-collapse collapse" data-bs-parent="#accordionFlushExample">
                  <div className="accordion-body"><ul>
                    <li><strong>Go to Deposit Section</strong> – Navigate to the deposit page on Wrathcode Exchange platform.</li>
                    <li><strong>Select Your Crypto</strong> – Choose the cryptocurrency you want to deposit.</li>
                    <li><strong>Copy the Deposit Address</strong> – Ensure you copy the correct address and network.</li>
                    <li><strong>Send Funds</strong> – Paste the address into your external wallet and send the amount.</li>
                    <li><strong>Wait for Confirmation</strong> – Blockchain transactions may take time depending on network congestion.</li>
                  </ul>
                  </div>
                </div>
              </div>
              <div className="accordion-item">
                <h2 className="accordion-header">
                  <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#flush-collapseThree" aria-expanded="false" aria-controls="flush-collapseThree">
                    Deposit hasn't arrived?
                  </button>
                </h2>
                <div id="flush-collapseThree" className="accordion-collapse collapse" data-bs-parent="#accordionFlushExample">
                  <div className="accordion-body"> <ul>
                    <li><strong>Check Transaction Status</strong> – Use a blockchain explorer to track the transaction.</li>
                    <li><strong>Verify the Network</strong> – Ensure you sent funds using the correct blockchain network.</li>
                    <li><strong>Confirm Minimum Deposit Amount</strong> – Some cryptocurrency have a minimum deposit limit.</li>
                    <li><strong>Contact Support</strong> – If it’s been a long time, reach out to customer support with transaction details.</li>
                  </ul></div>
                </div>
              </div>
            </div>
            {/* <div className="news_announcement">
              <div className="announcements_top">
                <h2>Announcements</h2>
                <a href="/announcment_info">More &gt;</a>

              </div>
              {announcments?.length > 0 &&

                <marquee behavior="scroll" direction="down" scrollamount="3">

                  <div className="announcement_block">
                    {announcments?.map((item) => {
                      return (
                        <div>
                          <p>{item?.title}</p>

                          <span>{moment(item.updatedAt).format("DD-MM-YYYY  hh:ss A")}</span>

                        </div>
                      )
                    })}
                  </div>
                </marquee>
              }
            </div> */}
          </div>
        </div>

        <div className="recent_deposit_list">
          <div className="top_heading">
            <h4>
              Recent Deposits
              {loadingDeposit &&
                <small className="ms-2 fetching_deposit_text">
                  Syncing recent deposits   <div className="spinner-border spinner-border-sm text-primary ms-1" role="status" aria-hidden="true"></div>
                </small>}
            </h4>
            <a className="more_btn" href="/user_profile/transaction_history">More &gt;</a>
          </div>
          <div className="table_outer">
            {(() => {
              function shortenAddress(address, length = 4) {
                if (!address || address.length < 10) return address;
                return `${address.slice(0, length + 2)}...${address.slice(-length)}`;
              }
              const CopyIcon = () => (
                <svg className="bn-svg icon-small-pointer" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style={{ width: 18, height: 18, cursor: 'pointer', flexShrink: 0 }}>
                  <path fillRule="evenodd" clipRule="evenodd" d="M9 3h11v13h-3V6H9V3zM4 8v13h11V8.02L4 8z" fill="currentColor" />
                </svg>
              );
              const noDataRow = (
                <tr rowSpan="5" className="no-data-row2">
                  <td colSpan="12">
                    <div className="no-data-wrapper">
                      <div className="no_data_vector">
                        <img src="/images/Group 1171275449 (1).svg" alt="no-data" />
                      </div>
                    </div>
                  </td>
                </tr>
              );
              return (
                <>
                  {/* Desktop: table */}
                  <div className="withdraw_history_desktop">
                    <div className="table-responsive">
                      <table>
                        <tbody>
                          {recentDepositHistory?.length > 0 ? recentDepositHistory?.map((item) => {
                            const shortAddress = shortenAddress(item?.from_address);
                            const shortTxHash = shortenAddress(item?.transaction_hash);
                            const filteredImageData = allCoinData?.filter((data) => data?.short_name === item?.short_name)[0] || [];
                            return (
                              <tr key={item?._id || item?.updatedAt}>
                                <td>
                                  <div className="td_first">
                                    <div className="price_heading">
                                      <img width="30px" src={Object?.keys(filteredImageData)?.length > 0 ? ApiConfig?.baseImage + filteredImageData?.icon_path : ""} alt="icon" />
                                      {item?.amount} {item?.currency} <span>Completed</span>
                                    </div>
                                    <div className="date_info"><span>Date</span>{moment(item.updatedAt).format("DD-MM-YYYY  hh:ss A")}</div>
                                  </div>
                                </td>
                                <td>Network <span>{item?.chain || "Internal transfer"}</span></td>
                                <td>Address <div className="address_icon"><span>{shortAddress || "----"}</span>
                                  {shortAddress && <span onClick={() => copytext(item?.from_address)}><CopyIcon /></span>}
                                </div></td>
                                <td>TxID <div className="address_icon"><span>{shortTxHash || "----"}</span>
                                  {shortTxHash && <span onClick={() => copytext(item?.transaction_hash)}><CopyIcon /></span>}
                                </div></td>
                                <td className="right_t">Deposit wallet<span>{item?.description?.includes("bonus") ? "Bonus Wallet" : "Main Wallet"}</span></td>
                                <td onClick={() => handleDepositModal(item)}>View</td>
                              </tr>
                            );
                          }) : noDataRow}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Mobile: card list */}
                  <div className="withdraw_history_mobile">
                    {recentDepositHistory?.length > 0 ? (
                      <div className="withdraw_cards_list">
                        {recentDepositHistory?.map((item) => {
                          const shortAddress = shortenAddress(item?.from_address);
                          const shortTxHash = shortenAddress(item?.transaction_hash);
                          const filteredImageData = allCoinData?.filter((data) => data?.short_name === item?.short_name)[0] || [];
                          return (
                            <div key={item?._id || item?.updatedAt} className="withdraw_card_item">
                              <div className="withdraw_card_header">
                                <div className="withdraw_card_title">
                                  <img width="32" height="32" src={Object?.keys(filteredImageData)?.length > 0 ? ApiConfig?.baseImage + filteredImageData?.icon_path : ""} alt="" />
                                  <span className="withdraw_amount">{item?.amount} {item?.currency}</span>
                                  <span className="withdraw_status text-success">Completed</span>
                                </div>
                                <div className="withdraw_card_date">
                                  <span className="label">Date</span> {moment(item.updatedAt).format("DD-MM-YYYY  hh:ss A")}
                                </div>
                              </div>
                              <div className="withdraw_card_row">
                                <span className="label">Network</span>
                                <span>{item?.chain || "Internal transfer"}</span>
                              </div>
                              <div className="withdraw_card_row address_icon">
                                <span className="label">Address</span>
                                <span className="value">{shortAddress || "----"}  {shortAddress && <span onClick={() => copytext(item?.from_address)} aria-label="Copy"><CopyIcon /></span>}</span>
                              
                              </div>
                              <div className="withdraw_card_row address_icon">
                                <span className="label">TxID</span>
                                <span className="value">{shortTxHash || "----"} {shortTxHash && <span onClick={() => copytext(item?.transaction_hash)} aria-label="Copy"><CopyIcon /></span>}</span>
                               
                              </div>
                              <div className="withdraw_card_row">
                                <span className="label">Deposit wallet</span>
                                <span>{item?.description?.includes("bonus") ? "Bonus Wallet" : "Main Wallet"}</span>
                              </div>
                              <div className="withdraw_card_footer">
                                <button type="button" className="withdraw_card_view_btn" onClick={() => handleDepositModal(item)}>View</button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="no-data-wrapper">
                        <div className="no_data_vector">
                          <img src="/images/Group 1171275449 (1).svg" alt="no-data" />
                        </div>
                      </div>
                    )}
                  </div>
                </>
              );
            })()}
          </div>
          {/* <!-- Modal table recent Pop Up Start --> */}
          <div className="modal fade search_form table_pop_up search_form_modal_2" id="recent_table" tabIndex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h2>Deposit Details</h2>
                  <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div className="modal-body">
                  <div className="hot_trading_t">
                    <div className='table-responsive'>
                      <table>
                        <tbody>
                          <tr>
                            <td>Status</td>
                            <td className="right_t price_tb text-success">Completed</td>
                          </tr>
                          <tr>
                            <td>Date</td>
                            <td className="right_t price_tb">{moment(modalData?.updatedAt).format("DD-MM-YYYY  hh:ss A")}</td>
                          </tr>
                          <tr>
                            <td>Coin</td>
                            <td className="right_t price_tb">{modalData?.short_name}</td>
                          </tr>
                          <tr>
                            <td>Deposit amount</td>
                            <td className="right_t price_tb">{modalData?.amount} {modalData?.short_name}</td>
                          </tr>
                          <tr>
                            <td>Network</td>
                            <td className="right_t price_tb">{modalData?.chain || "Internal Transaction"}</td>
                          </tr>
                          <tr>
                            <td>From Address</td>
                            <td className="right_t price_tb"><div className="address_icon"><span>{modalData?.shortAddress || "----"}</span>
                              <svg className="bn-svg icon-small-pointer mobile:icon-normal-pointer mobile:text-IconNormal" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" onClick={() => copytext(modalData?.from_address)}>
                                <path fillRule="evenodd" clip-rule="evenodd" d="M9 3h11v13h-3V6H9V3zM4 8v13h11V8.02L4 8z" fill="currentColor"></path></svg></div></td>
                          </tr>
                          <tr>
                            <td>Deposit Address</td>
                            <td className="right_t price_tb"><div className="address_icon"><span>{modalData?.shortToAddress || "----"}</span>
                              <svg className="bn-svg icon-small-pointer mobile:icon-normal-pointer mobile:text-IconNormal" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" onClick={() => copytext(modalData?.to_address)}>
                                <path fillRule="evenodd" clip-rule="evenodd" d="M9 3h11v13h-3V6H9V3zM4 8v13h11V8.02L4 8z" fill="currentColor"></path></svg>
                            </div></td>
                          </tr>
                          <tr>
                            <td>TxID</td>
                            <td className="right_t price_tb"><div className="address_icon"><span>{modalData?.shortTxHash || "----"}</span>
                              <svg className="bn-svg icon-small-pointer mobile:icon-normal-pointer mobile:text-IconNormal" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" onClick={() => copytext(modalData?.transaction_hash)}>
                                <path fillRule="evenodd" clip-rule="evenodd" d="M9 3h11v13h-3V6H9V3zM4 8v13h11V8.02L4 8z" fill="currentColor"></path></svg></div></td>
                          </tr>
                          <tr>
                            <td>Deposit wallet</td>
                            <td className="right_t price_tb">{modalData?.description?.includes("bonus") ? "Bonus Wallet" : "Main Wallet"}</td>
                          </tr>
                          <tr>
                            <td>Description</td>
                            <td className="right_t price_tb">{modalData?.description}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    {/* <p className="help_chat"><a href="/user_profile/support">Help? Chat with us</a></p> */}

                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* <!-- Modal  table recent Pop Up End --> */}

        </div>
      </div>

      {/* <!-- Modal  Deposit Confirmed--> */}
      <div className="modal fade search_form table_pop_up search_form_modal_2" id="deposit_confirmed" tabIndex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Deposit Confirmed <i className="ri-shield-check-line text-success"></i></h2>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div className="modal-body">
              <div className="withdrawal_top_list deposit_dropdown">
                <div className="bn_step_content">
                  <h5>Deposit order submitted</h5>
                  <span>{moment(modalData.createdAt).format("DD-MM-YYYY  hh:ss A")}</span>
                </div>
                <div className="bn_step_content">
                  <h5>System processing</h5>
                  <span>{moment(modalData.createdAt).format("DD-MM-YYYY  hh:ss A")}</span>
                </div>
                <div className="bn_step_content ">
                  <h5 >Deposit completed</h5>
                  <span>{moment(modalData.updatedAt).format("DD-MM-YYYY  hh:ss A")}</span>
                </div>
              </div>
              <div className="hot_trading_t">
                <div className='table-responsive'>
                  <table>
                    <tbody>
                      <tr>
                        <td>Status</td>
                        <td className="right_t price_tb">
                          <span className="green">Completed</span>
                        </td>
                      </tr>
                      <tr>
                        <td>Coin</td>
                        <td className="right_t price_tb">{modalData?.short_name}</td>
                      </tr>
                      <tr>
                        <td>Deposited amount</td>
                        <td className="right_t price_tb">{modalData?.amount}</td>
                      </tr>
                      <tr>
                        <td>Network</td>
                        <td className="right_t price_tb">{modalData?.chain}</td>
                      </tr>
                      <tr>
                        <td>TxID</td>
                        <td className="right_t price_tb"><div className="address_icon"><span>{modalData?.shortTxHash?.trim() || "----"}</span>
                        </div></td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* <p className="help_chat"><a href="/user_profile/support">Help? Chat with us</a></p> */}

              </div>
            </div>
          </div>
        </div>
      </div>
      {/* <!-- Modal  table recent Pop Up End --> */}
    </>
  )
}

export default DepositPage
