export interface CalendarConnection {
  id: string;
  user_id: string;
  google_account_email: string;
  created_at: string;
  updated_at: string;
}

interface CalendarEventTime {
  dateTime?: string; // present for timed events (RFC3339)
  date?: string;     // present for all-day events (YYYY-MM-DD)
}

export interface CalendarEvent {
  id: string;
  summary: string;
  start: CalendarEventTime;
  end: CalendarEventTime;
  location?: string | null;
  hangoutLink?: string | null;
  htmlLink?: string | null;
  attendeesCount?: number;
  description?: string | null;
}

/** Form-shaped payload for creating/updating a Google Calendar event. */
export interface CalendarEventDraft {
  summary: string;
  description?: string;
  location?: string;
  allDay: boolean;
  date: string;       // YYYY-MM-DD
  startTime: string;  // HH:mm, ignored when allDay
  endTime: string;    // HH:mm, ignored when allDay
}
