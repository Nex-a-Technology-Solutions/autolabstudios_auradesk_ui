class DjangoApiClient {
  constructor(baseURL = 'https://auradesk-api.fly.dev', options = {}) {
    this.baseURL = baseURL;
    this.requiresAuth = options.requiresAuth || true;
    this.token = localStorage.getItem('auth_token');
    this.refreshToken = localStorage.getItem('refresh_token');
    
    // NEW: Clear invalid tokens
    if (this.token && this.token.split('.').length !== 3) {
      console.warn('Invalid token detected, clearing...');
      this.removeToken();
      this.token = null;
      this.refreshToken = null;
    }
    
    // Add token refresh interval
    this.setupTokenRefresh();
    
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
  
  setRefreshToken(refreshToken) {
    this.refreshToken = refreshToken;
    localStorage.setItem('refresh_token', refreshToken);
  }
  
  // NEW: Auto-refresh tokens every 50 minutes (before 1hr expiration)
  setupTokenRefresh() {
    // Clear any existing interval
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
    
    // Refresh every 50 minutes (3000000 ms)
    this.refreshInterval = setInterval(async () => {
      if (this.refreshToken) {
        try {
          await this.refreshAccessToken();
        } catch (error) {
          console.error('Token refresh failed:', error);
          // Token refresh failed - user needs to log in again
          this.removeToken();
        }
      }
    }, 50 * 60 * 1000); // 50 minutes
  }
  
  // NEW: Refresh access token using refresh token
  async refreshAccessToken() {
    try {
      const response = await fetch(`${this.baseURL}/api/auth/token/refresh/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refresh: this.refreshToken
        })
      });
      
      if (!response.ok) {
        throw new Error('Token refresh failed');
      }
      
      const data = await response.json();
      
      // Update access token
      this.setToken(data.access);
      
      // Update refresh token if rotated
      if (data.refresh) {
        this.setRefreshToken(data.refresh);
      }
      
      console.log('Token refreshed successfully');
      return data;
      
    } catch (error) {
      console.error('Failed to refresh token:', error);
      throw error;
    }
  }
  
  removeToken() {
  this.token = null;
  this.refreshToken = null;
  localStorage.removeItem('auth_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
  
  // Only delete Authorization header if headers object exists
  if (this.headers) {
    delete this.headers['Authorization'];
  }
  
  // Clear refresh interval
  if (this.refreshInterval) {
    clearInterval(this.refreshInterval);
  }
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
      
      // NEW: Try to refresh token on 401
      if (response.status === 401 && this.refreshToken) {
        try {
          await this.refreshAccessToken();
          // Retry request with new token
          config.headers['Authorization'] = `Bearer ${this.token}`;
          const retryResponse = await fetch(url, config);
          
          if (!retryResponse.ok) {
            throw new Error('Request failed after token refresh');
          }
          
          const contentType = retryResponse.headers.get('Content-Type');
          if (contentType && contentType.includes('application/json')) {
            return await retryResponse.json();
          }
          return {};
          
        } catch (refreshError) {
          this.removeToken();
          throw new Error('Authentication required. Please log in.');
        }
      }
      
      if (response.status === 401) {
        this.removeToken();
        throw new Error('Authentication required. Please log in.');
      }
      
      if (!response.ok) {
        const responseText = await response.text();
        
        let errorData = {};
        try {
          errorData = JSON.parse(responseText);
        } catch (e) {
          console.error('Could not parse error as JSON');
        }
        
        console.error('Backend error details:', errorData);
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
  
  async patch(endpoint, data = null) {
    return this.makeRequest('PATCH', endpoint, data);
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
    return this.client.patch(`entities/${this.entityName}/${id}/`, data);
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

// UPDATED UserEntity with OTP Login & Password Reset
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
  
  // ========================================================================
  // REGISTRATION FLOW (Same as before)
  // ========================================================================
  
  async register(email, fullName, password, role = 'user') {
    const result = await this.client.post('auth/register/', { 
      email, 
      full_name: fullName, 
      password,
      role
    });
    // Returns: { message, email, requires_verification }
    return result;
  }
  
  // ========================================================================
  // LOGIN FLOW - UPDATED WITH OTP
  // ========================================================================
  
  /**
   * Step 1: Request login (sends OTP to email)
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise} { message, requires_otp, email, verification_type } or { error }
   */
  async login(email, password) {
    const result = await this.client.post('auth/login/', { email, password });
    
    // Backend always sends OTP now for login
    // Returns: { message, requires_otp: true, email, verification_type: 'email' }
    return result;
  }
  
  /**
   * Step 2: Verify OTP - Works for both login and registration
   * @param {string} email - User email
   * @param {string} token - 6-digit OTP code
   * @param {string} type - OTP type ('email' for both login and registration)
   * @returns {Promise} { message, access, refresh, user }
   */
  async verifyOTP(email, token, type = 'email') {
    // Determine which endpoint to use based on context
    // For login OTP verification, use the login verify endpoint
    const endpoint = 'auth/login/verify-otp/';
    
    const result = await this.client.post(endpoint, { 
      email, 
      token,
      type
    });
    
    if (result.access) {
      this.client.setToken(result.access);
      localStorage.setItem('refresh_token', result.refresh);
      localStorage.setItem('user', JSON.stringify(result.user));
    }
    
    return result;
  }
  
  /**
   * Verify registration OTP (for registration flow)
   * @param {string} email - User email
   * @param {string} token - 6-digit OTP code
   * @returns {Promise} { message, access, refresh, user }
   */
  async verifyRegistrationOTP(email, token) {
    const result = await this.client.post('auth/verify-otp/', { 
      email, 
      token,
      type: 'email'
    });
    
    if (result.access) {
      this.client.setToken(result.access);
      localStorage.setItem('refresh_token', result.refresh);
      localStorage.setItem('user', JSON.stringify(result.user));
    }
    
    return result;
  }
  
  // ========================================================================
  // PASSWORD RESET FLOW - NEW
  // ========================================================================
  
  /**
   * Step 1: Request password reset (sends OTP to email)
   * @param {string} email - User email
   * @returns {Promise} { message, email }
   */
  async requestPasswordReset(email) {
    return this.client.post('auth/password-reset/', { email });
  }
  
  /**
   * Step 2: Verify password reset OTP
   * @param {string} email - User email
   * @param {string} token - 6-digit OTP code
   * @returns {Promise} { message, access, email }
   */
  async verifyPasswordResetOTP(email, token) {
    return this.client.post('auth/password-reset/verify-otp/', { 
      email, 
      token 
    });
  }
  
  /**
   * Step 3: Set new password
   * @param {string} accessToken - Access token from OTP verification
   * @param {string} newPassword - New password
   * @param {string} confirmPassword - Confirm new password
   * @returns {Promise} { message }
   */
  async confirmPasswordReset(accessToken, newPassword, confirmPassword) {
    return this.client.post('auth/password-reset/confirm/', {
      access_token: accessToken,
      new_password: newPassword,
      confirm_password: confirmPassword
    });
  }
  
  // ========================================================================
  // UTILITY METHODS
  // ========================================================================
  
  /**
   * Resend OTP - works for login, registration, or password reset
   * @param {string} email - User email
   * @param {string} type - 'signup' for registration, 'recovery' for password reset, 'email' for login
   * @returns {Promise} { message, email }
   */
  async resendOTP(email, type = 'email') {
    return this.client.post('auth/resend-otp/', { email, type });
  }
  
  // ========================================================================
  // MFA MANAGEMENT
  // ========================================================================
  
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
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
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
  
  /**
   * Accept invitation - Creates Supabase account and sends OTP
   * @param {string} token - Invitation token
   * @param {string} password - User password
   * @param {string} confirmPassword - Confirm password
   * @returns {Promise} { success, message, requires_verification, email, user }
   */
  async accept(token, password, confirmPassword) {
    return this.client.post('invitations/accept/', {
      token,
      password,
      confirm_password: confirmPassword
    });
  }
  
  /**
   * Verify OTP after invitation acceptance
   * @param {string} email - User email
   * @param {string} otpToken - 6-digit OTP code
   * @returns {Promise} { success, message, user, access_token }
   */
  async verifyOTP(email, otpToken) {
    return this.client.post('invitations/verify-otp/', {
      email,
      otp_token: otpToken
    });
  }
  
  /**
   * Resend OTP for invitation verification
   * @param {string} email - User email
   * @returns {Promise} { success, message }
   */
  async resendOTP(email) {
    return this.client.post('invitations/resend-otp/', {
      email
    });
  }
}

class AuraDeskClient {
  constructor(options = {}) {
    // Use the provided baseURL or default to local
    const baseURL = options.baseURL || 'https://auradesk-api.fly.dev';
    this.apiClient = new DjangoApiClient(baseURL, options);
    
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

// Default to local backend
export const base44 = new AuraDeskClient({
  requiresAuth: true,
  baseURL: 'https://auradesk-api.fly.dev'
});

export const Invitations = base44.invitations;
export default base44;