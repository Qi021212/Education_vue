<template>
  <div class="analysis-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <h3>成绩分析</h3>
        </div>
      </template>

      <!-- 考试选择 + 导出 -->
      <el-form inline class="select-form">
        <el-form-item label="选择考试记录">
          <el-select v-model="selectedExamName" placeholder="请选择考试记录" @change="fetchAnalysisData">
            <el-option
              v-for="exam in examList"
              :key="exam.examId"
              :label="exam.examName"
              :value="exam.examName"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="exportScore">导出成绩</el-button>
        </el-form-item>
      </el-form>

      <!-- 图表区 -->
      <div class="chart-wrapper">
        <div class="chart-box">
          <v-chart :option="barOption" autoresize style="height: 400px;" />
        </div>
        <div class="chart-box">
          <v-chart :option="pieOption" autoresize style="height: 400px;" />
        </div>
      </div>

      <!-- 平均分、AI按钮 -->
      <div class="stat-card">
        <el-card shadow="hover">
          <div class="stat-row">
            <p><strong>考试平均分：</strong><span class="highlight">{{ averageScore }}</span> 分</p>
            <el-button type="success" @click="showAiDialog = true">AI成绩分析</el-button>
          </div>
        </el-card>
      </div>
    </el-card>

    <!-- AI 分析弹窗 -->
    <el-dialog v-model="showAiDialog" title="AI成绩分析" width="600px">
      <div class="ai-content">
        <p v-if="aiAnalysisResult">{{ aiAnalysisResult }}</p>
        <p v-else>正在加载分析结果...</p>
      </div>
      <template #footer>
        <el-button @click="showAiDialog = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import axios from 'axios'
import request from '@/utils/request'
import VChart from 'vue-echarts'

const examList = ref([])
const selectedExamName = ref(null)
const scoreData = ref([])

const averageScore = ref(0)
const barOption = ref({})
const pieOption = ref({})

const showAiDialog = ref(false)
const aiAnalysisResult = ref('')

// 获取考试列表
const fetchExamList = async () => {
  try {
    const res = await request.get('/exam/examAnalysis')
    examList.value = res.data
    if (examList.value.length) {
      selectedExamName.value = examList.value[0].examName
      fetchAnalysisData()
    }
  } catch (error) {
    console.error('获取考试列表失败:', error)
  }
}

// 获取成绩数据
const fetchAnalysisData = async () => {
  if (!selectedExamName.value) return
  try {
    const res = await axios.get('/smartEdu/examrecord/resultList')
    const filtered = res.data.data.filter(e => e.examName === selectedExamName.value)
    scoreData.value = filtered.map(e => ({ student: e.studentName, score: e.totalScore }))

    const ranges = [
      { name: '90-100', min: 90, max: 100, count: 0 },
      { name: '80-89', min: 80, max: 89, count: 0 },
      { name: '70-79', min: 70, max: 79, count: 0 },
      { name: '60-69', min: 60, max: 69, count: 0 },
      { name: '0-59', min: 0, max: 59, count: 0 }
    ]

    let totalScore = 0
    scoreData.value.forEach(({ score }) => {
      totalScore += score
      const range = ranges.find(r => score >= r.min && score <= r.max)
      if (range) range.count++
    })

    averageScore.value = scoreData.value.length ? (totalScore / scoreData.value.length).toFixed(2) : 0

    barOption.value = {
      title: { text: '分数段人数分布', left: 'center' },
      tooltip: {},
      xAxis: { type: 'category', data: ranges.map(r => r.name) },
      yAxis: { type: 'value' },
      series: [
        {
          name: '人数',
          type: 'bar',
          data: ranges.map(r => r.count),
          itemStyle: { color: '#6AAB9C' }
        }
      ]
    }

    pieOption.value = {
      title: { text: '分数段比例', left: 'center' },
      tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
      legend: { bottom: 10, left: 'center' },
      series: [
        {
          name: '比例',
          type: 'pie',
          radius: '50%',
          data: ranges.map(r => ({ name: r.name, value: r.count })),
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          },
          label: {
            formatter: '{b}\n{d}%',
            fontWeight: 'bold'
          }
        }
      ]
    }
  } catch (error) {
    console.error('获取成绩数据失败:', error)
  }
}

// 动态获取 AI 分析结果
watch(showAiDialog, async (visible) => {
  if (visible && selectedExamName.value) {
    aiAnalysisResult.value = '正在加载分析结果...'
    try {
      const token = localStorage.getItem('token') || ''
      const res = await axios.post('/smartEdu/ai/analyze', null, {
        params: { examName: selectedExamName.value },
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      aiAnalysisResult.value = res.data
    } catch (error) {
      console.error('获取AI分析失败:', error)
      aiAnalysisResult.value = 'AI分析加载失败，请稍后重试。'
    }
  }
})

// 导出成绩
const exportScore = () => {
  if (!selectedExamName.value) return
  const params = new URLSearchParams({
    examName: selectedExamName.value
  }).toString()
  window.open(`/smartEdu/exam/exportExcel?${params}`, '_blank')
}

onMounted(fetchExamList)
</script>

<style scoped>
h3 {
  margin: 0;
}
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.select-form {
  margin-bottom: 20px;
}
.chart-wrapper {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}
.chart-box {
  flex: 1;
  min-width: 300px;
}
.stat-card {
  margin-top: 20px;
}
.stat-row {
  display: flex;
  align-items: center;
  gap: 40px;
  flex-wrap: wrap;
}
.stat-row p {
  font-size: 16px;
  margin: 0;
}
.highlight {
  color: #409EFF;
  font-weight: bold;
}
.el-input,
.el-select {
  width: 160px;
}
.ai-content {
  font-size: 15px;
  line-height: 1.8;
  color: #333;
  white-space: pre-line;
}
</style>
