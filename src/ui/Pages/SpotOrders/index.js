import React, { useEffect, useState } from 'react'
import LoaderHelper from '../../../customComponents/Loading/LoaderHelper';
import AuthService from '../../../api/services/AuthService';
import { alertErrorMessage } from '../../../customComponents/CustomAlertMessage';
import moment from 'moment';

const SpotOrders = (props) => {
  const [tradeHistoryData, setTradeHistoryData] = useState([]);
  console.log("🚀 ~ SpotOrders ~ tradeHistoryData:", tradeHistoryData)
  const [totalDataLength, setTotalDataLength] = useState(0);
  const [skip, setSkip] = useState(0);
  const limit = 10;
  const [expandedRow, setExpandedRow] = useState(null);
  const [expandedRowIndex, setExpandedRowIndex] = useState(null);
  const [showAllListItems, setShowAllListItems] = useState({ 0: false, 1: false, 2: false });
  const [showExecutedTrades, setShowExecutedTrades] = useState({ 0: false, 1: false, 2: false });


  const handleTradeHistory = async (skip, limit) => {
    try {
      LoaderHelper.loaderStatus(true);
      const result = await AuthService.tradeHistory(skip, limit);
      if (result?.success) {
        setTradeHistoryData(result.data);
        setTotalDataLength(result.totalCount);
      } else {
        alertErrorMessage(result.message);
      }
    } catch (e) {
      alertErrorMessage('Failed to fetch trade history');
    } finally {
      LoaderHelper.loaderStatus(false);
    }
  };

  const handlePagination = (action) => {
    if (action === 'prev' && skip - limit >= 0) setSkip(skip - limit);
    if (action === 'next' && skip + limit < totalDataLength) setSkip(skip + limit);
    if (action === 'first') setSkip(0);
    if (action === 'last') setSkip(Math.max(0, totalDataLength - limit));
  };

  const nineDecimalFormat = (data) => {
    if (typeof (data) === "number") {
      // return data
      return parseFloat(data?.toFixed(9))
    } else {
      return 0
    }
  };

  useEffect(() => {
    handleTradeHistory(skip, limit);
  }, [skip]);

  useEffect(() => {
    window.scrollTo(0, 0);
 }, []);

  return (
    <div className="dashboard_right">
      <div className="dashboard_listing_section Overview_mid">


        <div className="listing_left_outer full_width transaction_history_t desktop_view2">
          <div className="market_section spotorderhist">
            <div className="top_heading">
              <h4>Spot order history</h4>
              <div className="coin_right">
                <div className="searchBar custom-tabs">
                  <i className="ri-search-2-line"></i>
                  <input type="search" className="custom_search" placeholder="Search Crypto" />
                </div><div className="checkbox">
                  <input type="checkbox" />Hide 0 Balance</div>
              </div>

            </div>
            <div className="dashboard_summary">
              <div className='table-responsive'>
                <table className=" ">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Trading Pair</th>
                      <th>Side</th>

                      <th>Price</th>
                      <th>Average</th>
                      <th>Quantity</th>
                      <th>Remaining</th>
                      <th>Total</th>
                      <th>Fee</th>
                      <th>Order Type</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tradeHistoryData?.length > 0 ? tradeHistoryData.map((item, index) =>
                      <>
                        <tr key={index} onClick={() => setExpandedRowIndex(expandedRowIndex === index ? null : index)} className="cursor-pointer">
                          <td>

                            <div className="c_view justify-content-start">
                              {item?.executed_prices?.length > 0 && (
                                <p className="ms-2 mx-2 text-xl d-inline text-success">{expandedRowIndex === index ? '▾' : '▸'}</p>
                              )}
                              <span>{moment(item?.updatedAt).format("DD/MM/YYYY")}
                                <small>{moment(item?.updatedAt).format("hh:mm")}</small>
                              </span>
                            </div>
                          </td>
                          <td>{item?.side === "BUY" ? `${item?.ask_currency}/${item?.pay_currency}` : `${item?.pay_currency}/${item?.ask_currency}`}</td>
                          <td>{item?.side}</td>
                          <td>{nineDecimalFormat(item?.price)}</td>
                          <td>{nineDecimalFormat(item?.avg_execution_price)}</td>
                          <td>{nineDecimalFormat(item?.quantity)}</td>
                          <td>{nineDecimalFormat(item?.remaining)}</td>
                          <td>{nineDecimalFormat(item?.quantity * item?.avg_execution_price)}</td>
                          <td>{nineDecimalFormat(item?.total_fee)} {item?.ask_currency}</td>
                          <td>{item?.order_type}</td>
                          <td className={`text-${item?.status === "FILLED" ? "success" : item?.status === "CANCELLED" ? "danger" : "warning"}`}>
                            {item?.status === 'FILLED' ? 'EXECUTED' : item?.status}

                          </td>
                        </tr>

                        {/* Sub-row for executed trades */}
                        {expandedRowIndex === index && item?.executed_prices?.length > 0 && (
                          <tr>
                            <td colSpan="12">
                              <div className='table-responsive bg-dark'>
                                <table className="table table_home   ">
                                  <thead>
                                    <tr>
                                      <th>#</th>
                                      <th>Trading price	</th>
                                      <th>Executed</th>
                                      <th>Trading Fee</th>
                                      <th>Total</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {item.executed_prices.map((trade, i) => (
                                      <tr key={i}>
                                        <td>{i + 1}</td>
                                        <td >{nineDecimalFormat(trade.price)} {item?.side === "BUY" ? `${item?.pay_currency}` : `${item?.ask_currency}`}</td>
                                        <td>{nineDecimalFormat(trade.quantity)} {item?.side === "BUY" ? `${item?.ask_currency}` : `${item?.pay_currency}`}</td>
                                        <td>{nineDecimalFormat(+trade.fee)} {item?.ask_currency}</td>
                                        <td>{nineDecimalFormat(+trade.price * trade.quantity)}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>

                    ) : <tr rowSpan="5" className="no-data-row">
                      <td colSpan="12">
                        <div className="no-data-wrapper">
                          <div className="no_data_s">
                            <img src="/images/no_data_vector.svg" className="img-fluid" width="96" height="96" alt="" />
                          </div>
                        </div>
                      </td>
                    </tr>}
                  </tbody>
                </table>
              </div>
              {tradeHistoryData?.length > 0 ?
                <div className="hVPalX gap-2">
                  <span>{skip + 1}-{Math.min(skip + limit, totalDataLength)} of {totalDataLength}</span>
                  <div className="sc-eAKtBH gVtWSU">
                    <button type="button" aria-label="First Page" className="sc-gjLLEI kuPCgf" onClick={() => handlePagination('first')}>
                      <i className="ri-skip-back-fill text-white"></i>
                    </button>
                    <button type="button" aria-label="Previous Page" className="sc-gjLLEI kuPCgf" onClick={() => handlePagination('prev')}>
                      <i className="ri-arrow-left-s-line text-white"></i>
                    </button>
                    <button type="button" aria-label="Next Page" className="sc-gjLLEI kuPCgf" onClick={() => handlePagination('next')}>
                      <i className="ri-arrow-right-s-line text-white"></i>
                    </button>
                    <button type="button" aria-label="Last Page" className="sc-gjLLEI kuPCgf" onClick={() => handlePagination('last')}>
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
          <h5>Spot order history</h5>
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
                {showAllListItems[1] && (
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
                onClick={() => setShowAllListItems({ ...showAllListItems, 1: !showAllListItems[1] })}
              >
                {showAllListItems[0] ? <i className="ri-arrow-down-s-line"></i> : <i className="ri-arrow-up-s-line"></i>}
              </button>

              <div className={`executed_trades_list ${showExecutedTrades[1] ? 'active' : ''}`}>
                <button onClick={() => setShowExecutedTrades({ ...showExecutedTrades, 1: !showExecutedTrades[1] })}>
                  <i className={`ri-arrow-drop-down-line ${showExecutedTrades[1] ? 'rotated' : ''}`}></i>Executed Trades
                </button>
                {showExecutedTrades[1] && (
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
                {showAllListItems[2] && (
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
                onClick={() => setShowAllListItems({ ...showAllListItems, 2: !showAllListItems[2] })}
              >
                {showAllListItems[2] ? <i className="ri-arrow-down-s-line"></i> : <i className="ri-arrow-up-s-line"></i>}
              </button>

              <div className={`executed_trades_list ${showExecutedTrades[2] ? 'active' : ''}`}>
                <button onClick={() => setShowExecutedTrades({ ...showExecutedTrades, 2: !showExecutedTrades[2] })}>
                  <i className={`ri-arrow-drop-down-line ${showExecutedTrades[2] ? 'rotated' : ''}`}></i>Executed Trades
                </button>
                {showExecutedTrades[2] && (
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
  );
};

export default SpotOrders;
