import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';

// Validation schemas
const widgetLayoutSchema = z.object({
  x: z.number().int().min(0),
  y: z.number().int().min(0),
  w: z.number().int().min(1).max(12),
  h: z.number().int().min(1).max(12),
  minW: z.number().int().min(1).max(12).optional(),
  minH: z.number().int().min(1).max(12).optional(),
  maxW: z.number().int().min(1).max(12).optional(),
  maxH: z.number().int().min(1).max(12).optional(),
});

const createWidgetSchema = z.object({
  widgetKey: z.string().min(1).max(100),
  widgetType: z.enum([
    'lorawan_device',
    'gsm_device',
    'wifi_device',
    'bluetooth_device',
    'realtime_chart',
    'gauge',
    'device_list',
    'status_summary',
    'map',
  ]),
  layout: widgetLayoutSchema,
  config: z.record(z.any()),
  title: z.string().max(255).optional(),
  showHeader: z.boolean().optional().default(true),
  refreshInterval: z.number().int().min(1000).max(300000).optional().default(5000),
  visible: z.boolean().optional().default(true),
});

const updateWidgetSchema = z.object({
  layout: widgetLayoutSchema.partial().optional(),
  config: z.record(z.any()).optional(),
  title: z.string().max(255).optional(),
  showHeader: z.boolean().optional(),
  refreshInterval: z.number().int().min(1000).max(300000).optional(),
  visible: z.boolean().optional(),
});

export default async function widgetsRoutes(fastify: FastifyInstance) {
  const { pg } = fastify;

  // Get all widgets for current user
  fastify.get('/api/widgets', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = '00000000-0000-0000-0000-000000000001';

      const result = await pg.query(
        `SELECT * FROM dashboard_widgets WHERE user_id = $1 AND visible = true ORDER BY layout_y, layout_x`,
        [userId]
      );

      const widgets = result.rows.map((row: any) => ({
        id: row.id,
        userId: row.user_id,
        widgetKey: row.widget_key,
        widgetType: row.widget_type,
        layout: {
          x: row.layout_x,
          y: row.layout_y,
          w: row.layout_w,
          h: row.layout_h,
          minW: row.layout_min_w,
          minH: row.layout_min_h,
          maxW: row.layout_max_w,
          maxH: row.layout_max_h,
        },
        config: row.config,
        title: row.title,
        showHeader: row.show_header,
        refreshInterval: row.refresh_interval,
        visible: row.visible,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));

      return reply.send(widgets);
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to fetch widgets' });
    }
  });

  // Create new widget
  fastify.post('/api/widgets', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = '00000000-0000-0000-0000-000000000001';
      const validated = createWidgetSchema.parse(request.body);

      const result = await pg.query(
        `INSERT INTO dashboard_widgets (
          user_id, widget_key, widget_type, layout_x, layout_y, layout_w, layout_h,
          layout_min_w, layout_min_h, layout_max_w, layout_max_h, config, title, show_header, refresh_interval, visible
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) RETURNING *`,
        [
          userId, validated.widgetKey, validated.widgetType, validated.layout.x, validated.layout.y,
          validated.layout.w, validated.layout.h, validated.layout.minW, validated.layout.minH,
          validated.layout.maxW, validated.layout.maxH, JSON.stringify(validated.config),
          validated.title, validated.showHeader, validated.refreshInterval, validated.visible,
        ]
      );

      const row = result.rows[0];
      return reply.status(201).send({
        id: row.id,
        userId: row.user_id,
        widgetKey: row.widget_key,
        widgetType: row.widget_type,
        layout: { x: row.layout_x, y: row.layout_y, w: row.layout_w, h: row.layout_h },
        config: row.config,
        title: row.title,
        showHeader: row.show_header,
        refreshInterval: row.refresh_interval,
        visible: row.visible,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      });
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Validation error', details: error.errors });
      }
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to create widget' });
    }
  });

  // Update widget
  fastify.put('/api/widgets/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      const userId = '00000000-0000-0000-0000-000000000001';
      const validated = updateWidgetSchema.parse(request.body);

      const updates: string[] = [];
      const values: any[] = [id, userId];
      let paramIndex = 3;

      if (validated.layout) {
        if (validated.layout.x !== undefined) { updates.push(`layout_x = $${paramIndex++}`); values.push(validated.layout.x); }
        if (validated.layout.y !== undefined) { updates.push(`layout_y = $${paramIndex++}`); values.push(validated.layout.y); }
        if (validated.layout.w !== undefined) { updates.push(`layout_w = $${paramIndex++}`); values.push(validated.layout.w); }
        if (validated.layout.h !== undefined) { updates.push(`layout_h = $${paramIndex++}`); values.push(validated.layout.h); }
      }
      if (validated.config !== undefined) { updates.push(`config = $${paramIndex++}`); values.push(JSON.stringify(validated.config)); }
      if (validated.title !== undefined) { updates.push(`title = $${paramIndex++}`); values.push(validated.title); }
      if (validated.showHeader !== undefined) { updates.push(`show_header = $${paramIndex++}`); values.push(validated.showHeader); }
      if (validated.refreshInterval !== undefined) { updates.push(`refresh_interval = $${paramIndex++}`); values.push(validated.refreshInterval); }
      if (validated.visible !== undefined) { updates.push(`visible = $${paramIndex++}`); values.push(validated.visible); }

      if (updates.length === 0) return reply.status(400).send({ error: 'No fields to update' });

      updates.push(`updated_at = CURRENT_TIMESTAMP`);

      const result = await pg.query(
        `UPDATE dashboard_widgets SET ${updates.join(', ')} WHERE id = $1 AND user_id = $2 RETURNING *`,
        values
      );

      if (result.rows.length === 0) return reply.status(404).send({ error: 'Widget not found' });

      const row = result.rows[0];
      return reply.send({
        id: row.id,
        userId: row.user_id,
        widgetKey: row.widget_key,
        widgetType: row.widget_type,
        layout: { x: row.layout_x, y: row.layout_y, w: row.layout_w, h: row.layout_h },
        config: row.config,
        title: row.title,
        showHeader: row.show_header,
        refreshInterval: row.refresh_interval,
        visible: row.visible,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      });
    } catch (error: unknown) {
      if (error instanceof z.ZodError) return reply.status(400).send({ error: 'Validation error', details: error.errors });
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to update widget' });
    }
  });

  // Delete widget
  fastify.delete('/api/widgets/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      const userId = '00000000-0000-0000-0000-000000000001';

      const result = await pg.query('DELETE FROM dashboard_widgets WHERE id = $1 AND user_id = $2 RETURNING id', [id, userId]);
      if (result.rows.length === 0) return reply.status(404).send({ error: 'Widget not found' });

      return reply.send({ success: true, id });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to delete widget' });
    }
  });

  // Batch update layouts
  fastify.post('/api/widgets/batch-update-layout', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = '00000000-0000-0000-0000-000000000001';
      const updates = request.body as Array<{widgetId: string; layout: {x?: number; y?: number; w?: number; h?: number}}>;

      const client = await pg.connect();
      try {
        await client.query('BEGIN');
        for (const update of updates) {
          const fields: string[] = [];
          const values: any[] = [update.widgetId, userId];
          let i = 3;
          if (update.layout.x !== undefined) { fields.push(`layout_x = $${i++}`); values.push(update.layout.x); }
          if (update.layout.y !== undefined) { fields.push(`layout_y = $${i++}`); values.push(update.layout.y); }
          if (update.layout.w !== undefined) { fields.push(`layout_w = $${i++}`); values.push(update.layout.w); }
          if (update.layout.h !== undefined) { fields.push(`layout_h = $${i++}`); values.push(update.layout.h); }
          if (fields.length > 0) {
            fields.push(`updated_at = CURRENT_TIMESTAMP`);
            await client.query(`UPDATE dashboard_widgets SET ${fields.join(', ')} WHERE id = $1 AND user_id = $2`, values);
          }
        }
        await client.query('COMMIT');
        return reply.send({ success: true, updated: updates.length });
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to batch update layouts' });
    }
  });
}
