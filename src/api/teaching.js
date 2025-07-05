import request from "@/utils/request";
import { useAuthStore } from "@/stores/authStore";
// 获取教学资料列表
export const getTeachingMaterialList = async (username) => {
    console.log("Fetching teaching material list with data:", { tUsername: username });
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
        console.log("Adding teaching material with data:", data);
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
        console.log("Updated teaching material response:", response);
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
        console.log("Deleted teaching material response:", response);
        return response;
    } catch (error) {
        console.error("Error deleting teaching material:", error);
        throw error;
    }
}