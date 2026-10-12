import {
  pgTable,
  pgEnum,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  unique,
  index,
} from 'drizzle-orm/pg-core'

export const taskStateEnum = pgEnum('task_state', [
  'QUEUED',
  'CHECKOUT_STARTED',
  'CART_BUILDING',
  'PROCESSING',
  'VERIFICATION_REQUIRED',
  'AUTOMATED_VERIFICATION',
  'USER_ACTION_REQUIRED',
  'VERIFIED',
  'CHECKOUT_RESUMED',
  'PAYMENT_DECLINED',
  'PAYMENT_CYCLING',
  'PAYMENT_VERIFICATION_REQUIRED',
  'ORDER_CONFIRMED',
  'CHECKOUT_FAILED',
  'MAX_RETRIES_REACHED',
  'CANCELLED',
])

export const userRoleEnum = pgEnum('user_role', ['super_admin', 'reseller', 'user'])

export const tenants = pgTable('tenants', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  resellerId: uuid('reseller_id'),
  plan: text('plan').notNull().default('standard'),
  billingStatus: text('billing_status').notNull().default('active'),
  stripeCustomerId: text('stripe_customer_id'),
  usageLimits: jsonb('usage_limits')
    .notNull()
    .default({ dailyTasks: 500, monthlyTasks: 10000, concurrentWorkers: 5 }),
  brandingConfig: jsonb('branding_config').notNull().default({}),
  allowedRetailers: jsonb('allowed_retailers').notNull().default([]),
  createdAt: timestamp('created_at').defaultNow(),
})

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id),
    email: text('email').notNull(),
    passwordHash: text('password_hash').notNull(),
    role: userRoleEnum('role').notNull().default('user'),
    totpSecret: text('totp_secret'),
    totpEnabled: boolean('totp_enabled').notNull().default(false),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (t) => ({
    uniqEmail: unique().on(t.tenantId, t.email),
  }),
)

export const addresses = pgTable('addresses', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id),
  tenantId: uuid('tenant_id').notNull(),
  label: text('label'),
  line1: text('line1').notNull(),
  line2: text('line2'),
  city: text('city').notNull(),
  state: text('state').notNull(),
  zip: text('zip').notNull(),
  country: text('country').notNull().default('US'),
  phone: text('phone'),
})

export const paymentMethods = pgTable('payment_methods', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id),
  tenantId: uuid('tenant_id').notNull(),
  encryptedPan: text('encrypted_pan').notNull(),
  encryptedCvv: text('encrypted_cvv').notNull(),
  last4: text('last4').notNull(),
  expMonth: integer('exp_month').notNull(),
  expYear: integer('exp_year').notNull(),
  brand: text('brand').notNull(),
  billingZip: text('billing_zip'),
  billingName: text('billing_name'),
  status: text('status').notNull().default('ACTIVE'),
  attemptCount: integer('attempt_count').notNull().default(0),
  declineCount: integer('decline_count').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow(),
})

export const proxies = pgTable('proxies', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  label: text('label'),
  host: text('host').notNull(),
  port: integer('port').notNull(),
  username: text('username'),
  password: text('password'),
  protocol: text('protocol').notNull().default('http'),
  isHealthy: boolean('is_healthy').notNull().default(true),
  latencyMs: integer('latency_ms'),
  lastChecked: timestamp('last_checked'),
  assignedTo: text('assigned_to'),
})

export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id),
  tenantId: uuid('tenant_id').notNull(),
  name: text('name').notNull(),
  addressId: uuid('address_id').references(() => addresses.id),
  paymentMethodIds: jsonb('payment_method_ids').notNull().default([]),
  proxyId: uuid('proxy_id').references(() => proxies.id),
  phone: text('phone'),
  notes: text('notes'),
})

export const checkoutTasks = pgTable(
  'checkout_tasks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull(),
    userId: uuid('user_id').notNull(),
    profileId: uuid('profile_id').notNull(),
    retailer: text('retailer').notNull(),
    items: jsonb('items').notNull(),
    state: taskStateEnum('state').notNull().default('QUEUED'),
    workerId: text('worker_id'),
    retryCount: integer('retry_count').notNull().default(0),
    metadata: jsonb('metadata').notNull().default({}),
    createdAt: timestamp('created_at').defaultNow(),
    startedAt: timestamp('started_at'),
    completedAt: timestamp('completed_at'),
  },
  (t) => ({
    tenantIdx: index('task_tenant_idx').on(t.tenantId, t.createdAt),
  }),
)

export const checkoutEvents = pgTable(
  'checkout_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    taskId: uuid('task_id')
      .notNull()
      .references(() => checkoutTasks.id),
    state: text('state').notNull(),
    detail: jsonb('detail').notNull().default({}),
    ts: timestamp('ts').defaultNow(),
  },
  (t) => ({
    taskIdx: index('event_task_idx').on(t.taskId),
  }),
)

export const orders = pgTable('orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  taskId: uuid('task_id')
    .notNull()
    .references(() => checkoutTasks.id),
  tenantId: uuid('tenant_id').notNull(),
  retailer: text('retailer').notNull(),
  retailerOrderId: text('retailer_order_id'),
  items: jsonb('items'),
  totalCents: integer('total_cents'),
  status: text('status').notNull().default('CONFIRMED'),
  confirmedAt: timestamp('confirmed_at'),
})

export const apiKeys = pgTable('api_keys', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  hashedKey: text('hashed_key').notNull().unique(),
  label: text('label'),
  scopes: jsonb('scopes').notNull().default(['checkout:write', 'orders:read']),
  rateLimit: integer('rate_limit').notNull().default(60),
  lastUsed: timestamp('last_used'),
  createdAt: timestamp('created_at').defaultNow(),
})

export const webhooks = pgTable('webhooks', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  url: text('url').notNull(),
  events: jsonb('events').notNull().default(['task.completed', 'order.confirmed']),
  secret: text('secret').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow(),
})
