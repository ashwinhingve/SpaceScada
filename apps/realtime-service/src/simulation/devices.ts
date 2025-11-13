import {
  Device,
  DeviceType,
  DeviceStatus,
  DeviceTag,
  DataType,
  TagQuality,
  SimulationType,
} from '../types';
import { DataGenerator } from './generator';

interface DeviceDefinition extends Omit<Device, 'tags' | 'lastUpdate'> {
  tags: Array<{
    id: string;
    name: string;
    dataType: DataType;
    unit?: string;
    simulation: SimulationType;
    min?: number;
    max?: number;
    frequency?: number;
    step?: number;
  }>;
}

const deviceDefinitions: DeviceDefinition[] = [
  {
    id: 'temp-sensor-001',
    name: 'Temperature Sensor 1',
    type: DeviceType.TEMPERATURE_SENSOR,
    status: DeviceStatus.ONLINE,
    location: 'Zone A',
    tags: [
      {
        id: 'temp-001',
        name: 'temperature',
        dataType: DataType.FLOAT,
        unit: '°C',
        simulation: SimulationType.SINE_WAVE,
        min: 20,
        max: 30,
        frequency: 0.1,
      },
    ],
  },
  {
    id: 'pressure-sensor-001',
    name: 'Pressure Sensor 1',
    type: DeviceType.PRESSURE_SENSOR,
    status: DeviceStatus.ONLINE,
    location: 'Zone A',
    tags: [
      {
        id: 'pressure-001',
        name: 'pressure',
        dataType: DataType.FLOAT,
        unit: 'bar',
        simulation: SimulationType.RANDOM,
        min: 1,
        max: 5,
      },
    ],
  },
  {
    id: 'pump-001',
    name: 'Main Pump',
    type: DeviceType.PUMP,
    status: DeviceStatus.ONLINE,
    location: 'Zone B',
    tags: [
      {
        id: 'pump-status-001',
        name: 'status',
        dataType: DataType.BOOLEAN,
        simulation: SimulationType.BOOLEAN_TOGGLE,
      },
    ],
  },
  {
    id: 'valve-001',
    name: 'Control Valve 1',
    type: DeviceType.VALVE,
    status: DeviceStatus.ONLINE,
    location: 'Zone B',
    tags: [
      {
        id: 'valve-state-001',
        name: 'state',
        dataType: DataType.BOOLEAN,
        simulation: SimulationType.BOOLEAN_TOGGLE,
      },
    ],
  },
  {
    id: 'flow-meter-001',
    name: 'Flow Meter 1',
    type: DeviceType.FLOW_METER,
    status: DeviceStatus.ONLINE,
    location: 'Zone C',
    tags: [
      {
        id: 'flow-rate-001',
        name: 'flowRate',
        dataType: DataType.FLOAT,
        unit: 'L/min',
        simulation: SimulationType.RAMP,
        min: 0,
        max: 100,
        step: 2,
      },
    ],
  },
];

export class DeviceSimulator {
  private devices: Map<string, Device> = new Map();
  private generators: Map<string, DataGenerator> = new Map();

  constructor() {
    this.initializeDevices();
  }

  private initializeDevices(): void {
    deviceDefinitions.forEach((def) => {
      const tags: DeviceTag[] = def.tags.map((tagDef) => ({
        id: tagDef.id,
        deviceId: def.id,
        name: tagDef.name,
        dataType: tagDef.dataType,
        unit: tagDef.unit,
        value: null,
        quality: TagQuality.GOOD,
        timestamp: new Date(),
      }));

      const device: Device = {
        ...def,
        tags,
        lastUpdate: new Date(),
      };

      this.devices.set(def.id, device);

      // Create generators for each tag
      def.tags.forEach((tagDef) => {
        const generator = new DataGenerator({
          type: tagDef.simulation,
          min: tagDef.min,
          max: tagDef.max,
          frequency: tagDef.frequency,
          step: tagDef.step,
        });
        this.generators.set(tagDef.id, generator);
      });
    });
  }

  getAllDevices(): Device[] {
    return Array.from(this.devices.values());
  }

  getDevice(deviceId: string): Device | undefined {
    return this.devices.get(deviceId);
  }

  updateDeviceValue(deviceId: string, tagId: string, value: number | boolean): boolean {
    const device = this.devices.get(deviceId);
    if (!device) return false;

    const tag = device.tags.find((t) => t.id === tagId);
    if (!tag) return false;

    tag.value = value;
    tag.timestamp = new Date();
    device.lastUpdate = new Date();

    return true;
  }

  generateNextValues(): Map<string, Device> {
    const updatedDevices = new Map<string, Device>();

    this.devices.forEach((device) => {
      let hasUpdates = false;

      device.tags.forEach((tag) => {
        const generator = this.generators.get(tag.id);
        if (generator) {
          tag.value = generator.generate();
          tag.timestamp = new Date();
          hasUpdates = true;
        }
      });

      if (hasUpdates) {
        device.lastUpdate = new Date();
        updatedDevices.set(device.id, device);
      }
    });

    return updatedDevices;
  }

  setDeviceStatus(deviceId: string, status: DeviceStatus): boolean {
    const device = this.devices.get(deviceId);
    if (!device) return false;

    device.status = status;
    device.lastUpdate = new Date();

    return true;
  }

  reset(): void {
    this.generators.forEach((generator) => generator.reset());
    this.devices.forEach((device) => {
      device.tags.forEach((tag) => {
        tag.value = null;
        tag.timestamp = new Date();
      });
      device.lastUpdate = new Date();
    });
  }
}
