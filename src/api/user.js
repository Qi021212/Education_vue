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

// 管理员注册
export const adminRegister = (data,params) => {
    return axios({
        url: '/smartEdu/users/register',
        method: 'post',
        data,
        params
    })
}

// 教师注册
export const teacherRegister = (data,params) => {
    return axios({
        url: '/smartEdu/teacher/register',
        method: 'post',
        data,
        params
    })
}

// 发送邮箱验证码
export const sendEmailCode = (email) => {
  try {
    console.log(email);
        const response = axios.post('/smartEdu/teacher/sendVerificationCode',
            null, // 请求体包含教师信息
            {
                params:{
                    email: email
                }
            }
        );
        console.log(response);
        return response;
    } catch (error) {
        throw new Error(error);
    }
}

// 修改教师密码
export const changeTeacherPassword = async (data) => {
    try {
        const response = await request.post('/teacher/resetPass',
            null, // 请求体为空
            {
                params: {
                    username: data.username,
                    newPassword: data.newPassword,
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

// 修改教师信息
export const updateTeacherInfo = async (data) => {
    try {
        const response = await request.post('/teacher/update',
            data, // 请求体包含教师信息
            {
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );
        return response;
    } catch (error) {
        throw new Error(error);
    }
}

// 修改管理员密码?
export const changeAdminPassword = async (data) => {
    try {
        const response = await request.post('/users/resetPass',
            null, // 请求体为空
            {
                params: {
                    username: data.username,
                    newPassword: data.newPassword,
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


