import React from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";

const Contactus = () => {

  return (

    <><Helmet>
      <title>Contact Us – Wrathcode Exchange Support & Inquiries</title>

      <meta
        name="description"
        content="Need help? Contact Wrathcode Exchange customer support for account issues, trading help or platform info. We’re here 24/7."
      />

      <meta
        name="keywords"
        content="crypto exchange contact, Wrathcode Exchange support, trading help crypto, customer service Wrathcode Exchange"
      />
    </Helmet>

      <section className="  section-padding feature_bg pc_bg  login_sec" >
        <div className="container">
          <div className="inner text-center">
            <h1 className="title"> Help Center </h1>
            <nav className="mt-4">
              <ol className="breadcrumb justify-content-center">
                <li className="breadcrumb-item"><Link to="/">Home</Link></li>
                <li className="breadcrumb-item active" aria-current="page">Contactus</li>
              </ol>
            </nav>
          </div>
        </div>
        <section className="pb-90 pt-5 ">
          <div className="container">
            <div className="row " >
              <div className="col-md-12 m-auto" >
                <div className="create-item-wrapper plicy_sec career_sec">
                  <div className="row align-items-center gx-md-5">
                    <div className="col-lg-7 ">
                      <div>
                        <h2 className="title mb-3"> Contact with us </h2>
                        <p>  Need help with Wrathcode Exchange? Visit our Support Center to get in touch with our dedicated support team, available 24/7. For other inquiries, connect with us below. </p>

                        <div className="cc_row" >
                          <div className="cc_col" >
                            <b> Press Inquiries</b>   <a href="mailto:info@Wrathcode Exchange.com" target="_blank" >info@Wrathcode Exchange.com</a>
                          </div>
                          <hr />
                          <div className="cc_col" >
                            <b> Compliance Inquiries  </b>   <a href="mailto:compliance@Wrathcode Exchange.com" target="_blank" >compliance@Wrathcode Exchange.com</a>
                          </div>

                          <hr />
                          <div className="cc_col" >
                            <b> Support Inquiries</b>   <a href="mailto:support@wrathcode.com." target="_blank" >support@wrathcode.com.</a>
                          </div>
                        </div>
                        {/* <h4 className="font-weight-normal" > <a href="mailto:support.@Wrathcode Exchange.com" target="_blank" >support.@Wrathcode Exchange.com</a></h4> */}
                      </div>
                    </div>
                    <div className="col-lg-5">
                      {/* <img src="/images/contact_img.svg" className="img-fluid career_img" /> */}
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

export default Contactus;