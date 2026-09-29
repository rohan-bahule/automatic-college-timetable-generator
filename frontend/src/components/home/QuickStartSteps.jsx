import React from 'react';
import { 
  Building2, 
  GraduationCap, 
  Users, 
  UserCheck, 
  DoorOpen, 
  BookOpen, 
  Clock, 
  CalendarRange,
  CheckCircle
} from 'lucide-react';
import './QuickStartSteps.css';

export default function QuickStartSteps() {
  const steps = [
    {
      num: 1,
      title: 'Department',
      desc: 'Add your department information.',
      icon: Building2
    },
    {
      num: 2,
      title: 'Divisions',
      desc: 'Add student divisions.',
      icon: GraduationCap
    },
    {
      num: 3,
      title: 'Batches',
      desc: 'Configure practical/lab batches.',
      icon: Users
    },
    {
      num: 4,
      title: 'Instructors',
      desc: 'Add faculty and course eligibility.',
      icon: UserCheck
    },
    {
      num: 5,
      title: 'Rooms',
      desc: 'Configure lecture halls and labs.',
      icon: DoorOpen
    },
    {
      num: 6,
      title: 'Courses',
      desc: 'Add lecture and laboratory courses.',
      icon: BookOpen
    },
    {
      num: 7,
      title: 'Timings',
      desc: 'Configure available meeting times.',
      icon: Clock
    },
    {
      num: 8,
      title: 'Sections',
      desc: 'Define courses and sessions required per week.',
      icon: CalendarRange
    }
  ];

  return (
    <section className="quickstart-section" aria-labelledby="quickstart-heading">
      <div className="container">
        <div className="section-header">
          <h2 id="quickstart-heading" className="section-title">
            Get Started in 8 Easy Steps
          </h2>
          <p className="section-subtitle">
            Configure your academic data and generate your timetable.
          </p>
        </div>

        <div className="steps-grid" role="list">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div key={step.num} className="step-card" role="listitem">
                <div className="step-card-top">
                  <div className="step-icon-wrapper" aria-hidden="true">
                    <Icon size={22} />
                  </div>
                  <span className="step-number-badge">Step {step.num}</span>
                </div>
                <h3 className="step-card-title">{step.title}</h3>
                <p className="step-card-desc">{step.desc}</p>
                <div className="step-card-status">
                  <CheckCircle size={14} color="var(--status-success)" />
                  <span>Configurable in Data Entry</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
