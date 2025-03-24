import React, { useState, useEffect } from 'react';
import countryList from 'country-list';
import axios from 'axios';
import './Profile.css';
import {config} from '../utils/config'
const Profile = () => {
  const [activeTab, setActiveTab] = useState('personalInfo');
  const [personalInfo, setPersonalInfo] = useState({
    name: '',
    phone: '',
    country: '',
    city: '',
    profilePicture: null,
  });
  const [passwordInfo, setPasswordInfo] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState({
    oldPassword: false,
    newPassword: false,
    confirmPassword: false,
  });
  const email = localStorage.getItem("useremail");
  const countries = countryList.getData(); // Get list of countries
  const getDetails = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/getDetails?email=${email}`);
      
      if (response.status === 200) {
        const data = await response.data; // Directly use response.data here
        
        // Assuming you want to update the state with the fetched user details
        setPersonalInfo({
          name: data.name,
          phone: data.phone,
          country: data.country,
          city: data.city,
          profilePicture: data.profilePicture,
        });
        console.log(data.profilePicture)
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
    }
  };
  // Fetch user details when the component mounts
  useEffect(() => {
    getDetails(); // Call the function to fetch details
  }, [])

  // Handle changes for personal info form
  const handlePersonalInfoChange = (e) => {
    setPersonalInfo({ ...personalInfo, [e.target.name]: e.target.value });
  };
  const defaultImageUrl = "https://th.bing.com/th/id/OIP.dCpgPQ0i-xX2gZ-yonm54gHaHa?w=207&h=207&c=7&r=0&o=5&dpr=1.4&pid=1.7";
  // Handle file upload to Cloudinary for profile picture
  const cloudName = config.cloudName;
  const preset = config.preset;
  const handleProfilePictureChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', preset);
      try {
        const response = await axios.post(
          `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
          formData
        );
        setPersonalInfo({
          ...personalInfo,
          profilePicture: response.data.secure_url,
        });
      } catch (error) {
        console.error('Error uploading image to Cloudinary:', error);
        alert('Failed to upload image');
      }
    }
  };

  // Trigger file input on image click
  const triggerFileInput = () => {
    document.getElementById('profilePicInput').click();
  };

  // Handle Personal Info form submission
  const handlePersonalInfoSubmit = async (e) => {
    e.preventDefault();
    try {
      const email = localStorage.getItem('useremail');
      const dataToSend = { email, ...personalInfo };
      await axios.post('http://localhost:5000/api/profile', dataToSend);
      alert('Submitted');
      localStorage.setItem('username', personalInfo.name);
      localStorage.setItem("pic", personalInfo.profilePicture || defaultImageUrl)
    } catch (error) {
      console.error('Error saving to MongoDB:', error);
      alert('Failed to save personal info');
    }
  };

  // Handle Password Info form submission
  const handlePasswordInfoSubmit = async(e) => {
    e.preventDefault();
    const { oldPassword, newPassword, confirmPassword } = passwordInfo;

    // Check if new password and confirm password match
    if (newPassword !== confirmPassword) {
      alert("New password and confirm password do not match");
      return;
    }
    const email = localStorage.getItem("useremail");
    try{
      // Make API call to update password
      const response = await axios.post("http://localhost:5000/api/update-password", {
        email,
        oldPassword,
        newPassword,
      });

      if (response.status === 200) {
        alert("Password updated successfully!");
        setPasswordInfo({ oldPassword: "", newPassword: "", confirmPassword: "" });
      }
    } catch (error) {
      console.error("Error updating password:", error);
      alert("Failed to update password");
    }
  };


  const togglePasswordVisibility = (field) => {
    setShowPassword((prevState) => ({
      ...prevState,
      [field]: !prevState[field],
    }));
  };

  return (
    <div className="profile-container">
      <div className="sidebar">
        <button
          className={activeTab === 'personalInfo' ? 'active' : ''}
          onClick={() => setActiveTab('personalInfo')}
        >
          Personal Info
        </button>
        <button
          className={activeTab === 'password' ? 'active' : ''}
          onClick={() => setActiveTab('password')}
        >
          Password
        </button>
      </div>
      <div className="content">
        {activeTab === 'personalInfo' && (
          <div className="profile-form">
            <div className="profile-picture" onClick={triggerFileInput} style={{ cursor: 'pointer' }}>
              <img
                src={personalInfo.profilePicture || defaultImageUrl}
                alt="Profile"
                className="profile-img"
              />
              <input
                type="file"
                accept="image/*"
                id="profilePicInput"
                style={{ display: 'none' }}
                onChange={handleProfilePictureChange}
              />
            </div>

            <form onSubmit={handlePersonalInfoSubmit}>
              <div className="form-group">
                <label className="label">Name</label>
                <input
                  type="text"
                  name="name"
                  value={personalInfo.name}
                  onChange={handlePersonalInfoChange}
                  placeholder="Enter your name"
                  className="input"
                />
              </div>

              <div className="form-group">
                <label className="label">Phone Number</label>
                <input
                  type="text"
                  name="phone"
                  value={personalInfo.phone}
                  onChange={handlePersonalInfoChange}
                  placeholder="Enter your phone number"
                  maxLength="10"
                  className="input"
                />
              </div>

              <div className="form-group">
                <label className="label">Country</label>
                <select
                  name="country"
                  value={personalInfo.country}
                  onChange={handlePersonalInfoChange}
                  className="input"
                >
                  <option value="">Select your country</option>
                  {countries.map((country) => (
                    <option key={country.code} value={country.name}>
                      {country.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="label">City</label>
                <input
                  type="text"
                  name="city"
                  value={personalInfo.city}
                  onChange={handlePersonalInfoChange}
                  placeholder="Enter your city"
                  className="input"
                />
              </div>

              <button type="submit" className="submit-btn">Save Details</button>
            </form>
          </div>
        )}

        {activeTab === 'password' && (
          <div className="password-form">
            <form onSubmit={handlePasswordInfoSubmit}>
              <div className="form-group">
                <label>Old Password</label>
                <div className="password-input-container">
                  <input
                    type={showPassword.oldPassword ? 'text' : 'password'}
                    name="oldPassword"
                    value={passwordInfo.oldPassword}
                    onChange={(e) => setPasswordInfo({ ...passwordInfo, oldPassword: e.target.value })}
                    placeholder="Enter your old password"
                    className="input"
                  />
                  <span
                    className="eye-icon"
                    onClick={() => togglePasswordVisibility('oldPassword')}
                  >
                    <i className={showPassword.oldPassword ? 'fa fa-eye-slash' : 'fa fa-eye'}></i>
                  </span>
                </div>
              </div>

              <div className="form-group">
                <label>New Password</label>
                <div className="password-input-container">
                  <input
                    type={showPassword.newPassword ? 'text' : 'password'}
                    name="newPassword"
                    value={passwordInfo.newPassword}
                    onChange={(e) => setPasswordInfo({ ...passwordInfo, newPassword: e.target.value })}
                    placeholder="Enter your new password"
                    className="input"
                  />
                  <span
                    className="eye-icon"
                    onClick={() => togglePasswordVisibility('newPassword')}
                  >
                    <i className={showPassword.newPassword ? 'fa fa-eye-slash' : 'fa fa-eye'}></i>
                  </span>
                </div>
              </div>

              <div className="form-group">
                <label>Confirm New Password</label>
                <div className="password-input-container">
                  <input
                    type={showPassword.confirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={passwordInfo.confirmPassword}
                    onChange={(e) => setPasswordInfo({ ...passwordInfo, confirmPassword: e.target.value })}
                    placeholder="Confirm your new password"
                    className="input"
                  />
                  <span
                    className="eye-icon"
                    onClick={() => togglePasswordVisibility('confirmPassword')}
                  >
                    <i className={showPassword.confirmPassword ? 'fa fa-eye-slash' : 'fa fa-eye'}></i>
                  </span>
                </div>
              </div>

              <button type="submit" className="submit-btn">Submit Password Info</button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;