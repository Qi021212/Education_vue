<template>
    <div class="ai-prepare-container">
        <el-card class="box-card">
            <template #header>
                <div class="card-header">
                    <h3>AI智能备课</h3>
                </div>
            </template>

            <!-- 备课参数设置区域 -->
            <div class="filter-container">
                <el-form :inline="true" :model="prepareQuery" class="search-form">
                    <div class="form-row">
                        <el-form-item label="学科" required class="form-item">
                            <el-select v-model="prepareQuery.subject" placeholder="请选择学科" clearable>
                                <el-option v-for="item in subjectOptions" :key="item.value" :label="item.label"
                                    :value="item.value" />
                            </el-select>
                        </el-form-item>

                        <el-form-item label="年级" required class="form-item">
                            <el-select v-model="prepareQuery.grade" placeholder="请选择年级" clearable>
                                <el-option v-for="item in gradeOptions" :key="item.value" :label="item.label"
                                    :value="item.value" />
                            </el-select>
                        </el-form-item>

                        <el-form-item label="章节/主题" class="form-item">
                            <el-input v-model="prepareQuery.topic" placeholder="请输入章节或主题" clearable />
                        </el-form-item>

                        <el-form-item class="form-item">
                            <el-button type="primary" @click="generatePlan" :loading="generating">
                                <el-icon>
                                    <MagicStick />
                                </el-icon> 生成
                            </el-button>
                            <el-button @click="resetQuery">重置</el-button>
                        </el-form-item>
                    </div>
                </el-form>
            </div>

            <!-- 生成结果区域 -->
            <div class="result-container" v-loading="generating">
                <el-tabs v-model="activeTab" type="border-card">
                    <el-tab-pane label="教学计划" name="plan">
                        <div class="content-box" v-html="cleanMarkdown(result.plan)"></div>
                    </el-tab-pane>
                    <el-tab-pane label="教案" name="lessonPlan">
                        <div class="content-box" v-html="cleanMarkdown(result.lessonPlan)"></div>
                    </el-tab-pane>
                    <el-tab-pane label="课件大纲" name="pptOutline">
                        <div class="content-box" v-html="cleanMarkdown(result.pptOutline)"></div>
                    </el-tab-pane>
                    <el-tab-pane label="课堂活动" name="activities">
                        <div class="content-box" v-html="cleanMarkdown(result.activities)"></div>
                    </el-tab-pane>
                </el-tabs>
            </div>

            <!-- 历史记录 -->
            <div class="history-container">
                <div class="history-header">
                    <h4>历史备课记录</h4>
                    <el-button type="danger" @click="deleteHistory" size="small">
                        清空全部
                    </el-button>
                </div>
                <el-table :data="historyList" border style="width: 100%">
                    <el-table-column prop="createdTime" label="生成时间" width="180" />
                    <el-table-column prop="subject" label="学科" width="180" />
                    <el-table-column prop="grade" label="年级" width="120" />
                    <el-table-column prop="topic" label="主题" />
                    <el-table-column label="操作" width="180">
                        <template #default="{ row }">
                            <el-button type="text" @click="loadHistory(row)">查看</el-button>
                        </template>
                    </el-table-column>
                </el-table>
            </div>
        </el-card>
    </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { MagicStick } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/authStore'
import { aiPrepareLesson } from '@/api/teaching'

const authStore = useAuthStore()

// 备课参数
const prepareQuery = reactive({
    subject: '',
    grade: '',
    topic: ''
})

// 学科选项
const subjectOptions = ref([])

import { getTeacherCourseList } from '@/api/course'
const fetchTeacherCourseList = async () => {
  try {
    const response = await getTeacherCourseList(useAuthStore().token)
    if (response && Array.isArray(response)) {
      subjectOptions.value = response.map(item => ({
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


// 年级选项
const gradeOptions = [
    { value: '一年级', label: '一年级' },
    { value: '二年级', label: '二年级' },
    { value: '三年级', label: '三年级' },
    { value: '四年级', label: '四年级' },
    { value: '五年级', label: '五年级' },
    { value: '六年级', label: '六年级' },
    { value: '七年级', label: '七年级' },
    { value: '八年级', label: '八年级' },
    { value: '九年级', label: '九年级' },
    { value: '高一', label: '高一' },
    { value: '高二', label: '高二' },
    { value: '高三', label: '高三' },
    { value: '大学', label: '大学' }
]

// 类型映射
const typeMap = {
    plan: 1,       // 教学计划
    lessonPlan: 2, // 教案
    pptOutline: 3, // 课件大纲
    activities: 4  // 课堂活动
}

// 生成结果
const result = reactive({
    plan: '',
    lessonPlan: '',
    pptOutline: '',
    activities: ''
})

// 当前激活的标签页
const activeTab = ref('plan')

// 加载状态
const generating = ref(false)

// 历史记录
const historyList = ref([])

// 重置查询条件
const resetQuery = () => {
    prepareQuery.subject = ''
    prepareQuery.grade = ''
    prepareQuery.topic = ''
}

// 生成备课方案
const generatePlan = async () => {
    if (!prepareQuery.subject || !prepareQuery.grade) {
        ElMessage.warning('请选择学科和年级')
        return
    }

    generating.value = true
    // 清空之前的结果
    Object.keys(result).forEach(key => result[key] = '')

    try {
        const response = await aiPrepareLesson({
            subject: prepareQuery.subject,
            grade: prepareQuery.grade,
            topic: prepareQuery.topic
        })

        if (response) {
            // Assuming the API returns all content in one response
            // Update based on your actual API response structure
            result.plan = response.plan || '暂无教学计划内容'
            result.lessonPlan = response.lessonPlan || '暂无教案内容'
            result.pptOutline = response.Outline || '暂无课件大纲内容'
            result.activities = response.activities || '暂无课堂活动内容'

            // 自动切换到第一个有内容的标签页
            if (result.plan) {
                activeTab.value = 'plan'
            } else if (result.lessonPlan) {
                activeTab.value = 'lessonPlan'
            } else if (result.pptOutline) {
                activeTab.value = 'pptOutline'
            } else if (result.activities) {
                activeTab.value = 'activities'
            }

            ElMessage.success('备课方案生成完成')
        } else {
            ElMessage.error(response?.msg || '生成备课方案失败')
        }
    } catch (error) {
        console.error('生成备课方案失败:', error)
        ElMessage.error('生成备课方案失败: ' + (error.message))
    } finally {
        generating.value = false
    }
}


// 获取历史记录
import { getAIPlanHistory } from '@/api/teaching'
const fetchHistory = async () => {
    try {
        const response = await getAIPlanHistory()
        if (response) {
            historyList.value = response.map(item => ({
                ...item,
                createdTime: new Date(item.createdTime).toLocaleString() // 格式化时间
            }))
        } else {
            historyList.value = []
        }
    } catch (error) {
        console.error('获取历史记录失败:', error)
        ElMessage.error('获取历史记录失败')
    }
}

// 加载历史记录
const loadHistory = (item) => {
    prepareQuery.subject = item.subject
    prepareQuery.grade = item.grade
    prepareQuery.topic = item.topic

    // 加载所有四部分内容
    result.plan = item.plan || '暂无教学计划内容'
    result.lessonPlan = item.lessonPlan || '暂无教案内容'
    result.pptOutline = item.Outline || '暂无课件大纲内容'
    result.activities = item.activities || '暂无课堂活动内容'

    // 默认激活第一个标签页
    activeTab.value = 'plan'

    ElMessage.success('历史记录已加载')
}


// 删除历史记录
import { clearAIPlanHistory } from '@/api/teaching'
const deleteHistory = async () => {
    try {
        await ElMessageBox.confirm('确认清空所有历史记录吗? 此操作不可恢复', '警告', {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
        })

        await clearAIPlanHistory()
        ElMessage.success('历史记录已清空')
        historyList.value = [] // 清空本地历史记录列表
    } catch (error) {
        if (error !== 'cancel') {
            console.error('清空历史记录失败:', error)
            ElMessage.error('清空失败')
        }
    }
}

// Markdown内容格式转换
const cleanMarkdown = (text) => {
    if (!text) return '';

    // 替换 Markdown 标题符号
    let cleaned = text.replace(/^#+\s*/gm, '');

    // 其他可能的清理（可选）
    cleaned = cleaned.replace(/\*\*(.*?)\*\*/g, '$1'); // 移除加粗
    cleaned = cleaned.replace(/\*(.*?)\*/g, '$1');      // 移除斜体

    // 保留换行格式
    cleaned = cleaned.replace(/\n/g, '<br>');

    return cleaned;
};


// 初始化
onMounted(() => {
    fetchHistory()
    fetchTeacherCourseList()
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

.el-select,
.el-input {
    width: 140px;
}

.result-container {
    margin-bottom: 30px;
    min-height: 400px;

    .content-box {
        padding: 15px;
        background-color: #f9f9f9;
        border-radius: 4px;
        min-height: 300px;

        :deep(h1),
        :deep(h2),
        :deep(h3) {
            margin: 15px 0 10px 0;
        }

        :deep(p) {
            margin: 8px 0;
            line-height: 1.6;
        }

        :deep(ul),
        :deep(ol) {
            padding-left: 20px;
        }

        :deep(li) {
            margin: 5px 0;
        }
    }

    .action-buttons {
        margin-top: 15px;
        text-align: right;
    }
}

.content-box {
    white-space: pre-wrap;
    /* 保留换行和空格 */
}

.content-box h1,
.content-box h2,
.content-box h3 {
    font-weight: bold;
    margin: 1em 0 0.5em 0;
}

/* 隐藏 Markdown 符号但不删除它们 */
.content-box :deep(:is(h1, h2, h3)::before) {
    content: none !important;
}

.history-container {
    margin-top: 30px;
}

.history-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
}

.history-header h4 {
    margin: 0;
    font-size: 16px;
    color: #666;
}
</style>