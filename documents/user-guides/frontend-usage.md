# Frontend Application User Guide

This guide provides instructions for using the WebSCADA frontend application.

## Overview

The WebSCADA frontend is a modern web application built with Next.js that provides real-time monitoring and control of industrial devices.

**Key Features:**
- Real-time device monitoring
- Interactive dashboards and widgets
- Device management
- Alarm and notification system
- GIS (Geographic Information System) integration
- Multi-protocol device support

## Accessing the Application

### Web Browser

**URL**: `https://your-domain.com` or `http://localhost:3000` (development)

**Supported Browsers:**
- Chrome/Edge (recommended)
- Firefox
- Safari

**Minimum Screen Resolution**: 1280x720

## User Authentication

### Login

1. Navigate to the login page
2. Enter your email address
3. Enter your password
4. Click "Sign In"

**Alternative Sign-In Methods:**
- Sign in with Google
- Sign in with GitHub (if enabled)

### First-Time Login

If this is your first login:
1. You'll be prompted to complete your profile
2. Set your display name
3. Configure notification preferences
4. Accept terms of service (if applicable)

### Password Reset

1. Click "Forgot Password?" on the login page
2. Enter your email address
3. Check your email for a reset link
4. Follow the link and set a new password

## Dashboard

### Main Dashboard

The dashboard is your central hub for monitoring all devices and systems.

**Layout:**
```
┌─────────────────────────────────────────────────┐
│  Navigation Bar                                  │
├──────────┬──────────────────────────────────────┤
│          │                                       │
│ Sidebar  │  Widget Grid                         │
│          │  ┌────────┐ ┌────────┐              │
│ - Devices│  │Widget 1│ │Widget 2│              │
│ - Alarms │  └────────┘ └────────┘              │
│ - GIS    │  ┌────────┐ ┌────────┐              │
│ - Settings│ │Widget 3│ │Widget 4│              │
│          │  └────────┘ └────────┘              │
│          │                                       │
└──────────┴──────────────────────────────────────┘
```

### Dashboard Widgets

Available widget types:

1. **Real-Time Data Widget**
   - Displays live telemetry from devices
   - Auto-updates every second
   - Color-coded status indicators

2. **Chart Widget**
   - Line charts for trend analysis
   - Bar charts for comparisons
   - Time range selector (1h, 6h, 24h, 7d, 30d)

3. **Gauge Widget**
   - Circular or linear gauges
   - Configurable min/max values
   - Threshold indicators

4. **Status Panel**
   - Overview of device health
   - Connection status
   - Last update time

5. **Alarm Widget**
   - Recent alarms list
   - Severity indicators
   - Quick acknowledgment

### Customizing the Dashboard

**Add a Widget:**
1. Click the "+ Add Widget" button
2. Select widget type
3. Choose data source (device/tag)
4. Configure widget settings
5. Click "Add to Dashboard"

**Rearrange Widgets:**
- Drag and drop widgets to reposition
- Resize widgets by dragging corners
- Layout is automatically saved

**Remove a Widget:**
1. Click the "..." menu on the widget
2. Select "Remove"
3. Confirm deletion

## Device Management

### Viewing Devices

**Navigate**: Sidebar → Devices

**Device List View:**
- Search devices by name
- Filter by protocol (MQTT, LoRaWAN, GSM, Wi-Fi, Bluetooth)
- Filter by status (Online, Offline, Error)
- Sort by name, last seen, protocol

### Device Details

Click on a device to view detailed information:

**Tabs:**

1. **Overview**
   - Device name and ID
   - Protocol type
   - Connection status
   - Last communication time
   - Signal strength (if applicable)

2. **Telemetry**
   - Real-time sensor readings
   - Historical data charts
   - Export data (CSV, JSON)

3. **Configuration**
   - Device settings
   - Update interval
   - Alarm thresholds

4. **Logs**
   - Device activity log
   - Communication errors
   - Configuration changes

### Adding a Device

1. Click "+ Add Device" button
2. Select device protocol:
   - **ESP32** (Wi-Fi)
   - **GSM Module** (Cellular)
   - **LoRaWAN** (Long-range)
   - **Bluetooth** (BLE)
   - **Standard MQTT**

3. Fill in device details:
   - Device name
   - Device ID / MAC address
   - Connection parameters

4. Click "Register Device"

5. Follow on-screen instructions for device configuration

### Example: Adding an ESP32 Device

```
Device Name: Temperature Sensor 1
Device ID: ESP32-001
Protocol: Wi-Fi (HTTP)
IP Address: 192.168.1.100
Update Interval: 30 seconds
```

After registration:
- Copy the API key provided
- Configure your ESP32 with the API key
- Device will appear online within 1 minute

### Device Actions

**Available Actions:**
- **Edit**: Update device configuration
- **Test Connection**: Send ping to device
- **View Logs**: See recent activity
- **Send Command**: Control the device (if supported)
- **Delete**: Remove device from system

## Alarms and Notifications

### Viewing Alarms

**Navigate**: Sidebar → Alarms

**Alarm List:**
- Active alarms (unacknowledged)
- Acknowledged alarms
- Resolved alarms
- Historical alarms

**Alarm Information:**
- Severity (Critical, Warning, Info)
- Device name
- Message
- Timestamp
- Current value vs threshold

### Alarm Severity Levels

| Level    | Color  | Description                          |
|----------|--------|--------------------------------------|
| Critical | Red    | Immediate attention required         |
| Warning  | Yellow | Should be addressed soon             |
| Info     | Blue   | Informational, no action required    |

### Acknowledging Alarms

1. Select one or more alarms
2. Click "Acknowledge" button
3. Add a comment (optional)
4. Click "Confirm"

Acknowledged alarms move to the "Acknowledged" tab.

### Configuring Alarm Rules

**Navigate**: Device Details → Configuration → Alarms

**Create Alarm Rule:**
1. Click "+ Add Alarm Rule"
2. Select data point (tag)
3. Choose condition:
   - Greater than
   - Less than
   - Equal to
   - Not equal to
4. Set threshold value
5. Select severity level
6. Enable/disable notifications
7. Click "Save"

**Example:**
```
Tag: Temperature
Condition: Greater than
Threshold: 50°C
Severity: Warning
Notification: Email + SMS
```

### Notification Settings

**Navigate**: Settings → Notifications

**Channels:**
- Email notifications
- SMS notifications (if configured)
- In-app notifications
- Browser push notifications

**Configure:**
- Enable/disable per channel
- Set quiet hours (no notifications during specified times)
- Select alarm severities to notify

## GIS (Geographic Information System)

### Map View

**Navigate**: Sidebar → GIS

**Features:**
- Interactive map with device locations
- Cluster view for multiple devices
- Device status overlays
- Heatmaps for sensor data

### Adding Device Location

1. Go to Device Details → Overview
2. Click "Set Location"
3. **Method 1**: Click on map
4. **Method 2**: Enter coordinates (latitude, longitude)
5. Click "Save Location"

### Map Layers

Toggle map layers:
- **Device Markers**: Show all devices
- **Status Heatmap**: Color-coded by status
- **Sensor Heatmap**: Color-coded by sensor value (temperature, etc.)
- **Geofences**: Custom boundaries

### Creating Geofences

1. Click "Add Geofence"
2. Draw boundary on map
3. Name the geofence
4. Set alarm rules for devices entering/exiting
5. Click "Save"

## Applications

**Applications** group related devices together (e.g., "Factory Floor", "Building A").

### Creating an Application

1. Navigate to Sidebar → Applications
2. Click "+ New Application"
3. Enter application name
4. Add description (optional)
5. Click "Create"

### Adding Devices to Application

1. Open application
2. Click "Add Device"
3. Select devices from list
4. Click "Add Selected"

### Application Dashboard

Each application has its own dashboard with:
- Aggregate statistics
- Application-specific widgets
- Device list
- Alarms for application devices

## Gateways

**Gateways** act as intermediaries for devices that cannot directly connect to the cloud.

### Viewing Gateways

**Navigate**: Sidebar → Gateways

**Gateway Information:**
- Gateway name and ID
- Status (Online/Offline)
- Connected devices count
- Last seen timestamp

### Adding a Gateway

1. Click "+ Add Gateway"
2. Select gateway type (LoRaWAN, MQTT Broker, etc.)
3. Enter gateway details
4. Configure connection parameters
5. Click "Register Gateway"

### LoRaWAN Gateway (ChirpStack Integration)

For LoRaWAN devices:
1. Ensure ChirpStack is configured
2. Add gateway in ChirpStack
3. Gateway appears automatically in WebSCADA
4. Add LoRaWAN devices via "Add Device" → LoRaWAN

## User Settings

### Profile Settings

**Navigate**: User Menu → Settings → Profile

**Editable Fields:**
- Display name
- Email address
- Phone number
- Time zone
- Language preference

### Change Password

1. Navigate to Settings → Password
2. Enter current password
3. Enter new password (minimum 8 characters)
4. Confirm new password
5. Click "Update Password"

### API Keys

**Navigate**: Settings → API Keys

**Create API Key:**
1. Click "+ Create API Key"
2. Enter key name
3. Select permissions
4. Set expiration date (optional)
5. Click "Generate"
6. **Copy the API key immediately** (shown only once)

**Use Cases:**
- Integrate with third-party applications
- Custom scripts and automation
- Mobile app development

### Theme Settings

**Navigate**: Settings → Theme

**Options:**
- Light mode
- Dark mode
- Auto (follows system preference)
- Custom accent color

## Data Export

### Export Device Data

1. Go to Device Details → Telemetry
2. Select time range
3. Click "Export" button
4. Choose format:
   - CSV (Excel-compatible)
   - JSON (for developers)
   - PDF (report format)
5. Download file

### Scheduled Reports

**Coming Soon**:
- Daily/weekly/monthly reports
- Email delivery
- Custom templates

## Keyboard Shortcuts

| Shortcut       | Action                    |
|----------------|---------------------------|
| `Ctrl + K`     | Quick search              |
| `Ctrl + B`     | Toggle sidebar            |
| `Ctrl + ,`     | Open settings             |
| `Esc`          | Close modal/dialog        |
| `F5`           | Refresh dashboard         |

## Mobile App

**Coming Soon**: Native mobile apps for iOS and Android with:
- Real-time monitoring
- Push notifications
- Offline support
- QR code device scanning

## Troubleshooting

### Dashboard Not Updating

**Check:**
1. Internet connection
2. Device status (is it online?)
3. Browser console for errors (F12)
4. Refresh the page (F5)

### Cannot Add Device

**Possible Issues:**
- Insufficient permissions (contact admin)
- Invalid device ID format
- Device already registered
- Network connectivity issues

### Alarms Not Showing

**Check:**
1. Alarm rules are configured
2. Threshold is being exceeded
3. Notifications are enabled
4. Check spam folder for email notifications

### Map Not Loading

**Solutions:**
1. Check internet connection
2. Disable browser extensions (ad blockers)
3. Clear browser cache
4. Try a different browser

## Getting Help

**Support Channels:**
- In-app help button (bottom-right corner)
- Email: support@example.com
- Documentation: https://docs.example.com
- Community forum: https://forum.example.com

**Provide When Reporting Issues:**
- Browser and version
- Steps to reproduce
- Screenshot (if applicable)
- Device type (if device-specific)

---

**Last Updated**: 2025-11-25
