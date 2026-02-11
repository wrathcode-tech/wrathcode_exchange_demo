import React, { useState, useEffect, useRef, useContext } from "react";
import { alertErrorMessage, alertSuccessMessage } from "../../../customComponents/CustomAlertMessage";
import AuthService from "../../../api/services/AuthService";
import { ProfileContext } from "../../../context/ProfileProvider";
import LoaderHelper from "../../../customComponents/Loading/LoaderHelper";
import moment from "moment";
import { startAuthentication } from "@simplewebauthn/browser";

const KycPage = (props) => {
    const { handleUserDetails } = useContext(ProfileContext);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);

    // =========================================================================
    // STATE - User Details
    // =========================================================================
    const [emailId, setEmailId] = useState("");
    const [mobileNumber, setMobileNumber] = useState("");
    const [kycVerfied, setKycVerfied] = useState("");
    const [reason, setReason] = useState("");
    const [documentsToResubmit, setDocumentsToResubmit] = useState([]);
    const [needsResubmission, setNeedsResubmission] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false); // Submission in progress flag
    const [isResubmitFlow, setIsResubmitFlow] = useState(false); // Track if we're in resubmission flow for verification options modal

    // Individual document statuses from backend
    const [idDocStatus, setIdDocStatus] = useState(null);
    const [taxDocStatus, setTaxDocStatus] = useState(null);
    const [selfieStatus, setSelfieStatus] = useState(null);

    // Document types user submitted (e.g., "AADHAAR", "PAN", "PASSPORT")
    const [submittedIdDocType, setSubmittedIdDocType] = useState(null);
    const [submittedTaxDocType, setSubmittedTaxDocType] = useState(null);

    // Existing document numbers for resubmission (user can edit)
    const [existingIdDocNumber, setExistingIdDocNumber] = useState('');
    const [existingTaxDocNumber, setExistingTaxDocNumber] = useState('');
    const [existingCountryCode, setExistingCountryCode] = useState('');

    // Resubmission form state for document numbers
    const [resubmitIdNumber, setResubmitIdNumber] = useState('');
    const [resubmitTaxNumber, setResubmitTaxNumber] = useState('');

    // =========================================================================
    // STATE - Countries and KYC Config from Backend
    // =========================================================================
    const [countries, setCountries] = useState([]);
    const [kycConfig, setKycConfig] = useState(null);
    const [loadingConfig, setLoadingConfig] = useState(false);

    // =========================================================================
    // STATE - Modal Form Fields
    // =========================================================================
    const [modalStep, setModalStep] = useState(0); // For main KYC modal
    const [resubmitStep, setResubmitStep] = useState(0); // For resubmit modal - separate state
    const [modalTitle, setModalTitle] = useState("Select Country and ID Type"); // Modal title state
    const [modalCountry, setModalCountry] = useState("");
    const [modalIdType, setModalIdType] = useState("");
    const [modalTaxType, setModalTaxType] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [infoDob, setInfoDob] = useState("");
    const [gender, setGender] = useState("male");
    const [address, setAddress] = useState("");
    const [city, setCity] = useState("");
    const [infoState, setInfoState] = useState("");
    const [zipCode, setZipCode] = useState("");
    const [aadhar, setAadhar] = useState(""); // ID document number
    const [panCard, setPanCard] = useState(""); // Tax document number

    // =========================================================================
    // STATE - File Uploads
    // =========================================================================
    const [localFront, setLocalFront] = useState("");
    const [localBack, setLocalBack] = useState("");
    const [localPanCard, setLocalPanCard] = useState("");
    const [localSelfie, setLocalSelfie] = useState("");
    const [previewImages, setPreviewImages] = useState({ selfie: "", doc_front: "", doc_back: "", pan: "" });

    // =========================================================================
    // STATE - Camera / Selfie
    // =========================================================================
    const [isCameraActive, setIsCameraActive] = useState(false);
    const [isCameraReady, setIsCameraReady] = useState(false);
    const [cameraError, setCameraError] = useState("");
    const [selfieCaptured, setSelfieCaptured] = useState(false);

    // =========================================================================
    // STATE - Validation Errors
    // =========================================================================
    const [documentNumberError, setDocumentNumberError] = useState("");
    const [taxDocumentError, setTaxDocumentError] = useState("");

    // =========================================================================
    // STATE - OTP & Verification
    // =========================================================================
    const [emailOtp, setemailOtp] = useState("");
    const [selectedAuthMethod, setSelectedAuthMethod] = useState(1);
    const [modalOtpTimer, setModalOtpTimer] = useState(0);
    const [availableVerifyMethods, setAvailableVerifyMethods] = useState([]);
    const [isPasskeyVerifying, setIsPasskeyVerifying] = useState(false);
    const [passkeySupported, setPasskeySupported] = useState(false);

    // =========================================================================
    // STATE - FAQ
    // =========================================================================
    const [activeIndex, setActiveIndex] = useState(null);

    // =========================================================================
    // EFFECTS
    // =========================================================================

    // Initialize from props
    useEffect(() => {
        if (props?.userDetails) {
            const user = props.userDetails;
            setEmailId(user.emailId || "");
            // Store mobile number with country code (same as TwofactorPage)
            setMobileNumber(`${user.country_code || ''} ${user.mobileNumber || ''}`.trim());
            setKycVerfied(user.kycVerified);
            setReason(user.kyc_reject_reason || "");
            setFirstName(user.firstName || "");
            setLastName(user.lastName || "");

            // Build available verification methods
            const methods = [];
            if (user.emailId) methods.push({ type: 1, label: "Email OTP" });
            if (user["2fa"]) methods.push({ type: 2, label: "Google Authenticator" });
            if (user.mobileNumber) methods.push({ type: 3, label: "Mobile OTP" });
            setAvailableVerifyMethods(methods);

            if (methods.length > 0) setSelectedAuthMethod(methods[0].type);
        }
    }, [props?.userDetails]);

    // Fetch countries on mount
    useEffect(() => {
        fetchCountries();
        fetchKycStatus();
        checkPasskeySupport();
    }, []);

    // OTP timer countdown
    useEffect(() => {
        if (modalOtpTimer > 0) {
            const timer = setTimeout(() => setModalOtpTimer(modalOtpTimer - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [modalOtpTimer]);

    // Cleanup camera on unmount
    useEffect(() => {
        return () => stopCamera();
    }, []);

    // Fetch KYC config when country changes
    useEffect(() => {
        if (modalCountry) {
            fetchKycConfig(modalCountry);
        } else {
            setKycConfig(null);
            setModalIdType("");
            setModalTaxType("");
        }
    }, [modalCountry]);

    // Handle Bootstrap modal events for kycModal
    useEffect(() => {
        const kycModal = document.getElementById('kycModal');
        if (!kycModal) return;

        // When modal is hidden (closed), reset if fully closing (not transitioning)
        const handleHidden = () => {
            // Only reset if we're not going to verification modal
            // Check if verification modal is about to show
            const verifyModal = document.getElementById('kycVerificationModal');
            const isVerifyModalShowing = verifyModal?.classList.contains('show');
            if (!isVerifyModalShowing) {
                // Modal was fully closed, reset form
                // Don't reset here - let user data persist until explicit reset
            }
        };

        kycModal.addEventListener('hidden.bs.modal', handleHidden);
        return () => kycModal.removeEventListener('hidden.bs.modal', handleHidden);
    }, []);

    // Update modal title when modalStep changes
    useEffect(() => {
        const stepTitles = [
            'Select Country and ID Type',
            'Personal Details',
            'Take a Photo of Your ID Card',
            'Income Tax & Selfie',
            'Face Verification',
            'Review Your Information'
        ];
        if (stepTitles[modalStep]) {
            setModalTitle(stepTitles[modalStep]);
        }
    }, [modalStep]);

    // =========================================================================
    // API CALLS
    // =========================================================================

    const fetchCountries = async () => {
        try {
            const result = await AuthService.getCountries();
            if (result?.success && result?.data) {
                setCountries(result.data);
            }
        } catch (error) {
            console.error("Failed to fetch countries:", error);
        }
    };

    const fetchKycConfig = async (countryCode) => {
        setLoadingConfig(true);
        try {
            const result = await AuthService.getKycConfig(countryCode);
            if (result?.success && result?.data) {
                setKycConfig(result.data);
                setModalIdType("");
                setModalTaxType("");
                setAadhar("");
                setPanCard("");
                setDocumentNumberError("");
                setTaxDocumentError("");
            } else {
                setKycConfig(null);
            }
        } catch (error) {
            console.error("Failed to fetch KYC config:", error);
            setKycConfig(null);
        } finally {
            setLoadingConfig(false);
        }
    };

    const fetchKycStatus = async () => {
        try {
            const result = await AuthService.getKycStatus();
            if (result?.success && result?.data) {
                const data = result.data;

                // Store individual document statuses
                setIdDocStatus(data.id_document_status || null);
                setTaxDocStatus(data.tax_document_status || null);
                setSelfieStatus(data.selfie_status || null);

                // Store document types user submitted
                if (data.kyc_data) {
                    setSubmittedIdDocType(data.kyc_data.id_document_type || null);
                    setSubmittedTaxDocType(data.kyc_data.tax_document_type || null);
                    setExistingCountryCode(data.kyc_data.country_code || '');

                    // Store existing document numbers for resubmission
                    if (data.kyc_data.id_document_number) {
                        setExistingIdDocNumber(data.kyc_data.id_document_number);
                        setResubmitIdNumber(data.kyc_data.id_document_number);
                    }
                    if (data.kyc_data.tax_document_number) {
                        setExistingTaxDocNumber(data.kyc_data.tax_document_number);
                        setResubmitTaxNumber(data.kyc_data.tax_document_number);
                    }
                }

                if (data.needs_resubmission) {
                    setNeedsResubmission(true);
                    setDocumentsToResubmit(data.documents_needing_resubmission || []);
                } else {
                    setNeedsResubmission(false);
                    setDocumentsToResubmit([]);
                }
            }
        } catch (error) {
            console.error("Failed to fetch KYC status:", error);
        }
    };

    const checkPasskeySupport = async () => {
        try {
            // First check if WebAuthn API exists
            if (!window.PublicKeyCredential) {
                setPasskeySupported(false);
                return;
            }
            
            // Detect iOS/iPadOS
            const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                          (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
            
            // Detect Safari on iOS
            const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
            
            const available = await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
            
            // On iOS Safari 16+, passkeys are supported even if this returns false sometimes
            if (!available && isIOS && isSafari) {
                // Check iOS version - passkeys require iOS 16+
                const match = navigator.userAgent.match(/OS (\d+)_/);
                const iosVersion = match ? parseInt(match[1], 10) : 0;
                
                if (iosVersion >= 16) {
                    console.log('iOS 16+ detected, enabling passkey support');
                    setPasskeySupported(true);
                    return;
                }
            }
            
            setPasskeySupported(available);
        } catch (e) {
            // If check fails on iOS Safari, still allow trying passkeys
            const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                          (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
            const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
            
            if (isIOS && isSafari) {
                console.log('Passkey check failed on iOS Safari, allowing anyway');
                setPasskeySupported(true);
                return;
            }
            setPasskeySupported(false);
        }
    };

    // =========================================================================
    // MODAL NAVIGATION
    // =========================================================================

    // Main KYC modal has 6 steps (0-5)
    const TOTAL_MAIN_MODAL_STEPS = 6;
    
    const nextModalStep = () => {
        setModalStep((prevStep) => {
            if (prevStep < TOTAL_MAIN_MODAL_STEPS - 1) {
                return prevStep + 1;
            }
            return prevStep;
        });
    };

    const prevModalStep = () => {
        setModalStep((prevStep) => {
            if (prevStep > 0) {
                return prevStep - 1;
            }
            return prevStep;
        });
    };

    const resetModalForm = () => {
        setModalStep(0);
        setModalTitle("Select Country and ID Type");
        setModalCountry("");
        setModalIdType("");
        setModalTaxType("");
        setAadhar("");
        setPanCard("");
        setLocalFront("");
        setLocalBack("");
        setLocalPanCard("");
        setLocalSelfie("");
        setPreviewImages({ selfie: "", doc_front: "", doc_back: "", pan: "" });
        stopCamera();
        setIsCameraActive(false);
        setIsCameraReady(false);
        setCameraError("");
        setSelfieCaptured(false);
        setDocumentNumberError("");
        setTaxDocumentError("");
        setemailOtp("");
        setModalOtpTimer(0);
        setIsPasskeyVerifying(false);
        setKycConfig(null);
    };

    // Open resubmit modal with only rejected documents
    const openResubmitModal = () => {
        setResubmitStep(0); // Use separate state for resubmit modal
        setIsResubmitFlow(true); // Mark as resubmit flow for verification options modal

        // Reset document numbers to existing values
        setResubmitIdNumber(existingIdDocNumber);
        setResubmitTaxNumber(existingTaxDocNumber);

        // Clear previous uploads
        setLocalFront("");
        setLocalBack("");
        setLocalPanCard("");
        setLocalSelfie("");
        setPreviewImages({ selfie: "", doc_front: "", doc_back: "", pan: "" });

        // Open the modal
        const modalElement = document.getElementById('kycResubmitModal');
        if (modalElement) {
            const modal = new window.bootstrap.Modal(modalElement);
            modal.show();
        }
    };

    // Open KYC modal fresh (reset form and start from step 0)
    const openKycModalFresh = () => {
        resetModalForm();
        setModalStep(0);
        const modalElement = document.getElementById('kycModal');
        if (modalElement) {
            const modal = new window.bootstrap.Modal(modalElement);
            modal.show();
        }
    };

    // =========================================================================
    // VALIDATION (using backend regex)
    // =========================================================================

    const normalizeDocNumber = (value) => {
        if (!value || typeof value !== 'string') return '';
        return value.trim().toUpperCase().replace(/\s/g, '');
    };

    const validateDocNumber = (value, config) => {
        if (!config) return { valid: false, message: 'Document config not found' };
        const normalized = normalizeDocNumber(value);
        if (!normalized) return { valid: false, message: 'Document number is required' };
        if (normalized.length < config.min) return { valid: false, message: `Minimum ${config.min} characters required` };
        if (normalized.length > config.max) return { valid: false, message: `Maximum ${config.max} characters allowed` };
        try {
            const regex = new RegExp(config.regex);
            if (!regex.test(normalized)) return { valid: false, message: 'Invalid format' };
        } catch (e) {
            return { valid: false, message: 'Validation error' };
        }
        return { valid: true, normalized };
    };

    const validateModalStep0 = () => {
        let isValid = true;
        const countryError = document.getElementById('countryError');
        const idTypeError = document.getElementById('idTypeError');

        if (!modalCountry) {
            if (countryError) countryError.classList.remove('d-none');
            isValid = false;
        } else {
            if (countryError) countryError.classList.add('d-none');
        }

        if (!modalIdType) {
            if (idTypeError) idTypeError.classList.remove('d-none');
            isValid = false;
        } else {
            if (idTypeError) idTypeError.classList.add('d-none');
        }

        return isValid;
    };

    const handleDocumentNumberChange = (value) => {
        const normalized = value.toUpperCase().replace(/\s/g, '');
        setAadhar(normalized);

        if (kycConfig && modalIdType) {
            const docConfig = kycConfig.id_documents.find(d => d.code === modalIdType);
            if (docConfig && normalized.length >= docConfig.min) {
                const validation = validateDocNumber(normalized, docConfig);
                if (!validation.valid) {
                    setDocumentNumberError(validation.message);
                } else {
                    setDocumentNumberError("");
                }
            } else {
                setDocumentNumberError("");
            }
        }
    };

    const handlePanCardChange = (value) => {
        const normalized = value.toUpperCase().replace(/\s/g, '');
        setPanCard(normalized);

        if (kycConfig && modalTaxType) {
            const taxConfig = kycConfig.tax_documents.find(d => d.code === modalTaxType);
            if (taxConfig && normalized.length >= taxConfig.min) {
                const validation = validateDocNumber(normalized, taxConfig);
                if (!validation.valid) {
                    setTaxDocumentError(validation.message);
                } else {
                    setTaxDocumentError("");
                }
            } else {
                setTaxDocumentError("");
            }
        }
    };

    // =========================================================================
    // FILE HANDLERS
    // =========================================================================

    const validateFileUpload = (file) => {
        if (!file) return { valid: false, message: 'No file selected' };
        const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
        if (!allowedTypes.includes(file.type)) {
            return { valid: false, message: 'Only PNG, JPEG, and JPG files are allowed' };
        }
        if (file.size > 5 * 1024 * 1024) {
            return { valid: false, message: 'File size must be less than 5MB' };
        }
        return { valid: true };
    };

    const handleChangeIdentity = (event) => {
        const file = event.target.files[0];
        const validation = validateFileUpload(file);
        if (!validation.valid) {
            alertErrorMessage(validation.message);
            return;
        }
        setLocalFront(file);
        setPreviewImages(prev => ({ ...prev, doc_front: URL.createObjectURL(file) }));
    };

    const handleChangeIdentity2 = (event) => {
        const file = event.target.files[0];
        const validation = validateFileUpload(file);
        if (!validation.valid) {
            alertErrorMessage(validation.message);
            return;
        }
        setLocalBack(file);
        setPreviewImages(prev => ({ ...prev, doc_back: URL.createObjectURL(file) }));
    };

    const handleChangePanCard = (event) => {
        const file = event.target.files[0];
        const validation = validateFileUpload(file);
        if (!validation.valid) {
            alertErrorMessage(validation.message);
            return;
        }
        setLocalPanCard(file);
        setPreviewImages(prev => ({ ...prev, pan: URL.createObjectURL(file) }));
    };

    // Generic file change handler for resubmit modal
    const handleFileChange = (event, type) => {
        const file = event.target.files[0];
        if (!file) return;

        const validation = validateFileUpload(file);
        if (!validation.valid) {
            alertErrorMessage(validation.message);
            return;
        }

        if (type === 'id_front') {
            setLocalFront(file);
            setPreviewImages(prev => ({ ...prev, doc_front: URL.createObjectURL(file) }));
        } else if (type === 'id_back') {
            setLocalBack(file);
            setPreviewImages(prev => ({ ...prev, doc_back: URL.createObjectURL(file) }));
        } else if (type === 'pan') {
            setLocalPanCard(file);
            setPreviewImages(prev => ({ ...prev, pan: URL.createObjectURL(file) }));
        }
    };

    // =========================================================================
    // CAMERA / SELFIE
    // =========================================================================

    const startCamera = async () => {
        try {
            setCameraError("");
            setIsCameraReady(false);

            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                setCameraError("Camera not supported on this device");
                return;
            }

            // Set camera active first so the video element renders
            setIsCameraActive(true);

            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } }
            });

            streamRef.current = stream;

            // Wait a bit for the video element to be rendered
            setTimeout(() => {
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.onloadedmetadata = () => {
                        if (videoRef.current) {
                            videoRef.current.play().then(() => {
                                setIsCameraReady(true);
                            }).catch((err) => {
                                console.error("Video play error:", err);
                                setIsCameraReady(true); // Still set ready even if autoplay fails
                            });
                        }
                    };
                    // Fallback - if onloadedmetadata doesn't fire, check after a delay
                    setTimeout(() => {
                        if (videoRef.current && videoRef.current.srcObject && !isCameraReady) {
                            setIsCameraReady(true);
                        }
                    }, 1000);
                }
            }, 100);

        } catch (error) {
            console.error("Camera error:", error);
            setIsCameraActive(false);
            if (error.name === "NotAllowedError") {
                setCameraError("Camera permission denied. Please allow camera access.");
            } else if (error.name === "NotFoundError") {
                setCameraError("No camera found on this device.");
            } else {
                setCameraError("Failed to access camera. Please try again.");
            }
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        setIsCameraActive(false);
        setIsCameraReady(false);
    };

    const capturePhoto = () => {
        if (!videoRef.current || !canvasRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0);

        canvas.toBlob((blob) => {
            if (blob) {
                const file = new File([blob], "selfie.jpg", { type: "image/jpeg" });
                setLocalSelfie(file);
                setPreviewImages(prev => ({ ...prev, selfie: URL.createObjectURL(blob) }));
                setSelfieCaptured(true);
                stopCamera();
            }
        }, "image/jpeg", 0.9);
    };

    const retakeSelfie = () => {
        setLocalSelfie("");
        setPreviewImages(prev => ({ ...prev, selfie: "" }));
        setSelfieCaptured(false);
        startCamera();
    };

    // =========================================================================
    // OTP HANDLING
    // =========================================================================

    const handleGetOtp = async () => {
        try {
            // Determine target and type based on selected auth method
            // selectedAuthMethod: 1 = Email OTP, 2 = Google Auth (no OTP), 3 = Mobile OTP
            let target, sendType;

            if (selectedAuthMethod === 1) {
                // Email OTP
                target = emailId;
                sendType = 1; // Email type
            } else if (selectedAuthMethod === 3) {
                // Mobile OTP
                target = mobileNumber;
                sendType = 3; // Mobile type
            } else {
                return; // Google Auth doesn't need OTP
            }

            const result = await AuthService.getOtp(target, sendType);
            if (result?.success) {
                alertSuccessMessage("OTP sent successfully");
            } else {
                alertErrorMessage(result?.message || "Failed to send OTP");
            }
        } catch (error) {
            alertErrorMessage(error?.message || "Failed to send OTP");
        }
    };

    // =========================================================================
    // PASSKEY VERIFICATION
    // =========================================================================

    const handlePasskeyVerification = async () => {
        setIsPasskeyVerifying(true);
        try {
            const optionsResult = await AuthService.passkeyGetAuthOptions(emailId);
            if (optionsResult?.success && optionsResult?.data) {
                const authResult = await startAuthentication(optionsResult.data);
                const verifyResult = await AuthService.passkeyVerifyAuth(emailId, authResult);
                if (verifyResult?.success) {
                    setemailOtp(verifyResult.data?.verificationToken || verifyResult.data?.userId || 'passkey_verified');
                    alertSuccessMessage("Passkey verified successfully");
                    return true;
                }
            }
            alertErrorMessage("Passkey verification failed");
            return false;
        } catch (error) {
            alertErrorMessage(error?.message || "Passkey verification failed");
            return false;
        } finally {
            setIsPasskeyVerifying(false);
        }
    };

    // =========================================================================
    // KYC SUBMIT
    // =========================================================================

    const handleOpenKycVerification = async () => {
        // Try passkey first if available
        if (passkeySupported && availableVerifyMethods.find(m => m.type === 4)) {
            setSelectedAuthMethod(4);
            setIsPasskeyVerifying(true);

            try {
                const optionsResult = await AuthService.passkeyGetAuthOptions(emailId);
                if (optionsResult?.success && optionsResult?.data) {
                    const authResult = await startAuthentication(optionsResult.data);
                    const verifyResult = await AuthService.passkeyVerifyAuth(emailId, authResult);

                    if (verifyResult?.success) {
                        setemailOtp(verifyResult.data?.verificationToken || verifyResult.data?.userId || 'passkey_verified');
                        setIsPasskeyVerifying(false);
                        handleModalKycSubmit();
                        return;
                    }
                }
            } catch (error) {
                console.error("Passkey auto-verify failed:", error);
            }
            setIsPasskeyVerifying(false);
        }

        // Close KYC modal first, then show verification modal after it's hidden
        const kycModalElement = document.getElementById('kycModal');
        const kycModal = window.bootstrap?.Modal?.getInstance(kycModalElement);
        
        if (kycModal) {
            // Add one-time event listener to show verification modal after KYC modal is hidden
            const showVerifyAfterHide = () => {
                const verifyModalElement = document.getElementById('kycVerificationModal');
                if (verifyModalElement) {
                    const verifyModal = new window.bootstrap.Modal(verifyModalElement);
                    verifyModal.show();
                }
                kycModalElement.removeEventListener('hidden.bs.modal', showVerifyAfterHide);
            };
            kycModalElement.addEventListener('hidden.bs.modal', showVerifyAfterHide);
            kycModal.hide();
        } else {
            // KYC modal not open, just show verification modal
            const verifyModalElement = document.getElementById('kycVerificationModal');
            if (verifyModalElement) {
                const verifyModal = new window.bootstrap.Modal(verifyModalElement);
                verifyModal.show();
            }
        }
    };
    
    // Go back from verification modal to KYC modal Step 5
    const handleBackFromVerification = () => {
        // Hide verification modal first
        const verifyModalElement = document.getElementById('kycVerificationModal');
        const verifyModal = window.bootstrap?.Modal?.getInstance(verifyModalElement);
        
        if (verifyModal) {
            // Add one-time event listener to show KYC modal after verification modal is hidden
            const showKycAfterHide = () => {
                setModalStep(5); // Set to Review step
                const kycModalElement = document.getElementById('kycModal');
                if (kycModalElement) {
                    const kycModal = new window.bootstrap.Modal(kycModalElement);
                    kycModal.show();
                }
                verifyModalElement.removeEventListener('hidden.bs.modal', showKycAfterHide);
            };
            verifyModalElement.addEventListener('hidden.bs.modal', showKycAfterHide);
            verifyModal.hide();
        }
    };

    const handleModalKycSubmit = async () => {
        const formData = new FormData();

        // Get country name from countries list
        const selectedCountry = countries.find(c => c.code === modalCountry);
        const countryName = selectedCountry?.name || modalCountry;

        // Personal info
        formData.append("first_name", firstName.trim());
        formData.append("last_name", lastName.trim());
        formData.append("gender", gender);
        formData.append("date_of_birth", infoDob);
        formData.append("nationality", countryName);

        // Address
        formData.append("address_line1", address.trim());
        formData.append("city", city.trim());
        formData.append("state", infoState.trim());
        formData.append("postal_code", zipCode.trim().toUpperCase());
        formData.append("country_code", modalCountry);
        formData.append("country_name", countryName);

        // ID Document
        formData.append("id_document_type", modalIdType);
        formData.append("id_document_number", normalizeDocNumber(aadhar));
        formData.append("id_front_image", localFront);
        if (localBack) formData.append("id_back_image", localBack);

        // Tax Document
        formData.append("tax_document_type", modalTaxType);
        formData.append("tax_document_number", normalizeDocNumber(panCard));
        formData.append("tax_document_image", localPanCard);

        // Selfie
        formData.append("selfie_image", localSelfie);
        formData.append("selfie_capture_method", "camera");
        formData.append("selfie_device_info", navigator.userAgent);

        // Verification
        formData.append("verification_code", emailOtp);
        formData.append("verification_method", selectedAuthMethod === 1 ? "email_otp" : selectedAuthMethod === 2 ? "2fa" : selectedAuthMethod === 3 ? "sms_otp" : "passkey");

        // Resubmission - only for PARTIAL rejection (kycVerfied === 4) where specific documents need resubmission
        // For FULL rejection (kycVerfied === 3), submit as fresh KYC (no is_resubmission flag)
        // The backend will replace the entire KYC record for fresh submissions
        const isPartialRejection = kycVerfied === 4 || kycVerfied === "4";
        const validDocsToResubmit = documentsToResubmit.filter(d => d && d.type);
        
        if (isPartialRejection && needsResubmission && validDocsToResubmit.length > 0) {
            formData.append("is_resubmission", "true");
            // Send specific resubmitting flags that backend expects
            validDocsToResubmit.forEach(doc => {
                if (doc.type === 'id_document') {
                    formData.append("resubmitting_id_document", "true");
                } else if (doc.type === 'tax_document') {
                    formData.append("resubmitting_tax_document", "true");
                } else if (doc.type === 'selfie') {
                    formData.append("resubmitting_selfie", "true");
                }
            });
        }

        try {
            LoaderHelper.loaderStatus(true);
            const result = await AuthService.addkyc(formData);
            if (result?.success) {
                alertSuccessMessage(result?.message || "KYC submitted successfully");

                // Close all KYC modals
                const verifyModalElement = document.getElementById('kycVerificationModal');
                if (verifyModalElement) {
                    const verifyModal = window.bootstrap?.Modal?.getInstance(verifyModalElement);
                    if (verifyModal) verifyModal.hide();
                }

                const kycModalElement = document.getElementById('kycModal');
                if (kycModalElement) {
                    const kycModal = window.bootstrap?.Modal?.getInstance(kycModalElement);
                    if (kycModal) kycModal.hide();
                }

                // Remove any modal backdrops
                document.body.classList.remove('modal-open');
                document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());

                // Show success modal
                const submitModalElement = document.getElementById('kycSubmitModal');
                if (submitModalElement) {
                    setTimeout(() => {
                        const submitModal = new window.bootstrap.Modal(submitModalElement);
                        submitModal.show();
                    }, 400);
                }

                resetModalForm();
                handleUserDetails();
            } else {
                // On error, just show error message - don't close modals
                alertErrorMessage(result?.message || "Failed to submit KYC. Please try again.");
            }
        } catch (error) {
            console.error("Error in handleModalKycSubmit:", error);
            // On error, just show error message - don't close modals
            alertErrorMessage(error?.response?.data?.message || error?.message || "An error occurred. Please try again.");
        } finally {
            LoaderHelper.loaderStatus(false);
        }
    };

    // =========================================================================
    // RESUBMIT KYC (partial - only rejected documents)
    // =========================================================================

    const handleResubmitKyc = async () => {
        setIsSubmitting(true);

        try {
            const formData = new FormData();

            // Always mark as resubmission
            formData.append("is_resubmission", "true");

            // Add verification info
            formData.append("verification_code", emailOtp);
            formData.append("verification_method", selectedAuthMethod === 1 ? "email_otp" : selectedAuthMethod === 2 ? "2fa" : selectedAuthMethod === 3 ? "sms_otp" : "passkey");

            // Add country code and document types for validation
            if (existingCountryCode) {
                formData.append("country_code", existingCountryCode);
            }

            // Only add documents that need resubmission
            if (needsIdDocResubmit()) {
                formData.append("resubmitting_id_document", "true");
                formData.append("id_front_image", localFront);
                if (localBack) formData.append("id_back_image", localBack);

                // Include document number (even if unchanged, for validation)
                if (resubmitIdNumber) {
                    formData.append("id_document_number", resubmitIdNumber.trim());
                    formData.append("id_document_type", submittedIdDocType);
                }
            }

            if (needsTaxDocResubmit()) {
                formData.append("resubmitting_tax_document", "true");
                formData.append("tax_document_image", localPanCard);

                // Include document number (even if unchanged, for validation)
                if (resubmitTaxNumber) {
                    formData.append("tax_document_number", resubmitTaxNumber.trim());
                    formData.append("tax_document_type", submittedTaxDocType);
                }
            }

            if (needsSelfieResubmit()) {
                formData.append("resubmitting_selfie", "true");
                formData.append("selfie_image", localSelfie);
                formData.append("selfie_capture_method", "camera");
                formData.append("selfie_device_info", navigator.userAgent);
            }

            LoaderHelper.loaderStatus(true);
            const result = await AuthService.addkyc(formData);

            if (result?.success) {
                alertSuccessMessage(result?.message || "Documents resubmitted successfully");

                // Close resubmit modal
                const resubmitModalElement = document.getElementById('kycResubmitModal');
                if (resubmitModalElement) {
                    const resubmitModal = window.bootstrap?.Modal?.getInstance(resubmitModalElement);
                    if (resubmitModal) resubmitModal.hide();
                }

                // Clean up
                document.body.classList.remove('modal-open');
                document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());

                // Show success modal
                const submitModalElement = document.getElementById('kycSubmitModal');
                if (submitModalElement) {
                    setTimeout(() => {
                        const submitModal = new window.bootstrap.Modal(submitModalElement);
                        submitModal.show();
                    }, 400);
                }

                resetModalForm();
                setNeedsResubmission(false);
                setDocumentsToResubmit([]);
                handleUserDetails();
                fetchKycStatus();
            } else {
                alertErrorMessage(result?.message || "Failed to resubmit documents. Please try again.");
            }
        } catch (error) {
            console.error("Error in handleResubmitKyc:", error);
            alertErrorMessage(error?.response?.data?.message || error?.message || "An error occurred. Please try again.");
        } finally {
            LoaderHelper.loaderStatus(false);
            setIsSubmitting(false);
        }
    };

    const handlePasskeyResubmit = async () => {
        setIsPasskeyVerifying(true);
        try {
            // Simulate passkey verification (integrate with actual passkey logic)
            const credential = await navigator.credentials.get({
                publicKey: {
                    challenge: new Uint8Array(32),
                    timeout: 60000,
                    userVerification: 'required',
                    rpId: window.location.hostname
                }
            });

            if (credential) {
                setemailOtp("passkey_verified");
                await handleResubmitKyc();
            }
        } catch (error) {
            console.error("Passkey verification failed:", error);
            alertErrorMessage("Passkey verification failed. Please try again or use another method.");
        } finally {
            setIsPasskeyVerifying(false);
        }
    };

    // =========================================================================
    // HELPERS
    // =========================================================================

    const getKycVerificationTitle = () => {
        if (selectedAuthMethod === 1) return "Email OTP Verification";
        if (selectedAuthMethod === 2) return "Google Authenticator";
        if (selectedAuthMethod === 3) return "Mobile OTP Verification";
        if (selectedAuthMethod === 4) return "Passkey Verification";
        return "Security Verification";
    };

    const getKycVerificationDescription = () => {
        if (selectedAuthMethod === 1) return `Enter the 6-digit code sent to ${emailId || 'your email'}`;
        if (selectedAuthMethod === 2) return 'Enter the 6-digit code from Google Authenticator app';
        if (selectedAuthMethod === 3) return `Enter the 6-digit code sent to ${mobileNumber || 'your phone'}`;
        if (selectedAuthMethod === 4) return 'Use Face ID, Touch ID, or Windows Hello to verify';
        return 'Enter your verification code';
    };

    const getIdDocConfig = () => {
        if (!kycConfig || !modalIdType) return null;
        return kycConfig.id_documents.find(d => d.code === modalIdType);
    };

    const getTaxDocConfig = () => {
        if (!kycConfig || !modalTaxType) return null;
        return kycConfig.tax_documents.find(d => d.code === modalTaxType);
    };

    // Check if a specific document needs resubmission
    const needsIdDocResubmit = () => {
        return documentsToResubmit.some(d => d.type === 'id_document');
    };

    const needsTaxDocResubmit = () => {
        return documentsToResubmit.some(d => d.type === 'tax_document');
    };

    const needsSelfieResubmit = () => {
        return documentsToResubmit.some(d => d.type === 'selfie');
    };

    // Get rejection reason for a specific document
    const getRejectReason = (docType) => {
        const doc = documentsToResubmit.find(d => d.type === docType);
        return doc?.reason || '';
    };

    // Get status display for a document
    const getDocStatusDisplay = (status) => {
        console.log("🚀 ~ getDocStatusDisplay ~ status:", status)
        switch (status) {
            case 'approved':
                return { icon: '✅', text: 'Approved', className: 'text-success' };
            case 'rejected':
                return { icon: '❌', text: 'Rejected', className: 'text-white' };
            case 'resubmit_required':
                return { icon: '⚠️', text: 'Resubmission Required', className: 'text-white' };
            case 'pending':
            default:
                return { icon: '⏳', text: 'Under Review', className: 'text-white' };
        }
    };

    // Get human-readable document type name
    const getDocTypeName = (docTypeCode) => {
        const docTypeNames = {
            // India
            'AADHAAR': 'Aadhaar Card',
            'PAN': 'PAN Card',
            'TAX_ID': 'TAX ID',
            // Common international
            'PASSPORT': 'Passport',
            'NATIONAL_ID': 'National ID Card',
            'DRIVING_LICENSE': 'Driving License',
            'RESIDENCE_PERMIT': 'Residence Permit',
            // Tax documents
            'SSN': 'Social Security Number',
            'TIN': 'Tax Identification Number',
            'NIN': 'National Insurance Number',
            'TFN': 'Tax File Number',
            'STEUER_ID': 'Steueridentifikationsnummer',
            'NRIC': 'NRIC',
            'EMIRATES_ID': 'Emirates ID'
        };
        return docTypeNames[docTypeCode] || docTypeCode || 'ID Document';
    };

    const faqData = [
        { q: "How long does KYC take?", a: "KYC verification usually takes 24-48 hours after submission." },
        { q: "What documents do I need for KYC?", a: "A valid government-issued ID and tax document are required." },
        { q: "Can I use the app without completing KYC?", a: "Limited features are available, but full access requires KYC." },
        { q: "Is my personal information secure in the KYC process?", a: "Your data is encrypted and handled according to strict security standards." },

        { q: "Can I resubmit my KYC if it gets rejected?", a: "Yes, if your KYC is rejected or partially rejected, you can reupload the requested documents and resubmit." },
        { q: "Do I need to upload both front and back of my ID?", a: "Some ID documents require both front and back images. The upload fields will appear based on the selected document type." },
        { q: "Is live selfie mandatory for KYC?", a: "Yes, a live selfie captured through your device camera is required to complete KYC verification." }
    ];


    useEffect(() => {
       window.scrollTo(0, 0);
    }, []);


    // =========================================================================
    // RENDER
    // =========================================================================

    return (
        <>
            <div className="dashboard_right">

                <div className="kyc_verif_bnr_wrapper">

                    <div className="profile_sections" >
                        <div className="row" >
                            <div className="col-md-12" >
                                <h2 className="mb-0 pb-0"> KYC Verification </h2>
                            </div>
                        </div>
                    </div>

                    {/* Not Verified - Show verify button */}
                    {(kycVerfied === "" || kycVerfied === 0 || kycVerfied === "0") && (
                        <div className="kyc_verif_bnr">
                            <div className="kysbnr_cnt">
                                <h5>KYC</h5>
                                <p>Finish your KYC in just a few minutes and enjoy a seamless experience. Submit your basic details once and get instant access to
                                    withdrawals, rewards, and every feature without any delays or limitations.</p>

                                <h6>KYC Verification Requirements</h6>

                                <ul className="kyclist">
                                    <li><img src="/images/staricon.png" alt="star" /> ID Document</li>
                                    <li><img src="/images/staricon.png" alt="star" /> Tax Document</li>
                                    <li><img src="/images/staricon.png" alt="star" /> Live Selfie (Camera Required)</li>
                                </ul>

                                <button className="kyc btn" onClick={openKycModalFresh}>Verify </button>
                            </div>
                            <div className="kycvector">
                                <img src="/images/kyc_verification_vector.svg" alt="kyc" />
                            </div>
                        </div>
                    )}

                    {/* Pending Verification */}
                    {(kycVerfied === 1 || kycVerfied === "1") && (
                        <div className="kyc_verif_bnr kyc_pending">
                            <div className="kysbnr_cnt">
                                <h5>KYC Pending</h5>
                                <p>Your KYC application has been submitted and is currently under review. You will be notified once the verification is complete.</p>

                                <h6>Documents Submitted</h6>

                                <ul className="kyclist">
                                    <li className={getDocStatusDisplay(idDocStatus).className}>
                                        {getDocStatusDisplay(idDocStatus).icon} {submittedIdDocType ? getDocTypeName(submittedIdDocType) : 'Identity Document'} - {getDocStatusDisplay(idDocStatus).text}
                                    </li>
                                    <li className={getDocStatusDisplay(taxDocStatus).className}>
                                        {getDocStatusDisplay(taxDocStatus).icon} {submittedTaxDocType ? getDocTypeName(submittedTaxDocType) : 'Tax Document'} - {getDocStatusDisplay(taxDocStatus).text}
                                    </li>
                                    <li className={getDocStatusDisplay(selfieStatus).className}>
                                        {getDocStatusDisplay(selfieStatus).icon} Live Selfie - {getDocStatusDisplay(selfieStatus).text}
                                    </li>
                                </ul>
                            </div>
                            <div className="kycvector">
                                <img src="/images/kyc_verification_vector.svg" alt="kyc" />
                            </div>
                        </div>
                    )}

                    {/* Verified/Approved */}
                    {(kycVerfied === 2 || kycVerfied === "2") && (
                        <div className="kyc_verif_bnr kyc_seccessfull">
                            <div className="kysbnr_cnt">
                                <h5>KYC Verified <i class="ri-verified-badge-line text-success"></i></h5>
                                <p>Congratulations! Your KYC verification has been approved. You now have full access to all platform features.</p>

                                <h6>Your Benefits</h6>

                                <ul className="kyclist">
                                    <li>✅ Deposit & Withdraw Without Limit</li>
                                    <li>✅ Spot & Futures Trading Unlock</li>
                                    <li>✅ 100% Secure Trading with Verified KYC</li>
                                </ul>
                            </div>
                            <div className="kycvector">
                                <img src="/images/kyc_success_vector.svg" alt="kyc" />
                            </div>
                        </div>
                    )}

                    {/* Complete Rejection */}
                    {(kycVerfied === 3 || kycVerfied === "3") && (
                        <div className="kyc_verif_bnr kyc_rejected">
                            <div className="kysbnr_cnt">
                                <h5>KYC Rejected</h5>
                                <p>Unfortunately, your KYC application has been rejected. Please review the reason below and resubmit with correct documents.</p>

                                <h6>Rejection Reason</h6>

                                <ul className="kyclist">
                                    <li>❌ {reason || 'KYC requirements not met'}</li>
                                </ul>

                                <button className="kyc btn" onClick={openKycModalFresh}>Resubmit KYC </button>
                            </div>
                            <div className="kycvector">
                                <img src="/images/rejectvector.png" alt="kyc" />
                            </div>
                        </div>
                    )}

                    {/* Partial Rejection - Some documents need resubmission */}
                    {(kycVerfied === 4 || kycVerfied === "4") && (
                        <div className="kyc_verif_bnr kyc_rejected">
                            <div className="kysbnr_cnt">
                                <h5>Documents Need Resubmission</h5>
                                <p>Some of your documents require resubmission. Please check the details below and upload the corrected documents.</p>

                                <h6>Document Status</h6>

                                <ul className="kyclist">
                                    <li className={getDocStatusDisplay(idDocStatus).className}>
                                        {getDocStatusDisplay(idDocStatus).icon} {submittedIdDocType ? getDocTypeName(submittedIdDocType) : 'Identity Document'} - {getDocStatusDisplay(idDocStatus).text}
                                        {idDocStatus === 'resubmit_required' && getRejectReason('id_document') && (
                                            <small className="d-block text-danger ms-2">Reason: {getRejectReason('id_document')}</small>
                                        )}
                                    </li>
                                    <li className={getDocStatusDisplay(taxDocStatus).className}>
                                        {getDocStatusDisplay(taxDocStatus).icon} {submittedTaxDocType ? getDocTypeName(submittedTaxDocType) : 'Tax Document'} - {getDocStatusDisplay(taxDocStatus).text}
                                        {taxDocStatus === 'resubmit_required' && getRejectReason('tax_document') && (
                                            <small className="d-block text-danger ms-2">Reason: {getRejectReason('tax_document')}</small>
                                        )}
                                    </li>
                                    <li className={getDocStatusDisplay(selfieStatus).className}>
                                        {getDocStatusDisplay(selfieStatus).icon} Live Selfie - {getDocStatusDisplay(selfieStatus).text}
                                        {selfieStatus === 'rejected' && getRejectReason('selfie') && (
                                            <small className="d-block text-danger ms-2">Reason: {getRejectReason('selfie')}</small>
                                        )}
                                    </li>
                                </ul>

                                <button className="kyc btn" onClick={openResubmitModal}>Resubmit Documents</button>
                            </div>
                            <div className="kycvector">
                                <img src="/images/rejectvector.png" alt="kyc" />
                            </div>
                        </div>
                    )}


                    <div className="kyc_account d-flex">
                        <div className="account_benifits">
                            <h5>Account Benefits</h5>

                            <div className="row">
                                <div className="col-sm-4">
                                    <h6>Level</h6>
                                    <ul className="kyclist">
                                        <li><img src="/images/staricon.png" alt="star" /> KYC Level</li>
                                        <li><img src="/images/staricon.png" alt="star" /> Crypto Deposit</li>
                                        <li><img src="/images/staricon.png" alt="star" /> Crypto Withdrawal</li>
                                        <li><img src="/images/staricon.png" alt="star" /> Crypto Swap</li>
                                        <li><img src="/images/staricon.png" alt="star" /> Spot/Futures Trading</li>
                                        <li><img src="/images/staricon.png" alt="star" /> Platform Events</li>
                                    </ul>
                                </div>

                                <div className="col-sm-4">
                                    <h6>Unverified</h6>
                                    <ul className="kyclist">
                                        <li>Unlimited</li>
                                        <li>1 BTC per day</li>
                                        <li><img src="/images/closebtn2.svg" alt="star" /></li>
                                        <li><img src="/images/closebtn2.svg" alt="star" /></li>
                                        <li><img src="/images/closebtn2.svg" alt="star" /></li>
                                        <li><img src="/images/rightbtn2.svg" alt="star" /></li>
                                    </ul>
                                </div>

                                <div className="col-sm-4">
                                    <h6>Advanced KYC</h6>
                                    <ul className="kyclist">
                                        <li>Unlimited</li>
                                        <li>100 BTC per day*</li>
                                        <li>30,000 USD per day*</li>
                                        <li><img src="/images/rightbtn2.svg" alt="star" /></li>
                                        <li><img src="/images/rightbtn2.svg" alt="star" /></li>
                                        <li><img src="/images/rightbtn2.svg" alt="star" /></li>
                                    </ul>
                                </div>

                            </div>
                        </div>


                        <div className="faq_section">
                            <h4>Faq</h4>
                            <div className="table-responsive">
                                {faqData.map((item, index) => (
                                    <div
                                        className={`faq_item ${activeIndex === index ? "active" : ""}`}
                                        key={index}
                                    >
                                        <button
                                            className="faq_question"
                                            onClick={() =>
                                                setActiveIndex(activeIndex === index ? null : index)
                                            }
                                        >
                                            {item.q}
                                            <span className="icon"><i className="ri-arrow-down-s-line"></i></span>
                                        </button>

                                        <div className="faq_answer">
                                            <p>{item.a}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>

                </div>


                {/* <!-- Modal kyc Start --> */}

                <div className="modal fade kyc_modal" id="kycModal" tabIndex="-1" data-bs-backdrop="static">
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">


                            <div className="modal-header">
                                <h5 className="modal-title" id="kycTitle">{modalTitle}</h5>
                                <button type="button" className="btn-close" data-bs-dismiss="modal"></button>
                            </div>


                            <div className="modal-body">


                                {/* Step 0: Select Country and ID Type */}
                                {modalStep === 0 && (
                                <div className="kyc_step active" data-title="Select Country and ID Type">
                                    <label className="label">🌟 Country/Region (Please select the issuing country of the document) <span className="text-danger">*</span></label>
                                    <div className="select_box">
                                        <select
                                            value={modalCountry}
                                            onChange={(e) => setModalCountry(e.target.value)}
                                            id="kycCountry"
                                        >
                                            <option value="">Select Country</option>
                                            {countries.map((c) => (
                                                <option key={c.code} value={c.code}>
                                                    {c.flag} {c.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <small className="text-danger d-none" id="countryError">Please select a country</small>

                                    {loadingConfig && <p className="text-muted mt-2">Loading document options...</p>}

                                    {kycConfig && (
                                        <>
                                            <label className="label mt-4">ID Type <span className="text-danger">*</span></label>
                                            <div className="id_grid">
                                                {kycConfig.id_documents.map((doc) => (
                                                    <label key={doc.code} className={`id_item ${modalIdType === doc.code ? 'selected' : ''}`}>
                                                        <input
                                                            type="radio"
                                                            name="kycIdType"
                                                            value={doc.code}
                                                            checked={modalIdType === doc.code}
                                                            onChange={(e) => setModalIdType(e.target.value)}
                                                        />
                                                        {doc.label}
                                                    </label>
                                                ))}
                                            </div>
                                            <small className="text-danger d-none" id="idTypeError">Please select an ID type</small>
                                        </>
                                    )}

                                    <button type="button" className="primary_btn nextStep" onClick={(e) => {
                                        e.preventDefault();
                                        if (validateModalStep0()) {
                                            nextModalStep();
                                        }
                                    }}>Next</button>
                                </div>
                                )}

                                {/* Step 1: Personal Details */}
                                {modalStep === 1 && (
                                <div className="kyc_step active" data-title="Personal Details">
                                    <div className="row g-3">
                                        <div className="col-md-6">
                                            <label className="label">First Name <span className="text-danger">*</span></label>
                                            <input
                                                className="input"
                                                placeholder="Enter First Name"
                                                value={firstName}
                                                onChange={(e) => setFirstName(e.target.value)}
                                            />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="label">Last Name <span className="text-danger">*</span></label>
                                            <input
                                                className="input"
                                                placeholder="Enter Last Name"
                                                value={lastName}
                                                onChange={(e) => setLastName(e.target.value)}
                                            />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="label">Date of Birth <span className="text-danger">*</span></label>
                                            <input
                                                type="date"
                                                className="input"
                                                value={infoDob}
                                                onChange={(e) => setInfoDob(e.target.value)}
                                                max={moment().subtract(18, 'years').format('YYYY-MM-DD')}
                                            />
                                            {/* <small className="text-muted">You must be at least 18 years old</small> */}
                                        </div>
                                        <div className="col-md-6">
                                            <label className="label">Gender <span className="text-danger">*</span></label>
                                            <select className="input" value={gender} onChange={(e) => setGender(e.target.value)}>
                                                <option value="male">Male</option>
                                                <option value="female">Female</option>
                                                <option value="other">Other</option>
                                            </select>
                                        </div>
                                        <div className="col-12">
                                            <label className="label">Address <span className="text-danger">*</span></label>
                                            <input
                                                className="input"
                                                placeholder="Enter your full address (Minimum 10 characters)"
                                                value={address}
                                                onChange={(e) => setAddress(e.target.value)}
                                            />
                                            {/* <small className="text-muted">Minimum 10 characters</small> */}
                                        </div>
                                        <div className="col-md-4">
                                            <label className="label">City <span className="text-danger">*</span></label>
                                            <input
                                                className="input"
                                                placeholder="City"
                                                value={city}
                                                onChange={(e) => setCity(e.target.value)}
                                            />
                                        </div>
                                        <div className="col-md-4">
                                            <label className="label">State <span className="text-danger">*</span></label>
                                            <input
                                                className="input"
                                                placeholder="State"
                                                value={infoState}
                                                onChange={(e) => setInfoState(e.target.value)}
                                            />
                                        </div>
                                        <div className="col-md-4">
                                            <label className="label">Zip/Postal Code <span className="text-danger">*</span></label>
                                            <input
                                                className="input"
                                                placeholder="Zip Code"
                                                value={zipCode}
                                                onChange={(e) => setZipCode(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'space-between', marginTop: '20px' }}>
                                        <button className="primary_btn prevStep" onClick={(e) => { e.preventDefault(); prevModalStep(); }}>Back</button>
                                        <button type="button" className="primary_btn nextStep" onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            
                                            // Validate all fields before proceeding
                                            let hasError = false;
                                            
                                            if (!firstName || firstName.trim().length < 2) { 
                                                alertErrorMessage('Please enter a valid first name (at least 2 characters)'); 
                                                hasError = true;
                                            } else if (!lastName || lastName.trim().length < 1) { 
                                                alertErrorMessage('Please enter a valid last name'); 
                                                hasError = true;
                                            } else if (!infoDob) { 
                                                alertErrorMessage('Please enter your date of birth'); 
                                                hasError = true;
                                            } else {
                                                const age = moment().diff(moment(infoDob), 'years');
                                                if (age < 18) { 
                                                    alertErrorMessage('You must be at least 18 years old'); 
                                                    hasError = true;
                                                }
                                            }
                                            
                                            if (!hasError && (!address || address.trim().length < 10)) { 
                                                alertErrorMessage('Please enter a valid address (at least 10 characters)'); 
                                                hasError = true;
                                            }
                                            if (!hasError && (!city || city.trim().length < 2)) { 
                                                alertErrorMessage('Please enter a valid city'); 
                                                hasError = true;
                                            }
                                            if (!hasError && (!infoState || infoState.trim().length < 2)) { 
                                                alertErrorMessage('Please enter a valid state'); 
                                                hasError = true;
                                            }
                                            if (!hasError && (!zipCode || zipCode.trim().length < 3)) { 
                                                alertErrorMessage('Please enter a valid zip/postal code'); 
                                                hasError = true;
                                            }
                                            
                                            // Only proceed if no validation errors
                                            if (!hasError) {
                                                nextModalStep();
                                            }
                                        }}>Next</button>
                                    </div>
                                </div>
                                )}

                                {/* Step 2: Take a Photo of Your ID Card */}
                                {modalStep === 2 && (
                                <div className="kyc_step active" data-title="Take a Photo of Your ID Card">
                                    <div className="id_preview">
                                        <img src="/images/photoid_vector.png" alt="ID card" />
                                    </div>

                                    <div className="tips photomini">
                                        <p><img src="/images/photoidmini.png" alt="tip 1" /></p>
                                        <p><img src="/images/photoidmini2.png" alt="tip 2" /></p>
                                        <p><img src="/images/photoidmini3.png" alt="tip 3" /></p>
                                    </div>

                                    <h6>The selected country/region and ID type are as follows:</h6>

                                    <div className="info_text">
                                        <ul className="d-flex gap-3">
                                            <li>
                                                {countries.find(c => c.code === modalCountry)?.flag || '🌍'}
                                                {' '}{countries.find(c => c.code === modalCountry)?.name || 'Not Selected'}
                                            </li>
                                            <li><img src="/images/idcard.png" alt="ID Card" /> {getIdDocConfig()?.label || 'Not Selected'}</li>
                                        </ul>
                                    </div>
                                    <p>Please upload a valid ID matching your selected country/region and ID type to avoid verification failure.</p>

                                    <input
                                        className={`input ${documentNumberError ? 'is-invalid' : ''}`}
                                        placeholder={getIdDocConfig()?.label ? `${getIdDocConfig().label} Number` : "ID Card Number"}
                                        value={aadhar}
                                        onChange={(e) => handleDocumentNumberChange(e.target.value)}
                                    />
                                    {documentNumberError && <small className="text-danger">{documentNumberError}</small>}
                                    {/* {getIdDocConfig() && <small className="text-muted d-block">{getIdDocConfig().min}-{getIdDocConfig().max} characters</small>} */}

                                    <div className="upload_grid">

                                        <div className="upload-box">
                                            <input type="file" id="modalDocFront" hidden accept="image/png,image/jpeg,image/jpg" onChange={handleChangeIdentity} />
                                            <label htmlFor="modalDocFront" className="upload-label">
                                                {previewImages?.doc_front ? (
                                                    <img src={previewImages.doc_front} alt="Document Front" style={{ maxWidth: '100%', maxHeight: '150px', borderRadius: '8px', objectFit: 'cover' }} />
                                                ) : (
                                                    <img className="upload_back_img" src="/images/fileback_vector.png" alt="upload background" />
                                                )}
                                                <div className="icon">
                                                    <img src="/images/uploadvector.svg" alt="upload" />
                                                </div>
                                                <h3>{localFront ? '✓ Uploaded' : 'Front Side'}</h3>
                                                <p>{localFront?.name || 'Drag or choose file'}</p>
                                            </label>
                                        </div>

                                        <div className="upload-box">
                                            <input type="file" id="modalDocBack" hidden accept="image/png,image/jpeg,image/jpg" onChange={handleChangeIdentity2} />
                                            <label htmlFor="modalDocBack" className="upload-label">
                                                {previewImages?.doc_back ? (
                                                    <img src={previewImages.doc_back} alt="Document Back" style={{ maxWidth: '100%', maxHeight: '150px', borderRadius: '8px', objectFit: 'cover' }} />
                                                ) : (
                                                    <img className="upload_back_img" src="/images/fileback_vector.png" alt="upload background" />
                                                )}
                                                <div className="icon">
                                                    <img src="/images/uploadvector.svg" alt="upload" />
                                                </div>
                                                <h3>{localBack ? '✓ Uploaded' : 'Back Side'}{getIdDocConfig()?.requires_back_image ? '' : '(Optional)'}</h3>
                                                <p>{localBack?.name || 'Drag or choose file'}</p>
                                            </label>
                                        </div>

                                    </div>

                                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'space-between' }}>
                                        <button className="primary_btn prevStep" onClick={(e) => { e.preventDefault(); prevModalStep(); }}>Back</button>
                                        <button className="primary_btn nextStep" onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            
                                            let hasError = false;
                                            const docConfig = getIdDocConfig();
                                            
                                            // Validate document number
                                            if (!aadhar || aadhar.trim().length < 4) { 
                                                alertErrorMessage('Please enter a valid document number'); 
                                                hasError = true;
                                            } else if (docConfig) {
                                                const validation = validateDocNumber(aadhar, docConfig);
                                                if (!validation.valid) { 
                                                    alertErrorMessage(validation.message || 'Please enter a valid document number'); 
                                                    setDocumentNumberError(validation.message); 
                                                    hasError = true;
                                                }
                                            }
                                            
                                            // Validate front image
                                            if (!hasError && !localFront) { 
                                                alertErrorMessage('Please upload front image of your ID card'); 
                                                hasError = true;
                                            }
                                            
                                            // Validate back image if required
                                            if (!hasError && docConfig?.requires_back_image && !localBack) { 
                                                alertErrorMessage('Please upload back image of your ID card'); 
                                                hasError = true;
                                            }
                                            
                                            // Only proceed if no validation errors
                                            if (!hasError) {
                                                nextModalStep();
                                            }
                                        }}>Next</button>
                                    </div>
                                </div>
                                )}

                                {/* Step 3: Income Tax & Selfie */}
                                {modalStep === 3 && (
                                <div className="kyc_step active" data-title="Income Tax & Selfie">
                                    <div className="d-flex gap-4 flex-column">
                                        <div>
                                            <label className="label mb-2">Tax Document Type <span className="text-danger">*</span></label>
                                            {kycConfig && (
                                                <div className="id_grid mb-3">
                                                    {kycConfig.tax_documents.map((doc) => (
                                                        <label key={doc.code} className={`id_item ${modalTaxType === doc.code ? 'selected' : ''}`}>
                                                            <input
                                                                type="radio"
                                                                name="kycTaxType"
                                                                value={doc.code}
                                                                checked={modalTaxType === doc.code}
                                                                onChange={(e) => setModalTaxType(e.target.value)}
                                                            />
                                                            {doc.label}
                                                        </label>
                                                    ))}
                                                </div>
                                            )}

                                            {modalTaxType && (
                                                <>
                                                    <label className="label mb-2">
                                                        {getTaxDocConfig()?.label || 'Tax ID'} Number <span className="text-danger">*</span>
                                                    </label>
                                                    <input
                                                        className={`input ${taxDocumentError ? 'is-invalid' : ''}`}
                                                        placeholder={`Enter ${getTaxDocConfig()?.label || 'Tax ID'} Number`}
                                                        value={panCard}
                                                        onChange={(e) => handlePanCardChange(e.target.value)}
                                                    />
                                                    {taxDocumentError && <small className="text-danger">{taxDocumentError}</small>}
                                                    {/* {getTaxDocConfig() && <small className="text-muted d-block">{getTaxDocConfig().min}-{getTaxDocConfig().max} characters</small>} */}
                                                </>
                                            )}
                                        </div>

                                        <div>
                                            <h5 className="mb-2">Upload Tax Document <span className="text-danger">*</span></h5>
                                            <span className="small text-muted">(Only JPEG, PNG & JPG formats and file size upto 5MB are supported)</span>
                                            <div className="upload-box mt-2">
                                                <input type="file" id="modalPanCard" hidden accept="image/png,image/jpeg,image/jpg" onChange={handleChangePanCard} />
                                                <label htmlFor="modalPanCard" className="upload-label">
                                                    {previewImages?.pan ? (
                                                        <img src={previewImages.pan} alt="Tax Document" style={{ maxWidth: '100%', maxHeight: '150px', borderRadius: '8px', objectFit: 'cover' }} />
                                                    ) : (
                                                        <div className="icon">
                                                            <img src="/images/uploadvector.svg" alt="upload" />
                                                        </div>
                                                    )}
                                                    <h3>{localPanCard ? '✓ Uploaded' : 'Choose a File'}</h3>
                                                    <p>{localPanCard?.name || 'Drag or choose your file to upload'}</p>
                                                </label>
                                            </div>
                                        </div>

                                        <div>
                                            <h5 className="mb-2">Live Selfie Capture <span className="text-danger">*</span></h5>
                                            <span className="small text-muted">(Camera required - Please allow camera access to capture live selfie)</span>

                                            <div className="upload-box mt-2" style={{ minHeight: '200px' }}>
                                                {cameraError && (
                                                    <div className="alert alert-danger text-center p-2 mb-2">
                                                        {cameraError}
                                                    </div>
                                                )}

                                                {!isCameraActive && !selfieCaptured && (
                                                    <div className="text-center p-3">
                                                        <div className="selfie_circle mb-3">
                                                            <img src="/images/selefvector.png" alt="selfie guide" />
                                                        </div>
                                                        <button
                                                            type="button"
                                                            className="primary_btn prevStep"
                                                            onClick={startCamera}
                                                        >
                                                            <i className="ri-camera-line me-2"></i> Start Camera
                                                        </button>
                                                    </div>
                                                )}

                                                {isCameraActive && !selfieCaptured && (
                                                    <div className="text-center">
                                                        <div style={{
                                                            position: 'relative',
                                                            width: '100%',
                                                            maxWidth: '300px',
                                                            minHeight: '225px',
                                                            margin: '0 auto',
                                                            backgroundColor: '#000',
                                                            borderRadius: '8px',
                                                            overflow: 'hidden',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center'
                                                        }}>
                                                            {!isCameraReady && (
                                                                <div style={{ position: 'absolute', color: '#fff', zIndex: 1 }}>
                                                                    <div className="spinner-border spinner-border-sm text-light me-2" role="status"></div>
                                                                    Loading camera...
                                                                </div>
                                                            )}
                                                            <video
                                                                ref={videoRef}
                                                                autoPlay
                                                                playsInline
                                                                muted
                                                                style={{
                                                                    width: '100%',
                                                                    height: '100%',
                                                                    objectFit: 'cover',
                                                                    transform: 'scaleX(-1)',
                                                                    display: isCameraReady ? 'block' : 'none'
                                                                }}
                                                            />
                                                        </div>
                                                        <canvas ref={canvasRef} style={{ display: 'none' }} />
                                                        <p className="small text-muted mt-2 mb-2">Position your face in the center</p>
                                                        <div>
                                                        <div className="mt-2">
                                                            <button
                                                                type="button"
                                                                className="btn btn-success"
                                                                onClick={capturePhoto}
                                                                disabled={!isCameraReady}
                                                            >
                                                                <i className="ri-camera-fill me-2"></i> Capture Photo
                                                            </button>
                                                            <button
                                                                type="button"
                                                              className="btn btn-secondary btn-sm ms-2"
                                                                onClick={stopCamera}
                                                            >
                                                                Cancel
                                                            </button>
                                                        </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {selfieCaptured && previewImages?.selfie && (
                                                    <div className="text-center">
                                                        <img
                                                            src={previewImages.selfie}
                                                            alt="Captured Selfie"
                                                            style={{
                                                                maxWidth: '100%',
                                                                maxHeight: '200px',
                                                                borderRadius: '8px',
                                                                objectFit: 'cover'
                                                            }}
                                                        />
                                                        <div className="mt-2">
                                                            <h5 className="text-success">✓ Selfie Captured</h5>
                                                            <button
                                                                type="button"
                                                                className="btn btn-outline-secondary btn-sm"
                                                                onClick={retakeSelfie}
                                                            >
                                                                <i className="ri-refresh-line me-1"></i> Retake
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                    </div>

                                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'space-between', marginTop: '20px' }}>
                                        <button className="primary_btn prevStep" onClick={(e) => { e.preventDefault(); prevModalStep(); }}>Back</button>
                                        <button className="primary_btn nextStep" onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            
                                            let hasError = false;
                                            const taxConfig = getTaxDocConfig();
                                            
                                            // Validate tax document type selection
                                            if (!modalTaxType) { 
                                                alertErrorMessage('Please select a tax document type'); 
                                                hasError = true;
                                            }
                                            
                                            // Validate tax ID number
                                            if (!hasError && !panCard) { 
                                                alertErrorMessage('Please enter Tax Identification Number'); 
                                                hasError = true;
                                            } else if (!hasError && taxConfig) {
                                                const validation = validateDocNumber(panCard, taxConfig);
                                                if (!validation.valid) { 
                                                    alertErrorMessage(validation.message || 'Please enter a valid Tax ID'); 
                                                    setTaxDocumentError(validation.message); 
                                                    hasError = true;
                                                }
                                            }
                                            
                                            // Validate tax document upload
                                            if (!hasError && !localPanCard) { 
                                                alertErrorMessage('Please upload Tax document'); 
                                                hasError = true;
                                            }
                                            
                                            // Validate selfie capture
                                            if (!hasError && (!localSelfie || !selfieCaptured)) { 
                                                alertErrorMessage('Please capture a live selfie'); 
                                                hasError = true;
                                            }
                                            
                                            // Only proceed if no validation errors
                                            if (!hasError) {
                                                nextModalStep();
                                            }
                                        }}>Next</button>
                                    </div>
                                </div>
                                )}

                                {/* Step 4: Face Verification */}
                                {modalStep === 4 && (
                                <div className="kyc_step text-center active" data-title="Face Verification">
                                    <div className="face_circle" style={{ width: '200px', height: '200px', borderRadius: '50%', overflow: 'hidden', margin: '0 auto 20px', border: selfieCaptured && previewImages?.selfie ? '3px solid #28a745' : '3px solid #ccc' }}>
                                        {previewImages?.selfie ? (
                                            <img src={previewImages.selfie} alt="Your Selfie" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            <img src="/images/selefvector.png" alt="selfie placeholder" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        )}
                                    </div>
                                    {selfieCaptured && previewImages?.selfie ? (
                                        <>
                                            <h5 className="text-success mb-3">✓ Face Captured Successfully</h5>
                                            <p className="text-muted">Your selfie has been uploaded. Click Next to review your information.</p>
                                        </>
                                    ) : (
                                        <>
                                            <h5 className="text-warning mb-3">Selfie Not Captured</h5>
                                            <p className="text-muted">Please go back and capture your selfie before proceeding.</p>
                                        </>
                                    )}

                                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'space-between', marginTop: '20px' }}>
                                        <button className="primary_btn prevStep" onClick={(e) => { e.preventDefault(); prevModalStep(); }}>Back</button>
                                        <button className="primary_btn nextStep" onClick={(e) => { 
                                            e.preventDefault(); 
                                            if (!selfieCaptured || !previewImages?.selfie) {
                                                alertErrorMessage('Please go back and capture your selfie first');
                                                return;
                                            }
                                            nextModalStep(); 
                                        }}>Next</button>
                                    </div>
                                </div>
                                )}

                                {/* Step 5: Review Your Information */}
                                {modalStep === 5 && (
                                <div className="kyc_step active" data-title="Review Your Information">
                                    <div className="table-responsive pt-3">
                                        <div className="kyc_information_del">
                                            <div className="userinfolft">
                                                <div className="face_circle" style={{ width: '80px', height: '80px', borderRadius: '50%', overflow: 'hidden', border: '2px solid #28a745' }}>
                                                    {previewImages?.selfie ? (
                                                        <img src={previewImages.selfie} alt="Your Selfie" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    ) : (
                                                        <img src="/images/selefvector.png" alt="selfie" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    )}
                                                </div>
                                                <h5>{firstName} {lastName}</h5>
                                            </div>

                                            <div className="info_list">
                                                <ul>
                                                    <li>Full Name <span>{firstName} {lastName}</span></li>
                                                    <li>Email <span>{emailId}</span></li>
                                                    <li>Mobile Number <span>{mobileNumber}</span></li>
                                                    <li>Document No. <span>****{aadhar.slice(-4)}</span></li>
                                                    <li>Tax ID <span>****{panCard.slice(-4)}</span></li>
                                                </ul>
                                            </div>

                                        </div>

                                        <div className="documentnumber_s">
                                            <ul>
                                                <li><span>{getIdDocConfig()?.label || 'ID'} Number:</span>****{aadhar.slice(-4)}</li>
                                            </ul>
                                        </div>

                                        <div className="picture_front_bl" style={{ display: 'flex', gap: '20px', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                                            <div className="document_front_bl" style={{ flex: '1', minWidth: '150px' }}>
                                                <p>Document (Front)</p>
                                                <div className="front_img" style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid #ddd' }}>
                                                    {previewImages?.doc_front ? (
                                                        <img src={previewImages.doc_front} alt="Document Front" style={{ width: '100%', maxHeight: '120px', objectFit: 'cover' }} />
                                                    ) : (
                                                        <img src="/images/document_front.png" alt="Document Front" style={{ width: '100%' }} />
                                                    )}
                                                </div>
                                            </div>
                                            <div className="document_front_bl" style={{ flex: '1', minWidth: '150px' }}>
                                                <p>Document (Back)</p>
                                                <div className="front_img" style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid #ddd' }}>
                                                    {previewImages?.doc_back ? (
                                                        <img src={previewImages.doc_back} alt="Document Back" style={{ width: '100%', maxHeight: '120px', objectFit: 'cover' }} />
                                                    ) : (
                                                        <img src="/images/document_front.png" alt="Document Back" style={{ width: '100%' }} />
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="documentnumber_s mt-3">
                                            <ul>
                                                <li><span>{getTaxDocConfig()?.label || 'Tax ID'}:</span>****{panCard.slice(-4)}</li>
                                            </ul>
                                        </div>

                                        <div className="picture_front_bl" style={{ display: 'flex', gap: '20px', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                                            <div className="document_front_bl" style={{ flex: '1', minWidth: '150px' }}>
                                                <p>Tax Document</p>
                                                <div className="front_img" style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid #ddd' }}>
                                                    {previewImages?.pan ? (
                                                        <img src={previewImages.pan} alt="Tax Document" style={{ width: '100%', maxHeight: '120px', objectFit: 'cover' }} />
                                                    ) : (
                                                        <img src="/images/document_front.png" alt="Tax Document" style={{ width: '100%' }} />
                                                    )}
                                                </div>
                                            </div>
                                            <div className="document_front_bl" style={{ flex: '1', minWidth: '150px' }}>
                                                <p>Selfie</p>
                                                <div className="front_img" style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid #ddd' }}>
                                                    {previewImages?.selfie ? (
                                                        <img src={previewImages.selfie} alt="Selfie" style={{ width: '100%', maxHeight: '120px', objectFit: 'cover' }} />
                                                    ) : (
                                                        <img src="/images/document_front.png" alt="Selfie" style={{ width: '100%' }} />
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'space-between', marginTop: '20px' }}>
                                        <button type="button" className="primary_btn prevStep" onClick={(e) => { e.preventDefault(); prevModalStep(); }}>Back</button>
                                        <button type="button" className="primary_btn nextStep" onClick={(e) => {
                                            e.preventDefault();
                                            handleOpenKycVerification();
                                        }}>Submit KYC</button>
                                    </div>
                                </div>
                                )}

                            </div>
                        </div>
                    </div>
                </div>

                {/* <!-- Modal kyc End --> */}

                {/* === RESUBMIT MODAL === */}
                {/* This modal only shows rejected documents for resubmission - SAME DESIGN AS MAIN KYC MODAL */}
                <div className="modal fade kyc_modal" id="kycResubmitModal" tabIndex="-1" data-bs-backdrop="static">
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">

                            <div className="modal-header">
                                <h5 className="modal-title" id="kycResubmitTitle">
                                    {resubmitStep === 0 ? 'Resubmit Documents' :
                                        resubmitStep === 1 && needsIdDocResubmit() ? `Upload ${submittedIdDocType ? getDocTypeName(submittedIdDocType) : 'ID Document'}` :
                                            resubmitStep === 2 && needsTaxDocResubmit() ? `Upload ${submittedTaxDocType ? getDocTypeName(submittedTaxDocType) : 'Tax Document'}` :
                                                resubmitStep === 3 && needsSelfieResubmit() ? 'Capture Selfie' :
                                                    resubmitStep === 4 ? 'Security Verification' : 'Resubmit Documents'}
                                </h5>
                                <button type="button" className="btn-close" data-bs-dismiss="modal"></button>
                            </div>

                            <div className="modal-body">

                                {/* Step 0: Documents Requiring Resubmission */}
                                {resubmitStep === 0 && (
                                    <div className="kyc_step active" data-title="Resubmit Documents">
                                        <label className="label">The following documents were rejected and need to be uploaded again:</label>

                                        <div className="alert alert-danger mt-3">
                                            <ul className="mb-0" style={{ listStyle: 'none', paddingLeft: 0 }}>
                                                {needsIdDocResubmit() && (
                                                    <li className="mb-2">
                                                        <strong><i className="ri-close-circle-line me-2"></i>{submittedIdDocType ? getDocTypeName(submittedIdDocType) : 'ID Document'}:</strong> {getRejectReason('id_document')}
                                                    </li>
                                                )}
                                                {needsTaxDocResubmit() && (
                                                    <li className="mb-2">
                                                        <strong><i className="ri-close-circle-line me-2"></i>{submittedTaxDocType ? getDocTypeName(submittedTaxDocType) : 'Tax Document'}:</strong> {getRejectReason('tax_document')}
                                                    </li>
                                                )}
                                                {needsSelfieResubmit() && (
                                                    <li className="mb-2">
                                                        <strong><i className="ri-close-circle-line me-2"></i>Selfie:</strong> {getRejectReason('selfie')}
                                                    </li>
                                                )}
                                            </ul>
                                        </div>

                                        <button type="button" className="primary_btn nextStep" onClick={() => setResubmitStep(1)}>Continue</button>
                                    </div>
                                )}

                                {/* Step 1: ID Document Resubmission (if needed) */}
                                {resubmitStep === 1 && needsIdDocResubmit() && (
                                    <div className="kyc_step active" data-title={`Upload ${submittedIdDocType ? getDocTypeName(submittedIdDocType) : 'ID Document'}`}>
                                        {/* Rejection Reason Alert */}
                                        <div className="alert alert-warning mb-3">
                                            <strong>Rejection Reason:</strong> {getRejectReason('id_document')}
                                        </div>

                                        {/* ID Preview Image - same as original */}
                                        <div className="id_preview">
                                            <img src="/images/photoid_vector.png" alt="ID card" />
                                        </div>

                                        {/* Photo Tips - same as original */}
                                        <div className="tips photomini">
                                            <p><img src="/images/photoidmini.png" alt="tip 1" /></p>
                                            <p><img src="/images/photoidmini2.png" alt="tip 2" /></p>
                                            <p><img src="/images/photoidmini3.png" alt="tip 3" /></p>
                                        </div>

                                        <h6>Your previously selected ID type:</h6>

                                        {/* Country and ID Type Info */}
                                        <div className="info_text">
                                            <ul className="d-flex gap-3">
                                                <li>
                                                    {countries.find(c => c.code === existingCountryCode)?.flag || '🌍'}
                                                    {' '}{countries.find(c => c.code === existingCountryCode)?.name || 'Your Country'}
                                                </li>
                                                <li><img src="/images/idcard.png" alt="ID Card" /> {submittedIdDocType ? getDocTypeName(submittedIdDocType) : 'ID Document'}</li>
                                            </ul>
                                        </div>
                                        <p>Please upload a clear, valid ID document to avoid further rejection.</p>

                                        {/* Document Number Input */}
                                        <input
                                            className="input"
                                            placeholder={`${submittedIdDocType ? getDocTypeName(submittedIdDocType) : 'ID Document'} Number`}
                                            value={resubmitIdNumber}
                                            onChange={(e) => setResubmitIdNumber(e.target.value.toUpperCase())}
                                        />
                                        <small className="text-muted d-block mb-3">You can update the number if it was incorrect</small>

                                        {/* Upload Grid - same as original */}
                                        <div className="upload_grid">
                                            <div className="upload-box">
                                                <input type="file" id="resubmitDocFront" hidden accept="image/png,image/jpeg,image/jpg" onChange={(e) => handleFileChange(e, 'id_front')} />
                                                <label htmlFor="resubmitDocFront" className="upload-label">
                                                    {previewImages?.doc_front ? (
                                                        <img src={previewImages.doc_front} alt="Document Front" style={{ maxWidth: '100%', maxHeight: '150px', borderRadius: '8px', objectFit: 'cover' }} />
                                                    ) : (
                                                        <img className="upload_back_img" src="/images/fileback_vector.png" alt="upload background" />
                                                    )}
                                                    <div className="icon">
                                                        <img src="/images/uploadvector.svg" alt="upload" />
                                                    </div>
                                                    <h3>{localFront ? '✓ Uploaded' : 'Front Side'}</h3>
                                                    <p>{localFront?.name || 'Drag or choose file'}</p>
                                                </label>
                                            </div>

                                            <div className="upload-box">
                                                <input type="file" id="resubmitDocBack" hidden accept="image/png,image/jpeg,image/jpg" onChange={(e) => handleFileChange(e, 'id_back')} />
                                                <label htmlFor="resubmitDocBack" className="upload-label">
                                                    {previewImages?.doc_back ? (
                                                        <img src={previewImages.doc_back} alt="Document Back" style={{ maxWidth: '100%', maxHeight: '150px', borderRadius: '8px', objectFit: 'cover' }} />
                                                    ) : (
                                                        <img className="upload_back_img" src="/images/fileback_vector.png" alt="upload background" />
                                                    )}
                                                    <div className="icon">
                                                        <img src="/images/uploadvector.svg" alt="upload" />
                                                    </div>
                                                    <h3>{localBack ? '✓ Uploaded' : 'Back Side'} {getIdDocConfig()?.requires_back_image ? '' : '(Optional)'} </h3>
                                                    <p>{localBack?.name || 'Drag or choose file'}</p>
                                                </label>
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'space-between' }}>
                                            <button className="primary_btn prevStep" onClick={() => setResubmitStep(0)}>Back</button>
                                            <button className="primary_btn nextStep" onClick={() => {
                                                if (!localFront) { alertErrorMessage('Please upload front image of your ID card'); return; }
                                                if (needsTaxDocResubmit()) setResubmitStep(2);
                                                else if (needsSelfieResubmit()) setResubmitStep(3);
                                                else setResubmitStep(4);
                                            }}>Next</button>
                                        </div>
                                    </div>
                                )}

                                {/* Step 1 (Skip ID): Auto-advance if no ID resubmit needed */}
                                {resubmitStep === 1 && !needsIdDocResubmit() && (
                                    <div className="kyc_step active">
                                        {(() => {
                                            setTimeout(() => {
                                                if (needsTaxDocResubmit()) setResubmitStep(2);
                                                else if (needsSelfieResubmit()) setResubmitStep(3);
                                                else setResubmitStep(4);
                                            }, 0); return null;
                                        })()}
                                        <p className="text-center">Loading...</p>
                                    </div>
                                )}

                                {/* Step 2: Tax Document Resubmission (if needed) */}
                                {resubmitStep === 2 && needsTaxDocResubmit() && (
                                    <div className="kyc_step active" data-title={`Upload ${submittedTaxDocType ? getDocTypeName(submittedTaxDocType) : 'Tax Document'}`}>
                                        {/* Rejection Reason Alert */}
                                        <div className="alert alert-warning mb-3">
                                            <strong>Rejection Reason:</strong> {getRejectReason('tax_document')}
                                        </div>

                                        <div className="d-flex gap-4 flex-column">
                                            {/* Tax Document Info */}
                                            <div>
                                                <h6>Your previously selected Tax Document type:</h6>
                                                <div className="info_text mb-3">
                                                    <ul className="d-flex gap-3">
                                                        <li>
                                                            {countries.find(c => c.code === existingCountryCode)?.flag || '🌍'}
                                                            {' '}{countries.find(c => c.code === existingCountryCode)?.name || 'Your Country'}
                                                        </li>
                                                        <li><img src="/images/idcard.png" alt="Tax Doc" /> {submittedTaxDocType ? getDocTypeName(submittedTaxDocType) : 'Tax Document'}</li>
                                                    </ul>
                                                </div>

                                                {/* Document Number Input */}
                                                <label className="label mb-2">
                                                    {submittedTaxDocType ? getDocTypeName(submittedTaxDocType) : 'Tax ID'} Number <span className="text-danger">*</span>
                                                </label>
                                                <input
                                                    className="input"
                                                    placeholder={`Enter ${submittedTaxDocType ? getDocTypeName(submittedTaxDocType) : 'Tax ID'} Number`}
                                                    value={resubmitTaxNumber}
                                                    onChange={(e) => setResubmitTaxNumber(e.target.value.toUpperCase())}
                                                />
                                                <small className="text-muted d-block mb-3">You can update the number if it was incorrect</small>
                                            </div>

                                            {/* Upload Section */}
                                            <div>
                                                <h5 className="mb-2">Upload {submittedTaxDocType ? getDocTypeName(submittedTaxDocType) : 'Tax Document'} <span className="text-danger">*</span></h5>
                                                <span className="small text-muted">(Only JPEG, PNG & JPG formats and file size upto 5MB are supported)</span>
                                                <div className="upload-box mt-2">
                                                    <input type="file" id="resubmitPanCard" hidden accept="image/png,image/jpeg,image/jpg" onChange={(e) => handleFileChange(e, 'pan')} />
                                                    <label htmlFor="resubmitPanCard" className="upload-label">
                                                        {previewImages?.pan ? (
                                                            <img src={previewImages.pan} alt="Tax Document" style={{ maxWidth: '100%', maxHeight: '150px', borderRadius: '8px', objectFit: 'cover' }} />
                                                        ) : (
                                                            <div className="icon">
                                                                <img src="/images/uploadvector.svg" alt="upload" />
                                                            </div>
                                                        )}
                                                        <h3>{localPanCard ? '✓ Uploaded' : 'Choose a File'}</h3>
                                                        <p>{localPanCard?.name || 'Drag or choose your file to upload'}</p>
                                                    </label>
                                                </div>
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'space-between', marginTop: '20px' }}>
                                            <button className="primary_btn prevStep" onClick={() => {
                                                if (needsIdDocResubmit()) setResubmitStep(1);
                                                else setResubmitStep(0);
                                            }}>Back</button>
                                            <button className="primary_btn nextStep" onClick={() => {
                                                if (!localPanCard) { alertErrorMessage('Please upload Tax document'); return; }
                                                if (needsSelfieResubmit()) setResubmitStep(3);
                                                else setResubmitStep(4);
                                            }}>Next</button>
                                        </div>
                                    </div>
                                )}

                                {/* Step 2 (Skip Tax): Auto-advance if no Tax resubmit needed */}
                                {resubmitStep === 2 && !needsTaxDocResubmit() && (
                                    <div className="kyc_step active">
                                        {(() => {
                                            setTimeout(() => {
                                                if (needsSelfieResubmit()) setResubmitStep(3);
                                                else setResubmitStep(4);
                                            }, 0); return null;
                                        })()}
                                        <p className="text-center">Loading...</p>
                                    </div>
                                )}

                                {/* Step 3: Selfie Resubmission (if needed) */}
                                {resubmitStep === 3 && needsSelfieResubmit() && (
                                    <div className="kyc_step active" data-title="Capture Selfie">
                                        <div className="alert alert-warning mb-3">
                                            <strong>Rejection Reason:</strong> {getRejectReason('selfie')}
                                        </div>

                                        <h5 className="mb-2">Live Selfie Capture <span className="text-danger">*</span></h5>
                                        <span className="small text-muted">(Gallery uploads are not allowed. Please capture live.)</span>

                                        <div className="upload-box mt-2" style={{ minHeight: '200px' }}>
                                            {cameraError && (
                                                <div className="alert alert-danger text-center p-2 mb-2">
                                                    {cameraError}
                                                </div>
                                            )}

                                            {!isCameraActive && !selfieCaptured && (
                                                <div className="text-center p-3">
                                                    <div className="selfie_circle mb-3">
                                                        <img src="/images/selefvector.png" alt="selfie guide" />
                                                    </div>
                                                    <button
                                                        type="button"
                                                        className="btn btn-primary"
                                                        onClick={startCamera}
                                                    >
                                                        <i className="ri-camera-line me-2"></i> Start Camera
                                                    </button>
                                                </div>
                                            )}

                                            {isCameraActive && !selfieCaptured && (
                                                <div className="text-center">
                                                    <div style={{
                                                        position: 'relative',
                                                        width: '100%',
                                                        maxWidth: '300px',
                                                        minHeight: '225px',
                                                        margin: '0 auto',
                                                        backgroundColor: '#000',
                                                        borderRadius: '8px',
                                                        overflow: 'hidden',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center'
                                                    }}>
                                                        {!isCameraReady && (
                                                            <div style={{ position: 'absolute', color: '#fff', zIndex: 1 }}>
                                                                <div className="spinner-border spinner-border-sm text-light me-2" role="status"></div>
                                                                Loading camera...
                                                            </div>
                                                        )}
                                                        <video
                                                            ref={videoRef}
                                                            autoPlay
                                                            playsInline
                                                            muted
                                                            style={{
                                                                width: '100%',
                                                                height: '100%',
                                                                objectFit: 'cover',
                                                                transform: 'scaleX(-1)',
                                                                display: isCameraReady ? 'block' : 'none'
                                                            }}
                                                        />
                                                    </div>
                                                    <canvas ref={canvasRef} style={{ display: 'none' }} />
                                                    <p className="small text-muted mt-2 mb-2">Position your face in the center</p>
                                                    <div className="mt-2">
                                                        <button
                                                            type="button"
                                                            className="btn btn-success"
                                                            onClick={capturePhoto}
                                                            disabled={!isCameraReady}
                                                        >
                                                            <i className="ri-camera-fill me-2"></i> Capture Photo
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="btn btn-outline-secondary ms-2"
                                                            onClick={stopCamera}
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                </div>
                                            )}

                                            {selfieCaptured && previewImages?.selfie && (
                                                <div className="text-center">
                                                    <img
                                                        src={previewImages.selfie}
                                                        alt="Captured Selfie"
                                                        style={{
                                                            maxWidth: '100%',
                                                            maxHeight: '200px',
                                                            borderRadius: '8px',
                                                            objectFit: 'cover'
                                                        }}
                                                    />
                                                    <div className="mt-2">
                                                        <h5 className="text-success">✓ Selfie Captured</h5>
                                                        <button
                                                            type="button"
                                                            className="btn btn-outline-secondary btn-sm"
                                                            onClick={retakeSelfie}
                                                        >
                                                            <i className="ri-refresh-line me-1"></i> Retake
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'space-between', marginTop: '20px' }}>
                                            <button className="primary_btn prevStep" onClick={() => {
                                                stopCamera();
                                                if (needsTaxDocResubmit()) setResubmitStep(2);
                                                else if (needsIdDocResubmit()) setResubmitStep(1);
                                                else setResubmitStep(0);
                                            }}>Back</button>
                                            <button className="primary_btn nextStep" onClick={() => {
                                                if (!localSelfie || !selfieCaptured) { alertErrorMessage('Please capture a live selfie'); return; }
                                                stopCamera();
                                                setResubmitStep(4);
                                            }}>Next</button>
                                        </div>
                                    </div>
                                )}

                                {/* Step 3 (Skip Selfie): Auto-advance if no Selfie resubmit needed */}
                                {resubmitStep === 3 && !needsSelfieResubmit() && (
                                    <div className="kyc_step active">
                                        {(() => { setTimeout(() => setResubmitStep(4), 0); return null; })()}
                                        <p className="text-center">Loading...</p>
                                    </div>
                                )}

                                {/* Step 4: Verification - Same design as kycVerificationModal */}
                                {resubmitStep === 4 && (
                                    <div className="kyc_step active" data-title="Security Verification">

                                        {/* Show selected verification method */}
                                        <div className="mb-3">
                                            <label className="label">{getKycVerificationTitle()}</label>
                                            <p className="text-muted small">{getKycVerificationDescription()}</p>
                                        </div>

                                        <div className="verify_authenticator_form">
                                            <form className="profile_form profile_form2" onSubmit={(e) => e.preventDefault()}>

                                                {/* Passkey Authentication UI */}
                                                {selectedAuthMethod === 4 ? (
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
                                                            onClick={handlePasskeyResubmit}
                                                            disabled={isPasskeyVerifying}
                                                        >
                                                            {isPasskeyVerifying ? 'Authenticating...' : 'Authenticate with Passkey'}
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <>
                                                        {/* OTP / 2FA Input - Same style as TwofactorPage */}
                                                        <div className="emailinput">
                                                            <label>Enter 6-digit Code</label>
                                                            <div className="d-flex">
                                                                <input
                                                                    type="text"
                                                                    placeholder="Enter code here..."
                                                                    value={emailOtp}
                                                                    onChange={(e) => setemailOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                                                    maxLength={6}
                                                                />
                                                                {/* Send OTP button for Email/Mobile - not for Google Auth */}
                                                                {selectedAuthMethod !== 2 && (
                                                                    modalOtpTimer > 0 ? (
                                                                        <small className="resend otp-button-disabled">Resend ({modalOtpTimer}s)</small>
                                                                    ) : (
                                                                        <button
                                                                            type="button"
                                                                            className="getotp otp-button-enabled getotp_mobile"
                                                                            onClick={() => {
                                                                                handleGetOtp();
                                                                                setModalOtpTimer(60);
                                                                            }}
                                                                        >
                                                                            GET OTP
                                                                        </button>
                                                                    )
                                                                )}
                                                            </div>
                                                        </div>
                                                        {/* Switch verification option - same style as TwofactorPage */}
                                                        {availableVerifyMethods.length > 1 && (
                                                            <div className="cursor-pointer" onClick={() => {
                                                                setIsResubmitFlow(true); // Mark that we came from resubmit modal
                                                                const resubmitModal = window.bootstrap?.Modal?.getInstance(document.getElementById('kycResubmitModal'));
                                                                if (resubmitModal) resubmitModal.hide();
                                                                setTimeout(() => {
                                                                    const optionsModal = new window.bootstrap.Modal(document.getElementById('kycVerifyOptionsModal'));
                                                                    optionsModal.show();
                                                                }, 100);
                                                            }} style={{ marginTop: '15px' }}>
                                                                <small className="text-white">Switch to Another Verification Option <i className="ri-external-link-line"></i></small>
                                                            </div>
                                                        )}

                                                        <button
                                                            className="primary_btn prevStep"
                                                            type="button"
                                                            onClick={handleResubmitKyc}
                                                            disabled={isSubmitting || !emailOtp || emailOtp.length < 6}
                                                        >
                                                            {isSubmitting ? 'Submitting...' : 'Verify & Submit'}
                                                        </button>
                                                    </>
                                                )}



                                            </form>
                                        </div>

                                        {/* Back button */}
                                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-start', marginTop: '20px' }}>
                                            <button className="primary_btn prevStep" onClick={() => {
                                                if (needsSelfieResubmit()) setResubmitStep(3);
                                                else if (needsTaxDocResubmit()) setResubmitStep(2);
                                                else if (needsIdDocResubmit()) setResubmitStep(1);
                                                else setResubmitStep(0);
                                            }}>Back</button>
                                        </div>
                                    </div>
                                )}

                            </div>
                        </div>
                    </div>
                </div>
                {/* === END RESUBMIT MODAL === */}

                {/* KYC Submit Confirmation Modal */}
                <div className="modal fade" id="kycSubmitModal" tabIndex="-1" aria-labelledby="kycSubmitModalLabel" aria-hidden="true" data-bs-backdrop="static">
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content kyc_modal">
                            <div className="modal-header">
                                <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>
                            <div className="modal-body text-center">
                                <div className="mb-4">
                                    <div className="success_icon_wrapper mb-3">
                                        <img src="/images/verifing_vector.png" alt="Verifying" />
                                    </div>
                                    <h4 className="mb-3">Verifying</h4>
                                    <p className="text-muted mb-2">
                                        Hang tight, your review will be completed within the next 48 hours.
                                    </p>
                                    <p className="text-muted mb-2">Continue exploring Exchange while you wait. We'll notify you once
                                        verification is complete.</p>
                                </div>
                                <div className="d-flex gap-3 justify-content-center mt-4">
                                    <button type="button" className="primary_btn" style={{ width: 'auto', padding: '10px 30px' }} data-bs-dismiss="modal">
                                        Done
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* KYC Security Verification Modal - Same style as TwofactorPage */}
                <div className="modal fade search_form" id="kycVerificationModal" tabIndex="-1" aria-labelledby="kycVerificationModalLabel" aria-hidden="true" data-bs-backdrop="static">
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title" id="kycVerificationModalLabel">{getKycVerificationTitle()}</h5>
                                <p>{getKycVerificationDescription()}</p>
                                <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>
                            <div className="modal-body">
                                <div className="verify_authenticator_form">
                                    <form className="profile_form" onSubmit={(e) => e.preventDefault()}>

                                        {/* Passkey Authentication UI */}
                                        {selectedAuthMethod === 4 ? (
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
                                                    onClick={async () => {
                                                        const success = await handlePasskeyVerification();
                                                        if (success) {
                                                            // Don't close modal here - let handleModalKycSubmit close it only on success
                                                            handleModalKycSubmit();
                                                        }
                                                    }}
                                                    disabled={isPasskeyVerifying}
                                                >
                                                    {isPasskeyVerifying ? 'Authenticating...' : 'Authenticate with Passkey'}
                                                </button>
                                            </div>
                                        ) : (
                                            <>
                                                {/* OTP / 2FA Input - Same style as TwofactorPage */}
                                                <div className="emailinput">
                                                    <label>Enter 6-digit Code</label>
                                                    <div className="d-flex">
                                                        <input
                                                            type="text"
                                                            placeholder="Enter code here..."
                                                            value={emailOtp}
                                                            onChange={(e) => setemailOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                                            maxLength={6}
                                                        />
                                                        {/* Send OTP button for Email/Mobile - not for Google Auth */}
                                                        {selectedAuthMethod !== 2 && (
                                                            modalOtpTimer > 0 ? (
                                                                <div className="resend otp-button-disabled">Resend ({modalOtpTimer}s)</div>
                                                            ) : (
                                                                <button
                                                                    type="button"
                                                                    className="getotp otp-button-enabled getotp_mobile"
                                                                    onClick={() => {
                                                                        handleGetOtp();
                                                                        setModalOtpTimer(60);
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
                                                    onClick={() => {
                                                        if (!emailOtp || emailOtp.length < 6) {
                                                            alertErrorMessage('Please enter valid 6-digit code');
                                                            return;
                                                        }
                                                        // Don't close modal here - let handleModalKycSubmit close it only on success
                                                        handleModalKycSubmit();
                                                    }}
                                                    disabled={!emailOtp || emailOtp.length < 6}
                                                >
                                                    Verify & Submit KYC
                                                </button>
                                            </>
                                        )}

                                        {/* Switch verification option - same style as TwofactorPage */}
                                        {availableVerifyMethods.length > 1 && (
                                            <div className="cursor-pointer" onClick={() => {
                                                setIsResubmitFlow(false); // Mark that we came from main KYC modal
                                                const verifyModal = window.bootstrap?.Modal?.getInstance(document.getElementById('kycVerificationModal'));
                                                if (verifyModal) verifyModal.hide();
                                                setTimeout(() => {
                                                    const optionsModal = new window.bootstrap.Modal(document.getElementById('kycVerifyOptionsModal'));
                                                    optionsModal.show();
                                                }, 100);
                                            }} >
                                                <small className="text-white">Switch to Another Verification Option <i className="ri-external-link-line"></i></small>
                                            </div>
                                        )}

                                        {/* Back button to return to Review step */}
                                        <div >
                                            <button 
                                                type="button" 
                                                className="primary_btn prevStep" 
                                                onClick={handleBackFromVerification}
                                                style={{ width: '100%' }}
                                            >
                                                Back to Review
                                            </button>
                                        </div>

                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* KYC Verification Options Modal - Same style as TwofactorPage */}
                <div className="modal fade search_form" id="kycVerifyOptionsModal" tabIndex="-1" aria-hidden="true" data-bs-backdrop="static">
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Select a Verification Option</h5>
                                <p>Choose how you want to verify your identity</p>
                                <button type="button" className="btn-close" onClick={() => {
                                    const optionsModal = window.bootstrap?.Modal?.getInstance(document.getElementById('kycVerifyOptionsModal'));
                                    if (optionsModal) optionsModal.hide();
                                    setTimeout(() => {
                                        // Return to the correct modal based on flow
                                        if (isResubmitFlow) {
                                            const resubmitModal = new window.bootstrap.Modal(document.getElementById('kycResubmitModal'));
                                            resubmitModal.show();
                                        } else {
                                            const verifyModal = new window.bootstrap.Modal(document.getElementById('kycVerificationModal'));
                                            verifyModal.show();
                                        }
                                    }, 100);
                                }} aria-label="Close"></button>
                            </div>
                            <div className="modal-body">
                                <form className="profile_form" onSubmit={(e) => e.preventDefault()}>
                                    {availableVerifyMethods.map((method) => (
                                        <div className="" key={method.type}>
                                            <div
                                                className="d-flex align-items-center justify-content-between text-white cursor-pointer"
                                                onClick={() => {
                                                    setSelectedAuthMethod(method.type);
                                                    setemailOtp("");
                                                    setModalOtpTimer(0);
                                                    const optionsModal = window.bootstrap?.Modal?.getInstance(document.getElementById('kycVerifyOptionsModal'));
                                                    if (optionsModal) optionsModal.hide();
                                                    setTimeout(() => {
                                                        // Return to the correct modal based on flow
                                                        if (isResubmitFlow) {
                                                            const resubmitModal = new window.bootstrap.Modal(document.getElementById('kycResubmitModal'));
                                                            resubmitModal.show();
                                                        } else {
                                                            const verifyModal = new window.bootstrap.Modal(document.getElementById('kycVerificationModal'));
                                                            verifyModal.show();
                                                        }
                                                    }, 100);
                                                }}
                                                role="button"
                                                style={{ padding: '15px 0', borderBottom: '1px solid rgba(255,255,255,0.1)' }}
                                            >
                                                <div className="d-flex align-items-center">
                                                    <i className={`${method.type === 1 ? 'ri-mail-line' : method.type === 2 ? 'ri-shield-keyhole-line' : method.type === 3 ? 'ri-smartphone-line' : 'ri-fingerprint-line'} me-3`} style={{ fontSize: '24px' }}></i>
                                                    <div>
                                                        <strong>{method.label}</strong>
                                                        <p className="mb-0 small text-white">
                                                            {method.type === 1 ? `Send code to ${emailId}` :
                                                                method.type === 2 ? 'Use your authenticator app' :
                                                                    method.type === 3 ? `Send code to ${mobileNumber}` :
                                                                        'Use Face ID, Touch ID, or Windows Hello'}
                                                        </p>
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

            </div>
        </>
    );
};

export default KycPage;
