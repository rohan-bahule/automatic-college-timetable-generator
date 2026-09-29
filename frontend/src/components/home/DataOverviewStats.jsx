import React, { useState, useEffect } from 'react';
import { 
  Building2, Users, Layers, GraduationCap, DoorOpen, 
  BookOpen, Clock, CalendarDays, RefreshCw, AlertCircle, Database
} from 'lucide-react';
import dataApi from '../../services/dataApi';
import './DataOverviewStats.css';

export default function DataOverviewStats() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [counts, setCounts] = useState({
    departments: null,
    divisions: null,
    batches: null,
    instructors: null,
    rooms: null,
    courses: null,
    timings: null,
    sections: null
  });

  const getLength = (res) => {
    if (!res) return 0;
    if (Array.isArray(res)) return res.length;
    if (Array.isArray(res.data)) return res.data.length;
    return 0;
  };

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const [
        deptRes,
        divRes,
        batchRes,
        instRes,
        roomRes,
        courseRes,
        timingRes,
        secRes
      ] = await Promise.all([
        dataApi.getDepartments().catch(() => ({ data: [] })),
        dataApi.getDivisions().catch(() => ({ data: [] })),
        dataApi.getBatches().catch(() => ({ data: [] })),
        dataApi.getInstructors().catch(() => ({ data: [] })),
        dataApi.getRooms().catch(() => ({ data: [] })),
        dataApi.getCourses().catch(() => ({ data: [] })),
        dataApi.getMeetingTimes().catch(() => ({ data: [] })),
        dataApi.getSections().catch(() => ({ data: [] }))
      ]);

      setCounts({
        departments: getLength(deptRes),
        divisions: getLength(divRes),
        batches: getLength(batchRes),
        instructors: getLength(instRes),
        rooms: getLength(roomRes),
        courses: getLength(courseRes),
        timings: getLength(timingRes),
        sections: getLength(secRes)
      });
    } catch (err) {
      console.error('Failed to fetch academic stats overview:', err);
      setError('Failed to load academic data counts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const overviewEntities = [
    { key: 'departments', label: 'Departments', icon: Building2 },
    { key: 'divisions', label: 'Divisions', icon: Users },
    { key: 'batches', label: 'Batches', icon: Layers },
    { key: 'instructors', label: 'Instructors', icon: GraduationCap },
    { key: 'rooms', label: 'Rooms', icon: DoorOpen },
    { key: 'courses', label: 'Courses', icon: BookOpen },
    { key: 'timings', label: 'Timings', icon: Clock },
    { key: 'sections', label: 'Sections', icon: CalendarDays }
  ];

  return (
    <section className="overview-stats-section" aria-labelledby="overview-stats-heading">
      <div className="container">
        <div className="overview-header-centered">
          <div className="overview-badge">
            <Database size={14} />
            <span>Live Academic Database</span>
          </div>
          <h2 id="overview-stats-heading" className="overview-title">
            Academic Data Overview
          </h2>
          <div className="overview-divider" aria-hidden="true" />
          <p className="overview-subtitle">
            Summary of configured academic assets ready for constraint-based scheduling
          </p>
        </div>

        {error ? (
          <div className="overview-error-box" role="alert">
            <AlertCircle size={18} />
            <span>{error}</span>
            <button className="overview-retry-btn" onClick={fetchStats}>
              <RefreshCw size={14} /> Retry
            </button>
          </div>
        ) : (
          <div className="stats-compact-grid" role="list" aria-label="Academic entity counts">
            {overviewEntities.map((item) => {
              const Icon = item.icon;
              const countValue = counts[item.key];

              return (
                <div key={item.key} className="stat-compact-card" role="listitem">
                  <div className="stat-card-icon-subtle" aria-hidden="true">
                    <Icon size={18} />
                  </div>
                  <div className="stat-metric-primary">
                    {loading ? (
                      <span className="stat-loading-pulse" aria-label="Loading...">·</span>
                    ) : (
                      countValue ?? 0
                    )}
                  </div>
                  <div className="stat-metric-name">{item.label}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
