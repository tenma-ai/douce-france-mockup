import { del, list, put } from "@vercel/blob";
import { defaultContent } from "./default-content.js";

const CONTENT_KEY = "dfr-cms/content.json";

function json(res, payload, status = 200) {
  res.statusCode = status;
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.setHeader("cache-control", "no-store");
  res.end(JSON.stringify(payload));
}

function authorized(req) {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return false;
  return req.headers["x-admin-password"] === password;
}

function normalizeContent(input, options = {}) {
  const incoming = new Map();
  if (input && Array.isArray(input.fields)) {
    input.fields.forEach((field) => {
      if (field && field.id) incoming.set(field.id, field);
    });
  }

  return {
    version: defaultContent.version,
    updatedAt: options.touch ? new Date().toISOString() : (input?.updatedAt || null),
    fields: defaultContent.fields.map((field) => ({
      ...field,
      value: incoming.has(field.id)
        ? String(incoming.get(field.id).value ?? "")
        : field.value
    }))
  };
}

async function readStoredContent() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return defaultContent;
  const result = await list({ prefix: CONTENT_KEY, limit: 1 });
  const blob = result.blobs.find((item) => item.pathname === CONTENT_KEY);
  if (!blob) return defaultContent;
  const response = await fetch(blob.url, { cache: "no-store" });
  if (!response.ok) return defaultContent;
  return normalizeContent(await response.json());
}

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      return json(res, await readStoredContent());
    }

    if (req.method === "PUT") {
      if (!authorized(req)) return json(res, { error: "Unauthorized" }, 401);
      if (!process.env.BLOB_READ_WRITE_TOKEN) return json(res, { error: "BLOB_READ_WRITE_TOKEN is not configured" }, 500);
      const content = normalizeContent(req.body || {}, { touch: true });
      await put(CONTENT_KEY, JSON.stringify(content), {
        access: "public",
        contentType: "application/json; charset=utf-8",
        allowOverwrite: true
      });
      return json(res, content);
    }

    if (req.method === "DELETE") {
      if (!authorized(req)) return json(res, { error: "Unauthorized" }, 401);
      if (process.env.BLOB_READ_WRITE_TOKEN) await del(CONTENT_KEY).catch(() => {});
      return json(res, { ok: true });
    }

    return json(res, { error: "Method not allowed" }, 405);
  } catch (error) {
    return json(res, { error: error.message || "CMS error" }, 500);
  }
}
