import React, { useState, useEffect } from 'react';
import './ForgotPassword.css';  // Ensure the correct path for your CSS file

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [otpSent, setOtpSent] = useState(false);
    const [otpVerified, setOtpVerified] = useState(false);
    const [showOtpInput, setShowOtpInput] = useState(false);
    const [timer, setTimer] = useState(60);
    const [isTimerActive, setIsTimerActive] = useState(false);

    const handleForgotPassword = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        try {
            const response = await fetch('http://localhost:5000/users/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            if (response.ok) {
                const data = await response.json();
                setMessage(data.message || 'OTP sent to your email!');
                setOtpSent(true);
                setShowOtpInput(true);                 
                startTimer();
            } else {
                const errorData = await response.json();
                setMessage(errorData.message || 'An error occurred. Please try again.');
                setOtpSent(true);
                setShowOtpInput(true);
                startTimer();
            }
        } catch (error) {
            console.log(error)
            setMessage('An error occurred. Please try again.');
            setOtpSent(true);
            setShowOtpInput(true);
            startTimer();
        } finally {
            setLoading(false);
        }
    };

    const startTimer = () => {
        setIsTimerActive(true);
        setTimer(60);
    };

    useEffect(() => {
        let interval = null;
        if (isTimerActive && timer > 0) {
            interval = setInterval(() => {
                setTimer((prev) => prev - 1);
            }, 1000);
        } else if (timer === 0) {
            setIsTimerActive(false);
        }
        return () => clearInterval(interval);
    }, [isTimerActive, timer]);

    const handleOtpSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        try {
            const response = await fetch('http://localhost:5000/users/verify-otp-reset', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, otp }),
            });

            if (response.ok) {
                const data = await response.json();
                setMessage(data.message || 'OTP verified successfully!');
                setOtpVerified(true);
                setShowOtpInput(false);
            } else {
                const errorData = await response.json();
                setMessage(errorData.message || 'Invalid OTP. Please try again.');
                setShowOtpInput(true);
            }
        } catch (error) {
            setMessage('An error occurred. Please try again.');
            setShowOtpInput(true);
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        try {
            const response = await fetch('http://localhost:5000/users/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password: newPassword }),
            });

            if (response.ok) {
                const data = await response.json();
                setMessage(data.message || 'Password reset successfully!');
                window.location.href = '/login'; // Redirect after successful password reset
            } else {
                const errorData = await response.json();
                setMessage(errorData.message || 'An error occurred. Please try again.');
            }
        } catch (error) {
            setMessage('An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleResendOtp = async () => {
        setTimer(60);
        startTimer();
        try {
            const response = await fetch('http://localhost:5000/users/resend-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            if (response.ok) {
                const data = await response.json();
                setMessage(data.message || 'OTP resent to your email!');
            } else {
                const errorData = await response.json();
                setMessage(errorData.message || 'Failed to resend OTP. Please try again.');
            }
        } catch (error) {
            setMessage('An error occurred while resending OTP. Please try again.');
        }
    };

    return (
        <div className="forgot-password-container">
            <h2 className="forgot-password-heading">Forgot Password</h2>
            <form onSubmit={otpSent ? (otpVerified ? handleResetPassword : handleOtpSubmit) : handleForgotPassword}>
                {!otpSent ? (
                    <>
                        <div className="input-container">
                            <label htmlFor="email" className="input-label">Email:</label>
                            <input
                                type="email"
                                id="email"
                                className="input-field"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <button type="submit" className={('submit-button', { 'loading': loading })} disabled={loading}>
                            {loading ? 'Sending...' : 'Send OTP'}
                        </button>
                    </>
                ) : (
                    <>
                        {showOtpInput && ( 
                            <>
                                <div className="input-container">
                                    <label htmlFor="otp" className="input-label">Enter OTP:</label>
                                    <input
                                        type="text"
                                        id="otp"
                                        className="input-field"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value)}
                                        required
                                    />
                                </div>
                                <button type="submit" className={('submit-button', { 'loading': loading })} disabled={loading}>
                                    {loading ? 'Verifying...' : 'Verify OTP'}
                                </button>
                                <div className="timer-container">
                                    {isTimerActive ? (
                                        <p>Resend OTP in {timer} seconds</p>
                                    ) : (
                                        <button type="button" className="resend-button" onClick={handleResendOtp}>
                                            Resend OTP
                                        </button>
                                    )}
                                </div>
                            </>
                        )}
                        {otpVerified && (
                            <div className="input-container">
                                <label htmlFor="newPassword" className="input-label">New Password:</label>
                                <input
                                    type="password"
                                    id="newPassword"
                                    className="input-field"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    required
                                />
                            </div>
                        )}
                        {otpVerified && (
                            <button type="submit" className={('submit-button', { 'loading': loading })} disabled={loading}>
                                {loading ? 'Resetting...' : 'Reset Password'}
                            </button>
                        )}
                    </>
                )}
            </form>
            {message && <p className="message">{message}</p>}
        </div>
    );
};

export default ForgotPassword;