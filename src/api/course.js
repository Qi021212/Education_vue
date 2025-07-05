import axios from "axios";
import request from "@/utils/request";
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

// 获取教师对应课程列表
export const getTeacherCourseList = async (data) => {
    try {
        console.log("Fetching teacher course list with token:", data);
        const response = await request.get('/CourseCategories/teacherCourse',
            {
                params: {
                    token: data // 使用token作为参数
                },
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }
        );
        return response.data;
    } catch (error) {
        console.error("Error fetching teacher course list:", error);
        throw error;
    }
}