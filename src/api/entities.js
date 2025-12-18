//api/entities.js
// This file exports the entities used in the AuraDesk UI.
// It has been modified to point to the Django API via the base44 client.

import { base44 } from './base44Client';

// Export entities (these now point to Django API)
export const Ticket = base44.entities.Ticket;
export const TicketMessage = base44.entities.TicketMessage;
export const Project = base44.entities.Project;
export const Invitations = base44.invitations;
export const TimeTracker = base44.timeTracker;

// Auth - export the user entity
export const User = base44.auth;