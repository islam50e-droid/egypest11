import { defineConfig } from 'vite'
import react from '@vitejs/react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // أضفنا هذا السطر لحل مشكلة الصفحة البيضاء
  // تأكد أن الاسم بين علامتي / يطابق اسم المستودع تماماً
  base: '/egypest11/', 
})
