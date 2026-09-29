const { TimetableRun, TimetableEntry, Section, Course, Division, Batch, Instructor, Room, MeetingTime } = require('../models');

// Standardized Object graph extraction loading references securely identically compactly safely explicitly mapping perfectly structurally
const commonIncludes = [
  { model: Section },
  { model: Course },
  { model: Division },
  { model: Batch },
  { model: Instructor },
  { model: Room },
  { model: MeetingTime }
];

async function getAllRuns() {
  return await TimetableRun.findAll({
    order: [['createdAt', 'DESC']]
  });
}

async function getRunById(timetableId) {
  return await TimetableRun.findByPk(timetableId, {
    include: [{
      model: TimetableEntry,
      include: commonIncludes
    }]
  });
}

async function getRunFiltered(timetableId, filterParams) {
  const run = await TimetableRun.findByPk(timetableId);
  if (!run) return null;

  const entries = await TimetableEntry.findAll({
    where: {
      timetableRunId: timetableId,
      ...filterParams
    },
    include: commonIncludes
  });

  // Reconstruct explicitly seamlessly mapping natively locally stably compactly identically
  const runObj = run.toJSON();
  runObj.TimetableEntries = entries;
  return runObj;
}

module.exports = {
  getAllRuns,
  getRunById,
  getRunFiltered
};
