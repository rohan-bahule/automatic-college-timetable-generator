const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const assert = require('assert');
const http = require('http');

const app = require('../app');
const { sequelize, TimetableRun, TimetableEntry, Department, Division, Batch, Instructor, Room, Course, MeetingTime, Section } = require('../models');

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
    console.log('✅ DB seeded for True Timetable Regeneration Test.');

    const server = http.createServer(app);
    server.listen(5022, async () => {
      console.log('🚀 Regeneration Test Server alive on port 5022');

      try {
        // STEP 1: Generate Initial Timetable (Run #1)
        console.log('Step 1: Generating Initial Timetable Run #1...');
        const gen1Resp = await fetch('http://localhost:5022/api/timetable/generate', { method: 'POST' });
        const gen1Data = await gen1Resp.json();
        
        assert.strictEqual(gen1Resp.status, 200);
        assert.strictEqual(gen1Data.success, true);
        const run1Id = gen1Data.data.timetableId;
        assert.ok(run1Id, 'Run #1 ID must exist');

        // Fetch Run #1 entries from database
        const run1Db = await TimetableRun.findByPk(run1Id, { include: [TimetableEntry] });
        assert.ok(run1Db, 'Run #1 must exist in database');
        const run1EntryCount = run1Db.TimetableEntries.length;
        assert.ok(run1EntryCount > 0, 'Run #1 must contain scheduled entries');
        const run1OriginalEntries = run1Db.TimetableEntries.map(e => ({
          id: e.id,
          sectionId: e.sectionId,
          meetingTimeId: e.meetingTimeId,
          roomId: e.roomId,
          instructorId: e.instructorId
        }));

        // STEP 2: Trigger User-Initiated Regeneration (Run #2)
        console.log('Step 2: Triggering Regeneration via authoritative generator...');
        const gen2Resp = await fetch('http://localhost:5022/api/timetable/generate', { method: 'POST' });
        const gen2Data = await gen2Resp.json();

        assert.strictEqual(gen2Resp.status, 200);
        assert.strictEqual(gen2Data.success, true);
        const run2Id = gen2Data.data.timetableId;
        assert.ok(run2Id, 'Run #2 ID must exist');

        // STEP 3: Confirm Run #2 ID is distinct from Run #1 ID
        console.log(`Step 3: Comparing Run #1 (ID: ${run1Id}) with Regenerated Run #2 (ID: ${run2Id})...`);
        assert.notStrictEqual(run1Id, run2Id, 'Regenerated run must receive a new distinct TimetableRun ID');

        // STEP 4: Query Database - Both runs must exist
        console.log('Step 4: Confirming both runs exist in database...');
        const allRuns = await TimetableRun.findAll({ order: [['id', 'ASC']] });
        const runIds = allRuns.map(r => r.id);
        assert.ok(runIds.includes(run1Id), 'Run #1 must still exist in database');
        assert.ok(runIds.includes(run2Id), 'Run #2 must exist in database');

        // STEP 5: Confirm Original Run #1 is 100% Immutable and Intact
        console.log('Step 5: Verifying Run #1 immutability at database level...');
        const run1DbAfter = await TimetableRun.findByPk(run1Id, { include: [TimetableEntry] });
        assert.strictEqual(run1DbAfter.TimetableEntries.length, run1EntryCount, 'Run #1 entry count must be unchanged');
        for (let i = 0; i < run1OriginalEntries.length; i++) {
          const orig = run1OriginalEntries[i];
          const curr = run1DbAfter.TimetableEntries.find(e => e.id === orig.id);
          assert.ok(curr, `Run #1 entry #${orig.id} must still exist`);
          assert.strictEqual(curr.meetingTimeId, orig.meetingTimeId, 'Meeting time must be unchanged in Run #1');
          assert.strictEqual(curr.roomId, orig.roomId, 'Room must be unchanged in Run #1');
          assert.strictEqual(curr.instructorId, orig.instructorId, 'Instructor must be unchanged in Run #1');
        }

        // STEP 6: Confirm Regenerated Run #2 contains its own complete entries
        console.log('Step 6: Verifying Run #2 has its own complete set of entries...');
        const run2Db = await TimetableRun.findByPk(run2Id, { include: [TimetableEntry] });
        assert.ok(run2Db.TimetableEntries.length > 0, 'Run #2 must contain scheduled entries');
        const run2EntryIds = run2Db.TimetableEntries.map(e => e.id);
        for (const orig of run1OriginalEntries) {
          assert.ok(!run2EntryIds.includes(orig.id), 'Run #2 entry IDs must be distinct from Run #1 entry IDs');
        }

        // STEP 7: Confirm All Timetable APIs reflect both runs
        console.log('Step 7: Verifying GET /api/timetable lists both runs...');
        const listResp = await fetch('http://localhost:5022/api/timetable');
        const listData = await listResp.json();
        const listedIds = listData.data.map(r => r.id);
        assert.ok(listedIds.includes(run1Id), 'GET /api/timetable must list Run #1');
        assert.ok(listedIds.includes(run2Id), 'GET /api/timetable must list Run #2');

        console.log('🎉 TRUE TIMETABLE REGENERATION FULLY VERIFIED!');
        server.close();
        process.exit(0);
      } catch (err) {
        console.error('❌ Regeneration Test Failed:', err);
        server.close();
        process.exit(1);
      }
    });
  } catch (err) {
    console.error('❌ Test Setup Failed:', err);
    process.exit(1);
  }
}

runTests();
