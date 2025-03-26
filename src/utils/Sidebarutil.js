import React, { useState } from 'react';
import './App.css'; // Assume you have some CSS to handle `open`, `active`, `no-scroll`

function Sidebar() {
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = (e) => {
    e.preventDefault();
    setSidebarOpen(!isSidebarOpen);
    document.body.classList.toggle("no-scroll", !isSidebarOpen);
  };

  return (
    <div>
      <button
        id="hamburger"
        className={isSidebarOpen ? 'active' : ''}
        onClick={toggleSidebar}
      >
        ☰
      </button>

      <nav id="sidebar" className={isSidebarOpen ? 'open' : ''}>
        {/* Sidebar content */}
        <p>Sidebar Menu Items</p>
      </nav>
    </div>
  );
}

export default Sidebar;
