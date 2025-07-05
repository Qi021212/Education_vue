<template>
  <div class="material-container">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <h3>教学资料管理</h3>
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
              <el-option v-for="item in categories" :key="item.value" :label="item.label" :value="item.value" />
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
            </el-icon> 添加资料
          </el-button>
          <el-button type="danger" :disabled="!selectedItems.length" @click="handleBatchDelete">
            <el-icon>
              <Delete />
            </el-icon> 批量删除
          </el-button>
        </div>
      </div>

      <!-- 表格区域 -->
      <el-table v-loading="loading" :data="materialList" border fit highlight-current-row style="width: 100%"
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
        <el-table-column label="课程类别" prop="course" width="120" align="center" sortable="custom"> </el-table-column>
        <el-table-column label="图片" width="120" align="center">
          <template #default="{ row }">
            <el-image v-if="row.picture" style="width: 80px; height: 60px" :src="row.picture"
              :preview-src-list="[row.picture]" fit="cover" preview-teleported hide-on-click-modal />
            <span v-else>无图片</span>
          </template>
        </el-table-column>
        <el-table-column label="附件" width="100" align="center">
          <template #default="{ row }">
            <el-button v-if="row.attachment" type="primary" link @click="handleDownload(row.attachment)">
              下载
            </el-button>
            <span v-else>无附件</span>
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
    <MaterialForm v-model="formDialogVisible" :title="formTitle" :form-data="currentItem" :categories="categories"
      @submit="handleFormSubmit" @update:formData="handleFormDataUpdate" />

    <!-- 查看详情对话框 -->
    <el-dialog v-model="detailDialogVisible" title="教学资料详情" width="60%">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="标题">{{ currentItem.title }}</el-descriptions-item>
        <el-descriptions-item label="课程类别">{{ currentItem.course }}</el-descriptions-item>
        <el-descriptions-item label="发布时间">{{ formatTime(currentItem.addtime) }}</el-descriptions-item>
        <el-descriptions-item label="点击次数">{{ currentItem.clicknum }}</el-descriptions-item>
        <el-descriptions-item label="评论数">{{ currentItem.discussnum }}</el-descriptions-item>
        <el-descriptions-item label="收藏数">{{ currentItem.storeupnum }}</el-descriptions-item>
        <el-descriptions-item label="图片" :span="2">
          <el-image v-if="currentItem.picture" style="width: 200px; height: 150px" :src="currentItem.picture"
            fit="cover" />
          <span v-else>无图片</span>
        </el-descriptions-item>
        <el-descriptions-item label="附件" :span="2">
          <el-button v-if="currentItem.attachment" type="primary" @click="handleDownload(currentItem.attachment)">
            下载附件
          </el-button>
          <span v-else>无附件</span>
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
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Delete } from '@element-plus/icons-vue'
import MaterialForm from '@/components/MaterialForm.vue'
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
const materialData = ref([])
import { getTeachingMaterialList } from '@/api/teaching'
const fetchMaterialData = async () => {
  try {
    const response = await getTeachingMaterialList(authStore.userInfo.t_username)
    if (response && Array.isArray(response)) {
      materialData.value = response.map(item => ({
        ...item,
        addtime: item.addtime || new Date().toISOString(), // 确保有时间戳
        clicknum: item.clicknum || 0,
        discussnum: item.discussnum || 0,
        storeupnum: item.storeupnum || 0
      }))
    } else {
      ElMessage.error('获取教学资料列表失败: 无效的响应格式')
    }
  } catch (error) {
    console.error('获取教学资料列表错误:', error)
    ElMessage.error('获取教学资料列表失败: ' + (error.message || '网络错误'))
  }
}

// 数据状态
const materialList = ref([])
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
const formTitle = ref('')
const currentItem = ref({})
const isEditMode = ref(false)


// 格式化时间
const formatTime = (time) => {
  return time ? new Date(time).toLocaleString() : ''
}

// 获取数据
const fetchData = () => {
  fetchMaterialData()
  loading.value = true

  // 模拟API请求延迟
  setTimeout(() => {
    let filteredData = [...materialData.value]

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
    materialList.value = filteredData.slice(start, end)

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
  listQuery.course = ''
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

// 创建新资料
const handleCreate = () => {
  currentItem.value = {
    title: '',
    course: '',
    picture: '',
    attachment: null,
    content: '',
    addtime: new Date().toISOString(),
    clicknum: 0,
    discussnum: 0,
    storeupnum: 0
  }
  formTitle.value = '添加教学资料'
  isEditMode.value = false
  formDialogVisible.value = true
}

// 编辑资料
const handleEdit = (row) => {
  currentItem.value = { ...row }
  formTitle.value = '编辑教学资料'
  isEditMode.value = true
  formDialogVisible.value = true
}

// 处理表单数据更新
const handleFormDataUpdate = (newFormData) => {
  currentItem.value = { ...currentItem.value, ...newFormData }
}

import { addTeachingMaterial, updateTeachingMaterial } from '@/api/teaching'
// 表单提交
const handleFormSubmit = async (formData) => {
  try {
    const submitData = {
      id: isEditMode.value ? currentItem.value.id : null, // 如果是编辑模式，传入ID
      title: formData.title,
      course: formData.course,
      picture: formData.picture,
      attachment: formData.attachment,
      content: formData.content
    };
    console.log('提交数据:', submitData);
    if (isEditMode.value === true) {
      // 更新现有资料
      const response = await updateTeachingMaterial(submitData);
      if (response) {
        fetchData(); // 刷新数据
        ElMessage.success('资料更新成功');
      }
    } else {
      // 添加新资料
      const response = await addTeachingMaterial(submitData);
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

// 下载附件
const handleDownload = async (attachment) => {
  try {
    // 检查附件是否存在
    if (!attachment) {
      ElMessage.warning('没有可下载的附件');
      return;
    }

    let downloadUrl = '';
    let filename = 'download';

    // 处理不同类型的附件数据
    if (typeof attachment === 'string') {
      // 处理旧数据：只有URL字符串的情况
      downloadUrl = attachment;
      filename = attachment.split('/').pop() || filename;
    } else if (attachment.url) {
      // 处理新数据：包含url和name的对象
      downloadUrl = attachment.url;
      filename = attachment.name || attachment.url.split('/').pop() || filename;
    } else {
      ElMessage.error('附件格式不支持');
      return;
    }

    // 检查URL是否有效
    if (!downloadUrl.startsWith('http') && !downloadUrl.startsWith('/')) {
      ElMessage.error('附件URL格式不正确');
      return;
    }

    // 创建下载链接
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);

    // 处理下载完成/失败事件
    link.onload = () => {
      clearTimeout(timeout);
      document.body.removeChild(link);
      ElMessage.success('下载开始');
    };

    link.onerror = () => {
      clearTimeout(timeout);
      document.body.removeChild(link);
      ElMessage.error('下载失败，请检查附件链接');
    };

    // 触发下载
    link.click();

  } catch (error) {
    console.error('下载附件出错:', error);
    ElMessage.error(`下载失败: ${error.message || '未知错误'}`);
  }
};

// 删除资料
import { deleteTeachingMaterial } from '@/api/teaching'
const handleDelete = (row) => {
  ElMessageBox.confirm('确认删除该教学资料吗?', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    // 调用API删除资料，传入数组形式的id
    deleteTeachingMaterial([row.id]).then(() => {
      ElMessage.success('删除成功')
      fetchData()
    }).catch(error => {
      console.error('删除资料失败:', error)
      ElMessage.error('删除失败: ' + (error.message || '网络错误'))
    })
  }).catch(() => {
    ElMessage.info('已取消删除')
  })
}

// 批量删除
const handleBatchDelete = () => {
  const ids = selectedItems.value.map(item => item.id)
  if (ids.length === 0) {
    ElMessage.warning('请先选择要删除的资料')
    return
  }

  ElMessageBox.confirm(`确认删除选中的${ids.length}条教学资料吗?`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    // 调用API批量删除资料，直接传入ids数组
    deleteTeachingMaterial(ids).then(() => {
      selectedItems.value = []
      ElMessage.success(`成功删除${ids.length}条资料`)
      fetchData()
    }).catch(error => {
      console.error('批量删除资料失败:', error)
      ElMessage.error('批量删除失败: ' + (error.message || '网络错误'))
    })
  }).catch(() => {
    ElMessage.info('已取消删除')
  })
}

// 初始化
onMounted(() => {
  fetchData()
  fetchTeacherCourseList()
  fetchMaterialData()
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
</style>