import React, { useState, useEffect, useContext, useCallback, useRef } from "react";
import { matchPassword } from "../../../utils/Validation";
import { alertErrorMessage, alertSuccessMessage } from "../../../customComponents/CustomAlertMessage";
import LoaderHelper from "../../../customComponents/Loading/LoaderHelper";
import AuthService from "../../../api/services/AuthService";
import { ApiConfig } from "../../../api/apiConfig/apiConfig";
import { ProfileContext } from "../../../context/ProfileProvider";
import { startAuthentication } from "@simplewebauthn/browser";
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

  // Anti-phishing code states
  const [antiPhishingCode, setAntiPhishingCode] = useState('');
  const [hasAntiPhishingCode, setHasAntiPhishingCode] = useState(false);
  const [antiPhishingVerifyMethod, setAntiPhishingVerifyMethod] = useState('passkey'); // passkey, email, mobile, totp
  const [antiPhishingAvailableMethods, setAntiPhishingAvailableMethods] = useState([]);
  const [antiPhishingOtp, setAntiPhishingOtp] = useState('');
  const [antiPhishingTimer, setAntiPhishingTimer] = useState(0);
  const [hasPasskey, setHasPasskey] = useState(false);
  const [passkeySupported, setPasskeySupported] = useState(false);
  const [antiPhishingRemoveVerifyMethod, setAntiPhishingRemoveVerifyMethod] = useState('passkey');
  const [antiPhishingRemoveAvailableMethods, setAntiPhishingRemoveAvailableMethods] = useState([]);
  const [antiPhishingRemoveOtp, setAntiPhishingRemoveOtp] = useState('');
  const [antiPhishingRemoveTimer, setAntiPhishingRemoveTimer] = useState(0);

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
    }
  }, [props?.userDetails, userDetails]);

  // Check passkey support and fetch passkeys for anti-phishing verification
  const checkPasskeySupport = useCallback(async () => {
    if (window.PublicKeyCredential === undefined || typeof window.PublicKeyCredential !== 'function') {
      setPasskeySupported(false);
      return false;
    }
    try {
      const available = await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
      if (!available && isIOS && isSafari) {
        const match = navigator.userAgent.match(/OS (\d+)_/);
        const iosVersion = match ? parseInt(match[1], 10) : 0;
        if (iosVersion >= 16) {
          setPasskeySupported(true);
          return true;
        }
      }
      setPasskeySupported(available);
      return available;
    } catch {
      setPasskeySupported(false);
      return false;
    }
  }, []);

  const fetchPasskeys = useCallback(async () => {
    try {
      const result = await AuthService.passkeyGetList();
      if (result?.success && result?.data) {
        const count = result.data.count || (result.data.passkeys?.length || 0);
        setHasPasskey(count > 0);
      }
    } catch {
      // Silent fail
    }
  }, []);

  const [antiPhishingStatusMethods, setAntiPhishingStatusMethods] = useState([]);

  const fetchAntiPhishingStatus = useCallback(async () => {
    try {
      const result = await AuthService.antiPhishingGetStatus();
      if (result?.success && result?.data) {
        setHasAntiPhishingCode(result.data.hasAntiPhishingCode ?? false);
        const methods = result.data.availableMethods || [];
        setAntiPhishingStatusMethods(methods);
      }
    } catch {
      // Silent fail - API may return 400 if no verification methods
    }
  }, []);

  useEffect(() => {
    checkPasskeySupport();
    fetchPasskeys();
    fetchAntiPhishingStatus();
  }, [checkPasskeySupport, fetchPasskeys, fetchAntiPhishingStatus]);

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

  // Mask helpers for anti-phishing verification UI
  const maskEmail = useCallback((email) => {
    if (!email) return '';
    const [username, domain] = email.split('@');
    if (!domain) return email;
    const masked = username.substring(0, 2) + '***' + username.slice(-1);
    return `${masked}@${domain}`;
  }, []);
  const maskPhone = useCallback((phone) => {
    if (!phone) return '';
    const cleaned = String(phone).replace(/\s/g, '');
    if (cleaned.length < 4) return String(phone);
    return '****' + cleaned.slice(-4);
  }, []);


  // ============ ANTI-PHISHING CODE FLOW ============
  // Build available verification methods - prefer API status when available
  const buildAntiPhishingVerifyMethods = useCallback(() => {
    const details = userDetails || props?.userDetails;
    if (antiPhishingStatusMethods.length > 0) {
      const iconMap = { passkey: 'ri-fingerprint-line', totp: 'ri-shield-keyhole-line', email: 'ri-mail-line', mobile: 'ri-smartphone-line' };
      const methodOrder = { passkey: 0, totp: 1, email: 2, mobile: 3 };
      const getDesc = (method) => {
        if (method === 'passkey') return 'Use passkey to verify';
        if (method === 'totp') return 'Use your authenticator app';
        if (method === 'email') return `Send code to ${maskEmail(details?.emailId)}`;
        if (method === 'mobile') return `Send code to ${maskPhone(details?.country_code ? `${details.country_code} ${details.mobileNumber || ''}`.trim() : details?.mobileNumber)}`;
        return '';
      };
      return antiPhishingStatusMethods
        .filter(m => m.method !== 'passkey' || passkeySupported)
        .sort((a, b) => (methodOrder[a.method] ?? 99) - (methodOrder[b.method] ?? 99))
        .map(m => ({
          value: m.method,
          label: m.label,
          icon: iconMap[m.method] || 'ri-shield-line',
          description: getDesc(m.method)
        }));
    }
    const methods = [];
    const userHasEmail = !!details?.emailId;
    const userHasMobile = !!details?.mobileNumber;
    const userHasGoogleAuth = details?.['2fa'] === 2;
    const userHasPasskey = hasPasskey && passkeySupported;
    // Order: passkey first, then Google Authenticator, then email, then mobile
    if (userHasPasskey) {
      methods.push({ value: 'passkey', label: 'Passkey', icon: 'ri-fingerprint-line', description: 'Use passkey to verify' });
    }
    if (userHasGoogleAuth) {
      methods.push({ value: 'totp', label: 'Google Authenticator', icon: 'ri-shield-keyhole-line', description: 'Use your authenticator app' });
    }
    if (userHasEmail) {
      methods.push({ value: 'email', label: 'Email', icon: 'ri-mail-line', description: `Send code to ${maskEmail(details?.emailId)}` });
    }
    if (userHasMobile) {
      const fullMobile = details?.country_code ? `${details.country_code} ${details.mobileNumber || ''}`.trim() : details?.mobileNumber || '';
      methods.push({ value: 'mobile', label: 'Mobile', icon: 'ri-smartphone-line', description: `Send code to ${maskPhone(fullMobile)}` });
    }
    return methods;
  }, [userDetails, props?.userDetails, hasPasskey, passkeySupported, antiPhishingStatusMethods, maskEmail, maskPhone]);

  // Open anti-phishing info modal (how it works)
  const handleAntiPhishingInfoOpen = useCallback(() => {
    openModal('antiPhishingInfoModal');
  }, [openModal]);

  // Proceed from info to set code modal
  const handleAntiPhishingSetCodeOpen = useCallback(() => {
    closeModal('antiPhishingInfoModal');
    const methods = buildAntiPhishingVerifyMethods();
    if (methods.length === 0) {
      alertErrorMessage('You need at least one verification method (Email, Mobile, Google Authenticator, or Passkey) to set an anti-phishing code. Please add one in Security Settings.');
      return;
    }
    setAntiPhishingAvailableMethods(methods);
    setAntiPhishingVerifyMethod(methods[0].value);
    setAntiPhishingCode('');
    setAntiPhishingOtp('');
    setAntiPhishingTimer(0);
    setTimeout(() => openModal('antiPhishingSetCodeModal'), 100);
  }, [closeModal, openModal, buildAntiPhishingVerifyMethods]);

  // Attempt passkey verification for anti-phishing
  const attemptAntiPhishingPasskeyVerify = useCallback(async () => {
    if (!hasPasskey || !passkeySupported) return null;
    const details = userDetails || props?.userDetails;
    const signId = details?.emailId || (details?.country_code ? `${details.country_code} ${details.mobileNumber || ''}`.trim() : details?.mobileNumber);
    if (!signId) return null;
    try {
      LoaderHelper.loaderStatus(true);
      const optionsResult = await AuthService.passkeyGetAuthOptions(signId);
      if (!optionsResult?.success || !optionsResult?.data) return null;
      const credential = await startAuthentication(optionsResult.data);
      const verifyResult = await AuthService.passkeyVerifyAuth(signId, credential);
      LoaderHelper.loaderStatus(false);
      if (verifyResult?.success) return verifyResult.data;
      return null;
    } catch {
      LoaderHelper.loaderStatus(false);
      return null;
    }
  }, [hasPasskey, passkeySupported, userDetails, props?.userDetails]);

  // Send OTP for anti-phishing verification
  const handleAntiPhishingSendOtp = useCallback(async () => {
    if (antiPhishingVerifyMethod === 'totp' || antiPhishingVerifyMethod === 'passkey') return;
    try {
      LoaderHelper.loaderStatus(true);
      const result = await AuthService.antiPhishingSendOtp(antiPhishingVerifyMethod);
      LoaderHelper.loaderStatus(false);
      if (result?.success) {
        alertSuccessMessage(result?.message || 'OTP sent successfully');
        setAntiPhishingTimer(60);
      } else {
        alertErrorMessage(result?.message || 'Failed to send OTP');
      }
    } catch (error) {
      LoaderHelper.loaderStatus(false);
      alertErrorMessage(error?.response?.data?.message || error?.message || 'Failed to send OTP');
    }
  }, [antiPhishingVerifyMethod]);

  // Verify and save anti-phishing code via API
  const handleAntiPhishingVerifyAndSave = useCallback(async () => {
    const code = antiPhishingCode?.replace(/\D/g, '') || '';
    if (code.length < 5 || code.length > 8) {
      alertErrorMessage('Please enter a 5-8 digit code');
      return;
    }
    try {
      setIsSubmitting(true);
      LoaderHelper.loaderStatus(true);
      if (antiPhishingVerifyMethod === 'passkey') {
        const passkeyResult = await attemptAntiPhishingPasskeyVerify();
        if (!passkeyResult?.userId) {
          // Passkey failed - show alternate verification options
          closeModal('antiPhishingSetCodeModal');
          setTimeout(() => openModal('antiPhishingVerifyOptionsModal'), 100);
          return;
        }
        const result = await AuthService.antiPhishingAdd({
          antiPhishingCode: code,
          verifyMethod: 'passkey',
          passkeyUserId: passkeyResult.userId
        });
        if (result?.success) {
          alertSuccessMessage(result?.message || 'Anti-phishing code set successfully');
          setHasAntiPhishingCode(true);
          setAntiPhishingCode('');
          setAntiPhishingOtp('');
          closeModal('antiPhishingSetCodeModal');
          fetchAntiPhishingStatus();
        } else {
          alertErrorMessage(result?.message || 'Failed to set anti-phishing code');
        }
      } else {
        const verifyCode = antiPhishingOtp?.trim() || '';
        if (!verifyCode || verifyCode.length !== 6) {
          alertErrorMessage(antiPhishingVerifyMethod === 'totp' ? 'Please enter a valid 6-digit code' : 'Please enter the 6-digit OTP');
          return;
        }
        const result = await AuthService.antiPhishingAdd({
          antiPhishingCode: code,
          verifyMethod: antiPhishingVerifyMethod,
          code: verifyCode
        });
        if (result?.success) {
          alertSuccessMessage(result?.message || 'Anti-phishing code set successfully');
          setHasAntiPhishingCode(true);
          setAntiPhishingCode('');
          setAntiPhishingOtp('');
          closeModal('antiPhishingSetCodeModal');
          fetchAntiPhishingStatus();
        } else {
          alertErrorMessage(result?.message || 'Failed to set anti-phishing code');
        }
      }
    } catch (error) {
      alertErrorMessage(error?.response?.data?.message || error?.message || 'Something went wrong');
    } finally {
      setIsSubmitting(false);
      LoaderHelper.loaderStatus(false);
    }
  }, [antiPhishingCode, antiPhishingVerifyMethod, antiPhishingOtp, attemptAntiPhishingPasskeyVerify, closeModal, openModal, fetchAntiPhishingStatus]);

  // Open verification options for anti-phishing set
  const handleAntiPhishingOpenVerifyOptions = useCallback(() => {
    closeModal('antiPhishingSetCodeModal');
    setTimeout(() => openModal('antiPhishingVerifyOptionsModal'), 100);
  }, [closeModal, openModal]);

  const handleAntiPhishingSelectVerifyMethod = useCallback((method) => {
    setAntiPhishingVerifyMethod(method.value);
    setAntiPhishingOtp('');
    setAntiPhishingTimer(0);
    closeModal('antiPhishingVerifyOptionsModal');
    setTimeout(() => openModal('antiPhishingSetCodeModal'), 100);
  }, [closeModal, openModal]);

  const handleAntiPhishingCloseVerifyOptions = useCallback(() => {
    closeModal('antiPhishingVerifyOptionsModal');
    setTimeout(() => openModal('antiPhishingSetCodeModal'), 100);
  }, [closeModal, openModal]);

  // Remove anti-phishing flow
  const handleAntiPhishingRemoveOpen = useCallback(() => {
    const methods = buildAntiPhishingVerifyMethods();
    if (methods.length === 0) {
      alertErrorMessage('No verification method available. Please add Email, Mobile, Google Authenticator, or Passkey in Security Settings.');
      return;
    }
    setAntiPhishingRemoveAvailableMethods(methods);
    setAntiPhishingRemoveVerifyMethod(methods[0].value);
    setAntiPhishingRemoveOtp('');
    setAntiPhishingRemoveTimer(0);
    openModal('antiPhishingRemoveModal');
  }, [buildAntiPhishingVerifyMethods, openModal]);

  const handleAntiPhishingRemoveSendOtp = useCallback(async () => {
    if (antiPhishingRemoveVerifyMethod === 'totp' || antiPhishingRemoveVerifyMethod === 'passkey') return;
    try {
      LoaderHelper.loaderStatus(true);
      const result = await AuthService.antiPhishingSendOtp(antiPhishingRemoveVerifyMethod);
      LoaderHelper.loaderStatus(false);
      if (result?.success) {
        alertSuccessMessage(result?.message || 'OTP sent successfully');
        setAntiPhishingRemoveTimer(60);
      } else {
        alertErrorMessage(result?.message || 'Failed to send OTP');
      }
    } catch (error) {
      LoaderHelper.loaderStatus(false);
      alertErrorMessage(error?.response?.data?.message || error?.message || 'Failed to send OTP');
    }
  }, [antiPhishingRemoveVerifyMethod]);

  const handleAntiPhishingRemove = useCallback(async () => {
    try {
      setIsSubmitting(true);
      LoaderHelper.loaderStatus(true);
      if (antiPhishingRemoveVerifyMethod === 'passkey') {
        const passkeyResult = await attemptAntiPhishingPasskeyVerify();
        if (!passkeyResult?.userId) {
          // Passkey failed - show alternate verification options
          closeModal('antiPhishingRemoveModal');
          setTimeout(() => openModal('antiPhishingRemoveVerifyOptionsModal'), 100);
          return;
        }
        const result = await AuthService.antiPhishingRemove({
          verifyMethod: 'passkey',
          passkeyUserId: passkeyResult.userId
        });
        if (result?.success) {
          alertSuccessMessage(result?.message || 'Anti-phishing code removed successfully');
          setHasAntiPhishingCode(false);
          setAntiPhishingRemoveOtp('');
          closeModal('antiPhishingRemoveModal');
          fetchAntiPhishingStatus();
        } else {
          alertErrorMessage(result?.message || 'Failed to remove anti-phishing code');
        }
      } else {
        const verifyCode = antiPhishingRemoveOtp?.trim() || '';
        if (!verifyCode || verifyCode.length !== 6) {
          alertErrorMessage(antiPhishingRemoveVerifyMethod === 'totp' ? 'Please enter a valid 6-digit code' : 'Please enter the 6-digit OTP');
          return;
        }
        const result = await AuthService.antiPhishingRemove({
          verifyMethod: antiPhishingRemoveVerifyMethod,
          code: verifyCode
        });
        if (result?.success) {
          alertSuccessMessage(result?.message || 'Anti-phishing code removed successfully');
          setHasAntiPhishingCode(false);
          setAntiPhishingRemoveOtp('');
          closeModal('antiPhishingRemoveModal');
          fetchAntiPhishingStatus();
        } else {
          alertErrorMessage(result?.message || 'Failed to remove anti-phishing code');
        }
      }
    } catch (error) {
      alertErrorMessage(error?.response?.data?.message || error?.message || 'Something went wrong');
    } finally {
      setIsSubmitting(false);
      LoaderHelper.loaderStatus(false);
    }
  }, [antiPhishingRemoveVerifyMethod, antiPhishingRemoveOtp, attemptAntiPhishingPasskeyVerify, closeModal, openModal, fetchAntiPhishingStatus]);

  const handleAntiPhishingRemoveOpenVerifyOptions = useCallback(() => {
    closeModal('antiPhishingRemoveModal');
    setTimeout(() => openModal('antiPhishingRemoveVerifyOptionsModal'), 100);
  }, [closeModal, openModal]);

  const handleAntiPhishingRemoveSelectVerifyMethod = useCallback((method) => {
    setAntiPhishingRemoveVerifyMethod(method.value);
    setAntiPhishingRemoveOtp('');
    setAntiPhishingRemoveTimer(0);
    closeModal('antiPhishingRemoveVerifyOptionsModal');
    setTimeout(() => openModal('antiPhishingRemoveModal'), 100);
  }, [closeModal, openModal]);

  const handleAntiPhishingRemoveCloseVerifyOptions = useCallback(() => {
    closeModal('antiPhishingRemoveVerifyOptionsModal');
    setTimeout(() => openModal('antiPhishingRemoveModal'), 100);
  }, [closeModal, openModal]);

  const getAntiPhishingSetCodeModalTitle = useCallback(() => {
    return hasAntiPhishingCode ? 'Update the Code' : 'Set the Code';
  }, [hasAntiPhishingCode]);

  const getAntiPhishingVerifyDescription = useCallback(() => {
    const details = userDetails || props?.userDetails;
    if (antiPhishingVerifyMethod === 'passkey') return 'Use passkey to verify your identity';
    if (antiPhishingVerifyMethod === 'totp') return 'Enter the 6-digit code from your authenticator app';
    if (antiPhishingVerifyMethod === 'email') return `We'll send a verification code to ${maskEmail(details?.emailId)}`;
    if (antiPhishingVerifyMethod === 'mobile') return `We'll send a verification code to ****${String(details?.mobileNumber || '').slice(-4)}`;
    return '';
  }, [antiPhishingVerifyMethod, userDetails, props?.userDetails, maskEmail]);

  const getAntiPhishingRemoveVerifyDescription = useCallback(() => {
    const details = userDetails || props?.userDetails;
    if (antiPhishingRemoveVerifyMethod === 'passkey') return 'Use passkey to verify your identity';
    if (antiPhishingRemoveVerifyMethod === 'totp') return 'Enter the 6-digit code from your authenticator app';
    if (antiPhishingRemoveVerifyMethod === 'email') return `We'll send a verification code to ${maskEmail(details?.emailId)}`;
    if (antiPhishingRemoveVerifyMethod === 'mobile') return `We'll send a verification code to ****${String(details?.mobileNumber || '').slice(-4)}`;
    return '';
  }, [antiPhishingRemoveVerifyMethod, userDetails, props?.userDetails, maskEmail]);

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

  useEffect(() => {
    if (antiPhishingTimer <= 0) return;
    const interval = setInterval(() => setAntiPhishingTimer((prev) => prev - 1), 1000);
    return () => clearInterval(interval);
  }, [antiPhishingTimer]);

  useEffect(() => {
    if (antiPhishingRemoveTimer <= 0) return;
    const interval = setInterval(() => setAntiPhishingRemoveTimer((prev) => prev - 1), 1000);
    return () => clearInterval(interval);
  }, [antiPhishingRemoveTimer]);

 
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

            <div className="factor_bl active">
              <div className="lftcnt">
                <h6><i className="ri-shield-check-line anti-phishing-icon-spaced"></i>Anti-phishing Code</h6>
                <p>Set a unique 5-8 digit code that will appear in legitimate emails and notifications. This helps you identify real communications from phishing attempts.</p>
              </div>
              {hasAntiPhishingCode ? (
                <>

                  <button className="btn anti-phishing-remove-btn" disabled={isSubmitting} onClick={handleAntiPhishingRemoveOpen}>
                    <i className="ri-delete-bin-line anti-phishing-icon-tight"></i>Remove
                  </button>
                </>
              ) : (
                <button className="btn" disabled={isSubmitting} onClick={handleAntiPhishingInfoOpen}>
                  <i className="ri-add-line anti-phishing-icon-tight"></i>Set Code
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Anti-phishing Info Modal (How it works) */}
        <div className="modal fade search_form" id="antiPhishingInfoModal" tabIndex="-1" aria-hidden="true" data-bs-backdrop="static">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="ri-shield-check-line anti-phishing-icon-spaced"></i>
                  Anti-Phishing Code
                </h5>
                <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
              </div>
              <div className="modal-body">
                <form className="profile_form" onSubmit={(e) => e.preventDefault()}>
                <div className="anti-phishing-info-content">
                  <section className="anti-phishing-section">
                    <h6 className="anti-phishing-heading"><i className="ri-information-line anti-phishing-icon-spaced"></i>What is an anti-phishing code?</h6>
                    <p className="anti-phishing-paragraph">
                      An anti-phishing code is a personalised identifier that enhances your account security. Once successfully set, you will see this code in all official emails sent to you by our exchange. It helps you verify whether an email is genuine and protects you from scams.
                    </p>
                  </section>
                  <section className="anti-phishing-section">
                    <h6 className="anti-phishing-heading"><i className="ri-mail-check-line anti-phishing-icon-spaced"></i>How to Identify Phishing Emails Effectively?</h6>
                    <p className="anti-phishing-paragraph">
                      You can create a custom anti-phishing code unique to you. This code will appear in all emails sent to you by our exchange. If you receive an email without your anti-phishing code, or the displayed code is different from the one you set, be cautious, as the email may be a phishing attempt impersonating our exchange.
                    </p>
                  </section>
                  <section className="anti-phishing-section anti-phishing-section-last">
                    <h6 className="anti-phishing-heading"><i className="ri-alert-line anti-phishing-icon-spaced"></i>Reminder:</h6>
                    <p className="anti-phishing-paragraph">
                      After successfully setting your code, all official emails sent to your secure email address by our exchange will include this security identifier. Always compare the anti-phishing code in the email with the one you set to verify its authenticity. The anti-phishing code is a personal security identifier. Keep it safe and never share it with anyone, including our exchange staff.
                    </p>
                  </section>
                </div>
                <button className="submit" type="button" onClick={handleAntiPhishingSetCodeOpen}>
                  <i className="ri-arrow-right-line anti-phishing-icon-tight"></i>Get Started
                </button>
                </form>
              </div>
            </div>
          </div>
        </div>

        {/* Anti-phishing Set Code Modal */}
        <div className="modal fade search_form" id="antiPhishingSetCodeModal" tabIndex="-1" aria-hidden="true" data-bs-backdrop="static">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title"><i className="ri-shield-keyhole-line anti-phishing-icon-spaced"></i>{getAntiPhishingSetCodeModalTitle()}</h5>
                <p>{getAntiPhishingVerifyDescription()}</p>
                <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
              </div>
              <div className="modal-body">
                <div className="anti-phishing-info-content anti-phishing-info-block">
                  <section className="anti-phishing-warning-section">
                    <div className="anti-phishing-warning-box">
                      <p className="anti-phishing-warning-text">
                        <i className="ri-error-warning-line anti-phishing-warning-icon"></i>
                        Please do not reveal your password or Google/SMS verification code to anyone, including our exchange Customer Service.
                      </p>
                    </div>
                  </section>
                  <section className="anti-phishing-section anti-phishing-section-no-margin">
                    <h6 className="anti-phishing-heading anti-phishing-heading-tight"><i className="ri-lock-line anti-phishing-icon-spaced"></i>Enable Anti-Phishing Code</h6>
                    <p className="anti-phishing-paragraph">
                      Please enter 5 to 8 digits. Do not use commonly used passwords.
                    </p>
                  </section>
                </div>
                <form className="profile_form" onSubmit={(e) => e.preventDefault()}>
                  <div className="emailinput">
                    <label>Anti-phishing Code (5-8 digits)</label>
                    <input
                      type="text"
                      placeholder="Enter your code"
                      value={antiPhishingCode}
                      onChange={(e) => setAntiPhishingCode(e.target.value.replace(/\D/g, '').slice(0, 8))}
                      maxLength={8}
                    />
                  </div>
                  {antiPhishingVerifyMethod !== 'passkey' && (
                    <>
                     
                      <div className="emailinput">
                        <label>Verification Code</label>
                        <div className="d-flex">
                          <input
                            type="text"
                            placeholder="Enter 6-digit code"
                            value={antiPhishingOtp}
                            onChange={(e) => setAntiPhishingOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            maxLength={6}
                          />
                          {antiPhishingVerifyMethod !== 'totp' && (
                            antiPhishingTimer > 0 ? (
                              <div className="resend otp-button-disabled">Resend ({antiPhishingTimer}s)</div>
                            ) : (
                              <button type="button" className="getotp otp-button-enabled getotp_mobile" onClick={handleAntiPhishingSendOtp} disabled={isSubmitting}>
                                GET OTP
                              </button>
                            )
                          )}
                        </div>
                      </div>
                      <div>
                       <p className="small anti-phishing-muted-text">{getAntiPhishingVerifyDescription()}</p>
                      {antiPhishingAvailableMethods.length > 1 && (
                        <div className="cursor-pointer" onClick={handleAntiPhishingOpenVerifyOptions} >
                          <small className="text-white">Switch to Another Verification Option <i className="ri-external-link-line"></i></small>
                        </div>
                        
                      )}
                      </div>
                    </>
                  )}
                  <button
                    className="submit"
                    type="button"
                    disabled={isSubmitting || antiPhishingCode.replace(/\D/g, '').length < 5 || (antiPhishingVerifyMethod !== 'passkey' && (!antiPhishingOtp || antiPhishingOtp.length !== 6))}
                    onClick={handleAntiPhishingVerifyAndSave}
                  >
                    <i className="ri-check-line anti-phishing-icon-tight"></i>{isSubmitting ? 'Submitting...' : 'Submit'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>

        {/* Anti-phishing Verification Options Modal */}
        <div className="modal fade search_form" id="antiPhishingVerifyOptionsModal" tabIndex="-1" aria-hidden="true" data-bs-backdrop="static">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title"><i className="ri-fingerprint-2-line anti-phishing-icon-spaced"></i>Select a Verification Option</h5>
                <p>Choose how you want to verify your identity</p>
                <button type="button" className="btn-close" onClick={handleAntiPhishingCloseVerifyOptions} aria-label="Close"></button>
              </div>
              <div className="modal-body">
                <form className="profile_form" onSubmit={(e) => e.preventDefault()}>
                  {antiPhishingAvailableMethods.map((method) => (
                    <div key={method.value}>
                      <div
                        className="d-flex align-items-center justify-content-between text-white"
                        onClick={() => handleAntiPhishingSelectVerifyMethod(method)}
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

        {/* Anti-phishing Remove Modal */}
        <div className="modal fade search_form" id="antiPhishingRemoveModal" tabIndex="-1" aria-hidden="true" data-bs-backdrop="static">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title"><i className="ri-shield-cross-line anti-phishing-icon-spaced"></i>Remove Anti-phishing Code</h5>
                <p>Verify your identity to remove the anti-phishing code</p>
                <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
              </div>
              <div className="modal-body">
                <div className="anti-phishing-info-content anti-phishing-info-block">
                  <section className="anti-phishing-warning-section">
                    <h6 className="anti-phishing-heading anti-phishing-heading-tight"><i className="ri-information-line anti-phishing-icon-spaced"></i>What happens when you remove?</h6>
                    <p className="anti-phishing-paragraph">
                      Once removed, your anti-phishing code will no longer appear in official emails sent to you by our exchange. You will lose this additional layer of protection that helps you verify authentic communications and identify phishing attempts.
                    </p>
                  </section>
                  <section className="anti-phishing-section anti-phishing-section-no-margin">
                    <h6 className="anti-phishing-heading anti-phishing-heading-tight"><i className="ri-alert-line anti-phishing-icon-spaced"></i>Reminder:</h6>
                    <p className="anti-phishing-paragraph">
                      You can set a new anti-phishing code anytime from Security Settings. We recommend keeping this feature enabled to protect your account from phishing scams.
                    </p>
                  </section>
                </div>
                <form className="profile_form" onSubmit={(e) => e.preventDefault()}>
                  {antiPhishingRemoveVerifyMethod !== 'passkey' && (
                    <>
                      <p className="small anti-phishing-muted-text anti-phishing-remove-desc">{getAntiPhishingRemoveVerifyDescription()}</p>
                      <div className="emailinput">
                        <label>Verification Code</label>
                        <div className="d-flex">
                          <input
                            type="text"
                            placeholder="Enter 6-digit code"
                            value={antiPhishingRemoveOtp}
                            onChange={(e) => setAntiPhishingRemoveOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            maxLength={6}
                          />
                          {antiPhishingRemoveVerifyMethod !== 'totp' && (
                            antiPhishingRemoveTimer > 0 ? (
                              <div className="resend otp-button-disabled">Resend ({antiPhishingRemoveTimer}s)</div>
                            ) : (
                              <button type="button" className="getotp otp-button-enabled getotp_mobile" onClick={handleAntiPhishingRemoveSendOtp} disabled={isSubmitting}>
                                GET OTP
                              </button>
                            )
                          )}
                        </div>
                      </div>
                      {antiPhishingRemoveAvailableMethods.length > 1 && (
                        <div className="cursor-pointer anti-phishing-switch-option" onClick={handleAntiPhishingRemoveOpenVerifyOptions}>
                          <small className="text-white">Switch to Another Verification Option <i className="ri-external-link-line"></i></small>
                        </div>
                      )}
                    </>
                  )}
                  <button
                    className="submit anti-phishing-danger-submit"
                    type="button"
                    disabled={isSubmitting || (antiPhishingRemoveVerifyMethod !== 'passkey' && (!antiPhishingRemoveOtp || antiPhishingRemoveOtp.length !== 6))}
                    onClick={handleAntiPhishingRemove}
                  >
                    <i className="ri-delete-bin-line anti-phishing-icon-tight"></i>{isSubmitting ? 'Removing...' : 'Remove'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>

        {/* Anti-phishing Remove Verification Options Modal */}
        <div className="modal fade search_form" id="antiPhishingRemoveVerifyOptionsModal" tabIndex="-1" aria-hidden="true" data-bs-backdrop="static">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title"><i className="ri-fingerprint-2-line anti-phishing-icon-spaced"></i>Select a Verification Option</h5>
                <p>Choose how you want to verify your identity</p>
                <button type="button" className="btn-close" onClick={handleAntiPhishingRemoveCloseVerifyOptions} aria-label="Close"></button>
              </div>
              <div className="modal-body">
                <form className="profile_form" onSubmit={(e) => e.preventDefault()}>
                  {antiPhishingRemoveAvailableMethods.map((method) => (
                    <div key={method.value}>
                      <div
                        className="d-flex align-items-center justify-content-between text-white"
                        onClick={() => handleAntiPhishingRemoveSelectVerifyMethod(method)}
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