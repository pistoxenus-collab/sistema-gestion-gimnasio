import { 
  User, 
  GymClass, 
  MyEnrollment, 
  ClassAttendee, 
  MonthlyReportData, 
  StudentDirectoryItem 
} from '../types';

const API_BASE = '/api';

function getAuthHeader(): HeadersInit {
  const token = localStorage.getItem('f6_auth_token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

async function handleResponse<T>(response: Response): Promise<T> {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const errorMsg = data.error || data.message || `Error HTTP ${response.status}`;
    throw new Error(errorMsg);
  }
  return data as T;
}

// Authentication API
export const authApi = {
  async login(email: string, password: string): Promise<{ user: User; token: string; message: string }> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return handleResponse(res);
  },

  async register(name: string, email: string, password: string, phone?: string, role: string = 'student'): Promise<{ user: User; token: string; message: string }> {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, phone, role }),
    });
    return handleResponse(res);
  },

  async quickLogin(userId: number): Promise<{ user: User; token: string; message: string }> {
    const res = await fetch(`${API_BASE}/auth/quick-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    return handleResponse(res);
  },

  async getDemoUsers(): Promise<User[]> {
    const res = await fetch(`${API_BASE}/auth/demo-users`);
    return handleResponse(res);
  },

  async getMe(): Promise<User> {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: { ...getAuthHeader() },
    });
    return handleResponse(res);
  },
};

// Classes API
export const classesApi = {
  async getClasses(params?: { date?: string; category?: string; search?: string; month?: number; year?: number }): Promise<GymClass[]> {
    const query = new URLSearchParams();
    if (params?.date) query.set('date', params.date);
    if (params?.category) query.set('category', params.category);
    if (params?.search) query.set('search', params.search);
    if (params?.month) query.set('month', String(params.month));
    if (params?.year) query.set('year', String(params.year));

    const res = await fetch(`${API_BASE}/classes?${query.toString()}`, {
      headers: { ...getAuthHeader() },
    });
    return handleResponse(res);
  },

  async getClass(id: number): Promise<GymClass> {
    const res = await fetch(`${API_BASE}/classes/${id}`, {
      headers: { ...getAuthHeader() },
    });
    return handleResponse(res);
  },

  async createClass(classData: {
    title: string;
    category: string;
    description?: string;
    instructor_name?: string;
    date: string;
    start_time: string;
    end_time: string;
    capacity: number;
    location?: string;
  }): Promise<{ class: GymClass; message: string }> {
    const res = await fetch(`${API_BASE}/classes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(classData),
    });
    return handleResponse(res);
  },

  async updateClass(id: number, classData: Partial<GymClass>): Promise<{ class: GymClass; message: string }> {
    const res = await fetch(`${API_BASE}/classes/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(classData),
    });
    return handleResponse(res);
  },

  async deleteClass(id: number): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/classes/${id}`, {
      method: 'DELETE',
      headers: { ...getAuthHeader() },
    });
    return handleResponse(res);
  },
};

// Enrollments API
export const enrollmentsApi = {
  async bookClass(classId: number): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/enrollments/book`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify({ class_id: classId }),
    });
    return handleResponse(res);
  },

  async cancelBooking(classId: number): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/enrollments/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify({ class_id: classId }),
    });
    return handleResponse(res);
  },

  async getMyClasses(): Promise<MyEnrollment[]> {
    const res = await fetch(`${API_BASE}/enrollments/my-classes`, {
      headers: { ...getAuthHeader() },
    });
    return handleResponse(res);
  },

  async getClassAttendees(classId: number): Promise<ClassAttendee[]> {
    const res = await fetch(`${API_BASE}/enrollments/class/${classId}`, {
      headers: { ...getAuthHeader() },
    });
    return handleResponse(res);
  },

  async updateAttendance(enrollmentId: number, status: 'enrolled' | 'attended' | 'absent'): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/enrollments/${enrollmentId}/attendance`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify({ status }),
    });
    return handleResponse(res);
  },
};

// Reports and Directory API
export const reportsApi = {
  async getMonthlyReport(month?: number, year?: number): Promise<MonthlyReportData> {
    const query = new URLSearchParams();
    if (month) query.set('month', String(month));
    if (year) query.set('year', String(year));

    const res = await fetch(`${API_BASE}/reports/monthly?${query.toString()}`, {
      headers: { ...getAuthHeader() },
    });
    return handleResponse(res);
  },

  getExportCsvUrl(month?: number, year?: number): string {
    const query = new URLSearchParams();
    if (month) query.set('month', String(month));
    if (year) query.set('year', String(year));
    return `${API_BASE}/reports/export-csv?${query.toString()}`;
  },

  async getStudentsList(): Promise<StudentDirectoryItem[]> {
    const res = await fetch(`${API_BASE}/users/students`, {
      headers: { ...getAuthHeader() },
    });
    return handleResponse(res);
  },

  async updateProfile(name: string, phone?: string): Promise<{ user: User; message: string }> {
    const res = await fetch(`${API_BASE}/users/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify({ name, phone }),
    });
    return handleResponse(res);
  },
};
