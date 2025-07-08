import axios from "axios";
// 获取声网token
export const getAgoraToken = async (channelName,userId,role) => {
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