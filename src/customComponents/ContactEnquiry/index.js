import React, { useState, useEffect, useCallback } from "react";
import { $ } from "react-jquery-plugin";
import { alertErrorMessage, alertSuccessMessage } from "../CustomAlertMessage";
import AuthService from "../../api/services/AuthService";
import "./ContactEnquiry.css";

const ContactEnquiry = () => {
  const [contactForm, setContactForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(() => localStorage.getItem("contactFormSubmitted") === "1");

  // Contact enquiry form handlers
  const handleContactChange = useCallback((e) => {
    const { name, value } = e.target;
    setContactForm((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleContactSubmit = useCallback(async (e) => {
    e.preventDefault();
    const { name, email, phone, message } = contactForm;
    if (!name.trim()) {
      alertErrorMessage("Please enter your name.");
      return;
    }
    if (!email.trim()) {
      alertErrorMessage("Please enter your email address.");
      return;
    }
    if (!phone.trim()) {
      alertErrorMessage("Please enter your phone number.");
      return;
    }
    if (!message.trim()) {
      alertErrorMessage("Please enter your message.");
      return;
    }
    setSubmitting(true);
    try {
      const result = await AuthService.submitContactForm({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        message: message.trim(),
      });
      if (result?.success) {
        alertSuccessMessage(result?.message || "Thank you! Your message has been submitted successfully.");
        $("#contactEnquiryModal").modal("hide");
        setContactForm({ name: "", email: "", phone: "", message: "" });
        localStorage.setItem("contactFormSubmitted", "1");
        setHasSubmitted(true);
      } else {
        alertErrorMessage(result?.message || "Something went wrong. Please try again.");
      }
    } catch {
      alertErrorMessage("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }, [contactForm]);

  // Auto-open the contact enquiry modal every 1 minute (stops once submitted)
  useEffect(() => {
    if (hasSubmitted) return;
    const interval = setInterval(() => {
      const el = document.getElementById("contactEnquiryModal");
      if (el) $(el).modal("show");
    }, 60000);
    return () => clearInterval(interval);
  }, [hasSubmitted]);

  return (
    <>
      {/* Floating Contact Enquiry Trigger */}
      <button
        type="button"
        className="contact_enquiry_fab"
        onClick={() => $("#contactEnquiryModal").modal("show")}
      >
        <i className="ri-customer-service-2-line"></i>
        <span>Enquire Now</span>
      </button>

      {/* Contact Us - Crypto Exchange Development Enquiry Modal */}
      <div className="modal fade search_form main_homepopup_contact" id="contactEnquiryModal" tabIndex="-1" aria-hidden="true" data-bs-backdrop="static">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">

            <div className="main_contact_popup_bl">
              <div className="contact_popup_bl_logo_left">
                <h2>Next-Gen <span> Crypto Exchange</span></h2>

                <p>Looking to build a secure and scalable crypto exchange? Share your project requirements with us 
                  and our team will conect with you shortly. From spot & margin trading to complete exchange 
                  infrastructure — we help you build everything professionally.</p>

                  <div className="contact_main_list_bl">
                    <div className="contact_logo">
                      <img class="lightlogo" src="/images/logo_light.svg" alt="logo"></img>
                    </div>

                    <ul>
                      <li>Advanced Spot & Futures Trading</li>
                      <li>Instant Crypto Buy & Sell</li>
                      <li>Real-Time Market Insights & Analytics</li>
                      <li>Low Trading Fees & High Liquidity</li>
                      <li>Seamless Mobile & Web Experience</li>
                    </ul>

                  </div>          

              </div>
              <div className="contact_popup_bl_logo_right">

                <div className="modal-header">
                  <h2 className="modal-title">
                    {/* <i className="ri-rocket-2-line" style={{ color: "#00c853", marginRight: "8px" }}></i> */}
                    Contact Us
                  </h2>
                  <p>Have a crypto exchange development enquiry? Tell us about your project and our team will get back to you shortly.</p>
                  <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div className="modal-body">

                  {/* <div className="verify_authenticator_s">
                    <img src="/images/verifyemail.svg" alt="Contact Us" />
                  </div> */}

                  <div className="verify_authenticator_form">
                    <form className="profile_form" onSubmit={handleContactSubmit}>

                <div className="d-flex gap-4 filled_info_sl">      

                      <div className="emailinput">
                        <div className="d-flex">
                          <input
                            type="text"
                            name="name"
                            placeholder="Name"
                            value={contactForm.name}
                            onChange={handleContactChange}
                          />
                        </div>
                      </div>

                      <div className="emailinput">
                        <div className="d-flex">
                          <input
                            type="email"
                            name="email"
                            placeholder="Company Email"
                            value={contactForm.email}
                            onChange={handleContactChange}
                          />
                        </div>
                      </div>

                      </div>

                      <div className="emailinput">
                        <div className="d-flex">
                          <input
                            type="tel"
                            name="phone"
                            placeholder="+91 1234-567-8901"
                            value={contactForm.phone}
                            onChange={handleContactChange}
                          />
                        </div>
                      </div>

                      <div className="emailinput">
                        <div className="d-flex">
                          <textarea
                            name="message"
                            rows="4"
                            placeholder="Describe your project (Help us come back better prepared)"
                            value={contactForm.message}
                            onChange={handleContactChange}
                          />
                        </div>
                      </div>

                      <button className="submit" type="submit" disabled={submitting}>
                        {submitting ? "Sending..." : "Send Enquiry"}
                      </button>

                      <p><img src="/images/security_respect_icon.svg" /> We respect your privacy. Your details are safe with us.</p>
                    </form>
                  </div>
                </div>

              </div>

            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ContactEnquiry;
