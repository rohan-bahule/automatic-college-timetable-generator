import React from 'react';
import { 
  Sparkles, ArrowRight, Layers, Users, 
  CalendarDays, Cpu 
} from 'lucide-react';
import Button from '../common/Button';
import Badge from '../common/Badge';
import './LandingHero.css';

export default function LandingHero({ onNavigate }) {
  const features = [
    { label: 'Automated scheduling', icon: Cpu },
    { label: 'Room & faculty management', icon: Users },
    { label: 'Constraint-based generation', icon: Layers },
    { label: 'Monday–Friday scheduling', icon: CalendarDays }
  ];

  return (
    <section className="landing-hero" aria-labelledby="hero-title">
      <div className="container hero-container">
        <div className="hero-content">
          <div className="hero-badge-container">
            <Badge variant="orange" icon={Sparkles}>
              Automated Academic Scheduling System
            </Badge>
          </div>

          <h1 id="hero-title" className="hero-title">
            College Timetable <br />
            <span>Generator</span>
          </h1>

          <p className="hero-subtitle">
            Automate your institution's scheduling with conflict-free allocation across divisions, 
            lab batches, lecture halls, and faculty constraints — featuring safe drag-and-drop editing, 
            immutable revisions, and high-fidelity PDF/Print exports.
          </p>

          <div className="hero-features-grid" role="list">
            {features.map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <div key={idx} className="hero-feature-item" role="listitem">
                  <span className="hero-feature-icon" aria-hidden="true">
                    <Icon size={16} />
                  </span>
                  <span>{feat.label}</span>
                </div>
              );
            })}
          </div>

          <div className="hero-cta-group">
            <Button
              variant="primary"
              size="lg"
              icon={Sparkles}
              onClick={() => onNavigate('generate')}
              aria-label="Navigate to Generate Timetable"
            >
              Generate Timetable
            </Button>

            <Button
              variant="outline-light"
              size="lg"
              icon={ArrowRight}
              iconPosition="right"
              onClick={() => onNavigate('data-entry')}
              aria-label="Navigate to Manage Data"
            >
              Manage Data
            </Button>

            <Button
              variant="outline-light"
              size="lg"
              icon={CalendarDays}
              onClick={() => onNavigate('timetable')}
              aria-label="Navigate to View Timetable"
            >
              View Timetable
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
