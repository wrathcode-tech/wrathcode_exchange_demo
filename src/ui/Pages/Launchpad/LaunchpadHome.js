import { Link } from "react-router-dom"
import '../AnnouncmentManagement/Annoucement.css'
import LoaderHelper from "../../../customComponents/Loading/LoaderHelper";
import AuthService from "../../../api/services/AuthService";
import { alertErrorMessage } from "../../../customComponents/CustomAlertMessage";
import { useEffect, useState } from "react";
import { ApiConfig } from "../../../api/apiConfig/apiConfig";
import { Helmet } from "react-helmet-async";


const LaunchpadHome = () => {
    const [allLaunchpadList, setAllLaunchPadList] = useState([])
    const [filter, setFilter] = useState("live"); // upcoming | live | ended
    const [durations, setDurations] = useState({});

    useEffect(() => {
        handleUserlplist();

    }, []);


    const handleUserlplist = async () => {
        LoaderHelper.loaderStatus(true);
        try {
            const result = await AuthService.getUserlpList();
            LoaderHelper.loaderStatus(false);

            if (result?.success && Array.isArray(result.data)) {
                const allData = result.data;
                setAllLaunchPadList(allData);
                // Filter by status (case-insensitive)
                const liveList = allData.filter(
                    (item) => item?.status?.toLowerCase() === "live" || item?.isLive
                );
                const upcomingList = allData.filter(
                    (item) => item?.status?.toLowerCase() === "upcoming"
                );
                const endedList = allData.filter(
                    (item) => item?.status?.toLowerCase() === "ended"
                );

                // Priority logic
                if (liveList.length > 0) {
                    setFilter("live");
                } else if (upcomingList.length > 0) {
                    setFilter("upcoming");
                } else if (endedList.length > 0) {
                    setFilter("ended");
                } else {
                    setFilter("live");
                }
            } else {
                alertErrorMessage("Something went wrong while fetching launchpad data.");
            }
        } catch (err) {
            LoaderHelper.loaderStatus(false);
            alertErrorMessage("Error loading launchpad data.");
        }
    };


    const filteredProjects =
        allLaunchpadList?.filter(
            (item) => item?.status?.toLowerCase() === filter
        ) || [];



    useEffect(() => {
        if (allLaunchpadList.length > 0) {
            const interval = setInterval(() => {
                setDurations(() => {
                    const map = {};
                    allLaunchpadList.forEach((item) => {
                        const isLive =
                            item?.status?.toLowerCase() === "live" || item?.isLive === true;

                        if (!isLive) {
                            if (item?._id) map[item._id] = { isEnded: true };
                            return;
                        }

                        const now = new Date().getTime();
                        const end = new Date(item.endTime).getTime();

                        if (!end || isNaN(end)) {
                            if (item?._id) map[item._id] = { isEnded: true };
                            return;
                        }

                        const distance = end - now;

                        if (distance <= 0) {
                            if (item?._id) map[item._id] = { isEnded: true };
                            return;
                        }

                        if (item?._id) {
                            map[item._id] = {
                                isEnded: false,
                                days: Math.floor(distance / (1000 * 60 * 60 * 24)),
                                hours: Math.floor(
                                    (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
                                ),
                                minutes: Math.floor(
                                    (distance % (1000 * 60 * 60)) / (1000 * 60)
                                ),
                                seconds: Math.floor((distance % (1000 * 60)) / 1000),
                            };
                        }
                    });
                    return map;
                });
            }, 1000);

            return () => clearInterval(interval);
        }
    }, [allLaunchpadList]);


    return (
        <>
            <Helmet>
                <title>Token Launch Platform | URG-X Launchpad</title>

                <meta
                    name="description"
                    content="Join URG-X Launchpad – a platform for early-stage projects, exclusive token sales and Web3 innovation. Be first to new tokens."
                />

                <meta
                    name="keywords"
                    content="token sale platform, Web3 launchpad, early crypto investment, URG-X tokens"
                />
            </Helmet>

            <div className="launchpad_hero_s">
                <div className="container">
                    <div className="row">
                        <div className="col-sm-7">
                            <div className="cnt_banner">
                                <h1>Launchpad</h1>
                                <p>Your Easiest Way to Top Tokens — Early or at a Discount</p>

                                <ul className="launchpadlist">
                                    <li><span>Total Raised (USDT)</span>75,668,737.3732033</li>
                                    <li><span>Total Participants</span>285,272</li>
                                    <li><span>Listed Projects</span>27</li>
                                </ul>

                            </div>
                        </div>
                        <div className="col-sm-5">
                            <div className="hero_img">
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
                    <div className="filter_tabs">

                        <button
                            className={`btn active ${filter === "live" ? "" : ""}`}
                            onClick={() => setFilter("live")}>
                            Live
                        </button>
                        <button
                            className={`btn${filter === "upcoming" ? "" : ""}`}
                            onClick={() => setFilter("upcoming")}>
                            Upcoming
                        </button>
                        <button
                            className={`btn${filter === "ended" ? "" : ""}`}
                            onClick={() => setFilter("ended")}
                        >
                            Ended
                        </button>
                    </div>

                    <div className="project_crypto_bl">
                        <div className="project_top">
                            <div className="coin_lft">
                                <div className="coin"><img src="https://backend.gatbits.com//uploads/logoUrl-1764864308285-985180289.png" alt="ZAC" /></div>
                                <div className="coin_cnt">
                                    <div className="hd d-flex">
                                        <h3>ZAC</h3>
                                        <ul className="subcate">
                                            {/* <li className="greendark"><button>Initial Offering</button></li> */}
                                            {/* <li className="yellodark"><button>Discount Buy</button></li> */}
                                            <li className="darkbg"><button>Ended</button></li>
                                        </ul>
                                    </div>
                                    <span>TZAC</span>
                                </div>
                            </div>
                            <div className="total_time_ri">
                                <ul>
                                    <li><span>Total Distribution</span> 17,500 LIT</li>
                                    <li><span>End Time</span> 2025.12.31 10:00</li>
                                </ul>
                            </div>

                        </div>
                        <div className="d-flex subscribe_data_info">

                            <div className="subscribe_user_bl">
                                <div className="d-flex userinfo_top">
                                    <div className="subscribe_user_lft">
                                        <img src="/images/tether_icon.png" alt="USDT" />
                                        <div className="subscribe_cnt">
                                            <h4>USDT <span className="off">60% Off</span></h4>
                                            <p>Commit USDT to Subscribe LIT</p>
                                        </div>
                                    </div>

                                    <div className="user_right">
                                        <i className="ri-user-line"></i>529
                                    </div>

                                </div>

                                <ul className="exclusivelist">
                                    <li>Exclusive Subscription Price <span className="text-yellow">1 LIT = 1.6 USDT <span className="subprice">Sell Price: 4 USDT</span></span></li>
                                    <li>Total Allocation <span> 12,500 LIT</span></li>
                                    <li>Total Committed <span>1,030,485.64 USDT</span></li>
                                </ul>
                            <button className="viewdel_btn"><Link to={`/launchpadCoin_Details/${filteredProjects?._id}`}>View Details</Link></button>

                            </div>

                            <div className="subscribe_user_bl">
                                <div className="d-flex userinfo_top">
                                    <div className="subscribe_user_lft">
                                        <img src="/images/tether_icon.png" alt="USDT" />
                                        <div className="subscribe_cnt">
                                            <h4>USDT <span className="off">60% Off</span></h4>
                                            <p>Commit USDT to Subscribe LIT</p>
                                        </div>
                                    </div>

                                    <div className="user_right">
                                        <i className="ri-user-line"></i>529
                                    </div>

                                </div>

                                <ul className="exclusivelist">
                                    <li>Exclusive Subscription Price <span className="text-yellow">1 LIT = 1.6 USDT <span className="subprice">Sell Price: 4 USDT</span></span></li>
                                    <li>Total Allocation <span> 12,500 LIT</span></li>
                                    <li>Total Committed <span>1,030,485.64 USDT</span></li>
                                </ul>
                                <button className="viewdel_btn"><Link to={`/launchpadCoin_Details/${filteredProjects?._id}`}>View Details</Link></button>

                            </div>

                        </div>

                    </div>

                    <div className="project_crypto_bl">
                        <div className="project_top">
                            <div className="coin_lft">
                                <div className="coin"><img src="https://backend.gatbits.com//uploads/logoUrl-1764864308285-985180289.png" alt="ZAC" /></div>
                                <div className="coin_cnt">
                                    <div className="hd d-flex">
                                        <h3>ZAC</h3>
                                        <ul className="subcate">
                                            {/* <li className="greendark"><button>Initial Offering</button></li> */}
                                            {/* <li className="yellodark"><button>Discount Buy</button></li> */}
                                            <li className="darkbg"><button>Ended</button></li>
                                        </ul>
                                    </div>
                                    <span>TZAC</span>
                                </div>
                            </div>
                            <div className="total_time_ri">
                                <ul>
                                    <li><span>Total Distribution</span> 17,500 LIT</li>
                                    <li><span>End Time</span> 2025.12.31 10:00</li>
                                </ul>
                            </div>

                        </div>
                        <div className="d-flex subscribe_data_info">

                            <div className="subscribe_user_bl">
                                <div className="d-flex userinfo_top">
                                    <div className="subscribe_user_lft">
                                        <img src="/images/tether_icon.png" alt="USDT" />
                                        <div className="subscribe_cnt">
                                            <h4>USDT <span className="off">60% Off</span></h4>
                                            <p>Commit USDT to Subscribe LIT</p>
                                        </div>
                                    </div>

                                    <div className="user_right">
                                        <i className="ri-user-line"></i>529
                                    </div>

                                </div>

                                <ul className="exclusivelist">
                                    <li>Exclusive Subscription Price <span className="text-yellow">1 LIT = 1.6 USDT <span className="subprice">Sell Price: 4 USDT</span></span></li>
                                    <li>Total Allocation <span> 12,500 LIT</span></li>
                                    <li>Total Committed <span>1,030,485.64 USDT</span></li>
                                </ul>
                               <button className="viewdel_btn"><Link to={`/launchpadCoin_Details/${filteredProjects?._id}`}>View Details</Link></button>

                            </div>

                            <div className="subscribe_user_bl">
                                <div className="d-flex userinfo_top">
                                    <div className="subscribe_user_lft">
                                        <img src="/images/tether_icon.png" alt="USDT" />
                                        <div className="subscribe_cnt">
                                            <h4>USDT <span className="off">60% Off</span></h4>
                                            <p>Commit USDT to Subscribe LIT</p>
                                        </div>
                                    </div>

                                    <div className="user_right">
                                        <i className="ri-user-line"></i>529
                                    </div>

                                </div>

                                <ul className="exclusivelist">
                                    <li>Exclusive Subscription Price <span className="text-yellow">1 LIT = 1.6 USDT <span className="subprice">Sell Price: 4 USDT</span></span></li>
                                    <li>Total Allocation <span> 12,500 LIT</span></li>
                                    <li>Total Committed <span>1,030,485.64 USDT</span></li>
                                </ul>
                                <button className="viewdel_btn"><Link to={`/launchpadCoin_Details/${filteredProjects?._id}`}>View Details</Link></button>
                              

                            </div>

                        </div>

                    </div>

                    <div className="viewmorebtn"><a href="#">View More</a></div>

                  

                    {/* === Project List === */}

                    {/* <div className="table-responsive_tow">
                        <div className="coin_data_table">
                            {filteredProjects?.length > 0 ? (
                                filteredProjects.map((item, index) => (
                                    <div className="coin_block" key={index}>
                                        <div className="row">
                                     

                                            <div className="col-sm-4">
                                                <div className="add_banner">
                                                    <img
                                                        src={
                                                            item?.bannerImage?.startsWith("http")
                                                                ? item.bannerImage
                                                                : `${ApiConfig?.baseImage}${item?.bannerImage}`
                                                        }
                                                        alt={item?.tokenSymbol || "token"}
                                                    />
                                                </div>
                                            </div>

                                            <div className="col-sm-4">
                                                <div className="coin_lft">
                                                    <div className="coin_top">
                                                        <div className="coin">
                                                            <img
                                                                src={
                                                                    item?.logoUrl?.startsWith("http")
                                                                        ? item.logoUrl
                                                                        : `${ApiConfig?.baseImage}${item?.logoUrl}`
                                                                }
                                                                alt={item?.tokenSymbol || "token"}
                                                            />
                                                        </div>
                                                        <div className="coin_cnt">
                                                            <h3>{item?.tokenSymbol || "N/A"}</h3>
                                                            <span>
                                                                {item?.tokensForSale?.toLocaleString()}{" "}
                                                                {item?.tokenName}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="timeandate">
                                                        <ul>
                                                            <li>
                                                                <span>Subscription Start Date</span>
                                                                <span>
                                                                    {item?.startTime
                                                                        ? new Date(item?.startTime).toLocaleString()
                                                                        : "-"}
                                                                </span>
                                                            </li>

                                                            <li>
                                                                <h6>Subscription End Date</h6>
                                                                <h6>
                                                                    {item?.endTime
                                                                        ? new Date(item?.endTime).toLocaleString()
                                                                        : "-"}
                                                                </h6>
                                                            </li>

                                                        

                                                        </ul>
                                                        <ul className="duration_data">
                                                            {item?.status?.toLowerCase() === "live" || item?.isLive ? (
                                                                <li className="duration_box">
                                                                    <div className="duration_label">⏱ Ends In</div>
                                                                    <div className="countdown_timer">
                                                                        {!durations[item?._id] ? (
                                                                            <div className="countdown_loading">Loading...</div>
                                                                        ) : durations[item?._id]?.isEnded ? (
                                                                            <div className="countdown_ended">Ended</div>
                                                                        ) : (
                                                                            <>
                                                                                <div className="countdown_item">
                                                                                    <span className="countdown_value">
                                                                                        {String(durations[item?._id]?.days || 0).padStart(2, "0")}
                                                                                    </span>
                                                                                    <span className="countdown_label">Day</span>
                                                                                </div>
                                                                                <div className="countdown_separator">:</div>
                                                                                <div className="countdown_item">
                                                                                    <span className="countdown_value">
                                                                                        {String(durations[item?._id]?.hours || 0).padStart(2, "0")}
                                                                                    </span>
                                                                                    <span className="countdown_label">Hr</span>
                                                                                </div>
                                                                                <div className="countdown_separator">:</div>
                                                                                <div className="countdown_item">
                                                                                    <span className="countdown_value">
                                                                                        {String(durations[item?._id]?.minutes || 0).padStart(2, "0")}
                                                                                    </span>
                                                                                    <span className="countdown_label">Min</span>
                                                                                </div>
                                                                                <div className="countdown_separator">:</div>
                                                                                <div className="countdown_item">
                                                                                    <span className="countdown_value">
                                                                                        {String(durations[item?._id]?.seconds || 0).padStart(2, "0")}
                                                                                    </span>
                                                                                    <span className="countdown_label">Sec</span>
                                                                                </div>
                                                                            </>
                                                                        )}
                                                                    </div>
                                                                </li>
                                                            ) : null}
                                                        </ul>
                                                    </div>
                                                </div>
                                            </div>



                                         
                                            <div className="col-sm-4">
                                                <div className="coin_right">
                                                    <div className="table-responsive">
                                                        <table cellSpacing="0" cellPadding="8">
                                                            <thead>
                                                                <tr>
                                                                    <th>Average Airdrop</th>
                                                                    <th></th>
                                                                    <th>Snapshot Time</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                <tr>
                                                                    <td className="first_child">
                                                                        <img
                                                                            className="icon_icon"
                                                                            src="/images/AnnouncementImg/bnb_icon.svg"
                                                                            alt="bnb"
                                                                        />
                                                                        Total Raised
                                                                    </td>
                                                                    <td>
                                                                        {item?.totalRaised || "0.00"}
                                                                        <span className="value_price">≈$0.24302</span>
                                                                    </td>
                                                                    <td>
                                                                        {item?.startTime
                                                                            ? new Date(item?.startTime).toLocaleDateString()
                                                                            : "-"}{" "}
                                                                        -{" "}
                                                                        {item?.endTime
                                                                            ? new Date(item?.endTime).toLocaleDateString()
                                                                            : "-"}
                                                                    </td>
                                                                </tr>
                                                                <tr>
                                                                    <td colSpan="2">
                                                                        <span style={{ color: "#999" }}>Total Token for Sale : </span>
                                                                        <strong style={{ marginLeft: "6px" }}>
                                                                            {item?.tokensForSale || 0}
                                                                        </strong>
                                                                    </td>
                                                                    <td className="rightbtn">
                                                                        <td className="rightbtn">
                                                                            {item?.status?.toLowerCase() === "live" || item?.isLive ? (
                                                                                <Link
                                                                                    className="trade_btn"
                                                                                    to={`/launchpadCoin_Details/${item?._id}`}
                                                                                >
                                                                                    Trade
                                                                                </Link>
                                                                            ) : (
                                                                                <Link
                                                                                    className="trade_btn"
                                                                                    to={`/launchpadCoin_Details/${item?._id}`}
                                                                                >
                                                                                    View Details
                                                                                </Link>
                                                                            )}
                                                                        </td>

                                                                    </td>
                                                                </tr>
                                                            </tbody>
                                                        </table>
                                                    </div>

                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <>
                                    <div className="no_data_vector ">
                                        <img src="/images/Group 1171275449 (1).svg" alt="no-data" />
                                    </div>
                                    <p className="text-center">
                                        No {filter} projects found.
                                    </p>
                                </>
                            )}
                        </div>
                    </div> */}
                </div>
            </section>
            {/* <section className="project_coin complete_project_s">
                <div className="container">
                    <h2>Faq’s</h2>

                    <div className="faq_section">
                        <div className="accordion" id="accordionExample">
                            <div className="accordion-item">
                                <h2 className="accordion-header" id="headingOne">
                                    <button className="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#collapseOne"
                                        aria-expanded="true" aria-controls="collapseOne">
                                        What is crypto exchange development, and how can URG-X help with it?
                                    </button>
                                </h2>
                                <div id="collapseOne" className="accordion-collapse collapse show" aria-labelledby="headingOne"
                                    data-bs-parent="#accordionExample">
                                    <div className="accordion-body">
                                        Crypto exchange development is the process of building platforms that allow users to buy, sell, and
                                        trade cryptocurrencies. URG-X specializes in developing secure, scalable, and high-performance
                                        crypto exchanges tailored to your business needs.
                                    </div>
                                </div>
                                <div className="btn_box_in"></div>
                            </div>

                            <div className="accordion-item">
                                <h2 className="accordion-header" id="headingTwo">
                                    <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse"
                                        data-bs-target="#collapseTwo" aria-expanded="false" aria-controls="collapseTwo">
                                        What types of web development services does URG-X provide?
                                    </button>
                                </h2>
                                <div id="collapseTwo" className="accordion-collapse collapse" aria-labelledby="headingTwo"
                                    data-bs-parent="#accordionExample">
                                    <div className="accordion-body">
                                        URG-X offers a full range of web development services, including front-end and back-end development,
                                        custom website design, e-commerce solutions, and CMS-based development. We use the latest technologies
                                        to deliver responsive and feature-rich websites.
                                    </div>
                                </div>
                                <div className="btn_box_in"></div>
                            </div>

                            <div className="accordion-item">
                                <h2 className="accordion-header" id="headingThree">
                                    <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse"
                                        data-bs-target="#collapseThree" aria-expanded="false" aria-controls="collapseThree">
                                        How do you ensure the security of cryptocurrency exchange platforms?
                                    </button>
                                </h2>
                                <div id="collapseThree" className="accordion-collapse collapse" aria-labelledby="headingThree"
                                    data-bs-parent="#accordionExample">
                                    <div className="accordion-body">
                                        We implement the latest security measures, including end-to-end encryption, two-factor authentication
                                        (2FA), regular audits, and secure APIs to protect user data and funds on your crypto exchange platform.
                                    </div>
                                </div>
                                <div className="btn_box_in"></div>
                            </div>

                            <div className="accordion-item">
                                <h2 className="accordion-header" id="headingFour">
                                    <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse"
                                        data-bs-target="#collapseFour" aria-expanded="false" aria-controls="collapseFour">
                                        What game development services does URG-X offer?
                                    </button>
                                </h2>
                                <div id="collapseFour" className="accordion-collapse collapse" aria-labelledby="headingFour"
                                    data-bs-parent="#accordionExample">
                                    <div className="accordion-body">
                                        URG-X specializes in game development for various platforms, including mobile apps, desktop, and
                                        web-based games. We offer end-to-end game development services, from ideation and design to development
                                        and deployment.
                                    </div>
                                </div>
                                <div className="btn_box_in"></div>
                            </div>

                            <div className="accordion-item">
                                <h2 className="accordion-header" id="headingFive">
                                    <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse"
                                        data-bs-target="#collapseFive" aria-expanded="false" aria-controls="collapseFive">
                                        How long does it take to develop a mobile app?
                                    </button>
                                </h2>
                                <div id="collapseFive" className="accordion-collapse collapse" aria-labelledby="headingFive"
                                    data-bs-parent="#accordionExample">
                                    <div className="accordion-body">
                                        The development timeline for a mobile app depends on its complexity. A simple app may take 2-4 weeks,
                                        while a more complex app with multiple features and integrations may take 4-8 weeks.
                                    </div>
                                </div>
                                <div className="btn_box_in"></div>
                            </div>

                            <div className="accordion-item">
                                <h2 className="accordion-header" id="headingSix">
                                    <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse"
                                        data-bs-target="#collapseSix" aria-expanded="false" aria-controls="collapseSix">
                                        What is blockchain development, and why is it important for my business?
                                    </button>
                                </h2>
                                <div id="collapseSix" className="accordion-collapse collapse" aria-labelledby="headingSix"
                                    data-bs-parent="#accordionExample">
                                    <div className="accordion-body">
                                        Blockchain development involves creating decentralized applications (dApps) that use blockchain
                                        technology. It offers transparency, security, and immutability, making it ideal for industries like
                                        finance, healthcare, and supply chain management.
                                    </div>
                                </div>
                                <div className="btn_box_in"></div>
                            </div>

                            <div className="accordion-item">
                                <h2 className="accordion-header" id="headingSeven">
                                    <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse"
                                        data-bs-target="#collapseSeven" aria-expanded="false" aria-controls="collapseSeven">
                                        How can I improve the user experience of my website or mobile app?
                                    </button>
                                </h2>
                                <div id="collapseSeven" className="accordion-collapse collapse" aria-labelledby="headingSeven"
                                    data-bs-parent="#accordionExample">
                                    <div className="accordion-body">
                                        Focus on clean design, fast loading times, easy navigation, and mobile responsiveness. Regular user
                                        testing and feedback can help enhance the user experience and ensure the product meets user
                                        expectations.
                                    </div>
                                </div>
                                <div className="btn_box_in"></div>
                            </div>

                            <div className="accordion-item">
                                <h2 className="accordion-header" id="headingEight">
                                    <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse"
                                        data-bs-target="#collapseEight" aria-expanded="false" aria-controls="collapseEight">
                                        Do you offer white-label solutions for crypto exchanges?
                                    </button>
                                </h2>
                                <div id="collapseEight" className="accordion-collapse collapse" aria-labelledby="headingEight"
                                    data-bs-parent="#accordionExample">
                                    <div className="accordion-body">
                                        Yes, URG-X provides customizable white-label solutions for crypto exchanges. You can launch your
                                        exchange platform quickly and with your branding while we handle the back-end development and technical
                                        support.
                                    </div>
                                </div>
                                <div className="btn_box_in"></div>
                            </div>

                            <div className="accordion-item">
                                <h2 className="accordion-header" id="headingNine">
                                    <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse"
                                        data-bs-target="#collapseNine" aria-expanded="false" aria-controls="collapseNine">
                                        Can URG-X help with SEO for my website or app?
                                    </button>
                                </h2>
                                <div id="collapseNine" className="accordion-collapse collapse" aria-labelledby="headingNine"
                                    data-bs-parent="#accordionExample">
                                    <div className="accordion-body">
                                        Yes, we provide SEO optimization services to ensure your website or app ranks higher on search engines.
                                        This helps increase organic traffic, user engagement, and ultimately, conversions.
                                    </div>
                                </div>
                                <div className="btn_box_in"></div>
                            </div>

                            <div className="accordion-item">
                                <h2 className="accordion-header" id="headingTen">
                                    <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse"
                                        data-bs-target="#collapseTen" aria-expanded="false" aria-controls="collapseTen">
                                        How does URG-X handle post-launch maintenance?
                                    </button>
                                </h2>
                                <div id="collapseTen" className="accordion-collapse collapse" aria-labelledby="headingTen"
                                    data-bs-parent="#accordionExample">
                                    <div className="accordion-body">
                                        We offer comprehensive post-launch maintenance services, including bug fixes, performance optimization,
                                        security updates, and regular feature enhancements to ensure the longevity of your product.
                                    </div>
                                </div>
                                <div className="btn_box_in"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </section> */}

        </>
    )
}

export default LaunchpadHome