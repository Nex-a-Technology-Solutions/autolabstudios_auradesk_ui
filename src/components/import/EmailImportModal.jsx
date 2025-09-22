import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Mail, Upload, X, AlertCircle, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function EmailImportModal({ 
  isOpen, 
  onClose, 
  onImport, 
  projects, 
  isImporting = false 
}) {
  const [emailContent, setEmailContent] = useState('');
  const [selectedProject, setSelectedProject] = useState('');
  const [parsedEmail, setParsedEmail] = useState(null);
  const [parseError, setParseError] = useState('');

  const parseEmailContent = (content) => {
    try {
      const lines = content.split('\n');
      let subject = '';
      let from = '';
      let body = '';
      let bodyStarted = false;
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // Look for subject
        if (line.toLowerCase().startsWith('subject:')) {
          subject = line.substring(8).trim();
        }
        // Look for from
        else if (line.toLowerCase().startsWith('from:')) {
          from = line.substring(5).trim();
          // Extract email from "Name <email>" format
          const emailMatch = from.match(/<([^>]+)>/);
          if (emailMatch) {
            from = emailMatch[1];
          } else {
            // If no angle brackets, try to find email pattern
            const directEmailMatch = from.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/);
            if (directEmailMatch) {
              from = directEmailMatch[0];
            }
          }
        }
        // Look for date (optional for now)
        else if (line.toLowerCase().startsWith('date:')) {
          // Could parse date here if needed
        }
        // Start collecting body after headers
        else if (bodyStarted || (line === '' && (subject || from))) {
          bodyStarted = true;
          if (line !== '' || body !== '') { // Skip initial empty lines but keep content spacing
            body += line + '\n';
          }
        }
      }

      // Clean up body
      body = body.trim();
      
      // If no clear headers found, treat entire content as body and try to extract email
      if (!subject && !from && content.includes('@')) {
        body = content;
        const emailMatch = content.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/);
        if (emailMatch) {
          from = emailMatch[0];
        }
        // Use first line as potential subject if it's not too long
        const firstLine = content.split('\n')[0];
        if (firstLine && firstLine.length < 100) {
          subject = firstLine;
          body = content.substring(firstLine.length).trim();
        }
      }

      if (!subject && !body) {
        throw new Error('Could not parse email content. Please check the format.');
      }

      return {
        subject: subject || 'Imported Email',
        from: from || '',
        body: body || content
      };
    } catch (error) {
      throw new Error('Failed to parse email content. Please check the format and try again.');
    }
  };

  const handleParseEmail = () => {
    setParseError('');
    setParsedEmail(null);
    
    if (!emailContent.trim()) {
      setParseError('Please paste email content first.');
      return;
    }

    try {
      const parsed = parseEmailContent(emailContent);
      setParsedEmail(parsed);
    } catch (error) {
      setParseError(error.message);
    }
  };

  const handleImport = () => {
    if (!parsedEmail || !selectedProject) {
      setParseError('Please select a project and parse email content first.');
      return;
    }

    const ticketData = {
      title: parsedEmail.subject,
      description: parsedEmail.body,
      client_email: parsedEmail.from,
      project_id: selectedProject,
      category: 'general_inquiry',
      priority: 'medium'
    };

    onImport(ticketData);
  };

  const handleClose = () => {
    setEmailContent('');
    setParsedEmail(null);
    setParseError('');
    setSelectedProject('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Import Ticket from Email
          </DialogTitle>
          <DialogDescription>
            Paste Gmail email content below to automatically create a support ticket.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Email Content Input */}
          <div>
            <Label htmlFor="emailContent">Email Content</Label>
            <Textarea
              id="emailContent"
              placeholder="Paste your Gmail email content here including headers (From:, Subject:, etc.)&#10;&#10;Example:&#10;From: client@example.com&#10;Subject: Website login issue&#10;Date: Mon, 1 Jan 2024 10:00:00&#10;&#10;Hi team,&#10;&#10;I'm having trouble logging into the website..."
              value={emailContent}
              onChange={(e) => setEmailContent(e.target.value)}
              rows={12}
              className="mt-2"
            />
          </div>

          {/* Parse Button */}
          <div className="flex gap-3">
            <Button 
              onClick={handleParseEmail}
              variant="outline"
              disabled={!emailContent.trim()}
            >
              <Upload className="w-4 h-4 mr-2" />
              Parse Email
            </Button>
          </div>

          {/* Parse Error */}
          {parseError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{parseError}</AlertDescription>
            </Alert>
          )}

          {/* Parsed Email Preview */}
          {parsedEmail && (
            <div className="space-y-4 p-4 border border-green-200 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle className="w-4 h-4" />
                <span className="font-medium">Email Parsed Successfully</span>
              </div>
              
              <div className="space-y-3">
                <div>
                  <Label className="text-green-800 font-medium">Subject (Ticket Title)</Label>
                  <Input 
                    value={parsedEmail.subject} 
                    onChange={(e) => setParsedEmail({...parsedEmail, subject: e.target.value})}
                    className="mt-1 bg-white border-green-200"
                  />
                </div>
                
                <div>
                  <Label className="text-green-800 font-medium">From (Client Email)</Label>
                  <Input 
                    value={parsedEmail.from} 
                    onChange={(e) => setParsedEmail({...parsedEmail, from: e.target.value})}
                    className="mt-1 bg-white border-green-200"
                    placeholder="client@example.com"
                  />
                </div>
                
                <div>
                  <Label className="text-green-800 font-medium">Body (Ticket Description)</Label>
                  <Textarea 
                    value={parsedEmail.body} 
                    onChange={(e) => setParsedEmail({...parsedEmail, body: e.target.value})}
                    rows={6}
                    className="mt-1 bg-white border-green-200"
                  />
                </div>

                <div>
                  <Label className="text-green-800 font-medium">Project *</Label>
                  <Select value={selectedProject} onValueChange={setSelectedProject}>
                    <SelectTrigger className="mt-1 bg-white border-green-200">
                      <SelectValue placeholder="Select a project for this ticket" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map(project => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleImport}
              disabled={!parsedEmail || !selectedProject || isImporting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isImporting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Creating Ticket...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Create Ticket
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}