<template>
  <el-form :model="question" label-width="100px">
    <el-form-item label="题型" required>
      <el-select v-model="question.type" placeholder="请选择题型" @change="handleTypeChange">
        <el-option 
          v-for="item in questionTypes" 
          :key="item.value" 
          :label="item.label" 
          :value="item.value" 
        />
      </el-select>
    </el-form-item>
    
    <el-form-item label="题目内容" required>
      <el-input 
        v-model="question.content" 
        type="textarea" 
        :rows="3" 
        placeholder="请输入题目内容" 
      />
    </el-form-item>
    
    <el-form-item 
      v-if="hasOptions" 
      label="选项" 
      required
    >
      <div v-for="(option, index) in question.options" :key="index" class="option-item">
        <el-input v-model="question.options[index]" :placeholder="`选项 ${String.fromCharCode(65 + index)}`">
          <template #append>
            <el-button @click="removeOption(index)" :icon="Delete" />
          </template>
        </el-input>
      </div>
      <el-button type="primary" @click="addOption" class="add-option-btn">
        <el-icon><Plus /></el-icon> 添加选项
      </el-button>
    </el-form-item>
    
    <el-form-item label="正确答案" required>
      <template v-if="question.type === 'single'">
        <el-select v-model="question.answer" placeholder="请选择正确答案">
          <el-option 
            v-for="(option, index) in question.options" 
            :key="index" 
            :label="String.fromCharCode(65 + index)" 
            :value="String.fromCharCode(65 + index)" 
          />
        </el-select>
      </template>
      
      <template v-else-if="question.type === 'multiple'">
        <el-select v-model="question.answer" multiple placeholder="请选择正确答案">
          <el-option 
            v-for="(option, index) in question.options" 
            :key="index" 
            :label="String.fromCharCode(65 + index)" 
            :value="String.fromCharCode(65 + index)" 
          />
        </el-select>
      </template>
      
      <template v-else-if="question.type === 'judge'">
        <el-radio-group v-model="question.answer">
          <el-radio :label="true">正确</el-radio>
          <el-radio :label="false">错误</el-radio>
        </el-radio-group>
      </template>
      
      <template v-else>
        <el-input v-model="question.answer" placeholder="请输入答案" />
      </template>
    </el-form-item>
    
    <el-form-item label="分值" required>
      <el-input-number v-model="question.score" :min="1" :max="100" />
    </el-form-item>
    
    <el-form-item label="课程类别">
      <el-select v-model="question.category" placeholder="请选择课程类别">
        <el-option 
          v-for="item in categories" 
          :key="item.value" 
          :label="item.label" 
          :value="item.value" 
        />
      </el-select>
    </el-form-item>
    
    <el-form-item>
      <el-button type="primary" @click="submit">保存</el-button>
      <el-button @click="cancel">取消</el-button>
    </el-form-item>
  </el-form>
</template>

<script setup>
import { ref, computed, defineProps, defineEmits } from 'vue'
import { Plus, Delete } from '@element-plus/icons-vue'

const props = defineProps({
  question: {
    type: Object,
    required: true
  },
  categories: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['save', 'cancel'])

// 题型选项
const questionTypes = [
  { value: 'single', label: '单选题' },
  { value: 'multiple', label: '多选题' },
  { value: 'judge', label: '判断题' },
  { value: 'fill', label: '填空题' },
  { value: 'subjective', label: '主观题' }
]

// 是否有选项
const hasOptions = computed(() => {
  return ['single', 'multiple'].includes(props.question.type)
})

// 处理题型变化
const handleTypeChange = (type) => {
  // 重置答案
  props.question.answer = type === 'multiple' ? [] : ''
  
  // 如果是单选或多选，初始化选项
  if (hasOptions.value && (!props.question.options || props.question.options.length === 0)) {
    props.question.options = ['', '']
  } else if (!hasOptions.value) {
    props.question.options = []
  }
}

// 添加选项
const addOption = () => {
  props.question.options.push('')
}

// 删除选项
const removeOption = (index) => {
  props.question.options.splice(index, 1)
  
  // 如果是单选题，且删除的是当前答案，则清空答案
  if (props.question.type === 'single' && props.question.answer === String.fromCharCode(65 + index)) {
    props.question.answer = ''
  }
  
  // 如果是多选题，则从答案中移除被删除的选项
  if (props.question.type === 'multiple') {
    const optionChar = String.fromCharCode(65 + index)
    props.question.answer = props.question.answer.filter(a => a !== optionChar)
  }
}

// 提交
const submit = () => {
  if (!props.question.content) {
    ElMessage.error('请输入题目内容')
    return
  }
  
  if (hasOptions.value && props.question.options.some(opt => !opt)) {
    ElMessage.error('请填写所有选项内容')
    return
  }
  
  if (!props.question.answer || (Array.isArray(props.question.answer) && props.question.answer.length === 0)) {
    ElMessage.error('请设置正确答案')
    return
  }
  
  if (!props.question.score) {
    ElMessage.error('请设置分值')
    return
  }
  
  emit('save', props.question)
}

// 取消
const cancel = () => {
  emit('cancel')
}
</script>

<style scoped>
.option-item {
  margin-bottom: 10px;
}

.add-option-btn {
  margin-top: 10px;
}
</style>