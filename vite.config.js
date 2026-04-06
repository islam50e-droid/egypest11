import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react( ),
    tailwindcss(),
  ],
  // أضفنا هذا السطر لحل مشكلة الصفحة البيضاء عند الرفع على GitHub Pages
  // الاسم بين علامتي / يطابق اسم المستودع تماماً
  base: '/egypest11/',
})