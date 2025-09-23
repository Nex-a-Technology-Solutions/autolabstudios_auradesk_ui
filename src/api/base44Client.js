class DjangoApiClient {
  constructor(baseURL = 'http://localhost:8000', options = {}) {
    this.baseURL = baseURL;
    this.requiresAuth = options.requiresAuth || true;
    this.token = localStorage.getItem('auth_token');
    
    // Default headers
    this.headers = {
      'Content-Type': 'application/json',
    };
    
    // Add authorization header if token exists
    if (this.token) {
      this.headers['Authorization'] = `Bearer ${this.token}`;
    }
  }
  
  // Set authentication token
  setToken(token) {
    this.token = token;
    localStorage.setItem('auth_token', token);
    this.headers['Authorization'] = `Bearer ${token}`;
  }
  
  // Remove authentication token
  removeToken() {
    this.token = null;
    localStorage.removeItem('auth_token');
    delete this.headers['Authorization'];
  }
  
  // Make HTTP request
  async makeRequest(method, endpoint, data = null, params = null) {
    const url = new URL(`${this.baseURL}/api/${endpoint.replace(/^\//, '')}`);
    
    // Add query parameters
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
    
    // Add body for POST/PUT requests
    if (data && ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
      config.body = JSON.stringify(data);
    }
    
    try {
      console.log(`Making ${method.toUpperCase()} request to:`, url.toString());
      const response = await fetch(url, config);
      
      // Handle authentication errors
      if (response.status === 401) {
        this.removeToken();
        throw new Error('Authentication required. Please log in.');
      }
      
      // Handle other errors
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error (${response.status}): ${errorText}`);
      }
      
      // Return JSON response or empty object
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
  
  // HTTP methods
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

// Create entity classes that match Base44 patterns
class Entity {
  constructor(client, entityName) {
    this.client = client;
    this.entityName = entityName;
  }
  
  // List entities with Base44-compatible parameters
  async list(sortBy = '-created_date', limit = 100) {
    return this.client.get(`entities/${this.entityName}/`, { sortBy, limit });
  }
  
  // Filter entities with conditions
  async filter(conditions, sortBy = '-created_date', limit = 100) {
    // Clean and validate conditions
    const cleanConditions = {};
    
    for (const [key, value] of Object.entries(conditions)) {
      // Skip null, undefined, or empty values
      if (value === null || value === undefined || value === '') {
        continue;
      }
      
      // Convert values to appropriate types
      if (key === 'project_id' && typeof value === 'string') {
        cleanConditions[key] = value; // Keep as string, Django will convert
      } else if (key === 'id' && typeof value === 'string') {
        cleanConditions[key] = value; // Keep as string, Django will convert
      } else if (typeof value === 'object' && !(value instanceof Date)) {
        // Skip complex objects that might cause issues
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
    
    console.log('Sending filter data:', data); // Debug log
    
    return this.client.post(`entities/${this.entityName}/filter/`, data);
  }
  
  // Create new entity
  async create(data) {
    return this.client.post(`entities/${this.entityName}/`, data);
  }
  
  // Bulk create entities
  async bulkCreate(dataList) {
    return this.client.post(`entities/${this.entityName}/bulk-create/`, dataList);
  }
  
  // Update entity
  async update(id, data) {
    return this.client.put(`entities/${this.entityName}/${id}/`, data);
  }
  
  // Delete entity
  async delete(id) {
    return this.client.delete(`entities/${this.entityName}/${id}/`);
  }
  
  // Get single entity
  async get(id) {
    return this.client.get(`entities/${this.entityName}/${id}/`);
  }
  
  // Get entity schema
  async schema() {
    return this.client.get(`entities/${this.entityName}/schema/`);
  }
}

// User entity with special auth methods
class UserEntity {
  constructor(client) {
    this.client = client;
    this.entityName = 'User'; // Keep for compatibility
  }
  
  // List users - uses auth endpoint, not entities endpoint
  async list(sortBy = '-created_date', limit = 100) {
    return this.client.get('auth/users/', { sortBy, limit });
  }
  
  // Filter users - NOT IMPLEMENTED in Django yet, so let's make it work
  async filter(conditions, sortBy = '-created_date', limit = 100) {
    // For now, just list all users and filter client-side
    // TODO: Implement server-side filtering later
    const allUsers = await this.list(sortBy, limit);
    
    // Simple client-side filtering
    if (!conditions || Object.keys(conditions).length === 0) {
      return allUsers;
    }
    
    return allUsers.filter(user => {
      return Object.entries(conditions).every(([key, value]) => {
        return user[key] === value;
      });
    });
  }
  
  // Create user - uses auth endpoint
  async create(data) {
    return this.client.post('auth/users/', data);
  }
  
  // Get single user by ID - uses auth endpoint
  async get(id) {
    return this.client.get(`auth/users/${id}/`);
  }
  
  // Update user by ID - uses auth endpoint  
  async update(id, data) {
    return this.client.put(`auth/users/${id}/`, data);
  }
  
  // Delete user - uses auth endpoint
  async delete(id) {
    return this.client.delete(`auth/users/${id}/`);
  }
  
  // Get current user
  async me() {
    return this.client.get('auth/users/me/');
  }
  
  // Update current user's data
  async updateMyUserData(data) {
    return this.client.put('auth/users/me/', data);
  }
  
  // Login user
  async login(email, password) {
    const result = await this.client.post('auth/login/', { email, password });
    
    // Set token for future requests
    if (result.access) {
      this.client.setToken(result.access);
    }
    
    return result;
  }
  
  // Login with redirect
  async loginWithRedirect(callbackUrl) {
    return this.client.post('auth/login-redirect/', { callback_url: callbackUrl });
  }
  
  // Logout user
  async logout() {
    const result = await this.client.post('auth/logout/');
    this.client.removeToken();
    return result;
  }
  
  // Get schema (mock for compatibility)
  async schema() {
    return {
      name: "User",
      type: "object",
      properties: {
        email: { type: "string", description: "User's email address" },
        full_name: { type: "string", description: "User's full name" },
        role: { type: "string", enum: ["admin", "user"], description: "User role" },
        projects: { type: "array", description: "Array of project IDs" }
      },
      required: ["email", "full_name"]
    };
  }
  
  // Bulk create - not implemented, but provide for compatibility
  async bulkCreate(dataList) {
    throw new Error('Bulk user creation not implemented');
  }
}

// Core integrations class
class CoreIntegrations {
  constructor(client) {
    this.client = client;
  }
  
  // Invoke LLM
  async InvokeLLM(prompt, model = 'gpt-3.5-turbo', temperature = 0.7, max_tokens = 1000) {
    return this.client.post('integrations/Core/InvokeLLM/', {
      prompt,
      model,
      temperature,
      max_tokens
    });
  }
  
  // Send email
  async SendEmail(to_email, subject, message, from_email = null, html_message = null) {
    return this.client.post('integrations/Core/SendEmail/', {
      to_email,
      subject,
      message,
      from_email,
      html_message
    });
  }
  
  // Upload file (requires FormData)
  async UploadFile(file, folder = 'uploads') {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);
    
    // Override content-type for file upload
    const headers = { ...this.client.headers };
    delete headers['Content-Type']; // Let browser set multipart boundary
    
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
  
  // Generate image
  async GenerateImage(prompt, size = '1024x1024', quality = 'standard') {
    return this.client.post('integrations/Core/GenerateImage/', {
      prompt,
      size,
      quality
    });
  }
  
  // Create signed URL
  async CreateFileSignedUrl(filename, expiration = 3600) {
    return this.client.post('integrations/Core/CreateFileSignedUrl/', {
      filename,
      expiration
    });
  }
  
  // Upload private file
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
  
  // Extract data from uploaded file
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

// Main client class that mimics Base44 structure
class AuraDeskClient {
  constructor(options = {}) {
    this.apiClient = new DjangoApiClient('http://localhost:8000', options);
    
    // Initialize entities
    this.entities = {
      Ticket: new Entity(this.apiClient, 'Ticket'),
      TicketMessage: new Entity(this.apiClient, 'TicketMessage'),
      Project: new Entity(this.apiClient, 'Project'),
    };
    
    // Initialize auth
    this.auth = new UserEntity(this.apiClient);
    
    // Initialize integrations
    this.integrations = {
      Core: new CoreIntegrations(this.apiClient)
    };

    this.invitations = new InvitationService(this.apiClient);
  }
  
  // Set authentication token
  setToken(token) {
    this.apiClient.setToken(token);
  }
  
  // Remove authentication token
  removeToken() {
    this.apiClient.removeToken();
  }
  
  // Get current token
  getToken() {
    return this.apiClient.token;
  }
}

class InvitationService {
  constructor(client) {
    this.client = client;
  }
  
  // List all invitations (admin only)
  async list() {
    return this.client.get('invitations/');
  }
  
  // Create new invitation
  async create(invitationData) {
    return this.client.post('invitations/', invitationData);
  }
  
  // Get invitation details
  async get(id) {
    return this.client.get(`invitations/${id}/`);
  }
  
  // Update invitation
  async update(id, data) {
    return this.client.put(`invitations/${id}/`, data);
  }
  
  // Delete/cancel invitation
  async delete(id) {
    return this.client.delete(`invitations/${id}/`);
  }
  
  // Resend invitation email
  async resend(id) {
    return this.client.post(`invitations/${id}/resend/`);
  }
  
  // Get invitation details by token (public)
  async getByToken(token) {
    return this.client.get(`invitations/details/${token}/`);
  }
  
  // Accept invitation (public)
  async accept(token, password, confirmPassword) {
    return this.client.post('invitations/accept/', {
      token,
      password,
      confirm_password: confirmPassword
    });
  }
}

// Create and export the client instance
export const base44 = new AuraDeskClient({
  requiresAuth: true
});

export const Invitations = base44.invitations;
// Also export individual components for backwards compatibility
export default base44;
