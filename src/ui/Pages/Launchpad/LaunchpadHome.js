import { Link } from "react-router-dom"
import '../AnnouncmentManagement/Annoucement.css'
import LoaderHelper from "../../../customComponents/Loading/LoaderHelper";
import AuthService from "../../../api/services/AuthService";
import { alertErrorMessage } from "../../../customComponents/CustomAlertMessage";
import { useEffect, useState, useCallback } from "react";
import { ApiConfig } from "../../../api/apiConfig/apiConfig";
import { Helmet } from "react-helmet-async";

const getTokenIcon = (item) => {
    const base = item?.base_currency_id;
    const icon = base?.icon_path;
    if (!icon) return "/images/tether_icon.png";
    return icon?.startsWith("http") ? icon : `${ApiConfig?.baseImage}${icon}`;
};
const getTokenName = (item) => item?.base_currency_id?.name || item?.base_currency_id?.short_name || "Token";
const getTokenSymbol = (item) => item?.base_currency_id?.short_name || "N/A";
const getQuoteSymbol = (item) => item?.quote_currency_id?.short_name || "USDT";

const LaunchpadHome = () => {
    const [allLaunchpadList, setAllLaunchPadList] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
    const [filter, setFilter] = useState("live");
    const [durations, setDurations] = useState({});
    const [heroStats, setHeroStats] = useState({ totalRaised: 0, totalParticipants: 0, listedProjects: 0 });

    const fetchLaunchpads = useCallback(async (status, page = 1, append = false) => {
        LoaderHelper.loaderStatus(true);
        try {
            const apiStatus = status ? status.toUpperCase() : null;
            const result = await AuthService.userLaunchpadListing(apiStatus, page, 10);
            LoaderHelper.loaderStatus(false);

            if (result?.success) {
                const data = result?.data ?? [];
                const newData = Array.isArray(data) ? data : [];
                setAllLaunchPadList(prev => append ? [...prev, ...newData] : newData);
                if (result?.pagination) {
                    setPagination(result.pagination);
                }
                if (!status && Array.isArray(data) && data.length > 0) {
                    const totalRaised = data.reduce((a, i) => a + (parseFloat(i.totalRaised) || 0), 0);
                    const totalParticipants = data.reduce((a, i) => a + (i.participantsCount || 0), 0);
                    setHeroStats(prev => ({
                        ...prev,
                        totalRaised: prev.totalRaised || totalRaised,
                        totalParticipants: prev.totalParticipants || totalParticipants,
                        listedProjects: result.pagination?.total ?? data.length
                    }));
                }
            } else {
                setAllLaunchPadList([]);
                alertErrorMessage(result?.message || "Something went wrong while fetching launchpad data.");
            }
        } catch (err) {
            LoaderHelper.loaderStatus(false);
            alertErrorMessage("Error loading launchpad data.");
            setAllLaunchPadList([]);
        }
    }, []);

    useEffect(() => {
        fetchLaunchpads(filter);
    }, [filter, fetchLaunchpads]);

    useEffect(() => {
        const fetchHeroStats = async () => {
            try {
                const res = await AuthService.userLaunchpadListing(null, 1, 100);
                if (res?.success && Array.isArray(res?.data)) {
                    const data = res.data;
                    const totalRaised = data.reduce((a, i) => a + (parseFloat(i.totalRaised) || parseFloat(i.totalInvested) || 0), 0);
                    const totalParticipants = data.reduce((a, i) => a + (i.participantsCount || 0), 0);
                    setHeroStats({
                        totalRaised,
                        totalParticipants,
                        listedProjects: res.pagination?.total ?? data.length
                    });
                }
            } catch { /* silent */ }
        };
        fetchHeroStats();
    }, []);

    const filteredProjects = allLaunchpadList;

    useEffect(() => {
        if (allLaunchpadList.length > 0) {
            const interval = setInterval(() => {
                setDurations(() => {
                    const map = {};
                    allLaunchpadList.forEach((item) => {
                        const isLive = (item?.status || "").toLowerCase() === "live" || (item?.status || "").toUpperCase() === "LIVE";

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
                                hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
                                minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
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

    const handleFilterChange = (status) => {
        setFilter(status);
        fetchLaunchpads(status, 1);
    };

    return (
        <>
            <Helmet>
                <title>Token Launch Platform | Launchpad</title>
                <meta name="description" content="Join Launchpad – early-stage projects, exclusive token sales. Be first to new tokens." />
                <meta name="keywords" content="token sale platform, Web3 launchpad, early crypto investment, tokens" />
            </Helmet>

            <div className="launchpad_hero_s">
                <div className="container">
                    <div className="row">
                        <div className="col-sm-7">
                            <div className="cnt_banner">
                                <h1>Launchpad</h1>
                                <p>Your Easiest Way to Top Tokens — Early or at a Discount</p>

                                <ul className="launchpadlist">
                                    <li><span>Total Raised (USDT)</span>{heroStats.totalRaised?.toLocaleString(undefined, { maximumFractionDigits: 2 }) || "0"}</li>
                                    <li><span>Total Participants</span>{heroStats.totalParticipants?.toLocaleString() || "0"}</li>
                                    <li><span>Listed Projects</span>{heroStats.listedProjects || pagination.total || "0"}</li>
                                </ul>
                            </div>
                        </div>
                        <div className="col-sm-5">
                            <div className="hero_img">
                                <img src="/images/AnnouncementImg/launchpad_hero_img.png" alt="Launchpad" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <section className="project_coin">
                <div className="container">
                    <h2>Projects</h2>

                    <div className="filter_tabs">
                        <button className={`btn active ${filter === "live" ? "" : ""}`} onClick={() => handleFilterChange("live")}>Live</button>
                        <button className={`btn${filter === "upcoming" ? "" : ""}`} onClick={() => handleFilterChange("upcoming")}>Upcoming</button>
                        <button className={`btn${filter === "ended" ? "" : ""}`} onClick={() => handleFilterChange("ended")}>Ended</button>
                    </div>

                    <div className="table-responsive_tow">
                        <div className="coin_data_table">
                            {filteredProjects?.length > 0 ? (
                                filteredProjects.map((item) => (
                                    <div className="project_crypto_bl" key={item._id}>
                                        <div className="project_top">
                                            <div className="coin_lft">
                                                <div className="coin">
                                                    <img src={getTokenIcon(item)} alt={getTokenSymbol(item)} />
                                                </div>
                                                <div className="coin_cnt">
                                                    <div className="hd d-flex">
                                                        <h3>{getTokenSymbol(item)}</h3>
                                                        <ul className="subcate">
                                                            <li className={["ended", "cancelled"].includes((item?.status || "").toLowerCase()) ? "darkbg" : (item?.status || "").toLowerCase() === "live" ? "greendark" : (item?.status || "").toLowerCase() === "upcoming" ? "yellodark" : "darkbg"}>
                                                                <button>{(item?.status || "N/A")}</button>
                                                            </li>
                                                        </ul>
                                                    </div>
                                                    <span>{getTokenName(item)}</span>
                                                </div>
                                            </div>
                                            <div className="total_time_ri">
                                                <ul>
                                                    <li><span>Total Distribution</span> {(item?.tokensForSale || 0).toLocaleString()} {getTokenSymbol(item)}</li>
                                                    <li><span>End Time</span> {item?.endTime ? new Date(item.endTime).toLocaleString() : "-"}</li>
                                                </ul>
                                            </div>
                                        </div>

                                        <div className="d-flex subscribe_data_info">
                                            <div className="subscribe_user_bl">
                                                <div className="d-flex userinfo_top">
                                                    <div className="subscribe_user_lft">
                                                        <img src={item?.quote_currency_id?.icon_path ? (item.quote_currency_id.icon_path.startsWith("http") ? item.quote_currency_id.icon_path : `${ApiConfig?.baseImage}${item.quote_currency_id.icon_path}`) : "/images/tether_icon.png"} alt={getQuoteSymbol(item)} />
                                                        <div className="subscribe_cnt">
                                                            <h4>{getQuoteSymbol(item)}</h4>
                                                            <p>Commit {getQuoteSymbol(item)} to Subscribe {getTokenSymbol(item)}</p>
                                                        </div>
                                                    </div>
                                                    <div className="user_right">
                                                        <i className="ri-user-line"></i>{item?.participantsCount || 0}
                                                    </div>
                                                </div>

                                                <ul className="exclusivelist">
                                                    <li>Token Price <span className="text-yellow">1 {getTokenSymbol(item)} = {(item?.tokenPrice || 0).toLocaleString()} {getQuoteSymbol(item)}</span></li>
                                                    <li>Total Allocation <span>{(item?.tokensForSale || 0).toLocaleString()} {getTokenSymbol(item)}</span></li>
                                                    <li>Total Committed <span>{(item?.totalRaised || item?.totalInvested || 0).toLocaleString()} {getQuoteSymbol(item)}</span></li>
                                                </ul>
                                                <button className="viewdel_btn">
                                                    <Link to={`/launchpadCoin_Details/${item._id}`}>View Details</Link>
                                                </button>
                                            </div>
                                        </div>

                                        {/* {((item?.status || "").toLowerCase() === "live" || (item?.status || "").toUpperCase() === "LIVE") && (
                                            <ul className="duration_data">
                                                <li className="duration_box">
                                                    <div className="duration_label">Ends In</div>
                                                    <div className="countdown_timer">
                                                        {!durations[item._id] ? (
                                                            <div className="countdown_loading">Loading...</div>
                                                        ) : durations[item._id]?.isEnded ? (
                                                            <div className="countdown_ended">Ended</div>
                                                        ) : (
                                                            <>
                                                                <div className="countdown_item">
                                                                    <span className="countdown_value">{String(durations[item._id]?.days || 0).padStart(2, "0")}</span>
                                                                    <span className="countdown_label">Day</span>
                                                                </div>
                                                                <div className="countdown_separator">:</div>
                                                                <div className="countdown_item">
                                                                    <span className="countdown_value">{String(durations[item._id]?.hours || 0).padStart(2, "0")}</span>
                                                                    <span className="countdown_label">Hr</span>
                                                                </div>
                                                                <div className="countdown_separator">:</div>
                                                                <div className="countdown_item">
                                                                    <span className="countdown_value">{String(durations[item._id]?.minutes || 0).padStart(2, "0")}</span>
                                                                    <span className="countdown_label">Min</span>
                                                                </div>
                                                                <div className="countdown_separator">:</div>
                                                                <div className="countdown_item">
                                                                    <span className="countdown_value">{String(durations[item._id]?.seconds || 0).padStart(2, "0")}</span>
                                                                    <span className="countdown_label">Sec</span>
                                                                </div>
                                                            </>
                                                        )} 
                                                    </div>
                                                </li>
                                            </ul>
                                        )}*/}
                                    </div>
                                ))
                            ) : (
                                <>
                                    <div className="no_data_vector">
                                        <img src="/images/Group 1171275449 (1).svg" alt="no-data" />
                                    </div>
                                    <p className="text-center">No {filter.toLowerCase()} projects found.</p>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="viewmorebtn">
                        <a
                            href="#"
                            onClick={(e) => {
                                e.preventDefault();
                                if (pagination.totalPages > 1 && pagination.page < pagination.totalPages) {
                                    fetchLaunchpads(filter, pagination.page + 1, true);
                                }
                            }}
                        >
                            View More
                        </a>
                    </div>
                </div>
            </section>
        </>
    );
};

export default LaunchpadHome;
