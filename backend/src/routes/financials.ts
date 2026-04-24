import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { db } from '../db';
import { z } from 'zod';

// Minimal in-memory fee structure (extend with DB table later)
const feeStructures: Record<string, number> = {
  'Diploma in Media Production': 800,
  'Certificate in Photography':  600,
  'HND Media & Communication':   1000,
};

const paymentSchema = z.object({
  studentId:   z.string().uuid(),
  amount:      z.number().positive(),
  method:      z.enum(['cash', 'bank_transfer', 'mobile_money']),
  reference:   z.string().optional(),
  description: z.string().optional(),
  termId:      z.string().uuid(),
});

export default async function financialsRoutes(server: FastifyInstance) {
  const guard = { onRequest: [server.authenticate] };

  // ─── GET fee structures ───────────────────────────────────
  server.get('/financials/fee-structures', guard, async (_req, reply) => {
    return reply.send({ data: feeStructures });
  });

  // ─── GET payment summary ──────────────────────────────────
  server.get('/financials/summary', guard, async (_req, reply) => {
    try {
      // Placeholder until payments table is seeded
      return reply.send({
        totalExpected: 24000,
        totalCollected: 18600,
        outstanding: 5400,
        collectionRate: 77.5,
        paymentsByMonth: [
          { month: 'Jan', amount: 4200 },
          { month: 'Feb', amount: 5100 },
          { month: 'Mar', amount: 4800 },
          { month: 'Apr', amount: 4500 },
        ],
      });
    } catch (err) {
      server.log.error(err);
      return reply.code(500).send({ error: 'Failed to fetch summary' });
    }
  });

  // ─── RECORD a payment ─────────────────────────────────────
  server.post('/financials/payments', guard, async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = paymentSchema.parse(req.body);
      const user = (req as any).user;

      // Here you'd insert to a payments table
      // For now return the payload with a generated ID
      const payment = {
        id:          `pay-${Date.now()}`,
        ...body,
        recordedBy:  user.id,
        recordedAt:  new Date().toISOString(),
        status:      'paid',
      };

      return reply.code(201).send({ message: 'Payment recorded', payment });
    } catch (err) {
      if (err instanceof z.ZodError) return reply.code(400).send({ error: err.errors });
      server.log.error(err);
      return reply.code(500).send({ error: 'Failed to record payment' });
    }
  });
}
