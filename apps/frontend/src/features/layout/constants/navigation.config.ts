import {
  Home,
  Layers,
  Radio,
  Database,
  Smartphone,
  Wifi,
  Bluetooth,
  Users,
  Bell,
  User,
  Lock,
  Mail,
  Key,
  Shield,
  Palette,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  name: string;
  icon: LucideIcon;
  href: string;
  exact?: boolean;
}

export interface DeviceTypeNav extends NavItem {
  collapsible: true;
  children: NavItem[];
}

export interface NavigationConfig {
  main: NavItem[];
  deviceTypes: DeviceTypeNav[];
  userSettings: NavItem[];
}

export const NAVIGATION_CONFIG: NavigationConfig = {
  // Main navigation items
  main: [
    {
      name: 'Dashboard',
      icon: Home,
      href: '/console/dashboard',
    },
    {
      name: 'Organizations',
      icon: Users,
      href: '/console/organizations',
    },
    {
      name: 'Notifications',
      icon: Bell,
      href: '/console/notifications',
    },
  ],

  // Device type navigation with hierarchical structure
  deviceTypes: [
    {
      name: 'LoRaWAN',
      icon: Layers,
      href: '/console/lorawan',
      collapsible: true,
      children: [
        {
          name: 'Dashboard',
          icon: Home,
          href: '/console/lorawan',
          exact: true,
        },
        {
          name: 'Applications',
          icon: Layers,
          href: '/console/lorawan/applications',
        },
        {
          name: 'Gateways',
          icon: Radio,
          href: '/console/lorawan/gateways',
        },
        {
          name: 'Devices',
          icon: Database,
          href: '/console/lorawan/devices',
        },
      ],
    },
    {
      name: 'GSM',
      icon: Smartphone,
      href: '/console/gsm',
      collapsible: true,
      children: [
        {
          name: 'Dashboard',
          icon: Home,
          href: '/console/gsm',
          exact: true,
        },
        {
          name: 'Devices',
          icon: Smartphone,
          href: '/console/gsm/devices',
        },
      ],
    },
    {
      name: 'Wi-Fi',
      icon: Wifi,
      href: '/console/wifi',
      collapsible: true,
      children: [
        {
          name: 'Dashboard',
          icon: Home,
          href: '/console/wifi',
          exact: true,
        },
        {
          name: 'Devices',
          icon: Wifi,
          href: '/console/wifi/devices',
        },
      ],
    },
    {
      name: 'Bluetooth',
      icon: Bluetooth,
      href: '/console/bluetooth',
      collapsible: true,
      children: [
        {
          name: 'Dashboard',
          icon: Home,
          href: '/console/bluetooth',
          exact: true,
        },
        {
          name: 'Devices',
          icon: Bluetooth,
          href: '/console/bluetooth/devices',
        },
      ],
    },
  ],

  // User settings navigation
  userSettings: [
    {
      name: 'Profile',
      icon: User,
      href: '/console/settings/profile',
    },
    {
      name: 'Password',
      icon: Lock,
      href: '/console/settings/password',
    },
    {
      name: 'Theme',
      icon: Palette,
      href: '/console/settings/theme',
    },
    {
      name: 'Email notifications',
      icon: Mail,
      href: '/console/settings/email-notifications',
    },
    {
      name: 'API keys',
      icon: Key,
      href: '/console/settings/api-keys',
    },
    {
      name: 'Session management',
      icon: Shield,
      href: '/console/settings/sessions',
    },
    {
      name: 'Authorizations',
      icon: Shield,
      href: '/console/settings/authorizations',
    },
    {
      name: 'OAuth clients',
      icon: Users,
      href: '/console/settings/oauth-clients',
    },
  ],
};

/**
 * Helper function to check if a path is active
 */
export function isPathActive(currentPath: string, targetPath: string, exact = false): boolean {
  if (exact) {
    return currentPath === targetPath;
  }
  return currentPath === targetPath || currentPath.startsWith(targetPath + '/');
}

/**
 * Get all device type routes (flat list)
 */
export function getAllDeviceRoutes(): string[] {
  return NAVIGATION_CONFIG.deviceTypes.flatMap((deviceType) => [
    deviceType.href,
    ...deviceType.children.map((child) => child.href),
  ]);
}

/**
 * Get device type for a given route
 */
export function getDeviceTypeForRoute(route: string): DeviceTypeNav | undefined {
  return NAVIGATION_CONFIG.deviceTypes.find(
    (deviceType) => route === deviceType.href || route.startsWith(deviceType.href + '/')
  );
}
