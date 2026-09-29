import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  generatePdfFilename,
  formatCellText,
  parseStartMinutes,
  formatPdfDate,
  exportTimetableToPdf
} from './pdfExportService';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

vi.mock('jspdf', () => {
  const mockDoc = {
    internal: {
      pageSize: {
        getWidth: () => 297,
        getHeight: () => 210
      },
      getNumberOfPages: () => 1
    },
    setFont: vi.fn(),
    setFontSize: vi.fn(),
    setTextColor: vi.fn(),
    setDrawColor: vi.fn(),
    setLineWidth: vi.fn(),
    text: vi.fn(),
    line: vi.fn(),
    getTextWidth: () => 30,
    save: vi.fn()
  };

  function MockJsPDF(options) {
    this.options = options;
    return mockDoc;
  }

  return {
    jsPDF: vi.fn(MockJsPDF)
  };
});

vi.mock('jspdf-autotable', () => ({
  default: vi.fn((doc, options) => {
    if (options.didDrawPage) {
      options.didDrawPage({});
    }
  })
}));

describe('PDF Export Service (Phase 5)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generatePdfFilename', () => {
    it('generates sanitized filename for Division perspective', () => {
      const filename = generatePdfFilename(2, 'Division', 'TE-I');
      expect(filename).toBe('timetable-run-2-division-te-i.pdf');
    });

    it('generates sanitized filename for Instructor perspective with special chars', () => {
      const filename = generatePdfFilename(1, 'Instructor', 'Dr. S.N. Girme');
      expect(filename).toBe('timetable-run-1-instructor-dr-s-n-girme.pdf');
    });

    it('generates sanitized filename for Room perspective', () => {
      const filename = generatePdfFilename('2', 'Room', 'A1-309');
      expect(filename).toBe('timetable-run-2-room-a1-309.pdf');
    });

    it('generates sanitized filename for Batch perspective', () => {
      const filename = generatePdfFilename(3, 'Batch', 'Batch K1');
      expect(filename).toBe('timetable-run-3-batch-batch-k1.pdf');
    });
  });

  describe('formatCellText', () => {
    it('formats regular lecture entry', () => {
      const entry = {
        Course: { code: 'AI', name: 'Artificial Intelligence', courseType: 'LECTURE' },
        Instructor: { name: 'Dr. Girme' },
        Room: { number: 'A1-309' },
        Division: { name: 'TE-I' }
      };
      const text = formatCellText(entry);
      expect(text).toContain('AI - Artificial Intelligence');
      expect(text).toContain('Faculty: Dr. Girme');
      expect(text).toContain('Room: A1-309');
      expect(text).toContain('Div: TE-I');
    });

    it('formats practical lab entry with [LAB] badge and batch', () => {
      const entry = {
        Course: { code: 'DSBDAL', name: 'Data Science Lab', courseType: 'LAB' },
        Instructor: { name: 'Prof. Sonawane' },
        Room: { number: 'Lab-1' },
        Batch: { name: 'K1' }
      };
      const text = formatCellText(entry);
      expect(text).toContain('DSBDAL [LAB] - Data Science Lab');
      expect(text).toContain('Faculty: Prof. Sonawane');
      expect(text).toContain('Room: Lab-1');
      expect(text).toContain('Batch: K1');
    });

    it('formats elective entry with [ELECTIVE] badge and group', () => {
      const entry = {
        Course: { code: 'CC', name: 'Cloud Computing', courseType: 'LECTURE', isElective: true },
        Instructor: { name: 'Prof. Patil' },
        Room: { number: 'A1-310' },
        Division: { name: 'TE-I' },
        Section: { isElective: true, electiveGroup: 'G1' }
      };
      const text = formatCellText(entry);
      expect(text).toContain('CC [ELECTIVE] - Cloud Computing');
      expect(text).toContain('Group: G1');
    });
  });

  describe('parseStartMinutes', () => {
    it('correctly orders morning and afternoon hours', () => {
      const m845 = parseStartMinutes('08:45-09:45');
      const m945 = parseStartMinutes('09:45-10:45');
      const m130 = parseStartMinutes('01:30-02:30'); // 1:30 PM = 13:30

      expect(m845).toBe(8 * 60 + 45);
      expect(m945).toBe(9 * 60 + 45);
      expect(m130).toBe(13 * 60 + 30);
      expect(m845 < m945).toBe(true);
      expect(m945 < m130).toBe(true);
    });
  });

  describe('exportTimetableToPdf', () => {
    const mockEntries = [
      {
        id: 1,
        Course: { code: 'AI', name: 'Artificial Intelligence', courseType: 'LECTURE' },
        Instructor: { name: 'Dr. Girme' },
        Room: { number: 'A1-309' },
        MeetingTime: { day: 'Monday', time: '08:45-09:45' },
        Division: { name: 'TE-I' }
      },
      {
        id: 2,
        Course: { code: 'WT', name: 'Web Technology', courseType: 'LECTURE' },
        Instructor: { name: 'Prof. Sonawane' },
        Room: { number: 'A1-309' },
        MeetingTime: { day: 'Tuesday', time: '09:45-10:45' },
        Division: { name: 'TE-I' }
      }
    ];

    it('throws descriptive error if entries array is empty', () => {
      expect(() => {
        exportTimetableToPdf({
          runId: 1,
          run: { id: 1 },
          viewType: 'Division',
          entityLabel: 'TE-I',
          entries: []
        });
      }).toThrow(/No timetable entries are available to export/i);
    });

    it('creates landscape jsPDF doc and saves sanitized filename', () => {
      const result = exportTimetableToPdf({
        runId: 2,
        run: { id: 2, conflictCount: 0, verified: true, createdAt: '2026-09-18T10:00:00Z' },
        viewType: 'Division',
        entityLabel: 'TE-I',
        entries: mockEntries,
        metadata: { department: { name: 'Computer Engineering' } }
      });

      expect(jsPDF).toHaveBeenCalledWith(expect.objectContaining({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      }));

      expect(autoTable).toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.filename).toBe('timetable-run-2-division-te-i.pdf');
    });
  });
});
