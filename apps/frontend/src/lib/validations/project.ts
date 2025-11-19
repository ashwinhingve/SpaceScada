import { z } from 'zod';

export const projectSchema = z.object({
  name: z
    .string()
    .min(1, 'Project name is required')
    .max(100, 'Name must be less than 100 characters'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  organizationId: z.string().optional(),
  labels: z.array(z.string()).optional(),
});

export type ProjectFormData = z.infer<typeof projectSchema>;
