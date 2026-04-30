import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Student, Staff, Class, Course, Grade, AttendanceRecord, Payment, Term, Assignment } from '../types';
import { COURSES } from '../data/mockData';

const API = 'http://localhost:4000/api';

/** Get auth token from persisted auth store */
function getToken(): string {
  try {
    const raw = localStorage.getItem('b2ma-auth');
    if (!raw) return '';
    const parsed = JSON.parse(raw);
    return parsed?.state?.token ?? '';
  } catch { return ''; }
}

/** Authenticated fetch helper */
async function apiFetch(endpoint: string, opts: RequestInit = {}) {
  const token = getToken();
  const res = await fetch(`${API}${endpoint}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts.headers ?? {}),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    if (Array.isArray(err.error)) {
      throw new Error(err.error.map((e: any) => `${e.path?.join('.')} - ${e.message}`).join(', '));
    }
    const errMsg = typeof err.error === 'string' ? err.error : JSON.stringify(err.error);
    throw new Error(errMsg ?? 'Request failed');
  }
  return res.json();
}

interface DataState {
  students:    Student[];
  staff:       Staff[];
  classes:     Class[];
  courses:     Course[];
  grades:      Grade[];
  attendance:  AttendanceRecord[];
  payments:    Payment[];
  terms:       Term[];
  assignments: Assignment[];
  saving:      boolean;
  saveError:   string | null;

  setStudents:  (v: Student[]  | ((p: Student[])  => Student[]))  => void;
  setStaff:     (v: Staff[]    | ((p: Staff[])    => Staff[]))    => void;
  setClasses:   (v: Class[]    | ((p: Class[])    => Class[]))    => void;
  setCourses:   (v: Course[]   | ((p: Course[])   => Course[]))   => void;
  setGrades:    (v: Grade[]    | ((p: Grade[])    => Grade[]))    => void;
  setAttendance:(v: AttendanceRecord[] | ((p: AttendanceRecord[]) => AttendanceRecord[])) => void;
  setPayments:  (v: Payment[]  | ((p: Payment[])  => Payment[]))  => void;
  setTerms:     (v: Term[]     | ((p: Term[])     => Term[]))     => void;
  clearSaveError: () => void;

  addStudent:    (data: Omit<Student, 'id' | 'fullName' | 'studentId' | 'status'> & { password?: string; totalFee?: number; initialPayment?: number; }) => Promise<void>;
  updateStudent: (id: string, data: Partial<Student>) => Promise<void>;
  deleteStudent: (id: string) => Promise<void>;
  updateStudentStatus: (id: string, status: string) => Promise<void>;

  addStaff:      (data: { firstName: string; lastName: string; email: string; phone?: string; department?: string; password?: string; photoUrl?: string; subjects?: string[] }) => Promise<void>;
  updateStaff:   (id: string, data: Partial<Staff>) => Promise<void>;
  deactivateStaff: (id: string) => Promise<void>;
  reactivateStaff: (id: string) => Promise<void>;

  addAssignment: (data: Omit<Assignment, 'id'>) => Promise<void>;
  removeAssignment: (id: string) => Promise<void>;

  addPayment: (data: { studentId: string; amount: number; paymentMethod: string; reference?: string; notes?: string; status?: string }) => Promise<void>;

  fetchFromBackend: () => Promise<void>;
}

export const useDataStore = create<DataState>()(
  persist(
    (set, get) => ({
      students:    [],
      staff:       [],
      classes:     [],
      courses:     COURSES,
      grades:      [],
      attendance:  [],
      payments:    [],
      terms:       [],
      assignments: [],
      saving:      false,
      saveError:   null,

      setStudents:   (v) => set((s) => ({ students:   typeof v === 'function' ? v(s.students)   : v })),
      setStaff:      (v) => set((s) => ({ staff:      typeof v === 'function' ? v(s.staff)      : v })),
      setClasses:    (v) => set((s) => ({ classes:    typeof v === 'function' ? v(s.classes)    : v })),
      setCourses:    (v) => set((s) => ({ courses:    typeof v === 'function' ? v(s.courses)    : v })),
      setGrades:     (v) => set((s) => ({ grades:     typeof v === 'function' ? v(s.grades)     : v })),
      setAttendance: (v) => set((s) => ({ attendance: typeof v === 'function' ? v(s.attendance) : v })),
      setPayments:   (v) => set((s) => ({ payments:   typeof v === 'function' ? v(s.payments)   : v })),
      setTerms:      (v) => set((s) => ({ terms:      typeof v === 'function' ? v(s.terms)      : v })),
      clearSaveError: () => set({ saveError: null }),

      addStudent: async (data) => {
        set({ saving: true, saveError: null });
        try {
          await apiFetch('/admin/students', {
            method: 'POST',
            body: JSON.stringify(data),
          });
          await get().fetchFromBackend();
        } catch (e: any) {
          set({ saveError: e.message });
          throw e;
        } finally {
          set({ saving: false });
        }
      },

      updateStudent: async (id, data) => {
        set({ saving: true, saveError: null });
        try {
          await apiFetch(`/admin/students/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
          });
          await get().fetchFromBackend();
        } catch (e: any) {
          set({ saveError: e.message });
          throw e;
        } finally {
          set({ saving: false });
        }
      },

      deleteStudent: async (id) => {
        set({ saving: true, saveError: null });
        try {
          await apiFetch(`/admin/students/${id}`, { method: 'DELETE' });
          await get().fetchFromBackend();
        } catch (e: any) {
          set({ saveError: e.message });
          throw e;
        } finally {
          set({ saving: false });
        }
      },

      updateStudentStatus: async (id, status) => {
        set({ saving: true, saveError: null });
        try {
          await apiFetch(`/admin/students/${id}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status })
          });
          await get().fetchFromBackend();
        } catch (e: any) {
          set({ saveError: e.message });
          throw e;
        } finally {
          set({ saving: false });
        }
      },

      addStaff: async (data) => {
        set({ saving: true, saveError: null });
        try {
          await apiFetch('/admin/staff', {
            method: 'POST',
            body: JSON.stringify(data),
          });
          await get().fetchFromBackend();
        } catch (e: any) {
          set({ saveError: e.message });
          throw e;
        } finally {
          set({ saving: false });
        }
      },

      updateStaff: async (id, data) => {
        set({ saving: true, saveError: null });
        try {
          await apiFetch(`/admin/staff/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
          });
          await get().fetchFromBackend();
        } catch (e: any) {
          set({ saveError: e.message });
          throw e;
        } finally {
          set({ saving: false });
        }
      },

      deactivateStaff: async (id) => {
        set({ saving: true, saveError: null });
        try {
          await apiFetch(`/admin/staff/${id}/deactivate`, { method: 'PATCH' });
          await get().fetchFromBackend();
        } catch (e: any) {
          set({ saveError: e.message });
        } finally {
          set({ saving: false });
        }
      },

      reactivateStaff: async (id) => {
        set({ saving: true, saveError: null });
        try {
          await apiFetch(`/admin/staff/${id}/reactivate`, { method: 'PATCH' });
          await get().fetchFromBackend();
        } catch (e: any) {
          set({ saveError: e.message });
        } finally {
          set({ saving: false });
        }
      },

      addAssignment: async (data) => {
        set({ saving: true, saveError: null });
        try {
          await apiFetch('/admin/subject-assignments', {
            method: 'POST',
            body: JSON.stringify(data)
          });
          await get().fetchFromBackend();
        } catch (e: any) {
          set({ saveError: e.message });
          throw e;
        } finally {
          set({ saving: false });
        }
      },

      removeAssignment: async (id) => {
        set({ saving: true, saveError: null });
        try {
          await apiFetch(`/admin/subject-assignments/${id}`, { method: 'DELETE' });
          await get().fetchFromBackend();
        } catch (e: any) {
          set({ saveError: e.message });
          throw e;
        } finally {
          set({ saving: false });
        }
      },

      addPayment: async (data) => {
        set({ saving: true, saveError: null });
        try {
          await apiFetch('/admin/payments', {
            method: 'POST',
            body: JSON.stringify(data)
          });
          await get().fetchFromBackend();
        } catch (e: any) {
          set({ saveError: e.message });
          throw e;
        } finally {
          set({ saving: false });
        }
      },

      fetchFromBackend: async () => {
        try {
          const data = await apiFetch('/admin/system-data');
          const assignmentsRes = await apiFetch('/admin/subject-assignments').catch(() => ({ data: [] }));
          const paymentsRes = await apiFetch('/admin/payments').catch(() => ({ data: [] }));

          set({
            students:   (data.students || []).map((s: any) => {
              let parsedCourseIds = [];
              try {
                parsedCourseIds = typeof s.enrolledCourseIds === 'string' ? JSON.parse(s.enrolledCourseIds) : (s.enrolledCourseIds || []);
              } catch (e) {
                parsedCourseIds = [];
              }
              return {
                ...s,
                totalFee: s.totalFee ? parseFloat(s.totalFee) : 0,
                dateOfBirth: s.dateOfBirth ? (typeof s.dateOfBirth === 'string' ? s.dateOfBirth.split('T')[0] : new Date(s.dateOfBirth).toISOString().split('T')[0]) : '',
                enrolledCourseIds: parsedCourseIds
              };
            }),
            staff:      (data.staff || []).map((s: any) => ({ ...s, subjects: s.subjects || [] })),
            classes:    data.classes    || [],
            courses:    data.courses    || COURSES,
            grades:     data.grades     || [],
            attendance: data.attendance || [],
            payments:   (paymentsRes.data || []).map((p: any) => {
              const student = (data.students || []).find((s: any) => s.id === p.studentId);
              return {
                id: p.id,
                studentId: p.studentId,
                studentName: student ? `${student.firstName} ${student.lastName}` : 'Unknown Student',
                description: p.reference || 'Fee Payment',
                totalFee: student?.totalFee ? parseFloat(student.totalFee) : 0,
                amountPaid: parseFloat(p.amount),
                balance: (student?.totalFee ? parseFloat(student.totalFee) : 0) - parseFloat(p.amount), // This is a simplification
                paymentDate: p.paymentDate,
                method: p.paymentMethod?.toLowerCase() as any,
                reference: p.reference,
                status: parseFloat(p.amount) >= (student?.totalFee ? parseFloat(student.totalFee) : 0) ? 'paid' : 'partial',
              };
            }),
            terms:      data.terms      || [],
            assignments: assignmentsRes.data || [],
          });
        } catch (err) {
          console.warn('[dataStore] Backend unreachable, keeping local state.', err);
        }
      },
    }),
    {
      name: 'b2ma-app-data',
      partialize: (s) => ({
        students: s.students, staff: s.staff, classes: s.classes,
        courses: s.courses, grades: s.grades, attendance: s.attendance,
        payments: s.payments, terms: s.terms, assignments: s.assignments,
      }),
    }
  )
);
