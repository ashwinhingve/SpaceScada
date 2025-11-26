import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

export default async function sessionsRoutes(fastify: FastifyInstance) {
  const { pg } = fastify;

  // Get all active sessions for current user
  fastify.get('/api/sessions', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = '00000000-0000-0000-0000-000000000001';

      const result = await pg.query(
        `SELECT
          id, device_name, device_type, ip_address, location,
          user_agent, is_current, last_activity_at, expires_at, created_at
         FROM sessions
         WHERE user_id = $1 AND expires_at > CURRENT_TIMESTAMP
         ORDER BY last_activity_at DESC`,
        [userId]
      );

      reply.send({ sessions: result.rows });
    } catch (error) {
      fastify.log.error(error);
      reply.status(500).send({ error: 'Failed to fetch sessions' });
    }
  });

  // Revoke a specific session
  fastify.delete('/api/sessions/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = '00000000-0000-0000-0000-000000000001';
      const { id } = request.params as any;

      // Check if trying to delete current session
      const sessionCheck = await pg.query(
        'SELECT is_current FROM sessions WHERE id = $1 AND user_id = $2',
        [id, userId]
      );

      if (sessionCheck.rows.length === 0) {
        return reply.status(404).send({ error: 'Session not found' });
      }

      if (sessionCheck.rows[0].is_current) {
        return reply.status(400).send({ error: 'Cannot revoke current session' });
      }

      await pg.query(
        'DELETE FROM sessions WHERE id = $1 AND user_id = $2',
        [id, userId]
      );

      // Log activity
      await pg.query(
        `INSERT INTO activity_logs (user_id, action, resource_type, resource_id, description)
         VALUES ($1, 'session_revoked', 'session', $2, 'Session revoked')`,
        [userId, id]
      );

      reply.send({ message: 'Session revoked successfully' });
    } catch (error) {
      fastify.log.error(error);
      reply.status(500).send({ error: 'Failed to revoke session' });
    }
  });

  // Revoke all other sessions except current
  fastify.post('/api/sessions/revoke-all', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = '00000000-0000-0000-0000-000000000001';

      const result = await pg.query(
        'DELETE FROM sessions WHERE user_id = $1 AND is_current = false RETURNING id',
        [userId]
      );

      // Log activity
      await pg.query(
        `INSERT INTO activity_logs (user_id, action, resource_type, description)
         VALUES ($1, 'all_sessions_revoked', 'session', 'All other sessions revoked')`,
        [userId]
      );

      reply.send({
        message: `${result.rows.length} session(s) revoked successfully`,
        count: result.rows.length,
      });
    } catch (error) {
      fastify.log.error(error);
      reply.status(500).send({ error: 'Failed to revoke sessions' });
    }
  });

  // Get session activity
  fastify.get('/api/sessions/:id/activity', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = '00000000-0000-0000-0000-000000000001';
      const { id } = request.params as any;

      // Verify session belongs to user
      const sessionCheck = await pg.query(
        'SELECT id FROM sessions WHERE id = $1 AND user_id = $2',
        [id, userId]
      );

      if (sessionCheck.rows.length === 0) {
        return reply.status(404).send({ error: 'Session not found' });
      }

      // Get activity logs for this session
      const result = await pg.query(
        `SELECT * FROM activity_logs
         WHERE user_id = $1
         ORDER BY created_at DESC
         LIMIT 50`,
        [userId]
      );

      reply.send({ activities: result.rows });
    } catch (error) {
      fastify.log.error(error);
      reply.status(500).send({ error: 'Failed to fetch session activity' });
    }
  });
}
