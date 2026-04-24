"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeAuditLog = writeAuditLog;
exports.default = auditPlugin;
const db_1 = require("../db");
const schema_1 = require("../db/schema");
const uuid_1 = require("uuid");
/** Write one audit entry to the DB */
async function writeAuditLog(payload) {
    try {
        await db_1.db.insert(schema_1.auditLogs).values({
            id: (0, uuid_1.v4)(),
            userId: payload.userId,
            action: payload.action,
            module: payload.module,
            details: payload.details,
            ipAddress: payload.ip,
            createdAt: new Date(),
        });
    }
    catch (err) {
        // Non-fatal: log to console but never crash a route
        console.error('[AuditLog] Failed to write:', err);
    }
}
/** Fastify plugin — registers an onSend hook that auto-logs all non-GET mutations */
async function auditPlugin(server) {
    server.addHook('onResponse', async (req, reply) => {
        const method = req.method.toUpperCase();
        if (['GET', 'HEAD', 'OPTIONS'].includes(method))
            return;
        if (!req.url.startsWith('/api'))
            return;
        const user = req.user;
        if (!user)
            return;
        const action = method === 'POST' ? 'CREATE'
            : method === 'PUT' ? 'UPDATE'
                : method === 'PATCH' ? 'PATCH'
                    : method === 'DELETE' ? 'DELETE'
                        : method;
        const module = req.url.split('/')[2]?.toUpperCase() ?? 'UNKNOWN';
        await writeAuditLog({
            userId: user.id,
            action,
            module,
            details: `${method} ${req.url} → ${reply.statusCode}`,
            ip: req.ip,
        });
    });
}
