import React, { useState, useEffect, useRef } from 'react';
import { 
  Building2, Users, Layers, GraduationCap, DoorOpen, 
  BookOpen, Clock, CalendarDays, Plus, Edit2, Trash2, 
  AlertCircle, CheckCircle2, X, RefreshCw, Info, ArrowLeft, ShieldAlert, Check
} from 'lucide-react';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import dataApi from '../services/dataApi';
import './DataEntry.css';

const TABS = [
  { id: 'departments', label: 'Departments', singular: 'Department', icon: Building2 },
  { id: 'divisions', label: 'Divisions', singular: 'Division', icon: Users },
  { id: 'batches', label: 'Batches', singular: 'Batch', icon: Layers },
  { id: 'instructors', label: 'Instructors', singular: 'Instructor', icon: GraduationCap },
  { id: 'rooms', label: 'Rooms', singular: 'Room', icon: DoorOpen },
  { id: 'courses', label: 'Courses', singular: 'Course', icon: BookOpen },
  { id: 'meeting-times', label: 'Timings', singular: 'Meeting Time', icon: Clock },
  { id: 'sections', label: 'Sections', singular: 'Section', icon: CalendarDays },
];

export default function DataEntry({ onNavigate }) {
  const [activeTab, setActiveTab] = useState('departments');
  const [loading, setLoading] = useState(false);
  const [dataList, setDataList] = useState([]);
  const [errorBanner, setErrorBanner] = useState(null);
  const [successBanner, setSuccessBanner] = useState(null);

  // Aux state for relationship dropdowns
  const [departments, setDepartments] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [batches, setBatches] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [courses, setCourses] = useState([]);
  const [meetingTimes, setMeetingTimes] = useState([]);

  // Form Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [formData, setFormData] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const formRef = useRef(null);

  // Delete Dialog State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Eligibility Manager Modal (for Instructors or Courses)
  const [eligibilityModalOpen, setEligibilityModalOpen] = useState(false);
  const [selectedEntityForEligibility, setSelectedEntityForEligibility] = useState(null);
  const [selectedEligibleId, setSelectedEligibleId] = useState('');
  const [eligibilityLoading, setEligibilityLoading] = useState(false);

  // Load lookup data for dropdowns
  const refreshLookups = async () => {
    try {
      const [deptRes, divRes, batchRes, instRes, roomRes, courseRes, timeRes] = await Promise.all([
        dataApi.getDepartments().catch(() => ({ data: [] })),
        dataApi.getDivisions().catch(() => ({ data: [] })),
        dataApi.getBatches().catch(() => ({ data: [] })),
        dataApi.getInstructors().catch(() => ({ data: [] })),
        dataApi.getRooms().catch(() => ({ data: [] })),
        dataApi.getCourses().catch(() => ({ data: [] })),
        dataApi.getMeetingTimes().catch(() => ({ data: [] })),
      ]);
      setDepartments(deptRes.data || []);
      setDivisions(divRes.data || []);
      setBatches(batchRes.data || []);
      setInstructors(instRes.data || []);
      setRooms(roomRes.data || []);
      setCourses(courseRes.data || []);
      setMeetingTimes(timeRes.data || []);
    } catch (err) {
      console.error('Failed to load lookup data', err);
    }
  };

  // Load data for active tab
  const loadActiveTabData = async () => {
    setLoading(true);
    setErrorBanner(null);
    try {
      let res;
      switch (activeTab) {
        case 'departments':
          res = await dataApi.getDepartments();
          break;
        case 'divisions':
          res = await dataApi.getDivisions();
          break;
        case 'batches':
          res = await dataApi.getBatches();
          break;
        case 'instructors':
          res = await dataApi.getInstructors();
          break;
        case 'rooms':
          res = await dataApi.getRooms();
          break;
        case 'courses':
          res = await dataApi.getCourses();
          break;
        case 'meeting-times':
          res = await dataApi.getMeetingTimes();
          break;
        case 'sections':
          res = await dataApi.getSections();
          break;
        default:
          res = { data: [] };
      }
      setDataList(res.data || []);
    } catch (err) {
      setErrorBanner(err.message || 'Failed to fetch records. Please verify backend connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshLookups();
  }, []);

  useEffect(() => {
    loadActiveTabData();
    handleCancelEdit();
  }, [activeTab]);

  const currentTabConfig = TABS.find(t => t.id === activeTab) || TABS[0];
  const TabIcon = currentTabConfig.icon;

  // Tab change
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setErrorBanner(null);
    setSuccessBanner(null);
  };

  // Navigation handlers
  const currentTabIndex = TABS.findIndex(t => t.id === activeTab);
  
  const handleNavBack = () => {
    if (currentTabIndex > 0) {
      setActiveTab(TABS[currentTabIndex - 1].id);
    } else if (onNavigate) {
      onNavigate('home');
    }
  };

  const handleNavNext = () => {
    if (currentTabIndex < TABS.length - 1) {
      setActiveTab(TABS[currentTabIndex + 1].id);
    } else if (onNavigate) {
      onNavigate('generate');
    }
  };

  // Enter Edit Mode for a record
  const handleStartEdit = (record) => {
    setIsEditing(true);
    setEditingRecord(record);
    setErrorBanner(null);

    switch (activeTab) {
      case 'departments':
        setFormData({ name: record.name || '' });
        break;
      case 'divisions':
        setFormData({ 
          name: record.name || '', 
          departmentId: record.departmentId || record.department?.id || '', 
          totalStudents: record.totalStudents !== undefined ? record.totalStudents : 88 
        });
        break;
      case 'batches':
        setFormData({ 
          name: record.name || '', 
          divisionId: record.divisionId || record.division?.id || '', 
          studentCount: record.studentCount !== undefined ? record.studentCount : 22 
        });
        break;
      case 'instructors':
        setFormData({ 
          uid: record.uid || '', 
          name: record.name || '', 
          maxBatchesPerWeek: record.maxBatchesPerWeek !== undefined ? record.maxBatchesPerWeek : 4, 
          maxLectureDivisions: record.maxLectureDivisions !== undefined ? record.maxLectureDivisions : 2 
        });
        break;
      case 'rooms':
        setFormData({ 
          roomNumber: record.roomNumber || record.number || '', 
          number: record.roomNumber || record.number || '', 
          capacity: record.capacity !== undefined ? record.capacity : (record.seatingCapacity !== undefined ? record.seatingCapacity : 100), 
          seatingCapacity: record.capacity !== undefined ? record.capacity : (record.seatingCapacity !== undefined ? record.seatingCapacity : 100), 
          roomType: (record.roomType || 'LECTURE').toUpperCase()
        });
        break;
      case 'courses':
        setFormData({ 
          code: record.code || '', 
          name: record.name || '', 
          maxStudents: record.maxStudents !== undefined ? record.maxStudents : 88,
          courseType: (record.courseType || 'LECTURE').toUpperCase(), 
          isElective: Boolean(record.isElective),
          instructorIds: record.instructors ? record.instructors.map(i => i.id) : []
        });
        break;
      case 'meeting-times':
        setFormData({ 
          pid: record.pid || '',
          day: record.day || record.dayOfWeek || 'Monday', 
          dayOfWeek: record.day || record.dayOfWeek || 'Monday', 
          time: record.time || record.timeRange || '', 
          timeRange: record.time || record.timeRange || '', 
          slotType: (record.slotType || 'LECTURE').toUpperCase(), 
          isElectiveSlot: record.slotType === 'ELECTIVE' || Boolean(record.isElectiveSlot) 
        });
        break;
      case 'sections':
        setFormData({ 
          sectionId: record.sectionId || '',
          departmentId: record.departmentId || record.department?.id || (departments[0]?.id || ''),
          divisionId: record.divisionId || record.division?.id || '', 
          batchId: record.batchId || record.batch?.id || '', 
          courseId: record.courseId || record.course?.id || '', 
          sessionsPerWeek: record.sessionsPerWeek || record.numClassesPerWeek || 3,
          numClassesPerWeek: record.sessionsPerWeek || record.numClassesPerWeek || 3,
          isElective: Boolean(record.isElective),
          electiveGroup: record.electiveGroup || 'G1',
          instructorId: record.instructorId || record.instructor?.id || '', 
          roomId: record.roomId || record.room?.id || '', 
          meetingTimeId: record.meetingTimeId || record.meetingTime?.id || ''
        });
        break;
      default:
        setFormData({});
    }

    if (formRef.current && typeof formRef.current.scrollIntoView === 'function') {
      formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Cancel Edit Mode
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingRecord(null);
    setFormData({});
  };

  // Form Submit (Create or Update)
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorBanner(null);

    try {
      if (isEditing) {
        // UPDATE EXISTING RECORD
        const id = editingRecord.id;
        switch (activeTab) {
          case 'departments':
            await dataApi.updateDepartment(id, { name: formData.name?.trim() });
            break;
          case 'divisions':
            await dataApi.updateDivision(id, { 
              name: formData.name?.trim(), 
              departmentId: parseInt(formData.departmentId, 10),
              totalStudents: parseInt(formData.totalStudents, 10)
            });
            break;
          case 'batches':
            await dataApi.updateBatch(id, { 
              name: formData.name?.trim(), 
              divisionId: parseInt(formData.divisionId, 10),
              studentCount: parseInt(formData.studentCount, 10)
            });
            break;
          case 'instructors':
            await dataApi.updateInstructor(id, { 
              uid: formData.uid?.trim(), 
              name: formData.name?.trim(),
              maxBatchesPerWeek: formData.maxBatchesPerWeek !== undefined ? parseInt(formData.maxBatchesPerWeek, 10) : 4,
              maxLectureDivisions: formData.maxLectureDivisions !== undefined ? parseInt(formData.maxLectureDivisions, 10) : 2
            });
            break;
          case 'rooms':
            await dataApi.updateRoom(id, { 
              number: (formData.number || formData.roomNumber)?.trim(),
              roomNumber: (formData.number || formData.roomNumber)?.trim(),
              seatingCapacity: parseInt(formData.seatingCapacity !== undefined ? formData.seatingCapacity : formData.capacity, 10),
              capacity: parseInt(formData.seatingCapacity !== undefined ? formData.seatingCapacity : formData.capacity, 10),
              roomType: formData.roomType?.toUpperCase()
            });
            break;
          case 'courses':
            await dataApi.updateCourse(id, { 
              code: formData.code?.trim(), 
              name: formData.name?.trim(),
              maxStudents: formData.maxStudents ? parseInt(formData.maxStudents, 10) : 88,
              courseType: formData.courseType?.toUpperCase(),
              isElective: Boolean(formData.isElective),
              instructorIds: Array.isArray(formData.instructorIds) ? formData.instructorIds : []
            });
            break;
          case 'meeting-times':
            await dataApi.updateMeetingTime(id, { 
              pid: formData.pid?.trim(),
              day: (formData.day || formData.dayOfWeek)?.trim(),
              dayOfWeek: (formData.day || formData.dayOfWeek)?.trim(),
              time: (formData.time || formData.timeRange)?.trim(),
              timeRange: (formData.time || formData.timeRange)?.trim(),
              slotType: formData.slotType?.toUpperCase(),
              isElectiveSlot: Boolean(formData.isElectiveSlot)
            });
            break;
          case 'sections': {
            const selectedCourse = courses.find(c => String(c.id) === String(formData.courseId));
            const isLab = selectedCourse?.courseType?.toUpperCase() === 'LAB';
            
            let divId = formData.divisionId ? parseInt(formData.divisionId, 10) : null;
            let batId = formData.batchId ? parseInt(formData.batchId, 10) : null;

            if (isLab && batId && !divId) {
              const bObj = batches.find(b => String(b.id) === String(batId));
              if (bObj?.divisionId) divId = bObj.divisionId;
            }

            await dataApi.updateSection(id, { 
              sectionId: formData.sectionId?.trim(),
              courseId: parseInt(formData.courseId, 10),
              departmentId: formData.departmentId ? parseInt(formData.departmentId, 10) : (departments[0]?.id || 1),
              divisionId: divId,
              batchId: isLab ? batId : null,
              numClassesPerWeek: parseInt(formData.sessionsPerWeek || formData.numClassesPerWeek || 3, 10),
              sessionsPerWeek: parseInt(formData.sessionsPerWeek || formData.numClassesPerWeek || 3, 10),
              isElective: Boolean(formData.isElective),
              electiveGroup: formData.isElective ? (formData.electiveGroup || 'G1') : null,
              instructorId: formData.instructorId ? parseInt(formData.instructorId, 10) : null,
              roomId: formData.roomId ? parseInt(formData.roomId, 10) : null,
              meetingTimeId: formData.meetingTimeId ? parseInt(formData.meetingTimeId, 10) : null
            });
            break;
          }
        }
        setSuccessBanner(`Updated ${currentTabConfig.singular.toLowerCase()} successfully.`);
        handleCancelEdit();
      } else {
        // CREATE NEW RECORD
        switch (activeTab) {
          case 'departments':
            await dataApi.createDepartment({ name: formData.name?.trim() });
            break;
          case 'divisions':
            await dataApi.createDivision({ 
              name: formData.name?.trim(), 
              departmentId: parseInt(formData.departmentId, 10),
              totalStudents: parseInt(formData.totalStudents || 88, 10)
            });
            break;
          case 'batches':
            await dataApi.createBatch({ 
              name: formData.name?.trim(), 
              divisionId: parseInt(formData.divisionId, 10),
              studentCount: parseInt(formData.studentCount || 22, 10)
            });
            break;
          case 'instructors':
            await dataApi.createInstructor({ 
              uid: formData.uid?.trim(), 
              name: formData.name?.trim(),
              maxBatchesPerWeek: formData.maxBatchesPerWeek !== undefined ? parseInt(formData.maxBatchesPerWeek, 10) : 4,
              maxLectureDivisions: formData.maxLectureDivisions !== undefined ? parseInt(formData.maxLectureDivisions, 10) : 2
            });
            break;
          case 'rooms':
            await dataApi.createRoom({ 
              number: (formData.number || formData.roomNumber)?.trim(),
              roomNumber: (formData.number || formData.roomNumber)?.trim(),
              seatingCapacity: parseInt(formData.seatingCapacity !== undefined ? formData.seatingCapacity : (formData.capacity || 100), 10),
              capacity: parseInt(formData.seatingCapacity !== undefined ? formData.seatingCapacity : (formData.capacity || 100), 10),
              roomType: (formData.roomType || 'LECTURE').toUpperCase()
            });
            break;
          case 'courses':
            await dataApi.createCourse({ 
              code: formData.code?.trim(), 
              name: formData.name?.trim(),
              maxStudents: formData.maxStudents ? parseInt(formData.maxStudents, 10) : 88,
              courseType: (formData.courseType || 'LECTURE').toUpperCase(),
              isElective: Boolean(formData.isElective),
              instructorIds: Array.isArray(formData.instructorIds) ? formData.instructorIds : []
            });
            break;
          case 'meeting-times':
            await dataApi.createMeetingTime({ 
              pid: formData.pid?.trim(),
              day: (formData.day || formData.dayOfWeek || 'Monday').trim(),
              dayOfWeek: (formData.day || formData.dayOfWeek || 'Monday').trim(),
              time: (formData.time || formData.timeRange)?.trim(),
              timeRange: (formData.time || formData.timeRange)?.trim(),
              slotType: (formData.slotType || 'LECTURE').toUpperCase(),
              isElectiveSlot: Boolean(formData.isElectiveSlot)
            });
            break;
          case 'sections': {
            const selectedCourse = courses.find(c => String(c.id) === String(formData.courseId));
            const isLab = selectedCourse?.courseType?.toUpperCase() === 'LAB';
            
            let divId = formData.divisionId ? parseInt(formData.divisionId, 10) : null;
            let batId = formData.batchId ? parseInt(formData.batchId, 10) : null;

            if (isLab && batId && !divId) {
              const bObj = batches.find(b => String(b.id) === String(batId));
              if (bObj?.divisionId) divId = bObj.divisionId;
            }

            await dataApi.createSection({ 
              sectionId: formData.sectionId?.trim(),
              courseId: parseInt(formData.courseId, 10),
              departmentId: formData.departmentId ? parseInt(formData.departmentId, 10) : (departments[0]?.id || 1),
              divisionId: divId,
              batchId: isLab ? batId : null,
              numClassesPerWeek: parseInt(formData.sessionsPerWeek || formData.numClassesPerWeek || 3, 10),
              sessionsPerWeek: parseInt(formData.sessionsPerWeek || formData.numClassesPerWeek || 3, 10),
              isElective: Boolean(formData.isElective),
              electiveGroup: formData.isElective ? (formData.electiveGroup || 'G1') : null,
              instructorId: formData.instructorId ? parseInt(formData.instructorId, 10) : null,
              roomId: formData.roomId ? parseInt(formData.roomId, 10) : null,
              meetingTimeId: formData.meetingTimeId ? parseInt(formData.meetingTimeId, 10) : null
            });
            break;
          }
        }
        setSuccessBanner(`Added new ${currentTabConfig.singular.toLowerCase()} successfully.`);
        setFormData({});
      }

      loadActiveTabData();
      refreshLookups();
    } catch (err) {
      setErrorBanner(err.message || 'Operation failed. Please verify input fields.');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Flow
  const handleOpenDelete = (record) => {
    setRecordToDelete(record);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!recordToDelete) return;
    setDeleting(true);
    setErrorBanner(null);

    try {
      const id = recordToDelete.id;
      switch (activeTab) {
        case 'departments':
          await dataApi.deleteDepartment(id);
          break;
        case 'divisions':
          await dataApi.deleteDivision(id);
          break;
        case 'batches':
          await dataApi.deleteBatch(id);
          break;
        case 'instructors':
          await dataApi.deleteInstructor(id);
          break;
        case 'rooms':
          await dataApi.deleteRoom(id);
          break;
        case 'courses':
          await dataApi.deleteCourse(id);
          break;
        case 'meeting-times':
          await dataApi.deleteMeetingTime(id);
          break;
        case 'sections':
          await dataApi.deleteSection(id);
          break;
      }
      setSuccessBanner(`Deleted ${currentTabConfig.singular.toLowerCase()} successfully.`);
      setDeleteModalOpen(false);
      setRecordToDelete(null);
      if (isEditing && editingRecord?.id === id) {
        handleCancelEdit();
      }
      loadActiveTabData();
      refreshLookups();
    } catch (err) {
      setErrorBanner(err.message || 'Cannot delete this record because it is referenced by other academic records.');
      setDeleteModalOpen(false);
    } finally {
      setDeleting(false);
    }
  };

  // Eligibility Manager (for Instructors <-> Courses)
  const handleOpenEligibility = async (entity) => {
    setSelectedEntityForEligibility(entity);
    setSelectedEligibleId('');
    setEligibilityModalOpen(true);
    try {
      setEligibilityLoading(true);
      if (activeTab === 'instructors') {
        const res = await dataApi.getInstructor(entity.id);
        if (res?.data) setSelectedEntityForEligibility(res.data);
      } else if (activeTab === 'courses') {
        const res = await dataApi.getCourse(entity.id);
        if (res?.data) setSelectedEntityForEligibility(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setEligibilityLoading(false);
    }
  };

  const handleAddEligibility = async () => {
    if (!selectedEligibleId || !selectedEntityForEligibility) return;
    setEligibilityLoading(true);
    try {
      if (activeTab === 'instructors') {
        await dataApi.addInstructorEligibility(selectedEntityForEligibility.id, selectedEligibleId);
        const res = await dataApi.getInstructor(selectedEntityForEligibility.id);
        if (res?.data) setSelectedEntityForEligibility(res.data);
      } else if (activeTab === 'courses') {
        await dataApi.addCourseInstructor(selectedEntityForEligibility.id, selectedEligibleId);
        const res = await dataApi.getCourse(selectedEntityForEligibility.id);
        if (res?.data) setSelectedEntityForEligibility(res.data);
      }
      setSelectedEligibleId('');
      loadActiveTabData();
    } catch (err) {
      setErrorBanner(err.message || 'Failed to link eligibility.');
    } finally {
      setEligibilityLoading(false);
    }
  };

  const handleRemoveEligibility = async (targetId) => {
    if (!selectedEntityForEligibility) return;
    setEligibilityLoading(true);
    try {
      if (activeTab === 'instructors') {
        await dataApi.removeInstructorEligibility(selectedEntityForEligibility.id, targetId);
        const res = await dataApi.getInstructor(selectedEntityForEligibility.id);
        if (res?.data) setSelectedEntityForEligibility(res.data);
      } else if (activeTab === 'courses') {
        await dataApi.removeCourseInstructor(selectedEntityForEligibility.id, targetId);
        const res = await dataApi.getCourse(selectedEntityForEligibility.id);
        if (res?.data) setSelectedEntityForEligibility(res.data);
      }
      loadActiveTabData();
    } catch (err) {
      setErrorBanner(err.message || 'Failed to remove eligibility.');
    } finally {
      setEligibilityLoading(false);
    }
  };

  // Course instructor toggle helper
  const handleToggleCourseInstructor = (instId) => {
    const current = Array.isArray(formData.instructorIds) ? [...formData.instructorIds] : [];
    const idx = current.indexOf(instId);
    if (idx > -1) {
      current.splice(idx, 1);
    } else {
      current.push(instId);
    }
    setFormData({ ...formData, instructorIds: current });
  };

  // Determine course selection in Section form for conditional fields
  const selectedCourseForSection = activeTab === 'sections' 
    ? courses.find(c => String(c.id) === String(formData.courseId))
    : null;
  const isSectionLab = selectedCourseForSection?.courseType?.toUpperCase() === 'LAB';
  const isSectionElective = Boolean(formData.isElective || selectedCourseForSection?.isElective);

  return (
    <div className="data-entry-page">
      {/* Feedback Banners */}
      {successBanner && (
        <div className="feedback-banner success" role="status">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={18} />
            <span>{successBanner}</span>
          </div>
          <button className="feedback-close" onClick={() => setSuccessBanner(null)} aria-label="Close notification"><X size={16} /></button>
        </div>
      )}
      {errorBanner && (
        <div className="feedback-banner error" role="alert">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={18} />
            <span>{errorBanner}</span>
          </div>
          <button className="feedback-close" onClick={() => setErrorBanner(null)} aria-label="Close error"><X size={16} /></button>
        </div>
      )}

      {/* Entity Navigation Tabs */}
      <div className="data-tabs-bar" role="tablist">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              className={`data-tab-btn ${isActive ? 'active' : ''}`}
              onClick={() => handleTabChange(tab.id)}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
              {isActive && <span className="tab-badge">{dataList.length}</span>}
            </button>
          );
        })}
      </div>

      {/* Reference Two-Column Layout */}
      <div className="data-entry-grid">
        {/* LEFT COLUMN: Add / Edit Form Card */}
        <div className="data-entry-form-col" ref={formRef}>
          <div className="form-card">
            <div className="form-card-header">
              <TabIcon size={18} className="form-header-icon" />
              <h2 className="form-card-title">
                {isEditing ? `Edit ${currentTabConfig.singular}` : `Add ${currentTabConfig.singular}`}
              </h2>
              {isEditing && (
                <span className="editing-badge">Editing Mode</span>
              )}
            </div>

            <form onSubmit={handleFormSubmit} className="form-card-body">
              {/* 1. Department Form */}
              {activeTab === 'departments' && (
                <div className="form-field-group">
                  <label className="field-label">DEPARTMENT NAME</label>
                  <input 
                    type="text" 
                    required
                    className="field-input" 
                    value={formData.name || ''} 
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Computer Engineering"
                  />
                </div>
              )}

              {/* 2. Division Form */}
              {activeTab === 'divisions' && (
                <>
                  <div className="form-field-group">
                    <label className="field-label">DIVISION NAME</label>
                    <input 
                      type="text" 
                      required
                      className="field-input" 
                      value={formData.name || ''} 
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. TE-I"
                    />
                  </div>
                  <div className="form-field-group">
                    <label className="field-label">DEPARTMENT</label>
                    <select 
                      required
                      className="field-input"
                      value={formData.departmentId || ''}
                      onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                    >
                      <option value="">---------</option>
                      {departments.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-field-group">
                    <label className="field-label">TOTAL STUDENTS</label>
                    <input 
                      type="number" 
                      required
                      min="0"
                      className="field-input" 
                      value={formData.totalStudents !== undefined ? formData.totalStudents : 88} 
                      onChange={(e) => setFormData({ ...formData, totalStudents: e.target.value })}
                      placeholder="88"
                    />
                  </div>
                </>
              )}

              {/* 3. Batch Form */}
              {activeTab === 'batches' && (
                <>
                  <div className="form-field-group">
                    <label className="field-label">BATCH NAME</label>
                    <input 
                      type="text" 
                      required
                      className="field-input" 
                      value={formData.name || ''} 
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. K1"
                    />
                  </div>
                  <div className="form-field-group">
                    <label className="field-label">DIVISION</label>
                    <select 
                      required
                      className="field-input"
                      value={formData.divisionId || ''}
                      onChange={(e) => setFormData({ ...formData, divisionId: e.target.value })}
                    >
                      <option value="">---------</option>
                      {divisions.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-field-group">
                    <label className="field-label">STUDENT COUNT</label>
                    <input 
                      type="number" 
                      required
                      min="0"
                      className="field-input" 
                      value={formData.studentCount !== undefined ? formData.studentCount : 22} 
                      onChange={(e) => setFormData({ ...formData, studentCount: e.target.value })}
                      placeholder="22"
                    />
                  </div>
                </>
              )}

              {/* 4. Instructor Form */}
              {activeTab === 'instructors' && (
                <>
                  <div className="form-field-group">
                    <label className="field-label">TEACHER ID</label>
                    <input 
                      type="text" 
                      required
                      className="field-input" 
                      value={formData.uid || ''} 
                      onChange={(e) => setFormData({ ...formData, uid: e.target.value })}
                      placeholder="e.g. T001"
                    />
                  </div>
                  <div className="form-field-group">
                    <label className="field-label">FULL NAME</label>
                    <input 
                      type="text" 
                      required
                      className="field-input" 
                      value={formData.name || ''} 
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Dr. A.B. Sharma"
                    />
                  </div>
                </>
              )}

              {/* 5. Room Form */}
              {activeTab === 'rooms' && (
                <>
                  <div className="form-field-group">
                    <label className="field-label">ROOM NUMBER</label>
                    <input 
                      type="text" 
                      required
                      className="field-input" 
                      value={formData.roomNumber || formData.number || ''} 
                      onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value, number: e.target.value })}
                      placeholder="e.g. A1-309"
                    />
                  </div>
                  <div className="form-field-group">
                    <label className="field-label">CAPACITY</label>
                    <input 
                      type="number" 
                      required
                      min="1"
                      className="field-input" 
                      value={formData.capacity !== undefined ? formData.capacity : (formData.seatingCapacity !== undefined ? formData.seatingCapacity : 100)} 
                      onChange={(e) => setFormData({ ...formData, capacity: e.target.value, seatingCapacity: e.target.value })}
                      placeholder="100"
                    />
                  </div>
                  <div className="form-field-group">
                    <label className="field-label">ROOM TYPE</label>
                    <select 
                      className="field-input"
                      value={formData.roomType || 'LECTURE'}
                      onChange={(e) => setFormData({ ...formData, roomType: e.target.value })}
                    >
                      <option value="LECTURE">Lecture</option>
                      <option value="LAB">Lab</option>
                    </select>
                  </div>
                </>
              )}

              {/* 6. Course Form */}
              {activeTab === 'courses' && (
                <>
                  <div className="form-field-group">
                    <label className="field-label">COURSE CODE</label>
                    <input 
                      type="text" 
                      required
                      className="field-input" 
                      value={formData.code || ''} 
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      placeholder="e.g. AI"
                    />
                  </div>
                  <div className="form-field-group">
                    <label className="field-label">COURSE NAME</label>
                    <input 
                      type="text" 
                      required
                      className="field-input" 
                      value={formData.name || ''} 
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Artificial Intelligence"
                    />
                  </div>
                  <div className="form-field-group">
                    <label className="field-label">MAX STUDENTS</label>
                    <input 
                      type="number" 
                      min="1"
                      className="field-input" 
                      value={formData.maxStudents !== undefined ? formData.maxStudents : 88} 
                      onChange={(e) => setFormData({ ...formData, maxStudents: e.target.value })}
                      placeholder="88"
                    />
                  </div>
                  <div className="form-field-group">
                    <label className="field-label">COURSE TYPE</label>
                    <select 
                      className="field-input"
                      value={formData.courseType || 'LECTURE'}
                      onChange={(e) => setFormData({ ...formData, courseType: e.target.value })}
                    >
                      <option value="LECTURE">Lecture</option>
                      <option value="LAB">Lab</option>
                    </select>
                  </div>
                  <div className="form-checkbox-group">
                    <label className="checkbox-label">
                      <input 
                        type="checkbox"
                        checked={Boolean(formData.isElective)}
                        onChange={(e) => setFormData({ ...formData, isElective: e.target.checked })}
                      />
                      <span>Is Elective?</span>
                    </label>
                  </div>
                  <div className="form-field-group">
                    <label className="field-label">QUALIFIED INSTRUCTORS</label>
                    <div className="instructor-multi-select">
                      {instructors.map(inst => {
                        const isChecked = Array.isArray(formData.instructorIds) && formData.instructorIds.includes(inst.id);
                        return (
                          <label key={inst.id} className={`inst-checkbox-item ${isChecked ? 'selected' : ''}`}>
                            <input 
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleToggleCourseInstructor(inst.id)}
                            />
                            <span>{inst.uid} — {inst.name}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}

              {/* 7. Meeting Time Form */}
              {activeTab === 'meeting-times' && (
                <>
                  <div className="form-field-group">
                    <label className="field-label">MEETING ID (OPTIONAL)</label>
                    <input 
                      type="text" 
                      className="field-input" 
                      value={formData.pid || ''} 
                      onChange={(e) => setFormData({ ...formData, pid: e.target.value })}
                      placeholder="e.g. L001 (auto if blank)"
                    />
                  </div>
                  <div className="form-field-group">
                    <label className="field-label">DAY</label>
                    <select 
                      className="field-input"
                      value={formData.day || formData.dayOfWeek || 'Monday'}
                      onChange={(e) => setFormData({ ...formData, day: e.target.value, dayOfWeek: e.target.value })}
                    >
                      <option value="Monday">Monday</option>
                      <option value="Tuesday">Tuesday</option>
                      <option value="Wednesday">Wednesday</option>
                      <option value="Thursday">Thursday</option>
                      <option value="Friday">Friday</option>
                      <option value="Saturday">Saturday</option>
                    </select>
                  </div>
                  <div className="form-field-group">
                    <label className="field-label">TIME SLOT</label>
                    <input 
                      type="text" 
                      required
                      className="field-input" 
                      value={formData.time || formData.timeRange || ''} 
                      onChange={(e) => setFormData({ ...formData, time: e.target.value, timeRange: e.target.value })}
                      placeholder="08:45 - 09:45"
                    />
                    <small className="field-hint">Use zero-padded times such as 08:45 instead of 8:45</small>
                  </div>
                  <div className="form-field-group">
                    <label className="field-label">SLOT TYPE</label>
                    <select 
                      className="field-input"
                      value={formData.slotType || 'LECTURE'}
                      onChange={(e) => setFormData({ ...formData, slotType: e.target.value })}
                    >
                      <option value="LECTURE">Lecture</option>
                      <option value="LAB">Lab</option>
                    </select>
                  </div>
                </>
              )}

              {/* 8. Section Form */}
              {activeTab === 'sections' && (
                <>
                  <div className="form-field-group">
                    <label className="field-label">COURSE</label>
                    <select 
                      required
                      className="field-input"
                      value={formData.courseId || ''}
                      onChange={(e) => {
                        const newCourseId = e.target.value;
                        const crs = courses.find(c => String(c.id) === String(newCourseId));
                        setFormData({ 
                          ...formData, 
                          courseId: newCourseId,
                          isElective: crs ? crs.isElective : formData.isElective
                        });
                      }}
                    >
                      <option value="">-- Select Course --</option>
                      {courses.map(c => (
                        <option key={c.id} value={c.id}>{c.code} — {c.name} ({c.courseType})</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-field-group">
                    <label className="field-label">CLASSES PER WEEK</label>
                    <input 
                      type="number" 
                      required
                      min="1"
                      className="field-input" 
                      value={formData.sessionsPerWeek || formData.numClassesPerWeek || 3} 
                      onChange={(e) => setFormData({ ...formData, sessionsPerWeek: e.target.value, numClassesPerWeek: e.target.value })}
                      placeholder="3"
                    />
                  </div>

                  {/* Conditional: Lecture Course shows Division, Lab Course hides Division */}
                  {!isSectionLab && (
                    <div className="form-field-group">
                      <label className="field-label">DIVISION (FOR LECTURE)</label>
                      <select 
                        required={!isSectionLab}
                        className="field-input"
                        value={formData.divisionId || ''}
                        onChange={(e) => setFormData({ ...formData, divisionId: e.target.value })}
                      >
                        <option value="">-- Select Division --</option>
                        {divisions.map(d => (
                          <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Conditional: Lab Course shows Batch, Lecture Course hides Batch */}
                  {isSectionLab && (
                    <div className="form-field-group">
                      <label className="field-label">BATCH (FOR LAB)</label>
                      <select 
                        required={isSectionLab}
                        className="field-input"
                        value={formData.batchId || ''}
                        onChange={(e) => {
                          const bId = e.target.value;
                          const bObj = batches.find(b => String(b.id) === String(bId));
                          setFormData({ 
                            ...formData, 
                            batchId: bId,
                            divisionId: bObj ? bObj.divisionId : formData.divisionId 
                          });
                        }}
                      >
                        <option value="">-- Select Lab Batch --</option>
                        {batches.map(b => (
                          <option key={b.id} value={b.id}>{b.name} ({b.division?.name || 'Div'})</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Conditional: Elective Group */}
                  {isSectionElective && (
                    <div className="form-field-group">
                      <label className="field-label">ELECTIVE GROUP</label>
                      <select 
                        className="field-input"
                        value={formData.electiveGroup || 'G1'}
                        onChange={(e) => setFormData({ ...formData, electiveGroup: e.target.value })}
                      >
                        <option value="G1">G1 (Group 1)</option>
                        <option value="G2">G2 (Group 2)</option>
                      </select>
                    </div>
                  )}
                </>
              )}

              {/* Submit / Update Action Buttons */}
              <div className="form-submit-row">
                <button 
                  type="submit" 
                  className="btn-dark-save"
                  disabled={submitting}
                  aria-label={isEditing ? `Update ${currentTabConfig.singular}` : 'Create record'}
                >
                  {submitting ? (
                    <span>Processing...</span>
                  ) : isEditing ? (
                    <>
                      <Check size={16} />
                      <span>Update {currentTabConfig.singular}</span>
                    </>
                  ) : (
                    <>
                      <Plus size={16} />
                      <span>Save {currentTabConfig.singular}</span>
                    </>
                  )}
                </button>

                {isEditing && (
                  <button 
                    type="button" 
                    className="btn-cancel-edit"
                    onClick={handleCancelEdit}
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Under Form: Back / Next Navigation */}
          <div className="data-navigation-row">
            <button 
              type="button" 
              className="btn-nav-step" 
              onClick={handleNavBack}
            >
              ← Back
            </button>
            <button 
              type="button" 
              className="btn-nav-step" 
              onClick={handleNavNext}
            >
              Next →
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: Existing Records Card */}
        <div className="data-entry-table-col">
          <div className="records-card">
            <div className="records-card-header">
              <h3 className="records-card-title">Existing {currentTabConfig.label}</h3>
              <span className="count-pill-badge">{dataList.length}</span>
            </div>

            {loading ? (
              <div className="loading-state-box">
                <RefreshCw size={28} className="spinner-icon" />
                <p>Loading {currentTabConfig.label.toLowerCase()}...</p>
              </div>
            ) : dataList.length === 0 ? (
              <div className="empty-state-box">
                <AlertCircle size={32} color="var(--text-secondary)" />
                <h4>No records found</h4>
                <p>Use the form on the left to add your first {currentTabConfig.singular.toLowerCase()}.</p>
              </div>
            ) : (
              <div className="records-table-container">
                <table className="records-table">
                  <thead>
                    {activeTab === 'departments' && (
                      <tr>
                        <th style={{ width: '48px' }}>#</th>
                        <th>DEPARTMENT NAME</th>
                        <th style={{ width: '120px', textAlign: 'center' }}>ACTION</th>
                      </tr>
                    )}
                    {activeTab === 'divisions' && (
                      <tr>
                        <th style={{ width: '48px' }}>#</th>
                        <th>DIVISION</th>
                        <th>DEPARTMENT</th>
                        <th style={{ textAlign: 'center' }}>STUDENTS</th>
                        <th style={{ width: '120px', textAlign: 'center' }}>ACTION</th>
                      </tr>
                    )}
                    {activeTab === 'batches' && (
                      <tr>
                        <th style={{ width: '48px' }}>#</th>
                        <th>BATCH</th>
                        <th>DIVISION</th>
                        <th style={{ textAlign: 'center' }}>STUDENTS</th>
                        <th style={{ width: '120px', textAlign: 'center' }}>ACTION</th>
                      </tr>
                    )}
                    {activeTab === 'instructors' && (
                      <tr>
                        <th style={{ width: '48px' }}>#</th>
                        <th>TEACHER ID</th>
                        <th>FULL NAME</th>
                        <th>COURSES</th>
                        <th style={{ width: '120px', textAlign: 'center' }}>ACTION</th>
                      </tr>
                    )}
                    {activeTab === 'rooms' && (
                      <tr>
                        <th style={{ width: '48px' }}>#</th>
                        <th>ROOM NO.</th>
                        <th style={{ textAlign: 'center' }}>CAPACITY</th>
                        <th style={{ textAlign: 'center' }}>TYPE</th>
                        <th style={{ width: '120px', textAlign: 'center' }}>ACTION</th>
                      </tr>
                    )}
                    {activeTab === 'courses' && (
                      <tr>
                        <th style={{ width: '48px' }}>#</th>
                        <th>CODE</th>
                        <th>NAME</th>
                        <th style={{ textAlign: 'center' }}>TYPE</th>
                        <th style={{ textAlign: 'center' }}>ELECTIVE</th>
                        <th>TEACHERS</th>
                        <th style={{ width: '120px', textAlign: 'center' }}>ACTION</th>
                      </tr>
                    )}
                    {activeTab === 'meeting-times' && (
                      <tr>
                        <th style={{ width: '48px' }}>#</th>
                        <th>ID</th>
                        <th>DAY</th>
                        <th>TIME SLOT</th>
                        <th style={{ textAlign: 'center' }}>TYPE</th>
                        <th style={{ width: '120px', textAlign: 'center' }}>ACTION</th>
                      </tr>
                    )}
                    {activeTab === 'sections' && (
                      <tr>
                        <th style={{ width: '48px' }}>#</th>
                        <th>SECTION ID</th>
                        <th>COURSE</th>
                        <th>DIV / BATCH</th>
                        <th style={{ textAlign: 'center' }}>/WEEK</th>
                        <th style={{ textAlign: 'center' }}>ELECTIVE</th>
                        <th style={{ width: '120px', textAlign: 'center' }}>ACTION</th>
                      </tr>
                    )}
                  </thead>
                  <tbody>
                    {dataList.map((record, index) => {
                      const isRowEditing = isEditing && editingRecord?.id === record.id;
                      return (
                        <tr key={record.id || index} className={isRowEditing ? 'row-is-editing' : ''}>
                          {/* # Index Column */}
                          <td className="col-index">#{record.id || index + 1}</td>

                          {/* 1. Departments */}
                          {activeTab === 'departments' && (
                            <td className="col-primary-text">{record.name}</td>
                          )}

                          {/* 2. Divisions */}
                          {activeTab === 'divisions' && (
                            <>
                              <td className="col-primary-bold">{record.name}</td>
                              <td className="col-secondary-text">{record.department?.name || departments.find(d => d.id === record.departmentId)?.name || '-'}</td>
                              <td style={{ textAlign: 'center' }}>
                                <span className="pill-badge-gray">{record.totalStudents !== undefined ? record.totalStudents : 88}</span>
                              </td>
                            </>
                          )}

                          {/* 3. Batches */}
                          {activeTab === 'batches' && (
                            <>
                              <td className="col-primary-bold">{record.name}</td>
                              <td className="col-secondary-text">{record.division?.name || divisions.find(d => d.id === record.divisionId)?.name || '-'}</td>
                              <td style={{ textAlign: 'center' }}>
                                <span className="pill-badge-gray">{record.studentCount !== undefined ? record.studentCount : 22}</span>
                              </td>
                            </>
                          )}

                          {/* 4. Instructors */}
                          {activeTab === 'instructors' && (
                            <>
                              <td>
                                <span className="pill-badge-dark">{record.uid}</span>
                              </td>
                              <td className="col-primary-text">{record.name}</td>
                              <td>
                                <button
                                  type="button"
                                  className="btn-icon-action"
                                  style={{ fontSize: '0.75rem', padding: '3px 8px' }}
                                  onClick={() => handleOpenEligibility(record)}
                                >
                                  Courses ({record.courses?.length || 0})
                                </button>
                              </td>
                            </>
                          )}

                          {/* 5. Rooms */}
                          {activeTab === 'rooms' && (
                            <>
                              <td className="col-primary-bold">{record.number || record.roomNumber}</td>
                              <td style={{ textAlign: 'center' }} className="col-secondary-text">{record.seatingCapacity !== undefined ? record.seatingCapacity : record.capacity}</td>
                              <td style={{ textAlign: 'center' }}>
                                <span className={(record.roomType || '').toUpperCase() === 'LAB' ? 'pill-badge-lab' : 'pill-badge-blue'}>
                                  {(record.roomType || 'LECTURE').toUpperCase() === 'LAB' ? 'Lab' : 'Lecture'}
                                </span>
                              </td>
                            </>
                          )}

                          {/* 6. Courses */}
                          {activeTab === 'courses' && (
                            <>
                              <td className="col-primary-bold">{record.code}</td>
                              <td className="col-primary-text">{record.name}</td>
                              <td style={{ textAlign: 'center' }}>
                                <span className={(record.courseType || '').toUpperCase() === 'LAB' ? 'pill-badge-lab' : 'pill-badge-blue'}>
                                  {(record.courseType || 'LECTURE').toUpperCase() === 'LAB' ? 'Lab' : 'Lecture'}
                                </span>
                              </td>
                              <td style={{ textAlign: 'center' }}>
                                {record.isElective ? (
                                  <span className="pill-badge-purple">Elective</span>
                                ) : (
                                  <span className="col-secondary-text">-</span>
                                )}
                              </td>
                              <td className="col-secondary-text" style={{ fontSize: '0.82rem' }}>
                                {record.instructors && record.instructors.length > 0 
                                  ? record.instructors.map(i => i.uid || i.name).join(', ') 
                                  : '-'}
                              </td>
                            </>
                          )}

                          {/* 7. Meeting Times */}
                          {activeTab === 'meeting-times' && (
                            <>
                              <td className="col-primary-bold">{record.pid || `#${record.id}`}</td>
                              <td className="col-primary-text">{record.day || record.dayOfWeek}</td>
                              <td className="col-secondary-text">{record.time || record.timeRange}</td>
                              <td style={{ textAlign: 'center' }}>
                                <span className={(record.slotType || '').toUpperCase() === 'LAB' ? 'pill-badge-lab' : 'pill-badge-blue'}>
                                  {(record.slotType || 'LECTURE').toUpperCase() === 'LAB' ? 'Lab' : 'Lecture'}
                                </span>
                              </td>
                            </>
                          )}

                          {/* 8. Sections */}
                          {activeTab === 'sections' && (
                            <>
                              <td className="col-primary-bold">{record.sectionId || `#${record.id}`}</td>
                              <td className="col-primary-text">{record.course?.code || record.course?.name || '-'}</td>
                              <td className="col-secondary-text">
                                {record.batch?.name || record.division?.name || '-'}
                              </td>
                              <td style={{ textAlign: 'center' }}>
                                <span className="pill-badge-gray">{record.numClassesPerWeek || record.sessionsPerWeek || 1}x</span>
                              </td>
                              <td style={{ textAlign: 'center' }}>
                                {record.isElective ? (
                                  <span className="pill-badge-purple">{record.electiveGroup || 'Elective'}</span>
                                ) : (
                                  <span className="col-secondary-text">-</span>
                                )}
                              </td>
                            </>
                          )}

                          {/* Action Buttons: [ ✏️ ] [ 🗑️ ] */}
                          <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                            <div className="table-actions-cell">
                              <button 
                                type="button"
                                className="action-btn-edit"
                                title="Edit"
                                aria-label="Edit"
                                onClick={() => handleStartEdit(record)}
                              >
                                <Edit2 size={14} />
                              </button>
                              <button 
                                type="button"
                                className="action-btn-delete"
                                title="Delete"
                                aria-label="Delete"
                                onClick={() => handleOpenDelete(record)}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="modal-overlay" onClick={() => !deleting && setDeleteModalOpen(false)}>
          <div className="modal-card" style={{ maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldAlert size={20} /> Confirm Deletion
              </h3>
              <button className="modal-close-btn" onClick={() => !deleting && setDeleteModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <p style={{ color: 'var(--text-primary)', margin: 0 }}>
                Are you sure you want to delete this {currentTabConfig.singular.toLowerCase()}?
              </p>
              <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.08)', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                <strong>Record:</strong> {recordToDelete?.name || recordToDelete?.roomNumber || recordToDelete?.number || recordToDelete?.code || recordToDelete?.sectionId || recordToDelete?.uid || `#${recordToDelete?.id}`}
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
                Delete protection is active. If any other academic records (sections, divisions, runs) reference this item, deletion will safely be prevented.
              </p>
            </div>
            <div className="modal-footer">
              <Button variant="secondary" onClick={() => setDeleteModalOpen(false)} disabled={deleting}>
                Cancel
              </Button>
              <Button variant="danger" onClick={handleConfirmDelete} disabled={deleting}>
                {deleting ? 'Deleting...' : 'Delete Permanently'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Eligibility Management Modal */}
      {eligibilityModalOpen && (
        <div className="modal-overlay" onClick={() => !eligibilityLoading && setEligibilityModalOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>
                Course Eligibility for {selectedEntityForEligibility?.name}
              </h3>
              <button className="modal-close-btn" onClick={() => setEligibilityModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '0.88rem', color: '#64748b', margin: 0 }}>
                Specify which courses this instructor is qualified and available to teach.
              </p>
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <select 
                  className="field-input"
                  value={selectedEligibleId}
                  onChange={(e) => setSelectedEligibleId(e.target.value)}
                >
                  <option value="">-- Select Course to Add --</option>
                  {courses
                    .filter(c => !selectedEntityForEligibility?.courses?.some(ec => ec.id === c.id))
                    .map(c => <option key={c.id} value={c.id}>{c.code} — {c.name}</option>)
                  }
                </select>
                <Button 
                  variant="primary" 
                  disabled={!selectedEligibleId || eligibilityLoading}
                  onClick={handleAddEligibility}
                >
                  Add
                </Button>
              </div>

              <div style={{ marginTop: '14px' }}>
                <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#64748b' }}>
                  Currently Assigned Eligibility:
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                  {selectedEntityForEligibility?.courses?.length > 0 ? (
                    selectedEntityForEligibility.courses.map(c => (
                      <span key={c.id} className="pill-badge-blue" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        {c.code} — {c.name}
                        <button 
                          type="button" 
                          style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: 0 }}
                          onClick={() => handleRemoveEligibility(c.id)}
                          disabled={eligibilityLoading}
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))
                  ) : (
                    <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>No course eligibility assigned yet.</span>
                  )}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <Button variant="secondary" onClick={() => setEligibilityModalOpen(false)}>
                Done
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
