const metadataService = require('../services/timetableMetadataService');

/**
 * Controller handling GET /api/timetable/metadata
 */
exports.getMetadata = async (req, res) => {
  try {
    const data = await metadataService.getMetadata();
    res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve metadata',
      error: error.message
    });
  }
};
