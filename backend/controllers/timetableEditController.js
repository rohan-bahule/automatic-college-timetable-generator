const timetableEditService = require('../services/timetableEditService');

exports.validateEntry = async (req, res) => {
  try {
    const { runId, entryId } = req.params;
    const result = await timetableEditService.validateEntryEdit(runId, entryId, req.body);
    return res.status(200).json({
      success: true,
      valid: result.valid,
      conflicts: result.conflicts,
      message: result.message
    });
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({
      success: false,
      message: err.message || 'Validation service error',
      conflicts: err.conflicts || []
    });
  }
};

exports.updateEntry = async (req, res) => {
  try {
    const { runId, entryId } = req.params;
    const result = await timetableEditService.saveEntryEdit(runId, entryId, req.body);
    return res.status(200).json({
      success: true,
      data: result,
      message: result.message
    });
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({
      success: false,
      message: err.message || 'Failed to save timetable edit',
      conflicts: err.conflicts || []
    });
  }
};
