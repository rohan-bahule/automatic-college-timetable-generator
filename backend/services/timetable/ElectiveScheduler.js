const { _parse } = require('./algorithmUtils');

const ELECTIVE_GROUP_DIVISIONS = {
  'G1': ['TE-I', 'TE-II'],
  'G2': ['TE-III', 'TE-IV'],
};

const DAYS_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

// Using a lightweight class matching Python SC (Scheduled Class) exactly
class ScheduledClass {
  constructor(section, mt, room, instructor, overrideDivision = null) {
    this.section = section;
    this.course = section.Course || section.course; 
    this.meetingTime = mt;
    this.room = room;
    this.instructor = instructor;
    this.division = overrideDivision ? overrideDivision : (section.Division || section.division);
    this.batch = section.Batch || section.batch;
  }
}

// Utility to shuffle an array immutably or mutably
function shuffleArray(array) {
  let newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
}

class ElectiveScheduler {
  constructor(timetableData, schedulingState) {
    this.data = timetableData;
    this.state = schedulingState;
  }

  _getElectiveTeacherForSection(section, mt) {
    // 1. Maintain consistent teacher lock specifically matching python Tuple key struct 
    const key = this.state.getCompositeKey(section.sectionId, 'ELECTIVE');
    if (this.state.divLecTeacher[key]) {
      const lockedTeacher = this.state.divLecTeacher[key];
      if (this.state.teacherFree(mt, lockedTeacher.uid)) {
        return lockedTeacher;
      }
      return null;
    }

    const courseCode = section.Course ? section.Course.code : section.courseId;
    const pool = this.data.eligibleTeachers[courseCode] || [];
    
    // 2. Candidate filtering
    const free = pool.filter(t => this.state.teacherFree(mt, t.uid));
    if (free.length === 0) return null;

    // 3. Evaluate multi-conditional sorting mimicking native Python `free.sort(key=lambda t: ...)`
    free.sort((t1, t2) => {
      const load1 = this.state.teacherLectureLoad[t1.uid] || 0;
      const load2 = this.state.teacherLectureLoad[t2.uid] || 0;
      if (load1 !== load2) return load1 - load2;
      
      const count1 = this.state.teacherBatchCount[t1.uid] || 0;
      const count2 = this.state.teacherBatchCount[t2.uid] || 0;
      return count1 - count2;
    });

    const chosen = free[0];
    // 4. Evolve tracking heuristics
    this.state.divLecTeacher[key] = chosen;
    this.state.teacherLectureLoad[chosen.uid] = (this.state.teacherLectureLoad[chosen.uid] || 0) + 1;
    
    return chosen;
  }

  assignElectives() {
    const data = this.data;
    const state = this.state;
    const allElectiveSections = data.electiveSections;

    if (!allElectiveSections || allElectiveSections.length === 0) {
      return;
    }

    // Identify affected division constraints
    const allDivIds = [];
    for (const groupName of Object.keys(ELECTIVE_GROUP_DIVISIONS)) {
      const divNames = ELECTIVE_GROUP_DIVISIONS[groupName];
      for (const name of divNames) {
        if (data.divByName[name]) {
          allDivIds.push(data.divByName[name].id);
        }
      }
    }

    const neededRooms = allElectiveSections.length;
    const groupDivs = {};
    for (const groupName of Object.keys(ELECTIVE_GROUP_DIVISIONS)) {
      const divNames = ELECTIVE_GROUP_DIVISIONS[groupName];
      groupDivs[groupName] = divNames
        .filter(n => data.divByName[n])
        .map(n => data.divByName[n]);
    }

    const electiveDaysUsed = [];
    const sessionsToSchedule = [
      { label: '2-hour', attr: 'elec2hByDay' },
      { label: '1-hour', attr: 'elec1hByDay' }
    ];

    for (const sessionConfig of sessionsToSchedule) {
      const slotPool = data[sessionConfig.attr];
      let scheduled = false;
      const days = shuffleArray(DAYS_ORDER);

      for (const day of days) {
        if (electiveDaysUsed.includes(day)) continue;

        const slots = shuffleArray(slotPool[day] || []);

        for (const mt of slots) {
          // Rule 1: Divisions universally free
          const allFree = allDivIds.every(did => state.divFree(mt, did));
          if (!allFree) continue;

          // Rule 2: Free lecture rooms
          const freeRooms = data.lectureRooms.filter(r => state.roomFree(mt, r.number));
          if (freeRooms.length < neededRooms) continue;

          // Rule 3: Viable teachers for sections
          const teacherMap = {};
          let valid = true;
          // IMPORTANT: this modifies divLecTeacher during lookup implicitly locking teachers identically to python!
          for (const sec of allElectiveSections) {
            const teacher = this._getElectiveTeacherForSection(sec, mt);
            if (!teacher) {
              valid = false;
              break;
            }
            teacherMap[sec.sectionId] = teacher;
          }
          if (!valid) continue;

          // Rule 4: Room assignment allocations
          const roomMap = {};
          const shuffledRooms = shuffleArray(freeRooms);
          for (let i = 0; i < allElectiveSections.length; i++) {
            const sec = allElectiveSections[i];
            roomMap[sec.sectionId] = shuffledRooms[i];
          }

          // COMMIT PHASE: Explicit translation of mutations identically matching Python algorithm 
          const [sMin, eMin] = _parse(mt.time);

          for (const sec of allElectiveSections) {
            const teacher = teacherMap[sec.sectionId];
            const room = roomMap[sec.sectionId];

            state._markBusy(state.roomBusy, room.number, mt.day, sMin, eMin);
            state._markBusy(state.teacherBusy, teacher.uid, mt.day, sMin, eMin);

            const divsForGroup = groupDivs[sec.electiveGroup] || (sec.Division ? [sec.Division] : []);
            
            for (const divObj of divsForGroup) {
              const sc = new ScheduledClass(sec, mt, room, teacher, divObj);
              state.result.push(sc);
            }
          }

          // Div/Batch blocking propagation globally mapped across ALL matched entities
          for (const did of allDivIds) {
            state.markDivOnly(mt, did);
            const batches = data.batchesByDivision[did] || [];
            for (const batch of batches) {
              state._markBusy(state.batchBusy, batch.id, mt.day, sMin, eMin);
            }
          }

          electiveDaysUsed.push(day);
          scheduled = true;
          break; // Break slots wrapper
        }
        if (scheduled) break; // Break days wrapper
      }
      
      if (!scheduled) {
        // Source implementation throws a Warning without entirely aborting via error tracking
        console.warn(`WARNING: Could not schedule elective ${sessionConfig.label} session for divisions!`);
      }
    }
  }
}

module.exports = { ElectiveScheduler, ScheduledClass };
