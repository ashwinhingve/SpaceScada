import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import crypto from 'crypto';

const createApiKeySchema = z.object({
  name: z.string().min(1).max(255),
  scopes: z.array(z.string()).default([]),
  permissions: z.record(z.any()).default({}),
  expiresAt: z.string().datetime().optional(),
});

export default async function apiKeysRoutes(fastify: FastifyInstance) {
  const { pg } = fastify;

  // Get all API keys for current user
  fastify.get('/api/api-keys', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = '00000000-0000-0000-0000-000000000001';

      const result = await pg.query(
        `SELECT
          id, name, key_prefix, scopes, permissions,
          last_used_at, expires_at, is_active, created_at, updated_at
         FROM api_keys
         WHERE user_id = $1
         ORDER BY created_at DESC`,
        [userId]
      );

      reply.send({ apiKeys: result.rows });
    } catch (error: unknown) {
      fastify.log.error(error);
      reply.status(500).send({ error: 'Failed to fetch API keys' });
    }
  });

  // Create new API key
  fastify.post('/api/api-keys', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = '00000000-0000-0000-0000-000000000001';
      const data = createApiKeySchema.parse(request.body);

      // Generate API key
      const apiKey = `wscada_${crypto.randomBytes(32).toString('hex')}`;
      const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');
      const keyPrefix = apiKey.substring(0, 12);

      const result = await pg.query(
        `INSERT INTO api_keys
         (user_id, name, key_hash, key_prefix, scopes, permissions, expires_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id, name, key_prefix, scopes, permissions, expires_at, is_active, created_at`,
        [
          userId,
          data.name,
          keyHash,
          keyPrefix,
          data.scopes,
          JSON.stringify(data.permissions),
          data.expiresAt || null,
        ]
      );

      // Log activity
      await pg.query(
        `INSERT INTO activity_logs (user_id, action, resource_type, resource_id, description)
         VALUES ($1, 'api_key_created', 'api_key', $2, $3)`,
        [userId, result.rows[0].id, `API key "${data.name}" created`]
      );

      reply.status(201).send({
        apiKey: result.rows[0],
        key: apiKey, // Return full key only once
        message: 'API key created successfully. Save this key as it will not be shown again.',
      });
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: error.errors });
      }
      fastify.log.error(error);
      reply.status(500).send({ error: 'Failed to create API key' });
    }
  });

  // Update API key
  fastify.put('/api/api-keys/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = '00000000-0000-0000-0000-000000000001';
      const { id } = request.params as any;
      const { name, scopes, permissions, isActive } = request.body as any;

      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (name) {
        updates.push(`name = $${paramIndex++}`);
        values.push(name);
      }
      if (scopes) {
        updates.push(`scopes = $${paramIndex++}`);
        values.push(scopes);
      }
      if (permissions) {
        updates.push(`permissions = $${paramIndex++}`);
        values.push(JSON.stringify(permissions));
      }
      if (isActive !== undefined) {
        updates.push(`is_active = $${paramIndex++}`);
        values.push(isActive);
      }

      if (updates.length === 0) {
        return reply.status(400).send({ error: 'No fields to update' });
      }

      values.push(id, userId);
      const query = `
        UPDATE api_keys
        SET ${updates.join(', ')}
        WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1}
        RETURNING id, name, key_prefix, scopes, permissions, last_used_at, expires_at, is_active, created_at
      `;

      const result = await pg.query(query, values);

      if (result.rows.length === 0) {
        return reply.status(404).send({ error: 'API key not found' });
      }

      reply.send({ apiKey: result.rows[0], message: 'API key updated successfully' });
    } catch (error: unknown) {
      fastify.log.error(error);
      reply.status(500).send({ error: 'Failed to update API key' });
    }
  });

  // Delete API key
  fastify.delete('/api/api-keys/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = '00000000-0000-0000-0000-000000000001';
      const { id } = request.params as any;

      const result = await pg.query(
        'DELETE FROM api_keys WHERE id = $1 AND user_id = $2 RETURNING name',
        [id, userId]
      );

      if (result.rows.length === 0) {
        return reply.status(404).send({ error: 'API key not found' });
      }

      // Log activity
      await pg.query(
        `INSERT INTO activity_logs (user_id, action, resource_type, resource_id, description)
         VALUES ($1, 'api_key_deleted', 'api_key', $2, $3)`,
        [userId, id, `API key "${result.rows[0].name}" deleted`]
      );

      reply.send({ message: 'API key deleted successfully' });
    } catch (error: unknown) {
      fastify.log.error(error);
      reply.status(500).send({ error: 'Failed to delete API key' });
    }
  });

  // Revoke API key (deactivate without deleting)
  fastify.post('/api/api-keys/:id/revoke', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = '00000000-0000-0000-0000-000000000001';
      const { id } = request.params as any;

      const result = await pg.query(
        `UPDATE api_keys
         SET is_active = false
         WHERE id = $1 AND user_id = $2
         RETURNING id, name`,
        [id, userId]
      );

      if (result.rows.length === 0) {
        return reply.status(404).send({ error: 'API key not found' });
      }

      // Log activity
      await pg.query(
        `INSERT INTO activity_logs (user_id, action, resource_type, resource_id, description)
         VALUES ($1, 'api_key_revoked', 'api_key', $2, $3)`,
        [userId, id, `API key "${result.rows[0].name}" revoked`]
      );

      reply.send({ message: 'API key revoked successfully' });
    } catch (error: unknown) {
      fastify.log.error(error);
      reply.status(500).send({ error: 'Failed to revoke API key' });
    }
  });
}
