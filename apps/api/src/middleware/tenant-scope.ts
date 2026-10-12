import type { FastifyRequest, FastifyReply } from 'fastify'

export async function requireTenant(req: FastifyRequest, reply: FastifyReply) {
  if (!req.tenantId) {
    return reply.code(401).send({ error: 'Tenant context required' })
  }
}

export async function requireRole(roles: string[]) {
  return async (req: FastifyRequest, reply: FastifyReply) => {
    if (!roles.includes(req.userRole)) {
      return reply.code(403).send({ error: 'Insufficient permissions' })
    }
  }
}
