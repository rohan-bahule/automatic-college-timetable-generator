const assert = require('assert');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const http = require('http');
const app = require('../app');
const { TimetableRun, TimetableEntry, Instructor, Room, MeetingTime, Course, InstructorCourse } = require('../models');

async function runTimetableEditTests() {
  const PORT = 5015;
  const BASE_URL = `http://localhost:${PORT}/api/timetable`;
  const server = http.createServer(app);

  server.listen(PORT, async () => {
    try {
      console.log('🚀 Starting Timetable Edit & Conflict Validation Tests on port', PORT);

      // Ensure baseline catalog exists
      const courseCount = await Course.count();
      if (courseCount < 5) {
        console.log('Reseeding baseline database catalog for tests...');
        const { execSync } = require('child_process');
        execSync('node seed/timetableSeed.js', { cwd: path.join(__dirname, '..'), stdio: 'ignore' });
      }

      // Fetch runs with entries or generate one
      let runs = await TimetableRun.findAll({
        include: [{ model: TimetableEntry, attributes: ['id'] }],
        order: [['id', 'DESC']]
      });
      let activeRun = runs.find(r => r.TimetableEntries && r.TimetableEntries.length >= 10);
      if (!activeRun) {
        console.log('Generating baseline timetable run...');
        const genRes = await fetch(`${BASE_URL}/generate`, { method: 'POST' });
        assert.strictEqual(genRes.status, 200);
        runs = await TimetableRun.findAll({
          include: [{ model: TimetableEntry, attributes: ['id'] }],
          order: [['id', 'DESC']]
        });
        activeRun = runs.find(r => r.TimetableEntries && r.TimetableEntries.length >= 10);
      }

      assert.ok(activeRun, 'Expected an active run with entries');
      const runId = activeRun.id;
      console.log(`Using baseline Run ID: ${runId}`);

      // 2. Fetch entries from this run
      const entries = await TimetableEntry.findAll({
        where: { timetableRunId: runId },
        include: [{ model: Course }, { model: Room }, { model: MeetingTime }, { model: Instructor }]
      });
      assert.ok(entries.length > 10, 'Expected populated timetable entries');

      // Pick two distinct entries in this run with different teachers and time slots
      const entryA = entries[0];
      const entryB = entries.find(e => e.instructorId !== entryA.instructorId && e.meetingTimeId !== entryA.meetingTimeId) || entries[10];

      // ----------------------------------------------------
      // TEST 1: Valid Self-Edit Check (editing itself should not conflict with itself)
      // ----------------------------------------------------
      console.log('Test 1: Self-edit check (no self-collision)...');
      let res = await fetch(`${BASE_URL}/${runId}/entries/${entryA.id}/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instructorId: entryA.instructorId,
          roomId: entryA.roomId,
          meetingTimeId: entryA.meetingTimeId
        })
      });
      let json = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(json.valid, true, 'Self-retained parameters must be valid and not conflict with self');
      console.log('✅ Self-edit validation passed.');

      // ----------------------------------------------------
      // TEST 2: Invalid Teacher Collision
      // Attempt to move entry A to the exact time of entry B while assigning entry B's teacher
      // ----------------------------------------------------
      console.log('Test 2: Teacher collision check...');
      res = await fetch(`${BASE_URL}/${runId}/entries/${entryA.id}/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instructorId: entryB.instructorId,
          roomId: entryA.roomId,
          meetingTimeId: entryB.meetingTimeId
        })
      });
      json = await res.json();
      assert.strictEqual(res.status, 200);
      // If entry A and entry B have overlapping times, this must trigger conflict
      if (entryA.MeetingTime.day === entryB.MeetingTime.day && entryA.MeetingTime.time === entryB.MeetingTime.time) {
        assert.strictEqual(json.valid, false);
      } else {
        // Teacher is busy at entry B's time
        assert.strictEqual(json.valid, false, 'Assigning teacher at their existing slot must report conflict');
      }
      console.log('✅ Teacher collision detected accurately.');

      // ----------------------------------------------------
      // TEST 3: Invalid Room Collision
      // Move entry A to entry B's time and occupy entry B's room
      // ----------------------------------------------------
      console.log('Test 3: Room collision check...');
      res = await fetch(`${BASE_URL}/${runId}/entries/${entryA.id}/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instructorId: entryA.instructorId,
          roomId: entryB.roomId,
          meetingTimeId: entryB.meetingTimeId
        })
      });
      json = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(json.valid, false, 'Occupied room must report collision');
      console.log('✅ Room collision detected accurately.');

      // ----------------------------------------------------
      // TEST 4: Invalid Instructor-Course Eligibility
      // Pick an instructor who does NOT teach entryA.courseId
      // ----------------------------------------------------
      console.log('Test 4: Ineligible instructor check...');
      const allInstructors = await Instructor.findAll();
      const eligibleInstructors = await InstructorCourse.findAll({
        where: { courseId: entryA.courseId }
      });
      const eligibleIds = new Set(eligibleInstructors.map(ei => ei.instructorId));
      const ineligibleInstructor = allInstructors.find(i => !eligibleIds.has(i.id));

      if (ineligibleInstructor) {
        res = await fetch(`${BASE_URL}/${runId}/entries/${entryA.id}/validate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            instructorId: ineligibleInstructor.id,
            roomId: entryA.roomId,
            meetingTimeId: entryA.meetingTimeId
          })
        });
        json = await res.json();
        assert.strictEqual(res.status, 200);
        assert.strictEqual(json.valid, false);
        const hasEligConflict = json.conflicts.some(c => c.type === 'INSTRUCTOR_ELIGIBILITY');
        assert.ok(hasEligConflict, 'Expected INSTRUCTOR_ELIGIBILITY conflict');
        console.log('✅ Instructor eligibility conflict caught.');
      }

      // ----------------------------------------------------
      // TEST 5: Nonexistent Run or Entry
      // ----------------------------------------------------
      console.log('Test 5: Nonexistent run/entry check...');
      res = await fetch(`${BASE_URL}/999999/entries/${entryA.id}/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      assert.strictEqual(res.status, 404);

      res = await fetch(`${BASE_URL}/${runId}/entries/999999/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      assert.strictEqual(res.status, 404);
      console.log('✅ 404 checks verified.');

      // ----------------------------------------------------
      // TEST 6: Save Rejection on Conflict (PUT must fail if invalid)
      // ----------------------------------------------------
      console.log('Test 6: Save rejection on conflict...');
      res = await fetch(`${BASE_URL}/${runId}/entries/${entryA.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instructorId: entryB.instructorId,
          roomId: entryB.roomId,
          meetingTimeId: entryB.meetingTimeId
        })
      });
      assert.strictEqual(res.status, 409, 'Conflicting edit must return 409 on save');
      console.log('✅ Conflicting edit rejected on save.');

      // ----------------------------------------------------
      // TEST 7: Save Valid Edit -> Creates Revised Snapshot Run
      // ----------------------------------------------------
      console.log('Test 7: Valid edit save & revision snapshot creation...');
      const initialRunsCount = await TimetableRun.count();
      const initialEntryACopy = { ...entryA.toJSON() };

      // Save valid change
      res = await fetch(`${BASE_URL}/${runId}/entries/${entryA.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instructorId: entryA.instructorId,
          roomId: entryA.roomId,
          meetingTimeId: entryA.meetingTimeId
        })
      });
      json = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(json.success, true);
      assert.ok(json.data.revisedRunId);
      const revisedRunId = json.data.revisedRunId;

      // Verify original run is intact
      const afterRun = await TimetableRun.findByPk(runId);
      assert.ok(afterRun, 'Original run must remain intact');
      const originalEntriesCount = await TimetableEntry.count({ where: { timetableRunId: runId } });
      const revisedEntriesCount = await TimetableEntry.count({ where: { timetableRunId: revisedRunId } });
      assert.strictEqual(originalEntriesCount, revisedEntriesCount, 'Revised run must replicate all entries');

      const finalRunsCount = await TimetableRun.count();
      assert.strictEqual(finalRunsCount, initialRunsCount + 1, 'Total runs count must increment by 1');
      console.log(`✅ Revised Run #${revisedRunId} created. Original Run #${runId} preserved.`);

      console.log('\n🎉 ALL TIMETABLE EDIT & CONFLICT VALIDATION TESTS PASSED!');
      server.close();
      process.exit(0);
    } catch (err) {
      console.error('\n❌ Timetable edit test failed:', err);
      server.close();
      process.exit(1);
    }
  });
}

runTimetableEditTests();
