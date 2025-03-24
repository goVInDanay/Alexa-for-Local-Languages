import React, { useState, useEffect } from "react";
import { Navigate } from "react-router-dom"; // Import Navigate for redirection
import "./Dashboard.css";
import { isAuthenticated } from "../utils/auth";
function Dashboard() {
  const defaultImg = "https://th.bing.com/th/id/OIP.dCpgPQ0i-xX2gZ-yonm54gHaHa?w=207&h=207&c=7&r=0&o=5&dpr=1.4&pid=1.7";
  const [profilePicture, setProfilePicture] = useState('');
  const [username, setUsername] = useState("User");
  const [showProfileOptions, setShowProfileOptions] = useState(false);
  const [showFeedbackOverlay, setShowFeedbackOverlay] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(true); // Track login status

  useEffect(() => {
    const fetchUsername = async () => {
       try {
        const  email = localStorage.getItem('useremail');
        const response = await fetch(`http://localhost:5000/user/username?email=${email}`);
  
        const data = await response.json();
        console.log(data.name);
        console.log(data.profilePicture);
        const full = data.name.split(' ');
        localStorage.setItem('username', full[0]);
        setUsername(full[0] || "User");
        localStorage.setItem('pic', data.profilePicture);
        setProfilePicture(data.profilePicture || defaultImg);
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };
  
    fetchUsername();
  }, []);
  

  // Redirect to login if not logged in
  if (!isLoggedIn) {
    return <Navigate to="/login" />;
  }

  const handleProfileClick = () => {
    setShowProfileOptions(!showProfileOptions);
  };

  const handleOutsideClick = () => {
    setShowProfileOptions(false);
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    const userEmail = localStorage.getItem('useremail')
    try {
      const response = await fetch("http://localhost:5000/api/feedback/send-feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userEmail, feedback }),
      });
      if (response.ok) {
        console.log("Feedback sent successfully");
        setFeedback("");
        setShowFeedbackOverlay(false);
        alert("Thank you for your feedback!");
      } else {
        console.error("Error sending feedback");
        alert("Failed to send feedback.");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };
  const handleEditProfileClick = () => {
    if (isAuthenticated()) {
        window.location.href = "/edit-profile"; // Redirect to the profile page
    } else {
        alert("You need to log in to access this page.");
        window.location.href = "/login"; // Redirect to the login page
    }
};
  const handleLogout = () => {
    // Clear the token from local storage
    localStorage.removeItem('token');
    
    // Redirect to the login page
    window.location.href = '/login'; // Adjust the path as necessary
    };

  return (
    <div className="dash" onClick={handleOutsideClick}>
      <header className="navbar">
        <h1 className = "hello">Hi, {username}</h1>
        <div className="nav-links">
          <a href="mailto:captainlifegod@gmail.com">Contact Us</a>
          <span onClick={() => setShowFeedbackOverlay(true)}>Report a Problem</span>
        </div>
        <div className="profile" onClick={(e) => e.stopPropagation()}>
        <div
            className="profile-circle"
            onClick={handleProfileClick}
            style={{
              backgroundImage: profilePicture ? `url(${profilePicture})`: "none", // Set background image
              backgroundSize: "cover", // Ensure the image fits in the circle
              backgroundPosition: "center", // Center the image
            }}
          >
          </div>
          {showProfileOptions && (
            <div className="profile-options">
              <span onClick={handleEditProfileClick}>Edit Profile</span>
              <span onClick={handleLogout} style={{ cursor: 'pointer' }}>Log Out</span>
            </div>
          )}
        </div>
      </header>

      {/* Feedback Form Overlay */}
      {showFeedbackOverlay && (
        <div className="feedback-overlay" onClick={() => setShowFeedbackOverlay(false)}>
          <div
            className="feedback-content"
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the overlay
          >
            <h2>Report a Problem</h2>
            <form onSubmit={handleFeedbackSubmit}>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Describe the problem here"
                required
              ></textarea>
              <button type="submit" className="submit-button">Submit</button>
            </form>
          </div>
        </div>
      )}

      <main>
        <section className="intro">
          <br />
          <br />
          <p>
            Welcome to the Alexa for Local Language IoT project. You can control
            your smart devices or chat with Alexa in your local language.
          </p>
          <p>
            Available in English, हिंदी, தமிழ், मराठी, ગુજરાતી, and more languages to come!
          </p>
        </section>
        <br />
        <br />
        <br />
        <section className="actions">
          <h2>What do you want to do?</h2>
          <br></br>
          <div className="buttons">
            <button onClick={() => window.location.href = `/devices`}>Control devices</button>
            <button onClick={() => window.location.href = "/chat"}>Chat</button>
          </div>
        </section>
      </main>

      <footer className = "dashboard-foot">
        <p>© 2024 Alexa for Local Languages</p>
        <p>All rights reserved</p>
        <div className="footer-links">
          <a href="/privacy-policy">Privacy Policy</a>
          <span> | </span>
          <a href="/terms-of-service">Terms of Service</a>
        </div>
      </footer>
    </div>
  );
}

export default Dashboard;