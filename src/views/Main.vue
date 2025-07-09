<template>
    <el-card class="main-container">
        <!-- 欢迎标题 -->
        <div class="welcome-header">
            <div class="weather-card" v-if="weatherData">
                <div class="weather-main">
                    <span class="weather-text">{{ weatherData.weather }}</span>
                    <span class="weather-temp">{{ weatherData.temperature }}°C</span>
                </div>
                <div class="weather-details">
                    <span class="weather-wind">{{ weatherData.winddirection }}风 {{ weatherData.windpower }}级</span>
                    <span class="weather-humidity">湿度 {{ weatherData.humidity }}%</span>
                    <span class="weather-location">{{ weatherData.province }}·{{ weatherData.city }}</span>
                </div>
            </div>
            <h1>欢迎回来，{{ userInfo.t_name }}老师！</h1>
            <p>今天是{{ currentDate }}，{{ weatherTip }}</p>
        </div>

        <!-- 快捷功能入口 -->
        <div class="quick-actions">
            <h2 class="section-title">快捷入口</h2>
            <div class="action-grid">
                <el-card v-for="action in quickActions" :key="action.title" shadow="hover" class="action-card"
                    @click="router.push(action.path)">
                    <div class="action-content">
                        <el-icon :size="36" :color="action.color">
                            <component :is="action.icon" />
                        </el-icon>
                        <span>{{ action.title }}</span>
                    </div>
                </el-card>
            </div>
        </div>

    </el-card>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Document, Files, VideoCamera, EditPen, Notebook, DataLine } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/authStore'

const router = useRouter()
const userInfo = useAuthStore().userInfo

// 当前日期
const currentDate = computed(() => {
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth() + 1
    const day = now.getDate()
    const week = ['日', '一', '二', '三', '四', '五', '六'][now.getDay()]
    return `${year}年${month}月${day}日 星期${week}`
})

// 快捷操作
const quickActions = ref([
    { title: 'AI智能备课', icon: EditPen, path: '/aiTeaching', color: '#67c23a' },
    { title: '发布作业', icon: Files, path: '/homeworkAssignment', color: '#409eff' },
    { title: '在线课堂', icon: VideoCamera, path: '/live', color: '#e6a23c' },
    { title: '题库管理', icon: Notebook, path: '/questionBank', color: '#f56c6c' },
    { title: '教学资料', icon: Document, path: '/teachingMaterial', color: '#909399' },
    { title: '成绩分析', icon: DataLine, path: '/analysis', color: '#67c23a' },
])

// 天气相关状态
const weatherData = ref(null)
const weatherTip = ref('祝您工作愉快！')
const AMAP_KEY = 'c8b38d7a29b6f936cfb7b03adcca3425'

// 获取天气数据
const fetchWeather = async () => {
    try {
        const cityCode = await getCityByIP()

        const url = `https://restapi.amap.com/v3/weather/weatherInfo?key=${AMAP_KEY}&city=${cityCode}&extensions=base`
        const response = await fetch(url)
        const data = await response.json()

        if (data.status === '1' && data.lives?.length > 0) {
            weatherData.value = data.lives[0]
            generateWeatherTip(data.lives[0].weather)
        }
    } catch (error) {
        console.error('获取天气数据失败:', error)
        // 可以在这里设置默认天气数据或错误提示
    }
}

// 通过IP获取城市代码
const getCityByIP = async () => {
    try {
        const ipUrl = `https://restapi.amap.com/v3/ip?key=${AMAP_KEY}`
        const response = await fetch(ipUrl)
        const data = await response.json()
        return data.adcode || '110000' // 默认北京
    } catch (error) {
        console.error('IP定位失败:', error)
        return '110000' // 默认北京
    }
}

// 生成天气提示语
const generateWeatherTip = (weather) => {
    const tips = {
        '晴': '阳光明媚，适合户外活动！',
        '多云': '云量较多，注意适当增减衣物。',
        '阴': '天气阴沉，保持好心情哦！',
        '雨': '记得带伞，雨天路滑注意安全。',
        '雪': '下雪天气，注意保暖防滑。',
        '雾': '雾天能见度低，出行注意安全。',
        '雷阵雨': '可能有雷雨，请注意防范。'
    }
    weatherTip.value = tips[weather] || '祝您工作愉快！'
}

// 组件挂载时获取天气
onMounted(() => {
    fetchWeather()
})

</script>

<style scoped>
.main-container {
    padding: 20px;
    max-width: 1200px;
    margin: 0 auto;
}

.welcome-header {
    margin-bottom: 30px;
    text-align: center;
}

.welcome-header h1 {
    font-size: 28px;
    color: #333;
    margin-bottom: 10px;
}

.welcome-header p {
    font-size: 16px;
    color: #666;
}

.section-title {
    font-size: 20px;
    color: #333;
    margin-bottom: 20px;
    padding-bottom: 10px;
    border-bottom: 1px solid #eee;
}

/* 快捷入口样式 */
.quick-actions {
    margin-bottom: 30px;
}

.action-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 20px;
}

.action-card {
    cursor: pointer;
    transition: transform 0.3s;
}

.action-card:hover {
    transform: translateY(-5px);
}

.action-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 20px 0;
}

.action-content span {
    margin-top: 10px;
    font-size: 16px;
}

.weather-card {
    background-color: rgba(255, 255, 255, 0.9);
    border-radius: 12px;
    padding: 15px;
    margin-bottom: 15px;
    display: flex;
    align-items: center;
    max-width: 300px;
}

.weather-main {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-right: 15px;
}

.weather-icon {
    width: 50px;
    height: 50px;
    margin-bottom: 5px;
}

.weather-temp {
    font-size: 20px;
    font-weight: bold;
    color: #333;
}

.weather-details {
    display: flex;
    flex-direction: column;
}

.weather-text {
    font-size: 24px;
    font-weight: 500;
    color: #333;
    margin-bottom: 3px;
}

.weather-wind,
.weather-humidity {
    font-size: 12px;
    color: #666;
    margin-bottom: 2px;
}

.weather-location {
    font-size: 12px;
    color: #999;
    margin-top: 5px;
}

/* 响应式设计 */
@media (max-width: 768px) {
    .action-grid {
        grid-template-columns: repeat(2, 1fr);
    }

    .weather-card {
        max-width: 100%;
    }
}
</style>