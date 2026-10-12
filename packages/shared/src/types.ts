import type { TaskState, PaymentStatus, ProxyProtocol, UserRole, Retailer } from './enums.js'

export interface Tenant {
  id: string
  name: string
  slug: string
  resellerId: string | null
  plan: string
  billingStatus: string
  stripeCustomerId: string | null
  usageLimits: UsageLimits
  brandingConfig: Record<string, unknown>
  allowedRetailers: Retailer[]
  createdAt: Date
}

export interface UsageLimits {
  dailyTasks: number
  monthlyTasks: number
  concurrentWorkers: number
}

export interface User {
  id: string
  tenantId: string
  email: string
  passwordHash: string
  role: UserRole
  totpSecret: string | null
  totpEnabled: boolean
  createdAt: Date
}

export interface Address {
  id: string
  userId: string
  tenantId: string
  label: string | null
  line1: string
  line2: string | null
  city: string
  state: string
  zip: string
  country: string
  phone: string | null
}

export interface PaymentMethod {
  id: string
  userId: string
  tenantId: string
  encryptedPan: string
  encryptedCvv: string
  last4: string
  expMonth: number
  expYear: number
  brand: string
  billingZip: string | null
  billingName: string | null
  status: PaymentStatus
  attemptCount: number
  declineCount: number
  createdAt: Date
}

export interface ProxyRecord {
  id: string
  tenantId: string
  label: string | null
  host: string
  port: number
  username: string | null
  password: string | null
  protocol: ProxyProtocol
  isHealthy: boolean
  latencyMs: number | null
  lastChecked: Date | null
  assignedTo: string | null
}

export interface Profile {
  id: string
  userId: string
  tenantId: string
  name: string
  addressId: string | null
  paymentMethodIds: string[]
  proxyId: string | null
  phone: string | null
  notes: string | null
}

export interface CheckoutTask {
  id: string
  tenantId: string
  userId: string
  profileId: string
  retailer: Retailer
  items: CartItem[]
  state: TaskState
  workerId: string | null
  retryCount: number
  metadata: Record<string, unknown>
  createdAt: Date
  startedAt: Date | null
  completedAt: Date | null
}

export interface CartItem {
  id: string
  name: string
  quantity: number
  options?: Record<string, string>
}

export interface CheckoutEvent {
  id: string
  taskId: string
  state: string
  detail: Record<string, unknown>
  ts: Date
}

export interface Order {
  id: string
  taskId: string
  tenantId: string
  retailer: Retailer
  retailerOrderId: string | null
  items: CartItem[] | null
  totalCents: number | null
  status: string
  confirmedAt: Date | null
}

export interface ApiKey {
  id: string
  tenantId: string
  hashedKey: string
  label: string | null
  scopes: string[]
  rateLimit: number
  lastUsed: Date | null
  createdAt: Date
}

export interface Webhook {
  id: string
  tenantId: string
  url: string
  events: string[]
  secret: string
  isActive: boolean
  createdAt: Date
}

export interface CheckoutResult {
  success: boolean
  orderId?: string
  totalCents?: number
  failureReason?:
    | 'PAYMENT_DECLINED'
    | 'OUT_OF_STOCK'
    | 'ITEM_UNAVAILABLE'
    | 'SESSION_EXPIRED'
    | 'RATE_LIMITED'
    | 'UNKNOWN'
  requiresVerification?: 'CAPTCHA' | 'PAYMENT_3DS' | 'OTP'
}
