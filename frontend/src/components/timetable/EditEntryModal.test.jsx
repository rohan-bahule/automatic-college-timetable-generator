import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import EditEntryModal from './EditEntryModal';
import * as timetableModule from '../../services/timetableApi';
import { dataApi } from '../../services/dataApi';

const { mockDataApi, mockTimetableApi } = vi.hoisted(() => ({
  mockDataApi: {
    getInstructors: vi.fn(),
    getRooms: vi.fn(),
    getMeetingTimes: vi.fn()
  },
  mockTimetableApi: {
    validateTimetableEntry: vi.fn(),
    updateTimetableEntry: vi.fn()
  }
}));

vi.mock('../../services/timetableApi', () => ({
  default: mockTimetableApi,
  timetableApi: mockTimetableApi,
  validateTimetableEntry: mockTimetableApi.validateTimetableEntry,
  updateTimetableEntry: mockTimetableApi.updateTimetableEntry
}));
vi.mock('../../services/dataApi', () => ({
  default: mockDataApi,
  dataApi: mockDataApi
}));

describe('EditEntryModal Component (Phase 4)', () => {
  const mockEntry = {
    id: 101,
    runId: 1,
    courseId: 10,
    instructorId: 1,
    roomId: 2,
    meetingTimeId: 3,
    course: { id: 10, code: 'AI', name: 'Artificial Intelligence', type: 'LECTURE' },
    division: { id: 1, name: 'TE-I' },
    batch: null,
    instructor: { id: 1, name: 'Dr. S.N. Girme' },
    room: { id: 2, roomNumber: 'A1-309', type: 'LECTURE', capacity: 60 },
    meetingTime: { id: 3, day: 'Monday', timeSlot: '08:45 - 09:45' }
  };

  const mockInstructors = [
    { id: 1, name: 'Dr. S.N. Girme', departmentId: 1, courses: [{ id: 10 }] },
    { id: 2, name: 'Prof. P.R. Sonawane', departmentId: 1, courses: [{ id: 10 }] },
    { id: 3, name: 'Prof. Ineligible', departmentId: 1, courses: [{ id: 99 }] }
  ];

  const mockRooms = [
    { id: 2, roomNumber: 'A1-309', type: 'LECTURE', capacity: 60 },
    { id: 5, roomNumber: 'A1-310', type: 'LECTURE', capacity: 60 },
    { id: 7, roomNumber: 'Lab-1', type: 'LAB', capacity: 30 }
  ];

  const mockMeetingTimes = [
    { id: 3, day: 'Monday', timeSlot: '08:45 - 09:45', slotType: 'REGULAR' },
    { id: 4, day: 'Monday', timeSlot: '09:45 - 10:45', slotType: 'REGULAR' }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockDataApi.getInstructors.mockResolvedValue(mockInstructors);
    mockDataApi.getRooms.mockResolvedValue(mockRooms);
    mockDataApi.getMeetingTimes.mockResolvedValue(mockMeetingTimes);
  });

  afterEach(() => {
    cleanup();
  });

  it('renders read-only fields for Course, Division, Batch', async () => {
    render(<EditEntryModal isOpen={true} entry={mockEntry} onClose={vi.fn()} onSaveSuccess={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText(/Artificial Intelligence/i)).toBeTruthy();
      expect(screen.getByText('TE-I')).toBeTruthy();
      expect(screen.getByText('None (Entire Division)')).toBeTruthy();
    });
  });

  it('filters rooms based on course type (LECTURE only shows lecture rooms)', async () => {
    render(<EditEntryModal isOpen={true} entry={mockEntry} onClose={vi.fn()} onSaveSuccess={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByTestId('room-select')).toBeTruthy();
      const options = Array.from(screen.getByTestId('room-select').children);
      const optionTexts = options.map(o => o.textContent);
      expect(optionTexts.some(t => t.includes('A1-309'))).toBe(true);
      expect(optionTexts.some(t => t.includes('A1-310'))).toBe(true);
      expect(optionTexts.some(t => t.includes('Lab-1'))).toBe(false);
    });
  });

  it('filters instructors to only eligible ones', async () => {
    render(<EditEntryModal isOpen={true} entry={mockEntry} onClose={vi.fn()} onSaveSuccess={vi.fn()} />);

    await waitFor(() => {
      const options = Array.from(screen.getByTestId('instructor-select').children);
      const optionTexts = options.map(o => o.textContent);
      expect(optionTexts.some(t => t.includes('Dr. S.N. Girme'))).toBe(true);
      expect(optionTexts.some(t => t.includes('Prof. P.R. Sonawane'))).toBe(true);
      expect(optionTexts.some(t => t.includes('Prof. Ineligible'))).toBe(false);
    });
  });

  it('handles validation failure and displays conflict message', async () => {
    mockTimetableApi.validateTimetableEntry.mockResolvedValue({
      valid: false,
      conflicts: [
        { type: 'ROOM_CONFLICT', message: 'Room A1-309 is already occupied at Monday 09:45-10:45.' }
      ]
    });

    render(<EditEntryModal isOpen={true} entry={mockEntry} onClose={vi.fn()} onSaveSuccess={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByTestId('validate-change-btn')).toBeTruthy();
    });

    fireEvent.change(screen.getByTestId('meeting-time-select'), { target: { value: '4' } });
    fireEvent.click(screen.getByTestId('validate-change-btn'));

    await waitFor(() => {
      expect(screen.getByText(/Cannot Apply This Change/i)).toBeTruthy();
      expect(screen.getByText(/Room A1-309 is already occupied/i)).toBeTruthy();
      expect(screen.getByTestId('save-change-btn').disabled).toBe(true);
    });
  });

  it('handles validation success and allows saving', async () => {
    mockTimetableApi.validateTimetableEntry.mockResolvedValue({
      valid: true,
      conflicts: [],
      message: 'Change is valid. No conflicts detected.'
    });
    mockTimetableApi.updateTimetableEntry.mockResolvedValue({
      success: true,
      data: {
        revisedRunId: 2,
        originalRunId: 1
      },
      message: 'Timetable revised successfully. Created Run #2.'
    });

    const mockSaveSuccess = vi.fn();
    const mockClose = vi.fn();

    render(
      <EditEntryModal
        isOpen={true}
        entry={mockEntry}
        onClose={mockClose}
        onSaveSuccess={mockSaveSuccess}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('validate-change-btn')).toBeTruthy();
    });

    fireEvent.change(screen.getByTestId('room-select'), { target: { value: '5' } });
    fireEvent.click(screen.getByTestId('validate-change-btn'));

    await waitFor(() => {
      expect(screen.getByText(/Change is Valid/i)).toBeTruthy();
      expect(screen.getByTestId('save-change-btn')).toBeTruthy();
    });

    fireEvent.click(screen.getByTestId('save-change-btn'));

    await waitFor(() => {
      expect(mockTimetableApi.updateTimetableEntry).toHaveBeenCalledWith(1, 101, {
        instructorId: 1,
        roomId: 5,
        meetingTimeId: 3
      });
      expect(mockSaveSuccess).toHaveBeenCalledWith(expect.objectContaining({ revisedRunId: 2 }));
      expect(mockClose).toHaveBeenCalled();
    });
  });

  it('prompts confirmation when closing with unsaved changes', async () => {
    const mockClose = vi.fn();

    render(<EditEntryModal isOpen={true} entry={mockEntry} onClose={mockClose} onSaveSuccess={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByTestId('room-select')).toBeTruthy();
    });

    // Make a change
    fireEvent.change(screen.getByTestId('room-select'), { target: { value: '5' } });

    // Click cancel
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

    // Discard prompt should show
    expect(screen.getByText(/Discard unsaved changes\?/i)).toBeTruthy();

    // Click keep editing
    fireEvent.click(screen.getByRole('button', { name: /keep editing/i }));
    expect(screen.queryByText(/Discard unsaved changes\?/i)).toBeNull();
    expect(mockClose).not.toHaveBeenCalled();

    // Click cancel again and discard
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    fireEvent.click(screen.getByRole('button', { name: /^discard$/i }));
    expect(mockClose).toHaveBeenCalled();
  });
});
