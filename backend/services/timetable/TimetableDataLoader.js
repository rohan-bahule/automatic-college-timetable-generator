const { Department, Division, Batch, Instructor, Room, Course, MeetingTime, Section } = require('../../models');
const { _get_slot_priority } = require('./algorithmUtils');

class TimetableDataLoader {
  constructor() {
    // Properties will be populated by load()
  }

  async load() {
    this.divisions = await Division.findAll({ order: [['name', 'ASC']] });
    this.rooms = await Room.findAll();
    this.meetingTimes = await MeetingTime.findAll();
    
    // Load explicitly defined association entities eagerly to mimic Django select_related
    this.sections = await Section.findAll({
      include: [
        { model: Course },
        { model: Division },
        { 
          model: Batch, 
          include: [{ model: Division }] 
        }
      ]
    });

    this.lectureRooms = this.rooms.filter(r => r.roomType === 'LECTURE');
    this.labRooms = this.rooms.filter(r => r.roomType === 'LAB');

    // Slot pools
    this.labSlotsByDay = {};
    this.lecSlotsByDay = {};
    this.elec2hByDay = {};
    this.elec1hByDay = {};

    for (const mt of this.meetingTimes) {
      const day = mt.day;
      if (!this.labSlotsByDay[day]) this.labSlotsByDay[day] = [];
      if (!this.lecSlotsByDay[day]) this.lecSlotsByDay[day] = [];
      if (!this.elec2hByDay[day]) this.elec2hByDay[day] = [];
      if (!this.elec1hByDay[day]) this.elec1hByDay[day] = [];

      if (mt.slotType === 'LAB') {
        this.labSlotsByDay[day].push(mt);
      } else {
        if (mt.pid.startsWith('E')) {
          this.elec2hByDay[day].push(mt);
        } else {
          this.lecSlotsByDay[day].push(mt);
          this.elec1hByDay[day].push(mt);
        }
      }
    }

    // Sort lab slots by actual defined priority logic identically to Source logic
    for (const day of Object.keys(this.labSlotsByDay)) {
      this.labSlotsByDay[day].sort((a, b) => 
        _get_slot_priority(a.time) - _get_slot_priority(b.time)
      );
    }

    // Identify mapping of eligible teachers per course exactly like Django's prefetch
    this.eligibleTeachers = {};
    const courses = await Course.findAll({ include: [{ model: Instructor }] });
    for (const course of courses) {
      this.eligibleTeachers[course.code] = course.Instructors || []; 
    }

    // Split sections into pools to route perfectly identically to Source execution path
    this.electiveSections = this.sections.filter(s => s.isElective);
    this.regularSections = this.sections.filter(s => !s.isElective);

    this.lectureSections = this.regularSections.filter(s => s.Course && s.Course.courseType === 'LECTURE');
    this.labSections = this.regularSections.filter(s => s.Course && s.Course.courseType === 'LAB');

    // Build frequencies DYNAMICALLY from database sections strictly per Source architecture
    this.lectureFrequency = {};
    for (const s of this.lectureSections) {
      const code = s.Course.code;
      this.lectureFrequency[code] = Math.max(this.lectureFrequency[code] || 0, s.numClassesPerWeek);
    }

    this.labFrequency = {};
    for (const s of this.labSections) {
      if (s.Batch && s.Batch.divisionId) {
        const code = s.Course.code;
        this.labFrequency[code] = Math.max(this.labFrequency[code] || 0, s.numClassesPerWeek);
      }
    }

    // Lab groups (Tuples logic via composed composite key string in JS due to implicit hash mappings failing by Object ref parity)
    this.divLabGroups = {};
    for (const s of this.labSections) {
      if (s.Batch && s.Batch.divisionId) {
        const key = `${s.Batch.divisionId}_${s.Course.code}`;
        if (!this.divLabGroups[key]) this.divLabGroups[key] = [];
        this.divLabGroups[key].push(s);
      }
    }

    // Mapping collections mimicking dictionaries
    this.batchesByDivision = {};
    const batches = await Batch.findAll({ include: [{ model: Division }] });
    for (const batch of batches) {
      if (!this.batchesByDivision[batch.divisionId]) this.batchesByDivision[batch.divisionId] = [];
      this.batchesByDivision[batch.divisionId].push(batch);
    }

    // Lookup caches mimicking dictionaries
    this.divByName = {};
    for (const d of this.divisions) {
      this.divByName[d.name] = d;
    }

    return this;
  }
}

module.exports = TimetableDataLoader;
