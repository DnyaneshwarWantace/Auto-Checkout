CREATE TYPE "public"."task_state" AS ENUM('QUEUED', 'CHECKOUT_STARTED', 'CART_BUILDING', 'PROCESSING', 'VERIFICATION_REQUIRED', 'AUTOMATED_VERIFICATION', 'USER_ACTION_REQUIRED', 'VERIFIED', 'CHECKOUT_RESUMED', 'PAYMENT_DECLINED', 'PAYMENT_CYCLING', 'PAYMENT_VERIFICATION_REQUIRED', 'ORDER_CONFIRMED', 'CHECKOUT_FAILED', 'MAX_RETRIES_REACHED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('super_admin', 'reseller', 'user');--> statement-breakpoint
CREATE TABLE "addresses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"tenant_id" uuid NOT NULL,
	"label" text,
	"line1" text NOT NULL,
	"line2" text,
	"city" text NOT NULL,
	"state" text NOT NULL,
	"zip" text NOT NULL,
	"country" text DEFAULT 'US' NOT NULL,
	"phone" text
);
--> statement-breakpoint
CREATE TABLE "api_keys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"hashed_key" text NOT NULL,
	"label" text,
	"scopes" jsonb DEFAULT '["checkout:write","orders:read"]'::jsonb NOT NULL,
	"rate_limit" integer DEFAULT 60 NOT NULL,
	"last_used" timestamp,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "api_keys_hashed_key_unique" UNIQUE("hashed_key")
);
--> statement-breakpoint
CREATE TABLE "checkout_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" uuid NOT NULL,
	"state" text NOT NULL,
	"detail" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"ts" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "checkout_tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"profile_id" uuid NOT NULL,
	"retailer" text NOT NULL,
	"items" jsonb NOT NULL,
	"state" "task_state" DEFAULT 'QUEUED' NOT NULL,
	"worker_id" text,
	"retry_count" integer DEFAULT 0 NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"started_at" timestamp,
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" uuid NOT NULL,
	"tenant_id" uuid NOT NULL,
	"retailer" text NOT NULL,
	"retailer_order_id" text,
	"items" jsonb,
	"total_cents" integer,
	"status" text DEFAULT 'CONFIRMED' NOT NULL,
	"confirmed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "payment_methods" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"tenant_id" uuid NOT NULL,
	"encrypted_pan" text NOT NULL,
	"encrypted_cvv" text NOT NULL,
	"last4" text NOT NULL,
	"exp_month" integer NOT NULL,
	"exp_year" integer NOT NULL,
	"brand" text NOT NULL,
	"billing_zip" text,
	"billing_name" text,
	"status" text DEFAULT 'ACTIVE' NOT NULL,
	"attempt_count" integer DEFAULT 0 NOT NULL,
	"decline_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" text NOT NULL,
	"address_id" uuid,
	"payment_method_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"proxy_id" uuid,
	"phone" text,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "proxies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"label" text,
	"host" text NOT NULL,
	"port" integer NOT NULL,
	"username" text,
	"password" text,
	"protocol" text DEFAULT 'http' NOT NULL,
	"is_healthy" boolean DEFAULT true NOT NULL,
	"latency_ms" integer,
	"last_checked" timestamp,
	"assigned_to" text
);
--> statement-breakpoint
CREATE TABLE "tenants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"reseller_id" uuid,
	"plan" text DEFAULT 'standard' NOT NULL,
	"billing_status" text DEFAULT 'active' NOT NULL,
	"stripe_customer_id" text,
	"usage_limits" jsonb DEFAULT '{"dailyTasks":500,"monthlyTasks":10000,"concurrentWorkers":5}'::jsonb NOT NULL,
	"branding_config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"allowed_retailers" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "tenants_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" "user_role" DEFAULT 'user' NOT NULL,
	"totp_secret" text,
	"totp_enabled" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "users_tenant_id_email_unique" UNIQUE("tenant_id","email")
);
--> statement-breakpoint
CREATE TABLE "webhooks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"url" text NOT NULL,
	"events" jsonb DEFAULT '["task.completed","order.confirmed"]'::jsonb NOT NULL,
	"secret" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checkout_events" ADD CONSTRAINT "checkout_events_task_id_checkout_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."checkout_tasks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_task_id_checkout_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."checkout_tasks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_methods" ADD CONSTRAINT "payment_methods_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_address_id_addresses_id_fk" FOREIGN KEY ("address_id") REFERENCES "public"."addresses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_proxy_id_proxies_id_fk" FOREIGN KEY ("proxy_id") REFERENCES "public"."proxies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "event_task_idx" ON "checkout_events" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "task_tenant_idx" ON "checkout_tasks" USING btree ("tenant_id","created_at");