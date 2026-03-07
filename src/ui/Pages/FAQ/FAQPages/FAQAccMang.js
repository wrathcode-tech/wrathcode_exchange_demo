import React, { useState } from "react";

const FAQAccMang = () => {
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
            Account Management
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
          <a href="#/" className="faq_item card text-start" onClick={() => { setChangeScreen("PIN"); }}>
            <h5 className="mb-0"> PIN</h5>
            <i className="ri-arrow-right-line"></i>
          </a>
          <a href="#/" className="faq_item card text-start" onClick={() => { setChangeScreen("Create an Account"); }}>
            <h5 className="mb-0"> Create an Account </h5><i className="ri-arrow-right-line"></i></a>
          <a href="#/" className="faq_item card text-start" onClick={() => { setChangeScreen("Login"); }}>
            <h5 className="mb-0"> Login</h5>
            <i className="ri-arrow-right-line"></i>
          </a>
          <a href="#/" className="faq_item card text-start" onClick={() => { setChangeScreen("OTP"); }}>
            <h5 className="mb-0"> OTP</h5>
            <i className="ri-arrow-right-line"></i>
          </a>
          <a href="#/" className="faq_item card text-start" onClick={() => { setChangeScreen("Email"); }}>
            <h5 className="mb-0"> Email </h5>
            <i className="ri-arrow-right-line"></i>
          </a>
          <a href="#/" className="faq_item card text-start" onClick={() => { setChangeScreen("Update Profile Details"); }}>
            <h5 className="mb-0"> Update Profile Details </h5>
            <i className="ri-arrow-right-line"></i>          </a>
          <a href="#/" className="faq_item card text-start" onClick={() => { setChangeScreen("Nomination"); }}  >
            <h5 className="mb-0"> Nomination </h5>
            <i className="ri-arrow-right-line"></i>
          </a>
          <a href="#/" className="faq_item card text-start" onClick={() => { setChangeScreen("Backup Code"); }} >
            <h5 className="mb-0"> Backup Codes </h5>
            <i className="ri-arrow-right-line"></i>
          </a>
          <a href="#/" className="faq_item card text-start" onClick={() => { setChangeScreen("Account Closure"); }} >
            <h5 className="mb-0"> Account Closure </h5>
            <i className="ri-arrow-right-line"></i>
          </a>
        </div>
      )}



      {/* PIN Tab */}
      {changeScreen === "PIN" && (
        <div className="faq " id="accordionExample">
          <div className="card p-0  ">
            <h2 className="card-header" id="headingcollapse_1">
              <button className="accordion-button p-0  collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse_1" aria-expanded="false" aria-controls="collapse_1">
                Why should I Setup a PIN?
              </button>
            </h2>
            <div id="collapse_1" className="accordion-collapse collapse" aria-labelledby="headingcollapse_1" data-bs-parent="#accordionExample">
              <div className="card-body card-body-padding-top text-align-start border-bottom ">
                <div className="faq_text" >
                  <p className=" ">
                    The PIN adds an extra layer of security against account access, even if someone gets access to your phone.
                  </p>
                  <p className="mb-0">
                    For example: If someone else uses your phone and launches the URG-Xweb/app, they will be prompted to enter a six-digit PIN in order to gain access. They cannot access your URG-Xaccount on the web/app since the 6-digit PIN is exclusive to you.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="card  p-0 ">
            <h2 className="card-header" id="headingcollapse_2">
              <button className="accordion-button p-0 collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse_2" aria-expanded="false" aria-controls="collapse_2">
                Will it be mandatory in the future to create a PIN for my account?
              </button>
            </h2>
            <div id="collapse_2" className="accordion-collapse collapse" aria-labelledby="headingcollapse_2" data-bs-parent="#accordionExample">
              <div className="card-body card-body-padding-top  border-bottom">
                <div className="faq_text" >
                  <p className=" mb-0 ">
                    As part of our continued efforts to make your URG-Xaccount safe, we expect to make PIN mandatory in the future. For now, this is an optional feature, however, we encourage you to make use of it.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="card  p-0  ">
            <h2 className="card-header" id="headingcollapse_3">
              <button className="accordion-button p-0 collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse_3" aria-expanded="false" aria-controls="collapse_3">
                Will the PIN feature also be enabled for the URG-X.com on web?
              </button>
            </h2>
            <div id="collapse_3" className="accordion-collapse collapse" aria-labelledby="headingcollapse_3" data-bs-parent="#accordionExample">
              <div className="card-body card-body-padding-top border-bottom  ">
                <div className="faq_text" >
                  <p className="mb-0" > PIN feature is now also available on URG-Xapp/web.  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="card p-0  ">
            <h2 className="card-header" id="headingcollapse_4">
              <button className="accordion-button p-0  collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse_4" aria-expanded="false" aria-controls="collapse_4">
                Can I control which features I want PIN to be enabled for?
              </button>
            </h2>
            <div id="collapse_4" className="accordion-collapse collapse" aria-labelledby="headingcollapse_4" data-bs-parent="#accordionExample">
              <div className="card-body card-body-padding-top  border-bottom ">
                <div className="faq_text" >
                  <p className="mb-0">
                    PIN feature is now also available on URG-Xapp/web.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="card p-0  ">
            <h2 className="card-header" id="headingcollapse_5">
              <button className="accordion-button p-0  collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse_5" aria-expanded="false" aria-controls="collapse_5">
                Is it required to enable Biometric or FaceID unlock for my account?
              </button>
            </h2>
            <div id="collapse_5" className="accordion-collapse collapse" aria-labelledby="headingcollapse_5" data-bs-parent="#accordionExample">
              <div className="card-body card-body-padding-top  border-bottom ">
                <div className="faq_text" >
                  <p className="mb-0" >
                    No, you can unlock your account using PIN as well.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="card p-0  ">
            <h2 className="card-header no-border" id="headingcollapse_6">
              <button className="accordion-button p-0  collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse_6" aria-expanded="false" aria-controls="collapse_6">
                I have forgotten my PIN
              </button>
            </h2>
            <div id="collapse_6" className="accordion-collapse collapse" aria-labelledby="headingcollapse_6" data-bs-parent="#accordionExample">
              <div className="card-body card-body-padding-top   border-bottom border-top">
                <div className="faq_text" >
                  <p className="mb-0">
                    It happens to all of us. To reset your PIN go to Account - Security Settings - Reset Login PIN.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

      )}




      {/* Create an Account Tab */}
      {changeScreen === "Create an Account" && (
        <div className="faq " id="accordionExample">
          <div className="card p-0  ">
            <h2 className="card-header" id="headingcollapse_1">
              <button className="accordion-button p-0  collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse_1" aria-expanded="false" aria-controls="collapse_1">
                How do I sign up on URG-X?
              </button>
            </h2>
            <div id="collapse_1" className="accordion-collapse collapse" aria-labelledby="headingcollapse_1" data-bs-parent="#accordionExample">
              <div className="card-body card-body-padding-top text-align-start border-bottom ">
                <div className="faq_text" >
                  <p className=" ">
                    Download and open the official URG-XApp on <span className="text-warning" >Android</span> or <span className="text-warning"  >iOS</span> to get started. Always ensure to download and install the app from official sources only.

                  </p>
                  <ol>
                    <li>1. On the app home page, click on ‘Create account for free’.</li>
                    <li>2. Enter your full name , your email address and password, and Continue.</li>
                    <li>3. Enter OTP received on email and registered mobile number or authenticator app.</li>
                    <li>4. You're done! Registration completed.</li>

                  </ol>
                </div>
              </div>
            </div>
          </div>
          <div className="card  p-0 ">
            <h2 className="card-header" id="headingcollapse_2">
              <button className="accordion-button p-0 collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse_2" aria-expanded="false" aria-controls="collapse_2">
                What mobile devices does URG-Xsupport
              </button>
            </h2>
            <div id="collapse_2" className="accordion-collapse collapse" aria-labelledby="headingcollapse_2" data-bs-parent="#accordionExample">
              <div className="card-body card-body-padding-top  border-bottom">
                <div className="faq_text" >
                  <p className=" ">
                    The URG-Xis supported on both Android and iOS. Please ensure to download and install the app from official sources only.
                  </p>
                  <p className="">
                    You can use this link to download and install the app directly on your device: link
                  </p>
                  <p className=" mb-0 ">
                    <strong>Important</strong>: Always beware of scammers and refer to official sources only
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="card  p-0  ">
            <h2 className="card-header" id="headingcollapse_3">
              <button className="accordion-button p-0 collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse_3" aria-expanded="false" aria-controls="collapse_3">
                Can I have multiple accounts on URG-X ?
              </button>
            </h2>
            <div id="collapse_3" className="accordion-collapse collapse" aria-labelledby="headingcollapse_3" data-bs-parent="#accordionExample">
              <div className="card-body card-body-padding-top border-bottom  ">
                <div className="faq_text" >
                  <p className="mb-0" >No, you can create only one account with the registered email and mobile number. </p>
                </div>
              </div>
            </div>
          </div>
          <div className="card p-0  ">
            <h2 className="card-header" id="headingcollapse_4">
              <button className="accordion-button p-0  collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse_4" aria-expanded="false" aria-controls="collapse_4">
                Can I create a new account with the same set of KYC documents and bank account?
              </button>
            </h2>
            <div id="collapse_4" className="accordion-collapse collapse" aria-labelledby="headingcollapse_4" data-bs-parent="#accordionExample">
              <div className="card-body card-body-padding-top  border-bottom ">
                <div className="faq_text" >
                  <p className="mb-0">
                    Please note that you can only have one account with URG-Xwith the same set of KYC documents
                  </p>
                </div>
              </div>
            </div>
          </div>


        </div>

      )}





      {/* Login Tab */}
      {changeScreen === "Login" && (
        <div className="faq " id="accordionExample">
          <div className="card p-0  ">
            <h2 className="card-header" id="headingcollapse_1">
              <button className="accordion-button p-0  collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse_1" aria-expanded="false" aria-controls="collapse_1">
                How do I log in to my URG-Xaccount?
              </button>
            </h2>
            <div id="collapse_1" className="accordion-collapse collapse" aria-labelledby="headingcollapse_1" data-bs-parent="#accordionExample">
              <div className="card-body card-body-padding-top text-align-start border-bottom ">
                <div className="faq_text" >
                  <p className=" ">
                    Follow the steps below to log into your URG-Xaccount:
                  </p>
                  <ol>
                    <li>1. On the app home page, click ‘Log in’.</li>
                    <li>2. Provide the registered email and password and click Continue.</li>
                    <li>3. Provide the OTP received on registered mobile number/ email ID . And you’re done.</li>

                  </ol>

                  <p className="mb-0"> <strong>Important:</strong> Always ensure to download and install the app or web login from official sources only. Use this link to login to URG-Xon your device: link  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="card  p-0 ">
            <h2 className="card-header" id="headingcollapse_2">
              <button className="accordion-button p-0 collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse_2" aria-expanded="false" aria-controls="collapse_2">
                I am unable to login in. What should I do?
              </button>
            </h2>
            <div id="collapse_2" className="accordion-collapse collapse" aria-labelledby="headingcollapse_2" data-bs-parent="#accordionExample">
              <div className="card-body card-body-padding-top  border-bottom">
                <div className="faq_text" >
                  <p className=" ">
                    You can conduct the following checks if you're facing issues to log in:
                  </p>
                  <ol>
                    <li>1. Ensure you are logging in with the correct registered email ID. </li>
                    <li>2. Please make sure you are entering the correct password.</li>
                    <li>3. Make sure you are attempting to log in rather than to sign up. </li>

                  </ol>
                  <p className=" mb-0 ">
                    <strong>Important</strong>: Contact help center or contact us at <a href="mailto:support@urgx.com" >support@urgx.com</a>
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="card  p-0  ">
            <h2 className="card-header" id="headingcollapse_3">
              <button className="accordion-button p-0 collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse_3" aria-expanded="false" aria-controls="collapse_3">
                How do I reset my password?
              </button>
            </h2>
            <div id="collapse_3" className="accordion-collapse collapse" aria-labelledby="headingcollapse_3" data-bs-parent="#accordionExample">
              <div className="card-body card-body-padding-top border-bottom  ">
                <div className="faq_text" >
                  <p className="" >Follow the steps below to reset your URG-Xaccount password: </p>
                  <ol>
                    <li>1. Click <b>[Forgot password]</b> on the login page. </li>
                    <li>2. Provide the necessary details [Registered email / New password] and click <b>[Submit]</b>.</li>
                    <li>3. Provide the OTP received on registered email and mobile number</li>
                    <lI>4. Your password will be reset successfully. </lI>

                  </ol>
                  <p className=" mb-0 ">
                    <strong>Important</strong>:  For security reasons, withdrawals will be paused for 24 hours after changing your password
                  </p>

                </div>
              </div>
            </div>
          </div>
          <div className="card p-0  ">
            <h2 className="card-header" id="headingcollapse_4">
              <button className="accordion-button p-0  collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse_4" aria-expanded="false" aria-controls="collapse_4">
                How to change my password on URG-X ?
              </button>
            </h2>
            <div id="collapse_4" className="accordion-collapse collapse" aria-labelledby="headingcollapse_4" data-bs-parent="#accordionExample">
              <div className="card-body card-body-padding-top  border-bottom ">
                <div className="faq_text" >
                  <p className=" ">
                    Follow the steps below to change your URG-Xaccount password:
                  </p>
                  <ol>
                    <li>1. Login to URG-Xand click on the profile icon on top left of the screen. </li>
                    <li>2. Tap Security.</li>
                    <li>3. Provide the necessary details [Old / New password] and click <b> [Change Password]</b> </li>
                    <lI>4. Your password will be reset successfully. </lI>

                  </ol>
                  <p className=" mb-0 ">
                    <strong>Note</strong>:  For security reasons, withdrawals will be paused for 24 hours after changing your password.
                  </p>
                </div>
              </div>
            </div>
          </div>


          <div className="card p-0  ">
            <h2 className="card-header" id="headingcollapse_5">
              <button className="accordion-button p-0  collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse_5" aria-expanded="false" aria-controls="collapse_5">
                I am unable to reset password on URG-X. What do I do?
              </button>
            </h2>
            <div id="collapse_5" className="accordion-collapse collapse" aria-labelledby="headingcollapse_5" data-bs-parent="#accordionExample">
              <div className="card-body card-body-padding-top  border-bottom ">
                <div className="faq_text" >
                  <p className="mb-0">
                    If you are having trouble changing your password on URG-X , write to us at <b><a href="mailto:support@urgx.com" >support@urgx.com.</a></b>
                  </p>
                </div>
              </div>
            </div>
          </div>


          <div className="card p-0  ">
            <h2 className="card-header" id="headingcollapse_6">
              <button className="accordion-button p-0  collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse_6" aria-expanded="false" aria-controls="collapse_6">
                My account is blocked. How do I retrieve it?
              </button>
            </h2>
            <div id="collapse_6" className="accordion-collapse collapse" aria-labelledby="headingcollapse_6" data-bs-parent="#accordionExample">
              <div className="card-body card-body-padding-top  border-bottom ">
                <div className="faq_text" >
                  <p className="mb-0">
                    If you find your account has been blocked due to any reason, please submit a request to the support team at <b><a href="mailto:support@urgx.com" >support@urgx.com.</a></b> and they will assist you further.
                  </p>
                </div>
              </div>
            </div>
          </div>


          <div className="card p-0  ">
            <h2 className="card-header" id="headingcollapse_7">
              <button className="accordion-button p-0  collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse_7" aria-expanded="false" aria-controls="collapse_7">
                How to remove devices that I once used to login to my URG-X?
              </button>
            </h2>
            <div id="collapse_7" className="accordion-collapse collapse" aria-labelledby="headingcollapse_7" data-bs-parent="#accordionExample">
              <div className="card-body card-body-padding-top  border-bottom ">
                <div className="faq_text" >
                  <p className="">
                    You can delete or block the devices from your app in just few easy steps
                  </p>

                  <ol>
                    <li>1. Login to URG-X . </li>
                    <li>2. Click on the top right profile icon. </li>
                    <li>3. Select the ‘Profile’ section.. </li>
                    <li>4. Go to ‘Security.’ </li>
                    <li>5. Click on ‘Verified Devices’ </li>
                    <li>6. You can now remove or block any device which is displayed on the screen. </li>
                    <li>7. Click on ‘Continue’ to confirm the deletion or blocking of the device. </li>
                  </ol>
                  <p className=" mb-0 ">
                    <strong>Note</strong>:  For security reasons, withdrawals will be paused for 24 hours after changing your password.
                  </p>


                </div>
              </div>
            </div>
          </div>


        </div>

      )}




      {/* OTP Tab */}
      {changeScreen === "OTP" && (
        <div className="faq " id="accordionExample">
          <div className="card p-0  ">
            <h2 className="card-header" id="headingcollapse_1">
              <button className="accordion-button p-0  collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse_1" aria-expanded="false" aria-controls="collapse_1">
                How can I reset 2FA?
              </button>
            </h2>
            <div id="collapse_1" className="accordion-collapse collapse" aria-labelledby="headingcollapse_1" data-bs-parent="#accordionExample">
              <div className="card-body card-body-padding-top text-align-start border-bottom ">
                <div className="faq_text" >
                  <p className=" ">
                    If you have set up 2FA on your account, you can change your preference from OTP to SMS by following the below steps:
                  </p>
                  <ol>
                    <li>1. Log in to URG-Xwebsite  <b>[<a href="https://URG-X.com/" >https://URG-X.com/</a>]</b> </li>
                    <li>2. Go to <b>[Profile]</b> and select <b>[Security]</b>.</li>
                    <li>3. In the <b>[Google Authenticator]</b> option select <b>[Disable]</b> .</li>

                  </ol>

                  <p className="mb-0"> <strong>Important:</strong> You will need to have prior access to 2FA in order to disable it.In case you do not have access to 2FA yet, please raise a support ticket attached with a photo of you holding your ID that you have submitted in KYC. Our support team executive will then reset 2FA on your account  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="card  p-0 ">
            <h2 className="card-header" id="headingcollapse_2">
              <button className="accordion-button p-0 collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse_2" aria-expanded="false" aria-controls="collapse_2">
                I am getting an “Invalid OTP” error on 2FA. What should I do?
              </button>
            </h2>
            <div id="collapse_2" className="accordion-collapse collapse" aria-labelledby="headingcollapse_2" data-bs-parent="#accordionExample">
              <div className="card-body card-body-padding-top  border-bottom">
                <div className="faq_text" >
                  <p className="" > If you get an “Invalid OTP” error after entering OTP from Google Authenticator, we request you to refer the following steps:  </p>
                  <p className="" >Each code on Google Authenticator is valid for 30 seconds only, and a new code is generated every 30 seconds. Make sure you enter the OTP within the time frame.</p>
                  <p>If this doesn't’ work, we would request you to sync Google Authenticator by following the steps below: Ensure your device clock is set to the correct time zone.</p>
                  <ol>
                    <li>1. Open the Google Authenticator app.</li>
                    <li>2. Click on the three dots in the top right corner.</li>
                    <li>3. Select ‘Settings’ from the drop-down list.</li>
                    <li>4. Click ‘Time correction for codes’ and then ‘Sync now’. </li>

                  </ol>
                  <p className=" mb-0 ">
                    In case the issue still persists, please raise a Support Ticket or write to us at <b><a href="mailto:support@urgx.com" >support@urgx.com</a></b> to reset2FA, and we will help reset the OTP preference on your account to SMS.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="card  p-0  ">
            <h2 className="card-header" id="headingcollapse_3">
              <button className="accordion-button p-0 collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse_3" aria-expanded="false" aria-controls="collapse_3">
                I forgot my registered mobile number. What should I do?
              </button>
            </h2>
            <div id="collapse_3" className="accordion-collapse collapse" aria-labelledby="headingcollapse_3" data-bs-parent="#accordionExample">
              <div className="card-body card-body-padding-top border-bottom  ">
                <div className="faq_text" >
                  <p className="" >If you have forgotten your registered mobile number, you can raise a Support Ticket or write to
                    <b> <a href="mailto:support@urgx.com"> support@urgx.com</a> </b> attaching a selfie holding your original ID that you have submitted in KYC for
                    verification. Also, kindly share the mobile number you would like to update on your account. Once we
                    verify the details, we will update the number as per your request.</p>

                  <p className="" ><b> Note:</b> Make sure the details on the document are clear. Refer to the images below. </p>

                </div>
              </div>
            </div>
          </div>
          <div className="card p-0  ">
            <h2 className="card-header" id="headingcollapse_4">
              <button className="accordion-button p-0  collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse_4" aria-expanded="false" aria-controls="collapse_4">
                What should I do if I don’t receive the OTP?
              </button>
            </h2>
            <div id="collapse_4" className="accordion-collapse collapse" aria-labelledby="headingcollapse_4" data-bs-parent="#accordionExample">
              <div className="card-body card-body-padding-top  border-bottom ">
                <div className="faq_text" >
                  <p className=" ">
                    We would recommend you to:

                  </p>
                  <ol>
                    <li>1. Kindly wait for some time as the delay could be due to network congestion. </li>
                    <li>2. Click ‘Resend OTP’ if you did not receive an OTP on the first try. </li>
                    <li>3. Make sure you are getting enough signals on your phone network. </li>
                    <li>4. Kindly confirm if the mobile number is correct and you have access to it. Also, make sure that
                      the Do-Not-Disturb (DND) service is not activated on this mobile number. </li>
                    <li>5. Ensure there is sufficient memory storage to receive SMS. </li>
                    <li>6. Restart your device to refresh the network. </li>
                    <li>7. Try logging in again or restarting your device. </li>
                    <li>8. If you are using a third party app (e.g. Truecaller) as your default app for SMS, please check
                      all the folders for the OTP message (Junk/Business). </li>

                  </ol>
                  <p>If none of the above steps work, please submit a request to the support team at <a href="mailto:support@urgx.com" >support@urgx.com</a> and they will assist you further</p>
                  <p className=" mb-0 ">
                    <strong>Note</strong>:  We strongly recommend you to bind 2FA to avoid network delays in the OTP delivery.
                  </p>
                </div>
              </div>
            </div>
          </div>


          <div className="card p-0  ">
            <h2 className="card-header" id="headingcollapse_5">
              <button className="accordion-button p-0  collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse_5" aria-expanded="false" aria-controls="collapse_5">
                What should I do if OTP service on 2FA is not working?
              </button>
            </h2>
            <div id="collapse_5" className="accordion-collapse collapse" aria-labelledby="headingcollapse_5" data-bs-parent="#accordionExample">
              <div className="card-body card-body-padding-top  border-bottom ">
                <div className="faq_text" >
                  <p className=" ">
                    We would recommend you to:
                  </p>

                  <ol>
                    <li>1. Check if the time zone on your device is correct </li>
                    <li>2. Sync Google Authenticator by tapping on the Menu button (three dots) </li>
                    <li>3. Go to [Settings] and then click [Time Corrections for Codes] </li>
                    <li>4. Select [Sync now] </li>
                    <li>5. The OTP service on 2FA should work fine now. </li>
                  </ol>

                </div>
              </div>
            </div>
          </div>






        </div>

      )}





      {/* Email Tab */}
      {changeScreen === "Email" && (
        <div className="faq " id="accordionExample">
          <div className="card p-0  ">
            <h2 className="card-header" id="headingcollapse_1">
              <button className="accordion-button p-0  collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse_1" aria-expanded="false" aria-controls="collapse_1">
                What should I do if I don’t receive an activation email?
              </button>
            </h2>
            <div id="collapse_1" className="accordion-collapse collapse" aria-labelledby="headingcollapse_1" data-bs-parent="#accordionExample">
              <div className="card-body card-body-padding-top text-align-start border-bottom ">
                <div className="faq_text" >
                  <p className=" ">
                    If you haven’t received the email yet, please follow the steps below
                  </p>
                  <ol>
                    <li>1. Make sure the email you have provided is correct</li>
                    <li>2. Check your spam/junk folder</li>
                    <li>3. Add URG-Xto your mailbox whitelist</li>

                  </ol>

                  <p className="mb-0"> <strong>Important:</strong> If none of the above steps work, please use an alternate email address. Or write to us at
                    <a href="mailto:support@urgx.com" >support@urgx.com</a> </p>
                </div>
              </div>
            </div>
          </div>
          <div className="card  p-0 ">
            <h2 className="card-header" id="headingcollapse_2">
              <button className="accordion-button p-0 collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse_2" aria-expanded="false" aria-controls="collapse_2">
                How to avoid/stop URG-Xemails from going to the spam/junk folder?
              </button>
            </h2>
            <div id="collapse_2" className="accordion-collapse collapse" aria-labelledby="headingcollapse_2" data-bs-parent="#accordionExample">
              <div className="card-body card-body-padding-top  border-bottom">
                <div className="faq_text" >
                  <p className="" > If you find that your email service provider is pushing URG-Xemails into your spam/junk folder, please follow the steps below to add URG-X ’s email addresses to the safe mailing list.</p>

                  <div className="px-md-3" >
                    <h6 className="pt-2" ><b> - Outlook</b></h6>

                    <ol>
                      <li> Log in to your Outlook email and go to <b>[Settings]</b> and then select <b>[View all Outlook settings]</b></li>
                      <li> Click <b>[Email]</b> and select <b>[Junk email]</b>. You will see <b>[Safe senders and domains]</b> </li>
                      <li> Click <b>[Add]</b> to add the official URG-Xemail addresses into the list</li>
                      <li> Click <b>[Save]</b> to save your settings</li>
                      <li> Addresses to add to the safe mailing list:</li>
                      <li> <b><a className="text-warning" href="mailto:no-reply@URG-X.com" >no-reply@URG-X.com</a></b></li>
                      <li> <b><a className="text-warning" href="mailto:info@URG-X.com" >info@URG-X.com</a></b> </li>
                      <li>  <b><a className="text-warning" href="mailto:news@URG-X.com" >news@URG-X.com</a></b> </li>
                      <li> <b><a className="text-warning" href="mailto:support@urgx.com" >support@urgx.com</a></b> </li>

                    </ol>


                    <h6 className="pt-2" ><b> - Gmail </b></h6>

                    <ol>
                      <li> Log in to your Gmail account and go to <b>[Settings]</b> and then select <b>[See all settings]</b> </li>
                      <li> Go to <b>[Filters and Blocked Addresses]</b> tab and select <b>[Create a new filter]</b> </li>
                      <li> Copy and paste the official URG-Xemail addresses to the [From] field and click [Create filter] </li>
                      <li> Check the box next to <b>[Never send it to Spam]</b> and click <b>[Create filter]</b> </li>
                      <li> Addresses to add to the safe mailing list: </li>
                      <li> <b><a className="text-warning" href="mailto:no-reply@URG-X.com" > no-reply@URG-X.com</a></b> </li>
                      <li> <b><a className="text-warning" href="mailto:no-reply@URG-X.com" > info@URG-X.com</a></b> </li>
                      <li> <b><a className="text-warning" href="mailto:no-reply@URG-X.com" > news@URG-X.com</a></b> </li>
                      <li> <b><a className="text-warning" href="mailto:no-reply@URG-X.com" > support@urgx.com</a></b> </li>

                    </ol>
                  </div>


                </div>
              </div>
            </div>
          </div>






        </div>

      )}





      {/* Update Profile Details Tab */}
      {changeScreen === "Update Profile Details" && (
        <div className="faq " id="accordionExample">
          <div className="card p-0  ">
            <h2 className="card-header" id="headingcollapse_1">
              <button className="accordion-button p-0  collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse_1" aria-expanded="false" aria-controls="collapse_1">
                Can I change my registered email?
              </button>
            </h2>
            <div id="collapse_1" className="accordion-collapse collapse" aria-labelledby="headingcollapse_1" data-bs-parent="#accordionExample">
              <div className="card-body card-body-padding-top text-align-start border-bottom ">
                <div className="faq_text" >
                  <p>If you wish to change the registered email linked to your URG-Xaccount, kindly raise a Support Ticket
                    or write to us at support@urgx.com attaching a selfie holding your original ID that you have submitted in KYC for verification.</p>
                  <p className=" ">
                    We also need another selfie of you holding a piece of paper with the following information written on it
                  </p>
                  <ol>
                    <li>Current Email Address</li>
                    <li>New Email Address</li>
                  </ol>
                  <p className="mb-0"> <strong>Note:</strong> Your signature should match your ID card signature
                    Once we validate these details, we will submit a request to modify your email address. Please note that
                    this request will be subjected to approval.
                  </p>
                  <p className="mb-0">  <strong>Important:</strong>  Please refrain from making additional profiles with the updated email address you providedus to avoid profile duplication.</p>
                </div>
              </div>
            </div>
          </div>
          <div className="card  p-0 ">
            <h2 className="card-header" id="headingcollapse_2">
              <button className="accordion-button p-0 collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse_2" aria-expanded="false" aria-controls="collapse_2">
                Can I change my full name on account?
              </button>
            </h2>
            <div id="collapse_2" className="accordion-collapse collapse" aria-labelledby="headingcollapse_2" data-bs-parent="#accordionExample">
              <div className="card-body card-body-padding-top  border-bottom">
                <div className="faq_text" >
                  <p className=" ">
                    Please create a support ticket to update the name on your account and share your preferred name in
                    'First and Last name' format as per the ID you have provided in your KYC. No verification required for
                    name change.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="card  p-0  ">
            <h2 className="card-header" id="headingcollapse_3">
              <button className="accordion-button p-0 collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse_3" aria-expanded="false" aria-controls="collapse_3">
                Where can I change my personal details?
              </button>
            </h2>
            <div id="collapse_3" className="accordion-collapse collapse" aria-labelledby="headingcollapse_3" data-bs-parent="#accordionExample">
              <div className="card-body card-body-padding-top border-bottom  ">
                <div className="faq_text" >
                  <p className="" >If you wish to change or update your personal details like Name, Mobile number, or Email address linked
                    to your URG-Xaccount, you can do so by raising a Support Ticket or write to us at <b><a href="mailto:support@urgx.com" >support@urgx.com</a></b>
                    attaching a selfie holding your original ID that you have submitted in KYC for verification.</p>

                  <p className=" mb-0 ">
                    <strong>Important</strong>:  Make sure the details on the document are clear. Refer to the images below
                  </p>

                  <img src="/images/ff_useridimage.png" className="img-fluid my-3 rounded" alt="" width="200" />

                </div>
              </div>
            </div>
          </div>
          <div className="card p-0  ">
            <h2 className="card-header" id="headingcollapse_4">
              <button className="accordion-button p-0  collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse_4" aria-expanded="false" aria-controls="collapse_4">
                Is there an option to delete the account permanently in the app?
              </button>
            </h2>
            <div id="collapse_4" className="accordion-collapse collapse" aria-labelledby="headingcollapse_4" data-bs-parent="#accordionExample">
              <div className="card-body card-body-padding-top  border-bottom ">
                <div className="faq_text" >
                  <p className=" ">
                    User needs to create a support ticket and request or write to us on support@urgx.com for deletion of account.
                  </p>
                  <p className=" mb-0 ">
                    <strong> Note:</strong> Please ensure to withdraw all the funds before the deletion the account as you will not be able to use the same email and mobile number linked to that account.

                  </p>
                </div>
              </div>
            </div>
          </div>


          <div className="card p-0  ">
            <h2 className="card-header" id="headingcollapse_5">
              <button className="accordion-button p-0  collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse_5" aria-expanded="false" aria-controls="collapse_5">
                How do I update/change my password?
              </button>
            </h2>
            <div id="collapse_5" className="accordion-collapse collapse" aria-labelledby="headingcollapse_5" data-bs-parent="#accordionExample">
              <div className="card-body card-body-padding-top  border-bottom ">
                <div className="faq_text" >
                  <p className="mb-0">
                    To change your password for URG-X , click on 'Security' under Account. You will get an option to change
                    your account password under Change Password and your withdrawal password under Change
                    Withdrawal Password.
                  </p>
                  <p className="mb-0">
                    Please make sure that both these passwords are different to secure your funds. Also note that this is the
                    same password that you will be using in case you wish to login or withdraw from URG-Xapp/web.
                  </p>
                </div>
              </div>
            </div>
          </div>


          <div className="card p-0  ">
            <h2 className="card-header" id="headingcollapse_6">
              <button className="accordion-button p-0  collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse_6" aria-expanded="false" aria-controls="collapse_6">
                How to access the URG-Xaccount of someone who has passed away?

              </button>
            </h2>
            <div id="collapse_6" className="accordion-collapse collapse" aria-labelledby="headingcollapse_6" data-bs-parent="#accordionExample">
              <div className="card-body card-body-padding-top  border-bottom ">
                <div className="faq_text" >
                  <p className="mb-0">
                    Nominee need to raise the support ticket to claim the funds of the account holder who passed away.
                  </p>
                </div>
              </div>
            </div>
          </div>


          <div className="card p-0  ">
            <h2 className="card-header" id="headingcollapse_7">
              <button className="accordion-button p-0  collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse_7" aria-expanded="false" aria-controls="collapse_7">
                How can I change my registered mobile number?
              </button>
            </h2>
            <div id="collapse_7" className="accordion-collapse collapse" aria-labelledby="headingcollapse_7" data-bs-parent="#accordionExample">
              <div className="card-body card-body-padding-top  border-bottom ">
                <div className="faq_text" >
                  <p className="">
                    If you wish to change your registered mobile number with URG-X , you can raise a Support Ticket
                    attaching a selfie holding your original ID that you have submitted in KYC for verification or write to us at
                    <b><a href="mailto:support@urgx.com.">support@urgx.com.</a></b>

                  </p>

                  <p>
                    Also, kindly share the mobile number you would like to update on your account. Once we verify the details, we will update the number as per your request.
                  </p>


                  <p className=" mb-0 ">
                    <strong>Note</strong>:  Make sure the details on the document are clear. Refer to the image below.
                  </p>

                  <img src="/images/ff_useridimage.png" className="img-fluid my-3 rounded" alt="" width="200" />


                </div>
              </div>
            </div>
          </div>


        </div>

      )}



      {/* Nomination Tab */}
      {changeScreen === "Nomination" && (
        <div className="faq " id="accordionExample">
          <div className="card p-0  ">
            <h2 className="card-header" id="headingcollapse_1">
              <button className="accordion-button p-0  collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse_1" aria-expanded="false" aria-controls="collapse_1">
                What is a nomination and who is a nominee?
              </button>
            </h2>
            <div id="collapse_1" className="accordion-collapse collapse" aria-labelledby="headingcollapse_1" data-bs-parent="#accordionExample">
              <div className="card-body card-body-padding-top text-align-start border-bottom ">
                <div className="faq_text" >
                  <p>Nomination is the process of determining one person or persons who will receive the virtual digital assets
                    accumulated in the wallet of the account holder in case of any casualties or untimely death.
                    A nominee is the person appointed by you who will receive your virtual digital assets accumulated in the
                    account in case of your untimely death.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="card  p-0 ">
            <h2 className="card-header" id="headingcollapse_2">
              <button className="accordion-button p-0 collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse_2" aria-expanded="false" aria-controls="collapse_2">
                How can I add a Nominee?
              </button>
            </h2>
            <div id="collapse_2" className="accordion-collapse collapse" aria-labelledby="headingcollapse_2" data-bs-parent="#accordionExample">
              <div className="card-body card-body-padding-top  border-bottom">
                <div className="faq_text" >
                  <p className=" ">To add a nominee on URG-X :</p>
                  <ol>
                    <li>1. Login to URG-Xapp/web and click on the profile icon on top left of the screen.</li>
                    <li>2. Tap on Account Settings.</li>
                    <li>3. Go to the Nominee Details and provide all required details and tap Save Nominee Details. </li>
                    <li> 4. Provide the OTP received on your registered mobile number.</li>
                    <li>5. Your nominee will be added successfully. </li>
                  </ol>
                </div>
              </div>
            </div>
          </div>

          <div className="card  p-0  ">
            <h2 className="card-header" id="headingcollapse_3">
              <button className="accordion-button p-0 collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse_3" aria-expanded="false" aria-controls="collapse_3">
                How many nominees can I add?
              </button>
            </h2>
            <div id="collapse_3" className="accordion-collapse collapse" aria-labelledby="headingcollapse_3" data-bs-parent="#accordionExample">
              <div className="card-body card-body-padding-top border-bottom  ">
                <div className="faq_text" >
                  <p className="" >You can add up to 2 individuals as your nominees.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="card p-0  ">
            <h2 className="card-header" id="headingcollapse_4">
              <button className="accordion-button p-0  collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse_4" aria-expanded="false" aria-controls="collapse_4">
                How is nomination helpful?
              </button>
            </h2>
            <div id="collapse_4" className="accordion-collapse collapse" aria-labelledby="headingcollapse_4" data-bs-parent="#accordionExample">
              <div className="card-body card-body-padding-top  border-bottom ">
                <div className="faq_text" >
                  <p className=" ">
                    It simplifies the procedure of transferring assets to a nominee in the event of a person's unexpected demise.
                    Nomination is helpful as there will be no conflict among the family members in event of the death of the
                    account holder.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="card p-0  ">
            <h2 className="card-header" id="headingcollapse_5">
              <button className="accordion-button p-0  collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse_5" aria-expanded="false" aria-controls="collapse_5">
                What happens to the proceedings if the nominee dies after the account holder but before the money is paid by URG-X ?
              </button>
            </h2>
            <div id="collapse_5" className="accordion-collapse collapse" aria-labelledby="headingcollapse_5" data-bs-parent="#accordionExample">
              <div className="card-body card-body-padding-top  border-bottom ">
                <div className="faq_text" >
                  <p className="mb-0">
                    In such a situation, the amount shall be payable to heirs or legal representatives of such nominees.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="card p-0  ">
            <h2 className="card-header" id="headingcollapse_6">
              <button className="accordion-button p-0  collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse_6" aria-expanded="false" aria-controls="collapse_6">
                Can an other country citizen be a nominee?
              </button>
            </h2>
            <div id="collapse_6" className="accordion-collapse collapse" aria-labelledby="headingcollapse_6" data-bs-parent="#accordionExample">
              <div className="card-body card-body-padding-top  border-bottom ">
                <div className="faq_text" >
                  <p className="mb-0">
                    Yes, an other country citizen can be a nominee subject to extant regulation in force from time to time.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="card p-0  ">
            <h2 className="card-header" id="headingcollapse_7">
              <button className="accordion-button p-0  collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse_7" aria-expanded="false" aria-controls="collapse_7">
                Is there any fee payable for nomination?
              </button>
            </h2>
            <div id="collapse_7" className="accordion-collapse collapse" aria-labelledby="headingcollapse_7" data-bs-parent="#accordionExample">
              <div className="card-body card-body-padding-top  border-bottom ">
                <div className="faq_text" >
                  <p className="">
                    No, there are no fees payable on nomination request.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="card p-0  ">
            <h2 className="card-header" id="headingcollapse_8">
              <button className="accordion-button p-0  collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse_8" aria-expanded="false" aria-controls="collapse_8">
                What is the age limit for nominees?
              </button>
            </h2>
            <div id="collapse_8" className="accordion-collapse collapse" aria-labelledby="headingcollapse_8" data-bs-parent="#accordionExample">
              <div className="card-body card-body-padding-top  border-bottom ">
                <div className="faq_text" >
                  <p className="">
                    The nominee should be at least a minimum 18 years of legal age.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="card p-0  ">
            <h2 className="card-header" id="headingcollapse_9">
              <button className="accordion-button p-0  collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse_9" aria-expanded="false" aria-controls="collapse_8">
                Is nomination mandatory for a URG-Xaccount?
              </button>
            </h2>
            <div id="collapse_9" className="accordion-collapse collapse" aria-labelledby="headingcollapse_9" data-bs-parent="#accordionExample">
              <div className="card-body card-body-padding-top  border-bottom ">
                <div className="faq_text" >
                  <p className="">
                    No, nomination is not mandatory, but it proves to be a very important tool in disposing of the virtual digital
                    assets lying in the account of the original account holder in case of their untimely death or any unforeseen
                    casualty.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="card p-0  ">
            <h2 className="card-header" id="headingcollapse_10">
              <button className="accordion-button p-0  collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse_10" aria-expanded="false" aria-controls="collapse_8">
                Who can nominate?
              </button>
            </h2>
            <div id="collapse_10" className="accordion-collapse collapse" aria-labelledby="headingcollapse_10" data-bs-parent="#accordionExample">
              <div className="card-body card-body-padding-top  border-bottom ">
                <div className="faq_text" >
                  <p className="">
                    Nomination can only be made by the individual holding the beneficiary account.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="card p-0  ">
            <h2 className="card-header" id="headingcollapse_11">
              <button className="accordion-button p-0  collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse_11" aria-expanded="false" aria-controls="collapse_8">
                Who can be a nominee?
              </button>
            </h2>
            <div id="collapse_11" className="accordion-collapse collapse" aria-labelledby="headingcollapse_11" data-bs-parent="#accordionExample">
              <div className="card-body card-body-padding-top  border-bottom ">
                <div className="faq_text" >
                  <p className="">
                    You may nominate any person as your nominee. A nominee shall not be a society, trust, body corporate,
                    partnership firm, or a power of attorney holder.
                    <br />
                    Please note that the nominee need not be a URG-Xaccount holder. Anyone can be a nominee. However, to
                    claim virtual digital assets, having an account on URG-Xis mandatory.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="card p-0  ">
            <h2 className="card-header" id="headingcollapse_12">
              <button className="accordion-button p-0  collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse_12" aria-expanded="false" aria-controls="collapse_8">
                What details are needed for nomination?
              </button>
            </h2>
            <div id="collapse_12" className="accordion-collapse collapse" aria-labelledby="headingcollapse_12" data-bs-parent="#accordionExample">
              <div className="card-body card-body-padding-top  border-bottom ">
                <div className="faq_text" >
                  <p className="">
                    You need to submit the full name, date of birth, and your relationship with the nominee.
                    <br />
                    Please note that the age and name of the nominee should be correctly provided as it is mentioned on any
                    National Informatics Centre (NIC) document, like , Driving License, National ID card, or Passport.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="card p-0  ">
            <h2 className="card-header" id="headingcollapse_13">
              <button className="accordion-button p-0  collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse_13" aria-expanded="false" aria-controls="collapse_8">
                Can I change or remove a nomination?
              </button>
            </h2>
            <div id="collapse_13" className="accordion-collapse collapse" aria-labelledby="headingcollapse_13" data-bs-parent="#accordionExample">
              <div className="card-body card-body-padding-top  border-bottom ">
                <div className="faq_text" >
                  <p className="">
                    Yes, you can edit/change the nominee details any number of times. You can also cancel/delete the existing nominee and add a
                    new nominee any time.
                    <br />
                    To add a update or remove a nominee on URG-X :
                    <ol>
                      <li>1. Login to URG-Xapp/ web and click on the profile icon on top left of the screen.</li>
                      <li>2. Tap on Account Settings.</li>
                      <li>3. Go to the Nominee Details and select the nominee you want to edit/delete.</li>
                      <li>4. You can select to Remove or Update your nominee details.</li>
                      <li>5. Provide the OTP received on your registered mobile number.</li>
                    </ol>
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="card p-0  ">
            <h2 className="card-header" id="headingcollapse_14">
              <button className="accordion-button p-0  collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse_14" aria-expanded="false" aria-controls="collapse_8">
                What should be the relationship between me and the nominee?
              </button>
            </h2>
            <div id="collapse_14" className="accordion-collapse collapse" aria-labelledby="headingcollapse_14" data-bs-parent="#accordionExample">
              <div className="card-body card-body-padding-top  border-bottom ">
                <div className="faq_text" >
                  <p className="">
                    The account holder can nominate any close relations or individual, such as mother, father, sibling, spouse, child,
                    legal guardian and others.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="card p-0  ">
            <h2 className="card-header" id="headingcollapse_15">
              <button className="accordion-button p-0  collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse_15" aria-expanded="false" aria-controls="collapse_15">
                How can a nominee raise the claim?
              </button>
            </h2>
            <div id="collapse_15" className="accordion-collapse collapse" aria-labelledby="headingcollapse_15" data-bs-parent="#accordionExample">
              <div className="card-body card-body-padding-top  border-bottom ">
                <div className="faq_text" >
                  <p className="">
                    In order to raise a claim, the nominee should request for the transmission of virtual digital assets by raising a
                    ticket through the official support email (support@urgx.com).
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

      )}


      {/* Backup_code Tab */}
      {changeScreen === "Backup Code" && (
        <div className="faq " id="accordionExample">

          <div className="card p-0  ">
            <h2 className="card-header" id="headingcollapse_1">
              <button className="accordion-button p-0  collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse_1" aria-expanded="false" aria-controls="collapse_1">
                What are Backup Codes?
              </button>
            </h2>
            <div id="collapse_1" className="accordion-collapse collapse" aria-labelledby="headingcollapse_1" data-bs-parent="#accordionExample">
              <div className="card-body card-body-padding-top text-align-start border-bottom ">
                <div className="faq_text" >
                  <p>Backup Codes are a random set of 8 digits (one time use only) that you can use to sign into your URG-X 
                    account in case you ever lose your phone or are unable to receive OTP through text or codes from Google
                    Authenticator.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="card  p-0 ">
            <h2 className="card-header" id="headingcollapse_2">
              <button className="accordion-button p-0 collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse_2" aria-expanded="false" aria-controls="collapse_2">
                How can I create, reset and delete my Backup Codes on URG-Xwebsite?
              </button>
            </h2>
            <div id="collapse_2" className="accordion-collapse collapse" aria-labelledby="headingcollapse_2" data-bs-parent="#accordionExample">
              <div className="card-body card-body-padding-top  border-bottom">
                <div className="faq_text" >
                  <h5>To create your backup codes:</h5>
                  <p>
                    Log into your URG-Xweb account
                    Click on Security tab to access backup codes option
                    Click on “Setup” under Backup Codes section to create my backup codes
                    Click on “Get Backup Codes”
                    Enter your password and OTP/Google Authenticator code and click on “Confirm”
                  </p>
                  <h5>From here you can:</h5>
                  <p>
                    Create a new set of backup codes and inactivate old ones: To create new codes, click Reset
                    Delete your backup codes: To delete and automatically inactivate your backup codes, click Delete
                    Download your backup codes: Click Download
                    Print your backup codes: Click Print
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="card  p-0  ">
            <h2 className="card-header" id="headingcollapse_3">
              <button className="accordion-button p-0 collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse_3" aria-expanded="false" aria-controls="collapse_3">
                How many times can I use a Backup Code?
              </button>
            </h2>
            <div id="collapse_3" className="accordion-collapse collapse" aria-labelledby="headingcollapse_3" data-bs-parent="#accordionExample">
              <div className="card-body card-body-padding-top border-bottom  ">
                <div className="faq_text" >
                  <p className="" >All backup codes are unique and can be used only once. Once a backup code has been used, it will become
                    invalid</p>
                </div>
              </div>
            </div>
          </div>

          <div className="card p-0  ">
            <h2 className="card-header" id="headingcollapse_4">
              <button className="accordion-button p-0  collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse_4" aria-expanded="false" aria-controls="collapse_4">
                What if my Backup Codes get compromised?
              </button>
            </h2>
            <div id="collapse_4" className="accordion-collapse collapse" aria-labelledby="headingcollapse_4" data-bs-parent="#accordionExample">
              <div className="card-body card-body-padding-top  border-bottom ">
                <div className="faq_text" >
                  <p className=" ">
                    If you suspect that your backup codes have been compromised, you can reset them by clicking on the ‘Reset’
                    icon on your backup codes details page.
                    When you create new backup codes, your old set of codes will automatically become inactive.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="card p-0  ">
            <h2 className="card-header" id="headingcollapse_5">
              <button className="accordion-button p-0  collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse_5" aria-expanded="false" aria-controls="collapse_5">
                What if I exhaust all of my Backup Codes?
              </button>
            </h2>
            <div id="collapse_5" className="accordion-collapse collapse" aria-labelledby="headingcollapse_5" data-bs-parent="#accordionExample">
              <div className="card-body card-body-padding-top  border-bottom ">
                <div className="faq_text" >
                  <p className="mb-0">
                    If you have exhausted all of your backup codes, you can create new ones by clicking on the ‘Reset’ icon on your backup codes
                    details page.
                    If you have been logged out of your account and are not able to log in, then contact our Support team here.
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>

      )}


      {/* Account Closure Tab */}
      {changeScreen === "Account Closure" && (
        <div className="faq " id="accordionExample">

          <div className="card p-0  ">
            <h2 className="card-header" id="headingcollapse_1">
              <button className="accordion-button p-0  collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse_1" aria-expanded="false" aria-controls="collapse_1">
                If I delete my app, are my crypto funds safe?
              </button>
            </h2>
            <div id="collapse_1" className="accordion-collapse collapse" aria-labelledby="headingcollapse_1" data-bs-parent="#accordionExample">
              <div className="card-body card-body-padding-top text-align-start border-bottom ">
                <div className="faq_text" >
                  <p>Your crypto funds are safe and secure no matter how many times you log in and log out of your account or
                    uninstall your mobile application.
                    <br />
                    To add more security to your crypto wallet, please make sure that you enable 2FA, and keep a strong log in and
                    withdrawal password which are both different from each other.
                    <br />
                    Always remember your login credentials so that the next time you download and use the application, you can
                    log in to your account to access your funds.
                    <br />
                    Under any circumstances do you feel that your passwords are compromised and need to be changed or you
                    have any issues related to your URG-Xaccount, please contact the Support Team here
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="card  p-0 ">
            <h2 className="card-header" id="headingcollapse_2">
              <button className="accordion-button p-0 collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse_2" aria-expanded="false" aria-controls="collapse_2">
                What should I do if somebody has unauthorized access to my account?
              </button>
            </h2>
            <div id="collapse_2" className="accordion-collapse collapse" aria-labelledby="headingcollapse_2" data-bs-parent="#accordionExample">
              <div className="card-body card-body-padding-top  border-bottom">
                <div className="faq_text" >
                  <p>
                    In case you think somebody has unauthorized access to your URG-Xaccount, please get in touch with
                    our support team and they will assist you further.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="card  p-0  ">
            <h2 className="card-header" id="headingcollapse_3">
              <button className="accordion-button p-0 collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse_3" aria-expanded="false" aria-controls="collapse_3">
                What should I do if I received a notification that someone logged in from a different location?
              </button>
            </h2>
            <div id="collapse_3" className="accordion-collapse collapse" aria-labelledby="headingcollapse_3" data-bs-parent="#accordionExample">
              <div className="card-body card-body-padding-top border-bottom  ">
                <div className="faq_text" >
                  <p className="" >
                    When signing in on a new device, our system enhances security measures by notifying your other trusted
                    devices. This notification includes a map indicating the general position of the new device, although it is
                    important to note that the location displayed is not the exact geographical location. Instead, it is an
                    approximate location based on the device's current IP address.
                    <br />
                    Please understand that the location displayed may reflect the network the new device is connected to, rather
                    than your precise physical location. We want to emphasize that our reliance on trusted third-party service
                    providers for IP checks is to ensure the best possible security protocols.
                    <br />
                    While we acknowledge that no IP detection system is 100% accurate, we can assure you that our partners are
                    industry-leading and provide an alerting mechanism that effectively addresses a majority of high-risk incidents,
                    where significant variations in IP address usage may be observed.“
                    <br />
                    In case you still doubt that your URG-Xaccount information has been compromised, please get in touch with
                    our support team and they will assist you further.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="card p-0  ">
            <h2 className="card-header" id="headingcollapse_4">
              <button className="accordion-button p-0  collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse_4" aria-expanded="false" aria-controls="collapse_4">
                What should I do if my account has been compromised?
              </button>
            </h2>
            <div id="collapse_4" className="accordion-collapse collapse" aria-labelledby="headingcollapse_4" data-bs-parent="#accordionExample">
              <div className="card-body card-body-padding-top  border-bottom ">
                <div className="faq_text" >
                  <p className=" ">
                    In case your URG-Xaccount information has been compromised, please get in touch with our support
                    team and they will assist you further.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="card p-0  ">
            <h2 className="card-header" id="headingcollapse_5">
              <button className="accordion-button p-0  collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse_5" aria-expanded="false" aria-controls="collapse_5">
                I have multiple accounts. How can I disable the account which I don't use?
              </button>
            </h2>
            <div id="collapse_5" className="accordion-collapse collapse" aria-labelledby="headingcollapse_5" data-bs-parent="#accordionExample">
              <div className="card-body card-body-padding-top  border-bottom ">
                <div className="faq_text" >
                  <p className="mb-0">
                    If you want to deactivate your account or if you have multiple accounts and want to disable the account which you don't want to
                    use, you can simply log into your URG-Xaccount and Disable it yourself.
                    <br />
                    You will still have the option to re-enable your account after disabling it. You can simply raise a Support Ticket and we will help you
                    to activate the account after required verification.
                  </p>
                  <ol>
                    Steps to disable your account using URG-XApp:
                    <li>1. Log in to your URG-Xapp/web.</li>
                    <li>2. Go to [Account] and select [Security].</li>
                    <li>3. Click [Disable Your Account].</li>
                  </ol>
                  <ol>
                    Steps to disable your account from Website:
                    <li>1. Log in to URG-Xwebsite <a href="https://URG-X.com/" target="_blank" > https://URG-X.com/ </a>..</li>
                    <li>2. Go to [Profile] and select [Security].</li>
                    <li>3. Go to [Account Security] and select [Account Activity].</li>
                    <li>4. Click [Disable Account].</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>

          <div className="card p-0  ">
            <h2 className="card-header" id="headingcollapse_6">
              <button className="accordion-button p-0  collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse_6" aria-expanded="false" aria-controls="collapse_6">
                How do I disable/deactivate my URG-Xaccount?
              </button>
            </h2>
            <div id="collapse_6" className="accordion-collapse collapse" aria-labelledby="headingcollapse_5" data-bs-parent="#accordionExample">
              <div className="card-body card-body-padding-top border-bottom ">
                <div className="faq_text" >
                  <p className="mb-0">
                    If you want to deactivate your account or if you have multiple accounts and want to disable the account which you don't want to
                    use, you can simply log into your URG-Xaccount and Disable it yourself.
                    <br />
                    You will still have the option to re-enable your account after disabling it,
                    Steps to re-enable your account after disabling it: Click on "Profile Management" - Click on "Need Help with Sign-Up & Login" -
                    Click on "My Account is blocked“
                    <ol>
                      Steps to disable your account using URG-XApp:
                      <li>  Log in to your URG-Xapp. </li>
                      <li> Go to [Account] and select [Security].</li>
                      <li> Click [Disable Your Account].</li>
                    </ol>
                    <ol>
                      Steps to disable your account from Website:
                      <li>  Log in to URG-Xwebsite<a href="https://URG-X.com/" target="_blank" rel="noreferrer"> https://URG-X.com/ </a>.. </li>
                      <li>Go to [Profile] and select [Security].</li>
                      <li> Go to [Account Security] and select [Account Activity].</li>
                      <li> Click [Disable Account].</li>
                    </ol>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default FAQAccMang;
