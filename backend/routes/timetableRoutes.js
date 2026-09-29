const express = require('express');
const router = express.Router();
const timetableController = require('../controllers/timetableController');
const retrievalController = require('../controllers/timetableRetrievalController');
const metadataController = require('../controllers/timetableMetadataController');
const editController = require('../controllers/timetableEditController');

// Clean POST generator endpoint
router.post('/generate', timetableController.generateTimetable);

// Extraction handlers
router.get('/', retrievalController.getAllRuns);
router.get('/metadata', metadataController.getMetadata);
router.get('/:id', retrievalController.getRunById);
router.get('/:id/division/:divisionId', retrievalController.getRunByDivision);
router.get('/:id/instructor/:instructorId', retrievalController.getRunByInstructor);
router.get('/:id/room/:roomId', retrievalController.getRunByRoom);
router.get('/:id/batch/:batchId', retrievalController.getRunByBatch);

// Entry Edit & Conflict Validation endpoints
router.post('/:runId/entries/:entryId/validate', editController.validateEntry);
router.put('/:runId/entries/:entryId', editController.updateEntry);

module.exports = router;
