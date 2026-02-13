import React, { useEffect, useState } from 'react'
import LoaderHelper from '../../../customComponents/Loading/LoaderHelper';
import AuthService from '../../../api/services/AuthService';
import { alertErrorMessage, alertSuccessMessage } from '../../../customComponents/CustomAlertMessage';
import moment from 'moment';
import { generateWalletPDF, generateWalletExcel } from '../../../utils/exportWalletHistory';

const TransactionHistory = (props) => {
  const [skipWalletHistory, setSkipWalletHistory] = useState(0);
  const [walletHistory, setWalletHistory] = useState([]);
  const [totalDataLength, setTotalDataLength] = useState();

  const limit = 10;
  const [searchQuery, setSearchQuery] = useState('');
  const [exportFrom, setExportFrom] = useState(moment().subtract(1, 'month').format('YYYY-MM-DD'));
  const [exportTo, setExportTo] = useState(moment().format('YYYY-MM-DD'));
  const [exportFormat, setExportFormat] = useState('PDF');
  const [exportType, setExportType] = useState('all');
  const [exporting, setExporting] = useState(false);
  const [timePeriodPreset, setTimePeriodPreset] = useState('custom');

  const filteredWalletHistory = (walletHistory ?? []).filter((item) => {
    if (!searchQuery?.trim()) return true;
    const q = searchQuery.trim().toUpperCase();
    return item?.short_name?.toUpperCase().includes(q) ||
      item?.transaction_type?.toUpperCase().includes(q) ||
      item?.chain?.toUpperCase().includes(q) ||
      item?.transaction_hash?.toUpperCase().includes(q);
  });

  const formatTxHash = (hash) => {
    if (!hash || hash === '---') return hash;
    if (hash.length <= 16) return hash;
    return `${hash.slice(0, 8)}...${hash.slice(-6)}`;
  };

  const copyTxHash = (hash) => {
    if (!hash || hash === '---') return;
    navigator.clipboard.writeText(hash).then(() => alertSuccessMessage('Tx Hash copied!'));
  };

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
    setExportType('all');
    if (window.$) {
      window.$('#exportWalletHistoryModal').modal('show');
    }
  };

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
      const result = await AuthService.walletHistoryExport(from, to, exportType);
      if (!result?.success) {
        alertErrorMessage(result?.message || 'Failed to fetch wallet history');
        setExporting(false);
        return;
      }
      const data = result.data || [];
      if (!data.length) {
        alertErrorMessage('No transaction data in the selected timeframe');
        setExporting(false);
        return;
      }
      const userInfo = {
        firstName: props?.userDetails?.firstName,
        lastName: props?.userDetails?.lastName,
        emailId: props?.userDetails?.emailId,
        uuid: props?.userDetails?.uuid,
        userId: props?.userDetails?.userId
      };
      if (exportFormat === 'PDF') {
        await generateWalletPDF(data, fromDate, toDate, userInfo, exportType);
      } else {
        generateWalletExcel(data, fromDate, toDate);
      }
      alertSuccessMessage('Export completed');
      if (window.$) {
        window.$('#exportWalletHistoryModal').modal('hide');
      }
    } catch (e) {
      console.error('Export failed:', e);
      const msg = e?.response?.data?.message || e?.message || 'Export failed';
      alertErrorMessage(msg);
    } finally {
      setExporting(false);
    }
  };

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
                  <div className="searchBar custom-tabs" onClick={openExportModal} role="button" style={{ cursor: 'pointer' }} title="Export Deposit/Withdrawal History">
                    <i className="ri-download-2-line"></i>
                  </div>
                </div>
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
                      {filteredWalletHistory?.length > 0 ? (
                        filteredWalletHistory?.map((item, index) => (
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
                            <td>
                              <div className="d-flex align-items-center gap-1 flex-wrap">
                                <span>{formatTxHash(item?.transaction_hash) || '---'}</span>
                                {item?.transaction_hash && (
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-icon p-0"
                                    title="Copy Tx Hash"
                                    onClick={(e) => { e.stopPropagation(); copyTxHash(item?.transaction_hash); }}
                                  >
                                    <i className="ri-file-copy-line"></i>
                                  </button>
                                )}
                              </div>
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
                {filteredWalletHistory?.length > 0 ?
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
          <div className="coin_right d-flex flex-row justify-content-between align-items-center p-0">
          <h5>Deposit/Withdrawal history</h5>
          <div className="d-flex flex-row justify-content-end align-items-end mb-3 gap-2">
            <div className="searchBar custom-tabs" onClick={openExportModal} role="button" style={{ cursor: 'pointer' }} title="Export Deposit/Withdrawal History">
              <i className="ri-download-2-line"></i>
            </div>
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
          </div>
          </div>
          <div className='d-flex'>
            {filteredWalletHistory?.length > 0 ? (
              filteredWalletHistory.map((item, index) => (
                <div key={index} className='order_datalist'>
                  <ul className='listdata'>
                    <li>
                      <span className='date'>Date</span>
                      <span className='date_light'>{moment(item?.updatedAt).format("DD/MM/YYYY")}</span>
                    </li>
                    <li>
                      <span>Time</span>
                      <span>{moment(item?.updatedAt).format("hh:mm A")}</span>
                    </li>
                    <li>
                      <span>Transaction Type</span>
                      <span>{item?.transaction_type}</span>
                    </li>
                    <li>
                      <span>Currency</span>
                      <span>{item?.short_name}</span>
                    </li>
                    <li>
                      <span>Chain</span>
                      <span>{item?.chain || '---'}</span>
                    </li>
                    <li>
                      <span>Amount</span>
                      <span>{item?.amount}</span>
                    </li>
                    <li>
                      <span>Tx Hash</span>
                      <span>
                        <span className='text-white'>{formatTxHash(item?.transaction_hash) || '---'} {item?.transaction_hash && (  <i className="ri-file-copy-line"   onClick={() => copyTxHash(item?.transaction_hash)}></i>)}</span>
               
                      </span>
                    </li>
                    <li>
                      <span>Status</span>
                      <span className={item?.status === "COMPLETED" || item?.status === "SUCCESS" ? "text-success" : item?.status === "REJECTED" ? "text-danger" : item?.status === "PENDING" || item?.status === "CANCELLED" ? "text-warning" : ""}>
                        {item?.status}
                      </span>
                    </li>
                  </ul>
                </div>
              ))
            ) : (
              <div className="no-data-wrapper w-100">
                <div className="no_data_vector">
                  <img src="/images/Group 1171275449 (1).svg" alt="no-data" className="img-fluid" width="96" height="96" />
                </div>
              </div>
            )}
          </div>
          {filteredWalletHistory?.length > 0 && (
            <div className="hVPalX gap-2 mt-3">
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
          )}
        </div>

        </div>

        <div className="modal fade search_form export_modal" id="exportWalletHistoryModal" tabIndex="-1" aria-labelledby="exportWalletHistoryModalLabel" aria-hidden="true" data-bs-backdrop="static">
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title" id="exportWalletHistoryModalLabel">Export Deposit/Withdrawal History</h5>
                <button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
              </div>
              <div className="modal-body export_modal_body">
                {/* Transaction Type */}
                <div className="export_section">
                  <label className="export_label">Transaction Type</label>
                  <div className="export_btn_group">
                    <button type="button" className={`export_btn ${exportType === 'all' ? 'active' : ''}`} onClick={() => setExportType('all')}>All</button>
                    <button type="button" className={`export_btn ${exportType === 'deposit' ? 'active' : ''}`} onClick={() => setExportType('deposit')}>Deposit</button>
                    <button type="button" className={`export_btn ${exportType === 'withdrawal' ? 'active' : ''}`} onClick={() => setExportType('withdrawal')}>Withdrawal</button>
                  </div>
                </div>

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

    </>
  )
}

export default TransactionHistory
