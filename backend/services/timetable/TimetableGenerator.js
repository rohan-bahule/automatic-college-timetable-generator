const TimetableDataLoader = require('./TimetableDataLoader');
const SchedulingState = require('./SchedulingState');
const { ElectiveScheduler } = require('./ElectiveScheduler');
const { LabScheduler } = require('./LabScheduler');
const { LectureScheduler } = require('./LectureScheduler');
const { verifyTimetable } = require('./TimetableValidator');

const MAX_RETRIES = 100;

class TimetableGenerator {
  constructor(loadedData) {
    this.data = loadedData; // Must be evaluated and provided by DataLoader explicitly mimicking initialization parameters natively properly
  }

  generateBest() {
    const start = Date.now();
    let bestSolution = null;
    let bestConflicts = Infinity;
    let finalConflictsArray = [];
    let attemptsUsed = 0;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      attemptsUsed = attempt;
      
      // Reset runtime properties exactly wiping completely preserving boundaries purely locally correctly safely
      const state = new SchedulingState();
      
      const electiveScheduler = new ElectiveScheduler(this.data, state);
      electiveScheduler.assignElectives();

      const labScheduler = new LabScheduler(this.data, state);
      labScheduler.assignLabs();

      const lectureScheduler = new LectureScheduler(this.data, state);
      lectureScheduler.assignLectures();

      const solution = state.result;
      const conflicts = verifyTimetable(solution);

      if (conflicts.length < bestConflicts) {
        bestConflicts = conflicts.length;
        bestSolution = solution;
        finalConflictsArray = conflicts;
        
        if (bestConflicts === 0) {
          // Break bounds when perfect schedule generated satisfying limits
          break;
        }
      }
    }

    const elapsedMs = Date.now() - start;

    return {
      schedule: bestSolution || [],
      conflicts: finalConflictsArray,
      conflictCount: bestConflicts === Infinity ? 0 : bestConflicts,
      attempts: attemptsUsed,
      timeTakenSec: (elapsedMs / 1000).toFixed(2),
      verified: bestConflicts === 0
    };
  }
}

module.exports = TimetableGenerator;
