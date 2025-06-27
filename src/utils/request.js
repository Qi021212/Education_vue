import axios from 'axios';
import { ElMessage } from 'element-plus';
// import { useTokenStore } from '@/stores/token.js';
import router from '@/router';

// 配置 baseURL
const baseURL = '/api';// 本地开发环境代理到后端服务地址
const instance = axios.create({ baseURL });

// // 请求拦截器
// instance.interceptors.request.use(
//     (config) => {
//         const tokenStore = useTokenStore();
//         if (tokenStore.token) {
//             config.headers.Authorization = tokenStore.token;
//         }
//         return config;
//     },
//     (err) => {
//         return Promise.reject(new Error(err));
//     }
// );

// 响应拦截器
instance.interceptors.response.use(
    (result) => {
        return result.data;
        // if (result.data.code === 200) {
        //     return result.data;
        // }
        // ElMessage.error({
        //     message: result.data.msg ? result.data.msg : '服务异常',
        //     duration: 3000,
        // });
        // return Promise.reject(new Error(result.data.msg || '服务异常'));
    },
    (err) => {
        alert('服务异常');
        return Promise.reject(new Error(err));
        // if (err.response && err.response.status === 401) {
        //     ElMessage.error('请先登录');
        //     router.push('/login');
        // } else {
        //     ElMessage.error(err.message || '服务异常');
        // }
        // return Promise.reject(new Error(err));
    }
);

export default instance;