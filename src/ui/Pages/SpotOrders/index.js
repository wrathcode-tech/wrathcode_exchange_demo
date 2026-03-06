import React, { useCallback, useEffect, useState } from 'react'
import LoaderHelper from '../../../customComponents/Loading/LoaderHelper';
import AuthService from '../../../api/services/AuthService';
import { alertErrorMessage, alertSuccessMessage } from '../../../customComponents/CustomAlertMessage';
import moment from 'moment';
import { generatePDF, generateExcel } from '../../../utils/exportTradeHistory';

const SpotOrders = (props) => {
  const [tradeHistoryData, setTradeHistoryData] = useState([]);
  const [totalDataLength, setTotalDataLength] = useState(0);
  const [skip, setSkip] = useState(0);
  const limit = 10;
  const [expandedRowId, setExpandedRowId] = useState(null);
  const [showExecutedTrades, setShowExecutedTrades] = useState({});
  const [hideCancelled, setHideCancelled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [exportFrom, setExportFrom] = useState(moment().subtract(1, 'month').format('YYYY-MM-DD'));
  const [exportTo, setExportTo] = useState(moment().format('YYYY-MM-DD'));
  const [exportFormat, setExportFormat] = useState('PDF');
  const [exporting, setExporting] = useState(false);
  const [timePeriodPreset, setTimePeriodPreset] = useState('custom');


  const handleTradeHistory = useCallback(async (skip, limit) => {
    try {
      LoaderHelper.loaderStatus(true);
      const result = await AuthService.tradeHistory(skip, limit);
      if (result?.success) {
        setTradeHistoryData(result.data);
        setTotalDataLength(result.totalCount);
      } else {
        alertErrorMessage(result?.message || 'Failed to fetch trade history');
      }
    } catch (e) {
      alertErrorMessage('Failed to fetch trade history');
    } finally {
      LoaderHelper.loaderStatus(false);
    }
  }, []);

  const handlePagination = (action) => {
    if (action === 'prev' && skip - limit >= 0) setSkip(skip - limit);
    if (action === 'next' && skip + limit < totalDataLength) setSkip(skip + limit);
    if (action === 'first') setSkip(0);
    if (action === 'last') setSkip(Math.max(0, totalDataLength - limit));
  };

  const filteredTradeHistory = (tradeHistoryData ?? [])
    .filter((item) => {
      if (hideCancelled && item?.status === 'CANCELLED') return false;
      if (!searchQuery?.trim()) return true;
      const pair = item?.side === 'BUY'
        ? `${item?.ask_currency}/${item?.pay_currency}`
        : `${item?.pay_currency}/${item?.ask_currency}`;
      const q = searchQuery.trim().toUpperCase();
      return pair?.toUpperCase().includes(q) ||
        item?.ask_currency?.toUpperCase().includes(q) ||
        item?.pay_currency?.toUpperCase().includes(q);
    });

  const nineDecimalFormat = (data) => {
    if (typeof data === 'number' && !isNaN(data)) {
      return parseFloat(data.toFixed(9));
    }
    return 0;
  };

  useEffect(() => {
    handleTradeHistory(skip, limit);
  }, [skip, limit, handleTradeHistory]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleExport = async () => {
    const from = exportFrom;
    const to = exportTo;
    if (!from || !to) {
      alertErrorMessage('Please select from and to dates');
      return;
    }
    const fromDate = new Date(from);
    const toDate = new Date(to);
    if (fromDate > toDate) {
      alertErrorMessage('From date must be before or equal to to date');
      return;
    }
    setExporting(true);
    try {
      const result = await AuthService.tradeHistoryExport(from, to);
      if (!result?.success) {
        alertErrorMessage(result?.message || 'Failed to fetch trade history');
        setExporting(false);
        return;
      }
      const data = result.data || [];
      const hasTrades = (data || []).some(
        (ord) =>
          (ord.executed_prices?.length > 0) ||
          ord.status === 'FILLED' ||
          ord.status === 'PARTIALLY EXECUTED'
      );
      if (!data.length || !hasTrades) {
        alertErrorMessage('No trade data in the selected timeframe');
        setExporting(false);
        return;
      }
      if (exportFormat === 'PDF') {
        const userInfo = {
          firstName: props?.userDetails?.firstName,
          lastName: props?.userDetails?.lastName,
          emailId: props?.userDetails?.emailId,
          uuid: props?.userDetails?.uuid,
          userId: props?.userDetails?.userId
        };
        await generatePDF(data, fromDate, toDate, userInfo);
      } else {
        generateExcel(data, fromDate, toDate);
      }
      alertSuccessMessage('Export completed');
      if (window.$) {
        window.$('#exportTradeHistoryModal').modal('hide');
      }
    } catch (e) {
      console.error('Export failed:', e);
      const msg = e?.response?.data?.message || e?.message || 'Export failed';
      alertErrorMessage(msg);
    } finally {
      setExporting(false);
    }
  };

  const applyTimePreset = (preset) => {
    setTimePeriodPreset(preset);
    const now = moment();
    let from;
    const maxFrom = now.clone().subtract(10, 'years');
    switch (preset) {
      case '24h': from = now.clone().subtract(24, 'hours'); break;
      case '2w': from = now.clone().subtract(2, 'weeks'); break;
      case '1m': from = now.clone().subtract(1, 'month'); break;
      case '3m': from = now.clone().subtract(3, 'months'); break;
      case '6m': from = now.clone().subtract(6, 'months'); break;
      case 'custom':
      default: return;
    }
    if (from.isBefore(maxFrom)) from = maxFrom;
    setExportFrom(from.format('YYYY-MM-DD'));
    setExportTo(now.format('YYYY-MM-DD'));
  };

  const openExportModal = () => {
    setTimePeriodPreset('custom');
    setExportFrom(moment().subtract(1, 'month').format('YYYY-MM-DD'));
    setExportTo(moment().format('YYYY-MM-DD'));
    setExportFormat('PDF');
    if (window.$) {
      window.$('#exportTradeHistoryModal').modal('show');
    }
  };

  return (
    <div className="dashboard_right">
      <div className="dashboard_listing_section Overview_mid">


        <div className="listing_left_outer full_width transaction_history_t desktop_view2">
          <div className="market_section spotorderhist">
            <div className="top_heading">
              <h4>Spot orders</h4>
              <div className="coin_right">
                <div className="searchBar custom-tabs">
                  <i className="ri-search-2-line"></i>
                  <input
                    type="search"
                    className="custom_search"
                    placeholder="Search Crypto"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="searchBar custom-tabs" onClick={openExportModal} role="button" style={{ cursor: 'pointer' }} title="Export Trade History">
                  <i className="ri-download-2-line"></i>
                </div>
                <label className="checkbox">
                  <input
                    type="checkbox"
                    checked={hideCancelled}
                    onChange={(e) => setHideCancelled(e.target.checked)}
                  />
                  Hide cancelled trades
                </label>
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
                    {filteredTradeHistory?.length > 0 ? filteredTradeHistory.map((item, index) => (
                      <React.Fragment key={item?._id || index}>
                        <tr onClick={() => setExpandedRowId(expandedRowId === item?._id ? null : item?._id)} className="cursor-pointer">
                          <td>

                            <div className="c_view justify-content-start">
                              {item?.executed_prices?.length > 0 && (
                                <p className="ms-2 mx-2 text-xl d-inline text-success">{expandedRowId === item?._id ? '▾' : '▸'}</p>
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
                        {expandedRowId === item?._id && item?.executed_prices?.length > 0 && (
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
                      </React.Fragment>
                    )) : <tr rowSpan="5" className="no-data-row">
                      <td colSpan="12">
                        <div className="no-data-wrapper">
                          <div className="no_data_s">
                            <img src="/images/no_data_vector.svg" className="img-fluid dark_img" width="96" height="96" alt="" /><img src="/images/no_data_vector_light.png" className="img-fluid light_img" width="96" height="96" alt="" />
                          </div>
                        </div>
                      </td>
                    </tr>}
                  </tbody>
                </table>
              </div>
              {filteredTradeHistory?.length > 0 ?
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


          <div className="coin_right d-flex flex-row justify-content-between align-items-center p-0">
            <h5>Spot orders </h5>
            <div className="d-flex flex-row justify-content-end align-items-center gap-2">
             
              <div className="searchBar custom-tabs">
                <i className="ri-search-2-line"></i>
                <input
                  type="search"
                  className="custom_search"
                  placeholder="Search Crypto"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="searchBar custom-tabs" onClick={openExportModal} role="button" style={{ cursor: 'pointer' }} title="Export Trade History">
                <i className="ri-download-2-line"></i>
              </div>
            </div>
          </div>



          <div className='d-flex'>
            {filteredTradeHistory?.length > 0 ? (
              filteredTradeHistory.map((item, index) => (
                <div key={item?._id || index} className='order_datalist'>
                  <ul className='listdata'>
                    <li>
                      <span className='date'>Date</span>
                      <span className='date_light'>{moment(item?.updatedAt).format("DD/MM/YYYY")}</span>
                    </li>
                    <li>
                      <span>Time</span>
                      <span>{moment(item?.updatedAt).format("hh:mm:ss")}</span>
                    </li>
                    <li>
                      <span>Currency Pair</span>
                      <span>{item?.side === "BUY" ? `${item?.ask_currency}/${item?.pay_currency}` : `${item?.pay_currency}/${item?.ask_currency}`}</span>
                    </li>
                    <li>
                      <span>Side</span>
                      <span>{item?.side}</span>
                    </li>
                    <li>
                      <span>Price</span>
                      <span>{nineDecimalFormat(item?.price)}</span>
                    </li>
                    <li>
                      <span>Average</span>
                      <span>{nineDecimalFormat(item?.avg_execution_price)}</span>
                    </li>
                    <li>
                      <span>Quantity</span>
                      <span>{nineDecimalFormat(item?.quantity)}</span>
                    </li>
                    <li>
                      <span>Remaining</span>
                      <span>{nineDecimalFormat(item?.remaining)}</span>
                    </li>
                    <li>
                      <span>Total</span>
                      <span>{nineDecimalFormat(item?.quantity * item?.avg_execution_price)}</span>
                    </li>
                    <li>
                      <span>Fee</span>
                      <span>{nineDecimalFormat(item?.total_fee)} {item?.ask_currency}</span>
                    </li>
                    <li>
                      <span>Order Type</span>
                      <span>{item?.order_type}</span>
                    </li>
                    <li>
                      <span>Status</span>
                      <span className={`text-${item?.status === "FILLED" ? "success" : item?.status === "CANCELLED" ? "danger" : "warning"}`}>
                        {item?.status === 'FILLED' ? 'EXECUTED' : item?.status}
                      </span>
                    </li>
                  </ul>

                  {item?.executed_prices?.length > 0 && (
                    <div className={`executed_trades_list ${showExecutedTrades[item?._id] ? 'active' : ''}`}>
                      <button onClick={() => setShowExecutedTrades({ ...showExecutedTrades, [item?._id]: !showExecutedTrades[item?._id] })}>
                        <i className={`ri-arrow-drop-down-line ${showExecutedTrades[item?._id] ? 'rotated' : ''}`}></i>Executed Trades
                      </button>
                      {showExecutedTrades[item?._id] && (
                        <div className='executed_trades_list_items'>
                          {item.executed_prices.map((trade, i) => (
                            <ul key={i}>
                              <li>Trade #{i + 1}:</li>
                              <li>Trading Price: <span>{nineDecimalFormat(trade.price)} {item?.side === "BUY" ? item?.pay_currency : item?.ask_currency}</span></li>
                              <li>Executed: <span>{nineDecimalFormat(trade.quantity)} {item?.side === "BUY" ? item?.ask_currency : item?.pay_currency}</span></li>
                              <li>Trading Fee: <span>{nineDecimalFormat(+trade.fee)} {item?.ask_currency}</span></li>
                              <li>Total: <span>{nineDecimalFormat(+trade.price * trade.quantity)}</span></li>
                            </ul>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="no-data-wrapper w-100">
                <div className="no_data_s">
                  <img src="/images/no_data_vector.svg" className="img-fluid dark_img" width="96" height="96" alt="" /><img src="/images/no_data_vector_light.png" className="img-fluid light_img" width="96" height="96" alt="" />
                </div>
              </div>
            )}
          </div>
          {filteredTradeHistory?.length > 0 && (
            <div className="hVPalX gap-2 mt-3">
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
          )}
        </div>

        {/* Export Trade History Modal */}
        <div className="modal fade search_form export_modal" id="exportTradeHistoryModal" tabIndex="-1" aria-labelledby="exportTradeHistoryModalLabel" aria-hidden="true" data-bs-backdrop="static">
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title" id="exportTradeHistoryModalLabel">Export Trade History</h5>
                <button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
              </div>
              <div className="modal-body export_modal_body">
                {/* Select Time Period */}
                <div className="export_section">
                  <label className="export_label">Select Time Period</label>
                  <div className="export_btn_group export_presets">
                    <button type="button" className={`export_btn ${timePeriodPreset === '24h' ? 'active' : ''}`} onClick={() => applyTimePreset('24h')}>Last 24 hours</button>
                    <button type="button" className={`export_btn ${timePeriodPreset === '2w' ? 'active' : ''}`} onClick={() => applyTimePreset('2w')}>2 Weeks</button>
                    <button type="button" className={`export_btn ${timePeriodPreset === '1m' ? 'active' : ''}`} onClick={() => applyTimePreset('1m')}>1 Month</button>
                    <button type="button" className={`export_btn ${timePeriodPreset === '3m' ? 'active' : ''}`} onClick={() => applyTimePreset('3m')}>3 Months</button>
                    <button type="button" className={`export_btn ${timePeriodPreset === '6m' ? 'active' : ''}`} onClick={() => applyTimePreset('6m')}>6 Months</button>
                    <button type="button" className={`export_btn ${timePeriodPreset === 'custom' ? 'active' : ''}`} onClick={() => setTimePeriodPreset('custom')}>Customize</button>
                  </div>
                  {timePeriodPreset === 'custom' && (
                    <div className="export_date_range">
                      <input type="date" className="export_date_input" value={exportFrom} onChange={(e) => setExportFrom(e.target.value)} />
                      <span className="export_date_arrow"><i className="ri-arrow-right-line"></i></span>
                      <input type="date" className="export_date_input" value={exportTo} onChange={(e) => setExportTo(e.target.value)} />
                    </div>
                  )}
                  <small className="export_note">* Up to 10,000 data can be generated each time.</small>
                </div>

                {/* Format Selection */}
                <div className="export_section">
                  <label className="export_label">Format</label>
                  <div className="export_btn_group">
                    <button type="button" className={`export_btn ${exportFormat === 'PDF' ? 'active' : ''}`} onClick={() => setExportFormat('PDF')}>PDF</button>
                    <button type="button" className={`export_btn ${exportFormat === 'Excel' ? 'active' : ''}`} onClick={() => setExportFormat('Excel')}>Excel</button>
                  </div>
                </div>

              

                {/* Export Button */}
                <div className="export_section export_actions">
                  <button
                    type="button"
                    className="export_submit_btn"
                    onClick={handleExport}
                    disabled={exporting}
                  >
                    {exporting ? 'Exporting...' : 'Export'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpotOrders;
