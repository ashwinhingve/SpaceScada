import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';

// Validation schemas
const updateProfileSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  phone: z.string().max(20).optional(),
  company: z.string().max(255).optional(),
  bio: z.string().max(1000).optional(),
  avatarUrl: z.string().url().optional(),
});

const updatePasswordSchema = z.object({
  currentPassword: z.string().min(8),
  newPassword: z.string().min(8).max(100),
  confirmPassword: z.string().min(8).max(100),
}).refine((data: { newPassword: string; confirmPassword: string }) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const updateSettingsSchema = z.object({
  theme: z.enum(['light', 'dark', 'auto']).optional(),
  language: z.string().max(10).optional(),
  timezone: z.string().max(50).optional(),
  dateFormat: z.string().max(20).optional(),
  timeFormat: z.enum(['12h', '24h']).optional(),
  notificationsEnabled: z.boolean().optional(),
  emailNotifications: z.boolean().optional(),
  pushNotifications: z.boolean().optional(),
  smsNotifications: z.boolean().optional(),
  notificationFrequency: z.enum(['realtime', 'hourly', 'daily', 'weekly']).optional(),
});

export default async function usersRoutes(fastify: FastifyInstance) {
  const { pg } = fastify;

  // Get current user profile
  fastify.get('/api/users/me', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Mock user ID - replace with actual auth middleware
      const userId = '00000000-0000-0000-0000-000000000001';

      const result = await pg.query(
        `SELECT
          id, email, username, first_name, last_name, avatar_url,
          bio, phone, company, role, is_active, is_verified,
          email_verified_at, last_login_at, created_at
        FROM users
        WHERE id = $1`,
        [userId]
      );

      if (result.rows.length === 0) {
        return reply.status(404).send({ error: 'User not found' });
      }

      reply.send({ user: result.rows[0] });
    } catch (error) {
      fastify.log.error(error);
      reply.status(500).send({ error: 'Failed to fetch user profile' });
    }
  });

  // Update user profile
  fastify.put('/api/users/me', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = '00000000-0000-0000-0000-000000000001';
      const data = updateProfileSchema.parse(request.body);

      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (data.firstName) {
        updates.push(`first_name = $${paramIndex++}`);
        values.push(data.firstName);
      }
      if (data.lastName) {
        updates.push(`last_name = $${paramIndex++}`);
        values.push(data.lastName);
      }
      if (data.email) {
        updates.push(`email = $${paramIndex++}`);
        values.push(data.email);
      }
      if (data.phone !== undefined) {
        updates.push(`phone = $${paramIndex++}`);
        values.push(data.phone);
      }
      if (data.company !== undefined) {
        updates.push(`company = $${paramIndex++}`);
        values.push(data.company);
      }
      if (data.bio !== undefined) {
        updates.push(`bio = $${paramIndex++}`);
        values.push(data.bio);
      }
      if (data.avatarUrl) {
        updates.push(`avatar_url = $${paramIndex++}`);
        values.push(data.avatarUrl);
      }

      if (updates.length === 0) {
        return reply.status(400).send({ error: 'No fields to update' });
      }

      values.push(userId);
      const query = `
        UPDATE users
        SET ${updates.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING id, email, username, first_name, last_name, avatar_url, bio, phone, company
      `;

      const result = await pg.query(query, values);

      // Log activity
      await pg.query(
        `INSERT INTO activity_logs (user_id, action, resource_type, description)
         VALUES ($1, 'profile_updated', 'user', 'User updated their profile')`,
        [userId]
      );

      reply.send({ user: result.rows[0], message: 'Profile updated successfully' });
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: error.errors });
      }
      fastify.log.error(error);
      reply.status(500).send({ error: 'Failed to update profile' });
    }
  });

  // Update password
  fastify.post('/api/users/me/password', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = '00000000-0000-0000-0000-000000000001';
      const data = updatePasswordSchema.parse(request.body);

      // In production, verify current password
      // const bcrypt = require('bcrypt');
      // const currentUser = await pg.query('SELECT password_hash FROM users WHERE id = $1', [userId]);
      // const validPassword = await bcrypt.compare(data.currentPassword, currentUser.rows[0].password_hash);
      // if (!validPassword) {
      //   return reply.status(401).send({ error: 'Current password is incorrect' });
      // }

      // Hash new password
      // const newPasswordHash = await bcrypt.hash(data.newPassword, 10);

      await pg.query(
        'UPDATE users SET password_hash = $1 WHERE id = $2',
        ['$2b$10$NewHashedPassword', userId] // Replace with actual hash
      );

      // Log activity
      await pg.query(
        `INSERT INTO activity_logs (user_id, action, resource_type, description)
         VALUES ($1, 'password_changed', 'user', 'User changed their password')`,
        [userId]
      );

      reply.send({ message: 'Password updated successfully' });
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: error.errors });
      }
      fastify.log.error(error);
      reply.status(500).send({ error: 'Failed to update password' });
    }
  });

  // Get user settings
  fastify.get('/api/users/me/settings', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = '00000000-0000-0000-0000-000000000001';

      const result = await pg.query(
        'SELECT * FROM user_settings WHERE user_id = $1',
        [userId]
      );

      if (result.rows.length === 0) {
        // Create default settings
        const newSettings = await pg.query(
          'INSERT INTO user_settings (user_id) VALUES ($1) RETURNING *',
          [userId]
        );
        return reply.send({ settings: newSettings.rows[0] });
      }

      reply.send({ settings: result.rows[0] });
    } catch (error) {
      fastify.log.error(error);
      reply.status(500).send({ error: 'Failed to fetch settings' });
    }
  });

  // Update user settings
  fastify.put('/api/users/me/settings', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = '00000000-0000-0000-0000-000000000001';
      const data = updateSettingsSchema.parse(request.body);

      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (data.theme) {
        updates.push(`theme = $${paramIndex++}`);
        values.push(data.theme);
      }
      if (data.language) {
        updates.push(`language = $${paramIndex++}`);
        values.push(data.language);
      }
      if (data.timezone) {
        updates.push(`timezone = $${paramIndex++}`);
        values.push(data.timezone);
      }
      if (data.dateFormat) {
        updates.push(`date_format = $${paramIndex++}`);
        values.push(data.dateFormat);
      }
      if (data.timeFormat) {
        updates.push(`time_format = $${paramIndex++}`);
        values.push(data.timeFormat);
      }
      if (data.notificationsEnabled !== undefined) {
        updates.push(`notifications_enabled = $${paramIndex++}`);
        values.push(data.notificationsEnabled);
      }
      if (data.emailNotifications !== undefined) {
        updates.push(`email_notifications = $${paramIndex++}`);
        values.push(data.emailNotifications);
      }
      if (data.pushNotifications !== undefined) {
        updates.push(`push_notifications = $${paramIndex++}`);
        values.push(data.pushNotifications);
      }
      if (data.smsNotifications !== undefined) {
        updates.push(`sms_notifications = $${paramIndex++}`);
        values.push(data.smsNotifications);
      }
      if (data.notificationFrequency) {
        updates.push(`notification_frequency = $${paramIndex++}`);
        values.push(data.notificationFrequency);
      }

      if (updates.length === 0) {
        return reply.status(400).send({ error: 'No fields to update' });
      }

      values.push(userId);
      const query = `
        UPDATE user_settings
        SET ${updates.join(', ')}
        WHERE user_id = $${paramIndex}
        RETURNING *
      `;

      const result = await pg.query(query, values);

      reply.send({ settings: result.rows[0], message: 'Settings updated successfully' });
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: error.errors });
      }
      fastify.log.error(error);
      reply.status(500).send({ error: 'Failed to update settings' });
    }
  });

  // Get activity logs
  fastify.get('/api/users/me/activity', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = '00000000-0000-0000-0000-000000000001';
      const { limit = 50, offset = 0 } = request.query as any;

      const result = await pg.query(
        `SELECT * FROM activity_logs
         WHERE user_id = $1
         ORDER BY created_at DESC
         LIMIT $2 OFFSET $3`,
        [userId, limit, offset]
      );

      const countResult = await pg.query(
        'SELECT COUNT(*) FROM activity_logs WHERE user_id = $1',
        [userId]
      );

      reply.send({
        activities: result.rows,
        total: parseInt(countResult.rows[0].count),
        limit,
        offset,
      });
    } catch (error) {
      fastify.log.error(error);
      reply.status(500).send({ error: 'Failed to fetch activity logs' });
    }
  });
}
