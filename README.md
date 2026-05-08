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
| Auth | Microsoft Entra ID (Azure AD) SSO + JWT |
| SSO Library (Frontend) | @azure/msal-browser, @azure/msal-react |
| SSO Validation (Backend) | Azure AD JWKS, python-jose |
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

> **Note:** When SSO is enabled and `DEV_MODE_LOGIN_ENABLED=false`, local login is disabled. These accounts are for dev/test only.

---

## Microsoft SSO (Entra ID / Azure AD) Setup

The app supports enterprise SSO using Microsoft Entra ID (Azure AD) with OpenID Connect, following the same pattern as Albertsons internal apps.

### Architecture

```
┌─────────────┐     ┌──────────────────┐     ┌──────────────┐
│   Browser   │────▶│  Microsoft Login  │────▶│  Azure AD    │
│  (MSAL.js)  │◀────│  (popup/redirect) │◀────│  Entra ID    │
└──────┬──────┘     └──────────────────┘     └──────────────┘
       │ ID Token
       ▼
┌──────────────┐     ┌──────────────────┐
│   Frontend   │────▶│   Backend API    │
│  AuthContext │     │  /auth/sso/login │
└──────────────┘     └────────┬─────────┘
                              │ Validates token via JWKS
                              │ Creates/updates user
                              │ Issues internal JWT
                              ▼
                     ┌──────────────────┐
                     │     MongoDB      │
                     └──────────────────┘
```

### Step 1: Azure AD App Registration

1. Go to [Azure Portal](https://portal.azure.com) → **Microsoft Entra ID** → **App registrations** → **New registration**
2. Configure:
   - **Name:** `Philtech Eye-dea Hub`
   - **Supported account types:** "Accounts in this organizational directory only" (Single tenant)
   - **Redirect URI:** Platform = "Single-page application (SPA)", URI = `http://localhost:3000`
3. After creation, note:
   - **Application (client) ID** → use as `AZURE_CLIENT_ID` / `REACT_APP_AZURE_CLIENT_ID`
   - **Directory (tenant) ID** → use as `AZURE_TENANT_ID` / `REACT_APP_AZURE_TENANT_ID`

### Step 2: Configure Token Claims

1. In the app registration → **Token configuration** → **Add optional claim**
2. Select **ID token**, add: `email`, `given_name`, `family_name`, `preferred_username`
3. (Optional) For group-based role mapping:
   - Go to **Token configuration** → **Add groups claim**
   - Select "Security groups"
   - This will include group IDs in the token

### Step 3: Configure App Roles (Optional)

For fine-grained role mapping via Azure AD:

1. In app registration → **App roles** → **Create app role**
2. Create roles:
   | Display Name | Value | Allowed member types |
   |---|---|---|
   | Admin | `admin` | Users/Groups |
   | Approver | `approver` | Users/Groups |
   | User | `user` | Users/Groups |
3. Assign roles to users/groups in **Enterprise applications** → your app → **Users and groups**

### Step 4: Environment Variables

#### Backend (`backend/.env`)

```env
SSO_ENABLED=true
DEV_MODE_LOGIN_ENABLED=true      # Set false in production
AZURE_TENANT_ID=your-tenant-id
AZURE_CLIENT_ID=your-client-id

# Optional: Role mapping via Azure AD groups
AZURE_ADMIN_GROUP_IDS=group-id-1,group-id-2
AZURE_APPROVER_GROUP_IDS=group-id-3
```

#### Frontend (`frontend/.env`)

```env
REACT_APP_BACKEND_URL=http://localhost:8000
REACT_APP_AZURE_CLIENT_ID=your-client-id
REACT_APP_AZURE_TENANT_ID=your-tenant-id
REACT_APP_AZURE_REDIRECT_URI=http://localhost:3000
REACT_APP_AZURE_POST_LOGOUT_REDIRECT_URI=http://localhost:3000
```

### Step 5: Install Dependencies

```bash
# Backend
cd backend
pip install httpx

# Frontend
cd frontend
npm install @azure/msal-browser@^3.6.0 @azure/msal-react@^2.0.3
```

### Step 6: Test Locally

1. Start backend: `uvicorn server:app --host 0.0.0.0 --port 8000`
2. Start frontend: `npm start` (or `yarn start`)
3. Navigate to `http://localhost:3000/login`
4. Click **"Sign in with Microsoft"**
5. Authenticate with your corporate Microsoft account
6. On first login, a local user profile is automatically created

### SSO Behavior

| Config | Behavior |
|--------|----------|
| `SSO_ENABLED=true` + `DEV_MODE_LOGIN_ENABLED=true` | Both SSO and local login available |
| `SSO_ENABLED=true` + `DEV_MODE_LOGIN_ENABLED=false` | SSO only (production mode) |
| `SSO_ENABLED=false` | Local login only (original behavior) |

### Role Mapping Priority

1. **Azure AD App Roles** (if `roles` claim present in token)
2. **Azure AD Group membership** (if `AZURE_ADMIN_GROUP_IDS` / `AZURE_APPROVER_GROUP_IDS` configured)
3. **Default:** `user` role (admin can promote later)

### Logout Behavior

- Clears internal JWT from localStorage
- If SSO user: triggers MSAL logout popup to clear Microsoft session
- Redirects to login page

### Production Deployment Notes

- Set `DEV_MODE_LOGIN_ENABLED=false` to enforce SSO-only
- Update redirect URIs in Azure AD app registration to match production URLs
- Set `CORS_ORIGINS` to production frontend URL only
- Use HTTPS in production
- Tokens are stored in `sessionStorage` (cleared on tab close) for security

---

## Key API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Local user login (dev mode) |
| POST | `/api/auth/register` | User registration |
| POST | `/api/auth/sso/login` | Exchange Azure AD token for app token |
| GET | `/api/auth/sso/config` | Get SSO configuration (public) |
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
