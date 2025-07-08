<template>
  <div class="teacher-management">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <h3>教师账号管理</h3>
        </div>
      </template>

      <!-- 搜索栏 -->
      <div class="search-bar">
        <el-form :inline="true" :model="searchForm">
          <el-form-item label="教师姓名">
            <el-input v-model="searchForm.t_name" placeholder="请输入教师姓名" clearable />
          </el-form-item>
          <el-form-item label="用户名">
            <el-input v-model="searchForm.t_username" placeholder="请输入用户名" clearable />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleSearch">搜索</el-button>
            <el-button @click="resetSearch">重置</el-button>
          </el-form-item>
        </el-form>
      </div>

      <!-- 教师列表表格 -->
      <el-table :data="teacherList" border style="width: 100%" v-loading="loading">
        <el-table-column prop="t_username" label="用户名" width="150" />
        <el-table-column prop="t_name" label="教师姓名" width="120" />
        <el-table-column label="性别" width="80">
          <template #default="{row}">
            {{ row.gender === 'male' ? '男' : '女' }}
          </template>
        </el-table-column>
        <el-table-column label="头像" width="100">
          <template #default="{row}">
            <el-avatar :size="50" :src="row.avatar" />
          </template>
        </el-table-column>
        <el-table-column prop="course" label="教授课程" />
        <el-table-column label="角色" width="120">
          <template #default="{row}">
            <el-tag :type="row.role === 'admin' ? 'danger' : 'primary'">
              {{ roleMap[row.role] || row.role }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{row}">
            <el-button size="small" @click="handleResetPwd(row)">重置密码</el-button>
            <el-popconfirm title="确定要删除该教师吗？" @confirm="handleDelete(row)">
              <template #reference>
                <el-button size="small" type="danger">删除</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination">
        <el-pagination
          v-model:current-page="pagination.current"
          v-model:page-size="pagination.size"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>


    <!-- 重置密码对话框 -->
    <el-dialog v-model="pwdDialogVisible" title="重置密码" width="500px">
      <el-form ref="pwdFormRef" :model="pwdForm" :rules="pwdRules" label-width="100px">
        <el-form-item label="新密码" prop="newPassword">
          <el-input v-model="pwdForm.newPassword" type="password" show-password />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input v-model="pwdForm.confirmPassword" type="password" show-password />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="pwdDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitPwdForm">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted,computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
// 角色映射
const roleMap = {
  admin: '管理员',
  teacher: '教师',
  assistant: '助教'
}

// 角色选项
const roleOptions = [
  { value: 'teacher', label: '教师' },
  { value: 'assistant', label: '助教' },
  { value: 'admin', label: '管理员' }
]

// 搜索表单
const searchForm = reactive({
  t_username: '',
  tname: ''
})

// 分页数据
const pagination = reactive({
  current: 1,
  size: 10,
  total: 0
})

// 教师列表
const teacherList = ref([])
const loading = ref(false)

// 表单数据
const formData = reactive({
  t_username: '',
  tname: '',
  gender: 'male',
  avatar: '',
  course: '',
  role: 'teacher',
  password: '123456' // 默认初始密码
})

// 密码表单
const pwdForm = reactive({
  newPassword: '',
  confirmPassword: ''
})

// 表单验证规则
const rules = {
  t_username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  tname: [{ required: true, message: '请输入教师姓名', trigger: 'blur' }],
  gender: [{ required: true, message: '请选择性别', trigger: 'change' }],
  role: [{ required: true, message: '请选择角色', trigger: 'change' }],
  password: [{ required: true, message: '请输入初始密码', trigger: 'blur' }]
}

// 密码验证规则
const pwdRules = {
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度在6到20个字符', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== pwdForm.newPassword) {
          callback(new Error('两次输入密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

// 对话框控制
const dialogVisible = ref(false)
const pwdDialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref(null)
const pwdFormRef = ref(null)


// 获取教师列表
const fetchTeachers = async () => {
  try {
    loading.value = true
    // 这里替换为实际的API调用
    const params = {
      page: pagination.current,
      size: pagination.size,
      ...searchForm
    }
    // const res = await getTeachers(params)
    // teacherList.value = res.data.list
    // pagination.total = res.data.total
    
    // 模拟数据
    teacherList.value = [
      {
        id: 1,
        t_username: 'teacher1',
        t_name: '张老师',
        gender: 'male',
        avatar: '',
        course: '数学',
        role: 'teacher'
      },
      {
        id: 2,
        t_username: 'teacher2',
        t_name: '李老师',
        gender: 'female',
        avatar: '',
        course: '英语',
        role: 'teacher'
      },
      {
        id: 3,
        t_username: 'assistant1',
        t_name: '王助教',
        gender: 'male',
        avatar: '',
        course: '数学',
        role: 'assistant'
      }
    ]
    pagination.total = 3
  } catch (error) {
    ElMessage.error('获取教师列表失败')
    console.error(error)
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  pagination.current = 1
  fetchTeachers()
}

// 重置搜索
const resetSearch = () => {
  searchForm.t_username = ''
  searchForm.tname = ''
  handleSearch()
}

// 分页变化
const handleSizeChange = (size) => {
  pagination.size = size
  fetchTeachers()
}

const handleCurrentChange = (current) => {
  pagination.current = current
  fetchTeachers()
}


// 重置密码
const handleResetPwd = (row) => {
  currentTeacherId = row.id
  pwdForm.newPassword = ''
  pwdForm.confirmPassword = ''
  pwdDialogVisible.value = true
}

// 删除教师
const handleDelete = async (row) => {
  try {
    // await deleteTeacher(row.id)
    ElMessage.success('删除成功')
    fetchTeachers()
  } catch (error) {
    ElMessage.error('删除失败')
    console.error(error)
  }
}

// 提交密码表单
const submitPwdForm = async () => {
  try {
    await pwdFormRef.value.validate()
    
    // 这里替换为实际的API调用
    // await resetPassword(currentTeacherId, pwdForm.newPassword)
    ElMessage.success('密码重置成功')
    pwdDialogVisible.value = false
  } catch (error) {
    console.error(error)
  }
}


onMounted(() => {
  fetchTeachers()
})
</script>

<style scoped>
h3 {
  margin: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.search-bar {
  margin-bottom: 20px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.avatar-uploader {
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  width: 100px;
  height: 100px;
}

.avatar-uploader:hover {
  border-color: #409EFF;
}

.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 100px;
  height: 100px;
  line-height: 100px;
  text-align: center;
}

.avatar {
  width: 100px;
  height: 100px;
  display: block;
}
</style>