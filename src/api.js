import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL;

export function authHeaders() {
  const stored = localStorage.getItem("user");
  if (!stored) return {};
  const user = JSON.parse(stored);
  return { "x-user-id": user.id, "x-role": user.role };
}

export default axios;
