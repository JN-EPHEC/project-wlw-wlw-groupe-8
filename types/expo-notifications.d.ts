declare module 'expo-notifications' {
  export enum AndroidImportance {
    DEFAULT = 3,
    HIGH = 4,
    MAX = 5,
  }

  export type NotificationPermissionsStatus = {
    status: 'granted' | 'undetermined' | 'denied';
    granted: boolean;
  };

  export function getPermissionsAsync(): Promise<NotificationPermissionsStatus>;
  export function requestPermissionsAsync(): Promise<NotificationPermissionsStatus>;
  export function getExpoPushTokenAsync(options?: { projectId?: string }): Promise<{ data: string }>;
  export function setNotificationChannelAsync(
    channelId: string,
    channel: {
      name?: string;
      importance?: AndroidImportance;
      vibrationPattern?: number[];
      lightColor?: string;
      sound?: string;
    },
  ): Promise<void>;
  export function setNotificationHandler(handler: {
    handleNotification: () => Promise<{
      shouldShowAlert: boolean;
      shouldPlaySound: boolean;
      shouldSetBadge: boolean;
    }>;
  }): void;
}
