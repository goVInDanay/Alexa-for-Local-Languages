import React, { useState, useEffect } from "react";
import "./Login.css"; // Adjust this path as necessary
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import axios from "axios";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [showOtpSection, setShowOtpSection] = useState(false);
  const [timer, setTimer] = useState(30);
  const [timerActive, setTimerActive] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false); // Loading state

  useEffect(() => {
    if (timerActive) {
      const countdown = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            clearInterval(countdown);
            setTimerActive(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(countdown);
    }
  }, [timerActive]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post('http://localhost:5000/users/login', { email, password });
      
      if (response.status === 200) {
        if (response.data.success) {
          setMessage("OTP sent successfully!");
          setMessageType("success");
          localStorage.setItem("useremail", email);
          setShowOtpSection(true);
          startTimer();
        } else {
          setMessage("Invalid email or password. Please try again.");
          setMessageType("danger");
          setPassword("");
        }
      } else {
        setMessage("Failed to log in. Please try again.");
        setMessageType("danger");
      }
    } catch (error) {
      console.log("Error:", error);
      if (error.response) {
        // Server responded with an error code (e.g., 400, 500)
        setMessage(`Error: ${error.response.data.message || "An error occurred"}`);
      } else if (error.request) {
        // No response from the server
        setMessage("No response from server. Please check the server status.");
      } else {
        // Other error
        setMessage(`Error: ${error.message}`);
      }
      setMessageType("danger");
    } finally {
      setLoading(false);
    }
  };
  
  const handleOtpSubmit = async () => {
    console.log("Submitting OTP..."); // Changed log for clarity
    setLoading(true);

    try {
        const response = await fetch("http://localhost:5000/users/verify-otp-login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, otp }),
        });

        if (!response.ok) {
            // If the response is not ok, throw an error
            throw new Error("Network response was not ok");
        }

        const data = await response.json();

        if (data.success) {
            console.log("OTP Verified Successfully!"); // Changed log for clarity
            setMessage("OTP Verified Successfully!");
            setMessageType("success");
            localStorage.setItem('token', data.token);
            window.location.href = '/dashboard';  // Redirect to dashboard
        } else {
            // Handle unsuccessful OTP verification
            console.log("Failed OTP Verification:", data.message); // Log detailed error message
            setMessage(data.message || "Incorrect OTP. Please try again."); // Display the error message from the backend
            setMessageType("danger");
            setShowOtpSection(false); // Hide the OTP section
            resetForm(); // Reset the form
        }
    } catch (error) {
        console.error("Error during OTP submission:", error); // Log error details
        setMessage("Wrong OTP entered");
        setMessageType("danger");
    } finally {
        setLoading(false);
    }
};


  const handleResendOtp = async () => {
    setLoading(true);
    try {
      const response = await fetch("http://localhost:5000/users/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();

      if (data.success) {
        setMessage("OTP resent successfully!");
        setMessageType("success");
        setTimer(30);
        startTimer();
      } else {
        setMessage("Failed to resend OTP. Please try again.");
        setMessageType("danger");
      }
    } catch (error) {
      setMessage("An error occurred. Please try again.");
      setMessageType("danger");
    } finally {
      setLoading(false);
    }
  };

  const startTimer = () => {
    setTimerActive(true);
    setTimer(30);
  };

  const resetForm = () => {
    setEmail("");
    setPassword("");
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
          <h1 className="text-center mb-3">Login</h1>

          {/* Flash Message */}
          {message && (
            <div
              className={`alert alert-${
                messageType === "success" ? "success" : "danger"
              } alert-dismissible fade show`}
              role="alert"
            >
              {message}
              <button
                type="button"
                className="close"
                data-dismiss="alert"
                aria-label="Close"
                onClick={() => setMessage("")}
              >
                <span aria-hidden="true">&times;</span>
              </button>
            </div>
          )}

          {!showOtpSection ? (
            <form id="loginForm" onSubmit={handleLogin}>
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  className="form-control1"
                  placeholder="Enter Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <br></br>
              <div className="form-group">
                <label htmlFor="password">Password</label>
                <div className="position-relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    className="form-control2"
                    placeholder="Enter Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <span
                    className="eye-icon"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    <FontAwesomeIcon className = "vg"
                      icon={showPassword ? faEyeSlash : faEye}
                    />
                  </span>
                </div>
              </div>
              <br></br>
              <button
                type="submit"
                className="btn btn-primary btn-block"
                disabled={loading}
              >
                {loading ? "Sending OTP..." : "Login"}
              </button>
            </form>
          ) : (
            <div id="otpSection">
              <div className="form-group">
                <label htmlFor="otp">Enter OTP:</label>
                <input
                  type="text"
                  name="otp"
                  id="otp"
                  className="form-control"
                  placeholder="Enter OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                />
              </div>
              <div className = "bgg">
              <button
                type="button"
                className="btn btn-success"
                onClick={handleOtpSubmit}
                disabled={loading}
              >
                {loading ? "Verifying OTP..." : "Verify OTP"}
              </button>
              </div>
              <div id="timer">
                {timerActive ? (
                  `Resend OTP in ${timer} seconds`
                ) : (
                  <button
                    className="btn btn-secondary"
                    onClick={handleResendOtp}
                    disabled={loading}
                  >
                    {loading ? "Resending OTP..." : "Resend OTP"}
                  </button>
                )}
              </div>
            </div>
          )}
          <br></br>
          <p className="lead mt-4">
            No Account? <a href="/register">Register</a>
          </p>
          <p className="lead mt-4">
            <a href="/forgot-password">Forgot Password?</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;