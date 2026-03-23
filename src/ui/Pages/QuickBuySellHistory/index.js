import React, { useEffect, useState } from 'react'
import LoaderHelper from '../../../customComponents/Loading/LoaderHelper';
import AuthService from '../../../api/services/AuthService';
import { alertWarningMessage } from '../../../customComponents/CustomAlertMessage';
import moment from 'moment';

const QuickBuySellHistory = (props) => {
  const [skipQbsHistory, setSkipQbsHistory] = useState(0);
  const [buySellHist, setBuySellHist] = useState([]);
  const [totalDataLength, setTotalDataLength] = useState();
  const [showAllListItems, setShowAllListItems] = useState({});

  const limit = 10;
  const [searchQuery, setSearchQuery] = useState('');

  const filteredHistory = (buySellHist ?? []).filter((item) => {
    if (!searchQuery?.trim()) return true;
    const q = searchQuery.trim().toUpperCase();
    return item?.from?.toUpperCase().includes(q) || item?.to?.toUpperCase().includes(q);
  });

  const getBuySellHistory = async (skip) => {
    LoaderHelper.loaderStatus(true);
    try {
      const result = await AuthService.quickBuySellHistory(skip, limit)
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
        getBuySellHistory(skipQbsHistory - limit);
      }
    } else if (action === 'next') {
      if (skipQbsHistory + limit < totalDataLength) {
        getBuySellHistory(skipQbsHistory + limit);
      }
    } else if (action === 'first') {
      getBuySellHistory(0);
    } else if (action === 'last') {
      const lastPageSkip = Math.floor(totalDataLength);
      if (totalDataLength > 10) {
        const data = lastPageSkip - 10
        getBuySellHistory(data);
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
    getBuySellHistory(0, limit)

  }, []);

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
                <h4>Swap History</h4>
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
                </div>
              </div>


              <div className="dashboard_summary">

                <table>
                  <thead>
                    <tr>
                      <th>Sr No.</th>
                      <th>Date/Time</th>
                      <th>Paid Amount</th>
                      <th>Received Amount</th>
                      <th>Conversion Rate</th>
                      <th>Fee</th>
                      <th className="right_td">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredHistory?.length > 0 ? (
                      filteredHistory?.map((item, index) => (
                        <tr key={index}>
                          <td >{index + skipQbsHistory + 1}</td>
                          <td >

                            <div className="c_view justify-content-start" >
                              <span>{moment(item.createdAt).format("DD/MM/YYYY  ")}
                                <small>{moment(item.createdAt).format("hh:mm A")}</small>
                              </span>
                            </div>
                          </td>
                          <td >{toFixed(item.pay_amount)} {item?.from}</td>
                          <td >{toFixed(item.get_amount)} {item?.to} </td>
                          <td >1 {item?.from} =  {toFixed(item.conversion_rate)} {item?.to}</td>
                          <td >{toFixed(item.fee)} {item?.to}</td>
                          <td className="right_td"><strong className={item.status === "Completed" ? "text-success" : "text-danger"}>{item.status}</strong></td>
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

                {filteredHistory?.length > 0 ?
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
          <div className="coin_right d-flex flex-row justify-content-between align-items-center p-0">
            <h5>Swap History</h5>
            <div className="d-flex flex-row justify-content-end align-items-end mb-3">
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
            {filteredHistory?.length > 0 ? (
              filteredHistory.map((item, index) => (
                <div className='d-flex mb-3' key={index}>
                  <div className='order_datalist'>
                    <ul className='listdata'>
                      <li>
                        <span className='date'>{item?.from} → {item?.to}</span>
                        <span className='date_light'>{moment(item.createdAt).format("DD/MM/YYYY, hh:mm A")}</span>
                      </li>
                      <li>
                        <span>Paid Amount</span>
                        <span>{toFixed(item.pay_amount)} {item?.from}</span>
                      </li>
                      <li>
                        <span>Received Amount</span>
                        <span>{toFixed(item.get_amount)} {item?.to}</span>
                      </li>
                      <li>
                        <span>Status</span>
                        <span className={item.status === "Completed" ? "text-success" : "text-danger"}>{item.status}</span>
                      </li>
                      {showAllListItems[index] && (
                        <>
                          <li>
                            <span>Conversion Rate</span>
                            <span>1 {item?.from} = {toFixed(item.conversion_rate)} {item?.to}</span>
                          </li>
                          <li>
                            <span>Fee</span>
                            <span>{toFixed(item.fee)} {item?.to}</span>
                          </li>
                        </>
                      )}
                    </ul>
                    <button
                      type="button"
                      className="view_more_btn"
                      onClick={() => setShowAllListItems({ ...showAllListItems, [index]: !showAllListItems[index] })}
                    >
                      {showAllListItems[index] ? <i className="ri-arrow-down-s-line"></i> : <i className="ri-arrow-up-s-line"></i>}
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-data-wrapper text-center py-4">
                <div className="no_data_vector">
                  <img src="/images/no_data_vector.svg" className="dark_img" alt="no-data" />
                  <img src="/images/no_data_vector_light.png" className="light_img" alt="no-data" />
                </div>
              </div>
            )}

            {filteredHistory?.length > 0 && (
              <div className="hVPalX gap-2 mt-3">
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
            )}
          </div>

        </div>

      </div>

    </>
  )
}

export default QuickBuySellHistory
