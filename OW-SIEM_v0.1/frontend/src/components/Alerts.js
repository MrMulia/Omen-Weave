import React, { useState, useEffect } from 'react';
import OWLogo from './ow-logo.png';
import Sidebar from './Sidebar';
import '../index.css';

const Alerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Sample alerts data for demonstration
  const sampleAlerts = [
    { id: 1, message: "Unauthorized access detected", severity: "High" },
    { id: 2, message: "Suspicious activity on port 22", severity: "Medium" },
  ];

  useEffect(() => {
    // Fetch alerts data from the backend (replace sampleAlerts with actual fetch call)
    setAlerts(sampleAlerts);
  }, []);

  return (
    <div>
      <header>
        <div className="logo">
          <a href="#" onClick={() => setIsSidebarOpen(true)}>
            <img src={OWLogo} alt="Omen & Weave Logo" style={{ height: '30px', width: '30px' }} /> Omen & Weave
          </a>
        </div>
        <div className="search-bar">
          <input type="text" placeholder="Search..." />
        </div>
        <div className="user-info">
          <div className="username">Alerts@MSi</div>
          <div className="name">_Mulia04</div>
        </div>
      </header>
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <div className="alerts-header">
        <h1>Alerts</h1>
      </div>
      <div className="alerts">
        {alerts.map(alert => (
          <div key={alert.id} className={`alert ${alert.severity.toLowerCase()}`}>
            <h2>{alert.message}</h2>
            <p>Severity: {alert.severity}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Alerts;
