import React, { useState, useEffect, useContext, useCallback, useRef } from "react";
import {  matchPassword } from "../../../utils/Validation";
import { alertErrorMessage, alertSuccessMessage } from "../../../customComponents/CustomAlertMessage";
import LoaderHelper from "../../../customComponents/Loading/LoaderHelper";
import AuthService from "../../../api/services/AuthService";
import { ApiConfig } from "../../../api/apiConfig/apiConfig";
import { ProfileContext } from "../../../context/ProfileProvider";
import "./SettingsPage.css";



const SettingsPage = (props) => {

  const { userDetails, handleUserDetails } = useContext(ProfileContext);

  const [emailId, setEmailId] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [mobile, setMobile] = useState('');
  const [myfile, setMyfile] = useState('');
  const [localSelfy, setLocalSelfy] = useState("");

  const [currencyType, setCurrencyType] = useState('USDT');
  const [password, setPassword] = useState('');
  const [conPassword, setConPassword] = useState('');
  const [passwordOtp, setPasswordOtp] = useState('');
  const [passwordTimer, setPasswordTimer] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showConPassword, setShowConPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Multiple verification method states for password change
  const [passwordVerifyMethod, setPasswordVerifyMethod] = useState(1); // 1=email, 2=google auth, 3=mobile
  const [passwordAvailableMethods, setPasswordAvailableMethods] = useState([]);



  // Ref to track object URLs for cleanup
  const objectUrlRef = useRef(null);

  // Initialize state from props/context
  useEffect(() => {
    const details = userDetails || props?.userDetails;
    if (details) {
      setEmailId(details.emailId || '');
      setMobile(details.mobileNumber || '');
      setFirstName(details.firstName || '');
      setLastName(details.lastName || '');
      setMyfile(details.profilepicture || '');
      setCurrencyType(details.currency_prefrence || 'USDT');
      
      // Set up security methods
      const userHasEmail = !!details.emailId;
      const userHasMobile = !!details.mobileNumber;
      const userHasGoogleAuth = details['2fa'] === 2;
      
      // Build available methods for password change
      const methods = [];
      if (userHasEmail) {
        methods.push({
          type: 1,
          label: 'Email',
          icon: 'ri-mail-line',
          description: 'Receive verification code via email'
        });
      }
      if (userHasGoogleAuth) {
        methods.push({
          type: 2,
          label: 'Google Authenticator',
          icon: 'ri-shield-keyhole-line',
          description: 'Use your Google Authenticator app'
        });
      }
      if (userHasMobile) {
        methods.push({
          type: 3,
          label: 'Mobile',
          icon: 'ri-smartphone-line',
          description: 'Receive verification code via SMS'
        });
      }
      setPasswordAvailableMethods(methods);
      
      // Set default verification method
      if (userHasEmail) setPasswordVerifyMethod(1);
      else if (userHasGoogleAuth) setPasswordVerifyMethod(2);
      else if (userHasMobile) setPasswordVerifyMethod(3);

      // Fetch security status from API
    }
  }, [props?.userDetails, userDetails]);

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
    };
  }, []);

  const modalBackdropRemove = useCallback(() => {
    try {
      document.body.classList.remove('modal-open');
      const backdrops = document.querySelectorAll('.modal-backdrop');
      backdrops.forEach(backdrop => backdrop.remove());
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    } catch (error) {
      // Silently handle error
    }
  }, []);

  const closeModal = useCallback((modalId) => {
    try {
      const modalElement = document.getElementById(modalId);
      if (modalElement) {
        const modal = window.bootstrap?.Modal?.getInstance(modalElement);
        if (modal) {
          modal.hide();
        }
      }
      modalBackdropRemove();
    } catch (error) {
      // Silently handle error
    }
  }, [modalBackdropRemove]);



  const openModal = useCallback((modalId) => {
    try {
      const modalElement = document.getElementById(modalId);
      if (modalElement && window.bootstrap) {
        const modal = new window.bootstrap.Modal(modalElement);
        modal.show();
      }
    } catch (error) {
      // Silently handle error
    }
  }, []);


  const handleChangeSelfie = useCallback((event) => {
    event.preventDefault();
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/png", "image/jpeg", "image/jpg"];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!allowedTypes.includes(file.type)) {
      alertErrorMessage("Only PNG, JPEG, and JPG file types are allowed.");
      event.target.value = "";
      return;
    }

    if (file.size > maxSize) {
      alertErrorMessage("Max image size is 5MB.");
      event.target.value = "";
      return;
    }

    // Cleanup previous object URL
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
    }

    const imgData = URL.createObjectURL(file);
    objectUrlRef.current = imgData;
    setLocalSelfy(imgData);
    setMyfile(file);

    // Close profile modal and open preview modal
    closeModal('profilepop');

    setTimeout(() => {
      openModal('editAvatarModal');
    }, 300);
  }, [closeModal, openModal]);

 
  const editavatar = useCallback(async () => {
    if (!myfile || typeof myfile === 'string') {
      return false;
    }

    try {
      const formData = new FormData();
      formData.append("profilepicture", myfile);

      LoaderHelper.loaderStatus(true);
      const result = await AuthService.editavatar(formData);
      LoaderHelper.loaderStatus(false);

      if (result?.success) {
        alertSuccessMessage(result?.message || "Profile picture updated successfully");
        if (result?.data?.profilepicture) {
          setMyfile(result.data.profilepicture);
        }
        await handleUserDetails();
        return true;
      } else {
        alertErrorMessage(result?.message || "Failed to update profile picture.");
        return false;
      }
    } catch (error) {
      LoaderHelper.loaderStatus(false);
      alertErrorMessage(error?.response?.data?.message || error?.message || "An error occurred while updating profile picture.");
      return false;
    }
  }, [myfile, handleUserDetails]);

  const editusername = useCallback(async () => {
    const trimmedFirst = firstName?.trim() || '';
    const trimmedLast = lastName?.trim() || '';

    if (!trimmedFirst && !trimmedLast) {
      return false;
    }

    // Basic validation for names
    const nameRegex = /^[a-zA-Z\s'-]*$/;
    if (trimmedFirst && !nameRegex.test(trimmedFirst)) {
      alertErrorMessage("First name contains invalid characters");
      return false;
    }
    if (trimmedLast && !nameRegex.test(trimmedLast)) {
      alertErrorMessage("Last name contains invalid characters");
      return false;
    }

    try {
      LoaderHelper.loaderStatus(true);
      const result = await AuthService.editusername(trimmedFirst, trimmedLast);
      LoaderHelper.loaderStatus(false);

      if (result?.success) {
        alertSuccessMessage(result?.message || "Name updated successfully");
        if (result?.data) {
          if (result.data.firstName) setFirstName(result.data.firstName);
          if (result.data.lastName) setLastName(result.data.lastName);
        }
        await handleUserDetails();
        return true;
      } else {
        alertErrorMessage(result?.message || "Failed to update name.");
        return false;
      }
    } catch (error) {
      LoaderHelper.loaderStatus(false);
      alertErrorMessage(error?.response?.data?.message || error?.message || "An error occurred while updating name.");
      return false;
    }
  }, [firstName, lastName, handleUserDetails]);


  const handleGetPasswordOtp = useCallback(async () => {
    if (isSubmitting) return;
    
    // Google Auth doesn't need OTP sending
    if (passwordVerifyMethod === 2) return;

    try {
      setIsSubmitting(true);
      LoaderHelper.loaderStatus(true);
      
      let signId;
      if (passwordVerifyMethod === 1) {
        signId = emailId;
      } else if (passwordVerifyMethod === 3) {
        const details = userDetails || props?.userDetails;
        const code = details?.country_code || "+91";
        signId = `${code} ${mobile}`;
      }
      
      if (!signId) {
        alertErrorMessage("Please update your email or phone number first");
        setIsSubmitting(false);
        LoaderHelper.loaderStatus(false);
        return;
      }
      
      const result = await AuthService.getOtp(signId, "forgot_password");
      LoaderHelper.loaderStatus(false);
      setIsSubmitting(false);

      if (result?.success) {
        alertSuccessMessage(result?.message || "OTP sent successfully");
        setPasswordTimer(30);
      } else {
        alertErrorMessage(result?.message || "Failed to send OTP.");
      }
    } catch (error) {
      LoaderHelper.loaderStatus(false);
      setIsSubmitting(false);
      alertErrorMessage(error?.response?.data?.message || error?.message || "An error occurred while sending OTP.");
    }
  }, [isSubmitting, passwordVerifyMethod, emailId, mobile, userDetails, props?.userDetails]);

  // Custom password validation function
  const validatePasswordSettings = useCallback((value) => {
    if (!value) return { isValid: false, errors: [] };

    const errors = [];

    if (value.length < 8 || value.length > 30) {
      errors.push('8-30 characters');
    }
    if (!/[A-Z]/.test(value)) {
      errors.push('At least one uppercase');
    }
    if (!/[a-z]/.test(value)) {
      errors.push('At least one lowercase');
    }
    if (!/[0-9]/.test(value)) {
      errors.push('At least one number');
    }
    if (/\s/.test(value)) {
      errors.push('Does not contain any spaces');
    }

    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }, []);

  const handleChangePassword = useCallback(async () => {
    if (isSubmitting) return;

    const passwordValidation = validatePasswordSettings(password);
    if (!passwordValidation.isValid || !password) {
      alertErrorMessage("Please ensure your password meets all requirements");
      return;
    }

    if (matchPassword(password, conPassword) !== undefined) {
      alertErrorMessage("New password and confirm password must match");
      return;
    }

    if (!passwordOtp || passwordOtp.length < 6) {
      alertErrorMessage("Invalid verification code");
      return;
    }

    try {
      setIsSubmitting(true);
      LoaderHelper.loaderStatus(true);
      const result = await AuthService.setSecurity(password, conPassword, passwordOtp, passwordVerifyMethod);
      LoaderHelper.loaderStatus(false);
      setIsSubmitting(false);

      if (result?.success) {
        setPassword("");
        setConPassword("");
        setPasswordOtp("");
        setPasswordTimer(0);
        closeModal('security_verification');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        alertSuccessMessage(result?.message || "Password changed successfully");
      } else {
        alertErrorMessage(result?.message || "Failed to change password.");
      }
    } catch (error) {
      LoaderHelper.loaderStatus(false);
      setIsSubmitting(false);
      alertErrorMessage(error?.response?.data?.message || error?.message || "An error occurred while changing password.");
    }
  }, [isSubmitting, password, conPassword, passwordOtp, passwordVerifyMethod, validatePasswordSettings, closeModal]);

  // Helper functions for password verification flow
  const getPasswordVerificationTitle = useCallback(() => {
    if (passwordVerifyMethod === 2) return 'Enter Google Authenticator Code';
    if (passwordVerifyMethod === 1) return 'Enter Email Verification Code';
    if (passwordVerifyMethod === 3) return 'Enter Mobile Verification Code';
    return 'Security Verification';
  }, [passwordVerifyMethod]);

  const getPasswordVerificationDescription = useCallback(() => {
    if (passwordVerifyMethod === 2) return 'Enter the 6-digit code from your authenticator app';
    if (passwordVerifyMethod === 1) {
      const maskedEmail = emailId ? `${emailId.substring(0, 3)}***${emailId.substring(emailId.length - 4)}` : 'your email';
      return `We'll send a verification code to ${maskedEmail}`;
    }
    if (passwordVerifyMethod === 3) {
      const maskedMobile = mobile ? `****${mobile.slice(-4)}` : 'your mobile';
      return `We'll send a verification code to ${maskedMobile}`;
    }
    return '';
  }, [passwordVerifyMethod, emailId, mobile]);

  // Open password verification options popup
  const handleOpenPasswordOptionsPopup = useCallback(() => {
    closeModal('security_verification');
    setTimeout(() => {
      openModal('passwordVerificationOptionsModal');
    }, 100);
  }, [closeModal, openModal]);

  // Select verification method for password change
  const handleSelectPasswordMethod = useCallback((method) => {
    setPasswordVerifyMethod(method.type);
    setPasswordOtp('');
    setPasswordTimer(0);
    
    closeModal('passwordVerificationOptionsModal');
    setTimeout(() => {
      openModal('security_verification');
    }, 100);
  }, [closeModal, openModal]);

  // Close options popup and reopen main modal
  const handleClosePasswordOptionsPopup = useCallback(() => {
    closeModal('passwordVerificationOptionsModal');
    setTimeout(() => {
      openModal('security_verification');
    }, 100);
  }, [closeModal, openModal]);

  const handleCurrency = useCallback(async (selectedCurrency) => {
    if (isSubmitting) return;

    if (!selectedCurrency) {
      alertErrorMessage("Please select a currency");
      return;
    }

    try {
      setIsSubmitting(true);
      LoaderHelper.loaderStatus(true);
      const result = await AuthService.setCurrency(selectedCurrency);
      LoaderHelper.loaderStatus(false);
      setIsSubmitting(false);

      if (result?.success) {
        alertSuccessMessage(result?.message || "Currency preference updated successfully");
        await handleUserDetails();
      } else {
        alertErrorMessage(result?.message || "Failed to update currency preference.");
      }
    } catch (error) {
      LoaderHelper.loaderStatus(false);
      setIsSubmitting(false);
      alertErrorMessage(error?.response?.data?.message || error?.message || "An error occurred while updating currency preference.");
    }
  }, [isSubmitting, handleUserDetails]);


  const handleProfileSubmit = useCallback(async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    let avatarUpdated = false;
    let nameUpdated = false;

    try {
      // Upload profile picture if changed
      if (myfile && typeof myfile !== 'string') {
        avatarUpdated = await editavatar();
      }

      // Update name if provided
      const trimmedFirst = firstName?.trim();
      const trimmedLast = lastName?.trim();
      if (trimmedFirst || trimmedLast) {
        nameUpdated = await editusername();
      }

      // Close modal if at least one update was successful
      if (avatarUpdated || nameUpdated) {
        closeModal('profilepop');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        if (avatarUpdated && objectUrlRef.current) {
          URL.revokeObjectURL(objectUrlRef.current);
          objectUrlRef.current = null;
          setLocalSelfy("");
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, myfile, firstName, lastName, editavatar, editusername, closeModal]);

  const resetAvatarPreview = useCallback(() => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    setLocalSelfy("");
    const details = userDetails || props?.userDetails;
    setMyfile(details?.profilepicture || "");
    const fileInput = document.getElementById('avatarFileInput');
    if (fileInput) fileInput.value = "";
    const fileInput2 = document.getElementById('profileImageUpload');
    if (fileInput2) fileInput2.value = "";
  }, [userDetails, props?.userDetails]);

  const handleAvatarApply = useCallback(async () => {
    if (isSubmitting) return;

    if (!myfile || typeof myfile === 'string') {
      alertErrorMessage("Please select an image first");
      return;
    }

    setIsSubmitting(true);
    const result = await editavatar();
    setIsSubmitting(false);

    if (result) {
      closeModal('editAvatarModal');
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
      setLocalSelfy("");
      const fileInput = document.getElementById('avatarFileInput');
      if (fileInput) fileInput.value = "";
      const fileInput2 = document.getElementById('profileImageUpload');
      if (fileInput2) fileInput2.value = "";
    }
  }, [isSubmitting, myfile, editavatar, closeModal]);




  useEffect(() => {
    let interval;
    if (passwordTimer > 0) {
      interval = setInterval(() => {
        setPasswordTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [passwordTimer]);

 
  const getDisplayName = () => {
    const first = userDetails?.firstName || props?.userDetails?.firstName || firstName;
    const last = userDetails?.lastName || props?.userDetails?.lastName || lastName;
    const name = `${first || ''} ${last || ''}`.trim();
    return name || 'User Name';
  };

  const getProfileImage = () => {
    const pic = userDetails?.profilepicture || props?.userDetails?.profilepicture || (typeof myfile === 'string' ? myfile : '');
    return pic ? `${ApiConfig.baseImage}${pic}` : "/images/user.png";
  };

  const getProfileModalImage = () => {
    if (localSelfy) return localSelfy;
    if (myfile && typeof myfile !== 'string') return URL.createObjectURL(myfile);
    const pic = userDetails?.profilepicture || props?.userDetails?.profilepicture || (typeof myfile === 'string' ? myfile : '');
    return pic ? `${ApiConfig.baseImage}${pic}` : "/images/user.png";
  };

  const isRegisteredByPhone = userDetails?.registeredBy === "phone" || props?.userDetails?.registeredBy === "phone";

  const canSubmitProfile = (firstName?.trim() || lastName?.trim() || (myfile && typeof myfile !== 'string')) && !isSubmitting;
  const canSubmitPassword = !isSubmitting && validatePasswordSettings(password).isValid && password && 
                           matchPassword(password, conPassword) === undefined && passwordOtp && passwordOtp.length >= 6;

  useEffect(() => {
    window.scrollTo(0, 0);
 }, []);

  return (
    <>
      <div className="dashboard_right">

        <div className="twofactor_outer_s">
          <h5>Profile</h5>
          <p>To protect your account, we recommend that you enable at least one 2FA</p>
          <div className="two_factor_list">
            <div className="factor_bl active">
              <div className="lftcnt">
                <h6><img src="/images/lock_icon.svg" alt="Authenticator App" /> Name & Avatar</h6>
                <p>Update your name and avatar to personalize your profile. Save changes to keep your account up to date.</p>
                <input
                  type="file"
                  id="avatarFileInput"
                  accept="image/png,image/jpeg,image/jpg"
                  onChange={handleChangeSelfie}
                  style={{ display: 'none' }}
                />
              </div>

              <div className="enable">
                <img
                  src={getProfileImage()}
                  alt="user"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "/images/user.png";
                  }}
                />
                {getDisplayName()}
              </div>
              <button className="btn" data-bs-toggle="modal" data-bs-target="#profilepop">Change</button>
            </div>

          </div>
        </div>

        <div className="twofactor_outer_s">
          <h5>Currency Preference</h5>
          <p>Select your preferred display currency for all markets</p>

          <div className="two_factor_list">
            <div className="currency_list_b">
              <ul>
                <li className={currencyType === "USDT" ? "active" : ""} onClick={() => setCurrencyType("USDT")}>
                  <div className="currency_bit"><img src="/images/icon/tether.png" className="img-fluid" alt="Tether" /></div>
                  <h6>Tether USD (USDT)</h6>
                  <div className="vector_bottom">
                    <svg xmlns="http://www.w3.org/2000/svg" width="60" height="52" viewBox="0 0 60 52" fill="none">
                      <path d="M59.6296 0L60 52H0L59.6296 0Z" fill="#3B3B3B"></path>
                    </svg>
                  </div>
                </li>
                <li className={currencyType === "BTC" ? "active" : ""} onClick={() => setCurrencyType("BTC")}>
                  <div className="currency_bit"><img src="/images/icon/btc copy.png" className="img-fluid" alt="BTC" width="50px" /></div>
                  <h6>BTC</h6>
                  <div className="vector_bottom">
                    <svg xmlns="http://www.w3.org/2000/svg" width="60" height="52" viewBox="0 0 60 52" fill="none">
                      <path d="M59.6296 0L60 52H0L59.6296 0Z" fill="#3B3B3B"></path>
                    </svg>
                  </div>
                </li>
                <li className={currencyType === "BNB" ? "active" : ""} onClick={() => setCurrencyType("BNB")}>
                  <div className="currency_bit"><img src="/images/icon/bnb copy.png" className="img-fluid" alt="BNB" /></div>
                  <h6>BNB</h6>
                  <div className="vector_bottom">
                    <svg xmlns="http://www.w3.org/2000/svg" width="60" height="52" viewBox="0 0 60 52" fill="none">
                      <path d="M59.6296 0L60 52H0L59.6296 0Z" fill="#3B3B3B"></path>
                    </svg>
                  </div>
                </li>
              </ul>
              <div className="savebtn">
                <button onClick={() => handleCurrency(currencyType)} disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : 'Save Currency Preference'}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="twofactor_outer_s">
          <h5>Security Settings</h5>
          <p>Manage your account security and password settings</p>

          <div className="two_factor_list">
            <div className="factor_bl active">
              <div className="lftcnt">
                <h6><img src="/images/lock_icon.svg" alt="Login Password" /> Login Password</h6>
                <p>Change your account password. You will need to verify with OTP sent to your registered {isRegisteredByPhone ? "mobile number" : "email"}.</p>
              </div>

              <button
                className="btn"
                disabled={isSubmitting}
                onClick={async () => {
                  setPassword("");
                  setConPassword("");
                  setPasswordOtp("");
                  openModal('security_verification');
                }}
              >
                Change Password
              </button>
            </div>
          </div>
        </div>

        {/* Edit Avatar Modal */}
        <div className="modal fade search_form" id="editAvatarModal" tabIndex="-1" aria-labelledby="editAvatarModalLabel" aria-hidden="true">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title" id="editAvatarModalLabel">Preview Avatar</h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  data-bs-dismiss="modal"
                  aria-label="Close"
                  onClick={resetAvatarPreview}
                ></button>
              </div>
              <div className="modal-body avatar-modal-body">
                <p className="text-center mb-3">Review your new avatar before applying</p>
                <div className="avatar-preview-wrapper">
                  <div className="avatar-preview-container">
                    <img
                      className="profileimg avatar-preview-img"
                      src={localSelfy || "/images/user.png"}
                      alt="Avatar Preview"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "/images/user.png";
                      }}
                    />
                  </div>
                </div>

                <div className="avatar-modal-actions" style={{ marginTop: '20px' }}>
                  <button
                    type="button"
                    className="btn-cancel-avatar"
                    data-bs-dismiss="modal"
                    onClick={resetAvatarPreview}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn-apply-avatar"
                    onClick={handleAvatarApply}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Applying...' : 'Apply Changes'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Security Verification Modal */}
        <div className="modal fade search_form" id="security_verification" tabIndex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true" data-bs-backdrop="static">
          <div className="modal-dialog modal-dialog-centered ">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title" id="exampleModalLabel">{getPasswordVerificationTitle()}</h5>
                <p>{getPasswordVerificationDescription()}</p>
                <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
              </div>
              <div className="modal-body">
                <form className="profile_form" onSubmit={(e) => e.preventDefault()}>
                  <div className="emailinput">
                    <label>Enter 6-digit Code</label>
                    
                    <div className="d-flex">
                      <input
                        type="text"
                        placeholder="Enter code here..."
                        value={passwordOtp}
                        onChange={(e) => setPasswordOtp(e.target.value.replace(/\D/g, ''))}
                        maxLength={6}
                      />
                      {/* Send OTP button for Email/Mobile only */}
                      {passwordVerifyMethod !== 2 && (
                        passwordTimer > 0 ? (
                          <div className="resend otp-button-disabled">Resend ({passwordTimer}s)</div>
                        ) : (
                          <button
                            type="button"
                            className="getotp otp-button-enabled getotp_mobile"
                            onClick={handleGetPasswordOtp}
                            disabled={isSubmitting}
                          >
                            GET OTP
                          </button>
                        )
                      )}
                    </div>
                  </div>

                  {/* Switch verification option link - only show if multiple methods */}
                  {passwordAvailableMethods.length > 1 && (
                    <div className="cursor-pointer" onClick={(e) => { e.preventDefault(); handleOpenPasswordOptionsPopup(); }}>
                      <small className="text-white">Switch to Another Verification Option<i className="ri-external-link-line"></i></small>
                    </div>
                  )}

                  <div className="emailinput">
                    <label>New Password</label>
                    <div className="d-flex">
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter new password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="new-password"
                      />
                      <div className="password-eye-btn" onClick={() => setShowPassword(!showPassword)}>{showPassword ? (
                          <i className="ri-eye-line"></i>
                        ) : (
                          <i className="ri-eye-close-line"></i>
                        )}</div>
                     
                    </div>
                  </div>
                  <div className="error_text">
                    {password ? (
                      <>
                        <span className={password.length >= 8 && password.length <= 30 ? 'text-success' : 'text-danger'}>
                          {password.length >= 8 && password.length <= 30 ? '✓' : '✗'} 8-30 characters
                        </span>
                        <span className={/[A-Z]/.test(password) && /[a-z]/.test(password) && /[0-9]/.test(password) ? 'text-success' : 'text-danger'}>
                          {/[A-Z]/.test(password) && /[a-z]/.test(password) && /[0-9]/.test(password) ? '✓' : '✗'} At least one uppercase, lowercase, and number.
                        </span>
                        <span className={!/\s/.test(password) ? 'text-success' : 'text-danger'}>
                          {!/\s/.test(password) ? '✓' : '✗'} Does not contain any spaces.
                        </span>
                      </>
                    ) : (
                      <>
                        <span>8-30 characters</span>
                        <span>At least one uppercase, lowercase, and number.</span>
                        <span>Does not contain any spaces.</span>
                      </>
                    )}
                  </div>
                  <div className="emailinput">
                    <label>Confirm Password</label>
                    <div className="d-flex">
                      <input
                        type={showConPassword ? "text" : "password"}
                        placeholder="Confirm new password"
                        value={conPassword}
                        onChange={(e) => setConPassword(e.target.value)}
                        autoComplete="new-password"
                      />
                        <div className="password-eye-btn" onClick={() => setShowConPassword(!showConPassword)}>{showConPassword ? (
                          <i className="ri-eye-line"></i>
                        ) : (
                          <i className="ri-eye-close-line"></i>
                        )}</div>
                     
                    </div>
                    {conPassword && (
                      <div className="error" style={{ marginTop: '5px' }}>
                        {password === conPassword ? (
                          <span className="text-success">✓ Passwords match</span>
                        ) : (
                          <span className="text-danger">✗ Passwords do not match</span>
                        )}
                      </div>
                    )}
                  </div>

                  <button
                    className="submit"
                    type="button"
                    onClick={handleChangePassword}
                    disabled={!canSubmitPassword}
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>

        {/* Password Verification Options Modal */}
        <div className="modal fade search_form" id="passwordVerificationOptionsModal" tabIndex="-1" aria-hidden="true" data-bs-backdrop="static">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Select a Verification Option</h5>
                <p>Choose how you want to verify your identity</p>
                <button type="button" className="btn-close" onClick={handleClosePasswordOptionsPopup} aria-label="Close"></button>
              </div>
              <div className="modal-body">
                <form className="profile_form" onSubmit={(e) => e.preventDefault()}>
                  
                  {passwordAvailableMethods.map((method) => (
                    <div className="" key={method.type}>
                      <div 
                        className="d-flex align-items-center justify-content-between text-white" 
                        onClick={() => handleSelectPasswordMethod(method)}
                        role="button"
                      >
                        <div className="d-flex align-items-center">
                          <i className={`${method.icon} me-3`}></i>
                          <div>
                            <strong>{method.label}</strong>
                            <p className="mb-0 small">{method.description}</p>
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

        {/* Edit Profile Modal */}
        <div className="modal fade search_form" id="profilepop" tabIndex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
          <div className="modal-dialog modal-dialog-centered ">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title" id="exampleModalLabel">Edit Profile</h5>
                <p>Avatar and nickname will also be applied to your profile. Abusing them might lead to community penalties.</p>
                <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
              </div>
              <div className="modal-body">
                <form className="profile_form" onSubmit={(e) => e.preventDefault()}>
                  <div className="user_img">
                    <img
                      src={getProfileModalImage()}
                      alt="user"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "/images/user.png";
                      }}
                    />
                    <label
                      htmlFor="profileImageUpload"
                      className="edit_user"
                    >
                      <img src="/images/edit_icon.svg" alt="edit" />
                    </label>
                    <input
                      type="file"
                      id="profileImageUpload"
                      accept="image/png,image/jpeg,image/jpg"
                      onChange={handleChangeSelfie}
                      className="hidden-file-input"
                    />
                  </div>

                  <div className="emailinput">
                    <label>First Name</label>
                    <div className="d-flex">
                      <input
                        type="text"
                        placeholder="Enter first name"
                        value={firstName === "undefined" || !firstName ? "" : firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        maxLength={50}
                      />
                    </div>
                  </div>

                  <div className="emailinput">
                    <label>Last Name</label>
                    <div className="d-flex">
                      <input
                        type="text"
                        placeholder="Enter last name"
                        value={lastName === "undefined" || !lastName ? "" : lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        maxLength={50}
                      />
                    </div>
                  </div>

                  <button
                    className="submit"
                    type="button"
                    onClick={handleProfileSubmit}
                    disabled={!canSubmitProfile}
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>

  
      </div>
    </>
  );
};

export default SettingsPage;