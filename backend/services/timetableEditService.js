const { 
  TimetableRun, 
  TimetableEntry, 
  Section, 
  Course, 
  Division, 
  Batch, 
  Instructor, 
  Room, 
  MeetingTime, 
  InstructorCourse,
  sequelize 
} = require('../models');
const { verifyTimetable } = require('./timetable/TimetableValidator');
const { _parse } = require('./timetable/algorithmUtils');

const commonIncludes = [
  { model: Section },
  { model: Course },
  { model: Division },
  { model: Batch },
  { model: Instructor },
  { model: Room },
  { model: MeetingTime }
];

/**
 * Validate a proposed change to a timetable entry within a run.
 * Does NOT modify any records.
 */
async function validateEntryEdit(runId, entryId, proposedData) {
  const run = await TimetableRun.findByPk(runId);
  if (!run) {
    throw { status: 404, message: `Timetable run #${runId} not found.` };
  }

  const currentEntry = await TimetableEntry.findOne({
    where: { id: entryId, timetableRunId: runId },
    include: commonIncludes
  });
  if (!currentEntry) {
    throw { status: 404, message: `Timetable entry #${entryId} not found in run #${runId}.` };
  }

  // Load proposed entities (or retain existing if not changing)
  const targetInstructorId = proposedData.instructorId !== undefined 
    ? parseInt(proposedData.instructorId, 10) 
    : currentEntry.instructorId;

  const targetRoomId = proposedData.roomId !== undefined 
    ? parseInt(proposedData.roomId, 10) 
    : currentEntry.roomId;

  const targetMeetingTimeId = proposedData.meetingTimeId !== undefined 
    ? parseInt(proposedData.meetingTimeId, 10) 
    : currentEntry.meetingTimeId;

  const [proposedInstructor, proposedRoom, proposedMeetingTime] = await Promise.all([
    Instructor.findByPk(targetInstructorId),
    Room.findByPk(targetRoomId),
    MeetingTime.findByPk(targetMeetingTimeId)
  ]);

  if (!proposedInstructor) {
    return {
      valid: false,
      conflicts: [{ type: 'INVALID_ENTITY', message: `Proposed instructor #${targetInstructorId} does not exist.` }]
    };
  }
  if (!proposedRoom) {
    return {
      valid: false,
      conflicts: [{ type: 'INVALID_ENTITY', message: `Proposed room #${targetRoomId} does not exist.` }]
    };
  }
  if (!proposedMeetingTime) {
    return {
      valid: false,
      conflicts: [{ type: 'INVALID_ENTITY', message: `Proposed meeting time #${targetMeetingTimeId} does not exist.` }]
    };
  }

  const conflicts = [];

  // 1. Instructor-Course Eligibility
  const eligibility = await InstructorCourse.findOne({
    where: { instructorId: targetInstructorId, courseId: currentEntry.courseId }
  });
  if (!eligibility) {
    conflicts.push({
      type: 'INSTRUCTOR_ELIGIBILITY',
      message: `Instructor ${proposedInstructor.name} (${proposedInstructor.uid}) is not eligible to teach ${currentEntry.Course?.code || 'this course'}.`
    });
  }

  // 2. Room Type Compatibility
  const isLabCourse = currentEntry.Course?.courseType === 'LAB' || Boolean(currentEntry.batchId);
  if (isLabCourse && proposedRoom.roomType !== 'LAB') {
    conflicts.push({
      type: 'ROOM_TYPE_MISMATCH',
      message: `Course ${currentEntry.Course?.code} is a laboratory practical and requires a LAB room. Room ${proposedRoom.number} is a ${proposedRoom.roomType}.`
    });
  } else if (!isLabCourse && proposedRoom.roomType !== 'LECTURE') {
    conflicts.push({
      type: 'ROOM_TYPE_MISMATCH',
      message: `Course ${currentEntry.Course?.code} is a lecture and requires a LECTURE classroom. Room ${proposedRoom.number} is a ${proposedRoom.roomType}.`
    });
  }

  // 3. Meeting Time Slot Type Compatibility
  if (isLabCourse && proposedMeetingTime.slotType !== 'LAB') {
    conflicts.push({
      type: 'SLOT_TYPE_MISMATCH',
      message: `Lab sessions require a LAB duration slot. Meeting time ${proposedMeetingTime.day} ${proposedMeetingTime.time} is a ${proposedMeetingTime.slotType} slot.`
    });
  } else if (!isLabCourse && proposedMeetingTime.slotType !== 'LECTURE') {
    conflicts.push({
      type: 'SLOT_TYPE_MISMATCH',
      message: `Lectures require a LECTURE slot. Meeting time ${proposedMeetingTime.day} ${proposedMeetingTime.time} is a ${proposedMeetingTime.slotType} slot.`
    });
  }

  // Load ALL other entries in this run for collision checking
  const otherEntries = await TimetableEntry.findAll({
    where: { timetableRunId: runId },
    include: commonIncludes
  });

  const [propStart, propEnd] = _parse(proposedMeetingTime.time);
  const propDay = proposedMeetingTime.day;

  // Collision detection against other entries (excluding the entry currently being edited)
  for (const other of otherEntries) {
    if (other.id === currentEntry.id) continue;
    if (!other.MeetingTime) continue;

    const otherDay = other.MeetingTime.day;
    if (otherDay !== propDay) continue;

    const [otherStart, otherEnd] = _parse(other.MeetingTime.time);
    const timesOverlap = Math.max(propStart, otherStart) < Math.min(propEnd, otherEnd);
    if (!timesOverlap) continue;

    // Check if other entry belongs to the exact same elective class across divisions
    const isSameElectiveSession = Boolean(
      currentEntry.Section?.isElective &&
      other.Section?.isElective &&
      currentEntry.sectionId === other.sectionId &&
      currentEntry.courseId === other.courseId
    );

    // A. Instructor Collision
    if (other.instructorId === targetInstructorId && !isSameElectiveSession) {
      conflicts.push({
        type: 'TEACHER_CONFLICT',
        message: `Instructor ${proposedInstructor.name} is already scheduled on ${propDay} ${other.MeetingTime.time} for ${other.Course?.code || 'another class'}.`
      });
    }

    // B. Room Collision
    if (other.roomId === targetRoomId && !isSameElectiveSession) {
      conflicts.push({
        type: 'ROOM_CONFLICT',
        message: `Room ${proposedRoom.number} is already occupied on ${propDay} ${other.MeetingTime.time} by ${other.Division ? other.Division.name : ''} ${other.Course?.code || ''}.`
      });
    }

    // C. Division Collision
    if (currentEntry.divisionId && other.divisionId === currentEntry.divisionId) {
      const isElectiveGroupPeer = Boolean(
        currentEntry.Section?.isElective &&
        other.Section?.isElective &&
        currentEntry.Section.electiveGroup &&
        currentEntry.Section.electiveGroup === other.Section.electiveGroup
      );

      // If both are in the same elective group, they run in parallel in separate rooms for student choices
      if (!isElectiveGroupPeer) {
        // If both are full division lectures OR one is a lecture and other is a lab of the same division
        if (!currentEntry.batchId || !other.batchId || currentEntry.batchId === other.batchId) {
          conflicts.push({
            type: 'DIVISION_CONFLICT',
            message: `Division ${currentEntry.Division?.name || other.Division?.name} already has ${other.Course?.code || 'class'} scheduled during ${propDay} ${other.MeetingTime.time}.`
          });
        }
      }
    }

    // D. Batch Collision (for lab practicals)
    if (currentEntry.batchId && other.batchId && currentEntry.batchId === other.batchId) {
      conflicts.push({
        type: 'BATCH_CONFLICT',
        message: `Batch ${currentEntry.Batch?.name || other.Batch?.name} already has ${other.Course?.code} scheduled during ${propDay} ${other.MeetingTime.time}.`
      });
    }
  }

  // Entry-specific consistency check:
  // If moving a lecture/lab, check if division/batch already has an assigned teacher for this course
  if (currentEntry.Course?.courseType === 'LECTURE' && currentEntry.divisionId) {
    const existingLec = otherEntries.find(e => 
      e.id !== currentEntry.id &&
      e.divisionId === currentEntry.divisionId && 
      e.courseId === currentEntry.courseId &&
      e.instructorId &&
      e.instructorId !== targetInstructorId
    );
    if (existingLec) {
      conflicts.push({
        type: 'TEACHER_CONSISTENCY',
        message: `Division ${currentEntry.Division?.name} already has ${existingLec.Instructor?.name || 'another teacher'} assigned for lecture ${currentEntry.Course?.code}.`
      });
    }
  }

  return {
    valid: conflicts.length === 0,
    conflicts,
    message: conflicts.length === 0 ? 'Change is valid. No conflicts detected.' : `${conflicts.length} conflict(s) detected.`
  };
}

/**
 * Save an edited timetable entry by creating a new revised TimetableRun snapshot.
 * Preserves the original run completely untouched.
 */
async function saveEntryEdit(runId, entryId, proposedData) {
  // Always perform authoritative revalidation immediately before saving
  const validationResult = await validateEntryEdit(runId, entryId, proposedData);
  if (!validationResult.valid) {
    throw {
      status: 409,
      message: 'Cannot save timetable edit due to scheduling conflicts.',
      conflicts: validationResult.conflicts
    };
  }

  const originalRun = await TimetableRun.findByPk(runId);
  if (!originalRun) {
    throw { status: 404, message: `Original timetable run #${runId} not found.` };
  }

  const allOriginalEntries = await TimetableEntry.findAll({
    where: { timetableRunId: runId }
  });

  const targetEntry = allOriginalEntries.find(e => e.id === parseInt(entryId, 10));
  if (!targetEntry) {
    throw { status: 404, message: `Entry #${entryId} not found in run #${runId}.` };
  }

  const transaction = await sequelize.transaction();
  try {
    // 1. Create revised TimetableRun snapshot
    const revisedRun = await TimetableRun.create({
      conflictCount: 0,
      verified: true,
      attempts: originalRun.attempts,
      timeTakenSec: originalRun.timeTakenSec
    }, { transaction });

    // 2. Clone all entries, applying the edit to the target entry
    const newEntries = allOriginalEntries.map(e => {
      const isTarget = e.id === targetEntry.id;
      return {
        timetableRunId: revisedRun.id,
        sectionId: e.sectionId,
        courseId: e.courseId,
        meetingTimeId: isTarget && proposedData.meetingTimeId !== undefined ? parseInt(proposedData.meetingTimeId, 10) : e.meetingTimeId,
        roomId: isTarget && proposedData.roomId !== undefined ? parseInt(proposedData.roomId, 10) : e.roomId,
        instructorId: isTarget && proposedData.instructorId !== undefined ? parseInt(proposedData.instructorId, 10) : e.instructorId,
        divisionId: e.divisionId,
        batchId: e.batchId
      };
    });

    await TimetableEntry.bulkCreate(newEntries, { transaction });
    await transaction.commit();

    return {
      success: true,
      originalRunId: originalRun.id,
      revisedRunId: revisedRun.id,
      message: `Created revised timetable Run #${revisedRun.id}. Original Run #${originalRun.id} preserved.`
    };
  } catch (err) {
    await transaction.rollback();
    throw new Error(`Failed to save revised timetable: ${err.message}`);
  }
}

module.exports = {
  validateEntryEdit,
  saveEntryEdit
};
