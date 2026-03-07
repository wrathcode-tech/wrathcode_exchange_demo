import React from "react";
import { Link } from "react-router-dom";

const PrivacyPolicy = () => {

  return (
    <section className="  section-padding feature_bg pc_bg  login_sec" >
      <div className="container">
        <div className="inner text-center">
          <h2 className="title"> Privacy Policy </h2>
          <nav className="mt-4">
            <ol className="breadcrumb justify-content-center">
              <li className="breadcrumb-item"><Link to="/">Home</Link></li>
              <li className="breadcrumb-item active" aria-current="page">Privacy Policy</li>
            </ol>
          </nav>
        </div>
      </div>
      <section className="pb-90 pt-5 ">
        <div className="container">
          <div className="row" >
            <div className="col-md-10 m-auto" >
              <div className="create-item-wrapper plicy_sec" >
                <div className="row align-items-center py-5">
                  <div className="col-lg-12">
                    <div>
                      <h3>Privacy Policy for URG-X</h3>

                      <p>At URG-X.io, accessible from https://cvtrade.io, one of our primary commitments is ensuring the privacy and security of our visitors' information. This Privacy Policy outlines the types of data we collect, how it is used, and the measures we take to protect your privacy.</p>
                      <br />
                      <h3>About Us</h3>

                      <p>URG-X is operated by C.V. TECH SERVICES CO., LTD., a registered company under Thai law with the following details:
                      </p>
                        <ul>
                          <li><h6>  Company Name: C.V. TECH SERVICES CO. , LTD. </h6> </li>
                          <li> <h6>     Registered Number: 0105567206517  </h6></li>
                          <li> <h6>   Registered Capital: 4,000,000 Baht </h6></li>
                          <li> <h6>  Industry Group: 66123 (Activities of bureaux de change) </h6></li>
                          <li> <h6>     Registration Date: October 4, 2024</h6></li>
                        </ul>

                      <p>By using our platform, you consent to this Privacy Policy and agree to its terms.</p>
                      <br />
                      <h3>Information We Collect</h3>

                      <p>We collect both personal and non-personal information to improve your experience on our platform. The types of information collected include: Personal Information: When registering for an account or directly contacting us, you may be asked to provide details such as your name, email address, phone number, and company information. Transaction Information: We collect information related to your cryptocurrency trades, deposits, withdrawals, and other financial activities on the platform. Technical Data: This includes your IP address, browser type, device information, and other usage statistics for analysis and to optimize our services.</p>
                      <br />
                      <h3>How We Use Your Information</h3>

                      <p>We use the information collected for the following purposes: To provide, operate, and maintain our services and website To improve and personalize your experience on the platform To communicate with you regarding account management, updates, customer service, and marketing To prevent and detect fraud, ensuring the security of our platform and users To comply with legal and regulatory obligations</p>

                      <p>Data Security Your data is securely stored and processed in accordance with industry best practices and applicable laws. We implement encryption and access control measures to safeguard your information against unauthorized access.</p>
                      <br />
                      <h3>Log Files</h3>

                      <p>URG-X.io follows standard procedures for using log files. These files track visits to our site and may include details such as IP addresses, browser types, and referring pages. This data is collected to analyze site usage, monitor security, and gather demographic insights.</p>
                      <br />
                      <h3>Cookies and Tracking</h3>

                      <p>URG-X.io uses cookies to store user preferences and enhance your browsing experience. Cookies help us understand how you interact with our site, allowing us to tailor content and features to suit your needs.</p>
                      <br />
                      <h3>Third-Party Services</h3>

                      <p>Some third-party services, such as advertising partners or analytics providers, may collect information from our users. Please refer to the privacy policies of these services for detailed information on how they handle user data.</p>
                      <br />
                      <h3>GDPR and CCPA Compliance</h3>

                      <p>URG-X respects your privacy rights as outlined under the General Data Protection Regulation (GDPR) and the California Consumer Privacy Act (CCPA). If you reside in the EU or California, you have the following rights: Right to access your personal data Right to correct or update inaccurate information Right to request data deletion Right to object to data processing or withdraw consent If you wish to exercise any of these rights, please contact us at info@cvtrade.io.</p>
                      <br />
                      <h3>Children's Privacy</h3>

                      <p>URG-X.io does not knowingly collect personal information from children under the age of 13. If you believe your child has provided us with personal data, please contact us immediately, and we will take the necessary steps to remove such information.</p>
                      <br />
                      <h3>Changes to the Privacy Policy</h3>

                      <p>We may update this Privacy Policy from time to time to reflect changes in our services or legal obligations. Any changes will be posted on this page, and your continued use of the platform will signify your acceptance of the up <br />dated terms.</p>

                      <h3>Contact Us</h3>

                      <p>If you have any questions about this Privacy Policy or need further clarification, please feel free to reach out to us at: Email: support@cvtrade.io</p>
                    </div>
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

export default PrivacyPolicy;