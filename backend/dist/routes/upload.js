"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = uploadRoutes;
const db_1 = require("../db");
const schema_1 = require("../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const uuid_1 = require("uuid");
const UPLOADS_DIR = path_1.default.join(process.cwd(), 'uploads', 'profiles');
// Ensure directory exists on startup
fs_1.default.mkdirSync(UPLOADS_DIR, { recursive: true });
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE_MB = 3;
async function uploadRoutes(server) {
    const guard = { onRequest: [server.authenticate] };
    // ─── POST /api/upload/profile-photo ──────────────────────────
    // Accepts a multipart file upload, saves it to disk, updates the
    // student or staff profile record with the public URL path.
    server.post('/upload/profile-photo', guard, async (req, reply) => {
        const file = await req.file({
            limits: {
                fileSize: MAX_SIZE_MB * 1024 * 1024,
                files: 1,
            },
        });
        if (!file)
            return reply.code(400).send({ error: 'No file uploaded' });
        if (!ALLOWED_TYPES.includes(file.mimetype)) {
            return reply.code(400).send({ error: 'Only JPEG, PNG and WebP images are allowed' });
        }
        const user = req.user;
        const ext = file.mimetype === 'image/webp' ? 'webp' : file.mimetype === 'image/png' ? 'png' : 'jpg';
        const filename = `${user.id}-${(0, uuid_1.v4)().slice(0, 8)}.${ext}`;
        const filePath = path_1.default.join(UPLOADS_DIR, filename);
        const publicUrl = `/uploads/profiles/${filename}`;
        // Stream file to disk
        const buffer = await file.toBuffer();
        fs_1.default.writeFileSync(filePath, buffer);
        // Update DB based on role
        try {
            if (user.role === 'student') {
                const [profile] = await db_1.db
                    .select()
                    .from(schema_1.studentProfiles)
                    .where((0, drizzle_orm_1.eq)(schema_1.studentProfiles.userId, user.id))
                    .limit(1);
                if (profile) {
                    await db_1.db
                        .update(schema_1.studentProfiles)
                        .set({ photoUrl: publicUrl })
                        .where((0, drizzle_orm_1.eq)(schema_1.studentProfiles.id, profile.id));
                }
            }
            else if (user.role === 'staff') {
                const [profile] = await db_1.db
                    .select()
                    .from(schema_1.staffProfiles)
                    .where((0, drizzle_orm_1.eq)(schema_1.staffProfiles.userId, user.id))
                    .limit(1);
                if (profile) {
                    await db_1.db
                        .update(schema_1.staffProfiles)
                        .set({ photoUrl: publicUrl })
                        .where((0, drizzle_orm_1.eq)(schema_1.staffProfiles.id, profile.id));
                }
            }
        }
        catch {
            // DB update failure is non-fatal for local dev (mock data in use)
            server.log.warn('DB update skipped (likely mock-data mode)');
        }
        return reply.send({ photoUrl: publicUrl, message: 'Photo uploaded successfully' });
    });
}
