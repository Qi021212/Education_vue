import './assets/main.css'
// 导入 Pinia
import { createPinia } from 'pinia'
// 导入持久化插件
import { createPersistedState } from 'pinia-persistedstate-plugin'
// 导入 Element Plus
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'

//导入路由
import router from './router/index.js'

import { createApp } from 'vue'
import App from './App.vue'

//导入echarts
import ECharts from 'vue-echarts'
import { use } from "echarts/core"
import { BarChart, PieChart } from "echarts/charts"
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
} from "echarts/components"
import { CanvasRenderer } from "echarts/renderers"

use([
  BarChart,
  PieChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  CanvasRenderer
])

const app =createApp(App);
const pinia = createPinia();
const persist = createPersistedState();
pinia.use(persist)
app.component('v-chart', ECharts) // 注册组件
app.use(router);
app.use(ElementPlus);
app.use(pinia)
app.mount('#app')

