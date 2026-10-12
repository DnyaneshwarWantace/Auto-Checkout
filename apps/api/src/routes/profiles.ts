import type { FastifyPluginAsync } from 'fastify'
import { eq, and } from 'drizzle-orm'
import { CreateProfileSchema, UpdateProfileSchema } from '@aco/shared'
import { profiles } from '@aco/db'
import type { Database } from '@aco/db'

export default function profileRoutes(db: Database): FastifyPluginAsync {
  return async (app) => {
    app.get('/', async (req) => {
      return db
        .select()
        .from(profiles)
        .where(eq(profiles.tenantId, req.tenantId))
    })

    app.get('/:id', async (req, reply) => {
      const { id } = req.params as { id: string }
      const [profile] = await db
        .select()
        .from(profiles)
        .where(and(eq(profiles.id, id), eq(profiles.tenantId, req.tenantId)))
        .limit(1)
      if (!profile) return reply.code(404).send({ error: 'Profile not found' })
      return profile
    })

    app.post('/', async (req, reply) => {
      const body = CreateProfileSchema.parse(req.body)
      const [profile] = await db
        .insert(profiles)
        .values({
          ...body,
          userId: req.userId,
          tenantId: req.tenantId,
          paymentMethodIds: body.paymentMethodIds ?? [],
        })
        .returning()
      return reply.code(201).send(profile)
    })

    app.patch('/:id', async (req, reply) => {
      const { id } = req.params as { id: string }
      const body = UpdateProfileSchema.parse(req.body)
      const [updated] = await db
        .update(profiles)
        .set(body)
        .where(and(eq(profiles.id, id), eq(profiles.tenantId, req.tenantId)))
        .returning()
      if (!updated) return reply.code(404).send({ error: 'Profile not found' })
      return updated
    })

    app.delete('/:id', async (req, reply) => {
      const { id } = req.params as { id: string }
      const [deleted] = await db
        .delete(profiles)
        .where(and(eq(profiles.id, id), eq(profiles.tenantId, req.tenantId)))
        .returning()
      if (!deleted) return reply.code(404).send({ error: 'Profile not found' })
      return reply.code(204).send()
    })
  }
}
