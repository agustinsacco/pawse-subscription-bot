
export type Event = {
    kind: string;
    etag: string;
    id: string;
    status: string;
    htmlLink: string;
    created: string;
    updated: string;
    summary: string; // Name of event here
    creator: { email: string; };
    organizer: {
      email: string;
      displayName: string;
      self: true
    };
    start: {
      dateTime: string;
      timeZone: string;
    };
    end: {
      dateTime: string;
      timeZone: string;
    };
    iCalUID: string;
    sequence: number;
    reminders: { useDefault: boolean };
    eventType: string;
}