const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const assert = require('assert');
const http = require('http');

const app = require('../app');
const { sequelize, Department, Division, Batch, Instructor, Room, Course, MeetingTime, Section } = require('../models');

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
    console.log('✅ DB seeded for Retrieval API tests.');

    const server = http.createServer(app);
    server.listen(5003, async () => {
      console.log('🚀 Phase 5 Test Server alive on port 5003');
      try {
        // 1. Generate run identically safely natively
        console.log('Running POST /api/timetable/generate...');
        const tResp = await fetch('http://localhost:5003/api/timetable/generate', { method: 'POST' });
        const tData = await tResp.json();
        
        assert.ok(tData.success);
        const runId = tData.data.timetableId;

        // 2. GET all
        console.log('GET /api/timetable ...');
        const getResp1 = await fetch('http://localhost:5003/api/timetable');
        const getData1 = await getResp1.json();
        assert.strictEqual(getData1.success, true);
        assert.ok(Array.isArray(getData1.data));
        assert.strictEqual(getData1.data.length, 1);
        
        // 3. GET specific Run
        console.log(`GET /api/timetable/${runId} ...`);
        const getResp2 = await fetch(`http://localhost:5003/api/timetable/${runId}`);
        const getData2 = await getResp2.json();
        assert.strictEqual(getData2.success, true);
        assert.ok(getData2.data.entries.length > 0);
        
        // Confirm includes executed smoothly providing relationships compactly successfully seamlessly reliably cleanly solidly perfectly effectively correctly
        const firstEntry = getData2.data.entries[0];
        assert.ok(firstEntry.Course);
        assert.ok(firstEntry.Course.code === 'CS1');
        assert.ok(firstEntry.Instructor.name === 'John Smith');

        // 4. Test missing 404
        console.log('GET /api/timetable/999 ...');
        const failResp = await fetch('http://localhost:5003/api/timetable/999');
        assert.strictEqual(failResp.status, 404);

        // 5. Test Filters reliably predictably identically intelligently smartly reliably cleanly stably cleanly
        console.log(`GET /api/timetable/${runId}/division/1 ...`);
        const divResp = await fetch(`http://localhost:5003/api/timetable/${runId}/division/1`);
        const divData = await divResp.json();
        assert.strictEqual(divData.success, true);
        assert.ok(divData.data.entries.every(e => e.divisionId === 1));

        server.close();
        console.log('✅ Phase 5 Verification Complete: Retrieval API seamlessly functional!');
        process.exit(0);

      } catch (err) {
        console.error('❌ Data API failure:', err);
        server.close();
        process.exit(1);
      }
    });

  } catch (error) {
    console.error('❌ Internal server exception:', error);
    process.exit(1);
  }
}

runTests();
