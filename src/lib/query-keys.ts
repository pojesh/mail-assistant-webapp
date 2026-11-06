/** TanStack Query keys in one place, so invalidation stays consistent. */
export const queryKeys = {
  me: ["me"] as const,
  emails: (filters: Record<string, unknown>) => ["emails", filters] as const,
  allEmails: ["emails"] as const,
  email: (id: string) => ["email", id] as const,
  approvals: (status: string) => ["approvals", status] as const,
  allApprovals: ["approvals"] as const,
  preferences: ["preferences"] as const,
  notes: ["preference-notes"] as const,
  agenda: (from: string, to: string) => ["agenda", from, to] as const,
  notifications: ["notifications"] as const,
  dashboard: ["dashboard"] as const,
  digest: ["digest"] as const,
  activity: ["activity"] as const,
  attachments: (q: string) => ["attachments", q] as const,
  chatSessions: ["chat-sessions"] as const,
  chatSession: (id: string) => ["chat-session", id] as const,
};
