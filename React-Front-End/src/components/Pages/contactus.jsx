import React, { useState, useEffect } from 'react';
import ProgressBarManager from '../Shared/ProgressBarManager';
import apiService from "../../services/api";
import facebookPixel from '../../services/facebookPixel';


const ContactUs = () => {
    const [contactForm, setContactForm] = useState({
        name: "",
        email: "",
        message: "",
    });
    const [contactErrors, setContactErrors] = useState({
        name: "",
        email: "",
        message: "",
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);

    // Scroll to top when component mounts
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    // Email validation
    const validateEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    // Contact form validation
    const validateContactForm = () => {
        let isValid = true;
        const newErrors = {
            name: "",
            email: "",
            message: "",
            submit: "",
        };

        if (!contactForm.name.trim()) {
            newErrors.name = "Name is required";
            isValid = false;
        }

        if (!contactForm.email.trim()) {
            newErrors.email = "Email is required";
            isValid = false;
        } else if (!validateEmail(contactForm.email)) {
            newErrors.email = "Please enter a valid email address";
            isValid = false;
        }

        if (!contactForm.message.trim()) {
            newErrors.message = "Message is required";
            isValid = false;
        }

        setContactErrors(newErrors);
        return isValid;
    };

    const handleContactInputChange = (e) => {
        const { name, value } = e.target;
        setContactForm((prev) => ({
            ...prev,
            [name]: value,
        }));

        // Clear error when user starts typing
        if (contactErrors[name]) {
            setContactErrors((prev) => ({
                ...prev,
                [name]: "",
            }));
        }
    };

    const handleContactSubmit = async (e) => {
        e.preventDefault();

        if (!validateContactForm()) {
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await apiService.submitContactMessage(
                contactForm.name,
                contactForm.email,
                contactForm.message
            );

            if (response.data.success) {
                setSubmitSuccess(true);
                setContactForm({
                    name: "",
                    email: "",
                    message: "",
                });

                // Reset success message after 5 seconds
                setTimeout(() => {
                    setSubmitSuccess(false);
                }, 5000);

                // Track Facebook Pixel Contact event
                facebookPixel.trackContact();
            } else {
                throw new Error('Submission failed');
            }
        } catch (error) {
            console.error("Error submitting contact form:", error);
            let errorMessage = "Failed to send message. Please try again later.";

            if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            }

            setContactErrors((prev) => ({
                ...prev,
                submit: errorMessage,
            }));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <ProgressBarManager autoStartDelay={800}>
            <div className="contact-us-page">
            <div className="contact-page-container">

                {/* Page Title */}
                <div className="contact-page-header">
                    <h1>Contact Us</h1>
                </div>

                {/* Main Content */}
                <div className="contact-page-content">

                    {/* Contact Information Section */}
                    <div className="contact-page-info-section">
                        <h2>Information to Contact</h2>

                        <div className="contact-page-details">
                            <div className="contact-page-item">
                                <span className="contact-page-label">Email:</span>
                                <a href="mailto:denimora1011@gmail.com" className="contact-page-link">
                                    denimora1011@gmail.com
                                </a>
                            </div>

                            <div className="contact-page-item">
                                <span className="contact-page-label">Phone:</span>
                                <a href="tel:+201099470666" className="contact-page-link">
                                    +20 1099470666
                                </a>
                            </div>

                            <div className="contact-page-item">
                                <span className="contact-page-label">Address:</span>
                                <span className="contact-page-text">Gharbia, Egypt</span>
                            </div>
                        </div>

                        {/* Social Media Icons */}
                        <div className="contact-page-socials">
                            <a
                                href="https://www.facebook.com/share/1P42RQpVK6/?mibextid=wwXIfr"
                                className="contact-page-social-icon"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <i className="fab fa-facebook-f"></i>
                            </a>
                            <a
                                href="https://www.instagram.com/denimoraa.co"
                                className="contact-page-social-icon"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <i className="fab fa-instagram"></i>
                            </a>
                            <a
                                href="https://www.tiktok.com/@denimora25?_t=ZS-8wqteSQA6lz&_r=1"
                                className="contact-page-social-icon"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <i className="fab fa-tiktok"></i>
                            </a>
                        </div>
                    </div>

                    {/* Contact Form Section */}
                    <div className="contact-page-form-section">
                        <h2>Get in Touch</h2>

                        <form onSubmit={handleContactSubmit} className="contact-page-form">
                            <div className="contact-page-form-row">
                                <div className="contact-page-form-group">
                                    <input
                                        type="text"
                                        name="name"
                                        placeholder="Name *"
                                        value={contactForm.name}
                                        onChange={handleContactInputChange}
                                        required
                                        className="contact-page-form-input"
                                    />
                                </div>
                                <div className="contact-page-form-group">
                                    <input
                                        type="email"
                                        name="email"
                                        placeholder="Email *"
                                        value={contactForm.email}
                                        onChange={handleContactInputChange}
                                        required
                                        className="contact-page-form-input"
                                    />
                                </div>
                            </div>

                            <div className="contact-page-form-group">
                                <textarea
                                    name="message"
                                    placeholder="Message"
                                    value={contactForm.message}
                                    onChange={handleContactInputChange}
                                    rows="6"
                                    className="contact-page-form-textarea"
                                ></textarea>
                            </div>

                            {submitSuccess && (
                                <div className="success-message">
                                    Thank you for your message! We'll get back to you soon.
                                </div>
                            )}

                            <button type="submit" className="contact-page-send-button">
                                {isSubmitting ? "Sending..." : "Send Message"}
                            </button>
                        </form>
                    </div>

                </div>
            </div>
        </div>
        </ProgressBarManager>
    );
};

export default ContactUs;
