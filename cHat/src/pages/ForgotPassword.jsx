import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { forgotPasswordRoute, verifyOTPRoute, resetPasswordRoute } from "../utils/APIRoutes";
import "./ForgotPassword.css";

export default function ForgotPassword() {
    const navigate = useNavigate();
    const [step, setStep] = useState(1); // 1: email, 2: OTP, 3: new password
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const handleSendOTP = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        
        try {
            const { data } = await axios.post(forgotPasswordRoute, { email });
            if (data.status) {
                setSuccess("OTP sent to your email!");
                setStep(2);
            } else {
                setError(data.msg);
            }
        } catch (err) {
            setError("Failed to send OTP. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOTP = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        
        try {
            const { data } = await axios.post(verifyOTPRoute, { email, otp });
            if (data.status) {
                setSuccess("OTP verified!");
                setStep(3);
            } else {
                setError(data.msg);
            }
        } catch (err) {
            setError("Invalid OTP. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        
        if (newPassword !== confirmPassword) {
            setError("Passwords do not match");
            setLoading(false);
            return;
        }
        
        if (newPassword.length < 8) {
            setError("Password must be at least 8 characters");
            setLoading(false);
            return;
        }
        
        try {
            const { data } = await axios.post(resetPasswordRoute, { email, otp, newPassword });
            if (data.status) {
                setSuccess("Password reset successfully!");
                setTimeout(() => {
                    navigate("/login");
                }, 2000);
            } else {
                setError(data.msg);
            }
        } catch (err) {
            setError("Failed to reset password. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="forgot-password-container">
            <div className="forgot-password-box">
                <div className="forgot-password-header">
                    <h2>🔐 Reset Password</h2>
                    <p>
                        {step === 1 && "Enter your email to receive an OTP"}
                        {step === 2 && "Enter the OTP sent to your email"}
                        {step === 3 && "Enter your new password"}
                    </p>
                </div>

                {error && <div className="forgot-password-error">{error}</div>}
                {success && <div className="forgot-password-success">{success}</div>}

                {step === 1 && (
                    <form onSubmit={handleSendOTP} className="forgot-password-form">
                        <div className="forgot-password-input-group">
                            <label>Email Address</label>
                            <input
                                type="email"
                                placeholder="Enter your email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <button type="submit" className="forgot-password-btn" disabled={loading}>
                            {loading ? "Sending..." : "Send OTP"}
                        </button>
                    </form>
                )}

                {step === 2 && (
                    <form onSubmit={handleVerifyOTP} className="forgot-password-form">
                        <div className="forgot-password-input-group">
                            <label>Enter OTP</label>
                            <input
                                type="text"
                                placeholder="6-digit OTP"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                maxLength="6"
                                required
                            />
                        </div>
                        <button type="submit" className="forgot-password-btn" disabled={loading}>
                            {loading ? "Verifying..." : "Verify OTP"}
                        </button>
                        <p className="forgot-password-resend">
                            Didn't receive OTP? <span onClick={handleSendOTP}>Resend</span>
                        </p>
                    </form>
                )}

                {step === 3 && (
                    <form onSubmit={handleResetPassword} className="forgot-password-form">
                        <div className="forgot-password-input-group">
                            <label>New Password</label>
                            <input
                                type="password"
                                placeholder="Enter new password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                minLength="8"
                                required
                            />
                        </div>
                        <div className="forgot-password-input-group">
                            <label>Confirm Password</label>
                            <input
                                type="password"
                                placeholder="Confirm new password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />
                        </div>
                        <button type="submit" className="forgot-password-btn" disabled={loading}>
                            {loading ? "Resetting..." : "Reset Password"}
                        </button>
                    </form>
                )}

                <div className="forgot-password-footer">
                    <button onClick={() => navigate("/login")}>
                        ← Back to Login
                    </button>
                </div>
            </div>
        </div>
    );
}
