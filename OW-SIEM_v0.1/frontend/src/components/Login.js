// src/components/Login.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';

function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [authCode, setAuthCode] = useState('');
    const navigate = useNavigate();

    const handleLogin = (e) => {
        e.preventDefault();
        // Mock authentication logic
        if (email === 'user@example.com' && password === 'password' && authCode === '123456') {
            navigate('/dashboard');
        } else {
            alert('Invalid credentials');
        }
    };

    return (
        <div className="login-container">
            <form className="login-form" onSubmit={handleLogin}>
                <img src="/logo.png" alt="Logo" className="logo" />
                <div className="input-group">
                    <label htmlFor="email">Email</label>
                    <input type="email" id="email" name="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="input-group">
                    <label htmlFor="password">Password</label>
                    <input type="password" id="password" name="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
                <div className="input-group">
                    <label htmlFor="2fa">Two-Factor Authentication Code</label>
                    <input type="text" id="2fa" name="2fa" value={authCode} onChange={(e) => setAuthCode(e.target.value)} required />
                </div>
                <button type="submit" className="login-button">Log In</button>
                <div className="login-footer">
                    <a href="#">Privacy Notice</a>
                    <a href="#">Reset Password</a>
                    <a href="#">Help</a>
                </div>
            </form>
        </div>
    );
}

export default Login;
