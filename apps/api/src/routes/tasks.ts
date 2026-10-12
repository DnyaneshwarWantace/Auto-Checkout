import type { FastifyPluginAsync } from 'fastify'
import { eq, and, desc } from 'drizzle-orm'
import { CreateTaskSchema, PaginationSchema } from '@aco/shared'
import { checkoutTasks, checkoutEvents } from '@aco/db'
import type { Database } from '@aco/db'

export default function taskRoutes(db: Database): FastifyPluginAsync {
  return async (app) => {
    app.post('/', async (req, reply) => {
      const body = CreateTaskSchema.parse(req.body)

      const [task] = await db
        .insert(checkoutTasks)
        .values({
          tenantId: req.tenantId,
          userId: req.userId,
          profileId: body.profileId,
          retailer: body.retailer,
          items: body.items,
        })
        .returning()

      return reply.code(201).send(task)
    })

    app.get('/', async (req) => {
      const query = req.query as Record<string, string>
      const { page, limit } = PaginationSchema.parse(query)

      const tasks = await db
        .select()
        .from(checkoutTasks)
        .where(eq(checkoutTasks.tenantId, req.tenantId))
        .orderBy(desc(checkoutTasks.createdAt))
        .limit(limit)
        .offset((page - 1) * limit)

      return { tasks, page, limit }
    })

    app.get('/:id', async (req, reply) => {
      const { id } = req.params as { id: string }

      const [task] = await db
        .select()
        .from(checkoutTasks)
        .where(and(eq(checkoutTasks.id, id), eq(checkoutTasks.tenantId, req.tenantId)))
        .limit(1)

      if (!task) return reply.code(404).send({ error: 'Task not found' })

      const events = await db
        .select()
        .from(checkoutEvents)
        .where(eq(checkoutEvents.taskId, id))
        .orderBy(checkoutEvents.ts)

      return { ...task, events }
    })

    app.delete('/:id', async (req, reply) => {
      const { id } = req.params as { id: string }

      const [task] = await db
        .select()
        .from(checkoutTasks)
        .where(and(eq(checkoutTasks.id, id), eq(checkoutTasks.tenantId, req.tenantId)))
        .limit(1)

      if (!task) return reply.code(404).send({ error: 'Task not found' })
      if (task.state !== 'QUEUED' && task.state !== 'PROCESSING') {
        return reply.code(400).send({ error: 'Can only cancel QUEUED or PROCESSING tasks' })
      }

      const [updated] = await db
        .update(checkoutTasks)
        .set({ state: 'CANCELLED', completedAt: new Date() })
        .where(eq(checkoutTasks.id, id))
        .returning()

      return updated
    })
  }
}
