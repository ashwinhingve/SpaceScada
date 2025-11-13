# WebSCADA System Architecture

## Overview

WebSCADA is a modern, cloud-native SCADA system built with a microservices architecture, designed for industrial monitoring and control applications.

## System Components

### Frontend (Next.js)

**Location:** `apps/frontend`

**Technology Stack:**
- Next.js 14 with App Router
- TypeScript for type safety
- Tailwind CSS for styling
- Shadcn/ui for UI components
- Socket.io-client for real-time communication
- Zustand for state management
- Recharts for data visualization

**Key Features:**
- Server-side rendering (SSR)
- Real-time dashboard updates
- Responsive design
- Device management interface
- Tag monitoring and visualization
- Alarm management

**API Integration:**
- REST API for CRUD operations
- WebSocket for real-time updates
- Optimistic UI updates

### Backend (Fastify)

**Location:** `apps/backend`

**Technology Stack:**
- Fastify web framework
- TypeScript
- Socket.io for WebSocket
- PostgreSQL for data persistence
- Redis for caching and session management
- Protocol adapters for industrial communication

**Key Features:**
- RESTful API
- WebSocket server for real-time events
- Protocol abstraction layer
- Device communication management
- Historical data storage
- Alarm processing

**API Endpoints:**
- `/api/devices` - Device CRUD operations
- `/api/tags` - Tag management
- `/api/alarms` - Alarm management
- `/health` - Health check endpoint

**WebSocket Events:**
- `tag:update` - Tag value updates
- `device:status` - Device status changes
- `alarm:triggered` - New alarms
- `alarm:acknowledged` - Alarm acknowledgments

### Simulator

**Location:** `apps/simulator`

**Purpose:** Device simulation for testing and development

**Features:**
- Modbus TCP/RTU simulation
- Configurable data patterns (sine, sawtooth, random)
- Realistic value generation
- Multiple register simulation

**Use Cases:**
- Development without physical devices
- Testing protocol implementations
- Load testing
- Demonstration purposes

## Shared Packages

### @webscada/shared-types

**Location:** `packages/shared-types`

**Purpose:** TypeScript type definitions shared across all applications

**Exports:**
- Device types and enums
- Tag types and data structures
- Alarm configurations
- API response types
- User and authentication types
- Historical data types

### @webscada/utils

**Location:** `packages/utils`

**Purpose:** Common utility functions

**Modules:**
- **Logger:** Structured logging with levels
- **Validation:** Data validation utilities
- **Retry:** Retry logic with exponential backoff
- **Time:** Time manipulation and formatting

### @webscada/protocols

**Location:** `packages/protocols`

**Purpose:** Industrial protocol implementations

**Protocols:**
- **Modbus TCP:** TCP-based Modbus communication
- **Modbus RTU:** Serial-based Modbus communication
- **OPC-UA:** OPC Unified Architecture client
- **MQTT:** MQTT pub/sub protocol

**Features:**
- Protocol abstraction layer
- Connection pooling
- Automatic reconnection
- Error handling and retry logic

## Data Flow

### Read Operation Flow

```
Device → Protocol Adapter → Backend API → Redis Cache → Frontend
                                ↓
                          PostgreSQL (Historical)
```

### Write Operation Flow

```
Frontend → Backend API → Protocol Adapter → Device
              ↓
        PostgreSQL (Audit)
```

### Real-time Update Flow

```
Device → Protocol Adapter → Backend
                              ↓
                        Socket.io Server
                              ↓
                    WebSocket Broadcast
                              ↓
                    Frontend Clients
```

## Database Schema

### PostgreSQL

**Tables:**
- `devices` - Device configuration and metadata
- `tags` - Tag definitions and configuration
- `tag_values` - Historical tag data
- `alarms` - Alarm records
- `users` - User accounts and permissions

**Indexes:**
- Tag values by timestamp (for historical queries)
- Alarms by device and status
- Tags by device ID

### Redis

**Usage:**
- Session storage
- Real-time tag value cache
- Rate limiting counters
- WebSocket connection tracking

**Key Patterns:**
- `tag:{tagId}:value` - Current tag value
- `device:{deviceId}:status` - Device status
- `session:{sessionId}` - User session data

## Security Architecture

### Authentication & Authorization

- JWT-based authentication
- Role-based access control (RBAC)
- Permission-based operations
- Session management with Redis

**User Roles:**
- **Admin:** Full system access
- **Engineer:** Device and configuration management
- **Operator:** Monitor and acknowledge alarms
- **Viewer:** Read-only access

### Network Security

- CORS configuration
- Rate limiting
- Helmet.js security headers
- Input validation and sanitization

### Data Security

- Encrypted connections (TLS)
- Secure password hashing
- SQL injection prevention
- XSS protection

## Scalability

### Horizontal Scaling

**Stateless Services:**
- Frontend (Next.js)
- Backend API servers

**Scaling Strategy:**
- Load balancer distribution
- Session affinity for WebSocket
- Kubernetes HPA (Horizontal Pod Autoscaler)

### Vertical Scaling

**Stateful Services:**
- PostgreSQL (read replicas)
- Redis (clustering)

### Caching Strategy

**Levels:**
1. **Application Cache:** Redis for frequent data
2. **Database Cache:** PostgreSQL query cache
3. **CDN Cache:** Static assets

## High Availability

### Application Layer

- Multiple replicas (minimum 3)
- Health checks and readiness probes
- Graceful shutdown handling
- Circuit breakers for external services

### Database Layer

- PostgreSQL streaming replication
- Automated failover
- Point-in-time recovery
- Regular backups

### Infrastructure

- Multi-zone deployment
- Load balancing
- Auto-scaling policies
- Disaster recovery plan

## Monitoring & Observability

### Logging

**Structure:**
- Structured JSON logs
- Correlation IDs for request tracking
- Log levels (DEBUG, INFO, WARN, ERROR)

**Storage:**
- Centralized log aggregation
- Log retention policies
- Search and analysis

### Metrics

**Application Metrics:**
- Request rate and latency
- Error rates
- WebSocket connections
- Tag update frequency

**Infrastructure Metrics:**
- CPU and memory usage
- Network I/O
- Disk usage
- Pod restart count

### Tracing

- Distributed tracing
- Request flow visualization
- Performance bottleneck identification

## Development Workflow

### Monorepo Structure

**Benefits:**
- Shared code reuse
- Atomic commits across services
- Consistent tooling
- Simplified dependencies

**Tools:**
- **pnpm:** Package management with workspaces
- **Turborepo:** Build orchestration and caching
- **Husky:** Git hooks for quality checks
- **Commitlint:** Conventional commit enforcement

### CI/CD Pipeline

**Stages:**
1. **Lint:** Code quality checks
2. **Type Check:** TypeScript validation
3. **Test:** Unit and integration tests
4. **Build:** Docker image creation
5. **Deploy:** Kubernetes deployment

### Code Quality

- ESLint for code linting
- Prettier for formatting
- TypeScript strict mode
- Pre-commit hooks

## Deployment Options

### Local Development

- Docker Compose for full stack
- Individual service startup
- Hot reload for rapid development

### Kubernetes

**Raw Manifests:**
- Namespace isolation
- ConfigMaps and Secrets
- Services and Ingress
- PersistentVolumes

**Helm Charts:**
- Templated deployments
- Value customization
- Release management

**Skaffold:**
- Development workflow
- Automatic rebuilds
- Port forwarding
- Log streaming

## Performance Optimization

### Backend

- Connection pooling
- Query optimization
- Caching strategies
- Async/await patterns
- Batch operations

### Frontend

- Code splitting
- Image optimization
- SSR for initial load
- Client-side caching
- Lazy loading

### Database

- Indexes on frequently queried columns
- Partitioning for historical data
- Query plan analysis
- Connection pooling

## Future Enhancements

### Planned Features

1. **Advanced Analytics**
   - Machine learning for anomaly detection
   - Predictive maintenance
   - Trend analysis

2. **Additional Protocols**
   - DNP3
   - IEC 60870-5-104
   - BACnet

3. **Mobile Application**
   - React Native app
   - Push notifications
   - Offline support

4. **Report Generation**
   - Automated reports
   - Custom templates
   - PDF/Excel export

5. **Data Historian**
   - Time-series database integration
   - Advanced querying
   - Data compression

## Technology Decisions

### Why Next.js?

- Modern React framework
- Server-side rendering
- File-based routing
- Built-in optimization
- Active community

### Why Fastify?

- High performance
- Low overhead
- Plugin architecture
- TypeScript support
- Modern async patterns

### Why PostgreSQL?

- ACID compliance
- JSON support
- Robust feature set
- Strong ecosystem
- Time-series capabilities

### Why Redis?

- In-memory performance
- Pub/sub support
- Multiple data structures
- Persistence options
- Wide adoption

### Why Kubernetes?

- Container orchestration
- Self-healing
- Declarative configuration
- Ecosystem and tools
- Cloud-native standard

## Conclusion

WebSCADA is designed as a production-ready, scalable, and maintainable SCADA system using modern cloud-native technologies. The architecture supports both small deployments and large-scale industrial applications with high availability and performance requirements.
