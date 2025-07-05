<template>
    <div class="video-container">
        <el-card class="box-card">
            <template #header>
                <div class="card-header">
                    <h3>教学视频管理</h3>
                </div>
            </template>

            <!-- 搜索和操作区域 -->
            <div class="filter-container">
                <el-form :inline="true" :model="listQuery" class="search-form">
                    <el-form-item label="标题">
                        <el-input v-model="listQuery.title" placeholder="请输入标题" clearable @keyup.enter="handleSearch" />
                    </el-form-item>
                    <el-form-item label="课程类别">
                        <el-select v-model="listQuery.course" placeholder="请选择课程类别" clearable>
                            <el-option v-for="item in categories" :key="item.value" :label="item.label"
                                :value="item.value" />
                        </el-select>
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
                        </el-icon> 添加视频
                    </el-button>
                    <el-button type="danger" :disabled="!selectedItems.length" @click="handleBatchDelete">
                        <el-icon>
                            <Delete />
                        </el-icon> 批量删除
                    </el-button>
                </div>
            </div>

            <!-- 表格区域 -->
            <el-table v-loading="loading" :data="videoList" border fit highlight-current-row style="width: 100%"
                @sort-change="handleSortChange" @selection-change="handleSelectionChange">
                <el-table-column type="selection" width="55" align="center" />
                <el-table-column label="序号" width="80" align="center" sortable="custom">
                    <template #default="{ $index }">
                        {{ (listQuery.page - 1) * listQuery.size + $index + 1 }}
                    </template>
                </el-table-column>
                <el-table-column label="标题" prop="title" min-width="150" align="center" sortable="custom">
                    <template #default="{ row }">
                        <span class="title-link" @click="handleView(row)">{{ row.title }}</span>
                    </template>
                </el-table-column>
                <el-table-column label="课程类别" prop="course" width="120" align="center" sortable="custom">
                </el-table-column>
                <el-table-column label="封面" width="150" align="center">
                    <template #default="{ row }">
                        <el-image v-if="row.cover" style="width: 120px; height: 80px" :src="row.cover"
                            :preview-src-list="[row.cover]" fit="cover" preview-teleported hide-on-click-modal />
                        <span v-else>无封面</span>
                    </template>
                </el-table-column>
                <el-table-column label="教学视频" min-width="120" align="center">
                    <template #default="{ row }">
                        <el-button type="primary" link @click="handlePlayVideo(row)">
                            预览
                        </el-button>
                    </template>
                </el-table-column>
                <el-table-column label="发布时间" prop="addtime" width="160" align="center" sortable="custom">
                    <template #default="{ row }">
                        {{ formatTime(row.addtime) }}
                    </template>
                </el-table-column>
                <el-table-column label="点击次数" prop="clicknum" width="120" align="center" sortable="custom" />
                <el-table-column label="评论数" prop="discussnum" width="100" align="center" sortable="custom" />
                <el-table-column label="收藏数" prop="storeupnum" width="100" align="center" sortable="custom" />
                <el-table-column label="操作" width="220" align="center" fixed="right">
                    <template #default="{ row }">
                        <el-button type="primary" size="small" @click="handleView(row)">
                            查看
                        </el-button>
                        <el-button type="warning" size="small" @click="handleEdit(row)">
                            修改
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

        <!-- 添加/编辑表单 -->
        <VideoForm v-model="formDialogVisible" :title="formTitle" :form-data="currentItem" :categories="categories"
            @submit="handleFormSubmit" @update:formData="handleFormDataUpdate" />

        <!-- 查看详情对话框 -->
        <el-dialog v-model="detailDialogVisible" title="教学视频详情" width="70%">
            <el-descriptions :column="2" border>
                <el-descriptions-item label="标题">{{ currentItem.title }}</el-descriptions-item>
                <el-descriptions-item label="课程类别">{{ currentItem.course }}</el-descriptions-item>
                <el-descriptions-item label="发布时间">{{ formatTime(currentItem.addtime) }}</el-descriptions-item>
                <el-descriptions-item label="点击次数">{{ currentItem.clicknum }}</el-descriptions-item>
                <el-descriptions-item label="评论数">{{ currentItem.discussnum }}</el-descriptions-item>
                <el-descriptions-item label="收藏数">{{ currentItem.storeupnum }}</el-descriptions-item>
                <el-descriptions-item label="封面" :span="2">
                    <el-image v-if="currentItem.cover" style="width: 200px; height: 150px" :src="currentItem.cover"
                        fit="cover" />
                    <span v-else>无封面</span>
                </el-descriptions-item>
                <el-descriptions-item label="内容" :span="2">
                    <div class="content-box">{{ currentItem.intro }}</div>
                </el-descriptions-item>
            </el-descriptions>
            <template #footer>
                <span class="dialog-footer">
                    <el-button @click="detailDialogVisible = false">关闭</el-button>
                </span>
            </template>
        </el-dialog>

        <!-- 视频播放对话框 -->
        <el-dialog v-model="videoDialogVisible" title="视频播放" width="800px" top="5vh" destroy-on-close>
            <video ref="videoEl" controls autoplay muted :src="currentVideoUrl"
                style="width: 100%; background: #000"></video>
            <template #footer>
                <div class="video-info">
                    <h4>{{ currentVideoTitle }}</h4>
                </div>
            </template>
        </el-dialog>
    </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Delete } from '@element-plus/icons-vue'
import VideoForm from '@/components/VideoForm.vue'
import { useAuthStore } from '@/stores/authStore'
const authStore = useAuthStore()

// 课程类别选项
const categories = ref([])
import { getCourseList, getTeacherCourseList } from '@/api/course'
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

// 获取数据
const videoData = ref([])
import { getTeachingVideoList } from '@/api/teaching'
const fetchVideoData = async () => {
    try {
        const response = await getTeachingVideoList(authStore.userInfo.t_username)
        if (response && Array.isArray(response)) {
            videoData.value = response.map(item => ({
                ...item,
                addtime: item.addtime || new Date().toISOString(), // 确保有时间戳
                clicknum: item.clicknum || 0,
                discussnum: item.discussnum || 0,
                storeupnum: item.storeupnum || 0
            }))
        } else {
            ElMessage.error('获取教学视频列表失败: 无效的响应格式')
        }
    } catch (error) {
        console.error('获取教学视频列表错误:', error)
        ElMessage.error('获取教学视频列表失败: ' + (error.message || '网络错误'))
    }
}

// 数据状态
const videoList = ref([])
const loading = ref(false)
const selectedItems = ref([])

// 查询参数
const listQuery = reactive({
    page: 1,
    size: 10,
    title: '',
    course: '',
    sort: '',
    order: ''
})

const total = ref(0)

// 对话框状态
const formDialogVisible = ref(false)
const detailDialogVisible = ref(false)
const videoDialogVisible = ref(false)
const formTitle = ref('')
const currentItem = ref({})
const isEditMode = ref(false)

// 视频播放相关
const currentVideoUrl = ref('')
const currentVideoTitle = ref('')
const videoEl = ref(null)

watch(videoDialogVisible, (visible) => {
    if (visible && videoEl.value) {
        videoEl.value.load()
    }
})


// 获取数据
const fetchData = () => {
    fetchVideoData()
    loading.value = true

    // 模拟API请求延迟
    setTimeout(() => {
        let filteredData = [...videoData.value]

        // 应用搜索条件
        if (listQuery.title) {
            filteredData = filteredData.filter(item =>
                item.title.includes(listQuery.title)
            )
        }

        if (listQuery.course) {
            filteredData = filteredData.filter(
                item => item.course === listQuery.course
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
        videoList.value = filteredData.slice(start, end)

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

// 创建新视频
const handleCreate = () => {
    currentItem.value = {
        title: '',
        course: '',
        cover: '',
        video: '',
        intro: ''
    }
    formTitle.value = '添加教学视频'
    isEditMode.value = false
    formDialogVisible.value = true
}

// 编辑视频
const handleEdit = (row) => {
    currentItem.value = { ...row }
    formTitle.value = '编辑教学视频'
    isEditMode.value = true
    formDialogVisible.value = true
}

// 处理表单数据更新
const handleFormDataUpdate = (newFormData) => {
    currentItem.value = { ...currentItem.value, ...newFormData }
}

import { addTeachingVideo, updateTeachingVideo } from '@/api/teaching'
// 表单提交
const handleFormSubmit = async (formData) => {
    try {
        const submitData = {
            id: isEditMode.value ? currentItem.value.id : null, // 如果是编辑模式，传入ID
            title: formData.title,
            course: formData.course,
            cover: formData.cover,
            video: formData.video,
            intro: formData.intro
        };
        console.log('提交数据:', submitData);
        if (isEditMode.value === true) {
            // 更新现有资料
            const response = await updateTeachingVideo(submitData);
            if (response) {
                fetchData(); // 刷新数据
                ElMessage.success('资料更新成功');
            }
        } else {
            // 添加新资料
            const response = await addTeachingVideo(submitData);
            if (response) {
                fetchData(); // 刷新数据
                ElMessage.success('资料添加成功');
            }
        }
        formDialogVisible.value = false;
    } catch (error) {
        console.error('表单提交错误:', error);
        ElMessage.error('操作失败: ' + (error.message || '网络错误'));
    }
}

// 查看详情
const handleView = (row) => {
    currentItem.value = { ...row }
    detailDialogVisible.value = true
}

// 播放视频
const handlePlayVideo = (row) => {
    currentVideoUrl.value = row.video
    currentVideoTitle.value = row.title
    videoDialogVisible.value = true
}

// 删除视频
import { deleteTeachingVideo } from '@/api/teaching'
const handleDelete = (row) => {
    ElMessageBox.confirm('确认删除该教学视频吗?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
    }).then(() => {
        // 调用API删除资料，传入数组形式的id
        deleteTeachingVideo([row.id]).then(() => {
            ElMessage.success('删除成功')
            fetchData()
        }).catch(error => {
            console.error('删除视频失败:', error)
            ElMessage.error('删除失败: ' + (error.message || '网络错误'))
        })
    }).catch(() => {
        ElMessage.info('已取消删除')
    })
}

// 批量删除
const handleBatchDelete = () => {
    const ids = selectedItems.value.map(item => item.id)
    ElMessageBox.confirm(`确认删除选中的${ids.length}条教学视频吗?`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
    }).then(() => {
        deleteTeachingVideo(ids).then(() => {
            selectedItems.value = []
            ElMessage.success(`成功删除${ids.length}条视频`)
            fetchData()
        }).catch(error => {
            console.error('批量删除视频失败:', error)
            ElMessage.error('批量删除失败: ' + (error.message || '网络错误'))
        })
    }).catch(() => {
        ElMessage.info('已取消删除')
    })
}


// 格式化时间
const formatTime = (time) => {
    return time ? new Date(time).toLocaleString() : ''
}

// 初始化
onMounted(() => {
    fetchData()
    fetchTeacherCourseList()
    fetchVideoData()
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

.content-box {
    white-space: pre-wrap;
    line-height: 1.6;
    padding: 10px;
    background-color: #f5f7fa;
    border-radius: 4px;
}

.video-player {
    width: 100%;
    height: 450px;
}

.video-info {
    padding: 10px;

    h4 {
        margin: 0 0 10px 0;
    }

    .video-stats {
        display: flex;
        justify-content: space-between;
        color: #666;
        font-size: 14px;
    }
}

:deep(.video-js) {
    width: 100% !important;
    height: 450px !important;
}
</style>