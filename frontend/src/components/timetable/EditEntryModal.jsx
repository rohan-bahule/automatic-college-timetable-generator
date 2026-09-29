import React, { useState, useEffect } from 'react';
import { 
  X, CheckCircle2, AlertTriangle, ShieldCheck, RefreshCw, 
  HelpCircle, AlertCircle, ArrowRight, User, MapPin, Clock 
} from 'lucide-react';
import Button from '../common/Button';
import Badge from '../common/Badge';
import { timetableApi } from '../../services/timetableApi';
import dataApi from '../../services/dataApi';

export default function EditEntryModal({ 
  entry, 
  runId, 
  onClose, 
  onSaveSuccess 
}) {
  const [instructors, setInstructors] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [meetingTimes, setMeetingTimes] = useState([]);
  const [loadingLookups, setLoadingLookups] = useState(true);

  // Form selections
  const [selectedInstructorId, setSelectedInstructorId] = useState(entry.instructorId || entry.Instructor?.id || '');
  const [selectedRoomId, setSelectedRoomId] = useState(entry.roomId || entry.Room?.id || '');
  const [selectedMeetingTimeId, setSelectedMeetingTimeId] = useState(entry.meetingTimeId || entry.MeetingTime?.id || '');

  // Validation state: null | { valid: boolean, conflicts: [], message: '' }
  const [validationResult, setValidationResult] = useState(null);
  const [validating, setValidating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorBanner, setErrorBanner] = useState('');

  // Unsaved changes confirmation
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  // Load lookup data for smart dropdowns
  useEffect(() => {
    loadLookups();
  }, []);

  const loadLookups = async () => {
    try {
      setLoadingLookups(true);
      const [instRes, roomRes, timeRes] = await Promise.all([
        dataApi.getInstructors().catch(() => ({ data: [] })),
        dataApi.getRooms().catch(() => ({ data: [] })),
        dataApi.getMeetingTimes().catch(() => ({ data: [] }))
      ]);
      setInstructors(Array.isArray(instRes) ? instRes : (instRes?.data || []));
      setRooms(Array.isArray(roomRes) ? roomRes : (roomRes?.data || []));
      setMeetingTimes(Array.isArray(timeRes) ? timeRes : (timeRes?.data || []));
    } catch (err) {
      setErrorBanner('Failed to load academic options for editing.');
    } finally {
      setLoadingLookups(false);
    }
  };

  const courseObj = entry.Course || entry.course || {};
  const divisionObj = entry.Division || entry.division || {};
  const batchObj = entry.Batch || entry.batch || null;
  const instructorObj = entry.Instructor || entry.instructor || {};
  const roomObj = entry.Room || entry.room || {};
  const meetingTimeObj = entry.MeetingTime || entry.meetingTime || {};

  const courseType = courseObj.courseType || courseObj.type || 'LECTURE';
  const isLabCourse = courseType === 'LAB' || Boolean(batchObj);

  // Smart dropdown filtering
  // 1. Filter instructors: Only show instructors eligible for this course
  const eligibleInstructors = instructors.filter(inst => {
    if (!inst.courses || inst.courses.length === 0) return true; // fallback if courses not populated
    return inst.courses.some(c => c.id === (courseObj.id || entry.courseId) || c.code === courseObj.code);
  });
  const displayInstructors = eligibleInstructors.length > 0 ? eligibleInstructors : instructors;

  // 2. Filter rooms: LAB course requires LAB room; LECTURE requires LECTURE room
  const compatibleRooms = rooms.filter(r => {
    const type = r.roomType || r.type;
    if (isLabCourse) return type === 'LAB';
    return type === 'LECTURE';
  });
  const displayRooms = compatibleRooms.length > 0 ? compatibleRooms : rooms;

  // 3. Filter meeting times: LAB requires LAB slot; LECTURE requires LECTURE slot
  const compatibleTimes = meetingTimes.filter(m => {
    const type = m.slotType || m.type;
    if (isLabCourse) return type === 'LAB';
    return type === 'LECTURE' || type === 'REGULAR';
  });
  const displayTimes = compatibleTimes.length > 0 ? compatibleTimes : meetingTimes;

  // Check if form was touched
  const isDirty = 
    String(selectedInstructorId) !== String(entry.instructorId || entry.Instructor?.id || '') ||
    String(selectedRoomId) !== String(entry.roomId || entry.Room?.id || '') ||
    String(selectedMeetingTimeId) !== String(entry.meetingTimeId || entry.MeetingTime?.id || '');

  const handleFieldChange = (setter) => (e) => {
    setter(e.target.value);
    setValidationResult(null); // invalidate previous validation upon any change
    setErrorBanner('');
  };

  // Close attempt handler with discard prompt
  const handleAttemptClose = () => {
    if (isDirty) {
      setShowDiscardConfirm(true);
    } else {
      onClose();
    }
  };

  const effectiveRunId = runId || entry.runId;

  // Validate proposed change
  const handleValidate = async () => {
    setValidating(true);
    setErrorBanner('');
    setValidationResult(null);
    try {
      const payload = {
        instructorId: selectedInstructorId ? Number(selectedInstructorId) : null,
        roomId: selectedRoomId ? Number(selectedRoomId) : null,
        meetingTimeId: selectedMeetingTimeId ? Number(selectedMeetingTimeId) : null
      };
      const res = await timetableApi.validateTimetableEntry(effectiveRunId, entry.id, payload);
      setValidationResult(res);
    } catch (err) {
      setErrorBanner(err.message || 'Validation request failed.');
    } finally {
      setValidating(false);
    }
  };

  // Save proposed change (creates revised TimetableRun snapshot)
  const handleSave = async () => {
    if (!validationResult || !validationResult.valid) return;
    setSaving(true);
    setErrorBanner('');
    try {
      const payload = {
        instructorId: selectedInstructorId ? Number(selectedInstructorId) : null,
        roomId: selectedRoomId ? Number(selectedRoomId) : null,
        meetingTimeId: selectedMeetingTimeId ? Number(selectedMeetingTimeId) : null
      };
      const res = await timetableApi.updateTimetableEntry(effectiveRunId, entry.id, payload);
      if (onSaveSuccess) {
        onSaveSuccess(res.data);
      }
      onClose();
    } catch (err) {
      setErrorBanner(err.message || 'Failed to save timetable edit.');
      if (err.conflicts && err.conflicts.length > 0) {
        setValidationResult({ valid: false, conflicts: err.conflicts });
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={handleAttemptClose}>
      <div className="modal-card" style={{ maxWidth: '620px' }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div>
            <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-primary)' }}>
              Edit Timetable Entry
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Run #{runId} &bull; Entry #{entry.id}
            </span>
          </div>
          <button className="modal-close-btn" onClick={handleAttemptClose}>
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Read-only Context Box */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 16px',
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '12px'
          }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>Course (Read-only)</span>
              <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                {courseObj.code ? `${courseObj.code} - ` : ''}{courseObj.name}
              </strong>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>Division (Read-only)</span>
              <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                {divisionObj.name || 'All Divisions'}
              </strong>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>Batch (Read-only)</span>
              <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                {batchObj?.name ? `Batch ${batchObj.name}` : 'None (Entire Division)'}
              </strong>
            </div>
          </div>

          {/* Error Banner */}
          {errorBanner && (
            <div className="feedback-banner error" style={{ margin: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle size={18} />
                <span>{errorBanner}</span>
              </div>
            </div>
          )}

          {/* Editable Form Controls */}
          {loadingLookups ? (
            <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)' }}>
              <RefreshCw size={24} className="spinner-icon" />
              <p style={{ marginTop: '8px', fontSize: '0.85rem' }}>Loading academic options...</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Instructor Selector */}
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <User size={14} /> Assigned Instructor <span className="required-star">*</span>
                </label>
                <select
                  data-testid="instructor-select"
                  className="form-control"
                  value={selectedInstructorId}
                  onChange={handleFieldChange(setSelectedInstructorId)}
                  disabled={validating || saving}
                >
                  <option value="">-- Select Instructor --</option>
                  {displayInstructors.map(inst => (
                    <option key={inst.id} value={inst.id}>
                      {inst.name} {inst.uid ? `(${inst.uid})` : ''}
                    </option>
                  ))}
                </select>
                <span className="form-help">
                  Showing eligible faculty qualified for {entry.Course?.code || 'this subject'}.
                </span>
              </div>

              {/* Room Selector */}
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MapPin size={14} /> Room / Classroom <span className="required-star">*</span>
                </label>
                <select
                  data-testid="room-select"
                  className="form-control"
                  value={selectedRoomId}
                  onChange={handleFieldChange(setSelectedRoomId)}
                  disabled={validating || saving}
                >
                  <option value="">-- Select Room --</option>
                  {displayRooms.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.number || r.roomNumber} ({r.roomType || r.type}, {r.seatingCapacity || r.capacity || 0} seats)
                    </option>
                  ))}
                </select>
                <span className="form-help">
                  Showing compatible {isLabCourse ? 'laboratory practical rooms' : 'lecture classrooms'}.
                </span>
              </div>

              {/* Meeting Time Selector */}
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Clock size={14} /> Day & Time Slot <span className="required-star">*</span>
                </label>
                <select
                  data-testid="meeting-time-select"
                  className="form-control"
                  value={selectedMeetingTimeId}
                  onChange={handleFieldChange(setSelectedMeetingTimeId)}
                  disabled={validating || saving}
                >
                  <option value="">-- Select Time Slot --</option>
                  {displayTimes.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.day} {m.timeSlot || m.time} ({m.slotType || m.type})
                    </option>
                  ))}
                </select>
                <span className="form-help">
                  Showing available time slots matching {isLabCourse ? '2-hour practical lab blocks' : '1-hour lecture slots'}.
                </span>
              </div>
            </div>
          )}

          {/* Validation Feedback Display */}
          {validationResult && (
            <div style={{
              background: validationResult.valid ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              border: `1px solid ${validationResult.valid ? '#10b981' : '#ef4444'}`,
              borderRadius: 'var(--radius-md)',
              padding: '14px 16px'
            }}>
              {validationResult.valid ? (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <CheckCircle2 size={20} color="#10b981" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <h4 style={{ margin: 0, fontSize: '0.95rem', color: '#34d399', fontWeight: 600 }}>
                      ✓ Change is Valid
                    </h4>
                    <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      No scheduling conflicts detected against faculty, classrooms, batches, or academic divisions. Click "Save Change" below to create a revised timetable run.
                    </p>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <AlertTriangle size={20} color="#f87171" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div style={{ width: '100%' }}>
                    <h4 style={{ margin: 0, fontSize: '0.95rem', color: '#f87171', fontWeight: 600 }}>
                      ⚠ Cannot Apply This Change ({validationResult.conflicts?.length || 1} Conflict)
                    </h4>
                    <ul style={{ margin: '8px 0 0', paddingLeft: '20px', fontSize: '0.85rem', color: '#fca5a5' }}>
                      {validationResult.conflicts?.map((c, idx) => (
                        <li key={idx} style={{ marginBottom: '4px' }}>
                          <strong>{c.type.replace(/_/g, ' ')}:</strong> {c.message}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Button variant="secondary" onClick={handleAttemptClose} disabled={validating || saving}>
            Cancel
          </Button>
          <div style={{ display: 'flex', gap: '10px' }}>
            <Button
              data-testid="validate-change-btn"
              variant="secondary"
              onClick={handleValidate}
              disabled={validating || saving || loadingLookups}
            >
              {validating ? 'Checking Conflicts...' : 'Validate Change'}
            </Button>
            <Button
              data-testid="save-change-btn"
              variant="primary"
              onClick={handleSave}
              disabled={!validationResult || !validationResult.valid || saving || validating}
            >
              {saving ? 'Saving Revision...' : 'Save Change'}
            </Button>
          </div>
        </div>
      </div>

      {/* Discard Confirmation Overlay */}
      {showDiscardConfirm && (
        <div className="modal-overlay" style={{ zIndex: 1100 }} onClick={() => setShowDiscardConfirm(false)}>
          <div className="modal-card" style={{ maxWidth: '420px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                Discard Unsaved Changes?
              </h3>
              <button className="modal-close-btn" onClick={() => setShowDiscardConfirm(false)}>
                <X size={16} />
              </button>
            </div>
            <div className="modal-body">
              <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                You have modified entry settings that have not yet been saved. If you discard, these edits will be lost and the current timetable remains unchanged.
              </p>
            </div>
            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <Button variant="secondary" onClick={() => setShowDiscardConfirm(false)}>
                Keep Editing
              </Button>
              <Button variant="danger" onClick={onClose}>
                Discard
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
