import { ref, onMounted, onBeforeUnmount, nextTick, type Ref } from 'vue'
import * as echarts from 'echarts'
import type { EChartsOption, ECharts } from 'echarts'

export function useECharts(
  containerRef: Ref<HTMLElement | null>,
  getOption: () => EChartsOption
) {
  const chartInstance = ref<ECharts | null>(null)

  const initChart = async () => {
    await nextTick()
    if (!containerRef.value) return

    if (chartInstance.value) {
      chartInstance.value.dispose()
    }

    chartInstance.value = echarts.init(containerRef.value)
    chartInstance.value.setOption(getOption())
  }

  const updateChart = () => {
    if (chartInstance.value) {
      chartInstance.value.setOption(getOption(), true)
    }
  }

  const resizeChart = () => {
    chartInstance.value?.resize()
  }

  const disposeChart = () => {
    if (chartInstance.value) {
      chartInstance.value.dispose()
      chartInstance.value = null
    }
  }

  onMounted(() => {
    initChart()
    window.addEventListener('resize', resizeChart)
  })

  onBeforeUnmount(() => {
    window.removeEventListener('resize', resizeChart)
    disposeChart()
  })

  return {
    chartInstance,
    initChart,
    updateChart,
    resizeChart,
    disposeChart
  }
}
