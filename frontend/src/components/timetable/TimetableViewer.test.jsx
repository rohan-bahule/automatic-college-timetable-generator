import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import RedesignedViewer from './TimetableViewer';
import { timetableApi } from '../../services/timetableApi';
import * as pdfExportService from '../../services/pdfExportService';

vi.mock('../../services/pdfExportService', () => ({
  exportTimetableToPdf: vi.fn(() => ({ success: true, filename: 'timetable-run-2-division-te-i.pdf' })),
  generatePdfFilename: vi.fn((runId, viewType, label) => `timetable-run-${runId}-${String(viewType).toLowerCase()}-${String(label).toLowerCase()}.pdf`)
}));

const mockMetadata = {
  success: true,
  data: {
    divisions: [
      { id: 1, name: 'TE-I' },
      { id: 2, name: 'TE-II' }
    ],
    instructors: [
      { id: 101, name: 'Dr. S.N. Girme', uid: 'T001' },
      { id: 102, name: 'Prof. Rutuja Kulkarni', uid: 'T002' }
    ],
    rooms: [
      { id: 201, number: 'A1-309', roomType: 'LECTURE' },
      { id: 202, number: 'A1-102', roomType: 'LAB' }
    ],
    batches: [
      { id: 301, name: 'K1', divisionId: 1 },
      { id: 302, name: 'L1', divisionId: 1 }
    ]
  }
};

const mockRuns = {
  success: true,
  data: [
    { id: 2, conflictCount: 0, verified: true, attempts: 15, timeTakenSec: '2.5', createdAt: '2026-09-17T10:00:00.000Z' },
    { id: 1, conflictCount: 4, verified: false, attempts: 100, timeTakenSec: '4.1', createdAt: '2026-09-16T10:00:00.000Z' }
  ]
};

const mockScheduleEntries = {
  success: true,
  data: {
    id: 2,
    conflictCount: 0,
    verified: true,
    entries: [
      {
        id: 1,
        MeetingTime: { day: 'Monday', time: '08:45-09:45' },
        Course: { code: 'AI', name: 'Artificial Intelligence', courseType: 'LECTURE' },
        Instructor: { name: 'Dr. S.N. Girme' },
        Room: { number: 'A1-309' },
        Division: { name: 'TE-I' }
      },
      {
        id: 2,
        MeetingTime: { day: 'Tuesday', time: '08:45-10:45' },
        Course: { code: 'DSBDAL', name: 'DSBDA Lab', courseType: 'LAB' },
        Instructor: { name: 'Prof. Rutuja Kulkarni' },
        Room: { number: 'A1-102' },
        Batch: { name: 'K1' }
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
    getInstructors: vi.fn().mockResolvedValue({
      success: true,
      data: [{ id: 101, name: 'Dr. S.N. Girme', uid: 'T001' }]
    }),
    getRooms: vi.fn().mockResolvedValue({
      success: true,
      data: [{ id: 201, number: 'A1-309', roomType: 'LECTURE', seatingCapacity: 60 }]
    }),
    getMeetingTimes: vi.fn().mockResolvedValue({
      success: true,
      data: [{ id: 1, day: 'Monday', time: '08:45-09:45', slotType: 'LECTURE' }]
    })
  }
}));

describe('Redesigned Timetable Viewer Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    timetableApi.getAllRuns.mockResolvedValue(mockRuns);
    timetableApi.getMetadata.mockResolvedValue(mockMetadata);
    timetableApi.getRunById.mockResolvedValue(mockScheduleEntries);
    timetableApi.getRunFiltered.mockResolvedValue(mockScheduleEntries);
  });

  afterEach(() => {
    cleanup();
  });

  it('6. Timetable viewer renders with run header, filters, and matrix', async () => {
    render(<RedesignedViewer />);

    await waitFor(() => {
      expect(screen.getByTestId('redesigned-timetable-viewer')).toBeTruthy();
      expect(screen.getByText(/Timetable Schedule — Run #2/i)).toBeTruthy();
      expect(screen.getByText(/No conflicts detected/i)).toBeTruthy();
      expect(screen.getByTestId('timetable-filter-bar')).toBeTruthy();
      expect(screen.getByTestId('timetable-matrix-grid')).toBeTruthy();
      expect(screen.getByText('AI')).toBeTruthy();
      expect(screen.getByText('DSBDAL')).toBeTruthy();
    });
  });

  it('7. Division dropdown works and filters schedule', async () => {
    render(<RedesignedViewer />);

    await waitFor(() => {
      expect(screen.getByTestId('entity-select')).toBeTruthy();
    });

    const entitySelect = screen.getByTestId('entity-select');
    expect(entitySelect.children.length).toBe(2); // TE-I, TE-II

    fireEvent.change(entitySelect, { target: { value: '2' } });

    await waitFor(() => {
      expect(timetableApi.getRunFiltered).toHaveBeenCalledWith(2, 'Division', '2');
    });
  });

  it('8. Instructor dropdown works when view type changes', async () => {
    render(<RedesignedViewer />);

    await waitFor(() => {
      expect(screen.getByTestId('view-type-select')).toBeTruthy();
    });

    fireEvent.change(screen.getByTestId('view-type-select'), { target: { value: 'Instructor' } });

    await waitFor(() => {
      const entitySelect = screen.getByTestId('entity-select');
      expect(entitySelect.children[0].textContent).toContain('Dr. S.N. Girme');
      expect(timetableApi.getRunFiltered).toHaveBeenCalledWith(2, 'Instructor', 101);
    });
  });

  it('9. Room dropdown works when view type changes', async () => {
    render(<RedesignedViewer />);

    await waitFor(() => {
      expect(screen.getByTestId('view-type-select')).toBeTruthy();
    });

    fireEvent.change(screen.getByTestId('view-type-select'), { target: { value: 'Room' } });

    await waitFor(() => {
      const entitySelect = screen.getByTestId('entity-select');
      expect(entitySelect.children[0].textContent).toContain('A1-309');
      expect(timetableApi.getRunFiltered).toHaveBeenCalledWith(2, 'Room', 201);
    });
  });

  it('10. Batch dropdown works when view type changes', async () => {
    render(<RedesignedViewer />);

    await waitFor(() => {
      expect(screen.getByTestId('view-type-select')).toBeTruthy();
    });

    fireEvent.change(screen.getByTestId('view-type-select'), { target: { value: 'Batch' } });

    await waitFor(() => {
      const entitySelect = screen.getByTestId('entity-select');
      expect(entitySelect.children[0].textContent).toContain('Batch K1');
      expect(timetableApi.getRunFiltered).toHaveBeenCalledWith(2, 'Batch', 301);
    });
  });

  it('11. Run history renders past runs accurately', async () => {
    render(<RedesignedViewer />);

    await waitFor(() => {
      expect(screen.getByTestId('run-history-section')).toBeTruthy();
      expect(screen.getByText('2 Total Runs')).toBeTruthy();
      expect(screen.getByText('#2')).toBeTruthy();
      expect(screen.getByText('#1')).toBeTruthy();
      expect(screen.getByText('4 Conflicts')).toBeTruthy();
    });
  });

  it('12. Switching runs via Run selector dropdown updates active run', async () => {
    render(<RedesignedViewer />);

    await waitFor(() => {
      expect(screen.getByTestId('run-select-dropdown')).toBeTruthy();
    });

    fireEvent.change(screen.getByTestId('run-select-dropdown'), { target: { value: '1' } });

    await waitFor(() => {
      expect(screen.getByText(/Timetable Schedule — Run #1/i)).toBeTruthy();
      expect(timetableApi.getRunFiltered).toHaveBeenCalledWith('1', 'Division', 1);
    });
  });

  it('13. Switching runs via History Table View button updates active run', async () => {
    render(<RedesignedViewer />);

    await waitFor(() => {
      expect(screen.getByTestId('view-run-btn-1')).toBeTruthy();
    });

    fireEvent.click(screen.getByTestId('view-run-btn-1'));

    await waitFor(() => {
      expect(screen.getByText(/Timetable Schedule — Run #1/i)).toBeTruthy();
    });
  });

  it('14. Renders Edit button on timetable cards and opens Edit Modal', async () => {
    render(<RedesignedViewer />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /edit AI entry/i })).toBeTruthy();
    });

    fireEvent.click(screen.getByRole('button', { name: /edit AI entry/i }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Edit Timetable Entry' })).toBeTruthy();
      expect(screen.getByText(/Course \(Read-only\)/i)).toBeTruthy();
      expect(screen.getByText(/Division \(Read-only\)/i)).toBeTruthy();
      expect(screen.getByRole('button', { name: /validate change/i })).toBeTruthy();
    });
  });

  it('15. Validates change and enables Save button', async () => {
    timetableApi.validateTimetableEntry = vi.fn().mockResolvedValue({
      valid: true,
      conflicts: [],
      message: 'Change is valid. No conflicts detected.'
    });

    render(<RedesignedViewer />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /edit AI entry/i })).toBeTruthy();
    });

    fireEvent.click(screen.getByRole('button', { name: /edit AI entry/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /validate change/i })).toBeTruthy();
    });

    fireEvent.click(screen.getByRole('button', { name: /validate change/i }));

    await waitFor(() => {
      expect(timetableApi.validateTimetableEntry).toHaveBeenCalled();
      expect(screen.getByText(/✓ Change is Valid/i)).toBeTruthy();
      expect(screen.getByRole('button', { name: /save change/i })).toBeTruthy();
    });
  });

  it('16. Displays conflicts when validation detects clash', async () => {
    timetableApi.validateTimetableEntry = vi.fn().mockResolvedValue({
      valid: false,
      conflicts: [
        { type: 'TEACHER_CONFLICT', message: 'Instructor Dr. S.N. Girme is already scheduled on Monday 08:45-09:45.' }
      ]
    });

    render(<RedesignedViewer />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /edit AI entry/i })).toBeTruthy();
    });

    fireEvent.click(screen.getByRole('button', { name: /edit AI entry/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /validate change/i })).toBeTruthy();
    });

    fireEvent.click(screen.getByRole('button', { name: /validate change/i }));

    await waitFor(() => {
      expect(screen.getByText(/Cannot Apply This Change/i)).toBeTruthy();
      expect(screen.getByText(/is already scheduled on Monday/i)).toBeTruthy();
    });
  });

  it('17. Renders Export PDF and Print action buttons in header', async () => {
    render(<RedesignedViewer />);

    await waitFor(() => {
      expect(screen.getByTestId('export-pdf-btn')).toBeTruthy();
      expect(screen.getByTestId('print-timetable-btn')).toBeTruthy();
      expect(screen.getByRole('button', { name: /export pdf/i })).toBeTruthy();
      expect(screen.getByRole('button', { name: /print/i })).toBeTruthy();
    });
  });

  it('18. Clicking Export PDF triggers exportTimetableToPdf with active run and perspective', async () => {
    render(<RedesignedViewer />);

    await waitFor(() => {
      expect(screen.getByTestId('slot-entry-1')).toBeTruthy();
      expect(screen.getByTestId('export-pdf-btn')).toBeTruthy();
    });

    fireEvent.click(screen.getByTestId('export-pdf-btn'));

    expect(pdfExportService.exportTimetableToPdf).toHaveBeenCalledWith(expect.objectContaining({
      runId: 2,
      viewType: 'Division',
      entityLabel: 'TE-I'
    }));

    await waitFor(() => {
      expect(screen.getByText(/Exported PDF successfully/i)).toBeTruthy();
    });
  });

  it('19. Clicking Print triggers window.print()', async () => {
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {});

    render(<RedesignedViewer />);

    await waitFor(() => {
      expect(screen.getByTestId('slot-entry-1')).toBeTruthy();
      expect(screen.getByTestId('print-timetable-btn')).toBeTruthy();
    });

    fireEvent.click(screen.getByTestId('print-timetable-btn'));
    expect(printSpy).toHaveBeenCalled();
    printSpy.mockRestore();
  });

  it('20. Displays error when Export PDF clicked on empty entries', async () => {
    timetableApi.getRunFiltered = vi.fn().mockResolvedValue({
      success: true,
      data: { id: 2, entries: [] }
    });

    render(<RedesignedViewer />);

    await waitFor(() => {
      expect(screen.getByTestId('timetable-matrix-grid')).toBeTruthy();
    });

    fireEvent.click(screen.getByTestId('export-pdf-btn'));

    await waitFor(() => {
      expect(screen.getByText(/No timetable entries are available to export/i)).toBeTruthy();
    });
  });

  it('21. Triggers authoritative user-initiated regeneration and switches to newly created run', async () => {
    timetableApi.generateTimetable = vi.fn().mockResolvedValue({
      success: true,
      data: { timetableId: 3, conflictCount: 0, verified: true }
    });

    timetableApi.getAllRuns = vi.fn().mockResolvedValue({
      success: true,
      data: [
        { id: 3, conflictCount: 0, verified: true, createdAt: '2026-09-19T10:00:00.000Z' },
        ...mockRuns.data
      ]
    });

    render(<RedesignedViewer />);

    await waitFor(() => {
      expect(screen.getByTestId('regenerate-timetable-btn')).toBeTruthy();
    });

    fireEvent.click(screen.getByTestId('regenerate-timetable-btn'));

    await waitFor(() => {
      expect(timetableApi.generateTimetable).toHaveBeenCalledTimes(1);
      expect(screen.getByText(/Timetable regenerated successfully! Created new Run #3/i)).toBeTruthy();
    });
  });
});
