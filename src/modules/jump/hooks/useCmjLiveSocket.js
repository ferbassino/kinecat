import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Cliente WS hacia el relay local de la PC (CMJ · sensor).
 */
export default function useCmjLiveSocket({
  url,
  room,
  enabled = true,
  onCommand,
} = {}) {
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState(null);
  const [roomState, setRoomState] = useState({ viewers: 0, sensors: 0 });
  const wsRef = useRef(null);
  const onCommandRef = useRef(onCommand);
  onCommandRef.current = onCommand;

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      try {
        wsRef.current.close();
      } catch {
        // ignore
      }
      wsRef.current = null;
    }
  }, []);

  const send = useCallback((payload) => {
    const socket = wsRef.current;
    if (!socket || socket.readyState !== 1) return false;
    socket.send(JSON.stringify(payload));
    return true;
  }, []);

  const connect = useCallback(() => {
    disconnect();
    setError(null);
    if (!enabled || !url || !room) {
      setStatus("idle");
      return;
    }

    setStatus("connecting");
    let socket;
    try {
      socket = new WebSocket(url);
    } catch (err) {
      setStatus("error");
      setError(err?.message || "No se pudo abrir WebSocket");
      return;
    }
    wsRef.current = socket;

    socket.onopen = () => {
      setStatus("open");
      socket.send(
        JSON.stringify({
          type: "hello",
          role: "sensor",
          room: String(room).trim().toUpperCase(),
        }),
      );
    };

    socket.onmessage = (event) => {
      let msg;
      try {
        msg = JSON.parse(String(event.data));
      } catch {
        return;
      }
      if (msg.type === "error") {
        setError(msg.message || "Error del relay");
        return;
      }
      if (msg.type === "room_state") {
        setRoomState({
          viewers: Number(msg.viewers) || 0,
          sensors: Number(msg.sensors) || 0,
        });
        return;
      }
      if (msg.type === "cmd" && onCommandRef.current) {
        onCommandRef.current(msg.action, msg);
      }
    };

    socket.onerror = () => {
      setStatus("error");
      setError("Error de conexión con la PC");
    };

    socket.onclose = () => {
      setStatus((current) => (current === "error" ? "error" : "closed"));
      if (wsRef.current === socket) wsRef.current = null;
    };
  }, [disconnect, enabled, room, url]);

  useEffect(() => {
    if (!enabled) {
      disconnect();
      setStatus("idle");
      return undefined;
    }
    connect();
    return () => disconnect();
  }, [connect, disconnect, enabled]);

  return {
    status,
    error,
    roomState,
    send,
    connect,
    disconnect,
    isOpen: status === "open",
  };
}
