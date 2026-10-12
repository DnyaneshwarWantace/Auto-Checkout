import type { FastifyPluginAsync } from 'fastify'
import { eq, and } from 'drizzle-orm'
import { CreateApiKeySchema } from '@aco/shared'
import { apiKeys } from '@aco/db'
import type { Database } from '@aco/db'

export default function apiKeyRoutes(db: Database): FastifyPluginAsync {
  return async (app) => {
    app.get('/', async (req) => {
      return db
        .select({
          id: apiKeys.id,
          label: apiKeys.label,
          scopes: apiKeys.scopes,
          rateLimit: apiKeys.rateLimit,
          lastUsed: apiKeys.lastUsed,
          createdAt: apiKeys.createdAt,
        })
        .from(apiKeys)
        .where(eq(apiKeys.tenantId, req.tenantId))
    })

    app.post('/', async (req, reply) => {
      const body = CreateApiKeySchema.parse(req.body)
      const rawKey = app.generateApiKey()
      const hashed = app.hashApiKey(rawKey)

      const [key] = await db
        .insert(apiKeys)
        .values({
          tenantId: req.tenantId,
          hashedKey: hashed,
          label: body.label,
          scopes: body.scopes ?? ['checkout:write', 'orders:read'],
          rateLimit: body.rateLimit ?? 60,
        })
        .returning({
          id: apiKeys.id,
          label: apiKeys.label,
          scopes: apiKeys.scopes,
          rateLimit: apiKeys.rateLimit,
          createdAt: apiKeys.createdAt,
        })

      return reply.code(201).send({ ...key, apiKey: rawKey })
    })

    app.delete('/:id', async (req, reply) => {
      const { id } = req.params as { id: string }
      const [deleted] = await db
        .delete(apiKeys)
        .where(and(eq(apiKeys.id, id), eq(apiKeys.tenantId, req.tenantId)))
        .returning()
      if (!deleted) return reply.code(404).send({ error: 'API key not found' })
      return reply.code(204).send()
    })
  }
}
