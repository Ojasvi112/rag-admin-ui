// pages/api/upload.js
export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const apiBase = process.env.API_BASE;
  const apiKey = process.env.API_KEY;

  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const body = Buffer.concat(chunks);

  const r = await fetch(`${apiBase}/process-file`, {
    method: 'POST',
    headers: { 'X-API-Key': apiKey },
    body
  });

  const text = await r.text();
  res.status(r.status).send(text);
}
