import { useEffect, useState } from "react";
import FAQAccMang from "../FAQPages/FAQAccMang";
import FAQKyc from "../FAQPages/FAQKyc";
import FAQCryptoDeposit from "../FAQPages/FAQCryptoDeposit";
import FAQSecurity from "../FAQPages/FAQSecurity";
import FAQEarn from "../FAQPages/FAQEarn";
import FAQApi from "../FAQPages/FAQApi";
import FAQTrading from "../FAQPages/FAQTrading";
import { useLocation } from "react-router-dom";

const FAQSidebar = () => {
  const location = useLocation();
  const { state } = location;
  const [ActiveTab, setActiveTab] = useState(state ? state : 'faqAccountManagment');
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);


  return (
    <>
      <section className="inner-page-banner pb-0"></section>
      {/* <div className="hero-banner-style top-section-gap ">
        <section className=" faq_sec ">
          <div className="container">
            <div className="row align-items-center justify-content-center">
              <div className="col-lg-8 col-md-12">
                <div className="section-title ">
                  <h1 className="text-gradient text-center">
                    Have any questions? We’re here to assist you
                  </h1>
                
                </div>

              </div>
            </div>
          </div>
        </section>
      </div> */}

      <section className="faq_cards">
        <div className="container">

  <h1 className="text-center">
                    Have any questions? We’re here to assist you
                  </h1>

          <div className="row" >
            <div className="col-lg-4" >
              <div className="grid faq_sidebar">
                <a className={ActiveTab === 'faqAccountManagment' ? "card active" : "card"} href="#/" onClick={() => { setActiveTab('faqAccountManagment') }}>
                  <div className="doc_icon"><img src="/images/faq1.png" className="img-fluid" alt="" /></div>
                  <div>
                    <h5>Account Management</h5>
                    <p>Help for your profile related queries</p>
                  </div>
                </a>

                <a className={ActiveTab === 'FAQKyc' ? "card active" : "card"} href="#/" onClick={() => { setActiveTab('FAQKyc') }}>
                  <div className="doc_icon"><img src="/images/faq2.png" className="img-fluid" alt="" /></div>
                  <div>
                    <h5>Know Your Customer(KYC)</h5>
                    <p> Know all about KYC and its process </p>
                  </div>
                </a>

                <a className={ActiveTab === 'FAQCryptoDeposit' ? "card active" : "card"} href="#/" onClick={() => { setActiveTab('FAQCryptoDeposit') }}>
                  <div className="doc_icon"><img src="/images/faq3.png" className="img-fluid" alt="" /></div>
                  <div>
                    <h5>Cypto Deposit And Withdrawal</h5>
                    <p> Help for deposit & withdrawal of crypto </p>
                  </div>
                </a>

                <a className={ActiveTab === 'FAQSecurity' ? "card active" : "card"} href="#/" onClick={() => { setActiveTab('FAQSecurity') }}>
                  <div className="doc_icon"><img src="/images/faq4.png" className="img-fluid" alt="" /></div>
                  <div>
                    <h5>Security</h5>
                    <p> Guidelines for your profile security  </p>
                  </div>
                </a>


                <a className={ActiveTab === 'FAQEarn' ? "card active" : "card"} href="#/" onClick={() => { setActiveTab('FAQEarn') }}>
                  <div className="doc_icon"><img src="/images/faq5.png" className="img-fluid" alt="" /></div>
                  <div>
                    <h5>Earn </h5>
                    <p> All about Refer & Earn, Airdrops</p>
                  </div>
                </a>

                <a className={ActiveTab === 'FAQApi' ? "card active" : "card"} href="#/" onClick={() => { setActiveTab('FAQApi') }}>
                  <div className="doc_icon"><img src="/images/faq6.png" className="img-fluid" alt="" /></div>
                  <div>
                    <h5>API</h5>
                    <p>About Wrathcode ExchangeAPI services </p>
                  </div>
                </a>

                <a className={ActiveTab === 'FAQTrading' ? "card active" : "card"} href="#/" onClick={() => { setActiveTab('FAQTrading') }}>
                  <div className="doc_icon"><img src="/images/faq7.png" className="img-fluid" alt="" /></div>
                  <div>
                    <h5>Trading with Wrathcode Exchange</h5>
                    <p> Help for all your trading transections  </p>
                  </div>
                </a>
              </div>
            </div>
            {ActiveTab === 'faqAccountManagment' && <FAQAccMang />}
            {ActiveTab === 'FAQKyc' && <FAQKyc />}
            {ActiveTab === 'FAQCryptoDeposit' && <FAQCryptoDeposit />}
            {ActiveTab === 'FAQSecurity' && <FAQSecurity />}
            {ActiveTab === 'FAQEarn' && <FAQEarn />}
            {ActiveTab === 'FAQApi' && <FAQApi />}
            {ActiveTab === 'FAQTrading' && <FAQTrading />}
          </div>
        </div>
      </section>







    </>
  );
};

export default FAQSidebar;
