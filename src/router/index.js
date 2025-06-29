import { createRouter, createWebHistory } from 'vue-router'

//导入组件
import LayoutVue from '@/views/Menu.vue'
import TeachingMaterial from '@/views/teaching/TeachingMaterial.vue'
import TeachingVideo from '@/views/teaching/TeachingVideo.vue'
import HomeworkAssignment from '@/views/homework/HomeworkAssignment.vue'
// import MainVue from '@/views/Main.vue'

//定义路由
const routes = [
    //        { path: '/signup', component: MerchantSignupVue },
    {
        path: '/', component: LayoutVue, redirect: '/main', children: [
            //             { path: '/main', component: MainVue },
            { path: 'teachingMaterial', component: TeachingMaterial },
            { path: 'teachingVideo', component: TeachingVideo },
            { path: 'homeworkAssignment', component: HomeworkAssignment },
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