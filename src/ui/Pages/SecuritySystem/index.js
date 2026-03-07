import React from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";

const SecuritySystem = () => {


  return (
    <>
      <Helmet>
        <title>Safe Crypto Trading – Security at URG-X</title>

        <meta
          name="description"
          content="Your safety is our priority. Discover the security infrastructure used by URG-X to safeguard your assets and trades."
        />

        <meta
          name="keywords"
          content="secure trading platform crypto, URG-X security infrastructure, protect crypto assets, exchange risk mitigation"
        />
      </Helmet>

      <section className="  section-padding feature_bg pc_bg  login_sec" >
        <div className="container">
          <div className="inner text-center">
            <h1 className="title"> Security   </h1>
            <nav className="mt-4">
              <ol className="breadcrumb justify-content-center">
                <li className="breadcrumb-item"><Link to="/">Home</Link></li>
                <li className="breadcrumb-item active" aria-current="page">Security  </li>
              </ol>
            </nav>
          </div>
        </div>
        <section className="pb-90 pt-5 ">
          <div className="container">
            <div className="row" >
              <div className="col-md-10 m-auto" >
                <div className="create-item-wrapper plicy_sec" >
                  <div className="row align-items-center py-4">
                    <div className="col-lg-12 ">
                      <p className="title  mb-2"><h3>Secure Storage </h3>

                        We safeguard user funds by securing our platform with strict protocols and industry-leading technical measures. From real-time monitoring and a 360-degree risk management system to advanced data privacy tools and end user security education, we continually find innovative ways to protect the users we serve.

                      </p>
                    </div>
                  </div>
                  <hr />
                  <div className="row  py-4 gx-md-5">
                    <div className="col-lg-6">
                      <div>
                        <h3 className="title  mb-3">Platform Security  </h3>

                        <div className="sc_card" >
                          <img src="/images/security/1.png" width="50" className="img-fluid" />

                          <div className="card-body">
                            <h5> Secure Storage    </h5>
                            <p className="mb-0">
                              The vast majority of user funds and assets are safely stored in offline, cold storage facilities.
                            </p>
                          </div>

                        </div>

                        <div className="sc_card" >
                          <img src="/images/security/2.png" width="50" className="img-fluid" />

                          <div className="card-body">
                            <h5> Real Time Monitoring    </h5>
                            <p className="mb-0">
                              Our risk management system analyzes every withdrawal attempt, password reset, two-factor authentication reset and email address change. Unusual activity triggers suspended withdrawals for a minimum of 24-48 hours.</p>
                          </div>

                        </div>

                        <div className="sc_card" >
                          <img src="/images/security/3.png" width="50" className="img-fluid" />

                          <div className="card-body">
                            <h5> Organizational Security    </h5>
                            <p className="mb-0">
                              Our wallet and personnel infrastructure features advanced security measures, including multisignature and threshold signature schemes (TSS), ensure the safety and integrity of our users’ funds.

                            </p>
                          </div>

                        </div>

                        <div className="sc_card" >
                          <img src="/images/security/4.png" width="50" className="img-fluid" />

                          <div className="card-body">
                            <h5> Advanced Data Encryption      </h5>
                            <p className="mb-0">
                              We protect user data and personal information, including Know-Your-Customer (KYC) information, by encrypting data in storage. Meanwhile, data in transit is secured via end-to-end encryption, ensuring only users have access to their personal information.

                            </p>
                          </div>

                        </div>


                      </div>
                    </div>

                    <div className="col-lg-6">
                      <div>
                        <h3 className="title  mb-3">User-Level Security    </h3>

                        <div className="sc_card" >
                          <img src="/images/security/5.png" width="50" className="img-fluid" />

                          <div className="card-body">
                            <h5> Safe Sign In      </h5>
                            <p className="mb-0">
                              URG-X supports strict sign-in protocols using two-factor authentication, including hardware, app-based, SMS and email methods.
                            </p>
                          </div>

                        </div>

                        <div className="sc_card" >
                          <img src="/images/security/6.png" width="50" className="img-fluid" />

                          <div className="card-body">
                            <h5> Access Control    </h5>
                            <p className="mb-0">
                              Advanced access control provides users with opt-in security features such as IP and wallet address whitelisting, API access control and device management.</p>
                          </div>

                        </div>

                        <div className="sc_card" >
                          <img src="/images/security/7.png" width="50" className="img-fluid" />

                          <div className="card-body">
                            <h5> Security Notifications      </h5>
                            <p className="mb-0">
                              Our wallet and personnel infrastructure features advanced security measures, including multisignature and threshold signature schemes (TSS), ensure the safety and integrity of our users’ funds.

                            </p>
                          </div>

                        </div>

                      </div>
                    </div>


                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>


      </section>

    </>
  );

}

export default SecuritySystem;