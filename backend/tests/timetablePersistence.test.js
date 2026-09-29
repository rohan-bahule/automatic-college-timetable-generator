const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const assert = require('assert');
const http = require('http');

const app = require('../app');
const { sequelize, Department, Division, Batch, Instructor, Room, Course, MeetingTime, Section, TimetableRun, TimetableEntry } = require('../models');

async function seedData() {
  await sequelize.sync({ force: true });
  const dept = await Department.create({ name: 'Computer' });
  const div1 = await Division.create({ name: 'TE-I', totalStudents: 80, departmentId: dept.id });
  const batch1 = await Batch.create({ name: 'K1', studentCount: 20, divisionId: div1.id });
  const instructor1 = await Instructor.create({ uid: 'JS01', name: 'John Smith', maxBatchesPerWeek: 4, maxLectureDivisions: 2 });
  const room1 = await Room.create({ number: 'L01', seatingCapacity: 90, roomType: 'LECTURE' });
  
  const courseLec = await Course.create({ code: 'CS1', name: 'Lecture Course', maxStudents: 80, courseType: 'LECTURE', isElective: false });
  await courseLec.addInstructor(instructor1);

  await MeetingTime.create({ pid: 'M1', time: '08:45-09:45', day: 'Monday', slotType: 'LECTURE' });
  await Section.create({ sectionId: 'S1', numClassesPerWeek: 1, isElective: false, departmentId: dept.id, divisionId: div1.id, courseId: courseLec.id });
}

async function runTests() {
  try {
    await seedData();
    console.log('✅ DB seeded for Persistence test.');

    const server = http.createServer(app);
    server.listen(5002, async () => {
      console.log('🚀 Phase 4 Persistence Test Server alive on port 5002');
      try {
        console.log('Testing First API Hit /api/timetable/generate...');
        const tResp1 = await fetch('http://localhost:5002/api/timetable/generate', { method: 'POST' });
        const tData1 = await tResp1.json();
        
        assert.strictEqual(tResp1.status, 200);
        assert.strictEqual(tData1.success, true);
        assert.ok(tData1.data.timetableId > 0);
        const runId1 = tData1.data.timetableId;

        // Verify Persistence
        console.log('Verifying SQL Table insertions mapped safely implicitly...');
        const runDB1 = await TimetableRun.findByPk(runId1);
        assert.ok(runDB1 !== null);
        assert.strictEqual(runDB1.conflictCount, tData1.data.conflictCount);

        const entriesDB1 = await TimetableEntry.findAll({ where: { timetableRunId: runId1 } });
        assert.strictEqual(entriesDB1.length, tData1.data.schedule.length);
        assert.ok(entriesDB1[0].courseId > 0);

        // 2. Testing Independent Isolation Duplicate Mappings natively safely identically preserving explicitly securely cleanly carefully effectively securely accurately securely safely optimally smoothly
        console.log('Testing Second API Hit /api/timetable/generate...');
        const tResp2 = await fetch('http://localhost:5002/api/timetable/generate', { method: 'POST' });
        const tData2 = await tResp2.json();
        
        const runId2 = tData2.data.timetableId;
        assert.ok(runId2 > runId1);

        const runDbCheck = await TimetableRun.count();
        assert.strictEqual(runDbCheck, 2);

        console.log('✅ Health-Check Evaluation /api/health');
        const hResp = await fetch('http://localhost:5002/api/health');
        const hData = await hResp.json();
        assert.strictEqual(hData.success, true);

        console.log('✅ Phase 4 API Persistence Integration Test Fully Passed without Corruption!');

        server.close();
        process.exit(0);
      } catch (err) {
        console.error('❌ Persistent pipeline exception:', err);
        server.close();
        process.exit(1);
      }
    });

  } catch (error) {
    console.error('❌ DB connection crash:', error);
    process.exit(1);
  }
}

runTests();
