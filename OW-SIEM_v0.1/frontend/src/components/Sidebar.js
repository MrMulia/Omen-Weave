// src/components/Sidebar.js
import React from 'react';
import './Sidebar.css';

function Sidebar({ isOpen, onClose }) {
    return (
        <div className={`sidebar ${isOpen ? 'open' : ''}`}>
            <button className="close-btn" onClick={onClose}>X</button>
            <ul>
                <li><a href="#">Dashboard</a></li>
                <li><a href="#">Assets</a></li>
                <li><a href="#">Accounts</a></li>
                <li><a href="#">Applications</a></li>
                <li><a href="#">Investigate</a></li>
                <li><a href="#">Reports</a></li>
                <li><a href="#">Settings</a></li>
            </ul>
        </div>
    );
}

export default Sidebar;
