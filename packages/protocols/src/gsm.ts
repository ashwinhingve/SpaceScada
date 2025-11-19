import {
  ConnectionConfig,
  Tag,
  TagValue,
  GSMConfig,
  GSMNetworkStatus,
  GPSLocation,
  SMSMessage,
  SendSMSRequest,
  SendSMSResponse,
  GSMCommand,
  CommandStatus,
} from '@webscada/shared-types';
import { createLogger } from '@webscada/utils';

import { BaseProtocolAdapter } from './base';

const logger = createLogger({ prefix: 'GSM' });

export interface GSMAdapterConfig extends ConnectionConfig {
  gsmConfig: GSMConfig;
}

/**
 * GSM Protocol Adapter for A7670C module
 * Supports HTTP and MQTT communication over cellular network
 */
export class GSMAdapter extends BaseProtocolAdapter {
  private httpClient?: any; // axios instance
  private mqttClient?: any; // mqtt client
  private pollingInterval?: NodeJS.Timeout;
  private deviceId?: string;

  async connect(config: ConnectionConfig): Promise<void> {
    // Extract GSM config from options
    const gsmConfig = (config.options || {}) as any as GSMConfig;

    if (!gsmConfig || !gsmConfig.apn) {
      throw new Error('GSM configuration with APN is required');
    }

    logger.info(
      `Connecting to GSM device at ${config.host}:${config.port} (APN: ${gsmConfig.apn})`
    );

    this.config = config;

    try {
      // Initialize HTTP client for communication with GSM module
      await this.initializeHTTPClient(config);

      // Test connectivity with basic AT command
      try {
        await this.ping();
        logger.info('GSM device connectivity test passed');
      } catch (pingError) {
        logger.warn('GSM device ping failed, but continuing connection:', pingError);
        // Don't fail connection if ping fails - device might not support HTTP API yet
      }

      this.connected = true;
      logger.info('GSM device connected successfully');

      // Start periodic network status polling
      this.startPolling();
    } catch (error) {
      logger.error('Failed to connect to GSM device:', error);
      this.connected = false;
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (!this.connected) return;

    logger.info('Disconnecting from GSM device');

    // Stop polling
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = undefined;
    }

    // Cleanup HTTP client
    this.httpClient = undefined;
    this.mqttClient = undefined;

    this.connected = false;
    logger.info('GSM device disconnected successfully');
  }

  /**
   * Read tag value (for generic data transmission)
   * Address format: "http://endpoint/path" or "mqtt://topic"
   */
  async read(address: string): Promise<TagValue> {
    if (!this.connected) {
      throw new Error('Not connected to GSM device');
    }

    logger.debug(`Reading from address: ${address}`);

    if (address.startsWith('http://') || address.startsWith('https://')) {
      return await this.httpGet(address);
    } else if (address.startsWith('mqtt://')) {
      throw new Error('MQTT read requires subscription. Use subscribe method.');
    } else {
      throw new Error(`Unsupported address format: ${address}`);
    }
  }

  /**
   * Write tag value (for generic data transmission)
   */
  async write(address: string, value: TagValue): Promise<void> {
    if (!this.connected) {
      throw new Error('Not connected to GSM device');
    }

    logger.debug(`Writing value ${value} to address: ${address}`);

    if (address.startsWith('http://') || address.startsWith('https://')) {
      await this.httpPost(address, { value });
    } else if (address.startsWith('mqtt://')) {
      await this.mqttPublish(address.replace('mqtt://', ''), value);
    } else {
      throw new Error(`Unsupported address format: ${address}`);
    }
  }

  // ===== GSM-Specific Methods =====

  /**
   * Send SMS message
   */
  async sendSMS(request: SendSMSRequest): Promise<SendSMSResponse> {
    if (!this.connected) {
      throw new Error('Not connected to GSM device');
    }

    logger.info(`Sending SMS to ${request.phoneNumber}`);

    try {
      // In real implementation, send AT command or HTTP request to GSM module
      // AT+CMGS="<phone>"\r\n<message>\x1A
      const response = await this.sendATCommand(
        `AT+CMGS="${request.phoneNumber}"`,
        request.message
      );

      return {
        messageId: this.generateMessageId(),
        status: response.includes('OK') ? ('SENT' as any) : ('FAILED' as any),
        timestamp: new Date(),
      };
    } catch (error) {
      logger.error('Failed to send SMS:', error);
      throw error;
    }
  }

  /**
   * Read SMS messages
   */
  async readSMS(filter: 'ALL' | 'UNREAD' = 'ALL'): Promise<SMSMessage[]> {
    if (!this.connected) {
      throw new Error('Not connected to GSM device');
    }

    logger.debug(`Reading ${filter} SMS messages`);

    try {
      // AT+CMGL="ALL" or AT+CMGL="REC UNREAD"
      const command = filter === 'ALL' ? 'AT+CMGL="ALL"' : 'AT+CMGL="REC UNREAD"';
      const response = await this.sendATCommand(command);

      // Parse SMS messages from AT command response
      return this.parseSMSMessages(response);
    } catch (error) {
      logger.error('Failed to read SMS:', error);
      throw error;
    }
  }

  /**
   * Delete SMS message
   */
  async deleteSMS(index: number): Promise<void> {
    if (!this.connected) {
      throw new Error('Not connected to GSM device');
    }

    logger.debug(`Deleting SMS at index ${index}`);

    try {
      // AT+CMGD=<index>
      await this.sendATCommand(`AT+CMGD=${index}`);
    } catch (error) {
      logger.error('Failed to delete SMS:', error);
      throw error;
    }
  }

  /**
   * Get GPS location
   */
  async getGPSLocation(): Promise<GPSLocation> {
    if (!this.connected) {
      throw new Error('Not connected to GSM device');
    }

    logger.debug('Getting GPS location');

    try {
      // AT+CGPSINFO or AT+CGNSINF for A7670C
      const response = await this.sendATCommand('AT+CGNSINF');

      return this.parseGPSLocation(response);
    } catch (error) {
      logger.error('Failed to get GPS location:', error);
      throw error;
    }
  }

  /**
   * Get network status
   */
  async getNetworkStatus(): Promise<GSMNetworkStatus> {
    if (!this.connected) {
      throw new Error('Not connected to GSM device');
    }

    logger.debug('Getting network status');

    try {
      // Get multiple AT command responses
      const [operator, signalQuality, networkReg, imei, iccid] = await Promise.all([
        this.sendATCommand('AT+COPS?'), // Operator
        this.sendATCommand('AT+CSQ'), // Signal quality
        this.sendATCommand('AT+CREG?'), // Network registration
        this.sendATCommand('AT+CGSN'), // IMEI
        this.sendATCommand('AT+CCID'), // ICCID
      ]);

      return this.parseNetworkStatus({
        operator,
        signalQuality,
        networkReg,
        imei,
        iccid,
      });
    } catch (error) {
      logger.error('Failed to get network status:', error);
      throw error;
    }
  }

  /**
   * Send AT command to GSM module
   */
  async sendATCommand(command: string, data?: string): Promise<string> {
    if (!this.connected && command !== 'AT') {
      throw new Error('Not connected to GSM device');
    }

    logger.debug(`Sending AT command: ${command}`);

    try {
      // In real implementation, send via HTTP API or serial connection
      const response = await this.httpPost('/api/command', {
        command,
        data,
      });

      // Extract string response from the response object
      const responseText =
        typeof response === 'object' && response !== null
          ? (response as any).data || 'OK'
          : String(response);

      return responseText;
    } catch (error) {
      logger.error(`AT command failed: ${command}`, error);
      throw error;
    }
  }

  /**
   * Get data usage statistics
   */
  async getDataUsage(): Promise<{ sentBytes: number; receivedBytes: number }> {
    if (!this.connected) {
      throw new Error('Not connected to GSM device');
    }

    logger.debug('Getting data usage');

    try {
      // Custom command or query from module
      const response = await this.sendATCommand('AT+CPSI?');

      // TODO: Parse actual data usage from response
      return {
        sentBytes: 0,
        receivedBytes: 0,
      };
    } catch (error) {
      logger.error('Failed to get data usage:', error);
      throw error;
    }
  }

  // ===== Private Helper Methods =====

  private async initializeHTTPClient(config: ConnectionConfig): Promise<void> {
    // Initialize HTTP client with base URL
    const baseURL = `http://${config.host}:${config.port}`;
    const timeout = config.timeout || 30000;

    logger.info(`Initializing HTTP client with baseURL: ${baseURL}`);

    // Mock implementation that simulates HTTP communication
    // In production, this would use axios or native fetch
    this.httpClient = {
      baseURL,
      timeout,
      get: async (url: string) => {
        const fullURL = url.startsWith('http') ? url : `${baseURL}${url}`;
        logger.debug(`HTTP GET: ${fullURL}`);

        // Simulate successful response
        // In production, would be: await fetch(fullURL)
        return {
          data: 'OK',
          status: 200,
        };
      },
      post: async (url: string, data: any) => {
        const fullURL = url.startsWith('http') ? url : `${baseURL}${url}`;
        logger.debug(`HTTP POST: ${fullURL}`, JSON.stringify(data).substring(0, 100));

        // Simulate successful response
        // In production, would be: await fetch(fullURL, { method: 'POST', body: JSON.stringify(data) })
        return {
          data: 'OK',
          status: 200,
        };
      },
    };
  }

  private async ping(): Promise<void> {
    // Test connection with basic AT command
    const response = await this.sendATCommand('AT');
    if (!response.includes('OK')) {
      throw new Error('Device not responding');
    }
  }

  private startPolling(): void {
    // Poll network status every 30 seconds
    this.pollingInterval = setInterval(async () => {
      try {
        await this.getNetworkStatus();
      } catch (error) {
        logger.warn('Polling failed:', error);
      }
    }, 30000);
  }

  private async httpGet(url: string): Promise<TagValue> {
    const response = await this.httpClient?.get(url);
    return response?.data;
  }

  private async httpPost(url: string, data: any): Promise<TagValue> {
    const response = await this.httpClient?.post(url, data);
    return response?.data;
  }

  private async mqttPublish(topic: string, value: TagValue): Promise<void> {
    // TODO: Implement MQTT publish
    logger.debug(`MQTT publish to topic ${topic}:`, value);
  }

  private generateMessageId(): string {
    return `sms_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private parseSMSMessages(response: string): SMSMessage[] {
    // Parse AT+CMGL response
    // Format: +CMGL: <index>,<stat>,<oa/da>,<alpha>,<scts>
    //         <data>

    const messages: SMSMessage[] = [];
    const lines = response.split('\n');

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith('+CMGL:')) {
        // Parse message header
        const parts = lines[i].split(',');
        const phoneNumber = parts[2]?.replace(/"/g, '').trim() || '';
        const messageText = lines[i + 1]?.trim() || '';

        messages.push({
          id: this.generateMessageId(),
          deviceId: this.deviceId || '',
          direction: 'INBOUND' as any,
          phoneNumber,
          message: messageText,
          status: 'RECEIVED' as any,
          timestamp: new Date(),
        });
      }
    }

    return messages;
  }

  private parseGPSLocation(response: string): GPSLocation {
    // Parse AT+CGNSINF response
    // Format: +CGNSINF: <GPS run status>,<Fix status>,<UTC date & Time>,
    //         <Latitude>,<Longitude>,<MSL Altitude>,<Speed Over Ground>,
    //         <Course Over Ground>,<Fix Mode>,<Reserved1>,<HDOP>,<PDOP>,
    //         <VDOP>,<Reserved2>,<GPS Satellites in View>,<HPA>,<VPA>

    const parts = response.split(',');

    return {
      latitude: parseFloat(parts[3]) || 0,
      longitude: parseFloat(parts[4]) || 0,
      altitude: parseFloat(parts[5]) || undefined,
      speed: parseFloat(parts[6]) || undefined,
      heading: parseFloat(parts[7]) || undefined,
      satellites: parseInt(parts[14]) || undefined,
      hdop: parseFloat(parts[10]) || undefined,
      fix: this.parseFixType(parts[1]),
      timestamp: new Date(),
    };
  }

  private parseFixType(fixStatus: string): any {
    if (fixStatus === '0') return 'NO_FIX';
    if (fixStatus === '2') return 'FIX_2D';
    if (fixStatus === '3') return 'FIX_3D';
    return 'NO_FIX';
  }

  private parseNetworkStatus(responses: {
    operator: string;
    signalQuality: string;
    networkReg: string;
    imei: string;
    iccid: string;
  }): GSMNetworkStatus {
    // Parse AT command responses

    // Parse signal quality: +CSQ: <rssi>,<ber>
    const csqMatch = responses.signalQuality.match(/\+CSQ:\s*(\d+),(\d+)/);
    const rssi = csqMatch ? parseInt(csqMatch[1]) : 0;
    const signalStrength = Math.round((rssi / 31) * 100);

    // Parse operator: +COPS: <mode>,<format>,"<operator>"
    const operatorMatch = responses.operator.match(/"([^"]+)"/);
    const operator = operatorMatch ? operatorMatch[1] : 'Unknown';

    // Parse network registration: +CREG: <n>,<stat>
    const regMatch = responses.networkReg.match(/\+CREG:\s*\d+,(\d+)/);
    const registered = regMatch ? regMatch[1] === '1' || regMatch[1] === '5' : false;
    const roaming = regMatch ? regMatch[1] === '5' : false;

    // Parse IMEI
    const imei = responses.imei.replace(/\s/g, '').trim();

    // Parse ICCID
    const iccid = responses.iccid.replace(/\s/g, '').trim();

    return {
      operator,
      signalStrength,
      signalQuality: this.getSignalQuality(signalStrength),
      networkType: 'LTE_CAT1' as any,
      registered,
      roaming,
      imei,
      iccid,
      simStatus: 'READY' as any,
      timestamp: new Date(),
    };
  }

  private getSignalQuality(strength: number): any {
    if (strength >= 80) return 'EXCELLENT';
    if (strength >= 60) return 'GOOD';
    if (strength >= 40) return 'FAIR';
    if (strength >= 20) return 'POOR';
    return 'NO_SIGNAL';
  }
}
