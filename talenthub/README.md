# TalentHub CRM

A hiring management platform for tracking candidates, job postings, applications, and interview feedback.

---

## Prerequisites

| Tool | Version |
|------|---------|
| Node.js | 18+ |
| npm | 9+ |
| MongoDB | 6+ (local) |

---

## Setup

### 1. Clone the repository

```bash
git clone <repository-url>
cd talenthub
```

### 2. Install dependencies

```bash
# Install root, backend, and frontend dependencies
npm run install:all
```

Or manually:

```bash
npm install
cd backend && npm install
cd ../frontend && npm install
```

### 3. Configure environment

The backend uses a `.env` file at `backend/.env`. A default one is already included:

```
PORT=5000
MONGO_URI=mongodb://localhost:27017/talenthub
JWT_SECRET=talenthub_jwt_secret_key_2024
```

> Ensure MongoDB is running locally on port 27017 before starting.

### 4. Seed the database

```bash
cd backend
node scripts/seed.js
```

This will populate:
- 8 users (1 admin, 3 recruiters, 4 interviewers)
- 2,000 candidates
- 100 job postings
- ~5,000 applications
- ~500–1,500 interview notes

> **This may take 1–3 minutes depending on your machine.**

### 5. Start the application

From the root directory:

```bash
npm run dev
```

This runs both the backend (port 5000) and frontend (port 5173) concurrently.

Or start them separately:

```bash
# Terminal 1 — Backend
cd backend && npm run dev

# Terminal 2 — Frontend
cd frontend && npm run dev
```

---

## Login

| Field    | Value                |
|----------|----------------------|
| Email    | admin@example.com    |
| Password | password123          |

---

## Application URLs

| Service  | URL                        |
|----------|----------------------------|
| Frontend | http://localhost:5173       |
| Backend  | http://localhost:5000       |
| API Base | http://localhost:5000/api   |

---

## Project Structure

```
talenthub/
├── backend/
│   ├── config/          # Database connection
│   ├── controllers/     # Route handlers
│   ├── middleware/      # Auth middleware
│   ├── models/          # Mongoose models
│   ├── routes/          # Express routes
│   ├── scripts/         # Seed script
│   ├── .env
│   └── server.js
├── frontend/
│   ├── public/
│   └── src/
│       ├── api/         # Axios instance
│       ├── components/  # Layout components
│       ├── context/     # Auth context
│       └── pages/       # Page components
├── package.json
└── README.md
```

---

## API Endpoints

### Auth
| Method | Endpoint          | Description  |
|--------|-------------------|--------------|
| POST   | /api/auth/login   | Login        |
| GET    | /api/auth/me      | Current user |

### Candidates
| Method | Endpoint                   | Description           |
|--------|----------------------------|-----------------------|
| GET    | /api/candidates            | List candidates       |
| POST   | /api/candidates            | Create candidate      |
| GET    | /api/candidates/:id        | Get candidate         |
| PUT    | /api/candidates/:id        | Update candidate      |
| DELETE | /api/candidates/:id        | Delete candidate      |
| GET    | /api/candidates/search     | Search candidates     |

### Jobs
| Method | Endpoint                   | Description           |
|--------|----------------------------|-----------------------|
| GET    | /api/jobs                  | List jobs             |
| POST   | /api/jobs                  | Create job            |
| GET    | /api/jobs/:id              | Get job               |
| PUT    | /api/jobs/:id              | Update job            |
| DELETE | /api/jobs/:id              | Delete job            |
| GET    | /api/jobs/departments      | Get departments list  |

### Applications
| Method | Endpoint                        | Description           |
|--------|---------------------------------|-----------------------|
| GET    | /api/applications               | List applications     |
| POST   | /api/applications               | Create application    |
| GET    | /api/applications/:id           | Get application       |
| PATCH  | /api/applications/:id/status    | Update status         |

### Notes
| Method | Endpoint           | Description        |
|--------|--------------------|--------------------|
| GET    | /api/notes         | List notes         |
| POST   | /api/notes         | Create note        |
| PUT    | /api/notes/:id     | Update note        |
| DELETE | /api/notes/:id     | Delete note        |

---

## Tech Stack

**Frontend:** React 19, Vite, React Router, Material UI, Axios  
**Backend:** Node.js, Express, MongoDB, Mongoose, JWT

---

## Scripts

| Command              | Description                             |
|----------------------|-----------------------------------------|
| `npm run dev`        | Start both frontend and backend         |
| `npm run install:all`| Install all dependencies                |
| `cd backend && node scripts/seed.js` | Seed the database      |
