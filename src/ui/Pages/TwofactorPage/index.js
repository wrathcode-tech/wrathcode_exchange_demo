import React, { useState, useEffect, useContext } from "react";
import { alertErrorMessage, alertSuccessMessage } from "../../../customComponents/CustomAlertMessage";
import AuthService from "../../../api/services/AuthService";
import LoaderHelper from "../../../customComponents/Loading/LoaderHelper";
import { ProfileContext } from "../../../context/ProfileProvider";
import Select from "react-select";
import { countriesList, customStyles } from "../../../utils/CountriesList";
import { isValidPhoneNumber } from "libphonenumber-js";
import { startRegistration, startAuthentication } from "@simplewebauthn/browser";



const TwofactorPage = (props) => {
  const { handleUserDetails } = useContext(ProfileContext);

  // User data states
  const [mobileNumber, setMobileNumber] = useState("");
  const [emailID, setEmailId] = useState("");

  // Security methods status
  const [hasEmail, setHasEmail] = useState(false);
  const [hasMobile, setHasMobile] = useState(false);
  const [hasGoogleAuth, setHasGoogleAuth] = useState(false);
  const [hasPasskey, setHasPasskey] = useState(false);

  // Passkey states
  const [passkeys, setPasskeys] = useState([]);
  const [passkeyName, setPasskeyName] = useState("");
  const [selectedPasskey, setSelectedPasskey] = useState(null);
  const [deletePasskeyMethod, setDeletePasskeyMethod] = useState('totp'); // passkey, totp, email, mobile
  const [deletePasskeyCode, setDeletePasskeyCode] = useState("");
  const [deletePasskeyAvailableMethods, setDeletePasskeyAvailableMethods] = useState([]);
  const [passkeySupported, setPasskeySupported] = useState(false);
  const [isPasskeyVerifying, setIsPasskeyVerifying] = useState(false);

  // Google Auth setup states
  const [googleQr, setGoogleQr] = useState("");
  const [googleCode, setGoogleCode] = useState("");
  const [authenticatorCode, setAuthenticatorCode] = useState("");

  // OTP states
  const [emailOtpCode, setEmailOtpCode] = useState("");
  const [mobileOtpCode, setMobileOtpCode] = useState("");
  const [newEmailOtpCode, setNewEmailOtpCode] = useState("");
  const [newMobileOtpCode, setNewMobileOtpCode] = useState("");
  const [googleAuthCode, setGoogleAuthCode] = useState("");

  // New values for change/add flows
  const [newEmail, setNewEmail] = useState("");
  const [newMobileNumber, setNewMobileNumber] = useState("");
  const [newCountryCode, setNewCountryCode] = useState("+91");

  // Add Email flow step tracking
  const [addEmailStep, setAddEmailStep] = useState(1);

  // Disable Google Auth flow states
  const [disableAuthMethod, setDisableAuthMethod] = useState(2); // 1=email, 2=google auth, 3=mobile, 4=passkey
  const [disableAvailableMethods, setDisableAvailableMethods] = useState([]);

  // Change Email/Mobile verification method states
  const [changeVerifyMethod, setChangeVerifyMethod] = useState('email'); // passkey, totp, email, mobile
  const [changeAvailableMethods, setChangeAvailableMethods] = useState([]);

  // Add Mobile verification method states (single verification, user chooses one)
  const [addMobileVerifyMethod, setAddMobileVerifyMethod] = useState('email'); // passkey, totp, email
  const [addMobileAvailableMethods, setAddMobileAvailableMethods] = useState([]);
  const [passkeyVerificationResult, setPasskeyVerificationResult] = useState(null);

  // Timer and loading states
  const [resendTimer, setResendTimer] = useState(0);
  const [resendTimer2, setResendTimer2] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Flow step tracking
  const [currentStep, setCurrentStep] = useState(1);

  // Security reminder state
  const [showSecurityReminder, setShowSecurityReminder] = useState(false);

  // Consent warning states - to show security warnings before sensitive actions
  // eslint-disable-next-line no-unused-vars
  const [pendingAction, setPendingAction] = useState(null); // 'changeEmail', 'changeMobile', 'disablePasskey', 'disableGoogleAuth'

  // Add Passkey verification flow states
  const [addPasskeyVerifyMethod, setAddPasskeyVerifyMethod] = useState('email'); // email, mobile, totp
  const [addPasskeyAvailableMethods, setAddPasskeyAvailableMethods] = useState([]);
  const [addPasskeyOtpCode, setAddPasskeyOtpCode] = useState("");
  // eslint-disable-next-line no-unused-vars
  const [addPasskeyStep, setAddPasskeyStep] = useState(1); // 1=verify identity, 2=name passkey & register

  // Fetch security status from API
  const fetchSecurityStatus = async () => {
    try {
      const result = await AuthService.getSecurityStatus();
      if (result?.success && result?.data) {
        // Show security prompt if API says to show it
        if (result.data.showSecurityPrompt) {
          setShowSecurityReminder(true);
        }
      }
    } catch (error) {
      // Security status fetch error - silent fail
    }
  };

  // Check if WebAuthn/Passkey is supported AND platform authenticator is available
  const checkPasskeySupport = async () => {
    // First check if WebAuthn API exists
    if (window.PublicKeyCredential === undefined || typeof window.PublicKeyCredential !== 'function') {
      setPasskeySupported(false);
      return false;
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
          // The actual registration/authentication will fail gracefully if not available
          console.log('iOS 16+ detected, enabling passkey support');
          setPasskeySupported(true);
          return true;
        }
      }
      
      setPasskeySupported(available);
      return available;
    } catch (error) {
      // If check fails on iOS Safari, still allow trying passkeys
      if (isIOS && isSafari) {
        console.log('Passkey check failed on iOS Safari, allowing anyway');
        setPasskeySupported(true);
        return true;
      }
      setPasskeySupported(false);
      return false;
    }
  };

  // Fetch user's passkeys
  const fetchPasskeys = async () => {
    try {
      const result = await AuthService.passkeyGetList();
      if (result?.success && result?.data) {
        setPasskeys(result.data.passkeys || []);
        setHasPasskey(result.data.count > 0);
      }
    } catch (error) {
      // Passkey fetch error - silent fail
    }
  };

  // Dismiss security prompt
  const handleDismissSecurityPrompt = async () => {
    try {
      setShowSecurityReminder(false);
      const modalElement = document.getElementById('securityReminderModal');
      if (modalElement) {
        const modal = window.bootstrap?.Modal?.getInstance(modalElement);
        if (modal) modal.hide();
      }
    } catch (error) {
      // Dismiss prompt error - silent fail
    }
  };

  // Initialize user data
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });

    const user = props?.userDetails;
    const current2fa = user?.['2fa'] || 0;

    setEmailId(user?.emailId || '');
    setMobileNumber(`${user?.country_code || ''} ${user?.mobileNumber || ''}`);

    // Determine which methods are active
    const userHasEmail = !!user?.emailId;
    const userHasMobile = !!user?.mobileNumber;
    const userHasGoogleAuth = current2fa === 2;

    setHasEmail(userHasEmail);
    setHasMobile(userHasMobile);
    setHasGoogleAuth(userHasGoogleAuth);

    // Fetch security status from API
    fetchSecurityStatus();

    // Check passkey support and fetch existing passkeys
    checkPasskeySupport();
    fetchPasskeys();
  }, [props]);

  // Resend timer countdown
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  useEffect(() => {
    if (resendTimer2 > 0) {
      const timer = setTimeout(() => setResendTimer2(resendTimer2 - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer2]);

  // Count active security methods
  const getActiveMethodsCount = () => {
    let count = 0;
    if (hasEmail) count++;
    if (hasMobile) count++;
    if (hasGoogleAuth) count++;
    if (hasPasskey) count++;
    return count;
  };

  // Get security level based on active methods
  const getSecurityLevel = () => {
    const count = getActiveMethodsCount();
    if (count >= 3) return { level: 'High', color: '#28a745' };
    if (count === 2) return { level: 'Medium', color: '#ffc107' };
    return { level: 'Low', color: '#dc3545' };
  };

  // Check if user can make sensitive changes (needs at least 2 methods)
  const canMakeSensitiveChanges = () => {
    return getActiveMethodsCount() >= 2;
  };

  // Mask email for display
  const maskEmail = (email) => {
    if (!email) return '';
    const [username, domain] = email.split('@');
    if (!domain) return email;
    const masked = username.substring(0, 2) + '***' + username.slice(-1);
    return `${masked}@${domain}`;
  };

  // Mask phone for display
  const maskPhone = (phone) => {
    if (!phone) return '';
    const cleaned = phone.replace(/\s/g, '');
    if (cleaned.length < 4) return phone;
    return '****' + cleaned.slice(-4);
  };

  // Reset all modal states
  const resetModalStates = () => {
    setEmailOtpCode("");
    setMobileOtpCode("");
    setNewEmailOtpCode("");
    setNewMobileOtpCode("");
    setGoogleAuthCode("");
    setNewEmail("");
    setNewMobileNumber("");
    setNewCountryCode("+91");
    setAuthenticatorCode("");
    setGoogleQr("");
    setGoogleCode("");
    setCurrentStep(1);
    setResendTimer(0);
    setResendTimer2(0);
    // Passkey states
    setPasskeyName("");
    setSelectedPasskey(null);
    setDeletePasskeyCode("");
  };

  // Close all modals
  const closeAllModals = () => {
    const modalIds = [
      'googleAuthSetupModal', 'googleAuthQrModal', 'googleAuthVerifyModal',
      'addMobileModal', 'verifyNewMobileModal', 'addEmailModal',
      'changeEmailModal', 'changeEmailStep2Modal', 'changeEmailStep3Modal',
      'changeMobileModal', 'changeMobileStep2Modal', 'changeMobileStep3Modal',
      'blockingModal', 'disableGoogleAuthModal', 'disableAuthOptionsModal',
      'securityReminderModal', 'addPasskeyModal', 'addPasskeyVerifyModal', 'addPasskeyVerifyOptionsModal',
      'deletePasskeyModal', 'deletePasskeyOptionsModal',
      'changeVerifyOptionsModal', 'changeMobileVerifyOptionsModal', 'addMobileVerifyOptionsModal',
      'changeEmailConsentModal', 'changeMobileConsentModal', 'disablePasskeyConsentModal', 'disableGoogleAuthConsentModal',
      'viewPasskeysModal'
    ];
    modalIds.forEach(id => {
      const modalElement = document.getElementById(id);
      if (modalElement) {
        const modal = window.bootstrap?.Modal?.getInstance(modalElement);
        if (modal) modal.hide();
      }
    });
    document.body.classList.remove('modal-open');
    document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());
    resetModalStates();
  };

  // Close a specific modal
  const closeModal = (modalId) => {
    const modalElement = document.getElementById(modalId);
    if (modalElement) {
      const modal = window.bootstrap?.Modal?.getInstance(modalElement);
      if (modal) modal.hide();
    }
  };

  // Open a modal
  const openModal = (modalId) => {
    const modalElement = document.getElementById(modalId);
    if (modalElement) {
      const modal = new window.bootstrap.Modal(modalElement);
      modal.show();
    }
  };

  // Show security reminder modal when security is low
  useEffect(() => {
    if (showSecurityReminder) {
      const timer = setTimeout(() => {
        openModal('securityReminderModal');
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [showSecurityReminder]);

  // Close a specific modal and open another
  const switchModal = (closeId, openId, delay = 300) => {
    const closeModal = window.bootstrap?.Modal?.getInstance(document.getElementById(closeId));
    if (closeModal) closeModal.hide();
    setTimeout(() => openModal(openId), delay);
  };

  // Go back to previous step in multi-step flows
  const handleGoBack = (flowType) => {
    if (flowType === 'addMobile') {
      if (currentStep > 1) {
        setCurrentStep(currentStep - 1);
      }
    } else if (flowType === 'changeEmail') {
      if (currentStep > 1) {
        setCurrentStep(currentStep - 1);
      }
    } else if (flowType === 'changeMobile') {
      if (currentStep > 1) {
        setCurrentStep(currentStep - 1);
      }
    } else if (flowType === 'addEmail') {
      if (addEmailStep > 1) {
        // For addEmail, if going back from step 2 and no Google Auth, go back to step 1 or close
        if (addEmailStep === 2 && !hasGoogleAuth) {
          closeAllModals();
        } else {
          setAddEmailStep(addEmailStep - 1);
        }
      }
    } else if (flowType === 'googleAuthQr') {
      // Go back from QR to verification
      switchModal('googleAuthQrModal', 'googleAuthSetupModal');
    } else if (flowType === 'googleAuthVerify') {
      // Go back from verify to QR
      switchModal('googleAuthVerifyModal', 'googleAuthQrModal');
    }
  };

  // ============ API CALLS ============

  // Send OTP using security endpoint
  const handleSendOtp = async (target, purpose, value = null) => {
    try {
      setIsLoading(true);
      LoaderHelper.loaderStatus(true);
      const result = await AuthService.securitySendOtp(target, purpose, value);
      if (result?.success) {
        alertSuccessMessage(result?.message || 'OTP sent successfully');
        return true;
      } else {
        alertErrorMessage(result?.message || 'Failed to send OTP');
        return false;
      }
    } catch (error) {
      alertErrorMessage(error?.message || 'Something went wrong');
      return false;
    } finally {
      setIsLoading(false);
      LoaderHelper.loaderStatus(false);
    }
  };

  // Verify OTP using security endpoint
  const handleVerifyOtp = async (target, otp, purpose, identifier = null) => {
    try {
      setIsLoading(true);
      LoaderHelper.loaderStatus(true);
      const result = await AuthService.securityVerifyOtp(target, otp, purpose, identifier);
      if (result?.success) {
        return true;
      } else {
        alertErrorMessage(result?.message || 'Invalid OTP');
        return false;
      }
    } catch (error) {
      alertErrorMessage(error?.message || 'OTP verification failed');
      return false;
    } finally {
      setIsLoading(false);
      LoaderHelper.loaderStatus(false);
    }
  };

  // Verify using passkey (WebAuthn) - returns verification token
  const handlePasskeyVerification = async (purpose = 'security_action') => {
    if (!passkeySupported) {
      alertErrorMessage('Passkeys are not supported on this device/browser');
      return null;
    }

    try {
      setIsPasskeyVerifying(true);
      LoaderHelper.loaderStatus(true);

      // Step 1: Get authentication options from server
      const optionsResult = await AuthService.passkeyGetAuthOptions(emailID);
      if (!optionsResult?.success || !optionsResult?.data) {
        alertErrorMessage(optionsResult?.message || 'Failed to get passkey options');
        return null;
      }

      const authOptions = optionsResult.data;

      // Step 2: Authenticate using browser's WebAuthn API
      let credential;
      try {
        credential = await startAuthentication(authOptions);
      } catch (webauthnError) {
        // WebAuthn authentication error - show user-friendly message
        if (webauthnError.name === 'NotAllowedError') {
          alertErrorMessage('Authentication was cancelled or timed out. Please try again.');
        } else {
          alertErrorMessage('Failed to authenticate with passkey. Please try another method.');
        }
        return null;
      }

      // Step 3: Verify credential with server
      const verifyResult = await AuthService.passkeyVerifyAuth(emailID, credential);

      if (verifyResult?.success) {
        alertSuccessMessage('Passkey verified successfully');
        return verifyResult.data; // Contains userId and verified flag
      } else {
        alertErrorMessage(verifyResult?.message || 'Passkey verification failed');
        return null;
      }
    } catch (error) {
      // Passkey verification error - show user-friendly message
      alertErrorMessage(error?.message || 'Something went wrong');
      return null;
    } finally {
      setIsPasskeyVerifying(false);
      LoaderHelper.loaderStatus(false);
    }
  };

  // Silent passkey verification - attempts passkey auth without showing error messages
  // Returns verification result if successful, null if failed (silently)
  const attemptSilentPasskeyVerification = async (purpose) => {
    if (!hasPasskey || !passkeySupported) return null;

    try {
      setIsPasskeyVerifying(true);
      LoaderHelper.loaderStatus(true);

      // Step 1: Get authentication options
      const optionsResult = await AuthService.passkeyGetAuthOptions(emailID || mobileNumber);
      if (!optionsResult?.success || !optionsResult?.data) {
        return null;
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
        return null; // Silently fail - webauthnError details intentionally not logged for production
      }

      // Step 3: Verify credential with server
      const verifyResult = await AuthService.passkeyVerifyAuth(emailID || mobileNumber, credential);

      if (verifyResult?.success) {
        alertSuccessMessage('Passkey verified successfully');
        return verifyResult.data; // Contains userId and verified flag
      }
      return null;
    } catch (error) {
      // Catch any other unexpected errors silently
      return null;
    } finally {
      setIsPasskeyVerifying(false);
      LoaderHelper.loaderStatus(false);
    }
  };

  // Get default verification method with passkey as first priority
  // eslint-disable-next-line no-unused-vars
  const getDefaultVerificationMethod = () => {
    if (hasPasskey && passkeySupported) return 'passkey';
    if (hasGoogleAuth) return 'totp';
    if (hasEmail) return 'email';
    if (hasMobile) return 'mobile';
    return 'email';
  };

  // Get available verification methods for selection
  // eslint-disable-next-line no-unused-vars
  const getAvailableVerificationMethods = () => {
    const methods = [];
    if (hasPasskey && passkeySupported) methods.push({ value: 'passkey', label: 'Passkey' });
    if (hasGoogleAuth) methods.push({ value: 'totp', label: 'Google Authenticator' });
    if (hasEmail) methods.push({ value: 'email', label: 'Email Verification' });
    if (hasMobile) methods.push({ value: 'mobile', label: 'Mobile Verification' });
    return methods;
  };

  // ============ GOOGLE AUTHENTICATOR FLOW ============
  // Step 1: Verify with passkey (auto) or email/mobile first
  const handleGoogleAuthStart = async () => {
    resetModalStates();
    setPasskeyVerificationResult(null);

    // If passkey is available, try silent verification first
    if (hasPasskey && passkeySupported) {
      const verificationResult = await attemptSilentPasskeyVerification('2fa_setup');
      if (verificationResult) {
        // Passkey verified successfully - go directly to QR code
        setPasskeyVerificationResult(verificationResult);
        try {
          setIsLoading(true);
          LoaderHelper.loaderStatus(true);
          const result = await AuthService.security2faSetup();

          if (result?.success) {
            setGoogleQr(result.data?.qr_code || '');
            setGoogleCode(result.data?.secret?.base32 || '');
            openModal('googleAuthQrModal');
          } else {
            alertErrorMessage(result?.message || "Failed to get QR code");
          }
        } catch (error) {
          alertErrorMessage(error?.message || "Something went wrong");
        } finally {
          setIsLoading(false);
          LoaderHelper.loaderStatus(false);
        }
        return;
      }
      // Passkey failed or cancelled - show fallback options
    }

    // Fallback: Just open the modal - user will click "Send OTP" button
    if (hasEmail || hasMobile) {
      openModal('googleAuthSetupModal');
    } else {
      alertErrorMessage('You need an email or mobile number to set up Google Authenticator');
    }
  };

  // Step 2: After email/mobile verification, show QR code
  const handleGoogleAuthVerifyAndSetup = async () => {
    const otpCode = hasEmail ? emailOtpCode : mobileOtpCode;
    const target = hasEmail ? 'email' : 'mobile';

    if (!otpCode || otpCode.length !== 6) {
      alertErrorMessage('Please enter a valid 6-digit OTP');
      return;
    }

    const verified = await handleVerifyOtp(target, otpCode, '2fa_setup');
    if (verified) {
      alertSuccessMessage('Verified! Generating QR code...');

      try {
        setIsLoading(true);
        LoaderHelper.loaderStatus(true);
        const result = await AuthService.security2faSetup();

        if (result?.success) {
          setGoogleQr(result.data?.qr_code || '');
          setGoogleCode(result.data?.secret?.base32 || '');
          switchModal('googleAuthSetupModal', 'googleAuthQrModal');
        } else {
          alertErrorMessage(result?.message || "Failed to get QR code");
        }
      } catch (error) {
        alertErrorMessage(error?.message || "Something went wrong");
      } finally {
        setIsLoading(false);
        LoaderHelper.loaderStatus(false);
      }
    }
  };

  // Step 3: Verify authenticator code
  const handleGoogleAuthConfirm = async () => {
    if (!authenticatorCode || authenticatorCode.length !== 6) {
      alertErrorMessage('Please enter a valid 6-digit code');
      return;
    }

    try {
      setIsLoading(true);
      LoaderHelper.loaderStatus(true);
      const result = await AuthService.security2faConfirm(authenticatorCode);

      if (result?.success) {
        alertSuccessMessage(result?.message || 'Google Authenticator enabled successfully!');
        closeAllModals();
        handleUserDetails();
      } else {
        alertErrorMessage(result?.message || 'Failed to enable 2FA');
      }
    } catch (error) {
      alertErrorMessage(error?.message || 'Something went wrong');
    } finally {
      setIsLoading(false);
      LoaderHelper.loaderStatus(false);
    }
  };

  // Start Disable Google Authenticator flow - show consent warning first
  const handleDisableGoogleAuthStart = () => {
    if (!canMakeSensitiveChanges()) {
      alertErrorMessage('You need at least 2 security methods to disable Google Authenticator');
      return;
    }
    setPendingAction('disableGoogleAuth');
    openModal('disableGoogleAuthConsentModal');
  };

  // Proceed with disabling Google Auth after user consent
  const handleDisableGoogleAuthProceed = async () => {
    closeModal('disableGoogleAuthConsentModal');
    resetModalStates();
    setPasskeyVerificationResult(null);

    // If passkey is available, try silent verification first
    if (hasPasskey && passkeySupported) {
      const verificationResult = await attemptSilentPasskeyVerification('disable_2fa');
      if (verificationResult) {
        // Passkey verified successfully - disable Google Auth directly
        try {
          setIsLoading(true);
          LoaderHelper.loaderStatus(true);

          const result = await AuthService.security2faDisable(
            null, // code
            null, // otpCode
            'passkey', // verifyMethod
            verificationResult.userId // passkeyUserId
          );

          if (result?.success) {
            alertSuccessMessage(result?.message || 'Google Authenticator disabled successfully');
            handleUserDetails();
          } else {
            alertErrorMessage(result?.message || 'Failed to disable Google Authenticator');
          }
        } catch (error) {
          alertErrorMessage(error?.message || 'Something went wrong');
        } finally {
          setIsLoading(false);
          LoaderHelper.loaderStatus(false);
        }
        return;
      }
      // Passkey failed or cancelled - show fallback options
    }

    // Build available methods (including passkey as manual option even if silent failed)
    const methods = [];

    // Add Passkey as option if available
    if (hasPasskey && passkeySupported) {
      methods.push({
        type: 4,
        label: 'Passkey',
        value: 'Passkey',
        icon: 'ri-fingerprint-line',
        description: 'Use Face ID, Touch ID, or Windows Hello'
      });
    }

    // Add Google Authenticator as option
    methods.push({
      type: 2,
      label: 'Google Authenticator',
      value: 'Google Authenticator',
      icon: 'ri-shield-keyhole-line',
      description: 'Use your Google Authenticator app'
    });

    // Add email if available
    if (hasEmail) {
      methods.push({
        type: 1,
        label: 'Email',
        value: maskEmail(emailID),
        icon: 'ri-mail-line',
        description: 'Receive verification code via email'
      });
    }

    // Add mobile if available
    if (hasMobile) {
      methods.push({
        type: 3,
        label: 'Mobile',
        value: maskPhone(mobileNumber),
        icon: 'ri-smartphone-line',
        description: 'Receive verification code via SMS'
      });
    }

    setDisableAvailableMethods(methods);
    // Set default method - Passkey first if available, otherwise Google Auth
    setDisableAuthMethod(hasPasskey && passkeySupported ? 4 : 2);
    setResendTimer(0);

    openModal('disableGoogleAuthModal');
  };

  // Open disable auth options popup
  const handleOpenDisableOptionsPopup = () => {
    const modal = window.bootstrap?.Modal?.getInstance(document.getElementById('disableGoogleAuthModal'));
    if (modal) modal.hide();
    setTimeout(() => {
      openModal('disableAuthOptionsModal');
    }, 100);
  };

  // Select verification method for disable flow
  const handleSelectDisableMethod = (method) => {
    setDisableAuthMethod(method.type);
    setEmailOtpCode('');
    setMobileOtpCode('');
    setGoogleAuthCode('');
    setResendTimer(0);

    // Close options popup
    const optionsModal = window.bootstrap?.Modal?.getInstance(document.getElementById('disableAuthOptionsModal'));
    if (optionsModal) optionsModal.hide();

    // Reopen main modal
    setTimeout(() => {
      openModal('disableGoogleAuthModal');
    }, 100);
  };

  // Close options popup and reopen main disable modal
  const handleCloseDisableOptionsPopup = () => {
    const optionsModal = window.bootstrap?.Modal?.getInstance(document.getElementById('disableAuthOptionsModal'));
    if (optionsModal) optionsModal.hide();
    setTimeout(() => {
      openModal('disableGoogleAuthModal');
    }, 100);
  };

  // Get verification title for disable flow
  const getDisableVerificationTitle = () => {
    if (disableAuthMethod === 4) return 'Passkey Verification';
    if (disableAuthMethod === 2) return 'Enter Google Authenticator Code';
    if (disableAuthMethod === 1) return 'Enter Email Verification Code';
    if (disableAuthMethod === 3) return 'Enter Mobile Verification Code';
    return 'Verify Your Identity';
  };

  // Get verification description for disable flow
  const getDisableVerificationDescription = () => {
    if (disableAuthMethod === 4) return 'Use your passkey to verify your identity';
    if (disableAuthMethod === 2) return 'Enter the 6-digit code from your authenticator app';
    if (disableAuthMethod === 1) return `We'll send a verification code to ${maskEmail(emailID)}`;
    if (disableAuthMethod === 3) return `We'll send a verification code to ${maskPhone(mobileNumber)}`;
    return '';
  };

  // Get the current OTP code for disable flow
  const getDisableOtpCode = () => {
    if (disableAuthMethod === 4) return ''; // Passkey doesn't use OTP code
    if (disableAuthMethod === 2) return googleAuthCode;
    if (disableAuthMethod === 1) return emailOtpCode;
    if (disableAuthMethod === 3) return mobileOtpCode;
    return '';
  };

  // Set the OTP code for disable flow
  const setDisableOtpCode = (value) => {
    if (disableAuthMethod === 2) setGoogleAuthCode(value);
    else if (disableAuthMethod === 1) setEmailOtpCode(value);
    else if (disableAuthMethod === 3) setMobileOtpCode(value);
  };

  // Send OTP for disable flow
  const sendDisableOtp = async () => {
    if (disableAuthMethod === 4) return true; // Passkey doesn't need OTP sending
    if (disableAuthMethod === 2) return true; // Google Auth doesn't need OTP sending

    const target = disableAuthMethod === 1 ? 'email' : 'mobile';
    const sent = await handleSendOtp(target, '2fa_disable');
    if (sent) {
      setResendTimer(60);
    }
    return sent;
  };

  // Handle disable Google Auth verification
  const handleDisableGoogleAuthVerify = async () => {
    // For passkey verification
    if (disableAuthMethod === 4) {
      const verificationResult = await handlePasskeyVerification('2fa_disable');
      if (!verificationResult) return;

      try {
        setIsLoading(true);
        LoaderHelper.loaderStatus(true);

        // Call backend to disable with passkey verification
        const result = await AuthService.security2faDisable(null, null, 'passkey', verificationResult.userId);

        if (result?.success) {
          alertSuccessMessage(result?.message || 'Google Authenticator disabled successfully');
          closeAllModals();
          handleUserDetails();
          setHasGoogleAuth(false);
        } else {
          alertErrorMessage(result?.message || 'Failed to disable Google Authenticator');
        }
      } catch (error) {
        alertErrorMessage(error?.message || 'Something went wrong');
      } finally {
        setIsLoading(false);
        LoaderHelper.loaderStatus(false);
      }
      return;
    }

    const otpCode = getDisableOtpCode();

    if (!otpCode || otpCode.length !== 6) {
      alertErrorMessage('Please enter a valid 6-digit code');
      return;
    }

    try {
      setIsLoading(true);
      LoaderHelper.loaderStatus(true);

      let result;
      if (disableAuthMethod === 2) {
        // Direct disable with Google Auth code
        result = await AuthService.security2faDisable(otpCode);
      } else {
        // For email/mobile - send OTP directly to backend for verification and disable
        const verifyMethod = disableAuthMethod === 1 ? 'email' : 'mobile';
        result = await AuthService.security2faDisable(null, otpCode, verifyMethod);
      }

      if (result?.success) {
        alertSuccessMessage(result?.message || "Google Authenticator disabled");
        closeAllModals();
        handleUserDetails();
      } else {
        alertErrorMessage(result?.message || "Failed to disable 2FA");
      }
    } catch (error) {
      alertErrorMessage(error?.message || "Something went wrong");
    } finally {
      setIsLoading(false);
      LoaderHelper.loaderStatus(false);
    }
  };

  // Copy Google Auth code
  const copyCode = () => {
    if (googleCode) {
      navigator.clipboard
        .writeText(googleCode)
        .then(() => alertSuccessMessage("Code copied to clipboard!"))
        .catch(() => alertErrorMessage("Failed to copy code"));
    }
  };

  // ============ PASSKEY FLOW ============

  // Start passkey registration - requires identity verification first
  const handleAddPasskeyStart = async () => {
    if (!passkeySupported) {
      alertErrorMessage('Passkeys are not supported on this device/browser');
      return;
    }
    resetModalStates();
    setAddPasskeyStep(1);
    setAddPasskeyOtpCode("");
    setResendTimer(0);

    // Pre-fill passkey name
    const projectName = process.env.REACT_APP_PROJECT_NAME || 'Exchange';
    const maskedIdentifier = emailID ? maskEmail(emailID) : (mobileNumber ? maskPhone(mobileNumber) : '');
    const defaultName = maskedIdentifier ? `${projectName} - ${maskedIdentifier}` : `${projectName} Passkey`;
    setPasskeyName(defaultName);

    // If user already has a passkey, try silent passkey verification first
    if (hasPasskey) {
      const verificationResult = await attemptSilentPasskeyVerification('add_passkey');
      if (verificationResult) {
        // Passkey verified successfully - proceed directly to naming
        setAddPasskeyStep(2);
        openModal('addPasskeyModal');
        return;
      }
    }

    // Build available verification methods
    const methods = [];
    if (hasEmail) {
      methods.push({
        id: 'email',
        label: 'Email OTP',
        icon: 'ri-mail-line',
        description: `Send code to ${maskEmail(emailID)}`
      });
    }
    if (hasMobile) {
      methods.push({
        id: 'mobile',
        label: 'Mobile OTP',
        icon: 'ri-smartphone-line',
        description: `Send code to ${maskPhone(mobileNumber)}`
      });
    }
    if (hasGoogleAuth) {
      methods.push({
        id: 'totp',
        label: 'Google Authenticator',
        icon: 'ri-shield-keyhole-line',
        description: 'Use your authenticator app'
      });
    }

    setAddPasskeyAvailableMethods(methods);

    // Set default method based on availability
    if (hasGoogleAuth) {
      setAddPasskeyVerifyMethod('totp');
    } else if (hasEmail) {
      setAddPasskeyVerifyMethod('email');
    } else if (hasMobile) {
      setAddPasskeyVerifyMethod('mobile');
    }

    openModal('addPasskeyVerifyModal');
  };

  // Send OTP for add passkey verification
  const handleAddPasskeySendOtp = async () => {
    if (addPasskeyVerifyMethod === 'totp') return; // No OTP needed for Google Auth

    const target = addPasskeyVerifyMethod === 'email' ? 'email' : 'mobile';
    try {
      setIsLoading(true);
      const result = await AuthService.securitySendOtp(target, 'add_passkey');
      if (result?.success) {
        alertSuccessMessage(result?.message || `OTP sent to your ${target}`);
        setResendTimer(60);
      } else {
        alertErrorMessage(result?.message || 'Failed to send OTP');
      }
    } catch (error) {
      alertErrorMessage(error?.message || 'Failed to send OTP');
    } finally {
      setIsLoading(false);
    }
  };

  // Verify identity and proceed to passkey registration
  const handleAddPasskeyVerify = async () => {
    if (addPasskeyVerifyMethod === 'totp') {
      // Verify TOTP
      if (!addPasskeyOtpCode || addPasskeyOtpCode.length !== 6) {
        alertErrorMessage('Please enter a valid 6-digit code');
        return;
      }
      try {
        setIsLoading(true);
        LoaderHelper.loaderStatus(true);
        const result = await AuthService.securityVerifyTotp(String(addPasskeyOtpCode), 'add_passkey');
        if (result?.success) {
          alertSuccessMessage('Verified!');
          setAddPasskeyStep(2);
          switchModal('addPasskeyVerifyModal', 'addPasskeyModal');
        } else {
          alertErrorMessage(result?.message || 'Invalid code');
        }
      } catch (error) {
        alertErrorMessage(error?.message || 'Verification failed');
      } finally {
        setIsLoading(false);
        LoaderHelper.loaderStatus(false);
      }
    } else {
      // Verify Email or Mobile OTP
      if (!addPasskeyOtpCode || addPasskeyOtpCode.length !== 6) {
        alertErrorMessage('Please enter a valid 6-digit OTP');
        return;
      }
      const target = addPasskeyVerifyMethod === 'email' ? 'email' : 'mobile';
      const verified = await handleVerifyOtp(target, addPasskeyOtpCode, 'add_passkey');
      if (verified) {
        alertSuccessMessage('Verified!');
        setAddPasskeyStep(2);
        switchModal('addPasskeyVerifyModal', 'addPasskeyModal');
      }
    }
  };

  // Get add passkey verification title
  const getAddPasskeyVerificationTitle = () => {
    switch (addPasskeyVerifyMethod) {
      case 'email': return 'Email Verification';
      case 'mobile': return 'Mobile Verification';
      case 'totp': return 'Google Authenticator';
      default: return 'Verification';
    }
  };

  // Get add passkey verification description
  const getAddPasskeyVerificationDescription = () => {
    switch (addPasskeyVerifyMethod) {
      case 'email': return `Enter the 6-digit code sent to ${maskEmail(emailID)}`;
      case 'mobile': return `Enter the 6-digit code sent to ${maskPhone(mobileNumber)}`;
      case 'totp': return 'Enter the 6-digit code from your authenticator app';
      default: return 'Enter your verification code';
    }
  };

  // Register a new passkey
  const handleRegisterPasskey = async () => {
    if (!passkeyName.trim()) {
      alertErrorMessage('Please enter a name for your passkey');
      return;
    }

    try {
      setIsLoading(true);
      LoaderHelper.loaderStatus(true);

      // Step 1: Get registration options from server
      const optionsResult = await AuthService.passkeyGetRegistrationOptions();
      if (!optionsResult?.success || !optionsResult?.data) {
        alertErrorMessage(optionsResult?.message || 'Failed to get registration options');
        return;
      }

      const registrationOptions = optionsResult.data;

      // Step 2: Create credential using browser's WebAuthn API
      let credential;
      try {
        credential = await startRegistration(registrationOptions);
      } catch (webauthnError) {
        // WebAuthn registration error - show user-friendly message
        if (webauthnError.name === 'NotAllowedError') {
          alertErrorMessage('Registration was cancelled or timed out. Please try again.');
        } else if (webauthnError.name === 'InvalidStateError') {
          alertErrorMessage('This passkey is already registered on this device.');
        } else {
          alertErrorMessage('Failed to create passkey. Please try again.');
        }
        return;
      }

      // Step 3: Send credential to server for verification
      const verifyResult = await AuthService.passkeyVerifyRegistration(credential, passkeyName.trim());

      if (verifyResult?.success) {
        alertSuccessMessage(verifyResult?.message || 'Passkey added successfully!');
        closeAllModals();
        fetchPasskeys(); // Refresh passkey list
        handleUserDetails();
      } else {
        alertErrorMessage(verifyResult?.message || 'Failed to register passkey');
      }
    } catch (error) {
      // Passkey registration error - show user-friendly message
      alertErrorMessage(error?.message || 'Something went wrong');
    } finally {
      setIsLoading(false);
      LoaderHelper.loaderStatus(false);
    }
  };

  // Start passkey deletion flow - show consent warning first
  const handleDeletePasskeyStart = (passkey) => {
    setSelectedPasskey(passkey);
    setPendingAction('disablePasskey');
    openModal('disablePasskeyConsentModal');
  };

  // Proceed with deleting passkey after user consent
  const handleDeletePasskeyProceed = async () => {
    closeModal('disablePasskeyConsentModal');
    setDeletePasskeyCode('');
    setResendTimer(0);

    // Try silent passkey verification if passkey is available
    if (hasPasskey && passkeySupported) {
      const verificationResult = await attemptSilentPasskeyVerification('delete_passkey');
      if (verificationResult) {
        // Passkey verified successfully - delete directly
        try {
          setIsLoading(true);
          LoaderHelper.loaderStatus(true);

          const result = await AuthService.passkeyDelete(
            selectedPasskey._id,
            'passkey',
            null, // No OTP code needed
            verificationResult.userId
          );

          if (result?.success) {
            alertSuccessMessage(result?.message || 'Passkey deleted successfully');
            fetchPasskeys();
            handleUserDetails();
          } else {
            alertErrorMessage(result?.message || 'Failed to delete passkey');
          }
        } catch (error) {
          alertErrorMessage(error?.message || 'Something went wrong');
        } finally {
          setIsLoading(false);
          LoaderHelper.loaderStatus(false);
        }
        return;
      }
      // Passkey failed or cancelled - show fallback options
    }

    // Build available verification methods for deleting passkey
    const methods = [];
    // Add passkey as option if available (user can verify with any passkey including another one)
    if (hasPasskey && passkeySupported) {
      methods.push({ value: 'passkey', label: 'Passkey', icon: 'ri-fingerprint-line', description: 'Use passkey to verify' });
    }
    if (hasGoogleAuth) {
      methods.push({ value: 'totp', label: 'Google Authenticator', icon: 'ri-shield-keyhole-line', description: 'Use your authenticator app' });
    }
    if (hasEmail) {
      methods.push({ value: 'email', label: 'Email Verification', icon: 'ri-mail-line', description: `Send code to ${maskEmail(emailID)}` });
    }
    if (hasMobile) {
      methods.push({ value: 'mobile', label: 'Mobile Verification', icon: 'ri-smartphone-line', description: `Send code to ${maskPhone(mobileNumber)}` });
    }

    setDeletePasskeyAvailableMethods(methods);

    // Set default verification method - Passkey first, then Google Auth, then email, then mobile
    if (hasPasskey && passkeySupported) {
      setDeletePasskeyMethod('passkey');
    } else if (hasGoogleAuth) {
      setDeletePasskeyMethod('totp');
    } else if (hasEmail) {
      setDeletePasskeyMethod('email');
    } else if (hasMobile) {
      setDeletePasskeyMethod('mobile');
    }

    openModal('deletePasskeyModal');
  };

  // Delete a passkey
  const handleDeletePasskey = async () => {
    if (!selectedPasskey) {
      alertErrorMessage('No passkey selected');
      return;
    }

    // Handle passkey verification
    if (deletePasskeyMethod === 'passkey') {
      const verificationResult = await handlePasskeyVerification('delete_passkey');
      if (!verificationResult) return;

      try {
        setIsLoading(true);
        LoaderHelper.loaderStatus(true);

        const result = await AuthService.passkeyDelete(
          selectedPasskey._id,
          'passkey',
          null,
          verificationResult.userId
        );

        if (result?.success) {
          alertSuccessMessage(result?.message || 'Passkey deleted successfully');
          closeAllModals();
          fetchPasskeys();
          handleUserDetails();
        } else {
          alertErrorMessage(result?.message || 'Failed to delete passkey');
        }
      } catch (error) {
        alertErrorMessage(error?.message || 'Something went wrong');
      } finally {
        setIsLoading(false);
        LoaderHelper.loaderStatus(false);
      }
      return;
    }

    // Handle OTP-based verification
    if (!deletePasskeyCode || deletePasskeyCode.length !== 6) {
      alertErrorMessage('Please enter a valid 6-digit code');
      return;
    }

    try {
      setIsLoading(true);
      LoaderHelper.loaderStatus(true);

      const result = await AuthService.passkeyDelete(
        selectedPasskey._id,
        deletePasskeyMethod,
        deletePasskeyCode
      );

      if (result?.success) {
        alertSuccessMessage(result?.message || 'Passkey deleted successfully');
        closeAllModals();
        fetchPasskeys();
        handleUserDetails();
      } else {
        alertErrorMessage(result?.message || 'Failed to delete passkey');
      }
    } catch (error) {
      alertErrorMessage(error?.message || 'Something went wrong');
    } finally {
      setIsLoading(false);
      LoaderHelper.loaderStatus(false);
    }
  };

  // Rename a passkey (for future use - add rename button in UI)
  // eslint-disable-next-line no-unused-vars
  const handleRenamePasskey = async (passkeyId, newName) => {
    if (!newName.trim()) {
      alertErrorMessage('Please enter a valid name');
      return;
    }

    try {
      const result = await AuthService.passkeyRename(passkeyId, newName.trim());
      if (result?.success) {
        alertSuccessMessage('Passkey renamed successfully');
        fetchPasskeys();
      } else {
        alertErrorMessage(result?.message || 'Failed to rename passkey');
      }
    } catch (error) {
      alertErrorMessage(error?.message || 'Something went wrong');
    }
  };

  // Get verification method title for delete flow
  // eslint-disable-next-line no-unused-vars
  const getDeleteVerificationTitle = () => {
    switch (deletePasskeyMethod) {
      case 'passkey': return 'Passkey Verification';
      case 'totp': return 'Google Authenticator';
      case 'email': return 'Email Verification';
      case 'mobile': return 'Mobile Verification';
      default: return 'Verification';
    }
  };

  // Get verification description for delete passkey flow
  const getDeleteVerificationDescription = () => {
    switch (deletePasskeyMethod) {
      case 'passkey': return 'Use another passkey to verify your identity';
      case 'totp': return 'Enter the 6-digit code from your authenticator app';
      case 'email': return `We'll send a verification code to ${maskEmail(emailID)}`;
      case 'mobile': return `We'll send a verification code to ${maskPhone(mobileNumber)}`;
      default: return '';
    }
  };

  // Open delete passkey options popup
  const handleOpenDeletePasskeyOptions = () => {
    const modal = window.bootstrap?.Modal?.getInstance(document.getElementById('deletePasskeyModal'));
    if (modal) modal.hide();
    setTimeout(() => {
      openModal('deletePasskeyOptionsModal');
    }, 100);
  };

  // Select verification method for delete passkey flow
  const handleSelectDeletePasskeyMethod = (method) => {
    setDeletePasskeyMethod(method.value);
    setDeletePasskeyCode('');
    setResendTimer(0);

    // Close options popup
    const optionsModal = window.bootstrap?.Modal?.getInstance(document.getElementById('deletePasskeyOptionsModal'));
    if (optionsModal) optionsModal.hide();

    // Reopen main modal
    setTimeout(() => {
      openModal('deletePasskeyModal');
    }, 100);
  };

  // Close delete passkey options popup
  const handleCloseDeletePasskeyOptionsPopup = () => {
    const optionsModal = window.bootstrap?.Modal?.getInstance(document.getElementById('deletePasskeyOptionsModal'));
    if (optionsModal) optionsModal.hide();
    setTimeout(() => {
      openModal('deletePasskeyModal');
    }, 100);
  };

  // ============ ADD MOBILE FLOW ============
  // User chooses ONE verification method (like change email/mobile)
  const handleAddMobileStart = async () => {
    resetModalStates();
    setPasskeyVerificationResult(null);

    // Try passkey silent verification first (if available)
    if (hasPasskey && passkeySupported) {
      const verificationResult = await attemptSilentPasskeyVerification('add_mobile');
      if (verificationResult) {
        setPasskeyVerificationResult(verificationResult);
        setCurrentStep(2); // Skip to step 2: enter mobile (step 1 = verify, step 2 = mobile, step 3 = mobile OTP)
        openModal('addMobileModal');
        return;
      }
    }

    // Build available verification methods (Passkey, Google Auth, Email - no mobile since adding it)
    const methods = [];
    if (hasPasskey && passkeySupported) {
      methods.push({ value: 'passkey', label: 'Passkey', icon: 'ri-fingerprint-line', description: 'Use Face ID, Touch ID, or Windows Hello' });
    }
    if (hasGoogleAuth) {
      methods.push({ value: 'totp', label: 'Google Authenticator', icon: 'ri-shield-keyhole-line', description: 'Use your authenticator app' });
    }
    if (hasEmail) {
      methods.push({ value: 'email', label: 'Email Verification', icon: 'ri-mail-line', description: `Send code to ${maskEmail(emailID)}` });
    }

    if (methods.length === 0) {
      alertErrorMessage('You need at least one verification method (Email, Google Auth, or Passkey) to add a mobile number');
      return;
    }

    setAddMobileAvailableMethods(methods);
    setAddMobileVerifyMethod(methods[0].value);
    setCurrentStep(1); // Step 1: Verify identity (user chooses one method)
    openModal('addMobileModal');
  };

  // Step 1: Verify identity based on selected method (one only)
  const handleAddMobileVerifyIdentity = async () => {
    if (addMobileVerifyMethod === 'passkey') {
      const verificationResult = await handlePasskeyVerification('add_mobile');
      if (verificationResult) {
        setPasskeyVerificationResult(verificationResult);
        setCurrentStep(2); // Move to enter mobile number
      }
      return;
    }
    if (addMobileVerifyMethod === 'totp') {
      if (!googleAuthCode || googleAuthCode.length !== 6) {
        alertErrorMessage('Please enter a valid 6-digit code');
        return;
      }
      setCurrentStep(2);
      return;
    }
    if (addMobileVerifyMethod === 'email') {
      if (!emailOtpCode || emailOtpCode.length !== 6) {
        alertErrorMessage('Please enter a valid 6-digit OTP');
        return;
      }
      setCurrentStep(2); // Actual verification happens in addMobile API
      return;
    }
  };

  // Step 2: Validate and move to verify new mobile step
  const handleAddMobileNext = () => {
    if (!newMobileNumber || newMobileNumber.length < 6) {
      alertErrorMessage('Please enter a valid mobile number');
      return;
    }

    // Validate phone number according to country code
    const fullPhoneNumber = `${newCountryCode}${newMobileNumber}`;
    if (!isValidPhoneNumber(fullPhoneNumber)) {
      alertErrorMessage('Please enter a valid phone number for the selected country');
      return;
    }

    setCurrentStep(3); // Move to verify new mobile - user will click "Send OTP" button
  };

  // Complete add mobile
  const handleAddMobileComplete = async () => {
    if (!newMobileOtpCode || newMobileOtpCode.length !== 6) {
      alertErrorMessage('Please enter a valid 6-digit OTP');
      return;
    }

    try {
      setIsLoading(true);
      LoaderHelper.loaderStatus(true);

      const payload = {
        mobileNumber: newMobileNumber,
        countryCode: newCountryCode,
        mobileOtp: newMobileOtpCode
      };
      // Send ONE verification method (user chose one)
      if (passkeyVerificationResult) {
        payload.passkeyVerified = true;
        payload.passkeyUserId = passkeyVerificationResult.userId;
      } else if (addMobileVerifyMethod === 'totp') {
        payload.tofaCode = googleAuthCode;
      } else if (addMobileVerifyMethod === 'email') {
        payload.emailOtp = emailOtpCode;
      }

      const result = await AuthService.securityMobileAdd(payload);

      if (result?.success) {
        alertSuccessMessage(result?.message || 'Mobile number added successfully!');
        closeAllModals();
        handleUserDetails();
      } else {
        alertErrorMessage(result?.message || 'Failed to add mobile number');
      }
    } catch (error) {
      alertErrorMessage(error?.message || 'Something went wrong');
    } finally {
      setIsLoading(false);
      LoaderHelper.loaderStatus(false);
    }
  };

  // ============ CHANGE EMAIL FLOW ============
  // Show consent warning first
  const handleChangeEmailStart = () => {
    if (!canMakeSensitiveChanges()) {
      openModal('blockingModal');
      return;
    }
    setPendingAction('changeEmail');
    openModal('changeEmailConsentModal');
  };

  // Proceed with change email after user consent
  const handleChangeEmailProceed = async () => {
    closeModal('changeEmailConsentModal');
    resetModalStates();
    setPasskeyVerificationResult(null);

    // If passkey is available, try silent verification first
    if (hasPasskey && passkeySupported) {
      const verificationResult = await attemptSilentPasskeyVerification('change_email');
      if (verificationResult) {
        // Passkey verified successfully - skip to step 2 (enter new email)
        setPasskeyVerificationResult(verificationResult);
        setCurrentStep(2);
        openModal('changeEmailModal');
        return;
      }
      // Passkey failed or cancelled - show fallback options
    }

    // Build available verification methods (excluding passkey if it failed)
    const methods = [];
    if (hasPasskey && passkeySupported) {
      methods.push({ value: 'passkey', label: 'Passkey', icon: 'ri-fingerprint-line', description: 'Use Face ID, Touch ID, or Windows Hello' });
    }
    if (hasGoogleAuth) {
      methods.push({ value: 'totp', label: 'Google Authenticator', icon: 'ri-shield-keyhole-line', description: 'Use your authenticator app' });
    }
    methods.push({ value: 'email', label: 'Email Verification', icon: 'ri-mail-line', description: `Send code to ${maskEmail(emailID)}` });
    if (hasMobile) {
      methods.push({ value: 'mobile', label: 'Mobile Verification', icon: 'ri-smartphone-line', description: `Send code to ${maskPhone(mobileNumber)}` });
    }

    setChangeAvailableMethods(methods);
    // Set default method - Passkey first if available, then Google Auth, then email
    setChangeVerifyMethod(hasPasskey && passkeySupported ? 'passkey' : (hasGoogleAuth ? 'totp' : 'email'));
    setCurrentStep(1); // Start at step 1 - verification
    openModal('changeEmailModal');
  };

  // Step 1: Verify identity (Passkey, Google Auth, Email OTP, or Mobile OTP)
  // Step 2: Enter new email
  // Step 3: Verify new email OTP
  const handleChangeEmailNextStep = async () => {
    if (currentStep === 1) {
      // Step 1: Verify identity based on selected method
      if (changeVerifyMethod === 'passkey') {
        // Trigger passkey verification
        const verificationResult = await handlePasskeyVerification('change_email');
        if (verificationResult) {
          setPasskeyVerificationResult(verificationResult);
          setCurrentStep(2); // Move to enter new email
        }
        return;
      } else if (changeVerifyMethod === 'totp') {
        if (!googleAuthCode || googleAuthCode.length !== 6) {
          alertErrorMessage('Please enter a valid 6-digit code');
          return;
        }
        setCurrentStep(2); // Move to enter new email
      } else if (changeVerifyMethod === 'email') {
        if (!emailOtpCode || emailOtpCode.length !== 6) {
          alertErrorMessage('Please enter a valid 6-digit OTP');
          return;
        }
        setCurrentStep(2); // Move to enter new email
      } else if (changeVerifyMethod === 'mobile') {
        if (!mobileOtpCode || mobileOtpCode.length !== 6) {
          alertErrorMessage('Please enter a valid 6-digit OTP');
          return;
        }
        setCurrentStep(2); // Move to enter new email
      }
    } else if (currentStep === 2) {
      // Step 2: Validate new email and initiate change
      if (!newEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
        alertErrorMessage('Please enter a valid email address');
        return;
      }

      try {
        setIsLoading(true);
        LoaderHelper.loaderStatus(true);

        // Build request based on verification method used
        const requestData = {
          newEmail: newEmail,
        };

        if (passkeyVerificationResult) {
          requestData.passkeyVerified = true;
          requestData.passkeyUserId = passkeyVerificationResult.userId;
        } else if (changeVerifyMethod === 'totp') {
          requestData.tofaCode = googleAuthCode;
        } else if (changeVerifyMethod === 'email') {
          requestData.currentEmailOtp = emailOtpCode;
        } else if (changeVerifyMethod === 'mobile') {
          // Use mobile OTP as current verification
          requestData.currentMobileOtp = mobileOtpCode;
        }

        // Call backend to initiate email change
        const result = await AuthService.securityEmailChangeInitiate(requestData);

        if (result?.success) {
          alertSuccessMessage(result?.message || 'Verification successful. Please send OTP to your new email.');
          // Move to step 3 - user will click "Send OTP" button
          setCurrentStep(3);
        } else {
          alertErrorMessage(result?.message || 'Failed to initiate email change');
        }
      } catch (error) {
        alertErrorMessage(error?.message || 'Something went wrong');
      } finally {
        setIsLoading(false);
        LoaderHelper.loaderStatus(false);
      }
    } else if (currentStep === 3) {
      // Verify new email OTP and complete
      if (!newEmailOtpCode || newEmailOtpCode.length !== 6) {
        alertErrorMessage('Please enter a valid 6-digit OTP');
        return;
      }

      try {
        setIsLoading(true);
        LoaderHelper.loaderStatus(true);

        // Call backend to complete email change
        const result = await AuthService.securityEmailChangeComplete({
          newEmailOtp: newEmailOtpCode
        });

        if (result?.success) {
          alertSuccessMessage(result?.message || 'Email changed successfully!');
          closeAllModals();
          handleUserDetails();
        } else {
          alertErrorMessage(result?.message || 'Failed to change email');
        }
      } catch (error) {
        alertErrorMessage(error?.message || 'Something went wrong');
      } finally {
        setIsLoading(false);
        LoaderHelper.loaderStatus(false);
      }
    }
  };

  // Open change email options popup
  const handleOpenChangeEmailOptions = () => {
    const modal = window.bootstrap?.Modal?.getInstance(document.getElementById('changeEmailModal'));
    if (modal) modal.hide();
    setTimeout(() => {
      openModal('changeVerifyOptionsModal');
    }, 100);
  };

  // Select verification method for change email flow
  const handleSelectChangeMethod = (method) => {
    setChangeVerifyMethod(method.value);
    setEmailOtpCode('');
    setMobileOtpCode('');
    setGoogleAuthCode('');
    setResendTimer(0);
    setPasskeyVerificationResult(null);

    // Close options popup
    const optionsModal = window.bootstrap?.Modal?.getInstance(document.getElementById('changeVerifyOptionsModal'));
    if (optionsModal) optionsModal.hide();

    // Reopen main modal
    setTimeout(() => {
      openModal('changeEmailModal');
    }, 100);
  };

  // Close change options popup
  const handleCloseChangeOptionsPopup = () => {
    const optionsModal = window.bootstrap?.Modal?.getInstance(document.getElementById('changeVerifyOptionsModal'));
    if (optionsModal) optionsModal.hide();
    setTimeout(() => {
      openModal('changeEmailModal');
    }, 100);
  };

  // Get verification title for change flows
  const getChangeVerificationTitle = () => {
    if (changeVerifyMethod === 'passkey') return 'Passkey Verification';
    if (changeVerifyMethod === 'totp') return 'Google Authenticator';
    if (changeVerifyMethod === 'email') return 'Email Verification';
    if (changeVerifyMethod === 'mobile') return 'Mobile Verification';
    return 'Verify Your Identity';
  };

  // Get verification description for change flows
  const getChangeVerificationDescription = () => {
    if (changeVerifyMethod === 'passkey') return 'Use your passkey to verify your identity';
    if (changeVerifyMethod === 'totp') return 'Enter the 6-digit code from your authenticator app';
    if (changeVerifyMethod === 'email') return `We'll send a verification code to ${maskEmail(emailID)}`;
    if (changeVerifyMethod === 'mobile') return `We'll send a verification code to ${maskPhone(mobileNumber)}`;
    return '';
  };

  // Get the current OTP code for change flow
  const getChangeOtpCode = () => {
    if (changeVerifyMethod === 'totp') return googleAuthCode;
    if (changeVerifyMethod === 'email') return emailOtpCode;
    if (changeVerifyMethod === 'mobile') return mobileOtpCode;
    return '';
  };

  // Set the OTP code for change flow
  const setChangeOtpCode = (value) => {
    if (changeVerifyMethod === 'totp') setGoogleAuthCode(value);
    else if (changeVerifyMethod === 'email') setEmailOtpCode(value);
    else if (changeVerifyMethod === 'mobile') setMobileOtpCode(value);
  };

  // Send OTP for change flow
  const sendChangeOtp = async () => {
    if (changeVerifyMethod === 'passkey') return true;
    if (changeVerifyMethod === 'totp') return true;

    const target = changeVerifyMethod === 'email' ? 'email' : 'mobile';
    const sent = await handleSendOtp(target, 'change_email');
    if (sent) {
      setResendTimer(60);
    }
    return sent;
  };

  // Add Mobile verification helpers (single method - same pattern as change email)
  const getAddMobileVerificationTitle = () => {
    if (addMobileVerifyMethod === 'passkey') return 'Passkey Verification';
    if (addMobileVerifyMethod === 'totp') return 'Google Authenticator';
    if (addMobileVerifyMethod === 'email') return 'Email Verification';
    return 'Verify Your Identity';
  };

  const getAddMobileVerificationDescription = () => {
    if (addMobileVerifyMethod === 'passkey') return 'Use your passkey to verify your identity';
    if (addMobileVerifyMethod === 'totp') return 'Enter the 6-digit code from your authenticator app';
    if (addMobileVerifyMethod === 'email') return `We'll send a verification code to ${maskEmail(emailID)}`;
    return '';
  };

  const getAddMobileOtpCode = () => {
    if (addMobileVerifyMethod === 'totp') return googleAuthCode;
    if (addMobileVerifyMethod === 'email') return emailOtpCode;
    return '';
  };

  const setAddMobileOtpCode = (value) => {
    if (addMobileVerifyMethod === 'totp') setGoogleAuthCode(value);
    else if (addMobileVerifyMethod === 'email') setEmailOtpCode(value);
  };

  const sendAddMobileOtp = async () => {
    if (addMobileVerifyMethod === 'passkey') return true;
    if (addMobileVerifyMethod === 'totp') return true;
    const sent = await handleSendOtp('email', 'add_mobile');
    if (sent) {
      setResendTimer(60);
    }
    return sent;
  };

  const handleOpenAddMobileOptions = () => {
    const modal = window.bootstrap?.Modal?.getInstance(document.getElementById('addMobileModal'));
    if (modal) modal.hide();
    setTimeout(() => openModal('addMobileVerifyOptionsModal'), 100);
  };

  const handleSelectAddMobileMethod = (method) => {
    setAddMobileVerifyMethod(method.value);
    setEmailOtpCode('');
    setGoogleAuthCode('');
    setResendTimer(0);
    setPasskeyVerificationResult(null);
    const optionsModal = window.bootstrap?.Modal?.getInstance(document.getElementById('addMobileVerifyOptionsModal'));
    if (optionsModal) optionsModal.hide();
    setTimeout(() => openModal('addMobileModal'), 100);
  };

  const handleCloseAddMobileOptionsPopup = () => {
    const optionsModal = window.bootstrap?.Modal?.getInstance(document.getElementById('addMobileVerifyOptionsModal'));
    if (optionsModal) optionsModal.hide();
    setTimeout(() => openModal('addMobileModal'), 100);
  };

  // ============ CHANGE MOBILE FLOW ============
  // Show consent warning first
  const handleChangeMobileStart = () => {
    if (!canMakeSensitiveChanges()) {
      openModal('blockingModal');
      return;
    }
    setPendingAction('changeMobile');
    openModal('changeMobileConsentModal');
  };

  // Proceed with change mobile after user consent
  const handleChangeMobileProceed = async () => {
    closeModal('changeMobileConsentModal');
    resetModalStates();
    setPasskeyVerificationResult(null);

    // If passkey is available, try silent verification first
    if (hasPasskey && passkeySupported) {
      const verificationResult = await attemptSilentPasskeyVerification('change_mobile');
      if (verificationResult) {
        // Passkey verified successfully - skip to step 2 (enter new mobile)
        setPasskeyVerificationResult(verificationResult);
        setCurrentStep(2);
        openModal('changeMobileModal');
        return;
      }
      // Passkey failed or cancelled - show fallback options
    }

    // Build available verification methods (excluding passkey if it failed)
    const methods = [];
    if (hasPasskey && passkeySupported) {
      methods.push({ value: 'passkey', label: 'Passkey', icon: 'ri-fingerprint-line', description: 'Use Face ID, Touch ID, or Windows Hello' });
    }
    if (hasGoogleAuth) {
      methods.push({ value: 'totp', label: 'Google Authenticator', icon: 'ri-shield-keyhole-line', description: 'Use your authenticator app' });
    }
    if (hasEmail) {
      methods.push({ value: 'email', label: 'Email Verification', icon: 'ri-mail-line', description: `Send code to ${maskEmail(emailID)}` });
    }
    methods.push({ value: 'mobile', label: 'Mobile Verification', icon: 'ri-smartphone-line', description: `Send code to ${maskPhone(mobileNumber)}` });

    setChangeAvailableMethods(methods);
    // Set default method - Passkey first if available, then Google Auth, then email, then mobile
    setChangeVerifyMethod(hasPasskey && passkeySupported ? 'passkey' : (hasGoogleAuth ? 'totp' : (hasEmail ? 'email' : 'mobile')));
    setCurrentStep(1); // Start at step 1 - verification
    openModal('changeMobileModal');
  };

  const handleChangeMobileNextStep = async () => {
    if (currentStep === 1) {
      // Step 1: Verify identity based on selected method
      if (changeVerifyMethod === 'passkey') {
        // Trigger passkey verification
        const verificationResult = await handlePasskeyVerification('change_mobile');
        if (verificationResult) {
          setPasskeyVerificationResult(verificationResult);
          setCurrentStep(2); // Move to enter new mobile
        }
        return;
      } else if (changeVerifyMethod === 'totp') {
        if (!googleAuthCode || googleAuthCode.length !== 6) {
          alertErrorMessage('Please enter a valid 6-digit code');
          return;
        }
        setCurrentStep(2); // Move to enter new mobile
      } else if (changeVerifyMethod === 'email') {
        if (!emailOtpCode || emailOtpCode.length !== 6) {
          alertErrorMessage('Please enter a valid 6-digit OTP');
          return;
        }
        setCurrentStep(2); // Move to enter new mobile
      } else if (changeVerifyMethod === 'mobile') {
        if (!mobileOtpCode || mobileOtpCode.length !== 6) {
          alertErrorMessage('Please enter a valid 6-digit OTP');
          return;
        }
        setCurrentStep(2); // Move to enter new mobile
      }
    } else if (currentStep === 2) {
      // Step 2: Validate new mobile number and initiate change
      if (!newMobileNumber || newMobileNumber.length < 6) {
        alertErrorMessage('Please enter a valid mobile number');
        return;
      }

      // Validate phone number according to country code
      const fullPhoneNumber = `${newCountryCode}${newMobileNumber}`;
      if (!isValidPhoneNumber(fullPhoneNumber)) {
        alertErrorMessage('Please enter a valid phone number for the selected country');
        return;
      }

      try {
        setIsLoading(true);
        LoaderHelper.loaderStatus(true);

        // Build request based on verification method used
        const requestData = {
          newMobileNumber: newMobileNumber,
          newCountryCode: newCountryCode,
        };

        if (passkeyVerificationResult) {
          requestData.passkeyVerified = true;
          requestData.passkeyUserId = passkeyVerificationResult.userId;
        } else if (changeVerifyMethod === 'totp') {
          requestData.tofaCode = googleAuthCode;
        } else if (changeVerifyMethod === 'email') {
          requestData.currentEmailOtp = emailOtpCode;
        } else if (changeVerifyMethod === 'mobile') {
          requestData.currentMobileOtp = mobileOtpCode;
        }

        // Call backend to initiate mobile change
        const result = await AuthService.securityMobileChangeInitiate(requestData);

        if (result?.success) {
          alertSuccessMessage(result?.message || 'Verification successful. Please send OTP to your new mobile.');
          // Move to step 3 - user will click "Send OTP" button
          setCurrentStep(3);
        } else {
          alertErrorMessage(result?.message || 'Failed to initiate mobile change');
        }
      } catch (error) {
        alertErrorMessage(error?.message || 'Something went wrong');
      } finally {
        setIsLoading(false);
        LoaderHelper.loaderStatus(false);
      }
    } else if (currentStep === 3) {
      // Verify new mobile OTP and complete
      if (!newMobileOtpCode || newMobileOtpCode.length !== 6) {
        alertErrorMessage('Please enter a valid 6-digit OTP');
        return;
      }

      try {
        setIsLoading(true);
        LoaderHelper.loaderStatus(true);

        // Call backend to complete mobile change
        const result = await AuthService.securityMobileChangeComplete({
          newMobileOtp: newMobileOtpCode
        });

        if (result?.success) {
          alertSuccessMessage(result?.message || 'Mobile number changed successfully!');
          closeAllModals();
          handleUserDetails();
        } else {
          alertErrorMessage(result?.message || 'Failed to change mobile number');
        }
      } catch (error) {
        alertErrorMessage(error?.message || 'Something went wrong');
      } finally {
        setIsLoading(false);
        LoaderHelper.loaderStatus(false);
      }
    }
  };

  // Open change mobile options popup
  const handleOpenChangeMobileOptions = () => {
    const modal = window.bootstrap?.Modal?.getInstance(document.getElementById('changeMobileModal'));
    if (modal) modal.hide();
    setTimeout(() => {
      openModal('changeMobileVerifyOptionsModal');
    }, 100);
  };

  // Select verification method for change mobile flow
  const handleSelectChangeMobileMethod = (method) => {
    setChangeVerifyMethod(method.value);
    setEmailOtpCode('');
    setMobileOtpCode('');
    setGoogleAuthCode('');
    setResendTimer(0);
    setPasskeyVerificationResult(null);

    // Close options popup
    const optionsModal = window.bootstrap?.Modal?.getInstance(document.getElementById('changeMobileVerifyOptionsModal'));
    if (optionsModal) optionsModal.hide();

    // Reopen main modal
    setTimeout(() => {
      openModal('changeMobileModal');
    }, 100);
  };

  // Close change mobile options popup
  const handleCloseChangeMobileOptionsPopup = () => {
    const optionsModal = window.bootstrap?.Modal?.getInstance(document.getElementById('changeMobileVerifyOptionsModal'));
    if (optionsModal) optionsModal.hide();
    setTimeout(() => {
      openModal('changeMobileModal');
    }, 100);
  };

  // ============ ADD EMAIL FLOW (for users who signed up with mobile) ============
  const handleAddEmailStart = async () => {
    resetModalStates();
    setPasskeyVerificationResult(null);

    // If passkey is available, try silent verification first
    if (hasPasskey && passkeySupported) {
      const verificationResult = await attemptSilentPasskeyVerification('add_email');
      if (verificationResult) {
        // Passkey verified successfully - skip to step 3 (enter new email)
        setPasskeyVerificationResult(verificationResult);
        setAddEmailStep(3);
        openModal('addEmailModal');
        return;
      }
      // Passkey failed or cancelled - show fallback options
    }

    // If user has Google Auth enabled, start with that verification
    if (hasGoogleAuth) {
      setAddEmailStep(1);
      openModal('addEmailModal');
    } else if (hasMobile) {
      // Start at mobile verification - user will click "Send OTP" button
      setAddEmailStep(2);
      openModal('addEmailModal');
    } else {
      alertErrorMessage('No verification method available');
    }
  };

  const handleAddEmailNextStep = async () => {
    if (addEmailStep === 1 && hasGoogleAuth) {
      // Step 1: Verify Google Auth code
      if (!googleAuthCode || googleAuthCode.length !== 6) {
        alertErrorMessage('Please enter a valid 6-digit code');
        return;
      }

      // Move to mobile verification step - user will click "Send OTP" button
      if (hasMobile) {
        setAddEmailStep(2);
      } else {
        // No mobile, move directly to enter email step
        setAddEmailStep(3);
      }
    } else if (addEmailStep === 2) {
      // Step 2: Collect mobile OTP (don't verify yet - backend will verify all together)
      if (!mobileOtpCode || mobileOtpCode.length !== 6) {
        alertErrorMessage('Please enter a valid 6-digit OTP');
        return;
      }
      // Just move to next step - OTP will be verified by backend in final call
      setAddEmailStep(3);
    } else if (addEmailStep === 3) {
      // Step 3: Validate email and move to step 4 - user will click "Send OTP" button
      if (!newEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
        alertErrorMessage('Please enter a valid email address');
        return;
      }
      // Move to step 4 - user will click "Send OTP" button
      setAddEmailStep(4);
    } else if (addEmailStep === 4) {
      // Step 4: Verify new email OTP and complete
      if (!newEmailOtpCode || newEmailOtpCode.length !== 6) {
        alertErrorMessage('Please enter a valid 6-digit OTP');
        return;
      }

      try {
        setIsLoading(true);
        LoaderHelper.loaderStatus(true);

        // Call backend to add email
        const result = await AuthService.securityEmailAdd({
          email: newEmail,
          tofaCode: hasGoogleAuth ? googleAuthCode : undefined,
          mobileOtp: mobileOtpCode,
          emailOtp: newEmailOtpCode
        });

        if (result?.success) {
          alertSuccessMessage(result?.message || 'Email added successfully!');
          closeAllModals();
          handleUserDetails();
        } else {
          alertErrorMessage(result?.message || 'Failed to add email');
        }
      } catch (error) {
        alertErrorMessage(error?.message || 'Something went wrong');
      } finally {
        setIsLoading(false);
        LoaderHelper.loaderStatus(false);
      }
    }
  };

  const securityLevel = getSecurityLevel();
  const activeMethodsCount = getActiveMethodsCount();

  return (
    <>
      <div className="dashboard_right">

        <div className="twofactor_outer_s">
          <h5>Security Settings</h5>
          <p>Manage your account security methods. Enable multiple verification methods for enhanced protection.</p>

          <div className="security_level">
            <p>
              Security Level: <span style={{ color: securityLevel.color, fontWeight: 'bold' }}>{securityLevel.level}</span>
              <span style={{ marginLeft: '15px', color: '#888' }}>({activeMethodsCount}/4 methods active)</span>
            </p>
          </div>

          <div className="two_factor_list">
            {/* Email Verification */}
            <div className={`factor_bl ${hasEmail ? '' : ''}`}>
              <div className="lftcnt">
                <h6><img src="/images/email_icon2.svg" alt="Email" /> Email Verification</h6>
                <p>Use your email address for login verification and security confirmations.</p>
              </div>

              <div className="enable">
                {hasEmail ? (
                  <><img src="/images/verified_icon.svg" alt="Active" /> {maskEmail(emailID)}</>
                ) : (
                  <><img src="/images/enabled_icon.svg" alt="Not Set" /> Not Set</>
                )}
              </div>

              {hasEmail && canMakeSensitiveChanges() && (
                <button className="btn btn-outline" onClick={handleChangeEmailStart} disabled={isLoading}>
                  Change
                </button>
              )}
              {hasEmail && !canMakeSensitiveChanges() && (
                <span style={{ color: '#888', fontSize: '12px' }}>Add another method to change</span>
              )}
              {!hasEmail && hasMobile && (
                <button className="btn btn-outline" onClick={handleAddEmailStart} disabled={isLoading}>
                  Add Email
                </button>
              )}
            </div>

            {/* Mobile Verification */}
            <div className={`factor_bl ${hasMobile ? '' : ''}`}>
              <div className="lftcnt">
                <h6><img src="/images/mobile_icon.svg" alt="Mobile" /> Mobile Verification</h6>
                <p>Receive SMS verification codes for login and security confirmations.</p>
              </div>

              <div className="enable">
                {hasMobile ? (
                  <><img src="/images/verified_icon.svg" alt="Active" /> {maskPhone(mobileNumber)}</>
                ) : (
                  <><img src="/images/enabled_icon.svg" alt="Not Set" /> Not Set</>
                )}
              </div>

              {!hasMobile ? (
                <button className="btn btn-outline" onClick={handleAddMobileStart} disabled={isLoading}>
                  Add Mobile
                </button>
              ) : canMakeSensitiveChanges() ? (
                <button className="btn btn-outline" onClick={handleChangeMobileStart} disabled={isLoading}>
                  Change
                </button>
              ) : (
                <span style={{ color: '#888', fontSize: '12px' }}>Add another method to change</span>
              )}
            </div>

            {/* Google Authenticator */}
            <div className={`factor_bl ${hasGoogleAuth ? '' : ''}`}>
              <div className="lftcnt">
                <h6>
                  <img src="/images/lock_icon.svg" alt="Authenticator" />
                  Google Authenticator
                  {/* <span className="recommended-badge">Recommended</span> */}
                </h6>
                <p>Use time-based codes from Google Authenticator or similar apps for the highest security level.</p>
              </div>

              <div className="enable">
                {hasGoogleAuth ? (
                  <><img src="/images/verified_icon.svg" alt="Enabled" /> Enabled</>
                ) : (
                  <><img src="/images/enabled_icon.svg" alt="Not Enabled" /> Not Enabled</>
                )}
              </div>

              {hasGoogleAuth ? (
                <button
                  className="btn btn-outline"
                  onClick={handleDisableGoogleAuthStart}
                  disabled={isLoading || !canMakeSensitiveChanges()}
                  title={!canMakeSensitiveChanges() ? 'Need at least 2 methods to disable' : ''}
                >
                  Disable
                </button>
              ) : (
                <button className="btn btn-outline" onClick={handleGoogleAuthStart} disabled={isLoading || (!hasEmail && !hasMobile)}>
                  Set Up
                </button>
              )}
            </div>

            {/* Passkey Authentication */}
            {passkeySupported && (
              <div className={`factor_bl ${hasPasskey ? '' : ''}`}>
                <div className="lftcnt">
                  <h6>
                    <i className="ri-fingerprint-line" style={{ fontSize: '20px', marginRight: '8px' }}></i>
                    Passkey
                  </h6>
                  <p>Use Face ID, Touch ID, or Windows Hello for fast and secure passwordless login.</p>
                </div>

                <div className="enable">
                  {hasPasskey ? (
                    <><img src="/images/verified_icon.svg" alt="Enabled" /> {passkeys.length} Passkey{passkeys.length !== 1 ? 's' : ''} <strong  className="cursor-pointer" onClick={() => openModal('viewPasskeysModal')}>(View)</strong></>
                  ) : (
                    <><img src="/images/enabled_icon.svg" alt="Not Enabled" /> Not Enabled</>
                  )}
                </div>

                <button
                  className="btn btn-outline"
                  onClick={handleAddPasskeyStart}
                  disabled={isLoading}
                >
                  {hasPasskey ? 'Add Another' : 'Set Up'}
                </button>
              </div>
            )}

            {/* Security Tips */}
            <div className=" security-tips">
              <div className="lftcnt">
                <h6><i className="ri-folder-shield-2-line"></i>Security Tips</h6>
                <ul className="security-tips-list">
                  <li>✓ Enable at least 2 security methods for better protection</li>
                  <li>✓ Google Authenticator provides the highest security level</li>
                  <li>✓ Never share your verification codes with anyone</li>
                  <li>✓ Keep your backup codes in a secure location</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ============ GOOGLE AUTHENTICATOR MODALS ============ */}

      {/* Step 1: Email/Mobile Verification for Google Auth Setup */}
      <div className="modal fade search_form" id="googleAuthSetupModal" tabIndex="-1" aria-hidden="true" data-bs-backdrop="static">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Enable Google Authenticator</h5>
              <p>Step 1: Verify your {hasEmail ? 'email' : 'mobile'} first for security</p>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div className="modal-body">
              <div className="verify_authenticator_s">
                <img src={hasEmail ? "/images/verifyemail.svg" : "/images/mobile_icon.svg"} alt="Verify" />
                <p>Click "Send OTP" to receive a verification code on <strong>{hasEmail ? maskEmail(emailID) : maskPhone(mobileNumber)}</strong></p>
              </div>

              <div className="verify_authenticator_form">
                <form className="profile_form" onSubmit={(e) => e.preventDefault()}>
                  <div className="emailinput">
                    <label>Enter verification code</label>
                    <div className="d-flex">
                      {hasEmail ? (
                        <input
                          type="text"
                          placeholder="123456"
                          maxLength={6}
                          value={emailOtpCode}
                          onChange={(e) => setEmailOtpCode(e.target.value.replace(/\D/g, ''))}
                        />
                      ) : (
                        <input
                          type="text"
                          placeholder="123456"
                          maxLength={6}
                          value={mobileOtpCode}
                          onChange={(e) => setMobileOtpCode(e.target.value.replace(/\D/g, ''))}
                        />
                      )}
                      {resendTimer > 0 ? (
                        <div className="resend otp-button-disabled">Resend ({resendTimer}s)</div>
                      ) : (
                        <div className="getotp cursor-pointer" onClick={() => handleSendOtp(hasEmail ? 'email' : 'mobile', '2fa_setup').then(() => setResendTimer(60))}>
                          Send OTP
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    className="submit"
                    type="button"
                    disabled={isLoading || (hasEmail ? emailOtpCode.length !== 6 : mobileOtpCode.length !== 6)}
                    onClick={handleGoogleAuthVerifyAndSetup}
                  >
                    {isLoading ? 'Verifying...' : 'Verify & Continue'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Step 2: QR Code Display */}
      <div className="modal fade search_form" id="googleAuthQrModal" tabIndex="-1" aria-hidden="true" data-bs-backdrop="static">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">

              {/* <button type="button" className="btn-back" onClick={() => handleGoBack('googleAuthQr')} title="Go back">
              </button> */}


              <h5 className="modal-title">  <i className="ri-arrow-left-line cursor-pointer" onClick={() => handleGoBack('googleAuthQr')} ></i>Scan QR Code</h5>
              <p>Step 2: Scan with Google Authenticator app</p>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div className="modal-body">
              <div className="verify_authenticator_s">
                <div className="qr_code" style={{ padding: '20px', background: '#fff', borderRadius: '10px', display: 'inline-block' }}>
                  {googleQr ? (
                    <img src={googleQr} alt="QR Code" style={{ maxWidth: '200px' }} />
                  ) : (
                    <img src="/images/scanqr_code.svg" alt="QR code placeholder" />
                  )}
                </div>
                <p style={{ marginTop: '15px' }}>Scan this QR code with Google Authenticator</p>
              </div>

              <div className="verify_authenticator_form">
                <div className="coypcodetext">
                  <p>Or enter this code manually:</p>
                  <div className="d-flex align-items-center gap-2 copycodetxt">
                    <code className="copycodetxtcode">{googleCode || 'Loading...'}</code>
                    <button type="button" className="copy_code" onClick={copyCode}>
                      <i className="ri-file-copy-line"></i>
                    </button>
                  </div>
                </div>
                <form className="profile_form">
                  <button
                    className="submit"
                    type="button"
                    disabled={!googleCode}
                    onClick={() => switchModal('googleAuthQrModal', 'googleAuthVerifyModal')}
                  >
                    Continue
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Step 3: Verify Authenticator Code */}
      <div className="modal fade search_form" id="googleAuthVerifyModal" tabIndex="-1" aria-hidden="true" data-bs-backdrop="static">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              {/* <button type="button" className="btn-back" onClick={() => handleGoBack('googleAuthVerify')} title="Go back">
              </button> */}
              <h5 className="modal-title">    <i className="ri-arrow-left-line cursor-pointer" onClick={() => handleGoBack('googleAuthVerify')} ></i>Verify Setup</h5>
              <p>Step 3: Enter the code from your authenticator app</p>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div className="modal-body">
              <div className="verify_authenticator_s">
                <img src="/images/verifylock.svg" alt="Verify" />
                <p>Enter the 6-digit code displayed in your authenticator app</p>
              </div>

              <div className="verify_authenticator_form">
                <form className="profile_form" onSubmit={(e) => e.preventDefault()}>
                  <div className="emailinput">
                    <label>Authenticator Code</label>
                    <div className="d-flex">
                      <input
                        type="text"
                        placeholder="123456"
                        maxLength={6}
                        value={authenticatorCode}
                        onChange={(e) => setAuthenticatorCode(e.target.value.replace(/\D/g, ''))}
                      />
                    </div>
                  </div>

                  <button
                    className="submit"
                    type="button"
                    disabled={isLoading || authenticatorCode.length !== 6}
                    onClick={handleGoogleAuthConfirm}
                  >
                    {isLoading ? 'Enabling...' : 'Enable Google Authenticator'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ============ ADD MOBILE MODAL ============ */}
      <div className="modal fade search_form" id="addMobileModal" tabIndex="-1" aria-hidden="true" data-bs-backdrop="static">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">{currentStep > 1 && (<i className="ri-arrow-left-line cursor-pointer me-2" onClick={() => handleGoBack('addMobile')}></i>)}Add Mobile Number</h5>
              <p>
                {currentStep === 1 && getAddMobileVerificationTitle()}
                {currentStep === 2 && 'Step 2: Enter your mobile number'}
                {currentStep === 3 && 'Step 3: Verify your mobile number'}
              </p>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div className="modal-body">
              <div className="verify_authenticator_form">
                <form className="profile_form" onSubmit={(e) => e.preventDefault()}>

                  {/* Step 1: Verify identity (user chooses ONE method: Passkey, Google Auth, or Email) */}
                  {currentStep === 1 && (
                    <>
                      {addMobileVerifyMethod === 'passkey' ? (
                        <div style={{ textAlign: 'center' }}>
                          <div style={{
                            width: '80px', height: '80px', borderRadius: '50%',
                            background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            margin: '0 auto 20px'
                          }}>
                            <i className="ri-fingerprint-line" style={{ fontSize: '40px', color: '#fff' }}></i>
                          </div>
                          <p className="text-white mb-3">{getAddMobileVerificationDescription()}</p>
                          <button type="button" className="submit w-100" onClick={handleAddMobileVerifyIdentity} disabled={isLoading || isPasskeyVerifying}>
                            {isPasskeyVerifying ? 'Authenticating...' : 'Authenticate with Passkey'}
                          </button>
                        </div>
                      ) : (
                        <>
                          <p style={{ marginBottom: '10px' }}>{getAddMobileVerificationDescription()}</p>
                          <div className="emailinput">
                            <label>Enter 6-digit Code</label>
                            <div className="d-flex">
                              <input type="text" placeholder="123456" maxLength={6} value={getAddMobileOtpCode()} onChange={(e) => setAddMobileOtpCode(e.target.value.replace(/\D/g, ''))} />
                              {addMobileVerifyMethod !== 'totp' && (resendTimer > 0 ? (
                                <div className="resend otp-button-disabled">Resend ({resendTimer}s)</div>
                              ) : (
                                <button type="button" className="getotp otp-button-enabled getotp_mobile" onClick={sendAddMobileOtp}>GET OTP</button>
                              ))}
                            </div>
                          </div>
                        </>
                      )}
                      {addMobileAvailableMethods.length > 1 && (
                        <div className="cursor-pointer" onClick={(e) => { e.preventDefault(); handleOpenAddMobileOptions(); }} style={{ marginTop: '15px' }}>
                          <small className="text-white">Switch to Another Verification Option <i className="ri-external-link-line"></i></small>
                        </div>
                      )}
                    </>
                  )}

                  {/* Step 2: Enter mobile number */}
                  {currentStep === 2 && (
                    <>

                      <div className="input_block">
                        {/* <label>Country Code</label> */}
                        <Select
                          styles={customStyles}
                          inputId="countryCode"
                          name="country_code_select"
                          options={countriesList}
                          onChange={(selected) => setNewCountryCode(selected?.value || '+91')}
                          value={countriesList.find(option => option.value === newCountryCode)}
                          placeholder="Select country code"
                          // blurInputOnSelect={true}
                          onMenuOpen={() => { }}
                          filterOption={(option, inputValue) =>
                            option.label.toLowerCase().includes(inputValue.toLowerCase())
                          }
                        />
                      </div>
                      <div className="emailinput" style={{ marginTop: '15px' }}>
                        <label>Mobile Number</label>
                        <input
                          type="text"
                          placeholder="Enter mobile number"
                          value={newMobileNumber}
                          onChange={(e) => setNewMobileNumber(e.target.value.replace(/\D/g, ''))}
                        />
                      </div>
                    </>
                  )}

                  {/* Step 3: Verify new mobile */}
                  {currentStep === 3 && (
                    <>
                      <p style={{ marginBottom: '10px' }}>Click "Send OTP" to receive a code on <strong>{newCountryCode} {newMobileNumber}</strong></p>

                      <div className="emailinput">
                        <label>Mobile Verification Code</label>
                        <div className="d-flex">
                          <input
                            type="text"
                            placeholder="123456"
                            maxLength={6}
                            value={newMobileOtpCode}
                            onChange={(e) => setNewMobileOtpCode(e.target.value.replace(/\D/g, ''))}
                          />
                          {resendTimer2 > 0 ? (
                            <div className="resend otp-button-disabled">Resend ({resendTimer2}s)</div>
                          ) : (
                            <div className="getotp cursor-pointer" onClick={() => {
                              const fullNumber = `${newCountryCode} ${newMobileNumber}`;
                              handleSendOtp('new_mobile', 'add_mobile', fullNumber).then(() => setResendTimer2(60));
                            }}>
                              Send OTP
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}

                  {(currentStep === 2 || currentStep === 3 || (currentStep === 1 && addMobileVerifyMethod !== 'passkey')) && (
                    <button
                      className="submit"
                      type="button"
                      disabled={isLoading || (currentStep === 1 && getAddMobileOtpCode().length < 6)}
                      onClick={() => {
                        if (currentStep === 1) handleAddMobileVerifyIdentity();
                        else if (currentStep === 2) handleAddMobileNext();
                        else if (currentStep === 3) handleAddMobileComplete();
                      }}
                    >
                      {isLoading ? 'Processing...' : currentStep === 3 ? 'Add Mobile Number' : 'Continue'}
                    </button>
                  )}
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Mobile Verification Options Modal */}
      <div className="modal fade search_form" id="addMobileVerifyOptionsModal" tabIndex="-1" aria-hidden="true" data-bs-backdrop="static">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Select a Verification Option</h5>
              <p>Choose how you want to verify your identity</p>
              <button type="button" className="btn-close" onClick={handleCloseAddMobileOptionsPopup} aria-label="Close"></button>
            </div>
            <div className="modal-body">
              <form className="profile_form" onSubmit={(e) => e.preventDefault()}>
                {addMobileAvailableMethods.map((method) => (
                  <div key={method.value}>
                    <div className="d-flex align-items-center justify-content-between text-white" onClick={() => handleSelectAddMobileMethod(method)} role="button">
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

      {/* ============ CHANGE EMAIL MODAL ============ */}
      <div className="modal fade search_form" id="changeEmailModal" tabIndex="-1" aria-hidden="true" data-bs-backdrop="static">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">
                {currentStep > 1 && (<i className="ri-arrow-left-line cursor-pointer me-2" onClick={() => handleGoBack('changeEmail')}></i>)}
                Change Email Address
              </h5>
              <p>
                {currentStep === 1 && getChangeVerificationTitle()}
                {currentStep === 2 && 'Step 2: Enter new email address'}
                {currentStep === 3 && 'Step 3: Verify new email'}
              </p>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div className="modal-body">
              <div className="verify_authenticator_form">
                <form className="profile_form" onSubmit={(e) => e.preventDefault()}>

                  {/* Step 1: Verify identity */}
                  {currentStep === 1 && (
                    <>
                      {/* Passkey verification */}
                      {changeVerifyMethod === 'passkey' ? (
                        <div className="" style={{ textAlign: 'center' }}>
                          <div style={{
                            width: '80px',
                            height: '80px',
                            borderRadius: '50%',
                            background: 'rgba(255,255,255,0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 20px'
                          }}>
                            <i className="ri-fingerprint-line" style={{ fontSize: '40px', color: '#fff' }}></i>
                          </div>
                          <p className="text-white mb-3">{getChangeVerificationDescription()}</p>
                          <button
                            className="submit w-100"
                            type="button"
                            onClick={handleChangeEmailNextStep}
                            disabled={isLoading || isPasskeyVerifying}
                          >
                            {isPasskeyVerifying ? 'Authenticating...' : 'Authenticate with Passkey'}
                          </button>
                        </div>
                      ) : (
                        <>
                          <p style={{ marginBottom: '10px' }}>{getChangeVerificationDescription()}</p>
                          <div className="emailinput">
                            <label>Enter 6-digit Code</label>
                            <div className="d-flex">
                              <input
                                type="text"
                                placeholder="123456"
                                maxLength={6}
                                value={getChangeOtpCode()}
                                onChange={(e) => setChangeOtpCode(e.target.value.replace(/\D/g, ''))}
                              />
                              {/* Send OTP button for Email/Mobile */}
                              {changeVerifyMethod !== 'totp' && (
                                resendTimer > 0 ? (
                                  <div className="resend otp-button-disabled">Resend ({resendTimer}s)</div>
                                ) : (
                                  <button
                                    type="button"
                                    className="getotp otp-button-enabled getotp_mobile"
                                    onClick={sendChangeOtp}
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
                            disabled={isLoading || getChangeOtpCode().length < 6}
                            onClick={handleChangeEmailNextStep}
                          >
                            {isLoading ? 'Processing...' : 'Continue'}
                          </button>
                        </>
                      )}

                      {/* Switch verification option */}
                      {changeAvailableMethods.length > 1 && (
                        <div className="cursor-pointer" onClick={(e) => { e.preventDefault(); handleOpenChangeEmailOptions(); }} style={{ marginTop: '15px' }}>
                          <small className="text-white">Switch to Another Verification Option <i className="ri-external-link-line"></i></small>
                        </div>
                      )}
                    </>
                  )}

                  {/* Step 2: Enter new email */}
                  {currentStep === 2 && (
                    <>
                      <div className="emailinput">
                        <label>New Email Address</label>
                        <input
                          type="email"
                          placeholder="Enter new email address"
                          value={newEmail}
                          onChange={(e) => setNewEmail(e.target.value)}
                        />
                      </div>
                      <button
                        className="submit"
                        type="button"
                        disabled={isLoading}
                        onClick={handleChangeEmailNextStep}
                      >
                        {isLoading ? 'Processing...' : 'Continue'}
                      </button>
                    </>
                  )}

                  {/* Step 3: Verify new email */}
                  {currentStep === 3 && (
                    <>
                      <p style={{ marginBottom: '10px' }}>Click "Send OTP" to receive a code on <strong>{newEmail}</strong></p>
                      <div className="emailinput">
                        <label>New Email Verification Code</label>
                        <div className="d-flex">
                          <input
                            type="text"
                            placeholder="123456"
                            maxLength={6}
                            value={newEmailOtpCode}
                            onChange={(e) => setNewEmailOtpCode(e.target.value.replace(/\D/g, ''))}
                          />
                          {resendTimer2 > 0 ? (
                            <div className="resend otp-button-disabled">Resend ({resendTimer2}s)</div>
                          ) : (
                            <div className="getotp cursor-pointer" onClick={() => handleSendOtp('new_email', 'change_email', newEmail).then(() => setResendTimer2(60))}>
                              Send OTP
                            </div>
                          )}
                        </div>
                      </div>
                      <button
                        className="submit"
                        type="button"
                        disabled={isLoading}
                        onClick={handleChangeEmailNextStep}
                      >
                        {isLoading ? 'Processing...' : 'Change Email'}
                      </button>
                    </>
                  )}

                </form>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Change Email Verification Options Modal */}
      <div className="modal fade search_form" id="changeVerifyOptionsModal" tabIndex="-1" aria-hidden="true" data-bs-backdrop="static">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Select a Verification Option</h5>
              <p>Choose how you want to verify your identity</p>
              <button type="button" className="btn-close" onClick={handleCloseChangeOptionsPopup} aria-label="Close"></button>
            </div>
            <div className="modal-body">
              <form className="profile_form" onSubmit={(e) => e.preventDefault()}>
                {changeAvailableMethods.map((method) => (
                  <div className="" key={method.value}>
                    <div
                      className="d-flex align-items-center justify-content-between text-white"
                      onClick={() => handleSelectChangeMethod(method)}
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

      {/* ============ CHANGE MOBILE MODAL ============ */}
      <div className="modal fade search_form" id="changeMobileModal" tabIndex="-1" aria-hidden="true" data-bs-backdrop="static">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">
                {currentStep > 1 && (<i className="ri-arrow-left-line cursor-pointer me-2" onClick={() => handleGoBack('changeMobile')}></i>)}
                Change Mobile Number
              </h5>
              <p>
                {currentStep === 1 && getChangeVerificationTitle()}
                {currentStep === 2 && 'Step 2: Enter new mobile number'}
                {currentStep === 3 && 'Step 3: Verify new mobile'}
              </p>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div className="modal-body">
              <div className="verify_authenticator_form">
                <form className="profile_form" onSubmit={(e) => e.preventDefault()}>

                  {/* Step 1: Verify identity */}
                  {currentStep === 1 && (
                    <>
                      {/* Passkey verification */}
                      {changeVerifyMethod === 'passkey' ? (
                        <div className="" style={{ textAlign: 'center' }}>
                          <form>

                            <div style={{
                              width: '80px',
                              height: '80px',
                              borderRadius: '50%',
                              background: 'rgba(255,255,255,0.1)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              margin: '0 auto 20px'
                            }}>
                              <i className="ri-fingerprint-line" style={{ fontSize: '40px', color: '#fff' }}></i>
                            </div>
                            <p className="text-white mb-3">{getChangeVerificationDescription()}</p>

                            <button
                              className="submit w-100"
                              type="button"
                              onClick={handleChangeMobileNextStep}
                              disabled={isLoading || isPasskeyVerifying}
                            >
                              {isPasskeyVerifying ? 'Authenticating...' : 'Authenticate with Passkey'}
                            </button>
                          </form>
                        </div>
                      ) : (
                        <>
                          <p style={{ marginBottom: '10px' }}>{getChangeVerificationDescription()}</p>
                          <div className="emailinput">
                            <label>Enter 6-digit Code</label>
                            <div className="d-flex">
                              <input
                                type="text"
                                placeholder="123456"
                                maxLength={6}
                                value={getChangeOtpCode()}
                                onChange={(e) => setChangeOtpCode(e.target.value.replace(/\D/g, ''))}
                              />
                              {/* Send OTP button for Email/Mobile */}
                              {changeVerifyMethod !== 'totp' && (
                                resendTimer > 0 ? (
                                  <div className="resend otp-button-disabled">Resend ({resendTimer}s)</div>
                                ) : (
                                  <button
                                    type="button"
                                    className="getotp otp-button-enabled getotp_mobile"
                                    onClick={sendChangeOtp}
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
                            disabled={isLoading || getChangeOtpCode().length < 6}
                            onClick={handleChangeMobileNextStep}
                          >
                            {isLoading ? 'Processing...' : 'Continue'}
                          </button>
                        </>
                      )}

                      {/* Switch verification option */}
                      {changeAvailableMethods.length > 1 && (
                        <div className="cursor-pointer" onClick={(e) => { e.preventDefault(); handleOpenChangeMobileOptions(); }} style={{ marginTop: '15px' }}>
                          <small className="text-white">Switch to Another Verification Option <i className="ri-external-link-line"></i></small>
                        </div>
                      )}
                    </>
                  )}

                  {/* Step 2: Enter new mobile */}
                  {currentStep === 2 && (
                    <>
                      <div className="input_block">
                        <Select
                          styles={customStyles}
                          inputId="newCountryCode"
                          name="new_country_code_select"
                          options={countriesList}
                          onChange={(selected) => setNewCountryCode(selected?.value || '+91')}
                          value={countriesList.find(option => option.value === newCountryCode)}
                          placeholder="Select country code"
                        />
                      </div>
                      <div className="emailinput" style={{ marginTop: '15px' }}>
                        <label>New Mobile Number</label>
                        <input
                          type="text"
                          placeholder="Enter new mobile number"
                          value={newMobileNumber}
                          onChange={(e) => setNewMobileNumber(e.target.value.replace(/\D/g, ''))}
                        />
                      </div>
                      <button
                        className="submit"
                        type="button"
                        disabled={isLoading}
                        onClick={handleChangeMobileNextStep}
                      >
                        {isLoading ? 'Processing...' : 'Continue'}
                      </button>
                    </>
                  )}

                  {/* Step 3: Verify new mobile */}
                  {currentStep === 3 && (
                    <>
                      <p style={{ marginBottom: '10px' }}>Click "Send OTP" to receive a code on <strong>{newCountryCode} {newMobileNumber}</strong></p>
                      <div className="emailinput">
                        <label>New Mobile Verification Code</label>
                        <div className="d-flex">
                          <input
                            type="text"
                            placeholder="123456"
                            maxLength={6}
                            value={newMobileOtpCode}
                            onChange={(e) => setNewMobileOtpCode(e.target.value.replace(/\D/g, ''))}
                          />
                          {resendTimer2 > 0 ? (
                            <div className="resend otp-button-disabled">Resend ({resendTimer2}s)</div>
                          ) : (
                            <div className="getotp cursor-pointer" onClick={() => {
                              const fullNumber = `${newCountryCode} ${newMobileNumber}`;
                              handleSendOtp('new_mobile', 'change_mobile', fullNumber).then(() => setResendTimer2(60));
                            }}>
                              Send OTP
                            </div>
                          )}
                        </div>
                      </div>
                      <button
                        className="submit"
                        type="button"
                        disabled={isLoading}
                        onClick={handleChangeMobileNextStep}
                      >
                        {isLoading ? 'Processing...' : 'Change Mobile'}
                      </button>
                    </>
                  )}

                </form>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Change Mobile Verification Options Modal */}
      <div className="modal fade search_form" id="changeMobileVerifyOptionsModal" tabIndex="-1" aria-hidden="true" data-bs-backdrop="static">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Select a Verification Option</h5>
              <p>Choose how you want to verify your identity</p>
              <button type="button" className="btn-close" onClick={handleCloseChangeMobileOptionsPopup} aria-label="Close"></button>
            </div>
            <div className="modal-body">
              <form className="profile_form" onSubmit={(e) => e.preventDefault()}>
                {changeAvailableMethods.map((method) => (
                  <div className="" key={method.value}>
                    <div
                      className="d-flex align-items-center justify-content-between text-white"
                      onClick={() => handleSelectChangeMobileMethod(method)}
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

      {/* ============ BLOCKING MODAL (Not enough security methods) ============ */}
      <div className="modal fade search_form" id="blockingModal" tabIndex="-1" aria-hidden="true" data-bs-backdrop="static">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Additional Security Required</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div className="modal-body">
              <div className="verify_authenticator_s">
                <img src="/images/noneicon.svg" alt="Security" />
                <p style={{ marginTop: '15px' }}>
                  <strong>You need at least 2 active security methods</strong> to make changes to your email or mobile number.
                </p>
                <p style={{ color: '#888', marginTop: '10px' }}>
                  This protects your account from unauthorized changes. Please enable Google Authenticator or add a mobile number first.
                </p>
              </div>
              <button
                className="submit"
                type="button"
                data-bs-dismiss="modal"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ============ DISABLE GOOGLE AUTHENTICATOR MODAL ============ */}
      <div className="modal fade search_form" id="disableGoogleAuthModal" tabIndex="-1" aria-hidden="true" data-bs-backdrop="static">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">{getDisableVerificationTitle()}</h5>
              <p>{getDisableVerificationDescription()}</p>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div className="modal-body">
              <form className="profile_form" onSubmit={(e) => e.preventDefault()}>

                {/* Passkey verification - no OTP input needed */}
                {disableAuthMethod === 4 ? (
                  <div className="" style={{ textAlign: 'center' }}>
                    <div style={{
                      width: '80px',
                      height: '80px',
                      borderRadius: '50%',
                      background: 'rgba(255,255,255,0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 20px'
                    }}>
                      <i className="ri-fingerprint-line" style={{ fontSize: '40px', color: '#fff' }}></i>
                    </div>
                    <p className="text-white mb-3">Click the button below to authenticate with your passkey</p>
                    <button
                      className="submit w-100"
                      type="button"
                      onClick={handleDisableGoogleAuthVerify}
                      disabled={isLoading || isPasskeyVerifying}
                    >
                      {isPasskeyVerifying ? 'Authenticating...' : 'Authenticate with Passkey'}
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="emailinput">
                      <label>Enter 6-digit Code</label>
                      <div className="d-flex">
                        <input
                          type="text"
                          placeholder="Enter code here..."
                          value={getDisableOtpCode()}
                          onChange={(e) => setDisableOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          maxLength={6}
                        />
                        {/* Send OTP button for Email/Mobile */}
                        {disableAuthMethod !== 2 && (
                          resendTimer > 0 ? (
                            <div className="resend otp-button-disabled">Resend ({resendTimer}s)</div>
                          ) : (
                            <button
                              type="button"
                              className="getotp otp-button-enabled getotp_mobile"
                              onClick={sendDisableOtp}
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
                      onClick={handleDisableGoogleAuthVerify}
                      disabled={isLoading || getDisableOtpCode().length < 6}
                    >
                      {isLoading ? 'Processing...' : 'Disable Google Authenticator'}
                    </button>
                  </>
                )}

                {/* Switch verification option link - only show if multiple methods */}
                {disableAvailableMethods.length > 1 && (
                  <div className="cursor-pointer" onClick={(e) => { e.preventDefault(); handleOpenDisableOptionsPopup(); }} style={{ marginTop: '15px' }}>
                    <small className="text-white">Switch to Another Verification Option <i className="ri-external-link-line"></i></small>
                  </div>
                )}

              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Verification Options Modal for Disable Flow */}
      <div className="modal fade search_form" id="disableAuthOptionsModal" tabIndex="-1" aria-hidden="true" data-bs-backdrop="static">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Select a Verification Option</h5>
              <p>Choose how you want to verify your identity</p>
              <button type="button" className="btn-close" onClick={handleCloseDisableOptionsPopup} aria-label="Close"></button>
            </div>
            <div className="modal-body">
              <form className="profile_form" onSubmit={(e) => e.preventDefault()}>

                {disableAvailableMethods.map((method) => (
                  <div className="" key={method.type}>
                    <div
                      className="d-flex align-items-center justify-content-between text-white"
                      onClick={() => handleSelectDisableMethod(method)}
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

      {/* ============ ADD EMAIL MODAL (for users who signed up with phone) ============ */}
      <div className="modal fade search_form" id="addEmailModal" tabIndex="-1" aria-hidden="true" data-bs-backdrop="static">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              {/* {((addEmailStep > 1 && hasGoogleAuth) || (addEmailStep > 2 && !hasGoogleAuth)) && (
                <button type="button" className="btn-back" onClick={() => handleGoBack('addEmail')} title="Go back">
                  <i className="ri-arrow-left-line"></i>
                </button>
              )} */}
              <h5 className="modal-title">   {((addEmailStep > 1 && hasGoogleAuth) || (addEmailStep > 2 && !hasGoogleAuth)) && (<i className="ri-arrow-left-line cursor-pointer" onClick={() => handleGoBack('addEmail')}></i>)} Add Email Address</h5>
              <p>
                {addEmailStep === 1 && hasGoogleAuth && 'Step 1: Verify Google Authenticator'}
                {addEmailStep === 2 && 'Step 2: Verify your mobile number'}
                {addEmailStep === 3 && 'Step 3: Enter your email address'}
                {addEmailStep === 4 && 'Step 4: Verify your email address'}
              </p>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div className="modal-body">
              <div className="verify_authenticator_form">
                <form className="profile_form" onSubmit={(e) => e.preventDefault()}>

                  {/* Step 1: Google Auth (if enabled) */}
                  {addEmailStep === 1 && hasGoogleAuth && (
                    <>
                      <div className="verify_authenticator_s">
                        <img src="/images/verifylock.svg" alt="Verify" />
                        <p>Enter the 6-digit code from your Google Authenticator app</p>
                      </div>
                      <div className="emailinput">
                        <label>Google Authenticator Code</label>
                        <div className="d-flex">
                          <input
                            type="text"
                            placeholder="123456"
                            maxLength={6}
                            value={googleAuthCode}
                            onChange={(e) => setGoogleAuthCode(e.target.value.replace(/\D/g, ''))}
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {/* Step 2: Mobile OTP verification */}
                  {addEmailStep === 2 && (
                    <>
                      <p style={{ marginBottom: '10px' }}>Click "Send OTP" to receive a code on <strong>{maskPhone(mobileNumber)}</strong></p>
                      <div className="emailinput">
                        <label>Mobile Verification Code</label>
                        <div className="d-flex">
                          <input
                            type="text"
                            placeholder="123456"
                            maxLength={6}
                            value={mobileOtpCode}
                            onChange={(e) => setMobileOtpCode(e.target.value.replace(/\D/g, ''))}
                          />
                          {resendTimer > 0 ? (
                            <div className="resend otp-button-disabled">Resend ({resendTimer}s)</div>
                          ) : (
                            <div className="getotp cursor-pointer" onClick={() => handleSendOtp('mobile', 'add_email').then(() => setResendTimer(60))}>
                              Send OTP
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}

                  {/* Step 3: Enter email address */}
                  {addEmailStep === 3 && (
                    <>
                      <div className="verify_authenticator_s">
                        <img src="/images/verifyemail.svg" alt="Email" />
                        <p>Enter the email address you want to add to your account</p>
                      </div>
                      <div className="emailinput">
                        <label>Email Address</label>
                        <input
                          type="email"
                          placeholder="Enter your email address"
                          value={newEmail}
                          onChange={(e) => setNewEmail(e.target.value)}
                        />
                      </div>
                    </>
                  )}

                  {/* Step 4: Verify new email OTP */}
                  {addEmailStep === 4 && (
                    <>
                      <p style={{ marginBottom: '10px' }}>Click "Send OTP" to receive a code on <strong>{newEmail}</strong></p>
                      <div className="emailinput">
                        <label>Email Verification Code</label>
                        <div className="d-flex">
                          <input
                            type="text"
                            placeholder="123456"
                            maxLength={6}
                            value={newEmailOtpCode}
                            onChange={(e) => setNewEmailOtpCode(e.target.value.replace(/\D/g, ''))}
                          />
                          {resendTimer2 > 0 ? (
                            <div className="resend otp-button-disabled">Resend ({resendTimer2}s)</div>
                          ) : (
                            <div className="getotp cursor-pointer" onClick={() => handleSendOtp('new_email', 'add_email', newEmail).then(() => setResendTimer2(60))}>
                              Send OTP
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}

                  <button
                    className="submit"
                    type="button"
                    disabled={isLoading}
                    onClick={handleAddEmailNextStep}
                  >
                    {isLoading ? 'Processing...' : addEmailStep === 4 ? 'Add Email Address' : 'Continue'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ============ SECURITY REMINDER MODAL ============ */}
      <div className="modal fade search_form" id="securityReminderModal" tabIndex="-1" aria-hidden="true" data-bs-backdrop="static">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Security Reminder</h5>
              <p>Enhance your account protection</p>
              <button type="button" className="btn-close" onClick={handleDismissSecurityPrompt} aria-label="Close"></button>
            </div>
            <div className="modal-body">
              <div className="">
                <p>
                  Your account security level is currently low. Please link at least one additional verification method to enhance security.
                </p>

              </div>

              {/* Available methods to add */}
              <form className="profile_form" onSubmit={(e) => e.preventDefault()}>
                {!hasEmail && (
                  <div className="">
                    <div
                      className="d-flex align-items-center justify-content-between text-white"
                      onClick={() => { handleDismissSecurityPrompt(); handleAddEmailStart && handleAddEmailStart(); }}
                      role="button"
                    >
                      <div className="d-flex align-items-center">
                        <i className="ri-mail-line me-3"></i>
                        <div>
                          <b>Email Verification</b>
                          <p className="mb-0 small">Link your email address</p>
                        </div>
                      </div>
                      <i className="ri-arrow-right-s-line"></i>
                    </div>
                  </div>
                )}

                {!hasMobile && (
                  <div className="">
                    <div
                      className="d-flex align-items-center justify-content-between text-white"
                      onClick={() => { handleDismissSecurityPrompt(); handleAddMobileStart && handleAddMobileStart(); }}
                      role="button"
                    >
                      <div className="d-flex align-items-center">
                        <i className="ri-smartphone-line me-3"></i>
                        <div>
                          <b>Mobile Verification</b>
                          <p className="mb-0 small">Link your mobile number</p>
                        </div>
                      </div>
                      <i className="ri-arrow-right-s-line"></i>
                    </div>
                  </div>
                )}

                {!hasGoogleAuth && (
                  <div className="">
                    <div
                      className="d-flex align-items-center justify-content-between text-white"
                      onClick={() => { handleDismissSecurityPrompt(); handleGoogleAuthStart && handleGoogleAuthStart(); }}
                      role="button"
                    >
                      <div className="d-flex align-items-center">
                        <i className="ri-shield-keyhole-line me-3"></i>
                        <div>
                          <strong>Google Authenticator</strong>
                          <p className="mb-0 small">Enable 2FA for highest security</p>
                        </div>
                      </div>
                      <i className="ri-arrow-right-s-line"></i>
                    </div>
                  </div>
                )}
                <button
                  className="submit"
                  type="button"
                  onClick={handleDismissSecurityPrompt}
                  style={{ marginTop: '15px' }}
                >
                  Remind Me Later
                </button>
              </form>


            </div>
          </div>
        </div>
      </div>

      {/* ============ ADD PASSKEY VERIFY MODAL ============ */}
      <div className="modal fade search_form" id="addPasskeyVerifyModal" tabIndex="-1" aria-hidden="true" data-bs-backdrop="static">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">{getAddPasskeyVerificationTitle()}</h5>
              <p>{getAddPasskeyVerificationDescription()}</p>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div className="modal-body">
              <form className="profile_form" onSubmit={(e) => e.preventDefault()}>

                {addPasskeyVerifyMethod === 'totp' ? (
                  <div className="emailinput">
                    <label>Authenticator Code</label>
                    <input
                      type="text"
                      placeholder="Enter 6-digit code"
                      value={addPasskeyOtpCode}
                      onChange={(e) => setAddPasskeyOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      maxLength={6}
                    />
                  </div>
                ) : (
                  <div className="emailinput">
                    <label>Verification Code</label>
                    <div className="d-flex">
                      <input
                        type="text"
                        placeholder="Enter 6-digit code"
                        value={addPasskeyOtpCode}
                        onChange={(e) => setAddPasskeyOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        maxLength={6}
                      />
                      <div
                        className={`getotp cursor-pointer ${resendTimer > 0 ? 'disabled' : ''}`}
                        onClick={() => resendTimer === 0 && handleAddPasskeySendOtp()}
                      >
                        {resendTimer > 0 ? `Resend (${resendTimer}s)` : 'GET OTP'}
                      </div>
                    </div>
                  </div>
                )}

                <button
                  className="submit"
                  type="button"
                  disabled={isLoading || !addPasskeyOtpCode || addPasskeyOtpCode.length !== 6}
                  onClick={handleAddPasskeyVerify}
                >
                  {isLoading ? 'Verifying...' : 'Verify & Continue'}
                </button>

                {addPasskeyAvailableMethods.length > 1 && (
                  <div className="cursor-pointer" onClick={() => openModal('addPasskeyVerifyOptionsModal')} style={{ marginTop: '15px' }}>
                    <small className="text-white">Switch to Another Verification Option <i className="ri-external-link-line"></i></small>
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Add Passkey Verification Options Modal */}
      <div className="modal fade search_form" id="addPasskeyVerifyOptionsModal" tabIndex="-1" aria-hidden="true" data-bs-backdrop="static">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Select a Verification Option</h5>
              <p>Choose how you want to verify your identity</p>
              <button type="button" className="btn-close" onClick={() => closeModal('addPasskeyVerifyOptionsModal')} aria-label="Close"></button>
            </div>
            <div className="modal-body">
              <form className="profile_form" onSubmit={(e) => e.preventDefault()}>
                {addPasskeyAvailableMethods.map((method) => (
                  <div className="" key={method.id}>
                    <div
                      className="d-flex align-items-center justify-content-between text-white"
                      onClick={() => {
                        setAddPasskeyVerifyMethod(method.id);
                        setAddPasskeyOtpCode('');
                        setResendTimer(0);
                        closeModal('addPasskeyVerifyOptionsModal');
                      }}
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

      {/* ============ ADD PASSKEY MODAL ============ */}
      <div className="modal fade search_form" id="addPasskeyModal" tabIndex="-1" aria-hidden="true" data-bs-backdrop="static">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">
                <i className="ri-fingerprint-line" style={{ marginRight: '8px' }}></i>
                Add Passkey
              </h5>
              <p>Set up passwordless authentication</p>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div className="modal-body">
              <div className="verify_authenticator_s">
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
                <p style={{ marginBottom: '10px' }}>
                  Passkeys provide secure, passwordless authentication using your device's built-in security features.
                </p>
                <ul style={{  fontSize: '13px', color: '#888', marginBottom: '20px' }}>
                  <li>Use Face ID, Touch ID, or Windows Hello</li>
                  <li>No passwords to remember</li>
                  <li>Protected by your device's hardware security</li>
                  <li>Works across your synced devices</li>
                </ul>
              </div>

              <form className="profile_form" onSubmit={(e) => e.preventDefault()}>
                <div className="emailinput">
                  <label>Passkey Name</label>
                  <input
                    type="text"
                    placeholder="e.g., My MacBook, iPhone"
                    value={passkeyName}
                    onChange={(e) => setPasskeyName(e.target.value)}
                    maxLength={50}
                  />
                </div>

                <button
                  className="submit"
                  type="button"
                  disabled={isLoading || !passkeyName.trim()}
                  onClick={handleRegisterPasskey}
                  style={{ marginTop: '15px' }}
                >
                  {isLoading ? 'Creating Passkey...' : 'Create Passkey'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* ============ VIEW PASSKEYS MODAL ============ */}
      <div className="modal fade search_form" id="viewPasskeysModal" tabIndex="-1" aria-hidden="true" data-bs-backdrop="static">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">
                <i className="ri-key-2-line" style={{ marginRight: '8px' }}></i>
                Registered Passkeys
              </h5>
              <p>Manage your passkeys for passwordless login</p>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div className="modal-body ">
              {passkeys.length > 0 ? (
                <div className="passkey-items">
                  {passkeys.map((passkey) => (
                    <div
                      key={passkey._id}
                      className="d-flex align-items-center justify-content-between"
                      style={{
                        padding: '12px 15px',
                        background: '#2F3542',
                        borderRadius: '8px',
                        marginBottom: '10px'
                      }}
                    >
                      <div className="passkey-info">
                        <div className="d-flex align-items-center">
                          <i className="ri-fingerprint-line" style={{ fontSize: '18px', marginRight: '10px', color: '#00c853' }}></i>
                          <div>
                            <strong style={{ color: '#fff' }}>{passkey.name}</strong>
                            <div style={{ fontSize: '11px', color: '#888' }}>
                              {passkey.deviceInfo?.browser || 'Unknown'} • {passkey.deviceInfo?.os || 'Unknown'}
                            </div>
                            <div style={{ fontSize: '11px', color: '#666' }}>
                              Added {new Date(passkey.createdAt).toLocaleDateString()}
                              {passkey.lastUsedAt && ` • Last used ${new Date(passkey.lastUsedAt).toLocaleDateString()}`}
                            </div>
                          </div>
                        </div>
                      </div>
                      <button
                        className="btn btn-sm"
                        style={{ background: '#dc3545', color: '#fff', padding: '5px 12px', borderRadius: '5px' }}
                        onClick={() => {
                          closeModal('viewPasskeysModal');
                          setTimeout(() => handleDeletePasskeyStart(passkey), 300);
                        }}
                        disabled={isLoading}
                      >
                        <i className="ri-delete-bin-line"></i>
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center" style={{ padding: '30px', color: '#888' }}>
                  <i className="ri-fingerprint-line" style={{ fontSize: '48px', marginBottom: '15px', display: 'block' }}></i>
                  <p>No passkeys registered yet</p>
                </div>
              )}
              <form onSubmit={(e) => e.preventDefault()} className="profile_form">
                <button
                  className="submit w-100"
                  type="submit"
                  onClick={() => {
                    closeModal('viewPasskeysModal');
                    setTimeout(() => handleAddPasskeyStart(), 300);
                  }}
                  disabled={isLoading}
                  style={{ marginTop: '15px' }}
                >
                  <i className="ri-add-line" style={{ marginRight: '5px' }}></i>
                  Add New Passkey
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* ============ DELETE PASSKEY MODAL ============ */}
      <div className="modal fade search_form" id="deletePasskeyModal" tabIndex="-1" aria-hidden="true" data-bs-backdrop="static">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Delete Passkey</h5>
              <p>Verify to remove "{selectedPasskey?.name}"</p>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div className="modal-body">
              <div className="verify_authenticator_s">
                <p>{getDeleteVerificationDescription()}</p>
              </div>

              <form className="profile_form" onSubmit={(e) => e.preventDefault()}>
                {/* Passkey verification - no OTP input needed */}
                {deletePasskeyMethod === 'passkey' ? (
                  <div className="" style={{ textAlign: 'center' }}>
                    <div style={{
                      width: '80px',
                      height: '80px',
                      borderRadius: '50%',
                      background: 'rgba(255,255,255,0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 20px'
                    }}>
                      <i className="ri-fingerprint-line" style={{ fontSize: '40px', color: '#fff' }}></i>
                    </div>
                    <button
                      className="submit w-100"
                      type="button"
                      onClick={handleDeletePasskey}
                      disabled={isLoading || isPasskeyVerifying}
                    >
                      {isPasskeyVerifying ? 'Authenticating...' : 'Authenticate with Passkey'}
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="emailinput">
                      <label>Enter 6-digit Code</label>
                      <div className="d-flex">
                        <input
                          type="text"
                          placeholder="Enter code here..."
                          value={deletePasskeyCode}
                          onChange={(e) => setDeletePasskeyCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          maxLength={6}
                        />
                        {/* Send OTP button for Email/Mobile */}
                        {deletePasskeyMethod !== 'totp' && (
                          resendTimer > 0 ? (
                            <div className="resend otp-button-disabled">Resend ({resendTimer}s)</div>
                          ) : (
                            <button
                              type="button"
                              className="getotp otp-button-enabled getotp_mobile"
                              onClick={() => {
                                handleSendOtp(deletePasskeyMethod, 'delete_passkey')
                                  .then(() => setResendTimer(60));
                              }}
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
                      disabled={isLoading || deletePasskeyCode.length !== 6}
                      onClick={handleDeletePasskey}
                    >
                      {isLoading ? 'Processing...' : 'Delete Passkey'}
                    </button>
                  </>
                )}

                {/* Switch verification option link - only show if multiple methods */}
                {deletePasskeyAvailableMethods.length > 1 && (
                  <div className="cursor-pointer" onClick={(e) => { e.preventDefault(); handleOpenDeletePasskeyOptions(); }} style={{ marginTop: '15px' }}>
                    <small className="text-white">Switch to Another Verification Option <i className="ri-external-link-line"></i></small>
                  </div>
                )}

              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Verification Options Modal for Delete Passkey Flow */}
      <div className="modal fade search_form" id="deletePasskeyOptionsModal" tabIndex="-1" aria-hidden="true" data-bs-backdrop="static">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Select a Verification Option</h5>
              <p>Choose how you want to verify your identity</p>
              <button type="button" className="btn-close" onClick={handleCloseDeletePasskeyOptionsPopup} aria-label="Close"></button>
            </div>
            <div className="modal-body">
              <form className="profile_form" onSubmit={(e) => e.preventDefault()}>

                {deletePasskeyAvailableMethods.map((method) => (
                  <div className="" key={method.value}>
                    <div
                      className="d-flex align-items-center justify-content-between text-white"
                      onClick={() => handleSelectDeletePasskeyMethod(method)}
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

      {/* ============ CONSENT WARNING MODALS ============ */}

      {/* Change Email Consent Modal */}
      <div className="modal fade search_form" id="changeEmailConsentModal" tabIndex="-1" aria-hidden="true" data-bs-backdrop="static">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">
                <i className="ri-error-warning-line" style={{ color: '#ffc107', marginRight: '8px' }}></i>
                Security Notice
              </h5>
              <p>Please read carefully before proceeding</p>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div className="modal-body">
              <div className="verify_authenticator_s remove_authenticator_s">
                <div style={{
                  width: '70px',
                  height: '70px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #ffc107 0%, #ff9800 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 20px'
                }}>
                  <i className="ri-mail-settings-line" style={{ fontSize: '35px', color: '#fff' }}></i>
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <p style={{ color: '#fff', marginBottom: '15px', fontSize: '14px' }}>
                    <i className="ri-information-line" style={{ color: '#ffc107', marginRight: '8px' }}></i>
                    Withdrawals and P2P transactions might be disabled for <strong>24 hours</strong> after changing your email verification to ensure the safety of your assets.
                  </p>
                  <p style={{ color: '#fff', marginBottom: '0', fontSize: '14px' }}>
                    <i className="ri-time-line" style={{ color: '#ffc107', marginRight: '8px' }}></i>
                    The old email address cannot be used to re-register for <strong>30 days</strong> after updating it.
                  </p>
                </div>
              </div>

              <form className="profile_form" onSubmit={(e) => e.preventDefault()}>
                <button
                  className="submit"
                  type="button"
                  onClick={handleChangeEmailProceed}
                >
                  I Understand, Continue
                </button>
                {/* <button
                  className="btn btn-outline w-100"
                  type="button"
                  data-bs-dismiss="modal"
                  style={{ marginTop: '10px' }}
                >
                  Cancel
                </button> */}
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Change Mobile Consent Modal */}
      <div className="modal fade search_form" id="changeMobileConsentModal" tabIndex="-1" aria-hidden="true" data-bs-backdrop="static">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">
                <i className="ri-error-warning-line" style={{ color: '#ffc107', marginRight: '8px' }}></i>
                Security Notice
              </h5>
              <p>Please read carefully before proceeding</p>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div className="modal-body">
              <div className="verify_authenticator_s">
                <div style={{
                  width: '70px',
                  height: '70px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #ffc107 0%, #ff9800 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 20px'
                }}>
                  <i className="ri-smartphone-line" style={{ fontSize: '35px', color: '#fff' }}></i>
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <p style={{ color: '#fff', marginBottom: '15px', fontSize: '14px' }}>
                    <i className="ri-information-line" style={{ color: '#ffc107', marginRight: '8px' }}></i>
                    Withdrawals and P2P transactions might be disabled for <strong>24 hours</strong> after changing your phone verification to ensure the safety of your assets.
                  </p>
                  <p style={{ color: '#fff', marginBottom: '0', fontSize: '14px' }}>
                    <i className="ri-time-line" style={{ color: '#ffc107', marginRight: '8px' }}></i>
                    The old phone number cannot be used to re-register for <strong>30 days</strong> after updating it.
                  </p>
                </div>
              </div>

              <form className="profile_form" onSubmit={(e) => e.preventDefault()}>
                <button
                  className="submit"
                  type="button"
                  onClick={handleChangeMobileProceed}
                >
                  I Understand, Continue
                </button>
                {/* <button
                  className="btn btn-outline w-100"
                  type="button"
                  data-bs-dismiss="modal"
                  style={{ marginTop: '10px' }}
                >
                  Cancel
                </button> */}
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Disable Passkey Consent Modal */}
      <div className="modal fade search_form" id="disablePasskeyConsentModal" tabIndex="-1" aria-hidden="true" data-bs-backdrop="static">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">
                <i className="ri-error-warning-line" style={{ color: '#dc3545', marginRight: '8px' }}></i>
                Are You Sure You Want to Remove Your Passkey?
              </h5>
              <p>This action affects your account security</p>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div className="modal-body">
              <div className="verify_authenticator_s remove_authenticator_s">
                <div style={{
                  width: '70px',
                  height: '70px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 20px'
                }}>
                  <i className="ri-fingerprint-line" style={{ fontSize: '35px', color: '#fff' }}></i>
                </div>
                <div style={{  marginBottom: '20px' }}>
                  <p >
                    <i className="ri-information-line" style={{ color: '#dc3545', marginRight: '8px' }}></i>
                    Withdrawals and P2P transactions might be disabled for <strong>24 hours</strong> after removing your passkey to ensure the safety of your assets, based on our assessment of your risk level.
                  </p>
                  <p>
                    <i className="ri-shield-check-line" style={{ color: '#28a745', marginRight: '8px' }}></i>
                    Passkeys give good protection to your account and assets. <strong>We recommend that you keep using passkeys.</strong>
                  </p>
                </div>
              </div>

              <form className="profile_form" onSubmit={(e) => e.preventDefault()}>
                <button
                  className="submit"
                  type="button"
                  onClick={handleDeletePasskeyProceed}
                >
                  Remove Passkey Anyway
                </button>
            
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Disable Google Authenticator Consent Modal */}
      <div className="modal fade search_form" id="disableGoogleAuthConsentModal" tabIndex="-1" aria-hidden="true" data-bs-backdrop="static">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">
                Are You Sure You Want to Disable Authenticator?
              </h5>
              <p>This action affects your account security</p>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div className="modal-body">
              <div className="verify_authenticator_s remove_authenticator_s">
                <div style={{
                  width: '70px',
                  height: '70px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 20px'
                }}>
                  <i className="ri-shield-keyhole-line" style={{ fontSize: '35px', color: '#fff' }}></i>
                </div>
                <div >
                  <p >
                    <i className="ri-information-line text-danger  mx-2" ></i>
                    Withdrawals and P2P transactions might be disabled for <strong>24 hours</strong> after removing your authenticator app verification to ensure the safety of your assets.
                  </p>
                  <p >
                    <i className="ri-shield-check-line text-warning mx-2" ></i>
                    Two security verification methods are required for withdrawals and other actions. <strong>Using only one verification method will put your account at greater risk.</strong>
                  </p>
                </div>
              </div>

              <form className="profile_form" onSubmit={(e) => e.preventDefault()}>
                <button
                  className="submit"
                  type="button"
                  onClick={handleDisableGoogleAuthProceed}
                >
                  Disable Authenticator Anyway
                </button>

              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default TwofactorPage;
