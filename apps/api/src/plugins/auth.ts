import fp from 'fastify-plugin'
import { createHash, randomBytes } from 'crypto'
import bcrypt from 'bcryptjs'
import { authenticator } from 'otplib'
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'

declare module 'fastify' {
  interface FastifyRequest {
    tenantId: string
    userId: string
    userRole: string
  }
  interface FastifyInstance {
    hashPassword: (pw: string) => Promise<string>
    checkPassword: (pw: string, hash: string) => Promise<boolean>
    generateApiKey: () => string
    hashApiKey: (k: string) => string
    generateTotp: () => string
    verifyTotp: (token: string, secret: string) => boolean
  }
}

export default fp(async function authPlugin(app: FastifyInstance) {
  app.decorateRequest('tenantId', '')
  app.decorateRequest('userId', '')
  app.decorateRequest('userRole', '')

  app.addHook('preHandler', async (req: FastifyRequest, reply: FastifyReply) => {
    if (req.url.startsWith('/v1/auth/')) return

    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) {
      return reply.code(401).send({ error: 'Missing authorization header' })
    }

    const token = authHeader.slice(7)

    if (token.startsWith('aco_')) {
      const hashed = createHash('sha256').update(token).digest('hex')
      const { createDb } = await import('@aco/db')
      const db = createDb(process.env.DATABASE_URL!)
      const { apiKeys } = await import('@aco/db')
      const { eq } = await import('drizzle-orm')
      const keys = await db.select().from(apiKeys).where(eq(apiKeys.hashedKey, hashed)).limit(1)
      if (keys.length === 0) return reply.code(401).send({ error: 'Invalid API key' })
      req.tenantId = keys[0].tenantId
      req.userId = 'api'
      req.userRole = 'api'
      return
    }

    try {
      const payload = await (app as any).jwt.verify(token)
      req.tenantId = payload.tenantId
      req.userId = payload.sub
      req.userRole = payload.role
    } catch {
      return reply.code(401).send({ error: 'Invalid token' })
    }
  })

  app.decorate('hashPassword', (pw: string) => bcrypt.hash(pw, 12))
  app.decorate('checkPassword', (pw: string, hash: string) => bcrypt.compare(pw, hash))
  app.decorate('generateApiKey', () => `aco_${randomBytes(32).toString('hex')}`)
  app.decorate('hashApiKey', (k: string) => createHash('sha256').update(k).digest('hex'))
  app.decorate('generateTotp', () => authenticator.generateSecret())
  app.decorate('verifyTotp', (token: string, secret: string) =>
    authenticator.verify({ token, secret }),
  )
})
