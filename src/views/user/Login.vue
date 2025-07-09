<template>
    <el-row class="login-page">
        <!-- 背景区域 -->
        <el-col :span="12" class="bg">
            <div class="bg-overlay">
                <h1>iTeach教师中心系统</h1>
                <p>高效管理教学资源，提升教学质量</p>
            </div>
        </el-col>

        <!-- 表单区域 -->
        <el-col :span="12" class="login-form">
            <h2>登录</h2>
            <el-form :model="loginForm" :rules="loginRules" ref="loginFormRef">
                <el-form-item prop="username">
                    <el-input v-model="loginForm.username" placeholder="请输入工号" :prefix-icon="User"></el-input>
                </el-form-item>

                <el-form-item prop="password">
                    <el-input type="password" v-model="loginForm.password" placeholder="请输入密码" :prefix-icon="Lock"
                        show-password></el-input>
                </el-form-item>

                <el-form-item prop="role">
                    <el-radio-group v-model="loginForm.role">
                        <el-radio label="admin">管理员</el-radio>
                        <el-radio label="teacher">教师</el-radio>
                        <el-radio label="assistant">助教</el-radio>
                    </el-radio-group>
                </el-form-item>

                <el-form-item>
                    <el-button type="primary" @click="handleLogin">登录</el-button>
                </el-form-item>

                <el-form-item class="text-center">
                    没有账号？<el-link type="primary" :underline="false" @click="redirectToRegister">立即注册</el-link>
                </el-form-item>
                <el-form-item>
                    <el-button type="text" @click="redirectToFaceLogin">人脸登录</el-button>
                </el-form-item>
            </el-form>
        </el-col>
    </el-row>
</template>

<script setup>
import { ref } from 'vue'
import { User, Lock } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/authStore'

const authStore = useAuthStore()
const router = useRouter()

const loginForm = ref({
    username: '',
    password: '',
    role: 'teacher'
})

const loginFormRef = ref(null)
const loading = ref(false)

const loginRules = {
    role: [
        { required: true, message: '请选择角色', trigger: 'change' }
    ]
}

import { adminLogin, teacherLogin } from '@/api/user.js'
const handleLogin = async () => {
    try {
        loading.value = true
        await loginFormRef.value.validate()
        let response
        if (loginForm.value.role === 'admin') {
            response = await adminLogin(loginForm.value)
        } else {
            response = await teacherLogin(loginForm.value)
        }
        if (response.code === 200) {
            // 登录成功，更新store状态
            authStore.setToken(response.token)
            authStore.login(response.data)
            console.log('登录成功:', response.data)
            // 跳转到首页
            ElMessage.success('登录成功')
            router.push('/main')
        } else {
            ElMessage.error(response.message || '登录失败，请重试')
        }



    } catch (error) {
        ElMessage.error(error.response?.message || error.message)
    } finally {
        loading.value = false
    }
}

const redirectToRegister = () => {
    router.push('/register')
}

const redirectToFaceLogin = () => {
    router.push('/faceLogin')
}
</script>

<style scoped>
.login-page {
    width: 800px;
    height: 550px;
    margin: 100px auto;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 15px;
    overflow: hidden;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.bg {
    background: url('@/assets/images/login-bg.jpg') no-repeat center / cover;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
}

.bg-overlay {
    color: white;
    text-align: center;
    padding: 20px;
    z-index: 2;
}

.bg-overlay h1 {
    font-size: 32px;
    margin-bottom: 10px;
}

.bg-overlay p {
    font-size: 16px;
}

.bg::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.3);
}

.login-form {
    background-color: #fff;
    padding: 40px;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
}

h2 {
    text-align: center;
    font-size: 28px;
    margin-bottom: 30px;
    color: #303133;
}

.el-form-item {
    margin-bottom: 20px;
}

.el-button {
    width: 50%;
    margin-left: 25%;
}

.text-center {
    padding-left: 30%;
    width: 40%;
    margin-top: 10px;
}

.el-radio-group {
    width: 70%;
    margin-left: 15%;
    display: flex;
    justify-content: space-between;
}

@media screen and (max-width: 768px) {
    .login-page {
        width: 100%;
        height: 100%;
        margin: 0;
        flex-direction: column;
    }

    .bg,
    .login-form {
        width: 100%;
        height: auto;
    }

    .bg {
        height: 200px;
    }

    .login-form {
        padding: 20px;
    }
}
</style>