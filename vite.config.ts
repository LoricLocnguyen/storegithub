import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  // Sửa từ '/storegithub/' thành '/' để chạy trên Vercel
  base: '/', 
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Ép Vite tối ưu hóa thư viện để tránh lỗi "QueryClientProvider is not defined"
  optimizeDeps: {
    include: ['@tanstack/react-query'],
  },
});
