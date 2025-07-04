import axios from "axios";
// 获取全部课程列表
export const getCourseList = async () => {
    try {
        const response = await axios.get('/smartEdu/CourseCategories/list');
        return response.data;
    } catch (error) {
        console.error("Error fetching course list:", error);
        throw error;
    }
}