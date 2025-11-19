import { z } from 'zod';

export const organizationSchema = z.object({
  name: z
    .string()
    .min(1, 'Organization name is required')
    .max(100, 'Name must be less than 100 characters'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
});

export type OrganizationFormData = z.infer<typeof organizationSchema>;
