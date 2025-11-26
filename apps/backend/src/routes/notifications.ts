import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';

const createNotificationSchema = z.object({
  type: z.string(),
  title: z.string().min(1).max(255),
  message: z.string().min(1),
  severity: z.enum(['info', 'success', 'warning', 'error']).default('info'),
  actionUrl: z.string().url().optional(),
  metadata: z.record(z.any()).optional(),
  expiresAt: z.string().datetime().optional(),
});

export default async function notificationsRoutes(fastify: FastifyInstance) {
  const { pg } = fastify;

  // Get all notifications for current user
  fastify.get('/api/notifications', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = '00000000-0000-0000-0000-000000000001';
      const { read, limit = 50, offset = 0 } = request.query as any;

      let query = `
        SELECT * FROM notifications
        WHERE user_id = $1
      `;
      const params: any[] = [userId];

      if (read !== undefined) {
        query += ` AND read = $${params.length + 1}`;
        params.push(read === 'true');
      }

      query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
      params.push(limit, offset);

      const result = await pg.query(query, params);

      const countQuery = read !== undefined
        ? 'SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND read = $2'
        : 'SELECT COUNT(*) FROM notifications WHERE user_id = $1';
      const countParams = read !== undefined ? [userId, read === 'true'] : [userId];
      const countResult = await pg.query(countQuery, countParams);

      reply.send({
        notifications: result.rows,
        total: parseInt(countResult.rows[0].count),
        unread: await getUnreadCount(pg, userId),
        limit,
        offset,
      });
    } catch (error) {
      fastify.log.error(error);
      reply.status(500).send({ error: 'Failed to fetch notifications' });
    }
  });

  // Get unread count
  fastify.get('/api/notifications/unread/count', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = '00000000-0000-0000-0000-000000000001';
      const count = await getUnreadCount(pg, userId);
      reply.send({ count });
    } catch (error) {
      fastify.log.error(error);
      reply.status(500).send({ error: 'Failed to fetch unread count' });
    }
  });

  // Mark notification as read
  fastify.patch('/api/notifications/:id/read', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = '00000000-0000-0000-0000-000000000001';
      const { id } = request.params as any;

      const result = await pg.query(
        `UPDATE notifications
         SET read = true, read_at = CURRENT_TIMESTAMP
         WHERE id = $1 AND user_id = $2
         RETURNING *`,
        [id, userId]
      );

      if (result.rows.length === 0) {
        return reply.status(404).send({ error: 'Notification not found' });
      }

      reply.send({ notification: result.rows[0] });
    } catch (error) {
      fastify.log.error(error);
      reply.status(500).send({ error: 'Failed to mark notification as read' });
    }
  });

  // Mark all notifications as read
  fastify.post('/api/notifications/read-all', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = '00000000-0000-0000-0000-000000000001';

      await pg.query(
        `UPDATE notifications
         SET read = true, read_at = CURRENT_TIMESTAMP
         WHERE user_id = $1 AND read = false`,
        [userId]
      );

      reply.send({ message: 'All notifications marked as read' });
    } catch (error) {
      fastify.log.error(error);
      reply.status(500).send({ error: 'Failed to mark all as read' });
    }
  });

  // Delete notification
  fastify.delete('/api/notifications/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = '00000000-0000-0000-0000-000000000001';
      const { id } = request.params as any;

      const result = await pg.query(
        'DELETE FROM notifications WHERE id = $1 AND user_id = $2 RETURNING id',
        [id, userId]
      );

      if (result.rows.length === 0) {
        return reply.status(404).send({ error: 'Notification not found' });
      }

      reply.send({ message: 'Notification deleted successfully' });
    } catch (error) {
      fastify.log.error(error);
      reply.status(500).send({ error: 'Failed to delete notification' });
    }
  });

  // Delete all read notifications
  fastify.delete('/api/notifications/read', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = '00000000-0000-0000-0000-000000000001';

      await pg.query(
        'DELETE FROM notifications WHERE user_id = $1 AND read = true',
        [userId]
      );

      reply.send({ message: 'All read notifications deleted successfully' });
    } catch (error) {
      fastify.log.error(error);
      reply.status(500).send({ error: 'Failed to delete notifications' });
    }
  });

  // Create notification (for testing/system use)
  fastify.post('/api/notifications', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = '00000000-0000-0000-0000-000000000001';
      const data = createNotificationSchema.parse(request.body);

      const result = await pg.query(
        `INSERT INTO notifications
         (user_id, type, title, message, severity, action_url, metadata, expires_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [
          userId,
          data.type,
          data.title,
          data.message,
          data.severity,
          data.actionUrl || null,
          data.metadata ? JSON.stringify(data.metadata) : null,
          data.expiresAt || null,
        ]
      );

      reply.status(201).send({ notification: result.rows[0] });
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: error.errors });
      }
      fastify.log.error(error);
      reply.status(500).send({ error: 'Failed to create notification' });
    }
  });
}

async function getUnreadCount(pg: any, userId: string): Promise<number> {
  const result = await pg.query(
    'SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND read = false',
    [userId]
  );
  return parseInt(result.rows[0].count);
}
