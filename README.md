# Leave Management System

Full-stack Employee Leave Management MVP built for the Proteccio Data Full Stack Developer Intern assessment.

The application lets employees apply for leave, track leave status, edit/cancel pending requests, and lets managers review, approve, or reject leave requests with comments.

## Features

- Email/password login
- JWT authentication
- Role-based access control for `employee` and `manager`
- Employee dashboard with request totals and recent activity
- Apply leave with validation
- Leave history with search and filters
- Edit/cancel pending leave requests
- Manager dashboard with approval metrics
- Pending request review workflow
- Approve/reject leave requests
- Rejection comments
- Employee search and leave history for managers
- Responsive Next.js interface
- MongoDB Atlas persistence
- Seeded demo users

## Technology Stack

| Layer | Technology |
| --- | --- |
| Frontend | Next.js, React, Axios, CSS |
| Backend | FastAPI, Python |
| Database | MongoDB Atlas |
| Auth | JWT, bcrypt |
| Validation | Pydantic |
| API Docs | FastAPI OpenAPI/Swagger, markdown docs, Postman collection |

## Folder Structure

```text
darexai/
  backend/
    app/
      auth/
      models/
      routes/
      schemas/
      services/
      utils/
      database.py
      main.py
      seed.py
    tests/
    requirements.txt
  frontend/
    app/
    package.json
  database/
    schema.md
  docs/
    API.md
  postman/
    leave-management.postman_collection.json
  .env.example
  README.md
```

## Environment Variables

Create `.env` in the project root:

```env
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-url>/
MONGODB_DB_NAME=darexai
JWT_SECRET_KEY=replace-with-a-long-random-secret
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=60
```

For the frontend, optionally create `frontend/.env.local`:

```env
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000
```

## Backend Setup

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Backend runs at:

```text
http://127.0.0.1:8000
```

Swagger/OpenAPI docs:

```text
http://127.0.0.1:8000/docs
```

## Database Setup

The app uses MongoDB Atlas. Collections are created automatically when data is inserted.

Seed demo users:

```bash
cd backend
python -m app.seed
```

## Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at:

```text
http://localhost:3000
```

## Sample Login Credentials

| Role | Email | Password |
| --- | --- | --- |
| Employee | employee@test.com | employee123 |
| Manager | manager@test.com | manager123 |

## API Documentation

- Swagger: `http://127.0.0.1:8000/docs`
- Markdown docs: [docs/API.md](docs/API.md)
- Postman collection: [postman/leave-management.postman_collection.json](postman/leave-management.postman_collection.json)

## Running Tests

```bash
cd backend
pytest
```

The current tests cover password hashing, JWT payload extraction, and leave request validation.

## Assumptions

- There is no registration page because the assessment allows seeded users.
- Managers can view all employee leave requests.
- Employees can only view, edit, or cancel their own leave requests.
- Only pending leaves can be edited, cancelled, approved, or rejected.
- Leave balance calculation is outside the MVP scope.

## Known Limitations

- No refresh token flow.
- No email notifications.
- No pagination yet.
- No Docker setup.
- Test coverage is intentionally minimal for the MVP.
- Employee profile page is not implemented because it was listed as suggested, not required.

## Future Enhancements

- JWT refresh tokens
- Pagination for leave tables
- Audit log collection for approvals/rejections
- Leave balance calculation
- Email notifications
- Docker Compose setup
- CI workflow with automated tests
- Expanded unit and integration tests
