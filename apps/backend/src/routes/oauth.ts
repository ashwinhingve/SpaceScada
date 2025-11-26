import crypto from 'crypto';

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';

const createOAuthClientSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  redirectUris: z.array(z.string().url()).min(1),
  allowedScopes: z.array(z.string()).default(['read']),
  isConfidential: z.boolean().default(true),
  logoUrl: z.string().url().optional(),
  websiteUrl: z.string().url().optional(),
  privacyPolicyUrl: z.string().url().optional(),
  termsOfServiceUrl: z.string().url().optional(),
});

export default async function oauthRoutes(fastify: FastifyInstance) {
  const { pg } = fastify;

  // ============ OAuth Clients ============

  // Get all OAuth clients for current user
  fastify.get('/api/oauth/clients', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = '00000000-0000-0000-0000-000000000001';

      const result = await pg.query(
        `SELECT
          id, name, description, client_id, redirect_uris, allowed_scopes,
          is_confidential, is_active, logo_url, website_url,
          privacy_policy_url, terms_of_service_url, created_at, updated_at
         FROM oauth_clients
         WHERE user_id = $1
         ORDER BY created_at DESC`,
        [userId]
      );

      reply.send({ clients: result.rows });
    } catch (error) {
      fastify.log.error(error);
      reply.status(500).send({ error: 'Failed to fetch OAuth clients' });
    }
  });

  // Create new OAuth client
  fastify.post('/api/oauth/clients', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = '00000000-0000-0000-0000-000000000001';
      const data = createOAuthClientSchema.parse(request.body);

      // Generate client ID and secret
      const clientId = `wscada_client_${crypto.randomBytes(16).toString('hex')}`;
      const clientSecret = `wscada_secret_${crypto.randomBytes(32).toString('hex')}`;
      const clientSecretHash = crypto.createHash('sha256').update(clientSecret).digest('hex');

      const result = await pg.query(
        `INSERT INTO oauth_clients
         (user_id, name, description, client_id, client_secret_hash, redirect_uris,
          allowed_scopes, is_confidential, logo_url, website_url,
          privacy_policy_url, terms_of_service_url)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         RETURNING id, name, description, client_id, redirect_uris, allowed_scopes,
                   is_confidential, logo_url, website_url, created_at`,
        [
          userId,
          data.name,
          data.description || null,
          clientId,
          clientSecretHash,
          data.redirectUris,
          data.allowedScopes,
          data.isConfidential,
          data.logoUrl || null,
          data.websiteUrl || null,
          data.privacyPolicyUrl || null,
          data.termsOfServiceUrl || null,
        ]
      );

      // Log activity
      await pg.query(
        `INSERT INTO activity_logs (user_id, action, resource_type, resource_id, description)
         VALUES ($1, 'oauth_client_created', 'oauth_client', $2, $3)`,
        [userId, result.rows[0].id, `OAuth client "${data.name}" created`]
      );

      reply.status(201).send({
        client: result.rows[0],
        clientSecret: clientSecret, // Return secret only once
        message:
          'OAuth client created successfully. Save the client secret as it will not be shown again.',
      });
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: error.errors });
      }
      fastify.log.error(error);
      reply.status(500).send({ error: 'Failed to create OAuth client' });
    }
  });

  // Update OAuth client
  fastify.put('/api/oauth/clients/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = '00000000-0000-0000-0000-000000000001';
      const { id } = request.params as any;
      const data = request.body as any;

      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (data.name) {
        updates.push(`name = $${paramIndex++}`);
        values.push(data.name);
      }
      if (data.description !== undefined) {
        updates.push(`description = $${paramIndex++}`);
        values.push(data.description);
      }
      if (data.redirectUris) {
        updates.push(`redirect_uris = $${paramIndex++}`);
        values.push(data.redirectUris);
      }
      if (data.allowedScopes) {
        updates.push(`allowed_scopes = $${paramIndex++}`);
        values.push(data.allowedScopes);
      }
      if (data.isActive !== undefined) {
        updates.push(`is_active = $${paramIndex++}`);
        values.push(data.isActive);
      }
      if (data.logoUrl !== undefined) {
        updates.push(`logo_url = $${paramIndex++}`);
        values.push(data.logoUrl);
      }
      if (data.websiteUrl !== undefined) {
        updates.push(`website_url = $${paramIndex++}`);
        values.push(data.websiteUrl);
      }

      if (updates.length === 0) {
        return reply.status(400).send({ error: 'No fields to update' });
      }

      values.push(id, userId);
      const query = `
        UPDATE oauth_clients
        SET ${updates.join(', ')}
        WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1}
        RETURNING id, name, description, client_id, redirect_uris,
                  allowed_scopes, is_active, logo_url, website_url
      `;

      const result = await pg.query(query, values);

      if (result.rows.length === 0) {
        return reply.status(404).send({ error: 'OAuth client not found' });
      }

      reply.send({ client: result.rows[0], message: 'OAuth client updated successfully' });
    } catch (error) {
      fastify.log.error(error);
      reply.status(500).send({ error: 'Failed to update OAuth client' });
    }
  });

  // Delete OAuth client
  fastify.delete('/api/oauth/clients/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = '00000000-0000-0000-0000-000000000001';
      const { id } = request.params as any;

      const result = await pg.query(
        'DELETE FROM oauth_clients WHERE id = $1 AND user_id = $2 RETURNING name',
        [id, userId]
      );

      if (result.rows.length === 0) {
        return reply.status(404).send({ error: 'OAuth client not found' });
      }

      reply.send({ message: 'OAuth client deleted successfully' });
    } catch (error) {
      fastify.log.error(error);
      reply.status(500).send({ error: 'Failed to delete OAuth client' });
    }
  });

  // ============ OAuth Authorizations ============

  // Get all authorizations for current user
  fastify.get('/api/oauth/authorizations', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = '00000000-0000-0000-0000-000000000001';

      const result = await pg.query(
        `SELECT
          a.id, a.scopes, a.authorized_at, a.last_used_at, a.expires_at, a.is_active,
          c.id as client_id, c.name as client_name, c.description as client_description,
          c.logo_url, c.website_url
         FROM oauth_authorizations a
         JOIN oauth_clients c ON a.client_id = c.id
         WHERE a.user_id = $1
         ORDER BY a.authorized_at DESC`,
        [userId]
      );

      reply.send({ authorizations: result.rows });
    } catch (error) {
      fastify.log.error(error);
      reply.status(500).send({ error: 'Failed to fetch authorizations' });
    }
  });

  // Revoke authorization
  fastify.delete(
    '/api/oauth/authorizations/:id',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const userId = '00000000-0000-0000-0000-000000000001';
        const { id } = request.params as any;

        const result = await pg.query(
          'DELETE FROM oauth_authorizations WHERE id = $1 AND user_id = $2 RETURNING id',
          [id, userId]
        );

        if (result.rows.length === 0) {
          return reply.status(404).send({ error: 'Authorization not found' });
        }

        // Log activity
        await pg.query(
          `INSERT INTO activity_logs (user_id, action, resource_type, resource_id, description)
         VALUES ($1, 'oauth_authorization_revoked', 'oauth_authorization', $2, 'Authorization revoked')`,
          [userId, id]
        );

        reply.send({ message: 'Authorization revoked successfully' });
      } catch (error) {
        fastify.log.error(error);
        reply.status(500).send({ error: 'Failed to revoke authorization' });
      }
    }
  );
}
