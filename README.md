# Eye-DEA - Innovation Management System

A full-stack organizational idea management platform that enables employees to submit improvement ideas, route them through an approval workflow, and track their impact through cost/time savings analytics.

## Features

### Idea Submission & Workflow
- Submit ideas with title, description, improvement type, current process, suggested solution, and benefits
- Auto-generated idea numbers (EYE-00001)
- File attachments (PDF, DOC/X, XLS/X, PPT/X, PNG, JPG — max 10MB)
- Multi-step approval: Pending → Approved / Declined / Revision Requested → Implemented
- Team field auto-derived from submitter's profile
- Comments on ideas

### Role-Based Access
| Role | Capabilities |
|------|-------------|
| **User** | Submit ideas, view dashboard, see own submissions |
| **Approver** | Approve, decline, or request revisions on ideas |
| **C.I. Excellence Team** | Evaluate approved ideas (Quick Win, Complexity Level), manage cost/time savings with audit history, tag Best Eye-deas |
| **Admin** | Manage users, organizational hierarchy, bulk uploads |

### Dashboard
- Stats overview: Total ideas, Pending, Approved, Implemented, Assigned to T&E, Revision Requested, Declined, My Submissions
- Filterable by Pillar, Department, Team
- **Eye-dea Champions Leaderboard** — ranked table (Rank, Name, Team, Points) with scoring:
  - Both Cost & Time Savings = 5 pts
  - Either Cost or Time = 3 pts
  - Quick Win = 2 pts
  - Submission = 1 pt
- Best Eye-deas showcase section

### C.I. Analytics Dashboard
- Quick Wins, Implementation Rate, T&E Assignment stats
- Total Cost Savings and Time Saved summaries
- Complexity Distribution pie chart
- Status Distribution bar chart with counts
- Approval, Implementation, and T&E assignment rate progress bars
- Best Eye-deas gallery (unlimited selection by CI Team)
- Excel export of all ideas
- Filters by Pillar, Department, Team, Date Range

### Admin Panel
- **Users** — CRUD with role/sub-role management, team assignment
- **Pillars** — Add/delete organizational pillars
- **Departments** — Add/delete with pillar association (bulk CSV upload)
- **Teams** — Add/delete with pillar/department association (bulk CSV upload)
- **Managers** — CRUD mapped to teams (bulk CSV upload)
- **Tech & Engineering** — Manage T&E personnel
- Seed sample data
- Toggle approver sub-role change permission

### Other
- Mobile-responsive design
- JWT authentication
- Password change and forgot password flows

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React, Tailwind CSS, shadcn/ui, Recharts |
| Backend | FastAPI (Python) |
| Database | MongoDB (async via motor) |
| Auth | JWT (JSON Web Tokens) |
| File Handling | Chunked uploads, local storage |
| Excel Export | openpyxl |

## Project Structure

```
/app
├── backend/
│   ├── server.py           # FastAPI application (all routes)
│   ├── models/__init__.py   # Pydantic models
│   ├── services/__init__.py # Utility functions
│   ├── uploads/             # Uploaded attachments
│   ├── .env                 # MONGO_URL, JWT_SECRET, etc.
│   └── requirements.txt
├── frontend/
│   ├── public/
│   │   ├── index.html       # "Philtech Eye-dea" title
│   │   └── eyedea-logo.png  # App logo
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/          # shadcn components
│   │   │   ├── CIEvaluationPanel.js
│   │   │   └── Layout.js
│   │   ├── pages/
│   │   │   ├── Login.js         # Split-panel login/register
│   │   │   ├── Dashboard.js     # Stats + leaderboard
│   │   │   ├── CIDashboard.js   # CI Analytics
│   │   │   ├── AdminPanel.js    # Multi-tab admin
│   │   │   ├── CreateIdea.js    # Idea form + attachments
│   │   │   ├── IdeaDetail.js    # View/approve/evaluate
│   │   │   ├── IdeasList.js     # Filterable idea list
│   │   │   └── Profile.js       # User profile + sub-role
│   │   ├── contexts/
│   │   │   └── AuthContext.js
│   │   ├── App.js
│   │   └── index.css
│   ├── .env                 # REACT_APP_BACKEND_URL
│   └── package.json
└── README.md
```

## Setup & Run

### Prerequisites
- Python 3.9+
- Node.js 18+
- MongoDB

### Backend
```bash
cd backend
pip install -r requirements.txt
# Configure .env with MONGO_URL and JWT_SECRET
uvicorn server:app --host 0.0.0.0 --port 8001
```

### Frontend
```bash
cd frontend
yarn install
# Configure .env with REACT_APP_BACKEND_URL
yarn start
```

### Default Test Accounts
| Username | Password | Role |
|----------|----------|------|
| admin | admin123 | Admin |
| approver1 | approver123 | Approver (C.I. Excellence) |
| user1 | user123 | User |

## Key API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | User login |
| POST | `/api/auth/register` | User registration |
| GET | `/api/ideas` | List ideas (filterable) |
| POST | `/api/ideas` | Submit new idea |
| POST | `/api/ideas/{id}/approve` | Approve idea |
| POST | `/api/ideas/{id}/ci-evaluate` | CI evaluation |
| POST | `/api/ideas/{id}/mark-best-idea` | Toggle Best Eye-dea |
| PUT | `/api/ideas/{id}/ci-update-savings` | Update savings (with audit) |
| POST | `/api/upload/attachment` | Upload file attachment |
| GET | `/api/dashboard/stats` | Dashboard statistics |
| GET | `/api/dashboard/leaderboard` | Points leaderboard |
| GET | `/api/dashboard/analytics` | CI analytics data |
| GET | `/api/dashboard/export-excel` | Export ideas to Excel |
| GET | `/api/admin/users` | List users (admin) |
| GET | `/api/public/pillars` | Public pillars list |
