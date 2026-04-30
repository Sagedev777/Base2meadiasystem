# 📋 Base2 Science and Media Academy — SMS Feature Tracker
> **Purpose:** This file tracks every feature of the School Management System.
> Any human or AI reviewer can check this file to confirm what has been designed,
> what is in progress, and what has NOT been built yet.
>
> **Legend:**
> - ✅ `DESIGNED` — Fully planned/documented in architecture
> - 🔨 `IN PROGRESS` — Currently being built
> - ❌ `NOT BUILT` — Needs to be developed
> - 🔒 `DECISION MADE` — User confirmed a design decision

---

## ⚙️ SYSTEM DECISIONS (Confirmed by User)

| # | Decision | Answer |
|---|---|---|
| 1 | Grading scale | Standard (90=A+, 80=A…) + final descriptive word |
| 2 | Descriptive grade words | Outstanding, Excellent, Good, Average, Poor, Failed, Worst |
| 3 | F- Grade | Yes — scores **below 30** get `F-` (Worst) |
| 4 | Notifications | Email only (WhatsApp only if API is free) |
| 5 | Campus support | **Single campus** only |
| 6 | Hosting | **cPanel server** (user-owned) |
| 7 | Frontend stack | React + Vite + TypeScript |
| 8 | Backend stack | Node.js + Fastify |
| 9 | Database | PostgreSQL |
| 10 | File storage | MinIO (S3-compatible, self-hosted) |

---

## 🎓 GRADING SCALE (Finalised)

| Score Range | Letter Grade | Grade Points | Descriptive Word |
|---|---|---|---|
| 90 – 100 | A+ | 4.0 | **Outstanding** |
| 80 – 89 | A | 3.7 | **Excellent** |
| 70 – 79 | B | 3.0 | **Good** |
| 60 – 69 | C | 2.0 | **Average** |
| 50 – 59 | D | 1.0 | **Poor** |
| 30 – 49 | F | 0.0 | **Failed** |
| 0 – 29 | F- | 0.0 | **Worst** |

---

## 🔐 MODULE 1: Authentication & Access Control

| # | Feature | Status | Notes |
|---|---|---|---|
| 1.1 | Login page (email + password) | ✅ DESIGNED | JWT-based |
| 1.2 | Role-based redirect after login | ✅ DESIGNED | Admin/Staff/Student/Parent |
| 1.3 | JWT Access Token (15 min expiry) | ✅ DESIGNED | |
| 1.4 | Refresh Token (HTTP-only cookie, 7 days) | ✅ DESIGNED | |
| 1.5 | Forgot password / reset via email | ❌ NOT BUILT | |
| 1.6 | Session timeout & auto-logout | ❌ NOT BUILT | |
| 1.7 | RBAC middleware on all API routes | ✅ DESIGNED | |
| 1.8 | Row-Level Security in PostgreSQL | ✅ DESIGNED | |
| 1.9 | Rate limiting (100 req/min public) | ✅ DESIGNED | |
| 1.10 | Audit log of all login attempts | ✅ DESIGNED | |

---

## 👨‍💼 MODULE 2: Administrator Portal

| # | Feature | Status | Notes |
|---|---|---|---|
| 2.1 | Admin dashboard with summary cards | ❌ NOT BUILT | Enrollment count, revenue, attendance |
| 2.2 | Enroll new student | ❌ NOT BUILT | |
| 2.3 | View all students list | ❌ NOT BUILT | Paginated, searchable, filterable |
| 2.4 | Edit student profile | ❌ NOT BUILT | |
| 2.5 | Withdraw / transfer student | ❌ NOT BUILT | |
| 2.6 | Upload student profile photo | ❌ NOT BUILT | |
| 2.7 | Create staff accounts | ❌ NOT BUILT | |
| 2.8 | Edit staff profiles | ❌ NOT BUILT | |
| 2.9 | Deactivate staff accounts | ❌ NOT BUILT | |
| 2.10 | Manage academic terms | ❌ NOT BUILT | Create/set current term |
| 2.11 | Manage classes | ❌ NOT BUILT | Create, assign students |
| 2.12 | Manage subjects | ❌ NOT BUILT | CRUD subjects |
| 2.13 | Assign subjects to teachers | ❌ NOT BUILT | |
| 2.14 | Set fee structures per term/class | ❌ NOT BUILT | |
| 2.15 | Record student payments | ❌ NOT BUILT | |
| 2.16 | View payment history | ❌ NOT BUILT | |
| 2.17 | View outstanding balances | ❌ NOT BUILT | |
| 2.18 | Generate payment invoices (PDF) | ❌ NOT BUILT | |
| 2.19 | Financial summary report | ❌ NOT BUILT | |
| 2.20 | View full audit logs | ❌ NOT BUILT | |
| 2.21 | Enrollment analytics chart | ❌ NOT BUILT | |
| 2.22 | Attendance heatmap overview | ❌ NOT BUILT | |
| 2.23 | Export student list (CSV/PDF) | ❌ NOT BUILT | |

---

## 👩‍🏫 MODULE 3: Staff / Teacher Portal

| # | Feature | Status | Notes |
|---|---|---|---|
| 3.1 | Staff dashboard | ❌ NOT BUILT | My classes, upcoming schedule |
| 3.2 | View assigned classes & subjects | ❌ NOT BUILT | |
| 3.3 | View student roster per class | ❌ NOT BUILT | |
| 3.4 | Enter grades per student per subject | ❌ NOT BUILT | |
| 3.5 | Auto-calculate letter grade on score entry | ✅ DESIGNED | PostgreSQL generated columns |
| 3.6 | Auto-calculate descriptive word on score | ✅ DESIGNED | |
| 3.7 | Auto-calculate GPA per student | ✅ DESIGNED | Materialized view |
| 3.8 | Bulk grade upload via CSV | ❌ NOT BUILT | |
| 3.9 | Edit previously entered grades | ❌ NOT BUILT | |
| 3.10 | Daily attendance check-in | ❌ NOT BUILT | Mark Present/Absent/Late/Excused |
| 3.11 | Prevent duplicate attendance entry | ✅ DESIGNED | DB UNIQUE constraint |
| 3.12 | View attendance history per class | ❌ NOT BUILT | Filterable by date |
| 3.13 | View attendance history per student | ❌ NOT BUILT | |
| 3.14 | Generate report card per student | ❌ NOT BUILT | Printable PDF |
| 3.15 | Generate class report card batch | ❌ NOT BUILT | |
| 3.16 | View class grade summary | ❌ NOT BUILT | Average, highest, lowest score |

---

## 🎒 MODULE 4: Student Portal

| # | Feature | Status | Notes |
|---|---|---|---|
| 4.1 | Student dashboard | ❌ NOT BUILT | Welcome, term overview |
| 4.2 | View own profile & details | ❌ NOT BUILT | |
| 4.3 | View enrolled courses | ❌ NOT BUILT | |
| 4.4 | View grades per subject | ❌ NOT BUILT | Score + letter + descriptive word |
| 4.5 | View overall GPA | ❌ NOT BUILT | |
| 4.6 | View grade trend chart over terms | ❌ NOT BUILT | Line chart |
| 4.7 | View own attendance record | ❌ NOT BUILT | |
| 4.8 | View own attendance percentage | ❌ NOT BUILT | |
| 4.9 | View class leaderboard (Top Students) | ❌ NOT BUILT | Ranked by GPA |
| 4.10 | View own class rank | ❌ NOT BUILT | |
| 4.11 | Download personal report card (PDF) | ❌ NOT BUILT | |

---

## 👪 MODULE 5: Parent Portal

| # | Feature | Status | Notes |
|---|---|---|---|
| 5.1 | Parent dashboard | ❌ NOT BUILT | Child's summary card |
| 5.2 | View child's profile & basic info | ❌ NOT BUILT | |
| 5.3 | View child's enrolled courses | ❌ NOT BUILT | |
| 5.4 | View child's grades per subject | ❌ NOT BUILT | Score + letter + descriptive word |
| 5.5 | View child's overall GPA | ❌ NOT BUILT | |
| 5.6 | View child's grade trend chart | ❌ NOT BUILT | |
| 5.7 | View child's attendance summary | ❌ NOT BUILT | % present, # absences |
| 5.8 | View child's class rank | ❌ NOT BUILT | |
| 5.9 | Receive email alert on new grade | ❌ NOT BUILT | |
| 5.10 | Receive email alert on absence | ❌ NOT BUILT | |

---

## 🔔 MODULE 6: Notifications

| # | Feature | Status | Notes |
|---|---|---|---|
| 6.1 | Email notification system | ✅ DESIGNED | Nodemailer + SMTP |
| 6.2 | Email on student absence | ❌ NOT BUILT | Triggers on attendance entry |
| 6.3 | Email on grade published | ❌ NOT BUILT | |
| 6.4 | Email on payment received | ❌ NOT BUILT | |
| 6.5 | Email on password reset | ❌ NOT BUILT | |
| 6.6 | WhatsApp notifications | 🔒 DECISION MADE | Only if free API available |
| 6.7 | In-app notification bell | ❌ NOT BUILT | |

---

## 🗄️ MODULE 7: Database & Backend

| # | Feature | Status | Notes |
|---|---|---|---|
| 7.1 | `users` table | ✅ DESIGNED | |
| 7.2 | `student_profiles` table | ✅ DESIGNED | |
| 7.3 | `staff_profiles` table | ✅ DESIGNED | |
| 7.4 | `parent_profiles` table | ✅ DESIGNED | |
| 7.5 | `terms` table | ✅ DESIGNED | |
| 7.6 | `classes` table | ✅ DESIGNED | |
| 7.7 | `subjects` table | ✅ DESIGNED | |
| 7.8 | `class_subjects` table | ✅ DESIGNED | |
| 7.9 | `grades` table + generated columns | ✅ DESIGNED | letter_grade, grade_points auto-calculated |
| 7.10 | Descriptive word column on grades | ✅ DESIGNED | Outstanding → Worst |
| 7.11 | `attendance` table | ✅ DESIGNED | UNIQUE per student+class+date |
| 7.12 | `fee_structures` table | ✅ DESIGNED | |
| 7.13 | `payments` table | ✅ DESIGNED | |
| 7.14 | `audit_logs` table | ✅ DESIGNED | |
| 7.15 | `student_gpa_summary` materialized view | ✅ DESIGNED | With RANK() |
| 7.16 | Performance indexes | ✅ DESIGNED | |
| 7.17 | DB migrations (Drizzle) | ❌ NOT BUILT | |
| 7.18 | API routes — Auth | ❌ NOT BUILT | |
| 7.19 | API routes — Students | ❌ NOT BUILT | |
| 7.20 | API routes — Staff | ❌ NOT BUILT | |
| 7.21 | API routes — Grades | ❌ NOT BUILT | |
| 7.22 | API routes — Attendance | ❌ NOT BUILT | |
| 7.23 | API routes — Financials | ❌ NOT BUILT | |
| 7.24 | API routes — Reports | ❌ NOT BUILT | |
| 7.25 | Background job queue (BullMQ) | ❌ NOT BUILT | For emails & PDF generation |
| 7.26 | PDF report card generator | ❌ NOT BUILT | |
| 7.27 | CSV import handler | ❌ NOT BUILT | For bulk grade upload |

---

## 🔐 MODULE 8: Security

| # | Feature | Status | Notes |
|---|---|---|---|
| 8.1 | Bcrypt password hashing | ✅ DESIGNED | |
| 8.2 | TLS/HTTPS via cPanel SSL | ✅ DESIGNED | cPanel Let's Encrypt |
| 8.3 | JWT middleware on all routes | ✅ DESIGNED | |
| 8.4 | CORS whitelist | ✅ DESIGNED | |
| 8.5 | Rate limiting | ✅ DESIGNED | |
| 8.6 | Input validation (Zod) | ✅ DESIGNED | |
| 8.7 | SQL injection prevention | ✅ DESIGNED | Drizzle ORM only |
| 8.8 | File upload validation | ✅ DESIGNED | MIME type + size limit |
| 8.9 | Audit log on all mutations | ✅ DESIGNED | |
| 8.10 | Environment secrets management | ✅ DESIGNED | .env files, not in source |

---

## 🚀 MODULE 9: Infrastructure & Deployment (cPanel)

| # | Feature | Status | Notes |
|---|---|---|---|
| 9.1 | React frontend build for cPanel | ❌ NOT BUILT | `npm run build` → public_html |
| 9.2 | Node.js backend on cPanel | ❌ NOT BUILT | cPanel Node.js App setup |
| 9.3 | PostgreSQL on cPanel | ❌ NOT BUILT | via cPanel DB tools |
| 9.4 | Redis on cPanel | ❌ NOT BUILT | May need VPS add-on |
| 9.5 | Nginx proxy config | ❌ NOT BUILT | cPanel may use Apache |
| 9.6 | SSL certificate setup | ❌ NOT BUILT | cPanel AutoSSL (Let's Encrypt) |
| 9.7 | Environment variable config | ❌ NOT BUILT | |
| 9.8 | DB backup strategy | ❌ NOT BUILT | cPanel scheduled backups |
| 9.9 | CI/CD pipeline | ❌ NOT BUILT | Optional — GitHub Actions |

---

## 📊 PROGRESS SUMMARY

| Module | Total Features | ✅ Designed | 🔨 In Progress | ❌ Not Built |
|---|---|---|---|---|
| Auth & Access | 10 | 9 | 0 | 1 |
| Admin Portal | 23 | 0 | 0 | 23 |
| Staff Portal | 16 | 4 | 0 | 12 |
| Student Portal | 11 | 0 | 0 | 11 |
| Parent Portal | 10 | 0 | 0 | 10 |
| Notifications | 7 | 2 | 0 | 5 |
| Database & Backend | 27 | 16 | 0 | 11 |
| Security | 10 | 10 | 0 | 0 |
| Infrastructure | 9 | 0 | 0 | 9 |
| **TOTAL** | **123** | **41** | **0** | **82** |

> **Overall Completion: 33% designed — 0% built — 67% remaining**

---

## 🗓️ RECOMMENDED BUILD ORDER

1. **Phase 1** — Auth system + DB schema + migrations
2. **Phase 2** — Admin portal (students, staff, classes, terms)
3. **Phase 3** — Staff portal (grading + attendance)
4. **Phase 4** — Student portal (grades, leaderboard, attendance)
5. **Phase 5** — Parent portal (child view)
6. **Phase 6** — Financials (fees, payments, invoices)
7. **Phase 7** — Notifications (email alerts)
8. **Phase 8** — Reports & PDF generation
9. **Phase 9** — Deployment to cPanel server

---
*Last updated: 2026-04-23 | Reviewer: AI / Human*
