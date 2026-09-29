const { sequelize, TimetableRun, TimetableEntry } = require('../models');

async function persistTimetable(generatorResult) {
  // Enforce secure transactions verifying unified persistence operations seamlessly safely completely reliably
  const transaction = await sequelize.transaction();
  try {
    const run = await TimetableRun.create({
      conflictCount: generatorResult.conflictCount,
      verified: generatorResult.verified,
      attempts: generatorResult.attempts,
      timeTakenSec: generatorResult.timeTakenSec
    }, { transaction });

    // Build batch insertions efficiently executing concurrently mapped safely
    const entries = generatorResult.schedule.map(sc => ({
      timetableRunId: run.id,
      sectionId: sc.section ? sc.section.id : null,
      courseId: sc.course ? sc.course.id : null,
      meetingTimeId: sc.meetingTime ? sc.meetingTime.id : null,
      roomId: sc.room ? sc.room.id : null,
      instructorId: sc.instructor ? sc.instructor.id : null,
      divisionId: sc.division ? sc.division.id : null,
      batchId: sc.batch ? sc.batch.id : null
    }));

    await TimetableEntry.bulkCreate(entries, { transaction });
    await transaction.commit();
    return run.id;
    
  } catch (error) {
    await transaction.rollback();
    throw new Error('Failed to persist timetable: ' + error.message);
  }
}

module.exports = { persistTimetable };
