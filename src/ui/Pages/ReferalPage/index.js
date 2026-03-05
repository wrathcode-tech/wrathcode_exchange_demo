import React, { useEffect, useState, useRef, useCallback } from "react";
import AuthService from "../../../api/services/AuthService";
import LoaderHelper from "../../../customComponents/Loading/LoaderHelper";
import { Helmet } from "react-helmet-async";
import { deployedUrl } from "../../../api/apiConfig/apiConfig";
import { alertSuccessMessage } from "../../../customComponents/CustomAlertMessage";
import { Link, useNavigate } from "react-router-dom";
import moment from "moment";

const ReferalPage = () => {
  const [refferlsData, setRefferalData] = useState({ user_code: "" });
  const [isCopied, setIsCopied] = useState(false);
  const token = localStorage.getItem("token");
  const navigate = useNavigate();
  
  const handleReffrals = useCallback(async () => {
    if (!token) return;
    LoaderHelper.loaderStatus(true);
    try {
      const result = await AuthService.refferlsList();
      if (result?.success) {
        setRefferalData(result?.data || { user_code: "" });
      }
    } catch (err) {
      console.error("Referral fetch error:", err);
    } finally {
      LoaderHelper.loaderStatus(false);
    }
  }, [token]);

  const copyToClipboard = useCallback((copyText) => {
    if (!copyText) return;
    navigator.clipboard.writeText(copyText).then(() => {
      setIsCopied(true);
      alertSuccessMessage("Copied!");
      setTimeout(() => setIsCopied(false), 2000);
    });
  }, []);

  useEffect(() => {
    handleReffrals();
  }, [handleReffrals]);

  const [refferalList, setRefferalList] = useState([]);
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState(null);

  const handleReferalList = useCallback(async () => {
    if (!token) return;
    setListLoading(true);
    setListError(null);
    try {
      const result = await AuthService.getReferList();
      if (result?.success && Array.isArray(result?.data)) {
        setRefferalList(result.data);
      } else {
        setRefferalList([]);
        setListError(result?.message || "Failed to load referral list");
      }
    } catch (err) {
      setRefferalList([]);
      setListError(err?.message || "Something went wrong");
    } finally {
      setListLoading(false);
    }
  }, [token]);

  useEffect(() => {
    handleReferalList();
  }, [handleReferalList]);

  const [searchTerm, setSearchTerm] = useState("");
  const [currentSlide, setCurrentSlide] = useState(0);
  const sliderContainerRef = useRef(null);
  const [slideOffset, setSlideOffset] = useState(0);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const referralEvents = [
    {
      title: "Earn Exciting Rewards!",
      description: "Invite friends to join and start earning benefits",
      image: "/images/earngift_vector.png"
    },
    {
      title: "Invite & Get Rewarded",
      description: "Unlock special bonuses with every successful referral",
      image: "/images/usdtearn_vector.png"
    },
    {
      title: "More Referrals, More Rewards",
      description: "Grow your network and enjoy bigger reward opportunities",
      image: "/images/earngift_vector.png"
    }
  ];


  const cardsPerSlide = isMobile ? 1 : 2;
  const totalSlides = Math.ceil(referralEvents.length / cardsPerSlide);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    // Reset slide when switching between mobile/desktop
    setCurrentSlide(0);
  }, [isMobile]);

  useEffect(() => {
    const calculateSlideOffset = () => {
      if (sliderContainerRef.current) {
        const containerWidth = sliderContainerRef.current.offsetWidth;
        if (isMobile) {
          // Mobile: 1 card per slide, card width is 100%, no gap needed
          setSlideOffset(100);
        } else {
          // Desktop: 2 cards per slide, card width is (100% - 24px) / 2, gap is 24px
          const slideDistance = (containerWidth - 24) / 2 + 24;
          setSlideOffset((slideDistance / containerWidth) * 100);
        }
      }
    };

    calculateSlideOffset();
    window.addEventListener('resize', calculateSlideOffset);
    return () => window.removeEventListener('resize', calculateSlideOffset);
  }, [isMobile]);

  const filteredList = (refferalList ?? []).filter((item) => {
    if (!searchTerm?.trim()) return true;
    const q = searchTerm.trim().toLowerCase();
    const maskedId = item?.masked_id ?? item?.uuid ?? "";
    const fullName = item?.full_name_masked ?? `${item?.firstName ?? ""} ${item?.lastName ?? ""}`.trim();
    return maskedId?.toLowerCase().includes(q) || fullName?.toLowerCase().includes(q);
  });

  const getDisplayName = (item) => {
    const name = item?.full_name_masked ?? `${item?.firstName ?? ""} ${item?.lastName ?? ""}`.trim();
    return name || "—";
  };
  const getDisplayId = (item) => item?.masked_id ?? item?.uuid ?? "—";
  const getJoinDate = (item) => {
    const d = item?.signup_date ?? item?.createdAt;
    return d ? moment(d).format("DD/MM/YYYY") : "—";
  };
  const getJoinDateTime = (item) => {
    const d = item?.signup_date ?? item?.createdAt;
    return d ? moment(d).format("DD/MM/YYYY hh:mm A") : "—";
  };
  const getKycStatus = (item) => {
    if (item?.kyc_status) return item.kyc_status;
    return item?.kycVerified === 2 ? "Verified" : "Not Verified";
  };
  const getKycStatusClass = (item) => {
    const status = getKycStatus(item);
    if (status?.toLowerCase().includes("verified") && !status?.toLowerCase().includes("not")) return "text-success";
    if (status?.toLowerCase().includes("submitted") || status?.toLowerCase().includes("pending")) return "text-warning";
    return "text-muted";
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);


  return (
    <>
      <Helmet>
        <title>Earn with Friends – Wrathcode Refer & Earn</title>

        <meta
          name="description"
          content="Turn your network into crypto earnings. Refer users to Wrathcode, and unlock trading credits and rewards when they complete KYC and deposit."
        />

        <meta
          name="keywords"
          content="crypto earn with friends, refer crypto Exchange, Wrathcode referral, invite earn crypto"
        />
      </Helmet>


      <div className="refrefer_earn_outer">

        <section className="pb-5 mt-3 ">
          <div className="container">
            <div className="card twofa_card">
              <div className="card-body" >
                <div className="row gx-5">
                  <div className="col-lg-6">
                    <div className="ref_col" >
                      <div className="card-header ref_header  ">
                        <h2 className="ref_title" >Exciting Referral Reward
                        </h2>
                        <h4>Invite your friends and earn amazing rewards!
                        </h4>
                        <h6>Get rewarded when they sign up and unlock additional bonuses after they complete verification.
                        </h6>
                      </div>
                      <div className="card-body_inner referral_code_s">
                        <div className="mt-0">
                          {token ?
                            <>
                              <ul>


                                <li><div><i className="ri-link-m"></i> Referral link: </div><span>{deployedUrl}signup?reffcode={refferlsData?.user_code || ""} <a href="#/" onClick={(e) => { e.preventDefault(); copyToClipboard(`${deployedUrl}signup?reffcode=${refferlsData?.user_code || ""}`); }}><i className="ri-checkbox-multiple-blank-line"></i></a></span></li>

                                <li><div><i className="ri-user-line"></i>Referral code: </div><span>{refferlsData?.user_code || "—"} <a href="#/" onClick={(e) => { e.preventDefault(); copyToClipboard(refferlsData?.user_code); }}><i className="ri-checkbox-multiple-blank-line"></i></a></span></li>
                              </ul>
                            </>
                            : ""}

                          <div className="field">
                            {token ?
                              <>

                                <div className="field__wrap  field-otp-box">

                                  <input className="field__input form-control" type="text" name="referral-code" value={refferlsData?.user_code ?? ""} readOnly />
                                  <button type="button" className="btn btn-xs custom-btn" onClick={() => copyToClipboard(`${refferlsData?.user_code}`)}><span> {isCopied ? 'Copied!' : 'Copy'} </span></button>

                                </div></>
                              : <div className="trade_btn mt-0 text-center w-100">
                                <button onClick={() => navigate("/login")}><Link to={`/login`}>Login now <span> <img src="images/trade_arrow.svg" alt="trade arrow" /></span></Link></button></div>}
                          </div>

                        </div>
                      </div>


                    </div>


                  </div>
                  <div className="col-lg-6">

                    <div className="refrefer_earn_vector">
                      <div className="slider_img">
                        <img src="/images/risingslider.png" className="img-fluid" alt="" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

      </div>

      <div className="how_to_refer_s">
        <div className="container">
          <h2>How to Refer and Earn Rewards</h2>

          <ul>
            <li>
              <img src="/images/invite_icon.svg" className="img-fluid" alt="invite" />
              <h6>Invite Friends to Join</h6>
              <p>
                Share your referral code and invite your friends to create an account and get started.
              </p>
            </li>

            <li>
              <img src="/images/invite_link.svg" className="img-fluid" alt="invite" />
              <h6>Instant Referral Linking</h6>
              <p>
                When your friends sign up using your referral, their account is automatically linked to you.
              </p>
            </li>

            <li>
              <img src="/images/rewards_icon.svg" className="img-fluid" alt="invite" />
              <h6>Earn Exciting Rewards</h6>
              <p>
                As your referrals stay active and trade, you receive attractive reward benefits automatically.
              </p>
            </li>
          </ul>


        </div>
      </div>


      <div className="how_to_refer_s">
        <div className="container">
          <h2>More Referral Events</h2>

          <div className="referral_events_slider_wrapper">
            <div className="referral_events_slider_container" ref={sliderContainerRef}>
              <div
                className="referral_events_slider"
                style={{ transform: `translateX(-${currentSlide * slideOffset}%)` }}
              >
                {referralEvents.map((event, index) => (
                  <div key={index} className="referral_event_item">
                    <div className="referral_event_item_content">
                      <h6>{event.title}</h6>
                      <p>{event.description}</p>
                      <button className="btn btn-primary" onClick={() => copyToClipboard(`${deployedUrl}signup?reffcode=${refferlsData?.user_code || ""}`)}>Invite Now</button>
                    </div>
                    <div className="referral_event_item_image">
                      <img src={event.image} className="img-fluid" alt="referral_event" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="referral_events_pagination">
              {Array.from({ length: totalSlides }).map((_, index) => (
                <button
                  key={index}
                  className={`referral_events_dot ${currentSlide === index ? 'active' : ''}`}
                  onClick={() => setCurrentSlide(index)}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </div>

        </div>
      </div>


      <div className="referral_recent_s">
        <div className="container">
          <div className="dashboard_recent_s">
            <div className="user_list_top referral_list_top">
              <div className="user_list_l earning_section_cate ">
                <h4>Referral History</h4>
              </div>
              <div className="user_search">
                <div className="searchBar custom-tabs">
                  <i className="ri-search-2-line"></i>
                  <input
                    type="search"
                    className="custom_search"
                    placeholder="Search by ID"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {listError && (
              <div className="alert alert-warning mb-3" role="alert">
                {listError}
              </div>
            )}

            {/* Desktop table */}
            <div className="table-responsive desktop_view2">
              {listLoading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status" />
                  <p className="mt-2 mb-0">Loading referral history...</p>
                </div>
              ) : filteredList?.length > 0 ? (
                <table>
                  <thead>
                    <tr>
                      <th>S.No</th>
                      <th>Name</th>
                      <th>Sign ID</th>
                      <th>KYC Status</th>
                      <th>Join Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredList.map((item, index) => (
                      <tr key={item?._id ?? item?.masked_id ?? index}>
                        <td>{index + 1}</td>
                        <td>{getDisplayName(item)}</td>
                        <td>{getDisplayId(item)}</td>
                        <td className={getKycStatusClass(item)}>{getKycStatus(item)}</td>
                        <td>{getJoinDate(item)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="no-data-wrapper">
                  <div className="no_data_vector">
                    <img src="/images/Group 1171275449 (1).svg" alt="no-data" className="img-fluid" />
                  </div>
                  <p className="mt-2 mb-0">No referrals yet. Share your link to get started!</p>
                </div>
              )}
            </div>

            {/* Mobile table */}
            <div className="order_history_mobile_view">
              <div className="coin_right d-flex flex-row justify-content-between align-items-center p-0 mb-3">
                <h5>Referral History</h5>
                <div className="searchBar custom-tabs">
                  <i className="ri-search-2-line"></i>
                  <input
                    type="search"
                    className="custom_search"
                    placeholder="Search by ID"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="d-flex flex-column gap-2">
                {listLoading ? (
                  <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status" style={{ width: "1.5rem", height: "1.5rem" }} />
                    <p className="mt-2 mb-0 small">Loading...</p>
                  </div>
                ) : filteredList?.length > 0 ? (
                  filteredList.map((item, index) => (
                    <div key={item?._id ?? item?.masked_id ?? index} className="order_datalist">
                      <ul className="listdata">
                        <li>
                          <span className="date">Name</span>
                          <span className="date_light">{getDisplayName(item)}</span>
                        </li>
                        <li>
                          <span>Referral ID</span>
                          <span>{getDisplayId(item)}</span>
                        </li>
                        <li>
                          <span>KYC Status</span>
                          <span className={getKycStatusClass(item)}>{getKycStatus(item)}</span>
                        </li>
                        <li>
                          <span>Join Date</span>
                          <span>{getJoinDateTime(item)}</span>
                        </li>
                      </ul>
                    </div>
                  ))
                ) : (
                  <div className="no-data-wrapper w-100">
                    <div className="no_data_vector">
                      <img src="/images/Group 1171275449 (1).svg" alt="no-data" className="img-fluid" width={96} height={96} />
                      <p className="mt-2 mb-0 small">No referrals yet</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

    </>
  );
};

export default ReferalPage;
