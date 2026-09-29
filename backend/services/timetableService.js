const TimetableDataLoader = require('./timetable/TimetableDataLoader');
const TimetableGenerator = require('./timetable/TimetableGenerator');

/**
 * Service orchestrating purely algorithm extraction natively isolating database concerns
 */
async function generateTimetable() {
  // 1. Map constraints natively from DB securely strictly matching explicit Phase 2C
  const dataLoader = new TimetableDataLoader();
  await dataLoader.load();

  // 2. Delegate execution strictly securely uniquely firmly accurately seamlessly safely appropriately properly
  const generator = new TimetableGenerator(dataLoader);
  const result = generator.generateBest();
  
  return result;
}

module.exports = {
  generateTimetable
};
