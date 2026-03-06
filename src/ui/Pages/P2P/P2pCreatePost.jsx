import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { alertErrorMessage, alertSuccessMessage } from '../../../customComponents/CustomAlertMessage';
import LoaderHelper from '../../../customComponents/Loading/LoaderHelper';
import AuthService from '../../../api/services/AuthService';
import { ApiConfig } from '../../../api/apiConfig/apiConfig';
import P2pLayout from './P2pLayout';
import { ProfileContext } from '../../../context/ProfileProvider';

// Fiat currency symbol for dropdown icon
const fiatSymbolMap = { INR: '₹', USD: '$', EUR: '€', GBP: '£', USDT: '₮' };
const getFiatSymbol = (shortName) => fiatSymbolMap[shortName] || shortName?.slice(0, 1) || '';

// Crypto icon: use icon_path from list if available, else map short_name to public icon
const cryptoIconMap = { USDT: 'tether', BTC: 'btc', ETH: 'eth', BNB: 'bnb', USDC: 'usdc', XRP: 'xrp', SOL: 'sol', DOGE: 'doge' };
const getCryptoIconSrc = (shortName, cryptosList) => {
    const found = cryptosList?.find(c => (c.short_name || '') === (shortName || ''));
    if (found?.icon_path) return `${ApiConfig.baseImage}${found.icon_path}`;
    const file = cryptoIconMap[shortName] || shortName?.toLowerCase();
    return `${process.env.PUBLIC_URL || ''}/images/icon/${file}.png`;
};

const P2pCreatePost = () => {
    const navigate = useNavigate();
    const { userDetails } = useContext(ProfileContext);

    // Check if KYC is completed (kycVerified === 2 means verified)
    const isKycCompleted = userDetails?.kycVerified === 2;
    const kycUpdateName = userDetails?.kycUpdateName || '';
    const [currentStep, setCurrentStep] = useState(1);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [isTablet, setIsTablet] = useState(window.innerWidth < 1024);
    const [showPreview, setShowPreview] = useState(false);

    const [fiats, setFiats] = useState([]);
    const [cryptos, setCryptos] = useState([]);
    const [payments, setPayments] = useState([]);
    const [availablePaymentMathod, setAvailablePaymentMathod] = useState([]);
    const [paymentInputs, setPaymentInputs] = useState([]);
    const [selectedAddPaymentMethod, setSelectedAddPaymentMethod] = useState("");
    const [selectedAddPaymentMethodId, setSelectedAddPaymentMethodId] = useState("");
    const [loader, setLoader] = useState({ paymentInput: false, paymentMethods: false, pairPrice: false });
    const [paymentMethodFormData, setPaymentMethodFormData] = useState({});
    const [previewQr, setPreviewQr] = useState("");

    const [selectedBuyerPaymentMethod, setSelectedBuyerPaymentMethod] = useState([]);
    const [selectedSellerPaymentMethod, setSelectedSellerPaymentMethod] = useState([]);
    const [searchAvailPayment, setSearchAvailPayment] = useState("");

    // Market price state
    const [marketPrice, setMarketPrice] = useState(null);

    // Available balance state (for SELL ads)
    const [availableBalance, setAvailableBalance] = useState(0);

    // Field errors state
    const [fieldErrors, setFieldErrors] = useState({});

    const [formData, setFormData] = useState({
        fiat: "",
        side: "BUY",
        crypto: "",
        priceType: "FIXED",
        paymentTimeLimit: "15",
        fixedPrice: "",
        volume: "",
        min: "",
        max: "",
        remarks: "",
        agree: true,
        completedKyc: false,
        registeredUser: false,
        registeredDays: "0",
        status: "ONLINE"
    });

    // Handle resize
    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
            setIsTablet(window.innerWidth < 1024);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Clear field error when user types
    const handleInput = (key, value) => {
        // Restrict fixedPrice to 2 decimal places
        if (key === 'fixedPrice') {
            // Allow empty value
            if (value === '') {
                setFormData({ ...formData, [key]: value });
            } else {
                // Check if value matches pattern (numbers with max 2 decimals)
                const regex = /^\d*\.?\d{0,2}$/;
                if (regex.test(value)) {
                    setFormData({ ...formData, [key]: value });
                }
            }
        } else {
            setFormData({ ...formData, [key]: value });
        }
        // Clear the error for this field when user starts typing
        if (fieldErrors[key]) {
            setFieldErrors(prev => ({ ...prev, [key]: null }));
        }
    };

    const handlePaymentMethodAddInput = (e) => {
        const { name, value } = e.target
        setPaymentMethodFormData({ ...paymentMethodFormData, [name]: value });
    };

    const handlePaymentMethodAddImage = (event) => {
        const file = event.target.files[0];
        const { name } = event.target
        if (file) {
            const allowedTypes = ["image/png", "image/jpeg", "image/jpg"];
            const maxSize = 3 * 1024 * 1024;
            if (allowedTypes.includes(file.type) && file.size <= maxSize) {
                const imgData = URL.createObjectURL(file);
                setPreviewQr(imgData)
                setPaymentMethodFormData({ ...paymentMethodFormData, [name]: file });
            } else {
                if (!allowedTypes.includes(file.type)) {
                    alertErrorMessage("Only PNG, JPEG, and JPG file types are allowed.");
                } else {
                    alertErrorMessage("Max image size is 2MB.");
                }
                setPreviewQr("");
                setPaymentMethodFormData({ ...paymentMethodFormData, [name]: "" });
            }
        }
    };

    const toggleSellerPayment = (method) => {
        setSelectedSellerPaymentMethod(prev => {
            const exists = prev.some(item => item._id === method._id);
            if (exists) {
                return prev.filter(item => item._id !== method._id);
            } else {
                return prev.length >= 5 ? prev : [...prev, method];
            }
        });
        // Clear payment method error
        if (fieldErrors.paymentMethod) {
            setFieldErrors(prev => ({ ...prev, paymentMethod: null }));
        }
    };

    const toggleBuyerPayment = (method) => {
        setSelectedBuyerPaymentMethod(prev => {
            const exists = prev.some(item => item === method);
            if (exists) {
                return prev.filter(item => item !== method);
            } else {
                return prev.length >= 5 ? prev : [...prev, method];
            }
        });
        // Clear payment method error
        if (fieldErrors.paymentMethod) {
            setFieldErrors(prev => ({ ...prev, paymentMethod: null }));
        }
    };

    // Calculate 15% price range
    const minAllowedPrice = marketPrice ? (marketPrice * 0.85).toFixed(2) : 0;
    const maxAllowedPrice = marketPrice ? (marketPrice * 1.15).toFixed(2) : 0;

    // Validate fields and return errors object
    const validateStepFields = (step) => {
        const errors = {};
        const totalAmount = (formData.volume || 0) * (formData.fixedPrice || 0);

        if (step === 1) {
            if (!formData.fiat) {
                errors.fiat = "Please select a fiat currency";
            }
            if (!formData.side) {
                errors.side = "Please select buy or sell";
            }
            if (!formData.crypto) {
                errors.crypto = "Please select a cryptocurrency";
            }
            if (!formData.fixedPrice) {
                errors.fixedPrice = "Please enter a price";
            } else if (Number(formData.fixedPrice) <= 0) {
                errors.fixedPrice = "Price must be greater than 0";
            } else if (marketPrice && (Number(formData.fixedPrice) < minAllowedPrice || Number(formData.fixedPrice) > maxAllowedPrice)) {
                errors.fixedPrice = `Ad can be placed between ${minAllowedPrice} - ${maxAllowedPrice} ${formData.fiat}`;
            }
        }

        if (step === 2) {
            if (!formData.paymentTimeLimit) {
                errors.paymentTimeLimit = "Please select payment time limit";
            }

            if (!formData.volume) {
                errors.volume = "Please enter volume";
            } else if (Number(formData.volume) <= 0) {
                errors.volume = "Volume must be greater than 0";
            } else if (formData.side === "SELL") {
                const p2pFeePercent = (cryptos?.find(c => c.short_name === formData.crypto)?.p2p_fee) ?? 0;
                const feeAmount = (Number(formData.volume) * p2pFeePercent) / 100;
                const totalRequired = Number(formData.volume) + feeAmount;
                if (totalRequired > availableBalance) {
                    errors.volume = `You need ${totalRequired.toFixed(2)} ${formData.crypto} (${formData.volume} + ${feeAmount.toFixed(2)} fee). Available: ${availableBalance} ${formData.crypto}`;
                }
            }

            if (!formData.min) {
                errors.min = "Please enter minimum amount";
            } else if (Number(formData.min) < 200) {
                errors.min = "Minimum amount must be at least 200";
            } else if (totalAmount > 0 && Number(formData.min) > totalAmount) {
                errors.min = `Min cannot exceed total amount (${totalAmount.toFixed(2)})`;
            }

            if (!formData.max) {
                errors.max = "Please enter maximum amount";
            } else if (totalAmount > 0 && Number(formData.max) > totalAmount) {
                errors.max = `Max cannot exceed total amount (${totalAmount.toFixed(2)})`;
            } else if (formData.min && Number(formData.max) < Number(formData.min)) {
                errors.max = "Max must be greater than min";
            }

            if (formData.side === "SELL" && selectedSellerPaymentMethod.length === 0) {
                errors.paymentMethod = "Please select at least one payment method";
            }
            if (formData.side === "BUY" && selectedBuyerPaymentMethod.length === 0) {
                errors.paymentMethod = "Please select at least one payment method";
            }
        }

        if (step === 3) {
            if (formData.registeredUser && Number(formData.registeredDays) <= 0) {
                errors.registeredDays = "Please enter valid number of days";
            }
            if (!formData.agree) {
                errors.agree = "You must accept the service agreement";
            }
        }

        return errors;
    };

    const nextStep = async () => {
        const errors = validateStepFields(currentStep);

        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors);
            return;
        }

        // Fetch P2P wallet balance when moving to step 2 for SELL ads
        if (currentStep === 1 && formData.side === "SELL") {
            await fetchCryptoBalance();
        }

        setFieldErrors({});
        setCurrentStep(prev => Math.min(prev + 1, 3));
    };

    // Fetch crypto balance from P2P wallet for SELL ads
    const fetchCryptoBalance = async () => {
        try {
            setLoader(prev => ({ ...prev, balance: true }));
            const result = await AuthService.getUserfunds("p2p");
            if (result?.success && result?.data) {
                // Find the balance for the selected crypto
                const cryptoWallet = result.data.find(
                    wallet => wallet.short_name?.toUpperCase() === formData.crypto?.toUpperCase()
                );
                if (cryptoWallet) {
                    setAvailableBalance(Number(cryptoWallet.balance) || 0);
                } else {
                    setAvailableBalance(0);
                }
            } else {
                setAvailableBalance(0);
            }
        } catch (error) {
            setAvailableBalance(0);
        } finally {
            setLoader(prev => ({ ...prev, balance: false }));
        }
    };

    // Step 2 pe "I want to Sell" select hote hi balance fetch karo (agar step 1 pe Buy tha to balance pehle load nahi hota)
    useEffect(() => {
        if (currentStep === 2 && formData.side === "SELL" && formData.crypto) {
            fetchCryptoBalance();
        }
    }, [currentStep, formData.side, formData.crypto]);

    const prevStep = () => {
        setFieldErrors({});
        setCurrentStep(prev => Math.max(prev - 1, 1));
    };

    // Open confirmation modal
    const openConfirmModal = () => {
        const errors = validateStepFields(3);

        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors);
            return;
        }

        // Open the modal using Bootstrap
        const modal = new window.bootstrap.Modal(document.getElementById('confirmpostModal'));
        modal.show();
    };

    // Reset form to initial state
    const resetForm = () => {
        setFormData({
            fiat: fiats?.find(f => f.short_name === "INR")?.short_name || fiats[0]?.short_name || "",
            side: "BUY",
            crypto: cryptos?.find(c => c.short_name === "USDT")?.short_name || cryptos[0]?.short_name || "",
            priceType: "FIXED",
            paymentTimeLimit: "15",
            fixedPrice: "",
            volume: "",
            min: "",
            max: "",
            remarks: "",
            agree: true,
            completedKyc: false,
            registeredUser: false,
            registeredDays: "0",
            status: "ONLINE"
        });
        setSelectedBuyerPaymentMethod([]);
        setSelectedSellerPaymentMethod([]);
        setCurrentStep(1);
        setFieldErrors({});
        setAvailableBalance(0);
    };

    const handleSubmit = async () => {
        let payload = {
            side: formData.side,
            fiatCurrency: formData.fiat,
            qouteCurrency: formData.crypto,
            priceType: "FIXED",
            fixedPrice: formData.fixedPrice,
            paymentTimeLimit: formData.paymentTimeLimit,
            volume: formData.volume,
            minLimit: formData.min,
            maxLimit: formData.max,
            remarks: formData.remarks,
            isOnline: formData.status === "ONLINE",
            counterpartyCondition: {
                isRegisteredCond: formData.registeredUser,
                registerDays: formData.registeredDays,
            }
        };

        if (formData.side === "SELL") {
            const methodIds = selectedSellerPaymentMethod.map(item => item._id);
            const methodNames = [...new Set(selectedSellerPaymentMethod.map(item => item.name))];
            payload = { ...payload, paymentMethodIds: methodIds, paymentMethodType: methodNames };
        }

        if (formData.side === "BUY") {
            payload = { ...payload, paymentMethodType: selectedBuyerPaymentMethod };
        }

        LoaderHelper.loaderStatus(true);
        try {
            const result = await AuthService.createAd(payload);
            if (result?.success) {
                LoaderHelper.loaderStatus(false);
                alertSuccessMessage("P2P Ad Created Successfully!");
                // Close modal and reset form
                const modal = window.bootstrap.Modal.getInstance(document.getElementById('confirmpostModal'));
                if (modal) modal.hide();
                resetForm();
                // Navigate to My Ads page to see the created ad
                navigate('/p2p-my-ads');
            } else {
                LoaderHelper.loaderStatus(false);
                alertErrorMessage(result?.message);
            }
        } catch (error) {
            LoaderHelper.loaderStatus(false);
            alertErrorMessage("Something went wrong!");
        }
    };

    const getFiatCurrency = async () => {
        try {
            const result = await AuthService.getFiatCurrency();
            const result2 = await AuthService.getCurrency();
            const result3 = await AuthService.getUserPaymentMethods();

            if (result?.success) {
                const fiatList = result?.data || [];
                console.log(fiatList, 'fiatListfiatList>');

                setFiats(fiatList);

                // Set default fiat: INR if exists, otherwise first item
                const hasINR = fiatList.some(f => f.short_name === "INR");
                const defaultFiat = hasINR ? "INR" : (fiatList[0]?.short_name || "");
                setFormData(prev => ({ ...prev, fiat: defaultFiat }));
            }

            if (result2?.success) {
                const cryptoList = result2?.data || [];
                setCryptos(cryptoList);

                // Set default crypto: USDT if exists, otherwise first item
                const hasUSDT = cryptoList.some(c => c.short_name === "USDT");
                const defaultCrypto = hasUSDT ? "USDT" : (cryptoList[0]?.short_name || "");
                setFormData(prev => ({ ...prev, crypto: defaultCrypto }));
            }

            if (result3?.success) setPayments(result3?.data || [])
        } catch (error) {
            LoaderHelper.loaderStatus(false);
        } finally { LoaderHelper.loaderStatus(false); }
    };

    // Fetch market price for the selected pair
    const getPairPrice = async (crypto, fiat) => {
        if (!crypto || !fiat) return;
        try {
            setLoader(prev => ({ ...prev, pairPrice: true }));
            const result = await AuthService.getPairPrice(crypto, fiat);
            if (result?.success && result?.data?.price) {
                const price = Number(result.data.price);
                setMarketPrice(price);
                // Set initial fixed price to current market price
                setFormData(prev => ({ ...prev, fixedPrice: price.toFixed(2) }));
            } else {
                setMarketPrice(null);
            }
        } catch (error) {
            setMarketPrice(null);
        } finally {
            setLoader(prev => ({ ...prev, pairPrice: false }));
        }
    };

    const getAvailPaymentMethod = async () => {
        try {
            setLoader({ paymentMethods: true })
            const result = await AuthService.getAllPaymentMethods();
            if (result?.success) setAvailablePaymentMathod(result?.data || [])
        } catch (error) {
        } finally { setLoader({ paymentMethods: false }) }
    };

    const getPaymentMethodFields = async (id, name) => {
        // Check KYC before allowing to add payment method
        if (!isKycCompleted) {
            alertErrorMessage("Please complete KYC verification before adding a payment method.");
            return;
        }

        try {
            setLoader({ paymentInput: true })
            setSelectedAddPaymentMethod("")
            setSelectedAddPaymentMethodId("")
            setPaymentInputs([])
            setPaymentMethodFormData({})
            setPreviewQr("")
            const result = await AuthService.getPaymentMethodFields(id);
            if (result?.success) {
                setPaymentInputs(result?.data || []);
                setSelectedAddPaymentMethodId(id)
                setSelectedAddPaymentMethod(name);
                if (result?.data?.length > 0) {
                    const defaultForm = {};
                    result?.data?.forEach((item) => {
                        // Pre-fill name fields with kycUpdateName if KYC is completed
                        const isNameField = false
                        defaultForm[item.field] = isNameField && isKycCompleted && kycUpdateName ? kycUpdateName : "";
                    });
                    setPaymentMethodFormData(defaultForm);
                }
            }
        } catch (error) {
            alertErrorMessage("Something went wrong!");
        } finally { setLoader({ paymentInput: false }) }
    };

    const handleSubmitPaymentMethod = () => {
        // Check KYC before submitting
        if (!isKycCompleted) {
            alertErrorMessage("Please complete KYC verification before adding a payment method.");
            return;
        }

        if (!paymentInputs || paymentInputs?.length === 0) {
            alertErrorMessage("No payment fields available.");
            return;
        }
        for (let item of paymentInputs) {
            // Skip file/files type fields (QR code is optional)
            if (item.type !== "files" && item.type !== "file") {
                if (!paymentMethodFormData[item.field] || paymentMethodFormData[item.field].toString().trim() === "") {
                    alertErrorMessage(`Please enter ${formatLabel(item.label || item.field)}`);
                    return;
                }
            }
        };
        submitPaymentMethod(paymentMethodFormData);
    };

    const submitPaymentMethod = async (paymentMethodFormData) => {
        try {
            LoaderHelper.loaderStatus(true);
            const formDataObj = new FormData();
            Object.entries(paymentMethodFormData).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    formDataObj.append(key, value);
                }
            });
            if (selectedAddPaymentMethodId) {
                formDataObj.append("templateId", selectedAddPaymentMethodId);
            }
            const result = await AuthService.addUserPaymentMethod(formDataObj);
            if (result?.success) {
                const result2 = await AuthService.getUserPaymentMethods();
                if (result2?.success) setPayments(result2?.data || []);
                setSelectedAddPaymentMethod("")
                setSelectedAddPaymentMethodId("")
                setPaymentInputs([])
                setPaymentMethodFormData({})
                setPreviewQr("")
                alertSuccessMessage("Payment method added successfully!");
            } else {
                alertErrorMessage(result?.message || "Something went wrong!");
            }
        } catch (error) {
            alertErrorMessage("Something went wrong!");
        } finally {
            LoaderHelper.loaderStatus(false);
        }
    }

    const formatLabel = (text) => {
        return text.replace(/([A-Z])/g, " $1").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    };

    useEffect(() => {
        getFiatCurrency();
        getAvailPaymentMethod();
    }, []);

    // Fetch pair price when crypto or fiat changes
    useEffect(() => {
        if (formData.crypto && formData.fiat) {
            getPairPrice(formData.crypto, formData.fiat);
        }
    }, [formData.crypto, formData.fiat]);

    const totalAmount = (formData.volume || 0) * (formData.fixedPrice || 0);

    const getPaymentMethods = () => {
        if (formData.side === "BUY") return selectedBuyerPaymentMethod;
        return selectedSellerPaymentMethod.map(m => m.name || m.type);
    };

    // Helper to get input class with error state
    const getInputClass = (fieldName, baseClass) => {
        return `${baseClass} ${fieldErrors[fieldName] ? 'error' : ''}`;
    };

    // Error message component
    const FieldError = ({ fieldName }) => {
        if (!fieldErrors[fieldName]) return null;
        return (
            <div className="p2p-create-post-field-error">
                <span>⚠</span> {fieldErrors[fieldName]}
            </div>
        );
    };

    // Preview Card Component
    const PreviewCard = () => {
        const totalValue = (Number(formData.volume) || 0) * (Number(formData.fixedPrice) || 0);
        const paymentTimeLabels = { '15': '15 Min', '30': '30 Min', '45': '45 Min', '60': '1 Hour', '120': '2 Hours' };

        const sideClass = formData.side === 'BUY' ? 'buy' : 'sell';
        return (
            <div className="p2p-preview-card">
                <div className={`p2p-preview-card-header p2p-preview-card-header-${sideClass}`}>
                    <div className="p2p-preview-card-header-inner">
                        <div>
                            <span className="p2p-preview-card-ad-label">Ad Preview</span>
                            <h3 className="p2p-preview-card-title">
                                <span className={`p2p-preview-card-badge p2p-preview-card-badge-${sideClass}`}>
                                    {formData.side}
                                </span>
                                {formData.crypto || 'USDT'}
                            </h3>
                        </div>
                        {isTablet && (
                            <button className="closebtn"
                                onClick={() => setShowPreview(false)}
                            >
                                ×
                            </button>
                        )}
                    </div>
                </div>

                <div className="p2p-preview-card-price-block">
                    <span className="p2p-preview-card-price-label">Price per {formData.crypto || 'USDT'}</span>
                    <div className={`p2p-preview-card-price-value p2p-preview-card-price-value-${sideClass}`}>
                        {formData.fixedPrice || '0.00'} <span className="p2p-preview-card-price-fiat">{formData.fiat}</span>
                    </div>
                    {marketPrice && (
                        <span className="p2p-preview-card-market">
                            Market: {marketPrice.toFixed(2)} {formData.fiat}
                        </span>
                    )}
                </div>

                <div className="p2p-preview-card-details">
                    <div className="p2p-preview-card-grid">
                        <div className="p2p-preview-card-grid-item">
                            <span className="p2p-preview-card-grid-label">Amount</span>
                            <span className="p2p-preview-card-grid-value">
                                {formData.volume || '0'} <span className="p2p-preview-card-grid-value-muted">{formData.crypto}</span>
                            </span>
                        </div>
                        <div className="p2p-preview-card-grid-item">
                            <span className="p2p-preview-card-grid-label">Total Value</span>
                            <span className="p2p-preview-card-grid-value">
                                {totalValue.toFixed(2)} <span className="p2p-preview-card-grid-value-muted">{formData.fiat}</span>
                            </span>
                        </div>
                        <div className="p2p-preview-card-grid-item">
                            <span className="p2p-preview-card-grid-label">Min Limit</span>
                            <span className="p2p-preview-card-grid-value">
                                {formData.min || '0'} <span className="p2p-preview-card-grid-value-muted">{formData.fiat}</span>
                            </span>
                        </div>
                        <div className="p2p-preview-card-grid-item">
                            <span className="p2p-preview-card-grid-label">Max Limit</span>
                            <span className="p2p-preview-card-grid-value">
                                {formData.max || '0'} <span className="p2p-preview-card-grid-value-muted">{formData.fiat}</span>
                            </span>
                        </div>
                    </div>

                    <div className="p2p-preview-card-payment-time">
                        <span className="p2p-preview-card-payment-time-label">⏱ Payment Time Limit</span>
                        <span className="p2p-preview-card-payment-time-value">
                            {paymentTimeLabels[formData.paymentTimeLimit] || formData.paymentTimeLimit + ' Min'}
                        </span>
                    </div>

                    <div className="p2p-preview-card-block">
                        <span className="p2p-preview-card-section-label">Payment Methods</span>
                        <div className="p2p-preview-card-badges-wrap">
                            {getPaymentMethods().length > 0 ? (
                                getPaymentMethods().map((method, i) => (
                                    <span key={i} className="p2p-preview-card-badge-pm">{method}</span>
                                ))
                            ) : (
                                <span className="p2p-preview-card-empty-pm">
                                    No payment method selected
                                </span>
                            )}
                        </div>
                    </div>

                    {(formData.completedKyc || formData.registeredUser) && (
                        <div className="p2p-preview-card-block">
                            <span className="p2p-preview-card-section-label">Counterparty Conditions</span>
                            <div className="p2p-preview-card-badges-wrap">
                                {formData.completedKyc && (
                                    <span className="p2p-preview-card-badge-kyc">✓ KYC Verified</span>
                                )}
                                {formData.registeredUser && (
                                    <span className="p2p-preview-card-badge-days">Registered {formData.registeredDays}+ days</span>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="p2p-preview-card-remarks">
                        <span className="p2p-preview-card-remarks-title">📝 Remarks</span>
                        <span className="p2p-preview-card-remarks-text">
                            {formData.remarks || 'No remarks added'}
                        </span>
                    </div>
                </div>

                <div className="p2p-preview-card-footer">
                    <div className="p2p-preview-card-footer-inner">
                        <span className="p2p-preview-card-footer-fee">Fee: {((cryptos.find(c => c.short_name === formData.crypto)?.p2p_fee) ?? 0)}%</span>
                        <span className="p2p-preview-card-footer-note">
                            {formData.side === 'SELL' ? `Available: ${availableBalance} ${formData.crypto}` : 'Preview Only'}
                        </span>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <P2pLayout title="Create Post">
            <div className="p2p-dashboard-container">
                {/* Mobile Preview Toggle */}
                {isTablet && !showPreview && (
                    <div className="p2p-mobile-preview-toggle" onClick={() => setShowPreview(true)}>
                        <span className="p2p-mobile-preview-toggle-text">
                            Preview: <span className={formData.side === 'BUY' ? 'p2p-preview-highlight-buy' : 'p2p-preview-highlight-sell'}>{formData.side} {formData.crypto} AD</span>
                        </span>
                        <span className="p2p-mobile-preview-view">View →</span>
                    </div>
                )}

                {/* Mobile Preview Overlay */}
                {isTablet && showPreview && (
                    <div className="p2p-create-post-mobile-preview-wrap">
                        <PreviewCard />
                    </div>
                )}

                <div className="p2p-create-post-container">
                    {/* Form Section */}
                    <div className="p2p-create-post-form-card">
                        <div className="p2p-create-post-header">
                            <h2 className="p2p-create-post-title">Create New Post</h2>
                            <p className="p2p-create-post-subtitle">Lorem Ipsum is simply dummy text of the printing and typesetting industry</p>
                        </div>

                        {/* Stepper */}
                        <div className="p2p-create-post-stepper">
                            <div className={`p2p-create-post-step-circle ${currentStep === 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}`}>
                                {currentStep > 1 ? '✓' : '1'}
                            </div>
                            <div className={`p2p-create-post-step-line ${currentStep > 1 ? 'completed' : ''}`}></div>
                            <div className={`p2p-create-post-step-circle ${currentStep === 2 ? 'active' : ''} ${currentStep > 2 ? 'completed' : ''}`}>
                                {currentStep > 2 ? '✓' : '2'}
                            </div>
                            <div className={`p2p-create-post-step-line ${currentStep > 2 ? 'completed' : ''}`}></div>
                            <div className={`p2p-create-post-step-circle ${currentStep === 3 ? 'active' : ''}`}>3</div>
                        </div>

                        {/* Step 1: I want to use + Price Settings */}
                        {currentStep === 1 && (
                            <>
                                {/* Buy/Sell Tabs - same as Step 2 */}
                                <div className="p2p-create-post-tabs-container">
                                    <button
                                        type="button"
                                        className={`p2p-create-post-tab-btn ${formData.side === "BUY" ? "active" : ""}`}
                                        onClick={() => handleInput("side", "BUY")}
                                    >
                                        I want to Buy
                                    </button>
                                    <button
                                        type="button"
                                        className={`p2p-create-post-tab-btn ${formData.side === "SELL" ? "active" : ""}`}
                                        onClick={() => handleInput("side", "SELL")}
                                    >
                                        I want to Sell
                                    </button>
                                </div>

                                <div className="p2p-create-post-section-title">
                                    <span className="p2p-create-post-section-icon">▶</span>
                                    I want to use
                                </div>
                                <div className="p2p-create-post-grid-two-col">
                                    <div className="p2p-create-post-input-group">
                                        <label className="p2p-create-post-label">Fiat</label>
                                        <div className="p2p-create-post-select-wrap">
                                            {formData.fiat && (
                                                <span className="p2p-create-post-select-icon p2p-create-post-select-icon-fiat">{getFiatSymbol(formData.fiat)}</span>
                                            )}
                                            <select
                                                className={`${getInputClass('fiat', 'p2p-create-post-select')} ${formData.fiat ? 'p2p-create-post-select-with-icon' : ''}`}
                                                value={formData.fiat}
                                                onChange={(e) => handleInput("fiat", e.target.value)}
                                            >
                                                <option value="" hidden>Select</option>
                                                {fiats?.map((f, i) => <option key={i} value={f.short_name}>{f.short_name}</option>)}
                                            </select>
                                        </div>
                                        <FieldError fieldName="fiat" />
                                    </div>
                                    <div className="p2p-create-post-input-group">
                                        <label className="p2p-create-post-label">Crypto</label>
                                        <div className="p2p-create-post-select-wrap">
                                            {formData.crypto && (
                                                <span className="p2p-create-post-select-icon">
                                                    <img
                                                        src={getCryptoIconSrc(formData.crypto, cryptos)}
                                                        alt=""
                                                        onError={(e) => { e.target.src = `${process.env.PUBLIC_URL || ''}/images/default_coin.png`; e.target.onerror = null; }}
                                                    />
                                                </span>
                                            )}
                                            <select
                                                className={`${getInputClass('crypto', 'p2p-create-post-select')} ${formData.crypto ? 'p2p-create-post-select-with-icon' : ''}`}
                                                value={formData.crypto}
                                                onChange={(e) => handleInput("crypto", e.target.value)}
                                            >
                                                <option value="" hidden>Select</option>
                                                {cryptos.map((c, i) => <option key={i} value={c.short_name}>{c.short_name}</option>)}
                                            </select>
                                        </div>
                                        <FieldError fieldName="crypto" />
                                    </div>
                                </div>
                                {fieldErrors.side && (
                                    <div className="p2p-create-post-field-error p2p-create-post-field-error-with-margin"><span>⚠</span> {fieldErrors.side}</div>
                                )}

                                <div className="p2p-create-post-fee-box">Fee: {((cryptos.find(c => c.short_name === formData.crypto)?.p2p_fee) ?? 0)}%</div>

                                <div className="p2p-create-post-section-spacing">
                                    <div className="p2p-create-post-section-title">
                                        <span className="p2p-create-post-section-icon">▶</span>
                                        Price Settings
                                    </div>
                                    <div className="p2p-create-post-grid-two-col">
                                        <div className="p2p-create-post-input-group">
                                            <label className="p2p-create-post-label">Price Type</label>
                                            <div className="p2p-radio-group">
                                                <label className="p2p-radio-label">
                                                    <input
                                                        type="radio"
                                                        name="priceType"
                                                        value="FIXED"
                                                        checked={formData.priceType === "FIXED"}
                                                        onChange={(e) => handleInput("priceType", e.target.value)}
                                                        className="p2p-radio-input"
                                                    />
                                                    <span className="p2p-radio-text">Fixed Price</span>
                                                </label>
                                            </div>
                                        </div>

                                    </div>
                                    <div className="p2p-create-post-input-group mt-3">
                                        <label className="p2p-create-post-label">Fixed Price</label>
                                        <div className={getInputClass('fixedPrice', 'p2p-create-post-input-with-suffix')}>
                                            <input
                                                type="number"
                                                className="p2p-create-post-input-inner"
                                                value={formData.fixedPrice}
                                                onChange={(e) => handleInput("fixedPrice", e.target.value)}
                                                placeholder="e.g. 85.50"
                                                onWheel={(e) => e.target.blur()}
                                            />
                                            <span className="p2p-create-post-input-suffix">{formData.fiat}</span>
                                        </div>
                                        <FieldError fieldName="fixedPrice" />
                                    </div>
                                </div>

                                {/* Market Price Info Box */}
                                <div className="p2p-create-post-info-box">
                                    {loader.pairPrice ? (
                                        <div className="p2p-create-post-market-loading">
                                            <span>Loading market price...</span>
                                        </div>
                                    ) : marketPrice ? (
                                        <>
                                            <div className="p2p-create-post-market-pair">
                                                {formData.crypto}/{formData.fiat}
                                            </div>
                                            <div className="p2p-create-post-market-row">
                                                <span className="p2p-create-post-market-bullet">•</span>
                                                Current Price: <span>{marketPrice.toFixed(2)}</span> {formData.fiat}
                                            </div>
                                            <div className="p2p-create-post-market-row">
                                                <span className="p2p-create-post-market-bullet">•</span>
                                                Ad can be placed between: <span>{minAllowedPrice}</span> - <span>{maxAllowedPrice}</span> {formData.fiat}
                                            </div>
                                        </>
                                    ) : (
                                        <div className="p2p-create-post-market-error">
                                            ⚠ Unable to fetch market price. Please try again.
                                        </div>
                                    )}
                                </div>

                                <div className='pricehigh_box'>
                                    <div className='pricehigh_box_item_container d-flex align-items-center '>
                                        <div className='pricehigh_box_item'>
                                            <div className='pricehigh_box_item_title'>
                                                <span>Your Price</span>
                                                ₹1,614.00
                                            </div>
                                        </div>
                                        <div className='pricehigh_box_item'>
                                            <div className='pricehigh_box_item_title'>
                                                <span>Highest Order Price</span>
                                                ₹1,814.00
                                            </div>
                                        </div>
                                    </div>

                                    <div className='helpguide'>
                                        <i className="ri-question-line"></i> help & Guide
                                    </div>

                                </div>


                                <div className='d-flex align-items-center justify-content-between btnnextback'>
                                    <button className='btn-secondary backbtn' onClick={prevStep}>
                                        Back
                                    </button>
                                    <button className='btn-primary nextbtn' onClick={nextStep}>
                                        Continue
                                    </button>
                                </div>
                            </>
                        )}

                        {/* Step 2: Transaction Settings + Payment Method */}
                        {currentStep === 2 && (
                            <>
                                {/* Buy/Sell Tabs */}
                                <div className="p2p-create-post-tabs-container">
                                    <button
                                        type="button"
                                        className={`p2p-create-post-tab-btn ${formData.side === "BUY" ? "active" : ""}`}
                                        onClick={() => handleInput("side", "BUY")}
                                    >
                                        I want to Buy
                                    </button>
                                    <button
                                        type="button"
                                        className={`p2p-create-post-tab-btn ${formData.side === "SELL" ? "active" : ""}`}
                                        onClick={() => handleInput("side", "SELL")}
                                    >
                                        I want to Sell
                                    </button>
                                </div>

                                <div className="p2p-create-post-section-title-inline">
                                    <span className="p2p-create-post-section-icon-inline">▶</span>
                                    Transaction Settings
                                </div>

                                <div className="p2p-create-post-grid-two-col">
                                    <div className="p2p-create-post-input-group">
                                        <label className="p2p-create-post-label">Payment Time Limit</label>
                                        <select
                                            className={getInputClass('paymentTimeLimit', 'p2p-create-post-select')}
                                            value={formData.paymentTimeLimit}
                                            onChange={(e) => handleInput("paymentTimeLimit", e.target.value)}
                                        >
                                            <option value="15">15 Minutes</option>
                                            <option value="30">30 Minutes</option>
                                            <option value="45">45 Minutes</option>
                                            <option value="60">1 Hour</option>
                                            <option value="120">2 Hours</option>
                                        </select>
                                        <FieldError fieldName="paymentTimeLimit" />
                                    </div>
                                    <div className="p2p-create-post-input-group">
                                        <label className="p2p-create-post-label">Volume</label>
                                        <div className={getInputClass('volume', 'p2p-create-post-input-with-suffix')}>
                                            <input
                                                type="number"
                                                className="p2p-create-post-input-inner"
                                                value={formData.volume}
                                                onChange={(e) => handleInput("volume", e.target.value)}
                                                placeholder="Enter Volume"
                                                onWheel={(e) => e.target.blur()}
                                            />
                                            <span className="p2p-create-post-input-suffix">{formData.crypto}</span>
                                            {formData.side === "SELL" && (
                                                <span className="p2p-create-post-available-text">Available</span>
                                            )}
                                        </div>
                                        {fieldErrors.volume ? (
                                            <FieldError fieldName="volume" />
                                        ) : formData.side === "SELL" ? (
                                            <>
                                                <div className="p2p-create-post-helper-text">
                                                    {loader.balance ? 'Loading balance...' : `Available: ${availableBalance} ${formData.crypto}`}
                                                </div>
                                                {Number(formData.volume) > 0 && (() => {
                                                    const vol = Number(formData.volume);
                                                    const p2pFeePercent = (cryptos.find(c => c.short_name === formData.crypto)?.p2p_fee) ?? 0;
                                                    const feeAmount = (vol * p2pFeePercent) / 100;
                                                    const totalRequired = vol + feeAmount;
                                                    const insufficient = totalRequired > availableBalance;
                                                    const shortfall = insufficient ? (totalRequired - availableBalance).toFixed(2) : 0;
                                                    return (
                                                        <div className="p2p-create-post-fee-breakdown-box">
                                                            <div className="p2p-create-post-fee-breakdown-row">
                                                                <span>Volume</span>
                                                                <span>{vol.toFixed(2)} {formData.crypto}</span>
                                                            </div>
                                                            <div className="p2p-create-post-fee-breakdown-row">
                                                                <span>Fee ({p2pFeePercent}%)</span>
                                                                <span>{feeAmount.toFixed(2)} {formData.crypto}</span>
                                                            </div>
                                                            <div className="p2p-create-post-fee-breakdown-row p2p-create-post-fee-breakdown-total">
                                                                <span>Total required</span>
                                                                <span>{totalRequired.toFixed(2)} {formData.crypto}</span>
                                                            </div>
                                                            {insufficient && (
                                                                <div className="p2p-create-post-insufficient-funds">Insufficient balance. Add {shortfall} {formData.crypto} (fee) to post this ad.</div>
                                                            )}
                                                        </div>
                                                    );
                                                })()}
                                            </>
                                        ) : null}
                                    </div>
                                    <div className="p2p-create-post-input-group">
                                        <label className="p2p-create-post-label">Min</label>
                                        <div className={getInputClass('min', 'p2p-create-post-input-with-suffix')}>
                                            <input
                                                type="number"
                                                className="p2p-create-post-input-inner"
                                                value={formData.min}
                                                onChange={(e) => handleInput("min", e.target.value)}
                                                placeholder="e.g. 500"
                                                onWheel={(e) => e.target.blur()}
                                            />
                                            <span className="p2p-create-post-input-suffix">{formData.fiat}</span>
                                        </div>
                                        {fieldErrors.min ? (
                                            <FieldError fieldName="min" />
                                        ) : (
                                            <div className="p2p-create-post-helper-text">at least 200 {formData.fiat}</div>
                                        )}
                                    </div>
                                    <div className="p2p-create-post-input-group">
                                        <label className="p2p-create-post-label">Max</label>
                                        <div className={getInputClass('max', 'p2p-create-post-input-with-suffix')}>
                                            <input
                                                type="number"
                                                className="p2p-create-post-input-inner"
                                                value={formData.max}
                                                onChange={(e) => handleInput("max", e.target.value)}
                                                placeholder="e.g. 10000"
                                                onWheel={(e) => e.target.blur()}
                                            />
                                            <span className="p2p-create-post-input-suffix">{formData.fiat}</span>
                                        </div>
                                        {fieldErrors.max && (
                                            <FieldError fieldName="max" />
                                        )}
                                    </div>
                                </div>

                                <div className="p2p-create-post-section-spacing">
                                    <div className="p2p-create-post-section-title-inline">
                                        <span className="p2p-create-post-section-icon-inline">▶</span>
                                        Select Payment Method
                                        {fieldErrors.paymentMethod && (
                                            <span className="p2p-create-post-payment-required-error">
                                                (Required)
                                            </span>
                                        )}
                                    </div>

                                    {/* For SELL: Show user's own payment methods with full details */}
                                    {formData.side === "SELL" && (
                                        <>
                                            {payments?.length > 0 ? (
                                                <div className="p2p-payment-methods-list">
                                                    {payments.map((method) => {
                                                        const isSelected = selectedSellerPaymentMethod.some(m => m._id === method._id);
                                                        // Keys to exclude from display
                                                        const excludeKeys = ['_id', 'templateId', 'type', 'name', 'qrCode'];
                                                        // Get displayable fields
                                                        const displayFields = Object.entries(method).filter(
                                                            ([key, value]) => !excludeKeys.includes(key) && value && value !== ''
                                                        );

                                                        return (
                                                            <div
                                                                key={method._id}
                                                                className={`p2p-payment-method-card ${isSelected ? 'selected' : ''} ${fieldErrors.paymentMethod ? 'error' : ''}`}
                                                                onClick={() => toggleSellerPayment(method)}
                                                            >
                                                                <div className="p2p-payment-method-header">
                                                                    <div className="p2p-payment-method-header-left">
                                                                        <span className="p2p-payment-method-name">
                                                                            {method.name || method.type}
                                                                        </span>
                                                                        {method.type && method.type !== method.name && (
                                                                            <span className="p2p-payment-method-type-badge">
                                                                                {method.type}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={isSelected}
                                                                        onChange={() => { }}
                                                                        className="p2p-create-post-checkbox"
                                                                    />
                                                                </div>
                                                                <div className="p2p-payment-method-fields-grid">
                                                                    {displayFields.map(([key, value]) => (
                                                                        <div key={key} className="p2p-payment-method-field">
                                                                            <span className="p2p-payment-method-field-label">{formatLabel(key)}: </span>
                                                                            <span className="p2p-payment-method-field-value">{value}</span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                                {method.qrCode && (
                                                                    <div className="p2p-payment-method-qr-section">
                                                                        <img
                                                                            src={`${ApiConfig.baseImage}${method.qrCode}`}
                                                                            alt="QR Code"
                                                                            className="p2p-payment-method-qr-image"
                                                                            onError={(e) => {
                                                                                e.target.style.display = 'none';
                                                                            }}
                                                                        />
                                                                        <span className="p2p-payment-method-qr-label">QR Code</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            ) : (
                                                <div className={`p2p-payment-methods-empty ${fieldErrors.paymentMethod ? 'error' : ''}`}>
                                                    No payment methods added. Please add a payment method first.
                                                </div>
                                            )}
                                        </>
                                    )}

                                    {/* For BUY: Show available payment method types */}
                                    {formData.side === "BUY" && (
                                        <div className="p2p-payment-grid">
                                            {availablePaymentMathod.slice(0, 6).map((method) => {
                                                const isSelected = selectedBuyerPaymentMethod.includes(method.name);
                                                return (
                                                    <div
                                                        key={method._id}
                                                        className={`p2p-payment-method-item ${isSelected ? 'selected' : ''} ${fieldErrors.paymentMethod && !isSelected ? 'error' : ''}`}
                                                        onClick={() => toggleBuyerPayment(method.name)}
                                                    >
                                                        <span className="p2p-payment-method-item-text">{method.name}</span>
                                                        <input
                                                            type="checkbox"
                                                            checked={isSelected}
                                                            onChange={() => { }}
                                                            className="p2p-create-post-checkbox"
                                                        />
                                                    </div>
                                                );
                                            })}
                                            <button
                                                className="p2p-add-method-button"
                                                data-bs-toggle="modal"
                                                data-bs-target={formData.side === "SELL" ? "#sellModal" : "#buyPaymentModal"}
                                            >
                                                <span className="p2p-add-method-button-icon">+</span> Add New Method
                                            </button>
                                        </div>
                                    )}

                                    {fieldErrors.paymentMethod && (
                                        <div className="p2p-payment-method-error">
                                            <span>⚠</span> {fieldErrors.paymentMethod}
                                        </div>
                                    )}


                                </div>

                                <div className='d-flex align-items-center justify-content-between btnnextback'>
                                    <button className='btn-secondary backbtn' onClick={prevStep}>Back</button>
                                    <button className='btn-primary nextbtn' onClick={nextStep}>Continue</button>
                                </div>


                            </>
                        )}

                        {/* Step 3: Remarks + Counterparty Conditions */}
                        {currentStep === 3 && (
                            <>
                                <div className="p2p-create-post-section-title">
                                    <span className="p2p-create-post-section-icon">▶</span>
                                    Remarks (Optional)
                                </div>
                                <textarea
                                    className="p2p-create-post-textarea"
                                    value={formData.remarks}
                                    onChange={(e) => handleInput("remarks", e.target.value)}
                                    placeholder="Enter remarks..."
                                />

                                <div className="p2p-create-post-step3-section">
                                    <div className="p2p-create-post-section-title">
                                        <span className="p2p-create-post-section-icon">▶</span>
                                        Counterparty Conditions
                                    </div>

                                    <label className="p2p-create-post-checkbox-label p2p-create-post-checkbox-label-wrap">
                                        <input
                                            type="checkbox"
                                            checked={formData.registeredUser}
                                            onChange={() => handleInput("registeredUser", !formData.registeredUser)}
                                            className="p2p-create-post-checkbox"
                                        />
                                        <span>Registered</span>
                                        {formData.registeredUser && (
                                            <div className="p2p-create-post-registered-input-wrapper">
                                                <input
                                                    type="number"
                                                    className={`p2p-create-post-registered-input ${fieldErrors['registeredDays'] ? 'error' : ''}`}
                                                    value={formData.registeredDays}
                                                    onChange={(e) => handleInput("registeredDays", e.target.value)}
                                                    min="0"
                                                />
                                                <span className="p2p-create-post-registered-label">day(s) ago</span>
                                            </div>
                                        )}
                                    </label>
                                    {fieldErrors.registeredDays && (
                                        <div className="p2p-create-post-field-error">
                                            <span>⚠</span> {fieldErrors.registeredDays}
                                        </div>
                                    )}
                                </div>

                                <div className="p2p-create-post-step3-section">
                                    <div className="p2p-create-post-section-title">
                                        <span className="p2p-create-post-section-icon">▶</span>
                                        Status
                                    </div>
                                    <div className="p2p-create-post-radio-group">
                                        <label className="p2p-create-post-radio-label">
                                            <input
                                                type="radio"
                                                name="status"
                                                value="ONLINE"
                                                checked={formData.status === "ONLINE"}
                                                onChange={(e) => handleInput("status", e.target.value)}
                                                className="p2p-create-post-radio-input"
                                            />
                                            <span className="p2p-create-post-radio-text">Online</span>
                                        </label>
                                        <label className="p2p-create-post-radio-label">
                                            <input
                                                type="radio"
                                                name="status"
                                                value="OFFLINE"
                                                checked={formData.status === "OFFLINE"}
                                                onChange={(e) => handleInput("status", e.target.value)}
                                                className="p2p-create-post-radio-input"
                                            />
                                            <span className="p2p-create-post-radio-text">Offline</span>
                                        </label>
                                    </div>
                                </div>

                                <div className="p2p-create-post-agreement-box">
                                    <label className="p2p-create-post-checkbox-label p2p-create-post-checkbox-label-no-margin">
                                        <input
                                            type="checkbox"
                                            checked={formData.agree}
                                            onChange={() => handleInput("agree", !formData.agree)}
                                            className="p2p-create-post-checkbox"
                                        />
                                        <span className="p2p-create-post-agreement-text">
                                            I Have Read And Agree To Peer-To-Peer (P2P) Service Agreement
                                        </span>
                                    </label>
                                </div>
                                {fieldErrors.agree && (
                                    <div className="p2p-create-post-field-error p2p-create-post-field-error-agreement">
                                        <span>⚠</span> {fieldErrors.agree}
                                    </div>
                                )}

                                <div className="d-flex align-items-center justify-content-between btnnextback">
                                    <button className="btn-secondary backbtn" onClick={prevStep}>Cancel</button>
                                    <button
                                        className={`btn-primary nextbtn ${formData.side === 'SELL' ? 'p2p-create-post-btn-primary-sell' : 'p2p-create-post-btn-primary-buy'}`}
                                        onClick={openConfirmModal}
                                    >
                                        Create Ad
                                    </button>
                                </div>

                            </>
                        )}
                    </div>

                    {/* Desktop Preview Card */}
                    {/* {!isTablet && <PreviewCard />} */}
                </div>
            </div>

            {/* Seller payment modal - Add New Payment Method */}
            <div className="modal fade p2p-sell-modal" id="sellModal" tabIndex="-1">
                <div className="modal-dialog modal-dialog-centered modal-lg">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">
                                {selectedAddPaymentMethod ? 'Set My Payment Method' : 'Add Payment Method'}
                            </h5>
                            <button
                                type="button"
                                className="btn-close btn-close-white"
                                data-bs-dismiss="modal"
                                onClick={() => {
                                    setSelectedAddPaymentMethod("");
                                    setSelectedAddPaymentMethodId("");
                                    setPaymentInputs([]);
                                    setPaymentMethodFormData({});
                                    setPreviewQr("");
                                }}
                            ></button>
                        </div>
                        <div className="modal-body">
                            <div className="p2p-sell-modal-tips">
                                <span className="p2p-sell-modal-tips-icon">ℹ</span>
                                <span className="p2p-sell-modal-tips-text">
                                    Tips: The added payment method will be shown to the buyer during the transaction to accept fiat transfers.
                                    Please ensure that the information is correct, real and matches your KYC information.
                                </span>
                            </div>

                            {!selectedAddPaymentMethod && (
                                <>
                                    <div className="p2p-sell-modal-input-wrap">
                                        <label className="p2p-sell-modal-label">
                                            Select Payment Method Type
                                        </label>
                                        {loader.paymentMethods ? (
                                            <div className="p2p-sell-modal-spinner-wrap">
                                                <div className="spinner-border text-primary" role="status" />
                                            </div>
                                        ) : (
                                            <div className="p2p-sell-modal-methods-grid">
                                                {availablePaymentMathod?.map((method) => (
                                                    <div
                                                        key={method._id}
                                                        className={`p2p-sell-modal-method-card ${!isKycCompleted ? 'disabled' : ''}`}
                                                        onClick={() => {
                                                            if (isKycCompleted) {
                                                                getPaymentMethodFields(method._id, method.name);
                                                            } else {
                                                                alertErrorMessage("Please complete KYC verification before adding a payment method.");
                                                            }
                                                        }}
                                                    >
                                                        <span className="p2p-sell-modal-method-name">{method.name}</span>
                                                        {(method.name === 'IMPS' || method.name === 'UPI') && (
                                                            <span className="p2p-sell-modal-method-badge">
                                                                Recommended
                                                            </span>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}

                            {selectedAddPaymentMethod && (
                                <>
                                    <div className="p2p-sell-modal-back-row">
                                        <button
                                            type="button"
                                            className="p2p-sell-modal-back-btn"
                                            onClick={() => {
                                                setSelectedAddPaymentMethod("");
                                                setSelectedAddPaymentMethodId("");
                                                setPaymentInputs([]);
                                                setPaymentMethodFormData({});
                                                setPreviewQr("");
                                            }}
                                        >
                                            ← Back
                                        </button>
                                        <span className="p2p-sell-modal-back-title">{selectedAddPaymentMethod}</span>
                                    </div>

                                    {!isKycCompleted && (
                                        <div className="p2p-sell-modal-kyc-warning">
                                            <strong>KYC Verification Required:</strong> Please complete your KYC verification before adding a payment method.
                                        </div>
                                    )}

                                    {kycUpdateName && (
                                        <div className="p2p-sell-modal-input-wrap">
                                            <label className="p2p-sell-modal-label">
                                                Name
                                            </label>
                                            <input
                                                type="text"
                                                value={kycUpdateName}
                                                disabled
                                                className="p2p-sell-modal-input-bg"
                                            />
                                            <small className="p2p-sell-modal-small">
                                                This name is taken from your KYC verification
                                            </small>
                                        </div>
                                    )}

                                    {loader.paymentInput ? (
                                        <div className="p2p-sell-modal-spinner-lg">
                                            <div className="spinner-border text-primary" role="status" />
                                        </div>
                                    ) : (
                                        <div className="p2p-sell-modal-fields">
                                            {paymentInputs?.map((field, index) => {
                                                // Check if this is a name field
                                                const isNameField = false
                                                const currentValue = paymentMethodFormData[field.field] || '';
                                                const placeholder = isNameField && isKycCompleted && kycUpdateName && !currentValue
                                                    ? kycUpdateName
                                                    : (field.placeholder || `${(field.label || field.field)}`);

                                                return (
                                                    <div key={index}>
                                                        <label className="p2p-sell-modal-label">
                                                            {(field.label || field.field)}
                                                            {(field.type === 'file' || field.type === 'files') ? (
                                                                <span className="p2p-sell-modal-label-optional"> (Optional)</span>
                                                            ) : (
                                                                field.required !== false && <span className="p2p-sell-modal-label-required"> *</span>
                                                            )}
                                                        </label>
                                                        {field.type === 'file' || field.type === 'files' ? (
                                                            <div>
                                                                <div className={`p2p-sell-modal-file-zone ${!isKycCompleted ? 'disabled' : ''}`}>
                                                                    <input
                                                                        type="file"
                                                                        name={field.field}
                                                                        accept=".jpg,.jpeg,.png,.bmp"
                                                                        onChange={handlePaymentMethodAddImage}
                                                                        disabled={!isKycCompleted}
                                                                        className="p2p-sell-modal-file-input"
                                                                    />
                                                                    {previewQr ? (
                                                                        <img src={previewQr} alt="Preview" className="p2p-sell-modal-file-preview" />
                                                                    ) : (
                                                                        <>
                                                                            <div className="p2p-sell-modal-file-placeholder-icon">⬆</div>
                                                                            <div className="p2p-sell-modal-file-placeholder-text">Upload QR Code</div>
                                                                        </>
                                                                    )}
                                                                </div>
                                                                <small className="p2p-sell-modal-small">
                                                                    JPG/JPEG/PNG, less than 3MB
                                                                </small>
                                                            </div>
                                                        ) : (
                                                            <input
                                                                type={field.type || 'text'}
                                                                name={field.field}
                                                                value={currentValue}
                                                                onChange={handlePaymentMethodAddInput}
                                                                placeholder={placeholder}
                                                                disabled={!isKycCompleted}
                                                                className={`p2p-sell-modal-input ${!isKycCompleted ? 'disabled' : ''}`}
                                                            />
                                                        )}
                                                    </div>
                                                );
                                            })}

                                            <div className="p2p-sell-modal-warning-box">
                                                <span className="p2p-sell-modal-warning-text">
                                                    Warning: Please ensure all information is accurate and matches your KYC details.
                                                </span>
                                            </div>

                                            <div className="p2p-sell-modal-buttons">
                                                <button
                                                    type="button"
                                                    className="p2p-sell-modal-btn-cancel"
                                                    data-bs-dismiss="modal"
                                                    onClick={() => {
                                                        setSelectedAddPaymentMethod("");
                                                        setSelectedAddPaymentMethodId("");
                                                        setPaymentInputs([]);
                                                        setPaymentMethodFormData({});
                                                        setPreviewQr("");
                                                    }}
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    type="button"
                                                    className={`p2p-sell-modal-btn-confirm ${!isKycCompleted ? 'disabled' : ''}`}
                                                    onClick={handleSubmitPaymentMethod}
                                                    disabled={!isKycCompleted}
                                                >
                                                    Confirm
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Buyer payment modal */}
            <div className="modal fade" id="buyPaymentModal" tabIndex="-1">
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content p2p-modal-content">
                        <div className="modal-header p2p-modal-header">
                            <h5 className="p2p-modal-title">Select Payment Method</h5>
                            <button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div className="modal-body p2p-modal-body">
                            <p className="p2p-buyer-modal-desc">Select up to 5 methods</p>
                            <div className='payment_search_box'>
                                <input
                                    type="search"
                                    placeholder="Search payment method..."
                                    value={searchAvailPayment}
                                    onChange={(e) => setSearchAvailPayment(e.target.value)}
                                />
                            </div>
                            <div className="p2p-modal-options">
                                {loader?.paymentMethods ? (
                                    <div className="p2p-buyer-modal-spinner-wrap">
                                        <div className="spinner-border text-primary" role="status" />
                                    </div>
                                ) : availablePaymentMathod?.length > 0 && availablePaymentMathod
                                    .filter(method => !searchAvailPayment || method?.name?.toLowerCase().includes(searchAvailPayment.toLowerCase()))
                                    .map(method => (
                                        <label
                                            key={method?._id}
                                            className={`p2p-payment-option ${selectedBuyerPaymentMethod?.includes(method?.name) ? 'p2p-selected' : ''}`}
                                            onClick={() => toggleBuyerPayment(method?.name)}
                                        >
                                            <span>{method?.name}</span>
                                            <input
                                                type="checkbox"
                                                checked={selectedBuyerPaymentMethod?.includes(method?.name)}
                                                onChange={() => { }}
                                            />
                                        </label>
                                    ))
                                }
                                <button className='p2p-submit-button'>Submit</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Confirm Post Modal */}
            <div className="modal fade payment_method_pop userprofile_pop confirm_post" id="confirmpostModal" tabIndex="-1">
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content text-white">
                        <div className="modal-header border-0">
                            <h5 className="modal-title">Confirm to Post</h5>
                            <button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div className="modal-body text-center detailuser_profile_two">
                            <ul className="list_upi">
                                <li>Type<span className={formData.side === 'SELL' ? 'text-danger' : 'text-success'}>{formData.side}</span></li>
                                <li>Asset<span>{formData.crypto}</span></li>
                                <li>Currency<span>{formData.fiat}</span></li>
                                <li>Price Type<span>Fixed</span></li>
                                <li>Fixed<span className="text-success">{formData.fixedPrice} {formData.fiat}</span></li>
                                <li>Order Limit<span>{formData.min} {formData.fiat} - {formData.max} {formData.fiat}</span></li>
                                <li>Total Trading Amount<span>{formData.volume} {formData.crypto}</span></li>
                                <li>Reserved Fee<span className="p2p-confirm-post-fee">{formData.side === 'SELL' ? (() => { const p = (cryptos.find(c => c.short_name === formData.crypto)?.p2p_fee) ?? 0; const amt = (Number(formData.volume) || 0) * p / 100; return `${amt.toFixed(2)} ${formData.crypto} (${p}%)`; })() : `0.00 ${formData.crypto}`}</span></li>
                                <li><hr /></li>
                                <li>
                                    Payment Method
                                    <span>
                                        {getPaymentMethods().length > 0 ? (
                                            getPaymentMethods().map((method, i) => (
                                                <abbr key={i}>{method}</abbr>
                                            ))
                                        ) : (
                                            'None'
                                        )}
                                    </span>
                                </li>
                                <li>Payment Time Limit<span>{formData.paymentTimeLimit === '60' ? '1 Hour' : formData.paymentTimeLimit === '120' ? '2 Hours' : `${formData.paymentTimeLimit} min`}</span></li>
                                <li>Available Region(s)<span>All Regions</span></li>
                                <li>Status<span className="text-success">● Online</span></li>
                                {formData.remarks && (
                                    <li>Remarks<span>{formData.remarks}</span></li>
                                )}
                            </ul>
                            <div className="d-flex align-items-center justify-content-between btnnextback">
                                <button className="btn-secondary backbtn" data-bs-dismiss="modal">Cancel</button>
                                <button className="btn-primary nextbtn" onClick={handleSubmit}>Confirm Post</button>
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </P2pLayout>
    );
};

export default P2pCreatePost;
