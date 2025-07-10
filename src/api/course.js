import axios from "axios";
import request from "@/utils/request";
import { useAuthStore } from "@/stores/authStore";

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

// 根据课程查学生
export const getStudentByCourse = async (courseId) => {
    try {
        console.log("Fetching students for course ID:", courseId);
        const response = await request.get('/exam/studentlistbycourse',
            {
                params: {
                    courseId: courseId
                },
            }
        );
        return response.data;
    } catch (error) {
        console.error("Error fetching students by course:", error);
        throw error;
    }
}

// 根据课程查试卷
export const getPaperByCourse = async (courseId) => {
    try {
        console.log("Fetching papers for course ID:", courseId);
        const response = await request.get('/exam/paperlistbycourse',
            {
                params: {
                    courseId: courseId,
                    status: 0,
                    token: useAuthStore().token
                },
            }
        );
        return response.data;
    }
    catch (error) {
        console.error("Error fetching papers by course:", error);
        throw error;
    }
}