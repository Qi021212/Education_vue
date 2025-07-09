<template>
    <el-dialog v-model="visible" :title="title" width="50%">
        <el-form ref="formRef" :model="formData" :rules="rules" label-width="120px">
            <el-form-item label="直播标题" prop="title">
                <el-input v-model="formData.title" placeholder="请输入直播标题" />
            </el-form-item>

            <el-form-item label="录屏文件" prop="video">
                <el-upload class="upload-demo" action="#" :limit="1" :on-change="handleVideoUpload" :auto-upload="false"
                    accept="video/*">
                    <el-button type="primary">点击上传</el-button>
                    <template #tip>
                        <div class="el-upload__tip">请上传MP4格式的直播录屏文件</div>
                    </template>
                </el-upload>
                <div v-if="formData.video" class="video-preview">
                    <video v-if="formData.video" :src="formData.video" controls
                        style="max-width: 100%; max-height: 200px; margin-top: 10px;"></video>
                </div>
            </el-form-item>

        </el-form>

        <template #footer>
            <span class="dialog-footer">
                <el-button @click="visible = false">取消</el-button>
                <el-button type="primary" @click="submitForm">确认</el-button>
            </span>
        </template>
    </el-dialog>
</template>

<script setup>
import { ref, reactive, watch } from 'vue'
import { ElMessage } from 'element-plus'

const props = defineProps({
    modelValue: Boolean,
    title: String,
    formData: Object
})

const emit = defineEmits(['update:modelValue', 'submit', 'update:formData'])

const visible = ref(false)
const formRef = ref(null)

watch(
    () => props.modelValue,
    (val) => {
        visible.value = val
    }
)

watch(visible, (val) => {
    emit('update:modelValue', val)
})

const rules = reactive({
    title: [{ required: true, message: '直播标题不能为空', trigger: 'blur' }],
    video: [{ required: true, message: '请上传直播录屏文件', trigger: 'change' }],
    description: [{ required: true, message: '直播描述不能为空', trigger: 'blur' }]
})

import { uploadFile } from '@/api/file'


// 处理视频上传
const handleVideoUpload = (file) => {
    uploadFile(file.raw)
        .then((response) => {
            console.log('视频上传成功:', response);
            const newFormData = { ...props.formData, video: response.url };
            emit('update:formData', newFormData);
        })
        .catch((error) => {
            console.error('视频上传错误:', error);
            ElMessage.error('视频上传失败');
        });
}

const submitForm = () => {
    formRef.value.validate((valid) => {
        if (valid) {
            emit('submit', props.formData)
        } else {
            ElMessage.error('请填写完整信息')
        }
    })
}
</script>

<style scoped>
.upload-demo {
    width: 100%;
}

.video-preview {
    margin-top: 10px;
    border: 1px solid #eee;
    padding: 10px;
    border-radius: 4px;
    background: #f9f9f9;
}
</style>