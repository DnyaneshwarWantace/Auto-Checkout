import Redis from 'ioredis'

let redis: Redis | null = null

function getRedis(): Redis {
  if (!redis) {
    redis = new Redis(process.env.REDIS_URL!)
  }
  return redis
}

export async function checkUsageCap(tenantId: string, dailyLimit: number): Promise<void> {
  const r = getRedis()
  const today = new Date().toISOString().slice(0, 10)
  const key = `usage:daily:${tenantId}:${today}`
  const count = await r.incr(key)
  await r.expire(key, 86400)
  if (count > dailyLimit) {
    throw Object.assign(new Error('Daily task limit reached for this tenant'), { statusCode: 429 })
  }
}
