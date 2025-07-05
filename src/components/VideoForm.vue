<template>
    <el-dialog v-model="visible" :title="title" width="50%">
        <el-form ref="formRef" :model="formData" :rules="rules" label-width="120px">
            <el-form-item label="标题" prop="title">
                <el-input v-model="formData.title" placeholder="请输入标题" />
            </el-form-item>
            <el-form-item label="课程类别" prop="course">
                <el-select v-model="formData.course" placeholder="请选择课程类别" style="width: 100%">
                    <el-option v-for="item in categories" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
            </el-form-item>
            <el-form-item label="封面">
                <el-upload class="avatar-uploader" action="#" :show-file-list="false" :on-change="handlePictureUpload"
                    :auto-upload="false">
                    <img v-if="formData.cover" :src="formData.cover" class="avatar" />
                    <el-icon v-else class="avatar-uploader-icon">
                        <Plus />
                    </el-icon>
                </el-upload>
            </el-form-item>
            <el-form-item label="教学视频" prop="video">
                <el-upload class="upload-demo" action="#" :limit="1" :on-change="handleVideoUpload"
                    :auto-upload="false">
                    <el-button type="primary">点击上传</el-button>
                    <template #tip>
                        <div class="el-upload__tip">请上传MP4格式的教学视频</div>
                    </template>
                </el-upload>
            </el-form-item>
            <el-form-item label="内容" prop="intro">
                <el-input v-model="formData.intro" type="textarea" :rows="5" placeholder="请输入内容描述" />
            </el-form-item>
        </el-form>
        <template #footer>
            <span class="dialog-footer">
                <el-button @click="visible = false">取消</el-button>
                <el-button type="primary" @click="submitForm"> 确认 </el-button>
            </span>
        </template>
    </el-dialog>
</template>

<script setup>
import { ref, reactive, watch } from 'vue'
import { Plus } from '@element-plus/icons-vue'

const props = defineProps({
    modelValue: Boolean,
    title: String,
    formData: Object,
    categories: Array
})

const emit = defineEmits(['update:modelValue', 'submit'])

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
    title: [{ required: true, message: '标题不能为空', trigger: 'blur' }],
    course: [{ required: true, message: '请选择课程类别', trigger: 'change' }],
    video: [{ required: true, message: '请上传教学视频', trigger: 'change' }],
    intro: [{ required: true, message: '内容不能为空', trigger: 'blur' }]
})

import { uploadFile } from '@/api/file'
// 处理图片上传
const handlePictureUpload = (file) => {
  uploadFile(file.raw)
    .then((response) => {
      const newFormData = { ...props.formData, cover: response.url };
      emit('update:formData', newFormData);
    })
    .catch((error) => {
      console.error('图片上传错误:', error);
      ElMessage.error('图片上传失败');
    });
}

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
        }
    })
}
</script>

<style scoped>
.avatar-uploader :deep(.el-upload) {
    border: 1px dashed #d9d9d9;
    border-radius: 6px;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    transition: var(--el-transition-duration-fast);
}

.avatar-uploader :deep(.el-upload:hover) {
    border-color: var(--el-color-primary);
}

.avatar-uploader-icon {
    font-size: 28px;
    color: #8c939d;
    width: 148px;
    height: 148px;
    line-height: 148px;
    text-align: center;
}

.avatar {
    width: 148px;
    height: 148px;
    display: block;
}
</style>