import crypto from "crypto";
import { neonSql, prisma } from "./db.js";

interface LocalTokenEntry {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  createdAt: Date;
}

const localTokensStore: LocalTokenEntry[] = [];

export function hashToken(plainToken: string): string {
  return crypto.createHash("sha256").update(plainToken.trim()).digest("hex");
}

export function generateTokenData(): { plainToken: string; tokenHash: string; expiresAt: Date } {
  const plainToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(plainToken);
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 Hours
  return { plainToken, tokenHash, expiresAt };
}

export async function createEmailVerificationToken(userId: string): Promise<{
  plainToken: string;
  expiresAt: Date;
}> {
  const now = new Date();
  const sixtySecondsAgo = new Date(now.getTime() - 60 * 1000);

  if (neonSql) {
    try {
      const recent = await neonSql`
        SELECT * FROM email_verification_tokens
        WHERE "userId" = ${userId} AND "createdAt" > ${sixtySecondsAgo.toISOString()}
        LIMIT 1;
      `;
      if (recent && recent.length > 0) {
        throw new Error("Please wait 60 seconds before requesting another verification email.");
      }
    } catch (err: any) {
      if (err.message?.includes("60 seconds")) throw err;
    }
  }

  try {
    const recentPrisma = await prisma.emailVerificationToken.findFirst({
      where: {
        userId,
        createdAt: { gte: sixtySecondsAgo },
      },
    });
    if (recentPrisma) {
      throw new Error("Please wait 60 seconds before requesting another verification email.");
    }
  } catch (err: any) {
    if (err.message?.includes("60 seconds")) throw err;
  }

  const { plainToken, tokenHash, expiresAt } = generateTokenData();
  const tokenId = `evt-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

  if (neonSql) {
    try {
      await neonSql`DELETE FROM email_verification_tokens WHERE "userId" = ${userId};`;
      await neonSql`
        INSERT INTO email_verification_tokens (id, "userId", "tokenHash", "expiresAt", "createdAt")
        VALUES (${tokenId}, ${userId}, ${tokenHash}, ${expiresAt.toISOString()}, NOW());
      `;
      return { plainToken, expiresAt };
    } catch (err: any) {
      console.error("Neon createEmailVerificationToken error:", err?.message || err);
    }
  }

  try {
    await prisma.emailVerificationToken.deleteMany({ where: { userId } });
    await prisma.emailVerificationToken.create({
      data: {
        id: tokenId,
        userId,
        tokenHash,
        expiresAt,
      },
    });
    return { plainToken, expiresAt };
  } catch {
    for (let i = localTokensStore.length - 1; i >= 0; i--) {
      if (localTokensStore[i].userId === userId) {
        localTokensStore.splice(i, 1);
      }
    }
    localTokensStore.push({
      id: tokenId,
      userId,
      tokenHash,
      expiresAt,
      createdAt: now,
    });
    return { plainToken, expiresAt };
  }
}

export async function verifyEmailToken(plainToken: string): Promise<{
  success: boolean;
  status: "SUCCESS" | "EXPIRED" | "INVALID" | "ALREADY_VERIFIED";
  message: string;
  userId?: string;
}> {
  if (!plainToken || typeof plainToken !== "string" || plainToken.trim() === "") {
    return {
      success: false,
      status: "INVALID",
      message: "Invalid verification link format.",
    };
  }

  const targetHash = hashToken(plainToken);

  let tokenRecord: { id: string; userId: string; expiresAt: Date } | null = null;
  let userRecord: { id: string; isEmailVerified: boolean } | null = null;

  if (neonSql) {
    try {
      const rows = await neonSql`
        SELECT t.id, t."userId", t."expiresAt", u."isEmailVerified"
        FROM email_verification_tokens t
        JOIN users u ON t."userId" = u.id
        WHERE t."tokenHash" = ${targetHash}
        LIMIT 1;
      `;
      if (rows && rows.length > 0) {
        const row = rows[0];
        tokenRecord = {
          id: row.id,
          userId: row.userId,
          expiresAt: new Date(row.expiresAt),
        };
        userRecord = {
          id: row.userId,
          isEmailVerified: Boolean(row.isEmailVerified),
        };
      }
    } catch {}
  }

  if (!tokenRecord) {
    try {
      const pRecord = await prisma.emailVerificationToken.findUnique({
        where: { tokenHash: targetHash },
        include: { user: true },
      });
      if (pRecord) {
        tokenRecord = {
          id: pRecord.id,
          userId: pRecord.userId,
          expiresAt: pRecord.expiresAt,
        };
        userRecord = {
          id: pRecord.user.id,
          isEmailVerified: pRecord.user.isEmailVerified,
        };
      }
    } catch {}
  }

  if (!tokenRecord) {
    const local = localTokensStore.find((t) => t.tokenHash === targetHash);
    if (local) {
      tokenRecord = {
        id: local.id,
        userId: local.userId,
        expiresAt: local.expiresAt,
      };
      userRecord = {
        id: local.userId,
        isEmailVerified: true,
      };
    }
  }

  if (!tokenRecord) {
    return {
      success: false,
      status: "INVALID",
      message: "Invalid or expired email verification link.",
    };
  }

  const now = new Date();
  if (now > tokenRecord.expiresAt) {
    if (neonSql) {
      try { await neonSql`DELETE FROM email_verification_tokens WHERE id = ${tokenRecord.id};`; } catch {}
    }
    try { await prisma.emailVerificationToken.delete({ where: { id: tokenRecord.id } }); } catch {}

    return {
      success: false,
      status: "EXPIRED",
      message: "This verification link has expired. Please request a new one.",
      userId: tokenRecord.userId,
    };
  }

  if (userRecord?.isEmailVerified) {
    if (neonSql) {
      try { await neonSql`DELETE FROM email_verification_tokens WHERE "userId" = ${tokenRecord.userId};`; } catch {}
    }
    try { await prisma.emailVerificationToken.deleteMany({ where: { userId: tokenRecord.userId } }); } catch {}

    return {
      success: true,
      status: "ALREADY_VERIFIED",
      message: "Your email address is already verified.",
      userId: tokenRecord.userId,
    };
  }

  if (neonSql) {
    try {
      await neonSql`
        UPDATE users SET "isEmailVerified" = true, "updatedAt" = NOW()
        WHERE id = ${tokenRecord.userId};
      `;
      await neonSql`
        DELETE FROM email_verification_tokens WHERE "userId" = ${tokenRecord.userId};
      `;
    } catch (err: any) {
      console.error("Neon verify update error:", err?.message || err);
    }
  }

  try {
    await prisma.user.update({
      where: { id: tokenRecord.userId },
      data: { isEmailVerified: true },
    });
    await prisma.emailVerificationToken.deleteMany({ where: { userId: tokenRecord.userId } });
  } catch {}

  return {
    success: true,
    status: "SUCCESS",
    message: "Email address verified successfully!",
    userId: tokenRecord.userId,
  };
}
