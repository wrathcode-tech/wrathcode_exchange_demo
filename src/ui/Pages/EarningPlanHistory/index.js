import React, { useEffect, useState } from 'react'
import LoaderHelper from '../../../customComponents/Loading/LoaderHelper';
import AuthService from '../../../api/services/AuthService';
import { alertWarningMessage } from '../../../customComponents/CustomAlertMessage';
import moment from 'moment';

const EarningPlanHistory = (props) => {
  const [skipQbsHistory, setSkipQbsHistory] = useState(0);
  const [buySellHist, setBuySellHist] = useState([]);
  const [totalDataLength, setTotalDataLength] = useState();

  const limit = 10;
  const [searchQuery, setSearchQuery] = useState('');

  const filteredHistory = (buySellHist ?? []).filter((item) => {
    if (!searchQuery?.trim()) return true;
    const q = searchQuery.trim().toUpperCase();
    return item?.currency?.toUpperCase().includes(q) ||
      item?.wallet_type?.toUpperCase().includes(q);
  });

  const getTransferHistory = async (skip) => {
    LoaderHelper.loaderStatus(true);
    try {
      const result = await AuthService.subscribedPackageList(skip, limit)
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
    getTransferHistory(0);
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
                <h4>Earning History</h4>
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
                      <th>S.No</th>
                      <th>Currency</th>
                      <th>Wallet</th>
                      <th>Duration</th>
                      <th>Start date</th>
                      <th>Mature date</th>
                      <th>Subscription Amount</th>
                      <th>Bonus Amount</th>
                      <th>Receivable Amount</th>
                      <th className="right_td">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredHistory?.length > 0 ? (
                      filteredHistory?.map((item, index) => (
                        <tr key={index}>
                          <td>{index + 1}</td>
                          <td>{item?.currency}</td>
                          <td className={` ${item?.status === "COMPLETED" ? "text-success" : "text-warning"}`}>{item?.wallet_type.charAt(0).toUpperCase() + item?.wallet_type.slice(1)} Wallet</td>
                          <td>{item?.duration_days}</td>
                          <td>{moment(item.start_date).format("YYYY-MM-DD")} </td>
                          <td>{moment(item.end_date).format("YYYY-MM-DD")} </td>
                          <td>{parseFloat(item?.invested_amount?.$numberDecimal || 0)}</td>
                          <td className={` ${item?.status === "COMPLETED" ? "text-success" : "text-warning"}`}>+{toFixed(parseFloat(item?.expected_return?.$numberDecimal || 0) - parseFloat(item?.invested_amount?.$numberDecimal || 0))}</td>
                          <td>{parseFloat(item?.expected_return?.$numberDecimal || 0)}</td>
                       
                          <td className={`right_td ${item?.status === "COMPLETED" ? "text-success" : "text-warning"}`}>{item?.status}</td>
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
          <h5>Earning History</h5>
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
          <div className='d-flex'>
            {filteredHistory?.length > 0 ? (
              filteredHistory.map((item, index) => (
                <div key={item?._id || index} className='order_datalist'>
                  <ul className='listdata'>
                    <li>
                      <span className='date'>Currency</span>
                      <span className='date_light'>{item?.currency}</span>
                    </li>
                    <li>
                      <span>Wallet</span>
                      <span>{item?.wallet_type?.charAt(0).toUpperCase() + item?.wallet_type?.slice(1)} Wallet</span>
                    </li>
                    <li>
                      <span>Duration</span>
                      <span>{item?.duration_days} days</span>
                    </li>
                    <li>
                      <span>Start Date</span>
                      <span>{moment(item?.start_date).format("YYYY-MM-DD")}</span>
                    </li>
                    <li>
                      <span>Mature Date</span>
                      <span>{moment(item?.end_date).format("YYYY-MM-DD")}</span>
                    </li>
                    <li>
                      <span>Subscription Amount</span>
                      <span>{parseFloat(item?.invested_amount?.$numberDecimal || 0)}</span>
                    </li>
                    <li>
                      <span>Bonus Amount</span>
                      <span className={item?.status === "COMPLETED" ? "text-success" : "text-warning"}>
                        +{toFixed(parseFloat(item?.expected_return?.$numberDecimal || 0) - parseFloat(item?.invested_amount?.$numberDecimal || 0))}
                      </span>
                    </li>
                    <li>
                      <span>Receivable Amount</span>
                      <span>{parseFloat(item?.expected_return?.$numberDecimal || 0)}</span>
                    </li>
                    <li>
                      <span>Status</span>
                      <span className={item?.status === "COMPLETED" ? "text-success" : "text-warning"}>{item?.status}</span>
                    </li>
                  </ul>
                </div>
              ))
            ) : (
              <div className="no-data-wrapper w-100">
                <div className="no_data_vector">
                  <img src="/images/no_data_vector.svg" className="img-fluid dark_img" width="96" height="96" alt="no-data" />
                  <img src="/images/no_data_vector_light.png" className="img-fluid light_img" width="96" height="96" alt="no-data" />
                </div>
              </div>
            )}
          </div>
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

export default EarningPlanHistory




