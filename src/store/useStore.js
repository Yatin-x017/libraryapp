import { create } from 'zustand';

const STORAGE_KEY = 'libraryos_data';

const todayStr = () => new Date().toISOString().slice(0, 10); // "2026-06-01"

const loadFromStorage = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
};

const persist = (state) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    students: state.students,
    alerts: state.alerts,
    smsLogs: state.smsLogs,
    attendanceLogs: state.attendanceLogs,
    lastAttendanceDate: state.lastAttendanceDate,
  }));
};

const defaultStudents = [
  { id: 1, name: 'Arjun Sharma',  mobile: '9876543210', feePaid: true,  presentToday: false, feeAmount: 500, joinDate: '2024-01-05', seatNo: 'A1' },
  { id: 2, name: 'Priya Singh',   mobile: '9765432109', feePaid: false, presentToday: false, feeAmount: 500, joinDate: '2024-01-10', seatNo: 'A2' },
  { id: 3, name: 'Rahul Verma',   mobile: '9654321098', feePaid: false, presentToday: false, feeAmount: 500, joinDate: '2024-01-12', seatNo: 'B1' },
  { id: 4, name: 'Sneha Gupta',   mobile: '9543210987', feePaid: true,  presentToday: false, feeAmount: 500, joinDate: '2024-01-15', seatNo: 'B2' },
  { id: 5, name: 'Vikram Patel',  mobile: '9432109876', feePaid: false, presentToday: false, feeAmount: 500, joinDate: '2024-02-01', seatNo: 'C1' },
];

// Seed demo attendance logs for the last 30 days
const seedAttendanceLogs = () => {
  const logs = {};
  const names = defaultStudents.map(s => ({ id: s.id, name: s.name }));
  for (let i = 29; i >= 1; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateKey = d.toISOString().slice(0, 10);
    // randomly pick 2-4 students present each day
    const present = names.filter(() => Math.random() > 0.45);
    if (present.length > 0) {
      logs[dateKey] = present.map(s => ({ id: s.id, name: s.name }));
    }
  }
  return logs;
};

const saved = loadFromStorage();
const today = todayStr();

// Auto-reset: if last saved date != today, wipe presentToday for all students
let initialStudents = saved?.students ?? defaultStudents;
const lastDate = saved?.lastAttendanceDate ?? null;
if (lastDate && lastDate !== today) {
  initialStudents = initialStudents.map(s => ({ ...s, presentToday: false }));
}

const initialAttendanceLogs = saved?.attendanceLogs ?? seedAttendanceLogs();

export const useStore = create((set, get) => ({
  students: initialStudents,
  alerts: saved?.alerts ?? [],
  smsLogs: saved?.smsLogs ?? [],
  attendanceLogs: initialAttendanceLogs,   // { "2026-06-01": [{id, name}, ...] }
  lastAttendanceDate: lastDate ?? today,

  setStudents: (students) => {
    set({ students });
    persist({ ...get(), students });
  },

  addStudent: (student) => {
    const students = [...get().students, {
      ...student, id: Date.now(), presentToday: false, feeAmount: student.feeAmount ?? 500,
    }];
    set({ students });
    persist({ ...get(), students });
  },

  removeStudent: (id) => {
    const students = get().students.filter(s => s.id !== id);
    set({ students });
    persist({ ...get(), students });
  },

  // Mark a student present — also logs to attendanceLogs for today
  markPresent: (id) => {
    const today = todayStr();
    const { students, attendanceLogs } = get();

    const updated = students.map(s => s.id === id ? { ...s, presentToday: true } : s);
    const student = students.find(s => s.id === id);
    const todayLog = attendanceLogs[today] ?? [];
    const alreadyLogged = todayLog.some(e => e.id === id);

    const newLogs = {
      ...attendanceLogs,
      [today]: alreadyLogged ? todayLog : [...todayLog, { id: student.id, name: student.name }],
    };

    set({ students: updated, attendanceLogs: newLogs, lastAttendanceDate: today });
    persist({ ...get(), students: updated, attendanceLogs: newLogs, lastAttendanceDate: today });
  },

  // Mark absent (remove from today's log too)
  markAbsent: (id) => {
    const today = todayStr();
    const { students, attendanceLogs } = get();
    const updated = students.map(s => s.id === id ? { ...s, presentToday: false } : s);
    const newLogs = {
      ...attendanceLogs,
      [today]: (attendanceLogs[today] ?? []).filter(e => e.id !== id),
    };
    set({ students: updated, attendanceLogs: newLogs });
    persist({ ...get(), students: updated, attendanceLogs: newLogs });
  },

  resetTodayAttendance: () => {
    const today = todayStr();
    const students = get().students.map(s => ({ ...s, presentToday: false }));
    const attendanceLogs = { ...get().attendanceLogs };
    delete attendanceLogs[today];
    set({ students, attendanceLogs });
    persist({ ...get(), students, attendanceLogs });
  },

  addSmsLog: (log) => {
    const smsLogs = [{ ...log, id: Date.now(), timestamp: new Date().toLocaleString() }, ...get().smsLogs];
    set({ smsLogs });
    persist({ ...get(), smsLogs });
  },

  clearSmsLogs: () => {
    set({ smsLogs: [] });
    persist({ ...get(), smsLogs: [] });
  },
}));
