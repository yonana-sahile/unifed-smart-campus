<div align="center">

# 🎓 Mekdela Amba University — Unified Smart Campus Management System

**USCMS** · A full-stack digital campus platform for academic, administrative, and student services.

[![Django](https://img.shields.io/badge/Django-4.2.7-092E20?style=flat-square&logo=django&logoColor=white)](https://www.djangoproject.com/)
[![DRF](https://img.shields.io/badge/DRF-3.14+-A30000?style=flat-square)](https://www.django-rest-framework.org/)
[![React](https://img.shields.io/badge/React-18+-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.x-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![SQLite](https://img.shields.io/badge/SQLite-dev-003B57?style=flat-square&logo=sqlite&logoColor=white)](https://www.sqlite.org/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat-square&logo=docker&logoColor=white)](https://www.docker.com/)

</div>

---

## 📖 Overview

**Mekdela Amba University Smart Campus (USCMS)** is a unified, role-based campus management platform that digitizes academic, administrative, financial, and student services for a modern university.

The system provides dedicated dashboards for **9+ user roles**, live virtual classroom integration, an AI-powered assistant, secure document generation, digital clearance workflows, and real-time campus broadcasting — all built on a **Django REST Framework** backend and a **React + TypeScript (Vite)** frontend.

---

## ✨ Key Features

### 🎓 Academic Management
- **Course Catalog & Registration** — enroll, drop, prerequisite validation, seat capacity
- **Grade Management** — continuous assessment + mid-exam + final exam → automated letter grade & GPA
- **Attendance Tracking** — minimum-threshold enforcement with a real-time ledger
- **Online Examinations** — timed, auto-submitting exams with MCQ, True/False, and short-answer questions
- **Transcripts & Certificates** — digitally generated academic records

### 🎥 Campus Media Broadcast Network
- **`CampusMediaBroadcast.tsx`** — admin-managed video upload and public playback
- **Categories** — campus news, graduation, tech expo, research, presidential addresses
- **Views & Likes** — public engagement counters

### 📰 Campus News & Announcements
- **`CampusNewsTopBar.tsx`** — animated live ticker across every dashboard
- **`CampusNewsAdminModal.tsx`** — rich announcement composer with categories
- **Admin Publishing** — authenticated posting with audit trail

### 💻 Zoom-Style Live Teaching
- **`InstructorZoomManager.tsx`** — schedule or instantly start live sessions
- **`ZoomClassroomModal.tsx`** — in-app classroom with speaker/gallery view, notes tab
- **`StudentZoomLearningHub.tsx`** — student-facing session hub and recordings archive

### 🤖 AI-Powered Features
- **`FloatingAIAssistant.tsx`** — always-available AI copilot for academic guidance
- **Smart Exam Generator** — AI-assisted MCQ / True-False question generation
- **Dropout Risk Predictor** — data-driven student risk classification

### 🏛️ Administrative & Financial
- **`SmartClearancePortal.tsx`** — multi-department clearance workflow (Library, Finance, Dormitory, Lab, Registrar)
- **`FinanceOfficerDashboard.tsx`** — fee payments, cost-sharing, scholarships
- **`SmartCampusFacilities.tsx`** — labs, auditoriums, seminar rooms, library cubicle booking
- **`LibraryStaffDashboard.tsx`** — resource management and clearance approvals
- **`AuditorDashboard.tsx`** — read-only compliance and audit-log access

### 🎨 Experience & Identity
- **`UniversityHeader.tsx`** / **`UniversityLandingFooter.tsx`** — branded shell across the app
- **`StarryFlag.tsx`** — animated university identity/branding element
- **`ThemeContext.tsx`** — light/dark theme support app-wide
- **`ForgotPasswordModal.tsx`** / **`UpdateProfileModal.tsx`** — account self-service

---

## 🧑‍🤝‍🧑 Role-Based Dashboards

| Dashboard Component | Role |
|---|---|
| `StudentDashboard.tsx` | **STUDENT** — enroll, take exams, view grades, transcripts, Zoom, book facilities |
| `InstructorDashboard.tsx` | **INSTRUCTOR** — post materials, grade submissions, host Zoom lectures |
| `DepartmentHeadDashboard.tsx` | **DEPARTMENT HEAD** — approve course outlines, department analytics |
| `DeanDashboard.tsx` | **DEAN** — college-level analytics, honors approval |
| `AdminDashboard.tsx` | **ADMIN** — full system access, user & media control |
| `FinanceOfficerDashboard.tsx` | **FINANCE OFFICER** — payments, cost-sharing, scholarships |
| `LibraryStaffDashboard.tsx` | **LIBRARY STAFF** — resource & clearance management |
| `AuditorDashboard.tsx` | **AUDITOR** — read-only audit & compliance access |
| `OtherDashboards.tsx` | Shared/additional role views |

---

## 🛠️ Tech Stack

### Backend (`unifiedbackend/`)
| Layer | Technology |
|---|---|
| Framework | Django 4.2.7 |
| API | Django REST Framework |
| Database | SQLite (`db.sqlite3`, dev) — swappable for PostgreSQL in production |
| App logic | `App/` — `models.py`, `serializers.py`, `views.py`, `permissions.py`, `utils.py`, `urls.py` |
| Media storage | `media/` (gitignored) |
| Containerization | `Dockerfile` |

### Frontend (`unifed_frontend/`)
| Layer | Technology |
|---|---|
| Framework | React 18 |
| Language | TypeScript |
| Build Tool | Vite |
| Linting | ESLint (`eslint.config.js`) |
| HTTP Layer | `services/api.ts` |
| State/Theme | `context/ThemeContext.tsx` |
| Containerization | `Dockerfile` |

### DevOps
| Tool | Purpose |
|---|---|
| Docker | Containerization of backend & frontend |
| Docker Compose | `docker-compose.yml` — multi-container orchestration |
| Python venv | `unifed/` local virtual environment |

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT (Browser)                         │
│   React 18 + TypeScript + Vite                                │
│   ┌───────────────────────────────────────────────────────┐  │
│   │ Dashboards: Student · Instructor · Dean · Registrar…  │  │
│   │ Components: ZoomClassroomModal · CampusMediaBroadcast │  │
│   │             CampusNewsTopBar · FloatingAIAssistant    │  │
│   └───────────────────────────────────────────────────────┘  │
└──────────────────────────┬────────────────────────────────────┘
                            │ HTTPS + JWT (Bearer)
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   API LAYER (Django + DRF)                    │
│   App/: models · serializers · views · permissions · utils   │
└──────────────────────────┬────────────────────────────────────┘
                            │ Django ORM
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                        DATABASE (SQLite)                       │
│   Users · Courses · Grades · Media · Zoom Sessions ·         │
│   Clearances · Bookings · Alerts · Audit Logs                │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
unifedsamrt campus/
│
├── unifed/                          # Python virtual environment (local dev)
│   ├── bin/ · include/ · lib/ · lib64/
│   └── pyvenv.cfg
│
├── unifed_frontend/                 # React + TypeScript frontend
│   ├── node_modules/
│   ├── public/
│   │   ├── favicon.svg
│   │   └── icons.svg
│   ├── src/
│   │   ├── assets/
│   │   │   ├── hero.png
│   │   │   ├── mau_university_log.jpg
│   │   │   ├── react.svg
│   │   │   └── vite.svg
│   │   ├── components/
│   │   │   ├── AdminDashboard.tsx
│   │   │   ├── AuditorDashboard.tsx
│   │   │   ├── CampusMediaBroadcast.tsx
│   │   │   ├── CampusNewsAdminModal.tsx
│   │   │   ├── CampusNewsTopBar.tsx
│   │   │   ├── DeanDashboard.tsx
│   │   │   ├── DepartmentHeadDashboard.tsx
│   │   │   ├── FinanceOfficerDashboard.tsx
│   │   │   ├── FloatingAIAssistant.tsx
│   │   │   ├── ForgotPasswordModal.tsx
│   │   │   ├── InstructorDashboard.tsx
│   │   │   ├── InstructorZoomManager.tsx
│   │   │   ├── LibraryStaffDashboard.tsx
│   │   │   ├── OtherDashboards.tsx
│   │   │   ├── SmartCampusFacilities.tsx
│   │   │   ├── SmartClearancePortal.tsx
│   │   │   ├── StarryFlag.tsx
│   │   │   ├── StudentDashboard.tsx
│   │   │   ├── StudentZoomLearningHub.tsx
│   │   │   ├── UniversityHeader.tsx
│   │   │   ├── UniversityLandingFooter.tsx
│   │   │   ├── UpdateProfileModal.tsx
│   │   │   └── ZoomClassroomModal.tsx
│   │   ├── context/
│   │   │   └── ThemeContext.tsx
│   │   ├── services/
│   │   │   └── api.ts
│   │   ├── App.css
│   │   ├── App.tsx
│   │   ├── index.css
│   │   ├── main.tsx
│   │   └── types.ts
│   ├── .env
│   ├── .gitignore
│   ├── Dockerfile
│   ├── eslint.config.js
│   ├── index.html
│   └── package.json
│
└── unifiedbackend/                  # Django backend
    ├── App/                         # Main Django app
    │   ├── migrations/
    │   ├── __init__.py
    │   ├── admin.py
    │   ├── apps.py
    │   ├── models.py
    │   ├── permissions.py
    │   ├── serializers.py
    │   ├── tests.py
    │   ├── urls.py
    │   ├── utils.py
    │   └── views.py
    ├── media/                       # User-uploaded files (gitignored)
    ├── unifiedbackend/              # Django project settings
    │   ├── __init__.py
    │   ├── asgi.py
    │   ├── settings.py
    │   ├── urls.py
    │   └── wsgi.py
    ├── db.sqlite3                   # Local dev database
    ├── Dockerfile
    ├── manage.py
    ├── requirements.txt
    ├── .gitignore
    └── docker-compose.yml
```

---

## 🚀 Getting Started

### Prerequisites
- **Python** ≥ 3.10
- **Node.js** ≥ 18
- **Docker** & **Docker Compose** (optional, for containerized setup)

### 1. Clone the repository
```bash
git clone https://github.com/yonana-sahile/unifed-smart-campus.git
cd "unifedsamrt campus"
```

### 2. Backend setup
```bash
cd unifiedbackend
python -m venv ../unifed
source ../unifed/bin/activate      # Windows: ..\unifed\Scripts\activate
pip install -r requirements.txt

python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

### 3. Frontend setup
```bash
cd unifed_frontend
npm install
npm run dev
```

### 4. (Optional) Run with Docker Compose
```bash
docker-compose up -d --build
```

### 5. Open the app
| Service | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:8000/api |
| Django Admin | http://localhost:8000/admin |

---

## 🔒 Security Notes

- **Environment variables** — sensitive keys live in `.env` (frontend) and are never committed.
- **Role-based access** — every dashboard component maps to a server-enforced role via `permissions.py`.
- **Media isolation** — uploaded files are served from `media/`, excluded from version control.
- **Local dev database** — `db.sqlite3` is for development only; swap to PostgreSQL/MySQL for production.

---

## 🧪 Testing

**Backend**
```bash
cd unifiedbackend
python manage.py test
```

**Frontend**
```bash
cd unifed_frontend
npm run lint
```

---

## 🗺️ Roadmap

- [x] Role-based dashboards for 9+ user types
- [x] Course catalog, grades, attendance, exams
- [x] Campus media broadcast with video upload
- [x] Campus news ticker + admin publisher
- [x] Zoom-style live teaching & classroom
- [x] Floating AI assistant
- [x] Digital clearance + facility booking
- [x] Docker Compose deployment
- [ ] Real Zoom SDK integration
- [ ] WebSocket-based real-time chat
- [ ] PostgreSQL production database
- [ ] Mobile app (React Native)
- [ ] CI/CD pipeline (GitHub Actions)

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Commit using Conventional Commits: `git commit -m "feat(module): short description"`
4. Push your branch: `git push origin feat/your-feature`
5. Open a Pull Request

**Commit types:** `feat` · `fix` · `chore` · `docs` · `style` · `refactor` · `test`
**Scopes:** `api` · `zoom` · `media` · `auth` · `student` · `instructor` · `dashboard` · `docker`

---

## 📄 License

Developed for **Mekdela Amba University** as part of its digital transformation initiative.
© 2026 Mekdela Amba University. All rights reserved.

---

<div align="center">

Built with ❤️ for Mekdela Amba University

*"Veritas, Scientia et Virtus"*
*Truth, Knowledge, and Excellence*

</div>
