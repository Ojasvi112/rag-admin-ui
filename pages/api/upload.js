export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  try {
    // 🔹 STUBBED RESPONSE (for SME testing on Vercel)
    // This simulates a backend success response
    return res.status(200).json({
      status: "success",
      file_id: "stub-" + Date.now(),
      filename: "uploaded-file",
      message: "Stubbed upload successful (backend integration pending)",
    });

    /*
    // 🔹 REAL PROXY (uncomment once backend is deployed)
    const apiBase = process.env.API_BASE;
    const apiKey = process.env.API_KEY;

    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const body = Buffer.concat(chunks);

    const r = await fetch(`${apiBase}/process-file`, {
      method: "POST",
      headers: { "X-API-Key": apiKey },
      body,
    });

    const text = await r.text();
    res.status(r.status).send(text);
    */
  } catch (err) {
    console.error("Upload stub error:", err);
    return res.status(500).json({ status: "error", detail: err.message });
  }
}