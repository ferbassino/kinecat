import { useCallback, useEffect, useRef, useState } from "react";
import PusherModule from "pusher-js/react-native";
import {
  getLiveConfig,
  publishLiveEvent,
  pusherAuthEndpoint,
} from "../../../services/liveSensor";

/** RN exporta `{ Pusher }`, no el constructor como default. */
const Pusher =
  PusherModule?.Pusher || PusherModule?.default?.Pusher || PusherModule?.default || PusherModule;

/**
 * Sensor cloud (Pusher): se suscribe con token del QR y publica por API.
 */
export default function usePusherLiveSensor({
  room,
  token,
  enabled = true,
  onCommand,
} = {}) {
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState(null);
  const [roomState, setRoomState] = useState({ viewers: 0, sensors: 1 });
  const pusherRef = useRef(null);
  const channelRef = useRef(null);
  const tokenRef = useRef(token);
  const onCommandRef = useRef(onCommand);
  tokenRef.current = token;
  onCommandRef.current = onCommand;

  const disconnect = useCallback(() => {
    try {
      channelRef.current?.unbind_all?.();
      pusherRef.current?.disconnect?.();
    } catch {
      // ignore
    }
    pusherRef.current = null;
    channelRef.current = null;
    setStatus("idle");
  }, []);

  const send = useCallback(async (payload) => {
    const liveToken = tokenRef.current;
    if (!liveToken || !payload?.type) return false;
    try {
      await publishLiveEvent({
        liveToken,
        event: payload.type,
        data: payload,
      });
      return true;
    } catch (err) {
      setError(err?.message || "No se pudo publicar");
      return false;
    }
  }, []);

  const connect = useCallback(() => {
    // reconnect handled by effect
  }, []);

  useEffect(() => {
    if (!enabled || !room || !token) {
      disconnect();
      return undefined;
    }

    let cancelled = false;

    const boot = async () => {
      setStatus("connecting");
      setError(null);
      try {
        const config = await getLiveConfig();
        if (cancelled) return;
        if (!config?.enabled || !config.key) {
          setStatus("error");
          setError("Cloud live no disponible en el API");
          return;
        }

        const channelName = `private-kinecat-live-${String(room)
          .trim()
          .toUpperCase()}`;

        if (typeof Pusher !== "function") {
          throw new Error(
            "Pusher no disponible en este build (constructor inválido)",
          );
        }
        const pusher = new Pusher(config.key, {
          cluster: config.cluster || "sa1",
          authEndpoint: pusherAuthEndpoint(),
          auth: {
            params: { liveToken: token },
          },
        });
        pusherRef.current = pusher;

        const channel = pusher.subscribe(channelName);
        channelRef.current = channel;

        channel.bind("pusher:subscription_succeeded", async () => {
          if (cancelled) return;
          setStatus("open");
          await publishLiveEvent({
            liveToken: token,
            event: "hello",
            data: {
              type: "hello",
              role: "sensor",
              room: String(room).toUpperCase(),
            },
          });
        });

        channel.bind("pusher:subscription_error", () => {
          setStatus("error");
          setError("No se pudo unir a la sala cloud");
        });

        channel.bind("cmd", (msg) => {
          if (msg?.action && onCommandRef.current) {
            onCommandRef.current(msg.action, msg);
          }
        });

        channel.bind("hello", (msg) => {
          if (msg?.role === "viewer") {
            setRoomState({ viewers: 1, sensors: 1 });
          }
        });

        channel.bind("room_state", (msg) => {
          setRoomState({
            viewers: Number(msg?.viewers) || 0,
            sensors: Number(msg?.sensors) || 0,
          });
        });
      } catch (err) {
        if (cancelled) return;
        setStatus("error");
        setError(err?.message || "Error cloud live");
      }
    };

    boot();
    return () => {
      cancelled = true;
      disconnect();
    };
  }, [disconnect, enabled, room, token]);

  return {
    status,
    error,
    roomState,
    send,
    connect,
    disconnect,
    isOpen: status === "open",
    transport: "pusher",
  };
}
