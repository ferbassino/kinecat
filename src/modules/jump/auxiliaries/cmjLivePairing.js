const DEFAULT_PORT = 8765;
const PAIR_SCHEME = "kinecat://cmj-live";

export const normalizeHost = (host) =>
  String(host || "")
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/\/$/, "")
    .replace(/:\d+$/, "");

export const buildWsUrl = (host, port = DEFAULT_PORT) => {
  const bare = normalizeHost(host);
  return `ws://${bare}:${Number(port) || DEFAULT_PORT}`;
};

/**
 * Parsea QR / pegado: kinecat://cmj-live?host=&port=&room=
 * también ws://host:port#ROOM o JSON.
 */
export const parsePairingPayload = (raw) => {
  const text = String(raw || "").trim();
  if (!text) return null;

  try {
    if (text.startsWith("{")) {
      const obj = JSON.parse(text);
      const host = normalizeHost(obj.host || obj.h);
      const port = Number(obj.port || obj.p) || DEFAULT_PORT;
      const room = String(obj.room || obj.r || "")
        .trim()
        .toUpperCase();
      if (host && room.length === 4) {
        return { host, port, room, wsUrl: buildWsUrl(host, port) };
      }
    }
  } catch {
    // seguir
  }

  try {
    if (/^kinecat:\/\//i.test(text)) {
      const qIndex = text.indexOf("?");
      const query = qIndex >= 0 ? text.slice(qIndex + 1) : "";
      const params = {};
      for (const part of query.split("&")) {
        if (!part) continue;
        const [k, v] = part.split("=");
        params[decodeURIComponent(k)] = decodeURIComponent(v || "");
      }
      const host = normalizeHost(params.host || params.h || "");
      const port = Number(params.port || params.p) || DEFAULT_PORT;
      const room = String(params.room || params.r || "")
        .trim()
        .toUpperCase();
      if (host && room.length === 4) {
        return { host, port, room, wsUrl: buildWsUrl(host, port) };
      }
    }
  } catch {
    // seguir
  }

  try {
    if (/^wss?:\/\//i.test(text)) {
      const hashIndex = text.indexOf("#");
      const base = hashIndex >= 0 ? text.slice(0, hashIndex) : text;
      const hash = hashIndex >= 0 ? text.slice(hashIndex + 1) : "";
      const match = base.match(/^wss?:\/\/([^/:]+)(?::(\d+))?/i);
      if (match) {
        const host = normalizeHost(match[1]);
        const port = Number(match[2]) || DEFAULT_PORT;
        const room = String(hash || "")
          .trim()
          .toUpperCase();
        if (host && room.length === 4) {
          return { host, port, room, wsUrl: buildWsUrl(host, port) };
        }
      }
    }
  } catch {
    // seguir
  }

  return null;
};

export { DEFAULT_PORT as CMJ_LIVE_DEFAULT_PORT, PAIR_SCHEME as CMJ_LIVE_PAIR_SCHEME };
