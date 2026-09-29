// Use Vite's development proxy by default so the frontend never depends on a
// hard-coded backend host. Set VITE_API_BASE_URL when deploying separately.
const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api/timetable';

export const timetableApi = {
  /**
   * Trigger timetable generation on backend
   * POST /api/timetable/generate
   */
  generateTimetable: async () => {
    const res = await fetch(`${API_BASE}/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    if (!res.ok) {
      let errMsg = 'Failed to generate timetable.';
      try {
        const errJson = await res.json();
        if (errJson.message) errMsg = errJson.message;
      } catch (e) {
        // Fallback to HTTP error
      }
      throw new Error(errMsg);
    }
    return res.json();
  },

  /**
   * Fetch read-only metadata (divisions, instructors, rooms, batches)
   * GET /api/timetable/metadata
   */
  getMetadata: async () => {
    const res = await fetch(`${API_BASE}/metadata`);
    if (!res.ok) {
      throw new Error('Failed to load scheduling metadata for filters.');
    }
    return res.json();
  },

  /**
   * Fetch all previous timetable runs
   * GET /api/timetable
   */
  getAllRuns: async () => {
    const res = await fetch(`${API_BASE}`);
    if (!res.ok) throw new Error('Failed to fetch available timetable runs.');
    return res.json();
  },

  /**
   * Fetch a specific run with all populated entries
   * GET /api/timetable/:id
   */
  getRunById: async (id) => {
    const res = await fetch(`${API_BASE}/${id}`);
    if (!res.ok) throw new Error(`Timetable run #${id} not found or server error.`);
    return res.json();
  },

  /**
   * Filter run by Division
   * GET /api/timetable/:id/division/:divisionId
   */
  getRunByDivision: async (runId, divisionId) => {
    const res = await fetch(`${API_BASE}/${runId}/division/${divisionId}`);
    if (!res.ok) throw new Error(`Could not fetch timetable for division #${divisionId}`);
    return res.json();
  },

  /**
   * Filter run by Instructor
   * GET /api/timetable/:id/instructor/:instructorId
   */
  getRunByInstructor: async (runId, instructorId) => {
    const res = await fetch(`${API_BASE}/${runId}/instructor/${instructorId}`);
    if (!res.ok) throw new Error(`Could not fetch timetable for instructor #${instructorId}`);
    return res.json();
  },

  /**
   * Filter run by Room
   * GET /api/timetable/:id/room/:roomId
   */
  getRunByRoom: async (runId, roomId) => {
    const res = await fetch(`${API_BASE}/${runId}/room/${roomId}`);
    if (!res.ok) throw new Error(`Could not fetch timetable for room #${roomId}`);
    return res.json();
  },

  /**
   * Filter run by Batch
   * GET /api/timetable/:id/batch/:batchId
   */
  getRunByBatch: async (runId, batchId) => {
    const res = await fetch(`${API_BASE}/${runId}/batch/${batchId}`);
    if (!res.ok) throw new Error(`Could not fetch timetable for batch #${batchId}`);
    return res.json();
  },

  /**
   * Polymorphic filter helper (backward compatible with Phase 0/1 viewer)
   */
  getRunFiltered: async (id, filterType, filterId) => {
    const typeMapping = { 
      Division: 'division', 
      Instructor: 'instructor', 
      Room: 'room', 
      Batch: 'batch' 
    };
    const path = typeMapping[filterType] || filterType.toLowerCase();
    const res = await fetch(`${API_BASE}/${id}/${path}/${filterId}`);
    if (!res.ok) throw new Error(`Could not fetch data for ${filterType} #${filterId}`);
    return res.json();
  },

  /**
   * Validate a proposed entry edit
   * POST /api/timetable/:runId/entries/:entryId/validate
   */
  validateTimetableEntry: async (runId, entryId, payload) => {
    const res = await fetch(`${API_BASE}/${runId}/entries/${entryId}/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const json = await res.json();
    return json;
  },

  /**
   * Save a valid entry edit by creating a revised TimetableRun snapshot
   * PUT /api/timetable/:runId/entries/:entryId
   */
  updateTimetableEntry: async (runId, entryId, payload) => {
    const res = await fetch(`${API_BASE}/${runId}/entries/${entryId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const json = await res.json();
    if (!res.ok) {
      const error = new Error(json.message || 'Failed to save timetable edit');
      error.conflicts = json.conflicts || [];
      throw error;
    }
    return json;
  }
};
