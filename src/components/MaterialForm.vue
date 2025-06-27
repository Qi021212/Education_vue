<template>
  <el-dialog v-model="visible" :title="title" width="50%">
    <el-form ref="formRef" :model="formData" :rules="rules" label-width="120px">
      <el-form-item label="标题" prop="title">
        <el-input v-model="formData.title" placeholder="请输入标题" />
      </el-form-item>
      <el-form-item label="课程类别" prop="category">
        <el-select v-model="formData.category" placeholder="请选择课程类别" style="width: 100%">
          <el-option v-for="item in categories" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="图片">
        <el-upload class="avatar-uploader" action="/api/upload/image" :show-file-list="false"
          :on-success="handleImageSuccess" :before-upload="beforeImageUpload">
          <img v-if="formData.image" :src="formData.image" class="avatar" />
          <el-icon v-else class="avatar-uploader-icon">
            <Plus />
          </el-icon>
        </el-upload>
      </el-form-item>
      <el-form-item label="附件">
        <el-upload class="upload-demo" action="/api/upload/file" :limit="1" :on-success="handleAttachmentSuccess"
          :file-list="formData.attachment ? [formData.attachment] : []">
          <el-button type="primary">点击上传</el-button>
          <template #tip>
            <div class="el-upload__tip">请上传教学资料附件</div>
          </template>
        </el-upload>
      </el-form-item>
      <el-form-item label="内容" prop="content">
        <el-input v-model="formData.content" type="textarea" :rows="5" placeholder="请输入内容" />
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
  category: [{ required: true, message: '请选择课程类别', trigger: 'change' }],
  content: [{ required: true, message: '内容不能为空', trigger: 'blur' }]
})

const handleImageSuccess = (response, file) => {
  props.formData.image = URL.createObjectURL(file.raw)
}

const beforeImageUpload = (file) => {
  const isImage = file.type.startsWith('image/')
  const isLt2M = file.size / 1024 / 1024 < 2

  if (!isImage) {
    ElMessage.error('上传文件必须是图片格式!')
  }
  if (!isLt2M) {
    ElMessage.error('上传图片大小不能超过 2MB!')
  }
  return isImage && isLt2M
}

const handleAttachmentSuccess = (response, file) => {
  props.formData.attachment = {
    name: file.name,
    url: response.url || URL.createObjectURL(file.raw)
  }
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