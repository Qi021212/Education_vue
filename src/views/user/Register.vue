<template>
  <el-row class="register-page">
    <!-- 背景区域 -->
    <el-col :span="12" class="bg">
      <div class="bg-overlay">
        <h1>加入教师中心</h1>
        <p>{{ currentStep === 1 ? '创建您的教师账号' : '完善您的个人信息' }}</p>
      </div>
    </el-col>

    <!-- 表单区域 -->
    <el-col :span="12" class="register-form">
      <h2>注册</h2>

      <!-- 步骤指示器 -->
      <div class="steps">
        <el-steps :active="currentStep" simple>
          <el-step title="账号信息" />
          <el-step title="个人信息" />
        </el-steps>
      </div>

      <!-- 第一步：账号信息 -->
      <el-form v-if="currentStep === 1" :model="registerForm" :rules="accountRules" ref="accountFormRef">
        <el-form-item prop="t_username">
          <el-input v-model="registerForm.t_username" placeholder="请输入工号" :prefix-icon="User"></el-input>
        </el-form-item>

        <el-form-item prop="password">
          <el-input type="password" v-model="registerForm.password" placeholder="请输入密码" :prefix-icon="Lock"
            show-password></el-input>
        </el-form-item>

        <el-form-item prop="confirmPassword">
          <el-input type="password" v-model="registerForm.confirmPassword" placeholder="请再次输入密码" :prefix-icon="Lock"
            show-password></el-input>
        </el-form-item>

        <el-form-item prop="role">
          <el-radio-group v-model="registerForm.role">
            <el-radio label="admin">管理员</el-radio>
            <el-radio label="teacher">教师</el-radio>
            <el-radio label="assistant">助教</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="nextStep">下一步</el-button>
        </el-form-item>

        <el-form-item class="text-center">
          已有账号？<el-link type="primary" :underline="false" @click="redirectToLogin">立即登录</el-link>
        </el-form-item>
      </el-form>

      <!-- 第二步：个人信息 -->
      <el-form v-else :model="registerForm" :rules="infoRules" ref="infoFormRef">
        <el-form-item prop="t_name">
          <el-input v-model="registerForm.t_name" placeholder="请输入姓名"></el-input>
        </el-form-item>

        <el-form-item prop="tel">
          <el-input v-model="registerForm.tel" placeholder="请输入联系电话"></el-input>
        </el-form-item>

        <el-form-item prop="gender">
          <el-radio-group v-model="registerForm.gender">
            <el-radio label="male">男</el-radio>
            <el-radio label="female">女</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item prop="course">
          <el-input v-model="registerForm.course" placeholder="请输入所授课程名称"></el-input>
        </el-form-item>

        <el-form-item prop="avatar">
          <el-upload action="#" :auto-upload="false" :show-file-list="false" :on-change="handleAvatarUpload">
            <el-button type="primary" class="avatar-button">上传头像</el-button>
            <div v-if="avatarPreview" class="avatar-preview">
              <img :src="avatarPreview" alt="头像预览" />
            </div>
          </el-upload>
        </el-form-item>

        <el-form-item>
          <el-button @click="prevStep">上一步</el-button>
          <el-button type="primary" @click="handleRegister">完成注册</el-button>
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

const router = useRouter()

const currentStep = ref(1)
const registerForm = ref({
  t_username: '',
  password: '',
  confirmPassword: '',
  role: 'teacher',
  t_name: '',
  gender: 'male',
  avatar: 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png',
  tel: '',
  course: ''
})

const accountFormRef = ref(null)
const infoFormRef = ref(null)
const avatarPreview = ref(null)

// 密码验证规则
const validatePassword = (rule, value, callback) => {
  if (value !== registerForm.value.password) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

// 第一步验证规则
const accountRules = {
  t_username: [
    { required: true, message: '请输入工号', trigger: 'blur' },
    { pattern: /^\d{6,10}$/, message: '工号应为6-10位数字', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入密码', trigger: 'blur' },
    { validator: validatePassword, trigger: 'blur' }
  ],
  role: [
    { required: true, message: '请选择角色', trigger: 'change' }
  ]
}

// 第二步验证规则
const infoRules = {
  t_name: [
    { required: true, message: '请输入姓名', trigger: 'blur' },
    { min: 2, max: 10, message: '姓名长度在2到10个字符', trigger: 'blur' }
  ],
  tel: [
    { required: true, message: '请输入联系电话', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }
  ],
  course: [
    { required: true, message: '请输入课程名称', trigger: 'blur' }
  ],
  gender: [
    { required: true, message: '请选择性别', trigger: 'change' }
  ],
  // avatar: [
  //   { required: true, message: '请上传头像', trigger: 'change' }
  // ]
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
      registerForm.value.avatar = avatarUrl
    } else {
      ElMessage.error('头像上传失败：无效的响应数据')
    }
  }).catch(error => {
    console.error('头像上传错误:', error)
    ElMessage.error('头像上传失败')
  }).finally(() => {
    // 验证头像字段
    infoFormRef.value.validateField('avatar')
  })

  // 显示本地预览
  const reader = new FileReader()
  reader.onload = (e) => {
    avatarPreview.value = e.target.result
  }
  reader.readAsDataURL(file.raw)
}

// 下一步
const nextStep = () => {
  accountFormRef.value.validate((valid) => {
    if (valid) {
      currentStep.value = 2
    }
  })
}

// 上一步
const prevStep = () => {
  currentStep.value = 1
}
import { teacherRegister, adminRegister } from '@/api/user'
// 提交注册
const handleRegister = async () => {
  try {
    // 验证第二步表单
    await infoFormRef.value.validate()

    console.log('注册表单数据:', registerForm.value)
    const { confirmPassword, ...submitData } = registerForm.value
    // const formData = new FormData()
    // for (const key in registerForm.value) { 
    //   if (registerForm.value[key] !== null) {
    //     formData.append(key, registerForm.value[key])
    //   }
    // }
    console.log('提交的表单数据:', submitData)
    let response
    if (registerForm.value.role === 'admin') {
      response = await adminRegister(submitData)
    } else {
      response = await teacherRegister(submitData)
    }
    if (response) {
      ElMessage.success('注册成功')
      router.push('/login')
    } else {
      ElMessage.error(response.message)
    }

  } catch (error) {
    console.error('注册失败:', error)
  }
}

const redirectToLogin = () => {
  router.push('/login')
}
</script>

<style scoped>
.register-page {
  width: 800px;
  height: 500px;
  margin: 100px auto;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 15px;
  overflow: hidden;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.bg {
  background: url('@/assets/images/register-bg.jpg') no-repeat center / cover;
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

.register-form {
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
  margin-bottom: 20px;
  color: #303133;
}

.steps {
  margin-bottom: 20px;
}

.el-form-item {
  margin-bottom: 10px;
}

.el-button {
  width: 50%;
  margin-left: 25%;
  margin-bottom: 10px;
}

.text-center {
  padding-left: 30%;
  width: 40%;
  margin-top: 10px;
}

.avatar-preview {
  margin-top: 10px;
}

.avatar-button {
  width: 100%;
  margin-left: 0;
}

.avatar-preview img {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
}

.el-radio-group {
  width: 70%;
  margin-left: 15%;
  display: flex;
  justify-content: space-between;
}

@media screen and (max-width: 768px) {
  .register-page {
    width: 100%;
    height: 100%;
    margin: 0;
    flex-direction: column;
  }

  .bg,
  .register-form {
    width: 100%;
    height: auto;
  }

  .bg {
    height: 200px;
  }

  .register-form {
    padding: 20px;
  }
}
</style>