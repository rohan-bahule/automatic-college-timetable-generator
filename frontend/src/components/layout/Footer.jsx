import React from 'react';
import { Calendar } from 'lucide-react';
import './Footer.css';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer" role="contentinfo">
      <div className="container footer-container">
        <div className="footer-top">
          <div>
            <div className="footer-brand">
              <Calendar size={20} color="var(--accent-orange)" />
              <span>TimetableGen</span>
            </div>
            <p className="footer-desc">
              Automated academic timetable generation & constraint-based scheduling system.
            </p>
          </div>
        </div>

        <div className="footer-bottom">
          <span>&copy; {currentYear} TimetableGen. Academic Scheduling System.</span>
        </div>
      </div>
    </footer>
  );
}
