// src/api/integrations.js - DEBUG VERSION
import { base44 } from './base44Client';

// Gmail Integration Class
class GmailIntegration {
  constructor(client) {
    this.client = client;
  }
  
  async connect(redirectUri) {
    return this.client.post('integrations/Gmail/connect/', { redirect_uri: redirectUri });
  }
  
  async handleCallback(code, state, redirectUri) {
    return this.client.post('integrations/Gmail/callback/', { 
      code, 
      state,
      redirect_uri: redirectUri 
    });
  }
  
  async getStatus() {
    return this.client.get('integrations/Gmail/status/');
  }
  
  async sync(projectId, query = null, maxResults = 50) {
    console.log('=== Gmail.sync called ===');
    console.log('Raw arguments:', { projectId, query, maxResults });
    console.log('projectId type:', typeof projectId);
    console.log('projectId value:', projectId);
    console.log('projectId stringified:', JSON.stringify(projectId));
    
    // Check if projectId is actually defined
    if (projectId === undefined || projectId === null || projectId === '') {
      console.error('❌ projectId is invalid!');
      throw new Error('Invalid project ID provided to Gmail.sync');
    }
    
    const payload = {
      project_id: String(projectId),  // Force to string
      max_results: Number(maxResults)  // Force to number
    };
    
    if (query !== null && query !== undefined && query !== '') {
      payload.query = query;
    }
    
    console.log('✅ Final payload object:', payload);
    console.log('✅ Payload as JSON:', JSON.stringify(payload));
    console.log('✅ Calling endpoint: integrations/Gmail/sync/');
    console.log('========================');
    
    // Call the actual API
    const result = await this.client.post('integrations/Gmail/sync/', payload);
    console.log('API Response:', result);
    return result;
  }
  
  async disconnect() {
    return this.client.delete('integrations/Gmail/disconnect/');
  }
  
  async configure(settings) {
    return this.client.put('integrations/Gmail/configure/', settings);
  }
  
  async listMessages(query = 'is:unread', maxResults = 10) {
    return this.client.get('integrations/Gmail/messages/', { 
      query, 
      max_results: maxResults 
    });
  }
  
  async createTicketFromMessage(messageId) {
    return this.client.post('integrations/Gmail/create-ticket/', { 
      message_id: messageId 
    });
  }
}

// GoTo Integration Class
class GoToIntegration {
  constructor(client) {
    this.client = client;
  }
  
  async connect(redirectUri) {
    throw new Error('GoTo integration not yet implemented');
  }
  
  async disconnect() {
    throw new Error('GoTo integration not yet implemented');
  }
  
  async getStatus() {
    return {
      connected: false,
      meetings_scheduled: 0,
      last_meeting: null
    };
  }
}

// Export Core integrations
export const Core = base44.integrations.Core;

// Export Gmail integration
export const Gmail = new GmailIntegration(base44.apiClient);

// Export GoTo integration
export const GoTo = new GoToIntegration(base44.apiClient);

// Individual Core integration functions
export const InvokeLLM = (prompt, options = {}) => 
  Core.InvokeLLM(prompt, options.model, options.temperature, options.max_tokens);

export const SendEmail = (to_email, subject, message, options = {}) =>
  Core.SendEmail(to_email, subject, message, options.from_email, options.html_message);

export const UploadFile = (file, folder = 'uploads') =>
  Core.UploadFile(file, folder);

export const GenerateImage = (prompt, options = {}) =>
  Core.GenerateImage(prompt, options.size, options.quality);

export const ExtractDataFromUploadedFile = (file) =>
  Core.ExtractDataFromUploadedFile(file);

export const CreateFileSignedUrl = (filename, expiration = 3600) =>
  Core.CreateFileSignedUrl(filename, expiration);

export const UploadPrivateFile = (file, folder = 'private') =>
  Core.UploadPrivateFile(file, folder);