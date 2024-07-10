import React, { useEffect, useState } from 'react';
import { Line, Bar } from 'react-chartjs-2';
// import OWLogo from './ow-logo.png';
import Sidebar from './Sidebar';
import '../index.css';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

const Dashboard = () => {
  const [scoreData, setScoreData] = useState([]);
  const [severityData, setSeverityData] = useState([0, 0, 0, 0]);
  const [entropyData, setEntropyData] = useState([]);
  const [entropyLabels, setEntropyLabels] = useState([]);
  const [scoreLabels, setScoreLabels] = useState([]);
  const [topNotableSources, setTopNotableSources] = useState([]);
  const [recentDetections, setRecentDetections] = useState([]);
  const [shaDetections, setShaDetections] = useState([]);
  const [threatHuntingLeads, setThreatHuntingLeads] = useState({ investigated: 0, generated: 0 });
  const [threatIntelligence, setThreatIntelligence] = useState([]);
  const [alertColor, setAlertColor] = useState('#606060');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showDetailBox, setShowDetailBox] = useState(false);
  const [detailBoxContent, setDetailBoxContent] = useState({ title: '', content: '' });

  useEffect(() => {
    const ws = new WebSocket('ws://192.168.37.152:5001/ws');

    ws.onopen = () => {
      console.log('WebSocket connection opened');
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('Received data:', data);

      setAlertColor(getAlertColor(data.network_alert));
      updateRealtimeChart(data.entropy || -1);
      setTopNotableSources(data.top_notable_sources || []);
      setSeverityData(data.detection_severity || [0, 0, 0, 0]);
      updateScoreChart(data.current_score || 0);
      setRecentDetections(data.most_recent_detections || []);
      setShaDetections(data.sha_detections || []);
      setThreatHuntingLeads({
        investigated: data.threat_hunting_leads_investigated || 0,
        generated: data.threat_hunting_leads_generated || 0,
      });
      setThreatIntelligence(data.threat_intelligence || []);
    };

    ws.onclose = () => {
      console.log('WebSocket connection closed');
    };

    ws.onerror = (error) => {
      console.log('WebSocket error:', error);
    };

    return () => {
      ws.close();
    };
  }, []);

  const getAlertColor = (level) => {
    switch (level) {
      case 'Fetching Data':
        return '#606060';
      case 'Low':
        return '#008000';
      case 'Medium':
        return '#FFA500';
      case 'High':
        return '#FF4500';
      case 'HIGH ALERT!':
        return '#B22222';
      default:
        return '#606060';
    }
  };

  const updateRealtimeChart = (value) => {
    if (value !== -1) {
      setEntropyData((prevData) => {
        const newData = [...prevData, value];
        return newData.length > 6 ? newData.slice(1) : newData;
      });
      setEntropyLabels((prevLabels) => {
        const newLabels = [...prevLabels, new Date().toLocaleTimeString()];
        return newLabels.length > 6 ? newLabels.slice(1) : newLabels;
      });
    }
  };

  const updateScoreChart = (score) => {
    if (score !== 0) {
      setScoreData((prevData) => {
        const newData = [...prevData, score];
        return newData.length > 6 ? newData.slice(1) : newData;
      });
      setScoreLabels((prevLabels) => {
        const newLabels = [...prevLabels, new Date().toLocaleTimeString()];
        return newLabels.length > 6 ? newLabels.slice(1) : newLabels;
      });
    }
  };

  const handleModuleClick = (content) => {
    setDetailBoxContent(content);
    setShowDetailBox(true);
  };

  const handleCloseDetailBox = () => {
    setShowDetailBox(false);
  };

  const scoreChartData = {
    labels: scoreLabels,
    datasets: [
      {
        label: 'Current Score',
        data: scoreData,
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 2,
        pointRadius: 0,
        fill: false,
      },
    ],
  };

  const severityChartData = {
    labels: ['Low', 'Medium', 'High', 'Critical'],
    datasets: [
      {
        label: 'Detections by Severity',
        data: severityData,
        backgroundColor: [
          'rgba(0, 0, 255, 0.75)',
          'rgba(255, 165, 0, 0.75)',
          'rgba(255, 69, 0, 0.75)',
          'rgba(255, 0, 0, 0.75)',
        ],
        borderColor: [
          'rgba(0, 0, 255, 0.5)',
          'rgba(255, 165, 0, 0.5)',
          'rgba(255, 69, 0, 0.5)',
          'rgba(255, 0, 0, 0.5)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const entropyChartData = {
    labels: entropyLabels,
    datasets: [
      {
        label: 'Traffic Distribution',
        data: entropyData,
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
        borderColor: 'rgba(0, 0, 139, 1)',
        borderWidth: 2,
        pointRadius: 0,
        fill: false,
      },
    ],
  };

  const scoreChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false, // Hide legend
      },
    },
    scales: {
      x: {
        grid: {
          display: false, // Hide X grid lines
        },
      },
      y: {
        grid: {
          display: false, // Hide Y grid lines
        },
        min: 0,
        max: 100,
        ticks: {
          stepSize: 20, // Set the step size for y-axis
        },
      },
    },
  };

  const entropyChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false, // Hide legend
      },
    },
    scales: {
      x: {
        grid: {
          display: false, // Hide X grid lines
        },
      },
      y: {
        grid: {
          display: false, // Hide Y grid lines except for -1
          drawTicks: true,
          color: (context) => (context.tick.value === -1 ? 'red' : 'rgba(0, 0, 0, 0)'), // Red grid line for -1
        },
        min: -1,
        max: 100,
        ticks: {
          stepSize: 20, // Set the step size for y-axis
          callback: (value) => (value === -1 ? '-1' : value), // Show -1 as a tick value
        },
      },
    },
  };

  const severityChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false, // Hide legend
      },
    },
    scales: {
      x: {
        grid: {
          display: false, // Hide X grid lines
        },
      },
      y: {
        grid: {
          display: false, // Hide Y grid lines
        },
        min: 0,
        max: 400,
        ticks: {
          stepSize: 100, // Set the step size for y-axis
        },
      },
    },
  };

  return (
    <div>
      <header>
        <div className="logo">
          <a href="#" onClick={() => setIsSidebarOpen(true)}>
          {/* <img src={OWLogo} alt="Omen & Weave Logo" style={{ height: '30px', width: '30px' }} /> */} Omen & Weave
          </a>
        </div>
        <div className="search-bar">
          <input type="text" placeholder="Search..." />
        </div>
        <div className="user-info">
          <div className="username">Dashboard@MSi</div>
          <div className="name">_Mulia04</div>
        </div>
      </header>
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <div className="dashboard-header">
        <h1>Detections Dashboard</h1>
        <div id="networkStatus" className="circle" style={{ backgroundColor: alertColor }}></div>
      </div>
      <div className={`dashboard ${showDetailBox ? 'dimmed' : ''}`}>
        <div className="module" id="currentScore" onClick={() => handleModuleClick({ title: 'Current OWL Score', content: 'Detailed OWL Score information.' })}>
          <div className="header-container">
            <h2>Current OWL Score</h2>
            <div className="score-value">
              {Math.round(scoreData[scoreData.length - 1])} / <span className="total-score">100</span>
            </div>
          </div>
          <div className="chart-container">
            <Line data={scoreChartData} options={scoreChartOptions} />
          </div>
        </div>
        <div className="module" id="topNotableSources" onClick={() => handleModuleClick({ title: 'Top Notable Sources', content: 'Detailed notable sources information.' })}>
          <h2>Top Notable Sources</h2>
          <ul>
            {topNotableSources.map((source, index) => (
              <li key={index}>{source}</li>
            ))}
          </ul>
        </div>
        <div className="module" id="shaDetections" onClick={() => handleModuleClick({ title: 'SHA-based Detections', content: 'Detailed SHA-based detections information.' })}>
          <h2>SHA-based Detections</h2>
          <ul>
            {shaDetections.map((detection, index) => (
              <li key={index}>{detection}</li>
            ))}
          </ul>
        </div>
        <div className="module" id="threatHuntingLeads" onClick={() => handleModuleClick({ title: 'Threat Hunting Leads', content: 'Detailed threat hunting leads information.' })}>
          <h2>Threat Hunting Leads</h2>
          <div className="threat-leads">
            <div>Investigated / Generated:</div>
            <div className="investigated-count">{threatHuntingLeads.investigated} / <span className="generated-count">{threatHuntingLeads.generated}</span></div>
          </div>
        </div>
        <div className="module" id="trafficDistribution" onClick={() => handleModuleClick({ title: 'Traffic Distribution', content: 'Detailed traffic distribution information.' })}>
          <h2>Traffic Distribution</h2>
          <div className="chart-container">
            <Line data={entropyChartData} options={entropyChartOptions} />
          </div>
        </div>
        <div className="module" id="detectionSeverity" onClick={() => handleModuleClick({ title: 'Detections by Severity', content: 'Detailed detections by severity information.' })}>
          <h2>Detections by Severity</h2>
          <div className="chart-container">
            <Bar data={severityChartData} options={severityChartOptions} />
          </div>
        </div>
        <div className="module" id="threatIntelligence" onClick={() => handleModuleClick({ title: 'Threat Intelligence', content: 'Detailed threat intelligence information.' })}>
          <h2>Threat Intelligence</h2>
          <ul>
            {threatIntelligence.map((intelligence, index) => (
              <li key={index}>{intelligence}</li>
            ))}
          </ul>
        </div>
        <div className="module" id="recentDetections" onClick={() => handleModuleClick({ title: 'Most Recent Detections', content: 'Detailed most recent detections information.' })}>
          <h2>Most Recent Detections</h2>
          <ul>
            {recentDetections.map((detection, index) => (
              <li key={index}>{detection}</li>
            ))}
          </ul>
        </div>
      </div>
      {showDetailBox && (
        <div className="detail-box-overlay">
          <div className="detail-box">
            <div className="detail-box-header">
              <h2>{detailBoxContent.title}</h2>
              <button onClick={handleCloseDetailBox} className="close-button">X</button>
            </div>
            <div className="detail-box-content">
              {detailBoxContent.content}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
