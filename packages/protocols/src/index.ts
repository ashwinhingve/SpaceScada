/**
 * @webscada/protocols
 *
 * Enterprise multi-protocol device connectivity package.
 * Provides unified abstraction layer for industrial protocols.
 */

// Protocol Abstraction Layer (PAL)
export * from './abstraction';

// Protocol Normalization (Sparkplug B)
export * from './normalization';

// Protocol Registry & Plugin System
export * from './registry';

// Protocol Adapters
export * from './adapters';

// Legacy exports (for backward compatibility)
// Note: Only export items not already exported by new architecture
export { MQTTAdapter } from './mqtt';
export { GSMAdapter } from './gsm';
export { OPCUAAdapter } from './opcua';
