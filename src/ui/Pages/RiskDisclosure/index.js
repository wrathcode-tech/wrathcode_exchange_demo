import React from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";

const RiskDisclosure = () => {

  return (
    <>
      <Helmet>
        <title>Crypto Trading Risk Information – URG-X</title>

        <meta
          name="description"
          content="Read about the potential risks of crypto trading before you start: platform use, market fluctuations and security at URG-X."
        />

        <meta
          name="keywords"
          content="crypto trading warning, risk crypto exchange, URG-X disclaimers, trading volatility crypto"
        />
      </Helmet>

      <div className="hero-banner-style top-section-gap ">
        <section className=" faq_sec ">
          <div className="container">
            <div className="row align-items-center justify-content-center">
              <div className="col-lg-8 col-md-12">
                <div className="section-title ">
                  <h1 className="text-gradient text-center">Risk Disclosure – URG-X</h1>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="termsofuse">
          <div className="container">
            <div className="create-item-wrapper plicy_sec">
              <div>
                Dear Valued URG-X Users,<br /><br />
                <p>We want to emphasize the importance of understanding the substantial risks associated with cryptocurrency trading. The cryptocurrency market is inherently volatile and unpredictable. Before engaging in any cryptocurrency transactions, it is crucial that you carefully assess your risk tolerance and make informed decisions. </p>
                <p>Key Points to Consider when Trading Cryptocurrencies on the URG-X Platform:</p>
                <p><strong>1. KYC Requirements: &nbsp;</strong> Services such as Spot, Savings, and vote-to-list on the URG-X platform are exclusively accessible to verified URG-X users who have completed Know Your Customer (KYC) verification.                  </p>
                <p><strong>2. Complete KYC:  &nbsp;</strong>It is imperative for users to complete their KYC verification and provide accurate personal information.</p>
                <p className="mb-0"><strong>3. Account Security:  &nbsp;</strong>Safeguard your account and password diligently. Never share your account information or password with anyone else. Any losses incurred due to negligence in this regard will be the user's sole responsibility.</p>
                <br />
                <p className="mb-0"><strong className="d-block">4. Risk Categories:</strong></p>
                <br />
                <p> <strong>- Policy Risk:</strong><br /><span className="d-block ms-3">Changes in national laws, regulations, or macro-policies can impact cryptocurrency transactions and potentially lead to losses.</span></p>
                <p> <strong>- Compliance Risk: </strong><br /><span className="d-block ms-3">Violation of national laws or regulations during cryptocurrency transactions can result in losses</span></p>
                <p> <strong>-  Compliance Risk:</strong><br /><span className="d-block ms-3">Cryptocurrency markets operate around the clock, and prices can fluctuate significantly. Users should be prepared for both positive and negative returns</span></p>
                <p> <strong>-  Trading Risk:</strong><br /><span className="d-block ms-3">Successful transactions require mutual agreement between parties; URG-X does not guarantee transaction success.</span></p>
                <p> <strong>-  Force Majeure Risk:</strong><br /><span className="d-block ms-3">Unforeseeable events like natural disasters, cyber attacks, or other unavoidable circumstances can disrupt URG-X operations and lead to user losses. URG-X bears no civil liability for losses incurred under such conditions.</span></p>
                <p> <strong>-  Delisting Risk:</strong><br /><span className="d-block ms-3">Delisting may occur due to various reasons, potentially causing user losses.</span></p>
                <p> <strong>-  Technical Risk: </strong><br /><span className="d-block ms-3">Though rare, technical faults during cryptocurrency transactions can impact user interests.</span></p>
                <p> <strong>-  Operation Risk:</strong><br /><span className="d-block ms-3">Operational errors, such as transferring funds to the wrong account, can result in losses.</span></p>
                <p> <strong>-  Account Frozen Risk:</strong><br /><span className="d-block ms-3">Accounts may be frozen or confiscated by judicial institutions in case of debt defaults or alleged crimes.</span></p>
                <br />
                <hr />
                <br /><strong> Prohibited Actions on URG-X: </strong><br /><br />
                <p>1. Money laundering, fraudulent transactions, illegal fundraising, and fraud are strictly prohibited. Registering under false identities or providing fraudulent KYC information will lead to account suspension, asset freezing, or termination.</p>
                <p>2. This risk disclosure does not cover all potential risks in the cryptocurrency market. It is your responsibility to thoroughly understand transaction rules, promotions, agreements, and this risk disclosure before engaging in cryptocurrency transactions.</p>
                <p>3. Users are solely responsible for bearing trading risks on URG-X. URG-X does not make any promises or guarantees regarding user losses or gains.</p>
                <hr />
                <br /><strong>User Commitment:</strong><br /><br />
                <p>By using URG-X, you agree to the terms outlined in this Risk Disclosure Agreement. Your commitment to adhering to the national and regional laws and regulations of Kyrgyzstan, and your registered residence. Any violations or conduct triggering URG-X' risk-control measures may result in account suspension, investigation, and legal consequences, with all associated losses and liabilities borne by the user.</p>
                <p>Reminder : Please be aware that by clicking to agree to this risk disclosure, you acknowledge your understanding and acceptance of cryptocurrency transaction risks and potential losses. URG-X is not obligated to refund cryptocurrency principal or interests or assume any other responsibilities.</p>
                <p>Thank you for choosing URG-X, and please trade responsibly.</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

export default RiskDisclosure;