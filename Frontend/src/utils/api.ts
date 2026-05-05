const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? "https://backend-cfgb.onrender.com/api/v1" : "http://localhost:8081/api/v1");

const ACCESS_TOKEN_KEY = "baocaovn_access_token";

/**
 * Utility helper for API calls with built-in token management and error handling.
 * Gracefully handles non-JSON responses from the server.
 */
export const api = {
  get: async (endpoint: string) => {
    try {
      const token = localStorage.getItem(ACCESS_TOKEN_KEY);
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        credentials: "include",
        headers: token ? { "Authorization": `Bearer ${token}` } : {},
      });
      const contentType = response.headers.get("content-type");
      const data = contentType && contentType.includes("application/json") ? await response.json() : await response.text();
      
      if (!response.ok) {
        return { 
          success: false, 
          status: response.status,
          message: (typeof data === 'object' ? data.message : data) || "Network response was not ok" 
        };
      }
      return typeof data === 'object' ? { ...data, status: response.status } : { success: true, data, status: response.status };
    } catch (error) {
      console.error(`Lỗi GET ${endpoint}:`, error);
      return { success: false, status: 500, message: "Lỗi kết nối" };
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
      const contentType = response.headers.get("content-type");
      const resData = contentType && contentType.includes("application/json") ? await response.json() : await response.text();
      
      if (!response.ok) {
        return { 
          success: false, 
          status: response.status,
          message: (typeof resData === 'object' ? resData.message : resData) || "Network response was not ok" 
        };
      }
      return typeof resData === 'object' ? { ...resData, status: response.status } : { success: true, data: resData, status: response.status };
    } catch (error) {
      console.error(`Lỗi POST ${endpoint}:`, error);
      return { success: false, status: 500, message: "Lỗi kết nối" };
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
      const contentType = response.headers.get("content-type");
      const resData = contentType && contentType.includes("application/json") ? await response.json() : await response.text();
      
      if (!response.ok) {
        return { 
          success: false, 
          status: response.status,
          message: (typeof resData === 'object' ? resData.message : resData) || "Network response was not ok" 
        };
      }
      return typeof resData === 'object' ? { ...resData, status: response.status } : { success: true, data: resData, status: response.status };
    } catch (error) {
      console.error(`Lỗi PUT ${endpoint}:`, error);
      return { success: false, status: 500, message: "Lỗi kết nối" };
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
      const contentType = response.headers.get("content-type");
      const resData = contentType && contentType.includes("application/json") ? await response.json() : await response.text();
      
      if (!response.ok) {
        return { 
          success: false, 
          status: response.status,
          message: (typeof resData === 'object' ? resData.message : resData) || "Network response was not ok" 
        };
      }
      return typeof resData === 'object' ? { ...resData, status: response.status } : { success: true, data: resData, status: response.status };
    } catch (error) {
      console.error(`Lỗi PATCH ${endpoint}:`, error);
      return { success: false, status: 500, message: "Lỗi kết nối" };
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
      const contentType = response.headers.get("content-type");
      const data = contentType && contentType.includes("application/json") ? await response.json() : await response.text();
      
      if (!response.ok) {
        return { 
          success: false, 
          status: response.status,
          message: (typeof data === 'object' ? data.message : data) || "Network response was not ok" 
        };
      }
      return typeof data === 'object' ? { ...data, status: response.status } : { success: true, data, status: response.status };
    } catch (error) {
      console.error(`Lỗi DELETE ${endpoint}:`, error);
      return { success: false, status: 500, message: "Lỗi kết nối" };
    }
  },
};

/**
 * HƯỚNG DẪN GIẢI QUYẾT LỖI GOOGLE OAUTH (Origin not allowed):
 * 
 * Nếu bạn gặp lỗi "The given origin is not allowed for the given client ID", hãy làm theo các bước sau:
 * 1. Truy cập https://console.cloud.google.com/
 * 2. Chọn dự án của bạn.
 * 3. Đi đến "APIs & Services" > "Credentials".
 * 4. Tìm mục "OAuth 2.0 Client IDs" và nhấn vào Client ID bạn đang sử dụng.
 * 5. Trong phần "Authorized JavaScript origins", thêm URL đang chạy localhost của bạn:
 *    - http://localhost:5173
 *    - http://127.0.0.1:5173
 * 6. Lưu thay đổi. Lưu ý: Google có thể mất từ 5-10 phút để cập nhật cấu hình này.
 */
