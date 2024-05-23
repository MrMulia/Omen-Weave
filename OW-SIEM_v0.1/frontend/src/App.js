import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import System from './components/System';
import Network from './components/Network';
import Alerts from './components/Alerts';
import Timeline from './components/Timeline';
import OwlScore from './components/OwlScore';
import TopNotableSources from './components/TopNotableSources';
import ShaDetections from './components/ShaDetections';
import ThreatHuntingLeads from './components/ThreatHuntingLeads';
import TrafficDistribution from './components/TrafficDistribution';
import DetectionSeverity from './components/DetectionSeverity';
import ThreatIntelligence from './components/ThreatIntelligence';
import RecentDetections from './components/RecentDetections';
import './index.css';

function App() {
  const [isLoggedIn, setIsLoggedIn] = React.useState(false);

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  return (
    <Router>
      <Routes>
        {!isLoggedIn && <Route path="/login" element={<Login onLogin={handleLogin} />} />}
        {!isLoggedIn && <Route path="*" element={<Navigate to="/login" />} />}
        {isLoggedIn && <Route path="/dashboard" element={<Dashboard />} />}
        {isLoggedIn && <Route path="/system" element={<System />} />}
        {isLoggedIn && <Route path="/network" element={<Network />} />}
        {isLoggedIn && <Route path="/alerts" element={<Alerts />} />}
        {isLoggedIn && <Route path="/timeline" element={<Timeline />} />}
        {isLoggedIn && <Route path="/owl-score" element={<OwlScore />} />}
        {isLoggedIn && <Route path="/top-notable-sources" element={<TopNotableSources />} />}
        {isLoggedIn && <Route path="/sha-detections" element={<ShaDetections />} />}
        {isLoggedIn && <Route path="/threat-hunting-leads" element={<ThreatHuntingLeads />} />}
        {isLoggedIn && <Route path="/traffic-distribution" element={<TrafficDistribution />} />}
        {isLoggedIn && <Route path="/detection-severity" element={<DetectionSeverity />} />}
        {isLoggedIn && <Route path="/threat-intelligence" element={<ThreatIntelligence />} />}
        {isLoggedIn && <Route path="/recent-detections" element={<RecentDetections />} />}
        {isLoggedIn && <Route path="/detections" element={<Navigate to="/dashboard" />} />}
        {isLoggedIn && <Route path="*" element={<Navigate to="/dashboard" />} />}
      </Routes>
    </Router>
  );
}

export default App;
