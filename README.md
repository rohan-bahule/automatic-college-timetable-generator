# 🎓 Automatic College Timetable Generator

A full-stack **College Timetable Generation & Management System** that automatically generates conflict-free timetables using a **Constraint-Based Randomized Scheduling Algorithm**.

The system manages academic data, generates timetables, detects conflicts, supports regeneration and editing, and allows PDF export.

---

## 🚀 Features

- 📚 Manage Departments, Courses, Faculty, Rooms, Divisions, Batches, Sections & Meeting Times
- 🧠 Constraint-based automatic timetable generation
- 🔄 True timetable regeneration with fresh scheduling
- ⚡ Automatic conflict detection and validation
- 📊 View timetable by Division, Faculty, Room or Batch
- ✏️ Edit timetable entries with validation
- 🖱️ Drag-and-drop timetable rescheduling
- 🕒 Timetable run history and revisions
- 📄 PDF timetable export

---

## 🧠 Scheduling Algorithm

The scheduler uses a **randomized multi-phase approach** with up to **100 generation attempts** to find a valid timetable.

```text
Load Academic Data
        ↓
Initialize Scheduling State
        ↓
Schedule Electives
        ↓
Schedule Laboratories
        ↓
Schedule Lectures
        ↓
Validate Constraints
        ↓
Valid?
  ↙       ↘
YES       NO
 ↓         ↓
Save     Retry
```

### Constraints Handled

- Faculty conflicts
- Room conflicts
- Laboratory conflicts
- Division conflicts
- Batch conflicts
- Faculty-course eligibility
- Room and time compatibility

---

## 🛠️ Tech Stack

### Frontend

- React 19
- Vite
- CSS
- Vitest
- React Testing Library
- jsPDF

### Backend

- Node.js
- Express.js
- Sequelize ORM
- MySQL 8
- mysql2

### Tools

- Git
- GitHub
- VS Code

---

## 📂 Project Structure

```text
Timetable/
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── services/
│   │   └── timetable/
│   ├── seed/
│   └── tests/
│
├── frontend/
│   └── src/
│       ├── components/
│       ├── pages/
│       └── services/
│
└── README.md
```

---

## ⚙️ Installation

### 1. Clone Repository

```bash
git clone <YOUR_REPOSITORY_URL>
cd Timetable
```

### 2. Backend Setup

```bash
cd backend
npm install
npm run dev
```

Backend runs on:

```text
http://localhost:8000
```

### 3. Frontend Setup

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on:

```text
http://localhost:5173
```

### 4. Database Configuration

Configure your MySQL credentials in:

```text
backend/.env
```

The application uses the following database:

```text
timetable_db
```

---

## 🔄 Application Workflow

```text
Manage Academic Data
        ↓
Generate Timetable
        ↓
Validate
        ↓
View Timetable
        ↓
Edit / Drag & Drop
        ↓
Save
        ↓
Export PDF
```

### 🔁 Timetable Regeneration

```text
Existing Timetable
        ↓
Regenerate
        ↓
Fresh Scheduling Process
        ↓
New Timetable Run
        ↓
Previous Run Preserved
```

Each regeneration starts a fresh scheduling process while preserving previous timetable runs for history and revision tracking.

---

## 🧪 Testing

### Run Frontend Tests

```bash
cd frontend
npm test
```

### Test Results

```text
60 Tests
60 Passed
0 Failed
```

### Build Production Frontend

```bash
npm run build
```

---