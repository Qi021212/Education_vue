<template>
    <el-row class="login-page">
        <!-- 背景区域 -->
        <el-col :span="12" class="bg">
            <div class="bg-overlay">
                <h1>iTeach教师中心系统</h1>
                <p>高效管理教学资源，提升教学质量</p>
            </div>
        </el-col>

        <!-- 人脸登录表单区域 -->
        <el-col :span="12" class="login-form">
            <h2>人脸登录</h2>
            <div class="face-login-container">
                <!-- 步骤指示器 -->
                <el-steps :active="activeStep" finish-status="success" simple>
                    <el-step title="准备" />
                    <el-step title="拍照" />
                    <el-step title="完成" />
                </el-steps>

                <!-- 第一步：输入工号 -->
                <div v-if="activeStep === 0" class="step-username">
                    <el-form :model="faceForm" :rules="faceRules" ref="faceFormRef">
                        <el-form-item prop="username">
                            <el-input v-model="faceForm.username" placeholder="请输入工号" :prefix-icon="User"
                                clearable></el-input>
                        </el-form-item>
                        <el-button type="primary" @click="validateUsername" :loading="loading">下一步</el-button>
                    </el-form>
                </div>

                <!-- 第二步：人脸拍照 -->
                <div v-if="activeStep === 1" class="step-capture">
                    <div class="camera-container">
                        <video v-show="!capturedImage" ref="video" autoplay playsinline class="camera-feed"></video>
                        <canvas ref="canvas" style="display: none;"></canvas>

                        <div v-if="capturedImage" class="preview-container">
                            <img :src="capturedImage" alt="人脸照片" class="preview-image">
                            <div class="preview-actions">
                                <el-button @click="retakePhoto">重拍</el-button>
                                <el-button type="primary" @click="submitFaceLogin">确认登录</el-button>
                            </div>
                        </div>

                        <el-button v-if="!capturedImage" type="primary" @click="captureImage" class="capture-btn"
                            :loading="loading">拍照</el-button>
                    </div>
                </div>

                <!-- 第三步：登录结果 -->
                <div v-if="activeStep === 2" class="step-result">
                    <el-result :icon="loginResult.icon" :title="loginResult.title" :sub-title="loginResult.subTitle">
                        <template #extra>
                            <el-button type="primary" @click="handleResultAction">{{ loginResult.buttonText
                            }}</el-button>
                        </template>
                    </el-result>
                </div>

                <div class="back-to-login">
                    <el-button type="text" @click="redirectToPasswordLogin">返回账号密码登录</el-button>
                </div>
            </div>
        </el-col>
    </el-row>
</template>

<script setup>
import { ref, onBeforeUnmount } from 'vue'
import { User } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/authStore'
import { loginByFaceApi } from '@/api/user'

const authStore = useAuthStore()
const router = useRouter()

// 表单数据
const faceForm = ref({
    username: ''
})

// 表单验证规则
const faceRules = {
    username: [
        { required: true, message: '请输入工号', trigger: 'blur' },
        { pattern: /^\d+$/, message: '工号必须为数字', trigger: 'blur' }
    ]
}

// 步骤控制
const activeStep = ref(0)
const faceFormRef = ref(null)
const loading = ref(false)

// 摄像头相关
const video = ref(null)
const canvas = ref(null)
const capturedImage = ref(null)
const stream = ref(null)

// 登录结果
const loginResult = ref({
    icon: 'success',
    title: '登录成功',
    subTitle: '正在跳转到首页...',
    buttonText: '立即跳转'
})

// 验证工号
const validateUsername = async () => {
    try {
        await faceFormRef.value.validate()
        loading.value = true
        // 这里可以添加工号验证逻辑（如果需要）
        activeStep.value = 1
        startCamera()
    } catch (error) {
        console.error('验证失败:', error)
    } finally {
        loading.value = false
    }
}

// 启动摄像头
const startCamera = async () => {
    try {
        stream.value = await navigator.mediaDevices.getUserMedia({
            video: {
                width: 500,
                facingMode: 'user'
            },
            audio: false
        })
        video.value.srcObject = stream.value
    } catch (err) {
        console.error('摄像头访问错误:', err)
        ElMessage.error(`无法访问摄像头: ${err.message}`)
        activeStep.value = 0
    }
}

// 拍照
const captureImage = () => {
    const videoElement = video.value
    const canvasElement = canvas.value

    if (videoElement && canvasElement) {
        canvasElement.width = videoElement.videoWidth
        canvasElement.height = videoElement.videoHeight
        const context = canvasElement.getContext('2d')
        context.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height)
        capturedImage.value = canvasElement.toDataURL('image/png')
        stopCamera()
    }
}

// 重拍
const retakePhoto = () => {
    capturedImage.value = null
    startCamera()
}

// 停止摄像头
const stopCamera = () => {
    if (stream.value) {
        stream.value.getTracks().forEach(track => track.stop())
        stream.value = null
    }
}

// 提交人脸登录
const submitFaceLogin = async () => {
    try {
        loading.value = true

        // Base64 转 Blob
        const blob = await fetch(capturedImage.value).then(res => res.blob());
        const file = new File([blob], 'face.jpg', { type: blob.type });
        // 提交
        const formData = new FormData();
        formData.append('file', file);

        // 调用人脸登录接口
        const response = await loginByFaceApi(formData, faceForm.value.username)
        console.log('人脸登录响应:', response)
        if (response.data.code === 200) {
            // 登录成功处理
            authStore.setToken(response.data.token)
            authStore.login(response.data.data)
            loginResult.value = {
                icon: 'success',
                title: '登录成功',
                subTitle: '正在跳转到首页...',
                buttonText: '立即跳转'
            }
            activeStep.value = 2

            // 3秒后自动跳转
            setTimeout(() => {
                router.push('/main')
            }, 3000)
        } else {
            throw new Error(response.message || '人脸登录失败')
        }
    } catch (error) {
        console.error('人脸登录失败:', error)
        ElMessage.error(error.message || '登录失败，请重试')
        activeStep.value = 1
        retakePhoto()
    } finally {
        loading.value = false
    }
}

// 处理结果页按钮
const handleResultAction = () => {
    if (loginResult.value.icon === 'success') {
        router.push('/main')
    } else {
        activeStep.value = 0
    }
}

// 返回密码登录
const redirectToPasswordLogin = () => {
    stopCamera()
    router.push('/login')
}

// 组件卸载时清理摄像头
onBeforeUnmount(() => {
    stopCamera()
})
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

/* 人脸登录特有样式 */
.face-login-container {
    width: 100%;
    height: 100%;
}

.el-steps {
    margin-bottom: 20px;
}

.step-username,
.step-capture,
.step-result {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 300px;
}

.camera-container {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
}

.camera-feed {
    width: 100%;
    max-width: 400px;
    border-radius: 4px;
    background-color: #000;
}

.preview-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
}

.preview-image {
    max-width: 100%;
    max-height: 300px;
    border-radius: 4px;
    border: 1px solid #dcdfe6;
}

.preview-actions {
    display: flex;
    gap: 20px;
}

.capture-btn {
    width: 200px;
}

.back-to-login {
    margin-top: 20px;
    text-align: center;
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