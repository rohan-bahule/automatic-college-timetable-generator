const sequelize = require('../config/db');

const Department = require('./Department');
const Division = require('./Division');
const Batch = require('./Batch');
const Instructor = require('./Instructor');
const InstructorCourse = require('./InstructorCourse');
const Room = require('./Room');
const Course = require('./Course');
const MeetingTime = require('./MeetingTime');
const Section = require('./Section');

const TimetableRun = require('./TimetableRun');
const TimetableEntry = require('./TimetableEntry');

// Associations

// Department
Department.hasMany(Division, { foreignKey: 'departmentId' });
Department.hasMany(Section, { foreignKey: 'departmentId' });

// Division
Division.belongsTo(Department, { foreignKey: 'departmentId' });
Division.hasMany(Batch, { foreignKey: 'divisionId' });
Division.hasMany(Section, { foreignKey: 'divisionId' });
Division.hasMany(TimetableEntry, { foreignKey: 'divisionId' });

// Batch
Batch.belongsTo(Division, { foreignKey: 'divisionId' });
Batch.hasMany(Section, { foreignKey: 'batchId' });
Batch.hasMany(TimetableEntry, { foreignKey: 'batchId' });

// Instructor
Instructor.hasMany(Section, { foreignKey: 'instructorId' });
Instructor.belongsToMany(Course, { through: InstructorCourse, foreignKey: 'instructorId' });
Instructor.hasMany(TimetableEntry, { foreignKey: 'instructorId' });

// Course
Course.hasMany(Section, { foreignKey: 'courseId' });
Course.belongsToMany(Instructor, { through: InstructorCourse, foreignKey: 'courseId' });
Course.hasMany(TimetableEntry, { foreignKey: 'courseId' });

// InstructorCourse
InstructorCourse.belongsTo(Instructor, { foreignKey: 'instructorId' });
InstructorCourse.belongsTo(Course, { foreignKey: 'courseId' });

// Room
Room.hasMany(Section, { foreignKey: 'roomId' });
Room.hasMany(TimetableEntry, { foreignKey: 'roomId' });

// MeetingTime
MeetingTime.hasMany(Section, { foreignKey: 'meetingTimeId' });
MeetingTime.hasMany(TimetableEntry, { foreignKey: 'meetingTimeId' });

// Section
Section.belongsTo(Department, { foreignKey: 'departmentId' });
Section.belongsTo(Division, { foreignKey: 'divisionId' });
Section.belongsTo(Batch, { foreignKey: 'batchId' }); 
Section.belongsTo(Course, { foreignKey: 'courseId' });
Section.belongsTo(Instructor, { foreignKey: 'instructorId' });
Section.belongsTo(Room, { foreignKey: 'roomId' });
Section.belongsTo(MeetingTime, { foreignKey: 'meetingTimeId' });
Section.hasMany(TimetableEntry, { foreignKey: 'sectionId' });

// TimetableRun
TimetableRun.hasMany(TimetableEntry, { foreignKey: 'timetableRunId', onDelete: 'CASCADE' });

// TimetableEntry
TimetableEntry.belongsTo(TimetableRun, { foreignKey: 'timetableRunId' });
TimetableEntry.belongsTo(Section, { foreignKey: 'sectionId' });
TimetableEntry.belongsTo(Course, { foreignKey: 'courseId' });
TimetableEntry.belongsTo(MeetingTime, { foreignKey: 'meetingTimeId' });
TimetableEntry.belongsTo(Room, { foreignKey: 'roomId' });
TimetableEntry.belongsTo(Instructor, { foreignKey: 'instructorId' });
TimetableEntry.belongsTo(Division, { foreignKey: 'divisionId' });
TimetableEntry.belongsTo(Batch, { foreignKey: 'batchId' });

module.exports = {
  sequelize,
  Department,
  Division,
  Batch,
  Instructor,
  InstructorCourse,
  Room,
  Course,
  MeetingTime,
  Section,
  TimetableRun,
  TimetableEntry
};
