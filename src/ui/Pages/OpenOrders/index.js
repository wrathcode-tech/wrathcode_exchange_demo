import React, { useEffect, useState } from 'react'
import LoaderHelper from '../../../customComponents/Loading/LoaderHelper';
import AuthService from '../../../api/services/AuthService';
import { alertErrorMessage, alertSuccessMessage } from '../../../customComponents/CustomAlertMessage';
import moment from 'moment';

const OpenOrders = (props) => {
  const [allOpenOrders, setAllOpenOrders] = useState([]);
  const [totalAllOpen, setTotalAllOpen] = useState([]);
  const [skipAllOrder, setSkipAllOrder] = useState(0);
  const limitAllorder = 10;
  const [showAllListItems, setShowAllListItems] = useState({ 0: false, 1: false, 2: false });
  const [showExecutedTrades, setShowExecutedTrades] = useState({ 0: false, 1: false, 2: false });


  const handleOpenOrders = async (skipAllOrder, limitAllorder) => {
    try {
      LoaderHelper.loaderStatus(true);
      const result = await AuthService.allOpenOrder(skipAllOrder, limitAllorder)
      if (result?.success) {
        setAllOpenOrders(result?.data);
        setTotalAllOpen(result.total_count);
      } else {
        alertErrorMessage(result?.message);
      }
    } catch (error) { }
    finally { LoaderHelper.loaderStatus(false); }
  };

  const cancelOrder = async (orderId) => {
    await AuthService.cancelOrder(orderId).then((result) => {
      if (result?.success) {
        LoaderHelper.loaderStatus(false);
        try {
          alertSuccessMessage('Order Cancelled Successfully');
          handleOpenOrders(skipAllOrder, limitAllorder)
        } catch (error) {
          LoaderHelper.loaderStatus(false);
        }
      } else {
        LoaderHelper.loaderStatus(false);
        alertErrorMessage(result?.message)
      }
    })
  };

  const handlePaginationAllOrder = (action) => {
    if (action === 'prev') {
      if (skipAllOrder - limitAllorder >= 0) {
        setSkipAllOrder(skipAllOrder - limitAllorder);
      }
    } else if (action === 'next') {
      if (skipAllOrder + limitAllorder < totalAllOpen) {
        setSkipAllOrder(skipAllOrder + limitAllorder);
      }
    } else if (action === 'first') {
      setSkipAllOrder(0);
    } else if (action === 'last') {
      const lastPageSkip = Math.floor(totalAllOpen);
      if (totalAllOpen > 10) {
        const data = lastPageSkip - 10
        setSkipAllOrder(data);
      }
    }
  };

  const toFixed = (data) => {
    if (typeof (data) === 'number') {
      return parseFloat(data?.toFixed(6));
    } else {
      return 0;
    }
  }


  useEffect(() => {
    handleOpenOrders(skipAllOrder, limitAllorder)

  }, [skipAllOrder]);

  useEffect(() => {
    window.scrollTo(0, 0);
 }, []);

  return (
    <>


      <div className="dashboard_right">

        <div className="dashboard_listing_section Overview_mid">

          <div className="listing_left_outer full_width transaction_history_t desktop_view2">

            <div className="market_section spotorderhist">
              <div className="top_heading">
                <h4>All open orders </h4>
              </div>
              <div className="dashboard_summary">
                <div className='table-responsive'>
                  <table>
                    <thead>
                      <tr>
                        <th>Sr No.</th>
                        <th>Date/Time</th>
                        <th>Currency Pair</th>
                        <th>Side</th>
                        <th>Price</th>
                        <th>Quantity</th>
                        <th>Filled</th>
                        <th>Total</th>
                        <th>Status</th>
                        <th className="right_td">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allOpenOrders?.length > 0 ? (
                        allOpenOrders?.map((item, index) => (
                          <tr key={index}>
                            <td >{index + 1}</td>
                            <td >
                              <div className=" justify-content-start" >
                                <span>{moment(item.createdAt).format("DD/MM/YYYY  ")}
                                  <small>{moment(item.createdAt).format("hh:mm A")}</small>
                                </span>
                              </div>
                            </td>
                            <td >{item?.base_currency_short_name + "/" + item?.quote_currency_short_name}</td>
                            <td >{item?.side}</td>
                            <td > {toFixed(item?.price)}</td>
                            <td >{toFixed(item?.quantity)}</td>
                            <td >{toFixed(item?.filled)}</td>
                            <td > {toFixed((item?.price * item?.quantity))} </td>
                            <td >{item?.status}</td>
                            <td className="right_td"> <button className="btn text-danger btn-sm btn-icon" type="button" title="Cancel order" onClick={() => { cancelOrder(item?._id) }}><i className="ri-delete-bin-6-line pr-0"></i>
                            </button></td>
                          </tr>
                        ))
                      ) : (
                        <tr rowSpan="5" className="no-data-row">
                          <td colSpan="12">
                            <div className="no-data-wrapper">
                              <div className="no_data_vector">
                                <img src="/images/no_data_vector.svg" alt="no-data" />
                              </div>
                            </div>

                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {allOpenOrders?.length > 0 ?
                  <div className="hVPalX gap-2">
                    <span>{skipAllOrder + 1}-{Math.min(skipAllOrder + limitAllorder, totalAllOpen)} of {totalAllOpen}</span>
                    <div className="sc-eAKtBH gVtWSU">
                      <button type="button" aria-label="First Page" className="sc-gjLLEI kuPCgf" onClick={() => handlePaginationAllOrder('first')}>
                        <i className="ri-skip-back-fill text-white"></i>
                      </button>
                      <button type="button" aria-label="Previous Page" className="sc-gjLLEI kuPCgf" onClick={() => handlePaginationAllOrder('prev')}>
                        <i className="ri-arrow-left-s-line text-white"></i>
                      </button>
                      <button type="button" aria-label="Next Page" className="sc-gjLLEI kuPCgf" onClick={() => handlePaginationAllOrder('next')}>
                        <i className="ri-arrow-right-s-line text-white"></i>
                      </button>
                      <button type="button" aria-label="Last Page" className="sc-gjLLEI kuPCgf" onClick={() => handlePaginationAllOrder('last')}>
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
          <h5>All open orders</h5>
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

export default OpenOrders
