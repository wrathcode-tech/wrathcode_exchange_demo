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
  const [searchQuery, setSearchQuery] = useState('');

  const filteredOpenOrders = (allOpenOrders ?? []).filter((item) => {
    if (!searchQuery?.trim()) return true;
    const pair = `${item?.base_currency_short_name}/${item?.quote_currency_short_name}`;
    const q = searchQuery.trim().toUpperCase();
    return pair?.toUpperCase().includes(q) ||
      item?.base_currency_short_name?.toUpperCase().includes(q) ||
      item?.quote_currency_short_name?.toUpperCase().includes(q);
  });

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
                <h4>Open orders </h4>
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
                      {filteredOpenOrders?.length > 0 ? (
                        filteredOpenOrders?.map((item, index) => (
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

                {filteredOpenOrders?.length > 0 ?
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
          <div className="coin_right d-flex flex-row justify-content-between align-items-center p-0">
          <h5>Open orders</h5>
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
            {filteredOpenOrders?.length > 0 ? (
              filteredOpenOrders.map((item, index) => (
                <div key={index} className='order_datalist'>
                  <ul className='listdata'>
                    <li>
                      <span className='date'>Date</span>
                      <span className='date_light'>{moment(item?.createdAt).format("DD/MM/YYYY")}</span>
                    </li>
                    <li>
                      <span>Time</span>
                      <span>{moment(item?.createdAt).format("hh:mm A")}</span>
                    </li>
                    <li>
                      <span>Currency Pair</span>
                      <span>{item?.base_currency_short_name}/{item?.quote_currency_short_name}</span>
                    </li>
                    <li>
                      <span>Side</span>
                      <span>{item?.side}</span>
                    </li>
                    <li>
                      <span>Price</span>
                      <span>{toFixed(item?.price)}</span>
                    </li>
                    <li>
                      <span>Quantity</span>
                      <span>{toFixed(item?.quantity)}</span>
                    </li>
                    <li>
                      <span>Filled</span>
                      <span>{toFixed(item?.filled)}</span>
                    </li>
                    <li>
                      <span>Total</span>
                      <span>{toFixed(item?.price * item?.quantity)}</span>
                    </li>
                    <li>
                      <span>Status</span>
                      <span>{item?.status}</span>
                    </li>
                    <li>
                      <span>Action</span>
                      <span>
                        
                        <button
                          className="btn text-danger "
                          type="button"
                          title="Cancel order"
                          onClick={() => cancelOrder(item?._id)}
                        >
                          <i className="ri-delete-bin-6-line pr-0"></i>
                        </button>
                      </span>
                    </li>
                  </ul>
                </div>
              ))
            ) : (
              <div className="no-data-wrapper w-100">
                <div className="no_data_vector">
                  <img src="/images/no_data_vector.svg" alt="no-data" className="img-fluid" width="96" height="96" />
                </div>
              </div>
            )}
          </div>
          {filteredOpenOrders?.length > 0 && (
            <div className="hVPalX gap-2 mt-3">
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
          )}
        </div>


        </div>

      </div>
    </>
  )
}

export default OpenOrders
