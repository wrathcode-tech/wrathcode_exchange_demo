import React from "react";
import { Link } from "react-router-dom";

const RefundCancellation = () => {

  return (
    <section className="  section-padding feature_bg pc_bg  login_sec" >
      <div className="container">
        <div className="inner text-center">
          <h2 className="title"> Refund & cancellation </h2>
          <nav className="mt-4">
            <ol className="breadcrumb justify-content-center">
              <li className="breadcrumb-item"><Link to="/">Home</Link></li>
              <li className="breadcrumb-item active" aria-current="page"> Refund & cancellation</li>
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
                    <div>
                      <h3 className="title mb-3">Refund & cancellation Policy for Wrathcode Exchange</h3>
                      <p>Users accessing the Wrathcode Exchange Platform will be contracting with Greatspr Techno Services Private Limited's Corporate Identification Number is (CIN) U72900PN2018PTC179980 and its registration number is 179980.Its Email address is ajmumbai7710@gmail.com and its registered address is SHOP E- 116, WORLD OF MOTHER, WING- E, FIRST FLOOR, AKURDI PUNE Pune MH 411035 IN, which owns and operates the Wrathcode Exchange Platform in India.</p>


                      <p>  The Company (Wrathcode Exchange i.e. “Greatspr Techno Services Private Limited”), under no circumstance, entertains the refund or cancellation of a successfully fulfilled order. Once a user has placed a buy order, which has been fully or partially matched, the amount in the chosen currency is immediately transferred to the sellers' account and these transactions cannot be reversed. However, once a user deposits money into his Wrathcode Exchange account, he/she always has the option to withdraw this money in full or in part in accordance with the withdrawal limits. Wrathcode Exchange shall be entitled to retain/deduct the amounts due to actions from the user and transfer or refund the balance lying in the User Account, except when it is unable to do so in compliance with applicable laws. Purchase of any cryptocurrency can be done in currencies stated on our platform and the respective INR/BTC shall be deducted from the users wallet. Sell of any cryptocurrency can be done as per the currencies stated on the platform or BTC pairs and the respective amount will be credited to users wallet..</p>

                      <p> A user will not be entitled to a refund or cancellation in the following circumstances: (i) the user fails to provide Wrathcode Exchange with any information or documents when requested by Wrathcode Exchange in accordance with the terms of service of any Online Platform, (ii) Wrathcode Exchange suspects that the user has, or is, engaged in, or has in any way been involved in any fraudulent or illegal activity, any money laundering, any terrorist financing, or breach of any laws in any jurisdiction..</p>



                    </div>
                  </div>

                </div>


              </div>
            </div>
          </div>
        </div>
      </section>


    </section>
  );
}

export default RefundCancellation;