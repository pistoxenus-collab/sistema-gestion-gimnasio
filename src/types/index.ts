export type UserRole = 'professor' | 'student' | 'admin';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  created_at?: string;
}

export interface GymClass {
  id: number;
  title: string;
  category: string;
  description: string;
  instructor_id: number;
  instructor_name: string;
  date: string; // YYYY-MM-DD
  start_time: string; // HH:mm
  end_time: string; // HH:mm
  capacity: number;
  location: string;
  status: 'active' | 'cancelled';
  enrolled_count: number;
  available_spots: number;
  is_full: boolean;
  is_enrolled: boolean;
  user_enrollment_status?: 'enrolled' | 'attended' | 'absent' | 'cancelled' | null;
  students?: ClassAttendee[];
}

export interface ClassAttendee {
  enrollment_id: number;
  enrollment_status: 'enrolled' | 'attended' | 'absent';
  enrolled_at: string;
  user_id: number;
  user_name: string;
  user_email: string;
  user_phone?: string;
}

export interface MyEnrollment {
  enrollment_id: number;
  enrollment_status: 'enrolled' | 'attended' | 'absent' | 'cancelled';
  enrolled_at: string;
  class_id: number;
  title: string;
  category: string;
  description: string;
  instructor_name: string;
  date: string;
  start_time: string;
  end_time: string;
  location: string;
  capacity: number;
  enrolled_count: number;
}

export interface MonthlyReportStudent {
  user_id: number;
  user_name: string;
  user_email: string;
  user_phone?: string;
  attended_count: number;
  enrolled_count: number;
  absent_count: number;
  total_bookings: number;
  classes: {
    class_id: number;
    title: string;
    category: string;
    date: string;
    start_time: string;
    end_time: string;
    instructor_name: string;
    attendance_status: 'enrolled' | 'attended' | 'absent';
    enrolled_at: string;
  }[];
}

export interface MonthlyReportCategory {
  category: string;
  total_sessions: number;
  total_enrolled: number;
  total_attended: number;
  avg_attendance_per_session: number;
}

export interface MonthlyReportLog {
  enrollment_id: number;
  student_name: string;
  student_email: string;
  student_phone?: string;
  class_title: string;
  class_category: string;
  class_date: string;
  start_time: string;
  end_time: string;
  instructor_name: string;
  status: 'enrolled' | 'attended' | 'absent';
  enrolled_at: string;
}

export interface MonthlyReportData {
  month: number;
  year: number;
  metrics: {
    total_classes: number;
    total_enrollments: number;
    total_attended: number;
    unique_active_students: number;
    attendance_rate: number;
  };
  students: MonthlyReportStudent[];
  categories: MonthlyReportCategory[];
  logs: MonthlyReportLog[];
}

export interface StudentDirectoryItem {
  id: number;
  name: string;
  email: string;
  phone?: string;
  created_at: string;
  total_attended: number;
  active_bookings: number;
  total_absent: number;
}
