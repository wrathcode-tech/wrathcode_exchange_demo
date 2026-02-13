import React, { useState, useEffect, useRef, useContext, useCallback, useMemo } from "react";
import LoaderHelper from "../../../customComponents/Loading/LoaderHelper";
import AuthService from "../../../api/services/AuthService";
import { alertErrorMessage, alertSuccessMessage } from "../../../customComponents/CustomAlertMessage";
import { ProfileContext } from "../../../context/ProfileProvider";
import copy from "copy-to-clipboard";
import moment from "moment";

const SupportPage = () => {

    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);
    const { userDetails } = useContext(ProfileContext);

    const [subject, setSubject] = useState("");
    const [message, setMessage] = useState("");
    const [myfile, setMyfile] = useState(null);
    const [issueList, setIssueList] = useState([]);
    const [messageQuery, setMessageQuery] = useState([]);
    const [ticketId, setTicketId] = useState("");
    const [selectedTicketId, setSelectedTicketId] = useState("");
    const [ selectedSubject, setSelectedSubject] = useState("");
    const [ selectedCreatedAt, setSelectedCreatedAt] = useState("");
    const [selectedDescription, setSelectedDescription] = useState("");
    const [messageReply, setMessageReply] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [status, setStatus] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [category, setCategory] = useState("");
    const [priority, setPriority] = useState("medium");
    const [categories, setCategories] = useState([]);
    const [priorities, setPriorities] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState("");
    const [selectedPriority, setSelectedPriority] = useState("");

    const resetInputChange = useCallback(() => {
        setSubject("");
        setMessage("");
        setMyfile(null);
        setCategory("");
        setPriority("medium");
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    }, []);

    // Fetch ticket categories and priorities
    const getTicketCategories = useCallback(async () => {
        try {
            const result = await AuthService.getTicketCategories();
            if (result?.success) {
                setCategories(result?.data?.categories || []);
                setPriorities(result?.data?.priorities || []);
            }
        } catch (error) {
            console.error("Failed to fetch categories:", error);
        }
    }, []);
    
    useEffect(() => {
        window.scrollTo(0, 0);
     }, []);

    useEffect(() => {
        getTicketCategories();
    }, [getTicketCategories]);

    const handleChangeImage = useCallback((event) => {
        event.preventDefault();
        const file = event.target.files?.[0];
        if (!file) return;

        const allowedTypes = ["image/png", "image/jpeg", "image/jpg"];
        const maxSize = 5 * 1024 * 1024; // 5MB

        if (!allowedTypes.includes(file.type)) {
            alertErrorMessage("Only PNG, JPEG, and JPG file types are allowed.");
            event.target.value = "";
            return;
        }

        if (file.size > maxSize) {
            alertErrorMessage("Max image size is 5MB.");
            event.target.value = "";
            return;
        }

        setMyfile(file);
        alertSuccessMessage(`File selected: ${file.name}`);
    }, []);

    const getIssueList = useCallback(async (ticketIdToSelect) => {
        try {
            LoaderHelper.loaderStatus(true);
            setMessageQuery([]);

            const result = await AuthService.getUserTickets();

            if (result?.success) {
                const data = Array.isArray(result?.data) ? [...result.data].reverse() : [];
                setIssueList(data);

                if (ticketIdToSelect) {
                    const filteredData = data.find((item) => item?._id === ticketIdToSelect);
                    if (filteredData) {
                        setMessageQuery(Array.isArray(filteredData?.ticket) ? filteredData.ticket : []);
                        setStatus(filteredData?.status || "");
                    }
                }
            } else {
                alertErrorMessage(result?.message || "Failed to fetch tickets");
            }
        } catch (error) {
            alertErrorMessage(error?.message || "An error occurred while fetching tickets");
        } finally {
            LoaderHelper.loaderStatus(false);
        }
    }, []);

    useEffect(() => {
        getIssueList();
    }, [getIssueList]);

    const handleSupport = useCallback(async (e) => {
        e?.preventDefault();

        if (isSubmitting) return;

        // Validation
        if (!subject?.trim()) {
            alertErrorMessage("Please enter a subject");
            return;
        }

        if (!category) {
            alertErrorMessage("Please select a category");
            return;
        }

        if (!message?.trim()) {
            alertErrorMessage("Please enter a description");
            return;
        }

        try {
            setIsSubmitting(true);
            LoaderHelper.loaderStatus(true);

            const formData = new FormData();
            formData.append("subject", subject.trim());
            formData.append("description", message.trim());
            formData.append("category", category);
            formData.append("priority", priority);
            if (myfile) {
                formData.append("issue_image", myfile);
            }

            const result = await AuthService.submitTicket(formData);

            if (result?.success) {
                alertSuccessMessage(result?.message || "Ticket submitted successfully");
                resetInputChange();
                getIssueList();
            } else {
                alertErrorMessage(result?.message || "Failed to submit ticket");
            }
        } catch (error) {
            alertErrorMessage(error?.message || "An error occurred while submitting ticket");
        } finally {
            setIsSubmitting(false);
            LoaderHelper.loaderStatus(false);
        }
    }, [subject, message, category, priority, myfile, isSubmitting, resetInputChange, getIssueList]);

    const handleViewTicket = useCallback((row) => {
        if (!row) return;

        setTicketId(row?.ticketId || "");
        setSelectedTicketId(row?._id || "");
        setSelectedSubject(row?.subject || "");
        setSelectedCreatedAt(row?.createdAt || "");
        setSelectedDescription(row?.description || "");
        setSelectedCategory(row?.category || "");
        setSelectedPriority(row?.priority || "");
        setStatus(row?.status || "");
        setMessageQuery(Array.isArray(row?.ticket) ? row.ticket : []);
        setMessageReply("");

        // Scroll to bottom after modal content is rendered
        setTimeout(() => {
            messagesEndRef?.current?.scrollIntoView({ behavior: "smooth", block: "end" });
        }, 300);
    }, []);

    const handleMessageQuery = useCallback(async () => {
        if (isSubmitting) return;

        if (!messageReply?.trim()) {
            alertErrorMessage("Please enter a message");
            return;
        }

        if (!selectedTicketId) {
            alertErrorMessage("Invalid ticket");
            return;
        }

        try {
            setIsSubmitting(true);
            LoaderHelper.loaderStatus(true);

            const result = await AuthService.replyTicket(messageReply.trim(), selectedTicketId);

            if (result?.success) {
                setMessageReply("");
                getIssueList(selectedTicketId);
                alertSuccessMessage("Message sent successfully");
            } else {
                alertErrorMessage(result?.message || result?.msg || "Failed to send message");
            }
        } catch (error) {
            alertErrorMessage(error?.message || "An error occurred while sending message");
        } finally {
            setIsSubmitting(false);
            LoaderHelper.loaderStatus(false);
        }
    }, [messageReply, selectedTicketId, isSubmitting, getIssueList]);

    const handleCopyTicketId = useCallback((id) => {
        if (!id) return;
        copy(id);
        alertSuccessMessage("Ticket ID copied!");
    }, []);

    useEffect(() => {
        if (messageQuery?.length > 0) {
            messagesEndRef?.current?.scrollIntoView({ behavior: "smooth", block: "end" });
        }
    }, [messageQuery]);

    // Filter issue list based on search query
    const filteredIssueList = useMemo(() => {
        if (!searchQuery?.trim()) {
            return issueList;
        }
        const query = searchQuery.toLowerCase().trim();
        return issueList.filter((item) =>
            item?.ticketId?.toLowerCase()?.includes(query) ||
            item?.subject?.toLowerCase()?.includes(query) ||
            item?.status?.toLowerCase()?.includes(query)
        );
    }, [issueList, searchQuery]);

    // Get user initial for avatar
    const getUserInitial = useCallback(() => {
        if (userDetails?.firstName) {
            return userDetails.firstName.charAt(0).toUpperCase();
        }
        if (userDetails?.emailId) {
            return userDetails.emailId.charAt(0).toUpperCase();
        }
        return "U";
    }, [userDetails]);

    // Sanitize HTML for safe rendering
    const sanitizeMessage = useCallback((text) => {
        if (!text) return "";
        return text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;")
            .replace(/\n/g, "<br>");
    }, []);

    return (
        <>

            <div className="dashboard_right">
                <div className="supportsection">
                    <h4 className="mb-1">
                        Help/Support
                    </h4>
                    <div className="supportinquery">

                        <form className="profile_form" onSubmit={handleSupport}>
                            <div className="row">
                                <div className="col-sm-6">
                                    <div className="emailinput">
                                        <label>Subject</label>
                                        <div className="d-flex">
                                            <input
                                                type="text"
                                                placeholder="Enter subject"
                                                value={subject}
                                                onChange={(e) => setSubject(e.target.value)}
                                                maxLength={200}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="col-sm-6">
                                    <div className="emailinput">
                                        <label>Category</label>
                                        <div className="d-flex">
                                            <select
                                                value={category}
                                                onChange={(e) => setCategory(e.target.value)}
                                                className="form-select"
                                            >
                                                <option value="" hidden>Select Category</option>
                                                {categories.map((cat) => (
                                                    <option key={cat.id} value={cat.id}>
                                                        {cat.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-sm-6">
                                    <div className="emailinput">
                                        <label>Priority</label>
                                        <div className="d-flex">
                                            <select
                                                value={priority}
                                                onChange={(e) => setPriority(e.target.value)}
                                                className="form-select"
                                            >
                                                {priorities.map((pri) => (
                                                    <option key={pri.id} value={pri.id}>
                                                        {pri.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-sm-6">
                                    <div className="emailinput">
                                        <label>Supporting documents (Optional)</label>
                                        <div className="d-flex">
                                            <input
                                                type="file"
                                                placeholder=""
                                                ref={fileInputRef}
                                                onChange={handleChangeImage}
                                                accept=".png,.jpg,.jpeg"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="col-sm-12">
                                    <div className="emailinput">
                                        <label>Description</label>
                                        <div className="d-flex">
                                            <textarea
                                                placeholder="Describe your issue in detail"
                                                value={message}
                                                onChange={(e) => setMessage(e.target.value)}
                                                maxLength={2000}
                                            ></textarea>
                                        </div>
                                    </div>
                                </div>

                                <div className="col-sm-12">
                                    <button
                                        type="submit"
                                        className="submit"
                                        disabled={isSubmitting || !subject?.trim() || !category || !message?.trim()}
                                    >
                                        {isSubmitting ? "Submitting..." : "Submit"}
                                    </button>
                                </div>
                            </div>

                        </form>

                    </div>
                    <div className="tt_main issuelist_data">

                        <div className="coin_view_top">
                            <h4>Issue List</h4>

                            <div className="searchBar custom-tabs">
                                <i className="ri-search-2-line"></i>
                                <input
                                    type="search"
                                    className="custom_search"
                                    placeholder="Search ticket id"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>

                        </div>

                        <div className="inngerbox cng-pass overflow_unset ">
                            {/* Desktop View */}
                            <div className='desktop_view'>
                                <div className='table-responsive'>
                                    <table className="table table_home ">
                                        <thead>
                                            <tr>
                                                <th>Sr No.</th>
                                                <th>Ticket ID</th>
                                                <th>Category</th>
                                                <th>Subject</th>
                                                <th>Priority</th>
                                                <th>Status</th>
                                                <th>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredIssueList?.length > 0 ? filteredIssueList.map((item, index) =>
                                                <tr key={item?._id || index} className={` ${(item?.seen === 0 && item?.status === 'Open') ? " font-weight-bold issue_text" : "issue_text"}`} >
                                                    <td>{index + 1}</td>
                                                    <td>{item?.ticketId || "N/A"} <button type="button" className="btn btn-link p-0" onClick={() => handleCopyTicketId(item?.ticketId)}><i className="ri-file-copy-line"></i></button></td>
                                                    <td className="text-capitalize">{item?.category?.replace(/_/g, ' ') || "N/A"}</td>
                                                    <td>{item?.subject || "N/A"}</td>
                                                    <td className={`badge bg-secondary  text-capitalize`}>
                                                            {item?.priority || "N/A"}
                                                        
                                                    </td>
                                                    <td>{item?.status || "N/A"} <small>{(item?.seen === 0 && item?.status === 'Open') && <i className="ri-circle-fill" style={{ color: 'green' }}></i>}</small></td>
                                                    <td><button type="button" className="btn btn-xs btn-success" data-bs-toggle="modal" data-bs-target="#security_verification" onClick={() => handleViewTicket(item)}><span>View</span></button></td>
                                                </tr>
                                            ) : <tr>
                                                <td colSpan="7">
                                                    <div style={{ textAlign: "center" }} className="no-data justify-content-center h-100 d-flex align-items-center">
                                                        <div className="favouriteData">
                                                            <div className="no_data_s">
                                                                <img src="/images/no_data_vector.svg" className="img-fluid" width="96" height="96" alt="No data" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                            }
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            {/* Mobile View */}
                            <div className='mobile_view mt-2'>
                                <div className='table-responsive'>
                                    <table className=" ">
                                        <thead>
                                            <tr>
                                                <th>Ticket ID</th>
                                                <th>Category</th>
                                                <th>Priority</th>
                                                <th>Status</th>
                                                <th className="right_t">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredIssueList?.length > 0 ? filteredIssueList.map((item, index) =>

                                                <tr key={item?._id || index}>

                                                    <td>
                                                        <div className="td_first">
                                                            {item?.ticketId || "N/A"}
                                                        </div>
                                                    </td>
                                                    <td className="text-capitalize"><small>{item?.category?.replace(/_/g, ' ') || "N/A"}</small></td>
                                                    <td>
                                                        <span className={`badge  bg-secondary  text-capitalize`} style={{ fontSize: '10px' }}>
                                                            {item?.priority || "N/A"}
                                                        </span>
                                                    </td>
                                                    <td>{item?.status || "N/A"} <small>{(item?.seen === 0 && item?.status === 'Open') && <i className="ri-circle-fill" style={{ color: 'green' }}></i>}</small></td>


                                                    <td className="right_t"><button type="button" className="btn btn-xs btn-success" data-bs-toggle="modal" data-bs-target="#security_verification" onClick={() => handleViewTicket(item)}><small>View</small></button></td>
                                                </tr>

                                            ) : <tr>
                                                <td colSpan="5">
                                                    <div style={{ textAlign: "center" }} className="no-data justify-content-center h-100 d-flex align-items-center">
                                                        <div className="favouriteData">
                                                            <div className="no_data_s">
                                                                <img src="/images/no_data_vector.svg" className="img-fluid" width="96" height="96" alt="No data" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                            }
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div >

            <div className="modal fade search_form chatmessages"
                id="security_verification"
                tabIndex="-1"
                aria-labelledby="securityVerificationLabel"
                aria-hidden="true"
            >
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content">
                        <button
                            type="button"
                            className="btn-close"
                            data-bs-dismiss="modal"
                            aria-label="Close"
                        />
                        <div className="chat-container">
                            <div className="chat-header">
                                <h3>Help/Support</h3>
                                <div className="ticket">
                                    <div className="ticket cursor-pointer" onClick={() => handleCopyTicketId(ticketId)}><i className="ri-file-copy-line"></i>{ticketId || "N/A"}</div>

                                </div>
                            </div>
                            {/* Ticket Details - Subject & Description */}
                           
                            <div className="chat-body">
                            <div className="ticket-details mb-4" style={{ padding: '12px 16px', borderBottom: '1px solid #444', backgroundColor: 'rgb(47 53 66)' }}>
                                <div style={{ marginBottom: '8px' }}>
                                    <span style={{ fontSize: '12px', color: '#888', marginRight: '8px' }}>Ticket Created On:</span>
                                    <span style={{ fontSize: '14px', color: '#fff' }}>{moment(selectedCreatedAt).format('DD/MM/YYYY hh:mm A') || "N/A"}</span>
                                </div>  
                                <div style={{ marginBottom: '8px' }}>
                                    <span style={{ fontSize: '12px', color: '#888', marginRight: '8px' }}>Subject:</span>
                                    <span style={{ fontSize: '14px', color: '#fff' }}>{selectedSubject || "N/A"}</span>
                                </div>
                                <div style={{ marginBottom: '8px', display: 'flex', gap: '16px' }}>
                                    <div>
                                        <span style={{ fontSize: '12px', color: '#888', marginRight: '8px' }}>Category:</span>
                                        <span className="badge bg-secondary text-capitalize" style={{ fontSize: '12px' }}>{selectedCategory?.replace(/_/g, ' ') || "N/A"}</span>
                                    </div>
                                    <div>
                                        <span style={{ fontSize: '12px', color: '#888', marginRight: '8px' }}>Priority:</span>
                                        <span className={`badge bg-secondary text-capitalize`} style={{ fontSize: '12px' }}>
                                            {selectedPriority || "N/A"}
                                        </span>
                                    </div>
                                </div>
                                <div>
                                    <span style={{ fontSize: '12px', color: '#888', marginRight: '8px' }}>Description:</span>
                                    <span style={{ fontSize: '13px', color: '#ccc' }}>{selectedDescription || "N/A"}</span>
                                </div>
                            </div>
                                {messageQuery?.length > 0 ? (
                                    messageQuery.map((item, index) => (
                                        <div key={item?._id || index}>
                                            {item?.replyBy === 0 ? (
                                                <div className="message left">
                                                    <div className="avatar">T</div>
                                                    <div
                                                        className="bubble"
                                                        dangerouslySetInnerHTML={{
                                                            __html: sanitizeMessage(item?.query || "")
                                                        }}
                                                    />
                                                </div>
                                            ) : (
                                                <div className="message right">
                                                    <div
                                                        className="bubble"
                                                        dangerouslySetInnerHTML={{
                                                            __html: sanitizeMessage(item?.query || "")
                                                        }}
                                                    />
                                                    <div className="avatar">{getUserInitial()}</div>
                                                </div>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <div className="message left">
                                        <div className="avatar">T</div>
                                        <div className="bubble">
                                            No messages yet. Our support team will respond shortly.
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>
                            <div className="chat-footer">
                                {status === 'Open' || status === 'Pending' ? (
                                    <>
                                        <input
                                            type="text"
                                            placeholder="Write your message here..."
                                            value={messageReply || ""}
                                            onChange={(e) => setMessageReply(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                    e.preventDefault();
                                                    handleMessageQuery();
                                                }
                                            }}
                                            maxLength={1000}
                                            disabled={isSubmitting}
                                        />
                                        <div className="icon-btn send-btn cursor-pointer" onClick={handleMessageQuery} >  {isSubmitting ? "..." : "➤"}</div>

                                    </>
                                ) : (
                                    <input
                                        type="text"
                                        placeholder="This ticket has been resolved"
                                        value=""
                                        disabled
                                        readOnly
                                    />
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </>

    );
}

export default SupportPage;
