import crypto from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { slugFromRole } from "./access-control";
import { findEmployeeByEmail, findEmployeeById } from "./repository";
import type { EmployeeRecord, RoleSlug, Viewer } from "./types";

const SESSION_COOKIE = "hr_portal_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 8;
const DEV_PASSWORD = process.env.HR_DEMO_PASSWORD ?? "HrPortal2026!";

type SessionPayload = {
  employeeId: string;
  expiresAt: number;
};

export async function signInWithPassword(input: {
  email: string;
  password: string;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  const employee = await findEmployeeByEmail(input.email);

  if (!employee) {
    return { ok: false, message: "Invalid email or password." };
  }

  const passwordOk = verifyPasswordForEmployee(employee, input.password);

  if (!passwordOk) {
    return { ok: false, message: "Invalid email or password." };
  }

  await setSessionCookie(employee.id);

  return { ok: true };
}

export async function signOut(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function getCurrentViewer(): Promise<Viewer | null> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(SESSION_COOKIE)?.value;

  if (!cookie) {
    return null;
  }

  const payload = verifySessionCookie(cookie);

  if (!payload || payload.expiresAt < Date.now()) {
    return null;
  }

  const employee = await findEmployeeById(payload.employeeId);

  if (!employee) {
    return null;
  }

  return toViewer(employee);
}

export async function requireCurrentViewer(): Promise<Viewer> {
  const viewer = await getCurrentViewer();

  if (!viewer) {
    redirect("/login");
  }

  return viewer;
}

export function getRoleSlugFromViewer(viewer: Viewer): RoleSlug {
  return slugFromRole(viewer.role);
}

export async function getSlackViewer(slackUserId: string | undefined): Promise<Viewer | null> {
  if (!slackUserId) {
    return null;
  }

  const map = parseSlackUserMap();
  const employeeId = map[slackUserId];

  if (!employeeId && process.env.NODE_ENV === "production") {
    return null;
  }

  const employee = await findEmployeeById(employeeId ?? "emp-003");
  return employee ? toViewer(employee) : null;
}

async function setSessionCookie(employeeId: string): Promise<void> {
  const expiresAt = Date.now() + SESSION_TTL_MS;
  const value = signSessionPayload({ employeeId, expiresAt });
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE, value, {
    expires: new Date(expiresAt),
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}

function verifyPasswordForEmployee(employee: EmployeeRecord, password: string): boolean {
  const hashes = parsePasswordHashes();
  const storedHash = hashes[employee.email.toLowerCase()];

  if (storedHash) {
    return verifyPasswordHash(password, storedHash);
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("HR_PASSWORD_HASHES is required in production.");
  }

  return safeCompare(password, DEV_PASSWORD);
}

function signSessionPayload(payload: SessionPayload): string {
  const encodedPayload = toBase64Url(JSON.stringify(payload));
  const signature = sign(encodedPayload);

  return `${encodedPayload}.${signature}`;
}

function verifySessionCookie(value: string): SessionPayload | null {
  const [encodedPayload, signature] = value.split(".");

  if (!encodedPayload || !signature || !safeCompare(signature, sign(encodedPayload))) {
    return null;
  }

  try {
    const parsed = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8"));

    if (typeof parsed.employeeId !== "string" || typeof parsed.expiresAt !== "number") {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

function verifyPasswordHash(password: string, storedHash: string): boolean {
  const [algorithm, iterations, salt, hash] = storedHash.split("$");

  if (algorithm !== "pbkdf2_sha256" || !iterations || !salt || !hash) {
    return false;
  }

  const derived = crypto.pbkdf2Sync(password, salt, Number(iterations), 32, "sha256");

  return safeCompare(derived.toString("base64url"), hash);
}

function parsePasswordHashes(): Record<string, string> {
  const raw = process.env.HR_PASSWORD_HASHES;

  if (!raw) {
    return {};
  }

  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function parseSlackUserMap(): Record<string, string> {
  const raw = process.env.SLACK_USER_MAP;

  if (!raw) {
    return {};
  }

  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function sign(value: string): string {
  return crypto.createHmac("sha256", getSessionSecret()).update(value).digest("base64url");
}

function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET;

  if (secret) {
    return secret;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("SESSION_SECRET is required in production.");
  }

  return "dev-only-session-secret-change-before-production";
}

function toViewer(employee: EmployeeRecord): Viewer {
  return {
    id: employee.id,
    name: employee.name,
    email: employee.email,
    role: employee.role,
    title: employee.title,
    department: employee.department,
    profilePhotoUrl: employee.profilePhotoUrl,
  };
}

function toBase64Url(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

function safeCompare(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  return leftBuffer.length === rightBuffer.length && crypto.timingSafeEqual(leftBuffer, rightBuffer);
}
