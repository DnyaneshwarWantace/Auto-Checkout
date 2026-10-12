import type { FastifyPluginAsync } from 'fastify'
import { eq, and } from 'drizzle-orm'
import { RegisterSchema, LoginSchema } from '@aco/shared'
import { users, tenants } from '@aco/db'
import type { Database } from '@aco/db'

export default function authRoutes(db: Database): FastifyPluginAsync {
  return async (app) => {
    app.post('/register', async (req, reply) => {
      const body = RegisterSchema.parse(req.body)
      const hashedPw = await app.hashPassword(body.password)

      const [tenant] = await db
        .insert(tenants)
        .values({
          name: body.email.split('@')[0],
          slug: `t-${Date.now()}`,
        })
        .returning()

      const [user] = await db
        .insert(users)
        .values({
          tenantId: tenant.id,
          email: body.email,
          passwordHash: hashedPw,
        })
        .returning({ id: users.id, email: users.email, role: users.role })

      const token = await (app as any).jwt.sign(
        { sub: user.id, tenantId: tenant.id, role: user.role },
        { expiresIn: '7d' },
      )

      return reply.code(201).send({ user, token })
    })

    app.post('/login', async (req, reply) => {
      const body = LoginSchema.parse(req.body)

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, body.email))
        .limit(1)

      if (!user) return reply.code(401).send({ error: 'Invalid credentials' })

      const valid = await app.checkPassword(body.password, user.passwordHash)
      if (!valid) return reply.code(401).send({ error: 'Invalid credentials' })

      if (user.totpEnabled) {
        if (!body.totpCode) return reply.code(401).send({ error: '2FA code required' })
        if (!app.verifyTotp(body.totpCode, user.totpSecret!))
          return reply.code(401).send({ error: 'Invalid 2FA code' })
      }

      const token = await (app as any).jwt.sign(
        { sub: user.id, tenantId: user.tenantId, role: user.role },
        { expiresIn: '7d' },
      )

      return { token, userId: user.id, tenantId: user.tenantId }
    })
  }
}
