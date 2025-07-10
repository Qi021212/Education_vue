<template>
  <div class="exam-publish-container">
    <el-card>
      <template #header>
        <h3>考试发布</h3>
      </template>

      <!-- 搜索区域 -->
      <el-form :inline="true" :model="searchForm" class="top-bar">
        <el-form-item>
          <el-input v-model="searchForm.name" placeholder="请输入考试名称" clearable />
        </el-form-item>
        <el-form-item>
          <el-select
            v-model="searchForm.courseId"
            placeholder="请选择课程"
            clearable
            @change="fetchExams"
          >
            <el-option
              v-for="course in courseList"
              :key="course.id"
              :label="course.name"
              :value="course.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchExams">搜索</el-button>
          <el-button @click="resetSearch">重置</el-button>
          <el-button type="success" @click="openPublishDialog">
            <el-icon><Plus /></el-icon> 发布考试
          </el-button>
        </el-form-item>
      </el-form>

      <!-- 考试记录列表 -->
      <el-table :data="examList" border stripe style="margin-top: 20px;">
        <el-table-column prop="name" label="考试名称" width="180" />
        <el-table-column prop="paperTitle" label="试卷名称" />
        <el-table-column prop="courseName" label="课程名称" width="160" />
        <el-table-column prop="targetNames" label="考试对象" />
        <el-table-column prop="examTime" label="考试时间" width="220" />
        <el-table-column label="操作" width="300">
          <template #default="{ row }">
            <el-button size="small" type="primary" @click="viewExam(row)">查看</el-button>
            <el-button size="small" type="warning" @click="openEditDialog(row)">修改</el-button>
            <el-button size="small" type="danger" @click="deleteExam(row.id)">取消发布</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 发布考试弹窗 -->
    <el-dialog
      title="发布考试"
      v-model="publishDialogVisible"
      width="700px"
      @close="resetPublishForm"
    >
      <el-form :model="publishForm" label-width="100px" ref="publishFormRef">
        <el-form-item label="考试名称" required>
          <el-input v-model="publishForm.name" />
        </el-form-item>

        <el-form-item label="课程" required>
          <el-select v-model="publishForm.courseId" placeholder="请选择课程" @change="onPublishCourseChange">
            <el-option
              v-for="course in courseList"
              :key="course.id"
              :label="course.name"
              :value="course.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="试卷" required>
          <el-select
            v-model="publishForm.paperId"
            placeholder="请选择试卷"
            :disabled="publishForm.papers.length === 0"
            clearable
          >
            <el-option
              v-for="paper in publishForm.papers"
              :key="paper.id"
              :label="paper.title"
              :value="paper.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="考试对象" required>
          <el-select
            v-model="publishForm.sUsernames"
            multiple
            placeholder="请选择考试学生"
            :disabled="publishForm.students.length === 0"
            filterable
            clearable
            style="width: 100%;"
          >
            <el-option
              v-for="student in publishForm.students"
              :key="student.sUsername"
              :label="student.sName + ' (' + student.sUsername + ')'"
              :value="student.sUsername"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="考试时间" required>
          <el-date-picker
            v-model="publishForm.examTime"
            type="datetimerange"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width: 100%;"
          />
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            @click="submitPublish"
            :loading="publishLoading"
          >提交</el-button>
          <el-button @click="publishDialogVisible = false">取消</el-button>
        </el-form-item>
      </el-form>
    </el-dialog>

    <!-- 修改考试弹窗 -->
    <el-dialog
      title="修改考试"
      v-model="editDialogVisible"
      width="700px"
      @close="resetEditForm"
    >
      <el-form :model="editForm" label-width="100px" ref="editFormRef">
        <el-form-item label="考试名称" required>
          <el-input v-model="editForm.name" />
        </el-form-item>

        <el-form-item label="考试时间" required>
          <el-date-picker
            v-model="editForm.examTime"
            type="datetimerange"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width: 100%;"
          />
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            @click="submitEdit"
            :loading="editLoading"
          >提交</el-button>
          <el-button @click="editDialogVisible = false">取消</el-button>
        </el-form-item>
      </el-form>
    </el-dialog>

    <!-- 查看详情弹窗 -->
    <el-dialog title="考试详情" v-model="viewDialogVisible" width="700px">
      <p><strong>考试名称：</strong>{{ examDetail.examName }}</p>
      <p><strong>课程名称：</strong>{{ examDetail.courseName }}</p>
      <p><strong>试卷名称：</strong>{{ examDetail.paperTitle }}</p>
      <p><strong>考试时间：</strong>{{ examDetail.startTime }} - {{ examDetail.endTime }}</p>
      <div v-if="examDetail.questions && examDetail.questions.length">
        <p style="margin-top: 15px;"><strong>题目列表：</strong></p>
        <div v-for="(q, index) in examDetail.questions" :key="q.id" style="margin-bottom: 20px;">
          <p>{{ index + 1 }}. {{ q.content }}</p>
          <ul v-if="q.options">
            <li v-for="opt in parseOptions(q.options)" :key="opt.code">
              {{ opt.text }}
            </li>
          </ul>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import axios from 'axios'
import dayjs from 'dayjs'
import { useAuthStore } from '@/stores/authStore'

const authStore = useAuthStore()

const courseList = ref([])
const examList = ref([])

const publishDialogVisible = ref(false)
const editDialogVisible = ref(false)
const viewDialogVisible = ref(false)

const publishLoading = ref(false)
const editLoading = ref(false)

const searchForm = ref({ name: '', courseId: null })

// 发布考试表单数据
const publishForm = ref({
  name: '',
  courseId: null,
  paperId: null,
  papers: [],
  students: [],
  sUsernames: [],
  examTime: [],
})

// 修改考试表单数据
const editForm = ref({
  id: null,
  name: '',
  examTime: [],
})

const examDetail = ref({})

// 获取课程列表
const fetchCourses = async () => {
  try {
    const res = await axios.get('/smartEdu/questionbank/courselist', {
      params: { token: authStore.token },
    })
    courseList.value = res.data.data || []
  } catch (error) {
    ElMessage.error('获取课程列表失败')
  }
}

// 获取考试列表
const fetchExams = async () => {
  try {
    const res = await axios.get('/smartEdu/exam/list', {
      params: {
        name: searchForm.value.name,
        courseId: searchForm.value.courseId,
        token: authStore.token,
      },
    })
    examList.value = res.data.data || []
  } catch (error) {
    ElMessage.error('获取考试列表失败')
  }
}

// 重置搜索条件
function resetSearch() {
  searchForm.value = { name: '', courseId: null }
  fetchExams()
}

// 发布弹窗课程切换后，加载试卷和学生列表
const onPublishCourseChange = async (courseId) => {
  if (!courseId) {
    publishForm.value.papers = []
    publishForm.value.students = []
    publishForm.value.paperId = null
    publishForm.value.sUsernames = []
    return
  }
  // 取试卷列表
  try {
    const resPaper = await axios.get('/smartEdu/exam/paperlistbycourse', {
      params: { courseId, token: authStore.token },
    })
    publishForm.value.papers = resPaper.data.data || []
  } catch {
    publishForm.value.papers = []
    ElMessage.error('获取试卷列表失败')
  }
  // 取学生列表
  try {
    const resStu = await axios.get('/smartEdu/exam/studentlistbycourse', {
      params: { courseId },
    })
    publishForm.value.students = resStu.data.data || []
  } catch {
    publishForm.value.students = []
    ElMessage.error('获取学生列表失败')
  }
  publishForm.value.paperId = null
  publishForm.value.sUsernames = []
}

// 打开发布弹窗
function openPublishDialog() {
  resetPublishForm()
  publishDialogVisible.value = true
}

// 重置发布弹窗表单
function resetPublishForm() {
  publishForm.value = {
    name: '',
    courseId: null,
    paperId: null,
    papers: [],
    students: [],
    sUsernames: [],
    examTime: [],
  }
}

// 提交发布考试
async function submitPublish() {
  if (publishLoading.value) return

  const { name, courseId, paperId, sUsernames, examTime } = publishForm.value

  if (!name) return ElMessage.error('请输入考试名称')
  if (!courseId) return ElMessage.error('请选择课程')
  if (!paperId) return ElMessage.error('请选择试卷')
  if (!sUsernames.length) return ElMessage.error('请选择考试对象')
  if (!examTime || examTime.length !== 2) return ElMessage.error('请选择考试时间')

  publishLoading.value = true

  try {
    const payload = {
      name,
      paperId,
      startTime: dayjs(examTime[0]).format('YYYY-MM-DD HH:mm:ss'),
      endTime: dayjs(examTime[1]).format('YYYY-MM-DD HH:mm:ss'),
      sUsernames,
    }

    await axios.post('/smartEdu/exam/create', payload, {
      headers: { Authorization: 'Bearer ' + authStore.token },
    })
    ElMessage.success('考试发布成功')
    publishDialogVisible.value = false
    fetchExams()
  } catch (error) {
    ElMessage.error('考试发布失败')
  } finally {
    publishLoading.value = false
  }
}

// 打开编辑弹窗
function openEditDialog(row) {
  editForm.value = {
    id: row.id,
    name: row.name,
    examTime: [row.startTime, row.endTime],
  }
  editDialogVisible.value = true
}

// 重置编辑弹窗表单
function resetEditForm() {
  editForm.value = {
    id: null,
    name: '',
    examTime: [],
  }
}

// 提交编辑考试
async function submitEdit() {
  if (editLoading.value) return

  const { id, name, examTime } = editForm.value

  if (!name) return ElMessage.error('请输入考试名称')
  if (!examTime || examTime.length !== 2) return ElMessage.error('请选择考试时间')

  editLoading.value = true

  try {
    const payload = {
      id,
      name,
      startTime: dayjs(examTime[0]).format('YYYY-MM-DD HH:mm:ss'),
      endTime: dayjs(examTime[1]).format('YYYY-MM-DD HH:mm:ss'),
    }

    await axios.put('/smartEdu/exam/update', payload, {
      headers: { Authorization: 'Bearer ' + authStore.token },
    })
    ElMessage.success('考试修改成功')
    editDialogVisible.value = false
    fetchExams()
  } catch (error) {
    ElMessage.error('考试修改失败')
  } finally {
    editLoading.value = false
  }
}

// 删除考试
async function deleteExam(id) {
  try {
    await ElMessageBox.confirm('确定取消发布该考试吗？', '提示', { type: 'warning' })
    await axios.delete(`/smartEdu/exam/delete/${id}`, {
      headers: { Authorization: 'Bearer ' + authStore.token },
    })
    ElMessage.success('取消成功')
    fetchExams()
  } catch (err) {
    if (err !== 'cancel') ElMessage.error('取消失败')
  }
}

// 查看考试详情
async function viewExam(row) {
  try {
    const res = await axios.get(`/smartEdu/exam/detail/${row.id}`, {
      headers: { Authorization: 'Bearer ' + authStore.token },
    })
    examDetail.value = res.data.data || {}
    viewDialogVisible.value = true
  } catch {
    ElMessage.error('获取考试详情失败')
  }
}

function parseOptions(optionStr) {
  try {
    return JSON.parse(optionStr)
  } catch {
    return []
  }
}

onMounted(() => {
  fetchCourses()
  fetchExams()
})
</script>

<style scoped>
.top-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
}
h3 {
  margin: 0;
}
.el-select,
.el-input {
  width: 150px;
}
</style>
