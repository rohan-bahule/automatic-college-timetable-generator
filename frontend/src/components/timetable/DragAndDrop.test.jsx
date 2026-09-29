import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import RedesignedViewer from './TimetableViewer';
import TimetableGrid from './TimetableGrid';
import MoveConfirmationModal from './MoveConfirmationModal';
import { timetableApi } from '../../services/timetableApi';
import dataApi from '../../services/dataApi';

const mockMetadata = {
  success: true,
  data: {
    divisions: [{ id: 1, name: 'TE-I' }],
    instructors: [{ id: 101, name: 'Dr. S.N. Girme', uid: 'T001' }],
    rooms: [
      { id: 201, number: 'A1-309', roomType: 'LECTURE' },
      { id: 202, number: 'A1-102', roomType: 'LAB' }
    ],
    batches: [{ id: 301, name: 'K1', divisionId: 1 }]
  }
};

const mockMeetingTimes = [
  { id: 1, day: 'Monday', time: '08:45-09:45', slotType: 'LECTURE' },
  { id: 2, day: 'Tuesday', time: '08:45-09:45', slotType: 'LECTURE' },
  { id: 3, day: 'Wednesday', time: '08:45-09:45', slotType: 'LECTURE' },
  { id: 4, day: 'Monday', time: '10:45-12:45', slotType: 'LAB' }
];

const mockRuns = {
  success: true,
  data: [
    { id: 2, conflictCount: 0, verified: true, attempts: 15, timeTakenSec: '2.5', createdAt: '2026-09-17T10:00:00.000Z' },
    { id: 1, conflictCount: 0, verified: true, attempts: 10, timeTakenSec: '2.0', createdAt: '2026-09-16T10:00:00.000Z' }
  ]
};

const mockScheduleEntries = {
  success: true,
  data: {
    id: 1,
    conflictCount: 0,
    verified: true,
    entries: [
      {
        id: 10,
        sectionId: 1,
        courseId: 1,
        divisionId: 1,
        batchId: null,
        instructorId: 101,
        roomId: 201,
        meetingTimeId: 1,
        MeetingTime: { id: 1, day: 'Monday', time: '08:45-09:45', slotType: 'LECTURE' },
        Course: { id: 1, code: 'AI', name: 'Artificial Intelligence', courseType: 'LECTURE' },
        Instructor: { id: 101, name: 'Dr. S.N. Girme' },
        Room: { id: 201, number: 'A1-309' },
        Division: { id: 1, name: 'TE-I' }
      },
      {
        id: 11,
        sectionId: 2,
        courseId: 2,
        divisionId: 1,
        batchId: 301,
        instructorId: 101,
        roomId: 202,
        meetingTimeId: 4,
        MeetingTime: { id: 4, day: 'Monday', time: '10:45-12:45', slotType: 'LAB' },
        Course: { id: 2, code: 'DSBDAL', name: 'DSBDA Lab', courseType: 'LAB' },
        Instructor: { id: 101, name: 'Dr. S.N. Girme' },
        Room: { id: 202, number: 'A1-102' },
        Batch: { id: 301, name: 'K1' }
      }
    ]
  }
};

vi.mock('../../services/timetableApi', () => ({
  timetableApi: {
    getAllRuns: vi.fn(),
    getMetadata: vi.fn(),
    getRunById: vi.fn(),
    getRunFiltered: vi.fn(),
    validateTimetableEntry: vi.fn(),
    updateTimetableEntry: vi.fn()
  }
}));

vi.mock('../../services/dataApi', () => ({
  default: {
    getMeetingTimes: vi.fn(),
    getInstructors: vi.fn().mockResolvedValue({ success: true, data: [] }),
    getRooms: vi.fn().mockResolvedValue({ success: true, data: [] })
  }
}));

describe('Phase 6: Interactive Drag-and-Drop & Revision Highlighting', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    timetableApi.getAllRuns.mockResolvedValue(mockRuns);
    timetableApi.getMetadata.mockResolvedValue(mockMetadata);
    timetableApi.getRunById.mockResolvedValue(mockScheduleEntries);
    timetableApi.getRunFiltered.mockResolvedValue(mockScheduleEntries);
    dataApi.getMeetingTimes.mockResolvedValue({ success: true, data: mockMeetingTimes });
  });

  afterEach(() => {
    cleanup();
  });

  it('1. Timetable cards have draggable attribute and drag handle affordance', async () => {
    render(<RedesignedViewer selectedRunId={1} />);

    await waitFor(() => {
      expect(screen.getByTestId('timetable-matrix-grid')).toBeTruthy();
      expect(screen.getByTestId('slot-entry-10')).toBeTruthy();
    });

    const card = screen.getByTestId('slot-entry-10');
    expect(card.getAttribute('draggable')).toBe('true');
    expect(card.classList.contains('is-draggable')).toBe(true);
  });

  it('2. Empty cells are configured as valid drop zones', async () => {
    render(<RedesignedViewer selectedRunId={1} />);

    await waitFor(() => {
      expect(screen.getByTestId('timetable-matrix-grid')).toBeTruthy();
    });

    const dropZoneTuesday = screen.getByTestId('drop-zone-Tuesday-08:45-09:45');
    expect(dropZoneTuesday).toBeTruthy();
    expect(dropZoneTuesday.classList.contains('matrix-td-dropzone')).toBe(true);
  });

  it('3. Incompatible slot drop (e.g. Lab into Lecture slot) indicates invalid target', () => {
    const mockProposal = vi.fn();
    const labEntry = mockScheduleEntries.data.entries[1]; // DSBDAL LAB

    const { getByTestId } = render(
      <TimetableGrid 
        entries={[labEntry]}
        meetingTimes={mockMeetingTimes}
        onMoveProposal={mockProposal}
      />
    );

    const card = getByTestId('slot-entry-11');
    const lectureDropZone = getByTestId('drop-zone-Tuesday-08:45-09:45');

    // Simulate drag start on lab
    const dataTransfer = { setData: vi.fn(), effectAllowed: 'none', dropEffect: 'none' };
    fireEvent.dragStart(card, { dataTransfer });

    // Drag over 1-hour lecture slot
    fireEvent.dragEnter(lectureDropZone);
    fireEvent.dragOver(lectureDropZone, { dataTransfer });

    // Should indicate invalid drop target
    expect(lectureDropZone.classList.contains('cell-drop-invalid')).toBe(true);

    // Drop should not trigger move proposal
    fireEvent.drop(lectureDropZone);
    expect(mockProposal).not.toHaveBeenCalled();
  });

  it('4. Dropping a compatible lecture entry triggers move proposal callback with target meeting time', () => {
    const mockProposal = vi.fn();
    const lectureEntry = mockScheduleEntries.data.entries[0]; // AI LECTURE on Monday 08:45

    const { getByTestId } = render(
      <TimetableGrid 
        entries={[lectureEntry]}
        meetingTimes={mockMeetingTimes}
        onMoveProposal={mockProposal}
      />
    );

    const card = getByTestId('slot-entry-10');
    const tuesdayDropZone = getByTestId('drop-zone-Tuesday-08:45-09:45');

    // Drag start
    const dataTransfer = { setData: vi.fn(), effectAllowed: 'none', dropEffect: 'none' };
    fireEvent.dragStart(card, { dataTransfer });

    // Drag enter & over compatible slot
    fireEvent.dragEnter(tuesdayDropZone);
    fireEvent.dragOver(tuesdayDropZone, { dataTransfer });
    expect(tuesdayDropZone.classList.contains('cell-drop-valid')).toBe(true);

    // Drop
    fireEvent.drop(tuesdayDropZone);
    expect(mockProposal).toHaveBeenCalledWith(
      lectureEntry,
      expect.objectContaining({ id: 2, day: 'Tuesday', time: '08:45-09:45' }),
      'Tuesday',
      '08:45-09:45'
    );
  });

  it('5. MoveConfirmationModal validates proposed slot and displays Move Confirmation on success', async () => {
    timetableApi.validateTimetableEntry.mockResolvedValue({
      valid: true,
      conflicts: [],
      message: 'Change is valid. No conflicts detected.'
    });

    const proposal = {
      entry: mockScheduleEntries.data.entries[0],
      targetMeetingTime: mockMeetingTimes[1], // Tuesday 08:45-09:45
      targetDay: 'Tuesday',
      targetTimeBlock: '08:45-09:45'
    };

    const mockClose = vi.fn();
    const mockSuccess = vi.fn();

    render(
      <MoveConfirmationModal 
        proposal={proposal}
        runId={1}
        onClose={mockClose}
        onConfirmSuccess={mockSuccess}
      />
    );

    // Initial validating state
    expect(screen.getByTestId('move-validating-indicator')).toBeTruthy();

    await waitFor(() => {
      expect(timetableApi.validateTimetableEntry).toHaveBeenCalledWith(1, 10, {
        meetingTimeId: 2,
        roomId: 201,
        instructorId: 101
      });
      expect(screen.getByTestId('move-valid-box')).toBeTruthy();
      expect(screen.getByText(/Move Valid — No Conflicts Detected/i)).toBeTruthy();
      expect(screen.getByTestId('confirm-move-btn')).toBeTruthy();
    });

    // Shows from and to slots
    expect(screen.getByText('Monday')).toBeTruthy();
    expect(screen.getByText('Tuesday')).toBeTruthy();

    // Confirm Move
    timetableApi.updateTimetableEntry.mockResolvedValue({
      success: true,
      data: { originalRunId: 1, revisedRunId: 2 }
    });

    fireEvent.click(screen.getByTestId('confirm-move-btn'));

    await waitFor(() => {
      expect(timetableApi.updateTimetableEntry).toHaveBeenCalledWith(1, 10, {
        meetingTimeId: 2,
        roomId: 201,
        instructorId: 101
      });
      expect(mockSuccess).toHaveBeenCalledWith(expect.objectContaining({
        originalRunId: 1,
        revisedRunId: 2
      }));
    });
  });

  it('6. MoveConfirmationModal displays conflict list when validation detects collision and blocks confirmation', async () => {
    timetableApi.validateTimetableEntry.mockResolvedValue({
      valid: false,
      conflicts: [
        { type: 'TEACHER_CONFLICT', message: 'Instructor Dr. S.N. Girme is already scheduled on Tuesday 08:45-09:45.' },
        { type: 'ROOM_CONFLICT', message: 'Room A1-309 is already occupied on Tuesday 08:45-09:45.' }
      ]
    });

    const proposal = {
      entry: mockScheduleEntries.data.entries[0],
      targetMeetingTime: mockMeetingTimes[1],
      targetDay: 'Tuesday',
      targetTimeBlock: '08:45-09:45'
    };

    const mockClose = vi.fn();

    render(
      <MoveConfirmationModal 
        proposal={proposal}
        runId={1}
        onClose={mockClose}
        onConfirmSuccess={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('move-invalid-box')).toBeTruthy();
      expect(screen.getByText(/Cannot Move to This Slot/i)).toBeTruthy();
      expect(screen.getByText(/Instructor Dr. S.N. Girme is already scheduled/i)).toBeTruthy();
      expect(screen.getByText(/Room A1-309 is already occupied/i)).toBeTruthy();
    });

    // Confirm move button should NOT be rendered; only Choose Another Slot / Cancel
    expect(screen.queryByTestId('confirm-move-btn')).toBeNull();
    expect(screen.getByTestId('choose-another-slot-btn')).toBeTruthy();

    fireEvent.click(screen.getByTestId('choose-another-slot-btn'));
    expect(mockClose).toHaveBeenCalled();
  });

  it('7. Handles race condition HTTP 409 error on save gracefully', async () => {
    timetableApi.validateTimetableEntry.mockResolvedValue({
      valid: true,
      conflicts: []
    });

    const conflictError = new Error('Cannot save timetable edit due to scheduling conflicts.');
    conflictError.status = 409;
    conflictError.conflicts = [{ message: 'Another conflicting class was booked just now.' }];
    timetableApi.updateTimetableEntry.mockRejectedValue(conflictError);

    const proposal = {
      entry: mockScheduleEntries.data.entries[0],
      targetMeetingTime: mockMeetingTimes[1],
      targetDay: 'Tuesday',
      targetTimeBlock: '08:45-09:45'
    };

    render(
      <MoveConfirmationModal 
        proposal={proposal}
        runId={1}
        onClose={vi.fn()}
        onConfirmSuccess={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('confirm-move-btn')).toBeTruthy();
    });

    fireEvent.click(screen.getByTestId('confirm-move-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('move-error-banner')).toBeTruthy();
      expect(screen.getByText(/The timetable changed while you were editing/i)).toBeTruthy();
    });
  });

  it('8. Renders Revision Summary Banner when active run is a revision of an original run', async () => {
    // Set lineage: Run #2 is revision of Run #1
    localStorage.setItem('timetable_revision_map', JSON.stringify({ '2': 1 }));

    // Run #1 entries (original)
    const run1Entries = {
      success: true,
      data: {
        id: 1,
        entries: [
          {
            id: 10,
            sectionId: 1,
            courseId: 1,
            divisionId: 1,
            batchId: null,
            meetingTimeId: 1,
            MeetingTime: { id: 1, day: 'Monday', time: '08:45-09:45' },
            Course: { code: 'AI', name: 'Artificial Intelligence' }
          }
        ]
      }
    };

    // Run #2 entries (revised: entry moved to Tuesday)
    const run2Entries = {
      success: true,
      data: {
        id: 2,
        entries: [
          {
            id: 20,
            sectionId: 1,
            courseId: 1,
            divisionId: 1,
            batchId: null,
            meetingTimeId: 2,
            MeetingTime: { id: 2, day: 'Tuesday', time: '08:45-09:45' },
            Course: { code: 'AI', name: 'Artificial Intelligence' },
            Room: { number: 'A1-309' },
            Instructor: { name: 'Dr. S.N. Girme' }
          }
        ]
      }
    };

    timetableApi.getRunFiltered.mockResolvedValue(run2Entries);
    timetableApi.getRunById.mockImplementation((id) => {
      if (id === 1) return Promise.resolve(run1Entries);
      return Promise.resolve(run2Entries);
    });

    render(<RedesignedViewer selectedRunId={2} />);

    await waitFor(() => {
      expect(screen.getByTestId('revision-summary-card')).toBeTruthy();
      expect(screen.getByText(/Run #2 — Revision of Run #1/i)).toBeTruthy();
      expect(screen.getByTestId('view-parent-run-btn')).toBeTruthy();
    });

    // Changed entry should display the revision moved badge
    await waitFor(() => {
      expect(screen.getByTestId('revision-moved-badge-20')).toBeTruthy();
      expect(screen.getByText('Moved')).toBeTruthy();
    });

    // Clicking "View Original Run #1" switches the active run
    fireEvent.click(screen.getByTestId('view-parent-run-btn'));

    await waitFor(() => {
      expect(timetableApi.getRunFiltered).toHaveBeenCalledWith(1, 'Division', 1);
    });
  });

  it('9. Preserves existing Edit button on cards for accessible modal editing', async () => {
    render(<RedesignedViewer selectedRunId={1} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /edit AI entry/i })).toBeTruthy();
    });

    fireEvent.click(screen.getByRole('button', { name: /edit AI entry/i }));

    await waitFor(() => {
      expect(screen.getByText(/Edit Timetable Entry/i)).toBeTruthy();
      expect(screen.getByRole('button', { name: /validate change/i })).toBeTruthy();
    });
  });
});
