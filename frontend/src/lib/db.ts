import { PrismaClient } from "@prisma/client";
import { neon } from "@neondatabase/serverless";
import { INITIAL_PROPERTIES, INITIAL_LANDLORDS, PropertyData, UserData } from "./sample-data";
import fs from "fs";
import path from "path";

const connectionString = process.env.DATABASE_URL;
export const neonSql = connectionString ? neon(connectionString) : null;

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

const PERSIST_FILE = path.join(process.cwd(), "properties-cache.json");
const DELETED_FILE = path.join(process.cwd(), "deleted-properties.json");
const UNLOCKS_FILE = path.join(process.cwd(), "user-unlocks.json");

function loadDeletedIds(): Set<string> {
  const set = new Set<string>();
  try {
    if (fs.existsSync(DELETED_FILE)) {
      const data = fs.readFileSync(DELETED_FILE, "utf-8");
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        parsed.forEach((id) => set.add(id));
      }
    }
  } catch {}
  return set;
}

function saveDeletedIds(deletedSet: Set<string>) {
  try {
    fs.writeFileSync(DELETED_FILE, JSON.stringify(Array.from(deletedSet), null, 2), "utf-8");
  } catch {}
}

let deletedPropertyIds: Set<string> = loadDeletedIds();

export async function syncDeletedIdsFromCloud() {
  if (neonSql) {
    try {
      await neonSql`
        CREATE TABLE IF NOT EXISTS deleted_properties (
          id TEXT PRIMARY KEY,
          "deletedAt" TIMESTAMP DEFAULT NOW()
        );
      `;
      const rows = await neonSql`SELECT id FROM deleted_properties;`;
      if (rows && rows.length > 0) {
        for (const r of rows) {
          deletedPropertyIds.add(r.id);
        }
        saveDeletedIds(deletedPropertyIds);
      }
    } catch {}
  }
}

let hasAutoSeeded = false;

export async function autoSeedNeonDatabase() {
  if (!neonSql || hasAutoSeeded) return;
  hasAutoSeeded = true;

  try {
    // 1. Ensure Types & Enums
    await neonSql`
      DO $$ BEGIN
        CREATE TYPE "UserRole" AS ENUM ('TENANT', 'LANDLORD', 'ADMIN');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `;
    await neonSql`
      DO $$ BEGIN
        CREATE TYPE "PropertyType" AS ENUM ('SINGLE_ROOM', 'CHAMBER_AND_HALL');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `;
    await neonSql`
      DO $$ BEGIN
        CREATE TYPE "FacilityType" AS ENUM ('SELF_CONTAIN', 'SHARED_FACILITIES');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `;
    await neonSql`
      DO $$ BEGIN
        CREATE TYPE "LeasePeriod" AS ENUM ('TEN_MONTHS', 'ONE_YEAR', 'TWO_YEARS_PLUS');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `;

    // 2. Ensure Users Table
    await neonSql`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        "fullName" TEXT NOT NULL,
        "phoneNumber" TEXT UNIQUE NOT NULL,
        "isPhoneVerified" BOOLEAN DEFAULT false,
        "isVerified" BOOLEAN DEFAULT false,
        "isUnlocked" BOOLEAN DEFAULT false,
        "unlockedPropertyIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
        role "UserRole" DEFAULT 'TENANT'::"UserRole",
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      );
    `;

    // 3. Ensure Properties Table
    await neonSql`
      CREATE TABLE IF NOT EXISTS properties (
        id TEXT PRIMARY KEY,
        "landlordId" TEXT REFERENCES users(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        "propertyType" "PropertyType" NOT NULL,
        "facilityType" "FacilityType" NOT NULL,
        "pricePerMonth" NUMERIC(10,2) NOT NULL,
        "minLeasePeriod" "LeasePeriod" DEFAULT 'TEN_MONTHS'::"LeasePeriod",
        "generalArea" TEXT NOT NULL,
        "exactGhanaPostGps" TEXT NOT NULL,
        "exactStreetAddress" TEXT NOT NULL,
        latitude DOUBLE PRECISION NOT NULL,
        longitude DOUBLE PRECISION NOT NULL,
        description TEXT NOT NULL,
        amenities TEXT[] DEFAULT ARRAY[]::TEXT[],
        images TEXT[] DEFAULT ARRAY[]::TEXT[],
        "contactPhone" TEXT NOT NULL,
        "contactWhatsapp" TEXT NOT NULL,
        "isGpsVerified" BOOLEAN DEFAULT true,
        "isLandlordVerified" BOOLEAN DEFAULT true,
        "paymentRef" TEXT,
        "lastRenewedAt" TIMESTAMP DEFAULT NOW(),
        "viewsCount" INT DEFAULT 0,
        "isActive" BOOLEAN DEFAULT true,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      );
    `;

    // 4. Seed Landlords if users table count is 0
    const userCountRows = await neonSql`SELECT COUNT(*)::int as count FROM users;`;
    if (userCountRows && userCountRows[0].count === 0) {
      for (const landlord of INITIAL_LANDLORDS) {
        await neonSql`
          INSERT INTO users (id, email, password, "fullName", "phoneNumber", role, "isPhoneVerified", "isVerified", "isUnlocked", "createdAt", "updatedAt")
          VALUES (${landlord.id}, ${landlord.email}, 'password123', ${landlord.fullName}, ${landlord.phoneNumber}, ${landlord.role}::"Role", true, true, true, NOW(), NOW())
          ON CONFLICT (id) DO NOTHING;
        `;
      }
    }

    // 5. Seed Properties if properties table count is 0
    const propCountRows = await neonSql`SELECT COUNT(*)::int as count FROM properties;`;
    if (propCountRows && propCountRows[0].count === 0) {
      for (const p of INITIAL_PROPERTIES) {
        if (deletedPropertyIds.has(p.id)) continue;
        await neonSql`
          INSERT INTO users (id, email, password, "fullName", "phoneNumber", role, "isPhoneVerified", "isVerified", "isUnlocked", "createdAt", "updatedAt")
          VALUES (${p.landlordId}, ${p.landlord?.email || 'landlord_' + p.landlordId + '@nssdirectstay.gh'}, 'password123', ${p.landlord?.fullName || 'NSS Landlord'}, ${p.contactPhone}, 'LANDLORD'::"Role", true, true, true, NOW(), NOW())
          ON CONFLICT (id) DO NOTHING;
        `;
        await neonSql`
          INSERT INTO properties (
            id, "landlordId", title, "propertyType", "facilityType", "pricePerMonth",
            "minLeasePeriod", "generalArea", "exactGhanaPostGps", "exactStreetAddress",
            latitude, longitude, description, amenities, images, "contactPhone",
            "contactWhatsapp", "isGpsVerified", "isLandlordVerified", "paymentRef",
            "lastRenewedAt", "viewsCount", "isActive", "createdAt", "updatedAt"
          ) VALUES (
            ${p.id}, ${p.landlordId}, ${p.title}, ${p.propertyType}::"PropertyType",
            ${p.facilityType}::"FacilityType", ${p.pricePerMonth}, ${(p.minLeasePeriod || "TEN_MONTHS")}::"LeasePeriod",
            ${p.generalArea}, ${p.exactGhanaPostGps}, ${p.exactStreetAddress},
            ${p.latitude}, ${p.longitude}, ${p.description}, ${p.amenities},
            ${p.images}, ${p.contactPhone}, ${p.contactWhatsapp}, true, true,
            ${p.paymentRef || null}, NOW(), ${p.viewsCount || 0}, ${p.isActive ?? true}, NOW(), NOW()
          ) ON CONFLICT (id) DO NOTHING;
        `;
      }
    }
  } catch (err: any) {
    console.error("autoSeedNeonDatabase error:", err?.message || err);
  }
}

function loadUserUnlocksStore(): Record<string, string[]> {
  try {
    if (fs.existsSync(UNLOCKS_FILE)) {
      const data = fs.readFileSync(UNLOCKS_FILE, "utf-8");
      return JSON.parse(data) || {};
    }
  } catch {}
  return {};
}

function saveUserUnlocksStore(store: Record<string, string[]>) {
  try {
    fs.writeFileSync(UNLOCKS_FILE, JSON.stringify(store, null, 2), "utf-8");
  } catch {}
}

let userUnlocksStore = loadUserUnlocksStore();

export function getUserUnlockedProperties(userIdentifier: string): string[] {
  if (!userIdentifier) return [];
  const list = userUnlocksStore[userIdentifier] || [];
  return list.filter((id) => !deletedPropertyIds.has(id));
}

export function saveUserUnlockedProperty(userIdentifier: string, propertyId: string): string[] {
  if (!userIdentifier || !propertyId) return [];
  const existing = userUnlocksStore[userIdentifier] || [];
  if (!existing.includes(propertyId)) {
    existing.push(propertyId);
  }
  const cleanList = Array.from(new Set(existing)).filter((id) => !deletedPropertyIds.has(id));
  userUnlocksStore[userIdentifier] = cleanList;
  saveUserUnlocksStore(userUnlocksStore);
  return cleanList;
}

export async function persistUserUnlock(userId: string, email?: string, propertyId?: string): Promise<string[]> {
  if (!propertyId) return [];

  const savedById = saveUserUnlockedProperty(userId, propertyId);
  let savedByEmail: string[] = [];
  if (email) {
    savedByEmail = saveUserUnlockedProperty(email, propertyId);
  }

  const merged = Array.from(new Set([...savedById, ...savedByEmail])).filter((id) => !deletedPropertyIds.has(id));

  if (neonSql && (userId || email)) {
    try {
      await neonSql`
        UPDATE users
        SET "unlockedPropertyIds" = ARRAY(SELECT DISTINCT unnest(COALESCE("unlockedPropertyIds", ARRAY[]::text[]) || ${[propertyId]}::text[])),
            "isUnlocked" = true,
            "updatedAt" = NOW()
        WHERE id = ${userId} OR LOWER(email) = ${email?.toLowerCase() || ''};
      `;
    } catch (neonErr: any) {
      console.error("Neon HTTP persistUserUnlock error:", neonErr?.message || neonErr);
    }
  }

  if (userId) {
    try {
      await prisma.user.update({
        where: { id: userId },
        data: {
          isUnlocked: true,
          unlockedPropertyIds: merged,
        } as any,
      });
    } catch {}
  }

  return merged;
}

export async function fetchUserUnlockedProperties(userId: string, email?: string): Promise<string[]> {
  const localById = getUserUnlockedProperties(userId);
  const localByEmail = email ? getUserUnlockedProperties(email) : [];
  let dbUnlocked: string[] = [];

  if (neonSql && (userId || email)) {
    try {
      const rows = await neonSql`
        SELECT "unlockedPropertyIds" FROM users
        WHERE id = ${userId} OR LOWER(email) = ${email?.toLowerCase() || ''} LIMIT 1;
      `;
      if (rows && rows.length > 0 && Array.isArray(rows[0].unlockedPropertyIds)) {
        dbUnlocked = rows[0].unlockedPropertyIds;
      }
    } catch {}
  }

  if (dbUnlocked.length === 0 && userId) {
    try {
      const u = await prisma.user.findUnique({ where: { id: userId } });
      if (u && Array.isArray((u as any).unlockedPropertyIds)) {
        dbUnlocked = (u as any).unlockedPropertyIds;
      }
    } catch {}
  }

  const all = Array.from(new Set([...localById, ...localByEmail, ...dbUnlocked])).filter((id) => !deletedPropertyIds.has(id));
  return all;
}

function loadLocalStore(): PropertyData[] {
  try {
    if (fs.existsSync(PERSIST_FILE)) {
      const data = fs.readFileSync(PERSIST_FILE, "utf-8");
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.filter((p: PropertyData) => !deletedPropertyIds.has(p.id));
      }
    }
  } catch {}
  return INITIAL_PROPERTIES.filter((p) => !deletedPropertyIds.has(p.id));
}

function saveLocalStore(store: PropertyData[]) {
  try {
    fs.writeFileSync(PERSIST_FILE, JSON.stringify(store, null, 2), "utf-8");
  } catch {}
}

let localPropertiesStore: PropertyData[] = loadLocalStore();

const USERS_FILE = path.join(process.cwd(), "users-cache.json");

function loadUsersStore(): UserData[] {
  try {
    if (fs.existsSync(USERS_FILE)) {
      const data = fs.readFileSync(USERS_FILE, "utf-8");
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {}
  return [...INITIAL_LANDLORDS];
}

function saveUsersStore(store: UserData[]) {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(store, null, 2), "utf-8");
  } catch {}
}

let localUsersStore: UserData[] = loadUsersStore();

export async function createUserRecord(data: {
  email: string;
  password?: string;
  fullName: string;
  phoneNumber?: string;
  role: "TENANT" | "LANDLORD" | "ADMIN";
  isPhoneVerified?: boolean;
  isEmailVerified?: boolean;
  isVerified?: boolean;
  isUnlocked?: boolean;
}): Promise<any> {
  const cleanEmail = data.email.toLowerCase().trim();
  const phone = data.phoneNumber && data.phoneNumber.trim() !== ""
    ? data.phoneNumber
    : `+233${Math.floor(100000000 + Math.random() * 900000000)}`;
  const isEmailVer = data.isEmailVerified ?? true;

  if (neonSql) {
    try {
      const id = `usr-${Date.now()}`;
      const pass = data.password || "password123";
      const isUnl = data.isUnlocked ?? (data.role === "LANDLORD" || data.role === "ADMIN");
      const isVer = data.isVerified ?? false;

      const rows = await neonSql`
        INSERT INTO users (id, email, password, "fullName", "phoneNumber", "isPhoneVerified", "isVerified", "isUnlocked", role, "createdAt", "updatedAt")
        VALUES (${id}, ${cleanEmail}, ${pass}, ${data.fullName}, ${phone}, true, ${isVer}, ${isUnl}, ${data.role}::"Role", NOW(), NOW())
        RETURNING *;
      `;

      if (rows && rows.length > 0) {
        const createdUser = rows[0];
        const localUser: UserData = {
          id: createdUser.id,
          email: createdUser.email,
          password: pass,
          fullName: createdUser.fullName,
          phoneNumber: createdUser.phoneNumber,
          role: createdUser.role as any,
          isVerified: createdUser.isVerified ?? false,
        };
        if (!localUsersStore.some((u) => u.email === cleanEmail)) {
          localUsersStore.unshift(localUser);
          saveUsersStore(localUsersStore);
        }
        return createdUser;
      }
    } catch (neonErr: any) {
      console.error("Neon HTTP createUserRecord error:", neonErr?.message || neonErr);
    }
  }

  try {
    const created = await prisma.user.create({
      data: {
        email: cleanEmail,
        password: data.password || "password123",
        fullName: data.fullName,
        phoneNumber: phone,
        role: data.role as any,
        isPhoneVerified: data.isPhoneVerified ?? true,
        isVerified: data.isVerified ?? false,
        isUnlocked: data.isUnlocked ?? (data.role === "LANDLORD" || data.role === "ADMIN"),
      } as any
    });

    const localUser: UserData = {
      id: created.id,
      email: created.email,
      password: data.password || "password123",
      fullName: created.fullName,
      phoneNumber: created.phoneNumber,
      role: created.role as any,
      isVerified: (created as any).isVerified ?? false,
    };

    if (!localUsersStore.some((u) => u.email === cleanEmail)) {
      localUsersStore.unshift(localUser);
      saveUsersStore(localUsersStore);
    }
    return created;
  } catch (err: any) {
    console.error("Prisma createUserRecord error, utilizing fallback storage:", err?.message || err);

    const fallbackId = `usr-${Date.now()}`;
    const fallbackUser: UserData = {
      id: fallbackId,
      email: cleanEmail,
      password: data.password || "password123",
      fullName: data.fullName,
      phoneNumber: phone,
      role: data.role,
      isVerified: data.isVerified ?? false,
    };

    if (!localUsersStore.some((u) => u.email === cleanEmail)) {
      localUsersStore.unshift(fallbackUser);
      saveUsersStore(localUsersStore);
    }

    return {
      id: fallbackId,
      email: cleanEmail,
      password: data.password || "password123",
      fullName: data.fullName,
      phoneNumber: phone,
      role: data.role,
      isPhoneVerified: true,
      isVerified: data.isVerified ?? false,
      isUnlocked: data.isUnlocked ?? (data.role === "LANDLORD" || data.role === "ADMIN"),
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number = 2000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error("DB operation timed out")), timeoutMs)
    ),
  ]);
}

export async function findUserByEmail(email: string): Promise<any | null> {
  const cleanEmail = email.toLowerCase().trim();

  if (neonSql) {
    try {
      const rows = await withTimeout(
        neonSql`
          SELECT * FROM users WHERE LOWER(email) = ${cleanEmail} LIMIT 1;
        `,
        2000
      );
      if (rows && rows.length > 0) {
        return rows[0];
      }
    } catch {}
  }

  try {
    const user = await withTimeout(
      prisma.user.findUnique({ where: { email: cleanEmail } }),
      2000
    );
    if (user) return user;
  } catch {}

  const local = localUsersStore.find((u) => u.email.toLowerCase() === cleanEmail);
  if (local) {
    return {
      id: local.id,
      email: local.email,
      password: local.password || "password123",
      fullName: local.fullName,
      phoneNumber: local.phoneNumber,
      role: local.role,
      isPhoneVerified: true,
      isEmailVerified: local.isEmailVerified !== undefined ? Boolean(local.isEmailVerified) : Boolean(local.isVerified),
      isVerified: local.isVerified ?? false,
      isUnlocked: local.role === "LANDLORD" || local.role === "ADMIN",
    };
  }

  return null;
}

export async function findUserByEmailOrPhone(email: string, phoneNumber?: string): Promise<{ user: any; matchReason: "EMAIL" | "PHONE" } | null> {
  const cleanEmail = email.toLowerCase().trim();
  const cleanPhone = phoneNumber && phoneNumber.trim() !== "" ? phoneNumber.trim() : null;

  if (neonSql) {
    try {
      if (cleanPhone) {
        const rows = await withTimeout(
          neonSql`
            SELECT * FROM users WHERE LOWER(email) = ${cleanEmail} OR "phoneNumber" = ${cleanPhone} LIMIT 1;
          `,
          2000
        );
        if (rows && rows.length > 0) {
          const u = rows[0];
          const reason = u.email.toLowerCase() === cleanEmail ? "EMAIL" : "PHONE";
          return { user: u, matchReason: reason };
        }
      } else {
        const rows = await withTimeout(
          neonSql`
            SELECT * FROM users WHERE LOWER(email) = ${cleanEmail} LIMIT 1;
          `,
          2000
        );
        if (rows && rows.length > 0) {
          return { user: rows[0], matchReason: "EMAIL" };
        }
      }
    } catch {}
  }

  try {
    const OR_CONDITIONS: any[] = [{ email: cleanEmail }];
    if (cleanPhone) OR_CONDITIONS.push({ phoneNumber: cleanPhone });

    const user = await withTimeout(
      prisma.user.findFirst({ where: { OR: OR_CONDITIONS } }),
      2000
    );
    if (user) {
      const reason = user.email.toLowerCase() === cleanEmail ? "EMAIL" : "PHONE";
      return { user, matchReason: reason };
    }
  } catch {}

  const local = localUsersStore.find((u) => u.email.toLowerCase() === cleanEmail || (cleanPhone !== null && u.phoneNumber === cleanPhone));
  if (local) {
    const reason = local.email.toLowerCase() === cleanEmail ? "EMAIL" : "PHONE";
    return {
      user: {
        id: local.id,
        email: local.email,
        password: local.password || "password123",
        fullName: local.fullName,
        phoneNumber: local.phoneNumber,
        role: local.role,
        isPhoneVerified: true,
        isVerified: local.isVerified ?? true,
        isUnlocked: local.role === "LANDLORD" || local.role === "ADMIN",
      },
      matchReason: reason,
    };
  }

  return null;
}

export async function findUserById(id: string): Promise<any | null> {
  if (neonSql) {
    try {
      const rows = await withTimeout(
        neonSql`
          SELECT * FROM users WHERE id = ${id} LIMIT 1;
        `,
        2000
      );
      if (rows && rows.length > 0) return rows[0];
    } catch {}
  }

  try {
    const user = await withTimeout(
      prisma.user.findUnique({ where: { id } }),
      2000
    );
    if (user) return user;
  } catch {}

  const local = localUsersStore.find((u) => u.id === id);
  if (local) {
    return {
      id: local.id,
      email: local.email,
      password: local.password || "password123",
      fullName: local.fullName,
      phoneNumber: local.phoneNumber,
      role: local.role,
      isPhoneVerified: true,
      isEmailVerified: true,
      isVerified: local.isVerified ?? true,
      isUnlocked: local.role === "LANDLORD" || local.role === "ADMIN",
    };
  }

  return null;
}

export function processPropertyLifecycle(prop: PropertyData): { item: PropertyData; shouldDelete: boolean } {
  if (deletedPropertyIds.has(prop.id)) {
    return { item: prop, shouldDelete: true };
  }

  const now = new Date();
  const createdDate = new Date(prop.lastRenewedAt || prop.createdAt);
  const diffTime = now.getTime() - createdDate.getTime();
  const diffDays = diffTime < 0 ? 0 : Math.floor(diffTime / (1000 * 60 * 60 * 24));

  // Failure to renew after 93 days -> delist from system and database
  if (diffDays >= 93) {
    return { item: prop, shouldDelete: true };
  }

  const isNewlyListed = diffDays <= 7;
  // Available in system within 90 days. Between 90 and 93 days, requires renewal
  const isAvailable = diffDays < 90;
  const daysRemaining = Math.max(0, 90 - diffDays);
  const daysUntilDeletion = Math.max(0, 93 - diffDays);
  const isExpired = diffDays >= 90;

  return {
    item: {
      ...prop,
      isNewlyListed,
      viewsCount: prop.viewsCount ?? 0,
      daysRemaining,
      daysUntilDeletion,
      isExpired,
      isActive: prop.isActive && isAvailable,
    },
    shouldDelete: false,
  };
}

export async function getProperties(params?: {
  search?: string;
  propertyType?: string;
  facilityType?: string;
  minLeasePeriod?: string;
  maxPrice?: number;
  area?: string;
  landlordId?: string;
  includeInactive?: boolean;
}): Promise<PropertyData[]> {
  let allProps: PropertyData[] = [];
  await syncDeletedIdsFromCloud();
  await autoSeedNeonDatabase();

  try {
    const whereClause: any = params?.includeInactive ? {} : { isActive: true };

    if (params?.landlordId) {
      whereClause.landlordId = params.landlordId;
    }
    if (params?.propertyType && params.propertyType !== "ALL") {
      whereClause.propertyType = params.propertyType;
    }
    if (params?.facilityType && params.facilityType !== "ALL") {
      whereClause.facilityType = params.facilityType;
    }
    if (params?.minLeasePeriod && params.minLeasePeriod !== "ALL") {
      whereClause.minLeasePeriod = params.minLeasePeriod;
    }
    if (params?.maxPrice) {
      whereClause.pricePerMonth = { lte: params.maxPrice };
    }
    if (params?.search) {
      const q = params.search.trim().toLowerCase();
      whereClause.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { generalArea: { contains: q, mode: "insensitive" } },
        { exactGhanaPostGps: { contains: q, mode: "insensitive" } },
        { exactStreetAddress: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } }
      ];
    }

    const properties = await withTimeout(
      prisma.property.findMany({
        where: whereClause,
        include: { landlord: true },
        orderBy: { createdAt: "desc" }
      }),
      2500
    );

    for (const p of properties) {
      const rawProp: PropertyData = {
        ...p,
        pricePerMonth: Number(p.pricePerMonth),
        lastRenewedAt: (p as any).lastRenewedAt ? (p as any).lastRenewedAt.toISOString() : p.createdAt.toISOString(),
        paymentRef: (p as any).paymentRef || undefined,
        viewsCount: (p as any).viewsCount ?? 0,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
        landlord: p.landlord ? {
          id: p.landlord.id,
          email: p.landlord.email,
          fullName: p.landlord.fullName,
          phoneNumber: p.landlord.phoneNumber || "",
          role: p.landlord.role as any,
          isVerified: (p.landlord as any).isVerified || false,
        } : undefined
      };

      const lifecycle = processPropertyLifecycle(rawProp);
      if (lifecycle.shouldDelete) {
        try {
          await prisma.property.delete({ where: { id: p.id } });
        } catch {}
      } else if (params?.includeInactive || lifecycle.item.isActive) {
        allProps.push(lifecycle.item);
      }
    }
  } catch {
    // Graceful fallback to local in-memory/file dataset
  }

  // Merge localPropertiesStore
  const existingIds = new Set(allProps.map((p) => p.id));
  const remainingLocal: PropertyData[] = [];

  for (const p of localPropertiesStore) {
    const lifecycle = processPropertyLifecycle(p);
    if (lifecycle.shouldDelete) {
      continue;
    }
    remainingLocal.push(p);

    if (!existingIds.has(p.id)) {
      if (params?.landlordId && p.landlordId !== params.landlordId && p.landlord?.email !== params.landlordId && p.landlord?.id !== params.landlordId) {
        continue;
      }
      if (!params?.includeInactive && !lifecycle.item.isActive) {
        continue;
      }

      let matches = true;
      if (params?.propertyType && params.propertyType !== "ALL" && p.propertyType !== params.propertyType) {
        matches = false;
      }
      if (params?.facilityType && params.facilityType !== "ALL" && p.facilityType !== params.facilityType) {
        matches = false;
      }
      if (params?.minLeasePeriod && params.minLeasePeriod !== "ALL" && p.minLeasePeriod !== params.minLeasePeriod) {
        matches = false;
      }
      if (params?.maxPrice !== undefined && p.pricePerMonth > params.maxPrice) {
        matches = false;
      }
      if (params?.search) {
        const q = params.search.trim().toLowerCase();
        const inSearch =
          p.title.toLowerCase().includes(q) ||
          p.generalArea.toLowerCase().includes(q) ||
          p.exactGhanaPostGps.toLowerCase().includes(q) ||
          p.exactStreetAddress.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q);
        if (!inSearch) matches = false;
      }

      if (matches) {
        allProps.push(lifecycle.item);
      }
    }
  }

  localPropertiesStore = remainingLocal.filter((p) => !deletedPropertyIds.has(p.id));
  saveLocalStore(localPropertiesStore);
  allProps = allProps.filter((p) => !deletedPropertyIds.has(p.id));
  // Sort descending by creation date so newly listed properties are always at top
  allProps.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return allProps;
}

export async function getPropertyById(id: string): Promise<PropertyData | null> {
  if (deletedPropertyIds.has(id)) return null;

  try {
    const prop = await prisma.property.findUnique({
      where: { id },
      include: { landlord: true }
    });
    if (prop) {
      const rawProp: PropertyData = {
        ...prop,
        pricePerMonth: Number(prop.pricePerMonth),
        lastRenewedAt: (prop as any).lastRenewedAt ? (prop as any).lastRenewedAt.toISOString() : prop.createdAt.toISOString(),
        paymentRef: (prop as any).paymentRef || undefined,
        viewsCount: (prop as any).viewsCount ?? 0,
        createdAt: prop.createdAt.toISOString(),
        updatedAt: prop.updatedAt.toISOString(),
        landlord: prop.landlord ? {
          id: prop.landlord.id,
          email: prop.landlord.email,
          fullName: prop.landlord.fullName,
          phoneNumber: prop.landlord.phoneNumber || "",
          role: prop.landlord.role as any,
          isVerified: (prop.landlord as any).isVerified || false,
        } : undefined
      };
      const lifecycle = processPropertyLifecycle(rawProp);
      if (lifecycle.shouldDelete) {
        try {
          await prisma.property.delete({ where: { id } });
        } catch {}
        return null;
      }
      return lifecycle.item;
    }
  } catch {}

  const found = localPropertiesStore.find(p => p.id === id);
  if (!found) return null;
  const lifecycle = processPropertyLifecycle(found);
  if (lifecycle.shouldDelete) {
    localPropertiesStore = localPropertiesStore.filter(p => p.id !== id);
    saveLocalStore(localPropertiesStore);
    return null;
  }
  return lifecycle.item;
}

export async function incrementPropertyViews(id: string): Promise<number> {
  let updatedCount = 0;
  try {
    const prop = await prisma.property.update({
      where: { id },
      data: { viewsCount: { increment: 1 } } as any,
    });
    updatedCount = (prop as any).viewsCount ?? 0;
  } catch {}

  const localItem = localPropertiesStore.find((p) => p.id === id);
  if (localItem) {
    localItem.viewsCount = (localItem.viewsCount ?? 0) + 1;
    saveLocalStore(localPropertiesStore);
    if (!updatedCount) updatedCount = localItem.viewsCount;
  }
  return updatedCount;
}

export async function createProperty(data: Omit<PropertyData, "id" | "createdAt" | "updatedAt"> & { paymentRef?: string }): Promise<PropertyData> {
  const newId = `prop-${Date.now()}`;
  const now = new Date().toISOString();
  const newProp: PropertyData = {
    ...data,
    id: newId,
    paymentRef: data.paymentRef,
    lastRenewedAt: now,
    viewsCount: 0,
    daysRemaining: 90,
    daysUntilDeletion: 93,
    isExpired: false,
    isNewlyListed: true,
    createdAt: now,
    updatedAt: now
  };

  if (neonSql) {
    try {
      // Ensure landlord exists in Neon SQL users table to prevent foreign key violation
      const landlordEmail = data.landlordId.includes("@") ? data.landlordId.toLowerCase() : `${data.landlordId.toLowerCase()}@nssdirectstay.gh`;
      await neonSql`
        INSERT INTO users (id, email, password, "fullName", "phoneNumber", role, "isPhoneVerified", "isVerified", "isUnlocked", "createdAt", "updatedAt")
        VALUES (
          ${data.landlordId},
          ${landlordEmail},
          'password123',
          'NSS Landlord',
          ${data.contactPhone || "0557208794"},
          'LANDLORD'::"UserRole",
          true, true, true, NOW(), NOW()
        ) ON CONFLICT (id) DO NOTHING;
      `;

      const rows = await neonSql`
        INSERT INTO properties (
          id, "landlordId", title, "propertyType", "facilityType", "pricePerMonth",
          "minLeasePeriod", "generalArea", "exactGhanaPostGps", "exactStreetAddress",
          latitude, longitude, description, amenities, images, "contactPhone",
          "contactWhatsapp", "isGpsVerified", "isLandlordVerified", "paymentRef",
          "lastRenewedAt", "viewsCount", "isActive", "createdAt", "updatedAt"
        ) VALUES (
          ${newId}, ${data.landlordId}, ${data.title}, ${data.propertyType}::"PropertyType",
          ${data.facilityType}::"FacilityType", ${data.pricePerMonth}, ${(data.minLeasePeriod || "TEN_MONTHS")}::"LeasePeriod",
          ${data.generalArea}, ${data.exactGhanaPostGps}, ${data.exactStreetAddress},
          ${data.latitude}, ${data.longitude}, ${data.description}, ${data.amenities},
          ${data.images}, ${data.contactPhone}, ${data.contactWhatsapp}, true, true,
          ${data.paymentRef || null}, NOW(), 0, ${data.isActive ?? true}, NOW(), NOW()
        ) RETURNING *;
      `;
      if (rows && rows.length > 0) {
        const created = rows[0];
        const fullProp: PropertyData = {
          id: created.id,
          landlordId: created.landlordId,
          title: created.title,
          propertyType: created.propertyType,
          facilityType: created.facilityType,
          pricePerMonth: Number(created.pricePerMonth),
          minLeasePeriod: created.minLeasePeriod,
          generalArea: created.generalArea,
          exactGhanaPostGps: created.exactGhanaPostGps,
          exactStreetAddress: created.exactStreetAddress,
          latitude: Number(created.latitude),
          longitude: Number(created.longitude),
          description: created.description,
          amenities: created.amenities || [],
          images: created.images || [],
          contactPhone: created.contactPhone,
          contactWhatsapp: created.contactWhatsapp,
          paymentRef: created.paymentRef || undefined,
          lastRenewedAt: created.lastRenewedAt ? new Date(created.lastRenewedAt).toISOString() : now,
          viewsCount: created.viewsCount ?? 0,
          isActive: created.isActive ?? true,
          daysRemaining: 90,
          daysUntilDeletion: 93,
          isExpired: false,
          isNewlyListed: true,
          createdAt: created.createdAt ? new Date(created.createdAt).toISOString() : now,
          updatedAt: created.updatedAt ? new Date(created.updatedAt).toISOString() : now,
        };
        localPropertiesStore.unshift(fullProp);
        saveLocalStore(localPropertiesStore);
        return fullProp;
      }
    } catch (neonErr: any) {
      console.error("Neon HTTP createProperty error:", neonErr?.message || neonErr);
    }
  }

  try {
    const landlordEmail = data.landlordId.includes("@") ? data.landlordId.toLowerCase() : `${data.landlordId.toLowerCase()}@nssdirectstay.gh`;
    try {
      await prisma.user.upsert({
        where: { id: data.landlordId },
        update: {},
        create: {
          id: data.landlordId,
          email: landlordEmail,
          password: "password123",
          fullName: "NSS Landlord",
          phoneNumber: data.contactPhone || "0557208794",
          role: "LANDLORD" as any,
          isPhoneVerified: true,
          isVerified: true,
          isUnlocked: true,
        }
      });
    } catch {}

    const created = await prisma.property.create({
      data: {
        landlordId: data.landlordId,
        title: data.title,
        propertyType: data.propertyType,
        facilityType: data.facilityType,
        pricePerMonth: data.pricePerMonth,
        minLeasePeriod: data.minLeasePeriod,
        generalArea: data.generalArea,
        exactGhanaPostGps: data.exactGhanaPostGps,
        exactStreetAddress: data.exactStreetAddress,
        latitude: data.latitude,
        longitude: data.longitude,
        description: data.description,
        amenities: data.amenities,
        images: data.images,
        contactPhone: data.contactPhone,
        contactWhatsapp: data.contactWhatsapp,
        paymentRef: data.paymentRef,
        lastRenewedAt: new Date(now),
        viewsCount: 0,
        isActive: data.isActive
      } as any
    });

    const fullProp: PropertyData = {
      ...created,
      pricePerMonth: Number(created.pricePerMonth),
      paymentRef: (created as any).paymentRef ?? data.paymentRef,
      viewsCount: 0,
      daysRemaining: 90,
      daysUntilDeletion: 93,
      isExpired: false,
      isNewlyListed: true,
      lastRenewedAt: now,
      createdAt: created.createdAt.toISOString(),
      updatedAt: created.updatedAt.toISOString()
    };

    localPropertiesStore.unshift(fullProp);
    saveLocalStore(localPropertiesStore);
    return fullProp;
  } catch {
    localPropertiesStore.unshift(newProp);
    saveLocalStore(localPropertiesStore);
    return newProp;
  }
}

export async function renewProperty(id: string, paymentRef: string): Promise<PropertyData | null> {
  const now = new Date();
  const nowIso = now.toISOString();

  try {
    const updated = await prisma.property.update({
      where: { id },
      data: {
        lastRenewedAt: now,
        createdAt: now,
        isActive: true,
        paymentRef,
      } as any,
      include: { landlord: true },
    });

    const fullProp: PropertyData = {
      ...updated,
      pricePerMonth: Number(updated.pricePerMonth),
      paymentRef: (updated as any).paymentRef ?? paymentRef,
      lastRenewedAt: nowIso,
      createdAt: nowIso,
      updatedAt: nowIso,
      isActive: true,
      isNewlyListed: true,
      daysRemaining: 90,
      daysUntilDeletion: 93,
      isExpired: false,
      viewsCount: (updated as any).viewsCount ?? 0,
    };

    const idx = localPropertiesStore.findIndex((p) => p.id === id);
    if (idx !== -1) {
      localPropertiesStore[idx] = fullProp;
      saveLocalStore(localPropertiesStore);
    }
    return fullProp;
  } catch {}

  const item = localPropertiesStore.find((p) => p.id === id);
  if (item) {
    item.lastRenewedAt = nowIso;
    item.createdAt = nowIso;
    item.updatedAt = nowIso;
    item.isActive = true;
    item.paymentRef = paymentRef;
    item.isNewlyListed = true;
    item.daysRemaining = 90;
    item.daysUntilDeletion = 93;
    item.isExpired = false;
    saveLocalStore(localPropertiesStore);
    return item;
  }

  return null;
}

export async function updatePropertyStatus(id: string, isActive: boolean): Promise<PropertyData | null> {
  if (neonSql) {
    try {
      await neonSql`UPDATE properties SET "isActive" = ${isActive}, "updatedAt" = NOW() WHERE id = ${id};`;
    } catch (neonErr: any) {
      console.error("Neon HTTP updatePropertyStatus error:", neonErr?.message || neonErr);
    }
  }

  try {
    const updated = await prisma.property.update({
      where: { id },
      data: { isActive } as any,
      include: { landlord: true }
    });

    const fullProp: PropertyData = {
      ...updated,
      pricePerMonth: Number(updated.pricePerMonth),
      paymentRef: (updated as any).paymentRef || undefined,
      lastRenewedAt: (updated as any).lastRenewedAt ? (updated as any).lastRenewedAt.toISOString() : updated.createdAt.toISOString(),
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
      isActive,
      viewsCount: (updated as any).viewsCount ?? 0,
    };

    const idx = localPropertiesStore.findIndex((p) => p.id === id);
    if (idx !== -1) {
      localPropertiesStore[idx].isActive = isActive;
      saveLocalStore(localPropertiesStore);
    }
    return fullProp;
  } catch {}

  const item = localPropertiesStore.find((p) => p.id === id);
  if (item) {
    item.isActive = isActive;
    saveLocalStore(localPropertiesStore);
    return item;
  }
  return null;
}

export async function deleteProperty(id: string): Promise<boolean> {
  deletedPropertyIds.add(id);
  saveDeletedIds(deletedPropertyIds);

  if (neonSql) {
    try {
      await neonSql`
        CREATE TABLE IF NOT EXISTS deleted_properties (
          id TEXT PRIMARY KEY,
          "deletedAt" TIMESTAMP DEFAULT NOW()
        );
      `;
      await neonSql`INSERT INTO deleted_properties (id) VALUES (${id}) ON CONFLICT (id) DO NOTHING;`;
      await neonSql`DELETE FROM properties WHERE id = ${id};`;
    } catch {
      try {
        await neonSql`DELETE FROM "Property" WHERE id = ${id};`;
      } catch {}
      try {
        await neonSql`UPDATE properties SET "isActive" = false WHERE id = ${id};`;
      } catch {}
    }
  }

  try {
    await prisma.property.delete({ where: { id } });
  } catch {
    try {
      await prisma.property.update({ where: { id }, data: { isActive: false } as any });
    } catch {}
  }

  localPropertiesStore = localPropertiesStore.filter((p) => p.id !== id);
  saveLocalStore(localPropertiesStore);
  return true;
}


