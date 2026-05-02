import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  // Quan trọng: base phải khớp với tên repository của bạn trên GitHub
  base: '/storegithub/', 
  
  server: {
    host: "::",
    port: 8080,
  },
  
  plugins: [
    react( ),
    // Đã xóa componentTagger() của Lovable ở đây
  ],
  
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
