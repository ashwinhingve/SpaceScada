# WebSCADA Changelog

All notable changes, migrations, and updates to the WebSCADA project are documented in this file.

## Format

This changelog follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) format and [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

### Change Types

- **Added**: New features
- **Changed**: Changes in existing functionality
- **Deprecated**: Soon-to-be removed features
- **Removed**: Removed features
- **Fixed**: Bug fixes
- **Security**: Security fixes and improvements

---

## [Unreleased]

### Added
- OpenAPI specification for REST API
- Multi-factor authentication (MFA) support
- Scheduled data export reports
- Mobile application (iOS/Android)

### Changed
- Improved dashboard performance with virtualization
- Enhanced GIS module with better clustering

---

## [2.0.0] - 2025-11-25

### Added
- **Comprehensive Documentation Restructure**
  - New `/documents` directory structure
  - Architecture documentation (data-flow, infra)
  - Developer guides (coding standards, setup)
  - API documentation (endpoints, auth)
  - Operations guides (backup-restore, deployment)
  - User guides (frontend usage)
  - Migration changelog

- **Dashboard Widgets System**
  - Real-time data widgets
  - Customizable dashboard layouts
  - Widget drag-and-drop functionality
  - Chart widgets with multiple visualization types
  - Gauge widgets (circular and linear)
  - Status panel widgets

- **Multi-Protocol Device Support**
  - LoRaWAN devices via ChirpStack integration
  - Wi-Fi devices (ESP32)
  - Bluetooth Low Energy (BLE) devices
  - Cellular/GSM devices (2G/3G/4G)
  - Standard MQTT devices

- **Applications Module**
  - Group related devices
  - Application-specific dashboards
  - Aggregate statistics per application

- **Gateways Management**
  - Gateway registration and monitoring
  - ChirpStack gateway integration
  - Device-to-gateway mapping

- **User Settings**
  - Profile management
  - Password change
  - API key generation and management
  - Email notification preferences
  - Theme customization (light/dark mode)

- **Backend API Routes**
  - `/api/applications` - Application management
  - `/api/gateways` - Gateway management
  - `/api/end-devices` (LoRaWAN devices)
  - `/api/wifi-devices` - Wi-Fi device management
  - `/api/bluetooth-devices` - Bluetooth device management
  - `/api/notifications` - Notification management
  - `/api/sessions` - User session management
  - `/api/users` - User management
  - `/api/oauth/:provider` - OAuth authentication

- **OAuth Authentication**
  - Google OAuth integration
  - GitHub OAuth integration
  - OAuth callback handling
  - Social login buttons

### Changed
- **Console Layout Restructure**
  - Moved from `/app/dashboard` to `/app/console`
  - Unified console layout component
  - Consistent navigation across all pages
  - Improved responsive design

- **Frontend Architecture**
  - Migrated to App Router (Next.js 14)
  - Improved component organization
  - Enhanced type safety with stricter TypeScript
  - Better state management patterns

- **Database Schema Updates**
  - User settings table (migration 001)
  - Applications table (migration 002)
  - Gateways table (migration 003)
  - LoRaWAN devices table (migration 004)
  - Wi-Fi devices table (migration 005)
  - Bluetooth devices table (migration 006)
  - Dashboard widgets table (migration 007)
  - Device telemetry table (migration 008)
  - Device logs table (migration 009)

- **Backend Services**
  - Refactored ESP32 service for better error handling
  - Enhanced GSM service with connection pooling
  - New ChirpStack service for LoRaWAN integration
  - Wi-Fi service for HTTP-based devices
  - Bluetooth service with GATT support
  - Telemetry service for time-series data
  - Logs service for device activity tracking

### Removed
- Old `/app/dashboard` route (replaced by `/app/console`)
- Legacy device management pages
- Deprecated `/app/projects` routes
- Unused `/app/organizations/new` page
- Outdated ESP32 registration page (`/app/esp32/register`)
- Old settings pages (replaced by unified settings)

### Fixed
- Memory leak in WebSocket handler
- Race condition in device status updates
- Pagination issues in device list
- Chart rendering performance issues
- Mobile responsiveness on dashboard
- API key validation edge cases

### Security
- Implemented rate limiting on authentication endpoints
- Enhanced password hashing with bcrypt (10 rounds)
- API key encryption at rest
- SQL injection prevention with parameterized queries
- XSS protection with input sanitization
- CSRF protection on all forms

---

## [1.2.0] - 2025-11-20

### Added
- **GIS Module**
  - Interactive map with device locations
  - Device clustering for dense areas
  - Heatmap overlays for sensor data
  - Geofence creation and management
  - Location-based alarms

- **Real-time Data Service**
  - Dedicated Fastify service for real-time data
  - WebSocket server for live updates
  - Redis pub/sub for inter-service communication
  - Connection pooling and optimization

### Changed
- Improved alarm processing with priority queue
- Enhanced telemetry storage with InfluxDB
- Better error messages in API responses

### Fixed
- Timezone handling in date pickers
- WebSocket reconnection issues
- Chart data aggregation bugs

---

## [1.1.0] - 2025-11-15

### Added
- **GSM Device Support**
  - GSM module integration via MQTT
  - SIM card management
  - SMS command support
  - Cellular signal strength monitoring

- **ESP32 Devices**
  - HTTP-based device registration
  - Firmware OTA updates
  - Wi-Fi configuration portal
  - Device provisioning workflow

### Changed
- Migrated from Pages Router to App Router (Next.js 14)
- Updated all dependencies to latest versions
- Refactored backend route handlers

### Fixed
- Memory leaks in long-running connections
- Device disconnection detection
- Alarm notification delivery

---

## [1.0.0] - 2025-11-10

### Added
- **Initial Release**
  - Basic device management
  - Real-time telemetry monitoring
  - Alarm system with email notifications
  - PostgreSQL database integration
  - Redis caching layer
  - Docker and Kubernetes deployment
  - User authentication with JWT
  - MQTT protocol support
  - Basic dashboard with charts

- **Frontend**
  - Next.js 14 application
  - Tailwind CSS styling
  - Shadcn/ui components
  - Recharts for data visualization

- **Backend**
  - Fastify API server
  - WebSocket support with Socket.io
  - PostgreSQL with pg driver
  - Redis for caching and pub/sub
  - Zod validation schemas

- **Infrastructure**
  - Docker Compose for local development
  - Kubernetes manifests for production
  - Helm charts for deployment
  - CI/CD with GitHub Actions

### Database Migrations
- Initial schema creation
- User and authentication tables
- Device and telemetry tables
- Alarm management tables

---

## Migration Notes

### 2.0.0 Migration

**Breaking Changes:**
- Frontend routes changed from `/dashboard` to `/console`
- API endpoint structure updated
- Database schema changes require migration

**Migration Steps:**

1. **Backup Database:**
   ```bash
   pg_dump -U webscada webscada > backup-pre-2.0.dump
   ```

2. **Run Database Migrations:**
   ```bash
   cd apps/backend
   pnpm db:migrate
   ```

3. **Update Frontend Environment:**
   ```bash
   # Update .env.local with new API endpoints
   NEXT_PUBLIC_API_URL=http://localhost:3001/api
   ```

4. **Clear Browser Cache:**
   - Clear cookies and local storage
   - Hard refresh (Ctrl+Shift+R)

5. **Restart Services:**
   ```bash
   pnpm dev
   ```

**Data Migration:**
- Old dashboard configurations will be automatically migrated
- Device associations preserved
- User settings will need to be reconfigured

### 1.2.0 Migration

**GIS Module Setup:**

1. Install GIS packages:
   ```bash
   pnpm add leaflet react-leaflet @types/leaflet
   ```

2. Configure map provider in `.env.local`:
   ```
   NEXT_PUBLIC_MAP_PROVIDER=openstreetmap
   NEXT_PUBLIC_MAP_API_KEY=your-key-here
   ```

### 1.1.0 Migration

**App Router Migration:**

Migrated from Pages Router to App Router. All pages moved from `pages/` to `app/`.

**Breaking Changes:**
- Custom `_app.tsx` logic moved to `layout.tsx`
- API routes moved from `pages/api/` to `app/api/`
- getServerSideProps replaced with Server Components

---

## Deprecation Notices

### Deprecated in 2.0.0

- **Old Settings Pages**: Use unified `/console/settings` instead
- **Legacy Device Routes**: Use new protocol-specific routes
- **Projects Module**: Being replaced by Applications

**Removal Timeline**: These will be removed in version 3.0.0 (Q2 2026)

---

## Upcoming Features (Roadmap)

### Version 2.1.0 (Q1 2026)
- Multi-tenancy support
- Advanced RBAC with custom roles
- Scheduled reports via email
- Data retention policies
- Audit logging dashboard

### Version 2.2.0 (Q2 2026)
- Mobile applications (iOS/Android)
- Offline mode for mobile
- Edge computing integration
- Machine learning anomaly detection
- OPC UA protocol support

### Version 3.0.0 (Q3 2026)
- Complete UI redesign
- GraphQL API
- Multi-region deployment
- Advanced analytics and BI tools
- Integration marketplace

---

## Support and Contact

For questions about migrations or changes:
- Email: support@example.com
- Documentation: https://docs.example.com
- GitHub Issues: https://github.com/your-org/webscada/issues

---

**Last Updated**: 2025-11-25
**Format Version**: 1.0.0 (Keep a Changelog)
