import React, { useEffect, useState } from 'react'
import LoaderHelper from '../../../customComponents/Loading/LoaderHelper';
import AuthService from '../../../api/services/AuthService';
import { alertWarningMessage } from '../../../customComponents/CustomAlertMessage';
import moment from 'moment';

const BonusHistory = (props) => {
  const [skipQbsHistory, setSkipQbsHistory] = useState(0);
  const [buySellHist, setBuySellHist] = useState([]);
  const [totalDataLength, setTotalDataLength] = useState();
  const [showAllListItems, setShowAllListItems] = useState({ 0: false, 1: false, 2: false });
  const [showExecutedTrades, setShowExecutedTrades] = useState({ 0: false, 1: false, 2: false });

  const limit = 10;

  const getTransferHistory = async (skip) => {
    LoaderHelper.loaderStatus(true);
    try {
      const result = await AuthService.bonusHistory(skip, limit)
      if (result?.success) {
        if (result?.data?.length > 0) {
          setSkipQbsHistory(skip);
          setBuySellHist(result?.data);
          setTotalDataLength(result.totalCount)
          return;
        } else if (skip !== 0) {
          alertWarningMessage('No more data found')
          return;
        }
      }
    } finally { LoaderHelper.loaderStatus(false); }
  };

  const handlePaginationQbsHistory = (action) => {
    if (action === 'prev') {
      if (skipQbsHistory - limit >= 0) {
        getTransferHistory(skipQbsHistory - limit);
      }
    } else if (action === 'next') {
      if (skipQbsHistory + limit < totalDataLength) {
        getTransferHistory(skipQbsHistory + limit);
      }
    } else if (action === 'first') {
      getTransferHistory(0);
    } else if (action === 'last') {
      const lastPageSkip = Math.floor(totalDataLength);
      if (totalDataLength > 10) {
        const data = lastPageSkip - 10
        getTransferHistory(data);
      }
    }
  };


  const toFixed = (data) => {
    if (typeof (data) === 'number') {
      return parseFloat(data?.toFixed(9));
    } else {
      return 0;
    }
  }

  useEffect(() => {
    getTransferHistory(0, limit)

  }, []);


  return (
    <>


      <div className="dashboard_right">

        <div className="dashboard_listing_section Overview_mid">

          <div className="listing_left_outer full_width transaction_history_t desktop_view2">

            <div className="market_section spotorderhist">

              <div className="top_heading">
                <h4>Bonus History</h4>
              </div>


              <div className="dashboard_summary">

                <table>
                  <thead>
                    <tr>
                      <th>Sr No.</th>
                      <th>Date</th>
                      <th>Amount</th>
                      <th>Description</th>
                      <th className="right_td">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {buySellHist?.length > 0 ? (
                      buySellHist?.map((item, index) => (
                        <tr>
                          <td>{index + 1} </td>
                          <td>{moment(item.createdAt).format("YYYY-MM-DD hh:mm A")} </td>
                          <td>
                            <div className="td_first">


                              <div className="price_heading">{item?.amount} {item?.short_name} </div>
                            </div>
                          </td>
                          <td>{item?.description} </td>
                      
                          <td className={`right_td ${item?.status === "SUCCESS" || item?.status === "Completed" ? "green" : item?.status === "REJECTED" ? "red" : item?.status === "PENDING" ? "yellow" : item?.status === "CANCELLED" ? "yellow" : ""}`}>{item?.status}</td>
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

                {buySellHist?.length > 0 ?
                  <div className="hVPalX gap-2">
                    <span>{skipQbsHistory + 1}-{Math.min(skipQbsHistory + limit, totalDataLength)} of {totalDataLength}</span>
                    <div className="sc-eAKtBH gVtWSU">
                      <button type="button" aria-label="First Page" className="sc-gjLLEI kuPCgf" onClick={() => handlePaginationQbsHistory('first')}>
                        <i className="ri-skip-back-fill text-white"></i>
                      </button>
                      <button type="button" aria-label="Previous Page" className="sc-gjLLEI kuPCgf" onClick={() => handlePaginationQbsHistory('prev')}>
                        <i className="ri-arrow-left-s-line text-white"></i>
                      </button>
                      <button type="button" aria-label="Next Page" className="sc-gjLLEI kuPCgf" onClick={() => handlePaginationQbsHistory('next')}>
                        <i className="ri-arrow-right-s-line text-white"></i>
                      </button>
                      <button type="button" aria-label="Last Page" className="sc-gjLLEI kuPCgf" onClick={() => handlePaginationQbsHistory('last')}>
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
          <h5>Bonus History</h5>
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

export default BonusHistory
