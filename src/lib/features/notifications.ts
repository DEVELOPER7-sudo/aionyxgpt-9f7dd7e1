import { supabase } from '../../integrations/supabase/client';
import { NotificationPreferences, Reminder } from '../../types/features';

// ============================================================
// NOTIFICATION PREFERENCES
// ============================================================

export const getNotificationPreferences = async (
  userId: string
): Promise<NotificationPreferences | null> => {
  const { data, error } = await supabase
    .from('notification_preferences')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') {
    // PGRST116 = no rows found
    throw new Error(`Failed to fetch notification preferences: ${error.message}`);
  }

  return data || null;
};

export const createNotificationPreferences = async (
  userId: string
): Promise<NotificationPreferences> => {
  const { data, error } = await supabase
    .from('notification_preferences')
    .insert({
      user_id: userId,
      email_new_comments: true,
      email_chat_shared: true,
      email_team_update: true,
      email_mentions: true,
      email_weekly_digest: true,
      browser_notifications: true,
      digest_time: '08:00:00',
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create preferences: ${error.message}`);
  return data;
};

export const updateNotificationPreferences = async (
  userId: string,
  updates: Partial<NotificationPreferences>
): Promise<NotificationPreferences> => {
  const { data, error } = await supabase
    .from('notification_preferences')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw new Error(`Failed to update preferences: ${error.message}`);
  return data;
};

// ============================================================
// REMINDER OPERATIONS
// ============================================================

export const createReminder = async (
  userId: string,
  title: string,
  scheduledFor: string,
  options?: {
    description?: string;
    recurrence?: 'once' | 'daily' | 'weekly' | 'monthly';
  }
): Promise<Reminder> => {
  const { data, error } = await supabase
    .from('reminders')
    .insert({
      user_id: userId,
      title,
      description: options?.description,
      scheduled_for: scheduledFor,
      recurrence: options?.recurrence || 'once',
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create reminder: ${error.message}`);
  return data;
};

export const getReminders = async (userId: string): Promise<Reminder[]> => {
  const { data, error } = await supabase
    .from('reminders')
    .select('*')
    .eq('user_id', userId)
    .eq('is_completed', false)
    .order('scheduled_for', { ascending: true });

  if (error) throw new Error(`Failed to fetch reminders: ${error.message}`);
  return data || [];
};

export const getUpcomingReminders = async (
  userId: string,
  hoursAhead: number = 24
): Promise<Reminder[]> => {
  const now = new Date();
  const future = new Date(now.getTime() + hoursAhead * 60 * 60 * 1000);

  const { data, error } = await supabase
    .from('reminders')
    .select('*')
    .eq('user_id', userId)
    .eq('is_completed', false)
    .gte('scheduled_for', now.toISOString())
    .lte('scheduled_for', future.toISOString())
    .order('scheduled_for', { ascending: true });

  if (error) throw new Error(`Failed to fetch upcoming reminders: ${error.message}`);
  return data || [];
};

export const completeReminder = async (reminderId: string): Promise<Reminder> => {
  const { data, error } = await supabase
    .from('reminders')
    .update({
      is_completed: true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', reminderId)
    .select()
    .single();

  if (error) throw new Error(`Failed to complete reminder: ${error.message}`);
  return data;
};

export const updateReminder = async (
  reminderId: string,
  updates: Partial<Reminder>
): Promise<Reminder> => {
  const { data, error } = await supabase
    .from('reminders')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', reminderId)
    .select()
    .single();

  if (error) throw new Error(`Failed to update reminder: ${error.message}`);
  return data;
};

export const deleteReminder = async (reminderId: string): Promise<void> => {
  const { error } = await supabase.from('reminders').delete().eq('id', reminderId);

  if (error) throw new Error(`Failed to delete reminder: ${error.message}`);
};

export const snoozeReminder = async (
  reminderId: string,
  minutesFromNow: number
): Promise<Reminder> => {
  const newTime = new Date(Date.now() + minutesFromNow * 60 * 1000);
  return updateReminder(reminderId, { scheduled_for: newTime.toISOString() });
};

// ============================================================
// BROWSER NOTIFICATIONS
// ============================================================

export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  if (!('Notification' in window)) {
    throw new Error('Browser does not support notifications');
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission !== 'denied') {
    return await Notification.requestPermission();
  }

  return 'denied';
};

export const sendBrowserNotification = (
  title: string,
  options?: NotificationOptions
): Notification | null => {
  if (Notification.permission !== 'granted') {
    return null;
  }

  return new Notification(title, options);
};

export const registerNotificationCallback = (callback: (notification: Notification) => void) => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then((registration) => {
      registration.onmessage = (event) => {
        if (event.data.type === 'notification') {
          callback(event.data.notification);
        }
      };
    });
  }
};

// ============================================================
// EMAIL DIGEST HELPERS
// ============================================================

export const shouldSendDigest = (preferences: NotificationPreferences): boolean => {
  return preferences.email_weekly_digest;
};

export const getDigestSendTime = (preferences: NotificationPreferences): string => {
  return preferences.digest_time || '08:00:00';
};

export const isInQuietHours = (preferences: NotificationPreferences): boolean => {
  if (!preferences.quiet_hours_start || !preferences.quiet_hours_end) {
    return false;
  }

  const now = new Date();
  const currentTime = now.getHours() + ':' + now.getMinutes().toString().padStart(2, '0');

  const start = preferences.quiet_hours_start;
  const end = preferences.quiet_hours_end;

  if (start < end) {
    return currentTime >= start && currentTime < end;
  } else {
    return currentTime >= start || currentTime < end;
  }
};

// ============================================================
// NOTIFICATION STATE MANAGEMENT
// ============================================================

export class NotificationManager {
  private userId: string;
  private preferences: NotificationPreferences | null = null;

  constructor(userId: string) {
    this.userId = userId;
  }

  async initialize(): Promise<void> {
    this.preferences = await getNotificationPreferences(this.userId);

    if (!this.preferences) {
      this.preferences = await createNotificationPreferences(this.userId);
    }
  }

  canSendEmail(type: keyof Omit<NotificationPreferences, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'quiet_hours_start' | 'quiet_hours_end' | 'digest_time'>): boolean {
    if (!this.preferences) return false;
    if (isInQuietHours(this.preferences)) return false;
    return this.preferences[type] === true;
  }

  canSendBrowserNotification(): boolean {
    if (!this.preferences) return false;
    return this.preferences.browser_notifications === true && Notification.permission === 'granted';
  }

  async sendNotification(
    title: string,
    type: 'comment' | 'mention' | 'share' | 'update',
    options?: NotificationOptions
  ): Promise<void> {
    if (this.canSendBrowserNotification()) {
      sendBrowserNotification(title, options);
    }
  }
}
