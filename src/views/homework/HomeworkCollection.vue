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
                        <el-select v-model="listQuery.courseName" placeholder="请选择课程类别" clearable>
                            <el-option v-for="item in categories" :key="item.value" :label="item.label"
                                :value="item.value" />
                        </el-select>
                    </el-form-item>
                    <el-form-item label="作业名称">
                        <el-input v-model="listQuery.homeworkName" placeholder="请输入作业名称" clearable />
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
                <el-table-column label="作业名称" prop="homeworkName" min-width="150" align="center" sortable="custom" />
                <el-table-column label="课程类别" prop="courseName" width="120" align="center" sortable="custom">
                    <template #default="{ row }">
                        {{ row.courseName }}
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
                        <span
                            :class="{ 'high-score': row.score / row.total_score >= 0.8, 'low-score': row.score / row.total_score < 0.6 }">
                            {{ row.score }} / {{ row.total_score }}
                        </span>
                    </template>
                </el-table-column>
                <el-table-column label="状态" prop="isMarked" width="120" align="center" sortable="custom">
                    <template #default="{ row }">
                        <el-tag :type="getStatusType(row.isMarked)" size="small">
                            {{ getStatusLabel(row.isMarked) }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column label="操作" width="220" align="center" fixed="right">
                    <template #default="{ row }">
                        <el-button type="primary" size="small" @click="handleView(row)">
                            查看作业
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
            <HomeworkSubmissionDetail v-if="detailDialogVisible" :submissionData="currentItem" :categories="categories"
                @grade="handleGradeFromDetail" @close="detailDialogVisible = false" />
        </el-dialog>

    </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import HomeworkSubmissionDetail from '@/components/HomeworkSubmissionDetail.vue'
import { useAuthStore } from '@/stores/authStore'
const authStore = useAuthStore()

// 课程类别选项
const categories = ref([])
import { getTeacherCourseList } from '@/api/course'
const fetchTeacherCourseList = async () => {
    try {
        const response = await getTeacherCourseList(authStore.token)
        if (response && Array.isArray(response)) {
            categories.value = response.map(item => ({
                value: item.course,    // 使用课程ID作为value
                label: item.course // 使用课程名称作为label
            }))
        } else {
            ElMessage.error('获取课程列表失败: 无效的响应格式')
        }
    } catch (error) {
        console.error('获取课程列表错误:', error)
        ElMessage.error('获取课程列表失败: ' + (error.message || '网络错误'))
    }
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

// 作业提交数据
const submissionData = ref([])
import { getHomeworkList } from '@/api/homework'
const fetchHomeworkList = async () => {
    try {
        const response = await getHomeworkList(authStore.token)
        if (response && Array.isArray(response)) {
            submissionData.value = response
        } else {
            ElMessage.error('获取作业列表失败: 无效的响应格式')
        }
    } catch (error) {
        console.error('获取作业列表错误:', error)
        ElMessage.error('获取作业列表失败: ' + (error.message || '网络错误'))
    }
}

const submissionList = ref([])
const loading = ref(false)

// 查询参数
const listQuery = reactive({
    page: 1,
    size: 10,
    homeworkName: '',
    courseName: '',
    studentName: '',
    sort: '',
    order: ''
})

const total = ref(0)

// 对话框状态
const detailDialogVisible = ref(false)
const currentItem = ref({})

// 格式化时间
const formatTime = (time) => {
    return time ? new Date(time).toLocaleString() : ''
}


// 获取数据
const fetchData = () => {
    loading.value = true
    fetchHomeworkList()
    // 模拟API请求延迟
    setTimeout(() => {
        let filteredData = [...submissionData.value]

        // 应用搜索条件
        if (listQuery.homeworkName) {
            filteredData = filteredData.filter(item =>
                item.homeworkName.includes(listQuery.homeworkName))
        }

        if (listQuery.courseName) {
            filteredData = filteredData.filter(
                item => item.courseName === listQuery.courseName
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
    listQuery.homeworkName = ''
    listQuery.courseName = ''
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
import { getHomeworkDetail } from '@/api/homework'
const handleView = (row) => {
    // 保存原始行数据
    const originalData = { ...row }
    // 准备请求参数
    const requestData = {
        homeworkId: row.homeworkId,
        sUsername: row.sUsername
    }
    // 获取作业详情
    loading.value = true
    getHomeworkDetail(authStore.token, requestData)
        .then(response => {
            if (response) {
                // 合并API返回的数据和原始行数据
                currentItem.value = {
                    ...originalData,
                    list: response.list
                }
                detailDialogVisible.value = true
            } else {
                ElMessage.error('获取作业详情失败: 无效的响应格式')
            }
        })
        .catch(error => {
            console.error('获取作业详情错误:', error)
            ElMessage.error('获取作业详情失败: ' + (error.message || '网络错误'))
        })
        .finally(() => {
            loading.value = false
        })
}


// 初始化
onMounted(() => {
    fetchData()
    fetchTeacherCourseList()
    fetchHomeworkList()
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