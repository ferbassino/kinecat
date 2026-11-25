const DEFAULT_PORT = 8765;
const PAIR_SCHEME = "kinecat://atr-live";

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

/** Acepta atr-live y cmj-live (mismo relay / mismo cloud). */
export const parsePairingPayload = (raw) => {
  const text = String(raw || "").trim();
  if (!text) return null;

  try {
    if (text.startsWith("{")) {
      const obj = JSON.parse(text);
      const transport = String(obj.transport || "lan").toLowerCase();
      const room = String(obj.room || obj.r || "")
        .trim()
        .toUpperCase();
      if (transport === "pusher" && room && obj.token) {
        return {
          transport: "pusher",
          room,
          token: String(obj.token),
          host: "",
          port: 0,
          wsUrl: "",
        };
      }
      const host = normalizeHost(obj.host || obj.h);
      const port = Number(obj.port || obj.p) || DEFAULT_PORT;
      if (host && room.length >= 4) {
        return {
          transport: "lan",
          host,
          port,
          room,
          wsUrl: buildWsUrl(host, port),
        };
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
      const transport = String(params.transport || "lan").toLowerCase();
      const room = String(params.room || params.r || "")
        .trim()
        .toUpperCase();
      if (transport === "pusher" && room.length >= 4 && params.token) {
        return {
          transport: "pusher",
          room,
          token: String(params.token),
          host: "",
          port: 0,
          wsUrl: "",
        };
      }
      const host = normalizeHost(params.host || params.h || "");
      const port = Number(params.port || params.p) || DEFAULT_PORT;
      if (host && room.length >= 4) {
        return {
          transport: "lan",
          host,
          port,
          room,
          wsUrl: buildWsUrl(host, port),
        };
      }
    }
  } catch {
    // seguir
  }

  return null;
};

export {
  DEFAULT_PORT as ATR_LIVE_DEFAULT_PORT,
  PAIR_SCHEME as ATR_LIVE_PAIR_SCHEME,
};
