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
                        <el-select v-model="listQuery.category" placeholder="请选择课程类别" clearable>
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
                <el-table-column label="课程类别" prop="category" width="120" align="center" sortable="custom">
                    <template #default="{ row }">
                        {{ getCategoryLabel(row.category) }}
                    </template>
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
                <el-table-column label="发布时间" prop="publishTime" width="160" align="center" sortable="custom">
                    <template #default="{ row }">
                        {{ formatTime(row.publishTime) }}
                    </template>
                </el-table-column>
                <el-table-column label="点击次数" prop="clickCount" width="120" align="center" sortable="custom" />
                <el-table-column label="评论数" prop="commentCount" width="100" align="center" sortable="custom" />
                <el-table-column label="收藏数" prop="favoriteCount" width="100" align="center" sortable="custom" />
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
            @submit="handleFormSubmit" />

        <!-- 查看详情对话框 -->
        <el-dialog v-model="detailDialogVisible" title="教学视频详情" width="70%">
            <el-descriptions :column="2" border>
                <el-descriptions-item label="标题">{{ currentItem.title }}</el-descriptions-item>
                <el-descriptions-item label="课程类别">{{ getCategoryLabel(currentItem.category) }}</el-descriptions-item>
                <el-descriptions-item label="发布时间">{{ formatTime(currentItem.publishTime) }}</el-descriptions-item>
                <el-descriptions-item label="点击次数">{{ currentItem.clickCount }}</el-descriptions-item>
                <el-descriptions-item label="评论数">{{ currentItem.commentCount }}</el-descriptions-item>
                <el-descriptions-item label="收藏数">{{ currentItem.favoriteCount }}</el-descriptions-item>
                <el-descriptions-item label="视频时长">{{ formatDuration(currentItem.duration) }}</el-descriptions-item>
                <el-descriptions-item label="封面" :span="2">
                    <el-image v-if="currentItem.cover" style="width: 200px; height: 150px" :src="currentItem.cover"
                        fit="cover" />
                    <span v-else>无封面</span>
                </el-descriptions-item>
                <el-descriptions-item label="内容" :span="2">
                    <div class="content-box">{{ currentItem.content }}</div>
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

// 课程类别选项
const categories = [
    { value: 'math', label: '数学' },
    { value: 'english', label: '英语' },
    { value: 'computer', label: '计算机' },
    { value: 'physics', label: '物理' },
    { value: 'chemistry', label: '化学' }
]

// 获取类别标签
const getCategoryLabel = (value) => {
    const category = categories.find(item => item.value === value)
    return category ? category.label : value
}

// 模拟数据生成
const generateVideos = () => {
    const videos = []
    const now = new Date()
    const videoUrls = '/videos/AAA.mp4'

    for (let i = 1; i <= 35; i++) {
        const categoryIndex = i % categories.length
        const duration = Math.floor(Math.random() * 3600) + 600 // 10-60分钟的视频
        videos.push({
            id: i,
            title: `教学视频标题${i}`,
            category: categories[categoryIndex].value,
            cover: `https://picsum.photos/300/200?random=${i}`,
            videoUrl: videoUrls,
            duration: duration,
            publishTime: new Date(
                now.getFullYear(),
                now.getMonth(),
                now.getDate() - Math.floor(Math.random() * 30)
            ).toISOString(),
            clickCount: Math.floor(Math.random() * 500),
            commentCount: Math.floor(Math.random() * 50),
            favoriteCount: Math.floor(Math.random() * 200),
            content: `这是第${i}个教学视频的内容描述，包含相关课程的知识点和讲解。`
        })
    }

    return videos
}

// 数据状态
const videoData = ref(generateVideos())
const videoList = ref([])
const loading = ref(false)
const selectedItems = ref([])

// 查询参数
const listQuery = reactive({
    page: 1,
    size: 10,
    title: '',
    category: '',
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

        if (listQuery.category) {
            filteredData = filteredData.filter(
                item => item.category === listQuery.category
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
        id: undefined,
        title: '',
        category: '',
        cover: '',
        videoUrl: '',
        duration: 0,
        content: ''
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

// 表单提交
const handleFormSubmit = (formData) => {
    if (isEditMode.value) {
        // 更新现有视频
        const index = videoData.value.findIndex(item => item.id === formData.id)
        if (index !== -1) {
            videoData.value[index] = {
                ...videoData.value[index],
                ...formData
            }
        }
        ElMessage.success('视频更新成功')
    } else {
        // 添加新视频
        const newId = Math.max(...videoData.value.map(item => item.id)) + 1
        videoData.value.unshift({
            id: newId,
            ...formData,
            publishTime: new Date().toISOString(),
            clickCount: 0,
            commentCount: 0,
            favoriteCount: 0
        })
        ElMessage.success('视频添加成功')
    }

    formDialogVisible.value = false
    fetchData()
}

// 查看详情
const handleView = (row) => {
    currentItem.value = { ...row }
    detailDialogVisible.value = true
}

// 播放视频
const handlePlayVideo = (row) => {
    currentVideoUrl.value = row.videoUrl
    currentVideoTitle.value = row.title
    videoDialogVisible.value = true

    // 模拟点击次数增加
    const index = videoData.value.findIndex(item => item.id === row.id)
    if (index !== -1) {
        videoData.value[index].clickCount++
        fetchData()
    }
}

// 删除视频
const handleDelete = (row) => {
    ElMessageBox.confirm('确认删除该教学视频吗?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
    }).then(() => {
        videoData.value = videoData.value.filter(item => item.id !== row.id)
        ElMessage.success('删除成功')
        fetchData()
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
        videoData.value = videoData.value.filter(item => !ids.includes(item.id))
        selectedItems.value = []
        ElMessage.success(`成功删除${ids.length}条视频`)
        fetchData()
    }).catch(() => {
        ElMessage.info('已取消删除')
    })
}


// 格式化时间
const formatTime = (time) => {
    return time ? new Date(time).toLocaleString() : ''
}

// 格式化时长
const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}分${secs}秒`
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