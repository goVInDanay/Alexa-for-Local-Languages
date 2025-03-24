import React, { useState } from "react";
import "./Register.css"; 
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {useNavigate } from "react-router-dom";
import axios from "axios";
import {
    faEye,
    faEyeSlash,
    faCheckCircle,
    faExclamationCircle,
} from "@fortawesome/free-solid-svg-icons";

const Register = () => {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [otp, setOtp] = useState("");
    const [showOtpSection, setShowOtpSection] = useState(false);
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [registeredEmail, setRegisteredEmail] = useState("");
    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();
        try {
            // Register the user
            const response = await axios.post('http://localhost:5000/users/register', { name, email, password, password2: confirmPassword });
            setMessage(response.data.message);
            setMessageType("success");
            setShowOtpSection(true);
            setRegisteredEmail(email);
            resetForm();
        } catch (err) {
            if (err.response && err.response.data.errors) {
                setMessage(err.response.data.errors[0].msg); // Get the first error message
                setMessageType("danger");
            } else {
                setMessage("Registration failed. Please try again.");
                setMessageType("danger");
            }
        }
    };

    const handleOtpSubmit = async () => {
        try {
            // Verify the OTP
            const response = await axios.post('http://localhost:5000/users/verify-otp', { email: registeredEmail, otp });
            setMessage(response.data.message);
            setMessageType("success");
            navigate("/dashboard"); // Redirect to dashboard on success
        } catch (err) {
            if (err.response && err.response.data.message) {
                setMessage(err.response.data.message);
                setMessageType("danger");
            } else {
                setMessage("OTP verification failed. Please try again.");
                setMessageType("danger");
            }
        }
    };

    const resetForm = () => {
        setName("");
        setEmail("");
        setPassword("");
        setConfirmPassword("");
        setOtp("");
    };

    return (
        <div className="row mt-5">
            <div className="col-md-6 left-column">
                {!showOtpSection ? (
                    <img
                        src="https://i.pinimg.com/736x/19/6f/2a/196f2a3f99a08e4ae52f29e3e8d793d8.jpg"
                        alt="Bird"
                        className="left-image"
                    />
                ) : (
                    <img
                        src="https://cdn.dribbble.com/users/741934/screenshots/1941143/envelope.gif"
                        alt="Dancing GIF"
                        className="left-gif"
                    />
                )}
            </div>
            <div className="col-md-6 m-auto">
                <div className="card card-body">
                    <h1 className="text-center mb-3">Register</h1>

                    {/* Flash Message */}
                    {message && (
                        <div className={`alert alert-${messageType === "success" ? "success" : "danger"} alert-dismissible fade show`} role="alert">
                            <FontAwesomeIcon icon={messageType === "success" ? faCheckCircle : faExclamationCircle} className="mr-2" />
                            {message}
                            <button type="button" className="close" onClick={() => setMessage("")}>
                                <span aria-hidden="true">&times;</span>
                            </button>
                        </div>
                    )}

                    {!showOtpSection ? (
                        <form id="registerForm" onSubmit={handleRegister}>
                            <div className="form-group">
                                <label htmlFor="name">Name</label>
                                <input type="text" id="name" className="form-control" placeholder="Enter Name" value={name} onChange={(e) => setName(e.target.value)} required />
                            </div>
                            <div className="form-group">
                                <label htmlFor="email">Email</label>
                                <input type="email" id="email" className="form-control" placeholder="Enter Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                            </div>
                            <div className="form-group">
                                <label htmlFor="password">Password</label>
                                <div className="position-relative">
                                    <input type={showPassword ? "text" : "password"} id="password" className="form-control" placeholder="Enter Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                                    <span className="eye-icon" onClick={() => setShowPassword(!showPassword)}>
                                        <FontAwesomeIcon className = "vg" icon={showPassword ? faEyeSlash : faEye} />
                                    </span>
                                </div>
                            </div>
                            <div className="form-group">
                                <label htmlFor="confirmPassword">Confirm Password</label>
                                <div className="position-relative">
                                    <input type={showConfirmPassword ? "text" : "password"} id="confirmPassword" className="form-control" placeholder="Confirm Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                                    <span className="eye-icon" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                                        <FontAwesomeIcon className = "vg" icon={showConfirmPassword ? faEyeSlash : faEye} />
                                    </span>
                                </div>
                            </div>
                            <button type="submit" className="btn btn-primary btn-block">Register</button>
                        </form>
                    ) : (
                        <div id="otpSection">
                            <div className="form-group">
                                <label htmlFor="otp">Enter OTP:</label>
                                <input type="text" name="otp" id="otp" className="form-control" placeholder="Enter OTP" value={otp} onChange={(e) => setOtp(e.target.value)} required />
                            </div>
                            <button type="button" className="btn btn-success" onClick={handleOtpSubmit}>Verify OTP</button>
                        </div>
                    )}

                    <p className="lead mt-4">Already have an account? <a href="/login">Login</a></p>
                </div>
            </div>
        </div>
    );
};

export default Register;