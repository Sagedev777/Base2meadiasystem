"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.refreshTokens = exports.auditLogs = exports.attendance = exports.grades = exports.classSubjects = exports.subjects = exports.parentProfiles = exports.staffProfiles = exports.studentProfiles = exports.classes = exports.terms = exports.users = exports.attendanceStatusEnum = exports.statusEnum = exports.roleEnum = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const uuid_1 = require("uuid");
exports.roleEnum = (0, pg_core_1.pgEnum)('role', ['admin', 'staff', 'student', 'parent']);
exports.statusEnum = (0, pg_core_1.pgEnum)('status', ['active', 'inactive', 'graduated', 'withdrawn']);
exports.attendanceStatusEnum = (0, pg_core_1.pgEnum)('attendance_status', ['present', 'absent', 'late', 'excused']);
exports.users = (0, pg_core_1.pgTable)('users', {
    id: (0, pg_core_1.varchar)('id', { length: 36 }).primaryKey().$defaultFn(() => (0, uuid_1.v4)()),
    email: (0, pg_core_1.varchar)('email', { length: 255 }).unique().notNull(),
    passwordHash: (0, pg_core_1.text)('password_hash').notNull(),
    role: (0, exports.roleEnum)('role').notNull(),
    name: (0, pg_core_1.varchar)('name', { length: 255 }).notNull(),
    isActive: (0, pg_core_1.boolean)('is_active').default(true),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow(),
});
exports.terms = (0, pg_core_1.pgTable)('terms', {
    id: (0, pg_core_1.varchar)('id', { length: 36 }).primaryKey().$defaultFn(() => (0, uuid_1.v4)()),
    name: (0, pg_core_1.varchar)('name', { length: 100 }).notNull(),
    startDate: (0, pg_core_1.date)('start_date').notNull(),
    endDate: (0, pg_core_1.date)('end_date').notNull(),
    isCurrent: (0, pg_core_1.boolean)('is_current').default(false),
});
exports.classes = (0, pg_core_1.pgTable)('classes', {
    id: (0, pg_core_1.varchar)('id', { length: 36 }).primaryKey().$defaultFn(() => (0, uuid_1.v4)()),
    name: (0, pg_core_1.varchar)('name', { length: 100 }).notNull(),
    termId: (0, pg_core_1.varchar)('term_id', { length: 36 }).references(() => exports.terms.id),
    capacity: (0, pg_core_1.integer)('capacity').default(40),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow(),
});
exports.studentProfiles = (0, pg_core_1.pgTable)('student_profiles', {
    id: (0, pg_core_1.varchar)('id', { length: 36 }).primaryKey().$defaultFn(() => (0, uuid_1.v4)()),
    userId: (0, pg_core_1.varchar)('user_id', { length: 36 }).references(() => exports.users.id, { onDelete: 'cascade' }),
    studentId: (0, pg_core_1.varchar)('student_id', { length: 20 }).unique().notNull(),
    firstName: (0, pg_core_1.varchar)('first_name', { length: 100 }).notNull(),
    lastName: (0, pg_core_1.varchar)('last_name', { length: 100 }).notNull(),
    dateOfBirth: (0, pg_core_1.date)('date_of_birth'),
    gender: (0, pg_core_1.varchar)('gender', { length: 10 }),
    address: (0, pg_core_1.text)('address'),
    phone: (0, pg_core_1.varchar)('phone', { length: 20 }),
    enrollmentDate: (0, pg_core_1.date)('enrollment_date').notNull(),
    status: (0, exports.statusEnum)('status').default('active'),
    classId: (0, pg_core_1.varchar)('class_id', { length: 36 }).references(() => exports.classes.id),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow(),
});
exports.staffProfiles = (0, pg_core_1.pgTable)('staff_profiles', {
    id: (0, pg_core_1.varchar)('id', { length: 36 }).primaryKey().$defaultFn(() => (0, uuid_1.v4)()),
    userId: (0, pg_core_1.varchar)('user_id', { length: 36 }).references(() => exports.users.id, { onDelete: 'cascade' }),
    staffId: (0, pg_core_1.varchar)('staff_id', { length: 20 }).unique().notNull(),
    firstName: (0, pg_core_1.varchar)('first_name', { length: 100 }).notNull(),
    lastName: (0, pg_core_1.varchar)('last_name', { length: 100 }).notNull(),
    department: (0, pg_core_1.varchar)('department', { length: 100 }),
    phone: (0, pg_core_1.varchar)('phone', { length: 20 }),
    hireDate: (0, pg_core_1.date)('hire_date'),
});
exports.parentProfiles = (0, pg_core_1.pgTable)('parent_profiles', {
    id: (0, pg_core_1.varchar)('id', { length: 36 }).primaryKey().$defaultFn(() => (0, uuid_1.v4)()),
    userId: (0, pg_core_1.varchar)('user_id', { length: 36 }).references(() => exports.users.id, { onDelete: 'cascade' }),
    firstName: (0, pg_core_1.varchar)('first_name', { length: 100 }),
    lastName: (0, pg_core_1.varchar)('last_name', { length: 100 }),
    phone: (0, pg_core_1.varchar)('phone', { length: 20 }),
    studentId: (0, pg_core_1.varchar)('student_id', { length: 36 }).references(() => exports.studentProfiles.id),
});
exports.subjects = (0, pg_core_1.pgTable)('subjects', {
    id: (0, pg_core_1.varchar)('id', { length: 36 }).primaryKey().$defaultFn(() => (0, uuid_1.v4)()),
    name: (0, pg_core_1.varchar)('name', { length: 100 }).notNull(),
    code: (0, pg_core_1.varchar)('code', { length: 20 }).unique().notNull(),
});
exports.classSubjects = (0, pg_core_1.pgTable)('class_subjects', {
    id: (0, pg_core_1.varchar)('id', { length: 36 }).primaryKey().$defaultFn(() => (0, uuid_1.v4)()),
    classId: (0, pg_core_1.varchar)('class_id', { length: 36 }).references(() => exports.classes.id),
    subjectId: (0, pg_core_1.varchar)('subject_id', { length: 36 }).references(() => exports.subjects.id),
    staffId: (0, pg_core_1.varchar)('staff_id', { length: 36 }).references(() => exports.staffProfiles.id),
    termId: (0, pg_core_1.varchar)('term_id', { length: 36 }).references(() => exports.terms.id),
}, (t) => ({
    unq: (0, pg_core_1.uniqueIndex)('class_subject_term_idx').on(t.classId, t.subjectId, t.termId),
}));
exports.grades = (0, pg_core_1.pgTable)('grades', {
    id: (0, pg_core_1.varchar)('id', { length: 36 }).primaryKey().$defaultFn(() => (0, uuid_1.v4)()),
    studentId: (0, pg_core_1.varchar)('student_id', { length: 36 }).references(() => exports.studentProfiles.id),
    classSubjectId: (0, pg_core_1.varchar)('class_subject_id', { length: 36 }).references(() => exports.classSubjects.id),
    score: (0, pg_core_1.numeric)('score', { precision: 5, scale: 2 }).notNull(),
    remarks: (0, pg_core_1.text)('remarks'),
    recordedBy: (0, pg_core_1.varchar)('recorded_by', { length: 36 }).references(() => exports.staffProfiles.id),
    recordedAt: (0, pg_core_1.timestamp)('recorded_at').defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow(),
});
exports.attendance = (0, pg_core_1.pgTable)('attendance', {
    id: (0, pg_core_1.varchar)('id', { length: 36 }).primaryKey().$defaultFn(() => (0, uuid_1.v4)()),
    studentId: (0, pg_core_1.varchar)('student_id', { length: 36 }).references(() => exports.studentProfiles.id),
    classId: (0, pg_core_1.varchar)('class_id', { length: 36 }).references(() => exports.classes.id),
    date: (0, pg_core_1.date)('date').notNull(),
    status: (0, exports.attendanceStatusEnum)('status').notNull(),
    checkedBy: (0, pg_core_1.varchar)('checked_by', { length: 36 }).references(() => exports.staffProfiles.id),
    notes: (0, pg_core_1.text)('notes'),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow(),
}, (t) => ({
    unq: (0, pg_core_1.uniqueIndex)('student_class_date_idx').on(t.studentId, t.classId, t.date),
}));
exports.auditLogs = (0, pg_core_1.pgTable)('audit_logs', {
    id: (0, pg_core_1.varchar)('id', { length: 36 }).primaryKey().$defaultFn(() => (0, uuid_1.v4)()),
    userId: (0, pg_core_1.varchar)('user_id', { length: 36 }).references(() => exports.users.id, { onDelete: 'set null' }),
    action: (0, pg_core_1.varchar)('action', { length: 50 }).notNull(),
    module: (0, pg_core_1.varchar)('module', { length: 50 }).notNull(),
    details: (0, pg_core_1.text)('details'),
    ipAddress: (0, pg_core_1.varchar)('ip_address', { length: 45 }),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow(),
});
exports.refreshTokens = (0, pg_core_1.pgTable)('refresh_tokens', {
    id: (0, pg_core_1.varchar)('id', { length: 36 }).primaryKey().$defaultFn(() => (0, uuid_1.v4)()),
    userId: (0, pg_core_1.varchar)('user_id', { length: 36 }).references(() => exports.users.id, { onDelete: 'cascade' }).notNull(),
    token: (0, pg_core_1.varchar)('token', { length: 512 }).unique().notNull(),
    expiresAt: (0, pg_core_1.timestamp)('expires_at').notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow(),
});
