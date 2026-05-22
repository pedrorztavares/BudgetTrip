const API_BASE_URL =
  window.__BUDGETTRIP_CONFIG__?.API_BASE_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:5000";

export default API_BASE_URL;