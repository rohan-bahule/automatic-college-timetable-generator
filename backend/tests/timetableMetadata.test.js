const assert = require('assert');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const http = require('http');
const app = require('../app');

async function testMetadataEndpoint() {
  const server = http.createServer(app);
  server.listen(5009, async () => {
    try {
      console.log('Testing GET /api/timetable/metadata ...');
      const res = await fetch('http://localhost:5009/api/timetable/metadata');
      const json = await res.json();

      assert.strictEqual(res.status, 200);
      assert.strictEqual(json.success, true);
      assert.ok(json.data.divisions && Array.isArray(json.data.divisions));
      assert.ok(json.data.instructors && Array.isArray(json.data.instructors));
      assert.ok(json.data.rooms && Array.isArray(json.data.rooms));
      assert.ok(json.data.batches && Array.isArray(json.data.batches));

      assert.ok(json.data.divisions.length > 0, 'Divisions array should not be empty');
      assert.ok(json.data.divisions[0].id !== undefined);
      assert.ok(json.data.divisions[0].name !== undefined);

      console.log('✅ GET /api/timetable/metadata verified successfully!');
      server.close();
      process.exit(0);
    } catch (err) {
      console.error('❌ Metadata endpoint test failed:', err);
      server.close();
      process.exit(1);
    }
  });
}

testMetadataEndpoint();
