import request from '@/utils/request.js'

// 管理员登录
export const adminLogin = (data) => {
    return request({
        url: '/users/login',
        method: 'post',
        data
    })
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

// 教师注册
export const teacherRegister = (data) => {
    return request({
        url: '/teacher/register',
        method: 'post',
        data
    })
}
