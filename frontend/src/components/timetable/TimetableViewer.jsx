import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, AlertTriangle, Calendar, Layers, RefreshCw, 
  Download, Printer, RotateCcw 
} from 'lucide-react';
import { timetableApi } from '../../services/timetableApi';
import dataApi from '../../services/dataApi';
import { exportTimetableToPdf, generatePdfFilename } from '../../services/pdfExportService';
import TimetableFilterBar from './TimetableFilterBar';
import TimetableGrid from './TimetableGrid';
import RunHistoryTable from './RunHistoryTable';
import EditEntryModal from './EditEntryModal';
import MoveConfirmationModal from './MoveConfirmationModal';
import Badge from '../common/Badge';
import Button from '../common/Button';
import './TimetableViewer.css';

export default function TimetableViewer({ selectedRunId = null, onNavigateToGenerate = null }) {
  const [runs, setRuns] = useState([]);
  const [currentRunId, setCurrentRunId] = useState(selectedRunId);
  const [metadata, setMetadata] = useState(null);
  const [meetingTimes, setMeetingTimes] = useState([]);

  // Filters: default to Division and first available division
  const [viewType, setViewType] = useState('Division');
  const [filterId, setFilterId] = useState('');

  const [timetableData, setTimetableData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successBanner, setSuccessBanner] = useState('');

  // Edit Modal State
  const [editingEntry, setEditingEntry] = useState(null);

  // Drag-and-Drop Move Modal State
  const [activeMoveProposal, setActiveMoveProposal] = useState(null);

  // Revision Lineage Map & Diffing State: { [revisedRunId]: parentRunId }
  const [revisionMap, setRevisionMap] = useState(() => {
    try {
      const saved = localStorage.getItem('timetable_revision_map');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });
  const [changedEntriesMap, setChangedEntriesMap] = useState({});
  const [parentRunId, setParentRunId] = useState(null);

  // 1. Initial Data Ingestion: Runs, Metadata & Meeting Times
  useEffect(() => {
    loadInitialData();
  }, []);

  // Update currentRunId if prop changes
  useEffect(() => {
    if (selectedRunId && String(selectedRunId) !== String(currentRunId)) {
      setCurrentRunId(selectedRunId);
    }
  }, [selectedRunId]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError('');
      const [runsRes, metaRes, timesRes] = await Promise.all([
        timetableApi.getAllRuns(),
        timetableApi.getMetadata(),
        dataApi.getMeetingTimes().catch(() => ({ data: [] }))
      ]);

      if (runsRes.success) {
        setRuns(runsRes.data);
      }

      if (metaRes.success) {
        setMetadata(metaRes.data);
        // Default filter: first division
        if (metaRes.data.divisions && metaRes.data.divisions.length > 0) {
          setFilterId(metaRes.data.divisions[0].id);
        }
      }

      if (timesRes && timesRes.data) {
        setMeetingTimes(Array.isArray(timesRes.data) ? timesRes.data : []);
      }

      // Determine active run
      const targetRunId = selectedRunId || (runsRes.data && runsRes.data.length > 0 ? runsRes.data[0].id : null);
      if (targetRunId) {
        setCurrentRunId(targetRunId);
      }
    } catch (err) {
      setError(err.message || 'Failed to initialize timetable viewer.');
    } finally {
      setLoading(false);
    }
  };

  // 2. Fetch timetable schedule whenever runId, viewType, or filterId changes
  useEffect(() => {
    if (currentRunId) {
      fetchTimetableSchedule();
    }
  }, [currentRunId, viewType, filterId]);

  const fetchTimetableSchedule = async () => {
    if (!currentRunId) return;
    try {
      setLoading(true);
      setError('');
      let res;
      if (filterId) {
        res = await timetableApi.getRunFiltered(currentRunId, viewType, filterId);
      } else {
        res = await timetableApi.getRunById(currentRunId);
      }

      if (res && res.success) {
        setTimetableData(res.data);
      } else {
        setError(res?.message || 'Failed to load timetable entries.');
      }
    } catch (err) {
      setError(err.message || 'Error fetching timetable data.');
    } finally {
      setLoading(false);
    }
  };

  // 3. Revision Lineage & Diff Calculation
  useEffect(() => {
    calculateRevisionDiff();
  }, [currentRunId, timetableData, revisionMap]);

  const calculateRevisionDiff = async () => {
    if (!currentRunId || !timetableData?.entries) {
      setChangedEntriesMap({});
      setParentRunId(null);
      return;
    }

    const pId = revisionMap[currentRunId];
    if (!pId || String(pId) === String(currentRunId)) {
      setChangedEntriesMap({});
      setParentRunId(null);
      return;
    }

    setParentRunId(pId);
    try {
      const parentRes = await timetableApi.getRunById(pId);
      if (parentRes && parentRes.success && parentRes.data?.entries) {
        const parentEntries = parentRes.data.entries;
        const diffMap = {};

        timetableData.entries.forEach(currEntry => {
          const parentMatch = parentEntries.find(p => 
            p.sectionId === currEntry.sectionId &&
            p.courseId === currEntry.courseId &&
            p.divisionId === currEntry.divisionId &&
            p.batchId === currEntry.batchId
          );

          if (parentMatch) {
            const timeChanged = parentMatch.meetingTimeId !== currEntry.meetingTimeId;
            const roomChanged = parentMatch.roomId !== currEntry.roomId;
            const instructorChanged = parentMatch.instructorId !== currEntry.instructorId;

            if (timeChanged || roomChanged || instructorChanged) {
              diffMap[currEntry.id] = {
                oldMeetingTime: parentMatch.MeetingTime,
                newMeetingTime: currEntry.MeetingTime,
                oldRoom: parentMatch.Room,
                newRoom: currEntry.Room,
                oldInstructor: parentMatch.Instructor,
                newInstructor: currEntry.Instructor,
                tooltip: timeChanged && parentMatch.MeetingTime 
                  ? `Moved from ${parentMatch.MeetingTime.day} ${parentMatch.MeetingTime.time} → ${currEntry.MeetingTime?.day} ${currEntry.MeetingTime?.time}`
                  : 'Updated in this revision'
              };
            }
          }
        });

        setChangedEntriesMap(diffMap);
      }
    } catch (e) {
      setChangedEntriesMap({});
    }
  };

  // Handle View Type Switch (reset filterId to first item of new type)
  const handleViewTypeChange = (newType) => {
    setViewType(newType);
    if (!metadata) return;
    if (newType === 'Division') {
      setFilterId(metadata.divisions?.[0]?.id || '');
    } else if (newType === 'Instructor') {
      setFilterId(metadata.instructors?.[0]?.id || '');
    } else if (newType === 'Room') {
      setFilterId(metadata.rooms?.[0]?.id || '');
    } else if (newType === 'Batch') {
      setFilterId(metadata.batches?.[0]?.id || '');
    } else {
      setFilterId('');
    }
  };

  const currentRunMeta = runs.find(r => String(r.id) === String(currentRunId)) || timetableData;

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Recent';
    try {
      return new Date(dateStr).toLocaleDateString(undefined, {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch (e) {
      return dateStr;
    }
  };

  const handleEditEntry = (entry) => {
    setEditingEntry(entry);
    setSuccessBanner('');
  };

  const handleEditSaveSuccess = async (saveData) => {
    const revisedRunId = saveData.revisedRunId;
    const originalRunId = saveData.originalRunId;
    if (originalRunId && revisedRunId) {
      setRevisionMap(prev => {
        const updated = { ...prev, [revisedRunId]: originalRunId };
        try { localStorage.setItem('timetable_revision_map', JSON.stringify(updated)); } catch (e) {}
        return updated;
      });
    }
    setSuccessBanner(`✓ Timetable updated successfully. Created revised timetable Run #${revisedRunId}.`);
    const runsRes = await timetableApi.getAllRuns();
    if (runsRes.success) {
      setRuns(runsRes.data);
    }
    setCurrentRunId(revisedRunId);
  };

  // Drag-and-drop move initiation
  const handleMoveProposal = (entry, targetMeetingTime, day, timeBlock) => {
    setActiveMoveProposal({
      entry,
      targetMeetingTime,
      targetDay: day,
      targetTimeBlock: timeBlock
    });
    setSuccessBanner('');
  };

  // Drag-and-drop save success
  const handleMoveSuccess = async (saveData) => {
    const revisedRunId = saveData.revisedRunId;
    const originalRunId = saveData.originalRunId;
    if (originalRunId && revisedRunId) {
      setRevisionMap(prev => {
        const updated = { ...prev, [revisedRunId]: originalRunId };
        try { localStorage.setItem('timetable_revision_map', JSON.stringify(updated)); } catch (e) {}
        return updated;
      });
    }
    setActiveMoveProposal(null);
    setSuccessBanner(`✓ Timetable entry moved successfully. Created revised Run #${revisedRunId}. Original Run #${originalRunId} preserved.`);
    const runsRes = await timetableApi.getAllRuns();
    if (runsRes.success) {
      setRuns(runsRes.data);
    }
    setCurrentRunId(revisedRunId);
  };

  // Helper to determine the human-readable entity label
  const getActiveEntityLabel = () => {
    if (!metadata) return '';
    if (viewType === 'Division') {
      const match = (metadata.divisions || []).find(d => String(d.id) === String(filterId));
      return match ? match.name : 'All Divisions';
    }
    if (viewType === 'Instructor') {
      const match = (metadata.instructors || []).find(i => String(i.id) === String(filterId));
      return match ? match.name : 'All Faculty';
    }
    if (viewType === 'Room') {
      const match = (metadata.rooms || []).find(r => String(r.id) === String(filterId));
      return match ? `Room ${match.number}` : 'All Rooms';
    }
    if (viewType === 'Batch') {
      const match = (metadata.batches || []).find(b => String(b.id) === String(filterId));
      return match ? `Batch ${match.name}` : 'All Batches';
    }
    return '';
  };

  // Export PDF of current active timetable view
  const handleExportPdf = () => {
    setError('');
    const entries = timetableData?.entries || [];
    if (entries.length === 0) {
      setError('No timetable entries are available to export for this view.');
      return;
    }
    try {
      const label = getActiveEntityLabel();
      const res = exportTimetableToPdf({
        runId: currentRunId,
        run: currentRunMeta,
        viewType,
        entityLabel: label,
        entries,
        metadata
      });
      setSuccessBanner(`✓ Exported PDF successfully: ${res.filename}`);
    } catch (err) {
      setError(err.message || 'Unable to generate PDF. Please try again.');
    }
  };

  // Browser Print current active view
  const handlePrint = () => {
    const entries = timetableData?.entries || [];
    if (entries.length === 0) {
      setError('No timetable entries are available to print for this view.');
      return;
    }
    window.print();
  };

  const [regenerating, setRegenerating] = useState(false);

  // User-Initiated Regeneration:
  // Starts a completely fresh generation execution via the authoritative backend scheduler,
  // creating a brand-new TimetableRun while preserving the previous run unchanged.
  const handleRegenerate = async () => {
    if (regenerating) return;
    try {
      setRegenerating(true);
      setError('');
      setSuccessBanner('');
      const res = await timetableApi.generateTimetable();
      if (res.success && res.data) {
        const newRunId = res.data.timetableId;
        const runsRes = await timetableApi.getAllRuns();
        if (runsRes.success) {
          setRuns(runsRes.data);
        }
        setCurrentRunId(newRunId);
        setSuccessBanner(`✓ Timetable regenerated successfully! Created new Run #${newRunId}. Previous run remains preserved.`);
      } else {
        setError(res.message || 'Failed to regenerate timetable.');
      }
    } catch (err) {
      setError(err.message || 'Unable to connect to the scheduling service.');
    } finally {
      setRegenerating(false);
    }
  };

  const activeLabel = getActiveEntityLabel();

  return (
    <div className="viewer-wrapper" data-testid="redesigned-timetable-viewer">
      {/* Print-Only Header (visible exclusively in @media print) */}
      <div className="print-only-header">
        <h1 className="print-dept-title">
          {metadata?.department?.name || 'Department of Computer Engineering'}
        </h1>
        <h2 className="print-perspective-title">
          {viewType.toUpperCase()} TIMETABLE — {activeLabel.toUpperCase()}
        </h2>
        <div className="print-meta-line">
          <span>Run #{currentRunId || currentRunMeta?.id || '1'}</span>
          {currentRunMeta?.createdAt && (
            <span>Generated: {formatDate(currentRunMeta.createdAt)}</span>
          )}
          <span>
            Status: {currentRunMeta?.conflictCount === 0 ? 'Verified (0 conflicts)' : `${currentRunMeta?.conflictCount || 0} conflicts`}
          </span>
        </div>
      </div>

      {/* Run Header & Switcher */}
      <div className="run-header-card">
        <div className="run-meta-left">
          <div className="run-title-row">
            <h2 className="run-title">
              Timetable Schedule {currentRunId ? `— Run #${currentRunId}` : ''}
            </h2>
            {currentRunMeta?.createdAt && (
              <span className="run-date">Generated: {formatDate(currentRunMeta.createdAt)}</span>
            )}
          </div>

          <div className="run-meta-badges">
            {currentRunMeta?.conflictCount === 0 ? (
              <Badge variant="success" icon={CheckCircle2}>
                ✓ No conflicts detected
              </Badge>
            ) : currentRunMeta?.conflictCount > 0 ? (
              <Badge variant="warning" icon={AlertTriangle}>
                ⚠ {currentRunMeta.conflictCount} conflicts detected
              </Badge>
            ) : null}

            {currentRunMeta?.verified ? (
              <Badge variant="info">✓ Verified</Badge>
            ) : (
              <Badge variant="default">Status: Solved</Badge>
            )}

            {currentRunMeta?.timeTakenSec && (
              <Badge variant="default">Time: {currentRunMeta.timeTakenSec}s</Badge>
            )}
          </div>
        </div>

        {/* Header Actions: Regenerate, Export PDF, Print, and Run Selector */}
        <div className="viewer-header-actions">
          <div className="viewer-export-btns">
            <Button
              variant="secondary"
              icon={RotateCcw}
              onClick={handleRegenerate}
              disabled={regenerating}
              data-testid="regenerate-timetable-btn"
            >
              {regenerating ? 'Regenerating...' : 'Regenerate Timetable'}
            </Button>
            <Button
              variant="primary"
              icon={Download}
              onClick={handleExportPdf}
              data-testid="export-pdf-btn"
            >
              Export PDF
            </Button>
            <Button
              variant="secondary"
              icon={Printer}
              onClick={handlePrint}
              data-testid="print-timetable-btn"
            >
              Print
            </Button>
          </div>

          {/* Run Selector Dropdown */}
          <div className="run-switcher-wrap">
            <label htmlFor="run-select-dropdown" className="run-switcher-label">
              Select Run:
            </label>
            <select
              id="run-select-dropdown"
              data-testid="run-select-dropdown"
              className="run-select"
              value={currentRunId || ''}
              onChange={(e) => setCurrentRunId(e.target.value)}
            >
              {runs.length === 0 ? (
                <option value="">No runs available</option>
              ) : (
                runs.map(r => (
                  <option key={r.id} value={r.id}>
                    Run #{r.id} ({formatDate(r.createdAt)}) — {r.conflictCount} conflicts
                  </option>
                ))
              )}
            </select>
          </div>
        </div>
      </div>

      {/* Success Notification */}
      {successBanner && (
        <div className="feedback-banner success" style={{ margin: '0 0 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={18} />
            <span>{successBanner}</span>
          </div>
          <button className="feedback-close" onClick={() => setSuccessBanner('')}>&times;</button>
        </div>
      )}

      {/* Error Message if any */}
      {error && (
        <div className="error-msg" data-testid="viewer-error-msg" style={{ margin: 0 }}>
          {error}
        </div>
      )}

      {/* Revision Summary Notification Banner */}
      {parentRunId && (
        <div className="revision-summary-card" data-testid="revision-summary-card">
          <div className="revision-summary-left">
            <RotateCcw size={20} color="#4f46e5" />
            <div>
              <h4 className="revision-summary-title">
                Run #{currentRunId} — Revision of Run #{parentRunId}
              </h4>
              <p className="revision-summary-desc">
                {Object.keys(changedEntriesMap).length > 0 
                  ? `${Object.keys(changedEntriesMap).length} timetable entry rescheduled in this revision`
                  : 'Created as an immutable revision snapshot'}
              </p>
            </div>
          </div>
          <div className="revision-summary-actions">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentRunId(parentRunId)}
              data-testid="view-parent-run-btn"
            >
              View Original Run #{parentRunId}
            </Button>
          </div>
        </div>
      )}

      {/* Human-Readable Filters Bar */}
      <TimetableFilterBar
        viewType={viewType}
        onViewTypeChange={handleViewTypeChange}
        filterId={filterId}
        onFilterIdChange={setFilterId}
        metadata={metadata}
      />

      {/* Timetable Grid Matrix with Drag-and-Drop & Diff Highlighting */}
      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center' }} data-testid="viewer-loading">
          <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem' }}>Loading timetable schedule matrix...</p>
        </div>
      ) : (
        <TimetableGrid 
          entries={timetableData?.entries || []} 
          meetingTimes={meetingTimes}
          onEditEntry={handleEditEntry}
          onMoveProposal={handleMoveProposal}
          changedEntriesMap={changedEntriesMap}
        />
      )}

      {/* Run History Table */}
      <RunHistoryTable
        runs={runs}
        currentRunId={currentRunId}
        onSelectRun={(runId) => setCurrentRunId(runId)}
      />

      {/* Phase 4 Edit Entry Modal */}
      {editingEntry && (
        <EditEntryModal
          entry={editingEntry}
          runId={currentRunId}
          onClose={() => setEditingEntry(null)}
          onSaveSuccess={handleEditSaveSuccess}
        />
      )}

      {/* Phase 6 Move Confirmation Modal */}
      {activeMoveProposal && (
        <MoveConfirmationModal
          proposal={activeMoveProposal}
          runId={currentRunId}
          onClose={() => setActiveMoveProposal(null)}
          onConfirmSuccess={handleMoveSuccess}
        />
      )}
    </div>
  );
}
