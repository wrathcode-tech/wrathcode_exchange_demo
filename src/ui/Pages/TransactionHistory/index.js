import React, { useEffect, useState } from 'react'
import LoaderHelper from '../../../customComponents/Loading/LoaderHelper';
import AuthService from '../../../api/services/AuthService';
import { alertErrorMessage } from '../../../customComponents/CustomAlertMessage';
import moment from 'moment';

const TransactionHistory = (props) => {
  const [skipWalletHistory, setSkipWalletHistory] = useState(0);
  const [walletHistory, setWalletHistory] = useState([]);
  const [totalDataLength, setTotalDataLength] = useState();
  const [showAllListItems, setShowAllListItems] = useState({ 0: false, 1: false, 2: false });
  const [showExecutedTrades, setShowExecutedTrades] = useState({ 0: false, 1: false, 2: false });

  const limit = 10;

  const handleWalletHistory = async (skip) => {
    LoaderHelper.loaderStatus(true);
    await AuthService.walletHistory(skip, limit).then(async (result) => {
      if (result?.success) {
        setSkipWalletHistory(skip)
        LoaderHelper.loaderStatus(false);
        setWalletHistory(result?.data);
        setTotalDataLength(result.totalCount)
      } else {
        LoaderHelper.loaderStatus(false);
        alertErrorMessage(result?.message);
      }
    })
  };

  const handlePaginationWalletHistory = (action) => {
    if (action === 'prev') {
      if (skipWalletHistory - limit >= 0) {
        handleWalletHistory(skipWalletHistory - limit);
      }
    } else if (action === 'next') {
      if (skipWalletHistory + limit < totalDataLength) {
        handleWalletHistory(skipWalletHistory + limit);
      }
    } else if (action === 'first') {
      handleWalletHistory(0);
    } else if (action === 'last') {
      const lastPageSkip = Math.floor(totalDataLength);
      if (totalDataLength > 10) {
        const data = lastPageSkip - 10
        handleWalletHistory(data);
      }
    }
  };

  useEffect(() => {
    handleWalletHistory(0)


  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
 }, []);


  return (
    <>

      <div className="dashboard_right">

        <div className="dashboard_listing_section Overview_mid">

          {/* <div className="transaction_top_select">

            <div className="select_option">
              <span>Type</span>
              <select>
                <option>Deposit</option>
                <option>Deposit</option>
                <option>Deposit</option>
              </select>
            </div>

            <div className="select_option">
              <span>Time</span>
              <select>
                <option>Past 30...</option>
                <option>Past 30</option>
                <option>Past 10 mint</option>
              </select>
            </div>

            <div className="select_option">
              <span>Coin</span>
              <select>
                <option>All</option>
                <option>Deposit</option>
                <option>Deposit</option>
              </select>
            </div>

            <div className="select_option">
              <span>Status</span>
              <select>
                <option>All</option>
                <option>Deposit</option>
                <option>Deposit</option>
              </select>
            </div>

            <div className="select_option form_type">
              <form>
                <button><img src="/images/search_icon.svg" alt="icon" /></button>
                <input type="text" placeholder="Enter TxID" />
              </form>

            </div>

            <div className="reset">

              <h6>Reset</h6>

            </div>


          </div> */}

          <div className="listing_left_outer full_width transaction_history_t desktop_view2">

            <div className="market_section spotorderhist">

              <div className="top_heading">
                <h4>Deposit/Withdrawal history</h4>
              </div>


              <div className="dashboard_summary">
                <div className='table-responsive'>
                  <table>
                    <thead>
                      <tr>
                        <th>Sr No</th>
                        <th>Date & Time</th>
                        <th>Transaction Type</th>
                        <th>Currency </th>
                        <th>Chain</th>
                        <th>Amount</th>
                        <th>Tx Hash</th>
                        <th className="right_td">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {walletHistory?.length > 0 ? (
                        walletHistory?.map((item, index) => (
                          <tr key={index} className="cursor-pointer" >
                            <td className="color-grey" ><small>{skipWalletHistory + index + 1}</small></td>
                            <td>
                              <div className="c_view justify-content-start" >
                                <span>{moment(item.updatedAt).format("DD/MM/YYYY  ")}
                                  <small>{moment(item.updatedAt).format("hh:mm A")}</small>
                                </span>
                              </div>
                            </td>
                            <td >
                              {item?.transaction_type}
                            </td>
                            <td >
                              {item?.short_name}
                            </td>

                            <td >
                              {item?.chain || "------"}
                            </td>

                            <td >
                              {item?.amount}
                            </td>
                            <td >
                              {item?.transaction_hash || '---'}
                            </td>
                            <td className={`right_td ${item?.status === "COMPLETED" || item?.status === "SUCCESS" ? "green" : item?.status === "REJECTED" ? "red" : item?.status === "PENDING" ? "yellow" : item?.status === "CANCELLED" ? "yellow" : ""}`}>{item?.status}</td>
                          </tr>
                        ))
                      ) : (
                        <tr rowSpan="5" className="no-data-row">
                          <td colSpan="12">
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
                {walletHistory?.length > 0 ?
                  <div className="hVPalX gap-2">
                    <span>{skipWalletHistory + 1}-{Math.min(skipWalletHistory + limit, totalDataLength)} of {totalDataLength}</span>
                    <div className="sc-eAKtBH gVtWSU">
                      <button type="button" aria-label="First Page" className="sc-gjLLEI kuPCgf" onClick={() => handlePaginationWalletHistory('first')}>
                        <i className="ri-skip-back-fill text-white"></i>
                      </button>
                      <button type="button" aria-label="Previous Page" className="sc-gjLLEI kuPCgf" onClick={() => handlePaginationWalletHistory('prev')}>
                        <i className="ri-arrow-left-s-line text-white"></i>
                      </button>
                      <button type="button" aria-label="Next Page" className="sc-gjLLEI kuPCgf" onClick={() => handlePaginationWalletHistory('next')}>
                        <i className="ri-arrow-right-s-line text-white"></i>
                      </button>
                      <button type="button" aria-label="Last Page" className="sc-gjLLEI kuPCgf" onClick={() => handlePaginationWalletHistory('last')}>
                        <i className="ri-skip-forward-fill text-white"></i>
                      </button>
                    </div>
                  </div>
                  : ""
                }


              </div>


            </div>



          </div>

          <div className='order_history_mobile_view'>
          <h5>Deposit/Withdrawal history</h5>
          <div className='d-flex'>
            <div className='order_datalist'>
              <ul className='listdata'>
                <li>
                  <span className='date'>USDT (TRC20)</span>
                  <span className='date_light'>2025-08-14</span>
                </li>
                <li>
                  <span>Time</span>
                  <span>12:00:00</span>
                </li>
                <li>
                  <span>Currency Pair</span>
                  <span>BTC/USD</span>
                </li>
                <li>
                  <span>Side</span>
                  <span>Buy</span>
                </li>
                <li>
                  <span>Price</span>
                  <span>10000</span>
                </li>
                {showAllListItems[0] && (
                  <>
                    <li>
                      <span>Average</span>
                      <span>10000</span>
                    </li>
                    <li>
                      <span>Quantity</span>
                      <span>10000</span>
                    </li>
                    <li>
                      <span>Remaining</span>
                      <span>10000</span>
                    </li>
                    <li>
                      <span>Total</span>
                      <span>10000</span>
                    </li>
                    <li>
                      <span>Fee</span>
                      <span>10000</span>
                    </li>
                    <li>
                      <span>Order Type</span>
                      <span>Market</span>
                    </li>
                    <li>
                      <span>Status</span>
                      <span className='text-success'>Executed</span>
                    </li>
                    <li>
                      <span>Status</span>
                      <span className='text-danger'>Executed</span>
                    </li>
                    <li>
                      <span>Status</span>
                      <span className='text-warning'>Executed</span>
                    </li>
                  </>
                )}
              </ul>
              <button
                type="button"
                className="view_more_btn"
                onClick={() => setShowAllListItems({ ...showAllListItems, 0: !showAllListItems[0] })}
              >
                {showAllListItems[0] ? <i className="ri-arrow-down-s-line"></i> : <i className="ri-arrow-up-s-line"></i>}
              </button>

              <div className={`executed_trades_list ${showExecutedTrades[0] ? 'active' : ''}`}>
                <button onClick={() => setShowExecutedTrades({ ...showExecutedTrades, 0: !showExecutedTrades[0] })}>
                  <i className={`ri-arrow-drop-down-line ${showExecutedTrades[0] ? 'rotated' : ''}`}></i>Executed Trades
                </button>
                {showExecutedTrades[0] && (
                  <div className='executed_trades_list_items'>
                    <ul>
                      <li>Trade #1:</li>
                      <li>Trading Price: <span>10000</span></li>
                      <li>Executed: <span>10000</span></li>
                      <li>Trading Fee: <span>10000</span></li>
                      <li>Total: <span>10000</span></li>
                    </ul>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>

        </div>

      </div>

    </>
  )
}

export default TransactionHistory
