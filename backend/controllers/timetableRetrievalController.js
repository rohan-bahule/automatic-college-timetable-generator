const retrievalService = require('../services/timetableRetrievalService');

const formatResponse = (run) => ({
  timetableId: run.id,
  conflictCount: run.conflictCount,
  verified: run.verified,
  attempts: run.attempts,
  timeTakenSec: run.timeTakenSec,
  createdAt: run.createdAt,
  entries: run.TimetableEntries || []
});

exports.getAllRuns = async (req, res) => {
  try {
    const runs = await retrievalService.getAllRuns();
    res.json({ success: true, data: runs });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

exports.getRunById = async (req, res) => {
  try {
    const run = await retrievalService.getRunById(req.params.id);
    if (!run) return res.status(404).json({ success: false, message: 'Timetable not found' });
    res.json({ success: true, data: formatResponse(run) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

exports.getRunByDivision = async (req, res) => {
  try {
    const run = await retrievalService.getRunFiltered(req.params.id, { divisionId: req.params.divisionId });
    if (!run) return res.status(404).json({ success: false, message: 'Timetable not found' });
    res.json({ success: true, data: formatResponse(run) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

exports.getRunByInstructor = async (req, res) => {
  try {
    const run = await retrievalService.getRunFiltered(req.params.id, { instructorId: req.params.instructorId });
    if (!run) return res.status(404).json({ success: false, message: 'Timetable not found' });
    res.json({ success: true, data: formatResponse(run) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

exports.getRunByRoom = async (req, res) => {
  try {
    const run = await retrievalService.getRunFiltered(req.params.id, { roomId: req.params.roomId });
    if (!run) return res.status(404).json({ success: false, message: 'Timetable not found' });
    res.json({ success: true, data: formatResponse(run) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

exports.getRunByBatch = async (req, res) => {
  try {
    const run = await retrievalService.getRunFiltered(req.params.id, { batchId: req.params.batchId });
    if (!run) return res.status(404).json({ success: false, message: 'Timetable not found' });
    res.json({ success: true, data: formatResponse(run) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};
