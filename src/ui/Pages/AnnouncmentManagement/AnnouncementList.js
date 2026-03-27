import React, { useEffect, useState } from 'react'
import '../AnnouncmentManagement/Annoucement.css'
import { Link, useNavigate, useParams } from 'react-router-dom'
import LoaderHelper from '../../../customComponents/Loading/LoaderHelper';
import AuthService from '../../../api/services/AuthService';
import { alertErrorMessage } from '../../../customComponents/CustomAlertMessage';
import moment from 'moment';

function AnnouncementList() {
    const navigate = useNavigate();
    const [announcementList, setAnnouncementList] = useState([]);
    const [categoryList, setCategoryList] = useState([]);
    const { announce_title_id, title } = useParams()
    const readableTitle = title?.replace(/_/g, " ");

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);
    
    useEffect(() => {
        if (announce_title_id) {
            handleAnnounceList(readableTitle, announce_title_id);

        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [announce_title_id]);

    const handleAnnounceList = async (readableTitle, announce_title_id) => {
        console.log(readableTitle, announce_title_id);

        navigate(`/announcement_list/${readableTitle}/${announce_title_id}`)
        LoaderHelper.loaderStatus(true);
        try {
            if (!announce_title_id) {
                LoaderHelper.loaderStatus(false);
                return;
            }
            const result = await AuthService.getAnnouncementList(announce_title_id);
            LoaderHelper.loaderStatus(false);
            if (result?.success) {
                setAnnouncementList(result?.data?.reverse());
            } else {
                alertErrorMessage("Something went wrong while fetching announcement categories.");
            }
        } catch (err) {
            LoaderHelper.loaderStatus(false);
            alertErrorMessage("Error loading announcement categories.");
        }
    };

    useEffect(() => {
        handleCategoryAnnouncement();
    }, []);

    const handleCategoryAnnouncement = async () => {
        LoaderHelper.loaderStatus(true);
        try {
            const result = await AuthService.getAnnouncementCategoryList();
            LoaderHelper.loaderStatus(false);
            if (result?.success) {
                setCategoryList(result?.data);
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

            <section className="announcement_section single_announcement">
                <div className="container">
                    <h1>
                        <img
                            src="/images/AnnouncementImg/back_btn.png"
                            alt="back btn"
                            style={{ cursor: "pointer", marginRight: "10px" }}
                            onClick={() => navigate("/announcement")} // 👈 goes back to previous page
                        />
                        Announcement Details
                    </h1>

                    <div className="d-flex justify-content-between align-items-center mt-4">

                        <ul className="nav nav-tabs announcement_tabs" id="announcementTabs" >
                            {categoryList?.map((item, index) => {
                                const formattedTitle = item?.title
                                    ?.trim()
                                    ?.replace(/\s+/g, "_")        // space -> underscore
                                    ?.slice(0, 50)                // limit to 50 chars
                                    ?.replace(/_+$/, "");         // remove trailing underscores

                                return (
                                    <li className="nav-item" role="presentation">
                                        <button className={`nav-link ${item?.title === readableTitle ? "active" : ""}`} id={item?.id} onClick={() => handleAnnounceList(formattedTitle, item?._id)}>
                                            {item?.title}
                                        </button>
                                    </li>
                                )
                            })}
                            {/* <li className="nav-item" >
                                <button className="nav-link active" id="crypto-tab" >
                                    <img src="/images/AnnouncementImg/bitcoin_icon.png" alt="bitcoin" />New Crypto Listings
                                </button>
                            </li>

                            <li className="nav-item">
                                <button className="nav-link" id="news-tab" >
                                    <img src="/images/AnnouncementImg/news_icon.png" alt="Latest News" />Latest News
                                </button>
                            </li>

                            <li className="nav-item" role="presentation">
                                <button className="nav-link" id="activities-tab" >
                                    <img src="/images/AnnouncementImg/activities_icon.png" alt="Latest Activities" />Latest Activities
                                </button>
                            </li>

                            <li className="nav-item" role="presentation">
                                <button className="nav-link">
                                    <img src="/images/AnnouncementImg/fiat_listings_icon.png" alt="New Fiat Listings" />New Fiat Listings
                                </button>
                            </li>

                            <li className="nav-item" role="presentation">
                                <button className="nav-link" id="api-tab" d>
                                    <img src="/images/AnnouncementImg/api_icon.png" alt="API Updates" />API Updates
                                </button>
                            </li> */}
                        </ul>

                        {/* 
                        <div className="search_info">
                            <button><img src="/images/AnnouncementImg/search_icon.png" alt="search" /></button>
                            <input type="text" placeholder="Search" />
                        </div> */}
                    </div>


                    <div className="tab-content announcement_content" id="announcementTabsContent">

                        <div className="tab-pane fade show active" id="crypto" role="tabpanel" aria-labelledby="crypto-tab">
                            <h3 className="text-white">{readableTitle}</h3>

                            <div className="crypto_listing_cnt">
                                {announcementList && announcementList.length > 0 ? (
                                    announcementList.map((announcement) => {
                                        const formattedTitle = announcement?.title
                                            ?.trim()
                                            ?.replace(/\s+/g, "_") // replace spaces with underscores
                                            ?.slice(0, 50) // limit to 50 characters
                                            ?.replace(/_+$/, ""); // remove trailing underscores

                                        return (
                                            <div className="block_listing" key={announcement?._id}>
                                                <h5>
                                                    <Link to={`/announcement_details/${formattedTitle}/${announcement?._id}`}>
                                                        {announcement?.title}
                                                    </Link>
                                                </h5>
                                                <span className="small">
                                                    {moment(announcement.createdAt).format("DD-MM-YYYY")}
                                                </span>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="text-center">
                                        <img src="/images/no_data_vector.svg" className="img-fluid dark_img" width={96} height={96} alt="No data" />
                                        <img src="/images/no_data_vector_light.png" className="img-fluid light_img" width={96} height={96} alt="No data" />
                                        <p>No announcements found.</p>
                                    </div>
                                )}
                            </div>

                            {/* 
                            <nav className="pagination">
                                <ul className="justify-content-center">
                                    <li className="page-item disabled"><a className="page-link" href="#" tabIndex="-1" ariaDisabled="true">
                                    </a>
                                    </li>
                                    <li className="page-item active"><a className="page-link" href="#">1</a></li>
                                    <li className="page-item"><a className="page-link" href="#">2</a></li>
                                    <li className="page-item"><a className="page-link" href="#">3</a></li>
                                    <li className="page-item"><a className="page-link" href="#">4</a></li>
                                </ul>
                            </nav> */}

                        </div>

                        <div className="tab-pane fade" id="news" role="tabpanel" aria-labelledby="news-tab">
                            <h3 className="text-white">Latest News</h3>

                            <div className="crypto_listing_cnt">
                                <div className="block_listing">
                                    <h5>Introducing Unifi Protocol DAO (UNFI) on Wrathcode Exchange Launchpool! Farm UNFI By Staking
                                        BNB, BUSD & ETH Tokens</h5>
                                    <span className="small">2020-11-13</span>
                                </div>
                                <div className="block_listing">
                                    <h5>Cross Margin Trading for AAVE Enabled on Binance</h5>
                                    <span className="small">2020-11-13</span>
                                </div>
                                <div className="block_listing">
                                    <h5>AXS, CTK, EUR, LOOM & UTK Enabled on Wrathcode Exchange Isolated Margin</h5>
                                    <span className="small">2020-11-13</span>
                                </div>
                                <div className="block_listing">
                                    <h5>Wrathcode Exchange Futures Will Launch CVC USDT-Margined Perpetual Contract With Up to
                                        50x Leverage</h5>
                                    <span className="small">2020-11-13</span>
                                </div>
                                <div className="block_listing">
                                    <h5>CVC, DNT, ALPHA & INJ Enabled on Wrathcode Exchange Isolated Margin</h5>
                                    <span className="small">2020-11-13</span>
                                </div>
                                <div className="block_listing">
                                    <h5>Wrathcode Exchange Will List Axie Infinity's Small Love Potion (SLP) in the Innovation Zone</h5>
                                    <span className="small">2020-11-13</span>
                                </div>
                                <div className="block_listing">
                                    <h5>Wrathcode Exchange Adds DNT/BUSD, DNT/USDT, ADA/EUR & LTC/NGN Trading Pairs</h5>
                                    <span className="small">2020-11-13</span>
                                </div>
                                <div className="block_listing">
                                    <h5>Notice of Removal of Trading Pairs - 2020/11/10</h5>
                                    <span className="small">2020-11-13</span>
                                </div>
                                <div className="block_listing">
                                    <h5>Wrathcode Exchange Lists renBTC (RENBTC)</h5>
                                    <span className="small">2020-11-13</span>
                                </div>
                                <div className="block_listing">
                                    <h5>Wrathcode Exchange Adds BNB/BRL & LTC/EUR Trading Pairs</h5>
                                    <span className="small">2020-11-13</span>
                                </div>
                            </div>

                            <nav className="pagination">
                                <ul className="justify-content-center">
                                    <li className="page-item disabled"><a className="page-link" href="#" tabIndex="-1" ariaDisabled="true">
                                    </a>
                                    </li>
                                    <li className="page-item active"><a className="page-link" href="#">1</a></li>
                                    <li className="page-item"><a className="page-link" href="#">2</a></li>
                                    <li className="page-item"><a className="page-link" href="#">3</a></li>
                                    <li className="page-item"><a className="page-link" href="#">4</a></li>
                                </ul>
                            </nav>

                        </div>

                        <div className="tab-pane fade" id="activities" role="tabpanel" aria-labelledby="activities-tab">
                            <h3 className="text-white">Latest Activities</h3>

                            <div className="crypto_listing_cnt">
                                <div className="block_listing">
                                    <h5>Introducing Unifi Protocol DAO (UNFI) on Wrathcode Exchange Launchpool! Farm UNFI By Staking
                                        BNB, BUSD & ETH Tokens</h5>
                                    <span className="small">2020-11-13</span>
                                </div>
                                <div className="block_listing">
                                    <h5>Cross Margin Trading for AAVE Enabled on Binance</h5>
                                    <span className="small">2020-11-13</span>
                                </div>
                                <div className="block_listing">
                                    <h5>AXS, CTK, EUR, LOOM & UTK Enabled on Wrathcode Exchange Isolated Margin</h5>
                                    <span className="small">2020-11-13</span>
                                </div>
                                <div className="block_listing">
                                    <h5>Wrathcode Exchange Futures Will Launch CVC USDT-Margined Perpetual Contract With Up to
                                        50x Leverage</h5>
                                    <span className="small">2020-11-13</span>
                                </div>
                                <div className="block_listing">
                                    <h5>CVC, DNT, ALPHA & INJ Enabled on Wrathcode Exchange Isolated Margin</h5>
                                    <span className="small">2020-11-13</span>
                                </div>
                                <div className="block_listing">
                                    <h5>Wrathcode Exchange Will List Axie Infinity's Small Love Potion (SLP) in the Innovation Zone</h5>
                                    <span className="small">2020-11-13</span>
                                </div>
                                <div className="block_listing">
                                    <h5>Wrathcode Exchange Adds DNT/BUSD, DNT/USDT, ADA/EUR & LTC/NGN Trading Pairs</h5>
                                    <span className="small">2020-11-13</span>
                                </div>
                                <div className="block_listing">
                                    <h5>Notice of Removal of Trading Pairs - 2020/11/10</h5>
                                    <span className="small">2020-11-13</span>
                                </div>
                                <div className="block_listing">
                                    <h5>Wrathcode Exchange Lists renBTC (RENBTC)</h5>
                                    <span className="small">2020-11-13</span>
                                </div>
                                <div className="block_listing">
                                    <h5>Wrathcode Exchange Adds BNB/BRL & LTC/EUR Trading Pairs</h5>
                                    <span className="small">2020-11-13</span>
                                </div>
                            </div>

                            <nav className="pagination">
                                <ul className="justify-content-center">
                                    <li className="page-item disabled"><a className="page-link" href="#" tabIndex="-1" ariaDisabled="true">
                                    </a>
                                    </li>
                                    <li className="page-item active"><a className="page-link" href="#">1</a></li>
                                    <li className="page-item"><a className="page-link" href="#">2</a></li>
                                    <li className="page-item"><a className="page-link" href="#">3</a></li>
                                    <li className="page-item"><a className="page-link" href="#">4</a></li>
                                </ul>
                            </nav>

                        </div>

                        <div className="tab-pane fade" id="fiat" role="tabpanel" aria-labelledby="fiat-tab">
                            <h3 className="text-white">New Fiat Listings</h3>

                            <div className="crypto_listing_cnt">
                                <div className="block_listing">
                                    <h5>Introducing Unifi Protocol DAO (UNFI) on Wrathcode Exchange Launchpool! Farm UNFI By Staking
                                        BNB, BUSD & ETH Tokens</h5>
                                    <span className="small">2020-11-13</span>
                                </div>
                                <div className="block_listing">
                                    <h5>Cross Margin Trading for AAVE Enabled on Binance</h5>
                                    <span className="small">2020-11-13</span>
                                </div>
                                <div className="block_listing">
                                    <h5>AXS, CTK, EUR, LOOM & UTK Enabled on Wrathcode Exchange Isolated Margin</h5>
                                    <span className="small">2020-11-13</span>
                                </div>
                                <div className="block_listing">
                                    <h5>Wrathcode Exchange Futures Will Launch CVC USDT-Margined Perpetual Contract With Up to
                                        50x Leverage</h5>
                                    <span className="small">2020-11-13</span>
                                </div>
                                <div className="block_listing">
                                    <h5>CVC, DNT, ALPHA & INJ Enabled on Wrathcode Exchange Isolated Margin</h5>
                                    <span className="small">2020-11-13</span>
                                </div>
                                <div className="block_listing">
                                    <h5>Wrathcode Exchange Will List Axie Infinity's Small Love Potion (SLP) in the Innovation Zone</h5>
                                    <span className="small">2020-11-13</span>
                                </div>
                                <div className="block_listing">
                                    <h5>Wrathcode Exchange Adds DNT/BUSD, DNT/USDT, ADA/EUR & LTC/NGN Trading Pairs</h5>
                                    <span className="small">2020-11-13</span>
                                </div>
                                <div className="block_listing">
                                    <h5>Notice of Removal of Trading Pairs - 2020/11/10</h5>
                                    <span className="small">2020-11-13</span>
                                </div>
                                <div className="block_listing">
                                    <h5>Wrathcode Exchange Lists renBTC (RENBTC)</h5>
                                    <span className="small">2020-11-13</span>
                                </div>
                                <div className="block_listing">
                                    <h5>Wrathcode Exchange Adds BNB/BRL & LTC/EUR Trading Pairs</h5>
                                    <span className="small">2020-11-13</span>
                                </div>
                            </div>

                            <nav className="pagination">
                                <ul className="justify-content-center">
                                    <li className="page-item disabled"><a className="page-link" href="#" tabIndex="-1" ariaDisabled="true">
                                    </a>
                                    </li>
                                    <li className="page-item active"><a className="page-link" href="#">1</a></li>
                                    <li className="page-item"><a className="page-link" href="#">2</a></li>
                                    <li className="page-item"><a className="page-link" href="#">3</a></li>
                                    <li className="page-item"><a className="page-link" href="#">4</a></li>
                                </ul>
                            </nav>

                        </div>

                        <div className="tab-pane fade" id="api" role="tabpanel" aria-labelledby="api-tab">
                            <h3 className="text-white">API Updates</h3>

                            <div className="crypto_listing_cnt">
                                <div className="block_listing">
                                    <h5>Introducing Unifi Protocol DAO (UNFI) on Wrathcode Exchange Launchpool! Farm UNFI By Staking
                                        BNB, BUSD & ETH Tokens</h5>
                                    <span className="small">2020-11-13</span>
                                </div>
                                <div className="block_listing">
                                    <h5>Cross Margin Trading for AAVE Enabled on Binance</h5>
                                    <span className="small">2020-11-13</span>
                                </div>
                                <div className="block_listing">
                                    <h5>AXS, CTK, EUR, LOOM & UTK Enabled on Wrathcode Exchange Isolated Margin</h5>
                                    <span className="small">2020-11-13</span>
                                </div>
                                <div className="block_listing">
                                    <h5>Wrathcode Exchange Futures Will Launch CVC USDT-Margined Perpetual Contract With Up to
                                        50x Leverage</h5>
                                    <span className="small">2020-11-13</span>
                                </div>
                                <div className="block_listing">
                                    <h5>CVC, DNT, ALPHA & INJ Enabled on Wrathcode Exchange Isolated Margin</h5>
                                    <span className="small">2020-11-13</span>
                                </div>
                                <div className="block_listing">
                                    <h5>Wrathcode Exchange Will List Axie Infinity's Small Love Potion (SLP) in the Innovation Zone</h5>
                                    <span className="small">2020-11-13</span>
                                </div>
                                <div className="block_listing">
                                    <h5>Wrathcode Exchange Adds DNT/BUSD, DNT/USDT, ADA/EUR & LTC/NGN Trading Pairs</h5>
                                    <span className="small">2020-11-13</span>
                                </div>
                                <div className="block_listing">
                                    <h5>Notice of Removal of Trading Pairs - 2020/11/10</h5>
                                    <span className="small">2020-11-13</span>
                                </div>
                                <div className="block_listing">
                                    <h5>Wrathcode Exchange Lists renBTC (RENBTC)</h5>
                                    <span className="small">2020-11-13</span>
                                </div>
                                <div className="block_listing">
                                    <h5>Wrathcode Exchange Adds BNB/BRL & LTC/EUR Trading Pairs</h5>
                                    <span className="small">2020-11-13</span>
                                </div>
                            </div>

                            <nav className="pagination">
                                <ul className="justify-content-center">
                                    <li className="page-item disabled"><a className="page-link" href="#" tabIndex="-1" ariaDisabled="true">
                                    </a>
                                    </li>
                                    <li className="page-item active"><a className="page-link" href="#">1</a></li>
                                    <li className="page-item"><a className="page-link" href="#">2</a></li>
                                    <li className="page-item"><a className="page-link" href="#">3</a></li>
                                    <li className="page-item"><a className="page-link" href="#">4</a></li>
                                </ul>
                            </nav>


                        </div>

                    </div>

                </div>




            </section>
        </>
    )
}

export default AnnouncementList