const { Division, Instructor, Room, Batch } = require('../models');

/**
 * Service providing read-only metadata lookups for UI dropdowns
 * Strictly decoupled from scheduling and data-entry logic
 */
async function getMetadata() {
  const [divisions, instructors, rooms, batches] = await Promise.all([
    Division.findAll({
      attributes: ['id', 'name'],
      order: [['name', 'ASC']]
    }),
    Instructor.findAll({
      attributes: ['id', 'name', 'uid'],
      order: [['name', 'ASC']]
    }),
    Room.findAll({
      attributes: ['id', 'number', 'roomType'],
      order: [['number', 'ASC']]
    }),
    Batch.findAll({
      attributes: ['id', 'name', 'divisionId'],
      order: [['name', 'ASC']]
    })
  ]);

  return {
    divisions,
    instructors,
    rooms,
    batches
  };
}

module.exports = { getMetadata };
