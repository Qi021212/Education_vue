<template>
  <div class="submission-detail">
    <el-descriptions :column="2" border>
      <el-descriptions-item label="作业名称">{{ submissionData.homeworkTitle }}</el-descriptions-item>
      <el-descriptions-item label="学生姓名">{{ submissionData.studentName }}</el-descriptions-item>
      <el-descriptions-item label="课程类别">{{ getCategoryLabel(submissionData.category) }}</el-descriptions-item>
      <el-descriptions-item label="提交时间">{{ formatTime(submissionData.submitTime) }}</el-descriptions-item>
      <el-descriptions-item label="作业得分">
        <span :class="{'high-score': submissionData.score/submissionData.totalScore >= 0.8, 'low-score': submissionData.score/submissionData.totalScore < 0.6}">
          {{ submissionData.score }} / {{ submissionData.totalScore }}
        </span>
      </el-descriptions-item>
      <el-descriptions-item label="状态">
        <el-tag :type="getStatusType(submissionData.status)" size="small">
          {{ getStatusLabel(submissionData.status) }}
        </el-tag>
      </el-descriptions-item>
      <el-descriptions-item label="教师评语" v-if="submissionData.feedback" :span="2">
        {{ submissionData.feedback }}
      </el-descriptions-item>
    </el-descriptions>
    
    <div class="question-list">
      <h3>题目详情</h3>
      
      <el-table :data="submissionData.questions" border style="width: 100%">
        <el-table-column prop="id" label="题号" width="80" align="center" />
        <el-table-column prop="content" label="题目内容" min-width="200" />
        <el-table-column prop="type" label="题型" width="120" align="center">
          <template #default="{ row }">
            {{ getQuestionTypeLabel(row.type) }}
          </template>
        </el-table-column>
        <el-table-column prop="studentAnswer" label="学生答案" width="200" />
        <el-table-column prop="correctAnswer" label="正确答案" width="200" />
        <el-table-column prop="score" label="题目分值" width="100" align="center" />
        <el-table-column prop="studentScore" label="学生得分" width="100" align="center">
          <template #default="{ row }">
            <span v-if="submissionData.status === 'graded'">{{ row.studentScore }}</span>
            <span v-else>-</span>
          </template>
        </el-table-column>
      </el-table>
    </div>
    
    <div class="action-buttons">
      <el-button 
        v-if="hasSubjectiveQuestions && submissionData.status !== 'graded'" 
        type="warning" 
        @click="handleGrade">
        批改主观题
      </el-button>
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

const emit = defineEmits(['grade', 'close'])

// 题型标签
const questionTypes = [
  { value: 'single', label: '单选题' },
  { value: 'multiple', label: '多选题' },
  { value: 'judge', label: '判断题' },
  { value: 'fill', label: '填空题' },
  { value: 'subjective', label: '主观题' }
]

// 状态选项
const statusOptions = [
  { value: 'submitted', label: '已提交', type: 'info' },
  { value: 'graded', label: '已批改', type: 'success' },
  { value: 'late', label: '迟交', type: 'warning' },
  { value: 'missing', label: '未交', type: 'danger' }
]

// 检查是否有主观题
const hasSubjectiveQuestions = computed(() => {
  return props.submissionData.questions?.some(q => q.type === 'subjective')
})

// 获取题型标签
const getQuestionTypeLabel = (type) => {
  const typeObj = questionTypes.find(item => item.value === type)
  return typeObj ? typeObj.label : type
}

// 获取课程标签
const getCategoryLabel = (value) => {
  const category = props.categories.find(item => item.value === value)
  return category ? category.label : value
}

// 获取状态标签
const getStatusLabel = (value) => {
  const status = statusOptions.find(item => item.value === value)
  return status ? status.label : value
}

// 获取状态标签类型
const getStatusType = (value) => {
  const status = statusOptions.find(item => item.value === value)
  return status ? status.type : ''
}

// 格式化时间
const formatTime = (time) => {
  return time ? new Date(time).toLocaleString() : ''
}

// 批改作业
const handleGrade = () => {
  emit('grade')
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