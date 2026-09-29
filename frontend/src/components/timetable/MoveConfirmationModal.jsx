import React, { useState, useEffect } from 'react';
import { 
  X, CheckCircle2, AlertTriangle, ArrowRight, 
  RotateCcw, Clock, MapPin, User, Loader2 
} from 'lucide-react';
import Button from '../common/Button';
import Badge from '../common/Badge';
import { timetableApi } from '../../services/timetableApi';

export default function MoveConfirmationModal({
  proposal,
  runId,
  onClose,
  onConfirmSuccess
}) {
  const [validating, setValidating] = useState(true);
  const [saving, setSaving] = useState(false);
  const [validationResult, setValidationResult] = useState(null);
  const [errorBanner, setErrorBanner] = useState('');

  const { entry, targetMeetingTime, targetDay, targetTimeBlock } = proposal || {};

  useEffect(() => {
    if (proposal && entry && targetMeetingTime) {
      runValidation();
    }
  }, [proposal]);

  const runValidation = async () => {
    setValidating(true);
    setErrorBanner('');
    setValidationResult(null);
    try {
      const payload = {
        meetingTimeId: targetMeetingTime.id,
        roomId: entry.roomId || entry.Room?.id,
        instructorId: entry.instructorId || entry.Instructor?.id
      };
      const res = await timetableApi.validateTimetableEntry(runId, entry.id, payload);
      setValidationResult(res);
    } catch (err) {
      setErrorBanner(err.message || 'Unable to complete conflict validation.');
    } finally {
      setValidating(false);
    }
  };

  const handleConfirmMove = async () => {
    if (!validationResult || !validationResult.valid) return;
    setSaving(true);
    setErrorBanner('');
    try {
      const payload = {
        meetingTimeId: targetMeetingTime.id,
        roomId: entry.roomId || entry.Room?.id,
        instructorId: entry.instructorId || entry.Instructor?.id
      };
      const res = await timetableApi.updateTimetableEntry(runId, entry.id, payload);
      if (onConfirmSuccess) {
        onConfirmSuccess(res.data || res);
      }
    } catch (err) {
      if (err.status === 409) {
        setErrorBanner('The timetable changed while you were editing. Your move was not applied. Please refresh.');
      } else {
        setErrorBanner(err.message || 'Failed to save timetable move.');
      }
      if (err.conflicts && err.conflicts.length > 0) {
        setValidationResult({ valid: false, conflicts: err.conflicts });
      }
    } finally {
      setSaving(false);
    }
  };

  if (!proposal || !entry || !targetMeetingTime) return null;

  const currentDay = entry.MeetingTime?.day || 'Unknown Day';
  const currentTime = entry.MeetingTime?.time || 'Unknown Time';

  return (
    <div className="modal-overlay" onClick={onClose} data-testid="move-confirmation-modal">
      <div 
        className="modal-card" 
        style={{ maxWidth: '580px' }} 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <RotateCcw size={20} color="var(--accent-orange)" />
            <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-primary)' }}>
              Move Timetable Class
            </h3>
          </div>
          <button 
            className="modal-close-btn" 
            onClick={onClose} 
            disabled={saving}
            data-testid="close-move-modal-btn"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Target Course Summary */}
          <div className="modal-entry-preview">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span className="preview-course-code">{entry.Course?.code}</span>
              <span className="badge badge-default">
                {entry.Division ? entry.Division.name : ''}
                {entry.Batch ? ` • Batch ${entry.Batch.name}` : ''}
              </span>
            </div>
            <div className="preview-course-name">{entry.Course?.name}</div>
            <div className="preview-meta-row" style={{ marginTop: '8px' }}>
              <span><User size={13} style={{ display: 'inline', marginRight: '4px' }} />{entry.Instructor?.name || 'Unassigned'}</span>
              <span><MapPin size={13} style={{ display: 'inline', marginRight: '4px' }} />Room {entry.Room?.number || 'TBD'}</span>
            </div>
          </div>

          {/* Time Slot Transition Card */}
          <div className="move-transition-card">
            <div className="move-time-col">
              <span className="move-time-label">Current Slot</span>
              <div className="move-time-value">{currentDay}</div>
              <div className="move-time-sub">{currentTime}</div>
            </div>

            <div className="move-arrow-col">
              <ArrowRight size={22} color="var(--accent-orange)" />
            </div>

            <div className="move-time-col highlight">
              <span className="move-time-label">Proposed Slot</span>
              <div className="move-time-value">{targetDay || targetMeetingTime.day}</div>
              <div className="move-time-sub">{targetTimeBlock || targetMeetingTime.time}</div>
            </div>
          </div>

          {/* Validation Status Indicator */}
          {validating && (
            <div className="validation-checking-box" data-testid="move-validating-indicator">
              <Loader2 size={18} className="spinner-icon" style={{ animation: 'spin 1s linear infinite' }} />
              <span>Checking conflicts with timetable scheduler...</span>
            </div>
          )}

          {!validating && validationResult && validationResult.valid && (
            <div className="validation-result-box valid" data-testid="move-valid-box">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--status-success)', fontWeight: 600 }}>
                <CheckCircle2 size={18} />
                <span>Move Valid — No Conflicts Detected</span>
              </div>
              <p style={{ margin: '6px 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Saving will create a new immutable revision Run #{Number(runId) + 1 || ''}, preserving original Run #{runId}.
              </p>
            </div>
          )}

          {!validating && validationResult && !validationResult.valid && (
            <div className="validation-result-box invalid" data-testid="move-invalid-box">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--status-error)', fontWeight: 600 }}>
                <AlertTriangle size={18} />
                <span>Cannot Move to This Slot</span>
              </div>
              <div className="conflict-list" style={{ marginTop: '8px' }}>
                {validationResult.conflicts?.map((c, idx) => (
                  <div key={idx} className="conflict-item">
                    <span className="conflict-bullet">&bull;</span>
                    <span>{c.message}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {errorBanner && (
            <div className="feedback-banner error" style={{ margin: 0 }} data-testid="move-error-banner">
              <AlertTriangle size={16} />
              <span>{errorBanner}</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={saving}
            data-testid="cancel-move-btn"
          >
            Cancel
          </Button>

          {validationResult && validationResult.valid ? (
            <Button
              variant="primary"
              onClick={handleConfirmMove}
              disabled={validating || saving}
              data-testid="confirm-move-btn"
            >
              {saving ? 'Creating Revision...' : 'Confirm Move'}
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={onClose}
              disabled={validating}
              data-testid="choose-another-slot-btn"
            >
              Choose Another Slot
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
