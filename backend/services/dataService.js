const { 
  Department, 
  Division, 
  Batch, 
  Instructor, 
  Course, 
  InstructorCourse, 
  Room, 
  MeetingTime, 
  Section, 
  TimetableEntry,
  sequelize 
} = require('../models');

// ==========================================
// 1. DEPARTMENTS
// ==========================================
async function getAllDepartments() {
  return await Department.findAll({ order: [['name', 'ASC']] });
}

async function getDepartmentById(id) {
  return await Department.findByPk(id);
}

async function createDepartment(data) {
  const name = data.name?.trim();
  if (!name) throw { status: 400, message: 'Department name is required.' };
  return await Department.create({ name });
}

async function updateDepartment(id, data) {
  const department = await Department.findByPk(id);
  if (!department) throw { status: 404, message: 'Department not found.' };

  const name = data.name?.trim();
  if (!name) throw { status: 400, message: 'Department name cannot be empty.' };

  department.name = name;
  await department.save();
  return department;
}

async function deleteDepartment(id) {
  const department = await Department.findByPk(id);
  if (!department) throw { status: 404, message: 'Department not found.' };

  const divCount = await Division.count({ where: { departmentId: id } });
  if (divCount > 0) {
    throw { status: 409, message: 'This department cannot be deleted because divisions reference it.' };
  }

  const secCount = await Section.count({ where: { departmentId: id } });
  if (secCount > 0) {
    throw { status: 409, message: 'This department cannot be deleted because sections reference it.' };
  }

  await department.destroy();
  return { success: true };
}

// ==========================================
// 2. DIVISIONS
// ==========================================
async function getAllDivisions() {
  return await Division.findAll({
    include: [{ model: Department, attributes: ['id', 'name'] }],
    order: [['name', 'ASC']]
  });
}

async function getDivisionById(id) {
  return await Division.findByPk(id, {
    include: [{ model: Department, attributes: ['id', 'name'] }]
  });
}

async function createDivision(data) {
  const name = data.name?.trim();
  if (!name) throw { status: 400, message: 'Division name is required.' };

  const deptId = parseInt(data.departmentId, 10);
  if (!deptId || isNaN(deptId)) throw { status: 400, message: 'Valid department is required.' };

  const department = await Department.findByPk(deptId);
  if (!department) throw { status: 400, message: 'Referenced department does not exist.' };

  const totalStudents = parseInt(data.totalStudents, 10) || 0;
  if (totalStudents < 0) throw { status: 400, message: 'Total students must be non-negative.' };

  return await Division.create({
    name,
    totalStudents,
    departmentId: deptId
  });
}

async function updateDivision(id, data) {
  const division = await Division.findByPk(id);
  if (!division) throw { status: 404, message: 'Division not found.' };

  if (data.name !== undefined) {
    const name = data.name?.trim();
    if (!name) throw { status: 400, message: 'Division name cannot be empty.' };
    division.name = name;
  }

  if (data.departmentId !== undefined) {
    const deptId = parseInt(data.departmentId, 10);
    const department = await Department.findByPk(deptId);
    if (!department) throw { status: 400, message: 'Referenced department does not exist.' };
    division.departmentId = deptId;
  }

  if (data.totalStudents !== undefined) {
    const totalStudents = parseInt(data.totalStudents, 10);
    if (isNaN(totalStudents) || totalStudents < 0) throw { status: 400, message: 'Total students must be non-negative.' };
    division.totalStudents = totalStudents;
  }

  await division.save();
  return await getDivisionById(id);
}

async function deleteDivision(id) {
  const division = await Division.findByPk(id);
  if (!division) throw { status: 404, message: 'Division not found.' };

  const batchCount = await Batch.count({ where: { divisionId: id } });
  if (batchCount > 0) {
    throw { status: 409, message: 'This division cannot be deleted because practical batches reference it.' };
  }

  const secCount = await Section.count({ where: { divisionId: id } });
  if (secCount > 0) {
    throw { status: 409, message: 'This division cannot be deleted because academic sections reference it.' };
  }

  const ttCount = await TimetableEntry.count({ where: { divisionId: id } });
  if (ttCount > 0) {
    throw { status: 409, message: 'This division cannot be deleted because generated timetable entries reference it.' };
  }

  await division.destroy();
  return { success: true };
}

// ==========================================
// 3. BATCHES
// ==========================================
async function getAllBatches() {
  return await Batch.findAll({
    include: [{ model: Division, attributes: ['id', 'name'] }],
    order: [['name', 'ASC']]
  });
}

async function getBatchById(id) {
  return await Batch.findByPk(id, {
    include: [{ model: Division, attributes: ['id', 'name'] }]
  });
}

async function createBatch(data) {
  const name = data.name?.trim();
  if (!name) throw { status: 400, message: 'Batch name is required.' };

  const divisionId = parseInt(data.divisionId, 10);
  if (!divisionId || isNaN(divisionId)) throw { status: 400, message: 'Valid division is required.' };

  const division = await Division.findByPk(divisionId);
  if (!division) throw { status: 400, message: 'Referenced division does not exist.' };

  const studentCount = parseInt(data.studentCount, 10) || 0;
  if (studentCount < 0) throw { status: 400, message: 'Student count must be non-negative.' };

  return await Batch.create({
    name,
    studentCount,
    divisionId
  });
}

async function updateBatch(id, data) {
  const batch = await Batch.findByPk(id);
  if (!batch) throw { status: 404, message: 'Batch not found.' };

  if (data.name !== undefined) {
    const name = data.name?.trim();
    if (!name) throw { status: 400, message: 'Batch name cannot be empty.' };
    batch.name = name;
  }

  if (data.divisionId !== undefined) {
    const divisionId = parseInt(data.divisionId, 10);
    const division = await Division.findByPk(divisionId);
    if (!division) throw { status: 400, message: 'Referenced division does not exist.' };
    batch.divisionId = divisionId;
  }

  if (data.studentCount !== undefined) {
    const studentCount = parseInt(data.studentCount, 10);
    if (isNaN(studentCount) || studentCount < 0) throw { status: 400, message: 'Student count must be non-negative.' };
    batch.studentCount = studentCount;
  }

  await batch.save();
  return await getBatchById(id);
}

async function deleteBatch(id) {
  const batch = await Batch.findByPk(id);
  if (!batch) throw { status: 404, message: 'Batch not found.' };

  const secCount = await Section.count({ where: { batchId: id } });
  if (secCount > 0) {
    throw { status: 409, message: 'This batch cannot be deleted because sections reference it.' };
  }

  const ttCount = await TimetableEntry.count({ where: { batchId: id } });
  if (ttCount > 0) {
    throw { status: 409, message: 'This batch cannot be deleted because generated timetable entries reference it.' };
  }

  await batch.destroy();
  return { success: true };
}

// ==========================================
// 4. INSTRUCTORS
// ==========================================
async function getAllInstructors() {
  return await Instructor.findAll({
    include: [{ model: Course, attributes: ['id', 'code', 'name', 'courseType'] }],
    order: [['name', 'ASC']]
  });
}

async function getInstructorById(id) {
  return await Instructor.findByPk(id, {
    include: [{ model: Course, attributes: ['id', 'code', 'name', 'courseType'] }]
  });
}

async function createInstructor(data) {
  const uid = data.uid?.trim();
  const name = data.name?.trim();
  if (!uid) throw { status: 400, message: 'Instructor UID is required.' };
  if (!name) throw { status: 400, message: 'Instructor name is required.' };

  const existing = await Instructor.findOne({ where: { uid } });
  if (existing) throw { status: 400, message: `Instructor UID '${uid}' is already in use.` };

  let maxBatches = 4;
  if (data.maxBatchesPerWeek !== undefined) {
    const parsed = parseInt(data.maxBatchesPerWeek, 10);
    if (isNaN(parsed) || parsed < 0) throw { status: 400, message: 'Max batches per week must be non-negative.' };
    maxBatches = parsed;
  }

  let maxLectures = 3;
  if (data.maxLectureDivisions !== undefined) {
    const parsed = parseInt(data.maxLectureDivisions, 10);
    if (isNaN(parsed) || parsed < 0) throw { status: 400, message: 'Max lecture divisions must be non-negative.' };
    maxLectures = parsed;
  }

  const instructor = await Instructor.create({
    uid,
    name,
    maxBatchesPerWeek: maxBatches,
    maxLectureDivisions: maxLectures
  });

  // Optional initial course IDs
  if (Array.isArray(data.courseIds) && data.courseIds.length > 0) {
    await instructor.addCourses(data.courseIds);
  }

  return await getInstructorById(instructor.id);
}

async function updateInstructor(id, data) {
  const instructor = await Instructor.findByPk(id);
  if (!instructor) throw { status: 404, message: 'Instructor not found.' };

  if (data.name !== undefined) {
    const name = data.name?.trim();
    if (!name) throw { status: 400, message: 'Instructor name cannot be empty.' };
    instructor.name = name;
  }

  if (data.uid !== undefined) {
    const uid = data.uid?.trim();
    if (!uid) throw { status: 400, message: 'Instructor UID cannot be empty.' };
    if (uid !== instructor.uid) {
      const existing = await Instructor.findOne({ where: { uid } });
      if (existing) throw { status: 400, message: `Instructor UID '${uid}' is already in use.` };
      instructor.uid = uid;
    }
  }

  if (data.maxBatchesPerWeek !== undefined) {
    const val = parseInt(data.maxBatchesPerWeek, 10);
    if (isNaN(val) || val < 0) throw { status: 400, message: 'Max batches per week must be non-negative.' };
    instructor.maxBatchesPerWeek = val;
  }

  if (data.maxLectureDivisions !== undefined) {
    const val = parseInt(data.maxLectureDivisions, 10);
    if (isNaN(val) || val < 0) throw { status: 400, message: 'Max lecture divisions must be non-negative.' };
    instructor.maxLectureDivisions = val;
  }

  await instructor.save();
  return await getInstructorById(id);
}

async function deleteInstructor(id) {
  const instructor = await Instructor.findByPk(id);
  if (!instructor) throw { status: 404, message: 'Instructor not found.' };

  const secCount = await Section.count({ where: { instructorId: id } });
  if (secCount > 0) {
    throw { status: 409, message: 'This instructor cannot be deleted because sections reference them.' };
  }

  const ttCount = await TimetableEntry.count({ where: { instructorId: id } });
  if (ttCount > 0) {
    throw { status: 409, message: 'This instructor cannot be deleted because generated timetable entries reference them.' };
  }

  // Remove junction table records
  await InstructorCourse.destroy({ where: { instructorId: id } });
  await instructor.destroy();
  return { success: true };
}

// Instructor-Course Eligibility management
async function addInstructorCourse(instructorId, courseId) {
  const instructor = await Instructor.findByPk(instructorId);
  if (!instructor) throw { status: 404, message: 'Instructor not found.' };

  const course = await Course.findByPk(courseId);
  if (!course) throw { status: 404, message: 'Course not found.' };

  const existing = await InstructorCourse.findOne({
    where: { instructorId, courseId }
  });
  if (existing) {
    throw { status: 400, message: 'This instructor is already eligible for this course.' };
  }

  await instructor.addCourse(courseId);
  return await getInstructorById(instructorId);
}

async function removeInstructorCourse(instructorId, courseId) {
  const instructor = await Instructor.findByPk(instructorId);
  if (!instructor) throw { status: 404, message: 'Instructor not found.' };

  await instructor.removeCourse(courseId);
  return await getInstructorById(instructorId);
}

// ==========================================
// 5. ROOMS
// ==========================================
async function getAllRooms() {
  return await Room.findAll({ order: [['number', 'ASC']] });
}

async function getRoomById(id) {
  return await Room.findByPk(id);
}

async function createRoom(data) {
  const number = (data.number || data.roomNumber)?.trim();
  if (!number) throw { status: 400, message: 'Room number is required.' };

  const seatingCapacity = parseInt(data.seatingCapacity !== undefined ? data.seatingCapacity : data.capacity, 10);
  if (isNaN(seatingCapacity) || seatingCapacity <= 0) {
    throw { status: 400, message: 'Seating capacity must be a positive integer.' };
  }

  const roomType = data.roomType?.toUpperCase();
  if (roomType !== 'LECTURE' && roomType !== 'LAB') {
    throw { status: 400, message: "Room type must be either 'LECTURE' or 'LAB'." };
  }

  return await Room.create({
    number,
    seatingCapacity,
    roomType
  });
}

async function updateRoom(id, data) {
  const room = await Room.findByPk(id);
  if (!room) throw { status: 404, message: 'Room not found.' };

  const numInput = data.number !== undefined ? data.number : data.roomNumber;
  if (numInput !== undefined) {
    const number = numInput?.trim();
    if (!number) throw { status: 400, message: 'Room number cannot be empty.' };
    room.number = number;
  }

  const capInput = data.seatingCapacity !== undefined ? data.seatingCapacity : data.capacity;
  if (capInput !== undefined) {
    const seatingCapacity = parseInt(capInput, 10);
    if (isNaN(seatingCapacity) || seatingCapacity <= 0) {
      throw { status: 400, message: 'Seating capacity must be a positive integer.' };
    }
    room.seatingCapacity = seatingCapacity;
  }

  if (data.roomType !== undefined) {
    const roomType = data.roomType?.toUpperCase();
    if (roomType !== 'LECTURE' && roomType !== 'LAB') {
      throw { status: 400, message: "Room type must be either 'LECTURE' or 'LAB'." };
    }
    room.roomType = roomType;
  }

  await room.save();
  return room;
}

async function deleteRoom(id) {
  const room = await Room.findByPk(id);
  if (!room) throw { status: 404, message: 'Room not found.' };

  const secCount = await Section.count({ where: { roomId: id } });
  if (secCount > 0) {
    throw { status: 409, message: 'This room cannot be deleted because sections reference it.' };
  }

  const ttCount = await TimetableEntry.count({ where: { roomId: id } });
  if (ttCount > 0) {
    throw { status: 409, message: 'This room cannot be deleted because generated timetable entries reference it.' };
  }

  await room.destroy();
  return { success: true };
}

// ==========================================
// 6. COURSES
// ==========================================
async function getAllCourses() {
  return await Course.findAll({
    include: [{ model: Instructor, attributes: ['id', 'name', 'uid'] }],
    order: [['code', 'ASC']]
  });
}

async function getCourseById(id) {
  return await Course.findByPk(id, {
    include: [{ model: Instructor, attributes: ['id', 'name', 'uid'] }]
  });
}

async function createCourse(data) {
  const code = data.code?.trim();
  const name = data.name?.trim();
  if (!code) throw { status: 400, message: 'Course code is required.' };
  if (!name) throw { status: 400, message: 'Course name is required.' };

  let maxStudents = parseInt(data.maxStudents, 10);
  if (isNaN(maxStudents) || maxStudents <= 0) {
    maxStudents = 60;
  }

  const courseType = data.courseType?.toUpperCase();
  if (courseType !== 'LECTURE' && courseType !== 'LAB') {
    throw { status: 400, message: "Course type must be either 'LECTURE' or 'LAB'." };
  }

  const isElective = Boolean(data.isElective);

  const course = await Course.create({
    code,
    name,
    maxStudents,
    courseType,
    isElective
  });

  if (Array.isArray(data.instructorIds) && data.instructorIds.length > 0) {
    await course.addInstructors(data.instructorIds);
  }

  return await getCourseById(course.id);
}

async function updateCourse(id, data) {
  const course = await Course.findByPk(id);
  if (!course) throw { status: 404, message: 'Course not found.' };

  if (data.code !== undefined) {
    const code = data.code?.trim();
    if (!code) throw { status: 400, message: 'Course code cannot be empty.' };
    course.code = code;
  }

  if (data.name !== undefined) {
    const name = data.name?.trim();
    if (!name) throw { status: 400, message: 'Course name cannot be empty.' };
    course.name = name;
  }

  if (data.maxStudents !== undefined) {
    const maxStudents = parseInt(data.maxStudents, 10);
    if (isNaN(maxStudents) || maxStudents <= 0) {
      throw { status: 400, message: 'Max students must be a positive integer.' };
    }
    course.maxStudents = maxStudents;
  }

  if (data.courseType !== undefined) {
    const courseType = data.courseType?.toUpperCase();
    if (courseType !== 'LECTURE' && courseType !== 'LAB') {
      throw { status: 400, message: "Course type must be either 'LECTURE' or 'LAB'." };
    }
    course.courseType = courseType;
  }

  if (data.isElective !== undefined) {
    course.isElective = Boolean(data.isElective);
  }

  if (Array.isArray(data.instructorIds)) {
    await course.setInstructors(data.instructorIds);
  }

  await course.save();
  return await getCourseById(id);
}

async function deleteCourse(id) {
  const course = await Course.findByPk(id);
  if (!course) throw { status: 404, message: 'Course not found.' };

  const secCount = await Section.count({ where: { courseId: id } });
  if (secCount > 0) {
    throw { status: 409, message: 'This course cannot be deleted because sections reference it.' };
  }

  const ttCount = await TimetableEntry.count({ where: { courseId: id } });
  if (ttCount > 0) {
    throw { status: 409, message: 'This course cannot be deleted because generated timetable entries reference it.' };
  }

  await InstructorCourse.destroy({ where: { courseId: id } });
  await course.destroy();
  return { success: true };
}

async function addCourseInstructor(courseId, instructorId) {
  const course = await Course.findByPk(courseId);
  if (!course) throw { status: 404, message: 'Course not found.' };

  const instructor = await Instructor.findByPk(instructorId);
  if (!instructor) throw { status: 404, message: 'Instructor not found.' };

  const existing = await InstructorCourse.findOne({
    where: { courseId, instructorId }
  });
  if (existing) {
    throw { status: 400, message: 'This instructor is already eligible for this course.' };
  }

  await course.addInstructor(instructorId);
  return await getCourseById(courseId);
}

async function removeCourseInstructor(courseId, instructorId) {
  const course = await Course.findByPk(courseId);
  if (!course) throw { status: 404, message: 'Course not found.' };

  await course.removeInstructor(instructorId);
  return await getCourseById(courseId);
}

// ==========================================
// 7. MEETING TIMES
// ==========================================
const VALID_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

async function getAllMeetingTimes() {
  return await MeetingTime.findAll({ order: [['day', 'ASC'], ['time', 'ASC']] });
}

async function getMeetingTimeById(id) {
  return await MeetingTime.findByPk(id);
}

async function createMeetingTime(data) {
  const day = (data.day || data.dayOfWeek)?.trim();
  if (!day || !VALID_DAYS.includes(day)) {
    throw { status: 400, message: `Day must be one of: ${VALID_DAYS.join(', ')}.` };
  }

  const time = (data.time || data.timeRange)?.trim();
  if (!time || !time.includes('-')) {
    throw { status: 400, message: "Time range must be formatted as 'HH:MM-HH:MM' (e.g. '08:45-09:45')." };
  }

  let slotType = (data.slotType || 'LECTURE').toUpperCase();
  if (slotType !== 'LECTURE' && slotType !== 'LAB') {
    slotType = 'LECTURE';
  }

  let pid = data.pid?.trim();
  if (!pid) {
    // Auto-generate PID if not supplied (e.g. L999, B999)
    const prefix = slotType === 'LAB' ? 'B' : 'L';
    const count = await MeetingTime.count();
    pid = `${prefix}${String(count + 1).padStart(3, '0')}`;
  }

  return await MeetingTime.create({
    pid,
    day,
    time,
    slotType
  });
}

async function updateMeetingTime(id, data) {
  const mt = await MeetingTime.findByPk(id);
  if (!mt) throw { status: 404, message: 'Meeting time not found.' };

  const dayInput = data.day !== undefined ? data.day : data.dayOfWeek;
  if (dayInput !== undefined) {
    const day = dayInput?.trim();
    if (!day || !VALID_DAYS.includes(day)) {
      throw { status: 400, message: `Day must be one of: ${VALID_DAYS.join(', ')}.` };
    }
    mt.day = day;
  }

  const timeInput = data.time !== undefined ? data.time : data.timeRange;
  if (timeInput !== undefined) {
    const time = timeInput?.trim();
    if (!time || !time.includes('-')) {
      throw { status: 400, message: "Time range must be formatted as 'HH:MM-HH:MM'." };
    }
    mt.time = time;
  }

  if (data.slotType !== undefined) {
    let slotType = data.slotType?.toUpperCase();
    if (slotType !== 'LECTURE' && slotType !== 'LAB') {
      slotType = 'LECTURE';
    }
    mt.slotType = slotType;
  }

  if (data.pid !== undefined) {
    const pid = data.pid?.trim();
    if (pid) mt.pid = pid;
  }

  await mt.save();
  return mt;
}

async function deleteMeetingTime(id) {
  const mt = await MeetingTime.findByPk(id);
  if (!mt) throw { status: 404, message: 'Meeting time not found.' };

  const secCount = await Section.count({ where: { meetingTimeId: id } });
  if (secCount > 0) {
    throw { status: 409, message: 'This meeting time cannot be deleted because sections reference it.' };
  }

  const ttCount = await TimetableEntry.count({ where: { meetingTimeId: id } });
  if (ttCount > 0) {
    throw { status: 409, message: 'This meeting time cannot be deleted because generated timetable entries reference it.' };
  }

  await mt.destroy();
  return { success: true };
}

// ==========================================
// 8. SECTIONS
// ==========================================
async function getAllSections() {
  return await Section.findAll({
    include: [
      { model: Department, attributes: ['id', 'name'] },
      { model: Division, attributes: ['id', 'name'] },
      { model: Batch, attributes: ['id', 'name'] },
      { model: Course, attributes: ['id', 'code', 'name', 'courseType'] },
      { model: Instructor, attributes: ['id', 'name'] },
      { model: Room, attributes: ['id', 'number'] },
      { model: MeetingTime, attributes: ['id', 'day', 'time'] }
    ],
    order: [['sectionId', 'ASC']]
  });
}

async function getSectionById(id) {
  return await Section.findByPk(id, {
    include: [
      { model: Department, attributes: ['id', 'name'] },
      { model: Division, attributes: ['id', 'name'] },
      { model: Batch, attributes: ['id', 'name'] },
      { model: Course, attributes: ['id', 'code', 'name', 'courseType'] },
      { model: Instructor, attributes: ['id', 'name'] },
      { model: Room, attributes: ['id', 'number'] },
      { model: MeetingTime, attributes: ['id', 'day', 'time'] }
    ]
  });
}

async function createSection(data) {
  const numClassesPerWeek = parseInt(data.numClassesPerWeek !== undefined ? data.numClassesPerWeek : data.sessionsPerWeek, 10);
  if (isNaN(numClassesPerWeek) || numClassesPerWeek <= 0) {
    throw { status: 400, message: 'Number of classes per week must be a positive integer.' };
  }

  const divisionId = parseInt(data.divisionId, 10);
  const courseId = parseInt(data.courseId, 10);

  if (!divisionId || !courseId) {
    throw { status: 400, message: 'Division and Course are required.' };
  }

  const [div, course] = await Promise.all([
    Division.findByPk(divisionId),
    Course.findByPk(courseId)
  ]);

  if (!div) throw { status: 400, message: 'Referenced division does not exist.' };
  if (!course) throw { status: 400, message: 'Referenced course does not exist.' };

  // Infer departmentId from division if not explicitly provided
  let departmentId = data.departmentId ? parseInt(data.departmentId, 10) : div.departmentId;
  const dept = await Department.findByPk(departmentId);
  if (!dept) throw { status: 400, message: 'Referenced department does not exist.' };

  let sectionId = data.sectionId?.trim();
  if (!sectionId) {
    // Auto-generate human-friendly section ID e.g. SEC-AI-TE1-B1
    const batchSuffix = data.batchId ? `-B${data.batchId}` : '';
    sectionId = `${course.code}-${div.name}${batchSuffix}`;
  }

  let batchId = data.batchId ? parseInt(data.batchId, 10) : null;
  if (batchId) {
    const batch = await Batch.findByPk(batchId);
    if (!batch) throw { status: 400, message: 'Referenced batch does not exist.' };
    if (batch.divisionId !== divisionId) {
      throw { status: 400, message: 'Referenced batch does not belong to the selected division.' };
    }
  }

  const isElective = Boolean(data.isElective);
  const electiveGroup = data.electiveGroup?.trim() || null;

  const section = await Section.create({
    sectionId,
    numClassesPerWeek,
    isElective,
    electiveGroup,
    departmentId,
    divisionId,
    batchId,
    courseId,
    instructorId: data.instructorId ? parseInt(data.instructorId, 10) : null,
    roomId: data.roomId ? parseInt(data.roomId, 10) : null,
    meetingTimeId: data.meetingTimeId ? parseInt(data.meetingTimeId, 10) : null
  });

  return await getSectionById(section.id);
}

async function updateSection(id, data) {
  const section = await Section.findByPk(id);
  if (!section) throw { status: 404, message: 'Section not found.' };

  if (data.sectionId !== undefined) {
    const sectionId = data.sectionId?.trim();
    if (!sectionId) throw { status: 400, message: 'Section ID cannot be empty.' };
    section.sectionId = sectionId;
  }

  const numInput = data.numClassesPerWeek !== undefined ? data.numClassesPerWeek : data.sessionsPerWeek;
  if (numInput !== undefined) {
    const num = parseInt(numInput, 10);
    if (isNaN(num) || num <= 0) throw { status: 400, message: 'Number of classes per week must be positive.' };
    section.numClassesPerWeek = num;
  }

  if (data.isElective !== undefined) {
    section.isElective = Boolean(data.isElective);
  }

  if (data.electiveGroup !== undefined) {
    section.electiveGroup = data.electiveGroup?.trim() || null;
  }

  if (data.departmentId !== undefined) {
    const deptId = parseInt(data.departmentId, 10);
    const dept = await Department.findByPk(deptId);
    if (!dept) throw { status: 400, message: 'Referenced department does not exist.' };
    section.departmentId = deptId;
  }

  if (data.divisionId !== undefined) {
    const divId = parseInt(data.divisionId, 10);
    const div = await Division.findByPk(divId);
    if (!div) throw { status: 400, message: 'Referenced division does not exist.' };
    section.divisionId = divId;
  }

  if (data.courseId !== undefined) {
    const courseId = parseInt(data.courseId, 10);
    const course = await Course.findByPk(courseId);
    if (!course) throw { status: 400, message: 'Referenced course does not exist.' };
    section.courseId = courseId;
  }

  if (data.batchId !== undefined) {
    const batchId = data.batchId ? parseInt(data.batchId, 10) : null;
    if (batchId) {
      const batch = await Batch.findByPk(batchId);
      if (!batch) throw { status: 400, message: 'Referenced batch does not exist.' };
      section.batchId = batchId;
    } else {
      section.batchId = null;
    }
  }

  await section.save();
  return await getSectionById(id);
}

async function deleteSection(id) {
  const section = await Section.findByPk(id);
  if (!section) throw { status: 404, message: 'Section not found.' };

  const ttCount = await TimetableEntry.count({ where: { sectionId: id } });
  if (ttCount > 0) {
    throw { status: 409, message: 'This section cannot be deleted because generated timetable entries reference it.' };
  }

  await section.destroy();
  return { success: true };
}

module.exports = {
  getAllDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment,

  getAllDivisions,
  getDivisionById,
  createDivision,
  updateDivision,
  deleteDivision,

  getAllBatches,
  getBatchById,
  createBatch,
  updateBatch,
  deleteBatch,

  getAllInstructors,
  getInstructorById,
  createInstructor,
  updateInstructor,
  deleteInstructor,
  addInstructorCourse,
  removeInstructorCourse,

  getAllRooms,
  getRoomById,
  createRoom,
  updateRoom,
  deleteRoom,

  getAllCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  addCourseInstructor,
  removeCourseInstructor,

  getAllMeetingTimes,
  getMeetingTimeById,
  createMeetingTime,
  updateMeetingTime,
  deleteMeetingTime,

  getAllSections,
  getSectionById,
  createSection,
  updateSection,
  deleteSection
};
