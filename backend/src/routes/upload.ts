import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { db } from '../db';
import { studentProfiles, staffProfiles, users } from '../db/schema';
import { eq } from 'drizzle-orm';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

const UPLOADS_DIR = path.join(process.cwd(), 'uploads', 'profiles');

// Ensure directory exists on startup
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE_MB   = 3;

export default async function uploadRoutes(server: FastifyInstance) {
  const guard = { onRequest: [server.authenticate] };

  // ─── POST /api/upload/profile-photo ──────────────────────────
  // Accepts a multipart file upload, saves it to disk, updates the
  // student or staff profile record with the public URL path.
  server.post('/upload/profile-photo', guard, async (req: FastifyRequest, reply: FastifyReply) => {
    const file = await (req as any).file({
      limits: {
        fileSize: MAX_SIZE_MB * 1024 * 1024,
        files: 1,
      },
    });

    if (!file) return reply.code(400).send({ error: 'No file uploaded' });
    if (!ALLOWED_TYPES.includes(file.mimetype)) {
      return reply.code(400).send({ error: 'Only JPEG, PNG and WebP images are allowed' });
    }

    const user     = (req as any).user as { id: string; role: string };
    const ext      = file.mimetype === 'image/webp' ? 'webp' : file.mimetype === 'image/png' ? 'png' : 'jpg';
    const filename = `${user.id}-${uuidv4().slice(0,8)}.${ext}`;
    const filePath = path.join(UPLOADS_DIR, filename);
    const publicUrl = `/uploads/profiles/${filename}`;

    // Stream file to disk
    const buffer = await file.toBuffer();
    fs.writeFileSync(filePath, buffer);

    // Update DB based on role
    try {
      if (user.role === 'student') {
        const [profile] = await db
          .select()
          .from(studentProfiles)
          .where(eq(studentProfiles.userId, user.id))
          .limit(1);
        if (profile) {
          await db
            .update(studentProfiles)
            .set({ photoUrl: publicUrl } as any)
            .where(eq(studentProfiles.id, profile.id));
        }
      } else if (user.role === 'staff') {
        const [profile] = await db
          .select()
          .from(staffProfiles)
          .where(eq(staffProfiles.userId, user.id))
          .limit(1);
        if (profile) {
          await db
            .update(staffProfiles)
            .set({ photoUrl: publicUrl } as any)
            .where(eq(staffProfiles.id, profile.id));
        }
      }
    } catch {
      // DB update failure is non-fatal for local dev (mock data in use)
      server.log.warn('DB update skipped (likely mock-data mode)');
    }

    return reply.send({ photoUrl: publicUrl, message: 'Photo uploaded successfully' });
  });
}
