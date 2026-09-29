const dataService = require('../services/dataService');

const handleResponse = async (res, asyncFn, successStatus = 200) => {
  try {
    const data = await asyncFn();
    res.status(successStatus).json({ success: true, data });
  } catch (err) {
    const status = err.status || 500;
    const message = err.message || 'Internal server error';
    res.status(status).json({ success: false, message });
  }
};

// ==========================================
// DEPARTMENTS
// ==========================================
exports.getDepartments = (req, res) => handleResponse(res, () => dataService.getAllDepartments());
exports.getDepartment = (req, res) => handleResponse(res, () => dataService.getDepartmentById(req.params.id));
exports.createDepartment = (req, res) => handleResponse(res, () => dataService.createDepartment(req.body), 201);
exports.updateDepartment = (req, res) => handleResponse(res, () => dataService.updateDepartment(req.params.id, req.body));
exports.deleteDepartment = (req, res) => handleResponse(res, () => dataService.deleteDepartment(req.params.id));

// ==========================================
// DIVISIONS
// ==========================================
exports.getDivisions = (req, res) => handleResponse(res, () => dataService.getAllDivisions());
exports.getDivision = (req, res) => handleResponse(res, () => dataService.getDivisionById(req.params.id));
exports.createDivision = (req, res) => handleResponse(res, () => dataService.createDivision(req.body), 201);
exports.updateDivision = (req, res) => handleResponse(res, () => dataService.updateDivision(req.params.id, req.body));
exports.deleteDivision = (req, res) => handleResponse(res, () => dataService.deleteDivision(req.params.id));

// ==========================================
// BATCHES
// ==========================================
exports.getBatches = (req, res) => handleResponse(res, () => dataService.getAllBatches());
exports.getBatch = (req, res) => handleResponse(res, () => dataService.getBatchById(req.params.id));
exports.createBatch = (req, res) => handleResponse(res, () => dataService.createBatch(req.body), 201);
exports.updateBatch = (req, res) => handleResponse(res, () => dataService.updateBatch(req.params.id, req.body));
exports.deleteBatch = (req, res) => handleResponse(res, () => dataService.deleteBatch(req.params.id));

// ==========================================
// INSTRUCTORS
// ==========================================
exports.getInstructors = (req, res) => handleResponse(res, () => dataService.getAllInstructors());
exports.getInstructor = (req, res) => handleResponse(res, () => dataService.getInstructorById(req.params.id));
exports.createInstructor = (req, res) => handleResponse(res, () => dataService.createInstructor(req.body), 201);
exports.updateInstructor = (req, res) => handleResponse(res, () => dataService.updateInstructor(req.params.id, req.body));
exports.deleteInstructor = (req, res) => handleResponse(res, () => dataService.deleteInstructor(req.params.id));
exports.addInstructorCourse = (req, res) => handleResponse(res, () => dataService.addInstructorCourse(req.params.id, req.body.courseId), 201);
exports.removeInstructorCourse = (req, res) => handleResponse(res, () => dataService.removeInstructorCourse(req.params.id, req.params.courseId));

// ==========================================
// ROOMS
// ==========================================
exports.getRooms = (req, res) => handleResponse(res, () => dataService.getAllRooms());
exports.getRoom = (req, res) => handleResponse(res, () => dataService.getRoomById(req.params.id));
exports.createRoom = (req, res) => handleResponse(res, () => dataService.createRoom(req.body), 201);
exports.updateRoom = (req, res) => handleResponse(res, () => dataService.updateRoom(req.params.id, req.body));
exports.deleteRoom = (req, res) => handleResponse(res, () => dataService.deleteRoom(req.params.id));

// ==========================================
// COURSES
// ==========================================
exports.getCourses = (req, res) => handleResponse(res, () => dataService.getAllCourses());
exports.getCourse = (req, res) => handleResponse(res, () => dataService.getCourseById(req.params.id));
exports.createCourse = (req, res) => handleResponse(res, () => dataService.createCourse(req.body), 201);
exports.updateCourse = (req, res) => handleResponse(res, () => dataService.updateCourse(req.params.id, req.body));
exports.deleteCourse = (req, res) => handleResponse(res, () => dataService.deleteCourse(req.params.id));
exports.addCourseInstructor = (req, res) => handleResponse(res, () => dataService.addCourseInstructor(req.params.id, req.body.instructorId), 201);
exports.removeCourseInstructor = (req, res) => handleResponse(res, () => dataService.removeCourseInstructor(req.params.id, req.params.instructorId));

// ==========================================
// MEETING TIMES
// ==========================================
exports.getMeetingTimes = (req, res) => handleResponse(res, () => dataService.getAllMeetingTimes());
exports.getMeetingTime = (req, res) => handleResponse(res, () => dataService.getMeetingTimeById(req.params.id));
exports.createMeetingTime = (req, res) => handleResponse(res, () => dataService.createMeetingTime(req.body), 201);
exports.updateMeetingTime = (req, res) => handleResponse(res, () => dataService.updateMeetingTime(req.params.id, req.body));
exports.deleteMeetingTime = (req, res) => handleResponse(res, () => dataService.deleteMeetingTime(req.params.id));

// ==========================================
// SECTIONS
// ==========================================
exports.getSections = (req, res) => handleResponse(res, () => dataService.getAllSections());
exports.getSection = (req, res) => handleResponse(res, () => dataService.getSectionById(req.params.id));
exports.createSection = (req, res) => handleResponse(res, () => dataService.createSection(req.body), 201);
exports.updateSection = (req, res) => handleResponse(res, () => dataService.updateSection(req.params.id, req.body));
exports.deleteSection = (req, res) => handleResponse(res, () => dataService.deleteSection(req.params.id));
