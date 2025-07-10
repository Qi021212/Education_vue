<template>
    <div class="homework-container">
        <el-card>
            <template #header>
                <h3>作业发布记录</h3>
            </template>

            <!-- 搜索区域 -->
            <div class="filter-container">
                <el-form :inline="true" :model="listQuery" class="search-form">
                    <el-form-item>
                        <el-input v-model="listQuery.name" placeholder="请输入作业名称" clearable />
                    </el-form-item>
                    <el-form-item>
                        <el-select v-model="listQuery.courseName" placeholder="请选择课程" clearable>
                            <el-option v-for="item in courseList" :key="item.value" :label="item.label"
                                :value="item.value" />
                        </el-select>
                    </el-form-item>
                    <el-form-item>
                        <el-date-picker v-model="listQuery.dateRange" type="daterange" range-separator="至"
                            start-placeholder="开始日期" end-placeholder="结束日期" value-format="YYYY-MM-DD" clearable />
                    </el-form-item>
                    <el-form-item>
                        <el-button type="primary" @click="handleSearch">搜索</el-button>
                        <el-button @click="resetSearch">重置</el-button>
                        <el-button type="success" @click="openCreateDialog">
                            <el-icon>
                                <Plus />
                            </el-icon> 发布作业
                        </el-button>
                    </el-form-item>
                </el-form>
            </div>

            <!-- 作业列表 -->
            <el-table v-loading="loading" :data="homeworkList" border stripe style="width: 100%; margin-top: 20px;"
                @sort-change="handleSortChange">
                <el-table-column label="序号" width="80" align="center" sortable="custom">
                    <template #default="{ $index }">
                        {{ (listQuery.page - 1) * listQuery.size + $index + 1 }}
                    </template>
                </el-table-column>
                <el-table-column prop="name" label="作业名称" width="180" sortable="custom" />
                <el-table-column prop="courseName" label="课程名称" width="180" sortable="custom" />
                <el-table-column prop="startTime" label="开始时间" width="180" sortable="custom">
                    <template #default="{ row }">
                        {{ formatTime(row.startTime) }}
                    </template>
                </el-table-column>
                <el-table-column prop="endTime" label="截止时间" width="180" sortable="custom">
                    <template #default="{ row }">
                        {{ formatTime(row.endTime) }}
                    </template>
                </el-table-column>
                <el-table-column label="操作" width="220" fixed="right">
                    <template #default="{ row }">
                        <el-button size="small" type="primary" @click="viewDetail(row)">查看</el-button>
                        <el-button size="small" type="warning" @click="editHomework(row)">编辑</el-button>
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

        <!-- 发布/编辑作业弹窗 -->
        <el-dialog :title="dialogTitle" v-model="formDialogVisible" width="700px" @closed="resetForm">
            <HomeworkForm v-if="formDialogVisible" :form-data="formData" :is-edit="isEditMode" @submit="handleSubmit"
                @cancel="formDialogVisible = false" :courseList="courseList" />
        </el-dialog>

        <!-- 作业详情弹窗 -->
        <el-dialog title="作业详情" v-model="detailDialogVisible" width="800px">
            <HomeworkDetail v-if="detailDialogVisible" :detail-data="currentDetail" @edit="editFromDetail"
                @close="detailDialogVisible = false" />
        </el-dialog>
    </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import HomeworkForm from '@/components/HomeworkForm.vue'
import HomeworkDetail from '@/components/HomeworkDetail.vue'
import { getPublishedHomeworkList, publishHomework, updateHomework, getHomeworkQuestions } from '@/api/homework'
import { getTeacherCourseList } from '@/api/course'
import { useAuthStore } from '@/stores/authStore'

const authStore = useAuthStore()

// 数据列表
const homeworkData = ref([])
const homeworkList = ref([])
const courseList = ref([])
const selectedItems = ref([])
const loading = ref(false)

// 查询参数
const listQuery = reactive({
    page: 1,
    size: 10,
    name: '',
    courseName: '',
    dateRange: [],
    sort: '',
    order: ''
})

const total = ref(0)

// 表单相关
const formDialogVisible = ref(false)
const detailDialogVisible = ref(false)
const isEditMode = ref(false)
const dialogTitle = ref('发布作业')
const formData = ref({
    id: '',
    name: '',
    courseId: null,
    paperId: null,
    sUsernames: [],
    deadline: '',
})
const currentDetail = ref({})

// 获取课程列表
const fetchTeacherCourseList = async () => {
    try {
        const response = await getTeacherCourseList(authStore.token)
        if (response && Array.isArray(response)) {
            courseList.value = response.map(item => ({
                value: item.id,    // 使用课程ID作为value
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

// 获取作业数据
const fetchHomeworkData = async () => {
    try {
        loading.value = true
        const response = await getPublishedHomeworkList()
        if (response && Array.isArray(response)) {
            homeworkData.value = response
            fetchData()
        } else {
            ElMessage.error('获取作业列表失败: 无效的响应格式')
        }
    } catch (error) {
        console.error('获取作业列表错误:', error)
        ElMessage.error('获取作业列表失败: ' + (error.message || '网络错误'))
    } finally {
        loading.value = false
    }
}

// 获取数据
const fetchData = () => {
    loading.value = true
    let filteredData = [...homeworkData.value]

    // 应用搜索条件
    if (listQuery.name) {
        filteredData = filteredData.filter(item =>
            item.name.includes(listQuery.name))
    }

    if (listQuery.courseName) {
        filteredData = filteredData.filter(
            item => item.courseName === listQuery.courseName
        )
    }

    if (listQuery.dateRange && listQuery.dateRange.length === 2) {
        const [startDate, endDate] = listQuery.dateRange
        filteredData = filteredData.filter(item => {
            const itemDate = dayjs(item.startTime).format('YYYY-MM-DD')
            return itemDate >= startDate && itemDate <= endDate
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
}

// 搜索
const handleSearch = () => {
    listQuery.page = 1
    fetchData()
}

// 重置搜索
const resetSearch = () => {
    listQuery.name = ''
    listQuery.courseName = ''
    listQuery.dateRange = []
    handleSearch()
}

// 排序变化
const handleSortChange = ({ prop, order }) => {
    listQuery.sort = prop
    listQuery.order = order
    fetchData()
}

// 格式化时间
const formatTime = (time) => {
    return time ? dayjs(time).format('YYYY-MM-DD HH:mm') : '-'
}


// 打开创建弹窗
const openCreateDialog = () => {
    isEditMode.value = false
    dialogTitle.value = '发布作业'
    formData.value = {
        name: '',
        paperId: '',
        courseId: '',
        sUsernames: [],
        startTime: '',
        endTime: '',
        status: 0,
        tUsername: authStore.username // 使用当前登录用户的用户名
    }
    formDialogVisible.value = true
}

// 提交表单
const handleSubmit = async (data) => {
    try {
        // 基础字段
        const payload = {
            name: data.name,
            paperId: data.paperId,
            startTime: data.startTime,
            endTime: data.endTime
        }

        if (isEditMode.value) {
            // 编辑模式只传必要字段
            payload.id = formData.value.id
            await updateHomework(payload)
            ElMessage.success('作业更新成功')
        } else {
            // 创建模式传所有必要字段
            await publishHomework({
                ...payload,
                status: 0,
                courseId: data.courseId,
                tUsername: authStore.userInfo.t_username,
                sUsernames: data.sUsernames
            })
            ElMessage.success('作业发布成功')
        }

        formDialogVisible.value = false
        fetchHomeworkData()
    } catch (error) {
        ElMessage.error(isEditMode.value ? '作业更新失败' : '作业发布失败')
    }
}

// 编辑作业
const editHomework = (row) => {
    isEditMode.value = true
    dialogTitle.value = '编辑作业'
    formData.value = {
        id: row.id,
        name: row.name,
        paperId: row.paperId,
        startTime: row.startTime,
        endTime: row.endTime
    }
    formDialogVisible.value = true
}

const viewDetail = async (row) => {
    try {
        loading.value = true

        currentDetail.value = {
            ...row,
            questions: []
        }

        const questionsRes = await getHomeworkQuestions({
            paperid: row.paperId,
            tUsername: authStore.userInfo.t_username
        })

        currentDetail.value.questions = questionsRes.map(item => ({
            id: item.questionId,
            content: item.questionName,
            options: item.options ? JSON.parse(item.options.replace(/\\"/g, '"')) : [],
            score: item.score,
            answer: item.answer,
            type: item.type,
            analysis: item.analysis
        }))

        detailDialogVisible.value = true
    } catch (error) {
        console.error('获取题目失败', error)
        ElMessage.error('获取作业详情失败')
    } finally {
        loading.value = false
    }
}


onMounted(() => {
    fetchTeacherCourseList()
    fetchHomeworkData()
})
</script>

<style scoped>
.filter-container {
    display: flex;
    justify-content: space-between;
    margin-bottom: 20px;
}

.search-form {
    display: flex;
    align-items: center;
}

h3 {
    margin: 0;
}

.el-select,
.el-input {
    width: 150px;
}

.pagination-container {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
}
</style>