const API_BASE = '/api/data';

// Response helper for fetch requests
const request = async (url, options = {}) => {
  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  };

  const res = await fetch(`${API_BASE}${url}`, config);
  let json = {};
  try {
    json = await res.json();
  } catch (e) {
    // Non-JSON response
  }

  if (!res.ok) {
    const message = json.error || json.message || `Request failed with status ${res.status}`;
    const error = new Error(message);
    error.status = res.status;
    error.data = json;
    throw error;
  }

  return json;
};

export const dataApi = {
  // Departments
  getDepartments: () => request('/departments'),
  getDepartment: (id) => request(`/departments/${id}`),
  createDepartment: (data) => request('/departments', { method: 'POST', body: JSON.stringify(data) }),
  updateDepartment: (id, data) => request(`/departments/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteDepartment: (id) => request(`/departments/${id}`, { method: 'DELETE' }),

  // Divisions
  getDivisions: () => request('/divisions'),
  getDivision: (id) => request(`/divisions/${id}`),
  createDivision: (data) => request('/divisions', { method: 'POST', body: JSON.stringify(data) }),
  updateDivision: (id, data) => request(`/divisions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteDivision: (id) => request(`/divisions/${id}`, { method: 'DELETE' }),

  // Batches
  getBatches: () => request('/batches'),
  getBatch: (id) => request(`/batches/${id}`),
  createBatch: (data) => request('/batches', { method: 'POST', body: JSON.stringify(data) }),
  updateBatch: (id, data) => request(`/batches/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteBatch: (id) => request(`/batches/${id}`, { method: 'DELETE' }),

  // Instructors
  getInstructors: () => request('/instructors'),
  getInstructor: (id) => request(`/instructors/${id}`),
  createInstructor: (data) => request('/instructors', { method: 'POST', body: JSON.stringify(data) }),
  updateInstructor: (id, data) => request(`/instructors/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteInstructor: (id) => request(`/instructors/${id}`, { method: 'DELETE' }),
  addInstructorEligibility: (instructorId, courseId) => 
    request(`/instructors/${instructorId}/courses`, { method: 'POST', body: JSON.stringify({ courseId }) }),
  removeInstructorEligibility: (instructorId, courseId) => 
    request(`/instructors/${instructorId}/courses/${courseId}`, { method: 'DELETE' }),

  // Rooms
  getRooms: () => request('/rooms'),
  getRoom: (id) => request(`/rooms/${id}`),
  createRoom: (data) => request('/rooms', { method: 'POST', body: JSON.stringify(data) }),
  updateRoom: (id, data) => request(`/rooms/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteRoom: (id) => request(`/rooms/${id}`, { method: 'DELETE' }),

  // Courses
  getCourses: () => request('/courses'),
  getCourse: (id) => request(`/courses/${id}`),
  createCourse: (data) => request('/courses', { method: 'POST', body: JSON.stringify(data) }),
  updateCourse: (id, data) => request(`/courses/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCourse: (id) => request(`/courses/${id}`, { method: 'DELETE' }),
  addCourseInstructor: (courseId, instructorId) => 
    request(`/courses/${courseId}/instructors`, { method: 'POST', body: JSON.stringify({ instructorId }) }),
  removeCourseInstructor: (courseId, instructorId) => 
    request(`/courses/${courseId}/instructors/${instructorId}`, { method: 'DELETE' }),

  // Meeting Times
  getMeetingTimes: () => request('/meeting-times'),
  getMeetingTime: (id) => request(`/meeting-times/${id}`),
  createMeetingTime: (data) => request('/meeting-times', { method: 'POST', body: JSON.stringify(data) }),
  updateMeetingTime: (id, data) => request(`/meeting-times/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteMeetingTime: (id) => request(`/meeting-times/${id}`, { method: 'DELETE' }),

  // Sections
  getSections: () => request('/sections'),
  getSection: (id) => request(`/sections/${id}`),
  createSection: (data) => request('/sections', { method: 'POST', body: JSON.stringify(data) }),
  updateSection: (id, data) => request(`/sections/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteSection: (id) => request(`/sections/${id}`, { method: 'DELETE' }),
};

export default dataApi;
