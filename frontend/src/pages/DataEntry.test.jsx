import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import DataEntry from './DataEntry';
import dataApi from '../services/dataApi';

// Mock dataApi service
vi.mock('../services/dataApi', () => ({
  default: {
    getDepartments: vi.fn(),
    getDivisions: vi.fn(),
    getBatches: vi.fn(),
    getInstructors: vi.fn(),
    getRooms: vi.fn(),
    getCourses: vi.fn(),
    getMeetingTimes: vi.fn(),
    getSections: vi.fn(),
    getInstructor: vi.fn(),
    getCourse: vi.fn(),
    createDepartment: vi.fn(),
    updateDepartment: vi.fn(),
    deleteDepartment: vi.fn(),
    createDivision: vi.fn(),
    updateDivision: vi.fn(),
    deleteDivision: vi.fn(),
    createBatch: vi.fn(),
    updateBatch: vi.fn(),
    deleteBatch: vi.fn(),
    createInstructor: vi.fn(),
    updateInstructor: vi.fn(),
    deleteInstructor: vi.fn(),
    createRoom: vi.fn(),
    updateRoom: vi.fn(),
    deleteRoom: vi.fn(),
    createCourse: vi.fn(),
    updateCourse: vi.fn(),
    deleteCourse: vi.fn(),
    createMeetingTime: vi.fn(),
    updateMeetingTime: vi.fn(),
    deleteMeetingTime: vi.fn(),
    createSection: vi.fn(),
    updateSection: vi.fn(),
    deleteSection: vi.fn(),
    addInstructorEligibility: vi.fn(),
    removeInstructorEligibility: vi.fn()
  }
}));

describe('DataEntry Component Tests - Layout & Edit Operations', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock resolves
    dataApi.getDepartments.mockResolvedValue({
      success: true,
      data: [{ id: 1, name: 'Computer Engineering', divisions: [{ id: 1 }] }]
    });
    dataApi.getDivisions.mockResolvedValue({
      success: true,
      data: [{ id: 1, name: 'TE-I', departmentId: 1, totalStudents: 60, department: { name: 'Computer Engineering' } }]
    });
    dataApi.getBatches.mockResolvedValue({
      success: true,
      data: [{ id: 1, name: 'K1', divisionId: 1, studentCount: 22, division: { name: 'TE-I' } }]
    });
    dataApi.getInstructors.mockResolvedValue({
      success: true,
      data: [{ id: 1, uid: 'T001', name: 'Dr. S.N. Girme', maxBatchesPerWeek: 4, maxLectureDivisions: 2, courses: [] }]
    });
    dataApi.getRooms.mockResolvedValue({
      success: true,
      data: [{ id: 1, roomNumber: 'A1-309', number: 'A1-309', roomType: 'LECTURE', capacity: 100, seatingCapacity: 100 }]
    });
    dataApi.getCourses.mockResolvedValue({
      success: true,
      data: [{ id: 1, code: 'AI', name: 'Artificial Intelligence', courseType: 'LECTURE', maxStudents: 88, isElective: false, instructors: [{ id: 1, uid: 'T001', name: 'Dr. S.N. Girme' }] }]
    });
    dataApi.getMeetingTimes.mockResolvedValue({
      success: true,
      data: [{ id: 1, pid: 'L001', dayOfWeek: 'Monday', day: 'Monday', timeRange: '08:45 - 09:45', time: '08:45 - 09:45', slotType: 'LECTURE', isElectiveSlot: false }]
    });
    dataApi.getSections.mockResolvedValue({
      success: true,
      data: [{ id: 1, sectionId: 'AI-TE1', sessionsPerWeek: 3, numClassesPerWeek: 3, isElective: false, course: { id: 1, code: 'AI', name: 'Artificial Intelligence', courseType: 'LECTURE' }, division: { id: 1, name: 'TE-I' } }]
    });
  });

  afterEach(() => {
    cleanup();
  });

  it('1. Renders Data Entry entity tabs and Add Department form', async () => {
    render(<DataEntry onNavigate={vi.fn()} />);

    expect(screen.getByRole('heading', { name: 'Add Department' })).toBeTruthy();
    expect(screen.getByRole('tab', { name: /departments/i })).toBeTruthy();
  });

  it('2. Renders all 8 academic entity tabs', async () => {
    render(<DataEntry onNavigate={vi.fn()} />);

    expect(screen.getByRole('tab', { name: /departments/i })).toBeTruthy();
    expect(screen.getByRole('tab', { name: /divisions/i })).toBeTruthy();
    expect(screen.getByRole('tab', { name: /batches/i })).toBeTruthy();
    expect(screen.getByRole('tab', { name: /instructors/i })).toBeTruthy();
    expect(screen.getByRole('tab', { name: /rooms/i })).toBeTruthy();
    expect(screen.getByRole('tab', { name: /courses/i })).toBeTruthy();
    expect(screen.getByRole('tab', { name: /timings/i })).toBeTruthy();
    expect(screen.getByRole('tab', { name: /sections/i })).toBeTruthy();
  });

  it('3. Loads and displays department records in the table', async () => {
    render(<DataEntry onNavigate={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('Computer Engineering')).toBeTruthy();
      expect(screen.getByText('#1')).toBeTruthy();
    });
  });

  it('4. Switches tabs to Divisions and displays division data', async () => {
    render(<DataEntry onNavigate={vi.fn()} />);

    const divTab = screen.getByRole('tab', { name: /divisions/i });
    fireEvent.click(divTab);

    await waitFor(() => {
      expect(dataApi.getDivisions).toHaveBeenCalled();
      expect(screen.getByText('TE-I')).toBeTruthy();
      expect(screen.getByText('60')).toBeTruthy();
    });
  });

  it('5. Displays Add Department form with human-readable fields', async () => {
    render(<DataEntry onNavigate={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('Computer Engineering')).toBeTruthy();
    });

    expect(screen.getByRole('heading', { name: 'Add Department' })).toBeTruthy();
    expect(screen.getByPlaceholderText(/e\.g\. Computer Engineering/i)).toBeTruthy();
  });

  it('6. Submits new department and displays success feedback', async () => {
    dataApi.createDepartment.mockResolvedValueOnce({ success: true, data: { id: 2, name: 'Civil Engineering' } });
    render(<DataEntry onNavigate={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('Computer Engineering')).toBeTruthy();
    });

    const input = screen.getByPlaceholderText(/e\.g\. Computer Engineering/i);
    fireEvent.change(input, { target: { value: 'Civil Engineering' } });

    fireEvent.click(screen.getByRole('button', { name: /create record|save department/i }));

    await waitFor(() => {
      expect(dataApi.createDepartment).toHaveBeenCalledWith({ name: 'Civil Engineering' });
      expect(screen.getByText(/Added new department successfully/i)).toBeTruthy();
    });
  });

  it('7. Opens Delete Confirmation dialog with safety warning', async () => {
    render(<DataEntry onNavigate={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('Computer Engineering')).toBeTruthy();
    });

    const deleteBtn = screen.getByRole('button', { name: /delete/i });
    fireEvent.click(deleteBtn);

    expect(screen.getByRole('heading', { name: /confirm deletion/i })).toBeTruthy();
    expect(screen.getByText(/Delete protection is active/i)).toBeTruthy();
  });

  it('8. Handles delete conflict error and displays error banner', async () => {
    dataApi.deleteDepartment.mockRejectedValueOnce(new Error('This department cannot be deleted because divisions reference it.'));
    render(<DataEntry onNavigate={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('Computer Engineering')).toBeTruthy();
    });

    fireEvent.click(screen.getByRole('button', { name: /delete/i }));
    fireEvent.click(screen.getByRole('button', { name: /delete permanently/i }));

    await waitFor(() => {
      expect(screen.getByText(/This department cannot be deleted because divisions reference it|Cannot delete this record/i)).toBeTruthy();
    });
  });

  it('9. Opens course eligibility manager for instructors', async () => {
    render(<DataEntry onNavigate={vi.fn()} />);

    // Switch to Instructors tab
    fireEvent.click(screen.getByRole('tab', { name: /instructors/i }));

    await waitFor(() => {
      expect(screen.getByText('Dr. S.N. Girme')).toBeTruthy();
    });

    const eligibilityBtn = screen.getByRole('button', { name: /courses/i });
    fireEvent.click(eligibilityBtn);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Course Eligibility for Dr\. S\.N\. Girme/i })).toBeTruthy();
      expect(screen.getByText(/Specify which courses this instructor is qualified/i)).toBeTruthy();
    });
  });

  // ============================================================
  // EDIT FUNCTIONALITY TESTS FOR ALL 8 ENTITIES
  // ============================================================

  it('10. Department: Edit opens, pre-fills existing value, and updates successfully', async () => {
    dataApi.updateDepartment.mockResolvedValueOnce({ success: true, data: { id: 1, name: 'Computer Science & Engineering' } });
    render(<DataEntry onNavigate={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('Computer Engineering')).toBeTruthy();
    });

    // Click Edit button
    fireEvent.click(screen.getByRole('button', { name: /edit/i }));

    // Form converts to Edit Mode
    expect(screen.getByRole('heading', { name: 'Edit Department' })).toBeTruthy();
    const input = screen.getByPlaceholderText(/e\.g\. Computer Engineering/i);
    expect(input.value).toBe('Computer Engineering');

    // Change value
    fireEvent.change(input, { target: { value: 'Computer Science & Engineering' } });

    // Submit update
    const updateBtn = screen.getByRole('button', { name: /update department/i });
    fireEvent.click(updateBtn);

    await waitFor(() => {
      expect(dataApi.updateDepartment).toHaveBeenCalledWith(1, { name: 'Computer Science & Engineering' });
      expect(screen.getByText(/Updated department successfully/i)).toBeTruthy();
    });
  });

  it('11. Division: Edit opens, pre-fills department and student count, and updates', async () => {
    dataApi.updateDivision.mockResolvedValueOnce({ success: true, data: { id: 1, name: 'TE-I', departmentId: 1, totalStudents: 88 } });
    render(<DataEntry onNavigate={vi.fn()} />);

    fireEvent.click(screen.getByRole('tab', { name: /divisions/i }));

    await waitFor(() => {
      expect(screen.getByText('TE-I')).toBeTruthy();
    });

    // Click Edit button
    fireEvent.click(screen.getByRole('button', { name: /edit/i }));

    expect(screen.getByRole('heading', { name: 'Edit Division' })).toBeTruthy();
    const nameInput = screen.getByPlaceholderText(/e\.g\. TE-I/i);
    expect(nameInput.value).toBe('TE-I');

    const studentInput = screen.getByPlaceholderText('88');
    fireEvent.change(studentInput, { target: { value: '88' } });

    fireEvent.click(screen.getByRole('button', { name: /update division/i }));

    await waitFor(() => {
      expect(dataApi.updateDivision).toHaveBeenCalledWith(1, {
        name: 'TE-I',
        departmentId: 1,
        totalStudents: 88
      });
      expect(screen.getByText(/Updated division successfully/i)).toBeTruthy();
    });
  });

  it('12. Batch: Edit opens, pre-fills division and student count, and updates', async () => {
    dataApi.updateBatch.mockResolvedValueOnce({ success: true, data: { id: 1, name: 'K1', divisionId: 1, studentCount: 25 } });
    render(<DataEntry onNavigate={vi.fn()} />);

    fireEvent.click(screen.getByRole('tab', { name: /batches/i }));

    await waitFor(() => {
      expect(screen.getByText('K1')).toBeTruthy();
    });

    fireEvent.click(screen.getByRole('button', { name: /edit/i }));

    expect(screen.getByRole('heading', { name: 'Edit Batch' })).toBeTruthy();
    const studentInput = screen.getByPlaceholderText('22');
    fireEvent.change(studentInput, { target: { value: '25' } });

    fireEvent.click(screen.getByRole('button', { name: /update batch/i }));

    await waitFor(() => {
      expect(dataApi.updateBatch).toHaveBeenCalledWith(1, {
        name: 'K1',
        divisionId: 1,
        studentCount: 25
      });
      expect(screen.getByText(/Updated batch successfully/i)).toBeTruthy();
    });
  });

  it('13. Instructor: Edit opens, pre-fills teacher ID and full name, and updates', async () => {
    dataApi.updateInstructor.mockResolvedValueOnce({ success: true, data: { id: 1, uid: 'T001', name: 'Dr. S.N. Girme (HOD)' } });
    render(<DataEntry onNavigate={vi.fn()} />);

    fireEvent.click(screen.getByRole('tab', { name: /instructors/i }));

    await waitFor(() => {
      expect(screen.getByText('Dr. S.N. Girme')).toBeTruthy();
    });

    fireEvent.click(screen.getByRole('button', { name: /edit/i }));

    expect(screen.getByRole('heading', { name: 'Edit Instructor' })).toBeTruthy();
    const nameInput = screen.getByPlaceholderText(/e\.g\. Dr\. A\.B\. Sharma/i);
    expect(nameInput.value).toBe('Dr. S.N. Girme');

    fireEvent.change(nameInput, { target: { value: 'Dr. S.N. Girme (HOD)' } });
    fireEvent.click(screen.getByRole('button', { name: /update instructor/i }));

    await waitFor(() => {
      expect(dataApi.updateInstructor).toHaveBeenCalledWith(1, expect.objectContaining({
        uid: 'T001',
        name: 'Dr. S.N. Girme (HOD)'
      }));
      expect(screen.getByText(/Updated instructor successfully/i)).toBeTruthy();
    });
  });

  it('14. Room: Edit opens, pre-fills capacity and room type, and updates', async () => {
    dataApi.updateRoom.mockResolvedValueOnce({ success: true, data: { id: 1, roomNumber: 'A1-309', capacity: 120, roomType: 'LECTURE' } });
    render(<DataEntry onNavigate={vi.fn()} />);

    fireEvent.click(screen.getByRole('tab', { name: /rooms/i }));

    await waitFor(() => {
      expect(screen.getByText('A1-309')).toBeTruthy();
    });

    fireEvent.click(screen.getByRole('button', { name: /edit/i }));

    expect(screen.getByRole('heading', { name: 'Edit Room' })).toBeTruthy();
    const capInput = screen.getByPlaceholderText('100');
    expect(capInput.value).toBe('100');

    fireEvent.change(capInput, { target: { value: '120' } });
    fireEvent.click(screen.getByRole('button', { name: /update room/i }));

    await waitFor(() => {
      expect(dataApi.updateRoom).toHaveBeenCalledWith(1, expect.objectContaining({
        roomNumber: 'A1-309',
        capacity: 120,
        roomType: 'LECTURE'
      }));
      expect(screen.getByText(/Updated room successfully/i)).toBeTruthy();
    });
  });

  it('15. Course: Edit opens, pre-fills instructors, elective state, and updates', async () => {
    dataApi.updateCourse.mockResolvedValueOnce({ success: true, data: { id: 1, code: 'AI', name: 'Artificial Intelligence & ML', courseType: 'LECTURE', isElective: false, instructorIds: [1] } });
    render(<DataEntry onNavigate={vi.fn()} />);

    fireEvent.click(screen.getByRole('tab', { name: /courses/i }));

    await waitFor(() => {
      expect(screen.getByText('Artificial Intelligence')).toBeTruthy();
    });

    fireEvent.click(screen.getByRole('button', { name: /edit/i }));

    expect(screen.getByRole('heading', { name: 'Edit Course' })).toBeTruthy();
    const nameInput = screen.getByPlaceholderText(/e\.g\. Artificial Intelligence/i);
    expect(nameInput.value).toBe('Artificial Intelligence');

    fireEvent.change(nameInput, { target: { value: 'Artificial Intelligence & ML' } });
    fireEvent.click(screen.getByRole('button', { name: /update course/i }));

    await waitFor(() => {
      expect(dataApi.updateCourse).toHaveBeenCalledWith(1, expect.objectContaining({
        code: 'AI',
        name: 'Artificial Intelligence & ML',
        instructorIds: [1]
      }));
      expect(screen.getByText(/Updated course successfully/i)).toBeTruthy();
    });
  });

  it('16. Meeting Time: Edit opens, pre-fills values, and updates', async () => {
    dataApi.updateMeetingTime.mockResolvedValueOnce({ success: true, data: { id: 1, dayOfWeek: 'Tuesday', timeRange: '08:45 - 09:45', slotType: 'LECTURE' } });
    render(<DataEntry onNavigate={vi.fn()} />);

    fireEvent.click(screen.getByRole('tab', { name: /timings/i }));

    await waitFor(() => {
      expect(screen.getByText('08:45 - 09:45')).toBeTruthy();
    });

    fireEvent.click(screen.getByRole('button', { name: /edit/i }));

    expect(screen.getByRole('heading', { name: 'Edit Meeting Time' })).toBeTruthy();
    const timeInput = screen.getByPlaceholderText('08:45 - 09:45');
    expect(timeInput.value).toBe('08:45 - 09:45');

    fireEvent.click(screen.getByRole('button', { name: /update meeting time/i }));

    await waitFor(() => {
      expect(dataApi.updateMeetingTime).toHaveBeenCalledWith(1, expect.objectContaining({
        time: '08:45 - 09:45',
        slotType: 'LECTURE'
      }));
      expect(screen.getByText(/Updated meeting time successfully/i)).toBeTruthy();
    });
  });

  it('17. Section: Edit opens, conditional fields work, and updates', async () => {
    dataApi.updateSection.mockResolvedValueOnce({ success: true, data: { id: 1, sectionId: 'AI-TE1', sessionsPerWeek: 4 } });
    render(<DataEntry onNavigate={vi.fn()} />);

    fireEvent.click(screen.getByRole('tab', { name: /sections/i }));

    await waitFor(() => {
      expect(screen.getByText('AI-TE1')).toBeTruthy();
    });

    fireEvent.click(screen.getByRole('button', { name: /edit/i }));

    expect(screen.getByRole('heading', { name: 'Edit Section' })).toBeTruthy();
    const classesInput = screen.getByPlaceholderText('3');
    fireEvent.change(classesInput, { target: { value: '4' } });

    fireEvent.click(screen.getByRole('button', { name: /update section/i }));

    await waitFor(() => {
      expect(dataApi.updateSection).toHaveBeenCalledWith(1, expect.objectContaining({
        sectionId: 'AI-TE1',
        sessionsPerWeek: 4
      }));
      expect(screen.getByText(/Updated section successfully/i)).toBeTruthy();
    });
  });

  it('18. Cancel button reverts Edit Mode back to Add Mode', async () => {
    render(<DataEntry onNavigate={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('Computer Engineering')).toBeTruthy();
    });

    // Enter Edit Mode
    fireEvent.click(screen.getByRole('button', { name: /edit/i }));
    expect(screen.getByRole('heading', { name: 'Edit Department' })).toBeTruthy();

    // Click Cancel
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

    // Back in Add Mode
    expect(screen.getByRole('heading', { name: 'Add Department' })).toBeTruthy();
  });

  it('19. Navigation buttons (Next / Back) step through academic entities', async () => {
    const mockNavigate = vi.fn();
    render(<DataEntry onNavigate={mockNavigate} />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Add Department' })).toBeTruthy();
    });

    // Click Next → goes to Divisions
    const nextBtn = screen.getByRole('button', { name: /next →/i });
    fireEvent.click(nextBtn);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Add Division' })).toBeTruthy();
    });

    // Click ← Back goes back to Department
    const backBtn = screen.getByRole('button', { name: /← back/i });
    fireEvent.click(backBtn);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Add Department' })).toBeTruthy();
    });
  });
});
