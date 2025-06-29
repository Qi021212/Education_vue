import './assets/main.css'
import { createPinia } from 'pinia'
// 导入 Element Plus
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'

//导入路由
import router from './router/index.js'


import { createApp } from 'vue'
import App from './App.vue'

const app =createApp(App);
const pinia = createPinia();
app.use(router);
app.use(ElementPlus);
app.mount('#app')
app.use(pinia)
