import { z } from 'zod'
import { RETAILERS } from './enums.js'

export const CartItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  quantity: z.number().int().positive(),
  options: z.record(z.string()).optional(),
})

export const CreateTaskSchema = z.object({
  profileId: z.string().uuid(),
  retailer: z.enum(RETAILERS),
  items: z.array(CartItemSchema).min(1),
})

export const CreateProfileSchema = z.object({
  name: z.string().min(1).max(100),
  addressId: z.string().uuid().optional(),
  paymentMethodIds: z.array(z.string().uuid()).optional(),
  proxyId: z.string().uuid().optional(),
  phone: z.string().min(10).max(15).optional(),
  notes: z.string().max(500).optional(),
})

export const UpdateProfileSchema = CreateProfileSchema.partial()

export const CreateAddressSchema = z.object({
  label: z.string().max(50).optional(),
  line1: z.string().min(1).max(200),
  line2: z.string().max(200).optional(),
  city: z.string().min(1).max(100),
  state: z.string().min(2).max(2),
  zip: z.string().min(5).max(10),
  country: z.string().default('US'),
  phone: z.string().min(10).max(15).optional(),
})

export const CreatePaymentMethodSchema = z.object({
  pan: z.string().min(13).max(19),
  cvv: z.string().min(3).max(4),
  expMonth: z.number().int().min(1).max(12),
  expYear: z.number().int().min(2024).max(2040),
  billingZip: z.string().optional(),
  billingName: z.string().optional(),
})

export const CreateProxySchema = z.object({
  label: z.string().max(100).optional(),
  raw: z.string().min(1),
})

export const BulkProxySchema = z.object({
  proxies: z.string().min(1),
})

export const CreateWebhookSchema = z.object({
  url: z.string().url(),
  events: z
    .array(
      z.enum([
        'task.queued',
        'task.state_changed',
        'task.completed',
        'task.failed',
        'order.confirmed',
        'payment.declined',
        'verification.required',
      ]),
    )
    .min(1),
})

export const CreateApiKeySchema = z.object({
  label: z.string().max(100).optional(),
  scopes: z
    .array(z.enum(['checkout:write', 'checkout:read', 'orders:read', 'profiles:write', 'admin']))
    .optional(),
  rateLimit: z.number().int().min(1).max(1000).optional(),
})

export const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
})

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
  totpCode: z.string().length(6).optional(),
})

export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})
