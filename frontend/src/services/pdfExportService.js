import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

// Helper to convert time "HH:MM-HH:MM" to sortable minutes
export function parseStartMinutes(timeStr) {
  if (!timeStr) return 0;
  const startPart = timeStr.split('-')[0]?.trim();
  if (!startPart) return 0;
  const [hStr, mStr] = startPart.split(':');
  let h = parseInt(hStr, 10) || 0;
  const m = parseInt(mStr, 10) || 0;
  if (h >= 1 && h <= 7) h += 12; // PM shift adjustment
  return h * 60 + m;
}

// Helper to format date cleanly
export function formatPdfDate(dateStr) {
  if (!dateStr) return 'Recent';
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  } catch (e) {
    return String(dateStr);
  }
}

// Generate clean, sanitized filename: timetable-run-2-division-te-i.pdf
export function generatePdfFilename(runId, viewType, entityLabel) {
  const cleanLabel = String(entityLabel || 'schedule')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  const cleanType = String(viewType || 'view').toLowerCase();
  const cleanRun = String(runId || 'current').toLowerCase();
  return `timetable-run-${cleanRun}-${cleanType}-${cleanLabel}.pdf`;
}

/**
 * Format timetable entry content for PDF cell rendering
 */
export function formatCellText(entry) {
  const parts = [];

  const courseCode = entry.Course?.code || entry.course?.code || '';
  const courseName = entry.Course?.name || entry.course?.name || '';
  const isLab = entry.Course?.courseType === 'LAB' || entry.course?.type === 'LAB' || Boolean(entry.Batch || entry.batch);
  const isElective = Boolean(entry.Section?.isElective || entry.section?.isElective);

  let typeTag = '';
  if (isLab) typeTag = ' [LAB]';
  else if (isElective) typeTag = ' [ELECTIVE]';

  // 1. Course
  if (courseCode) {
    parts.push(`${courseCode}${typeTag}${courseName ? ` - ${courseName}` : ''}`);
  }

  // 2. Instructor
  const instructorName = entry.Instructor?.name || entry.instructor?.name;
  if (instructorName) {
    parts.push(`Faculty: ${instructorName}`);
  }

  // 3. Room
  const roomNum = entry.Room?.number || entry.room?.number || entry.room?.roomNumber;
  if (roomNum) {
    parts.push(`Room: ${roomNum}`);
  }

  // 4. Batch or Division context
  const batchName = entry.Batch?.name || entry.batch?.name;
  const divName = entry.Division?.name || entry.division?.name;
  if (batchName) {
    parts.push(`Batch: ${batchName}`);
  } else if (divName) {
    parts.push(`Div: ${divName}`);
  }

  // 5. Elective Group
  const elecGroup = entry.Section?.electiveGroup || entry.section?.electiveGroup;
  if (isElective && elecGroup) {
    parts.push(`Group: ${elecGroup}`);
  }

  return parts.join('\n');
}

/**
 * Main export function: constructs and saves a professional landscape PDF timetable
 * 
 * @param {Object} options
 * @param {string|number} options.runId - Active run identifier
 * @param {Object} options.run - Full run metadata object
 * @param {string} options.viewType - 'Division' | 'Instructor' | 'Room' | 'Batch'
 * @param {string} options.entityLabel - Human-readable label (e.g., 'TE-I', 'Dr. S.N. Girme')
 * @param {Array} options.entries - Active timetable entries
 * @param {Object} [options.metadata] - Academic metadata (departments, etc.)
 */
export function exportTimetableToPdf({
  runId,
  run,
  viewType = 'Division',
  entityLabel = '',
  entries = [],
  metadata = null
}) {
  if (!entries || entries.length === 0) {
    throw new Error('No timetable entries are available to export for this view.');
  }

  // Create landscape A4 PDF: 297mm width x 210mm height
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Header Colors & Styling
  const primaryColor = [26, 32, 44]; // Dark slate
  const brandColor = [234, 88, 12]; // Orange accent
  const mutedColor = [100, 116, 139]; // Slate 500

  // 1. Header Banner & Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(...primaryColor);
  const deptName = metadata?.department?.name || 'Department of Computer Engineering';
  doc.text(deptName.toUpperCase(), 14, 15);

  // Subheading / Perspective Title
  doc.setFontSize(12);
  doc.setTextColor(...brandColor);
  const perspectiveTitle = `${viewType.toUpperCase()} TIMETABLE — ${String(entityLabel).toUpperCase()}`;
  doc.text(perspectiveTitle, 14, 22);

  // Run & Verification Details
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...mutedColor);

  const formattedDate = formatPdfDate(run?.createdAt);
  const conflictText = run?.conflictCount === 0 ? '0 conflicts (Verified)' : `${run?.conflictCount || 0} conflicts`;
  const revisionText = run?.revisionOf ? ` • Revision of Run #${run.revisionOf}` : '';
  const metaText = `Run #${runId || run?.id || '1'}${revisionText} • Generated: ${formattedDate} • Status: ${conflictText}`;
  doc.text(metaText, 14, 28);

  // Thin decorative rule below header
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(14, 31, pageWidth - 14, 31);

  // 2. Matrix Table Construction
  // Check if Saturday has any entries
  const hasSaturday = entries.some(e => e.MeetingTime?.day === 'Saturday' || e.meetingTime?.day === 'Saturday');
  const activeDays = hasSaturday ? [...DAYS, 'Saturday'] : DAYS;

  // Chronologically sort unique time blocks
  const uniqueTimeBlocks = [...new Set(
    entries.map(e => e.MeetingTime?.time || e.meetingTime?.time).filter(Boolean)
  )].sort((a, b) => parseStartMinutes(a) - parseStartMinutes(b));

  if (uniqueTimeBlocks.length === 0) {
    throw new Error('Unable to extract scheduled time slots for this timetable view.');
  }

  // Define Table Headers
  const tableHeaders = ['Time Slot', ...activeDays];

  // Define Table Rows
  const tableRows = uniqueTimeBlocks.map(timeBlock => {
    const row = [timeBlock];

    activeDays.forEach(day => {
      const matched = entries.filter(e => {
        const eDay = e.MeetingTime?.day || e.meetingTime?.day;
        const eTime = e.MeetingTime?.time || e.meetingTime?.time;
        return eDay === day && eTime === timeBlock;
      });

      if (matched.length === 0) {
        row.push('—');
      } else {
        const cellString = matched.map(formatCellText).join('\n──────────\n');
        row.push(cellString);
      }
    });

    return row;
  });

  // Calculate dynamic column width:
  // First column (Time slot) ~ 30mm, remaining space distributed among active days
  const usableWidth = pageWidth - 28; // 14mm margins left & right
  const timeColWidth = 28;
  const dayColWidth = (usableWidth - timeColWidth) / activeDays.length;

  const columnStyles = {
    0: { cellWidth: timeColWidth, fontStyle: 'bold', halign: 'center', valign: 'middle', fillColor: [248, 250, 252] }
  };
  for (let i = 1; i <= activeDays.length; i++) {
    columnStyles[i] = { cellWidth: dayColWidth, valign: 'top' };
  }

  // Render Table using autoTable
  autoTable(doc, {
    head: [tableHeaders],
    body: tableRows,
    startY: 34,
    margin: { left: 14, right: 14, top: 34, bottom: 18 },
    styles: {
      font: 'helvetica',
      fontSize: 7.5,
      cellPadding: 2.5,
      lineColor: [203, 213, 225], // Slate 300
      lineWidth: 0.25,
      textColor: [30, 41, 59],
      overflow: 'linebreak'
    },
    headStyles: {
      fillColor: [30, 41, 59], // Slate 800
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
      valign: 'middle',
      fontSize: 8.5
    },
    alternateRowStyles: {
      fillColor: [255, 255, 255]
    },
    didDrawPage: (data) => {
      // Footer rendering on each page
      const pageNumber = doc.internal.getNumberOfPages();
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184); // Slate 400

      // Footer divider
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.line(14, pageHeight - 12, pageWidth - 14, pageHeight - 12);

      // Left footer
      doc.text('Timetable Generation & Management System', 14, pageHeight - 7);

      // Center footer
      const centerFooter = `Run #${runId || run?.id || '1'} (${viewType}: ${entityLabel})`;
      const centerWidth = doc.getTextWidth(centerFooter);
      doc.text(centerFooter, (pageWidth - centerWidth) / 2, pageHeight - 7);

      // Right footer (page number)
      const pageText = `Page ${pageNumber}`;
      doc.text(pageText, pageWidth - 14 - doc.getTextWidth(pageText), pageHeight - 7);
    }
  });

  // Save Document with sanitized filename
  const filename = generatePdfFilename(runId || run?.id, viewType, entityLabel);
  doc.save(filename);

  return { success: true, filename };
}

export default {
  exportTimetableToPdf,
  generatePdfFilename,
  formatCellText,
  parseStartMinutes,
  formatPdfDate
};
