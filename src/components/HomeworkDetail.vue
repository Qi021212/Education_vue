<template>
  <div class="homework-detail">
    <el-descriptions :column="2" border>
      <el-descriptions-item label="作业名称">{{ detailData.name }}</el-descriptions-item>
      <el-descriptions-item label="课程名称">{{ detailData.courseName }}</el-descriptions-item>
      <el-descriptions-item label="开始时间">{{ formatTime(detailData.startTime) }}</el-descriptions-item>
      <el-descriptions-item label="截止时间">{{ formatTime(detailData.endTime) }}</el-descriptions-item>
    </el-descriptions>

    <div class="question-list" v-if="detailData.questions && detailData.questions.length">
      <h3>题目列表</h3>

      <div v-for="(question, index) in detailData.questions" :key="question.id || index" class="question-item">
        <div class="question-header">
          <span class="question-index">第{{ index + 1 }}题</span>
          <span class="question-type">{{ getQuestionTypeLabel(question.type) }}</span>
          <span class="question-score">{{ question.score }}分</span>
        </div>

        <div class="question-content">{{ question.content }}</div>

        <div v-if="question.options && question.options.length" class="question-options">
          <div v-for="(option, optIndex) in question.options" :key="optIndex" class="option">
            {{ String.fromCharCode(65 + optIndex) }}. {{ option }}
          </div>
        </div>

        <div class="question-answer">
          <strong>答案：</strong>
          <span v-if="question.type === 2"> <!-- 2 is for judge type -->
            {{ question.answer ? '正确' : '错误' }}
          </span>
          <span v-else-if="Array.isArray(question.answer)">
            {{ question.answer.join('、') }}
          </span>
          <span v-else>
            {{ question.answer || '无标准答案' }}
          </span>
        </div>
      </div>
    </div>

    <div class="action-buttons">
      <el-button @click="handleClose">关闭</el-button>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue'

const props = defineProps({
  detailData: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['edit', 'close'])

// 题型标签
const questionTypes = [
  { value: 0, label: '单选题' },
  { value: 1, label: '多选题' },
  { value: 2, label: '判断题' },
  { value: 3, label: '填空题' },
]

// 获取题型标签
const getQuestionTypeLabel = (type) => {
  const typeObj = questionTypes.find(item => item.value === type)
  return typeObj ? typeObj.label : type
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
.homework-detail {
  padding: 20px;
}

.question-list {
  margin-top: 30px;
}

.question-item {
  border: 1px solid #ebeef5;
  border-radius: 4px;
  padding: 15px;
  margin-bottom: 15px;
}

.question-header {
  display: flex;
  margin-bottom: 10px;
  font-weight: bold;
}

.question-index {
  margin-right: 20px;
}

.question-type {
  margin-right: 20px;
}

.question-content {
  margin-bottom: 10px;
  line-height: 1.6;
}

.question-options {
  margin: 10px 0 10px 20px;
}

.option {
  margin-bottom: 5px;
}

.question-answer {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px dashed #eee;
}

.action-buttons {
  margin-top: 20px;
  text-align: center;
}
</style>