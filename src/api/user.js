import request from '@/utils/request.js'
import axios from 'axios';

// 管理员登录
export const adminLogin = async (data) => {
    try {
        const response = await request.post('/users/login',
            null, // 请求体为空
            {
                params: {
                    username: data.username,
                    password: data.password,
                    role: data.role
                },
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }
        );
        return response;
    } catch (error) {
        throw new Error(error);
    }
}

// 教师登录
export const teacherLogin = async (data) => {
    try {
        const response = await request.post('/teacher/login',
            null, // 请求体为空
            {
                params: {
                    username: data.username,
                    password: data.password,
                    role: data.role
                },
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }
        );
        return response;
    } catch (error) {
        throw new Error(error);
    }
};

// 获取教师信息
export const getTeacherInfo = () => {
    return request({
        url: '/teacher/info',
        method: 'get'
    })
}

// 管理员注册
export const adminRegister = (data) => {
    return axios({
        url: '/smartEdu/users/register',
        method: 'post',
        data
    })
}
// 教师注册
export const teacherRegister = (data) => {
    return axios({
        url: '/smartEdu/teacher/register',
        method: 'post',
        data
    })
}
