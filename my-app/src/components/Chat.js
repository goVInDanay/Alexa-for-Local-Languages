import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import "./Chat.css";

function Chat() {
  const defaultImg = "https://th.bing.com/th/id/OIP.dCpgPQ0i-xX2gZ-yonm54gHaHa?w=207&h=207&c=7&r=0&o=5&dpr=1.4&pid=1.7";
  const [profilePicture, setProfilePicture] = useState(defaultImg);
  const location = useLocation();
  const [recordingStatus, setRecordingStatus] = useState("");
  const [username, setUsername] = useState("");
  const [showProfileOptions, setShowProfileOptions] = useState(false);
  const [showFeedbackOverlay, setShowFeedbackOverlay] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [text, setText] = useState("");
  const [processedText, setProcessedText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [language, setLanguage] = useState("en-US"); // Default language is English
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioRef = useRef(null);

  useEffect(() => {
    const storedUsername = localStorage.getItem("username");
    if (storedUsername) {
        const name = localStorage.getItem('username').split(' ')
        const firstName = name[0];
        setUsername(firstName);
    }
    const storedProfilePicture = localStorage.getItem("pic");
    console.log(storedProfilePicture)
    if (storedProfilePicture) {
      setProfilePicture(storedProfilePicture); // Set profile picture from localStorage
    }

    // Fetch username from localStorage or API
    const name = localStorage.getItem('username').split(' ')
    const firstName = name[0];
    console.log(firstName)
    setUsername(firstName);
  }, []);

  const handleProfileClick = () => setShowProfileOptions(!showProfileOptions);
  const handleOutsideClick = () => setShowProfileOptions(false);
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
  const handleLanguageChange = (e) => {
    setLanguage(e.target.value); // Update selected language
  };

  const handleStartRecording = () => {
    setRecordingStatus("Recording...");
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then((stream) => {
          mediaRecorderRef.current = new MediaRecorder(stream);
          mediaRecorderRef.current.ondataavailable = (event) => {
            audioChunksRef.current.push(event.data);
          };
          mediaRecorderRef.current.onstop = handleAudioStop;
          mediaRecorderRef.current.start();
          setIsRecording(true);
          console.log("Recording started...");
        })
        .catch((error) => {
          console.error("Error accessing microphone:", error);
          alert("Microphone access denied.");
        });
    }
  };

  const handleStopRecording = () => {
    setRecordingStatus("Recording Stopped");
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      console.log("Recording stopped.");
    }
  };

  const handleAudioStop = () => {
    const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" });
    audioChunksRef.current = [];
    handleUploadAudio(audioBlob);
  };

  const handleUploadAudio = async (audioBlob) => {
    const formData = new FormData();
    formData.append("audio", audioBlob, "recording.wav");
    formData.append("languageCode", language); // Send selected language

    try {
      const response = await fetch("http://localhost:5000/upload-audio", {
        method: "POST",
        body: formData,
      });
      const result = await response.json();
      setText(result.text); // Display transcription
    } catch (error) {
      console.error('Error during transcription:', error);
      console.error("Error uploading audio:", error);
      alert("Failed to transcribe audio.");
    }
  };

  const handleSaveText = async () => {
  setProcessedText("");

  try {
    const token = localStorage.getItem("jwt");
    const response = await fetch("/save-transcript", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ transcript: text, language: language, mode: "chat" }),
    });

    if (response.ok) {
      const result = await response.json();
      // console.log("Response data:", result); // Debug response

      setProcessedText(result.processedText);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      const audioBlob = base64ToBlob(result.audioContent, "audio/mp3");
      const audioUrl = URL.createObjectURL(audioBlob);
      // Play the audio
      audioRef.current = new Audio(audioUrl);
      audioRef.current.play();
    } else {
      console.error("Error saving text");
      alert("Failed to save text.");
    }
  } catch (error) {
    console.error("Error in saveText:", error);
  }

  function base64ToBlob(base64, mime) {
    // Clean up base64 if it has a prefix like 'data:audio/mp3;base64,'
    const byteString = atob(base64);
    const arrayBuffer = new ArrayBuffer(byteString.length);
    const intArray = new Uint8Array(arrayBuffer);

    for (let i = 0; i < byteString.length; i++) {
        intArray[i] = byteString.charCodeAt(i);
    }

    return new Blob([intArray], { type: mime });
  }
  };


  
  
  return (
    <div className="app" onClick={handleOutsideClick}>
      <header className="navbar">
        <h1 className="hello">Hi, {username}</h1>
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
              <a href="/edit-profile">Edit Profile</a>
              <a href="/logout">Log Out</a>
            </div>
          )}
        </div>
      </header>

      {showFeedbackOverlay && (
        <div className="feedback-overlay" onClick={() => setShowFeedbackOverlay(false)}>
          <div className="feedback-content" onClick={(e) => e.stopPropagation()}>
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

      <main className="chat-main">
        <div className="container">
          <div className="language-select">
            <label htmlFor="language">Select Language:</label>
            <select id="language" onChange={handleLanguageChange} value={language}>
              <option value="en-US">English</option>
              <option value="hi-IN">हिंदी</option>
              <option value="mr-IN">मराठी</option>
              <option value="gu-IN">ગુજરાતી</option>
              <option value="ta-IN">தமிழ்</option>
            </select>
          </div>
          <div className="recording-status">
              {recordingStatus && <p>{recordingStatus}</p>} {/* Display recording status */}
            </div>
          <textarea
            placeholder="Your transcribed text will appear here..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={5}
          />
          <div className="button-container">
            <button className="start-btn" onClick={handleStartRecording} disabled={isRecording}>Start Recording</button>
            <button className="stop-btn" onClick={handleStopRecording} disabled={!isRecording}>Stop Recording</button>
            <button className="save-btn" onClick={handleSaveText}>Save Text</button>
          </div>
          <div className="processed-text">
            <h3>Processed Text:</h3>
            <div>{processedText}</div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Chat;