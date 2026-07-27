import { PrismaClient } from "@prisma/client";
import { INITIAL_PROPERTIES, INITIAL_LANDLORDS, PropertyData, UserData } from "./sample-data";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

let localPropertiesStore: PropertyData[] = [...INITIAL_PROPERTIES];
let localUsersStore: UserData[] = [...INITIAL_LANDLORDS];

export function processPropertyLifecycle(prop: PropertyData): { item: PropertyData; shouldDelete: boolean } {
  const now = new Date();
  const createdDate = new Date(prop.lastRenewedAt || prop.createdAt);
  const diffTime = Math.abs(now.getTime() - createdDate.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  // Failure to renew after 93 days -> delist from system and database
  if (diffDays >= 93) {
    return { item: prop, shouldDelete: true };
  }

  const isNewlyListed = diffDays <= 7;
  // Available in system within 90 days. Between 90 and 93 days, requires renewal
  const isAvailable = diffDays < 90;

  return {
    item: {
      ...prop,
      isNewlyListed,
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
  includeInactive?: boolean;
}): Promise<PropertyData[]> {
  let allProps: PropertyData[] = [];

  try {
    const whereClause: any = params?.includeInactive ? {} : { isActive: true };

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

    const properties = await prisma.property.findMany({
      where: whereClause,
      include: { landlord: true },
      orderBy: { createdAt: "desc" }
    });

    for (const p of properties) {
      const rawProp: PropertyData = {
        ...p,
        pricePerMonth: Number(p.pricePerMonth),
        lastRenewedAt: (p as any).lastRenewedAt ? (p as any).lastRenewedAt.toISOString() : p.createdAt.toISOString(),
        paymentRef: (p as any).paymentRef || undefined,
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
    // Graceful fallback to local in-memory dataset
  }

  // Merge localPropertiesStore (e.g. properties added in memory fallback or during demo mode)
  const existingIds = new Set(allProps.map((p) => p.id));
  const remainingLocal: PropertyData[] = [];

  for (const p of localPropertiesStore) {
    const lifecycle = processPropertyLifecycle(p);
    if (lifecycle.shouldDelete) {
      continue;
    }
    remainingLocal.push(p);

    if (!existingIds.has(p.id)) {
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

  localPropertiesStore = remainingLocal;
  // Sort descending by creation date so newly listed properties are always at top
  allProps.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return allProps;
}

export async function getPropertyById(id: string): Promise<PropertyData | null> {
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
    return null;
  }
  return lifecycle.item;
}

export async function createProperty(data: Omit<PropertyData, "id" | "createdAt" | "updatedAt"> & { paymentRef?: string }): Promise<PropertyData> {
  const newId = `prop-${Date.now()}`;
  const now = new Date().toISOString();
  const newProp: PropertyData = {
    ...data,
    id: newId,
    paymentRef: data.paymentRef,
    lastRenewedAt: now,
    isNewlyListed: true,
    createdAt: now,
    updatedAt: now
  };

  try {
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
        isActive: data.isActive
      } as any
    });

    // Also store in local store for instant UI sync
    localPropertiesStore.unshift({
      ...created,
      pricePerMonth: Number(created.pricePerMonth),
      paymentRef: (created as any).paymentRef ?? data.paymentRef,
      isNewlyListed: true,
      lastRenewedAt: now,
      createdAt: created.createdAt.toISOString(),
      updatedAt: created.updatedAt.toISOString()
    });

    return {
      ...created,
      pricePerMonth: Number(created.pricePerMonth),
      paymentRef: (created as any).paymentRef ?? data.paymentRef,
      isNewlyListed: true,
      lastRenewedAt: now,
      createdAt: created.createdAt.toISOString(),
      updatedAt: created.updatedAt.toISOString()
    };
  } catch {
    localPropertiesStore.unshift(newProp);
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

    return {
      ...updated,
      pricePerMonth: Number(updated.pricePerMonth),
      paymentRef: (updated as any).paymentRef ?? paymentRef,
      lastRenewedAt: nowIso,
      createdAt: nowIso,
      updatedAt: nowIso,
      isActive: true,
      isNewlyListed: true,
    };
  } catch {}

  const item = localPropertiesStore.find((p) => p.id === id);
  if (item) {
    item.lastRenewedAt = nowIso;
    item.createdAt = nowIso;
    item.updatedAt = nowIso;
    item.isActive = true;
    item.paymentRef = paymentRef;
    item.isNewlyListed = true;
    return item;
  }

  return null;
}
