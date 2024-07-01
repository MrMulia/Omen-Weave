// src/components/Network.js
import React, { useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import '../index.css';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const Network = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [entropyData, setEntropyData] = useState([]);
  const [entropyLabels, setEntropyLabels] = useState([]);
  const [uniqueSrcData, setUniqueSrcData] = useState([]);
  const [uniqueDstData, setUniqueDstData] = useState([]);
  const [ipLabels, setIpLabels] = useState([]);
  const [importantPortsData, setImportantPortsData] = useState({});
  const [topSourceIPs, setTopSourceIPs] = useState([]);
  const [topDestinationIPs, setTopDestinationIPs] = useState([]);
  const [numHosts, setNumHosts] = useState(0);

  useEffect(() => {
    const ws = new WebSocket('ws://192.168.37.152:5001/ws');

    ws.onopen = () => {
      console.log('WebSocket connection opened');
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('Received data:', data);

      if (data.entropy !== undefined) {
        setEntropyData(prevData => {
          const newData = [...prevData, data.entropy];
          return newData.length > 6 ? newData.slice(1) : newData;
        });
        setEntropyLabels(prevLabels => {
          const newLabels = [...prevLabels, new Date().toLocaleTimeString()];
          return newLabels.length > 6 ? newLabels.slice(1) : newLabels;
        });
      }

      if (data.unique_src_ips !== undefined) {
        setUniqueSrcData(prevData => {
          const newData = [...prevData, data.unique_src_ips];
          return newData.length > 6 ? newData.slice(1) : newData;
        });
        setIpLabels(prevLabels => {
          const newLabels = [...prevLabels, new Date().toLocaleTimeString()];
          return newLabels.length > 6 ? newLabels.slice(1) : newLabels;
        });
      }

      if (data.unique_dst_ips !== undefined) {
        setUniqueDstData(prevData => {
          const newData = [...prevData, data.unique_dst_ips];
          return newData.length > 6 ? newData.slice(1) : newData;
        });
      }

      if (data.important_ports !== undefined) {
        setImportantPortsData(prevData => {
          const newData = { ...prevData };
          Object.keys(data.important_ports).forEach(port => {
            newData[port] = (newData[port] || []).concat(data.important_ports[port]);
            if (newData[port].length > 6) {
              newData[port] = newData[port].slice(1);
            }
          });
          return newData;
        });
      }

      if (data.topSourceIPs !== undefined) {
        setTopSourceIPs(data.topSourceIPs);
      }

      if (data.topDestinationIPs !== undefined) {
        setTopDestinationIPs(data.topDestinationIPs);
      }

      if (data.num_hosts !== undefined) {
        setNumHosts(data.num_hosts);
      }
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

  const importantPortsChartData = {
    labels: ipLabels,
    datasets: Object.keys(importantPortsData).map(port => ({
      label: `Port ${port}`,
      data: importantPortsData[port],
      borderColor: getColorForPort(port),
      borderWidth: 2,
      pointRadius: 0,
      fill: false,
    })),
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
      },
      y: {
        grid: {
          display: false,
        },
        ticks: {
          beginAtZero: true,
        },
      },
    },
  };

  const getColorForPort = (port) => {
    const colors = {
      '22': 'rgba(255, 99, 132, 1)',
      '53': 'rgba(54, 162, 235, 1)',
      '443': 'rgba(75, 192, 192, 1)',
      '23': 'rgba(255, 206, 86, 1)',
      '3389': 'rgba(153, 102, 255, 1)',
      '21': 'rgba(255, 159, 64, 1)',
      '25': 'rgba(199, 199, 199, 1)',
      '80': 'rgba(83, 102, 255, 1)',
      '445': 'rgba(255, 102, 102, 1)',
      '8080': 'rgba(102, 255, 102, 1)',
    };
    return colors[port] || 'rgba(99, 132, 255, 1)';
  };

  return (
    <div>
      <header>
        <div className="logo">
          <a href="#" onClick={() => setIsSidebarOpen(true)}>Omen & Weave</a>
        </div>
        <div className="search-bar">
          <input type="text" placeholder="Search..." />
        </div>
        <div className="user-info">
          <div className="username">Network@MSi</div>
          <div className="name">_Mulia04</div>
        </div>
      </header>
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <div className="dashboard-header">
        <h1>Network Activity</h1>
      </div>
      <div className="dashboard">
        <div id="trafficDistribution" className="module">
          <h2>Traffic Distribution</h2>
          <div className="chart-container">
            <Line data={entropyChartData} options={entropyChartOptions} />
          </div>
        </div>
        <div id="uniqueIPs" className="module">
          <h2>Unique Source and Destination IPs</h2>
          <div className="unique-ips-container">
            <div className="unique-ip">
              <div className="ip-label">Source IPs</div>
              <div className="ip-count">{uniqueSrcData[uniqueSrcData.length - 1] || 0}</div>
            </div>
            <div className="separator">|</div>
            <div className="unique-ip">
              <div className="ip-label">Destination IPs</div>
              <div className="ip-count">{uniqueDstData[uniqueDstData.length - 1] || 0}</div>
            </div>
          </div>
        </div>
        <div id="importantPorts" className="module">
          <h2>Important Ports Activity</h2>
          <div className="chart-container">
            <Line data={importantPortsChartData} options={chartOptions} />
          </div>
        </div>
        <div id="topSourceIPs" className="module">
          <h2>Top Source IPs</h2>
          <ul className="top-ips">
            {topSourceIPs.map((ip, index) => (
              <li key={index}>{ip}</li>
            ))}
          </ul>
        </div>
        <div id="topDestinationIPs" className="module">
          <h2>Top Destination IPs</h2>
          <ul className="top-ips">
            {topDestinationIPs.map((ip, index) => (
              <li key={index}>{ip}</li>
            ))}
          </ul>
        </div>
        <div id="numHosts" className="module">
          <h2>Number of Hosts</h2>
          <div className="host-count">{numHosts}</div>
        </div>
        <div id="placeholderModule" className="module">
          <h2>Placeholder for Future Metrics</h2>
          <p>To be determined (no metrics yet)</p>
        </div>
      </div>
    </div>
  );
};

export default Network;
