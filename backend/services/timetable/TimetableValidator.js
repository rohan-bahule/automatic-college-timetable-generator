const { _parse } = require('./algorithmUtils');

function verifyTimetable(solution) {
  const conflicts = [];
  if (!solution || solution.length === 0) return conflicts;

  // 1. Room conflicts (Overlapping slots)
  const roomTimeMap = {}; // key -> array of sc
  for (const sc of solution) {
    const [s, e] = _parse(sc.meetingTime.time);
    const key = `${sc.room.number}_${sc.meetingTime.day}_${s}_${e}`;
    if (!roomTimeMap[key]) roomTimeMap[key] = [];
    roomTimeMap[key].push(sc);
  }
  for (const key of Object.keys(roomTimeMap)) {
    const slots = roomTimeMap[key];
    if (slots.length > 1) {
      const room = slots[0].room.number;
      const day = slots[0].meetingTime.day;
      const details = slots.map(sc => 
        `${sc.division ? sc.division.name : (sc.batch ? sc.batch.name : '')} ${sc.course.code}`
      );
      conflicts.push(`Room ${room} conflict on ${day}: ${details.join(', ')}`);
    }
  }

  // 2. Teacher time conflicts (Overlapping time bands math evaluation max < min)
  const teacherTimeMap = {};
  for (const sc of solution) {
    const [s, e] = _parse(sc.meetingTime.time);
    const key = `${sc.instructor.uid}_${sc.meetingTime.day}`;
    if (!teacherTimeMap[key]) teacherTimeMap[key] = [];
    teacherTimeMap[key].push({ s, e, sc });
  }
  for (const key of Object.keys(teacherTimeMap)) {
    const slots = teacherTimeMap[key];
    for (let i = 0; i < slots.length; i++) {
      for (let j = i + 1; j < slots.length; j++) {
        const { s: s1, e: e1, sc: sc1 } = slots[i];
        const { s: s2, e: e2, sc: sc2 } = slots[j];
        if (Math.max(s1, s2) < Math.min(e1, e2)) {
          conflicts.push(`Teacher ${sc1.instructor.uid} conflict on ${sc1.meetingTime.day}: ${sc1.course.code} vs ${sc2.course.code}`);
        }
      }
    }
  }

  // 3. Lecture teacher consistency (div_id, course_code)
  const divSubjectTeachers = {};
  for (const sc of solution) {
    if (sc.course.courseType === 'LECTURE' && sc.division) {
      const key = `${sc.division.id}_${sc.course.code}`;
      if (!divSubjectTeachers[key]) divSubjectTeachers[key] = new Set();
      divSubjectTeachers[key].add(sc.instructor.uid);
    }
  }
  for (const key of Object.keys(divSubjectTeachers)) {
    if (divSubjectTeachers[key].size > 1) {
      conflicts.push(`Multiple teachers mapped for division/course ${key}: ${Array.from(divSubjectTeachers[key])}`);
    }
  }

  // 4. Lab teacher consistency (batch_id, course_code)
  const batchSubjectTeachers = {};
  for (const sc of solution) {
    if (sc.course.courseType === 'LAB' && sc.batch) {
      const key = `${sc.batch.id}_${sc.course.code}`;
      if (!batchSubjectTeachers[key]) batchSubjectTeachers[key] = new Set();
      batchSubjectTeachers[key].add(sc.instructor.uid);
    }
  }
  for (const key of Object.keys(batchSubjectTeachers)) {
    if (batchSubjectTeachers[key].size > 1) {
      conflicts.push(`Multiple teachers for batch/course ${key}`);
    }
  }

  // 5. Room consistency (Lab same batch+course -> same room)
  const batchSubjectRooms = {};
  for (const sc of solution) {
    if (sc.course.courseType === 'LAB' && sc.batch) {
      const key = `${sc.batch.id}_${sc.course.code}`;
      if (!batchSubjectRooms[key]) batchSubjectRooms[key] = new Set();
      batchSubjectRooms[key].add(sc.room.number);
    }
  }
  for (const key of Object.keys(batchSubjectRooms)) {
    if (batchSubjectRooms[key].size > 1) {
      conflicts.push(`Batch ${key} uses multiple rooms: ${Array.from(batchSubjectRooms[key])}`);
    }
  }

  // 6. Teacher double-booking (exact identical slot string bindings)
  const teacherExactTime = new Set();
  for (const sc of solution) {
    const [s, e] = _parse(sc.meetingTime.time);
    const tKey = `${sc.instructor.uid}_${sc.meetingTime.day}_${s}_${e}`;
    if (teacherExactTime.has(tKey)) {
      conflicts.push(`Teacher ${sc.instructor.uid} double-booked at ${sc.meetingTime.day} ${s}-${e}`);
    }
    teacherExactTime.add(tKey);
  }

  // 7. Elective same-group same-slot consistency
  const elecGroupSlots = {};
  for (const sc of solution) {
    if (sc.section.isElective && sc.section.electiveGroup) {
      const [s, e] = _parse(sc.meetingTime.time);
      const group = sc.section.electiveGroup;
      if (!elecGroupSlots[group]) elecGroupSlots[group] = [];
      elecGroupSlots[group].push({ day: sc.meetingTime.day, s, e, courseCode: sc.course.code });
    }
  }

  for (const group of Object.keys(elecGroupSlots)) {
    const slotList = elecGroupSlots[group];
    const byDay = {};
    for (const item of slotList) {
      if (!byDay[item.day]) byDay[item.day] = new Set();
      byDay[item.day].add(`${item.s}_${item.e}`);
    }
    for (const day of Object.keys(byDay)) {
      if (byDay[day].size > 1) {
        conflicts.push(`Elective group ${group} on ${day} has mismatched slots`);
      }
    }
  }

  return conflicts;
}

module.exports = { verifyTimetable };
