import request from "@/utils/request";

// 获取作业列表
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


// 获取作业详情
export const getHomeworkDetail = async (token, data) => {
    try {
        console.log("Fetching homework detail with data:", data);
        const response = await request.post('/homeworkRecord/list',
            null,
            {
                params: {
                    token: token,
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
