import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import AuthService from "../../../api/services/AuthService";
import { alertErrorMessage, alertSuccessMessage } from "../../../customComponents/CustomAlertMessage";
import LoaderHelper from "../../../customComponents/Loading/LoaderHelper";
import { Helmet } from "react-helmet-async";
import { $ } from "react-jquery-plugin";

const RegistrationVerification = () => {
  const { authenticationToken } = useParams()
  const navigate = useNavigate()

  const [otp, setOtp] = useState("");
  const [disableBtn, setDisbaleBtn] = useState(false);
  const [timer, setTimer] = useState(0);
  const [attemptLeft, setAttemptLeft] = useState("");

  const [signId, setSignId] = useState("");
  const [registeredBy, setRegisteredBy] = useState("");

  // Add loginbg className on mount for consistent styling
  useEffect(() => {
    $("body").addClass("loginbg");
    return () => {
      $("body").removeClass("loginbg");
    };
  }, []);

  const handleLogin = async () => {
    if (otp?.length < 5) {
      alertErrorMessage("Invalid OTP");
      return
    };

    LoaderHelper.loaderStatus(true);
    try {
      const result = await AuthService.verifyRegistrationOtp(signId, +otp, registeredBy, '');
      if (result?.success) {
        alertSuccessMessage(result?.message);
        navigate(`/account-activate/${authenticationToken}`);
        LoaderHelper.loaderStatus(false);
      } else {
        LoaderHelper.loaderStatus(false);
        alertErrorMessage(result?.message);
      }
    } catch (error) {
      if (error.response) {
        alertErrorMessage(error.response.data.message);
        LoaderHelper.loaderStatus(false);
      } else if (error.request) {
        alertErrorMessage("Network error. Please check your internet connection.");
        LoaderHelper.loaderStatus(false);
      } else {
        alertErrorMessage("An error occurred. Please try again later.");
        LoaderHelper.loaderStatus(false);
      }
    } finally {
      LoaderHelper.loaderStatus(false);
    }
  };

  const handleGetOtp = async () => {
    LoaderHelper.loaderStatus(true);
    await AuthService.registrationOtp(signId, registeredBy).then(async (result) => {
      LoaderHelper.loaderStatus(false);
      if (result?.success) {
        try {
          alertSuccessMessage(result?.message);
          setDisbaleBtn(true);
          setTimer(60);
          setAttemptLeft(result?.attemptsLeft)
        } catch (error) {
          alertErrorMessage(error);
        }
      } else {
        if (result?.message === "No OTP attempt left. Your account has been suspended.") {
          alertErrorMessage(result?.message);
          navigate(`/account-activate/${authenticationToken}`);
        }
        LoaderHelper.loaderStatus(false);
        alertErrorMessage(result?.message);
      }
    });
  };

  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      setDisbaleBtn(false);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const verifyRegistrationToken = async () => {
    try {
      LoaderHelper.loaderStatus(true);
      const result = await AuthService.verifyRegistrationToken(authenticationToken)
      if (result?.success) {
        if (result?.accountStatus === "Inactive") {
          setSignId(result?.data?.signId);
          setRegisteredBy(result?.data?.registeredBy);
        } else {
          navigate(`/account-activate/${authenticationToken}`);
        }
      } else {
        if (result?.accountStatus === "Blocked") {
          navigate(`/account-activate/${authenticationToken}`);
        }
        alertErrorMessage(result?.message);
      }
    } catch (error) {
      alertErrorMessage(error?.message);
    } finally {
      LoaderHelper.loaderStatus(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    verifyRegistrationToken()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authenticationToken]);

  return (
    <>
      <Helmet>
        <title>Wrathcode Exchange | Account Verification</title>
        <meta name="description" content="Verify your Wrathcode Exchange account to start trading securely." />
      </Helmet>

      <div className="login_fullhieght verificationregister">
        <div className="login_section">
          <div className="login_form_right">
            <div className="form_block_login">
              <img className='lightlogo' src="/images/logo_light.svg" alt="logo" />
              
              <div className="security_shield_vector">
                <img src="/images/security_shield.svg" alt="security" />
              </div>

              <h2>Verify Your Account</h2>
              <p className="text-center mb-3">Make your account 100% secure against unauthorized logins.</p>
              <p className="text-center mb-4">
                Registered {registeredBy || "---"}: <span className="text-primary">{signId || "---"}</span>
              </p>

              <form onSubmit={(e) => e.preventDefault()}>
                <div className="row">
                  <div className="col-sm-12 input_block">
                    <label>{registeredBy === "Email" ? "Email" : "Mobile"} Verification Code</label>
                    <div className="email_code">
                      <input
                        className="input_filed"
                        type="text"
                        placeholder="Enter verification code"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        maxLength={6}
                      />
                      <button
                        className="get_otp otpcode"
                        type="button"
                        disabled={disableBtn}
                        onClick={() => handleGetOtp()}
                      >
                        {disableBtn ? `Resend (${timer}s)` : "GET OTP"}
                      </button>
                    </div>
                    {attemptLeft && (
                      <small className="text-warning d-block mt-2">
                        Verification attempts left: {attemptLeft - 1}
                      </small>
                    )}
                  </div>

                  <div className="col-sm-12 login_btn">
                    <input
                      type="button"
                      value="Verify Account"
                      onClick={() => handleLogin()}
                      disabled={!signId || otp?.length < 5}
                    />
                  </div>

                  <div className="col-sm-12 registration__info bottom">
                    <p>Already have an account? <Link to="/Login">Login</Link></p>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default RegistrationVerification
