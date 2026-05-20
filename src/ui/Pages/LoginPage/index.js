import React, { useContext, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import AuthService from "../../../api/services/AuthService";
import { alertErrorMessage, alertSuccessMessage } from "../../../customComponents/CustomAlertMessage";
import LoaderHelper from "../../../customComponents/Loading/LoaderHelper";
import { $ } from "react-jquery-plugin";
import Select from "react-select";
import { ProfileContext } from "../../../context/ProfileProvider";
import { useGoogleLogin } from '@react-oauth/google';
import { Helmet } from "react-helmet-async";
import { isValidPhoneNumber } from "libphonenumber-js";
import { countriesList, customStyles } from "../../../utils/CountriesList";
import { startAuthentication } from "@simplewebauthn/browser";


const LoginPage = () => {
  const location = useLocation();

  const [signId, setSignId] = useState("demo@gmail.com");
  const [password, setPassword] = useState("Abcd@123");
  const [countryCode, setCountryCode] = useState("+91");
  const [showPassword, setShowPassword] = useState(false);

  // Enhanced 2FA Login states
  const [selectedAuthMethod, setSelectedAuthMethod] = useState(1); // 1=email, 2=google, 3=mobile, 4=passkey
  const [availableMethods, setAvailableMethods] = useState([]);
  const [resendTimer, setResendTimer] = useState(0);
  console.log("🚀 ~ LoginPage ~ resendTimer:", resendTimer)
  const [loginSignId, setLoginSignId] = useState(""); // Store the signId used for login
  const [otpDigits, setOtpDigits] = useState(['1', '2', '3', '4', '5', '6']);
  const [passkeySupported, setPasskeySupported] = useState(false);
  const [isPasskeyLoading, setIsPasskeyLoading] = useState(false);


  const navigate = useNavigate();

  const { setLoginDetails } = useContext(ProfileContext);


  // Add loginbg class on mount
  useEffect(() => {
    $("body").addClass("loginbg");

    // Check if WebAuthn/Passkey is supported AND platform authenticator is available
    const checkPasskeySupport = async () => {
      // First check if WebAuthn API exists
      if (window.PublicKeyCredential === undefined || typeof window.PublicKeyCredential !== 'function') {
        setPasskeySupported(false);
        return;
      }

      // Detect iOS/iPadOS
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
        (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

      // Detect Safari on iOS
      const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

      // Check if platform authenticator (fingerprint/Face ID/Windows Hello) is available
      try {
        const available = await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();

        // On iOS Safari 16+, passkeys are supported even if this returns false sometimes
        // This can happen if iCloud Keychain is temporarily unavailable
        if (!available && isIOS && isSafari) {
          // Check iOS version - passkeys require iOS 16+
          const match = navigator.userAgent.match(/OS (\d+)_/);
          const iosVersion = match ? parseInt(match[1], 10) : 0;

          if (iosVersion >= 16) {
            // iOS 16+ Safari should support passkeys, enable the option
            console.log('iOS 16+ detected, enabling passkey support');
            setPasskeySupported(true);
            return;
          }
        }

        setPasskeySupported(available);
      } catch (error) {
        // If check fails on iOS Safari, still allow trying passkeys
        if (isIOS && isSafari) {
          console.log('Passkey check failed on iOS Safari, allowing anyway');
          setPasskeySupported(true);
          return;
        }
        setPasskeySupported(false);
      }
    };

    checkPasskeySupport();

    return () => {
      $("body").removeClass("loginbg");
    };
  }, []);

  // Resend timer countdown
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const handleTogglePassword = () => {
    setShowPassword(!showPassword);
  };

  // Get combined OTP code
  const getOtpCode = () => otpDigits.join('');

  // Determine available verification methods based on backend response
  // Priority: Passkey (4) > Google Auth (2) > Email (1) > Mobile (3)
  const determineAvailableMethods = (responseData) => {
    let methods = [];

    if (responseData?.availableMethods && responseData.availableMethods.length > 0) {
      methods = responseData.availableMethods.map(m => ({
        ...m,
        icon: m.type === 1 ? 'ri-mail-line' :
          m.type === 2 ? 'ri-shield-keyhole-line' :
            m.type === 3 ? 'ri-smartphone-line' :
              'ri-fingerprint-line',
        description: m.type === 1 ? 'Receive verification codes via email' :
          m.type === 2 ? 'Use Google Authenticator app' :
            m.type === 3 ? 'Receive verification codes via SMS' :
              'Use Face ID, Touch ID, or Windows Hello'
      }));
    }

    // Check if user has passkey and browser supports it
    if (responseData?.hasPasskey && passkeySupported) {
      // Add passkey as first option (type 4)
      const passkeyMethod = {
        type: 4,
        name: 'Passkey',
        label: 'Passkey',
        icon: 'ri-fingerprint-line',
        description: 'Use Face ID, Touch ID, or Windows Hello',
        maskedValue: 'Biometric authentication'
      };
      // Insert passkey at the beginning
      methods = [passkeyMethod, ...methods.filter(m => m.type !== 4)];
    }

    return methods;
  };

  // Send OTP for login verification (resend)
  const sendLoginOtp = async (method) => {
    try {
      // Google Auth and Passkey don't need OTP sending
      if (method === 2 || method === 4) {
        return true;
      }

      LoaderHelper.loaderStatus(true);

      // Determine sendTo based on verification method
      // method 1 = email, method 3 = mobile
      const sendTo = method === 3 ? 'mobile' : 'email';

      // Get the correct identifier based on selected method
      let otpSignId = loginSignId;
      if (method === 3) {
        const mobileMethod = availableMethods.find(m => m.type === 3);
        if (mobileMethod?.value) {
          otpSignId = mobileMethod.value;
        }
      } else if (method === 1) {
        const emailMethod = availableMethods.find(m => m.type === 1);
        if (emailMethod?.value) {
          otpSignId = emailMethod.value;
        }
      }

      const result = await AuthService.getOtp(otpSignId, 'login', sendTo);
      if (result?.success) {
        alertSuccessMessage(result?.message || 'OTP sent successfully');
        setResendTimer(60);
        return true;
      } else {
        alertErrorMessage(result?.message || 'Failed to send OTP');
        return false;
      }
    } catch (error) {
      alertErrorMessage(error?.message || 'Failed to send OTP');
      return false;
    } finally {
      LoaderHelper.loaderStatus(false);
    }
  };

  // Handle passkey authentication
  const handlePasskeyAuth = async () => {
    if (!passkeySupported) {
      alertErrorMessage('Passkeys are not supported on this device/browser');
      return;
    }

    try {
      setIsPasskeyLoading(true);
      LoaderHelper.loaderStatus(true);

      // Step 1: Get authentication options from server
      const optionsResult = await AuthService.passkeyGetAuthOptions(loginSignId);
      if (!optionsResult?.success || !optionsResult?.data) {
        alertErrorMessage(optionsResult?.message || 'Failed to get passkey options');
        return;
      }

      const authOptions = optionsResult.data;

      // Step 2: Authenticate using browser's WebAuthn API
      let credential;
      try {
        credential = await startAuthentication(authOptions);
      } catch (webauthnError) {
        console.error('WebAuthn authentication error:', webauthnError);
        if (webauthnError.name === 'NotAllowedError') {
          alertErrorMessage('Authentication was cancelled or timed out. Please try again.');
        } else {
          alertErrorMessage('Failed to authenticate with passkey. Please try another method.');
        }
        return;
      }

      // Step 3: Verify credential with server
      const verifyResult = await AuthService.passkeyVerifyAuth(loginSignId, credential);

      if (verifyResult?.success) {
        // Complete login - get token from backend
        const loginResult = await AuthService.completePasskeyLogin(loginSignId, verifyResult.data);

        if (loginResult?.success && loginResult?.data?.token) {
          alertSuccessMessage('Login successful!');
          localStorage.setItem("token", loginResult.data.token);
          localStorage.setItem("userId", loginResult.data.userId);
          setLoginDetails(loginResult.data);

          // Close modal
          $("#Confirmation_model").modal('hide');

          const redirectPath = location?.state?.redirectTo || "/user_profile/dashboard";
          navigate(redirectPath, { replace: true });
          window.location.reload();
        } else {
          alertErrorMessage(loginResult?.message || 'Login failed');
        }
      } else {
        alertErrorMessage(verifyResult?.message || 'Passkey verification failed');
      }
    } catch (error) {
      console.error('Passkey authentication error:', error);
      alertErrorMessage(error?.message || 'Something went wrong');
    } finally {
      setIsPasskeyLoading(false);
      LoaderHelper.loaderStatus(false);
    }
  };

  // Attempt silent passkey verification for login
  const attemptSilentPasskeyLoginVerification = async (signIdForPasskey) => {
    if (!passkeySupported) {
      return { success: false, reason: 'not_supported' };
    }

    try {
      // Step 1: Get authentication options from server
      const optionsResult = await AuthService.passkeyGetAuthOptions(signIdForPasskey);
      if (!optionsResult?.success || !optionsResult?.data) {
        return { success: false, reason: 'no_options' };
      }

      const authOptions = optionsResult.data;

      // Step 2: Authenticate using browser's WebAuthn API
      let credential;
      try {
        credential = await startAuthentication(authOptions);
      } catch (webauthnError) {
        // Handle various WebAuthn errors silently:
        // - NotAllowedError: User cancelled or denied
        // - AbortError: Operation was aborted
        // - Timeout: Operation timed out
        // - InvalidStateError: Authenticator not available
        return { success: false, reason: 'cancelled' };
      }

      // Step 3: Verify credential with server
      const verifyResult = await AuthService.passkeyVerifyAuth(signIdForPasskey, credential);

      if (verifyResult?.success) {
        return { success: true, verifyData: verifyResult.data };
      } else {
        return { success: false, reason: 'verification_failed' };
      }
    } catch (error) {
      // Catch any other unexpected errors silently
      return { success: false, reason: 'error' };
    }
  };

  // Handle login - Step 1: Validate credentials
  const handleLogin = async (inputSignId, loginPassword, token) => {
    LoaderHelper.loaderStatus(true);
    try {
      const result = await AuthService.login(inputSignId, loginPassword, token);
      if (result?.success) {
        const responseData = result?.data;

        console.log("🚀 ~ handleLogin ~ responseData:", responseData)
        if (responseData?.requiresVerification) {
          setLoginSignId(inputSignId);
          if (responseData?.defaultMethod === 1 || responseData?.defaultMethod === 3) {
            setResendTimer(60);
            alertSuccessMessage(result?.message);
          }
          const methods = determineAvailableMethods(responseData);
          setAvailableMethods(methods);

          // If user has passkey and browser supports it, attempt silent passkey verification first
          if (responseData?.hasPasskey && passkeySupported) {
            setIsPasskeyLoading(true);
            const passkeyResult = await attemptSilentPasskeyLoginVerification(inputSignId);
            setIsPasskeyLoading(false);

            if (passkeyResult.success) {
              // Passkey verification succeeded - complete login directly
              const loginResult = await AuthService.completePasskeyLogin(inputSignId, passkeyResult.verifyData);

              if (loginResult?.success && loginResult?.data?.token) {
                alertSuccessMessage('Login successful!');
                localStorage.setItem("token", loginResult.data.token);
                localStorage.setItem("userId", loginResult.data.userId);
                setLoginDetails(loginResult.data);

                const redirectPath = location?.state?.redirectTo || "/user_profile/dashboard";
                navigate(redirectPath, { replace: true });
                window.location.reload();
                return; // Exit early - login complete
              }
            }
            // If passkey failed, fall through to show verification modal
          }

          // Priority: Passkey (4) > Google Auth (2) > Email (1) > Mobile (3)
          let defaultMethod = responseData?.defaultMethod || 1;

          // If passkey is available and supported, use it as default (in case user wants to retry)
          if (responseData?.hasPasskey && passkeySupported) {
            defaultMethod = 4;
          } else if (methods.find(m => m.type === 4)) {
            defaultMethod = 4;
          }

          setSelectedAuthMethod(defaultMethod);

          // Reset OTP digits
          setOtpDigits(['1', '2', '3', '4', '5', '6']);
          // Reset timer to 0 - user will click "GET OTP" button to send OTP
          // This prevents confusion where timer shows 60 but no OTP was sent

          // Show verification modal
          $("#Confirmation_model").modal('show');
        } else {
          if (responseData?.token) {
            alertSuccessMessage(result.message);
            localStorage.setItem("token", responseData.token);
            localStorage.setItem("userId", responseData.userId);
            const redirectPath = location?.state?.redirectTo || "/user_profile/dashboard";
            navigate(redirectPath, { replace: true });
            window.location.reload();
          }
        }

      } else {
        if (result?.message === "Your account has not been activated yet. Please verify your account to continue using the platform.") {
          navigate(`/account-verification/${result?.data}`);
          return;
        }
        alertErrorMessage(result?.message);
      }
    } catch (error) {
      alertErrorMessage("An error occurred. Please try again later.");
    } finally {
      LoaderHelper.loaderStatus(false);
    }
  };

  // Open verification options popup (close main modal first)
  const handleOpenOptionsPopup = () => {
    $("#Confirmation_model").modal('hide');
    setTimeout(() => {
      $("#VerificationOptionsModal").modal('show');
    }, 100);
  };

  // Switch verification method from options popup
  const handleSelectMethod = async (method) => {
    setSelectedAuthMethod(method.type);
    setOtpDigits(['1', '2', '3', '4', '5', '6']);

    // Reset resend timer so "GET OTP" button is shown (don't auto-send)
    setResendTimer(0);

    // Close options popup
    $("#VerificationOptionsModal").modal('hide');

    // Reopen verification modal after a short delay
    setTimeout(() => {
      $("#Confirmation_model").modal('show');
    }, 100);

    // Don't auto-send OTP - let user click "GET OTP" button
  };

  // Close options popup and reopen verification modal
  const handleCloseOptionsPopup = () => {
    $("#VerificationOptionsModal").modal('hide');
    setTimeout(() => {
      $("#Confirmation_model").modal('show');
    }, 100);
  };

  // Verify OTP/Code and complete login
  const handleAuthVerify = async () => {
    const otpCode = getOtpCode();
    if (!otpCode || otpCode.length < 6) {
      alertErrorMessage("Please enter a valid 6-digit code");
      return;
    }

    LoaderHelper.loaderStatus(true);
    try {
      // Get the correct identifier based on selected method
      // For mobile verification (type 3), we need to find the mobile number from availableMethods
      // For email verification (type 1), use the email
      // For Google Auth (type 2), the loginSignId (email/phone used for login) works
      let verifySignId = loginSignId;

      if (selectedAuthMethod === 3) {
        // Find mobile method and get its actual value (not masked)
        const mobileMethod = availableMethods.find(m => m.type === 3);
        if (mobileMethod?.value) {
          verifySignId = mobileMethod.value;
        }
      } else if (selectedAuthMethod === 1) {
        // Find email method and get its actual value (not masked)
        const emailMethod = availableMethods.find(m => m.type === 1);
        if (emailMethod?.value) {
          verifySignId = emailMethod.value;
        }
      }

      const result = await AuthService.getCode(verifySignId, selectedAuthMethod, otpCode);

      if (result?.success) {
        alertSuccessMessage(result.message);
        localStorage.setItem("token", result.data.token);
        localStorage.setItem("userId", result.data.userId);
        setLoginDetails(result.data);
        $("#Confirmation_model").modal('hide');
        const redirectPath = location?.state?.redirectTo || "/user_profile/dashboard";
        navigate(redirectPath, { replace: true });
        window.location.reload();
      } else {
        alertErrorMessage(result?.message || "Verification failed");
      }
    } catch (error) {
      alertErrorMessage("Verification failed. Please try again.");
    } finally {
      LoaderHelper.loaderStatus(false);
    }
  };

  // Email login handler
  const handleEmailLogin = async () => {
    if (!signId) {
      alertErrorMessage("Please enter your email");
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(signId)) {
      alertErrorMessage("Please enter a valid email address");
      return;
    }
    if (!password) {
      alertErrorMessage("Please enter your password");
      return;
    }

    if (!password.match('^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$')) {
      alertErrorMessage("Invalid password format");
      return;
    }

    await handleLogin(signId, password, "");
  };

  // Phone login handler
  const handlePhoneLogin = async () => {
    if (!signId) {
      alertErrorMessage("Please enter your mobile number");
      return;
    }

    const fullPhone = `${countryCode}${signId}`;
    if (!isValidPhoneNumber(fullPhone)) {
      alertErrorMessage("Please enter a valid phone number for the selected country");
      return;
    }

    if (!password) {
      alertErrorMessage("Please enter your password");
      return;
    }

    if (!password.match('^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$')) {
      alertErrorMessage("Invalid password format");
      return;
    }

    await handleLogin(signId, password, "");
  };

  // Google login
  const loginWithGoogle = useGoogleLogin({
    onSuccess: tokenResponse => {
      if (tokenResponse.access_token) {
        handleLoginGoogle(tokenResponse);
      }
    }
  });

  const handleLoginGoogle = async (tokenResponse) => {
    LoaderHelper.loaderStatus(true);
    try {
      const result = await AuthService.googleLogin(tokenResponse, "");
      if (result?.success) {
        const responseData = result?.data;

        if (responseData?.requiresVerification) {
          const googleLoginSignId = responseData?.signId || "";
          setLoginSignId(googleLoginSignId);

          const methods = determineAvailableMethods(responseData);
          setAvailableMethods(methods);

          // If user has passkey and browser supports it, attempt silent passkey verification first
          if (responseData?.hasPasskey && passkeySupported && googleLoginSignId) {
            setIsPasskeyLoading(true);
            const passkeyResult = await attemptSilentPasskeyLoginVerification(googleLoginSignId);
            setIsPasskeyLoading(false);

            if (passkeyResult.success) {
              // Passkey verification succeeded - complete login directly
              const loginResult = await AuthService.completePasskeyLogin(googleLoginSignId, passkeyResult.verifyData);

              if (loginResult?.success && loginResult?.data?.token) {
                alertSuccessMessage('Login successful!');
                localStorage.setItem("token", loginResult.data.token);
                localStorage.setItem("userId", loginResult.data.userId);
                setLoginDetails(loginResult.data);

                const redirectPath = location?.state?.redirectTo || "/user_profile/dashboard";
                navigate(redirectPath, { replace: true });
                window.location.reload();
                return; // Exit early - login complete
              }
            }
            // If passkey failed, fall through to show verification modal
          }

          // Priority: Passkey (4) > Google Auth (2) > Email (1) > Mobile (3)
          let defaultMethod = responseData?.defaultMethod || 1;

          // If passkey is available and supported, use it as default (in case user wants to retry)
          if (responseData?.hasPasskey && passkeySupported) {
            defaultMethod = 4;
          } else if (methods.find(m => m.type === 4)) {
            defaultMethod = 4;
          }

          setSelectedAuthMethod(defaultMethod);
          setOtpDigits(['1', '2', '3', '4', '5', '6']);
          // Reset timer to 0 - user will click "GET OTP" button to send OTP
          setResendTimer(0);

          $("#Confirmation_model").modal('show');
        } else if (responseData?.token) {
          alertSuccessMessage(result?.message);
          localStorage.setItem("token", responseData.token);
          localStorage.setItem("userId", responseData.userId);
          setLoginDetails(responseData);
          const redirectPath = location?.state?.redirectTo || "/user_profile/dashboard";
          navigate(redirectPath, { replace: true });
          window.location.reload();
        }
      } else {
        alertErrorMessage(result?.message);
      }
    } catch (error) {
      alertErrorMessage(error?.message || "Login failed");
    } finally {
      LoaderHelper.loaderStatus(false);
    }
  };


  const tabChange = () => {
    setSignId("");
    setPassword("");
    setShowPassword(false);
  };

  // Handle Sign in with Passkey (discoverable credentials)
  const handlePasskeyLogin = async () => {
    if (!passkeySupported) {
      alertErrorMessage('Passkeys are not supported on this device/browser');
      return;
    }

    try {
      setIsPasskeyLoading(true);
      LoaderHelper.loaderStatus(true);

      // Step 1: Get authentication options from server
      const optionsResult = await AuthService.passkeyDiscoverableAuthOptions();
      if (!optionsResult?.success || !optionsResult?.data) {
        alertErrorMessage(optionsResult?.message || 'Failed to get authentication options');
        return;
      }

      const challenge = optionsResult.challenge; // Store challenge to send back

      // Step 2: Prompt user to select a passkey
      let credential;
      try {
        credential = await startAuthentication(optionsResult.data);
      } catch (webauthnError) {
        if (webauthnError.name === 'NotAllowedError') {
          alertErrorMessage('Authentication cancelled or no passkey available');
        } else if (webauthnError.name === 'AbortError') {
          alertErrorMessage('Authentication was cancelled');
        } else {
          alertErrorMessage('Failed to authenticate with passkey');
        }
        return;
      }

      // Step 3: Verify the credential with server and get login token
      const verifyResult = await AuthService.passkeyDiscoverableVerify(credential, challenge);

      if (verifyResult?.success && verifyResult?.data?.token) {
        alertSuccessMessage('Login successful!');
        localStorage.setItem("token", verifyResult.data.token);
        localStorage.setItem("userId", verifyResult.data.userId);
        setLoginDetails(verifyResult.data);

        const redirectPath = location?.state?.redirectTo || "/user_profile/dashboard";
        navigate(redirectPath, { replace: true });
      } else {
        alertErrorMessage(verifyResult?.message || 'Passkey verification failed');
      }
    } catch (error) {
      alertErrorMessage(error?.message || 'Failed to sign in with passkey');
    } finally {
      setIsPasskeyLoading(false);
      LoaderHelper.loaderStatus(false);
    }
  };

  // Get verification title based on method
  const getVerificationTitle = () => {
    switch (selectedAuthMethod) {
      case 1: return 'Email Verification Code';
      case 2: return 'Authenticator Code';
      case 3: return 'Phone Verification Code';
      case 4: return 'Passkey Authentication';
      default: return 'Verification Code';
    }
  };

  // Get verification description
  const getVerificationDescription = () => {
    const selectedMethod = availableMethods.find(m => m.type === selectedAuthMethod);
    const maskedValue = selectedMethod?.maskedValue;

    if (selectedAuthMethod === 1) {
      return `Enter the 6-digit code sent to ${maskedValue || 'your email'}`;
    } else if (selectedAuthMethod === 2) {
      return 'Enter the 6-digit code generated by the authenticator app';
    } else if (selectedAuthMethod === 3) {
      return `Enter the 6-digit code sent to ${maskedValue || 'your phone'}`;
    } else if (selectedAuthMethod === 4) {
      return 'Click the button below to authenticate with your passkey';
    }
    return 'Enter your verification code';
  };

  return (
    <>
      <Helmet>
        <title>Wrathcode Exchange User Login – Trade Crypto Instantly</title>
        <meta
          name="description"
          content="Sign in to your Wrathcode Exchange account and start trading Bitcoin, Ethereum and altcoins in minutes."
        />
        <meta
          name="keywords"
          content="login crypto exchange, Wrathcode Exchange sign in, crypto trading portal, secure account Wrathcode Exchange"
        />
      </Helmet>

      <div className="login_fullhieght">
        <div className="login_section">
          <div className="login_form_right">
            <div className="form_block_login">
              <img className='lightlogo' src="/images/logo_light.svg" alt="logo" />
              <h2>Welcome To Wrathcode Exchange</h2>
              <div className="login-header">
                <ul className="nav nav-tabs login-pills" id="myTab" role="tablist">
                  <li className="nav-item" role="presentation">
                    <button className="nav-link active" id="home-tab" data-bs-toggle="tab" data-bs-target="#home" type="button"
                      role="tab" aria-controls="home" aria-selected="true" onClick={tabChange}>
                      Email
                    </button>
                  </li>
                  <li className="nav-item" role="presentation">
                    <button className="nav-link" id="profile-tab" data-bs-toggle="tab" data-bs-target="#profile"
                      type="button" role="tab" aria-controls="profile" aria-selected="false" onClick={tabChange}>
                      Mobile
                    </button>
                  </li>
                </ul>
              </div>
              <div className="tab-content" id="myTabContent">
                {/* Email Login Tab */}
                <div className="tab-pane fade show active" id="home" role="tabpanel" aria-labelledby="home-tab">
                  <form onSubmit={(e) => e.preventDefault()}>
                    <div className="row">
                      <div className="col-sm-12 input_block">
                        <input
                          className="input_filed"
                          type="email"
                          placeholder="Please enter your email"
                          value={signId}
                          onChange={(e) => setSignId(e.target.value)}
                          onBlur={(e) => setSignId(e.target.value.trim())}
                        />
                      </div>
                      <div className="col-sm-12 input_block">
                        <div className="email_code">
                          <input
                            className="input_filed"
                            type={showPassword ? "text" : "password"}
                            placeholder="Please enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                          />
                          <div className='get_otp' onClick={handleTogglePassword}>
                            {showPassword ? <i className="ri-eye-line"></i> : <i className="ri-eye-close-line"></i>}
                          </div>
                        </div>
                      </div>



                      <div className="col-sm-12 login_btn">
                        <input
                          type="button"
                          value="Log In"
                          onClick={handleEmailLogin}
                        />
                      </div>
                      <div className="col-sm-12 registration__info">
                        <p>Or continue with</p>
                      </div>

                      <div className="col-sm-12">
                        <button className="google_btn" type="button" onClick={() => loginWithGoogle()}>
                          <img src="/images/google_icon.svg" alt="google" />Sign in with Google
                        </button>
                        {passkeySupported && (
                          <div className="col-sm-12" style={{ marginTop: '10px' }}>
                            <button
                              className="google_btn"
                              type="button"
                              onClick={handlePasskeyLogin}
                              disabled={isPasskeyLoading}
                            >
                              <i className="ri-fingerprint-line" style={{ fontSize: '20px', marginRight: '8px' }}></i>
                              {isPasskeyLoading ? 'Authenticating...' : 'Sign in with Passkey'}
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="col-sm-12 registration__info bottom agreetext">
                        <p>Do you have an account? <Link to="/signup">Register</Link></p>
                      </div>
                      <div className="col-sm-12 forgot_password text-center w-100">
                        <Link className="text-center w-100" to="/forgot_password">Forgot Password?</Link>
                      </div>
                    </div>
                  </form>
                </div>

                {/* Mobile Login Tab */}
                <div className="tab-pane fade" id="profile" role="tabpanel" aria-labelledby="profile-tab">
                  <form onSubmit={(e) => e.preventDefault()}>
                    <div className="row">
                      <div className="col-sm-12 input_block">
                        <div>
                          <Select
                            styles={customStyles}
                            inputId="countryCode"
                            name="country_code_select"
                            options={countriesList}
                            onChange={(selected) => setCountryCode(selected?.value)}
                            placeholder="Select country code"
                            blurInputOnSelect={true}
                            onMenuOpen={() => { }}
                            filterOption={(option, inputValue) =>
                              option.label.toLowerCase().includes(inputValue.toLowerCase())
                            }
                            value={countriesList.find(option => option.value === countryCode)}
                          />
                        </div>
                      </div>
                      <div className="col-sm-12 input_block">
                        <div className="phone-input-wrapper">
                          <input
                            className="input_filed"
                            type="number"
                            placeholder="Enter mobile number"
                            onWheel={(e) => e.target.blur()}
                            value={signId}
                            onChange={(e) => setSignId(e.target.value)}
                            onBlur={(e) => setSignId(e.target.value.trim())}
                          />
                        </div>
                      </div>
                      <div className="col-sm-12 input_block">
                        <div className="email_code">
                          <input
                            className="input_filed"
                            type={showPassword ? "text" : "password"}
                            placeholder="Please enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                          />
                          <div className='get_otp' onClick={handleTogglePassword}>
                            {showPassword ? <i className="ri-eye-line"></i> : <i className="ri-eye-close-line"></i>}
                          </div>
                        </div>
                      </div>


                      <div className="col-sm-12 login_btn">
                        <input type="button" value="Login" onClick={handlePhoneLogin} />
                      </div>
                      <div className="col-sm-12 registration__info">
                        <p>Or continue with</p>
                      </div>
                      <div className="col-sm-12">
                        <button className="google_btn" type="button" onClick={() => loginWithGoogle()}>
                          <img src="/images/google_icon.svg" alt="google" />Sign in with Google
                        </button>
                      </div>
                      {passkeySupported && (
                        <div className="col-sm-12" style={{ marginTop: '10px' }}>
                          <button
                            className="google_btn"
                            type="button"
                            onClick={handlePasskeyLogin}
                            disabled={isPasskeyLoading}
                          >
                            <i className="ri-fingerprint-line" style={{ fontSize: '20px', marginRight: '8px' }}></i>
                            {isPasskeyLoading ? 'Authenticating...' : 'Sign in with Passkey'}
                          </button>
                        </div>
                      )}
                      <div className="col-sm-12 registration__info agreetext">
                        <p>Do you have an account? <Link to="/signup">Register</Link></p>
                      </div>
                      <div className="col-sm-12 forgot_password text-center w-100">
                        <Link className="text-center w-100" to="/forgot_password">Forgot Password?</Link>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Security Verification Modal - Same structure as SettingsPage */}
      <div className="modal fade search_form" id="Confirmation_model" tabIndex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true" data-bs-backdrop="static">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="exampleModalLabel">{getVerificationTitle()}</h5>
              <p>{getVerificationDescription()}</p>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div className="modal-body">
              {selectedAuthMethod !== 4 && (
                <div className="verify_authenticator_s remove_authenticator_s">
                  <div style={{
                    width: '70px',
                    height: '70px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, rgb(55 62 75) 0%, rgb(117, 117, 117) 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 20px'
                  }}>
                    <i className="ri-shield-keyhole-line" style={{ fontSize: '35px', color: '#fff' }}></i>
                  </div>

                </div>)
              }
              <form className="profile_form" onSubmit={(e) => e.preventDefault()}>

                {/* Passkey Authentication UI */}
                {selectedAuthMethod === 4 ? (
                  <>
                    <div className="" style={{ textAlign: 'center', }}>
                      <div style={{
                        width: '80px',
                        height: '80px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #00c853 0%, #00a844 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 20px'
                      }}>
                        <i className="ri-fingerprint-line" style={{ fontSize: '40px', color: '#fff' }}></i>
                      </div>
                      <p style={{ color: '#fff', marginBottom: '10px' }}>
                        Use your registered passkey to verify
                      </p>
                      <p style={{ color: '#888', fontSize: '13px' }}>
                        This will prompt Face ID, Touch ID, or Windows Hello
                      </p>
                    </div>

                    <button
                      className="submit"
                      type="button"
                      onClick={handlePasskeyAuth}
                      disabled={isPasskeyLoading}
                    >
                      {isPasskeyLoading ? 'Authenticating...' : 'Authenticate with Passkey'}
                    </button>
                  </>
                ) : (
                  <>
                    <div className="emailinput">
                      <label>Enter 6-digit Code</label>
                      <div className="d-flex">
                        <input
                          type="text"
                          placeholder="Enter OTP here..."
                          value={getOtpCode()}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                            const newDigits = value.split('').concat(Array(6).fill('')).slice(0, 6);
                            setOtpDigits(newDigits);
                          }}
                          maxLength={6}
                        />
                        {/* Resend button for Email/Mobile OTP */}
                        {selectedAuthMethod !== 2 && (
                          resendTimer > 0 ? (
                            <div className="resend otp-button-disabled">Resend ({resendTimer}s)</div>
                          ) : (
                            <button
                              type="button"
                              className="getotp otp-button-enabled getotp_mobile"
                              onClick={() => sendLoginOtp(selectedAuthMethod)}
                            >
                              GET OTP
                            </button>
                          )
                        )}
                      </div>
                    </div>

                    <button
                      className="submit"
                      type="button"
                      onClick={handleAuthVerify}
                      disabled={getOtpCode().length < 6}
                    >
                      Confirm
                    </button>
                  </>
                )}

                {/* Switch verification option link - only show if multiple methods */}
                {availableMethods.length > 1 && (
                  <div className="cursor-pointer" onClick={(e) => { e.preventDefault(); handleOpenOptionsPopup(); }} style={{ marginTop: '5px' }}>
                    <small className="text-white">Switch to Another Verification Option <i className="ri-external-link-line"></i></small>
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Verification Options Modal - Same structure as SettingsPage */}
      <div className="modal fade search_form" id="VerificationOptionsModal" tabIndex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true" data-bs-backdrop="static">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="exampleModalLabel">Select a Verification Option</h5>
              <p>Choose how you want to verify your identity</p>
              <button type="button" className="btn-close" onClick={handleCloseOptionsPopup} aria-label="Close"></button>
            </div>
            <div className="modal-body">
              <form className="profile_form" onSubmit={(e) => e.preventDefault()}>

                {availableMethods.map((method) => (
                  <div className="" key={method.type}>
                    <div
                      className="d-flex align-items-center justify-content-between text-white"
                      onClick={() => handleSelectMethod(method)}
                      role="button"
                    >
                      <div className="d-flex align-items-center">
                        <i className={`${method.icon} me-3`}></i>
                        <div>
                          <strong>{method.label}</strong>
                          <p className="mb-0  small">{method.description}</p>
                        </div>
                      </div>
                      <i className="ri-arrow-right-s-line"></i>
                    </div>
                  </div>
                ))}

              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default LoginPage;
