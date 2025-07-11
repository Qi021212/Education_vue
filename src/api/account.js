import request from "@/utils/request";

// 获取教师账户信息
export const getTeacherAccountInfo = async (params = {}) => {
    try {
        const response = await request.post('/teacher/list', params);
        return response.data; // 返回data字段中的数组
    } catch (error) {
        console.error("Error fetching account info:", error);
        throw error;
    }
};

// 获取学生账户信息
export const getStudentAccountInfo = async (params = {}) => {
    try {
        const response = await request.post('/student/list', params);
        return response.data; // 返回data字段中的数组
    } catch (error) {
        console.error("Error fetching account info:", error);
        throw error;
    }
};
