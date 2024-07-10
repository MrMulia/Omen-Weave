import React, { useState, useEffect } from 'react';
// import OWLogo from './ow-logo.png'; // Comment out to temporarily hide the logo
import Sidebar from './Sidebar';
import '../index.css';

const Policies = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Sample policies data for demonstration
  const policies = [
    { id: 1, precedence: 1, status: "Enabled", name: "REDGULFKSA", created: "Jan. 20, 2020", modified: "Jan. 21, 2020", applied: 6, pending: 0 },
    { id: 2, precedence: 2, status: "Enabled", name: "RedingtonGulf", created: "Jun. 23, 2019", modified: "Jan. 14, 2020", applied: 7, pending: 0 },
    { id: 3, precedence: 3, status: "Disabled", name: "i", created: "Jun. 18, 2019", modified: "Jan. 14, 2020", applied: 0, pending: 0 },
    { id: 4, precedence: 4, status: "Enabled", name: "My-test", created: "Mar. 5, 2020", modified: "Mar. 5, 2020", applied: 0, pending: 0 },
    { id: 5, precedence: 0, status: "Enabled", name: "Default (Windows)", created: "May. 16, 2019", modified: "Mar. 8, 2020", applied: 10, pending: 0 },
  ];

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
          <div className="username">Policies@MSi</div>
          <div className="name">_Mulia04</div>
        </div>
      </header>
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <div className="dashboard-header">
        <h1>Prevention Policies</h1>
      </div>
      <div className="policies-header">
        <h2>Policies: {policies.length}</h2>
        <div>
          <button>Create New Policy</button>
          <button>Edit Precedence</button>
        </div>
      </div>
      <table className="policies-table">
        <thead>
          <tr>
            <th>Precedence</th>
            <th>Policy Status</th>
            <th>Policy Name</th>
            <th>Created</th>
            <th>Last Modified</th>
            <th>Applied</th>
            <th>Pending</th>
          </tr>
        </thead>
        <tbody>
          {policies.map(policy => (
            <tr key={policy.id}>
              <td>{policy.precedence}</td>
              <td>{policy.status}</td>
              <td>{policy.name}</td>
              <td>{policy.created}</td>
              <td>{policy.modified}</td>
              <td>{policy.applied}</td>
              <td>{policy.pending}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Policies;
