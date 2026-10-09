# 🗓️ Timetable Scheduling System

An automated timetable scheduling system that simplifies academic planning by generating conflict-free schedules using a constraint-based randomized algorithm.

The system supports academic data management, timetable generation and regeneration, conflict validation, interactive rescheduling, revision history, and PDF export.

---

## ⭐ Key Features

- **Academic Data Management:** Manage departments, courses, faculty, rooms, divisions, batches, sections, and meeting times.
- **Automated Scheduling:** Generate timetables using a randomized, multi-phase scheduling algorithm.
- **Conflict Detection:** Validate faculty, room, laboratory, division, and batch scheduling constraints.
- **Timetable Regeneration:** Run a fresh scheduling process while preserving previous timetable runs.
- **Multiple Timetable Views:** View schedules by division, faculty, room, or batch.
- **Interactive Rescheduling:** Edit timetable entries and use drag-and-drop scheduling with validation.
- **Revision History:** Track timetable runs and preserve previous versions.
- **PDF Export:** Export generated timetables for convenient sharing and printing.

---

## 🧠 Scheduling Algorithm

The scheduler uses a randomized, multi-phase approach to find a valid timetable.

```text
Load Academic Data
        |
        v
Initialize Scheduling State
        |
        v
Schedule Electives
        |
        v
Schedule Laboratories
        |
        v
Schedule Lectures
        |
        v
Validate Constraints
        |
        v
  Valid Timetable?
      /     \
    Yes      No
     |        |
     v        v
   Save     Retry
```

### Validated Constraints

- Faculty and room availability conflicts
- Laboratory, division, and batch conflicts
- Faculty-course eligibility
- Room and time compatibility

Each candidate timetable is validated against the scheduling constraints before being saved.

---

## ⚙️ Installation

**Prerequisites:** Node.js, npm, and MySQL 8.

### 1. Clone the Repository

```bash
git clone https://github.com/rohan-bahule/automatic-college-timetable-generator.git
cd automatic-college-timetable-generator
```

### 2. Configure the Database

Configure your MySQL credentials and database settings in `backend/.env`.

The application uses the `timetable_db` database. Ensure the database exists and any required schema initialization or migrations have been completed.

### 3. Run the Backend

```bash
cd backend
npm install
npm run dev
```

### 4. Run the Frontend

Open a separate terminal:

```bash
cd frontend
npm install
npm run dev
```
