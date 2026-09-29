const express = require('express');
const router = express.Router();
const dataController = require('../controllers/dataController');

// Departments
router.get('/departments', dataController.getDepartments);
router.post('/departments', dataController.createDepartment);
router.get('/departments/:id', dataController.getDepartment);
router.put('/departments/:id', dataController.updateDepartment);
router.delete('/departments/:id', dataController.deleteDepartment);

// Divisions
router.get('/divisions', dataController.getDivisions);
router.post('/divisions', dataController.createDivision);
router.get('/divisions/:id', dataController.getDivision);
router.put('/divisions/:id', dataController.updateDivision);
router.delete('/divisions/:id', dataController.deleteDivision);

// Batches
router.get('/batches', dataController.getBatches);
router.post('/batches', dataController.createBatch);
router.get('/batches/:id', dataController.getBatch);
router.put('/batches/:id', dataController.updateBatch);
router.delete('/batches/:id', dataController.deleteBatch);

// Instructors
router.get('/instructors', dataController.getInstructors);
router.post('/instructors', dataController.createInstructor);
router.get('/instructors/:id', dataController.getInstructor);
router.put('/instructors/:id', dataController.updateInstructor);
router.delete('/instructors/:id', dataController.deleteInstructor);
router.post('/instructors/:id/courses', dataController.addInstructorCourse);
router.delete('/instructors/:id/courses/:courseId', dataController.removeInstructorCourse);

// Rooms
router.get('/rooms', dataController.getRooms);
router.post('/rooms', dataController.createRoom);
router.get('/rooms/:id', dataController.getRoom);
router.put('/rooms/:id', dataController.updateRoom);
router.delete('/rooms/:id', dataController.deleteRoom);

// Courses
router.get('/courses', dataController.getCourses);
router.post('/courses', dataController.createCourse);
router.get('/courses/:id', dataController.getCourse);
router.put('/courses/:id', dataController.updateCourse);
router.delete('/courses/:id', dataController.deleteCourse);
router.post('/courses/:id/instructors', dataController.addCourseInstructor);
router.delete('/courses/:id/instructors/:instructorId', dataController.removeCourseInstructor);

// Meeting Times
router.get('/meeting-times', dataController.getMeetingTimes);
router.post('/meeting-times', dataController.createMeetingTime);
router.get('/meeting-times/:id', dataController.getMeetingTime);
router.put('/meeting-times/:id', dataController.updateMeetingTime);
router.delete('/meeting-times/:id', dataController.deleteMeetingTime);

// Sections
router.get('/sections', dataController.getSections);
router.post('/sections', dataController.createSection);
router.get('/sections/:id', dataController.getSection);
router.put('/sections/:id', dataController.updateSection);
router.delete('/sections/:id', dataController.deleteSection);

module.exports = router;
