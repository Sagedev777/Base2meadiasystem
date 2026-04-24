"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("./db");
const schema_1 = require("./db/schema");
const bcrypt_1 = __importDefault(require("bcrypt"));
const dotenv = __importStar(require("dotenv"));
const uuid_1 = require("uuid");
dotenv.config();
async function seed() {
    console.log('\n🌱 Seeding Base 2 Media Academy database...\n');
    try {
        // ─── Clear existing data ──────────────────────────────────
        console.log('🧹 Clearing existing data...');
        await db_1.db.delete(schema_1.parentProfiles).execute();
        await db_1.db.delete(schema_1.staffProfiles).execute();
        await db_1.db.delete(schema_1.studentProfiles).execute();
        await db_1.db.delete(schema_1.users).execute();
        await db_1.db.delete(schema_1.classes).execute();
        await db_1.db.delete(schema_1.terms).execute();
        await db_1.db.delete(schema_1.subjects).execute();
        // ─── Academic Term ────────────────────────────────────────
        console.log('📅 Creating term...');
        const termId = (0, uuid_1.v4)();
        await db_1.db.insert(schema_1.terms).values({
            id: termId,
            name: 'Term 2 — 2025',
            startDate: '2025-01-06',
            endDate: '2025-04-30',
            isCurrent: true,
        });
        // ─── Classes ──────────────────────────────────────────────
        console.log('🏫 Creating classes...');
        const classIds = { c1: (0, uuid_1.v4)(), c2: (0, uuid_1.v4)(), c3: (0, uuid_1.v4)() };
        await db_1.db.insert(schema_1.classes).values([
            { id: classIds.c1, name: 'Diploma in Media Production 1', termId, capacity: 35 },
            { id: classIds.c2, name: 'Certificate in Photography 2', termId, capacity: 30 },
            { id: classIds.c3, name: 'HND Media & Communication', termId, capacity: 40 },
        ]);
        // ─── Subjects ─────────────────────────────────────────────
        console.log('📚 Creating subjects...');
        const subjectIds = {
            s1: (0, uuid_1.v4)(), s2: (0, uuid_1.v4)(), s3: (0, uuid_1.v4)(),
            s4: (0, uuid_1.v4)(), s5: (0, uuid_1.v4)(),
        };
        await db_1.db.insert(schema_1.subjects).values([
            { id: subjectIds.s1, name: 'Media Production Fundamentals', code: 'MPF101' },
            { id: subjectIds.s2, name: 'Digital Photography', code: 'DPH102' },
            { id: subjectIds.s3, name: 'Video Editing & Post Production', code: 'VEP201' },
            { id: subjectIds.s4, name: 'Broadcast Journalism', code: 'BCJ301' },
            { id: subjectIds.s5, name: 'Social Media Marketing', code: 'SMM401' },
        ]);
        // ─── Admin User ───────────────────────────────────────────
        console.log('👨‍💼 Creating admin user...');
        const adminId = (0, uuid_1.v4)();
        await db_1.db.insert(schema_1.users).values({
            id: adminId,
            email: 'admin@base2media.ac',
            passwordHash: await bcrypt_1.default.hash('admin123', 10),
            role: 'admin',
            name: 'Dr. Samuel Osei',
            isActive: true,
        });
        // ─── Staff User ───────────────────────────────────────────
        console.log('👩‍🏫 Creating staff user...');
        const staffUserId = (0, uuid_1.v4)();
        const staffProfileId = (0, uuid_1.v4)();
        await db_1.db.insert(schema_1.users).values({
            id: staffUserId,
            email: 'staff@base2media.ac',
            passwordHash: await bcrypt_1.default.hash('staff123', 10),
            role: 'staff',
            name: 'Mrs. Abena Mensah',
            isActive: true,
        });
        await db_1.db.insert(schema_1.staffProfiles).values({
            id: staffProfileId,
            userId: staffUserId,
            staffId: 'B2MA-STAFF-001',
            firstName: 'Abena',
            lastName: 'Mensah',
            department: 'Media Production',
            phone: '+233 24 111 2222',
            hireDate: '2022-09-01',
        });
        // ─── Student User ─────────────────────────────────────────
        console.log('🎒 Creating student user...');
        const studentUserId = (0, uuid_1.v4)();
        const studentProfileId = (0, uuid_1.v4)();
        await db_1.db.insert(schema_1.users).values({
            id: studentUserId,
            email: 'student@base2media.ac',
            passwordHash: await bcrypt_1.default.hash('student123', 10),
            role: 'student',
            name: 'Kwame Asante',
            isActive: true,
        });
        await db_1.db.insert(schema_1.studentProfiles).values({
            id: studentProfileId,
            userId: studentUserId,
            studentId: 'B2MA-2024-001',
            firstName: 'Kwame',
            lastName: 'Asante',
            gender: 'Male',
            phone: '+233 20 123 4567',
            classId: classIds.c1,
            enrollmentDate: '2024-09-01',
            status: 'active',
        });
        // ─── Parent User ──────────────────────────────────────────
        console.log('👪 Creating parent user...');
        const parentUserId = (0, uuid_1.v4)();
        await db_1.db.insert(schema_1.users).values({
            id: parentUserId,
            email: 'parent@base2media.ac',
            passwordHash: await bcrypt_1.default.hash('parent123', 10),
            role: 'parent',
            name: 'Mr. Kofi Asante',
            isActive: true,
        });
        await db_1.db.insert(schema_1.parentProfiles).values({
            userId: parentUserId,
            firstName: 'Kofi',
            lastName: 'Asante',
            phone: '+233 20 987 6543',
            studentId: studentProfileId,
        });
        console.log('\n✅ Database seeded successfully!\n');
        console.log('─────────────────────────────────────────');
        console.log('🔑 Demo Login Credentials:');
        console.log('   Admin   → admin@base2media.ac   / admin123');
        console.log('   Staff   → staff@base2media.ac   / staff123');
        console.log('   Student → student@base2media.ac / student123');
        console.log('   Parent  → parent@base2media.ac  / parent123');
        console.log('─────────────────────────────────────────\n');
        process.exit(0);
    }
    catch (error) {
        console.error('\n❌ Error seeding database:', error);
        process.exit(1);
    }
}
seed();
