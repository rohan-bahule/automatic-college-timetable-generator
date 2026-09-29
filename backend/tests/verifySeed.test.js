const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const http = require('http');
const assert = require('assert');

const app = require('../app');
const { TimetableRun, TimetableEntry } = require('../models');

const server = http.createServer(app);
server.listen(5021, async () => {
  try {
    console.log('🚀 Initiating /api/timetable/generate ...');
    const pReq = await fetch('http://localhost:5021/api/timetable/generate', { method: 'POST' });
    const pRes = await pReq.json();
    
    assert.strictEqual(pRes.success, true);
    console.log(`✅ Timetable Generator executed successfully! Run ID: ${pRes.data.timetableId}`);
    
    // Check Database counts explicitly appropriately natively securely smartly
    const runDBCount = await TimetableRun.count();
    const entryDBCount = await TimetableEntry.count();
    console.log(`✅ Confirmed Database Mappings -> TimetableRun: ${runDBCount}, TimetableEntry: ${entryDBCount}`);

    console.log('🚀 Checking /api/timetable endpoint ...');
    const gReq = await fetch('http://localhost:5021/api/timetable');
    const gRes = await gReq.json();
    
    assert.strictEqual(gRes.success, true);
    assert.ok(gRes.data.length >= 1);
    console.log(`✅ Extracted Payload verified seamlessly: Successfully retrieved ${gRes.data.length} Run arrays!`);

    server.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Verification pipeline failed purely dynamically dependably:', error);
    server.close();
    process.exit(1);
  }
});
