import React, { useState } from 'react';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import Home from './pages/Home';
import DataEntry from './pages/DataEntry';
import Generate from './pages/Generate';
import Timetable from './pages/Timetable';
import './App.css';

export default function App() {
  const [activePage, setActivePage] = useState('home');
  const [selectedRunId, setSelectedRunId] = useState(null);

  const handleNavigate = (pageId) => {
    setActivePage(pageId);
    if (typeof window !== 'undefined' && window.scrollTo) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleTimetableGenerated = (newRunId) => {
    setSelectedRunId(newRunId);
  };

  const renderActivePage = () => {
    switch (activePage) {
      case 'home':
        return <Home onNavigate={handleNavigate} />;
      case 'data-entry':
        return <DataEntry onNavigate={handleNavigate} />;
      case 'generate':
        return (
          <Generate 
            onNavigate={handleNavigate} 
            onTimetableGenerated={handleTimetableGenerated} 
          />
        );
      case 'timetable':
        return (
          <Timetable 
            selectedRunId={selectedRunId} 
            onNavigate={handleNavigate} 
          />
        );
      default:
        return <Home onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="app-layout">
      <Navbar activePage={activePage} onNavigate={handleNavigate} />
      <div className="app-content-area">
        {renderActivePage()}
      </div>
      <Footer />
    </div>
  );
}
