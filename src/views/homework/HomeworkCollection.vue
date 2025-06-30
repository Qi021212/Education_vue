<template>
    <div class="homework-container">
        <el-card class="box-card">
            <template #header>
                <div class="card-header">
                    <h3>作业收取记录</h3>
                </div>
            </template>

            <!-- 搜索和操作区域 -->
            <div class="filter-container">
                <el-form :inline="true" :model="listQuery" class="search-form">
                    <el-form-item label="课程类别">
                        <el-select v-model="listQuery.category" placeholder="请选择课程类别" clearable>
                            <el-option v-for="item in categories" :key="item.value" :label="item.label"
                                :value="item.value" />
                        </el-select>
                    </el-form-item>
                    <el-form-item label="作业名称">
                        <el-input v-model="listQuery.title" placeholder="请输入作业名称" clearable />
                    </el-form-item>
                    <el-form-item label="学生姓名">
                        <el-input v-model="listQuery.studentName" placeholder="请输入学生姓名" clearable />
                    </el-form-item>
                    <el-form-item>
                        <el-button type="primary" @click="handleSearch">搜索</el-button>
                        <el-button @click="resetSearch">重置</el-button>
                    </el-form-item>
                </el-form>
            </div>

            <!-- 表格区域 -->
            <el-table v-loading="loading" :data="submissionList" border fit highlight-current-row style="width: 100%"
                @sort-change="handleSortChange">
                <el-table-column label="序号" width="80" align="center" sortable="custom">
                    <template #default="{ $index }">
                        {{ (listQuery.page - 1) * listQuery.size + $index + 1 }}
                    </template>
                </el-table-column>
                <el-table-column label="作业名称" prop="homeworkTitle" min-width="150" align="center" sortable="custom" />
                <el-table-column label="课程类别" prop="category" width="120" align="center" sortable="custom">
                    <template #default="{ row }">
                        {{ getCategoryLabel(row.category) }}
                    </template>
                </el-table-column>
                <el-table-column label="学生姓名" prop="studentName" width="120" align="center" sortable="custom" />
                <el-table-column label="提交时间" prop="submitTime" width="160" align="center" sortable="custom">
                    <template #default="{ row }">
                        {{ formatTime(row.submitTime) }}
                    </template>
                </el-table-column>
                <el-table-column label="作业得分" prop="score" width="120" align="center" sortable="custom">
                    <template #default="{ row }">
                        <span :class="{'high-score': row.score/row.totalScore >= 0.8, 'low-score': row.score/row.totalScore < 0.6}">
                            {{ row.score }} / {{ row.totalScore }}
                        </span>
                    </template>
                </el-table-column>
                <el-table-column label="状态" prop="status" width="120" align="center" sortable="custom">
                    <template #default="{ row }">
                        <el-tag :type="getStatusType(row.status)" size="small">
                            {{ getStatusLabel(row.status) }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column label="操作" width="220" align="center" fixed="right">
                    <template #default="{ row }">
                        <el-button type="primary" size="small" @click="handleView(row)">
                            查看作业
                        </el-button>
                        <el-button v-if="hasSubjectiveQuestions(row)" type="warning" size="small" @click="handleGrade(row)">
                            批改主观题
                        </el-button>
                    </template>
                </el-table-column>
            </el-table>

            <!-- 分页 -->
            <div class="pagination-container">
                <el-pagination v-model:current-page="listQuery.page" v-model:page-size="listQuery.size" :total="total"
                    :page-sizes="[10, 20, 30, 50]" layout="total, sizes, prev, pager, next, jumper" background
                    @size-change="fetchData" @current-change="fetchData" />
            </div>
        </el-card>

        <!-- 作业详情对话框 -->
        <el-dialog v-model="detailDialogVisible" :title="`作业详情 - ${currentItem.studentName}`" width="80%">
            <HomeworkSubmissionDetail 
                v-if="detailDialogVisible" 
                :submission-data="currentItem" 
                :categories="categories"
                @grade="handleGradeFromDetail"
                @close="detailDialogVisible = false" />
        </el-dialog>

        <!-- 批改主观题对话框 -->
        <el-dialog v-model="gradeDialogVisible" :title="`批改主观题 - ${currentItem.studentName}`" width="70%">
            <GradeSubmission 
                v-if="gradeDialogVisible"
                :submission-data="currentItem"
                @submit="handleGradeSubmit"
                @close="gradeDialogVisible = false" />
        </el-dialog>
    </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import HomeworkSubmissionDetail from '@/components/HomeworkSubmissionDetail.vue'
import GradeSubmission from '@/components/GradeSubmission.vue'

// 课程类别选项
const categories = [
    { value: 'math', label: '数学' },
    { value: 'english', label: '英语' },
    { value: 'computer', label: '计算机' },
    { value: 'physics', label: '物理' },
    { value: 'chemistry', label: '化学' }
]

// 状态选项
const statusOptions = [
    { value: 'submitted', label: '已提交', type: 'info' },
    { value: 'graded', label: '已批改', type: 'success' },
    { value: 'late', label: '迟交', type: 'warning' },
    { value: 'missing', label: '未交', type: 'danger' }
]

// 获取课程标签
const getCategoryLabel = (value) => {
    const category = categories.find(item => item.value === value)
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

// 模拟作业提交数据
const generateSubmissions = () => {
    const submissions = []
    const now = new Date()
    const students = ['张三', '李四', '王五', '赵六', '钱七', '孙八', '周九', '吴十']
    const homeworkTitles = ['数学作业1', '英语作业2', '计算机作业3', '物理作业4', '化学作业5']

    for (let i = 1; i <= 50; i++) {
        const studentIndex = i % students.length
        const homeworkIndex = i % homeworkTitles.length
        const categoryIndex = i % categories.length
        const statusIndex = i % statusOptions.length
        const questionCount = Math.floor(Math.random() * 5) + 3 // 3-7题
        const totalScore = questionCount * 10
        const score = statusOptions[statusIndex].value === 'graded' ? 
            Math.floor(Math.random() * totalScore * 0.7) + totalScore * 0.3 : 0

        // 生成题目和答案
        const questions = []
        for (let j = 0; j < questionCount; j++) {
            const isSubjective = Math.random() > 0.7 // 30%概率是主观题
            const studentScore = statusOptions[statusIndex].value === 'graded' ? 
                Math.floor(Math.random() * 10) + 1 : 0
            
            questions.push({
                id: j + 1,
                type: isSubjective ? 'subjective' : ['single', 'multiple', 'judge', 'fill'][Math.floor(Math.random() * 4)],
                content: `${categories[categoryIndex].label}题目${j + 1}`,
                correctAnswer: isSubjective ? '参考答案内容' : ['A', 'B', 'AB', '正确', '填空内容'][Math.floor(Math.random() * 5)],
                studentAnswer: isSubjective ? '学生作答内容' : ['A', 'B', 'C', 'AB', '正确', '错误', '填空内容'][Math.floor(Math.random() * 7)],
                score: 10,
                studentScore,
            })
        }

        submissions.push({
            id: i,
            homeworkId: homeworkIndex + 1,
            homeworkTitle: homeworkTitles[homeworkIndex],
            category: categories[categoryIndex].value,
            studentId: studentIndex + 1,
            studentName: students[studentIndex],
            submitTime: new Date(
                now.getFullYear(),
                now.getMonth(),
                now.getDate() - Math.floor(Math.random() * 30),
                Math.floor(Math.random() * 24),
                Math.floor(Math.random() * 60)
            ).toISOString(),
            questions,
            questionCount,
            totalScore,
            score,
            status: statusOptions[statusIndex].value,
        })
    }

    return submissions
}

// 数据状态
const submissionData = ref(generateSubmissions())
const submissionList = ref([])
const loading = ref(false)

// 查询参数
const listQuery = reactive({
    page: 1,
    size: 10,
    title: '',
    category: '',
    studentName: '',
    sort: '',
    order: ''
})

const total = ref(0)

// 对话框状态
const detailDialogVisible = ref(false)
const gradeDialogVisible = ref(false)
const currentItem = ref({})

// 格式化时间
const formatTime = (time) => {
    return time ? new Date(time).toLocaleString() : ''
}

// 检查是否有主观题
const hasSubjectiveQuestions = (row) => {
    return row.questions?.some(q => q.type === 'subjective') && row.status !== 'graded'
}

// 获取数据
const fetchData = () => {
    loading.value = true

    // 模拟API请求延迟
    setTimeout(() => {
        let filteredData = [...submissionData.value]

        // 应用搜索条件
        if (listQuery.title) {
            filteredData = filteredData.filter(item =>
                item.homeworkTitle.includes(listQuery.title))
        }

        if (listQuery.category) {
            filteredData = filteredData.filter(
                item => item.category === listQuery.category
            )
        }

        if (listQuery.studentName) {
            filteredData = filteredData.filter(
                item => item.studentName.includes(listQuery.studentName)
            )
        }

        // 应用排序
        if (listQuery.sort) {
            filteredData.sort((a, b) => {
                if (listQuery.order === 'ascending') {
                    return a[listQuery.sort] > b[listQuery.sort] ? 1 : -1
                } else {
                    return a[listQuery.sort] < b[listQuery.sort] ? 1 : -1
                }
            })
        }

        // 分页
        total.value = filteredData.length
        const start = (listQuery.page - 1) * listQuery.size
        const end = start + listQuery.size
        submissionList.value = filteredData.slice(start, end)

        loading.value = false
    }, 300)
}

// 搜索
const handleSearch = () => {
    listQuery.page = 1
    fetchData()
}

// 重置搜索
const resetSearch = () => {
    listQuery.title = ''
    listQuery.category = ''
    listQuery.studentName = ''
    handleSearch()
}

// 排序变化
const handleSortChange = ({ prop, order }) => {
    listQuery.sort = prop
    listQuery.order = order
    fetchData()
}

// 查看作业详情
const handleView = (row) => {
    currentItem.value = { ...row }
    detailDialogVisible.value = true
}

// 批改作业
const handleGrade = (row) => {
    currentItem.value = { ...row }
    gradeDialogVisible.value = true
}

// 从详情页批改
const handleGradeFromDetail = () => {
    detailDialogVisible.value = false
    handleGrade(currentItem.value)
}

// 提交批改结果
const handleGradeSubmit = (gradedData) => {
    const index = submissionData.value.findIndex(item => item.id === gradedData.id)
    if (index !== -1) {
        // 更新作业状态和分数
        submissionData.value[index] = {
            ...submissionData.value[index],
            ...gradedData,
            status: 'graded',
            score: gradedData.questions.reduce((sum, q) => sum + (q.studentScore || 0), 0)
        }
        
        ElMessage.success('作业批改成功')
        gradeDialogVisible.value = false
        fetchData()
    }
}

// 初始化
onMounted(() => {
    fetchData()
})
</script>

<style scoped>
h3 {
    margin: 0;
}

.filter-container {
    display: flex;
    justify-content: space-between;
    margin-bottom: 20px;

    .search-form {
        display: flex;
        align-items: center;
    }
}

.pagination-container {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
}

.high-score {
    color: #67c23a;
    font-weight: bold;
}

.low-score {
    color: #f56c6c;
    font-weight: bold;
}
</style>