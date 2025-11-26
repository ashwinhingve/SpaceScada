import { useState, useCallback } from 'react';
import { ESP32ControlCommand, ESP32Action, CommandStatus } from '@webscada/shared-types';
import { esp32API } from '@/lib/esp32-api';

export interface UseESP32ControlResult {
  sending: boolean;
  error: Error | null;
  sendCommand: (command: ESP32ControlCommand) => Promise<void>;
  toggleLED: () => Promise<void>;
  setLED: (state: boolean) => Promise<void>;
  requestStatus: () => Promise<void>;
  rebootDevice: () => Promise<void>;
}

/**
 * Hook to send control commands to ESP32 devices
 */
export function useESP32Control(deviceId: string | null): UseESP32ControlResult {
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const sendCommand = useCallback(
    async (command: ESP32ControlCommand) => {
      if (!deviceId) {
        throw new Error('No device ID provided');
      }

      try {
        setSending(true);
        setError(null);
        await esp32API.sendControlCommand(deviceId, command);
      } catch (err) {
        setError(err as Error);
        console.error('Failed to send control command:', err);
        throw err;
      } finally {
        setSending(false);
      }
    },
    [deviceId]
  );

  const toggleLED = useCallback(async () => {
    if (!deviceId) return;
    await sendCommand({
      id: crypto.randomUUID(),
      deviceId,
      action: ESP32Action.TOGGLE_LED,
      status: CommandStatus.PENDING,
    });
  }, [sendCommand, deviceId]);

  const setLED = useCallback(
    async (state: boolean) => {
      if (!deviceId) return;
      await sendCommand({
        id: crypto.randomUUID(),
        deviceId,
        action: ESP32Action.SET_LED,
        ledState: state,
        status: CommandStatus.PENDING,
      });
    },
    [sendCommand, deviceId]
  );

  const requestStatus = useCallback(async () => {
    if (!deviceId) return;
    await sendCommand({
      id: crypto.randomUUID(),
      deviceId,
      action: ESP32Action.REQUEST_STATUS,
      status: CommandStatus.PENDING,
    });
  }, [sendCommand, deviceId]);

  const rebootDevice = useCallback(async () => {
    if (!deviceId) return;
    if (confirm('Are you sure you want to reboot this device?')) {
      await sendCommand({
        id: crypto.randomUUID(),
        deviceId,
        action: ESP32Action.REBOOT,
        status: CommandStatus.PENDING,
      });
    }
  }, [sendCommand, deviceId]);

  return {
    sending,
    error,
    sendCommand,
    toggleLED,
    setLED,
    requestStatus,
    rebootDevice,
  };
}
