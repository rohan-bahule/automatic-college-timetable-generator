import React from 'react';
import { CheckCircle2, AlertTriangle, History, ArrowRight } from 'lucide-react';
import Badge from '../common/Badge';
import Button from '../common/Button';
import './TimetableViewer.css';

export default function RunHistoryTable({
  runs = [],
  currentRunId,
  onSelectRun
}) {
  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <div className="history-card" data-testid="run-history-section">
      <div className="history-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <History size={20} color="var(--accent-orange)" />
          <h3 className="history-title">Generated Timetable Runs</h3>
        </div>
        <Badge variant="default">{runs.length} Total Runs</Badge>
      </div>

      <div className="history-table-wrap">
        <table className="history-table">
          <thead>
            <tr>
              <th>Run</th>
              <th>Generated At</th>
              <th>Conflicts</th>
              <th>Status</th>
              <th>Attempts</th>
              <th>Time</th>
              <th style={{ textAlign: 'right' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {runs.map(run => {
              const isActive = String(run.id) === String(currentRunId);
              const isVerified = run.verified || run.conflictCount === 0;

              return (
                <tr key={run.id} className={isActive ? 'active-run-row' : ''}>
                  <td>
                    <strong>#{run.id}</strong>
                    {isActive && (
                      <span style={{ marginLeft: '8px', fontSize: '0.75rem', color: 'var(--accent-orange)' }}>
                        (Active)
                      </span>
                    )}
                  </td>
                  <td>{formatDate(run.createdAt)}</td>
                  <td>
                    {run.conflictCount === 0 ? (
                      <Badge variant="success" icon={CheckCircle2}>0 Conflicts</Badge>
                    ) : (
                      <Badge variant="warning" icon={AlertTriangle}>{run.conflictCount} Conflicts</Badge>
                    )}
                  </td>
                  <td>
                    {isVerified ? (
                      <span style={{ color: 'var(--status-success)', fontWeight: 600, fontSize: '0.85rem' }}>
                        ✓ Verified
                      </span>
                    ) : (
                      <span style={{ color: 'var(--status-warning)', fontWeight: 600, fontSize: '0.85rem' }}>
                        ⚠ Warning
                      </span>
                    )}
                  </td>
                  <td>{run.attempts || 1}</td>
                  <td>{run.timeTakenSec ? `${run.timeTakenSec}s` : '—'}</td>
                  <td style={{ textAlign: 'right' }}>
                    <Button
                      variant={isActive ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => onSelectRun(run.id)}
                      data-testid={`view-run-btn-${run.id}`}
                    >
                      {isActive ? 'Current' : 'View'}
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
