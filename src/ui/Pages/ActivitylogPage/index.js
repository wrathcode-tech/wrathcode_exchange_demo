import React, { useState, useEffect, useCallback, useRef } from "react";
import moment from "moment";
import LoaderHelper from "../../../customComponents/Loading/LoaderHelper";
import AuthService from "../../../api/services/AuthService";
import { alertErrorMessage, alertWarningMessage } from "../../../customComponents/CustomAlertMessage";

const ActivitylogPage = () => {
  const isMountedRef = useRef(true);

  // State declarations
  const [activity, setActivity] = useState([]);
  const [activityLength, setActivityLength] = useState(0);
  const [skip, setSkip] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const limit = 10;

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Fetch activity logs
  const activityLogs = useCallback(async (skipValue) => {
    if (isLoading) return;

    try {
      setIsLoading(true);
      LoaderHelper.loaderStatus(true);

      const result = await AuthService.getActivityLogs(skipValue, limit);

      if (!isMountedRef.current) return;

      if (result?.success) {
        if (result?.data?.length > 0) {
          setSkip(skipValue);
          setActivityLength(result?.total_count || 0);
          setActivity(result?.data || []);
        } else if (skipValue !== 0) {
          alertWarningMessage("No more data found");
        } else {
          setActivity([]);
          setActivityLength(0);
        }
      } else {
        alertErrorMessage(result?.message || "Failed to fetch activity logs");
      }
    } catch (error) {
      console.error("Failed to fetch activity logs:", error);
      if (isMountedRef.current) {
        alertErrorMessage("Failed to fetch activity logs. Please try again.");
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
        LoaderHelper.loaderStatus(false);
      }
    }
  }, [isLoading]);

  // Pagination handler
  const handlePagination = useCallback((action) => {
    switch (action) {
      case "prev":
        if (skip - limit >= 0) {
          activityLogs(skip - limit);
        }
        break;
      case "next":
        if (skip + limit < activityLength) {
          activityLogs(skip + limit);
        }
        break;
      case "first":
        if (skip !== 0) {
          activityLogs(0);
        }
        break;
      case "last":
        if (activityLength > limit) {
          const lastPageSkip = Math.floor((activityLength - 1) / limit) * limit;
          if (skip !== lastPageSkip) {
            activityLogs(lastPageSkip);
          }
        }
        break;
      default:
        break;
    }
  }, [skip, activityLength, activityLogs]);

  // Initial load
  useEffect(() => {
    activityLogs(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Format activity status for display
  const formatActivityStatus = (status) => {
    if (!status) return "Unknown Activity";
    return status;
  };

  // Get status color class
  const getStatusClass = (activity) => {
    const activityLower = activity?.toLowerCase() || "";
    if (activityLower.includes("login") || activityLower.includes("success")) {
      return "text-success";
    }
    if (activityLower.includes("failed") || activityLower.includes("error")) {
      return "text-danger";
    }
    if (activityLower.includes("logout") || activityLower.includes("change")) {
      return "text-warning";
    }
    return "text-activity   ";
  };

  // Render pagination info
  const renderPaginationInfo = () => {
    if (activityLength === 0) return null;
    const start = skip + 1;
    const end = Math.min(skip + limit, activityLength);
    return `${start}-${end} of ${activityLength}`;
  };

  useEffect(() => {
    window.scrollTo(0, 0);
 }, []);

  return (
    <div className="dashboard_right">
      <div className="dashboard_listing_section Overview_mid">
        <div className="kyc_approval_s activity_logs">
          <div className="cnt">
            <h3>Activity Logs</h3>
            <p>Your Activity Logs display for all Activity</p>

            {/* Desktop View */}
            <div className="dashboard_summary desktop_view2">
              <table>
                <thead>
                  <tr>
                    <th>Activity</th>
                    <th>IP Address</th>
                    <th className="right_td">Date & Time</th>
                  </tr>
                </thead>
                <tbody>
                  {activity?.length > 0 ? (
                    activity.map((item, index) => (
                      <tr key={item?._id || index}>
                        <td>
                          <div className="price_heading">
                            <strong className={getStatusClass(item?.Activity)}>
                              {formatActivityStatus(item?.Activity)}
                            </strong>
                          </div>
                        </td>
                        <td>
                          <span>{item?.IP || "N/A"}</span>
                        </td>
                        <td className="right_td">
                          {item?.date
                            ? moment(item.date).format("MMM Do YYYY, h:mm:ss A")
                            : "N/A"}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr className="no-data-row">
                      <td colSpan="3">
                        <div className="no_data_outer">
                          <div className="no_data_vector">
                            <img
                              src="/images/Group 1171275449 (1).svg"
                              alt="no-data"
                            />
                          </div>
                          <p>No Data Available</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* Pagination */}
              {activity?.length > 0 && (
                <div className="hVPalX gap-2">
                  <span>{renderPaginationInfo()}</span>
                  <div className="sc-eAKtBH gVtWSU">
                    <button
                      type="button"
                      aria-label="First Page"
                      className="sc-gjLLEI kuPCgf"
                      onClick={() => handlePagination("first")}
                      disabled={skip === 0}
                    >
                   <i className="ri-skip-back-fill text-white"></i>
                    </button>
                    <button
                      type="button"
                      aria-label="Previous Page"
                      className="sc-gjLLEI kuPCgf"
                      onClick={() => handlePagination("prev")}
                      disabled={skip === 0}
                    >
                      <i className="ri-arrow-left-s-line text-white"></i>
                    </button>
                    <button
                      type="button"
                      aria-label="Next Page"
                      className="sc-gjLLEI kuPCgf"
                      onClick={() => handlePagination("next")}
                      disabled={skip + limit >= activityLength}
                    >
                       <i className="ri-arrow-right-s-line text-white"></i>
                    </button>
                    <button
                      type="button"
                      aria-label="Last Page"
                      className="sc-gjLLEI kuPCgf"
                      onClick={() => handlePagination("last")}
                      disabled={skip + limit >= activityLength}
                    >
                       <i className="ri-skip-forward-fill text-white"></i>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile View */}
            <div className="order_history_mobile_view">
              {activity?.length > 0 ? (
                activity.map((item, index) => (
                  <div className="d-flex mb-3" key={item?._id || index}>
                    <div className="order_datalist order_datalist_2">
                      <ul className="listdata">
                        <li>
                          <span className="date">Activity</span>
                          <span className={`date_light ${getStatusClass(item?.Activity)}`}>
                            {formatActivityStatus(item?.Activity)}
                          </span>
                        </li>
                        <li>
                          <span>Date & Time</span>
                          <span>
                            {item?.date
                              ? moment(item.date).format("DD/MM/YYYY, h:mm A")
                              : "N/A"}
                          </span>
                        </li>
                        <li>
                          <span>IP Address</span>
                          <span>{item?.IP || "N/A"}</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-data-wrapper text-center py-4">
                  <div className="no_data_vector">
                    <img
                      src="/images/Group 1171275449 (1).svg"
                      alt="no-data"
                    />
                  </div>
                  <p>No Data Available</p>
                </div>
              )}

              {/* Mobile Pagination */}
              {activity?.length > 0 && (
                <div className="hVPalX gap-2 mt-3">
                  <span>{renderPaginationInfo()}</span>
                  <div className="sc-eAKtBH gVtWSU">
                    <button
                      type="button"
                      aria-label="First Page"
                      className="sc-gjLLEI kuPCgf"
                      onClick={() => handlePagination("first")}
                      disabled={skip === 0}
                    >
                      <i className="ri-skip-back-fill text-white"></i>
                    </button>
                    <button
                      type="button"
                      aria-label="Previous Page"
                      className="sc-gjLLEI kuPCgf"
                      onClick={() => handlePagination("prev")}
                      disabled={skip === 0}
                    >
                      <i className="ri-arrow-left-s-line text-white"></i>
                    </button>
                    <button
                      type="button"
                      aria-label="Next Page"
                      className="sc-gjLLEI kuPCgf"
                      onClick={() => handlePagination("next")}
                      disabled={skip + limit >= activityLength}
                    >
                      <i className="ri-arrow-right-s-line text-white"></i>
                    </button>
                    <button
                      type="button"
                      aria-label="Last Page"
                      className="sc-gjLLEI kuPCgf"
                      onClick={() => handlePagination("last")}
                      disabled={skip + limit >= activityLength}
                    >
                      <i className="ri-skip-forward-fill text-white"></i>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivitylogPage;
