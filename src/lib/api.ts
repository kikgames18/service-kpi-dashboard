const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

interface LoginResponse {
  token: string;
  user: {
    id: string;
    email: string;
    full_name: string;
    role: string;
  };
}

interface RegisterResponse extends LoginResponse {}

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: 'admin' | 'user';
}

class ApiClient {
  private getToken(): string | null {
    return localStorage.getItem('token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.getToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(error.error || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async login(email: string, password: string): Promise<LoginResponse> {
    const data = await this.request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (data.token) {
      localStorage.setItem('token', data.token);
    }
    return data;
  }

  async register(
    email: string,
    password: string,
    fullName: string
  ): Promise<RegisterResponse> {
    const data = await this.request<RegisterResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, fullName }),
    });
    if (data.token) {
      localStorage.setItem('token', data.token);
    }
    return data;
  }

  async getCurrentUser(): Promise<{ user: Profile }> {
    return this.request<{ user: Profile }>('/auth/me');
  }

  async getKpiMetrics(limit: number = 7) {
    return this.request(`/data/kpi-metrics?limit=${limit}`);
  }

  async getOrders() {
    return this.request('/data/orders');
  }

  async getTechnicians() {
    return this.request('/data/technicians');
  }

  async createTechnician(data: {
    full_name: string;
    specialization?: string;
    hire_date?: string;
    is_active?: boolean;
  }) {
    return this.request('/data/technicians', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async createOrder(data: {
    customer_name: string;
    customer_phone: string;
    device_type: string;
    device_brand?: string;
    device_model?: string;
    issue_description: string;
    status?: string;
    priority?: string;
    estimated_cost?: number;
    assigned_to?: string;
  }) {
    return this.request('/data/orders', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateOrder(id: string, data: {
    customer_name?: string;
    customer_phone?: string;
    device_type?: string;
    device_brand?: string;
    device_model?: string;
    issue_description?: string;
    status?: string;
    priority?: string;
    estimated_cost?: number;
    final_cost?: number;
    assigned_to?: string;
    completed_date?: string;
  }) {
    return this.request(`/data/orders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteOrder(id: string) {
    return this.request(`/data/orders/${id}`, {
      method: 'DELETE',
    });
  }

  async updateTechnician(id: string, data: {
    full_name: string;
    specialization?: string;
    hire_date?: string;
    is_active?: boolean;
  }) {
    return this.request(`/data/technicians/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteTechnician(id: string) {
    return this.request(`/data/technicians/${id}`, {
      method: 'DELETE',
    });
  }

  async getProfile() {
    return this.request<Profile>('/data/profile');
  }

  async updateProfile(data: { full_name?: string; email?: string }) {
    return this.request<Profile>('/data/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async changePassword(currentPassword: string, newPassword: string) {
    return this.request('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  }

  async getNotifications(unreadOnly?: boolean) {
    const url = unreadOnly 
      ? '/data/notifications?unread_only=true'
      : '/data/notifications';
    return this.request(url);
  }

  async markNotificationAsRead(id: string) {
    return this.request(`/data/notifications/${id}/read`, {
      method: 'PUT',
    });
  }

  async markAllNotificationsAsRead() {
    return this.request('/data/notifications/read-all', {
      method: 'PUT',
    });
  }

  async getAuditLog(entityType?: string, entityId?: string, limit?: number) {
    const params = new URLSearchParams();
    if (entityType) params.append('entity_type', entityType);
    if (entityId) params.append('entity_id', entityId);
    if (limit) params.append('limit', limit.toString());
    const query = params.toString();
    return this.request(`/data/audit-log${query ? '?' + query : ''}`);
  }

  async getOrderAttachments(orderId: string) {
    return this.request(`/data/orders/${orderId}/attachments`);
  }

  async uploadOrderAttachment(orderId: string, file: File) {
    const formData = new FormData();
    formData.append('file', file);
    
    const token = this.getToken();
    const response = await fetch(`${API_URL}/data/orders/${orderId}/attachments`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Ошибка при загрузке файла');
    }

    return response.json();
  }

  async deleteAttachment(id: string) {
    return this.request(`/data/attachments/${id}`, {
      method: 'DELETE',
    });
  }

  async createBackup() {
    return this.request('/data/backup/create', {
      method: 'POST',
    });
  }

  async restoreBackup(backup: any) {
    return this.request('/data/backup/restore', {
      method: 'POST',
      body: JSON.stringify({ backup }),
    });
  }

  logout() {
    localStorage.removeItem('token');
  }
}

export const api = new ApiClient();

