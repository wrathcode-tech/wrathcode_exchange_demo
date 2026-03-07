import React, { useState } from "react";

const FAQKyc = () => {
  const [changeScreen, setChangeScreen] = useState("main");
  return (
    <div className="col-lg-8">
      <nav aria-label="breadcrumb" className="mb-3">
        <ol className="breadcrumb  faq_breadcrumb mt-0 pb-3">
          <li className="breadcrumb-item">
            <a href="#/">Faq</a>
          </li>
          <li
            className="breadcrumb-item cursor-pointer"
            aria-current="page"
            onClick={() => {
              setChangeScreen("main");
            }}
          >
            Know Your Customer (KYC)
          </li>
          {changeScreen !== "main" && (
            <li className="breadcrumb-item active text-warning  cursor-pointer" aria-current="page">
              {changeScreen}
            </li>
          )}
        </ol>
        <hr />
      </nav>

      {/* Account Mangement */}
      {changeScreen === "main" && (
        <div className="faq_list">
          <a
            href="#"
            className="faq_item card text-start"
            onClick={() => {
              setChangeScreen("Verification");
            }}
          >
            <h5 className="mb-0"> Verification</h5>
            <i className="ri-arrow-right-line"></i>
          </a>
          <a
            href="#"
            className="faq_item card text-start"
            onClick={() => {
              setChangeScreen("Pending/Rejected/Fail Status");
            }}
          >
            <h5 className="mb-0">Pending/Rejected/Fail Status </h5>
            <i className="ri-arrow-right-line"></i>
          </a>
        </div>
      )}



      {/* Verification Tab */}
      {changeScreen === "Verification" && (
        <div className="faq " id="accordionExample">

          <div className="card p-0  ">
            <h2 className="card-header" id="headingcollapse_1">
              <button className="accordion-button p-0  collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse_1" aria-expanded="false" aria-controls="collapse_1">
                Why is identity verification required?
              </button>
            </h2>
            <div id="collapse_1" className="accordion-collapse collapse" aria-labelledby="headingcollapse_1" data-bs-parent="#accordionExample">
              <div className="card-body card-body-padding-top text-align-start border-bottom ">
                <div className="faq_text" >
                  <p className=" ">
                    To comply with KYC (Know Your Customer) regulations, URG-Ximplements identification verification.
                    <br />
                    KYC is a crucial process that involves verifying and confirming the identity of customers to ensure they
                    are who they claim to be. This multi-step procedure plays a vital role in preventing the creation and
                    utilization of fraudulent accounts.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="card  p-0 ">
            <h2 className="card-header" id="headingcollapse_2">
              <button className="accordion-button p-0 collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse_2" aria-expanded="false" aria-controls="collapse_2">
                How can I complete my KYC?
              </button>
            </h2>
            <div id="collapse_2" className="accordion-collapse collapse" aria-labelledby="headingcollapse_2" data-bs-parent="#accordionExample">
              <div className="card-body card-body-padding-top  border-bottom">
                <div className="faq_text" >
                  <p className=" mb-0 ">
                    To complete your KYC, you will need to submit the following documents.
                    National Identity document: National ID card, valid passport
                    <br />
                    <h6>National Identity document Verification</h6>
                    <ol>
                      <li>1. Log into your URG-Xwebsite and click on ‘Verify Account’</li>
                      <li>2. To upload documents, click on ‘Continue via document upload’ option.</li>
                      <li>3. Select the passport option and click on ‘Ok’ to give camera access.</li>
                      <li>4. Take clear photographs of the front and back of your identity document and Submit.</li>
                    </ol>
                    <h6>Take a selfie</h6>
                    <ol>
                      <li>1. To confirm your identity, now click on ‘Take Selfie’.</li>
                      <li>2. Ensure that you have good lighting, clear background and adjust your face inside the oval before clicking a selfie without your
                        spectacles. Submit your photo.</li>
                      <br />
                      Your KYC verification is complete!
                      <br />
                      <strong>Note: </strong>It is mandatory for all users to complete their KYC to use deposit/withdrawal services. If you are an existing user of URG-X 
                      and your KYC has been verified, you do not have to do it again.
                    </ol>
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="card  p-0  ">
            <h2 className="card-header" id="headingcollapse_3">
              <button className="accordion-button p-0 collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse_3" aria-expanded="false" aria-controls="collapse_3">
                What documents do I need to submit for KYC verification?
              </button>
            </h2>
            <div id="collapse_3" className="accordion-collapse collapse" aria-labelledby="headingcollapse_3" data-bs-parent="#accordionExample">
              <div className="card-body card-body-padding-top border-bottom  ">
                <div className="faq_text" >
                  <p className="mb-0" > You will need to submit the following documents to complete your KYC.</p>
                  <br />
                  <strong>National ID Verification:</strong>
                  <p>Your govt. approved National ID number and date of birth (mandatory)</p>
                  <br />
                  <strong>Manual Flow:</strong>
                  <p>Valid Passport (front and back)</p>
                  <br />
                  <strong>Liveliness check:</strong><p>Live Selfie</p>
                  <br />
                  <strong>International users:</strong>
                  <p>Please get in touch with our support team and they will assist you further in the KYC verification process.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="card p-0  ">
            <h2 className="card-header" id="headingcollapse_4">
              <button className="accordion-button p-0  collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse_4" aria-expanded="false" aria-controls="collapse_4">
                How much time will it take to complete my KYC process?
              </button>
            </h2>
            <div id="collapse_4" className="accordion-collapse collapse" aria-labelledby="headingcollapse_4" data-bs-parent="#accordionExample">
              <div className="card-body card-body-padding-top  border-bottom ">
                <div className="faq_text" >
                  <p className="mb-0">
                    KYC verification process is fully automated and is completed within 10 minutes. However, if the process is done
                    manually, it can take between 24 and 48 hours to complete.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="card p-0  ">
            <h2 className="card-header" id="headingcollapse_5">
              <button className="accordion-button p-0  collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse_5" aria-expanded="false" aria-controls="collapse_5">
                Can I make deposits/withdrawals on URG-Xwithout completing my KYC?
              </button>
            </h2>
            <div id="collapse_5" className="accordion-collapse collapse" aria-labelledby="headingcollapse_5" data-bs-parent="#accordionExample">
              <div className="card-body card-body-padding-top  border-bottom ">
                <div className="faq_text" >
                  <p className="mb-0" >
                    To access crypto withdrawal facilities, users are obligated to complete their
                    KYC (Know Your Customer) verification.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="card p-0  ">
            <h2 className="card-header no-border" id="headingcollapse_6">
              <button className="accordion-button p-0  collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse_6" aria-expanded="false" aria-controls="collapse_6">
                Why am I unable to upload my documents?
              </button>
            </h2>
            <div id="collapse_6" className="accordion-collapse collapse" aria-labelledby="headingcollapse_6" data-bs-parent="#accordionExample">
              <div className="card-body card-body-padding-top   border-bottom border-top">
                <div className="faq_text" >
                  <p className="mb-0">
                    If you are facing issues to upload your documents, please perform the
                    following checks:
                    <ol>
                      <li>1.Check the size and format of each document.</li>
                      <ol>
                        <li>• Size should not exceed more than 4 MB.</li>
                        <li>• File format should be in png, jpeg, jpg, or pdf format.</li>
                      </ol>
                    </ol>
                    <ol>
                      <li>2.Check whether the user is using a mobile application or browser</li>
                      <ol>
                        <li>• If you are using mobile application, try to upload the documents
                          from a phone browser/laptop, or computer.</li>
                      </ol>
                    </ol>

                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="card p-0  ">
            <h2 className="card-header no-border" id="headingcollapse_7">
              <button className="accordion-button p-0  collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse_7" aria-expanded="false" aria-controls="collapse_6">
                Will my KYC documents be safe with URG-X ?
              </button>
            </h2>
            <div id="collapse_7" className="accordion-collapse collapse" aria-labelledby="headingcollapse_7" data-bs-parent="#accordionExample">
              <div className="card-body card-body-padding-top   border-bottom border-top">
                <div className="faq_text" >
                  <p className="mb-0">
                    At URG-X , we prioritize security above all else for both our platform and company. Your information is entirely secure with
                    us, as we employ consistent and robust security software for both our crypto-wallets and identity management system.
                    Rest assured that your data is in safe hands.
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>

      )}


      {/* Verification Tab */}
      {changeScreen === "Pending/Rejected/Fail Status" && (
        <div className="faq " id="accordionExample">

          <div className="card p-0  ">
            <h2 className="card-header" id="headingcollapse_1">
              <button className="accordion-button p-0  collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse_1" aria-expanded="false" aria-controls="collapse_1">
                Why did my KYC verification fail?
              </button>
            </h2>
            <div id="collapse_1" className="accordion-collapse collapse" aria-labelledby="headingcollapse_1" data-bs-parent="#accordionExample">
              <div className="card-body card-body-padding-top text-align-start border-bottom ">
                <div className="faq_text" >
                  <p className=" ">
                    <ol>
                      KYC verification could have failed for any of the following possible reasons:
                      <li>1. Details you entered didn’t match with the details on the images of the documents you have submitted.</li>
                      <li>2. Submitted images were blurred or have too much glare making the text on the images difficult to read.</li>
                      <li>3. Submitted images are missing a required detail.</li>
                      <li>4. Documents belong to a minor, i.e., below 18 years of age.</li>
                      <li>5. KYC with the same set of documents (multiple or duplicate KYC).</li>
                    </ol>
                    <p>In order to prevent such errors, please ensure to follow the guidelines provided below:</p>
                    <ol>
                      <strong>For Selfies:</strong>
                      <li>1. Please make sure the lighting is proper.</li>
                      <li>2. Avoid using any filters or image editing software on the image.</li>
                      <li>3. Do not crop your selfie. Align your face in the oval shape visible on the screen and click the picture.</li>
                      <li>4. Selfie should not be older than 24 hours of uploading.</li>
                      <li>5. Avoid wearing spectacles or glasses for the selfie.</li>
                      <li>6. Selfie should be in .jpeg, .jpg or .png format.</li>
                    </ol>

                    <ol>
                      <strong>For Documents:</strong>
                      <li>1. All required sides of the document and the characters in it should be clearly visible..</li>
                      <li>2. Only submit images of the original documents. Photocopies, scanned documents are not accepted.</li>
                      <li>3. Please upload a high-quality image with clear text and without any glare or blur.</li>
                      <li>4. Your name should match the name on the document. The order, abbreviations (if any), and spellings of the first name and the last name you entered in the fields should be the same as they are in the documents you have uploaded.</li>
                      <li>5. Size of the document should not exceed more than 4 MB.</li>
                      <li>6. Documents should be in .jpeg, .jpg or .png format..</li>
                    </ol>
                    <p>If you are still in doubt, please don’t worry. You can get in touch with our support team and they will assist you further in the KYC verification process.</p>
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="card  p-0 ">
            <h2 className="card-header" id="headingcollapse_2">
              <button className="accordion-button p-0 collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse_2" aria-expanded="false" aria-controls="collapse_2">
                KYC rejection reason is not clear. What should I do?
              </button>
            </h2>
            <div id="collapse_2" className="accordion-collapse collapse" aria-labelledby="headingcollapse_2" data-bs-parent="#accordionExample">
              <div className="card-body card-body-padding-top  border-bottom">
                <div className="faq_text" >
                  <h6>1. KYC rejected due to BAV name mismatch</h6>
                  <p className="mb-0">
                    We regret to inform you that your KYC was rejected as your name did not match with the bank documents provided. Kindly upload the
                    document for (Registered user) so we can verify the details again.
                  </p>

                  <h6>2. KYC is rejected due to incorrect documents</h6>
                  <p className="mb-0">
                    We regret to inform you that your KYC was rejected as the documents uploaded were incorrect. Kindly upload the correct document and
                    we will work on your request again.
                  </p>
                  <h6>3. Photocopy document uploaded</h6>
                  <p className="mb-0">
                    As per our policies and for security reasons, tampered with/hand-written/photocopies/screenshots/photoscreen/minor PAN cards are
                    unacceptable. Kindly upload the original document for verification.
                  </p>
                  <h6>4. Photoscreen document uploaded</h6>
                  <p className="mb-0">
                    We regret to inform you that your KYC was rejected as the document provided was a screengrab of the original document. To provide our
                    users with a secure platform, we only accept original documents, so please upload original documents for verification and we will work on
                    your request again.
                  </p>
                  <h6>5. KYC rejected due to multiple accounts</h6>
                  <p className="mb-0">
                    Kindly note that a user can have only one URG-Xaccount; multiple accounts will not be accepted.
                  </p>
                  <h6>6. KYC is rejected due to masked documents</h6>
                  <p className="mb-0">
                    We regret to inform you that your KYC was rejected as the document was masked. Kindly upload an unmasked document and we will work on your
                    request again.
                  </p>
                  <h6>7.KYC is rejected due to tampered documents</h6>
                  <p className="mb-0">
                    We regret to inform you that your KYC was rejected as the documents uploaded were tampered with. We request you to provide us with original
                    documents for verification so we can work on your request again.
                  </p>
                  <h6>8. KYC is rejected due to hand-written documents</h6>
                  <p className="mb-0">
                    We regret to inform you that your KYC was rejected as your name did not match with the bank documents provided. Kindly upload the
                    document for (Registered user) so we can verify the details again.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="card  p-0  ">
            <h2 className="card-header" id="headingcollapse_3">
              <button className="accordion-button p-0 collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse_3" aria-expanded="false" aria-controls="collapse_3">
                What type of bank accounts are accepted for verification?
              </button>
            </h2>
            <div id="collapse_3" className="accordion-collapse collapse" aria-labelledby="headingcollapse_3" data-bs-parent="#accordionExample">
              <div className="card-body card-body-padding-top border-bottom  ">
                <div className="faq_text" >
                  <p className="mb-0" >URG-Xaccepts the following bank account types for verification:</p>
                  <strong>For Individual:</strong> <p>savings bank account.</p>
                  <strong>For Enterprise/Corporate/Proprietorship:</strong> <p>current bank account in the name of the company.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="card p-0  ">
            <h2 className="card-header" id="headingcollapse_4">
              <button className="accordion-button p-0  collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse_4" aria-expanded="false" aria-controls="collapse_4">
                Why was my KYC rejected due to “Account already exists” error?
              </button>
            </h2>
            <div id="collapse_4" className="accordion-collapse collapse" aria-labelledby="headingcollapse_4" data-bs-parent="#accordionExample">
              <div className="card-body card-body-padding-top  border-bottom ">
                <div className="faq_text" >
                  <p className="mb-0">
                    Your KYC verification could have failed because the ID card information you uploaded
                    already exists for another URG-Xaccount
                  </p>
                  <p className="mb-0">
                    Kindly note that we cannot proceed with KYC verification if the same documents already
                    exist in our system.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="card p-0  ">
            <h2 className="card-header" id="headingcollapse_5">
              <button className="accordion-button p-0  collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse_5" aria-expanded="false" aria-controls="collapse_5">
                Why was my KYC rejected due to Invalid ID card?
              </button>
            </h2>
            <div id="collapse_5" className="accordion-collapse collapse" aria-labelledby="headingcollapse_5" data-bs-parent="#accordionExample">
              <div className="card-body card-body-padding-top  border-bottom ">
                <div className="faq_text" >
                  <p className="mb-0" >Please be advised that if you already have a URG-Xprofile with the same ID Card, you will be
                    unable to create a new URG-Xaccount.</p>
                  <p>We recommend that you attempt logging into the initial account with which you registered your ID Card.</p>
                </div>
              </div>
            </div>
          </div>

        </div>

      )}

    </div>
  );
}

export default FAQKyc
