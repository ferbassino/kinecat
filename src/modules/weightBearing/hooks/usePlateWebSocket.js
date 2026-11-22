import { useCallback, useEffect, useRef, useState } from "react";
import { PLATE_WS_URL } from "../constants";

const parseLoadMessage = (raw) => {
  try {
    const data = JSON.parse(raw);
    const loadKg = Number(data.loadKg);
    if (!Number.isFinite(loadKg)) return null;
    return {
      loadKg,
      ts: Number(data.ts) || Date.now(),
      sim: Boolean(data.sim),
      mode: data.mode || "single_load",
    };
  } catch {
    return null;
  }
};

export default function usePlateWebSocket({ url = PLATE_WS_URL, enabled = true } = {}) {
  const [status, setStatus] = useState("idle"); // idle | connecting | open | closed | error
  const [lastSample, setLastSample] = useState(null);
  const [error, setError] = useState(null);
  const socketRef = useRef(null);
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      try {
        socketRef.current.close();
      } catch {
        // ignore
      }
      socketRef.current = null;
    }
  }, []);

  const connect = useCallback(() => {
    disconnect();
    setError(null);
    setStatus("connecting");

    let socket;
    try {
      socket = new WebSocket(url);
    } catch (err) {
      setStatus("error");
      setError(err?.message || "No se pudo abrir WebSocket");
      return;
    }

    socketRef.current = socket;

    socket.onopen = () => {
      if (!enabledRef.current) {
        socket.close();
        return;
      }
      setStatus("open");
    };

    socket.onmessage = (event) => {
      const sample = parseLoadMessage(event.data);
      if (sample) {
        setLastSample(sample);
      }
    };

    socket.onerror = () => {
      setStatus("error");
      setError("Error de conexión con la placa");
    };

    socket.onclose = () => {
      setStatus((current) => (current === "error" ? "error" : "closed"));
      if (socketRef.current === socket) {
        socketRef.current = null;
      }
    };
  }, [disconnect, url]);

  useEffect(() => {
    if (!enabled) {
      disconnect();
      setStatus("idle");
      return undefined;
    }
    connect();
    return () => {
      disconnect();
    };
  }, [enabled, connect, disconnect]);

  return {
    status,
    lastSample,
    error,
    connect,
    disconnect,
  };
}
