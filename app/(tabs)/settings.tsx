import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '@/src/constants';
import { useAppSetupService } from '@/src/providers/AppProvider';

// Define the material community icon names we'll use
type IconName = 
  | 'bell-outline'
  | 'theme-light-dark'
  | 'bluetooth-settings'
  | 'devices'
  | 'cloud-upload-outline'
  | 'export'
  | 'delete-outline'
  | 'information-outline'
  | 'help-circle-outline' 
  | 'shield-check-outline'
  | 'chevron-right';

type SettingItemType = {
  id: string;
  title: string;
  description: string;
  icon: IconName;
  type: 'toggle' | 'link' | 'info';
  value?: boolean;
  onValueChange?: (value: boolean) => void;
  onPress?: () => void;
  danger?: boolean;
};

type SettingsSectionType = {
  title: string;
  items: SettingItemType[];
};

// Custom theme colors for beige theme - matching the dashboard
const THEME = {
  background: '#f2efe4', // Beige background matching bottom bar
  cardBackground: '#ffffff',
  primary: '#00b076', // Green primary color
  text: {
    primary: '#333333',
    secondary: '#666666',
    tertiary: '#999999',
  },
  divider: 'rgba(0,0,0,0.08)',
  card: {
    shadow: 'rgba(0,0,0,0.12)',
    border: 'rgba(0,0,0,0.05)',
  },
  danger: '#ff3b30'
};

// Premium Glass Card component
const GlassCard = ({ style, children, intensity = 15 }) => {
  return Platform.OS === 'ios' ? (
    <BlurView intensity={intensity} tint="light" style={[styles.glassCard, style]}>
      {children}
    </BlurView>
  ) : (
    <View style={[styles.glassCardFallback, style]}>
      {children}
    </View>
  );
};

export default function SettingsScreen() {
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = React.useState(false);
  const [autoConnectDevices, setAutoConnectDevices] = React.useState(true);
  const [dataUploadEnabled, setDataUploadEnabled] = React.useState(true);
  
  const appSetupService = useAppSetupService();
  
  const handleResetData = async () => {
    try {
      await appSetupService.resetAppState();
      // Show success message
    } catch (error) {
      console.error('Failed to reset application data:', error);
      // Show error message
    }
  };
  
  const settingsSections: SettingsSectionType[] = [
    {
      title: 'General',
      items: [
        {
          id: 'notifications',
          title: 'Push Notifications',
          description: 'Receive alerts for important events',
          icon: 'bell-outline',
          type: 'toggle',
          value: notificationsEnabled,
          onValueChange: setNotificationsEnabled,
        },
        {
          id: 'darkMode',
          title: 'Dark Mode',
          description: 'Change app appearance',
          icon: 'theme-light-dark',
          type: 'toggle',
          value: darkModeEnabled,
          onValueChange: setDarkModeEnabled,
        },
      ],
    },
    {
      title: 'Devices',
      items: [
        {
          id: 'autoConnect',
          title: 'Auto-Connect',
          description: 'Automatically connect to remembered devices',
          icon: 'bluetooth-settings',
          type: 'toggle',
          value: autoConnectDevices,
          onValueChange: setAutoConnectDevices,
        },
        {
          id: 'manageDevices',
          title: 'Manage Devices',
          description: 'View and manage all paired devices',
          icon: 'devices',
          type: 'link',
          onPress: () => {/* Navigate to device management */},
        },
      ],
    },
    {
      title: 'Data',
      items: [
        {
          id: 'dataUpload',
          title: 'Auto Upload Data',
          description: 'Automatically sync data when connected',
          icon: 'cloud-upload-outline',
          type: 'toggle',
          value: dataUploadEnabled,
          onValueChange: setDataUploadEnabled,
        },
        {
          id: 'exportData',
          title: 'Export Data',
          description: 'Export your data in CSV format',
          icon: 'export',
          type: 'link',
          onPress: () => {/* Export data */},
        },
        {
          id: 'resetData',
          title: 'Reset All Data',
          description: 'Delete all app data and reset to defaults',
          icon: 'delete-outline',
          type: 'link',
          onPress: handleResetData,
          danger: true,
        },
      ],
    },
    {
      title: 'About',
      items: [
        {
          id: 'version',
          title: 'App Version',
          description: '1.0.0',
          icon: 'information-outline',
          type: 'info',
        },
        {
          id: 'help',
          title: 'Help & Support',
          description: 'Contact support or view FAQs',
          icon: 'help-circle-outline',
          type: 'link',
          onPress: () => {/* Navigate to help */},
        },
        {
          id: 'privacy',
          title: 'Privacy Policy',
          description: 'View our privacy policy',
          icon: 'shield-check-outline',
          type: 'link',
          onPress: () => {/* Navigate to privacy policy */},
        },
      ],
    },
  ];
  
  const renderSettingItem = (item: SettingItemType, index: number, itemsLength: number) => {
    return (
      <TouchableOpacity 
        key={item.id}
        style={[
          styles.settingItem,
          index < itemsLength - 1 && styles.settingItemBorder,
          item.danger && styles.dangerItem
        ]}
        disabled={item.type === 'toggle' || item.type === 'info'}
        onPress={item.onPress}
      >
        <LinearGradient
          colors={[
            item.danger ? 'rgba(255,59,48,0.15)' : 'rgba(0,176,118,0.15)', 
            item.danger ? 'rgba(255,59,48,0.05)' : 'rgba(0,176,118,0.05)'
          ]}
          style={styles.settingIconGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          borderRadius={20}
        >
          <MaterialCommunityIcons 
            name={item.icon} 
            size={24} 
            color={item.danger ? THEME.danger : THEME.primary} 
          />
        </LinearGradient>
        
        <View style={styles.settingContent}>
          <Text style={[
            styles.settingTitle,
            item.danger && styles.dangerText
          ]}>
            {item.title}
          </Text>
          <Text style={styles.settingDescription}>{item.description}</Text>
        </View>
        
        {item.type === 'toggle' && (
          <Switch
            value={item.value}
            onValueChange={item.onValueChange}
            trackColor={{ false: '#d0d0d0', true: 'rgba(0,176,118,0.3)' }}
            thumbColor={item.value ? THEME.primary : '#f4f3f4'}
            ios_backgroundColor="#d0d0d0"
          />
        )}
        
        {item.type === 'link' && (
          <MaterialCommunityIcons 
            name="chevron-right" 
            size={22} 
            color={item.danger ? THEME.danger : THEME.text.tertiary} 
          />
        )}
      </TouchableOpacity>
    );
  };
  
  return (
    <SafeAreaProvider>
      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Premium Header with Gradient */}
        <View style={styles.header}>
          <LinearGradient
            colors={['rgba(0,176,118,0.15)', 'rgba(0,176,118,0.05)', 'transparent']}
            style={styles.headerGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Settings</Text>
          </View>
        </View>
        
        {/* Settings Sections */}
        {settingsSections.map(section => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <GlassCard>
              <LinearGradient
                colors={['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.75)']}
                style={styles.cardGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
              />
              <View style={styles.cardInner}>
                {section.items.map((item, index) => 
                  renderSettingItem(item, index, section.items.length)
                )}
              </View>
            </GlassCard>
          </View>
        ))}
        
        {/* Bottom tab spacer */}
        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.background,
  },
  contentContainer: {
    paddingBottom: 32,
  },
  header: {
    height: 140,
    position: 'relative',
    marginBottom: 20,
  },
  headerGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  headerContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: '700',
    color: THEME.text.primary,
    letterSpacing: 0.5,
  },
  section: {
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: THEME.text.secondary,
    marginBottom: 10,
    marginLeft: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  // Glass card styles
  glassCard: {
    borderRadius: 16,
    overflow: 'hidden',
    borderColor: THEME.card.border,
    borderWidth: 1,
    shadowColor: THEME.card.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  glassCardFallback: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: THEME.cardBackground,
    borderColor: THEME.card.border,
    borderWidth: 1,
    shadowColor: THEME.card.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  cardGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  cardInner: {
    padding: 8,
  },
  settingItem: {
    flexDirection: 'row',
    padding: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  settingItemBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: THEME.divider,
  },
  dangerItem: {
    borderBottomWidth: 0,
  },
  settingIconGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,176,118,0.2)',
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: THEME.text.primary,
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 14,
    color: THEME.text.tertiary,
  },
  dangerText: {
    color: THEME.danger,
  },
});