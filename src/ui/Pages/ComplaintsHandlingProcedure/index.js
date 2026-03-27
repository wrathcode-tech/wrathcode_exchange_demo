import React from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";

const ComplaintsHandlingProcedure = () => {

  return (
    <>
      <Helmet>
        <title>Complaints Handling Procedure – Wrathcode Exchange</title>

        <meta
          name="description"
          content="Learn about the complaints procedure at Wrathcode Exchange. Our process ensures transparency, fairness and resolution for users."
        />

        <meta
          name="keywords"
          content="complaints procedure crypto, Wrathcode Exchange support complaints, exchange dispute resolution, crypto platform user rights"
        />
      </Helmet>


      <div className="hero-banner-style top-section-gap ">
        <section className=" faq_sec ">
          <div className="container">
            <div className="row align-items-center justify-content-center">
              <div className="col-lg-8 col-md-12">
                <div className="section-title ">
                  <h1 className="text-gradient text-center">Complaint Handling Procedure</h1>
                </div>
              </div>
            </div>
          </div>
        </section>
        <div className="termsofuse">
          <div className="container ">
            <h3>1. Introduction</h3>
            <p>This procedure outlines how Lunexor s.r.o., operator of the Wrathcode Exchange platform, handles complaints submitted by its users.</p>
            <p>This procedure complies with:</p>
            <ul>
              <li>Regulation (EU) 2023/1114 (MiCA) – Article 71</li>
              <li>Directive 2013/11/EU on alternative dispute resolution (ADR)</li>
              <li>EU consumer protection law</li>
              <li>ESMA/EBA best practices for CASP operators</li>
            </ul>
            <p>Complaints may concern:</p>
            <ul>
              <li>Technical or operational issues</li>
              <li>Platform errors or malfunctions</li>
              <li>Disputes about identity, security, transactions, or wallets</li>
              <li>Account freezes or closures, and claims on returns or allocations</li>
              <li>Non-compliance with contractual terms</li>
            </ul>
            <h3>2. Definition of a Complaint</h3>
            <p>A “complaint” refers to any written communication from a user that:</p>
            <ul>
              <li>Expresses dissatisfaction with a Wrathcode Exchange service</li>
              <li>Concerns technical, operational, or contractual issues</li>
              <li>Challenges actions or omissions by Wrathcode Exchange staff or systems</li>
            </ul>
            <h3>3. How to Submit a Complaint</h3>
            <p>Complaints must be submitted in writing, preferably via email:</p>
            <p><strong>Email:</strong> <a href="mailto:support@wrathcode.com.">support@wrathcode.com.</a><br /><strong>Subject:</strong> “Official Complaint – [Full Name / User ID]”</p>
            <p>The complaint should include:</p>
            <ul>
              <li>User’s full name</li>
              <li>Email linked to the account</li>
              <li>User ID (if available)</li>
              <li>Clear description of the issue</li>
              <li>Relevant documents or screenshots</li>
              <li>Date of the incident</li>
            </ul>
            <h3>4. Handling Process</h3>
            <p><strong>Phase 1 – Receipt and Acknowledgment</strong></p>
            <ul>
              <li>Complaint is logged in the internal system</li>
              <li>User receives an acknowledgment within 5 business days</li>
            </ul>
            <p><strong>Phase 2 – Assessment</strong></p>
            <ul>
              <li>Compliance and technical teams review the complaint</li>
              <li>Additional information may be requested</li>
            </ul>
            <p><strong>Phase 3 – Response</strong></p>
            <ul>
              <li>A reasoned response is sent within 15 business days (or up to 30 calendar days in complex cases)</li>
              <li>User will be notified if a delay occurs, with reasons and new deadlines</li>
            </ul>
            <h3>5. Response Format</h3>
            <p>The final response will include:</p>
            <ul>
              <li>A summary of the findings</li>
              <li>Rationale for the decision</li>
              <li>Any corrective actions or compensation</li>
              <li>Instructions for escalation if not satisfied</li>
            </ul>
            <h3>6. Escalation and Alternative Dispute Resolution (ADR)</h3>
            <p>If dissatisfied with the outcome, users may:</p>
            <ul>
              <li>Request a review by the Compliance Team</li>
              <li>Initiate ADR via a body recognized under Directive 2013/11/EU</li>
              <li>Submit a complaint to the Czech Trade Inspection Authority (CTIA), or, where relevant, the FAU or CNB</li>
            </ul>
            <h3>7. Retention of Complaints</h3>
            <p>All complaints and related correspondence will be retained for a minimum of 5 years, in compliance with Article 67 of MiCA and EU law.</p>
            <h3>8. User Guarantees</h3>
            <ul>
              <li>The procedure is free of charge</li>
              <li>Platform services will not be suspended during complaint processing, unless fraud or legal action is involved</li>
              <li>Users receive written confirmation for all complaint-related communications</li>
            </ul>
            <h3>9. Updates to the Procedure</h3>
            <p>This procedure may be updated due to:</p>
            <ul>
              <li>Regulatory changes</li>
              <li>Technical or operational developments</li>
              <li>Supervisory authority guidance</li>
            </ul>
            <h3>10. Contact</h3>
            <p><strong>Complaints Officer</strong><br />Wrathcode Exchange – Lunexor s.r.o.<br /><strong>Email:</strong> <a href="mailto:support@wrathcode.com.">support@wrathcode.com.</a><br /><strong>Supported Languages:</strong> English, Czech</p>
          </div>
        </div>
      </div>
    </>
  );
}

export default ComplaintsHandlingProcedure;