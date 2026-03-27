import React from "react";
import { Helmet } from "react-helmet-async";

const AmlPolicy = () => {

  return (
    <>
      <Helmet>
        <title>AML & KYC Policy – Wrathcode Exchange</title>

        <meta
          name="description"
          content="Understand Wrathcode Exchange’ Anti-Money Laundering and Know Your Customer policies. Transparent, compliant and trader-focused."
        />

        <meta
          name="keywords"
          content="aml kyc crypto exchange, Wrathcode Exchange compliance policy, know your customer crypto, exchange aml policy"
        />
      </Helmet>

      <div className="hero-banner-style top-section-gap ">
        <section className=" faq_sec ">
          <div className="container">
            <div className="row align-items-center justify-content-center">
              <div className="col-lg-8 col-md-12">
                <div className="section-title ">
                  <h1 className="text-gradient text-center">Anti-Money Laundering (AML) and Know Your Customer (KYC) Policy</h1>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="termsofuse">
          <div className="container">
            <h3>1. Introduction</h3>
            <p>This Anti-Money Laundering (AML) and Know Your Customer (KYC) Policy outlines the measures implemented by Lunexor s.r.o., operator of the Wrathcode Exchange platform, to prevent misuse of its services for money laundering, terrorist financing, or other illicit activities.</p>
            <p>This policy is drafted in accordance with:</p>
            <ul>
              <li>EU Directives 2015/849 (AMLD4), 2018/843 (AMLD5), 2018/1673 (AMLD6)</li>
              <li>Regulation (EU) 2023/1114 (“MiCA”)</li>
              <li>FATF/GAFI recommendations</li>
            </ul>
            <p>Lunexor s.r.o. is registered in the Czech register of obliged entities (VASP) and is currently completing its transition to become an authorized Crypto-Asset Service Provider (CASP).</p>
            <h3>2. Policy Objectives</h3>
            <ul>
              <li>Prevent laundering of illicit funds</li>
              <li>Avoid the use of the platform for terrorist financing</li>
              <li>Identify and verify clients (KYC and CDD)</li>
              <li>Report suspicious transactions to the relevant authorities</li>
              <li>Monitor activities in real time and over time</li>
            </ul>
            <h3>3. Identity Verification (KYC)</h3>
            <p>Opening an account on Wrathcode Exchange is conditional on completing the KYC process, which includes:</p>
            <ul>
              <li>Document verification: Valid ID and proof of residence (e.g., utility bill, bank statement)</li>
              <li>Biometric data (if required)</li>
              <li>Video verification or selfie (liveness check)</li>
              <li>Automated cross-checks through certified providers (e.g., Sumsub)</li>
            </ul>
            <p>Verification is mandatory for:</p>
            <ul>
              <li>All available services (trading, staking, savings, OTC, etc.)</li>
              <li>Any deposit or withdrawal</li>
              <li>Both individual and institutional clients</li>
            </ul>
            <h3>4. Customer Due Diligence (CDD)</h3>
            <p>All clients are classified based on risk:</p>
            <p><strong>Risk Categories:</strong></p>
            <ul>
              <li><strong>Low:</strong> Individuals with a simple profile and traceable fund origin</li>
              <li><strong>Medium:</strong> Companies, foreign clients, high transaction volumes</li>
              <li><strong>High:</strong> Politically exposed persons (PEPs), operations in high-risk jurisdictions, anonymous transactions</li>
            </ul>
            <p>High-risk clients are subject to Enhanced Due Diligence (EDD):</p>
            <ul>
              <li>Request for additional documents</li>
              <li>Source of funds analysis</li>
              <li>More frequent monitoring</li>
            </ul>
            <h3>5. Monitoring and Controls</h3>
            <p>Wrathcode Exchange uses automated systems for:</p>
            <ul>
              <li>Blockchain transaction tracking (blockchain forensics)</li>
              <li>Behavioral analysis and detection of unusual patterns</li>
              <li>Automatic flags for thresholds, suspicious assets, blacklisted jurisdictions</li>
            </ul>
            <p>All wallets are subject to whitelisting and AML checks for incoming and outgoing transactions.</p>
            <h3>6. Reporting and Cooperation with Authorities</h3>
            <p>Lunexor s.r.o. is committed to:</p>
            <ul>
              <li>Reporting all suspicious transactions to the Financial Analytical Office (FAU) of the Czech Republic</li>
              <li>Providing documentation and support in investigations</li>
              <li>Retaining KYC and transaction data for at least 5 years after the end of the business relationship, as required by EU law</li>
            </ul>
            <h3>7. Sanctions and Prohibited Jurisdictions</h3>
            <p>Access to Wrathcode Exchange services is prohibited for individuals or entities located in:</p>
            <ul>
              <li>Countries under international sanctions (e.g., North Korea, Iran)</li>
              <li>Jurisdictions on the AML blacklist (FATF)</li>
              <li>Individuals or entities on sanctions lists (OFAC, EU, UN)</li>
            </ul>
            <p><strong>Use of VPNs or anonymization techniques may result in immediate account suspension.</strong></p>
            <h3>8. Policy Review and Updates</h3>
            <p>This policy is reviewed annually or whenever significant regulatory changes occur. It is adapted in accordance with updates to MiCA and European AML best practices.</p>
            <h3>9. Contact</h3>
            <p>For inquiries regarding KYC or compliance, please contact us at:</p>
            <p><strong>Email:</strong> <a href="mailto:compliance@Wrathcode Exchange.com">compliance@Wrathcode Exchange.com</a></p>
          </div>
        </section>
      </div>
    </>
  );
}

export default AmlPolicy;