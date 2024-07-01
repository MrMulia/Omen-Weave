import React, { useState, useEffect } from 'react';
import OWLogo from './ow-logo.png';
import Sidebar from './Sidebar';
import '../index.css';

const Timeline = () => {
  const [events, setEvents] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Sample timeline events for demonstration
  const sampleEvents = [
    { id: 1, time: "10:00 AM", event: "System boot" },
    { id: 2, time: "10:30 AM", event: "User login" },
  ];

  useEffect(() => {
    // Fetch timeline events from the backend (replace sampleEvents with actual fetch call)
    setEvents(sampleEvents);
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
          <div className="username">Timeline@MSi</div>
          <div className="name">_Mulia04</div>
        </div>
      </header>
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <div className="timeline-header">
        <h1>Timeline</h1>
      </div>
      <div className="timeline">
        {events.map(event => (
          <div key={event.id} className="event">
            <h2>{event.time}</h2>
            <p>{event.event}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Timeline;
