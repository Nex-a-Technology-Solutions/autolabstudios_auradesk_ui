class DjangoApiClient {
  constructor(baseURL = 'http://127.0.0.1:8000', options = {}) {
    this.baseURL = baseURL;
    this.requiresAuth = options.requiresAuth || true;
    this.token = localStorage.getItem('auth_token');
    
    this.headers = {
      'Content-Type': 'application/json',
    };
    
    if (this.token) {
      this.headers['Authorization'] = `Bearer ${this.token}`;
    }
  }
  
  setToken(token) {
    this.token = token;
    localStorage.setItem('auth_token', token);
    this.headers['Authorization'] = `Bearer ${token}`;
  }
  
  removeToken() {
    this.token = null;
    localStorage.removeItem('auth_token');
    delete this.headers['Authorization'];
  }
  
  async makeRequest(method, endpoint, data = null, params = null) {
    const url = new URL(`${this.baseURL}/api/${endpoint.replace(/^\//, '')}`);
    
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined) {
          url.searchParams.append(key, params[key]);
        }
      });
    }
    
    const config = {
      method: method.toUpperCase(),
      headers: { ...this.headers },
    };
    
    if (data && ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
      config.body = JSON.stringify(data);
    }
    
    try {
      console.log(`Making ${method.toUpperCase()} request to:`, url.toString());
      const response = await fetch(url, config);
      
      if (response.status === 401) {
        this.removeToken();
        throw new Error('Authentication required. Please log in.');
      }
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || errorData.detail || `API Error (${response.status})`;
        throw new Error(errorMessage);
      }
      
      const contentType = response.headers.get('Content-Type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }
      return {};
      
    } catch (error) {
      console.error('API Request failed:', error);
      throw error;
    }
  }
  
  async get(endpoint, params = null) {
    return this.makeRequest('GET', endpoint, null, params);
  }
  
  async post(endpoint, data = null) {
    return this.makeRequest('POST', endpoint, data);
  }
  
  async put(endpoint, data = null) {
    return this.makeRequest('PUT', endpoint, data);
  }
  
  async delete(endpoint) {
    return this.makeRequest('DELETE', endpoint);
  }
}

class Entity {
  constructor(client, entityName) {
    this.client = client;
    this.entityName = entityName;
  }
  
  async list(sortBy = '-created_date', limit = 100) {
    return this.client.get(`entities/${this.entityName}/`, { sortBy, limit });
  }
  
  async filter(conditions, sortBy = '-created_date', limit = 100) {
    const cleanConditions = {};
    
    for (const [key, value] of Object.entries(conditions)) {
      if (value === null || value === undefined || value === '') {
        continue;
      }
      
      if (key === 'project_id' && typeof value === 'string') {
        cleanConditions[key] = value;
      } else if (key === 'id' && typeof value === 'string') {
        cleanConditions[key] = value;
      } else if (typeof value === 'object' && !(value instanceof Date)) {
        console.warn(`Skipping complex object for field ${key}:`, value);
        continue;
      } else {
        cleanConditions[key] = value;
      }
    }
    
    const data = {
      conditions: cleanConditions,
      sortBy,
      limit
    };
    
    return this.client.post(`entities/${this.entityName}/filter/`, data);
  }
  
  async create(data) {
    return this.client.post(`entities/${this.entityName}/`, data);
  }
  
  async bulkCreate(dataList) {
    return this.client.post(`entities/${this.entityName}/bulk-create/`, dataList);
  }
  
  async update(id, data) {
    return this.client.put(`entities/${this.entityName}/${id}/`, data);
  }
  
  async delete(id) {
    return this.client.delete(`entities/${this.entityName}/${id}/`);
  }
  
  async get(id) {
    return this.client.get(`entities/${this.entityName}/${id}/`);
  }
  
  async schema() {
    return this.client.get(`entities/${this.entityName}/schema/`);
  }
}

// UPDATED UserEntity for Django 2FA
class UserEntity {
  constructor(client) {
    this.client = client;
    this.entityName = 'User';
  }
  
  async list(sortBy = '-created_date', limit = 100) {
    return this.client.get('auth/users/list/', { sortBy, limit });
  }
  
  async filter(conditions, sortBy = '-created_date', limit = 100) {
    return this.client.post('auth/users/filter/', {
      conditions,
      sortBy,
      limit
    });
  }
  
  async create(data) {
    return this.client.post('auth/users/', data);
  }
  
  async get(id) {
    return this.client.get(`auth/users/${id}/`);
  }
  
  async update(id, data) {
    return this.client.put(`auth/users/${id}/`, data);
  }
  
  async delete(id) {
    return this.client.delete(`auth/users/${id}/`);
  }
  
  async me() {
    return this.client.get('auth/users/me/');
  }
  
  async updateMyUserData(data) {
    return this.client.put('auth/users/me/', data);
  }
  
  // LOGIN FLOW - UPDATED FOR DJANGO 2FA
  async login(email, password) {
    const result = await this.client.post('auth/login/', { email, password });
    
    // Django returns either:
    // A) { access, refresh, user } - if no MFA/verification needed
    // B) { message, session_id, requires_verification, email } - if OTP needed
    
    if (result.access) {
      // No OTP needed, set token immediately
      this.client.setToken(result.access);
    }
    
    return result;
  }
  
  // VERIFY OTP - SINGLE ENDPOINT FOR BOTH LOGIN & REGISTRATION
  async verifyOTP(email, token, type = 'email') {
    const result = await this.client.post('auth/verify-otp/', { 
      email, 
      token,
      type
    });
    
    if (result.access) {
      this.client.setToken(result.access);
    }
    
    return result;
  }
  
  // REGISTRATION FLOW - UPDATED FOR DJANGO 2FA
  async register(email, fullName, password, role = 'user') {
    const result = await this.client.post('auth/register/', { 
      email, 
      full_name: fullName, 
      password,
      role
    });
    
    // Django always returns: { message, session_id, email, requires_verification }
    return result;
  }
  
  // RESEND OTP
  async resendOTP(email, type = 'email') {
    return this.client.post('auth/resend-otp/', { email, type });
  }
  
  // MFA MANAGEMENT
  async enableMFA(phone) {
    return this.client.post('auth/mfa/enable/', { phone });
  }
  
  async disableMFA() {
    return this.client.post('auth/mfa/disable/');
  }
  
  async loginWithRedirect(callbackUrl) {
    return this.client.post('auth/login-redirect/', { callback_url: callbackUrl });
  }
  
  async logout() {
    const result = await this.client.post('auth/logout/');
    this.client.removeToken();
    return result;
  }
  
  async schema() {
    return this.client.get('auth/users/schema/');
  }
  
  async bulkCreate(dataList) {
    throw new Error('Bulk user creation not implemented');
  }
}

class CoreIntegrations {
  constructor(client) {
    this.client = client;
  }
  
  async InvokeLLM(prompt, model = 'gpt-3.5-turbo', temperature = 0.7, max_tokens = 1000) {
    return this.client.post('integrations/Core/InvokeLLM/', {
      prompt,
      model,
      temperature,
      max_tokens
    });
  }
  
  async SendEmail(to_email, subject, message, from_email = null, html_message = null) {
    return this.client.post('integrations/Core/SendEmail/', {
      to_email,
      subject,
      message,
      from_email,
      html_message
    });
  }
  
  async UploadFile(file, folder = 'uploads') {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);
    
    const headers = { ...this.client.headers };
    delete headers['Content-Type'];
    
    const response = await fetch(`${this.client.baseURL}/api/integrations/Core/UploadFile/`, {
      method: 'POST',
      headers: { Authorization: headers.Authorization },
      body: formData
    });
    
    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }
    
    return response.json();
  }
  
  async GenerateImage(prompt, size = '1024x1024', quality = 'standard') {
    return this.client.post('integrations/Core/GenerateImage/', {
      prompt,
      size,
      quality
    });
  }
  
  async CreateFileSignedUrl(filename, expiration = 3600) {
    return this.client.post('integrations/Core/CreateFileSignedUrl/', {
      filename,
      expiration
    });
  }
  
  async UploadPrivateFile(file, folder = 'private') {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);
    
    const headers = { ...this.client.headers };
    delete headers['Content-Type'];
    
    const response = await fetch(`${this.client.baseURL}/api/integrations/Core/UploadPrivateFile/`, {
      method: 'POST',
      headers: { Authorization: headers.Authorization },
      body: formData
    });
    
    if (!response.ok) {
      throw new Error(`Private upload failed: ${response.statusText}`);
    }
    
    return response.json();
  }
  
  async ExtractDataFromUploadedFile(file) {
    const formData = new FormData();
    formData.append('file', file);
    
    const headers = { ...this.client.headers };
    delete headers['Content-Type'];
    
    const response = await fetch(`${this.client.baseURL}/api/integrations/Core/ExtractDataFromUploadedFile/`, {
      method: 'POST',
      headers: { Authorization: headers.Authorization },
      body: formData
    });
    
    if (!response.ok) {
      throw new Error(`Data extraction failed: ${response.statusText}`);
    }
    
    return response.json();
  }
}

class InvitationService {
  constructor(client) {
    this.client = client;
  }
  
  async list() {
    return this.client.get('invitations/');
  }
  
  async create(invitationData) {
    return this.client.post('invitations/', invitationData);
  }
  
  async get(id) {
    return this.client.get(`invitations/${id}/`);
  }
  
  async update(id, data) {
    return this.client.put(`invitations/${id}/`, data);
  }
  
  async delete(id) {
    return this.client.delete(`invitations/${id}/`);
  }
  
  async resend(id) {
    return this.client.post(`invitations/${id}/resend/`);
  }
  
  async getByToken(token) {
    return this.client.get(`invitations/details/${token}/`);
  }
  
  async accept(token, password, confirmPassword) {
    return this.client.post('invitations/accept/', {
      token,
      password,
      confirm_password: confirmPassword
    });
  }
}

class AuraDeskClient {
  constructor(options = {}) {
    this.apiClient = new DjangoApiClient('https://auradesk-api.fly.dev', options);
    
    this.entities = {
      Ticket: new Entity(this.apiClient, 'Ticket'),
      TicketMessage: new Entity(this.apiClient, 'TicketMessage'),
      Project: new Entity(this.apiClient, 'Project'),
    };
    
    this.auth = new UserEntity(this.apiClient);
    
    this.integrations = {
      Core: new CoreIntegrations(this.apiClient)
    };

    this.invitations = new InvitationService(this.apiClient);
  }
  
  setToken(token) {
    this.apiClient.setToken(token);
  }
  
  removeToken() {
    this.apiClient.removeToken();
  }
  
  getToken() {
    return this.apiClient.token;
  }
}

export const base44 = new AuraDeskClient({
  requiresAuth: true
});

export const Invitations = base44.invitations;
export default base44;
