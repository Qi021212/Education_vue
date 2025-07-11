<template>
  <div class="teacher-management">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <h3>学生账号管理</h3>
        </div>
      </template>

      <!-- 搜索和操作区域 -->
      <div class="filter-container">
        <el-form :inline="true" :model="listQuery" class="search-form">
          <el-form-item label="学生姓名">
            <el-input v-model="listQuery.t_name" placeholder="请输入教师姓名" clearable @keyup.enter="handleSearch" />
          </el-form-item>
          <el-form-item label="学号">
            <el-input v-model="listQuery.t_username" placeholder="请输入工号" clearable @keyup.enter="handleSearch" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleSearch">搜索</el-button>
            <el-button @click="resetSearch">重置</el-button>
          </el-form-item>
        </el-form>
      </div>

      <!-- 表格区域 -->
      <el-table v-loading="loading" :data="teacherList" border fit highlight-current-row style="width: 100%"
        @sort-change="handleSortChange">
        <el-table-column label="序号" width="80" align="center" sortable="custom">
          <template #default="{ $index }">
            {{ (listQuery.page - 1) * listQuery.size + $index + 1 }}
          </template>
        </el-table-column>
        <el-table-column label="学号" prop="sUsername" width="150" align="center" sortable="custom" />
        <el-table-column label="学生姓名" prop="sName" width="150" align="center" sortable="custom" />
        <el-table-column label="性别" width="80" align="center">
          <template #default="{ row }">
            {{ row.gender }}
          </template>
        </el-table-column>
        <el-table-column label="头像" width="100" align="center">
          <template #default="{ row }">
            <el-avatar :size="50" :src="row.avatar || defaultAvatar" />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="showResetPasswordDialog(row)">重置密码</el-button>
            <el-button type="info" size="small" @click="showStudentDetails(row)">查看详情</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination v-model:current-page="listQuery.page" v-model:page-size="listQuery.size" :total="total"
          :page-sizes="[10, 20, 30, 50]" layout="total, sizes, prev, pager, next, jumper" background
          @size-change="handleSizeChange" @current-change="handleCurrentChange" />
      </div>
    </el-card>

    <!-- 重置密码对话框 -->
    <el-dialog v-model="resetPasswordDialogVisible" title="重置密码" width="500px">
      <el-form ref="resetPasswordFormRef" :model="resetPasswordForm" :rules="resetPasswordRules" label-width="100px">
        <el-form-item label="工号">
          <el-input v-model="currentTeacher.t_username" disabled />
        </el-form-item>
        <el-form-item label="新密码" prop="newPassword">
          <el-input v-model="resetPasswordForm.newPassword" type="password" show-password />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input v-model="resetPasswordForm.confirmPassword" type="password" show-password />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="resetPasswordDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitResetPassword">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 教师详情对话框 -->
    <el-dialog v-model="teacherDetailsDialogVisible" title="教师详情" width="700px">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="学号">{{ currentTeacher.sUsername }}</el-descriptions-item>
        <el-descriptions-item label="姓名">{{ currentTeacher.sName }}</el-descriptions-item>
        <el-descriptions-item label="性别">{{ currentTeacher.gender }}</el-descriptions-item>
        <el-descriptions-item label="头像">
          <el-avatar :size="100" :src="currentTeacher.avatar || defaultAvatar" />
        </el-descriptions-item>
        <el-descriptions-item label="联系电话">{{ currentTeacher.tel || '未填写' }}</el-descriptions-item>
        <el-descriptions-item label="注册时间">{{ currentTeacher.addtime }}</el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <span class="dialog-footer">
          <el-button type="primary" @click="teacherDetailsDialogVisible = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getStudentAccountInfo } from '@/api/account'

const defaultAvatar = 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'

// 数据状态
const teacherList = ref([])
const loading = ref(false)
const total = ref(0)
const currentTeacher = ref({})

// 查询参数
const listQuery = reactive({
  page: 1,
  size: 10,
  sUsername: '',
  sNname: '',
  sort: '',
  order: ''
})

// 获取教师数据
const fetchData = async () => {
  try {
    loading.value = true
    const response = await getStudentAccountInfo()

    if (response && Array.isArray(response)) {
      let filteredData = [...response]

      // 应用搜索条件
      if (listQuery.t_name) {
        filteredData = filteredData.filter(item =>
          item.t_name?.includes(listQuery.t_name)
        )
      }

      if (listQuery.t_username) {
        filteredData = filteredData.filter(item =>
          item.t_username?.includes(listQuery.t_username)
        )
      }

      if (listQuery.role) {
        filteredData = filteredData.filter(item =>
          item.role === listQuery.role
        )
      }

      // 应用排序
      if (listQuery.sort) {
        filteredData.sort((a, b) => {
          const aValue = a[listQuery.sort] || ''
          const bValue = b[listQuery.sort] || ''
          if (listQuery.order === 'ascending') {
            return aValue > bValue ? 1 : -1
          } else {
            return aValue < bValue ? 1 : -1
          }
        })
      }

      // 分页
      total.value = filteredData.length
      const start = (listQuery.page - 1) * listQuery.size
      const end = start + listQuery.size
      teacherList.value = filteredData.slice(start, end)
    } else {
      ElMessage.error('获取教师列表失败: 无效的响应格式')
    }
  } catch (error) {
    console.error('获取教师列表错误:', error)
    ElMessage.error('获取教师列表失败: ' + (error.message || '网络错误'))
  } finally {
    loading.value = false
  }
}

// 显示教师详情对话框
const teacherDetailsDialogVisible = ref(false)
const showStudentDetails = (row) => {
  currentTeacher.value = { ...row }
  teacherDetailsDialogVisible.value = true
}

// 搜索
const handleSearch = () => {
  listQuery.page = 1
  fetchData()
}

// 重置搜索
const resetSearch = () => {
  listQuery.sUsername = ''
  listQuery.sNname = ''
  listQuery.sort = ''
  listQuery.order = ''
  handleSearch()
}

// 排序变化
const handleSortChange = ({ prop, order }) => {
  listQuery.sort = prop
  listQuery.order = order
  fetchData()
}

// 分页变化
const handleSizeChange = (size) => {
  listQuery.size = size
  fetchData()
}

const handleCurrentChange = (current) => {
  listQuery.page = current
  fetchData()
}

// 密码重置相关
const resetPasswordDialogVisible = ref(false)
const resetPasswordFormRef = ref()
const resetPasswordForm = reactive({
  username: '',
  newPassword: '',
  confirmPassword: ''
})

const resetPasswordRules = {
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度在6到20个字符', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== resetPasswordForm.newPassword) {
          callback(new Error('两次输入密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

// 显示重置密码对话框
const showResetPasswordDialog = (row) => {
  currentTeacher.value = { ...row }
  resetPasswordForm.username = row.t_username
  resetPasswordForm.newPassword = ''
  resetPasswordForm.confirmPassword = ''
  resetPasswordDialogVisible.value = true
}

// 提交密码重置
const submitResetPassword = async () => {
  resetPasswordFormRef.value.validate(async (valid) => {
    if (!valid) return
    try {
      let response
      response = await changeTeacherPassword(resetPasswordForm)
      if (response && response.code === 200) {
        ElMessage.success('密码修改成功')
        resetPasswordDialogVisible.value = false
        // 清空密码表单
        resetPasswordForm.newPassword = ''
        resetPasswordForm.confirmPassword = ''

      } else {
        throw new Error(response?.message || '密码修改失败')
      }
    } catch (error) {
      console.error('修改密码错误:', error)
      ElMessage.error('密码修改失败: ' + (error.message || '网络错误'))
    }
  })
}

// 初始化
onMounted(() => {
  fetchData()
})
</script>

<style scoped>
h3 {
  margin: 0;
}

.filter-container {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
}

.search-form {
  display: flex;
  align-items: center;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.el-select,
.el-input {
  width: 150px;
}
</style>