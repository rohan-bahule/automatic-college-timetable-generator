const { _parse } = require('./algorithmUtils');

class SchedulingState {
  constructor() {
    this.reset();
  }

  reset() {
    this.result = []; // Stores ScheduledClass (SC) outputs

    // Busy Trackers Mapping (Key -> Array of {day, s, e})
    this.roomBusy = {}; // room_number -> []
    this.teacherBusy = {}; // teacher_uid -> []
    this.divBusy = {}; // div_id -> []
    this.batchBusy = {}; // batch_id -> []

    // Consistency Locks (Composite key strings in JS)
    this.divLecTeacher = {}; // 'divId_courseCode' -> Instructor object
    this.batchLabTeacher = {}; // 'batchId_courseCode' -> Instructor object
    this.batchLabRoom = {}; // 'batchId_courseCode' -> Room object

    // Activity Trackers
    this.divDayLabs = {}; // 'divId_day' -> [time_str]
    this.batchLabCount = {}; // 'batchId_courseCode' -> int (count)
    this.teacherBatchCount = {}; // teacher_uid -> int (count)
    this.teacherLectureLoad = {}; // teacher_uid -> int (count)
  }

  // Busy Evaluation Helpers (Ported from python _is_busy)
  _isBusy(busyList, day, startMin, endMin) {
    if (!busyList) return false;
    for (const busy of busyList) {
      if (busy.day === day && Math.max(startMin, busy.s) < Math.min(endMin, busy.e)) {
        return true;
      }
    }
    return false;
  }

  _markBusy(busyDict, key, day, startMin, endMin) {
    if (!busyDict[key]) busyDict[key] = [];
    busyDict[key].push({ day, s: startMin, e: endMin });
  }

  roomFree(mt, roomNumber) {
    const [s, e] = _parse(mt.time);
    return !this._isBusy(this.roomBusy[roomNumber], mt.day, s, e);
  }

  teacherFree(mt, teacherUid) {
    const [s, e] = _parse(mt.time);
    return !this._isBusy(this.teacherBusy[teacherUid], mt.day, s, e);
  }

  divFree(mt, divId) {
    const [s, e] = _parse(mt.time);
    return !this._isBusy(this.divBusy[divId], mt.day, s, e);
  }

  batchFree(mt, batchId) {
    const [s, e] = _parse(mt.time);
    return !this._isBusy(this.batchBusy[batchId], mt.day, s, e);
  }

  mark(mt, roomNumber, teacherUid, divId = null, batchId = null) {
    const [s, e] = _parse(mt.time);
    const day = mt.day;
    
    this._markBusy(this.roomBusy, roomNumber, day, s, e);
    this._markBusy(this.teacherBusy, teacherUid, day, s, e);
    
    if (divId) {
      this._markBusy(this.divBusy, divId, day, s, e);
    }
    if (batchId) {
      this._markBusy(this.batchBusy, batchId, day, s, e);
    }
  }

  markDivOnly(mt, divId) {
    // Specifically used in Phase 0 (Electives) to block divisions universally
    const [s, e] = _parse(mt.time);
    this._markBusy(this.divBusy, divId, mt.day, s, e);
  }

  // Composite key formatters mimicking Python Tuples behavior safely
  getCompositeKey(id1, id2) {
    return `${id1}_${id2}`;
  }
}

module.exports = SchedulingState;
