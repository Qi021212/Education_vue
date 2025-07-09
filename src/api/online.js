import axios from "axios";
import request from "@/utils/request";
import { useAuthStore } from "@/stores/authStore";

// 获取声网token
export const getAgoraToken = async (channelName, userId, role) => {
    try {
        const response = await axios({
            url: '/smartEdu/api/token/rtc',
            method: 'get',
            params: {
                channelName: channelName,
                userId: userId,
                role: role
            }
        });
        console.log("获取声网token成功:", response.data.token);
        return response.data;
    } catch (error) {
        console.error("获取声网token时发生错误:", error);
        throw error;
    }
}

// 获取直播录屏列表
export const getLiveRecordList = async () => {
    try {
        const response = await request.post('/screenVideo/lists');
        console.log("获取直播录屏列表成功:", response.data);
        return response.data;
    } catch (error) {
        console.error("Error fetching live record list:", error);
        throw error;
    }
}

// 新增教学视频
export const addLiveRecord = async (data) => {
    try {
        console.log("Adding teaching video with data:", data);
        const response = await request.post('/screenVideo/add', data,
            {
                params: {
                    token: useAuthStore().token
                },
            }
        );
        return response;
    } catch (error) {
        console.error("Error adding live record:", error);
        throw error;
    }
}

// 修改教学视频
export const updateLiveRecord = async (data) => {
    try {
        const response = await request.post('/screenVideo/update', data);
        console.log("Updated live record response:", response);
        return response;
    } catch (error) {
        console.error("Error updating live record:", error);
        throw error;
    }
}

// 删除教学视频
export const deleteLiveRecord = async (ids) => {
    try {
        const response = await request.post('/screenVideo/delete', ids);
        console.log("Deleted live record response:", response);
        return response;
    } catch (error) {
        console.error("Error deleting live record:", error);
        throw error;
    }
}