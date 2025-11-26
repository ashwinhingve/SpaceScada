/**
 * Protocol Plugin Registry
 *
 * Manages protocol adapter plugins with:
 * - Dynamic registration and discovery
 * - Plugin lifecycle management
 * - Version control
 * - Hot-reload capability
 */

import {
  IProtocolAdapter,
  ProtocolType,
  ConnectionConfig,
  ProtocolCapabilities,
} from '../abstraction/protocol-adapter.interface';

/**
 * Protocol Plugin Metadata
 */
export interface ProtocolPluginMetadata {
  name: string;
  protocol: ProtocolType;
  version: string;
  description: string;
  author?: string;
  capabilities: ProtocolCapabilities;
  configSchema?: Record<string, unknown>; // JSON Schema for config validation
}

/**
 * Protocol Plugin Factory
 */
export type ProtocolAdapterFactory = () => IProtocolAdapter;

/**
 * Registered Protocol Plugin
 */
interface RegisteredPlugin {
  metadata: ProtocolPluginMetadata;
  factory: ProtocolAdapterFactory;
  instances: Map<string, IProtocolAdapter>; // instanceId -> adapter
  createdAt: number;
  lastUsed: number;
}

/**
 * Protocol Registry
 *
 * Central registry for managing protocol adapter plugins.
 * Supports plugin registration, instantiation, and lifecycle management.
 */
export class ProtocolRegistry {
  private plugins: Map<ProtocolType, RegisteredPlugin> = new Map();
  private static instance: ProtocolRegistry;

  /**
   * Singleton instance
   */
  static getInstance(): ProtocolRegistry {
    if (!ProtocolRegistry.instance) {
      ProtocolRegistry.instance = new ProtocolRegistry();
    }
    return ProtocolRegistry.instance;
  }

  private constructor() {
    // Private constructor for singleton
  }

  /**
   * Register a protocol adapter plugin
   */
  register(metadata: ProtocolPluginMetadata, factory: ProtocolAdapterFactory): void {
    if (this.plugins.has(metadata.protocol)) {
      throw new Error(
        `Protocol ${metadata.protocol} is already registered. Use update() to update existing plugin.`
      );
    }

    this.plugins.set(metadata.protocol, {
      metadata,
      factory,
      instances: new Map(),
      createdAt: Date.now(),
      lastUsed: Date.now(),
    });

    console.log(
      `[ProtocolRegistry] Registered protocol plugin: ${metadata.name} v${metadata.version}`
    );
  }

  /**
   * Update an existing protocol adapter plugin (hot-reload)
   */
  update(
    protocol: ProtocolType,
    metadata: ProtocolPluginMetadata,
    factory: ProtocolAdapterFactory
  ): void {
    const existing = this.plugins.get(protocol);
    if (!existing) {
      throw new Error(`Protocol ${protocol} is not registered. Use register() first.`);
    }

    // Close all existing instances
    for (const [instanceId, adapter] of existing.instances) {
      adapter.disconnect().catch((err) => {
        console.error(`[ProtocolRegistry] Error disconnecting instance ${instanceId}:`, err);
      });
    }
    existing.instances.clear();

    // Update plugin
    this.plugins.set(protocol, {
      metadata,
      factory,
      instances: new Map(),
      createdAt: existing.createdAt,
      lastUsed: Date.now(),
    });

    console.log(
      `[ProtocolRegistry] Updated protocol plugin: ${metadata.name} v${metadata.version}`
    );
  }

  /**
   * Unregister a protocol adapter plugin
   */
  unregister(protocol: ProtocolType): void {
    const plugin = this.plugins.get(protocol);
    if (!plugin) {
      return;
    }

    // Close all instances
    for (const [instanceId, adapter] of plugin.instances) {
      adapter.disconnect().catch((err) => {
        console.error(`[ProtocolRegistry] Error disconnecting instance ${instanceId}:`, err);
      });
    }

    this.plugins.delete(protocol);
    console.log(`[ProtocolRegistry] Unregistered protocol: ${protocol}`);
  }

  /**
   * Create a new protocol adapter instance
   */
  createAdapter(protocol: ProtocolType, instanceId?: string): IProtocolAdapter {
    const plugin = this.plugins.get(protocol);
    if (!plugin) {
      throw new Error(
        `Protocol ${protocol} is not registered. Available protocols: ${Array.from(
          this.plugins.keys()
        ).join(', ')}`
      );
    }

    const adapter = plugin.factory();
    const id = instanceId || this.generateInstanceId(protocol);

    plugin.instances.set(id, adapter);
    plugin.lastUsed = Date.now();

    console.log(`[ProtocolRegistry] Created adapter instance: ${protocol}:${id}`);

    return adapter;
  }

  /**
   * Get an existing adapter instance
   */
  getAdapter(protocol: ProtocolType, instanceId: string): IProtocolAdapter | undefined {
    const plugin = this.plugins.get(protocol);
    return plugin?.instances.get(instanceId);
  }

  /**
   * Destroy an adapter instance
   */
  async destroyAdapter(protocol: ProtocolType, instanceId: string): Promise<void> {
    const plugin = this.plugins.get(protocol);
    if (!plugin) {
      return;
    }

    const adapter = plugin.instances.get(instanceId);
    if (adapter) {
      await adapter.disconnect();
      plugin.instances.delete(instanceId);
      console.log(`[ProtocolRegistry] Destroyed adapter instance: ${protocol}:${instanceId}`);
    }
  }

  /**
   * Get plugin metadata
   */
  getMetadata(protocol: ProtocolType): ProtocolPluginMetadata | undefined {
    return this.plugins.get(protocol)?.metadata;
  }

  /**
   * List all registered protocols
   */
  listProtocols(): ProtocolType[] {
    return Array.from(this.plugins.keys());
  }

  /**
   * List all plugin metadata
   */
  listPluginMetadata(): ProtocolPluginMetadata[] {
    return Array.from(this.plugins.values()).map((plugin) => plugin.metadata);
  }

  /**
   * Get plugin statistics
   */
  getStatistics(protocol: ProtocolType): PluginStatistics | undefined {
    const plugin = this.plugins.get(protocol);
    if (!plugin) {
      return undefined;
    }

    return {
      protocol,
      version: plugin.metadata.version,
      instanceCount: plugin.instances.size,
      createdAt: plugin.createdAt,
      lastUsed: plugin.lastUsed,
      uptime: Date.now() - plugin.createdAt,
    };
  }

  /**
   * Get all plugin statistics
   */
  getAllStatistics(): PluginStatistics[] {
    return Array.from(this.plugins.keys())
      .map((protocol) => this.getStatistics(protocol))
      .filter((stats): stats is PluginStatistics => stats !== undefined);
  }

  /**
   * Check if a protocol is supported
   */
  isSupported(protocol: ProtocolType): boolean {
    return this.plugins.has(protocol);
  }

  /**
   * Get protocol capabilities
   */
  getCapabilities(protocol: ProtocolType): ProtocolCapabilities | undefined {
    return this.plugins.get(protocol)?.metadata.capabilities;
  }

  /**
   * Auto-discover and register protocol plugins from directory
   * (For future implementation with dynamic imports)
   */
  async discoverPlugins(pluginDirectory: string): Promise<void> {
    // TODO: Implement dynamic plugin discovery
    // This would scan a directory for plugin modules and auto-register them
    console.log(`[ProtocolRegistry] Plugin discovery from ${pluginDirectory} not yet implemented`);
  }

  /**
   * Generate a unique instance ID
   */
  private generateInstanceId(protocol: ProtocolType): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 9);
    return `${protocol.toLowerCase()}_${timestamp}_${random}`;
  }

  /**
   * Clear all plugins (for testing)
   */
  clear(): void {
    for (const protocol of this.plugins.keys()) {
      this.unregister(protocol);
    }
  }
}

/**
 * Plugin Statistics
 */
export interface PluginStatistics {
  protocol: ProtocolType;
  version: string;
  instanceCount: number;
  createdAt: number;
  lastUsed: number;
  uptime: number;
}

/**
 * Helper decorator for easy plugin registration
 */
export function RegisterProtocol(metadata: ProtocolPluginMetadata) {
  return function <T extends { new (...args: any[]): IProtocolAdapter }>(constructor: T): T {
    // Register the plugin on module load
    const registry = ProtocolRegistry.getInstance();
    registry.register(metadata, () => new constructor());
    return constructor;
  };
}

/**
 * Connection Pool for protocol adapters
 *
 * Manages a pool of reusable protocol adapter connections
 */
export class ProtocolConnectionPool {
  private pools: Map<ProtocolType, ConnectionPoolEntry[]> = new Map();
  private readonly maxPoolSize: number;
  private readonly idleTimeout: number;

  constructor(maxPoolSize: number = 10, idleTimeout: number = 300000) {
    this.maxPoolSize = maxPoolSize;
    this.idleTimeout = idleTimeout;

    // Start idle connection cleanup
    this.startIdleCleanup();
  }

  /**
   * Acquire a connection from pool or create new one
   */
  async acquire(protocol: ProtocolType, config: ConnectionConfig): Promise<IProtocolAdapter> {
    const pool = this.pools.get(protocol) || [];

    // Try to find an idle, connected adapter
    const available = pool.find(
      (entry) =>
        !entry.inUse && entry.adapter.isConnected() && this.isConfigMatch(entry.config, config)
    );

    if (available) {
      available.inUse = true;
      available.lastUsed = Date.now();
      return available.adapter;
    }

    // Create new adapter
    const registry = ProtocolRegistry.getInstance();
    const adapter = registry.createAdapter(protocol);
    await adapter.connect(config);

    const entry: ConnectionPoolEntry = {
      adapter,
      config,
      inUse: true,
      createdAt: Date.now(),
      lastUsed: Date.now(),
    };

    pool.push(entry);
    this.pools.set(protocol, pool);

    return adapter;
  }

  /**
   * Release a connection back to pool
   */
  release(protocol: ProtocolType, adapter: IProtocolAdapter): void {
    const pool = this.pools.get(protocol);
    if (!pool) {
      return;
    }

    const entry = pool.find((e) => e.adapter === adapter);
    if (entry) {
      entry.inUse = false;
      entry.lastUsed = Date.now();
    }
  }

  /**
   * Close all connections in pool
   */
  async closeAll(): Promise<void> {
    for (const [protocol, pool] of this.pools) {
      await Promise.all(
        pool.map(async (entry) => {
          try {
            await entry.adapter.disconnect();
          } catch (err) {
            console.error(`[ConnectionPool] Error closing ${protocol} connection:`, err);
          }
        })
      );
    }
    this.pools.clear();
  }

  /**
   * Start idle connection cleanup
   */
  private startIdleCleanup(): void {
    setInterval(() => {
      const now = Date.now();
      for (const [protocol, pool] of this.pools) {
        const toRemove: number[] = [];

        pool.forEach((entry, index) => {
          if (!entry.inUse && now - entry.lastUsed > this.idleTimeout) {
            entry.adapter.disconnect().catch((err) => {
              console.error(`[ConnectionPool] Error disconnecting idle ${protocol}:`, err);
            });
            toRemove.push(index);
          }
        });

        // Remove disconnected entries
        toRemove.reverse().forEach((index) => pool.splice(index, 1));

        // Trim pool if too large
        while (pool.length > this.maxPoolSize) {
          const oldest = pool.filter((e) => !e.inUse).sort((a, b) => a.lastUsed - b.lastUsed)[0];
          if (oldest) {
            oldest.adapter.disconnect().catch((err) => {
              console.error(`[ConnectionPool] Error disconnecting ${protocol}:`, err);
            });
            const index = pool.indexOf(oldest);
            if (index >= 0) pool.splice(index, 1);
          } else {
            break;
          }
        }
      }
    }, 60000); // Run every minute
  }

  /**
   * Check if two configs match for connection reuse
   */
  private isConfigMatch(config1: ConnectionConfig, config2: ConnectionConfig): boolean {
    return (
      config1.protocol === config2.protocol &&
      config1.host === config2.host &&
      config1.port === config2.port &&
      config1.credentials?.username === config2.credentials?.username
    );
  }
}

interface ConnectionPoolEntry {
  adapter: IProtocolAdapter;
  config: ConnectionConfig;
  inUse: boolean;
  createdAt: number;
  lastUsed: number;
}
