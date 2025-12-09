import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import React from 'react';
import { View } from 'react-native';

import { useUnreadMessages } from '@/hooks/useUnreadMessages';

const TabIcon = ({
  name,
  color,
  size,
  showBadge,
}: {
  name: React.ComponentProps<typeof Ionicons>['name'];
  color: string;
  size: number;
  showBadge?: boolean;
}) => (
  <View style={{ position: 'relative' }}>
    <Ionicons name={name} color={color} size={size} />
    {showBadge ? (
      <View
        style={{
          position: 'absolute',
          top: -2,
          right: -4,
          width: 10,
          height: 10,
          borderRadius: 5,
          backgroundColor: '#FF4E6B',
        }}
      />
    ) : null}
  </View>
);

export default function TabsLayout() {
  const hasUnread = useUnreadMessages('prestataire');
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#12DFD8',
        tabBarInactiveTintColor: '#8E8E93',
        tabBarStyle: {
          height: 90,
          paddingTop: 10,
        },
        tabBarLabelStyle: { fontSize: 12 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Accueil',
          tabBarIcon: ({ color, size }) => <TabIcon name="home" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="demandes"
        options={{
          title: 'Demandes',
          tabBarIcon: ({ color, size }) => <TabIcon name="book" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Messages',
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="chatbubbles" color={color} size={size} showBadge={hasUnread} />
          ),
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: 'Stats',
          tabBarIcon: ({ color, size }) => <TabIcon name="bar-chart" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="params"
        options={{
          title: 'Paramètres',
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="settings-outline" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
