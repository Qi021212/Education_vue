<template>
  <el-form :model="formData" label-width="120px" ref="formRef">
    <el-form-item label="作业名称" prop="title" required>
      <el-input v-model="formData.title" placeholder="请输入作业名称" />
    </el-form-item>
    
    <el-form-item label="课程类别" prop="course" required>
      <el-select v-model="formData.course" placeholder="请选择课程类别">
        <el-option 
          v-for="item in categories" 
          :key="item.value" 
          :label="item.label" 
          :value="item.value" 
        />
      </el-select>
    </el-form-item>
    
    <el-form-item label="题目列表">
      <div class="question-list-container">
        <div class="question-list-header">
          <span style="width: 50px;">序号</span>
          <span style="width: 100px;">题型</span>
          <span style="flex: 1;">题目内容</span>
          <span style="width: 80px;">分值</span>
          <span style="width: 120px;">操作</span>
        </div>
        
        <div 
          v-for="(question, index) in formData.questions" 
          :key="question.id || index" 
          class="question-item"
        >
          <span style="width: 50px;">{{ index + 1 }}</span>
          <span style="width: 100px;">{{ getQuestionTypeLabel(question.type) }}</span>
          <span style="flex: 1; text-overflow: ellipsis; overflow: hidden;">
            {{ question.content }}
          </span>
          <span style="width: 80px;">{{ question.score }}分</span>
          <span style="width: 120px;">
            <el-button type="primary" size="small" @click="editQuestion(index)">编辑</el-button>
            <el-button type="danger" size="small" @click="removeQuestion(index)">删除</el-button>
          </span>
        </div>
        
        <div class="add-question-actions">
          <el-button type="primary" @click="showQuestionBank = true">
            <el-icon><Plus /></el-icon> 从题库添加
          </el-button>
          <el-button @click="addNewQuestion">
            <el-icon><Plus /></el-icon> 新建题目
          </el-button>
        </div>
      </div>
    </el-form-item>
    
    <el-form-item>
      <el-button type="primary" @click="submitForm">保存</el-button>
      <el-button @click="cancel">取消</el-button>
    </el-form-item>
  </el-form>
  
  <!-- 题库选择对话框 -->
  <el-dialog v-model="showQuestionBank" title="从题库选择题目" width="70%">
    <el-table 
      :data="filteredQuestionBank" 
      border 
      style="width: 100%"
      @selection-change="handleQuestionSelectionChange"
    >
      <el-table-column type="selection" width="55" />
      <el-table-column label="题型" width="120">
        <template #default="{ row }">
          {{ getQuestionTypeLabel(row.type) }}
        </template>
      </el-table-column>
      <el-table-column label="题目内容" prop="content" />
      <el-table-column label="分值" prop="score" width="80" />
      <el-table-column label="课程类别" width="120">
        <template #default="{ row }">
          {{ getCategoryLabel(row.category) }}
        </template>
      </el-table-column>
    </el-table>
    
    <div class="dialog-footer" style="margin-top: 20px;">
      <el-button @click="showQuestionBank = false">取消</el-button>
      <el-button type="primary" @click="addSelectedQuestions">添加选中题目</el-button>
    </div>
  </el-dialog>
  
  <!-- 题目编辑对话框 -->
  <el-dialog v-model="showQuestionEditor" :title="questionEditorTitle" width="60%">
    <QuestionEditor 
      v-if="showQuestionEditor"
      :question="editingQuestion"
      @save="saveQuestion"
      @cancel="showQuestionEditor = false"
    />
  </el-dialog>
</template>

<script setup>
import { ref, computed, defineProps, defineEmits } from 'vue'
import { Plus } from '@element-plus/icons-vue'

const props = defineProps({
  formData: {
    type: Object,
    required: true
  },
  categories: {
    type: Array,
    required: true
  },
  questionBank: {
    type: Array,
    required: true
  }
})

const emit = defineEmits(['submit', 'cancel'])

const showQuestionBank = ref(false)
const showQuestionEditor = ref(false)
const selectedQuestions = ref([])
const editingQuestionIndex = ref(-1)
const editingQuestion = ref({})
const questionEditorTitle = ref('')

// 题型标签
const questionTypes = [
  { value: 'single', label: '单选题' },
  { value: 'multiple', label: '多选题' },
  { value: 'judge', label: '判断题' },
  { value: 'fill', label: '填空题' },
  { value: 'subjective', label: '主观题' }
]

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

// 过滤题库（排除已选题目）
const filteredQuestionBank = computed(() => {
  const selectedIds = props.formData.questions.map(q => q.id)
  return props.questionBank.filter(q => !selectedIds.includes(q.id))
})

// 处理题目选择变化
const handleQuestionSelectionChange = (selection) => {
  selectedQuestions.value = selection
}

// 添加选中的题目
const addSelectedQuestions = () => {
  props.formData.questions.push(...selectedQuestions.value.map(q => ({ ...q })))
  selectedQuestions.value = []
  showQuestionBank.value = false
}

// 添加新题目
const addNewQuestion = () => {
  editingQuestionIndex.value = -1
  editingQuestion.value = {
    id: undefined,
    type: 'single',
    content: '',
    options: [],
    answer: '',
    score: 5,
    category: props.formData.category || ''
  }
  questionEditorTitle.value = '添加新题目'
  showQuestionEditor.value = true
}

// 编辑题目
const editQuestion = (index) => {
  editingQuestionIndex.value = index
  editingQuestion.value = { ...props.formData.questions[index] }
  questionEditorTitle.value = '编辑题目'
  showQuestionEditor.value = true
}

// 删除题目
const removeQuestion = (index) => {
  props.formData.questions.splice(index, 1)
}

// 保存题目
const saveQuestion = (question) => {
  if (editingQuestionIndex.value >= 0) {
    // 更新现有题目
    props.formData.questions.splice(editingQuestionIndex.value, 1, question)
  } else {
    // 添加新题目
    props.formData.questions.push(question)
  }
  showQuestionEditor.value = false
}

// 提交表单
const submitForm = () => {
  if (!props.formData.title) {
    ElMessage.error('请输入作业名称')
    return
  }
  
  if (!props.formData.category) {
    ElMessage.error('请选择课程类别')
    return
  }
  
  if (props.formData.questions.length === 0) {
    ElMessage.error('请至少添加一个题目')
    return
  }
  
  emit('submit', props.formData)
}

// 取消
const cancel = () => {
  emit('cancel')
}
</script>

<style scoped>
.question-list-container {
  border: 1px solid #ebeef5;
  border-radius: 4px;
  padding: 10px;
}

.question-list-header, .question-item {
  display: flex;
  padding: 8px 0;
  align-items: center;
  border-bottom: 1px solid #f0f0f0;
}

.question-list-header {
  font-weight: bold;
  background-color: #f5f7fa;
}

.add-question-actions {
  margin-top: 15px;
}
</style>