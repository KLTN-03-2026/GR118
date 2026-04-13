const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? "https://backend-cfgb.onrender.com/api/v1" : "http://localhost:8081/api/v1");

const ACCESS_TOKEN_KEY = "baocaovn_access_token";

export const api = {
  get: async (endpoint: string) => {
    try {
      const token = localStorage.getItem(ACCESS_TOKEN_KEY);
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        credentials: "include",
        headers: token ? { "Authorization": `Bearer ${token}` } : {},
      });
      if (!response.ok) throw new Error("Network response was not ok");
      return await response.json();
    } catch (error) {
      console.error(`Lỗi GET ${endpoint}:`, error);
      throw error;
    }
  },

  post: async (endpoint: string, data: any) => {
    try {
      const token = localStorage.getItem(ACCESS_TOKEN_KEY);
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Network response was not ok");
      return await response.json();
    } catch (error) {
      console.error(`Lỗi POST ${endpoint}:`, error);
      throw error;
    }
  },

  put: async (endpoint: string, data: any) => {
    try {
      const token = localStorage.getItem(ACCESS_TOKEN_KEY);
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Network response was not ok");
      return await response.json();
    } catch (error) {
      console.error(`Lỗi PUT ${endpoint}:`, error);
      throw error;
    }
  },

  patch: async (endpoint: string, data: any) => {
    try {
      const token = localStorage.getItem(ACCESS_TOKEN_KEY);
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Network response was not ok");
      return await response.json();
    } catch (error) {
      console.error(`Lỗi PATCH ${endpoint}:`, error);
      throw error;
    }
  },

  delete: async (endpoint: string) => {
    try {
      const token = localStorage.getItem(ACCESS_TOKEN_KEY);
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "DELETE",
        credentials: "include",
        headers: token ? { "Authorization": `Bearer ${token}` } : {},
      });
      if (!response.ok) throw new Error("Network response was not ok");
      return await response.json();
    } catch (error) {
      console.error(`Lỗi DELETE ${endpoint}:`, error);
      throw error;
    }
  },
};
