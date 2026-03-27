import React from "react";
import { Helmet } from "react-helmet-async";

const GeneralDisclaimer = () => {

  return (
    <>
      <Helmet>
        <title>General Disclaimer – Wrathcode Exchange Crypto Exchange</title>

        <meta
          name="description"
          content="Review the general disclaimer for Wrathcode Exchange: trading risks, regulatory status and user responsibilities."
        />

        <meta
          name="keywords"
          content="general disclaimer crypto, trading risk notice, Wrathcode Exchange disclaimer, crypto platform risk"
        />
      </Helmet>

      <div className="hero-banner-style top-section-gap ">
        <section className=" faq_sec ">
          <div className="container">
            <div className="row align-items-center justify-content-center">
              <div className="col-lg-8 col-md-12">
                <div className="section-title ">
                  <h1 className="text-gradient text-center">General Disclaimer – Wrathcode Exchange / Lunexor s.r.o.</h1>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="termsofuse">
          <div className="container">
            <p>This statement is intended to clarify the limitations of liability and general conditions applicable to the use of the services offered through the Wrathcode Exchange platform, operated by Lunexor s.r.o., a company based at Kurzova 2222/16, 155 00 Prague 5, Czech Republic. Lunexor is registered as a Virtual Asset Service Provider (VASP) and is currently undergoing authorization as a Crypto-Asset Service Provider (CASP) under Regulation (EU) 2023/1114 (MiCA).</p>
            <h3>1. No Financial, Legal or Tax Advice</h3>
            <p>Wrathcode Exchange does not provide financial, legal, or tax advice of any kind. All information published on the platform or shared by support representatives—whether in written, visual, or interactive format—is strictly informational and educational.</p>
            <p>Users are strongly advised to consult with qualified professionals before making any investment decisions or engaging in crypto-asset transactions.</p>
            <h3>2. User Assumption of Risk</h3>
            <p>By using the platform, users acknowledge and accept that:</p>
            <ul>
              <li>The purchase, sale, custody, or allocation of crypto-assets involves significant risks, including the total loss of capital</li>
              <li>Crypto-asset values are highly volatile and unpredictable</li>
              <li>No returns are guaranteed, and no government-backed capital protection exists</li>
              <li>Use of Wrathcode Exchange services is done at the sole risk of the user</li>
            </ul>
            <h3>3. Limitation of Liability</h3>
            <p>Wrathcode Exchange and Lunexor s.r.o. shall not be held liable for:</p>
            <ul>
              <li>Financial losses arising from independent user decisions</li>
              <li>Delays, outages, or technical issues affecting the platform</li>
              <li>Cyberattacks, software bugs, or third-party vulnerabilities</li>
              <li>Regulatory decisions leading to the delisting or restriction of crypto-assets</li>
              <li>Temporary service interruptions due to force majeure or enforcement actions</li>
            </ul>
            <p>Where liability may apply, it shall be strictly limited to the total fees paid by the user during the 12 months preceding the event giving rise to the claim.</p>
            <h3>4. Content Modification and Updates</h3>
            <p>Lunexor s.r.o. reserves the right to:</p>
            <ul>
              <li>Update or amend the information published on the platform at any time without notice</li>
              <li>Modify its Terms and Conditions, service structure, and operational policies</li>
              <li>Adapt to evolving regulations and directives from supervisory authorities</li>
            </ul>
            <p>It is the user’s responsibility to periodically review official documents published on the platform.</p>
            <h3>5. Governing Law and Jurisdiction</h3>
            <p>This disclaimer is governed by the laws of the Czech Republic. All disputes shall be subject to the exclusive jurisdiction of the courts of Prague.</p>
          </div>
        </section>
      </div>
    </>
  );
}

export default GeneralDisclaimer;