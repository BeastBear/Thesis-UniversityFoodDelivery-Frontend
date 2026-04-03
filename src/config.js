export const serverUrl =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
export const socketUrl = import.meta.env.VITE_SOCKET_URL || serverUrl;
