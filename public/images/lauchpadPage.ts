import { Link } from "react-router-dom"
import '../AnnouncmentManagement/Annoucement.css'
import LoaderHelper from "../../../customComponents/Loading/LoaderHelper";
import AuthService from "../../../api/services/AuthService";
import { alertErrorMessage } from "../../../customComponents/CustomAlertMessage";
import { useEffect, useState } from "react";
import { ApiConfig } from "../../../api/apiConfig/apiConfig";


const LaunchpadHome = () => {
    const [allLaunchpadList, setAllLaunchPadList] = useState([])
    const [filter, setFilter] = useState("upcoming"); // upcoming | live | ended
    const [projects, setProjects] = useState([]);

    useEffect(() => {
        handleUserlplist();
        // handleUpcominglplist();
        // handleCancellplist();
        // handleLivelplist();
        // handleEndedlplist();
        // handleUserPurcheslplist();
    }, []);

    const handleUpcominglplist = async () => {
        LoaderHelper.loaderStatus(true);
        try {
            const result = await AuthService.getUpcominglpList();
            LoaderHelper.loaderStatus(false);
            if (result?.success) {
                setAllLaunchPadList(result?.data);
            } else {
                alertErrorMessage("Something went wrong while fetching announcement categories.");
            }
        } catch (err) {
            LoaderHelper.loaderStatus(false);
            alertErrorMessage("Error loading announcement categories.");
        }
    };
    const handleUserlplist = async () => {
        LoaderHelper.loaderStatus(true);
        try {
            const result = await AuthService.getUserlpList();
            LoaderHelper.loaderStatus(false);
            if (result?.success) {
                setAllLaunchPadList(result?.data);
            } else {
                alertErrorMessage("Something went wrong while fetching launchpad data.");
            }
        } catch (err) {
            LoaderHelper.loaderStatus(false);
            alertErrorMessage("Error loading launchpad data.");
        }
    };

    // ✅ Filter data based on status
    const filteredProjects =

        allLaunchpadList?.filter(
            (item) => item?.status?.toLowerCase() === filter
        ) || [];

    const handleCancellplist = async () => {
        LoaderHelper.loaderStatus(true);
        try {
            const result = await AuthService.getCancellpList();
            LoaderHelper.loaderStatus(false);
            if (result?.success) {
                setAllLaunchPadList(result?.data);
            } else {
                alertErrorMessage("Something went wrong while fetching announcement categories.");
            }
        } catch (err) {
            LoaderHelper.loaderStatus(false);
            alertErrorMessage("Error loading announcement categories.");
        }
    };
    const handleLivelplist = async () => {
        LoaderHelper.loaderStatus(true);
        try {
            const result = await AuthService.getLiveListing();
            LoaderHelper.loaderStatus(false);
            if (result?.success) {
                setAllLaunchPadList(result?.data);
            } else {
                alertErrorMessage("Something went wrong while fetching announcement categories.");
            }
        } catch (err) {
            LoaderHelper.loaderStatus(false);
            alertErrorMessage("Error loading announcement categories.");
        }
    };
    const handleEndedlplist = async () => {
        LoaderHelper.loaderStatus(true);
        try {
            const result = await AuthService.getEndedListing();
            LoaderHelper.loaderStatus(false);
            if (result?.success) {
                setAllLaunchPadList(result?.data);
            } else {
                alertErrorMessage("Something went wrong while fetching announcement categories.");
            }
        } catch (err) {
            LoaderHelper.loaderStatus(false);
            alertErrorMessage("Error loading announcement categories.");
        }
    };
    const handleUserPurcheslplist = async () => {
        LoaderHelper.loaderStatus(true);
        try {
            const result = await AuthService.getUserPurchingList();
            LoaderHelper.loaderStatus(false);
            if (result?.success) {
                setAllLaunchPadList(result?.data);
            } else {
                alertErrorMessage("Something went wrong while fetching announcement categories.");
            }
        } catch (err) {
            LoaderHelper.loaderStatus(false);
            alertErrorMessage("Error loading announcement categories.");
        }
    };
    const handleTokenPurche = async (launchpadId, amountInvested) => {
        LoaderHelper.loaderStatus(true);
        try {
            const result = await AuthService.tokenPurches(launchpadId, amountInvested);
            LoaderHelper.loaderStatus(false);
            if (result?.success) {
                setAllLaunchPadList(result?.data);
            } else {
                alertErrorMessage("Something went wrong while fetching announcement categories.");
            }
        } catch (err) {
            LoaderHelper.loaderStatus(false);
            alertErrorMessage("Error loading announcement categories.");
        }
    };



    return (
        <>
            <div class="launchpad_hero_s">
                <div class="container">
                    <div class="row">
                        <div class="col-sm-7">
                            <div class="cnt_banner">
                                <h1>All Launchpad Crypto Platforms
                                    Rated by CoinLaunch Score</h1>
                                <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et
                                    dolore magna aliqua.Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor
                                    incididunt ut labore et dolore magna aliqua.</p>
                            </div>
                        </div>
                        <div class="col-sm-5">
                            <div class="hero_img">
                                <img src="/images/AnnouncementImg/launchpad_hero_img.png" alt="Launchpad Crypto Platforms" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <section className="project_coin">
                <div className="container">
                    <h2>Projects</h2>

                    {/* === Filter Tabs === */}
                    <div className="filter_tabs" style={{ marginBottom: "20px" }}>
                        <button
                            className={`btn ${filter === "upcoming" ? "btn-primary" : "btn-outline-primary"
                                }`}
                            onClick={() => setFilter("upcoming")}
                        >
                            Upcoming
                        </button>
                        <button
                            className={`btn ${filter === "live" ? "btn-primary" : "btn-outline-primary"
                                }`}
                            onClick={() => setFilter("live")}
                        >
                            Live
                        </button>
                        <button
                            className={`btn ${filter === "ended" ? "btn-primary" : "btn-outline-primary"
                                }`}
                            onClick={() => setFilter("ended")}
                        >
                            Ended
                        </button>
                    </div>

                    {/* === Project List === */}
                    <div className="coin_data_table">
                        {filteredProjects?.length > 0 ? (
                            filteredProjects.map((item, index) => {
                                const progress =
                                    item?.totalRaised && item?.hardCap
                                        ? ((item?.totalRaised / item?.hardCap) * 100).toFixed(2)
                                        : 0;

                                return (
                                    <div className="coin_block" key={index}>
                                        <div className="launchpad_card" style={{
                                            background: "#111",
                                            borderRadius: "12px",
                                            padding: "20px",
                                            color: "#fff",
                                            marginBottom: "25px",
                                        }}>

                                            {/* Status Badge */}
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                <span
                                                    style={{
                                                        background:
                                                            item?.status === "LIVE"
                                                                ? "#4caf50"
                                                                : item?.status === "UPCOMING"
                                                                    ? "#ff9800"
                                                                    : "#555",
                                                        color: "#fff",
                                                        fontSize: "12px",
                                                        padding: "4px 10px",
                                                        borderRadius: "6px",
                                                        fontWeight: 600,
                                                    }}
                                                >
                                                    {item?.status || "N/A"}
                                                </span>

                                                <div style={{ display: "flex", gap: "10px" }}>
                                                    {item?.website && (
                                                        <a
                                                            href={item.website}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            style={{ color: "#00bcd4", fontSize: "14px" }}
                                                        >
                                                            🌐 Website
                                                        </a>
                                                    )}
                                                    {item?.whitepaper && (
                                                        <a
                                                            href={item.whitepaper}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            style={{ color: "#00bcd4", fontSize: "14px" }}
                                                        >
                                                            📄 Whitepaper
                                                        </a>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Top Section */}
                                            <div style={{ display: "flex", alignItems: "center", marginTop: "15px" }}>
                                                <img
                                                    src={
                                                        item?.logoUrl?.startsWith("http")
                                                            ? item.logoUrl
                                                            : `${ApiConfig?.baseImage}${item?.logoUrl}`
                                                    }
                                                    alt={item?.tokenSymbol}
                                                    style={{
                                                        width: "60px",
                                                        height: "60px",
                                                        borderRadius: "50%",
                                                        marginRight: "15px",
                                                    }}
                                                />
                                                <div>
                                                    <h3 style={{ fontSize: "20px", fontWeight: 700 }}>
                                                        {item?.tokenName}{" "}
                                                        <span style={{ fontSize: "14px", color: "#bbb" }}>
                                                            ({item?.tokenSymbol})
                                                        </span>
                                                    </h3>
                                                    <p style={{ color: "#999", fontSize: "14px" }}>{item?.network}</p>
                                                </div>
                                            </div>

                                            {/* Progress Section */}
                                            <div style={{ marginTop: "15px" }}>
                                                <div style={{ display: "flex", justifyContent: "space-between" }}>
                                                    <span>Participants: <strong>{item?.participants || 0}</strong></span>
                                                    <span>Raised: <strong>{item?.totalRaised}/{item?.hardCap}</strong></span>
                                                </div>
                                                <div
                                                    style={{
                                                        background: "#333",
                                                        borderRadius: "6px",
                                                        height: "8px",
                                                        marginTop: "6px",
                                                        position: "relative",
                                                    }}
                                                >
                                                    <div
                                                        style={{
                                                            width: `${progress}%`,
                                                            background: "#4caf50",
                                                            height: "100%",
                                                            borderRadius: "6px",
                                                        }}
                                                    ></div>
                                                </div>
                                                <span style={{ fontSize: "12px", color: "#aaa" }}>
                                                    Current Progress: {progress}%
                                                </span>
                                            </div>

                                            {/* Info Table */}
                                            <div
                                                style={{
                                                    display: "grid",
                                                    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                                                    gap: "15px",
                                                    marginTop: "20px",
                                                    borderTop: "1px solid #222",
                                                    paddingTop: "15px",
                                                }}
                                            >
                                                <div>
                                                    <span style={{ color: "#999", fontSize: "13px" }}>
                                                        Subscription Price
                                                    </span>
                                                    <p style={{ fontWeight: 600 }}>
                                                        1 {item?.tokenSymbol} = {item?.tokenPrice} USDT
                                                    </p>
                                                </div>

                                                <div>
                                                    <span style={{ color: "#999", fontSize: "13px" }}>Total Supply</span>
                                                    <p style={{ fontWeight: 600 }}>
                                                        {item?.totalSupply?.toLocaleString()} {item?.tokenSymbol}
                                                    </p>
                                                </div>

                                                <div>
                                                    <span style={{ color: "#999", fontSize: "13px" }}>
                                                        Min Subscription
                                                    </span>
                                                    <p style={{ fontWeight: 600 }}>{item?.minPurchase} USDT</p>
                                                </div>

                                                <div>
                                                    <span style={{ color: "#999", fontSize: "13px" }}>
                                                        Max Subscription
                                                    </span>
                                                    <p style={{ fontWeight: 600 }}>{item?.maxPurchase} USDT</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <p style={{ textAlign: "center", color: "#888" }}>
                                No {filter} projects found.
                            </p>
                        )}
                    </div>

                </div>
            </section>
            <section class="project_coin complete_project_s">
                <div class="container">
                    <h2>Faq’s</h2>

                    <div class="faq_section">
                        <div class="accordion" id="accordionExample">
                            <div class="accordion-item">
                                <h2 class="accordion-header" id="headingOne">
                                    <button class="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#collapseOne"
                                        aria-expanded="true" aria-controls="collapseOne">
                                        What is crypto exchange development, and how can URG-X help with it?
                                    </button>
                                </h2>
                                <div id="collapseOne" class="accordion-collapse collapse show" aria-labelledby="headingOne"
                                    data-bs-parent="#accordionExample">
                                    <div class="accordion-body">
                                        Crypto exchange development is the process of building platforms that allow users to buy, sell, and
                                        trade cryptocurrencies. URG-X specializes in developing secure, scalable, and high-performance
                                        crypto exchanges tailored to your business needs.
                                    </div>
                                </div>
                                <div class="btn_box_in"></div>
                            </div>

                            <div class="accordion-item">
                                <h2 class="accordion-header" id="headingTwo">
                                    <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse"
                                        data-bs-target="#collapseTwo" aria-expanded="false" aria-controls="collapseTwo">
                                        What types of web development services does URG-X provide?
                                    </button>
                                </h2>
                                <div id="collapseTwo" class="accordion-collapse collapse" aria-labelledby="headingTwo"
                                    data-bs-parent="#accordionExample">
                                    <div class="accordion-body">
                                        URG-X offers a full range of web development services, including front-end and back-end development,
                                        custom website design, e-commerce solutions, and CMS-based development. We use the latest technologies
                                        to deliver responsive and feature-rich websites.
                                    </div>
                                </div>
                                <div class="btn_box_in"></div>
                            </div>

                            <div class="accordion-item">
                                <h2 class="accordion-header" id="headingThree">
                                    <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse"
                                        data-bs-target="#collapseThree" aria-expanded="false" aria-controls="collapseThree">
                                        How do you ensure the security of cryptocurrency exchange platforms?
                                    </button>
                                </h2>
                                <div id="collapseThree" class="accordion-collapse collapse" aria-labelledby="headingThree"
                                    data-bs-parent="#accordionExample">
                                    <div class="accordion-body">
                                        We implement the latest security measures, including end-to-end encryption, two-factor authentication
                                        (2FA), regular audits, and secure APIs to protect user data and funds on your crypto exchange platform.
                                    </div>
                                </div>
                                <div class="btn_box_in"></div>
                            </div>

                            <div class="accordion-item">
                                <h2 class="accordion-header" id="headingFour">
                                    <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse"
                                        data-bs-target="#collapseFour" aria-expanded="false" aria-controls="collapseFour">
                                        What game development services does URG-X offer?
                                    </button>
                                </h2>
                                <div id="collapseFour" class="accordion-collapse collapse" aria-labelledby="headingFour"
                                    data-bs-parent="#accordionExample">
                                    <div class="accordion-body">
                                        URG-X specializes in game development for various platforms, including mobile apps, desktop, and
                                        web-based games. We offer end-to-end game development services, from ideation and design to development
                                        and deployment.
                                    </div>
                                </div>
                                <div class="btn_box_in"></div>
                            </div>

                            <div class="accordion-item">
                                <h2 class="accordion-header" id="headingFive">
                                    <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse"
                                        data-bs-target="#collapseFive" aria-expanded="false" aria-controls="collapseFive">
                                        How long does it take to develop a mobile app?
                                    </button>
                                </h2>
                                <div id="collapseFive" class="accordion-collapse collapse" aria-labelledby="headingFive"
                                    data-bs-parent="#accordionExample">
                                    <div class="accordion-body">
                                        The development timeline for a mobile app depends on its complexity. A simple app may take 2-4 weeks,
                                        while a more complex app with multiple features and integrations may take 4-8 weeks.
                                    </div>
                                </div>
                                <div class="btn_box_in"></div>
                            </div>

                            <div class="accordion-item">
                                <h2 class="accordion-header" id="headingSix">
                                    <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse"
                                        data-bs-target="#collapseSix" aria-expanded="false" aria-controls="collapseSix">
                                        What is blockchain development, and why is it important for my business?
                                    </button>
                                </h2>
                                <div id="collapseSix" class="accordion-collapse collapse" aria-labelledby="headingSix"
                                    data-bs-parent="#accordionExample">
                                    <div class="accordion-body">
                                        Blockchain development involves creating decentralized applications (dApps) that use blockchain
                                        technology. It offers transparency, security, and immutability, making it ideal for industries like
                                        finance, healthcare, and supply chain management.
                                    </div>
                                </div>
                                <div class="btn_box_in"></div>
                            </div>

                            <div class="accordion-item">
                                <h2 class="accordion-header" id="headingSeven">
                                    <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse"
                                        data-bs-target="#collapseSeven" aria-expanded="false" aria-controls="collapseSeven">
                                        How can I improve the user experience of my website or mobile app?
                                    </button>
                                </h2>
                                <div id="collapseSeven" class="accordion-collapse collapse" aria-labelledby="headingSeven"
                                    data-bs-parent="#accordionExample">
                                    <div class="accordion-body">
                                        Focus on clean design, fast loading times, easy navigation, and mobile responsiveness. Regular user
                                        testing and feedback can help enhance the user experience and ensure the product meets user
                                        expectations.
                                    </div>
                                </div>
                                <div class="btn_box_in"></div>
                            </div>

                            <div class="accordion-item">
                                <h2 class="accordion-header" id="headingEight">
                                    <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse"
                                        data-bs-target="#collapseEight" aria-expanded="false" aria-controls="collapseEight">
                                        Do you offer white-label solutions for crypto exchanges?
                                    </button>
                                </h2>
                                <div id="collapseEight" class="accordion-collapse collapse" aria-labelledby="headingEight"
                                    data-bs-parent="#accordionExample">
                                    <div class="accordion-body">
                                        Yes, URG-X provides customizable white-label solutions for crypto exchanges. You can launch your
                                        exchange platform quickly and with your branding while we handle the back-end development and technical
                                        support.
                                    </div>
                                </div>
                                <div class="btn_box_in"></div>
                            </div>

                            <div class="accordion-item">
                                <h2 class="accordion-header" id="headingNine">
                                    <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse"
                                        data-bs-target="#collapseNine" aria-expanded="false" aria-controls="collapseNine">
                                        Can URG-X help with SEO for my website or app?
                                    </button>
                                </h2>
                                <div id="collapseNine" class="accordion-collapse collapse" aria-labelledby="headingNine"
                                    data-bs-parent="#accordionExample">
                                    <div class="accordion-body">
                                        Yes, we provide SEO optimization services to ensure your website or app ranks higher on search engines.
                                        This helps increase organic traffic, user engagement, and ultimately, conversions.
                                    </div>
                                </div>
                                <div class="btn_box_in"></div>
                            </div>

                            <div class="accordion-item">
                                <h2 class="accordion-header" id="headingTen">
                                    <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse"
                                        data-bs-target="#collapseTen" aria-expanded="false" aria-controls="collapseTen">
                                        How does URG-X handle post-launch maintenance?
                                    </button>
                                </h2>
                                <div id="collapseTen" class="accordion-collapse collapse" aria-labelledby="headingTen"
                                    data-bs-parent="#accordionExample">
                                    <div class="accordion-body">
                                        We offer comprehensive post-launch maintenance services, including bug fixes, performance optimization,
                                        security updates, and regular feature enhancements to ensure the longevity of your product.
                                    </div>
                                </div>
                                <div class="btn_box_in"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

        </>
    )
}

export default LaunchpadHome