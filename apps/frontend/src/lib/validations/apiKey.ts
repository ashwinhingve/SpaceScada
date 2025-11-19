import { z } from 'zod';

export const apiKeySchema = z.object({
  name: z
    .string()
    .min(1, 'API key name is required')
    .max(100, 'Name must be less than 100 characters'),
  rights: z
    .array(
      z.enum([
        'devices:read',
        'devices:write',
        'devices:delete',
        'tags:read',
        'tags:write',
        'projects:read',
        'projects:write',
        'projects:delete',
        'gateways:read',
        'gateways:write',
        'gateways:delete',
        'organizations:read',
        'organizations:write',
        'all',
      ])
    )
    .min(1, 'At least one permission is required'),
  expiresAt: z.date().optional(),
  organizationId: z.string().optional(),
  projectId: z.string().optional(),
});

export type ApiKeyFormData = z.infer<typeof apiKeySchema>;
