import React, { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { alertErrorMessage } from '../../../customComponents/CustomAlertMessage';
import LoaderHelper from '../../../customComponents/Loading/LoaderHelper';
import AuthService from '../../../api/services/AuthService';

const RegistrationResult = () => {
  const { authenticationToken } = useParams();
  const navigate = useNavigate()
  const [verification, setVerification] = useState("");


  const verifyRegistrationToken = async () => {
    try {
      LoaderHelper.loaderStatus(true);
      const result = await AuthService.verifyRegistrationToken(authenticationToken)
      if (result?.success) {
        if (result?.accountStatus === "Inactive") {
          alertErrorMessage("Please verify your account")
          navigate(`/login`);
        }
        setVerification(result?.accountStatus)
      } else {
        if (result?.accountStatus === "Blocked") {
          setVerification(result?.accountStatus)
        } else {
          alertErrorMessage("Please verify your account")
          navigate(`/login`);
          alertErrorMessage(result?.message);
        }

      }
    } catch (error) {
      navigate(`/login`);
      alertErrorMessage(error?.message);

    } finally { LoaderHelper.loaderStatus(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  };


  useEffect(() => {
    verifyRegistrationToken()

  }, [authenticationToken]);

  return (
    <>

      {(verification === "Active" || verification === "Blocked") && (
        <div className="container">
          <div className="register_verified_form account_activate">
            <div className={verification === "Active" ? "register_verified_vector" : "register_verified_vector"}>
              <img
                src={
                  verification === "Active"
                    ? "/images/veify4.png"
                    : "/images/veify4.png" // Use a suitable image for blocked account
                }
                alt="register"
              />
            </div>
            {verification === "Active" && <> <h1>Welcome to URG-X</h1>
              <p>Thank you for choosing us !</p></>}

            {verification === "Active" ? (
              <>
                <p className="">Your account has been successfully activated.</p>
                <p className="">
                  Please login with your credentials to access your account.
                </p>
                <p className="yellow">Happy Trading !!!</p>
              </>
            ) : (
              <>
                <p className="dark_yellow">Your account has been blocked due to suspicious activity.</p>
                <p className="light_red">
                  For security reasons, we have temporarily restricted access.
                </p>
                <p className="yellow">
                  If you believe this was done by mistake, please contact us at <a href="mailto:support@urgx.com">support@urgx.com</a>.
                </p>
              </>
            )}
            {verification === "Active" &&
              <button>
                <Link to={"/login"}>
                  Log In with Us
                </Link>
              </button>
            }
          </div>
        </div>
      )}

    </>
  )
}

export default RegistrationResult
