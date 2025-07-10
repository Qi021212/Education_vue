<template>
  <div class="test-record-container">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <h3>测试记录</h3>
        </div>
      </template>

      <!-- 搜索栏 -->
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="考试名称">
          <el-input v-model="searchForm.examName" placeholder="请输入考试名称" />
        </el-form-item>
        <el-form-item label="提交人">
          <el-input v-model="searchForm.submitter" placeholder="请输入提交人" />
        </el-form-item>
        <el-form-item label="课程名称">
          <el-select v-model="searchForm.courseName" placeholder="请选择课程" clearable @change="fetchRecords">
            <el-option
              v-for="name in courseList"
              :key="name"
              :label="name"
              :value="name"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchRecords">搜索</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>

      <!-- 表格 -->
      <el-table :data="filteredList" border stripe style="margin-top: 20px">
        <el-table-column prop="examName" label="考试名称" width="200" />
        <el-table-column prop="studentName" label="提交人" width="140" />
        <el-table-column prop="courseName" label="课程名称" width="200" />
        <el-table-column prop="submitTime" label="提交时间" width="280" />
        <el-table-column prop="totalScore" label="得分" width="150" />
        <el-table-column label="操作" width="300">
          <template #default="scope">
            <el-button size="small" type="primary" @click="viewDetail(scope.row)">查看</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 答题详情弹窗 -->
    <el-dialog v-model="detailDialogVisible" title="答题详情" width="650px" :before-close="() => detailDialogVisible = false">
      <div v-if="currentDetail.length > 0" class="detail-container">
        <el-card
          v-for="(item, index) in currentDetail"
          :key="index"
          class="question-card"
          shadow="hover"
          :body-style="{ padding: '12px 20px' }"
        >
          <div class="question-header">
            <span class="question-index">Q{{ index + 1 }}.</span>
            <span class="question-stem">{{ item.questionStem }}</span>
          </div>

          <ul class="options-list" v-if="item.options && item.options.length">
            <li v-for="opt in item.options" :key="opt.code" class="option-item">
              <span class="option-code">{{ opt.code }}.</span>
              <span class="option-text">{{ opt.text }}</span>
            </li>
          </ul>

          <div class="answer-info">
            <div>
              <span class="label">你的回答：</span>
              <el-tag type="info" size="small">{{ item.studentAnswer }}</el-tag>
            </div>
            <div>
              <span class="label">正确答案：</span>
              <el-tag type="success" size="small">{{ item.correctAnswer }}</el-tag>
            </div>
            <div>
              <span class="label">得分：</span>
              <span :class="{'score-correct': item.studentScore === item.questionScore, 'score-wrong': item.studentScore !== item.questionScore}">
                {{ item.studentScore }} / {{ item.questionScore }}
              </span>
            </div>
          </div>
        </el-card>
      </div>
      <div v-else class="no-records">暂无答题记录</div>
      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'
import request from '@/utils/request'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/authStore'

const authStore = useAuthStore()
const token = authStore.token

const searchForm = ref({
  examName: '',
  submitter: '',
  courseName: ''
})

const recordList = ref([])
const courseList = ref([])

const filteredList = computed(() => {
  const { examName, submitter, courseName } = searchForm.value
  return recordList.value.filter(item =>
    (!examName || item.examName.includes(examName)) &&
    (!submitter || (item.studentName && item.studentName.includes(submitter))) &&
    (!courseName || item.courseName === courseName)
  )
})

const fetchCourseList = async () => {
  try {
    const res = await axios.get('/smartEdu/questionbank/courselist', {
      params: { token }
    })
    courseList.value = (res.data.data || []).map(c => c.name)
  } catch (e) {
    ElMessage.error('课程加载失败')
  }
}

const fetchRecords = async () => {
  try {
    const res = await request.get('/examrecord/resultList', {
      params: {
        examName: searchForm.value.examName,
        submitter: searchForm.value.submitter,
        courseName: searchForm.value.courseName
      }
    })
    recordList.value = res.data || []
  } catch (e) {
    ElMessage.error('记录加载失败')
  }
}

const resetSearch = () => {
  searchForm.value = { examName: '', submitter: '', courseName: '' }
  fetchRecords()
}

const detailDialogVisible = ref(false)
const currentDetail = ref([])

const viewDetail = async (row) => {
  try {
    const res = await request.get('/examrecord/examDetail', {
      params: {
        examHomeworkId: row.examHomeworkId,
        studentUsername: row.studentUsername
      }
    })
    currentDetail.value = (res.data || []).map(item => ({
      ...item,
      options: item.options ? JSON.parse(item.options) : []
    }))
    detailDialogVisible.value = true
  } catch (e) {
    ElMessage.error('加载详情失败')
  }
}


onMounted(() => {
  fetchCourseList()
  fetchRecords()
})
</script>

<style scoped>
h3 {
  margin: 0;
}
.search-form {
  margin-bottom: 20px;
}
.el-input,
.el-select {
  width: 160px;
}

.detail-container {
  max-height: 500px;
  overflow-y: auto;
  padding-right: 8px;
}
.question-card {
  margin-bottom: 16px;
}
.question-header {
  font-weight: 600;
  font-size: 16px;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
}
.question-index {
  color: #409EFF;
  margin-right: 8px;
}
.options-list {
  list-style: none;
  padding-left: 0;
  margin-bottom: 10px;
}
.option-item {
  padding: 4px 8px;
  background-color: #f5f7fa;
  border-radius: 4px;
  margin-bottom: 4px;
  display: flex;
  align-items: center;
}
.option-code {
  font-weight: 700;
  margin-right: 6px;
  color: #606266;
}
.option-text {
  color: #606266;
}
.answer-info {
  display: flex;
  gap: 20px;
  font-size: 14px;
  flex-wrap: wrap;
}
.label {
  font-weight: 600;
  margin-right: 4px;
}
.score-correct {
  color: #67C23A;
  font-weight: 700;
}
.score-wrong {
  color: #F56C6C;
  font-weight: 700;
}
.no-records {
  text-align: center;
  color: #909399;
  padding: 40px 0;
  font-size: 16px;
}
</style>
