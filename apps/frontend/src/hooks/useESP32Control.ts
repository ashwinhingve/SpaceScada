import { useState, useCallback } from 'react';
import { ESP32ControlCommand, ESP32Action } from '@webscada/shared-types';
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
    await sendCommand({
      action: ESP32Action.TOGGLE_LED,
    });
  }, [sendCommand]);

  const setLED = useCallback(
    async (state: boolean) => {
      await sendCommand({
        action: ESP32Action.SET_LED,
        ledState: state,
      });
    },
    [sendCommand]
  );

  const requestStatus = useCallback(async () => {
    await sendCommand({
      action: ESP32Action.REQUEST_STATUS,
    });
  }, [sendCommand]);

  const rebootDevice = useCallback(async () => {
    if (confirm('Are you sure you want to reboot this device?')) {
      await sendCommand({
        action: ESP32Action.REBOOT,
      });
    }
  }, [sendCommand]);

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
