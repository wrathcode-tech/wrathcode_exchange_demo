import React, { useContext, useEffect, useState } from 'react'
import AuthService from '../../../api/services/AuthService';
import { ApiConfig } from '../../../api/apiConfig/apiConfig';
import { $ } from 'react-jquery-plugin';
import { alertErrorMessage, alertSuccessMessage } from '../../../customComponents/CustomAlertMessage';
import LoaderHelper from '../../../customComponents/Loading/LoaderHelper';
import moment from 'moment';
import { ProfileContext } from '../../../context/ProfileProvider';
import { usePlatformStatus } from '../../../context/PlatformStatusProvider';

const WithdrawPage = (props) => {
  const { getStatus } = usePlatformStatus();
  const isWithdrawalDisabled = !getStatus('withdrawal').enabled;

  const [availableCurrency, setAvailableCurrency] = useState([]);
  const [allData, setAllData] = useState([]);
  const [searchPair, setSearchPair] = useState("");
  const [selectedCurrency, setSelectedCurrency] = useState({});
  const [recentWithdrawHistory, setRecentWithdrawHistory] = useState([]);
  const [selectedNetwork, setSelectedNetwork] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawAddress, setWithdrawAddress] = useState("");
  const [availableBalance, setAvailableBalance] = useState("");
  const [fundData, setFundData] = useState([]);
  const [disableBtn, setDisbaleBtn] = useState(false);
  const [timer, setTimer] = useState(0);
  const [emailId, setEmailId] = useState("");
  const [isValidWalletAddress, setIsValidWalletAddress] = useState(true);
  const [otp, setotp] = useState();
  const [allCoinData, setAllCoinData] = useState([]);
  const [modalData, setModalData] = useState({});

  const getwithdrawActiveCoins = async () => {
    await AuthService.withdrawActiveCoins().then(async (result) => {
      if (result?.success) {
        try {
          setAvailableCurrency(result?.data)
          setAllData(result?.data)

        } catch (error) {

        }
      }
    });
  };

  const allCoins = async () => {
    await AuthService.allCoins().then(async (result) => {
      if (result?.success) {
        try {
          setAllCoinData(result?.data)

        } catch (error) {

        }
      }
    });
  };

  const handleWithdrawModal = (item) => {

    function shortenAddress(address, length = 4) {
      if (!address || address.length < 10) return address; // Ensure it's a valid address
      return `${address.slice(0, length + 2)}...${address.slice(-length)}`;
    }
    const shortAddress = shortenAddress(item?.from_address);
    const shortToAddress = shortenAddress(item?.to_address);
    const shortTxHash = shortenAddress(item?.transaction_hash);

    setModalData({ ...item, shortAddress, shortTxHash, shortToAddress });

    $("#recent_table").modal('show');

  };



  const withdrawHistory = async () => {
    await AuthService.withdrawalHistory(0, 5).then(async (result) => {
      if (result?.success) {
        try {
          setRecentWithdrawHistory(result?.data)

        } catch (error) {

        }
      }
    });
  };

  const handleSelectDepositCoin = async (item) => {
    if (fundData?.length === 0) {
      const fundData = await handleUserFunds();
      if (!fundData) {
        alertErrorMessage("Some error occured. Please try again later.")
        return;
      }
    }
    setSelectedCurrency(item);
    setSelectedNetwork("");
    setWithdrawAmount("")
    $("#search_coin").modal('hide');


  };

  const getChainValue = (field, chain) => {
    const val = selectedCurrency?.[field];
    if (typeof val === 'object' && val !== null) return chain ? val?.[chain] : undefined;
    return val;
  };

  const handleSelectNetwork = (item) => {
    setSelectedNetwork(item);
    $("#network_pop_up").modal('hide');

  };

  const handleMaxWithdrawal = () => {
    setWithdrawAmount(availableBalance || 0)
  }


  const handleUserFunds = async () => {
    try {
      LoaderHelper.loaderStatus(true)
      const result = await AuthService.getUserfunds("main")
      if (result?.success) {
        setFundData(result?.data);
        return true
      }
    } catch (error) {
    } finally { LoaderHelper.loaderStatus(false) }

  };

  const handleWithdrawalAddress = (e) => {
    const address = e.target.value;
    setWithdrawAddress(address);
    let isValid = false;
    let regexPattern = /^$/;

    if (selectedNetwork === "BEP20" || selectedNetwork === "ERC20" || selectedNetwork === "POLYGON") {
      regexPattern = /^0x[a-fA-F0-9]{40}$/;
    } else if (selectedNetwork === "TRC20") {
      regexPattern = /^T[a-zA-Z0-9]{33}$/;
    }



    isValid = regexPattern.test(address);

    if (!isValid && address.length > 0) {
      setIsValidWalletAddress(false)
    } else {
      setIsValidWalletAddress(true)
    }
  }

  const handleGetOtp = async (emailId, resend) => {
    const fee = getChainValue('withdrawal_fee', selectedNetwork);
    if (!selectedCurrency || !selectedNetwork || availableBalance < fee || withdrawAmount > availableBalance || !withdrawAmount || withdrawAmount - fee < 0) {
      return;
    }

    if (!emailId || emailId === "") {
      alertErrorMessage("Please update email in profile section")
      return
    }
    LoaderHelper.loaderStatus(true);
    await AuthService.getOtp(emailId, resend).then(async (result) => {
      LoaderHelper.loaderStatus(false);
      if (result.success) {
        try {
          alertSuccessMessage(`OTP sent to ${emailId}`);
          setDisbaleBtn(true);
          setTimer(30);
        } catch (error) {
          alertErrorMessage(error);
        }
      } else {
        LoaderHelper.loaderStatus(false);
        alertErrorMessage(result.message);
      }
    });
  };

  const handleResetInput = () => {
    setSelectedCurrency({});
    setWithdrawAddress("");
    setWithdrawAmount("");
    setotp("");
    setSelectedNetwork("");
  };

  const [announcments, setAnnouncments] = useState([]);
  const handleNotifications = async () => {
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
  };


  const handleWithdrawCurrency = async () => {
    if (isWithdrawalDisabled) return;
    const fee = getChainValue('withdrawal_fee', selectedNetwork);
    if (Object.keys(selectedCurrency).length < 0 || !withdrawAddress || !selectedNetwork || availableBalance < fee || withdrawAmount > availableBalance || !withdrawAmount || !otp || !isValidWalletAddress) {
      return;
    }
    LoaderHelper.loaderStatus(true);
    await AuthService.withdrawalCurrency(withdrawAddress, withdrawAmount, otp, { chain: selectedNetwork, name: selectedCurrency?.short_name }, emailId).then(async (result) => {
      LoaderHelper.loaderStatus(false);
      if (result.success) {
        try {
          if (result?.message === "please send otp first") {
            alertErrorMessage("Please send otp first");
          } else {
            alertSuccessMessage(result.message);
            handleResetInput();
            handleUserFunds();
            withdrawHistory();
          }
        } catch (error) {
          alertErrorMessage(error);
        }
      } else {
        LoaderHelper.loaderStatus(false);
        alertErrorMessage(result.message);
        $('#Withdraw_modal').modal('show');
      }
    });
  };

  const copytext = (data) => {
    navigator.clipboard.writeText(data);
    alertSuccessMessage("Copied!!");
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
    let interval;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      setDisbaleBtn(false);
    }
    return () => clearInterval(interval);
  }, [timer]);


  useEffect(() => {
    setEmailId(props?.userDetails?.emailId);
  }, [props]);



  useEffect(() => {
    if (fundData?.length > 0 && Object.keys(selectedCurrency).length > 0) {
      let filteredData = fundData?.filter((item) => item?.currency_id === selectedCurrency?._id)[0]
      if (Object.keys(filteredData).length > 0) {
        setAvailableBalance(filteredData?.balance)
      }
    }

  }, [fundData, selectedCurrency]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    getwithdrawActiveCoins()
    handleNotifications()
    withdrawHistory()
    allCoins()

  }, []);



  return (
    <>
  
      <div className="dashboard_right">

        <div className="deposit_crypto_block_coin">

          <div className="deposit_crypto_left withdrawal_outer">


            <div className={`select_coin_option ${Object.keys(selectedCurrency).length > 0 && "select-option"}`}>

              <h2>Select Coin</h2>

              <div className="search_icon_s" data-bs-toggle="modal" data-bs-target="#search_coin">
                <img src="/images/search_icon.svg" alt="search" /> {Object.keys(selectedCurrency).length > 0 ? `${selectedCurrency?.short_name} ${selectedCurrency?.name} ` : "Search Coin"}
              </div>



              {/* <!-- Modal Search Coin Start --> */}

              <div className="modal fade search_form search_coin search_form_modal_2" id="search_coin" tabIndex="-1" aria-labelledby="exampleModalLabel" >
                <div className="modal-dialog">
                  <div className="modal-content">
                    <div className="modal-header">
                      <h5>Select Crypto</h5>
                      <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div className="modal-body">
                      <form>
                        <input type="text" placeholder="Search coin name" value={searchPair} onChange={(e) => setSearchPair(e.target.value)} />
                      </form>

                      <div className="hot_trading_t">



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




            <div className={`select_network_s ${(selectedNetwork && withdrawAddress && isValidWalletAddress) && "select-option"}`}>

              <h2>Withdraw to</h2>
              {Object.keys(selectedCurrency).length > 0 ? <div className="search_icon_s" data-bs-toggle="modal" data-bs-target="#network_pop_up">{selectedNetwork || "Select Network"}</div> : <div className="search_icon_s" >{selectedNetwork || "Select Network"}</div>}




              <div className="address_input ">
                <input type="text" placeholder="Enter Address" onChange={handleWithdrawalAddress} value={withdrawAddress} disabled={!selectedNetwork} />
                <div className="icon_cnt">
                  <svg className="bn-svg icon-normal-pointer text-IconNormal" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M6.25 4.41h-3v3h3v-3zM6.25 10.41h-3v3h3v-3zM6.25 16.41h-3v3h3v-3z" fill="currentColor"></path>
                    <path fillRule="evenodd" clip-rule="evenodd" d="M20.75 20h-12V4h12v16zm-6-8.521a1.872 1.872 0 100-3.745 1.872 1.872 0 000 
      3.745zm-1.338 1.07c-.886 
      0-1.604.718-1.604 1.604v1.605h5.884v-1.605c0-.886-.719-1.605-1.605-1.605h-2.675z" fill="currentColor"></path></svg>
                </div>
                <div className="d-flex items-center top_space opt_cnt">



                </div>
              </div>
              {!isValidWalletAddress && <p className="red"><strong>Invalid wallet address for the selected network!</strong></p>}



              {/* <div className="d-flex items-center justify-content-between top_space">

                <div className="typography-body3">Contract address ending in</div>
                <a href="#">uSpse {">"}</a>

              </div> */}
              {selectedNetwork && <p>The network you selected is {selectedNetwork}, please ensure that the withdrawal address supports the {selectedNetwork} network. You will potentially lose your assets if the chosen plateform does not support
                refunds of wrongfully deposited assets.
              </p>}




              {/* <!-- Modal Network Pop Up Start --> */}

              <div className="modal fade search_form search_coin" id="network_pop_up" tabIndex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
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
                        <p>Only supported networks on the Wrathcode platform are shown. If you provide an address from an unsupported network, your withdrawal request may be rejected. </p>

                      </div>


                      <div className="hot_trading_t">



                        <table>
                          <tbody>
                            {selectedCurrency?.chain?.filter((chain) => selectedCurrency?.withdrawal_status?.[chain] === "ACTIVE").map((item) => {
                              const minWith = selectedCurrency?.min_withdrawal?.[item];
                              const maxWith = selectedCurrency?.max_withdrawal?.[item];
                              return (
                                <tr key={item} onClick={() => handleSelectNetwork(item)} data-bs-dismiss="modal" >
                                  <td>
                                    <div className="td_first">
                                      <div className="price_heading"> {item} <br /> <span></span></div>
                                    </div>
                                  </td>
                                  <td className="right_t price_tb">
                                    {(minWith != null || maxWith != null) && (
                                      <>{minWith ?? "—"} - {maxWith ?? "—"} {selectedCurrency?.short_name}<br /></>
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

              {/* <!-- Modal Network Pop Up End --> */}

            </div>





            <div className={`select_network_s  ${withdrawAmount > 0 && "select-option"}`}>

              <h2>Withdraw amount</h2>

              <div className="withdraw_input">
                <input type="text" onWheel={(e) => e.target.blur()} placeholder={`Minimal ${getChainValue('min_withdrawal', selectedNetwork) ?? 0}`} disabled={Object.keys(selectedCurrency).length <= 0 || !isValidWalletAddress || !withdrawAddress} onChange={(e) => { setWithdrawAmount(e.target.value) }} value={withdrawAmount} />
                <div className="amount_sysmble">
                  {selectedCurrency?.short_name} <span className='max' onClick={handleMaxWithdrawal}>MAX</span>
                </div>
              </div>

              <div className="d-flex items-center top_space opt_cnt">

                {(availableBalance < (getChainValue('withdrawal_fee', selectedNetwork) ?? 0) || withdrawAmount > availableBalance) && <p className="red"><strong>Insufficient funds</strong></p>}

              </div>



              <div className="withdraw_amount_cnt">

                <div className="d-flex items-center justify-content-between top_space">

                  <div className="typography-body3">Available Balance</div>
                  <p><strong>{availableBalance} {selectedCurrency?.short_name}</strong></p>

                </div>


                <div className="d-flex items-center justify-content-between top_space">

                  <div className="typography-body3">Withdrawal Fee</div>
                  <p><strong>{getChainValue('withdrawal_fee', selectedNetwork) ?? '—'} {selectedCurrency?.short_name}</strong></p>

                </div>
                <div className="d-flex items-center justify-content-between top_space">

                  <div className="typography-body3">Maximum Withdrawal</div>
                  <p><strong>{getChainValue('max_withdrawal', selectedNetwork) ?? '—'} {selectedCurrency?.short_name}</strong></p>

                </div>
              </div>


            </div>




            <div className={` select_network_s `}>

              <h2 className={`  ${otp > 0 && "active_input"}`}> OTP Verification</h2>

              <div className="withdraw_input">
                <input type="text" placeholder="Get Code" value={otp} onWheel={(e) => e.target.blur()} onChange={(e) => setotp(e.target.value)} />
                <div className="amount_sysmble get_otp2" disabled={disableBtn} onClick={() => handleGetOtp(emailId, disableBtn)}>
                  {disableBtn ? `Resend OTP (${timer}s)` : "GET OTP"}
                </div>

              </div>


              {/* <div className="d-flex items-center top_space opt_cnt">
                <div className="typography-body3">Available Withdraw</div>
                <p className="red"><strong>9.43657657 USDT</strong></p>

              </div> */}



            </div>


            <div className="total_amount">

              <div className="amount_cnt_l">

                <div className="price_tag_top">
                  Receive amount
                </div>

                <div className="price_tag">
                  {withdrawAmount - (getChainValue('withdrawal_fee', selectedNetwork) ?? 0) < 0 ? 0 : (withdrawAmount - (getChainValue('withdrawal_fee', selectedNetwork) ?? 0) || "---")} {selectedCurrency?.short_name}
                </div>
                <div className="net_fee_t">
                  Network Fee {getChainValue('withdrawal_fee', selectedNetwork) ?? '—'} {selectedCurrency?.short_name}
                </div>
              </div>

              <div className="withdraw_btn">
                <button type='button' onClick={handleWithdrawCurrency} disabled={isWithdrawalDisabled}>{isWithdrawalDisabled ? 'Withdrawal Disabled' : 'Withdraw'}</button>
              </div>

            </div>

          </div>



          <div className="deposit_crypto_right">

            <h2>FAQ</h2>

            <div className="accordion accordion-flush" id="accordionFlushExample">
              <div className="accordion-item">
                <h2 className="accordion-header">
                  <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#flush-collapseOne" aria-expanded="false" aria-controls="flush-collapseOne">
                    How to Withdraw Crypto?
                  </button>
                </h2>
                <div id="flush-collapseOne" className="accordion-collapse collapse" data-bs-parent="#accordionFlushExample">
                  <div className="accordion-body">To withdraw crypto, go to the withdrawal section, select your cryptocurrency, enter the recipient wallet address, choose the correct network, and specify the amount. Review the details carefully before confirming the withdrawal. Processing time may vary based on network congestion and withdrawal policies.</div>
                </div>
              </div>
              <div className="accordion-item">
                <h2 className="accordion-header">
                  <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#flush-collapseTwo" aria-expanded="false" aria-controls="flush-collapseTwo">
                    How to Withdraw Crypto Step-by-step Guide
                  </button>
                </h2>
                <div id="flush-collapseTwo" className="accordion-collapse collapse" data-bs-parent="#accordionFlushExample">
                  <div className="accordion-body"><ul>
                    <li><strong>Go to the Withdrawal Section</strong> – Navigate to the withdrawal page.</li>
                    <li><strong>Select Your Crypto</strong> – Choose the cryptocurrency you want to withdraw.</li>
                    <li><strong>Enter the Wallet Address</strong> – Make sure the address is correct and belongs to the selected blockchain network.</li>
                    <li><strong>Choose the Network</strong> – Select the correct blockchain network (e.g., BEP20, ERC20, TRC20, Polygon).</li>
                    <li><strong>Enter the Amount</strong> – Specify the amount you want to withdraw, ensuring it meets the minimum withdrawal limit.</li>
                    <li><strong>Confirm & Submit</strong> – Review all details carefully and confirm the withdrawal.</li>
                    <li><strong>Wait for Processing</strong> – Withdrawals are processed based on network congestion and request approval.</li>
                  </ul></div>
                </div>
              </div>
              <div className="accordion-item">
                <h2 className="accordion-header">
                  <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#flush-collapseThree" aria-expanded="false" aria-controls="flush-collapseThree">
                    Withdrawal hasn't arrived?
                  </button>
                </h2>
                <div id="flush-collapseThree" className="accordion-collapse collapse" data-bs-parent="#accordionFlushExample">
                  <div className="accordion-body"><ul>
                    <li><strong>Check Transaction Status</strong> – Use a blockchain explorer to track the transaction.</li>
                    <li><strong>Verify the Wallet Address</strong> – Ensure the recipient address is correct.</li>
                    <li><strong>Confirm Network Selection</strong> – The chosen network should match the recipient's wallet.</li>
                    <li><strong>Check for Pending Processing</strong> – Some withdrawals require manual approval.</li>
                  </ul></div>
                </div>
              </div>
            </div>


          </div>



        </div>





        <div className="recent_deposit_list">


          <div className="top_heading">
            <h4>Recent Withdrawals</h4>
            <a className="more_btn" href="#">More &gt;</a>
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
                    <table>
                      <tbody>
                        {recentWithdrawHistory?.length > 0 ? recentWithdrawHistory?.map((item) => {
                          const shortAddress = shortenAddress(item?.to_address);
                          const shortTxHash = shortenAddress(item?.transaction_hash);
                          const filteredImageData = allCoinData?.filter((data) => data?.short_name === item?.short_name)[0] || [];
                          return (
                            <tr key={item?._id || item?.createdAt}>
                              <td>
                                <div className="td_first">
                                  <div className="price_heading">
                                    <img width="30px" src={Object?.keys(filteredImageData)?.length > 0 ? ApiConfig?.baseImage + filteredImageData?.icon_path : ""} alt="icon" />
                                    {item?.amount} {item?.currency}{' '}
                                    <span className={`text-${item?.status === "REJECTED" ? "danger" : item?.status === "COMPLETED" ? "success" : "warning"}`}>{item?.status}</span>
                                  </div>
                                  <div className="date_info"><span>Date</span>{moment(item.createdAt).format("DD-MM-YYYY  hh:ss A")}</div>
                                </div>
                              </td>
                              <td>Network <span>{item?.chain || "Internal transfer"}</span></td>
                              <td>Address <div className="address_icon"><span>{shortAddress || "----"}</span>
                                {shortAddress && <span onClick={() => copytext(item?.to_address)}><CopyIcon /></span>}
                              </div></td>
                              <td>TxID <div className="address_icon"><span>{shortTxHash || "----"}</span>
                                {shortTxHash && <span onClick={() => copytext(item?.transaction_hash)}><CopyIcon /></span>}
                              </div></td>
                              <td onClick={() => handleWithdrawModal(item)}>View</td>
                            </tr>
                          );
                        }) : noDataRow}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile: card list */}
                  <div className="withdraw_history_mobile">
                    {recentWithdrawHistory?.length > 0 ? (
                      <div className="withdraw_cards_list">
                        {recentWithdrawHistory?.map((item) => {
                          const shortAddress = shortenAddress(item?.to_address);
                          const shortTxHash = shortenAddress(item?.transaction_hash);
                          const filteredImageData = allCoinData?.filter((data) => data?.short_name === item?.short_name)[0] || [];
                          return (
                            <div key={item?._id || item?.createdAt} className="withdraw_card_item">
                              <div className="withdraw_card_header">
                                <div className="withdraw_card_title">
                                  <img width="32" height="32" src={Object?.keys(filteredImageData)?.length > 0 ? ApiConfig?.baseImage + filteredImageData?.icon_path : ""} alt="" />
                                  <span className="withdraw_amount">{item?.amount} {item?.currency}</span>
                                  <span className={`withdraw_status text-${item?.status === "REJECTED" ? "danger" : item?.status === "COMPLETED" ? "success" : "warning"}`}>{item?.status}</span>
                                </div>
                                <div className="withdraw_card_date">
                                  <span className="label">Date</span> {moment(item.createdAt).format("DD-MM-YYYY  hh:ss A")}
                                </div>
                              </div>
                              <div className="withdraw_card_row">
                                <span className="label">Network</span>
                                <span>{item?.chain || "Internal transfer"}</span>
                              </div>
                              <div className="withdraw_card_row address_icon">
                                <span className="label">Address</span>
                                <span className="value">{shortAddress || "----"}{shortAddress && <span onClick={() => copytext(item?.to_address)} aria-label="Copy"><CopyIcon /></span>}</span>
                                
                              </div>
                              <div className="withdraw_card_row address_icon">
                                <span className="label">TxID</span>
                                <span className="value">{shortTxHash || "----"}</span>
                                {shortTxHash && <span onClick={() => copytext(item?.transaction_hash)} aria-label="Copy"><CopyIcon /></span>}
                              </div>
                              <div className="withdraw_card_footer">
                                <button type="button" className="withdraw_card_view_btn" onClick={() => handleWithdrawModal(item)}>View</button>
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
                  <h2>Withdrawal Details </h2>
                  <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div className="modal-body">

                  <div className="withdrawal_top_list">

                    <div className="bn_step_content">
                      <h5>Withdrawal order submitted</h5>
                      <span>{moment(modalData.createdAt).format("DD-MM-YYYY  hh:ss A")}</span>
                    </div>

                    <div className="bn_step_content">
                      <h5>System processing</h5>
                      <span>{moment(modalData.createdAt).format("DD-MM-YYYY  hh:ss A")}</span>
                    </div>

                    <div className="bn_step_content ">
                      <h5 className={modalData?.status === "PENDING" && 'withdrawal_pending'}>{modalData?.status}</h5>
                      <span>{moment(modalData.updatedAt).format("DD-MM-YYYY  hh:ss A")}</span>
                    </div>


                  </div>



                  <div className="hot_trading_t">


                    <table>
                      <tbody>
                        <tr>
                          <td>Status</td>
                          <td className="right_t price_tb">

                            {modalData?.status === "REJECTED" ? <span className="red">{modalData?.status}</span> : modalData?.status === "COMPLETED" ? <span className="green">{modalData?.status} </span> : <span className="yellow">{modalData?.status} </span>}
                          </td>

                        </tr>

                        <tr>
                          <td>Coin</td>
                          <td className="right_t price_tb">{modalData?.short_name}</td>
                        </tr>

                        <tr>
                          <td>Withdraw amount</td>
                          <td className="right_t price_tb">{modalData?.amount}</td>
                        </tr>

                        <tr>
                          <td>Network</td>
                          <td className="right_t price_tb">{modalData?.chain}</td>
                        </tr>

                        <tr>
                          <td>Address</td>
                          <td className="right_t price_tb"><div className="address_icon"><span>{modalData?.shortToAddress || "----"}</span>
                            <svg className="bn-svg icon-small-pointer mobile:icon-normal-pointer mobile:text-IconNormal" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" onClick={() => copytext(modalData?.to_address)}>
                              <path fillRule="evenodd" clip-rule="evenodd" d="M9 3h11v13h-3V6H9V3zM4 8v13h11V8.02L4 8z" fill="currentColor"></path></svg></div></td>
                        </tr>

                        <tr>
                          <td>TxID</td>
                          <td className="right_t price_tb"><div className="address_icon"><span>{modalData?.shortTxHash?.trim() || "----"}</span>
                            <svg className="bn-svg icon-small-pointer mobile:icon-normal-pointer mobile:text-IconNormal" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" onClick={() => copytext(modalData?.transaction_hash)}>
                              <path fillRule="evenodd" clip-rule="evenodd" d="M9 3h11v13h-3V6H9V3zM4 8v13h11V8.02L4 8z" fill="currentColor"></path></svg></div></td>
                        </tr>





                      </tbody>
                    </table>

                    {/* <p className="help_chat"><a href="/user_profile/support">Help? Chat with us</a></p> */}

                  </div>


                </div>

              </div>
            </div>
          </div>


          {/* <!-- Modal  table recent Pop Up End --> */}


        </div>




      </div>


    </>
  )
}

export default WithdrawPage
