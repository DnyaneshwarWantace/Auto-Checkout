import type { FastifyPluginAsync } from 'fastify'
import { eq, and } from 'drizzle-orm'
import { proxies } from '@aco/db'
import type { Database } from '@aco/db'

function parseProxy(raw: string) {
  const normalised = raw.trim()
  const withProto = normalised.includes('://') ? normalised : `http://${normalised}`

  try {
    const url = new URL(withProto)
    return {
      host: url.hostname,
      port: parseInt(url.port),
      username: url.username || undefined,
      password: url.password || undefined,
      protocol: (url.protocol.replace(':', '') || 'http') as 'http' | 'https' | 'socks5',
    }
  } catch {
    const [host, portStr, username, password] = raw.split(':')
    return {
      host,
      port: parseInt(portStr),
      username,
      password,
      protocol: 'http' as const,
    }
  }
}

export default function proxyRoutes(db: Database): FastifyPluginAsync {
  return async (app) => {
    app.get('/', async (req) => {
      return db.select().from(proxies).where(eq(proxies.tenantId, req.tenantId))
    })

    app.post('/', async (req, reply) => {
      const { label, raw } = req.body as { label?: string; raw: string }
      const parsed = parseProxy(raw)
      const [proxy] = await db
        .insert(proxies)
        .values({
          tenantId: req.tenantId,
          label,
          ...parsed,
        })
        .returning()
      return reply.code(201).send(proxy)
    })

    app.post('/bulk', async (req, reply) => {
      const body = req.body as string
      const lines = body
        .trim()
        .split('\n')
        .filter((l) => l.trim())
      const results = []

      for (const line of lines) {
        const parsed = parseProxy(line)
        const [proxy] = await db
          .insert(proxies)
          .values({
            tenantId: req.tenantId,
            ...parsed,
          })
          .returning()
        results.push(proxy)
      }

      return reply.code(201).send({ imported: results.length, proxies: results })
    })

    app.delete('/:id', async (req, reply) => {
      const { id } = req.params as { id: string }
      const [deleted] = await db
        .delete(proxies)
        .where(and(eq(proxies.id, id), eq(proxies.tenantId, req.tenantId)))
        .returning()
      if (!deleted) return reply.code(404).send({ error: 'Proxy not found' })
      return reply.code(204).send()
    })
  }
}
