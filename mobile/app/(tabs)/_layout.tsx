// ============================================================================
// SmartStudy AI Mobile — Tab Navigation Layout
// Bottom tab bar with 5 tabs: Home, Study, Chat, Library, Profile
// ============================================================================

import { Tabs } from 'expo-router';
import { View, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, BORDER_RADIUS, SHADOWS, SPACING } from '@/constants/theme';
import { useAppStore } from '@/lib/store';

type TabIconName = React.ComponentProps<typeof Ionicons>['name'];

interface TabIconProps {
  name: TabIconName;
  focused: boolean;
  badge?: number;
}

function TabIcon({ name, focused, badge }: TabIconProps) {
  return (
    <View style={styles.iconContainer}>
      <View
        style={[
          styles.iconWrapper,
          focused && styles.iconWrapperActive,
        ]}
      >
        <Ionicons
          name={name}
          size={22}
          color={focused ? COLORS.primary : COLORS.textMuted}
        />
      </View>
      {badge !== undefined && badge > 0 && (
        <View style={styles.badge}>
          <Ionicons name="ellipse" size={8} color={COLORS.accent} />
        </View>
      )}
    </View>
  );
}

export default function TabLayout() {
  const pendingSyncCount = useAppStore((s) => s.pendingSyncCount);
  const dueCards = useAppStore((s) => s.dueCards);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarLabelStyle: styles.tabLabel,
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Accueil',
          tabBarIcon: ({ focused }) => (
            <TabIcon name={focused ? 'home' : 'home-outline'} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="study"
        options={{
          title: 'Réviser',
          tabBarIcon: ({ focused }) => (
            <TabIcon
              name={focused ? 'flash' : 'flash-outline'}
              focused={focused}
              badge={dueCards.length}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Chat IA',
          tabBarIcon: ({ focused }) => (
            <TabIcon
              name={focused ? 'chatbubbles' : 'chatbubbles-outline'}
              focused={focused}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="library"
        options={{
          title: 'Bibliothèque',
          tabBarIcon: ({ focused }) => (
            <TabIcon
              name={focused ? 'library' : 'library-outline'}
              focused={focused}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ focused }) => (
            <TabIcon
              name={focused ? 'person' : 'person-outline'}
              focused={focused}
              badge={pendingSyncCount}
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: COLORS.card,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    height: Platform.OS === 'ios' ? 88 : 64,
    paddingBottom: Platform.OS === 'ios' ? 28 : 8,
    paddingTop: 8,
    ...SHADOWS.card,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  iconContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapper: {
    width: 40,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BORDER_RADIUS.md,
  },
  iconWrapperActive: {
    backgroundColor: COLORS.primaryGlow,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -4,
  },
});
