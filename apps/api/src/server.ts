import Fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import rateLimit from '@fastify/rate-limit'
import { createDb } from '@aco/db'
import authPlugin from './plugins/auth.js'
import authRoutes from './routes/auth.js'
import profileRoutes from './routes/profiles.js'
import addressRoutes from './routes/addresses.js'
import paymentMethodRoutes from './routes/payment-methods.js'
import proxyRoutes from './routes/proxies.js'
import taskRoutes from './routes/tasks.js'
import orderRoutes from './routes/orders.js'
import webhookRoutes from './routes/webhooks.js'
import apiKeyRoutes from './routes/api-keys.js'

export async function buildApp() {
  const app = Fastify({
    logger: {
      level: process.env.LOG_LEVEL ?? 'info',
      transport:
        process.env.NODE_ENV === 'development'
          ? { target: 'pino-pretty', options: { colorize: true } }
          : undefined,
    },
    requestIdLogLabel: 'requestId',
    genReqId: () => `req_${Date.now().toString(36)}`,
  })

  await app.register(cors, { origin: true })

  await app.register(jwt, {
    secret: process.env.JWT_SECRET!,
  })

  await app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
  })

  await app.register(authPlugin)

  const db = createDb(process.env.DATABASE_URL!)

  await app.register(authRoutes(db), { prefix: '/v1/auth' })
  await app.register(profileRoutes(db), { prefix: '/v1/profiles' })
  await app.register(addressRoutes(db), { prefix: '/v1/addresses' })
  await app.register(paymentMethodRoutes(db), { prefix: '/v1/payment-methods' })
  await app.register(proxyRoutes(db), { prefix: '/v1/proxies' })
  await app.register(taskRoutes(db), { prefix: '/v1/tasks' })
  await app.register(orderRoutes(db), { prefix: '/v1/orders' })
  await app.register(webhookRoutes(db), { prefix: '/v1/webhooks' })
  await app.register(apiKeyRoutes(db), { prefix: '/v1/api-keys' })

  app.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }))

  return app
}
