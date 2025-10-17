import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';
import { useSettingsStore } from '@/store/settingsStore';
import { usePermissions } from '@/composables/usePermissions';

class NotificationService {
  constructor() {
    this.initialized = false;
    this.platform = Capacitor.getPlatform();
    this.isMobile = ['android', 'ios'].includes(this.platform);
  }

  async initialize() {
    if (!this.isMobile || this.initialized) {
      return;
    }

    try {
      // Check if plugin is available first
      if (!LocalNotifications) {
        console.log('LocalNotifications plugin not available');
        return false;
      }

      // Use permission composable for better handling
      const { requestNotificationPermission } = usePermissions();
      const permissionResult = await requestNotificationPermission();

      if (!permissionResult.granted) {
        console.log('Notification permission denied');
        return false;
      }

      if (permissionResult.granted) {
        // Register notification channels for Android
        if (this.platform === 'android') {
          await LocalNotifications.createChannel({
            id: 'sequence-events',
            name: 'Sequence Events',
            description: 'Notifications for sequence events',
            importance: 5, // Max importance to bypass doze
            visibility: 1, // Public visibility
            sound: 'beep.wav', // Default sound
            vibration: true,
            lights: true,
            lightColor: '#0891b2',
          });

          await LocalNotifications.createChannel({
            id: 'phd2-events',
            name: 'PHD2 Critical Events',
            description: 'Critical notifications for PHD2 guiding events',
            importance: 5, // Max importance to bypass doze
            visibility: 1, // Public visibility
            sound: 'beep.wav', // Default sound
            vibration: true,
            lights: true,
            lightColor: '#FF0000', // Red light for critical events
          });
        }

        this.initialized = true;
        return true;
      } else {
        console.log('Notification permission denied');
        return false;
      }
    } catch (error) {
      console.error('Error initializing notifications:', error);
      return false;
    }
  }

  async sendNotification(
    title,
    body,
    id = Math.floor(Math.random() * 10000),
    channelId = 'sequence-events',
    priority = 'default'
  ) {
    const settingsStore = useSettingsStore();

    if (!this.isMobile || !settingsStore.notifications.enabled) {
      return;
    }

    if (!this.initialized) {
      const initialized = await this.initialize();
      if (!initialized) return;
    }

    try {
      const notification = {
        title,
        body,
        id,
        schedule: { at: new Date(Date.now() + 1000) }, // Schedule 1 second from now to bypass doze
        sound: this.platform === 'android' ? 'beep.wav' : null,
        channelId: this.platform === 'android' ? channelId : null,
        smallIcon: 'ic_stat_icon',
        iconColor: priority === 'critical' ? '#FF0000' : '#0891b2', // Red for critical, cyan for normal
        actionTypeId: '',
        extra: {
          timestamp: new Date().toISOString(),
          priority: priority,
        },
      };

      // For critical notifications, add additional properties to bypass doze mode
      if (priority === 'critical') {
        notification.ongoing = true; // Makes it persistent
        notification.autoCancel = false; // User must dismiss manually
        if (this.platform === 'android') {
          notification.importance = 5; // IMPORTANCE_HIGH
          notification.priority = 2; // PRIORITY_MAX
        }
      }

      await LocalNotifications.schedule({
        notifications: [notification],
      });

      console.log(`Notification scheduled: ${title} (Priority: ${priority})`);
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }

  async sendSequenceNotification(event, details = '') {
    const settingsStore = useSettingsStore();

    if (!settingsStore.notifications.sequence.enabled) {
      return;
    }

    let title,
      body,
      priority = 'default';

    switch (event) {
      case 'started':
        title = 'Sequence Started';
        body = 'Your imaging sequence has started';
        break;
      case 'reset':
        title = 'Sequence Reset';
        body = 'Your imaging sequence has been reset';
        break;
      case 'completed':
        title = 'Sequence Completed';
        body = 'Your imaging sequence has completed successfully';
        break;
      case 'error':
        title = 'Sequence Error';
        body = `Error in sequence: ${details}`;
        priority = 'critical'; // Critical priority for sequence errors
        break;
      default:
        title = 'Sequence Event';
        body = details || 'A sequence event occurred';
    }

    await this.sendNotification(
      title,
      body,
      Math.floor(Math.random() * 10000),
      'sequence-events',
      priority
    );
  }

  async sendPhd2Notification(event, details = '') {
    const settingsStore = useSettingsStore();

    if (!settingsStore.notifications.phd2.enabled) {
      return;
    }

    let title,
      body,
      priority = 'default';

    switch (event) {
      case 'star-lost':
        title = 'PHD2: Star Lost';
        body = 'Guiding star has been lost and requires attention';
        priority = 'critical'; // Critical priority for star lost
        break;
      case 'guiding-started':
        title = 'PHD2: Guiding Started';
        body = 'PHD2 has successfully started guiding';
        break;
      case 'guiding-stopped':
        title = 'PHD2: Guiding Stopped';
        body = 'PHD2 guiding has been stopped';
        break;
      case 'calibration-complete':
        title = 'PHD2: Calibration Complete';
        body = 'PHD2 calibration has completed successfully';
        break;
      case 'calibration-failed':
        title = 'PHD2: Calibration Failed';
        body = `PHD2 calibration failed: ${details}`;
        priority = 'high'; // High priority for calibration failures
        break;
      case 'error':
        title = 'PHD2: Error';
        body = `PHD2 error: ${details}`;
        priority = 'high'; // High priority for errors
        break;
      default:
        title = 'PHD2: Event';
        body = details || 'A PHD2 event occurred';
    }

    await this.sendNotification(
      title,
      body,
      Math.floor(Math.random() * 10000),
      'phd2-events',
      priority
    );
  }
}

export default new NotificationService();
