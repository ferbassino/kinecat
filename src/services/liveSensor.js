import client from "../api/client";

const apiBase = () => {
  const base =
    client?.defaults?.baseURL ||
    process.env.EXPO_PUBLIC_API_URL ||
    "https://kinapp-api.vercel.app/";
  return String(base).replace(/\/$/, "");
};

export const getLiveConfig = async () => {
  const { data } = await client.get("/api/live/config");
  return data;
};

export const publishLiveEvent = async ({ liveToken, event, data }) => {
  const { data: res } = await client.post("/api/live/publish", {
    liveToken,
    event,
    data,
  });
  return res;
};

export const pusherAuthEndpoint = () => `${apiBase()}/api/live/pusher/auth`;
