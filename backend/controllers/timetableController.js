const timetableService = require('../services/timetableService');
const { persistTimetable } = require('../services/timetablePersistenceService');

exports.generateTimetable = async (req, res) => {
  try {
    const result = await timetableService.generateTimetable();
    const timetableId = await persistTimetable(result);
    
    res.status(200).json({
      success: true,
      data: {
        timetableId: timetableId,
        schedule: result.schedule,
        conflicts: result.conflicts,
        conflictCount: result.conflictCount,
        attempts: result.attempts,
        verified: result.verified
      },
      message: result.verified ? 'Perfect Timetable Generated' : 'Timetable generated with validation conflicts'
    });
  } catch (error) {
    console.error('❌ Scheduler API Fault:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to complete timetable generation orchestration.', 
      error: error.message 
    });
  }
};
