<template>
    <el-dialog v-model="dialogVisible" title="人脸录入" width="600px" :before-close="handleClose">
        <div class="face-registration-container">
            <!-- 步骤指示器 -->
            <el-steps :active="activeStep" finish-status="success" simple>
                <el-step title="准备" />
                <el-step title="拍照" />
                <el-step title="完成" />
            </el-steps>

            <!-- 提示信息 -->
            <div class="tips-container" v-if="activeStep < 2">
                <el-alert :title="currentTip.title" :type="currentTip.type" :closable="false">
                    {{ currentTip.message }}
                </el-alert>
            </div>

            <!-- 第一步：准备拍照 -->
            <div v-if="activeStep === 0" class="prepare-step">
                <div class="prepare-content">
                    <el-icon :size="40" color="#409EFF">
                        <Camera />
                    </el-icon>
                    <h3>请允许浏览器访问您的摄像头</h3>
                    <p>1. 点击下方"开始拍照"按钮</p>
                    <p>2. 在弹出的权限请求中选择"允许"</p>
                    <p>3. 确保您的面部清晰可见</p>
                </div>
                <el-button type="primary" @click="nextStep">开始拍照</el-button>
            </div>

            <!-- 第二步：拍照 -->
            <div v-if="activeStep === 1">
                <div v-if="!capturedImage" class="camera-container">
                    <video ref="video" autoplay playsinline class="camera-feed"></video>
                    <canvas ref="canvas" class="capture-canvas" style="display: none;"></canvas>
                    <el-button type="primary" @click="captureImage" class="capture-btn">拍照</el-button>
                </div>

                <div v-else class="preview-container">
                    <img :src="capturedImage" alt="Captured" class="preview-image">
                    <div class="preview-tips">
                        <el-icon color="#E6A23C">
                            <Warning />
                        </el-icon>
                        <span>请检查照片是否清晰，面部是否完整显示</span>
                    </div>
                    <div class="preview-actions">
                        <el-button @click="retakePhoto">重拍</el-button>
                        <el-button type="primary" @click="submitFaceRegistration">确认提交</el-button>
                    </div>
                </div>
            </div>

            <!-- 第三步：完成 -->
            <div v-if="activeStep === 2" class="complete-step">
                <el-result icon="success" title="人脸录入成功" subTitle="您的人脸信息已成功录入系统">
                    <template #extra>
                        <el-button type="primary" @click="closeDialog">完成</el-button>
                    </template>
                </el-result>
            </div>

            <div v-if="loading" class="loading-overlay">
                <el-icon class="loading-icon">
                    <Loading />
                </el-icon>
                <span>正在上传人脸信息...</span>
            </div>
        </div>
    </el-dialog>
</template>

<script setup>
import { ref, computed, onBeforeUnmount } from 'vue'
import { ElMessage } from 'element-plus'
import { Loading, Camera, Warning } from '@element-plus/icons-vue'
import { registerFace } from '@/api/user'

const dialogVisible = ref(false)
const video = ref(null)
const canvas = ref(null)
const capturedImage = ref(null)
const loading = ref(false)
const stream = ref(null)
const activeStep = ref(0)

const tips = [
    {
        step: 0,
        title: '拍照准备',
        type: 'info',
        message: '请确保您处于光线良好的环境中，正对摄像头并保持面部清晰可见'
    },
    {
        step: 1,
        title: '拍照提示',
        type: 'info',
        message: '请保持面部在画面中央，点击拍照按钮进行拍摄'
    }
]

const currentTip = computed(() => {
    return tips.find(tip => tip.step === activeStep.value) || tips[0]
})

const emit = defineEmits(['registration-success'])

const openDialog = () => {
    dialogVisible.value = true
    activeStep.value = 0
}

const nextStep = () => {
    if (activeStep.value === 0) {
        startCamera()
    }
    activeStep.value++
}

const handleClose = (done) => {
    stopCamera()
    resetCapture()
    done()
}

const closeDialog = () => {
    dialogVisible.value = false
    stopCamera()
    resetCapture()
    activeStep.value = 0
}

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

const stopCamera = () => {
    if (stream.value) {
        stream.value.getTracks().forEach(track => track.stop())
        stream.value = null
    }
}

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

const retakePhoto = () => {
    resetCapture()
    startCamera()
}

const resetCapture = () => {
    capturedImage.value = null
}

const submitFaceRegistration = async () => {
    if (!capturedImage.value) {
        ElMessage.warning('请先拍摄照片');
        return;
    }

    loading.value = true;

    try {
        // Base64 转 Blob
        const blob = await fetch(capturedImage.value).then(res => res.blob());
        const file = new File([blob], 'face.jpg', { type: blob.type });

        // 提交
        const formData = new FormData();
        formData.append('file', file);
        const res = await registerFace(formData);

        if (res.code === 200) {
            activeStep.value = 2;
            emit('registration-success');
        }
    } catch (err) {
        ElMessage.error(`上传失败: ${err.message}`);
    } finally {
        loading.value = false;
    }
};

onBeforeUnmount(() => {
    stopCamera()
})

defineExpose({
    openDialog
})
</script>

<style scoped>
/* 步骤条样式 */
.el-steps {
    margin-bottom: 20px;
}

/* 提示信息容器 */
.tips-container {
    margin: 15px 0;
}

/* 准备步骤样式 */
.prepare-step {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 300px;
    gap: 20px;
}

.prepare-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    text-align: center;
    color: var(--el-text-color-regular);
}

/* 相机容器样式 */
.camera-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 15px;
    margin-top: 20px;
}

.camera-feed {
    width: 100%;
    max-height: 400px;
    background-color: #000;
    border-radius: 4px;
}

.capture-btn {
    margin-top: 15px;
}

/* 预览容器样式 */
.preview-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 15px;
}

.preview-image {
    max-width: 100%;
    max-height: 400px;
    border-radius: 4px;
    border: 2px solid var(--el-color-primary);
}

.preview-actions {
    display: flex;
    gap: 15px;
    margin-top: 15px;
}

.preview-tips {
    display: flex;
    align-items: center;
    gap: 5px;
    color: var(--el-color-warning);
    margin-top: 10px;
}

/* 完成步骤样式 */
.complete-step {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 300px;
}

/* 加载遮罩样式 */
.loading-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(255, 255, 255, 0.7);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 10px;
}

.loading-icon {
    font-size: 24px;
    animation: rotate 2s linear infinite;
}

@keyframes rotate {
    from {
        transform: rotate(0deg);
    }

    to {
        transform: rotate(360deg);
    }
}
</style>