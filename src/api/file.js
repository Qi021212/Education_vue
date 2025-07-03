import axios from "axios";
//处理文件上传
export const uploadFile = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    console.log("上传的文件:", file);

    try {
        const response = await axios.post('/smartEdu/file/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    } catch (error) {
        console.error("文件上传失败:", error);
        throw error;
    }
};