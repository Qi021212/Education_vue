<template>
  <div class="submission-detail">
    <el-descriptions :column="2" border>
      <el-descriptions-item label="作业名称">{{ submissionData.homeworkName }}</el-descriptions-item>
      <el-descriptions-item label="学生姓名">{{ submissionData.studentName }}</el-descriptions-item>
      <el-descriptions-item label="课程类别">{{ submissionData.courseName }}</el-descriptions-item>
      <el-descriptions-item label="提交时间">{{ formatTime(submissionData.submitTime) }}</el-descriptions-item>
      <el-descriptions-item label="作业得分">
        <span
          :class="{ 'high-score': submissionData.score / submissionData.total_score >= 0.8, 'low-score': submissionData.score / submissionData.total_score < 0.6 }">
          {{ submissionData.score }} / {{ submissionData.total_score }}
        </span>
      </el-descriptions-item>
      <el-descriptions-item label="状态">
        <el-tag :type="getStatusType(submissionData.isMarked)" size="small">
          {{ getStatusLabel(submissionData.isMarked) }}
        </el-tag>
      </el-descriptions-item>
    </el-descriptions>

    <div class="question-list">
      <h3>题目详情</h3>

      <el-table :data="submissionData.list" border style="width: 100%">
        <el-table-column prop="questionId" label="题号" width="80" align="center" />
        <el-table-column prop="title" label="题目内容" min-width="200" />
        <el-table-column prop="type" label="题型" width="120" align="center">
          <template #default="{ row }">
            {{ getQuestionTypeLabel(row.type) }}
          </template>
        </el-table-column>
        <el-table-column prop="myanswer" label="学生答案" width="200" />
        <el-table-column prop="answer" label="正确答案" width="200" />
        <el-table-column prop="score" label="题目分值" width="100" align="center" />
        <el-table-column prop="myscore" label="学生得分" width="100" align="center">
        </el-table-column>
      </el-table>
    </div>

    <div class="action-buttons">
      <el-button @click="handleClose">关闭</el-button>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits, computed } from 'vue'

const props = defineProps({
  submissionData: {
    type: Object,
    required: true
  },
  categories: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['close'])

// 题型标签
const questionTypes = [
  { value: '0', label: '单选题' },
  { value: '1', label: '多选题' },
  { value: '2', label: '判断题' },
  { value: '3', label: '填空题' },
]

// 获取题型标签
const getQuestionTypeLabel = (type) => {
  const typeObj = questionTypes.find(item => item.value === String(type))
  return typeObj ? typeObj.label : type
}

// 状态选项
const statusOptions = [
  { value: '0', label: '未批改', type: 'warning' },
  { value: '1', label: '已批改', type: 'success' },
]

// 获取状态标签
const getStatusLabel = (isMarked) => {
  const status = statusOptions.find(item => item.value === String(isMarked))
  return status ? status.label : '未知状态'
}

// 获取状态标签类型
const getStatusType = (isMarked) => {
  const status = statusOptions.find(item => item.value === String(isMarked))
  return status ? status.type : ''
}

// 格式化时间
const formatTime = (time) => {
  return time ? new Date(time).toLocaleString() : ''
}

// 关闭
const handleClose = () => {
  emit('close')
}
</script>

<style scoped>
.submission-detail {
  padding: 20px;
}

.question-list {
  margin-top: 30px;
}

.high-score {
  color: #67c23a;
  font-weight: bold;
}

.low-score {
  color: #f56c6c;
  font-weight: bold;
}

.action-buttons {
  margin-top: 20px;
  text-align: center;
}
</style>