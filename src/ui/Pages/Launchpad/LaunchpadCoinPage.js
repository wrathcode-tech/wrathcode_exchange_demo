import { Link, useNavigate, useParams } from "react-router-dom"
import '../AnnouncmentManagement/Annoucement.css'
import { useState, useEffect } from "react";
import LoaderHelper from "../../../customComponents/Loading/LoaderHelper";
import AuthService from "../../../api/services/AuthService";
import { alertErrorMessage, alertSuccessMessage } from "../../../customComponents/CustomAlertMessage";
import { ApiConfig } from "../../../api/apiConfig/apiConfig";
import moment from "moment";
import { Helmet } from "react-helmet-async";


const LaunchpadCoinPage = () => {
    const navigate = useNavigate();
    const { id } = useParams(); // Get launchpad ID from URL
    const [, setCoinDetailsData] = useState(null)
    const [purchaseAmount, setPurchaseAmount] = useState('')
    const [currentLaunchpad, setCurrentLaunchpad] = useState(null)
    const [showPopup, setShowPopup] = useState(false)
    const [userParticipation, setUserParticipation] = useState(null)

    const handleCoinData = async () => {
        if (!id) {
            alertErrorMessage("Launchpad ID is missing.");
            LoaderHelper.loaderStatus(false);
            return;
        }
        LoaderHelper.loaderStatus(true);
        try {
            const hasToken = !!localStorage.getItem("token");
            const result = hasToken
                ? await AuthService.launchpadDetails(id)
                : await AuthService.userLaunchpadDetails(id);
            LoaderHelper.loaderStatus(false);
            if (result?.success && result?.data) {
                const data = result.data;
                const base = data?.base_currency_id;
                const quote = data?.quote_currency_id;
                let logoUrl = (typeof base === "object" && base?.icon_path) || data?.logoUrl;
                let tokenSymbol = (typeof base === "object" && base?.short_name) || data?.tokenSymbol || "Token";
                let tokenName = (typeof base === "object" && base?.name) || data?.tokenName || "Token";

                if (!logoUrl && typeof base === "string" && hasToken) {
                    try {
                        const coinRes = await AuthService.coinDetails(base);
                        if (coinRes?.success && coinRes?.data) {
                            const c = coinRes.data;
                            logoUrl = c?.icon_path || c?.iconPath;
                            tokenSymbol = c?.short_name || c?.shortName || tokenSymbol;
                            tokenName = c?.name || tokenName;
                        }
                    } catch { /* use fallbacks */ }
                }

                const normalized = {
                    ...data,
                    tokenSymbol,
                    tokenName,
                    logoUrl,
                    quoteSymbol: (typeof quote === "object" && quote?.short_name) || data?.quoteSymbol || "USDT",
                    tokenPrice: data?.tokenPrice ?? data?.subscription_price ?? data?.price ?? 0,
                    totalDistribution: data?.tokensForSale ?? data?.totalDistribution,
                    totalAllocation: data?.tokensForSale ?? data?.totalAllocation,
                };
                setCoinDetailsData(normalized);
                setCurrentLaunchpad(normalized);
            }
        } catch (err) {
            LoaderHelper.loaderStatus(false);
            alertErrorMessage("Error loading launchpad details.");
        }
    };

    const handleUserParticipation = async () => {
        if (!id) return;
        try {
            const result = await AuthService.userTokenSubscriptionHistory(1, 50);
            const data = result?.data;
            if (result?.success && Array.isArray(data)) {
                setUserParticipation(data);
            } else if (result?.success && data && !Array.isArray(data)) {
                setUserParticipation(Array.isArray(data?.items) ? data.items : []);
            } else {
                setUserParticipation([]);
            }
        } catch (err) {
            setUserParticipation([]);
        }
    };


    const handlePurchaseToken = async (launchpadId, amountInvested) => {
        if (!launchpadId) {
            alertErrorMessage("Launchpad ID is required.");
            return;
        }

        if (!amountInvested || parseFloat(amountInvested) <= 0) {
            alertErrorMessage("Please enter a valid amount.");
            return;
        }

        LoaderHelper.loaderStatus(true);
        try {
            const result = await AuthService.purchaseToken(launchpadId, amountInvested);
            if (result?.success) {
                handleCoinData();
                handleUserParticipation(); // Refresh user participation data
                alertSuccessMessage("Purchase completed successfully!");
            } else {
                alertErrorMessage(result?.message || "Something went wrong while purchasing token.");
            }
        } catch (err) {
            alertErrorMessage("Error processing purchase.");
        } finally {
            LoaderHelper.loaderStatus(false);
        }
    };

    const handleConfirmPurchase = () => {
        if (!currentLaunchpad?._id && !id) {
            alertErrorMessage("Launchpad information not available.");
            return;
        }

        if (!purchaseAmount || parseFloat(purchaseAmount) <= 0) {
            alertErrorMessage("Please enter a valid amount.");
            return;
        }

        // Validate min/max limits
        const amount = parseFloat(purchaseAmount);
        const minAmount = parseFloat(currentLaunchpad?.minPurchase || 10);
        const maxAmount = parseFloat(currentLaunchpad?.maxPurchase || 15000);

        if (amount < minAmount) {
            alertErrorMessage(`Minimum purchase amount is ${minAmount} USDT.`);
            return;
        }

        if (amount > maxAmount) {
            alertErrorMessage(`Maximum purchase amount is ${maxAmount} USDT.`);
            return;
        }

        // Close popup immediately when confirm is clicked
        setShowPopup(false);
        const amountToPurchase = purchaseAmount;
        setPurchaseAmount('');

        // Call the API with launchpad ID and amount
        const launchpadId = currentLaunchpad?._id || id;
        handlePurchaseToken(launchpadId, amountToPurchase);
    };



    const [, setTimeRemaining] = useState({
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        isEnded: false
    });

    useEffect(() => {
        if (!currentLaunchpad?.endTime) return;

        const updateCountdown = () => {
            const now = new Date().getTime();
            const end = new Date(currentLaunchpad.endTime).getTime();
            const diff = end - now;

            if (diff <= 0) {
                setTimeRemaining({
                    days: 0,
                    hours: 0,
                    minutes: 0,
                    seconds: 0,
                    isEnded: true
                });
                return;
            }

            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            setTimeRemaining({
                days,
                hours,
                minutes,
                seconds,
                isEnded: false
            });
        };

        updateCountdown();
        const interval = setInterval(updateCountdown, 1000);

        return () => clearInterval(interval);
    }, [currentLaunchpad?.endTime]);

    useEffect(() => {
        if (id) {
            handleCoinData();
            handleUserParticipation();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const handleOpenPopup = () => {
        setShowPopup(true);
    };

    const handleClosePopup = () => {
        setShowPopup(false);
        setPurchaseAmount('');
    };

    const [showModal, setShowModal] = useState(false);

    const handleOpenModal = () => {
        setShowModal(true);

    };

    const handleCloseModal = () => {
        setShowModal(false);
        handleUserParticipation();
    };

    useEffect(() => {
        window.scrollTo(0, 0);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const getImgSrc = (url) => {
    console.log("🚀 ~ getImgSrc ~ url:", url)
return `${ApiConfig?.baseImage}${url}`;
    };
    const imgFallback = "/images/AnnouncementImg/eul_coin.png";
    const formatDate = (d) => (d ? moment(d).format("YYYY-MM-DD HH:mm") : "---");

    return (
        <>
            <Helmet>
                <title>Token Launch Platform | Wrathcode Exchange Launchpad</title>

                <meta
                    name="description"
                    content="Join Wrathcode Exchange Launchpad – a platform for early-stage projects, exclusive token sales and Web3 innovation. Be first to new tokens."
                />

                <meta
                    name="keywords"
                    content="token sale platform, Web3 launchpad, early crypto investment, Wrathcode Exchange tokens"
                />
            </Helmet>


            <div className="launchpad_detail_s">
                <div className="container">
                    <ul className="backbt">
                        <li><Link to="/launchpad">Launchpad</Link></li>
                        <li>/</li>
                        <li>{currentLaunchpad?.tokenName || currentLaunchpad?.tokenSymbol || "Launchpad"}</li>
                    </ul>

                    <div className="detail_top_launchpad">

                        <div className="dellft">

                            <div className="coin_lft">
                                <div className="coin">
                                    <img src={getImgSrc(currentLaunchpad?.logoUrl)} alt={currentLaunchpad?.tokenSymbol || "token"} onError={(e) => { e.target.src = imgFallback; }} /></div>
                                <div className="coin_cnt">
                                    <h3>{currentLaunchpad?.tokenSymbol || "---"}</h3>
                                    <div className="hd d-flex">
                                        <span>Initial Offering · {(currentLaunchpad?.status || "Ended")}</span>
                                        <ul className="subcate">
                                            {currentLaunchpad?.website && (
                                                <li className="darkbg"><button type="button" onClick={() => window.open(currentLaunchpad.website, "_blank")}>Official Website</button></li>
                                            )}
                                            {currentLaunchpad?.whitepaper && (
                                                <li className="darkbg"><button type="button" onClick={() => window.open(currentLaunchpad.whitepaper, "_blank")}>Introduction</button></li>
                                            )}
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            <ul className="registration_list">
                                <li>
                                    Subscription Starts <span>{formatDate(currentLaunchpad?.startTime || currentLaunchpad?.subscriptionStart)}</span></li>
                                <li>
                                    Subscription Ends <span>{formatDate(currentLaunchpad?.endTime || currentLaunchpad?.subscriptionEnd)}</span></li>
                                <li>Allocation Starts <span>{formatDate(currentLaunchpad?.endTime)}</span></li>
                                {/* <li>Allocation Ends <span>{formatDate(currentLaunchpad?.allocationEnd || currentLaunchpad?.endTime)}</span></li> */}
                            </ul>
                        </div>

                        <div className="total_distribution">
                            <div className="top_tpl">
                                <ul>
                                    <li><span>Total Distribution</span>{(currentLaunchpad?.totalDistribution || currentLaunchpad?.tokensForSale || currentLaunchpad?.totalRaised || 0).toLocaleString()} {currentLaunchpad?.tokenSymbol || ""}</li>
                                    <li><span>Participants</span>{(currentLaunchpad?.participantsCount || 0).toLocaleString()}</li>
                                </ul>
                            </div>

                            <div className="tradetpl">
                                <button
                                    onClick={() => {
                                        if (!localStorage.getItem("token")) navigate("/login");
                                        else if ((currentLaunchpad?.status || "").toLowerCase() === "live") handleOpenPopup();
                                    }}
                                >Trade<i className="ri-arrow-down-s-line"></i></button>
                            </div>
                        </div>

                    </div>

                    <div className="usdtpool_bl">
                        <div className="d-flex tbl_flex">
                            <button className="poolbtn active">{currentLaunchpad?.quoteSymbol || "USDT"} Pool <span><i className="ri-user-3-fill"></i> NEW</span></button>
                            <button className="poolbtn">{currentLaunchpad?.quoteSymbol || "USDT"} Pool</button>
                        </div>
                        <div className="commit_usdt_del">
                            <div className="coin_lft">
                                <div className="coin">
                                    <img src={getImgSrc(currentLaunchpad?.logoUrl)} alt={currentLaunchpad?.tokenSymbol || "token"} onError={(e) => { e.target.src = imgFallback; }} />
                                    <div className="useredit">
                                        <img src={getImgSrc(currentLaunchpad?.quote_currency_id?.icon_path)} alt="" />
                                    </div>
                                </div>
                                <div className="coin_cnt">
                                    <h3>Commit {currentLaunchpad?.quoteSymbol || "USDT"} to Subscribe {currentLaunchpad?.tokenSymbol || "---"}</h3>
                                    <div className="hd d-flex">
                                        <ul className="subcate">
                                            <li><button><i className="ri-user-3-fill"></i> New User Exclusive</button></li>
                                            <li><button><i className="ri-discount-percent-fill"></i> 60% Off</button></li>
                                            <li><button><i className="ri-share-forward-fill"></i> Raise Limit</button></li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                            <ul className="exclusive_list">
                                <li><span>Exclusive Subscription Price</span>1 {currentLaunchpad?.tokenSymbol || "---"} = {(currentLaunchpad?.tokenPrice || 0)} {currentLaunchpad?.quoteSymbol || "USDT"} <span className="sellsub">Sell Price: {(currentLaunchpad?.sellPrice || currentLaunchpad?.listingPrice || currentLaunchpad?.tokenPrice || 0)} {currentLaunchpad?.quoteSymbol || "USDT"}</span></li>
                                <li><span>Total Allocation</span>{(currentLaunchpad?.totalAllocation || currentLaunchpad?.tokensForSale || 0).toLocaleString()} {currentLaunchpad?.tokenSymbol || ""}</li>
                                <li><span>Total Committed</span>{(currentLaunchpad?.totalRaised || currentLaunchpad?.totalInvested || 0).toLocaleString()} {currentLaunchpad?.quoteSymbol || "USDT"}</li>
                                <li><span>Subscribed</span>{currentLaunchpad?.subscribed != null ? Number(currentLaunchpad.subscribed).toLocaleString() : "---"}</li>
                                <li><span>Allocated</span>{currentLaunchpad?.allocated != null ? Number(currentLaunchpad.allocated).toLocaleString() : "---"}</li>
                                <li><span>Refunded</span>{currentLaunchpad?.refunded != null ? Number(currentLaunchpad.refunded).toLocaleString() : "---"}</li>
                            </ul>
                        </div>
                    </div>
                    {/* 
                    <div className="futures_trading_s">

                        <div className="d-flex toplimit">
                            <h3>Complete tasks to increase your subscription limit, up to <span>10,000 USDT</span></h3>
                            <div className="limit_current">
                                Current Limit: <span>5,000 USDT</span>
                            </div>
                        </div>

                        <div className="future_trading_block">
                            <h5>Futures Trading Challenge <i className="ri-information-line"></i></h5>

                            <div className="trading_process">
                                <div className="usdt_selected">
                                    0 USDT
                                </div>

                                <div className="usdt_selected">
                                    <span>+1,500 USDT</span> 50,000 USDT
                                </div>

                                <div className="usdt_selected">
                                    <span>+500 USDT</span> 80,000 USDT
                                </div>

                                <div className="usdt_selected">
                                    <span>+1,000 USDT</span> 120,000 USDT
                                </div>

                                <div className="usdt_selected">
                                    <span>+1,000 USDT</span> 200,000 USDT
                                </div>

                            </div>

                            <div className="d-flex toplimit">
                                <h6>Trade <span>50,000 USDT</span> worth of tokens more to increase your limit by <span>1,500 USDT</span></h6>
                                <div className="trade">
                                    <button>Trade</button>
                                </div>
                            </div>

                        </div>

                    </div> */}

                    <div className="futures_trading_s">

                        <div className="future_trading_block">
                            <h5>Project Summary</h5>

                            <div className="d-flex toplimit">
                                <p>{currentLaunchpad?.description || "No description available."}</p>
                                <div className="trade websitebtn d-flex">
                                    {currentLaunchpad?.website && <button type="button" onClick={() => window.open(currentLaunchpad.website, "_blank")}>Website</button>}
                                    {currentLaunchpad?.whitepaper && <button type="button" className="whitebtn" onClick={() => window.open(currentLaunchpad.whitepaper, "_blank")}>Whitepaper</button>}
                                </div>
                            </div>

                        </div>

                    </div>

                    <div className="futures_trading_s">

                        <div className="d-flex toplimit">
                            <h3>Details</h3>
                            {/* <div className="limit_current">
                                Current Limit: <span>5,000 USDT</span>
                            </div> */}
                        </div>

                        <ul className="usdtdetail">
                            <li><span>Exclusive Subscription Price</span>1 {currentLaunchpad?.tokenSymbol || "---"} = {(currentLaunchpad?.tokenPrice || 0)} {currentLaunchpad?.quoteSymbol || "USDT"}</li>
                            <li><span>Launchpad Total Allocation</span>{(currentLaunchpad?.totalDistribution || currentLaunchpad?.tokensForSale || currentLaunchpad?.totalAllocation || 0).toLocaleString()} {currentLaunchpad?.tokenSymbol || ""}</li>
                            <li><span>Individual Subscription Limit</span>{(currentLaunchpad?.minPurchase || 0).toLocaleString()} - {(currentLaunchpad?.maxPurchase || 0).toLocaleString()} {currentLaunchpad?.quoteSymbol || "USDT"}</li>
                        </ul>

                    </div>

                    {localStorage.getItem("token") && (currentLaunchpad?.status || "").toLowerCase() === "live" && (
                        <div className="d-flex" style={{ marginTop: "16px", gap: "12px" }}>
                            <span className="my_subscription_link" onClick={handleOpenModal} style={{ cursor: "pointer", color: "#007bff" }}>My Subscription &gt;</span>
                        </div>
                    )}

                    {showPopup && (
                        <div id="popup-overlay" className="popup-overlay" onClick={handleClosePopup}>
                            <div className="popup-box" onClick={(e) => e.stopPropagation()}>
                                <button className="close-btn" onClick={handleClosePopup}>✖</button>
                                <h3 style={{ color: "#fff", marginBottom: "20px" }}>Enter Purchase Amount</h3>

                                <input
                                    type="number"
                                    id="buyAmount"
                                    placeholder="Enter amount"
                                    className="popup-input"
                                    value={purchaseAmount}
                                    onChange={(e) => setPurchaseAmount(e.target.value)}
                                    onWheel={(e) => e.target.blur()}
                                />
                                {currentLaunchpad && purchaseAmount && (
                                    <div style={{ marginBottom: "20px", padding: "10px", backgroundColor: "rgba(243, 187, 43, 0.1)", borderRadius: "8px", color: "#F3BB2B" }}>
                                        <strong>You will receive:</strong> {(parseFloat(purchaseAmount) / (currentLaunchpad?.tokenPrice || 1)).toFixed(2)} {currentLaunchpad?.tokenSymbol || "Tokens"}
                                    </div>
                                )}

                                {currentLaunchpad && (
                                    <small style={{ color: "#4D5B6F", display: "block", marginBottom: "20px" }}>
                                        Min: {currentLaunchpad.minPurchase || 10} {currentLaunchpad?.quoteSymbol || "USDT"} | Max: {currentLaunchpad.maxPurchase || 15000} {currentLaunchpad?.quoteSymbol || "USDT"}
                                    </small>
                                )}

                                <div className="popup-buttons" style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
                                    <button className="confirm-btn" onClick={handleConfirmPurchase} disabled={!purchaseAmount || parseFloat(purchaseAmount) <= 0}>
                                        Confirm
                                    </button>
                                    <button className="cancel-btn" onClick={handleClosePopup}>
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {showModal && (
                        <div className="modal-overlay subscription_modal" onClick={handleCloseModal}>
                            <div className="modal-box" onClick={(e) => e.stopPropagation()}>
                                <div className="modal-header">
                                    <h5 className="modal-title">My Subscription</h5>
                                    <button className="close-btn" onClick={handleCloseModal}>✖</button>
                                </div>
                                <div className="modal-body">
                                    <div className="table-responsive">
                                        {userParticipation && userParticipation.length > 0 ? (
                                            <table className="subscription_table">
                                                <thead>
                                                    <tr>
                                                        <th>#</th>
                                                        <th>Token Name</th>
                                                        <th>Token Symbol</th>
                                                        <th>Invested ($)</th>
                                                        <th>Total Tokens</th>
                                                        <th>Last Purchase</th>
                                                        <th>Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {userParticipation.map((sub, index) => (
                                                        <tr key={index}>
                                                            <td>{index + 1}</td>
                                                            <td>{sub.tokenName || sub.base_currency_id?.name}</td>
                                                            <td>{sub.tokenSymbol || sub.base_currency_id?.short_name}</td>
                                                            <td>{sub.totalInvested?.$numberDecimal ?? sub.totalInvested ?? "0"}</td>
                                                            <td>{sub.totalTokensReceived ?? sub.totalTokens ?? "0"}</td>
                                                            <td>{sub.lastPurchase ? moment(sub.lastPurchase).format("DD/MM/YYYY LT") : "---"}</td>
                                                            <td>
                                                                <span className={`status ${(sub.status || "").toLowerCase()}`} style={{ textTransform: "capitalize", fontWeight: "600" }}>
                                                                    {sub.status || "---"}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        ) : (
                                            <>
                                                <div className="no_data_vector text-center">
                                                    <img src="/images/Group 1171275449 (1).svg" alt="no-data" />
                                                </div>
                                                <p className="text-center" style={{ color: "#fff" }}>No subscription data found.</p>
                                            </>
                                        )}
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button className="btn btn-secondary" onClick={handleCloseModal}>Close</button>
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </div>


            {/* <section className="coin_single">
                <div className="container">
                    <div className="backtop_s">
                       
                        <button
                            onClick={() => navigate(-1)} 
                            style={{
                                backgroundColor: "#f3bb2b",
                                border: "none",
                                color: "#000",
                                padding: "8px 14px",
                                borderRadius: "8px",
                                cursor: "pointer",
                                fontWeight: "600",
                                marginRight: "15px",
                            }}>
                            ← Back
                        </button>

                      
                        <h1 style={{ display: "flex", alignItems: "center", gap: "10px", margin: 0 }}>
                            {currentLaunchpad?.logoUrl ? (
                                <img
                                    src={
                                        currentLaunchpad.logoUrl.startsWith("http")
                                            ? currentLaunchpad.logoUrl
                                            : `${ApiConfig?.baseImage}${currentLaunchpad.logoUrl}`
                                    }
                                    alt={currentLaunchpad?.tokenSymbol || "token"}
                                    style={{
                                        width: "50px",
                                        height: "50px",
                                        borderRadius: "50%",
                                        objectFit: "cover",
                                    }}
                                />
                            ) : (
                                <img
                                    src="/images/AnnouncementImg/eul_coin.png"
                                    alt="token"
                                    style={{
                                        width: "50px",
                                        height: "50px",
                                        borderRadius: "50%",
                                        objectFit: "cover",
                                    }}
                                />
                            )}
                            {currentLaunchpad?.tokenSymbol || "EUL"}
                        </h1>
                    </div>


                    <div className="row mt-4">
                        <div className="col-sm-8">
                            <div className="leftside_detail">
                                <div className="participation_bl">
                                    <h2>Current Progress</h2>
                                    <div className="receivedblock flexreceive">
                                        <div className="receivedblock_left">
                                            <h5>Participants <span>{userParticipation?.participantsCount || "0.00"}</span></h5>
                                            <h5>Current Percent  <span>
                                                {coinDetailsData?.progressPercent || "0.00"}
                                            </span></h5>

                                            <h5>Raised <span style={{ color: "grey" }}>
                                                <span style={{ color: "white" }}> {coinDetailsData?.totalInvested || "0.00"}</span>/{coinDetailsData?.totalRaised || "0.00"}
                                            </span></h5>
                                            <h5>Total Supply <span style={{ color: "grey" }}>
                                                {coinDetailsData?.totalSupply || "0.00"}
                                            </span></h5>

                                        </div>

                                        <div className="receivedblock_right">
                                            <img
                                                src={
                                                    coinDetailsData?.bannerImage
                                                        ? coinDetailsData?.bannerImage.startsWith("http")
                                                            ? coinDetailsData?.bannerImage
                                                            : `${ApiConfig?.baseImage}${coinDetailsData?.bannerImage}`
                                                        : "/images/AnnouncementImg/eul_coin.png" // fallback image
                                                }
                                                alt="banner"
                                                style={{
                                                    width: "100%",
                                                    height: "auto",
                                                    borderRadius: "10px",
                                                    objectFit: "cover",
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="participation_bl">


                                    <div className="project_cycle_timeline">
                                        <div className="timeline_item">
                                            <div className="timeline_circle active">1</div>
                                            <div className="timeline_content">
                                                <h5>Warming up</h5>
                                                <span>2023-10-07 17:03</span>
                                            </div>
                                        </div>
                                        <div className="timeline_connector"></div>
                                        <div className="timeline_item">
                                            <div className="timeline_circle active">2</div>
                                            <div className="timeline_content">
                                                <h5>Start Subscription</h5>
                                                <span>2023-10-13 13:30</span>
                                            </div>
                                        </div>
                                        <div className="timeline_connector"></div>
                                        <div className="timeline_item">
                                            <div className="timeline_circle">3</div>
                                            <div className="timeline_content">
                                                <h5>Subscription Ended</h5>
                                                <span>2023-10-13 14:30</span>
                                            </div>
                                        </div>
                                    </div>

                                </div>

                                <div className="participation_bl">
                                    <h2>Key Highlight</h2>
                                    <div className="key_highlight_table">
                                        <div className="highlight_row">
                                            <span className="highlight_label">Token Symbol</span>
                                            <span className="highlight_value">{currentLaunchpad?.tokenSymbol || "N/A"}</span>
                                        </div>
                                        <div className="highlight_row">
                                            <span className="highlight_label">Total Supply</span>
                                            <span className="highlight_value">
                                                {currentLaunchpad?.totalSupply?.toLocaleString() || "0"} {currentLaunchpad?.tokenSymbol || ""}
                                            </span>
                                        </div>
                                        <div className="highlight_row">
                                            <span className="highlight_label">Subscription Price</span>
                                            <span className="highlight_value">
                                                1 {currentLaunchpad?.tokenSymbol || ""} = {currentLaunchpad?.tokenPrice || 0} USDT
                                            </span>
                                        </div>
                                        <div className="highlight_row">
                                            <span className="highlight_label">Min Subscription Amount</span>
                                            <span className="highlight_value">{currentLaunchpad?.minPurchase || 0} USDT</span>
                                        </div>
                                        <div className="highlight_row">
                                            <span className="highlight_label">Max Subscription Amount</span>
                                            <span className="highlight_value">{currentLaunchpad?.maxPurchase?.toLocaleString() || 0} USDT</span>
                                        </div>
                                        <div className="highlight_row">
                                            <span className="highlight_label">Tokens For Sale</span>
                                            <span className="highlight_value">
                                                {currentLaunchpad?.tokensForSale?.toLocaleString() || 0} {currentLaunchpad?.tokenSymbol || ""}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>


                        <div className="col-sm-4">
                            <div className="rightside_detail">

                                <div className="timeline_s">
                                    <ul>
                                        <li>
                                            <h6>Start Time</h6>
                                            <h6>
                                                {currentLaunchpad?.startTime
                                                    ? new Date(currentLaunchpad.startTime).toLocaleString()
                                                    : "N/A"}
                                            </h6>
                                        </li>
                                        <li>
                                            <h6>End Time</h6>
                                            <h6>
                                                {currentLaunchpad?.endTime
                                                    ? new Date(currentLaunchpad.endTime).toLocaleString()
                                                    : "N/A"}
                                            </h6>
                                        </li>
                                        <li>
                                            <h6>Official List</h6>
                                            <h6>
                                                {currentLaunchpad?.endTime
                                                    ? new Date(currentLaunchpad.endTime).toLocaleString()
                                                    : "N/A"}
                                            </h6>
                                        </li>
                                    </ul>
                                    {(currentLaunchpad?.status?.toLowerCase() === "live" || currentLaunchpad?.isLive) ? (
                                        <div className="countdown_timer">
                                            {timeRemaining?.isEnded ? (
                                                <div className="countdown_ended">Ended</div>
                                            ) : (
                                                <>
                                                    <div className="countdown_item">
                                                        <span className="countdown_value">
                                                            {String(timeRemaining.days).padStart(2, "0")}
                                                        </span>
                                                        <span className="countdown_label">Day</span>
                                                    </div>
                                                    <div className="countdown_separator">:</div>
                                                    <div className="countdown_item">
                                                        <span className="countdown_value">
                                                            {String(timeRemaining.hours).padStart(2, "0")}
                                                        </span>
                                                        <span className="countdown_label">Hr</span>
                                                    </div>
                                                    <div className="countdown_separator">:</div>
                                                    <div className="countdown_item">
                                                        <span className="countdown_value">
                                                            {String(timeRemaining.minutes).padStart(2, "0")}
                                                        </span>
                                                        <span className="countdown_label">Min</span>
                                                    </div>
                                                    <div className="countdown_separator">:</div>
                                                    <div className="countdown_item">
                                                        <span className="countdown_value">
                                                            {String(timeRemaining.seconds).padStart(2, "0")}
                                                        </span>
                                                        <span className="countdown_label">Sec</span>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    ) : null}
                                </div>
                                <div className="project_cycle_wrapper">
                                    <div className="project_cycle_header">
                                        <h2>Project Cycle</h2>
                                        {localStorage.getItem("token") &&
                                            currentLaunchpad?.status?.toLowerCase() === "live" && (
                                                <div
                                                    className="my_subscription_link"
                                                    onClick={handleOpenModal}
                                                    style={{
                                                        cursor: "pointer",
                                                        color: "#007bff",
                                                    }}
                                                >
                                                    My Subscription &gt;
                                                </div>
                                            )}

                                    </div>

                                   
                                    <div style={{ marginTop: "20px" }}>
                                        {!localStorage.getItem("token") ? (
                                            
                                            <button
                                                className="buy_now_btn"
                                                style={{
                                                    backgroundColor: "#f3bb2b",
                                                    color: "#000",
                                                    cursor: "pointer",
                                                }}
                                                onClick={() => navigate("/login")}
                                            >
                                                Login to Buy
                                            </button>
                                        ) : (
                                        
                                            <button
                                                className="buy_now_btn"
                                                onClick={handleOpenPopup}
                                                disabled={
                                                    (currentLaunchpad?.status || "").toLowerCase() === "upcoming" ||
                                                    (currentLaunchpad?.status || "").toLowerCase() === "ended" ||
                                                    (currentLaunchpad?.status || "").toLowerCase() === "cancelled"
                                                }
                                                style={{
                                                    backgroundColor: "#f3bb2b",
                                                    color: "#000",
                                                    cursor:
                                                        currentLaunchpad?.status?.toLowerCase() === "upcoming" ||
                                                            currentLaunchpad?.status?.toLowerCase() === "ended"
                                                            ? "not-allowed"
                                                            : "pointer",
                                                    opacity:
                                                        currentLaunchpad?.status?.toLowerCase() === "upcoming" ||
                                                            currentLaunchpad?.status?.toLowerCase() === "ended"
                                                            ? 0.6
                                                            : 1,
                                                }}
                                            >
                                                Buy Now
                                            </button>

                                        )}
                                    </div>




                                  
                                    {showPopup && (
                                        <div className="modal-overlay" onClick={handleClosePopup}>
                                            <div
                                                className="modal-box"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <div className="modal-header">
                                                    <h5 className="modal-title">Buy Tokens</h5>
                                                    <button className="close-btn" onClick={handleClosePopup}>
                                                        ✖
                                                    </button>
                                                </div>
                                                <div className="modal-body">
                                                    <p>Enter purchase amount below:</p>
                                                    <input
                                                        type="number"
                                                        placeholder="Enter amount"
                                                        style={{
                                                            width: "100%",
                                                            padding: "8px",
                                                            borderRadius: "5px",
                                                            border: "1px solid #ccc",
                                                        }}
                                                    />
                                                </div>
                                                <div className="modal-footer">
                                                    <button className="btn btn-secondary" onClick={handleClosePopup}>
                                                        Cancel
                                                    </button>
                                                    <button className="btn btn-primary">Confirm Purchase</button>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                  
                                    {showModal && (
                                        <div
                                            className="modal-overlay subscription_modal"
                                            onClick={handleCloseModal}
                                        >
                                            <div
                                                className="modal-box"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <div className="modal-header">
                                                    <h5 className="modal-title">My Subscription</h5>
                                                    <button className="close-btn" onClick={handleCloseModal}>
                                                        ✖
                                                    </button>
                                                </div>
                                                <div className="modal-body">
                                                    <div className="table-responsive">
                                                        {userParticipation && userParticipation.length > 0 ? (
                                                            <table className="subscription_table">
                                                                <thead>
                                                                    <tr>
                                                                        <th>#</th>
                                                                        <th>Token Name</th>
                                                                        <th>Token Symbol</th>
                                                                        <th>Invested ($)</th>
                                                                        <th>Total Tokens</th>
                                                                        <th>Last Purchase</th>
                                                                        <th>Status</th>
                                                                    </tr>
                                                                </thead>

                                                                <tbody>
                                                                    {userParticipation.map((sub, index) => (
                                                                        <tr key={index}>
                                                                            <td>{index + 1}</td>
                                                                            <td>{sub.tokenName}</td>
                                                                            <td>{sub.tokenSymbol}</td>
                                                                            <td>{sub.totalInvested?.$numberDecimal || "0"}</td>
                                                                            <td>{sub.totalTokensReceived}</td>
                                                                            <td>{moment(sub.lastPurchase).format("DD/MM/YYYY LT")}</td>
                                                                            <td>
                                                                                <span
                                                                                    className={`status ${sub.status?.toLowerCase()}`}
                                                                                    style={{
                                                                                        textTransform: "capitalize",
                                                                                        fontWeight: "600",
                                                                                        color:
                                                                                            sub.status === "LIVE"
                                                                                                ? "green"
                                                                                                : sub.status === "ENDED"
                                                                                                    ? "red"
                                                                                                    : "#555",
                                                                                    }}
                                                                                >
                                                                                    {sub.status}
                                                                                </span>
                                                                            </td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        ) : (
                                                            <>
                                                                <div className="no_data_vector text-center">
                                                                    <img
                                                                        src="/images/Group 1171275449 (1).svg"
                                                                        alt="no-data"
                                                                    />
                                                                </div>
                                                                <p className="text-center" style={{ color: "#fff" }}>
                                                                    No subscription data found.
                                                                </p>
                                                            </>
                                                        )}

                                                    </div>
                                                </div>


                                                <div className="modal-footer">
                                                    <button
                                                        className="btn btn-secondary"
                                                        onClick={handleCloseModal}
                                                    >
                                                        Close
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                   
                                    <div className="project_summary">
                                        <h2>Project Summary</h2>
                                        <p>{currentLaunchpad?.description || "No description available."}</p>
                                        <ul>
                                            {currentLaunchpad?.website && (
                                                <li>
                                                    <a
                                                        href={currentLaunchpad.website}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                    >
                                                        Website
                                                    </a>
                                                </li>
                                            )}
                                            {currentLaunchpad?.whitepaper && (
                                                <li>
                                                    <a
                                                        href={currentLaunchpad.whitepaper}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                    >
                                                        Whitepaper
                                                    </a>
                                                </li>
                                            )}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                           
                            {showPopup && (
                                <div id="popup-overlay" className="popup-overlay" onClick={handleClosePopup}>
                                    <div className="popup-box" onClick={(e) => e.stopPropagation()}>
                                        <button className="close-btn" onClick={handleClosePopup}>✖</button>
                                        <h3 style={{ color: '#fff', marginBottom: '20px' }}>Enter Purchase Amount</h3>

                                        <input
                                            type="number"
                                            id="buyAmount"
                                            placeholder="Enter amount"
                                            className="popup-input"
                                            style={{
                                                width: '100%',
                                                padding: '12px',
                                                marginBottom: '20px',
                                                borderRadius: '8px',
                                                border: '1px solid #29313D',
                                                backgroundColor: '#191919',
                                                color: '#fff',
                                                fontSize: '16px'
                                            }}
                                            value={purchaseAmount}
                                            onChange={(e) => setPurchaseAmount(e.target.value)}
                                            onWheel={(e) => e.target.blur()}
                                        />
                                        {currentLaunchpad && purchaseAmount && (
                                            <div style={{
                                                marginBottom: '20px',
                                                padding: '10px',
                                                backgroundColor: 'rgba(243, 187, 43, 0.1)',
                                                borderRadius: '8px',
                                                color: '#F3BB2B'
                                            }}>
                                                <strong>You will receive:</strong> {(parseFloat(purchaseAmount) / (currentLaunchpad?.tokenPrice || 1)).toFixed(2)} {currentLaunchpad?.tokenSymbol || 'Tokens'}
                                            </div>
                                        )}

                                        {currentLaunchpad && (
                                            <small style={{ color: '#4D5B6F', display: 'block', marginBottom: '20px' }}>
                                                Min: {currentLaunchpad.minPurchase || 10} USDT | Max: {currentLaunchpad.maxPurchase || 15000} USDT
                                            </small>
                                        )}

                                        <div className="popup-buttons" style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                                            <button
                                                className="confirm-btn"
                                                onClick={handleConfirmPurchase}
                                                style={{
                                                    padding: '12px 24px',
                                                    backgroundColor: '#F3BB2B',
                                                    color: '#000',
                                                    border: 'none',
                                                    borderRadius: '8px',
                                                    cursor: 'pointer',
                                                    fontWeight: '600',
                                                    fontSize: '16px'
                                                }}
                                                disabled={!purchaseAmount || parseFloat(purchaseAmount) <= 0}
                                            >
                                                Confirm
                                            </button>
                                            <button
                                                className="cancel-btn"
                                                onClick={handleClosePopup}
                                                style={{
                                                    padding: '12px 24px',
                                                    backgroundColor: '#29313D',
                                                    color: '#fff',
                                                    border: 'none',
                                                    borderRadius: '8px',
                                                    cursor: 'pointer',
                                                    fontWeight: '600',
                                                    fontSize: '16px'
                                                }}
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </section> */}


            {/* <div className="modal fade" id="buy_now_modal" tabIndex="-1" aria-labelledby="buyNowModalLabel" aria-hidden="true">
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title" id="buyNowModalLabel">Buy Tokens</h5>
                            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group mb-3">
                                <label htmlFor="purchaseAmount" className="form-label">Enter Amount (USDT)</label>
                                <input
                                    type="number"
                                    className="form-control"
                                    id="purchaseAmount"
                                    placeholder="Enter amount"
                                    value={purchaseAmount}
                                    onChange={(e) => setPurchaseAmount(e.target.value)}
                                    min={currentLaunchpad?.minPurchase || 10}
                                    max={currentLaunchpad?.maxPurchase || 15000}
                                    onWheel={(e) => e.target.blur()}
                                />
                                {currentLaunchpad && (
                                    <small className="form-text text-muted">
                                        Min: {currentLaunchpad.minPurchase || 10} USDT | Max: {currentLaunchpad.maxPurchase || 15000} USDT
                                    </small>
                                )}
                            </div>
                            {purchaseAmount && (
                                <div className="alert alert-info">
                                    <strong>You will receive:</strong> {(parseFloat(purchaseAmount) / (currentLaunchpad?.tokenPrice || 1)).toFixed(2)} {currentLaunchpad?.tokenSymbol || 'Tokens'}
                                </div>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                            <button
                                type="button"
                                className="btn btn-primary"
                                onClick={handleConfirmPurchase}
                                disabled={!purchaseAmount || parseFloat(purchaseAmount) <= 0}
                            >
                                Confirm Purchase
                            </button>
                        </div>
                    </div>
                </div>
            </div> */}

        </>
    )
}

export default LaunchpadCoinPage