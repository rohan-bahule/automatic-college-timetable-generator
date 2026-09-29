import React, { useState } from 'react';
import { Calendar, Home, Database, TableProperties, Sparkles, Menu, X } from 'lucide-react';
import Button from '../common/Button';
import './Navbar.css';

export default function Navbar({ activePage, onNavigate }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavClick = (pageId) => {
    onNavigate(pageId);
    setMobileMenuOpen(false);
  };

  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'data-entry', label: 'Data Entry', icon: Database },
    { id: 'timetable', label: 'Timetable', icon: TableProperties },
  ];

  return (
    <header className="navbar-header" role="banner">
      <div className="container navbar-container">
        {/* Brand Logo */}
        <div 
          className="brand-link" 
          onClick={() => handleNavClick('home')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && handleNavClick('home')}
          aria-label="TimetableGen Home"
        >
          <div className="brand-icon-wrapper" aria-hidden="true">
            <Calendar size={22} strokeWidth={2.5} />
          </div>
          <div className="brand-title-group">
            <span className="brand-name">
              Timetable<span>Gen</span>
            </span>
            <span className="brand-tagline">College Scheduling System</span>
          </div>
        </div>

        {/* Mobile Hamburger Button */}
        <button
          className="mobile-menu-toggle"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* Navigation Links */}
        <nav 
          className={`nav-menu ${mobileMenuOpen ? 'open' : ''}`}
          role="navigation"
          aria-label="Main Navigation"
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                data-testid={`nav-${item.id}`}
                className={`nav-link-btn ${isActive ? 'active' : ''}`}
                onClick={() => handleNavClick(item.id)}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon size={17} aria-hidden="true" />
                <span>{item.label}</span>
              </button>
            );
          })}

          {/* Prominent Generate CTA Button */}
          <div className="nav-generate-btn">
            <Button
              variant="primary"
              size="md"
              icon={Sparkles}
              data-testid="nav-generate"
              onClick={() => handleNavClick('generate')}
              className={activePage === 'generate' ? 'active-generate' : ''}
              aria-label="Generate Timetable"
            >
              Generate
            </Button>
          </div>
        </nav>
      </div>
    </header>
  );
}
