<template>
  <div class="test-paper-container">
    <el-card>
      <template #header><h3>试卷管理</h3></template>

      <!-- 搜索 & 操作 -->
      <el-form :inline="true" class="top-bar">
        <el-form-item>
          <el-input v-model="searchTitle" placeholder="请输入试卷标题" clearable />
        </el-form-item>
        <el-form-item label="课程">
          <el-select v-model="query.courseId" placeholder="请选择课程" clearable>
            <el-option
              v-for="course in courses"
              :key="course.id"
              :label="course.name"
              :value="course.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchPapers">搜索</el-button>
          <el-button @click="resetFilter">重置</el-button>
          <el-button type="success" @click="openAssembleDialog">
            <el-icon><Plus /></el-icon> 组卷
          </el-button>
        </el-form-item>
      </el-form>

      <!-- 表格 -->
      <el-table :data="filteredPapers" border stripe style="width: 100%">
        <el-table-column prop="title" label="试卷标题" min-width="200" />
        <el-table-column prop="addtime" label="创建时间" width="200" />
        <el-table-column prop="time" label="时长（分钟）" width="160" />
        <el-table-column prop="questionCount" label="试题数量" width="120" />
        <el-table-column prop="courseName" label="课程" width="160" />
        <el-table-column prop="status" label="用途" width="120">
          <template #default="{ row }">
            <el-tag :type="row.status === '0' ? 'info' : 'success'">
              {{ row.status === '0' ? '作业' : '考卷' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" fixed="right" width="300">
          <template #default="{ row }">
            <el-button size="small" type="primary" @click="viewPaper(row)">查看内容</el-button>
            <el-button size="small" type="warning" @click="editPaper(row)">修改</el-button>
            <el-button size="small" type="danger" @click="deletePaper(row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 组卷 / 修改试卷 -->
    <el-dialog v-model="assembleDialogVisible" :title="editingPaperId ? '修改试卷' : '组卷设置'" width="500px">
      <el-form :model="assembleForm" label-width="100px">
        <el-form-item label="试卷标题">
          <el-input v-model="assembleForm.title" />
        </el-form-item>

        <template v-if="editingPaperId === null">
          <el-form-item label="单选题数">
            <el-input-number v-model="assembleForm.single" :min="0" />
          </el-form-item>
          <el-form-item label="多选题数">
            <el-input-number v-model="assembleForm.multiple" :min="0" />
          </el-form-item>
          <el-form-item label="判断题数">
            <el-input-number v-model="assembleForm.judge" :min="0" />
          </el-form-item>
          <el-form-item label="填空题数">
            <el-input-number v-model="assembleForm.blank" :min="0" />
          </el-form-item>
            <el-form-item label="课程">
          <el-select v-model="assembleForm.courseId" placeholder="请选择课程" clearable>
            <el-option
              v-for="course in courses"
              :key="course.id"
              :label="course.name"
              :value="course.id"
            />
          </el-select>
        </el-form-item>
        </template>

        <el-form-item label="用途">
          <el-radio-group v-model="assembleForm.status">
            <el-radio :label="1">考试</el-radio>
            <el-radio :label="0">作业</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="考试时长">
          <el-input-number v-model="assembleForm.time" :min="1" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="assembleDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmAssemble">提交</el-button>
      </template>
    </el-dialog>

    <!-- 试卷详情 -->
    <el-dialog v-model="detailDialogVisible" title="试卷详情" width="800px">
      <div>
        <h2>{{ paperDetail.title }}</h2>
        <p>考试时长：{{ paperDetail.time }} 分钟</p>
        <div v-for="(q, index) in paperDetail.questions" :key="q.id" class="question-item">
          <p><strong>{{ index + 1 }}.【{{ typeLabel(q.type) }}】</strong> {{ q.title }}</p>
          <ul v-if="q.type === 0 || q.type === 1">
            <li v-for="opt in parseOptions(q.options)" :key="opt.code">
              {{ opt.text }}
            </li>
          </ul>
          <p v-if="q.type === 2">选项：对 / 错</p>
          <p><strong>正确答案：</strong> {{ q.answer }}</p>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import axios from 'axios'
import { useAuthStore } from '@/stores/authStore'

const authStore = useAuthStore()
const token = authStore.token

const query = ref({ courseId: null })
const searchTitle = ref('')
const courses = ref([])
const allPapers = ref([])
const filteredPapers = ref([])

const assembleDialogVisible = ref(false)
const editingPaperId = ref(null)
const assembleForm = ref({})
const detailDialogVisible = ref(false)
const paperDetail = ref({ title: '', time: 0, questions: [] })

// 获取课程列表
onMounted(async () => {
  try {
    const res = await axios.get('/smartEdu/questionbank/courselist', { params: { token } })
    courses.value = res.data.data || []
  } catch (e) {
    console.error('课程加载失败', e)
  }
})

// 获取试卷列表
const fetchPapers = async () => {
  try {
    const res = await axios.get('/smartEdu/paper/managerlist', {
      params: { page: 1, limit: 1000, token }
    })
    if (res.data.code === 200) {
      allPapers.value = res.data.data.list || []
      filterPapers()
    }
  } catch (e) {
    console.error('获取试卷失败', e)
  }
}

// 筛选试卷
const filterPapers = () => {
  const courseId = query.value.courseId
  const keyword = searchTitle.value.trim()

  filteredPapers.value = allPapers.value.filter(paper => {
    const matchCourse = !courseId || paper.courseId === courseId
    const matchTitle = !keyword || paper.title.includes(keyword)
    return matchCourse && matchTitle
  })
}

// 监听课程和标题变化，自动筛选
watch([() => query.value.courseId, searchTitle], filterPapers)

// 重置筛选
const resetFilter = () => {
  query.value.courseId = null
  searchTitle.value = ''
  filterPapers()
}

// 打开组卷对话框
const openAssembleDialog = () => {
  editingPaperId.value = null
  assembleForm.value = {
    title: '',
    single: 0,
    multiple: 0,
    judge: 0,
    blank: 0,
    subjective: 0,
    status: 1,
    time: 60,
    courseId: null
  }
  assembleDialogVisible.value = true
}

// 确认组卷或修改
const confirmAssemble = async () => {
  try {
    if (!editingPaperId.value) {
      await axios.post(`/smartEdu/paper/create?token=${token}`, assembleForm.value)
      ElMessage.success('组卷成功')
    } else {
      await axios.put(`/smartEdu/paper/update`, {
        id: editingPaperId.value,
        ...assembleForm.value
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      ElMessage.success('修改成功')
    }
    assembleDialogVisible.value = false
    fetchPapers()
  } catch (e) {
    console.error('提交失败', e)
    ElMessage.error('操作失败')
  }
}

// 编辑试卷
const editPaper = (row) => {
  editingPaperId.value = row.id
  assembleForm.value = {
    title: row.title,
    status: row.status,
    time: row.time,
    courseId: row.courseId
  }
  assembleDialogVisible.value = true
}

// 删除试卷
const deletePaper = (id) => {
  ElMessageBox.confirm('确定删除该试卷吗？', '提示', {
    type: 'warning'
  }).then(async () => {
    await axios.delete(`/smartEdu/paper/delete/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    ElMessage.success('删除成功')
    fetchPapers()
  })
}

// 查看试卷详情
const viewPaper = async (row) => {
  try {
    const res = await axios.get(`/smartEdu/paper/detail/${row.id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    paperDetail.value = {
      title: res.data.data.paper.title,
      time: res.data.data.paper.time,
      questions: res.data.data.questions || []
    }
    detailDialogVisible.value = true
  } catch (e) {
    console.error('详情获取失败', e)
  }
}

// 工具函数
const typeLabel = (type) => ['单选题', '多选题', '判断题', '填空题', '主观题'][type] || '未知'
const parseOptions = (str) => { try { return JSON.parse(str) } catch { return [] } }

onMounted(fetchPapers)
</script>

<style scoped>
h3 {
  margin: 0;
}
.top-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
}
.question-item {
  border-bottom: 1px solid #ddd;
  padding: 10px 0;
}
.el-form-item {
  margin-right: 20px;
}
.el-select,
.el-input {
  width: 150px;
}
</style>
