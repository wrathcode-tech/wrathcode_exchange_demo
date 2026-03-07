import React from "react";
import { Link } from "react-router-dom";

const TokenPage = () => {


  return (
    <>
<div className="token_outerbg">
      <div className="partner_page" >
        <section className="p_sec  " >
          <div className="community_sec">
            <div className="container">
              <div className="card">
                <div className="card-body">
                  <div className="row align-items-center">
                    <div className="col-lg-7">
                      <div className="section-title mb-0 text-start pb-0 no-border">
                        <h2 className="">About  URG-X  Token</h2>
                        <p>
                          URG-X Token is the original digital currency issued by URG-X.com, referred to as CVT, and is a decentralized blockchain digital asset based on BSC Chain. The existing total supply is 50 million and cannot be issued additionally.

                          Each destruction cycle is based on the overall platform income of the CVToken platform in the current cycle, and CVT is destroyed in a fixed proportion. The destruction record will be announced as soon as possible, and users can query through the blockchain browser , to ensure openness and transparency.
                        </p>
                      </div>
                    </div>
                    <div className="col-lg-5 text-end">
                      <img alt="" src="/images/cv_token.png" width="320" className="img-fluid mx-auto" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

      </div>





      <section className="os_sec cv_tocnomics" >
        <div className="container">
          <div className="card " >
            <div className="card-body" >
              <h4 className="text-center my-3"> CVT Tokenomics </h4>
              <div className="card_pp_row" >

                <div className="card_pp cir_1 " >
                  <div className="percent">
                    <svg>
                      <circle cx="105" cy="105" r="100"></circle>
                      <circle cx="105" cy="105" r="100" percent={10} ></circle>
                    </svg>
                    <div className="number">
                      <h3>500,000,000</h3><span>Maximum Supply</span>
                    </div>
                  </div>
                </div>

                <div className="card_pp cir_2" >
                  <div className="percent">
                    <svg>
                      <circle cx="105" cy="105" r="100"></circle>
                      <circle cx="105" cy="105" r="100" style={{ percent: "70" }}></circle>
                    </svg>
                    <div className="number">
                      <h3>20,000,000</h3><span>Total CVT issuance (After Burning)</span>
                    </div>
                  </div>
                </div>


                <div className="card_pp cir_3" >
                  <div className="percent">
                    <svg>
                      <circle cx="105" cy="105" r="100"></circle>
                      <circle cx="105" cy="105" r="100" style={{ percent: "70" }}></circle>
                    </svg>
                    <div className="number">
                      <h3>2,500,000</h3><span>Total CVT Burned in last month  </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="sm_card" >
                <span> <img src="/images/sm.svg" className="img-fluid" alt="ui" /> Smart Contract Address : </span>
                <a href="https://bscscan.com/address/0x6A50A1f2fF0C5658815215b498f7aB003a783Dc7" target="_blank" className="btn-link" >https://bscscan.com/token/0x6A50A1f2fF0C5658815215b498f7aB003a783Dc7</a>
              </div>

            </div>
          </div>
        </div>
      </section>

      <section className="os_sec " >
        <div className="container">
          <h3 className=" text-center" >URG-X Token Utility </h3>

          <div className="col-cards card_mini" >
            <div className="row g-4 justify-content-center">
              <div className="col-6 col-lg-2">
                <div className="card h-100" >
                  <div className="card-body" >
                    <img src="/images/tu-3.png" alt="" />
                    <p>MONTHLY BURNS  </p>
                  </div>
                </div>
              </div>
              <div className="col-6  col-lg-2">
                <div className="card  h-100" >
                  <div className="card-body" >
                    <img src="/images/tu-4.png" alt="" />
                    <p> REFERRAL PAYOUTS </p>
                  </div>
                </div>
              </div>

              <div className="col-6  col-lg-2">
                <div className="card  h-100" >
                  <div className="card-body" >
                    <img src="/images/tu-5.png" alt="" />
                    <p> GLOBAL PAYMENTS  </p>
                  </div>
                </div>
              </div>

              <div className="col-6  col-lg-2">
                <div className="card  h-100" >
                  <div className="card-body" >
                    <img src="/images/tu-6.png" alt="" />
                    <p> LISTING DISCOUNTS </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>

      </section>


      <section className="st_sec " >
        <div className="container">
          <div className="card" >
            <div className="card-body" >
              <div className="row  align-items-center">
                <div className="col-md-6 col-lg-7">
                  <div className="st_card" >
                    <h2 className="" >
                      Start Trading Now
                    </h2>
                    <div className="btn-row" >
                      <a href="/login" className="btn custom-btn btn-xl px-md-5" > Get Started  </a>
                    </div>
                  </div>
                </div>
                <div className="col-md-6  col-lg-5">
                  <img src="images/st_img.png" className="img-fluid" alt="" />
                </div>
              </div>
            </div>
          </div>
        </div>

      </section>


</div>




    </>
  );
}

export default TokenPage;