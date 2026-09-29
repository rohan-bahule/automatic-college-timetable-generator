const { ScheduledClass } = require('./ElectiveScheduler');
const { _parse, _is_lab_slot_consecutive } = require('./algorithmUtils');

const MAX_LABS_PER_DAY = 2;
const MAX_BATCHES_PER_TEACHER = 4;
const DAYS_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

// Utility to shuffle an array immutably
function shuffleArray(array) {
  let newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
}

class LabScheduler {
  constructor(timetableData, schedulingState) {
    this.data = timetableData;
    this.state = schedulingState;
  }

  _getLabTeacherForBatch(batchId, courseCode, mt, assignedTeachersCache) {
    const key = this.state.getCompositeKey(batchId, courseCode);

    // 1. Maintain consistent batch-lab teacher mapping
    if (this.state.batchLabTeacher[key]) {
      const lockedTeacher = this.state.batchLabTeacher[key];
      if (this.state.teacherFree(mt, lockedTeacher.uid)) {
        assignedTeachersCache[batchId] = lockedTeacher;
        return lockedTeacher;
      }
      return null;
    }

    const pool = this.data.eligibleTeachers[courseCode] || [];
    if (pool.length === 0) return null;

    const usedTeacherUids = Object.values(assignedTeachersCache).map(t => t.uid);

    // 2. Candidate Filtering
    const candidates = pool.filter(t => 
      this.state.teacherFree(mt, t.uid) &&
      (this.state.teacherBatchCount[t.uid] || 0) < MAX_BATCHES_PER_TEACHER &&
      !usedTeacherUids.includes(t.uid)
    );

    if (candidates.length === 0) return null;

    // 3. Evaluate multi-conditional sorting (load-balancing)
    candidates.sort((t1, t2) => {
      const b1 = this.state.teacherBatchCount[t1.uid] || 0;
      const b2 = this.state.teacherBatchCount[t2.uid] || 0;
      if (b1 !== b2) return b1 - b2;
      
      const l1 = this.state.teacherLectureLoad[t1.uid] || 0;
      const l2 = this.state.teacherLectureLoad[t2.uid] || 0;
      return l1 - l2;
    });

    const chosen = candidates[0];

    // 4. Update tracking mechanisms explicitly linking
    assignedTeachersCache[batchId] = chosen;
    this.state.batchLabTeacher[key] = chosen;
    this.state.teacherBatchCount[chosen.uid] = (this.state.teacherBatchCount[chosen.uid] || 0) + 1;
    return chosen;
  }

  _getLabRoomForBatch(batchId, courseCode, mt, assignedRoomsCache) {
    const key = this.state.getCompositeKey(batchId, courseCode);

    if (this.state.batchLabRoom[key]) {
      const lockedRoom = this.state.batchLabRoom[key];
      if (this.state.roomFree(mt, lockedRoom.number) && !assignedRoomsCache.has(lockedRoom.number)) {
        assignedRoomsCache.add(lockedRoom.number);
        return lockedRoom;
      }
      return null;
    }

    const available = this.data.labRooms.filter(r => 
      !assignedRoomsCache.has(r.number) && 
      this.state.roomFree(mt, r.number)
    );

    if (available.length === 0) return null;

    const chosen = available[Math.floor(Math.random() * available.length)]; // random.choice
    this.state.batchLabRoom[key] = chosen;
    assignedRoomsCache.add(chosen.number);
    return chosen;
  }

  assignLabs() {
    const data = this.data;
    const state = this.state;
    const tasks = [];

    // Compile dynamic batch dependencies resolving DB variables
    for (const div of data.divisions) {
      for (const courseCode of Object.keys(data.labFrequency)) {
        const needed = data.labFrequency[courseCode];
        const key = state.getCompositeKey(div.id, courseCode);
        const sections = data.divLabGroups[key] || [];
        
        if (sections.length === 0) continue;

        tasks.push({
          division: div,
          courseCode: courseCode,
          sections: sections,
          needed: needed
        });
      }
    }

    const shuffledTasks = shuffleArray(tasks);

    for (const task of shuffledTasks) {
      const div = task.division;
      const courseCode = task.courseCode;
      const sections = task.sections;
      const needed = task.needed;
      let assigned = 0;

      for (let attempt = 0; attempt < 500; attempt++) {
        if (assigned >= needed) break;

        const days = shuffleArray(DAYS_ORDER);

        for (const day of days) {
          if (assigned >= needed) break;

          const divDayKey = state.getCompositeKey(div.id, day);
          const existingTimes = state.divDayLabs[divDayKey] || [];
          
          if (existingTimes.length >= MAX_LABS_PER_DAY) {
            continue;
          }

          const daySlots = data.labSlotsByDay[day] || [];
          
          for (const mt of daySlots) {
            // Check consecutive constraint logic exactly
            const isConsecutive = existingTimes.some(e => _is_lab_slot_consecutive(e, mt.time));
            if (isConsecutive) continue;

            if (!state.divFree(mt, div.id)) continue;

            const batches = data.batchesByDivision[div.id] || [];
            const allBatchesFree = batches.every(b => state.batchFree(mt, b.id));
            if (!allBatchesFree) continue;

            const teacherCache = {};
            const roomCache = new Set();
            let teacherValid = true;
            let roomValid = true;

            // Teacher Loop
            for (const section of sections) {
              const t = this._getLabTeacherForBatch(section.Batch.id, courseCode, mt, teacherCache);
              if (!t) {
                teacherValid = false;
                break;
              }
            }
            if (!teacherValid) continue;

            // Room Loop
            const roomAssignments = {};
            for (const section of sections) {
              const r = this._getLabRoomForBatch(section.Batch.id, courseCode, mt, roomCache);
              if (!r) {
                roomValid = false;
                break;
              }
              roomAssignments[section.Batch.id] = r;
            }
            if (!roomValid) continue;

            // Commit Phase
            for (const section of sections) {
              const batch = section.Batch;
              const teacher = teacherCache[batch.id];
              const room = roomAssignments[batch.id];
              
              const sc = new ScheduledClass(section, mt, room, teacher);
              state.result.push(sc);
              
              state.mark(mt, room.number, teacher.uid, div.id, batch.id);

              const batchCountKey = state.getCompositeKey(batch.id, courseCode);
              state.batchLabCount[batchCountKey] = (state.batchLabCount[batchCountKey] || 0) + 1;
            }

            if (!state.divDayLabs[divDayKey]) state.divDayLabs[divDayKey] = [];
            state.divDayLabs[divDayKey].push(mt.time);
            assigned += 1;
            break; // Break Slots
          }
        }
      }
      
      if (assigned < needed) {
        // Native source code skips logging terminal error and yields warning explicitly omitting halting mechanism
        console.warn(`WARNING: Lab allocation deficit Division ${div.name} for ${courseCode} (${assigned}/${needed})`);
      }
    }
  }
}

module.exports = { LabScheduler };
