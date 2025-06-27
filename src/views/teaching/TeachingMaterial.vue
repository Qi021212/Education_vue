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
            <el-select v-model="listQuery.category" placeholder="请选择课程类别" clearable>
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
        <el-table-column label="课程类别" prop="category" width="120" align="center" sortable="custom"> </el-table-column>
        <el-table-column label="图片" width="120" align="center">
          <template #default="{ row }">
            <el-image v-if="row.image" style="width: 80px; height: 60px" :src="row.image"
              :preview-src-list="[row.image]" fit="cover" preview-teleported hide-on-click-modal />
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
    <MaterialForm v-model="formDialogVisible" :title="formTitle" :form-data="currentItem" :categories="categories"
      @submit="handleFormSubmit" />

    <!-- 查看详情对话框 -->
    <el-dialog v-model="detailDialogVisible" title="教学资料详情" width="60%">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="标题">{{ currentItem.title }}</el-descriptions-item>
        <el-descriptions-item label="课程类别">{{ currentItem.category }}</el-descriptions-item>
        <el-descriptions-item label="发布时间">{{ formatTime(currentItem.publishTime) }}</el-descriptions-item>
        <el-descriptions-item label="点击次数">{{ currentItem.clickCount }}</el-descriptions-item>
        <el-descriptions-item label="评论数">{{ currentItem.commentCount }}</el-descriptions-item>
        <el-descriptions-item label="收藏数">{{ currentItem.favoriteCount }}</el-descriptions-item>
        <el-descriptions-item label="图片" :span="2">
          <el-image v-if="currentItem.image" style="width: 200px; height: 150px" :src="currentItem.image" fit="cover" />
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

// 课程类别选项
const categories = [
  { value: 'math', label: '数学' },
  { value: 'english', label: '英语' },
  { value: 'computer', label: '计算机' },
  { value: 'physics', label: '物理' },
  { value: 'chemistry', label: '化学' }
]

// 模拟数据生成
const generateMaterials = () => {
  const materials = []
  const now = new Date()

  for (let i = 1; i <= 35; i++) {
    const categoryIndex = i % categories.length
    materials.push({
      id: i,
      title: `教学资料标题${i}`,
      category: categories[categoryIndex].value,
      image: `https://picsum.photos/200/150?random=${i}`,
      attachment: {
        name: `资料_${i}.pdf`,
        url: `https://example.com/files/material_${i}.pdf`
      },
      publishTime: new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() - Math.floor(Math.random() * 30)
      ).toISOString(),
      clickCount: Math.floor(Math.random() * 500),
      commentCount: Math.floor(Math.random() * 50),
      favoriteCount: Math.floor(Math.random() * 200),
      content: `这是第${i}个教学资料的内容，包含相关课程的知识点和讲解。`
    })
  }

  return materials
}

// 数据状态
const materialData = ref(generateMaterials())
const materialList = ref([])
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
    let filteredData = [...materialData.value]

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

// 创建新资料
const handleCreate = () => {
  currentItem.value = {
    id: undefined,
    title: '',
    category: '',
    image: '',
    attachment: null,
    content: ''
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

// 表单提交
const handleFormSubmit = (formData) => {
  if (isEditMode.value) {
    // 更新现有资料
    const index = materialData.value.findIndex(item => item.id === formData.id)
    if (index !== -1) {
      materialData.value[index] = {
        ...materialData.value[index],
        ...formData
      }
    }
    ElMessage.success('资料更新成功')
  } else {
    // 添加新资料
    const newId = Math.max(...materialData.value.map(item => item.id)) + 1
    materialData.value.unshift({
      id: newId,
      ...formData,
      publishTime: new Date().toISOString(),
      clickCount: 0,
      commentCount: 0,
      favoriteCount: 0
    })
    ElMessage.success('资料添加成功')
  }

  formDialogVisible.value = false
  fetchData()
}

// 查看详情
const handleView = (row) => {
  currentItem.value = { ...row }
  detailDialogVisible.value = true
}

// 下载附件
const handleDownload = (attachment) => {
  // 模拟下载
  const link = document.createElement('a')
  link.href = attachment.url
  link.download = attachment.name
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  ElMessage.success('开始下载附件')
}

// 删除资料
const handleDelete = (row) => {
  ElMessageBox.confirm('确认删除该教学资料吗?', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    materialData.value = materialData.value.filter(item => item.id !== row.id)
    ElMessage.success('删除成功')
    fetchData()
  }).catch(() => {
    ElMessage.info('已取消删除')
  })
}

// 批量删除
const handleBatchDelete = () => {
  const ids = selectedItems.value.map(item => item.id)
  ElMessageBox.confirm(`确认删除选中的${ids.length}条教学资料吗?`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    materialData.value = materialData.value.filter(item => !ids.includes(item.id))
    selectedItems.value = []
    ElMessage.success(`成功删除${ids.length}条资料`)
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

.content-box {
  white-space: pre-wrap;
  line-height: 1.6;
  padding: 10px;
  background-color: #f5f7fa;
  border-radius: 4px;
}
</style>