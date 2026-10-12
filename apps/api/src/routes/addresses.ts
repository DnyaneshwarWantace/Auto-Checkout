import type { FastifyPluginAsync } from 'fastify'
import { eq, and } from 'drizzle-orm'
import { CreateAddressSchema } from '@aco/shared'
import { addresses } from '@aco/db'
import type { Database } from '@aco/db'

export default function addressRoutes(db: Database): FastifyPluginAsync {
  return async (app) => {
    app.get('/', async (req) => {
      return db
        .select()
        .from(addresses)
        .where(eq(addresses.tenantId, req.tenantId))
    })

    app.post('/', async (req, reply) => {
      const body = CreateAddressSchema.parse(req.body)
      const [address] = await db
        .insert(addresses)
        .values({
          ...body,
          userId: req.userId,
          tenantId: req.tenantId,
        })
        .returning()
      return reply.code(201).send(address)
    })

    app.delete('/:id', async (req, reply) => {
      const { id } = req.params as { id: string }
      const [deleted] = await db
        .delete(addresses)
        .where(and(eq(addresses.id, id), eq(addresses.tenantId, req.tenantId)))
        .returning()
      if (!deleted) return reply.code(404).send({ error: 'Address not found' })
      return reply.code(204).send()
    })
  }
}
