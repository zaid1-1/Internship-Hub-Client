import axios from "axios";

export const BASE_URL = "http://localhost:5000";

export function authHeaders() {
  const stored = localStorage.getItem("user");
  if (!stored) return {};
  const user = JSON.parse(stored);
  return { "x-user-id": user.id, "x-role": user.role };
}

export default axios;
