import { z } from 'zod';

export const deviceSchema = z.object({
  name: z
    .string()
    .min(1, 'Device name is required')
    .max(100, 'Name must be less than 100 characters'),
  type: z
    .enum(['plc', 'sensor', 'actuator', 'gateway'])
    .refine((val) => val, { message: 'Device type is required' }),
  protocol: z
    .enum(['modbus', 'mqtt', 'opcua'])
    .refine((val) => val, { message: 'Protocol is required' }),
  projectId: z.string().optional(),
  gatewayId: z.string().optional(),
  eui: z
    .string()
    .regex(/^[A-Fa-f0-9]{16}$/, 'EUI must be 16 hexadecimal characters')
    .optional()
    .or(z.literal('')),
  config: z.record(z.string(), z.any()).optional(),
  location: z
    .object({
      latitude: z.number().min(-90).max(90),
      longitude: z.number().min(-180).max(180),
      altitude: z.number().optional(),
    })
    .optional(),
  organizationId: z.string().optional(),
});

export type DeviceFormData = z.infer<typeof deviceSchema>;
