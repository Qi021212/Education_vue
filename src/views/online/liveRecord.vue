<template>
    <div class="video-container">
        <el-card class="box-card">
            <template #header>
                <div class="card-header">
                    <h3>直播记录</h3>
                </div>
            </template>

            <!-- 搜索和操作区域 -->
            <div class="filter-container">
                <el-form :inline="true" :model="listQuery" class="search-form">
                    <el-form-item label="标题">
                        <el-input v-model="listQuery.title" placeholder="请输入标题" clearable @keyup.enter="handleSearch" />
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
                        </el-icon> 添加记录
                    </el-button>
                    <el-button type="danger" :disabled="!selectedItems.length" @click="handleBatchDelete">
                        <el-icon>
                            <Delete />
                        </el-icon> 批量删除
                    </el-button>
                </div>
            </div>

            <!-- 表格区域 -->
            <el-table v-loading="loading" :data="recordList" border fit highlight-current-row style="width: 100%"
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
                <el-table-column label="录屏文件" min-width="120" align="center">
                    <template #default="{ row }">
                        <el-button type="primary" link @click="handlePlayVideo(row)" v-if="row.video">
                            播放录屏
                        </el-button>
                        <span v-else>无录屏</span>
                    </template>
                </el-table-column>
                <el-table-column label="添加时间" prop="addtime" width="160" align="center" sortable="custom">
                    <template #default="{ row }">
                        {{ formatTime(row.addtime) }}
                    </template>
                </el-table-column>
                <el-table-column label="操作" width="220" align="center" fixed="right">
                    <template #default="{ row }">
                        <el-button type="primary" size="small" @click="handleView(row)">
                            详情
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

        <!-- 添加/编辑表单 -->
        <LiveRecordForm v-model="formDialogVisible" :title="formTitle" :form-data="currentItem" 
            @submit="handleFormSubmit" @update:formData="handleFormDataUpdate" />

        <!-- 查看详情对话框 -->
        <el-dialog v-model="detailDialogVisible" title="直播详情" width="70%">
            <el-descriptions :column="2" border>
                <el-descriptions-item label="标题">{{ currentItem.title }}</el-descriptions-item>
                <el-descriptions-item label="录屏文件">
                    <el-button v-if="currentItem.video" type="primary" link @click="handlePlayVideo(currentItem)">
                        播放录屏
                    </el-button>
                    <span v-else>无录屏文件</span>
                </el-descriptions-item>
                <el-descriptions-item label="授课教师">{{ currentItem.tName }}</el-descriptions-item>
                <el-descriptions-item label="添加时间">{{ formatTime(currentItem.addtime) }}</el-descriptions-item>
            </el-descriptions>
            <template #footer>
                <span class="dialog-footer">
                    <el-button @click="detailDialogVisible = false">关闭</el-button>
                </span>
            </template>
        </el-dialog>

        <!-- 视频播放对话框 -->
        <el-dialog v-model="videoDialogVisible" title="直播录屏播放" width="800px" top="5vh" destroy-on-close>
            <video ref="videoEl" controls autoplay muted :src="currentVideoUrl"
                style="width: 100%; background: #000"></video>
            <template #footer>
                <div class="video-info">
                    <h4>{{ currentVideoTitle }}</h4>
                    <div class="video-stats">
                        <span>添加时间: {{ formatTime(currentVideoTime) }}</span>
                    </div>
                </div>
            </template>
        </el-dialog>
    </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Delete } from '@element-plus/icons-vue'
import LiveRecordForm from '@/components/LiveRecordForm.vue'
import { useAuthStore } from '@/stores/authStore'
const authStore = useAuthStore()

// 获取数据
const recordData = ref([])
import { getLiveRecordList, addLiveRecord, updateLiveRecord, deleteLiveRecord } from '@/api/online.js'

const fetchRecordData = async () => {
    try {
        const response = await getLiveRecordList()
        console.log('获取直播记录响应:', response)
        if (response && Array.isArray(response)) {
            recordData.value = response.map(item => ({
                ...item,
                addtime: item.addtime || new Date().toISOString()
            }))
            console.log('直播记录数据:', recordData.value)
        } else {
            ElMessage.error('获取直播记录失败: 无效的响应格式')
        }
    } catch (error) {
        console.error('获取直播记录错误:', error)
        ElMessage.error('获取直播记录失败: ' + (error.message || '网络错误'))
    }
}

// 数据状态
const recordList = ref([])
const loading = ref(false)
const selectedItems = ref([])

// 查询参数
const listQuery = reactive({
    page: 1,
    size: 10,
    title: '',
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
const currentVideoTime = ref('')
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
        let filteredData = [...recordData.value]
        console.log('filteredData:', filteredData)

        // 应用搜索条件
        if (listQuery.title) {
            filteredData = filteredData.filter(item =>
                item.title.includes(listQuery.title)
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
        recordList.value = filteredData.slice(start, end)

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

// 创建新记录
const handleCreate = () => {
    currentItem.value = {
        title: '',
        video: ''
    }
    formTitle.value = '添加直播记录'
    isEditMode.value = false
    formDialogVisible.value = true
}

// 编辑记录
const handleEdit = (row) => {
    currentItem.value = { ...row }
    formTitle.value = '编辑直播记录'
    isEditMode.value = true
    formDialogVisible.value = true
}

// 处理表单数据更新
const handleFormDataUpdate = (newFormData) => {
    currentItem.value = { ...currentItem.value, ...newFormData }
}

// 表单提交
const handleFormSubmit = async (formData) => {
    try {
        const submitData = {
            id: isEditMode.value ? currentItem.value.id : null,
            title: formData.title,
            video: formData.video,
            tUsername: authStore.userInfo.tUsername,
        };
        
        if (isEditMode.value) {
            // 更新现有记录
            const response = await updateLiveRecord(submitData);
            if (response) {
                fetchRecordData();
                ElMessage.success('直播记录更新成功');
            }
        } else {
            // 添加新记录
            const response = await addLiveRecord(submitData);
            if (response) {
                fetchRecordData();
                ElMessage.success('直播记录添加成功');
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
    currentVideoTime.value = row.addtime
    videoDialogVisible.value = true
}

// 删除记录
const handleDelete = (row) => {
    ElMessageBox.confirm('确认删除该直播记录吗?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
    }).then(() => {
        deleteLiveRecord([row.id]).then(() => {
            ElMessage.success('删除成功')
            fetchRecordData()
        }).catch(error => {
            console.error('删除直播记录失败:', error)
            ElMessage.error('删除失败: ' + (error.message || '网络错误'))
        })
    }).catch(() => {
        ElMessage.info('已取消删除')
    })
}

// 批量删除
const handleBatchDelete = () => {
    const ids = selectedItems.value.map(item => item.id)
    ElMessageBox.confirm(`确认删除选中的${ids.length}条直播记录吗?`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
    }).then(() => {
        deleteLiveRecord(ids).then(() => {
            selectedItems.value = []
            ElMessage.success(`成功删除${ids.length}条记录`)
            fetchRecordData()
        }).catch(error => {
            console.error('批量删除直播记录失败:', error)
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
    fetchRecordData()
    fetchData()
})
</script>

<style scoped>
h3 {
    margin: 0;
}

.el-select,
.el-input {
    width: 150px;
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
</style>