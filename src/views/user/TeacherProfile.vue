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
          <el-upload class="avatar-uploader" action="#" :show-file-list="false" :on-change="handleAvatarUpload"
            :auto-upload="false" :accept="'image/*'" :disabled="!editing">
            <img v-if="teacherInfo.avatar" :src="teacherInfo.avatar" class="avatar">
            <el-icon v-else class="avatar-uploader-icon">
              <User />
            </el-icon>
          </el-upload>
          <div class="teacher-id">工号: {{ teacherInfo.t_username }}</div>
          <el-tag :type="teacherInfo.certificated ? 'success' : 'warning'" class="certification-tag">
            {{ teacherInfo.certificated ? '已认证' : '未认证' }}
          </el-tag>
          <el-button v-if="!teacherInfo.certificated" @click="openFaceRegistration" type="primary" size="small"
            class="register-face-btn">
            录入人脸
          </el-button>
        </div>

        <!-- 右侧信息 -->
        <div class="info-section">
          <el-descriptions :column="1" border>
            <el-descriptions-item label="姓名">
              <el-input v-if="editing" v-model="teacherInfo.t_name" />
              <span v-else>{{ teacherInfo.t_name }}</span>
            </el-descriptions-item>

            <el-descriptions-item label="性别">
              <el-radio-group v-if="editing" v-model="teacherInfo.gender">
                <el-radio label="男">男</el-radio>
                <el-radio label="女">女</el-radio>
              </el-radio-group>
              <span v-else>{{ teacherInfo.gender }}</span>
            </el-descriptions-item>

            <el-descriptions-item label="联系电话">
              <el-input v-if="editing" v-model="teacherInfo.tel" />
              <span v-else>{{ teacherInfo.tel }}</span>
            </el-descriptions-item>

            <el-descriptions-item label="个人签名">
              <el-input v-if="editing" v-model="teacherInfo.signature" />
              <span v-else>{{ teacherInfo.signature || '暂无签名' }}</span>
            </el-descriptions-item>

            <el-descriptions-item label="所授课程">
              <el-select v-if="editing" v-model="teacherInfo.course" multiple filterable allow-create
                placeholder="请选择课程" style="width: 100%">
                <el-option v-for="item in allCourses" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
              <div v-else class="tags-container">
                <el-tag v-for="course in teacherInfo.course" :key="course" type="info" size="small" class="course-tag">
                  {{ course }}
                </el-tag>
              </div>
            </el-descriptions-item>

          </el-descriptions>
        </div>
      </div>

      <div class="profile-actions">
        <el-button v-if="!editing" type="primary" @click="startEditing">
          <el-icon>
            <Edit />
          </el-icon> 编辑信息
        </el-button>

        <template v-else>
          <el-button @click="cancelEditing">
            <el-icon>
              <Close />
            </el-icon> 取消
          </el-button>
          <el-button type="primary" @click="saveProfile">
            <el-icon>
              <Check />
            </el-icon> 保存修改
          </el-button>
        </template>

        <el-button @click="showChangePasswordDialog">
          <el-icon>
            <Lock />
          </el-icon> 修改密码
        </el-button>
      </div>
    </el-card>

    <!-- 修改密码对话框 -->
    <el-dialog v-model="passwordDialogVisible" title="修改密码" width="500px">
      <el-form :model="passwordForm" :rules="passwordRules" ref="passwordFormRef" label-width="100px">
        <el-form-item label="新密码" prop="newPassword">
          <el-input v-model="passwordForm.newPassword" type="password" show-password />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input v-model="passwordForm.confirmPassword" type="password" show-password />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="passwordDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitPasswordChange">确认修改</el-button>
      </template>
    </el-dialog>

    <!-- 人脸录入组件 -->
    <face-registration ref="faceRegistration" @registration-success="handleRegistrationSuccess" />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
  User, Edit, Lock, Close, Check
} from '@element-plus/icons-vue'
import FaceRegistration from '@/components/FaceRegistration.vue'

import { useAuthStore } from '@/stores/authStore'
const authStore = useAuthStore()
// 教师信息
const teacherInfo = reactive({
  id: authStore.userInfo.id,
  avatar: authStore.userInfo.avatar || 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png',
  t_username: authStore.userInfo.t_username,
  t_name: authStore.userInfo.t_name,
  gender: authStore.userInfo.gender,
  tel: authStore.userInfo.tel,
  signature: authStore.userInfo.signature || '',
  course: authStore.userInfo.course,
  certificated: authStore.userInfo.certificated
})

// 所有可选课程和班级
const allCourses = ref([])
// 获取课程列表
import { getCourseList } from '@/api/course'
const fetchCourseList = async () => {
  try {
    const response = await getCourseList()
    console.log('获取课程列表响应:', response.data.list)
    if (response && response.code === 200 && Array.isArray(response.data.list)) {
      allCourses.value = response.data.list.map(item => ({
        value: item.course,    // 使用课程ID作为value
        label: item.course // 使用课程名称作为label
      }))
    } else {
      ElMessage.error('获取课程列表失败: 无效的响应格式')
    }
  } catch (error) {
    console.error('获取课程列表错误:', error)
    ElMessage.error('获取课程列表失败: ' + (error.message || '网络错误'))
  }
}


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
import { updateTeacherInfo } from '@/api/user'
const saveProfile = () => {
  console.log('保存个人信息:', teacherInfo)
  updateTeacherInfo(teacherInfo).then(response => {
    if (response && response.code === 200) {
      // 更新store中的用户信息
      authStore.updateUserInfo(teacherInfo)
      editing.value = false
      ElMessage.success('个人信息保存成功')
    } else {
      throw new Error(response?.message || '个人信息保存失败')
    }
  }).catch(error => {
    console.error('保存个人信息错误:', error)
    ElMessage.error('个人信息保存失败: ' + (error.message || '网络错误'))
    return
  })
}

import { uploadFile } from '@/api/file'
// 处理头像上传
const handleAvatarUpload = (file) => {
  const isImage = file.raw.type.includes('image')
  if (!isImage) {
    ElMessage.error('只能上传图片文件')
    return false
  }

  const isLt2M = file.size / 1024 / 1024 < 2
  if (!isLt2M) {
    ElMessage.error('图片大小不能超过2MB')
    return false
  }

  // 使用上传接口
  uploadFile(file.raw).then(response => {
    if (response) {
      const avatarUrl = response.url
      console.log('上传的头像URL:', avatarUrl)
      teacherInfo.avatar = avatarUrl
    } else {
      ElMessage.error('头像上传失败：无效的响应数据')
    }
  }).catch(error => {
    console.error('头像上传错误:', error)
    ElMessage.error('头像上传失败')
  }).finally(() => {
    authStore.updateUserInfo({ avatar: teacherInfo.avatar })
  })

}

// 修改密码相关
const passwordDialogVisible = ref(false)
const passwordForm = reactive({
  username: teacherInfo.t_username,
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
import { changeTeacherPassword, changeAdminPassword } from '@/api/user'
const submitPasswordChange = () => {
  passwordFormRef.value.validate(async (valid) => {
    if (!valid) return
    try {
      let response

      // 根据角色调用不同的API
      if (authStore.userInfo.role === 'admin') {
        response = await changeAdminPassword(passwordForm)
      } else {
        response = await changeTeacherPassword(passwordForm)
      }

      if (response && response.code === 200) {
        ElMessage.success('密码修改成功')
        passwordDialogVisible.value = false
        // 清空密码表单
        passwordForm.newPassword = ''
        passwordForm.confirmPassword = ''
        authStore.updateUserInfo({ password: passwordForm.newPassword })

      } else {
        throw new Error(response?.message || '密码修改失败')
      }
    } catch (error) {
      console.error('修改密码错误:', error)
      ElMessage.error('密码修改失败: ' + (error.message || '网络错误'))
    }
  })
}

// 人脸录入
const faceRegistration = ref(null)
// 打开人脸录入对话框
const openFaceRegistration = () => {
  faceRegistration.value.openDialog()
}

// 处理人脸录入成功
const handleRegistrationSuccess = () => {
  teacherInfo.certificated = true
  authStore.updateUserInfo({ certificated: true })
}

onMounted(() => {
  fetchCourseList()
})
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

.avatar-uploader {
  position: relative;
}

.upload-mask {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  color: white;
  font-size: 24px;
}

.avatar-uploader :deep(.el-upload) {
  position: relative;
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

.profile-actions {
  margin-top: 30px;
  display: flex;
  justify-content: center;
  gap: 15px;
}

.certification-tag {
  margin-top: 10px;
}

.register-face-btn {
  margin-top: 10px;
  width: 100%;
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