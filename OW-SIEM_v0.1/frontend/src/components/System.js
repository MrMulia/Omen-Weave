// src/components/System.js
import React, { useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import '../index.css';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const System = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [cpuData, setCpuData] = useState([]);
  const [memoryData, setMemoryData] = useState([]);
  const [labels, setLabels] = useState([]);

  useEffect(() => {
    const ws = new WebSocket('ws://192.168.37.152:5001/ws');

    ws.onopen = () => {
      console.log('WebSocket connection opened');
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('Received data:', data);

      if (data.cpu_usage !== undefined && data.memory_usage !== undefined) {
        setCpuData(prevData => {
          const newData = [...prevData, data.cpu_usage];
          return newData.length > 6 ? newData.slice(1) : newData;
        });
        setMemoryData(prevData => {
          const newData = [...prevData, data.memory_usage];
          return newData.length > 6 ? newData.slice(1) : newData;
        });
        setLabels(prevLabels => {
          const newLabels = [...prevLabels, new Date().toLocaleTimeString()];
          return newLabels.length > 6 ? newLabels.slice(1) : newLabels;
        });
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

  const chartData = {
    labels: labels,
    datasets: [
      {
        label: 'CPU Usage',
        data: cpuData,
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 2,
        pointRadius: 0,
        fill: false,
      },
      {
        label: 'Memory Usage',
        data: memoryData,
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 2,
        pointRadius: 0,
        fill: false,
      },
    ],
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
        min: 0,
        max: 100,
        ticks: {
          stepSize: 20,
        },
      },
    },
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
          <div className="username">System@MSi</div>
          <div className="name">_Mulia04</div>
        </div>
      </header>
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <div className="dashboard-header">
        <h1>System Performance</h1>
      </div>
      <div className="dashboard">
        <div className="module">
          <h2>CPU & Memory Usage</h2>
          <div className="chart-container">
            <Line data={chartData} options={chartOptions} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default System;
