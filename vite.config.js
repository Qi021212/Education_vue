import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  //解决跨域问题
  server: {
    proxy: {
      '/smartEdu': {//获取路径中包含了/api的请求，就会被代理到http://localhost:8080
        target: 'http://localhost:8080',//代理的目标地址
        changeOrigin: true,//修改源
        rewrite: (path) => path.replace(/^\/api/, '')//重写路径
      }
    }
  }
})
