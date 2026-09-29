const assert = require('assert');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const http = require('http');
const app = require('../app');

const { execSync } = require('child_process');

async function runDataApiTests() {
  const PORT = 5012;
  const BASE_URL = `http://localhost:${PORT}/api/data`;
  const server = http.createServer(app);

  server.listen(PORT, async () => {
    try {
      console.log('🚀 Starting Data API Integration Tests on port', PORT);
      execSync('node seed/timetableSeed.js', { cwd: path.join(__dirname, '..'), stdio: 'ignore' });

      // ----------------------------------------------------
      // 1. DEPARTMENTS
      // ----------------------------------------------------
      console.log('Testing DEPARTMENTS CRUD...');
      // GET
      let res = await fetch(`${BASE_URL}/departments`);
      let json = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(json.success, true);
      assert.ok(Array.isArray(json.data));
      const initialDeptCount = json.data.length;

      // Validation failure (empty name)
      res = await fetch(`${BASE_URL}/departments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: '   ' })
      });
      assert.strictEqual(res.status, 400);

      // POST create new department
      res = await fetch(`${BASE_URL}/departments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Mechanical Engineering' })
      });
      json = await res.json();
      assert.strictEqual(res.status, 201);
      const testDeptId = json.data.id;
      assert.strictEqual(json.data.name, 'Mechanical Engineering');

      // PUT update
      res = await fetch(`${BASE_URL}/departments/${testDeptId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Mechanical and Automation Engineering' })
      });
      json = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(json.data.name, 'Mechanical and Automation Engineering');

      // DELETE safe (not referenced yet)
      res = await fetch(`${BASE_URL}/departments/${testDeptId}`, { method: 'DELETE' });
      assert.strictEqual(res.status, 200);

      // DELETE protection on seeded department (id 1 has divisions)
      res = await fetch(`${BASE_URL}/departments/1`, { method: 'DELETE' });
      assert.strictEqual(res.status, 409, 'Referenced department must return 409 conflict');
      console.log('✅ Departments CRUD and Delete Protection verified.');

      // ----------------------------------------------------
      // 2. DIVISIONS
      // ----------------------------------------------------
      console.log('Testing DIVISIONS CRUD...');
      // Validation failure (invalid departmentId)
      res = await fetch(`${BASE_URL}/divisions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'FE-I', departmentId: 999999, totalStudents: 60 })
      });
      assert.strictEqual(res.status, 400);

      // POST create
      res = await fetch(`${BASE_URL}/divisions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'TEST-DIV-1', departmentId: 1, totalStudents: 55 })
      });
      json = await res.json();
      assert.strictEqual(res.status, 201);
      const testDivId = json.data.id;

      // PUT update
      res = await fetch(`${BASE_URL}/divisions/${testDivId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ totalStudents: 58 })
      });
      assert.strictEqual(res.status, 200);

      // ----------------------------------------------------
      // 3. BATCHES
      // ----------------------------------------------------
      console.log('Testing BATCHES CRUD...');
      // POST create attached to testDiv
      res = await fetch(`${BASE_URL}/batches`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'TEST-B1', divisionId: testDivId })
      });
      json = await res.json();
      assert.strictEqual(res.status, 201);
      const testBatchId = json.data.id;

      // Check Delete Protection on Division while it has a Batch
      res = await fetch(`${BASE_URL}/divisions/${testDivId}`, { method: 'DELETE' });
      assert.strictEqual(res.status, 409, 'Division with batch must return 409 conflict');

      // DELETE batch
      res = await fetch(`${BASE_URL}/batches/${testBatchId}`, { method: 'DELETE' });
      assert.strictEqual(res.status, 200);

      // Now division can be deleted safely
      res = await fetch(`${BASE_URL}/divisions/${testDivId}`, { method: 'DELETE' });
      assert.strictEqual(res.status, 200);
      console.log('✅ Divisions and Batches CRUD verified.');

      // ----------------------------------------------------
      // 4. INSTRUCTORS & INSTRUCTOR-COURSE ELIGIBILITY
      // ----------------------------------------------------
      console.log('Testing INSTRUCTORS & ELIGIBILITY CRUD...');
      // Validation failure (negative limit)
      res = await fetch(`${BASE_URL}/instructors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Dr. Test', uid: 'TEST_UID_1', maxBatchesPerWeek: -1 })
      });
      assert.strictEqual(res.status, 400);

      // POST create instructor
      res = await fetch(`${BASE_URL}/instructors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Dr. Test Prof', uid: 'TEST_PROF_01', maxBatchesPerWeek: 4, maxLectureDivisions: 2 })
      });
      json = await res.json();
      assert.strictEqual(res.status, 201);
      const testInstructorId = json.data.id;

      // Add course eligibility (course 1 is AI)
      res = await fetch(`${BASE_URL}/instructors/${testInstructorId}/courses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId: 1 })
      });
      assert.strictEqual(res.status, 201);

      // Duplicate eligibility check
      res = await fetch(`${BASE_URL}/instructors/${testInstructorId}/courses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId: 1 })
      });
      assert.strictEqual(res.status, 400, 'Duplicate eligibility mapping must be rejected');

      // Remove eligibility
      res = await fetch(`${BASE_URL}/instructors/${testInstructorId}/courses/1`, {
        method: 'DELETE'
      });
      assert.strictEqual(res.status, 200);

      // DELETE instructor safely
      res = await fetch(`${BASE_URL}/instructors/${testInstructorId}`, { method: 'DELETE' });
      assert.strictEqual(res.status, 200);
      console.log('✅ Instructors and Course Eligibility verified.');

      // ----------------------------------------------------
      // 5. ROOMS
      // ----------------------------------------------------
      console.log('Testing ROOMS CRUD...');
      // Validation failure (invalid room type)
      res = await fetch(`${BASE_URL}/rooms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomNumber: 'TEST-R1', roomType: 'AUDITORIUM_INVALID', capacity: 100 })
      });
      assert.strictEqual(res.status, 400);

      // POST create room
      res = await fetch(`${BASE_URL}/rooms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomNumber: 'TEST-R1', roomType: 'LAB', capacity: 30 })
      });
      json = await res.json();
      assert.strictEqual(res.status, 201);
      const testRoomId = json.data.id;

      // PUT update
      res = await fetch(`${BASE_URL}/rooms/${testRoomId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ capacity: 35 })
      });
      assert.strictEqual(res.status, 200);

      // DELETE safe
      res = await fetch(`${BASE_URL}/rooms/${testRoomId}`, { method: 'DELETE' });
      assert.strictEqual(res.status, 200);
      console.log('✅ Rooms CRUD verified.');

      // ----------------------------------------------------
      // 6. COURSES
      // ----------------------------------------------------
      console.log('Testing COURSES CRUD...');
      // POST create course
      res = await fetch(`${BASE_URL}/courses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: 'TEST_CS101', name: 'Intro to Computer Science', courseType: 'LECTURE', isElective: false })
      });
      json = await res.json();
      assert.strictEqual(res.status, 201);
      const testCourseId = json.data.id;

      // PUT update
      res = await fetch(`${BASE_URL}/courses/${testCourseId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Introduction to Computer Systems' })
      });
      assert.strictEqual(res.status, 200);

      // DELETE safe
      res = await fetch(`${BASE_URL}/courses/${testCourseId}`, { method: 'DELETE' });
      assert.strictEqual(res.status, 200);
      console.log('✅ Courses CRUD verified.');

      // ----------------------------------------------------
      // 7. MEETING TIMES
      // ----------------------------------------------------
      console.log('Testing MEETING TIMES CRUD...');
      // Validation failure (invalid time format)
      res = await fetch(`${BASE_URL}/meeting-times`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dayOfWeek: 'Monday', timeRange: '9am to 10am' })
      });
      assert.strictEqual(res.status, 400);

      // POST create meeting time
      res = await fetch(`${BASE_URL}/meeting-times`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dayOfWeek: 'Saturday', timeRange: '16:00-17:00', slotType: 'REGULAR', isElectiveSlot: false })
      });
      json = await res.json();
      assert.strictEqual(res.status, 201);
      const testTimeId = json.data.id;

      // DELETE safe
      res = await fetch(`${BASE_URL}/meeting-times/${testTimeId}`, { method: 'DELETE' });
      assert.strictEqual(res.status, 200);
      console.log('✅ Meeting Times CRUD verified.');

      // ----------------------------------------------------
      // 8. SECTIONS
      // ----------------------------------------------------
      console.log('Testing SECTIONS CRUD...');
      // Validation failure (invalid course foreign key)
      res = await fetch(`${BASE_URL}/sections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId: 999999, divisionId: 1, sessionsPerWeek: 1 })
      });
      assert.strictEqual(res.status, 400);

      // POST create section
      res = await fetch(`${BASE_URL}/sections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId: 1, divisionId: 1, sessionsPerWeek: 2 })
      });
      json = await res.json();
      assert.strictEqual(res.status, 201);
      const testSectionId = json.data.id;

      // PUT update
      res = await fetch(`${BASE_URL}/sections/${testSectionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionsPerWeek: 3 })
      });
      assert.strictEqual(res.status, 200);

      // DELETE safe (not in any timetable entry run)
      res = await fetch(`${BASE_URL}/sections/${testSectionId}`, { method: 'DELETE' });
      assert.strictEqual(res.status, 200);
      console.log('✅ Sections CRUD verified.');

      console.log('\n🎉 ALL BACKEND DATA API INTEGRATION TESTS PASSED!');
      server.close();
      process.exit(0);
    } catch (err) {
      console.error('\n❌ Backend Data API test failed:', err);
      server.close();
      process.exit(1);
    }
  });
}

runDataApiTests();
