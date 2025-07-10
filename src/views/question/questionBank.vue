<template>
  <div class="question-bank-container">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <h3>题库管理</h3>
        </div>
      </template>

      <!-- 搜索栏 -->
      <div class="filter-container">
        <el-form :inline="true" :model="query" class="search-form">
          <el-form-item label="试题名称">
            <el-input v-model="query.title" placeholder="请输入试题名称" clearable @keyup.enter="handleSearch" />
          </el-form-item>
          <el-form-item label="课程">
            <el-select v-model="query.courseId" placeholder="请选择课程" clearable @change="handleSearch">
              <el-option
                v-for="course in courses"
                :key="course.id"
                :label="course.name"
                :value="course.id"
              />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleSearch">搜索</el-button>
            <el-button @click="resetSearch">重置</el-button>
          </el-form-item>
        </el-form>

        <!-- 操作按钮 -->
        <div class="operation-buttons">
          <el-button type="primary" @click="openAddDialog">
            <el-icon><Plus /></el-icon> 添加试题
          </el-button>
          <el-button type="danger" :disabled="!selected.length" @click="handleBatchDelete">
            <el-icon><Delete /></el-icon> 批量删除
          </el-button>
        </div>
      </div>

      <!-- 表格 -->
      <el-table :data="paginatedData" border style="width: 100%" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="50" />
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column prop="title" label="题干" min-width="180" />
        <el-table-column prop="score" label="分值" width="80" />
        <el-table-column prop="type" label="类型" width="100">
          <template #default="{ row }">
            {{ typeMap[row.type] || '未知类型' }}
          </template>
        </el-table-column>
        <el-table-column prop="answer" label="正确答案" min-width="120">
          <template #default="{ row }">
            <span>{{ formatAnswer(row) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="courseName" label="课程" min-width="120" />
        <el-table-column label="操作" width="160">
          <template #default="{ row }">
            <el-button size="small" type="warning" @click="handleEdit(row)">修改</el-button>
            <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="query.page"
          v-model:page-size="query.size"
          :page-sizes="[10, 20, 30]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          background
          @current-change="fetchQuestions"
          @size-change="fetchQuestions"
        />
      </div>
    </el-card>

    <!-- 添加/修改题目弹窗 -->
    <el-dialog v-model="dialogVisible" :title="editingId ? '修改试题' : '添加试题'" width="600px">
      <el-form :model="form" label-width="90px" :rules="rules" ref="formRef">
        <el-form-item label="题干" prop="title">
          <el-input v-model="form.title" placeholder="请输入试题题干" />
        </el-form-item>
        <el-form-item label="分值" prop="score">
          <el-input-number v-model="form.score" :min="1" />
        </el-form-item>
        <el-form-item label="类型" prop="type">
          <el-select v-model="form.type" placeholder="请选择类型">
            <el-option v-for="(label, val) in typeMap" :key="val" :label="label" :value="val" />
          </el-select>
        </el-form-item>

        <!-- 新增课程选择 -->
        <el-form-item label="课程" prop="courseId" required>
          <el-select v-model="form.courseId" placeholder="请选择课程">
            <el-option
              v-for="course in courses"
              :key="course.id"
              :label="course.name"
              :value="course.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item v-if="['0','1'].includes(String(form.type))" label="选项">
          <div v-for="(option, index) in form.options" :key="index" class="option-item">
            <el-input v-model="option.text" placeholder="选项内容" style="width: 80%" />
            <el-button @click="form.options.splice(index,1)" type="danger" plain>删除</el-button>
          </div>
          <el-button @click="addOption" type="primary" plain class="add-option-button">添加选项</el-button>
        </el-form-item>

        <el-form-item label="正确答案" prop="answer">
          <template v-if="form.type === '2'">
            <el-radio-group v-model="form.answer">
              <el-radio label="正确">正确</el-radio>
              <el-radio label="错误">错误</el-radio>
            </el-radio-group>
          </template>
          <template v-else>
            <el-input v-model="form.answer" placeholder="请输入正确答案（如 A 或 A,B）或文本" />
          </template>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">提交</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Delete } from '@element-plus/icons-vue'
import axios from 'axios'
import { useAuthStore } from '@/stores/authStore'

const typeMap = {
  0: '单选',
  1: '多选',
  2: '判断',
  3: '填空',
}

const courses = ref([])

const total = ref(0)
const allQuestions = ref([])
const query = reactive({ title: '', page: 1, size: 10, courseId: null })
const selected = ref([])

const paginatedData = computed(() => allQuestions.value)

const dialogVisible = ref(false)
const formRef = ref()
const form = reactive({
  title: '',
  score: 1,
  type: '',
  options: [],
  answer: '',
  courseId: null
})
const editingId = ref(null)
const rules = {
  title: [{ required: true, message: '请输入题干', trigger: 'blur' }],
  score: [{ required: true, type: 'number', message: '请输入分值', trigger: 'blur' }],
  type: [{ required: true, message: '请选择类型', trigger: 'change' }],
  courseId: [{ required: true, message: '请选择课程', trigger: 'change' }],
  answer: [{ required: true, message: '请输入答案', trigger: 'blur' }]
}

// 获取课程列表
const authStore = useAuthStore()
const token = authStore.token

onMounted(async () => {
  try {
    const res = await axios.get('/smartEdu/questionbank/courselist', {
      params: { token }
    })
    courses.value = res.data.data
  } catch (error) {
    console.error('获取课程失败', error)
  }
})

const fetchQuestions = async () => {
  const t_username = authStore.userInfo.t_username
  try {
    const res = await axios.get('/smartEdu/questionbank/managerlist', {
      params: { ...query, t_username, token }
    })
    allQuestions.value = res.data.data.list
    total.value = res.data.data.total
  } catch (error) {
    console.error('获取试题失败', error)
  }
}

const addOption = () => {
  const code = String.fromCharCode(65 + form.options.length)
  form.options.push({ text: `${code}.`, code })
}

const submitForm = () => {
  formRef.value.validate(async valid => {
    if (!valid) return

    try {
      const payload = {
        title: form.title,
        score: form.score,
        type: form.type,
        answer: form.answer,
        courseId: form.courseId,
        options: form.options.length > 0 ? JSON.stringify(form.options) : undefined
      }

      if (editingId.value !== null) {
        payload.id = editingId.value
        await axios.post('/smartEdu/questionbank/update', payload, {
          headers: { Authorization: `Bearer ${token}` }
        })
        ElMessage.success('修改成功')
      } else {
        await axios.post('/smartEdu/questionbank/create', payload, {
          headers: { Authorization: `Bearer ${token}` }
        })
        ElMessage.success('添加成功')
      }
    } catch (error) {
      console.error('提交失败:', error)
      ElMessage.error('提交失败，请检查数据格式或权限')
    }

    dialogVisible.value = false
    resetForm()
    fetchQuestions()
  })
}

const resetForm = () => {
  editingId.value = null
  Object.assign(form, {
    title: '',
    score: 1,
    type: '',
    options: [],
    answer: '',
    courseId: null
  })
}

const formatAnswer = (row) => row.answer

const handleDeleteByIds = async (ids) => {
  if (!ids || ids.length === 0) return

  const message = ids.length === 1
    ? `确认删除「ID: ${ids[0]}」的试题吗？`
    : `确认删除选中的 ${ids.length} 条试题？`

  await ElMessageBox.confirm(message, '提示', { type: 'warning' })

  try {
    if (ids.length === 1) {
      await axios.delete(`/smartEdu/questionbank/delete/${ids[0]}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
    } else {
      await axios.post('/smartEdu/questionbank/delete_batch', ids, {
        headers: { Authorization: `Bearer ${token}` }
      })
    }

    ElMessage.success('删除成功')
    selected.value = []
    fetchQuestions()
  } catch (error) {
    console.error('删除失败:', error)
    ElMessage.error('删除失败，请检查权限或网络')
  }
}

const handleDelete = (row) => {
  handleDeleteByIds([row.id])
}

const handleBatchDelete = () => {
  const ids = selected.value.map(i => i.id)
  handleDeleteByIds(ids)
}

const handleSearch = () => {
  query.page = 1
  fetchQuestions()
}

const resetSearch = () => {
  query.title = ''
  query.courseId = null
  handleSearch()
}

const handleSelectionChange = (val) => { selected.value = val }
const openAddDialog = () => { resetForm(); dialogVisible.value = true }
const handleEdit = (row) => {
  editingId.value = row.id
  // 深拷贝，防止表单双向绑定出问题
  const data = JSON.parse(JSON.stringify(row))
  // 解析options字段字符串为数组（如果存在）
  if (data.options && typeof data.options === 'string') {
    try {
      data.options = JSON.parse(data.options)
    } catch {
      data.options = []
    }
  }
  Object.assign(form, data)
  dialogVisible.value = true
}

onMounted(fetchQuestions)
</script>

<style scoped>
h3 {
  margin: 0;
}
.filter-container {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
  flex-wrap: wrap;
}
.operation-buttons {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 5px;
}
.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
.option-item {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  gap: 10px;
}

.add-option-button {
  margin-left: 90px;
}

.el-select,
.el-input {
    width: 150px;
}
</style>
