import { base44 } from './base44Client';

// Export Core integrations
export const Core = base44.integrations.Core;

// Individual integration functions
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