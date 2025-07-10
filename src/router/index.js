import { createRouter, createWebHistory } from 'vue-router'

//导入组件
import Register from '@/views/user/Register.vue'
import Login from '@/views/user/Login.vue'
import FaceLogin from '@/views/user/FaceLogin.vue'
import LayoutVue from '@/views/Menu.vue'
import MainVue from '@/views/Main.vue'
import TeachingMaterial from '@/views/teaching/TeachingMaterial.vue'
import TeachingVideo from '@/views/teaching/TeachingVideo.vue'
import AITeaching from '@/views/teaching/AITeaching.vue'
import HomeworkAssignment from '@/views/homework/HomeworkAssignment.vue'
import HomeworkCollection from '@/views/homework/HomeworkCollection.vue'
import QuestionBank from '@/views/question/questionBank.vue'
import TestPaper from '@/views/question/testPaper.vue'
import Exam from '@/views/exam/exam.vue'
import TestRecord from '@/views/exam/testRecord.vue'
import Analysis from '@/views/exam/analysis.vue'
import TeacherProfile from '@/views/user/TeacherProfile.vue'
import TeacherAccount from '@/views/account/TeacherAccount.vue'
import live from '@/views/online/live.vue'
import liveRecord from '@/views/online/liveRecord.vue'

//定义路由
const routes = [
    { path: '/register', component: Register },
    { path: '/login', component: Login },
    { path: '/faceLogin', component: FaceLogin },
    {
        path: '/', component: LayoutVue, redirect: '/main', children: [
            { path: '/main', component: MainVue },
            { path: 'teachingMaterial', component: TeachingMaterial },
            { path: 'teachingVideo', component: TeachingVideo },
            { path: 'aiTeaching', component: AITeaching },
            { path: 'homeworkAssignment', component: HomeworkAssignment },
            { path: 'homeworkCollection', component: HomeworkCollection },
            { path: 'questionBank', component: QuestionBank },
            { path: 'testPaper', component: TestPaper },
            { path: 'exam', component: Exam },
            { path: 'testRecord', component: TestRecord },
            { path: 'analysis', component: Analysis },
            { path: 'teacherProfile', component: TeacherProfile },
            { path: 'teacherAccount', component: TeacherAccount },
            { path: 'live', component: live },
            { path: 'liveRecord', component: liveRecord }

        ]
    }
]

//创建路由
const router = createRouter({
    history: createWebHistory(),
    routes: routes
})

//导出路由
export default router