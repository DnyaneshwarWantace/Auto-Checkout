import type { FastifyPluginAsync } from 'fastify'
import { eq, and } from 'drizzle-orm'
import { createCipheriv, randomBytes } from 'crypto'
import { CreatePaymentMethodSchema } from '@aco/shared'
import { paymentMethods } from '@aco/db'
import type { Database } from '@aco/db'

function encryptField(plaintext: string): string {
  const key = Buffer.from(process.env.CARD_ENCRYPTION_KEY!, 'hex')
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', key, iv)
  const enc = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()
  return [iv.toString('hex'), enc.toString('hex'), authTag.toString('hex')].join(':')
}

function detectBrand(pan: string): string {
  if (pan.startsWith('4')) return 'visa'
  if (/^5[1-5]/.test(pan) || /^2[2-7]/.test(pan)) return 'mastercard'
  if (pan.startsWith('34') || pan.startsWith('37')) return 'amex'
  if (pan.startsWith('6011') || pan.startsWith('65')) return 'discover'
  return 'unknown'
}

export default function paymentMethodRoutes(db: Database): FastifyPluginAsync {
  return async (app) => {
    app.get('/', async (req) => {
      const methods = await db
        .select({
          id: paymentMethods.id,
          last4: paymentMethods.last4,
          expMonth: paymentMethods.expMonth,
          expYear: paymentMethods.expYear,
          brand: paymentMethods.brand,
          billingZip: paymentMethods.billingZip,
          billingName: paymentMethods.billingName,
          status: paymentMethods.status,
          attemptCount: paymentMethods.attemptCount,
          declineCount: paymentMethods.declineCount,
          createdAt: paymentMethods.createdAt,
        })
        .from(paymentMethods)
        .where(eq(paymentMethods.tenantId, req.tenantId))
      return methods
    })

    app.post('/', async (req, reply) => {
      const body = CreatePaymentMethodSchema.parse(req.body)
      const [method] = await db
        .insert(paymentMethods)
        .values({
          userId: req.userId,
          tenantId: req.tenantId,
          encryptedPan: encryptField(body.pan),
          encryptedCvv: encryptField(body.cvv),
          last4: body.pan.slice(-4),
          expMonth: body.expMonth,
          expYear: body.expYear,
          brand: detectBrand(body.pan),
          billingZip: body.billingZip,
          billingName: body.billingName,
        })
        .returning({
          id: paymentMethods.id,
          last4: paymentMethods.last4,
          brand: paymentMethods.brand,
          expMonth: paymentMethods.expMonth,
          expYear: paymentMethods.expYear,
          status: paymentMethods.status,
        })
      return reply.code(201).send(method)
    })

    app.post('/bulk', async (req, reply) => {
      const csvBody = req.body as string
      const lines = csvBody.trim().split('\n')
      const results: Array<{ last4: string; brand: string; status: string }> = []

      for (const line of lines) {
        const [pan, expMonthStr, expYearStr, cvv, billingZip, billingName] = line
          .split(',')
          .map((s) => s.trim())

        if (!pan || !expMonthStr || !expYearStr || !cvv) continue

        const [method] = await db
          .insert(paymentMethods)
          .values({
            userId: req.userId,
            tenantId: req.tenantId,
            encryptedPan: encryptField(pan),
            encryptedCvv: encryptField(cvv),
            last4: pan.slice(-4),
            expMonth: parseInt(expMonthStr),
            expYear: parseInt(expYearStr),
            brand: detectBrand(pan),
            billingZip: billingZip || null,
            billingName: billingName || null,
          })
          .returning({
            last4: paymentMethods.last4,
            brand: paymentMethods.brand,
            status: paymentMethods.status,
          })
        results.push(method)
      }

      return reply.code(201).send({ imported: results.length, cards: results })
    })

    app.delete('/:id', async (req, reply) => {
      const { id } = req.params as { id: string }
      const [deleted] = await db
        .delete(paymentMethods)
        .where(and(eq(paymentMethods.id, id), eq(paymentMethods.tenantId, req.tenantId)))
        .returning()
      if (!deleted) return reply.code(404).send({ error: 'Payment method not found' })
      return reply.code(204).send()
    })
  }
}
