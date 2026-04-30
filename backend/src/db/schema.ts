import { mysqlTable, varchar, text, timestamp, boolean, mysqlEnum, int, decimal, date, uniqueIndex, longtext } from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

export const users = mysqlTable('users', {
  id: varchar('id', { length: 36 }).primaryKey().$defaultFn(() => uuidv4()),
  email: varchar('email', { length: 255 }).unique().notNull(),
  passwordHash: text('password_hash').notNull(),
  role: mysqlEnum('role', ['admin', 'staff', 'student', 'parent']).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const terms = mysqlTable('terms', {
  id: varchar('id', { length: 36 }).primaryKey().$defaultFn(() => uuidv4()),
  name: varchar('name', { length: 100 }).notNull(),
  startDate: date('start_date', { mode: 'string' }).notNull(),
  endDate: date('end_date', { mode: 'string' }).notNull(),
  isCurrent: boolean('is_current').default(false),
});

export const classes = mysqlTable('classes', {
  id: varchar('id', { length: 36 }).primaryKey().$defaultFn(() => uuidv4()),
  name: varchar('name', { length: 100 }).notNull(),
  termId: varchar('term_id', { length: 36 }).references(() => terms.id),
  capacity: int('capacity').default(40),
  createdAt: timestamp('created_at').defaultNow(),
});

export const studentProfiles = mysqlTable('student_profiles', {
  id: varchar('id', { length: 36 }).primaryKey().$defaultFn(() => uuidv4()),
  userId: varchar('user_id', { length: 36 }).references(() => users.id, { onDelete: 'cascade' }),
  studentId: varchar('student_id', { length: 20 }).unique().notNull(),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  dateOfBirth: date('date_of_birth', { mode: 'string' }),
  gender: varchar('gender', { length: 10 }),
  address: text('address'),
  phone: varchar('phone', { length: 20 }),
  enrollmentDate: date('enrollment_date', { mode: 'string' }).notNull(),
  status: mysqlEnum('status', ['active', 'inactive', 'graduated', 'withdrawn']).default('active'),
  className: varchar('class_name', { length: 100 }),
  classId: varchar('class_id', { length: 100 }),
  photoUrl: longtext('photo_url'),
  parentName1: varchar('parent_name_1', { length: 100 }),
  parentPhone1: varchar('parent_phone_1', { length: 20 }),
  parentName2: varchar('parent_name_2', { length: 100 }),
  parentPhone2: varchar('parent_phone_2', { length: 20 }),
  enrolledCourseIds: text('enrolled_course_ids'),
  totalFee: decimal('total_fee', { precision: 12, scale: 2 }),
  createdAt: timestamp('created_at').defaultNow(),
});

export const staffProfiles = mysqlTable('staff_profiles', {
  id: varchar('id', { length: 36 }).primaryKey().$defaultFn(() => uuidv4()),
  userId: varchar('user_id', { length: 36 }).references(() => users.id, { onDelete: 'cascade' }),
  staffId: varchar('staff_id', { length: 20 }).unique().notNull(),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  department: varchar('department', { length: 100 }),
  phone: varchar('phone', { length: 20 }),
  hireDate: date('hire_date', { mode: 'string' }),
  photoUrl: longtext('photo_url'),
  isActive: boolean('is_active').default(true),
});

export const subjects = mysqlTable('subjects', {
  id: varchar('id', { length: 36 }).primaryKey().$defaultFn(() => uuidv4()),
  name: varchar('name', { length: 100 }).notNull(),
  code: varchar('code', { length: 20 }).notNull().unique(),
  department: varchar('department', { length: 100 }).notNull(),
  description: text('description'),
  credits: decimal('credits', { precision: 4, scale: 2 }).default('3.00'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const classSubjects = mysqlTable('class_subjects', {
  id: varchar('id', { length: 36 }).primaryKey().$defaultFn(() => uuidv4()),
  classId: varchar('class_id', { length: 36 }).references(() => classes.id, { onDelete: 'cascade' }),
  subjectId: varchar('subject_id', { length: 36 }).references(() => subjects.id, { onDelete: 'cascade' }),
  staffId: varchar('staff_id', { length: 36 }).references(() => staffProfiles.id, { onDelete: 'cascade' }),
  termId: varchar('term_id', { length: 36 }).references(() => terms.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow(),
}, (t) => ({
  unq: uniqueIndex('class_subject_term_idx').on(t.classId, t.subjectId, t.termId),
}));

export const grades = mysqlTable('grades', {
  id: varchar('id', { length: 36 }).primaryKey().$defaultFn(() => uuidv4()),
  studentId: varchar('student_id', { length: 36 }).references(() => studentProfiles.id),
  classSubjectId: varchar('class_subject_id', { length: 36 }).references(() => classSubjects.id),
  score: decimal('score', { precision: 5, scale: 2 }).notNull(),
  remarks: text('remarks'),
  recordedBy: varchar('recorded_by', { length: 36 }).references(() => staffProfiles.id),
  recordedAt: timestamp('recorded_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const attendance = mysqlTable('attendance', {
  id: varchar('id', { length: 36 }).primaryKey().$defaultFn(() => uuidv4()),
  studentId: varchar('student_id', { length: 36 }).references(() => studentProfiles.id),
  classId: varchar('class_id', { length: 36 }).references(() => classes.id),
  date: date('date', { mode: 'string' }).notNull(),
  status: mysqlEnum('status', ['present', 'absent', 'late', 'excused']).notNull(),
  checkedBy: varchar('checked_by', { length: 36 }).references(() => staffProfiles.id),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
}, (t) => ({
  unq: uniqueIndex('student_class_date_idx').on(t.studentId, t.classId, t.date),
}));

export const auditLogs = mysqlTable('audit_logs', {
  id:        varchar('id', { length: 36 }).primaryKey().$defaultFn(() => uuidv4()),
  userId:    varchar('user_id', { length: 36 }).references(() => users.id, { onDelete: 'set null' }),
  action:    varchar('action', { length: 50 }).notNull(),
  module:    varchar('module', { length: 50 }).notNull(),
  details:   text('details'),
  ipAddress: varchar('ip_address', { length: 45 }),
  createdAt: timestamp('created_at').defaultNow(),
});

export const refreshTokens = mysqlTable('refresh_tokens', {
  id:        varchar('id', { length: 36 }).primaryKey().$defaultFn(() => uuidv4()),
  userId:    varchar('user_id', { length: 36 }).references(() => users.id, { onDelete: 'cascade' }).notNull(),
  token:     varchar('token', { length: 512 }).unique().notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const parentProfiles = mysqlTable('parent_profiles', {
  id: varchar('id', { length: 36 }).primaryKey().$defaultFn(() => uuidv4()),
  userId: varchar('user_id', { length: 36 }).references(() => users.id, { onDelete: 'cascade' }),
  firstName: varchar('first_name', { length: 100 }),
  lastName: varchar('last_name', { length: 100 }),
  phone: varchar('phone', { length: 20 }),
  studentId: varchar('student_id', { length: 36 }).references(() => studentProfiles.id),
});

export const payments = mysqlTable('payments', {
  id: varchar('id', { length: 36 }).primaryKey().$defaultFn(() => uuidv4()),
  studentId: varchar('student_id', { length: 36 }).references(() => studentProfiles.id),
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  paymentDate: date('payment_date', { mode: 'string' }).notNull(),
  paymentMethod: varchar('payment_method', { length: 50 }).notNull(),
  status: mysqlEnum('status', ['pending', 'completed', 'failed']).default('completed'),
  reference: varchar('reference', { length: 100 }),
  notes: text('notes'),
  recordedBy: varchar('recorded_by', { length: 36 }),
  createdAt: timestamp('created_at').defaultNow(),
});
