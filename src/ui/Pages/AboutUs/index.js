import React from "react";

const AboutUs = () => {


  return (
    <section className="section-padding feature_bg pc_bg  login_sec" >
      <div className="container">
        <div className="inner text-center">
          <h6 className="text-gradient"> About Us </h6>
          <h2 className="title"> Empowering Cryptocurrency Investments  </h2>
          <p>Invest with confidence in the digital asset space</p>
        </div>
      </div>
      <section className="pb-90 pt-5 ">
        <div className="container">
          <img src="/images/about_img.png" className="img-fluid" alt="" />
          <div className="counter_card card" >
            <div className="count_card_item" >
              <h2 className="text-green" >
                $5M+
              </h2>
              <p>Assets Under Management</p>
            </div>
            <div className="count_card_item" >
              <h2 className="text-green" >
                $1M+
              </h2>
              <p>Assets Under Management</p>
            </div>
            <div className="count_card_item" >
              <h2 className="text-green" >
                50%+
              </h2>
              <p>Assets Under Management</p>
            </div>
            <div className="count_card_item" >
              <h2 className="text-green" >
                10+
              </h2>
              <p>Assets Under Management</p>
            </div>
          </div>
        </div>
      </section>
      <section className="section-padding val_sec" >
        <div className="container" >
          <div className="section-title  text-center">
            <h2 className="">
              Our Values
            </h2>
          </div>
          <div className="row  g-4" >
            <div className="col-lg-4" >
              <div className="learn__item" aria-hidden="true" tabIndex="-1">
                <div className="learn__preview"><img src="images/ov_1.jpg" alt="Card" /></div>
                <div className="learn__details">
                  <h5 className="learn__subtitle">Build Trust </h5>
                  <p className="learn__content mb-0">Building trust requires time and relies on consistent, transparent actions. Trust can easily erode due to misrepresentation, hidden fees, or data opacity.</p>
                </div>
              </div>
            </div>
            <div className="col-lg-4" >
              <div className="learn__item" aria-hidden="true" tabIndex="-1">
                <div className="learn__preview"><img src="images/ov_2.jpg" alt="Card" /></div>
                <div className="learn__details ">
                  <h5 className="learn__subtitle">Play as Team   </h5>
                  <p className="learn__content mb-0">Building trust requires time and relies on consistent, transparent actions. Trust can easily erode due to misrepresentation, hidden fees, or data opacity.</p>
                </div>
              </div>
            </div>
            <div className="col-lg-4" >
              <div className="learn__item" aria-hidden="true" tabIndex="-1">
                <div className="learn__preview"><img src="images/ov_3.jpg" alt="Card" /></div>
                <div className="learn__details">
                  <h5 className="learn__subtitle">Bias Towards Action   </h5>
                  <p className="learn__content mb-0">Building trust requires time and relies on consistent, transparent actions. Trust can easily erode due to misrepresentation, hidden fees, or data opacity.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="section-padding val_sec" >
        <div className="container" >
          <div className="row justify-content-center" >
            <div className="col-lg-7 mx-auto" >
              <div className="section-title text-center">
                <h2 className="">
                  Our Founders
                </h2>
                <p>
                  Meet the visionary behind URG-X, whose passion for crypto sparked a revolution. they're leading us on an exhilarating journey to make crypto investments accessible to all.
                </p>
              </div>
            </div>
          </div>
          <div className="row  g-4 justify-content-center" >
            <div className="col-lg-3 col-md-6" >
              <div className="team-card ak-bg">
                <img src="/images/first.png" className="img-fluid" alt="Card" />
                <div className="team-style-1">
                  <div className="team-info">
                    <div className="team-title">
                      Ashok Joshi
                    </div>
                    <p className="desp">CEO & Founder  </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-lg-3 col-md-6" >
              <div className="team-card ak-bg">
                <img src="/images/second.jpeg" className="img-fluid" alt="Card" />
                <div className="team-style-1">
                  <div className="team-info">
                    <div className="team-title">
                      Jaglal Bhartiya
                    </div>
                    <p className="desp">CO-Founder</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-lg-3 col-md-6" >
              <div className="team-card ak-bg">
                <img src="/images/third.jpg" className="img-fluid" alt="Card" />
                <div className="team-style-1">
                  <div className="team-info">
                    <div className="team-title">
                      Rohit Rajput
                    </div>
                    <p className="desp"> COO </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-lg-3 col-md-6" >
              <div className="team-card ak-bg">
                <img src="/images/fourth.jpg" className="img-fluid" alt="Card" />
                <div className="team-style-1">
                  <div className="team-info">
                    <div className="team-title">
                      Sumit Agarwal
                    </div>
                    <p className="desp"> CMO </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <hr />
      <section className="section-padding val_sec" >
        <div className="container" >
          <div className="row justify-content-center" >
            <div className="col-lg-9" >
              <div className="tm_bg" >
                <img src="images/btn_img.jpeg" className="img-fluid" alt="" />
                <div className="card" >
                  <div className="card-body" >
                    <h4>Join our growing team</h4>
                    <p>We're putting together a team of stellar individuals with different ideas and backgrounds to shape the future of Starlight.</p>
                    <a href="/partnership" className="btn custom-btn" >View open roles</a>
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

export default AboutUs;