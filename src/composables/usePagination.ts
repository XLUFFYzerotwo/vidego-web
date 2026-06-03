import { ref } from 'vue'
import type { PageParams } from '@/types/api'

export function usePagination(defaultSize = 10) {
  const page = ref(1)
  const size = ref(defaultSize)
  const total = ref(0)
  const loading = ref(false)

  function toParams(): PageParams {
    return { page: page.value, size: size.value }
  }

  function onPageChange(p: number) {
    page.value = p
  }

  function onSizeChange(s: number) {
    size.value = s
    page.value = 1
  }

  function reset() {
    page.value = 1
    total.value = 0
  }

  return { page, size, total, loading, toParams, onPageChange, onSizeChange, reset }
}
