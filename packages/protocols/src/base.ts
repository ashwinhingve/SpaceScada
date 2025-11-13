import { ConnectionConfig, Tag, TagValue } from '@webscada/shared-types';

export interface ProtocolAdapter {
  connect(config: ConnectionConfig): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
  read(address: string): Promise<TagValue>;
  write(address: string, value: TagValue): Promise<void>;
  readMultiple(addresses: string[]): Promise<Map<string, TagValue>>;
  subscribe(tags: Tag[], callback: (tag: Tag) => void): void;
  unsubscribe(tagIds: string[]): void;
}

export abstract class BaseProtocolAdapter implements ProtocolAdapter {
  protected connected: boolean = false;
  protected config?: ConnectionConfig;

  abstract connect(config: ConnectionConfig): Promise<void>;
  abstract disconnect(): Promise<void>;
  abstract read(address: string): Promise<TagValue>;
  abstract write(address: string, value: TagValue): Promise<void>;

  isConnected(): boolean {
    return this.connected;
  }

  async readMultiple(addresses: string[]): Promise<Map<string, TagValue>> {
    const results = new Map<string, TagValue>();

    for (const address of addresses) {
      try {
        const value = await this.read(address);
        results.set(address, value);
      } catch (error) {
        console.error(`Failed to read address ${address}:`, error);
        results.set(address, null);
      }
    }

    return results;
  }

  subscribe(_tags: Tag[], _callback: (tag: Tag) => void): void {
    throw new Error('Subscribe not implemented for this protocol');
  }

  unsubscribe(_tagIds: string[]): void {
    throw new Error('Unsubscribe not implemented for this protocol');
  }
}
