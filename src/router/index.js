import { createRouter, createWebHistory } from 'vue-router'

//导入组件
import Register from '@/views/user/Register.vue'
import Login from '@/views/user/Login.vue'
import LayoutVue from '@/views/Menu.vue'
import MainVue from '@/views/Main.vue'
import TeachingMaterial from '@/views/teaching/TeachingMaterial.vue'
import TeachingVideo from '@/views/teaching/TeachingVideo.vue'
import HomeworkAssignment from '@/views/homework/HomeworkAssignment.vue'
import HomeworkCollection from '@/views/homework/HomeworkCollection.vue'
import TeacherProfile from '@/views/user/TeacherProfile.vue'

//定义路由
const routes = [
    { path: '/register', component: Register },
    { path: '/login', component: Login },
    {
        path: '/', component: LayoutVue, redirect: '/main', children: [
            { path: '/main', component: MainVue },
            { path: 'teachingMaterial', component: TeachingMaterial },
            { path: 'teachingVideo', component: TeachingVideo },
            { path: 'homeworkAssignment', component: HomeworkAssignment },
            { path: 'homeworkCollection', component: HomeworkCollection },
            { path: 'teacherProfile', component: TeacherProfile }

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