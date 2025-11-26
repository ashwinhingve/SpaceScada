# Coding Standards and Best Practices

This document defines the coding standards, conventions, and best practices for the WebSCADA project.

## General Principles

1. **Clarity over cleverness**: Write code that is easy to understand
2. **Consistency**: Follow established patterns in the codebase
3. **Type safety**: Leverage TypeScript's type system fully
4. **Documentation**: Document complex logic and public APIs
5. **Testing**: Write tests for critical functionality

## TypeScript Standards

### Type Annotations

**Always annotate:**
- Function parameters
- Function return types
- Exported variables and constants
- Complex object structures

```typescript
// ✅ Good
function processDevice(deviceId: string, config: DeviceConfig): Promise<Device> {
  // implementation
}

// ❌ Bad
function processDevice(deviceId, config) {
  // implementation
}
```

### Interfaces vs Types

**Use `interface` for:**
- Object shapes
- Classes
- Contracts that may be extended

```typescript
// ✅ Good
interface Device {
  id: string;
  name: string;
  protocol: Protocol;
}

interface ExtendedDevice extends Device {
  telemetry: TelemetryData;
}
```

**Use `type` for:**
- Union types
- Intersection types
- Mapped types
- Type aliases

```typescript
// ✅ Good
type Protocol = 'mqtt' | 'http' | 'lorawan' | 'gsm' | 'bluetooth';
type DeviceStatus = 'online' | 'offline' | 'error';
```

### Avoid `any`

Never use `any` unless absolutely necessary. Use `unknown` for truly unknown types.

```typescript
// ❌ Bad
function parseData(data: any): any {
  return JSON.parse(data);
}

// ✅ Good
function parseData<T>(data: string): T {
  return JSON.parse(data) as T;
}

// ✅ Also good for truly unknown types
function handleUnknown(value: unknown): void {
  if (typeof value === 'string') {
    console.log(value.toUpperCase());
  }
}
```

### Strict Null Checks

Always enable strict null checks and handle null/undefined explicitly.

```typescript
// ✅ Good
function getDeviceName(device: Device | null): string {
  return device?.name ?? 'Unknown Device';
}

// ❌ Bad
function getDeviceName(device) {
  return device.name; // Runtime error if device is null
}
```

## Naming Conventions

### Files and Directories

```
kebab-case.ts           # TypeScript files
kebab-case.tsx          # React component files
PascalCase.tsx          # React component files (alternative)
kebab-case.test.ts      # Test files
kebab-case.spec.ts      # Spec files
```

### Variables and Functions

```typescript
// camelCase for variables and functions
const deviceCount = 42;
function fetchDeviceData() {}

// PascalCase for classes and interfaces
class DeviceManager {}
interface DeviceConfig {}

// UPPER_SNAKE_CASE for constants
const MAX_RETRY_ATTEMPTS = 3;
const API_BASE_URL = 'https://api.example.com';
```

### React Components

```typescript
// PascalCase for component names
function DeviceCard({ device }: DeviceCardProps) {
  return <div>{device.name}</div>;
}

// Props interface with "Props" suffix
interface DeviceCardProps {
  device: Device;
  onSelect?: (device: Device) => void;
}
```

### Boolean Variables

Prefix with `is`, `has`, `should`, or `can`:

```typescript
const isOnline = true;
const hasError = false;
const shouldRetry = true;
const canEdit = false;
```

## Code Organization

### Import Order

```typescript
// 1. External dependencies
import { useState, useEffect } from 'react';
import { FastifyInstance } from 'fastify';

// 2. Workspace packages
import { Device, DeviceStatus } from '@webscada/shared-types';
import { createLogger } from '@webscada/utils';

// 3. Relative imports (components, utilities)
import { DeviceCard } from '../components/DeviceCard';
import { formatDate } from './helpers';
import type { LocalConfig } from './types';

// 4. Styles (if applicable)
import styles from './styles.module.css';
```

### File Structure

```typescript
// 1. Imports
import { ... } from '...';

// 2. Types and Interfaces
interface Props { ... }
type State = { ... };

// 3. Constants
const MAX_ITEMS = 100;

// 4. Main implementation
export function Component() { ... }

// 5. Helper functions (if not extracted to separate file)
function helperFunction() { ... }
```

## React Best Practices

### Functional Components

Always use functional components with hooks (no class components).

```typescript
// ✅ Good
function DeviceList({ devices }: DeviceListProps) {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div>
      {devices.map(device => (
        <DeviceCard key={device.id} device={device} />
      ))}
    </div>
  );
}

// ❌ Bad - class component
class DeviceList extends React.Component { ... }
```

### Hooks Best Practices

```typescript
// ✅ Good - Extract complex logic to custom hooks
function useDeviceData(deviceId: string) {
  const [data, setData] = useState<DeviceData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDeviceData(deviceId).then(setData).finally(() => setLoading(false));
  }, [deviceId]);

  return { data, loading };
}

// Use in component
function DeviceDetails({ deviceId }: Props) {
  const { data, loading } = useDeviceData(deviceId);
  // ...
}
```

### Props Destructuring

```typescript
// ✅ Good - Destructure props
function DeviceCard({ device, onSelect, className }: DeviceCardProps) {
  return <div className={className} onClick={() => onSelect(device)} />;
}

// ❌ Bad - Using props object
function DeviceCard(props: DeviceCardProps) {
  return <div onClick={() => props.onSelect(props.device)} />;
}
```

### Event Handlers

```typescript
// ✅ Good - Named handler functions
function DeviceForm() {
  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    // handle submission
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    // handle change
  };

  return <form onSubmit={handleSubmit}>...</form>;
}
```

## Backend Best Practices

### Fastify Route Handlers

```typescript
// ✅ Good - Typed request and reply
app.get<{
  Params: { id: string };
  Reply: Device | { error: string };
}>('/devices/:id', async (request, reply) => {
  const { id } = request.params;

  const device = await deviceService.findById(id);

  if (!device) {
    return reply.code(404).send({ error: 'Device not found' });
  }

  return reply.send(device);
});
```

### Validation with Zod

```typescript
import { z } from 'zod';

// Define schema
const DeviceSchema = z.object({
  name: z.string().min(1).max(100),
  protocol: z.enum(['mqtt', 'http', 'lorawan', 'gsm', 'bluetooth']),
  config: z.record(z.unknown()).optional(),
});

// Use in handler
app.post('/devices', async (request, reply) => {
  const result = DeviceSchema.safeParse(request.body);

  if (!result.success) {
    return reply.code(400).send({ errors: result.error.errors });
  }

  const device = await deviceService.create(result.data);
  return reply.code(201).send(device);
});
```

### Error Handling

```typescript
// ✅ Good - Custom error classes
class DeviceNotFoundError extends Error {
  constructor(deviceId: string) {
    super(`Device not found: ${deviceId}`);
    this.name = 'DeviceNotFoundError';
  }
}

// Error handler middleware
app.setErrorHandler((error, request, reply) => {
  if (error instanceof DeviceNotFoundError) {
    return reply.code(404).send({ error: error.message });
  }

  // Log and return generic error
  request.log.error(error);
  return reply.code(500).send({ error: 'Internal server error' });
});
```

### Database Queries

```typescript
// ✅ Good - Use parameterized queries
async function findDeviceById(id: string): Promise<Device | null> {
  const result = await db.query(
    'SELECT * FROM devices WHERE id = $1',
    [id]
  );
  return result.rows[0] ?? null;
}

// ❌ Bad - String concatenation (SQL injection risk)
async function findDeviceById(id: string): Promise<Device | null> {
  const result = await db.query(`SELECT * FROM devices WHERE id = '${id}'`);
  return result.rows[0];
}
```

## Testing Standards

### Unit Tests

```typescript
import { describe, it, expect } from 'vitest';

describe('DeviceService', () => {
  it('should create a device', async () => {
    const service = new DeviceService(mockDb);
    const device = await service.create({
      name: 'Test Device',
      protocol: 'mqtt',
    });

    expect(device).toBeDefined();
    expect(device.name).toBe('Test Device');
  });

  it('should throw error for invalid device', async () => {
    const service = new DeviceService(mockDb);

    await expect(
      service.create({ name: '', protocol: 'invalid' })
    ).rejects.toThrow();
  });
});
```

### React Component Tests

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { DeviceCard } from './DeviceCard';

describe('DeviceCard', () => {
  const mockDevice = {
    id: '1',
    name: 'Test Device',
    protocol: 'mqtt' as const,
    status: 'online' as const,
  };

  it('renders device name', () => {
    render(<DeviceCard device={mockDevice} />);
    expect(screen.getByText('Test Device')).toBeInTheDocument();
  });

  it('calls onSelect when clicked', () => {
    const onSelect = vi.fn();
    render(<DeviceCard device={mockDevice} onSelect={onSelect} />);

    fireEvent.click(screen.getByRole('button'));
    expect(onSelect).toHaveBeenCalledWith(mockDevice);
  });
});
```

## Performance Best Practices

### React Performance

```typescript
// ✅ Good - Memoize expensive computations
const sortedDevices = useMemo(
  () => devices.sort((a, b) => a.name.localeCompare(b.name)),
  [devices]
);

// ✅ Good - Memoize callbacks
const handleSelect = useCallback(
  (device: Device) => {
    setSelected(device.id);
  },
  [setSelected]
);

// ✅ Good - Memoize components
const DeviceCard = memo(({ device }: DeviceCardProps) => {
  return <div>{device.name}</div>;
});
```

### Database Performance

```typescript
// ✅ Good - Use indexes for frequently queried columns
// migration.sql
CREATE INDEX idx_devices_protocol ON devices(protocol);
CREATE INDEX idx_devices_status ON devices(status);

// ✅ Good - Batch database operations
async function createMultipleDevices(devices: DeviceInput[]) {
  const values = devices.map((d, i) => `($${i * 2 + 1}, $${i * 2 + 2})`).join(',');
  const params = devices.flatMap(d => [d.name, d.protocol]);

  await db.query(
    `INSERT INTO devices (name, protocol) VALUES ${values}`,
    params
  );
}
```

## Security Best Practices

### Input Validation

```typescript
// ✅ Good - Always validate and sanitize input
import { z } from 'zod';

const UserInputSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().email(),
});

// ✅ Good - Prevent SQL injection with parameterized queries
await db.query('SELECT * FROM users WHERE email = $1', [email]);

// ❌ Bad - Never trust user input directly
await db.query(`SELECT * FROM users WHERE email = '${email}'`);
```

### Authentication

```typescript
// ✅ Good - Use secure token verification
import jwt from 'jsonwebtoken';

async function verifyToken(token: string): Promise<UserPayload> {
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!);
    return payload as UserPayload;
  } catch (error) {
    throw new UnauthorizedError('Invalid token');
  }
}
```

## Documentation Standards

### JSDoc Comments

```typescript
/**
 * Fetches device data by ID.
 *
 * @param deviceId - The unique identifier of the device
 * @returns Promise resolving to device data or null if not found
 * @throws {DatabaseError} If database connection fails
 *
 * @example
 * ```typescript
 * const device = await fetchDeviceData('device-123');
 * ```
 */
async function fetchDeviceData(deviceId: string): Promise<Device | null> {
  // implementation
}
```

### README Files

Every package and app should have a README with:
- Description
- Installation instructions
- Usage examples
- API reference (if applicable)
- Contributing guidelines

## Git Commit Standards

### Conventional Commits

```
type(scope): subject

body

footer
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```
feat(devices): add support for Bluetooth devices

Implement Bluetooth device integration with GATT protocol support.

Closes #123
```

```
fix(backend): resolve memory leak in WebSocket handler

The WebSocket handler was not properly cleaning up event listeners,
causing memory to grow over time.
```

## Code Review Checklist

- [ ] Code follows TypeScript best practices
- [ ] All functions have proper type annotations
- [ ] No `any` types (unless justified)
- [ ] Error handling is implemented
- [ ] Input validation is present
- [ ] Tests are written for new functionality
- [ ] Documentation is updated
- [ ] No security vulnerabilities introduced
- [ ] Performance implications considered
- [ ] Accessibility standards met (frontend)

---

**Last Updated**: 2025-11-25
