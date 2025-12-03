import { rtdb } from "@/lib/firebase";

export type LogActionType =
  | "USER_LOGIN"
  | "USER_LOGOUT"
  | "USER_CREATED"
  | "EVENT_CREATED"
  | "EVENT_UPDATED"
  | "INVENTORY_ADDED"
  | "INVENTORY_REMOVED"
  | "INVENTORY_RETURNED"
  | "INVENTORY_LOSS"
  | "SYSTEM_ACTION";

interface LogEntry {
  action: LogActionType;
  details: Record<string, any>;
  userId: string;
  userName: string;
  timestamp: number; // Unix timestamp
  createdAt: string; // ISO string for readability
}

/**
 * Logs an action to the Firebase Realtime Database.
 * @param action The type of action being performed.
 * @param details Additional details about the action (e.g., event ID, item name).
 * @param user The user performing the action (must include id and name).
 */
export async function logAction(
  action: LogActionType,
  details: Record<string, any>,
  user: { id: string; name: string }
) {
  try {
    const timestamp = Date.now();
    const logEntry: LogEntry = {
      action,
      details,
      userId: user.id,
      userName: user.name,
      timestamp,
      createdAt: new Date(timestamp).toISOString(),
    };

    // Push to 'logs' node in RTDB (Global Ledger)
    const logRef = rtdb.ref("logs").push();
    await logRef.set(logEntry);

    // Fan-out: Push to 'event_logs/{eventId}' if eventId exists in details
    if (details.eventId) {
      await rtdb.ref(`event_logs/${details.eventId}`).push(logEntry);
    }

    console.log(`[LOG] Action logged: ${action} by ${user.name}`);
  } catch (error) {
    console.error("[LOG] Failed to log action:", error);
    // We don't want to crash the app if logging fails, so we just catch the error
  }
}
