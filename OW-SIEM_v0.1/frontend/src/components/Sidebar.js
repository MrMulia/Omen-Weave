import React from 'react';
import { Link } from 'react-router-dom';
import './Sidebar.css';

function Sidebar({ isOpen, onClose }) {
    return (
        <div className={`sidebar ${isOpen ? 'open' : ''}`}>
            <button className="close-btn" onClick={onClose}>X</button>
            <ul>
                <li>
                    <Link to="#">Dashboard</Link>
                    <ul>
                        <li><Link to="/dashboard">Detections</Link></li>
                        <li><Link to="/network">Network</Link></li>
                        <li><Link to="/system">System</Link></li>
                    </ul>
                </li>
                <li><Link to="/alerts">Alerts</Link></li>
                <li><Link to="#">Assets</Link></li>
                <li><Link to="/timeline">Timeline</Link></li>
                <li><Link to="#">Applications</Link></li>
                <li><Link to="#">Investigate</Link></li>
                <li><Link to="#">Reports</Link></li>
                <li><Link to="#">Accounts</Link></li>
                <li><Link to="#">Settings</Link></li>
            </ul>
        </div>
    );
}

export default Sidebar;
