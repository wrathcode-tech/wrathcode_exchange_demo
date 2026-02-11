import React, { useEffect, useState } from 'react'
import LoaderHelper from '../../../customComponents/Loading/LoaderHelper';
import AuthService from '../../../api/services/AuthService';
import { alertWarningMessage } from '../../../customComponents/CustomAlertMessage';
import moment from 'moment';

const InternalWalletTransHistory = (props) => {
  const [skipQbsHistory, setSkipQbsHistory] = useState(0);
  const [buySellHist, setBuySellHist] = useState([]);
  const [totalDataLength, setTotalDataLength] = useState();
  const [showAllListItems, setShowAllListItems] = useState({});

  const limit = 10;

  const getTransferHistory = async (skip) => {
    LoaderHelper.loaderStatus(true);
    try {
      const result = await AuthService.walletTransferHistory(skip, limit)
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
                <h4>Internal Wallet Transfer History</h4>
              </div>


              <div className="dashboard_summary">

                <table>
                  <thead>
                    <tr>
                      <th>Sr No.</th>
                      <th>Date</th>
                      <th>Currency</th>
                      <th>Wallet</th>
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
                          <td> {item?.from_wallet.charAt(0).toUpperCase() + item?.from_wallet.slice(1)} Wallet <i className="ri-arrow-right-double-line"></i>  {item?.to_wallet.charAt(0).toUpperCase() + item?.to_wallet.slice(1)} Wallet</td>

                          <td className={`right_td ${item?.status === "COMPLETE" || item?.status === "Completed" ? "green" : item?.status === "REJECTED" ? "red" : item?.status === "PENDING" ? "yellow" : item?.status === "CANCELLED" ? "yellow" : ""}`}>{item?.status}</td>
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
            <h5>Internal Wallet Transfer History</h5>
            {buySellHist?.length > 0 ? (
              buySellHist.map((item, index) => (
                <div className='d-flex mb-3' key={index}>
                  <div className='order_datalist order_datalist_2'>
                    <ul className='listdata'>
                      <li>
                        <span className='date'>{item?.short_name}</span>
                        <span className='date_light'>{moment(item.createdAt).format("DD/MM/YYYY, hh:mm A")}</span>
                      </li>
                      <li>
                        <span>Amount</span>
                        <span>{toFixed(item?.amount)} {item?.short_name}</span>
                      </li>
                      <li>
                        <span>Transfer</span>
                        <span>{item?.from_wallet?.charAt(0).toUpperCase() + item?.from_wallet?.slice(1)} → {item?.to_wallet?.charAt(0).toUpperCase() + item?.to_wallet?.slice(1)}</span>
                      </li>
                      <li>
                        <span>Status</span>
                        <span className={item?.status === "COMPLETE" || item?.status === "Completed" ? "text-success" : item?.status === "REJECTED" ? "text-danger" : "text-warning"}>
                          {item?.status}
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-data-wrapper text-center py-4">
                <div className="no_data_vector">
                  <img src="/images/Group 1171275449 (1).svg" alt="no-data" />
                </div>
              </div>
            )}

            {buySellHist?.length > 0 && (
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

export default InternalWalletTransHistory
