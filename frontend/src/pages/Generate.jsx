import React, { useState } from 'react';
import { 
  Sparkles, 
  Loader2, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  RotateCcw, 
  Layers, 
  Info,
  Check
} from 'lucide-react';
import { timetableApi } from '../services/timetableApi';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import './Generate.css';

export default function Generate({ onNavigate, onTimetableGenerated }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [generationResult, setGenerationResult] = useState(null);

  const academicEntities = [
    'Departments',
    'Divisions',
    'Batches',
    'Instructors',
    'Rooms',
    'Courses',
    'Timings',
    'Sections'
  ];

  const handleGenerate = async () => {
    try {
      setLoading(true);
      setError('');
      setGenerationResult(null);

      const res = await timetableApi.generateTimetable();

      if (res.success && res.data) {
        setGenerationResult(res.data);
        if (onTimetableGenerated) {
          onTimetableGenerated(res.data.timetableId);
        }
      } else {
        setError(res.message || 'Generation failed to complete.');
      }
    } catch (err) {
      setError(err.message || 'Unable to connect to the scheduling service.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewTimetable = () => {
    if (generationResult?.timetableId && onTimetableGenerated) {
      onTimetableGenerated(generationResult.timetableId);
    }
    onNavigate('timetable');
  };

  return (
    <div className="generate-page container" data-testid="generate-page">
      <div className="generate-header">
        <h1 className="generate-title">Generate College Timetable</h1>
        <p className="generate-subtitle">
          Generate a new timetable using the configured academic data and scheduling constraints.
        </p>
      </div>

      {/* 1. Loading State during generation */}
      {loading && (
        <div className="generate-card" data-testid="generation-loading-state">
          <div className="generating-loading-box">
            <Loader2 size={48} className="spinner-icon" />
            <h2 className="loading-heading">Generating Timetable...</h2>
            <p className="loading-desc">
              Running the scheduling engine across elective synchronization, practical lab constraints, 
              and faculty limits. This may take a few moments. Please wait...
            </p>
          </div>
        </div>
      )}

      {/* 2. Error State */}
      {error && !loading && (
        <div className="generate-error-card" data-testid="generation-error-state">
          <AlertTriangle size={44} color="var(--status-error)" style={{ marginBottom: '16px' }} />
          <h2 style={{ fontSize: '1.4rem', color: 'var(--status-error)', margin: '0 0 10px' }}>
            Unable to generate timetable.
          </h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
            {error}
          </p>
          <Button variant="primary" icon={RotateCcw} onClick={handleGenerate}>
            Try Again
          </Button>
        </div>
      )}

      {/* 3. Successful Generation Results & Metrics */}
      {generationResult && !loading && (
        <div className="results-card" data-testid="generation-result-card">
          <div className={`result-status-banner ${generationResult.conflictCount === 0 ? 'banner-success' : 'banner-warning'}`}>
            {generationResult.conflictCount === 0 ? (
              <>
                <CheckCircle2 size={24} />
                <div>
                  <strong>Timetable Generated Successfully!</strong>
                  <div>Clean timetable generated with 0 conflicts and verified constraints.</div>
                </div>
              </>
            ) : (
              <>
                <AlertTriangle size={24} />
                <div>
                  <strong>Timetable Generated With Conflicts</strong>
                  <div>Schedule completed with {generationResult.conflictCount} validation conflicts.</div>
                </div>
              </>
            )}
          </div>

          <div className="result-metrics-grid">
            <div className="metric-box">
              <div className="metric-val">#{generationResult.timetableId}</div>
              <div className="metric-name">Run ID</div>
            </div>

            <div className="metric-box">
              <div className="metric-val" style={{ color: generationResult.conflictCount === 0 ? 'var(--status-success)' : 'var(--status-warning)' }}>
                {generationResult.conflictCount}
              </div>
              <div className="metric-name">Conflicts</div>
            </div>

            <div className="metric-box">
              <div className="metric-val">
                {generationResult.schedule?.length || 0}
              </div>
              <div className="metric-name">Scheduled Classes</div>
            </div>

            <div className="metric-box">
              <div className="metric-val">
                {generationResult.attempts || 1}
              </div>
              <div className="metric-name">Attempts</div>
            </div>
          </div>

          <div className="result-actions-row">
            <Button
              variant="primary"
              size="lg"
              icon={ArrowRight}
              iconPosition="right"
              onClick={handleViewTimetable}
              data-testid="view-generated-btn"
            >
              View Generated Timetable
            </Button>

            <Button
              variant="secondary"
              size="lg"
              icon={RotateCcw}
              onClick={handleGenerate}
              disabled={loading}
              data-testid="regenerate-timetable-btn"
            >
              {loading ? 'Regenerating...' : 'Regenerate Timetable'}
            </Button>

            <Button
              variant="outline"
              size="lg"
              onClick={() => setGenerationResult(null)}
              data-testid="configure-parameters-btn"
            >
              Configure Parameters
            </Button>
          </div>
        </div>
      )}

      {/* 4. Default Ready to Generate State */}
      {!loading && !generationResult && !error && (
        <div className="generate-card" data-testid="generate-form-card">
          {/* Pre-generation config summary */}
          <div className="config-summary-box">
            <h2 className="config-summary-title">
              <Layers size={18} color="var(--accent-orange)" />
              Configured Academic Parameters
            </h2>

            <div className="config-entities-list" role="list">
              {academicEntities.map((entity, idx) => (
                <div key={idx} className="config-entity-chip" role="listitem">
                  <Check size={14} color="var(--status-success)" />
                  <span>{entity}</span>
                </div>
              ))}
            </div>

            <p className="config-notice-text">
              <Info size={15} color="var(--accent-orange)" />
              <span>
                Data overview will be available after the Data Entry module is implemented. 
                Active entities are currently loaded directly from the database.
              </span>
            </p>
          </div>

          {/* Action Trigger Area */}
          <div className="generate-action-area">
            <Button
              variant="primary"
              size="lg"
              icon={Sparkles}
              className="generate-main-btn"
              onClick={handleGenerate}
              data-testid="generate-timetable-btn"
            >
              ⚡ Generate Timetable
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
