# WheelSync — Fleet Management System

Academic project for the course **УСЖЦНС** (IX semester), ФИНКИ
Student: Stefan Vasilev, index **259082**

---

## Overview

WheelSync is a multi-tenant fleet management system that allows companies to manage their vehicle fleets, track mileage and fuel usage, schedule maintenance, report defects, and generate detailed reports.

### Roles
| Role | Description |
|------|-------------|
| `ADMIN` | Platform administrator — manages companies and all users |
| `FLEET_MANAGER` | Company-level manager — manages vehicles, assignments, service records |
| `DRIVER` | Assigned driver — logs mileage/fuel, reports defects |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Spring Boot 3.2, Java 17, Spring Security + JWT |
| Frontend | Angular 17+, Angular Material, standalone components |
| Database | PostgreSQL 15+ |
| Auth | JWT (24 h expiry), bcrypt password hashing |
| File storage | Local filesystem (`./uploads/`) |

---

## Project Structure

```
wheelsync-backend/    ← Spring Boot REST API
wheelsync-frontend/   ← Angular SPA
```

---

## Prerequisites

- **Java 17+**
- **Node.js 18+** and **npm**
- **PostgreSQL 15+**

---

## Backend Setup

### 1. Create the database

```sql
CREATE DATABASE wheelsync;
CREATE USER wheelsync_user WITH PASSWORD 'yourpassword';
GRANT ALL PRIVILEGES ON DATABASE wheelsync TO wheelsync_user;
```

### 2. Configure `application.properties`

Edit `wheelsync-backend/src/main/resources/application.properties`:

```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/wheelsync
spring.datasource.username=wheelsync_user
spring.datasource.password=yourpassword

spring.jpa.hibernate.ddl-auto=update

app.jwt.secret=your-very-long-secret-key-here
app.jwt.expiration=86400000

app.file-storage.location=./uploads
```

### 3. Run the backend

```bash
cd wheelsync-backend
./mvnw spring-boot:run
```

The API will be available at `http://localhost:8080`.

### Default Admin Account

On first startup a default admin is created automatically:

| Field | Value |
|-------|-------|
| Email | `admin@wheelsync.com` |
| Password | `Admin123!` |

> Change the admin password after first login.

---

## Frontend Setup

### 1. Install dependencies

```bash
cd wheelsync-frontend
npm install
```

### 2. Configure environment

Edit `src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api'
};
```

### 3. Run the frontend

```bash
npm start
```

The app will open at `http://localhost:4200`.

### 4. Build for production

```bash
npm run build
```

Output is placed in `dist/wheelsync-frontend/`.

---

## Key Features

### Authentication
- Register, login, forgot password, reset password via email token
- JWT stored in localStorage, auto-attached via HTTP interceptor

### Vehicle Management
- Create, edit, soft-delete vehicles
- Assign/unassign drivers
- View full vehicle history (service records, fuel logs, mileage, defects) per vehicle

### Mileage & Fuel Logging
- Drivers log trips with start/end mileage; automatic distance calculation
- Fuel log entries track liters, price, and compute consumption (L/100 km)
- Both validated against current vehicle mileage (cannot enter value below current odometer)

### Service Records & Documents
- Fleet managers record maintenance (oil change, inspection, brakes, etc.)
- Attach PDF/JPG/PNG documents up to 10 MB per record

### Defect Tracking
- Drivers report defects with title, description, priority, and optional photo
- Fleet managers update status (Open → In Progress → Resolved)
- Status change triggers email notification to the reporting driver
- Resolved defects can be linked to a service record

### Maintenance Reminders
- Create reminders by mileage threshold or date; dashboard shows overdue/upcoming

### Statistics & Reports
- **Monthly cost chart** — fuel vs. service cost over the last 12 months
- **Service type distribution** — cost breakdown by service type (doughnut)
- **Fuel consumption** — average L/100 km per vehicle (bar chart)
- **Detailed vehicle report** — full history (all services, fuel logs, mileage, defects) with **PDF export**

---

## API Overview

All endpoints are prefixed with `/api`.

| Resource | Base Path |
|----------|-----------|
| Auth | `/api/auth` |
| Vehicles | `/api/vehicles` |
| Mileage Logs | `/api/mileage-logs` |
| Fuel Logs | `/api/fuel-logs` |
| Service Records | `/api/service-records` |
| Defects | `/api/defects` |
| Reminders | `/api/reminders` |
| Statistics | `/api/stats` |
| Vehicle Report | `/api/vehicles/{id}/report` |
| Companies (Admin) | `/api/admin/companies` |
| Users (Admin) | `/api/admin/users` |

Authentication header: `Authorization: Bearer <token>`

---

## File Uploads

Files are stored under `./uploads/` relative to the backend working directory:

```
uploads/
  service-documents/{recordId}/
  defects/{defectId}/
```

Allowed types: **PDF, JPG, PNG** — maximum **10 MB**.

---

## Multi-tenancy

Each company's data is fully isolated. Fleet managers and drivers can only see vehicles, logs, and defects that belong to their own company. Admins have cross-company access.
