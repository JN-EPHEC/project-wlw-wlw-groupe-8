import { auth, db } from '@/fireBaseConfig';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { collection, getDocs, limit, query, serverTimestamp, updateDoc, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

type UserRole = 'client' | 'prestataire';

let notificationHandlerConfigured = false;

const ensureNotificationHandler = () => {
  if (notificationHandlerConfigured) return;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
  notificationHandlerConfigured = true;
};

const getProjectId = () => {
  const easProjectId =
    Constants?.expoConfig?.extra?.eas?.projectId ??
    Constants?.easConfig?.projectId ??
    process.env.EXPO_PROJECT_ID;
  return easProjectId;
};

async function registerForPushNotificationsAsync(role: UserRole) {
  ensureNotificationHandler();
  let permissions = await Notifications.getPermissionsAsync();
  if (!permissions.granted) {
    permissions = await Notifications.requestPermissionsAsync();
  }
  if (!permissions.granted) {
    console.warn(`[push] Permissions denied for role ${role}`);
    return null;
  }
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF00FF',
    });
  }
  const projectId = getProjectId();
  if (!projectId) {
    console.warn('[push] Missing EAS projectId, cannot fetch push token.');
    return null;
  }
  const tokenResult = await Notifications.getExpoPushTokenAsync({ projectId });
  return tokenResult.data;
}

export default function usePushNotifications(role: UserRole) {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    registerForPushNotificationsAsync(role).then(setToken).catch((error) => {
      console.error('[push] Failed to register for notifications', error);
    });
  }, [role]);

  useEffect(() => {
    const syncToken = async () => {
      if (!token) return;
      const user = auth.currentUser;
      if (!user) return;
      try {
        const snapshot = await getDocs(
          query(
            collection(db, 'contacts'),
            where('userId', '==', user.uid),
            where('type', '==', role === 'client' ? 'client' : 'prestataire'),
            limit(1),
          ),
        );
        if (snapshot.empty) {
          console.warn('[push] No contact doc found for current user');
          return;
        }
        const docRef = snapshot.docs[0].ref;
        const currentData = snapshot.docs[0].data();
        if (currentData.expoPushToken === token) {
          return;
        }
        await updateDoc(docRef, {
          expoPushToken: token,
          pushTokenUpdatedAt: serverTimestamp(),
        });
      } catch (error) {
        console.error('[push] Failed to sync push token', error);
      }
    };
    syncToken();
  }, [role, token]);

  return token;
}
