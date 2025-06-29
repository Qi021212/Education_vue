<template>
    <div class="homework-container">
        <el-card class="box-card">
            <template #header>
                <div class="card-header">
                    <h3>作业发布记录</h3>
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
                    <el-form-item label="发布时间">
                        <el-date-picker v-model="listQuery.dateRange" type="daterange" range-separator="至"
                            start-placeholder="开始日期" end-placeholder="结束日期" value-format="YYYY-MM-DD" clearable />
                    </el-form-item>
                    <el-form-item>
                        <el-button type="primary" @click="handleSearch">搜索</el-button>
                        <el-button @click="resetSearch">重置</el-button>
                    </el-form-item>
                </el-form>

                <div class="operation-buttons">
                    <el-button type="primary" @click="handleCreate">
                        <el-icon>
                            <Plus />
                        </el-icon> 发布作业
                    </el-button>
                    <el-button type="danger" :disabled="!selectedItems.length" @click="handleBatchDelete">
                        <el-icon>
                            <Delete />
                        </el-icon> 批量删除
                    </el-button>
                </div>
            </div>

            <!-- 表格区域 -->
            <el-table v-loading="loading" :data="homeworkList" border fit highlight-current-row style="width: 100%"
                @sort-change="handleSortChange" @selection-change="handleSelectionChange">
                <el-table-column type="selection" width="55" align="center" />
                <el-table-column label="序号" width="80" align="center" sortable="custom">
                    <template #default="{ $index }">
                        {{ (listQuery.page - 1) * listQuery.size + $index + 1 }}
                    </template>
                </el-table-column>
                <el-table-column label="作业名称" prop="title" min-width="120" align="center" sortable="custom">
                    <template #default="{ row }">
                        <span class="title-link" @click="handleView(row)">{{ row.title }}</span>
                    </template>
                </el-table-column>
                <el-table-column label="课程类别" prop="category" width="120" align="center" sortable="custom">
                    <template #default="{ row }">
                        {{ getCategoryLabel(row.category) }}
                    </template>
                </el-table-column>
                <el-table-column label="发布时间" prop="publishTime" width="160" align="center" sortable="custom">
                    <template #default="{ row }">
                        {{ formatTime(row.publishTime) }}
                    </template>
                </el-table-column>
                <el-table-column label="题目数量" prop="questionCount" width="120" align="center" sortable="custom" />
                <el-table-column label="总分" prop="totalScore" width="100" align="center" sortable="custom" />
                <el-table-column label="操作" width="220" align="center" fixed="right">
                    <template #default="{ row }">
                        <el-button type="primary" size="small" @click="handleView(row)">
                            查看
                        </el-button>
                        <el-button type="warning" size="small" @click="handleEdit(row)">
                            编辑
                        </el-button>
                        <el-button type="danger" size="small" @click="handleDelete(row)">
                            删除
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

        <!-- 发布/编辑作业对话框 -->
        <el-dialog v-model="formDialogVisible" :title="formTitle" width="70%">
            <HomeworkForm v-if="formDialogVisible" :form-data="currentItem" :categories="categories"
                :question-bank="questionBank" @submit="handleFormSubmit" @cancel="formDialogVisible = false" />
        </el-dialog>

        <!-- 作业详情对话框 -->
        <el-dialog v-model="detailDialogVisible" title="作业详情" width="80%">
            <HomeworkDetail v-if="detailDialogVisible" :homework-data="currentItem" @edit="handleEditFromDetail"
                @close="detailDialogVisible = false" />
        </el-dialog>
    </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Delete } from '@element-plus/icons-vue'
import HomeworkForm from '@/components/HomeworkForm.vue'
import HomeworkDetail from '@/components/HomeworkDetail.vue'

// 课程类别选项
const categories = [
    { value: 'math', label: '数学' },
    { value: 'english', label: '英语' },
    { value: 'computer', label: '计算机' },
    { value: 'physics', label: '物理' },
    { value: 'chemistry', label: '化学' }
]

// 获取课程标签
const getCategoryLabel = (value) => {
    const category = categories.find(item => item.value === value)
    return category ? category.label : value
}

// 模拟题库数据
const questionBank = ref([
    {
        id: 1,
        type: 'single',
        content: '1 + 1 = ?',
        options: ['1', '2', '3', '4'],
        answer: '2',
        score: 5,
        category: 'math'
    },
    {
        id: 2,
        type: 'multiple',
        content: '以下哪些是编程语言?',
        options: ['Java', 'Python', 'HTML', 'CSS'],
        answer: ['Java', 'Python'],
        score: 10,
        category: 'computer'
    },
    {
        id: 3,
        type: 'judge',
        content: 'Vue是一个前端框架',
        answer: true,
        score: 5,
        category: 'computer'
    },
    {
        id: 4,
        type: 'fill',
        content: '中国的首都是____',
        answer: '北京',
        score: 5,
        category: 'other'
    },
    {
        id: 5,
        type: 'subjective',
        content: '简述Vue的核心特性',
        answer: '',
        score: 20,
        category: 'computer'
    },
    // 更多题目...
])

// 模拟作业数据生成
const generateHomework = () => {
    const homework = []
    const now = new Date()

    for (let i = 1; i <= 25; i++) {
        const categoryIndex = i % categories.length
        const questions = []
        const questionCount = Math.floor(Math.random() * 5) + 3 // 3-7题
        let totalScore = 0

        for (let j = 0; j < questionCount; j++) {
            const qIndex = (i + j) % questionBank.value.length
            const question = { ...questionBank.value[qIndex] }
            questions.push(question)
            totalScore += question.score
        }

        homework.push({
            id: i,
            title: `${categories[categoryIndex].label}作业${i}`,
            category: categories[categoryIndex].value,
            publishTime: new Date(
                now.getFullYear(),
                now.getMonth(),
                now.getDate() - Math.floor(Math.random() * 30)
            ).toISOString(),
            questions,
            questionCount,
            totalScore
        })
    }

    return homework
}

// 数据状态
const homeworkData = ref(generateHomework())
const homeworkList = ref([])
const loading = ref(false)
const selectedItems = ref([])

// 查询参数
const listQuery = reactive({
    page: 1,
    size: 10,
    title: '',
    category: '',
    dateRange: [],
    sort: '',
    order: ''
})

const total = ref(0)

// 对话框状态
const formDialogVisible = ref(false)
const detailDialogVisible = ref(false)
const formTitle = ref('')
const currentItem = ref({})
const isEditMode = ref(false)

// 格式化时间
const formatTime = (time) => {
    return time ? new Date(time).toLocaleString() : ''
}

// 获取数据
const fetchData = () => {
    loading.value = true

    // 模拟API请求延迟
    setTimeout(() => {
        let filteredData = [...homeworkData.value]

        // 应用搜索条件
        if (listQuery.title) {
            filteredData = filteredData.filter(item =>
                item.title.includes(listQuery.title))
        }

        if (listQuery.category) {
            filteredData = filteredData.filter(
                item => item.category === listQuery.category
            )
        }

        // 应用日期范围筛选
        if (listQuery.dateRange && listQuery.dateRange.length === 2) {
            const [startDate, endDate] = listQuery.dateRange
            const start = new Date(startDate).getTime()
            const end = new Date(endDate).getTime() + 86400000 // 包含结束日期

            filteredData = filteredData.filter(item => {
                const time = new Date(item.publishTime).getTime()
                return time >= start && time <= end
            })
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
        homeworkList.value = filteredData.slice(start, end)

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
    listQuery.dateRange = []
    handleSearch()
}

// 排序变化
const handleSortChange = ({ prop, order }) => {
    listQuery.sort = prop
    listQuery.order = order
    fetchData()
}

// 多选变化
const handleSelectionChange = (items) => {
    selectedItems.value = items
}

// 创建新作业
const handleCreate = () => {
    currentItem.value = {
        id: undefined,
        title: '',
        category: '',
        questions: [],
        publishTime: new Date().toISOString()
    }
    formTitle.value = '发布新作业'
    isEditMode.value = false
    formDialogVisible.value = true
}

// 编辑作业
const handleEdit = (row) => {
    currentItem.value = { ...row }
    formTitle.value = '编辑作业内容'
    isEditMode.value = true
    formDialogVisible.value = true
}

// 从详情页编辑
const handleEditFromDetail = () => {
    detailDialogVisible.value = false
    handleEdit(currentItem.value)
}

// 表单提交
const handleFormSubmit = (formData) => {
    if (isEditMode.value) {
        // 更新现有作业
        const index = homeworkData.value.findIndex(item => item.id === formData.id)
        if (index !== -1) {
            homeworkData.value[index] = {
                ...homeworkData.value[index],
                ...formData,
                questionCount: formData.questions.length,
                totalScore: formData.questions.reduce((sum, q) => sum + q.score, 0)
            }
        }
        ElMessage.success('作业更新成功')
    } else {
        // 添加新作业
        const newId = Math.max(...homeworkData.value.map(item => item.id)) + 1
        homeworkData.value.unshift({
            id: newId,
            ...formData,
            questionCount: formData.questions.length,
            totalScore: formData.questions.reduce((sum, q) => sum + q.score, 0),
            publishTime: new Date().toISOString()
        })
        ElMessage.success('作业发布成功')
    }

    formDialogVisible.value = false
    fetchData()
}

// 查看详情
const handleView = (row) => {
    currentItem.value = { ...row }
    detailDialogVisible.value = true
}

// 删除作业
const handleDelete = (row) => {
    ElMessageBox.confirm('确认删除该作业吗?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
    }).then(() => {
        homeworkData.value = homeworkData.value.filter(item => item.id !== row.id)
        ElMessage.success('删除成功')
        fetchData()
    }).catch(() => {
        ElMessage.info('已取消删除')
    })
}

// 批量删除
const handleBatchDelete = () => {
    const ids = selectedItems.value.map(item => item.id)
    ElMessageBox.confirm(`确认删除选中的${ids.length}条作业记录吗?`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
    }).then(() => {
        homeworkData.value = homeworkData.value.filter(item => !ids.includes(item.id))
        selectedItems.value = []
        ElMessage.success(`成功删除${ids.length}条作业记录`)
        fetchData()
    }).catch(() => {
        ElMessage.info('已取消删除')
    })
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

    .operation-buttons {
        margin-left: 20px;
    }
}

.pagination-container {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
}

.title-link {
    color: #409eff;
    cursor: pointer;

    &:hover {
        text-decoration: underline;
    }
}
</style>