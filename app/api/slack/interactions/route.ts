import crypto from "node:crypto";
import { decideLeaveRequestForViewer } from "@/lib/hr/commands";
import { getSlackViewer } from "@/lib/hr/session";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const rawBody = await request.text();
  const verification = verifySlackSignature(request, rawBody);

  if (!verification.ok) {
    return Response.json(verification, { status: verification.status });
  }

  const payload = parseSlackPayload(rawBody);
  const action = payload?.actions?.[0];
  const viewer = await getSlackViewer(payload?.user?.id);
  const requestId = action?.value;
  const decision = action?.action_id === "leave.approve" ? "approved" : "rejected";

  if (!viewer) {
    return Response.json({ ok: false, message: "Slack user is not linked." }, { status: 403 });
  }

  if (!requestId || !["leave.approve", "leave.reject"].includes(action?.action_id ?? "")) {
    return Response.json({ ok: false, message: "Unsupported Slack action." }, { status: 400 });
  }

  const result = await decideLeaveRequestForViewer({
    viewer,
    requestId,
    decision,
  });

  return Response.json({
    response_type: "ephemeral",
    text: result.message,
  });
}

function verifySlackSignature(
  request: Request,
  rawBody: string,
): { ok: true } | { ok: false; status: number; message: string } {
  const signingSecret = process.env.SLACK_SIGNING_SECRET;

  if (!signingSecret && process.env.NODE_ENV !== "production") {
    return { ok: true };
  }

  if (!signingSecret) {
    return { ok: false, status: 500, message: "Slack signing secret is not configured." };
  }

  const timestamp = request.headers.get("x-slack-request-timestamp");
  const signature = request.headers.get("x-slack-signature");

  if (!timestamp || !signature) {
    return { ok: false, status: 401, message: "Missing Slack signature headers." };
  }

  const ageInSeconds = Math.abs(Date.now() / 1000 - Number(timestamp));

  if (!Number.isFinite(ageInSeconds) || ageInSeconds > 300) {
    return { ok: false, status: 401, message: "Stale Slack request." };
  }

  const base = `v0:${timestamp}:${rawBody}`;
  const digest = `v0=${crypto.createHmac("sha256", signingSecret).update(base).digest("hex")}`;

  if (!safeCompare(digest, signature)) {
    return { ok: false, status: 401, message: "Invalid Slack signature." };
  }

  return { ok: true };
}

function safeCompare(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  return leftBuffer.length === rightBuffer.length && crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function parseSlackPayload(rawBody: string): {
  actions?: Array<{
    action_id?: string;
    value?: string;
  }>;
  user?: {
    id?: string;
  };
} | null {
  const form = new URLSearchParams(rawBody);
  const payload = form.get("payload");

  if (!payload) {
    return null;
  }

  try {
    return JSON.parse(payload);
  } catch {
    return null;
  }
}
