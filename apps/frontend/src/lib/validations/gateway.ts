import { z } from 'zod';

export const gatewaySchema = z.object({
  name: z
    .string()
    .min(1, 'Gateway name is required')
    .max(100, 'Name must be less than 100 characters'),
  eui: z
    .string()
    .regex(/^[A-Fa-f0-9]{16}$/, 'EUI must be 16 hexadecimal characters')
    .optional()
    .or(z.literal('')),
  protocol: z
    .enum(['modbus', 'mqtt', 'opcua'])
    .refine((val) => val, { message: 'Protocol is required' }),
  frequencyPlan: z.string().optional(),
  location: z
    .object({
      latitude: z.number().min(-90).max(90),
      longitude: z.number().min(-180).max(180),
      altitude: z.number().optional(),
    })
    .optional(),
  networkSettings: z
    .object({
      requireAuth: z.boolean().optional(),
      publicStatus: z.boolean().optional(),
      publicLocation: z.boolean().optional(),
      packetBrokerForwarding: z.boolean().optional(),
      statusLocationUpdates: z.boolean().optional(),
      enforceDutyCycle: z.boolean().optional(),
    })
    .optional(),
  organizationId: z.string().optional(),
});

export type GatewayFormData = z.infer<typeof gatewaySchema>;
