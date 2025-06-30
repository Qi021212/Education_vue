<template>
  <div class="grade-submission">
    <el-alert title="请为以下主观题评分" type="info" show-icon :closable="false" />
    
    <div class="subjective-questions">
      <div v-for="(question, index) in subjectiveQuestions" :key="index" class="question-item">
        <div class="question-header">
          <span class="question-index">第{{ question.id }}题</span>
          <span class="question-score">({{ question.score }}分)</span>
        </div>
        
        <div class="question-content">
          <p><strong>题目内容：</strong>{{ question.content }}</p>
          <p><strong>学生答案：</strong>{{ question.studentAnswer }}</p>
          <p><strong>参考答案：</strong>{{ question.correctAnswer }}</p>
        </div>
        
        <div class="grading-area">
          <el-form-item label="评分" prop="studentScore">
            <el-input-number 
              v-model="question.studentScore" 
              :min="0" 
              :max="question.score" 
              :step="1" 
              controls-position="right" />
            <span class="max-score">/ {{ question.score }}分</span>
          </el-form-item>
          
        </div>
      </div>
    </div>
    
    
    <div class="action-buttons">
      <el-button type="primary" @click="handleSubmit">提交批改</el-button>
      <el-button @click="handleClose">取消</el-button>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits, computed, reactive } from 'vue'
import { ElMessage } from 'element-plus'

const props = defineProps({
  submissionData: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['submit', 'close'])

// 获取所有主观题
const subjectiveQuestions = computed(() => {
  return props.submissionData.questions.filter(q => q.type === 'subjective')
})

// 创建可编辑的副本
const submissionData = reactive({
  ...props.submissionData,
  questions: [...props.submissionData.questions]
})

// 提交批改
const handleSubmit = () => {
  // 验证所有主观题都已评分
  const ungradedQuestions = subjectiveQuestions.value.filter(q => 
    q.studentScore === undefined || q.studentScore === null || q.studentScore === ''
  )
  
  if (ungradedQuestions.length > 0) {
    ElMessage.warning('请为所有主观题评分')
    return
  }
  
  // 计算总分
  const totalScore = submissionData.questions.reduce((sum, q) => sum + (q.studentScore || 0), 0)
  submissionData.score = totalScore
  submissionData.status = 'graded'
  
  emit('submit', submissionData)
}

// 关闭
const handleClose = () => {
  emit('close')
}
</script>

<style scoped>
.grade-submission {
  padding: 20px;
}

.subjective-questions {
  margin-top: 20px;
}

.question-item {
  border: 1px solid #ebeef5;
  border-radius: 4px;
  padding: 15px;
  margin-bottom: 20px;
}

.question-header {
  font-weight: bold;
  margin-bottom: 10px;
}

.question-score {
  margin-left: 10px;
  color: #606266;
}

.question-content {
  margin-bottom: 15px;
  line-height: 1.6;
}

.question-content p {
  margin: 5px 0;
}

.grading-area {
  margin-top: 15px;
}

.max-score {
  margin-left: 10px;
  color: #606266;
}

.action-buttons {
  margin-top: 20px;
  text-align: center;
}
</style>