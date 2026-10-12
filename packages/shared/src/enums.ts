export const TaskState = {
  QUEUED: 'QUEUED',
  CHECKOUT_STARTED: 'CHECKOUT_STARTED',
  CART_BUILDING: 'CART_BUILDING',
  PROCESSING: 'PROCESSING',
  VERIFICATION_REQUIRED: 'VERIFICATION_REQUIRED',
  AUTOMATED_VERIFICATION: 'AUTOMATED_VERIFICATION',
  USER_ACTION_REQUIRED: 'USER_ACTION_REQUIRED',
  VERIFIED: 'VERIFIED',
  CHECKOUT_RESUMED: 'CHECKOUT_RESUMED',
  PAYMENT_DECLINED: 'PAYMENT_DECLINED',
  PAYMENT_CYCLING: 'PAYMENT_CYCLING',
  PAYMENT_VERIFICATION_REQUIRED: 'PAYMENT_VERIFICATION_REQUIRED',
  ORDER_CONFIRMED: 'ORDER_CONFIRMED',
  CHECKOUT_FAILED: 'CHECKOUT_FAILED',
  MAX_RETRIES_REACHED: 'MAX_RETRIES_REACHED',
  CANCELLED: 'CANCELLED',
} as const

export type TaskState = (typeof TaskState)[keyof typeof TaskState]

export const TERMINAL_STATES: ReadonlySet<TaskState> = new Set([
  TaskState.ORDER_CONFIRMED,
  TaskState.CHECKOUT_FAILED,
  TaskState.MAX_RETRIES_REACHED,
  TaskState.CANCELLED,
])

export const PaymentStatus = {
  ACTIVE: 'ACTIVE',
  DECLINED: 'DECLINED',
  EXHAUSTED: 'EXHAUSTED',
  EXPIRED: 'EXPIRED',
} as const

export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus]

export const ProxyProtocol = {
  HTTP: 'http',
  HTTPS: 'https',
  SOCKS5: 'socks5',
} as const

export type ProxyProtocol = (typeof ProxyProtocol)[keyof typeof ProxyProtocol]

export const UserRole = {
  SUPER_ADMIN: 'super_admin',
  RESELLER: 'reseller',
  USER: 'user',
} as const

export type UserRole = (typeof UserRole)[keyof typeof UserRole]

export const BillingStatus = {
  ACTIVE: 'active',
  PAST_DUE: 'past_due',
  SUSPENDED: 'suspended',
  CANCELLED: 'cancelled',
} as const

export type BillingStatus = (typeof BillingStatus)[keyof typeof BillingStatus]

export const CaptchaType = {
  RECAPTCHA_V2: 'recaptcha-v2',
  RECAPTCHA_V3: 'recaptcha-v3',
  HCAPTCHA: 'hcaptcha',
  TURNSTILE: 'turnstile',
  ARKOSE: 'arkose',
} as const

export type CaptchaType = (typeof CaptchaType)[keyof typeof CaptchaType]

export const VerificationType = {
  CAPTCHA: 'CAPTCHA',
  PAYMENT_3DS: 'PAYMENT_3DS',
  OTP: 'OTP',
} as const

export type VerificationType = (typeof VerificationType)[keyof typeof VerificationType]

export const RETAILERS = [
  'dominos',
  'shake-shack',
  'wingstop',
  'five-guys',
  'panda-express',
  'jersey-mikes',
  'buffalo-wild-wings',
  'applebees',
  'ihop',
  'whataburger',
  'wawa',
  'insomnia-cookies',
  'uber-eats',
  'instacart',
] as const

export type Retailer = (typeof RETAILERS)[number]
