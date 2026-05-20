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
      <div className="modal fade search_form" id="contactEnquiryModal" tabIndex="-1" aria-hidden="true" data-bs-backdrop="static">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">
                <i className="ri-rocket-2-line" style={{ color: "#00c853", marginRight: "8px" }}></i>
                Contact Us
              </h5>
              <p>Have a crypto exchange development enquiry? Tell us about your project and our team will get back to you shortly.</p>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div className="modal-body">
              <div className="verify_authenticator_s">
                <img src="/images/verifyemail.svg" alt="Contact Us" />
              </div>

              <div className="verify_authenticator_form">
                <form className="profile_form" onSubmit={handleContactSubmit}>
                  <div className="emailinput">
                    <label>Your name</label>
                    <div className="d-flex">
                      <input
                        type="text"
                        name="name"
                        placeholder="Enter your name"
                        value={contactForm.name}
                        onChange={handleContactChange}
                      />
                    </div>
                  </div>

                  <div className="emailinput">
                    <label>Email address</label>
                    <div className="d-flex">
                      <input
                        type="email"
                        name="email"
                        placeholder="Enter your email"
                        value={contactForm.email}
                        onChange={handleContactChange}
                      />
                    </div>
                  </div>

                  <div className="emailinput">
                    <label>Phone number</label>
                    <div className="d-flex">
                      <input
                        type="tel"
                        name="phone"
                        placeholder="Enter your phone number"
                        value={contactForm.phone}
                        onChange={handleContactChange}
                      />
                    </div>
                  </div>

                  <div className="emailinput">
                    <label>Message</label>
                    <div className="d-flex">
                      <textarea
                        name="message"
                        rows="4"
                        placeholder="Tell us about your project requirements"
                        value={contactForm.message}
                        onChange={handleContactChange}
                      />
                    </div>
                  </div>

                  <button className="submit" type="submit" disabled={submitting}>
                    {submitting ? "Sending..." : "Send Enquiry"}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ContactEnquiry;
