import React, { useState } from 'react';
import { User, MapPin, Sparkles, FlaskConical, GripVertical, RotateCcw } from 'lucide-react';
import './TimetableViewer.css';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

// Helper to convert time "HH:MM-HH:MM" to sortable minutes
function parseStartMinutes(timeStr) {
  if (!timeStr) return 0;
  const startPart = timeStr.split('-')[0]?.trim();
  if (!startPart) return 0;
  const [hStr, mStr] = startPart.split(':');
  let h = parseInt(hStr, 10) || 0;
  const m = parseInt(mStr, 10) || 0;
  if (h >= 1 && h <= 7) h += 12; // PM shift
  return h * 60 + m;
}

export default function TimetableGrid({ 
  entries = [], 
  meetingTimes = [],
  onEditEntry = null,
  onMoveProposal = null,
  changedEntriesMap = {}
}) {
  const [draggedEntry, setDraggedEntry] = useState(null);
  const [dragOverCell, setDragOverCell] = useState(null); // { day, timeBlock }

  // Extract all distinct time blocks from both meetingTimes lookup and active entries
  const allTimeSource = [
    ...entries.map(e => e.MeetingTime?.time),
    ...meetingTimes.map(m => m.time)
  ].filter(Boolean);

  const uniqueTimeBlocks = [...new Set(allTimeSource)]
    .sort((a, b) => parseStartMinutes(a) - parseStartMinutes(b));

  // Determine slot compatibility for dragging
  const isCellCompatible = (day, timeBlock) => {
    if (!draggedEntry) return false;
    const targetMt = meetingTimes.find(m => m.day === day && m.time === timeBlock);
    const isLab = draggedEntry.Course?.courseType === 'LAB' || Boolean(draggedEntry.Batch);

    // If target meeting time exists, check slotType
    if (targetMt) {
      if (isLab && targetMt.slotType !== 'LAB') return false;
      if (!isLab && targetMt.slotType !== 'LECTURE' && targetMt.slotType !== 'REGULAR') return false;
    }
    return true;
  };

  const handleDragStart = (e, entry) => {
    setDraggedEntry(entry);
    e.dataTransfer.effectAllowed = 'move';
    try {
      e.dataTransfer.setData('text/plain', JSON.stringify({
        entryId: entry.id,
        courseCode: entry.Course?.code,
        day: entry.MeetingTime?.day,
        time: entry.MeetingTime?.time
      }));
    } catch (err) {
      // Ignore if setData fails in test environments
    }
  };

  const handleDragEnd = () => {
    setDraggedEntry(null);
    setDragOverCell(null);
  };

  const handleDragOver = (e, day, timeBlock) => {
    e.preventDefault();
    if (!draggedEntry) return;

    if (isCellCompatible(day, timeBlock)) {
      e.dataTransfer.dropEffect = 'move';
    } else {
      e.dataTransfer.dropEffect = 'none';
    }
  };

  const handleDragEnter = (day, timeBlock) => {
    if (!draggedEntry) return;
    setDragOverCell({ day, timeBlock });
  };

  const handleDragLeave = (day, timeBlock) => {
    if (dragOverCell?.day === day && dragOverCell?.timeBlock === timeBlock) {
      setDragOverCell(null);
    }
  };

  const handleDrop = (e, day, timeBlock) => {
    e.preventDefault();
    setDragOverCell(null);
    if (!draggedEntry || !onMoveProposal) return;

    // Dropped onto same slot
    if (draggedEntry.MeetingTime?.day === day && draggedEntry.MeetingTime?.time === timeBlock) {
      setDraggedEntry(null);
      return;
    }

    // Check slot compatibility
    if (!isCellCompatible(day, timeBlock)) {
      setDraggedEntry(null);
      return;
    }

    // Lookup matching meetingTime record
    let targetMeetingTime = meetingTimes.find(m => m.day === day && m.time === timeBlock);
    if (!targetMeetingTime) {
      // Fallback object if meetingTimes catalog was not loaded
      targetMeetingTime = { id: null, day, time: timeBlock, slotType: draggedEntry.MeetingTime?.slotType || 'LECTURE' };
    }

    const currentEntryToMove = draggedEntry;
    setDraggedEntry(null);

    onMoveProposal(currentEntryToMove, targetMeetingTime, day, timeBlock);
  };

  const renderCellContent = (day, timeBlock) => {
    const matched = entries.filter(
      e => e.MeetingTime && e.MeetingTime.day === day && e.MeetingTime.time === timeBlock
    );

    const isHovered = dragOverCell?.day === day && dragOverCell?.timeBlock === timeBlock;
    const isCompatible = isCellCompatible(day, timeBlock);

    if (matched.length === 0) {
      return (
        <div 
          className={`matrix-cell-empty ${isHovered && draggedEntry ? (isCompatible ? 'drop-target-active' : 'drop-target-invalid') : ''}`}
          aria-label={`Free slot on ${day} ${timeBlock}`}
          data-testid={`cell-empty-${day}-${timeBlock}`}
        >
          {isHovered && draggedEntry && isCompatible ? (
            <span className="drop-here-hint">Drop here</span>
          ) : (
            '—'
          )}
        </div>
      );
    }

    return (
      <div className={`matrix-cell-entries ${isHovered && draggedEntry ? (isCompatible ? 'drop-target-active' : 'drop-target-invalid') : ''}`}>
        {matched.map(entry => {
          const isLab = entry.Course?.courseType === 'LAB' || Boolean(entry.Batch);
          const isElective = Boolean(entry.Section?.isElective);
          const cardVariantClass = isLab ? 'slot-entry-lab' : isElective ? 'slot-entry-elective' : '';
          const isCurrentlyDragging = draggedEntry?.id === entry.id;

          // Check revision diff highlighting
          const changeDetail = changedEntriesMap[entry.id] || (entry.isRevisionMoved ? entry.revisionChange : null);
          const isMovedInRevision = Boolean(changeDetail || entry.isRevisionMoved);
          const movedTooltip = changeDetail?.tooltip || (changeDetail?.oldMeetingTime 
            ? `Moved from ${changeDetail.oldMeetingTime.day} ${changeDetail.oldMeetingTime.time}` 
            : 'Rescheduled in this revision');

          return (
            <div 
              key={entry.id} 
              className={`slot-entry-card ${cardVariantClass} is-draggable ${isCurrentlyDragging ? 'is-dragging' : ''} ${isMovedInRevision ? 'slot-entry-moved' : ''}`} 
              data-testid={`slot-entry-${entry.id}`}
              draggable={true}
              onDragStart={(e) => handleDragStart(e, entry)}
              onDragEnd={handleDragEnd}
            >
              {/* Revision Changed Indicator Badge */}
              {isMovedInRevision && (
                <div 
                  className="revision-moved-badge" 
                  title={movedTooltip}
                  data-testid={`revision-moved-badge-${entry.id}`}
                >
                  <RotateCcw size={10} />
                  <span>Moved</span>
                </div>
              )}

              <div className="slot-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <GripVertical size={13} className="drag-handle-icon" title="Drag to reschedule" />
                  <span className="slot-course-code">{entry.Course?.code}</span>
                </div>
                {isLab && <FlaskConical size={14} color="#10b981" title="Laboratory Practical" />}
                {isElective && <Sparkles size={14} color="var(--accent-orange)" title="Elective Course" />}
              </div>

              {entry.Course?.name && (
                <div className="slot-course-name" title={entry.Course.name}>
                  {entry.Course.name}
                </div>
              )}

              <div className="slot-detail-row">
                <User size={13} className="slot-detail-icon" />
                <span>{entry.Instructor?.name || 'Unassigned'}</span>
              </div>

              <div className="slot-detail-row">
                <MapPin size={13} className="slot-detail-icon" />
                <span>Room {entry.Room?.number || 'TBD'}</span>
              </div>

              <div className="slot-badges-row">
                {entry.Division && (
                  <span className="div-tag">{entry.Division.name}</span>
                )}
                {entry.Batch && (
                  <span className="batch-tag">Batch {entry.Batch.name}</span>
                )}
                {isElective && entry.Section?.electiveGroup && (
                  <span className="room-tag">Grp {entry.Section.electiveGroup}</span>
                )}
              </div>

              {onEditEntry && (
                <div className="slot-actions-row">
                  <button 
                    type="button"
                    className="slot-edit-btn" 
                    onClick={() => onEditEntry(entry)}
                    aria-label={`Edit ${entry.Course?.code} entry`}
                  >
                    Edit
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  if (uniqueTimeBlocks.length === 0) {
    return (
      <div className="matrix-container" style={{ padding: '36px', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)' }}>No timetable classes scheduled for this filter selection.</p>
      </div>
    );
  }

  return (
    <div className="matrix-container" data-testid="timetable-matrix-grid">
      <table className="timetable-matrix">
        <thead>
          <tr>
            <th className="matrix-th-time">Time Slot</th>
            {DAYS.map(day => (
              <th key={day} className="matrix-th-day">{day}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {uniqueTimeBlocks.map(timeBlock => (
            <tr key={timeBlock}>
              <td className="matrix-time-col">{timeBlock}</td>
              {DAYS.map(day => (
                <td 
                  key={`${day}-${timeBlock}`}
                  className={`matrix-td-dropzone ${dragOverCell?.day === day && dragOverCell?.timeBlock === timeBlock ? (isCellCompatible(day, timeBlock) ? 'cell-drop-valid' : 'cell-drop-invalid') : ''}`}
                  onDragOver={(e) => handleDragOver(e, day, timeBlock)}
                  onDragEnter={() => handleDragEnter(day, timeBlock)}
                  onDragLeave={() => handleDragLeave(day, timeBlock)}
                  onDrop={(e) => handleDrop(e, day, timeBlock)}
                  data-testid={`drop-zone-${day}-${timeBlock}`}
                >
                  {renderCellContent(day, timeBlock)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
