const { ScheduledClass } = require('./ElectiveScheduler');
const { _parse } = require('./algorithmUtils');

const DAYS_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

function shuffleArray(array) {
  let newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
}

class LectureScheduler {
  constructor(timetableData, schedulingState) {
    this.data = timetableData;
    this.state = schedulingState;
  }

  _getLectureTeacher(divId, courseCode, mt = null) {
    const key = this.state.getCompositeKey(divId, courseCode);

    // 1. Maintain consistent teacher mapping natively replicating self.div_lec_teacher dict logic
    if (this.state.divLecTeacher[key]) {
      const lockedTeacher = this.state.divLecTeacher[key];
      if (!mt || this.state.teacherFree(mt, lockedTeacher.uid)) {
        return lockedTeacher;
      }
      return null;
    }

    const pool = this.data.eligibleTeachers[courseCode] || [];
    if (pool.length === 0) return null;

    let chosen;
    if (mt) {
      const available = pool.filter(t => this.state.teacherFree(mt, t.uid));
      if (available.length === 0) return null;
      
      // 2. Multi-conditional sorting natively porting python lambda load balancing (load -> batchCount)
      available.sort((t1, t2) => {
        const l1 = this.state.teacherLectureLoad[t1.uid] || 0;
        const l2 = this.state.teacherLectureLoad[t2.uid] || 0;
        if (l1 !== l2) return l1 - l2;

        const b1 = this.state.teacherBatchCount[t1.uid] || 0;
        const b2 = this.state.teacherBatchCount[t2.uid] || 0;
        return b1 - b2;
      });
      chosen = available[0];
    } else {
      const sortedPool = [...pool].sort((t1, t2) => {
        const l1 = this.state.teacherLectureLoad[t1.uid] || 0;
        const l2 = this.state.teacherLectureLoad[t2.uid] || 0;
        if (l1 !== l2) return l1 - l2;

        const b1 = this.state.teacherBatchCount[t1.uid] || 0;
        const b2 = this.state.teacherBatchCount[t2.uid] || 0;
        return b1 - b2;
      });
      chosen = sortedPool[0];
    }

    // 3. Increment counters strictly referencing mapping natively tracking load dynamically updates state
    this.state.divLecTeacher[key] = chosen;
    this.state.teacherLectureLoad[chosen.uid] = (this.state.teacherLectureLoad[chosen.uid] || 0) + 1;
    
    return chosen;
  }

  assignLectures() {
    const data = this.data;
    const state = this.state;
    
    // Group lectures matching defaultDict(list) behavior
    const lectureByDivision = {};
    for (const section of data.lectureSections) {
      if (section.Division) {
        if (!lectureByDivision[section.Division.id]) lectureByDivision[section.Division.id] = [];
        lectureByDivision[section.Division.id].push(section);
      }
    }

    const divIds = Object.keys(lectureByDivision);

    for (const divIdStr of divIds) {
      const sections = lectureByDivision[divIdStr];
      const divId = parseInt(divIdStr, 10);
      const div = sections[0].Division; // Safely mapped natively referencing Object 

      for (const section of sections) {
        const course = section.Course;
        const courseCode = course.code;
        
        const needed = section.numClassesPerWeek || data.lectureFrequency[courseCode] || 3;

        const teacher = this._getLectureTeacher(div.id, courseCode, null);
        if (!teacher) {
          console.warn(`WARNING: No teacher available for division ${div.name} course ${courseCode}`);
          continue;
        }

        let assigned = 0;
        const daysUsed = {}; // tracks how many lectures per day

        for (let attempt = 0; attempt < 300; attempt++) {
          if (assigned >= needed) break;

          const days = shuffleArray(DAYS_ORDER);

          for (const day of days) {
            if (assigned >= needed) break;
            
            // Limit occurrences logically evaluating constraint `< 2` natively
            if ((daysUsed[day] || 0) >= 2) continue;

            const daySlots = data.lecSlotsByDay[day] || [];
            // Optional: Shuffle slots mirroring typical randomization semantics within timeframe iterations
            const shuffledSlots = shuffleArray(daySlots);

            for (const mt of shuffledSlots) {
              if (!state.divFree(mt, div.id)) continue;
              if (!state.teacherFree(mt, teacher.uid)) continue;

              const freeRooms = data.lectureRooms.filter(r => state.roomFree(mt, r.number));
              if (freeRooms.length === 0) continue;

              // Python choice randomizer directly natively evaluated
              const room = freeRooms[Math.floor(Math.random() * freeRooms.length)];
              
              const sc = new ScheduledClass(section, mt, room, teacher);
              state.result.push(sc);
              
              // Updates trackers manually blocking parameters statically locking
              state.mark(mt, room.number, teacher.uid, div.id, null);
              
              daysUsed[day] = (daysUsed[day] || 0) + 1;
              assigned += 1;
              break; // breaks slot loop
            }
          }
        }

        if (assigned < needed) {
          console.warn(`WARNING: Lecture allocation deficit Division ${div.name} for ${courseCode} (${assigned}/${needed})`);
        }
      }
    }
  }
}

module.exports = { LectureScheduler };
