<template>
  <el-form :model="formData" label-width="100px" ref="formRef">
    <el-form-item label="作业名称" required>
      <el-input v-model="formData.name" placeholder="请输入作业名称" :disabled="isEdit" />
    </el-form-item>

    <el-form-item label="所属课程" required>
      <el-select v-model="formData.courseId" placeholder="请选择课程" :disabled="isEdit" clearable>
        <el-option v-for="course in courseList" :key="course.value" :label="course.label" :value="course.value" />
      </el-select>
    </el-form-item>

    <el-form-item label="选择试卷">
      <el-select v-model="formData.paperId" placeholder="请选择试卷" :disabled="isEdit || !formData.courseId" clearable>
        <el-option v-for="paper in paperList" :key="paper.id" :label="paper.title" :value="paper.id" />
      </el-select>
    </el-form-item>

    <el-form-item v-if="!isEdit" label="作业对象" required>
      <el-select v-model="formData.sUsernames" multiple placeholder="请选择学生" :disabled="!formData.courseId" filterable
        clearable style="width: 100%;">
        <el-option v-for="student in studentList" :key="student.sUsername"
          :label="student.sName + ' (' + student.sUsername + ')'" :value="student.sUsername" />
      </el-select>
    </el-form-item>

    <el-form-item label="开始时间" required>
      <el-date-picker v-model="formData.startTime" type="datetime" placeholder="选择开始时间"
        value-format="YYYY-MM-DD HH:mm:ss" :disabled="isEdit" style="width: 100%;" />
    </el-form-item>

    <el-form-item label="截止时间" required>
      <el-date-picker v-model="formData.endTime" type="datetime" placeholder="选择截止时间" value-format="YYYY-MM-DD HH:mm:ss"
        style="width: 100%;" />
    </el-form-item>

    <el-form-item>
      <el-button type="primary" @click="submitForm">提交</el-button>
      <el-button @click="$emit('cancel')">取消</el-button>
    </el-form-item>
  </el-form>
</template>

<script setup>
import { ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { getPaperByCourse, getStudentByCourse } from '@/api/course'
import { useAuthStore } from '@/stores/authStore'
const authStore = useAuthStore()

const props = defineProps({
  formData: {
    type: Object,
    required: true
  },
  isEdit: {
    type: Boolean,
    default: false
  },
  courseList: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['submit', 'cancel'])

const paperList = ref([])
const studentList = ref([])

// Only fetch students and papers when not in edit mode
watch(() => props.formData.courseId, (newVal) => {
  if (newVal && !props.isEdit) {
    handleCourseChange(newVal)
  } else {
    paperList.value = []
    studentList.value = []
  }
})

// 课程变化时获取试卷和学生列表
const handleCourseChange = async (courseId) => {
  if (!courseId) {
    paperList.value = []
    studentList.value = []
    return
  }

  try {
    const [paperRes, studentRes] = await Promise.all([
      getPaperByCourse(courseId),
      getStudentByCourse(courseId)
    ])

    paperList.value = paperRes?.map(item => ({
      id: item.id,
      title: item.title
    })) || []

    studentList.value = studentRes?.map(item => ({
      sUsername: item.sUsername,
      sName: item.sName
    })) || []

  } catch (error) {
    console.error('获取关联数据失败:', error)
    ElMessage.error('获取关联数据失败')
  }
}

// 提交表单
const submitForm = () => {
  const { name, courseId, sUsernames, startTime, endTime, paperId } = props.formData

  // 基础验证
  if (!name) return ElMessage.error('请输入作业名称')
  if (!startTime) return ElMessage.error('请选择开始时间')
  if (!endTime) return ElMessage.error('请选择截止时间')

  // 创建模式额外验证
  if (!props.isEdit) {
    if (!courseId) return ElMessage.error('请选择课程')
    if (!sUsernames || !sUsernames.length) return ElMessage.error('请选择作业对象')
  }

  emit('submit', {
    name,
    paperId,
    startTime,
    endTime,
    ...(!props.isEdit && {  // 仅在创建模式传递这些字段
      courseId,
      tUsername: authStore.userInfo.t_username,
      sUsernames,
      status: 0,
      startTime: new Date(startTime).toISOString(),
      endTime: new Date(endTime).toISOString(),
    })
  })
}
</script>