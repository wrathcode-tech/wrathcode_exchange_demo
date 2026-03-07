import { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";

const FAQ = () => {
  const navigate = useNavigate()

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const nextPage = (data) => {
    navigate('/FAQSidebar', { state: data });
  };
  return (
    <>
      <Helmet>
        <title>URG-X Support – Frequently Asked Questions</title>

        <meta
          name="description"
          content="Your one-stop guide for everything URG-X. Browse FAQs on registration, KYC, withdrawals and platform features."
        />

        <meta
          name="keywords"
          content="crypto support faq, URG-X questions, trading platform support, crypto platform faq"
        />
      </Helmet>

      <section className="inner-page-banner pb-0"></section>
      <div className="hero-banner-style top-section-gap ">
        <section className=" faq_sec ">
          <div className="container">
            <div className="row align-items-center justify-content-center">
              <div className="col-lg-8 col-md-12">
                <div className="section-title ">
                  {/* <h6 className="mb-3">Need Help?</h6> */}
                  <h1 className="text-gradient text-center">
                    Have any questions? We’re here to assist you
                  </h1>
                  {/* <div className="searchbar" >
                    <i className="ri-search-2-line"></i>
                    <input type="search" className="form-control" placeholder="Type Somthing.." />
                  </div> */}
                </div>

              </div>
            </div>
          </div>
        </section>
      </div>


      <section className="faq_cards">
        <div className="container">
          <div className="grid">
            <a className="card" href="#/" onClick={() => { nextPage('faqAccountManagment') }}>
              <div className="doc_icon"><img src="/images/faq1.png" className="img-fluid" alt="" /></div>
              <div>
                <h5>Account Management</h5>
                <p>Help for your profile related queries</p>
              </div>
            </a>

            <a className="card" href="#/" type="button" onClick={() => { nextPage('FAQKyc') }}>
              <div className="doc_icon"><img src="/images/faq2.png" className="img-fluid" alt="" /></div>
              <div>
                <h5>Know Your Customer(KYC)</h5>
                <p> Know all about KYC and its process </p>
              </div>
            </a>

            <a className="card" href="#/" type="button" onClick={() => { nextPage('FAQCryptoDeposit') }}>
              <div className="doc_icon"><img src="/images/faq3.png" className="img-fluid" alt="" /></div>
              <div>
                <h5>Cypto Deposit And Withdrawal</h5>
                <p> Help for deposit & withdrawal of crypto </p>
              </div>
            </a>

            <a className="card" href="#/" type="button" onClick={() => { nextPage('FAQSecurity') }}>
              <div className="doc_icon"><img src="/images/faq4.png" className="img-fluid" alt="" /></div>
              <div>
                <h5>Security</h5>
                <p> Guidelines for your profile security  </p>
              </div>
            </a>


            <a className="card" href="#/" type="button" onClick={() => { nextPage('FAQEarn') }}>
              <div className="doc_icon"><img src="/images/faq5.png" className="img-fluid" alt="" /></div>
              <div>
                <h5>Earn </h5>
                <p> All about Refer & Earn, Airdrops</p>
              </div>
            </a>

            <a className="card" href="#/" type="button" onClick={() => { nextPage('FAQApi') }}>
              <div className="doc_icon"><img src="/images/faq6.png" className="img-fluid" alt="" /></div>
              <div>
                <h5>API</h5>
                <p>About URG-XAPI services </p>
              </div>
            </a>

            <a className="card" href="#/" type="button" onClick={() => { nextPage('FAQTrading') }}>
              <div className="doc_icon"><img src="/images/faq7.png" className="img-fluid" alt="" /></div>
              <div>
                <h5>Trading with URG-X</h5>
                <p> Help for all your trading transections  </p>
              </div>
            </a>
          </div>
        </div>
      </section>
    </>
  );
};

export default FAQ;
