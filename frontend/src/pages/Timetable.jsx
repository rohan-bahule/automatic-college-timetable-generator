import React from 'react';
import TimetableViewer from '../components/timetable/TimetableViewer';
import './TimetablePage.css';

export default function Timetable({ selectedRunId = null, onNavigate }) {
  return (
    <div className="timetable-page container">
      <div className="timetable-page-header">
        <h1 className="page-title">Timetable Schedule Viewer</h1>
        <p className="page-subtitle">
          Review, filter, and inspect generated schedules by student division, faculty instructor, classroom, or lab batch.
        </p>
      </div>

      <TimetableViewer selectedRunId={selectedRunId} onNavigateToGenerate={() => onNavigate('generate')} />
    </div>
  );
}
