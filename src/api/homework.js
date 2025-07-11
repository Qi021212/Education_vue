import request from "@/utils/request";
import { useAuthStore } from "@/stores/authStore";

// 获取收取作业列表
export const getHomeworkList = async (token) => {
    try {
        const response = await request.post('/homeworkRecord/selectHomework',
            null,
            {
                params: {
                    token: token
                }
            }
        );
        return response.data;
    } catch (error) {
        console.error("Error fetching homework list:", error);
        throw error;
    }
}

// 获取收取作业详情
export const getHomeworkDetail = async (data) => {
    try {
        console.log("Fetching homework detail with data:", data);
        const response = await request.post('/homeworkRecord/lists',
            null,
            {
                params: {
                    sUsername: data.sUsername,
                    paperid: data.homeworkId,
                }
            }
        );
        return response.data;
    } catch (error) {
        console.error("Error fetching homework detail:", error);
        throw error;
    }
}


// 查询发布作业列表
export const getPublishedHomeworkList = async () => {
    try {
        const response = await request.post('/courseHomework/lists',
            null,
            {
                params: {
                    token: useAuthStore().token
                }
            }
        );
        console.log("Fetched published homework list:", response.data);
        return response.data;
    } catch (error) {
        console.error("Error fetching published homework list:", error);
        throw error;
    }
}

// 发布作业
export const publishHomework = async (data) => {
    try {
        console.log("Publishing homework with data:", data);
        const response = await request.post('/exam/create',
            data,
            {
                params: {
                    token: useAuthStore().token
                }
            }
        );
        return response.data;
    }
    catch (error) {
        console.error("Error publishing homework:", error);
        throw error;
    }
}

// 编辑作业
export const updateHomework = async (data) => {
    try {
        console.log("Editing homework with data:", data);
        const response = await request.post('/courseHomework/update',
            data,
            {
                params: {
                    token: useAuthStore().token
                }
            }
        );
        return response.data;
    } catch (error) {
        console.error("Error editing homework:", error);
        throw error;
    }
}

// 查询作业中的题目
export const getHomeworkQuestions = async (data) => {
    try {
        console.log("Fetching homework questions with data:", data);
        const response = await request.post('/courseHomeworkQuestion/lists',
            null,
            {
                params: {
                    paperid: data.paperid,
                    tUsername: data.tUsername,
                }
            }
        );
        return response.data;
    } catch (error) {
        console.error("Error fetching homework questions:", error);
        throw error;
    }
}

