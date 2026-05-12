import { put } from "@vercel/blob";

function json(res, payload, status = 200) {
  res.statusCode = status;
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}

function authorized(req) {
  const password = process.env.ADMIN_PASSWORD;
  return Boolean(password && req.headers["x-admin-password"] === password);
}

export default async function handler(req, res) {
  if (req.method !== "POST") return json(res, { error: "Method not allowed" }, 405);
  if (!authorized(req)) return json(res, { error: "Unauthorized" }, 401);
  if (!process.env.BLOB_READ_WRITE_TOKEN) return json(res, { error: "BLOB_READ_WRITE_TOKEN is not configured" }, 500);

  try {
    const { filename, contentType, data } = req.body || {};
    if (!filename || !data) return json(res, { error: "Invalid upload payload" }, 400);
    const base64 = String(data).replace(/^data:[^;]+;base64,/, "");
    const buffer = Buffer.from(base64, "base64");
    const safeName = filename.replace(/[^a-zA-Z0-9._-]+/g, "-");
    const blob = await put(`dfr-cms/uploads/${Date.now()}-${safeName}`, buffer, {
      access: "public",
      contentType: contentType || "application/octet-stream"
    });
    return json(res, { url: blob.url });
  } catch (error) {
    return json(res, { error: error.message || "Upload failed" }, 500);
  }
}
