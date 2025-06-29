<template>
    <el-container class="layout-container">
        <!-- 顶部导航栏 -->
        <el-header class="header">
            <div class="header-left">
                <el-icon class="collapse-icon" @click="toggleCollapse">
                    <component :is="isCollapse ? Expand : Fold" />
                </el-icon>
                <h3>教师中心系统</h3>
            </div>

            <div class="header-right">
                <el-avatar :size="40" src="https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png" />
                <el-link :underline="false" :icon="CircleClose" @click="handleLogout">
                    退出登录
                </el-link>
            </div>
        </el-header>

        <el-container style="margin-top: 60px; height: calc(100vh - 60px);">
            <!-- 侧边栏菜单 -->
            <el-aside :width="isCollapse ? '64px' : '200px'" class="aside">
                <el-menu :default-active="route.path" :collapse="isCollapse" :collapse-transition="false" class="menu"
                    router background-color="#6AAB9C" text-color="#ffffff" active-text-color="#FFE4C7"
                    :unique-opened="true">
                    <template v-for="menu in menus" :key="menu.title">
                        <el-sub-menu v-if="menu.children" :index="menu.title">
                            <template #title>
                                <el-icon>
                                    <component :is="menu.icon" />
                                </el-icon>
                                <span>{{ menu.title }}</span>
                            </template>
                            <el-menu-item v-for="item in menu.children" :key="item.path" :index="item.path">
                                {{ item.title }}
                            </el-menu-item>
                        </el-sub-menu>

                        <el-menu-item v-else :index="menu.path">
                            <el-icon>
                                <component :is="menu.icon" />
                            </el-icon>
                            <span>{{ menu.title }}</span>
                        </el-menu-item>
                    </template>
                </el-menu>
            </el-aside>

            <!-- 主内容区 -->
            <el-main class="main">
                <router-view />
            </el-main>
        </el-container>
    </el-container>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import {
    ElContainer, ElHeader, ElMain, ElAside, ElMenu,
    ElMenuItem, ElSubMenu, ElAvatar, ElMessageBox,
    ElIcon
} from 'element-plus'
import {
    House, Document, Collection, Files, CircleClose, DocumentChecked,
    Fold, Expand
} from '@element-plus/icons-vue'

const router = useRouter()
const route = useRouter().currentRoute.value
const isCollapse = ref(false)

// 菜单数据
const menus = ref([
    {
        title: '主页',
        icon: House,
        path: '/main'
    },
    {
        title: '教学管理',
        icon: Collection,
        children: [
            { title: '教学资料', path: '/teachingMaterial' },
            { title: '教学视频', path: '/teachingVideo' }
        ]
    },
    {
        title: '作业管理',
        icon: Files,
        children: [
            { title: '作业发布记录', path: '/homeworkAssignment' },
            { title: '作业收取情况', path: '/homeworkCollection' },
        ]
    },
    {
        title: '试题管理',
        icon: Document,
        children: [
            { title: '题库管理', path: '/questionBank' },
            { title: '试卷管理', path: '/testPaper' }
        ]
    },
    {
        title: '考试管理',
        icon: DocumentChecked,
        children: [
            { title: '在线考试', path: '/exam' },
            { title: '测试记录', path: '/testRecord' },
            { title: '成绩分析', path: '/analysis' }
        ]
    }
])

// 退出登录
const handleLogout = () => {
    ElMessageBox.confirm('确定要退出登录吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
    }).then(() => {
        router.push('/login')
    })
}

// 切换菜单折叠
const toggleCollapse = () => {
    isCollapse.value = !isCollapse.value
}
</script>

<style scoped>
.layout-container {
    height: 100vh;
    display: flex;
    flex-direction: column;
}

.header {
    position: fixed;
    z-index: 1000;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    background-color: #6AAB9C;
    color: #fff;
    padding: 0 20px;
}

.header-left {
    display: flex;
    align-items: center;
}

.collapse-icon {
    margin-right: 15px;
    font-size: 20px;
    cursor: pointer;
}

.header-right {
    display: flex;
    align-items: center;
}

.header-right .el-avatar {
    margin-right: 15px;
}

.header-right .el-link {
    color: #fff;
}

.aside {
    background-color: #6AAB9C;
    transition: width 0.3s;
}

.menu {
    border-right: none;
    height: 100%;
}

.main {
    background-color: #f0f2f5;
    padding: 20px;
}

/* 响应式布局 */
@media (max-width: 768px) {
    .aside {
        position: fixed;
        z-index: 1001;
        height: 100vh;
    }

    .main {
        margin-left: 64px;
    }
}
</style>