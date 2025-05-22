import { useEffect, useState } from 'react'

/**
 * 입력값에 debounce를 적용하는 훅
 * @param value 원본 값
 * @param delay 지연 시간 (ms)
 * @returns debounce가 적용된 값
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(timer)
    }
  }, [value, delay])

  return debouncedValue
} 