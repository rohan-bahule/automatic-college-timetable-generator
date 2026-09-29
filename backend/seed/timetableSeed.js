const path = require('path');
require('dotenv').config({
  path: path.join(__dirname, '../.env')
});

const {
  sequelize,
  Department,
  Division,
  Batch,
  Instructor,
  Room,
  Course,
  MeetingTime,
  Section
} = require('../models');

async function seedDatabase() {
  console.log('🔄 Connecting to Database...');

  try {
    const ensureDatabaseExists = require('../config/initDb');
    await ensureDatabaseExists();
    // =========================================================
    // 1. RESET DATABASE
    // =========================================================
    await sequelize.sync({ force: true });

    console.log('🧹 Database schema reset successfully.\n');

    // =========================================================
    // 2. DEPARTMENT
    // =========================================================
    const department = await Department.create({
      name: 'Computer Engineering'
    });

    // =========================================================
    // 3. DIVISIONS
    // =========================================================
    const divisions = {};

    const divisionNames = ['TE-I', 'TE-II', 'TE-III', 'TE-IV'];

    for (const name of divisionNames) {
      divisions[name] = await Division.create({
        name,
        totalStudents: 88,
        departmentId: department.id
      });
    }

    console.log('✅ Divisions created.');

    // =========================================================
    // 4. BATCHES
    // =========================================================
    const batches = {};

    const batchData = [
      ['K1', 'TE-I'],
      ['L1', 'TE-I'],
      ['M1', 'TE-I'],
      ['N1', 'TE-I'],

      ['K2', 'TE-II'],
      ['L2', 'TE-II'],
      ['M2', 'TE-II'],
      ['N2', 'TE-II'],

      ['K3', 'TE-III'],
      ['L3', 'TE-III'],
      ['M3', 'TE-III'],
      ['N3', 'TE-III'],

      ['K4', 'TE-IV'],
      ['L4', 'TE-IV'],
      ['M4', 'TE-IV'],
      ['N4', 'TE-IV']
    ];

    for (const [batchName, divisionName] of batchData) {
      batches[batchName] = await Batch.create({
        name: batchName,
        studentCount: 22,
        divisionId: divisions[divisionName].id
      });
    }

    console.log('✅ 16 batches created.');

    // =========================================================
    // 5. INSTRUCTORS
    // =========================================================
    const instructorData = [
      ['T001', 'Dr. S.N. Girme'],
      ['T002', 'Prof. Rutuja Kulkarni'],
      ['T003', 'Prof. A.D. Bundele'],
      ['T004', 'Prof. M.V. Mane'],
      ['T005', 'Prof. P.P. Joshi'],
      ['T006', 'Prof. P.A. Jain'],
      ['T007', 'Prof. P.J. Jambhulkar'],
      ['T008', 'Prof. S.W. Jadhav'],
      ['T009', 'Prof. B.P. Masram'],
      ['T010', 'Prof. A.A. Chandorkar'],
      ['T011', 'Prof. D.D. Raigar'],
      ['T012', 'Prof. M.S. Wakode'],
      ['T013', 'Prof. K.R. Urane'],
      ['T014', 'Prof. N.Y. Kapadnis'],
      ['T015', 'Prof. Kopal Gangrade'],
      ['T016', 'Prof. P.R. Navghare'],
      ['T017', 'Dr. P.R. Patil'],
      ['T018', 'Prof. Deepika Kumari'],
      ['T019', 'Prof. Madhuri Patil'],
      ['T020', 'Prof. R.R. Jadhav']
    ];

    const instructors = {};

    for (const [uid, name] of instructorData) {
      instructors[uid] = await Instructor.create({
        uid,
        name,

        // Scheduler limits
        maxBatchesPerWeek: 4,
        maxLectureDivisions: 3
      });
    }

    console.log('✅ 20 instructors created.');

    // =========================================================
    // 6. ROOMS
    // =========================================================

    const lectureRooms = [
      ['A1-309', 100],
      ['A1-310', 100],
      ['A1-311', 100],
      ['A1-111', 100],
      ['A1-213', 100]
    ];

    const labRooms = [
      ['A1-204', 25],
      ['A1-102', 25],
      ['A1-306', 25],
      ['A1-307', 25],
      ['A1-314', 25],
      ['A1-303', 25],
      ['A1-216', 25],
      ['A2-302', 25],
      ['A2-303', 25],
      ['A1-105', 25]
    ];

    for (const [number, capacity] of lectureRooms) {
      await Room.create({
        number,
        seatingCapacity: capacity,
        roomType: 'LECTURE'
      });
    }

    for (const [number, capacity] of labRooms) {
      await Room.create({
        number,
        seatingCapacity: capacity,
        roomType: 'LAB'
      });
    }

    console.log('✅ 15 rooms created.');

    // =========================================================
    // 7. COURSES
    // =========================================================

    const courses = {};

    courses.AI = await Course.create({
      code: 'AI',
      name: 'Artificial Intelligence',
      maxStudents: 100,
      courseType: 'LECTURE',
      isElective: false
    });

    courses.DSBDA = await Course.create({
      code: 'DSBDA',
      name: 'Data Science & Big Data Analytics',
      maxStudents: 100,
      courseType: 'LECTURE',
      isElective: false
    });

    courses.WT = await Course.create({
      code: 'WT',
      name: 'Web Technology',
      maxStudents: 100,
      courseType: 'LECTURE',
      isElective: false
    });

    courses.DSBDAL = await Course.create({
      code: 'DSBDAL',
      name: 'DSBDA Lab',
      maxStudents: 22,
      courseType: 'LAB',
      isElective: false
    });

    courses.LPII = await Course.create({
      code: 'LPII',
      name: 'LP-II Lab',
      maxStudents: 22,
      courseType: 'LAB',
      isElective: false
    });

    courses.WTL = await Course.create({
      code: 'WTL',
      name: 'WT Lab',
      maxStudents: 22,
      courseType: 'LAB',
      isElective: false
    });

    courses.CC = await Course.create({
      code: 'CC',
      name: 'Cloud Computing',
      maxStudents: 100,
      courseType: 'LECTURE',
      isElective: true
    });

    courses.IS = await Course.create({
      code: 'IS',
      name: 'Information Security',
      maxStudents: 100,
      courseType: 'LECTURE',
      isElective: true
    });

    console.log('✅ 8 courses created.');

    // =========================================================
    // 8. COURSE ↔ INSTRUCTOR MAPPING
    // =========================================================

    await courses.AI.addInstructors([
      instructors.T001,
      instructors.T004
    ]);

    await courses.DSBDA.addInstructors([
      instructors.T002,
      instructors.T005
    ]);

    await courses.WT.addInstructors([
      instructors.T003,
      instructors.T006
    ]);

    await courses.DSBDAL.addInstructors([
      instructors.T002,
      instructors.T005,
      instructors.T008,
      instructors.T011,
      instructors.T012,
      instructors.T016,
      instructors.T020
    ]);

    await courses.LPII.addInstructors([
      instructors.T001,
      instructors.T004,
      instructors.T009,
      instructors.T010,
      instructors.T013,
      instructors.T014,
      instructors.T017,
      instructors.T018,
      instructors.T019
    ]);

    await courses.WTL.addInstructors([
      instructors.T003,
      instructors.T006,
      instructors.T007,
      instructors.T015
    ]);

    await courses.CC.addInstructors([
      instructors.T009,
      instructors.T010
    ]);

    await courses.IS.addInstructors([
      instructors.T001,
      instructors.T014
    ]);

    console.log('✅ Instructor-course mappings created.');

    // =========================================================
    // 9. MEETING TIMES
    // =========================================================

    const days = [
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday'
    ];

    const lectureTimes = [
      '08:45-09:45',
      '09:45-10:45',
      '11:00-12:00',
      '12:00-13:00',
      '13:45-14:45',
      '14:45-15:45'
    ];

    const labTimes = [
      '08:45-10:45',
      '11:00-13:00',
      '13:45-15:45'
    ];

    const electiveTimes = [
      '08:45-10:45',
      '11:00-13:00',
      '13:45-15:45'
    ];

    let lectureId = 1;
    let labId = 1;
    let electiveId = 1;

    for (const day of days) {

      // -------------------------
      // Lecture slots
      // -------------------------
      for (const time of lectureTimes) {
        await MeetingTime.create({
          pid: `L${String(lectureId).padStart(3, '0')}`,
          day,
          time,
          slotType: 'LECTURE'
        });

        lectureId++;
      }

      // -------------------------
      // Lab slots
      // -------------------------
      for (const time of labTimes) {
        await MeetingTime.create({
          pid: `B${String(labId).padStart(3, '0')}`,
          day,
          time,
          slotType: 'LAB'
        });

        labId++;
      }

      // -------------------------
      // Elective 2-hour slots
      // -------------------------
      for (const time of electiveTimes) {
        await MeetingTime.create({
          pid: `E${String(electiveId).padStart(3, '0')}`,
          day,
          time,
          slotType: 'LECTURE'
        });

        electiveId++;
      }
    }

    console.log('✅ 60 meeting times created.');

    // =========================================================
    // 10. SECTIONS
    // =========================================================

    let sectionCounter = 1;

    async function createSection({
      sectionId,
      course,
      division,
      batch = null,
      numClassesPerWeek,
      isElective = false,
      electiveGroup = null
    }) {
      return await Section.create({
        sectionId,

        numClassesPerWeek,

        isElective,
        electiveGroup,

        departmentId: department.id,
        divisionId: divisions[division].id,

        batchId: batch ? batches[batch].id : null,

        courseId: courses[course].id
      });
    }

    // =========================================================
    // 10A. LECTURE SECTIONS
    // =========================================================

    for (const division of divisionNames) {

      await createSection({
        sectionId: `AI-${division.replace('TE-', 'TE')}`,
        course: 'AI',
        division,
        numClassesPerWeek: 3
      });

      await createSection({
        sectionId: `DSBDA-${division.replace('TE-', 'TE')}`,
        course: 'DSBDA',
        division,
        numClassesPerWeek: 3
      });

      await createSection({
        sectionId: `WT-${division.replace('TE-', 'TE')}`,
        course: 'WT',
        division,
        numClassesPerWeek: 3
      });
    }

    // =========================================================
    // 10B. LAB SECTIONS
    // =========================================================

    for (const [batchName, division] of batchData) {

      // DSBDA Lab - 2/week
      await createSection({
        sectionId: `DSBDAL-${batchName}`,
        course: 'DSBDAL',
        division,
        batch: batchName,
        numClassesPerWeek: 2
      });

      // LP-II Lab - 2/week
      await createSection({
        sectionId: `LPII-${batchName}`,
        course: 'LPII',
        division,
        batch: batchName,
        numClassesPerWeek: 2
      });

      // WT Lab - 1/week
      await createSection({
        sectionId: `WTL-${batchName}`,
        course: 'WTL',
        division,
        batch: batchName,
        numClassesPerWeek: 1
      });
    }

    // =========================================================
    // 10C. ELECTIVES
    // =========================================================

    // G1 → TE-I + TE-II
    await createSection({
      sectionId: 'CC-G1',
      course: 'CC',
      division: 'TE-I',
      numClassesPerWeek: 2,
      isElective: true,
      electiveGroup: 'G1'
    });

    await createSection({
      sectionId: 'IS-G1',
      course: 'IS',
      division: 'TE-I',
      numClassesPerWeek: 2,
      isElective: true,
      electiveGroup: 'G1'
    });

    // G2 → TE-III + TE-IV
    await createSection({
      sectionId: 'CC-G2',
      course: 'CC',
      division: 'TE-III',
      numClassesPerWeek: 2,
      isElective: true,
      electiveGroup: 'G2'
    });

    await createSection({
      sectionId: 'IS-G2',
      course: 'IS',
      division: 'TE-III',
      numClassesPerWeek: 2,
      isElective: true,
      electiveGroup: 'G2'
    });

    // =========================================================
    // 11. COUNTS
    // =========================================================

    console.log('\n========================================');
    console.log('       DATABASE SEED COMPLETE');
    console.log('========================================');

    console.log(
      `Departments  : ${await Department.count()}`
    );

    console.log(
      `Divisions    : ${await Division.count()}`
    );

    console.log(
      `Batches      : ${await Batch.count()}`
    );

    console.log(
      `Instructors  : ${await Instructor.count()}`
    );

    console.log(
      `Rooms        : ${await Room.count()}`
    );

    console.log(
      `Courses      : ${await Course.count()}`
    );

    console.log(
      `MeetingTimes : ${await MeetingTime.count()}`
    );

    console.log(
      `Sections     : ${await Section.count()}`
    );

    console.log('========================================\n');

    console.log('Expected:');
    console.log('Departments  : 1');
    console.log('Divisions    : 4');
    console.log('Batches      : 16');
    console.log('Instructors  : 20');
    console.log('Rooms        : 15');
    console.log('Courses      : 8');
    console.log('MeetingTimes : 60');
    console.log('Sections     : 64');
    console.log('========================================');

    process.exit(0);

  } catch (error) {

    console.error('\n❌ SEEDING FAILED');
    console.error(error);

    process.exit(1);
  }
}

seedDatabase();