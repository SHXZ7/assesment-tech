# Database Schema

Database: MongoDB Atlas

The schema is normalized for the MVP. Users and leaves are stored separately. Each leave document references the employee through `employeeId`.

## Collection: `users`

```json
{
  "_id": "ObjectId",
  "name": "Test Employee",
  "email": "employee@test.com",
  "password": "$2b$12$hashed-password",
  "department": "Engineering",
  "role": "employee",
  "createdAt": "2026-07-03T00:00:00Z"
}
```

### Fields

| Field | Type | Description |
| --- | --- | --- |
| `_id` | ObjectId | Primary key |
| `name` | string | User full name |
| `email` | string | Unique login email |
| `password` | string | bcrypt hash |
| `department` | string | Employee department |
| `role` | string | `employee` or `manager` |
| `createdAt` | datetime | User creation time |

### Indexes

| Index | Purpose |
| --- | --- |
| `email` unique | Prevent duplicate users and speed login lookup |

## Collection: `leaves`

```json
{
  "_id": "ObjectId",
  "employeeId": "64abc123...",
  "leaveType": "Annual",
  "startDate": "2026-07-10",
  "endDate": "2026-07-12",
  "reason": "Family Function",
  "status": "Pending",
  "managerComment": null,
  "createdAt": "2026-07-03T00:00:00Z",
  "updatedAt": "2026-07-03T00:00:00Z"
}
```

### Fields

| Field | Type | Description |
| --- | --- | --- |
| `_id` | ObjectId | Primary key |
| `employeeId` | string | References `users._id` |
| `leaveType` | string | Sick, Casual, Annual, Work From Home, Other |
| `startDate` | date | Leave start date |
| `endDate` | date | Leave end date |
| `reason` | string | Employee reason |
| `status` | string | Pending, Approved, Rejected |
| `managerComment` | string/null | Required when rejecting |
| `createdAt` | datetime | Request creation time |
| `updatedAt` | datetime | Last update time |

### Indexes

| Index | Purpose |
| --- | --- |
| `employeeId` | Fast employee leave history lookup |
| `status` | Fast manager pending/approved/rejected filtering |

## Relationships

```text
users._id 1 ---- many leaves.employeeId
```

Employees can have many leave requests. A leave request belongs to one employee.

## Business Constraints

- Passwords are stored only as bcrypt hashes.
- Employees can only access leaves where `leave.employeeId` matches their JWT user id.
- New leave requests always start with `Pending`.
- Only managers can change leave status.
- Only pending leaves can be edited, cancelled, approved, or rejected.
