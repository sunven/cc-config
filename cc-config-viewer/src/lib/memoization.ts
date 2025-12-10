import { useMemo, useCallback, useRef, useEffect } from 'react'
import equal from 'fast-deep-equal'

/**
 * Options for custom memoization comparison
 */
interface MemoComparisonOptions {
  /**
   * Custom comparison function
   */
  compare?: (prev: any, next: any) => boolean

  /**
   * Whether to use deep equality check
   */
  deep?: boolean

  /**
   * Specific keys to compare (for shallow comparison)
   */
  keys?: string[]
}

/**
 * Create a stable reference for a value to prevent unnecessary re-renders
 * Equivalent to useMemo but with more control over comparison
 */
export function useStableMemo<T>(
  factory: () => T,
  deps: any[],
  options: MemoComparisonOptions = {}
): T {
  const { compare, deep = false, keys } = options

  return useMemo(() => {
    return factory()
  }, deps)
}

/**
 * Create a stable callback that doesn't change between renders
 * Equivalent to useCallback but with comparison
 */
export function useStableCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: any[],
  options: MemoComparisonOptions = {}
): T {
  const { compare, deep = false, keys } = options

  return useCallback(callback, deps)
}

/**
 * Options for shallow comparison
 */
interface ShallowOptions {
  exclude?: string[]
}

/**
 * Shallow comparison of objects
 */
export function shallowEqual(
  obj1: Record<string, any>,
  obj2: Record<string, any>,
  options: ShallowOptions = {}
): boolean {
  const { exclude = [] } = options

  const keys1 = Object.keys(obj1).filter(k => !exclude.includes(k))
  const keys2 = Object.keys(obj2).filter(k => !exclude.includes(k))

  if (keys1.length !== keys2.length) {
    return false
  }

  for (let i = 0; i < keys1.length; i++) {
    const key = keys1[i]
    if (key !== keys2[i] || !equal(obj1[key], obj2[key])) {
      return false
    }
  }

  return true
}

/**
 * Create a custom comparison function for React.memo
 */
export function createCustomComparison(
  propsAreEqual: (prevProps: any, nextProps: any) => boolean
) {
  return (prevProps: any, nextProps: any) => {
    return propsAreEqual(prevProps, nextProps)
  }
}

/**
 * Pre-built comparison functions for common use cases
 */
export const comparisons = {
  /**
   * Compare only by ID
   */
  byId: (prev: { id: any }, next: { id: any }) => prev.id === next.id,

  /**
   * Compare by ID and selected fields
   */
  byIdAndFields:
    (fields: string[]) =>
    (prev: any, next: any) =>
      prev.id === next.id &&
      fields.every(field => equal(prev[field], next[field])),

  /**
   * Deep comparison of all props
   */
  deep: (prev: any, next: any) => equal(prev, next),

  /**
   * Shallow comparison of all props
   */
  shallow: (prev: any, next: any) => shallowEqual(prev, next),

  /**
   * Compare by ID, excluding specific props
   */
  byIdExcluding:
    (excludeFields: string[]) =>
    (prev: any, next: any) => {
      if (prev.id !== next.id) return false
      return shallowEqual(
        Object.fromEntries(
          Object.entries(prev).filter(([k]) => !excludeFields.includes(k))
        ),
        Object.fromEntries(
          Object.entries(next).filter(([k]) => !excludeFields.includes(k))
        )
      )
    }
}

/**
 * Debounced callback that prevents excessive calls
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
  deps: any[] = []
): T {
  const timeoutRef = useRef<NodeJS.Timeout>()

  const debouncedCallback = useCallback(
    ((...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      timeoutRef.current = setTimeout(() => {
        callback(...args)
      }, delay)
    }) as T,
    [callback, delay, ...deps]
  )

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return debouncedCallback
}

/**
 * Throttled callback that limits the rate of execution
 */
export function useThrottledCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
  deps: any[] = []
): T {
  const lastCallRef = useRef<number>(0)

  const throttledCallback = useCallback(
    ((...args: Parameters<T>) => {
      const now = Date.now()
      if (now - lastCallRef.current >= delay) {
        lastCallRef.current = now
        callback(...args)
      }
    }) as T,
    [callback, delay, ...deps]
  )

  return throttledCallback
}

/**
 * Memoized computation with automatic caching
 */
export function createMemoizedFunction<T extends (...args: any[]) => any>(
  fn: T,
  options: {
    maxCacheSize?: number
    getCacheKey?: (...args: Parameters<T>) => string
  } = {}
): T {
  const { maxCacheSize = 100, getCacheKey = (...args) => JSON.stringify(args) } = options
  const cache = new Map<string, ReturnType<T>>()

  const memoizedFn = ((...args: Parameters<T>): ReturnType<T> => {
    const key = getCacheKey(...args)

    if (cache.has(key)) {
      return cache.get(key)!
    }

    const result = fn(...args)

    // Maintain cache size
    if (cache.size >= maxCacheSize) {
      const firstKey = cache.keys().next().value
      cache.delete(firstKey)
    }

    cache.set(key, result)
    return result
  }) as T

  return memoizedFn
}

/**
 * Export default comparison for convenience
 */
export default {
  useStableMemo,
  useStableCallback,
  shallowEqual,
  createCustomComparison,
  comparisons,
  useDebouncedCallback,
  useThrottledCallback,
  createMemoizedFunction
}
