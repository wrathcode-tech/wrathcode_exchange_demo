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

    // Responsive Styles
    const styles = {
        container: {
            display: 'grid',
            gridTemplateColumns: isTablet ? '1fr' : '1fr 380px',
            gap: isMobile ? '16px' : '24px',
            maxWidth: '100%',
            width: '100%',
            boxSizing: 'border-box'
        },
        formCard: {
            background: '#12121a',
            borderRadius: isMobile ? '12px' : '16px',
            border: '1px solid #1e1e2d',
            padding: isMobile ? '16px' : isTablet ? '24px' : '32px',
            width: '100%',
            maxWidth: '100%',
            boxSizing: 'border-box',
            overflowX: 'hidden',
            position: 'relative'
        },
        header: {
            marginBottom: isMobile ? '20px' : '32px'
        },
        title: {
            fontSize: isMobile ? '20px' : '24px',
            fontWeight: '600',
            color: '#fff',
            margin: '0 0 8px 0'
        },
        subtitle: {
            color: '#666',
            fontSize: isMobile ? '12px' : '14px',
            margin: 0
        },
        stepper: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: isMobile ? '20px' : '32px',
            gap: '0'
        },
        stepCircle: (active, completed) => ({
            width: isMobile ? '28px' : '32px',
            height: isMobile ? '28px' : '32px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: isMobile ? '12px' : '14px',
            fontWeight: '600',
            background: completed ? '#22c55e' : active ? '#ffdc88' : 'transparent',
            border: `2px solid ${completed ? '#22c55e' : active ? '#ffdc88' : '#2a2a3a'}`,
            color: completed || active ? '#fff' : '#666',
            transition: 'all 0.3s ease',
            flexShrink: 0
        }),
        stepLine: (completed) => ({
            width: isMobile ? '40px' : isTablet ? '80px' : '120px',
            height: '2px',
            background: completed ? '#22c55e' : '#2a2a3a',
            transition: 'all 0.3s ease'
        }),
        sectionTitle: {
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: isMobile ? '14px' : '16px',
            fontWeight: '600',
            color: '#fff',
            marginBottom: isMobile ? '16px' : '20px'
        },
        sectionIcon: {
            color: '#F3BB2B'
        },
        inputGroup: {
            marginBottom: isMobile ? '16px' : '20px',
            width: '100%',
            maxWidth: '100%',
            minWidth: 0,
            boxSizing: 'border-box',
            overflow: 'hidden'
        },
        label: {
            display: 'block',
            color: '#888',
            fontSize: isMobile ? '12px' : '13px',
            marginBottom: '8px'
        },
        select: {
            width: '100%',
            maxWidth: '100%',
            minWidth: 0,
            padding: isMobile ? '12px 40px 12px 14px' : '14px 44px 14px 16px',
            background: '#373f4d',
            border: '1px solid #2a2a3a',
            borderRadius: '10px',
            color: '#fff',
            fontSize: isMobile ? '13px' : '14px',
            cursor: 'pointer',
            appearance: 'none',
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%23888' viewBox='0 0 16 16'%3E%3Cpath d='M8 11L3 6h10l-5 5z'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: isMobile ? 'right 12px center' : 'right 16px center',
            backgroundSize: '12px 12px',
            boxSizing: 'border-box',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            transition: 'border-color 0.2s ease, box-shadow 0.2s ease'
        },
        input: {
            width: '100%',
            padding: isMobile ? '12px 14px' : '14px 16px',
            background: '#373f4d',
            border: '1px solid #2a2a3a',
            borderRadius: '10px',
            color: '#fff',
            fontSize: isMobile ? '13px' : '14px',
            outline: 'none',
            boxSizing: 'border-box',
            transition: 'border-color 0.2s ease, box-shadow 0.2s ease'
        },
        inputWithSuffix: {
            display: 'flex',
            alignItems: 'center',
            background: '#373f4d',
            border: '1px solid #2a2a3a',
            borderRadius: '10px',
            // overflow: 'hidden',
            transition: 'border-color 0.2s ease, box-shadow 0.2s ease'
        },
        inputInner: {
            flex: 1,
            padding: isMobile ? '12px 14px' : '14px 16px',
            background: 'transparent',
            border: 'none',
            color: '#fff',
            fontSize: isMobile ? '13px' : '14px',
            outline: 'none',
            minWidth: 0
        },
        inputSuffix: {
            padding: isMobile ? '12px 10px' : '14px 16px',
            color: '#888',
            fontSize: isMobile ? '12px' : '14px',
            borderLeft: '1px solid #2a2a3a',
            whiteSpace: 'nowrap'
        },
        availableText: {
            color: '#22c55e',
            fontSize: isMobile ? '10px' : '12px',
            marginLeft: '8px',
            display: isMobile ? 'none' : 'inline'
        },
        feeBox: {
            background: 'linear-gradient(90deg, rgba(34, 197, 94, 0.1) 0%, transparent 100%)',
            border: '1px solid rgba(34, 197, 94, 0.2)',
            borderRadius: '10px',
            padding: isMobile ? '10px 14px' : '12px 16px',
            color: '#22c55e',
            fontSize: isMobile ? '13px' : '14px',
            marginTop: isMobile ? '16px' : '20px'
        },
        infoBox: {
            background: '#373f4d',
            borderRadius: '10px',
            padding: isMobile ? '12px' : '16px',
            marginTop: '16px'
        },
        pairText: {
            color: '#f59e0b',
            fontSize: isMobile ? '14px' : '15px',
            fontWeight: '600',
            marginBottom: '8px'
        },
        infoText: {
            color: '#a8b4c4',
            fontSize: isMobile ? '12px' : '13px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '6px',
            marginBottom: '4px'
        },
        paymentMethod: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: isMobile ? '12px 14px' : '14px 16px',
            background: '#373f4d',
            border: '1px solid #2a2a3a',
            borderRadius: '10px',
            marginBottom: '12px',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
        },
        paymentMethodActive: {
            borderColor: '#ffdc88',
            background: 'rgba(255, 220, 136, 0.1)'
        },
        tabsContainer: {
            display: 'flex',
            gap: '0',
            marginBottom: isMobile ? '24px' : '32px',
            borderBottom: '1px solid #2a2a3a'
        },
        tabButton: {
            background: 'transparent',
            border: 'none',
            color: '#888',
            fontSize: isMobile ? '14px' : '16px',
            fontWeight: '400',
            padding: isMobile ? '12px 16px' : '14px 20px',
            cursor: 'pointer',
            position: 'relative',
            transition: 'all 0.3s ease',
            borderBottom: '2px solid transparent',
            marginBottom: '-1px'
        },
        tabButtonActive: {
            color: '#fff',
            fontWeight: '500',
            borderBottom: '2px solid #fff'
        },
        paymentMethodError: {
            borderColor: '#ef4444',
            boxShadow: '0 0 0 3px rgba(239, 68, 68, 0.1)'
        },
        checkbox: {
            width: isMobile ? '18px' : '20px',
            height: isMobile ? '18px' : '20px',
            accentColor: '#ffdc88',
            flexShrink: 0
        },
        addMethodBtn: {
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: '#ffdc88',
            background: 'transparent',
            border: 'none',
            fontSize: isMobile ? '13px' : '14px',
            cursor: 'pointer',
            padding: '8px 0'
        },
        textarea: {
            width: '100%',
            padding: isMobile ? '12px 14px' : '14px 16px',
            background: '#0d0d14',
            border: '1px solid #2a2a3a',
            borderRadius: '10px',
            color: '#fff',
            fontSize: isMobile ? '13px' : '14px',
            outline: 'none',
            minHeight: isMobile ? '80px' : '100px',
            resize: 'vertical',
            boxSizing: 'border-box',
            transition: 'border-color 0.2s ease, box-shadow 0.2s ease'
        },
        checkboxLabel: {
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
            color: '#ccc',
            fontSize: isMobile ? '13px' : '14px',
            cursor: 'pointer',
            marginBottom: '16px'
        },
        buttonGroup: {
            display: 'flex',
            gap: '12px',
            marginTop: isMobile ? '24px' : '32px',
            flexDirection: isMobile ? 'column-reverse' : 'row'
        },
        btnPrimary: {
            flex: isMobile ? 'unset' : 1,
            padding: isMobile ? '14px 20px' : '14px 24px',
            background: '#22c55e',
            border: 'none',
            borderRadius: '10px',
            color: '#fff',
            fontSize: isMobile ? '14px' : '15px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            width: isMobile ? '100%' : 'auto'
        },
        btnSecondary: {
            padding: isMobile ? '14px 20px' : '14px 24px',
            background: 'transparent',
            border: '1px solid #2a2a3a',
            borderRadius: '10px',
            color: '#fff',
            fontSize: isMobile ? '14px' : '15px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            width: isMobile ? '100%' : 'auto'
        },
        previewCard: {
            background: '#12121a',
            borderRadius: isMobile ? '12px' : '16px',
            border: '1px solid #1e1e2d',
            // overflow: 'hidden',
            position: isTablet ? 'relative' : 'sticky',
            top: isTablet ? '0' : '20px'
        },
        previewHeader: {
            padding: isMobile ? '16px' : '20px 24px',
            borderBottom: '1px solid #1e1e2d',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
        },
        previewTitle: {
            fontSize: isMobile ? '14px' : '16px',
            color: '#888',
            margin: 0
        },
        previewHighlight: {
            color: formData.side === 'BUY' ? '#22c55e' : '#ef4444',
            fontWeight: '600'
        },
        previewBody: {
            padding: isMobile ? '16px' : '24px'
        },
        previewRow: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: isMobile ? '12px' : '16px',
            flexWrap: 'wrap',
            gap: '8px'
        },
        previewLabel: {
            color: '#666',
            fontSize: isMobile ? '13px' : '14px'
        },
        previewValue: {
            color: '#fff',
            fontSize: isMobile ? '13px' : '14px',
            fontWeight: '500',
            textAlign: 'right'
        },
        previewBadges: {
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px',
            justifyContent: 'flex-end'
        },
        previewBadge: {
            padding: isMobile ? '4px 10px' : '6px 12px',
            background: 'rgba(255, 220, 136, 0.1)',
            border: '1px solid rgba(255, 220, 136, 0.3)',
            borderRadius: '6px',
            color: '#a8b4c4',
            fontSize: isMobile ? '11px' : '12px'
        },
        previewRemarks: {
            marginTop: isMobile ? '16px' : '20px',
            paddingTop: isMobile ? '16px' : '20px',
            borderTop: '1px solid #1e1e2d'
        },
        previewRemarksTitle: {
            color: '#888',
            fontSize: isMobile ? '12px' : '13px',
            marginBottom: '8px'
        },
        previewRemarksText: {
            color: '#ccc',
            fontSize: isMobile ? '12px' : '13px',
            lineHeight: '1.5'
        },
        agreementBox: {
            background: fieldErrors.agree ? 'rgba(239, 68, 68, 0.05)' : '#0d0d14',
            borderRadius: '10px',
            padding: isMobile ? '12px' : '16px',
            marginBottom: '20px',
            border: fieldErrors.agree ? '1px solid #ef4444' : '1px solid transparent',
            transition: 'all 0.2s ease'
        },
        helperText: {
            color: '#666',
            fontSize: isMobile ? '11px' : '12px',
            marginTop: '6px'
        },
        mobilePreviewToggle: {
            display: isTablet ? 'flex' : 'none',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            background: '#0d0d14',
            borderRadius: '10px',
            marginBottom: '16px',
            cursor: 'pointer',
            border: '1px solid #2a2a3a'
        },
        gridTwoCol: {
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
            gap: isMobile ? '12px' : '16px',
            width: '100%',
            maxWidth: '100%',
            minWidth: 0,
            boxSizing: 'border-box',
            overflow: 'hidden'
        },
        paymentGrid: {
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
            gap: isMobile ? '10px' : '16px'
        }
    };

    // Preview Card Component
    const PreviewCard = () => {
        const totalValue = (Number(formData.volume) || 0) * (Number(formData.fixedPrice) || 0);
        const paymentTimeLabels = { '15': '15 Min', '30': '30 Min', '45': '45 Min', '60': '1 Hour', '120': '2 Hours' };

        return (
            <div style={styles.previewCard}>

                <div style={{
                    padding: isMobile ? '16px' : '20px 24px',
                    background: formData.side === 'BUY' ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.15) 0%, rgba(34, 197, 94, 0.05) 100%)' : 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(239, 68, 68, 0.05) 100%)',
                    borderBottom: '1px solid #1e1e2d'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <span style={{ color: '#888', fontSize: '12px', display: 'block', marginBottom: '4px' }}>Ad Preview</span>
                            <h3 style={{
                                color: '#fff',
                                fontSize: isMobile ? '18px' : '20px',
                                fontWeight: '700',
                                margin: 0,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}>
                                <span style={{
                                    color: formData.side === 'BUY' ? '#22c55e' : '#ef4444',
                                    background: formData.side === 'BUY' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                                    padding: '4px 10px',
                                    borderRadius: '6px',
                                    fontSize: '14px'
                                }}>
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

                {/* Price Highlight */}
                <div style={{
                    padding: isMobile ? '16px' : '20px 24px',
                    borderBottom: '1px solid #1e1e2d',
                    textAlign: 'center'
                }}>
                    <span style={{ color: '#666', fontSize: '12px', display: 'block', marginBottom: '4px' }}>Price per {formData.crypto || 'USDT'}</span>
                    <div style={{
                        color: formData.side === 'BUY' ? '#22c55e' : '#ef4444',
                        fontSize: isMobile ? '28px' : '32px',
                        fontWeight: '700',
                        letterSpacing: '-1px'
                    }}>
                        {formData.fixedPrice || '0.00'} <span style={{ fontSize: '16px', color: '#888' }}>{formData.fiat}</span>
                    </div>
                    {marketPrice && (
                        <span style={{ color: '#666', fontSize: '11px', marginTop: '4px', display: 'block' }}>
                            Market: {marketPrice.toFixed(2)} {formData.fiat}
                        </span>
                    )}
                </div>

                {/* Details Grid */}
                <div style={{ padding: isMobile ? '16px' : '20px 24px' }}>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '16px',
                        marginBottom: '16px'
                    }}>
                        <div style={{ background: '#0d0d14', padding: '12px', borderRadius: '10px' }}>
                            <span style={{ color: '#666', fontSize: '11px', display: 'block', marginBottom: '4px' }}>Amount</span>
                            <span style={{ color: '#fff', fontSize: '15px', fontWeight: '600' }}>
                                {formData.volume || '0'} <span style={{ color: '#888', fontSize: '12px' }}>{formData.crypto}</span>
                            </span>
                        </div>
                        <div style={{ background: '#0d0d14', padding: '12px', borderRadius: '10px' }}>
                            <span style={{ color: '#666', fontSize: '11px', display: 'block', marginBottom: '4px' }}>Total Value</span>
                            <span style={{ color: '#fff', fontSize: '15px', fontWeight: '600' }}>
                                {totalValue.toFixed(2)} <span style={{ color: '#888', fontSize: '12px' }}>{formData.fiat}</span>
                            </span>
                        </div>
                        <div style={{ background: '#0d0d14', padding: '12px', borderRadius: '10px' }}>
                            <span style={{ color: '#666', fontSize: '11px', display: 'block', marginBottom: '4px' }}>Min Limit</span>
                            <span style={{ color: '#fff', fontSize: '15px', fontWeight: '600' }}>
                                {formData.min || '0'} <span style={{ color: '#888', fontSize: '12px' }}>{formData.fiat}</span>
                            </span>
                        </div>
                        <div style={{ background: '#0d0d14', padding: '12px', borderRadius: '10px' }}>
                            <span style={{ color: '#666', fontSize: '11px', display: 'block', marginBottom: '4px' }}>Max Limit</span>
                            <span style={{ color: '#fff', fontSize: '15px', fontWeight: '600' }}>
                                {formData.max || '0'} <span style={{ color: '#888', fontSize: '12px' }}>{formData.fiat}</span>
                            </span>
                        </div>
                    </div>

                    {/* Payment Time */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '12px',
                        background: '#0d0d14',
                        borderRadius: '10px',
                        marginBottom: '16px'
                    }}>
                        <span style={{ color: '#666', fontSize: '13px' }}>⏱ Payment Time Limit</span>
                        <span style={{ color: '#fff', fontSize: '14px', fontWeight: '500' }}>
                            {paymentTimeLabels[formData.paymentTimeLimit] || formData.paymentTimeLimit + ' Min'}
                        </span>
                    </div>

                    {/* Payment Methods */}
                    <div style={{ marginBottom: '16px' }}>
                        <span style={{ color: '#666', fontSize: '12px', display: 'block', marginBottom: '8px' }}>Payment Methods</span>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {getPaymentMethods().length > 0 ? (
                                getPaymentMethods().map((method, i) => (
                                    <span key={i} style={{
                                        padding: '6px 12px',
                                        background: 'rgba(255, 220, 136, 0.1)',
                                        border: '1px solid rgba(255, 220, 136, 0.3)',
                                        borderRadius: '6px',
                                        // color: '#60a5fa',
                                        fontSize: '12px',
                                        fontWeight: '500'
                                    }}>{method}</span>
                                ))
                            ) : (
                                <span style={{
                                    color: '#666',
                                    fontSize: '12px',
                                    padding: '6px 12px',
                                    background: '#0d0d14',
                                    borderRadius: '6px',
                                    border: '1px dashed #2a2a3a'
                                }}>
                                    No payment method selected
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Counterparty Conditions */}
                    {(formData.completedKyc || formData.registeredUser) && (
                        <div style={{ marginBottom: '16px' }}>
                            <span style={{ color: '#666', fontSize: '12px', display: 'block', marginBottom: '8px' }}>Counterparty Conditions</span>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                {formData.completedKyc && (
                                    <span style={{
                                        padding: '6px 12px',
                                        background: 'rgba(34, 197, 94, 0.1)',
                                        border: '1px solid rgba(34, 197, 94, 0.3)',
                                        borderRadius: '6px',
                                        color: '#4ade80',
                                        fontSize: '12px'
                                    }}>✓ KYC Verified</span>
                                )}
                                {formData.registeredUser && (
                                    <span style={{
                                        padding: '6px 12px',
                                        background: 'rgba(245, 158, 11, 0.1)',
                                        border: '1px solid rgba(245, 158, 11, 0.3)',
                                        borderRadius: '6px',
                                        color: '#fbbf24',
                                        fontSize: '12px'
                                    }}>Registered {formData.registeredDays}+ days</span>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Remarks */}
                    <div style={{
                        padding: '12px',
                        background: '#0d0d14',
                        borderRadius: '10px',
                        borderLeft: '3px solid #ffdc88'
                    }}>
                        <span style={{ color: '#666', fontSize: '11px', display: 'block', marginBottom: '6px' }}>📝 Remarks</span>
                        <span style={{ color: '#aaa', fontSize: '13px', lineHeight: '1.5' }}>
                            {formData.remarks || 'No remarks added'}
                        </span>
                    </div>
                </div>

                {/* Footer */}
                <div style={{
                    padding: isMobile ? '16px' : '16px 24px',
                    borderTop: '1px solid #1e1e2d',
                    background: '#0a0a0f'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ color: '#666', fontSize: '11px' }}>Fee: {((cryptos.find(c => c.short_name === formData.crypto)?.p2p_fee) ?? 0)}%</span>
                        <span style={{ color: '#888', fontSize: '11px' }}>
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
                    <div style={styles.mobilePreviewToggle} onClick={() => setShowPreview(true)}>
                        <span style={{ color: '#888', fontSize: '14px' }}>
                            Preview: <span style={styles.previewHighlight}>{formData.side} {formData.crypto} AD</span>
                        </span>
                        <span style={{ color: '#ffdc88', fontSize: '14px' }}>View →</span>
                    </div>
                )}

                {/* Mobile Preview Overlay */}
                {isTablet && showPreview && (
                    <div style={{ marginBottom: '16px' }}>
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
                                                className={getInputClass('fiat', 'p2p-create-post-select')}
                                                value={formData.fiat}
                                                onChange={(e) => handleInput("fiat", e.target.value)}
                                                style={{ paddingLeft: formData.fiat ? '36px' : undefined }}
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
                                                className={getInputClass('crypto', 'p2p-create-post-select')}
                                                value={formData.crypto}
                                                onChange={(e) => handleInput("crypto", e.target.value)}
                                                style={{ paddingLeft: formData.crypto ? '36px' : undefined }}
                                            >
                                                <option value="" hidden>Select</option>
                                                {cryptos.map((c, i) => <option key={i} value={c.short_name}>{c.short_name}</option>)}
                                            </select>
                                        </div>
                                        <FieldError fieldName="crypto" />
                                    </div>
                                </div>
                                {fieldErrors.side && (
                                    <div className="p2p-create-post-field-error" style={{ marginTop: '-12px', marginBottom: '12px' }}><span>⚠</span> {fieldErrors.side}</div>
                                )}

                                <div className="p2p-create-post-fee-box">Fee: {((cryptos.find(c => c.short_name === formData.crypto)?.p2p_fee) ?? 0)}%</div>

                                <div style={{ marginTop: isMobile ? '24px' : '32px' }}>
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

                                <div style={styles.sectionTitle}>
                                    <span style={styles.sectionIcon}>▶</span>
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

                                <div style={{ marginTop: isMobile ? '24px' : '32px' }}>
                                    <div style={styles.sectionTitle}>
                                        <span style={styles.sectionIcon}>▶</span>
                                        Select Payment Method
                                        {fieldErrors.paymentMethod && (
                                            <span style={{ color: '#ef4444', fontSize: '12px', fontWeight: '400', marginLeft: '8px' }}>
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
                                                                        style={styles.checkbox}
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
                                                            style={styles.checkbox}
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
            <div className="modal fade" id="sellModal" tabIndex="-1">
                <div className="modal-dialog modal-dialog-centered modal-lg">
                    <div className="modal-content" style={{ background: '#12121a', border: '1px solid #2a2a3a', borderRadius: '16px' }}>
                        <div className="modal-header" style={{ borderBottom: '1px solid #2a2a3a', padding: '20px 24px' }}>
                            <h5 style={{ color: '#fff', fontSize: '18px', fontWeight: '600', margin: 0 }}>
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
                        <div className="modal-body" style={{ padding: '24px', maxHeight: '70vh', overflowY: 'auto' }}>
                            {/* Tips */}
                            <div style={{
                                background: 'rgba(245, 158, 11, 0.1)',
                                border: '1px solid rgba(245, 158, 11, 0.3)',
                                borderRadius: '10px',
                                padding: '12px 16px',
                                marginBottom: '20px',
                                display: 'flex',
                                gap: '10px',
                                alignItems: 'flex-start'
                            }}>
                                <span style={{ color: '#f59e0b' }}>ℹ</span>
                                <span style={{ color: '#d4a574', fontSize: '13px', lineHeight: '1.5' }}>
                                    Tips: The added payment method will be shown to the buyer during the transaction to accept fiat transfers.
                                    Please ensure that the information is correct, real and matches your KYC information.
                                </span>
                            </div>

                            {/* Step 1: Select Payment Method Type */}
                            {!selectedAddPaymentMethod && (
                                <>
                                    <div style={{ marginBottom: '16px' }}>
                                        <label style={{ color: '#888', fontSize: '13px', marginBottom: '8px', display: 'block' }}>
                                            Select Payment Method Type
                                        </label>
                                        {loader.paymentMethods ? (
                                            <div style={{ textAlign: 'center', padding: '20px' }}>
                                                <div className="spinner-border text-primary" role="status" />
                                            </div>
                                        ) : (
                                            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '10px' }}>
                                                {availablePaymentMathod?.map((method) => (
                                                    <div
                                                        key={method._id}
                                                        style={{
                                                            padding: '14px 16px',
                                                            background: '#0d0d14',
                                                            border: '1px solid #2a2a3a',
                                                            borderRadius: '10px',
                                                            cursor: isKycCompleted ? 'pointer' : 'not-allowed',
                                                            transition: 'all 0.2s ease',
                                                            display: 'flex',
                                                            justifyContent: 'space-between',
                                                            alignItems: 'center',
                                                            opacity: !isKycCompleted ? 0.6 : 1
                                                        }}
                                                        onClick={() => {
                                                            if (isKycCompleted) {
                                                                getPaymentMethodFields(method._id, method.name);
                                                            } else {
                                                                alertErrorMessage("Please complete KYC verification before adding a payment method.");
                                                            }
                                                        }}
                                                        onMouseEnter={(e) => {
                                                            if (isKycCompleted) {
                                                                e.currentTarget.style.borderColor = '#ffdc88';
                                                            }
                                                        }}
                                                        onMouseLeave={(e) => e.currentTarget.style.borderColor = '#2a2a3a'}
                                                    >
                                                        <span style={{ color: '#fff', fontSize: '14px' }}>{method.name}</span>
                                                        {(method.name === 'IMPS' || method.name === 'UPI') && (
                                                            <span style={{
                                                                background: 'rgba(34, 197, 94, 0.1)',
                                                                color: '#22c55e',
                                                                fontSize: '10px',
                                                                padding: '2px 8px',
                                                                borderRadius: '4px'
                                                            }}>
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

                            {/* Step 2: Fill Payment Method Details */}
                            {selectedAddPaymentMethod && (
                                <>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px',
                                        marginBottom: '20px',
                                        paddingBottom: '16px',
                                        borderBottom: '1px solid #2a2a3a'
                                    }}>
                                        <button
                                            style={{
                                                background: 'transparent',
                                                border: 'none',
                                                color: '#888',
                                                cursor: 'pointer',
                                                padding: '4px'
                                            }}
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
                                        <span style={{ color: '#ffdc88', fontWeight: '600' }}>{selectedAddPaymentMethod}</span>
                                    </div>

                                    {!isKycCompleted && (
                                        <div style={{
                                            background: 'rgba(245, 158, 11, 0.1)',
                                            border: '1px solid rgba(245, 158, 11, 0.3)',
                                            borderRadius: '10px',
                                            padding: '12px 16px',
                                            marginBottom: '20px',
                                            color: '#d4a574',
                                            fontSize: '13px'
                                        }}>
                                            <strong>KYC Verification Required:</strong> Please complete your KYC verification before adding a payment method.
                                        </div>
                                    )}

                                    {kycUpdateName && (
                                        <div style={{ marginBottom: '16px' }}>
                                            <label style={{ color: '#888', fontSize: '13px', marginBottom: '8px', display: 'block' }}>
                                                Name
                                            </label>
                                            <input
                                                type="text"
                                                value={kycUpdateName}
                                                disabled
                                                style={{
                                                    width: '100%',
                                                    padding: '12px 16px',
                                                    background: '#1a1a2e',
                                                    border: '1px solid #2a2a3a',
                                                    borderRadius: '10px',
                                                    color: '#fff',
                                                    fontSize: '14px',
                                                    cursor: 'not-allowed',
                                                    opacity: 0.6
                                                }}
                                            />
                                            <small style={{ color: '#666', fontSize: '11px', marginTop: '4px', display: 'block' }}>
                                                This name is taken from your KYC verification
                                            </small>
                                        </div>
                                    )}

                                    {loader.paymentInput ? (
                                        <div style={{ textAlign: 'center', padding: '40px' }}>
                                            <div className="spinner-border text-primary" role="status" />
                                        </div>
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                            {paymentInputs?.map((field, index) => {
                                                // Check if this is a name field
                                                const isNameField = false
                                                const currentValue = paymentMethodFormData[field.field] || '';
                                                const placeholder = isNameField && isKycCompleted && kycUpdateName && !currentValue
                                                    ? kycUpdateName
                                                    : (field.placeholder || `${(field.label || field.field)}`);

                                                return (
                                                    <div key={index}>
                                                        <label style={{ color: '#888', fontSize: '13px', marginBottom: '8px', display: 'block' }}>
                                                            {(field.label || field.field)}
                                                            {(field.type === 'file' || field.type === 'files') ? (
                                                                <span style={{ color: '#666' }}> (Optional)</span>
                                                            ) : (
                                                                field.required !== false && <span style={{ color: '#ef4444' }}> *</span>
                                                            )}
                                                        </label>
                                                        {field.type === 'file' || field.type === 'files' ? (
                                                            <div>
                                                                <div style={{
                                                                    border: '2px dashed #2a2a3a',
                                                                    borderRadius: '10px',
                                                                    padding: '20px',
                                                                    textAlign: 'center',
                                                                    cursor: isKycCompleted ? 'pointer' : 'not-allowed',
                                                                    position: 'relative',
                                                                    opacity: !isKycCompleted ? 0.6 : 1
                                                                }}>
                                                                    <input
                                                                        type="file"
                                                                        name={field.field}
                                                                        accept=".jpg,.jpeg,.png,.bmp"
                                                                        onChange={handlePaymentMethodAddImage}
                                                                        disabled={!isKycCompleted}
                                                                        style={{
                                                                            position: 'absolute',
                                                                            top: 0,
                                                                            left: 0,
                                                                            width: '100%',
                                                                            height: '100%',
                                                                            opacity: 0,
                                                                            cursor: isKycCompleted ? 'pointer' : 'not-allowed'
                                                                        }}
                                                                    />
                                                                    {previewQr ? (
                                                                        <img src={previewQr} alt="Preview" style={{ maxWidth: '100px', maxHeight: '100px', borderRadius: '8px' }} />
                                                                    ) : (
                                                                        <>
                                                                            <div style={{ color: '#666', fontSize: '24px', marginBottom: '8px' }}>⬆</div>
                                                                            <div style={{ color: '#888', fontSize: '13px' }}>Upload QR Code</div>
                                                                        </>
                                                                    )}
                                                                </div>
                                                                <small style={{ color: '#666', fontSize: '11px', marginTop: '4px', display: 'block' }}>
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
                                                                style={{
                                                                    width: '100%',
                                                                    padding: '12px 16px',
                                                                    background: '#0d0d14',
                                                                    border: '1px solid #2a2a3a',
                                                                    borderRadius: '10px',
                                                                    color: '#fff',
                                                                    fontSize: '14px',
                                                                    outline: 'none',
                                                                    opacity: !isKycCompleted ? 0.6 : 1,
                                                                    cursor: !isKycCompleted ? 'not-allowed' : 'text'
                                                                }}
                                                            />
                                                        )}
                                                    </div>
                                                );
                                            })}

                                            {/* Warning */}
                                            <div style={{
                                                background: 'rgba(239, 68, 68, 0.1)',
                                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                                borderRadius: '10px',
                                                padding: '12px 16px',
                                                marginTop: '8px'
                                            }}>
                                                <span style={{ color: '#f87171', fontSize: '12px', lineHeight: '1.5' }}>
                                                    Warning: Please ensure all information is accurate and matches your KYC details.
                                                </span>
                                            </div>

                                            {/* Buttons */}
                                            <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                                                <button
                                                    style={{
                                                        flex: 1,
                                                        padding: '12px 20px',
                                                        background: 'transparent',
                                                        border: '1px solid #2a2a3a',
                                                        borderRadius: '10px',
                                                        color: '#fff',
                                                        fontSize: '14px',
                                                        cursor: 'pointer'
                                                    }}
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
                                                    style={{
                                                        flex: 1,
                                                        padding: '12px 20px',
                                                        background: '#ffdc88',
                                                        border: 'none',
                                                        borderRadius: '10px',
                                                        color: '#fff',
                                                        fontSize: '14px',
                                                        fontWeight: '600',
                                                        cursor: isKycCompleted ? 'pointer' : 'not-allowed',
                                                        opacity: !isKycCompleted ? 0.6 : 1
                                                    }}
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
                            <p style={{ color: '#888', marginBottom: '20px' }}>Select up to 5 methods</p>
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
                                    <div style={{ textAlign: 'center', padding: '20px' }}>
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
                                <li>Reserved Fee<span style={{ color: '#F3BB2B' }}>{formData.side === 'SELL' ? (() => { const p = (cryptos.find(c => c.short_name === formData.crypto)?.p2p_fee) ?? 0; const amt = (Number(formData.volume) || 0) * p / 100; return `${amt.toFixed(2)} ${formData.crypto} (${p}%)`; })() : `0.00 ${formData.crypto}`}</span></li>
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
