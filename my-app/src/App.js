import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import ForgotPassword from './components/ForgotPassword';
import Dashboard from './components/Dashboard';
import Profile from './components/Profile';
import Control from './components/Control';
import Chat from './components/Chat';
import { UserProvider } from "./UserContext";
import { isAuthenticated } from './utils/auth';

function App() {
  return (
    <UserProvider>
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword/>} />
        <Route path="/dashboard" element={isAuthenticated() ? <Dashboard /> : <Navigate to="/login" />}/>
        <Route path="/devices" element={isAuthenticated() ? <Control /> : <Navigate to="/login" />}/>
        <Route path="/chat" element={isAuthenticated() ? <Chat /> : <Navigate to="/login" />}/>
        <Route path="/edit-profile" element={isAuthenticated() ? <Profile /> : <Navigate to="/login" />}/>
      </Routes>
    </Router>
    </UserProvider>
  );
}

export default App;
