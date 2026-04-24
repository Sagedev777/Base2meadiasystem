import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Student, Staff, Class, Course, Grade, AttendanceRecord, Payment, Term } from '../types';
import { CLASSES, STUDENTS, STAFF_LIST, GRADES, ATTENDANCE, PAYMENTS, COURSES, TERMS } from '../data/mockData';

interface DataState {
  students: Student[];
  staff: Staff[];
  classes: Class[];
  courses: Course[];
  grades: Grade[];
  attendance: AttendanceRecord[];
  payments: Payment[];
  terms: Term[];

  // Mutators
  setStudents: (students: Student[] | ((prev: Student[]) => Student[])) => void;
  setStaff: (staff: Staff[] | ((prev: Staff[]) => Staff[])) => void;
  setClasses: (classes: Class[] | ((prev: Class[]) => Class[])) => void;
  setCourses: (courses: Course[] | ((prev: Course[]) => Course[])) => void;
  setGrades: (grades: Grade[] | ((prev: Grade[]) => Grade[])) => void;
  setAttendance: (attendance: AttendanceRecord[] | ((prev: AttendanceRecord[]) => AttendanceRecord[])) => void;
  setPayments: (payments: Payment[] | ((prev: Payment[]) => Payment[])) => void;
  setTerms: (terms: Term[] | ((prev: Term[]) => Term[])) => void;

  fetchFromBackend: () => Promise<void>;
}

export const useDataStore = create<DataState>()(
  persist(
    (set) => ({
      students: [],
      staff: [],
      classes: [],
      courses: [],
      grades: [],
      attendance: [],
      payments: PAYMENTS,
      terms: TERMS,

      setStudents: (val) => set((state) => ({ students: typeof val === 'function' ? val(state.students) : val })),
      setStaff: (val) => set((state) => ({ staff: typeof val === 'function' ? val(state.staff) : val })),
      setClasses: (val) => set((state) => ({ classes: typeof val === 'function' ? val(state.classes) : val })),
      setCourses: (val) => set((state) => ({ courses: typeof val === 'function' ? val(state.courses) : val })),
      setGrades: (val) => set((state) => ({ grades: typeof val === 'function' ? val(state.grades) : val })),
      setAttendance: (val) => set((state) => ({ attendance: typeof val === 'function' ? val(state.attendance) : val })),
      setPayments: (val) => set((state) => ({ payments: typeof val === 'function' ? val(state.payments) : val })),
      setTerms: (val) => set((state) => ({ terms: typeof val === 'function' ? val(state.terms) : val })),

      fetchFromBackend: async () => {
        try {
          const res = await fetch('http://localhost:4000/api/admin/system-data');
          if (res.ok) {
            const data = await res.json();
            set({
              students: data.students || [],
              staff: data.staff || [],
              classes: data.classes || [],
              courses: data.courses || COURSES,
              grades: data.grades || [],
              attendance: data.attendance || [],
              terms: data.terms || TERMS,
            });
          }
        } catch (err) {
          console.error('Failed to fetch from backend', err);
        }
      },
    }),
    {
      name: 'b2ma-app-data', // The local storage key
    }
  )
);
