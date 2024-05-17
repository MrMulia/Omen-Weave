import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import Login from './components/Login'; // Assuming you have a Login component
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
  return (
    <Router>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Login />} />
        <Route path="/owl-score" element={<OwlScore />} />
        <Route path="/top-notable-sources" element={<TopNotableSources />} />
        <Route path="/sha-detections" element={<ShaDetections />} />
        <Route path="/threat-hunting-leads" element={<ThreatHuntingLeads />} />
        <Route path="/traffic-distribution" element={<TrafficDistribution />} />
        <Route path="/detection-severity" element={<DetectionSeverity />} />
        <Route path="/threat-intelligence" element={<ThreatIntelligence />} />
        <Route path="/recent-detections" element={<RecentDetections />} />
      </Routes>
    </Router>
  );
}

export default App;
