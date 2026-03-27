import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AuthService from "../../../api/services/AuthService";
import { Helmet } from "react-helmet-async";

const FeesPage = () => {
  const [pairs, setPairs] = useState([])


  useEffect(() => {
    getPairs()
  }, [])


  const getPairs = async () => {
    const result = await AuthService.getCoinList()
    if (result.success) {
      setPairs(result.data)
    }
  }

  return (

    <>
      <Helmet>
        <title>Crypto Trading & Withdrawal Fees – Wrathcode Exchange</title>

        <meta
          name="description"
          content="Understand the trading, withdrawal and deposit fees at Wrathcode Exchange. Transparent pricing so you know exactly what you pay."
        />

        <meta
          name="keywords"
          content="withdrawal fees crypto exchange, deposit fees Wrathcode Exchange, trading fees transparent, crypto platform charges"
        />
      </Helmet>


      <section className="  section-padding feature_bg pc_bg  login_sec" >
        <div className="container">
          <div className="inner text-center">
            <h2 className="title"> Fee Structure </h2>
            <nav className="mt-4">
              <ol className="breadcrumb justify-content-center">
                <li className="breadcrumb-item"><Link to="/">Home</Link></li>
                <li className="breadcrumb-item active" aria-current="page">Fee Structure</li>
              </ol>
            </nav>
          </div>
        </div>
        <section className="pb-90 pt-5 ">
          <div className="container">
            <div className="row" >
              <div className="col-md-10 m-auto" >
                <div className="create-item-wrapper plicy_sec" >
                  <div className="row align-items-center py-5">
                    <div className="col-lg-12 ">
                      <p className="title  mb-2"><h3>Wrathcode Exchange:</h3>  Offers tiered maker-taker fees, starting at 0.1% for makers and 0.1% for takers. </p>
                    </div>
                  </div>
                  <div className="row align-items-center pb-0">
                    <div className="col-lg-12">
                      <div>
                        <h3 className="title"> Understanding Fee Types: </h3>
                        <p>• Maker Fees: Paid by users who add liquidity to the market by placing limit orders.</p>
                        <p>• Taker Fees: Paid by users who remove liquidity from the market by placing market orders.</p>
                        <p className="mb-0">• Spread: The difference between the buying and selling price of an asset on an exchange.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        <div className="tab-pane show container active mt-5  fade form-field-wrapper table_scroll p-0 switch_btn border-dashed border-gray-300 bg-lighten card-rounded" id="quickbuySell">
          <div className="table-responsive">
            <table className="table ">
              <thead>
                <tr>
                  <th>Sr No.</th>
                  <th>Asset</th>
                  <th>Maker Fee %</th>
                  <th>Taker Fee %</th>
                  <th>Max Deposit</th>
                  <th>Min Deposit</th>
                  <th>Max Withdrawal</th>
                  <th>Min Withdrawal</th>
                  <th>Withdrawal Fee </th>
                </tr>
              </thead>
              <tbody>
                {pairs?.length > 0 ? (
                  pairs?.map((item, index) => (
                    <tr key={index} >
                      <td className="color-grey"><small>{index + 1}</small></td>

                      <td className="color-grey"><small>{item?.name}</small></td>
                      <td className="color-grey"><small>{item?.maker_fee}</small></td>
                      <td className="color-grey"><small>{item?.taker_fee}</small></td>
                      <td className="color-grey"><small>{item?.max_deposit}</small></td>
                      <td className="color-grey"><small>{item?.min_deposit}</small></td>
                      <td className="color-grey"><small>{item?.max_withdrawal}</small></td>
                      <td className="color-grey"><small>{item?.min_withdrawal}</small></td>
                      <td className="color-grey"><small>{item?.withdrawal_fee}</small></td>
                    </tr>
                  ))
                ) : (
                  <tr rowSpan="5">
                    <td colSpan="12">
                      <div className="favouriteData">
                        <img src="/images/no-data.svg" className="img-fluid" width="96" height="96" alt="" />
                        <p>No Data Available</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

          </div>
        </div>

      </section>
    </>
  );
}

export default FeesPage;