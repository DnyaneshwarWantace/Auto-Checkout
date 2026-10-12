import type { FastifyPluginAsync } from 'fastify'
import { eq, and, desc } from 'drizzle-orm'
import { PaginationSchema } from '@aco/shared'
import { orders } from '@aco/db'
import type { Database } from '@aco/db'

export default function orderRoutes(db: Database): FastifyPluginAsync {
  return async (app) => {
    app.get('/', async (req) => {
      const query = req.query as Record<string, string>
      const { page, limit } = PaginationSchema.parse(query)

      const result = await db
        .select()
        .from(orders)
        .where(eq(orders.tenantId, req.tenantId))
        .orderBy(desc(orders.confirmedAt))
        .limit(limit)
        .offset((page - 1) * limit)

      return { orders: result, page, limit }
    })

    app.get('/:id', async (req, reply) => {
      const { id } = req.params as { id: string }
      const [order] = await db
        .select()
        .from(orders)
        .where(and(eq(orders.id, id), eq(orders.tenantId, req.tenantId)))
        .limit(1)
      if (!order) return reply.code(404).send({ error: 'Order not found' })
      return order
    })
  }
}
