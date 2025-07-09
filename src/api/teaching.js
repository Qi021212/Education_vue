import request from "@/utils/request";
import { useAuthStore } from "@/stores/authStore";
import axios from "axios";

// 获取教学资料列表
export const getTeachingMaterialList = async (username) => {
    try {
        const response = await request.post('courseMaterial/lists', {  // 改为POST
            tUsername: username  // 作为请求体发送
        });
        return response.data;
    } catch (error) {
        console.error("Error fetching teaching material list:", error);
        throw error;
    }
}

// 新增教学资料
export const addTeachingMaterial = async (data) => {
    try {
        const response = await request.post('courseMaterial/add', data,
            {
                params: {
                    token: useAuthStore().token
                },
            }
        );
        return response;
    } catch (error) {
        console.error("Error adding teaching material:", error);
        throw error;
    }
}

// 修改教学资料
export const updateTeachingMaterial = async (data) => {
    try {
        const response = await request.post('courseMaterial/update', data,
            {
                params: {
                    token: useAuthStore().token
                },
            }
        );
        return response;
    } catch (error) {
        console.error("Error updating teaching material:", error);
        throw error;
    }
}

// 删除教学资料
export const deleteTeachingMaterial = async (ids) => {
    try {
        const response = await request.post('courseMaterial/delete', ids);
        return response;
    } catch (error) {
        console.error("Error deleting teaching material:", error);
        throw error;
    }
}

// 获取教学视频列表
export const getTeachingVideoList = async (username) => {
    try {
        const response = await request.post('courseVideo/lists', null,
            {
                params: {
                    tUsername: username
                }
            });
        return response.data;
    } catch (error) {
        console.error("Error fetching teaching video list:", error);
        throw error;
    }
}

// 新增教学视频
export const addTeachingVideo = async (data) => {
    try {
        console.log("Adding teaching video with data:", data);
        const response = await request.post('courseVideo/add', data,
            {
                params: {
                    token: useAuthStore().token
                },
            }
        );
        return response;
    } catch (error) {
        console.error("Error adding teaching video:", error);
        throw error;
    }
}

// 修改教学视频
export const updateTeachingVideo = async (data) => {
    try {
        const response = await request.post('courseVideo/update', data,
            {
                params: {
                    token: useAuthStore().token
                },
            }
        );
        console.log("Updated teaching video response:", response);
        return response;
    } catch (error) {
        console.error("Error updating teaching video:", error);
        throw error;
    }
}

// 删除教学视频
export const deleteTeachingVideo = async (ids) => {
    try {
        const response = await request.post('courseVideo/delete', ids);
        console.log("Deleted teaching video response:", response);
        return response;
    } catch (error) {
        console.error("Error deleting teaching video:", error);
        throw error;
    }
}

// AI智能备课
export const aiPrepareLesson = async (data) => {
    try {
        const response = await axios.post('/smartEdu/api/ai-teacher/generate-plan', null,
            {
                params: {
                    subject: data.subject,
                    grade: data.grade,
                    topic: data.topic,
                    token: useAuthStore().token
                },
            }
        );
        return response.data;
    } catch (error) {
        console.error("Error in AI prepare lesson:", error);
        throw error;
    }
}

// 获取AI备课历史记录
export const getAIPlanHistory = async () => {
    try {
        const response = await request({
            url: '/api/ai-teacher/history',
            method: 'get',
            params: {
                token: useAuthStore().token
            }
        });
        return response.data;
    } catch (error) {
        console.error("Error fetching AI plan history:", error);
        throw error;
    }
}
// 一键清空AI备课历史记录
export const clearAIPlanHistory = async () => {
    try {
        const response = await request({
            url: '/api/ai-teacher/deleteHistory',
            method: 'delete',
            params: {
                token: useAuthStore().token
            }
        });
        return response.data;
    } catch (error) {
        console.error("Error clearing AI plan history:", error);
        throw error;
    }
}