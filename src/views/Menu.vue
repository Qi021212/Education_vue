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
                <el-dropdown @command="handleCommand">
                    <div class="user-info">
                        <el-avatar :size="40" :src="avatarPath" />
                        <span class="user-name">{{ userInfo.t_name }}</span>
                    </div>
                    <template #dropdown>
                        <el-dropdown-menu>
                            <el-dropdown-item command="profile">
                                <el-icon>
                                    <User />
                                </el-icon>
                                个人信息
                            </el-dropdown-item>
                            <el-dropdown-item divided command="logout">
                                <el-icon>
                                    <CircleClose />
                                </el-icon>
                                退出登录
                            </el-dropdown-item>
                        </el-dropdown-menu>
                    </template>
                </el-dropdown>
            </div>
        </el-header>

        <el-container style="margin-top: 60px; height: calc(100vh - 60px);">
            <!-- 侧边栏菜单 -->
            <el-aside :width="isCollapse ? '64px' : '200px'" class="aside">
                <el-menu :default-active="route.path" :collapse="isCollapse" :collapse-transition="false" class="menu"
                    router background-color="#6AAB9C" text-color="#ffffff" active-text-color="#FFE4C7"
                    :unique-opened="true">
                    <template v-for="menu in filteredMenus" :key="menu.title">
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
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import {
    ElContainer, ElHeader, ElMain, ElAside, ElMenu,
    ElMenuItem, ElSubMenu, ElAvatar, ElMessageBox,
    ElIcon, ElDropdown, ElDropdownMenu, ElDropdownItem
} from 'element-plus'
import {
    House, Document, Collection, Files, CircleClose, DocumentChecked,
    Fold, Expand, User,
    UserFilled
} from '@element-plus/icons-vue'

import { useAuthStore } from '@/stores/authStore'
const userInfo = useAuthStore().userInfo
const avatarPath = userInfo.avatar

const router = useRouter()
const route = useRouter().currentRoute.value
const isCollapse = ref(false)

// 菜单数据
const menus = ref([
    {
        title: '主页',
        icon: House,
        path: '/main',
        roles: ['teacher', 'assistant', 'admin']
    },
    {
        title: '教学管理',
        icon: Collection,
        roles: ['teacher', 'admin'],
        children: [
            { title: '教学资料', path: '/teachingMaterial', roles: ['teacher', 'admin'] },
            { title: '教学视频', path: '/teachingVideo', roles: ['teacher', 'admin'] },
            { title: 'AI智能备课', path: '/aiTeaching', roles: ['teacher'] }
        ]
    },
    {
        title: '作业管理',
        icon: Files,
        roles: ['teacher', 'assistant'],
        children: [
            { title: '作业发布记录', path: '/homeworkAssignment', roles: ['teacher', 'assistant'] },
            { title: '作业收取情况', path: '/homeworkCollection', roles: ['teacher', 'assistant'] },
        ]
    },
    {
        title: '试题管理',
        icon: Document,
        roles: ['teacher'],
        children: [
            { title: '题库管理', path: '/questionBank', roles: ['teacher'] },
            { title: '试卷管理', path: '/testPaper', roles: ['teacher'] }
        ]
    },
    {
        title: '考试管理',
        icon: DocumentChecked,
        roles: ['teacher', 'assistant'],
        children: [
            { title: '在线考试', path: '/exam', roles: ['teacher'] },
            { title: '测试记录', path: '/testRecord', roles: ['teacher', 'assistant'] },
            { title: '成绩分析', path: '/analysis', roles: ['teacher', 'assistant'] }
        ]
    },
    {
        title: '账号管理',
        icon: User,
        roles: ['admin', 'teacher'],
        children: [
            { title: '教师账号', path: '/teacherAccount', roles: ['admin','teacher'] },
            { title: '学生账号', path: '/studentAccount', roles: ['admin'] }
        ]

    },
    {
        title:'教学直播',
        icon: UserFilled,
        roles: ['teacher', 'assistant'],
        children: [
            { title: '在线直播', path: '/live', roles: ['teacher', 'assistant'] },
            { title: '直播记录', path: '/liveRecord', roles: ['teacher', 'assistant'] }
        ]
    }
])

// 根据角色过滤菜单
const filterMenusByRole = (menus, role) => {
    return menus.filter(menu => {
        if (menu.roles && !menu.roles.includes(role)) {
            return false;
        }
        if (menu.children) {
            menu.children = filterMenusByRole(menu.children, role);
            return menu.children.length > 0;
        }
        return true;
    });
};

const filteredMenus = computed(() => {
    return filterMenusByRole(menus.value, userInfo.role);
});

// 处理下拉菜单命令
const handleCommand = (command) => {
    if (command === 'logout') {
        handleLogout()
    } else if (command === 'profile') {
        router.push('/teacherProfile')
    }
}

// 退出登录
const handleLogout = () => {
    ElMessageBox.confirm('确定要退出登录吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
    }).then(() => {
        useAuthStore().logout()
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

.user-info {
    display: flex;
    align-items: center;
    cursor: pointer;
}

.user-name {
    margin-left: 10px;
    font-size: 14px;
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