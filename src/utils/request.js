import axios from 'axios'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/authStore'

// 创建axios实例
const request = axios.create({
    baseURL: '/smartEdu', // 基础URL
    timeout: 10000,// 请求超时时间
})

// 请求拦截器
request.interceptors.request.use(
    config => {
        const authStore = useAuthStore()

        // 如果已登录，添加Authorization头
        if (authStore.token) {
            config.headers['Authorization'] = `Bearer ${authStore.token}`
        }
        return config
    },
    error => {
        return Promise.reject(error)
    }
)

// 响应拦截器
request.interceptors.response.use(
    response => {
        const res = response.data

        // 如果响应中包含code且不为200，视为错误
        if (res.code && res.code !== 200) {
            const error = new Error(res.message || res.msg || '请求失败')
            error.code = res.code
            error.response = response
            return Promise.reject(error)
        }

        return res
    },
    error => {
        // 处理HTTP错误
        if (error.response) {
            switch (error.response.status) {
                case 400:
                    error.message = '请求参数错误'
                    break
                case 401:
                    error.message = '登录已过期，请重新登录'
                    // 触发登出逻辑
                    const authStore = useAuthStore()
                    authStore.logout()
                    break
                case 403:
                    error.message = '没有权限访问此资源'
                    break
                case 404:
                    error.message = '请求的资源不存在'
                    break
                case 500:
                    error.message = '服务器内部错误'
                    break
                default:
                    error.message = `连接错误 (${error.response.status})`
            }
        } else if (error.request) {
            // 请求已发出但没有收到响应
            error.message = '网络连接失败，请检查您的网络'
        } else {
            // 其他错误
            error.message = error.message || '请求处理失败'
        }

        // 显示错误消息（可根据需要调整）
        if (error.message && !error.config?.hideErrorMessage) {
            ElMessage({
                message: error.message,
                type: 'error',
                duration: 3000
            })
        }

        return Promise.reject(error)
    }
)

export default request