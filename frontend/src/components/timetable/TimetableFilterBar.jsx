import React from 'react';
import { Filter, Users, GraduationCap, DoorOpen, Layers } from 'lucide-react';
import './TimetableViewer.css';

export default function TimetableFilterBar({
  viewType,
  onViewTypeChange,
  filterId,
  onFilterIdChange,
  metadata
}) {
  const getFilterIcon = () => {
    switch (viewType) {
      case 'Division': return GraduationCap;
      case 'Instructor': return Users;
      case 'Room': return DoorOpen;
      case 'Batch': return Layers;
      default: return Filter;
    }
  };

  const Icon = getFilterIcon();

  // Determine current option list based on viewType
  const getEntityOptions = () => {
    if (!metadata) return [];
    switch (viewType) {
      case 'Division':
        return (metadata.divisions || []).map(d => ({ id: d.id, label: d.name }));
      case 'Instructor':
        return (metadata.instructors || []).map(i => ({ id: i.id, label: i.name }));
      case 'Room':
        return (metadata.rooms || []).map(r => ({ id: r.id, label: `${r.number} (${r.roomType})` }));
      case 'Batch':
        return (metadata.batches || []).map(b => ({ id: b.id, label: `Batch ${b.name}` }));
      default:
        return [];
    }
  };

  const options = getEntityOptions();

  return (
    <div className="filter-toolbar-card" data-testid="timetable-filter-bar">
      <div className="filter-group">
        {/* View Type Selector */}
        <div className="filter-control">
          <label htmlFor="view-type-select" className="filter-label">View By</label>
          <select
            id="view-type-select"
            data-testid="view-type-select"
            className="filter-select"
            value={viewType}
            onChange={(e) => onViewTypeChange(e.target.value)}
          >
            <option value="Division">Division / Class</option>
            <option value="Instructor">Instructor / Faculty</option>
            <option value="Room">Room / Lab</option>
            <option value="Batch">Practical Batch</option>
          </select>
        </div>

        {/* Dynamic Human-Readable Entity Dropdown */}
        <div className="filter-control">
          <label htmlFor="entity-select" className="filter-label">Select {viewType}</label>
          <select
            id="entity-select"
            data-testid="entity-select"
            className="filter-select"
            value={filterId}
            onChange={(e) => onFilterIdChange(e.target.value)}
          >
            {options.length === 0 ? (
              <option value="">Loading options...</option>
            ) : (
              options.map(opt => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))
            )}
          </select>
        </div>
      </div>

      <div className="active-filter-badge">
        <Icon size={16} />
        <span>Active View: {viewType} {options.find(o => String(o.id) === String(filterId))?.label || ''}</span>
      </div>
    </div>
  );
}
