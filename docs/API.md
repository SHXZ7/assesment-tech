# API Documentation

Base URL:

```text
http://127.0.0.1:8000
```

Protected endpoints require:

```http
Authorization: Bearer <JWT>
```

## Authentication

### POST `/auth/login`

Logs in an employee or manager.

Request:

```json
{
  "email": "employee@test.com",
  "password": "employee123"
}
```

Response `200`:

```json
{
  "access_token": "eyJhbGciOi...",
  "token_type": "bearer",
  "role": "employee"
}
```

Errors:

- `400` invalid body
- `401` invalid email or password

### POST `/auth/logout`

Client-side logout helper endpoint.

Response `200`:

```json
{
  "message": "Logout service endpoint"
}
```

## Employee Leave APIs

### GET `/leaves/dashboard`

Returns dashboard totals for the logged-in employee.

Auth: employee

Response `200`:

```json
{
  "total": 12,
  "approved": 7,
  "pending": 3,
  "rejected": 2,
  "recent": []
}
```

### GET `/leaves`

Returns only the logged-in employee's leave requests.

Auth: employee

Query parameters:

- `search`: leave type or reason
- `status`: `Pending`, `Approved`, `Rejected`
- `type`: `Sick`, `Casual`, `Annual`, `Work From Home`, `Other`

Example:

```text
GET /leaves?status=Pending&type=Annual
```

### POST `/leaves`

Creates a leave request. `employeeId`, `status`, `createdAt`, and `updatedAt` are added by the backend.

Auth: employee

Request:

```json
{
  "leaveType": "Annual",
  "startDate": "2026-07-10",
  "endDate": "2026-07-12",
  "reason": "Family Function"
}
```

Response:

- `201` leave created
- `400` invalid input
- `401` missing/invalid token
- `403` wrong role

### GET `/leaves/{leave_id}`

Employees can view their own leave. Managers can review any leave.

Response:

- `200` leave details
- `400` invalid leave id
- `401` missing/invalid token
- `404` leave not found

### PUT `/leaves/{leave_id}`

Updates a pending leave request. Employees cannot change status.

Auth: employee

Request:

```json
{
  "leaveType": "Sick",
  "startDate": "2026-07-10",
  "endDate": "2026-07-11",
  "reason": "Fever"
}
```

Errors:

- `403` if leave is not pending
- `404` if leave does not belong to employee or does not exist

### DELETE `/leaves/{leave_id}`

Cancels a pending leave request.

Auth: employee

Response `200`:

```json
{
  "message": "Leave request cancelled successfully."
}
```

Error `403`:

```json
{
  "detail": "Only pending leave requests can be cancelled."
}
```

## Manager APIs

### GET `/manager/dashboard`

Auth: manager

Response `200`:

```json
{
  "totalEmployees": 25,
  "pending": 8,
  "approved": 32,
  "rejected": 5,
  "recent": []
}
```

### GET `/manager/pending`

Returns all pending leave requests.

Auth: manager

### GET `/manager/leaves`

Filters leave requests for managers.

Query parameters:

- `status`: `Pending`, `Approved`, `Rejected`
- `department`: department name

### PUT `/manager/approve/{leave_id}`

Approves a pending leave.

Auth: manager

Errors:

- `403` if leave is not pending
- `404` if leave is missing

### PUT `/manager/reject/{leave_id}`

Rejects a pending leave and stores manager comment.

Auth: manager

Request:

```json
{
  "comment": "Project deadline this week."
}
```

### GET `/manager/search`

Searches employees.

Auth: manager

Query parameters:

- `name`
- `email`
- `department`

### GET `/manager/employee/{employee_id}/history`

Returns one employee and their leave history.

Auth: manager

## Common Status Codes

| Code | Meaning |
| --- | --- |
| 200 | Success |
| 201 | Created |
| 400 | Bad input |
| 401 | Missing/invalid credentials or token |
| 403 | Forbidden role or business rule violation |
| 404 | Resource not found |
| 500 | Server error |
