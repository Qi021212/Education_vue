<template>
  <div class="teacher-profile-container">
    <!-- 个人信息卡片 -->
    <el-card class="profile-card">
      <div class="profile-header">
        <h2>教师个人信息</h2>
      </div>
      
      <div class="profile-content">
        <!-- 左侧头像 -->
        <div class="avatar-section">
          <el-upload
            class="avatar-uploader"
            action="/api/upload"
            :show-file-list="false"
            :on-success="handleAvatarSuccess"
            :before-upload="beforeAvatarUpload">
            <img v-if="teacherInfo.avatar" :src="teacherInfo.avatar" class="avatar">
            <el-icon v-else class="avatar-uploader-icon"><User /></el-icon>
          </el-upload>
          <div class="teacher-id">工号: {{ teacherInfo.teacherId }}</div>
        </div>
        
        <!-- 右侧信息 -->
        <div class="info-section">
          <el-descriptions :column="1" border>
            <el-descriptions-item label="姓名">
              <el-input v-if="editing" v-model="teacherInfo.name" />
              <span v-else>{{ teacherInfo.name }}</span>
            </el-descriptions-item>
            
            <el-descriptions-item label="性别">
              <el-radio-group v-if="editing" v-model="teacherInfo.gender">
                <el-radio label="男">男</el-radio>
                <el-radio label="女">女</el-radio>
              </el-radio-group>
              <span v-else>{{ teacherInfo.gender }}</span>
            </el-descriptions-item>
            
            <el-descriptions-item label="联系电话">
              <el-input v-if="editing" v-model="teacherInfo.phone" />
              <span v-else>{{ teacherInfo.phone }}</span>
            </el-descriptions-item>
            
            <el-descriptions-item label="所授课程">
              <el-select
                v-if="editing"
                v-model="teacherInfo.courses"
                multiple
                filterable
                allow-create
                placeholder="请选择或输入课程"
                style="width: 100%">
                <el-option
                  v-for="course in allCourses"
                  :key="course"
                  :label="course"
                  :value="course" />
              </el-select>
              <div v-else class="tags-container">
                <el-tag
                  v-for="course in teacherInfo.courses"
                  :key="course"
                  type="info"
                  size="small"
                  class="course-tag">
                  {{ course }}
                </el-tag>
              </div>
            </el-descriptions-item>
            
          </el-descriptions>
        </div>
      </div>
      
      <div class="profile-actions">
        <el-button
          v-if="!editing"
          type="primary"
          @click="startEditing">
          <el-icon><Edit /></el-icon> 编辑信息
        </el-button>
        
        <template v-else>
          <el-button @click="cancelEditing">
            <el-icon><Close /></el-icon> 取消
          </el-button>
          <el-button type="primary" @click="saveProfile">
            <el-icon><Check /></el-icon> 保存修改
          </el-button>
        </template>
        
        <el-button @click="showChangePasswordDialog">
          <el-icon><Lock /></el-icon> 修改密码
        </el-button>
      </div>
    </el-card>

    <!-- 修改密码对话框 -->
    <el-dialog
      v-model="passwordDialogVisible"
      title="修改密码"
      width="500px">
      <el-form
        :model="passwordForm"
        :rules="passwordRules"
        ref="passwordFormRef"
        label-width="100px">
        <el-form-item label="当前密码" prop="currentPassword">
          <el-input
            v-model="passwordForm.currentPassword"
            type="password"
            show-password />
        </el-form-item>
        <el-form-item label="新密码" prop="newPassword">
          <el-input
            v-model="passwordForm.newPassword"
            type="password"
            show-password />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input
            v-model="passwordForm.confirmPassword"
            type="password"
            show-password />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="passwordDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitPasswordChange">确认修改</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  User, Edit, Lock, Close, Check
} from '@element-plus/icons-vue'

// 教师信息
const teacherInfo = reactive({
  avatar: 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png',
  teacherId: 'T2023001',
  name: '张老师',
  gender: '男',
  phone: '13800138000',
  courses: ['高等数学', '线性代数'],
})

// 所有可选课程和班级
const allCourses = ref(['高等数学', '线性代数', '概率统计', '离散数学', '数据结构'])

// 编辑状态
const editing = ref(false)
const originalInfo = ref({})

// 开始编辑
const startEditing = () => {
  originalInfo.value = JSON.parse(JSON.stringify(teacherInfo))
  editing.value = true
}

// 取消编辑
const cancelEditing = () => {
  Object.assign(teacherInfo, originalInfo.value)
  editing.value = false
}

// 保存个人信息
const saveProfile = () => {
  // 这里应该调用API保存数据
  ElMessage.success('个人信息保存成功')
  editing.value = false
}

// 头像上传处理
const handleAvatarSuccess = (res, file) => {
  teacherInfo.avatar = URL.createObjectURL(file.raw)
}

const beforeAvatarUpload = (file) => {
  const isJPG = file.type === 'image/jpeg' || file.type === 'image/png'
  const isLt2M = file.size / 1024 / 1024 < 2

  if (!isJPG) {
    ElMessage.error('头像图片只能是 JPG/PNG 格式!')
  }
  if (!isLt2M) {
    ElMessage.error('头像图片大小不能超过 2MB!')
  }
  return isJPG && isLt2M
}

// 修改密码相关
const passwordDialogVisible = ref(false)
const passwordForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const passwordFormRef = ref()

const validatePassword = (rule, value, callback) => {
  if (value === '') {
    callback(new Error('请输入密码'))
  } else if (value.length < 6) {
    callback(new Error('密码长度不能少于6位'))
  } else {
    callback()
  }
}

const validateConfirmPassword = (rule, value, callback) => {
  if (value === '') {
    callback(new Error('请再次输入密码'))
  } else if (value !== passwordForm.newPassword) {
    callback(new Error('两次输入密码不一致!'))
  } else {
    callback()
  }
}

const passwordRules = reactive({
  currentPassword: [
    { required: true, message: '请输入当前密码', trigger: 'blur' },
    { validator: validatePassword, trigger: 'blur' }
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { validator: validatePassword, trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' }
  ]
})

// 显示修改密码对话框
const showChangePasswordDialog = () => {
  passwordDialogVisible.value = true
  // 重置表单
  if (passwordFormRef.value) {
    passwordFormRef.value.resetFields()
  }
}

// 提交密码修改
const submitPasswordChange = () => {
  passwordFormRef.value.validate((valid) => {
    if (valid) {
      // 这里应该调用API修改密码
      ElMessage.success('密码修改成功')
      passwordDialogVisible.value = false
    }
  })
}
</script>

<style scoped>
.teacher-profile-container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px;
}

.profile-card {
  padding: 20px;
}

.profile-header {
  text-align: center;
  margin-bottom: 30px;
}

.profile-header h2 {
  margin: 0;
  color: #333;
}

.profile-content {
  display: flex;
  gap: 30px;
}

.avatar-section {
  width: 200px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.avatar-uploader {
  width: 150px;
  height: 150px;
  border: 1px dashed var(--el-border-color);
  border-radius: 50%;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  margin-bottom: 15px;
}

.avatar-uploader:hover {
  border-color: var(--el-color-primary);
}

.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 150px;
  height: 150px;
  text-align: center;
  line-height: 150px;
}

.avatar {
  width: 150px;
  height: 150px;
  display: block;
  object-fit: cover;
}

.teacher-id {
  font-size: 14px;
  color: #666;
  margin-top: 10px;
}

.info-section {
  flex: 1;
}

.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.course-tag, .class-tag {
  margin-right: 5px;
  margin-bottom: 5px;
}

.profile-actions {
  margin-top: 30px;
  display: flex;
  justify-content: center;
  gap: 15px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .profile-content {
    flex-direction: column;
  }
  
  .avatar-section {
    width: 100%;
    margin-bottom: 20px;
  }
  
  .profile-actions {
    flex-direction: column;
  }
  
  .profile-actions .el-button {
    width: 100%;
    margin-bottom: 10px;
  }
}
</style>