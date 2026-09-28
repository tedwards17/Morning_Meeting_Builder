import { createServer } from 'node:http';

// Start beside `npm run pilot`. Never forward port 8081 or place keys in Vite env.
const port = 8081;
const region = process.env.AZURE_SPEECH_REGION ?? '';
const speechKey = process.env.AZURE_SPEECH_KEY ?? '';
const translatorKey = process.env.AZURE_TRANSLATOR_KEY ?? '';
const translatorRegion = process.env.AZURE_TRANSLATOR_REGION ?? '';
const regionPattern = /^[a-z0-9-]{2,32}$/;
const allowedOrigins = new Set(['http://localhost:5173', 'http://127.0.0.1:5173']);
if (process.env.MMB_PILOT_ORIGIN) allowedOrigins.add(new URL(process.env.MMB_PILOT_ORIGIN).origin);
if (process.env.CODESPACE_NAME) {
  const domain = process.env.GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN || 'app.github.dev';
  allowedOrigins.add(`https://${process.env.CODESPACE_NAME}-5173.${domain}`);
}

function reply(response, status, data) {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
  response.end(JSON.stringify(data));
}
async function bodyOf(request) {
  let length = 0;
  const chunks = [];
  for await (const chunk of request) {
    length += chunk.length;
    if (length > 4096) throw new Error('Request too large');
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}
const server = createServer(async (request, response) => {
  // Browsers send Origin on POST. This guards the secret-bearing local endpoint
  // against requests from other sites while the presenter has the pilot open.
  if (request.method !== 'POST' || !allowedOrigins.has(request.headers.origin ?? '') ||
      request.headers['content-type']?.split(';')[0] !== 'application/json') {
    reply(response, 403, { error: { message: 'Pilot request denied' } });
    return;
  }
  if (!['/api/v1/translation/session', '/api/v1/translation/text'].includes(request.url)) {
    reply(response, 404, { error: { message: 'Unknown endpoint' } });
    return;
  }
  if (!speechKey || !translatorKey || !regionPattern.test(region) || !regionPattern.test(translatorRegion)) {
    reply(response, 503, { error: { message: 'Set Azure Speech and Translator keys and regions in the Codespace secrets or terminal environment' } });
    return;
  }
  try {
    const input = await bodyOf(request);
    if (request.url.endsWith('/session')) {
      const upstream = await fetch(`https://${region}.api.cognitive.microsoft.com/sts/v1.0/issueToken`, {
        method: 'POST', headers: { 'Ocp-Apim-Subscription-Key': speechKey }, signal: AbortSignal.timeout(10000),
      });
      if (!upstream.ok) throw new Error('Speech token unavailable');
      const token = await upstream.text();
      if (token.length < 32 || token.length > 8192) throw new Error('Invalid Speech token');
      reply(response, 200, { token, region });
      return;
    }
    const phrase = typeof input.text === 'string' ? input.text.trim() : '';
    if (!phrase || phrase.length > 1500 || !['en', 'es'].includes(input.source)) {
      reply(response, 422, { error: { message: 'Invalid sentence' } });
      return;
    }
    const target = input.source === 'en' ? 'es' : 'en';
    const url = `https://api.cognitive.microsofttranslator.com/translate?api-version=3.0&from=${input.source}&to=${target}`;
    const upstream = await fetch(url, {
      method: 'POST',
      headers: { 'Ocp-Apim-Subscription-Key': translatorKey, ...(translatorRegion === 'global' ? {} : { 'Ocp-Apim-Subscription-Region': translatorRegion }), 'Content-Type': 'application/json; charset=UTF-8' },
      body: JSON.stringify([{ Text: phrase }]), signal: AbortSignal.timeout(10000),
    });
    if (!upstream.ok) throw new Error('Translator unavailable');
    const result = (await upstream.json())?.[0]?.translations?.[0]?.text;
    if (typeof result !== 'string' || !result.trim()) throw new Error('Empty translation');
    reply(response, 200, { text: result });
  } catch (error) {
    const invalid = error instanceof SyntaxError || error?.message === 'Request too large';
    reply(response, invalid ? 400 : 503, { error: { message: invalid ? 'Invalid request' : 'Azure translation unavailable; check your resources and network' } });
  }
});
server.listen(port, '127.0.0.1', () => console.log(`Translation pilot ready on loopback port ${port}; open the app on port 5173.`));
