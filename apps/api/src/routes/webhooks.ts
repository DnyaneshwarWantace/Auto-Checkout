import type { FastifyPluginAsync } from 'fastify'
import { eq, and } from 'drizzle-orm'
import { randomBytes } from 'crypto'
import { CreateWebhookSchema } from '@aco/shared'
import { webhooks } from '@aco/db'
import type { Database } from '@aco/db'

export default function webhookRoutes(db: Database): FastifyPluginAsync {
  return async (app) => {
    app.get('/', async (req) => {
      return db.select().from(webhooks).where(eq(webhooks.tenantId, req.tenantId))
    })

    app.post('/', async (req, reply) => {
      const body = CreateWebhookSchema.parse(req.body)
      const secret = randomBytes(32).toString('hex')

      const [webhook] = await db
        .insert(webhooks)
        .values({
          tenantId: req.tenantId,
          url: body.url,
          events: body.events,
          secret,
        })
        .returning()

      return reply.code(201).send({ ...webhook, secret })
    })

    app.delete('/:id', async (req, reply) => {
      const { id } = req.params as { id: string }
      const [deleted] = await db
        .delete(webhooks)
        .where(and(eq(webhooks.id, id), eq(webhooks.tenantId, req.tenantId)))
        .returning()
      if (!deleted) return reply.code(404).send({ error: 'Webhook not found' })
      return reply.code(204).send()
    })
  }
}
