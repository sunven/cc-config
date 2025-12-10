import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createBatchUpdater, debounce, throttle } from '../batchUpdater'

describe('createBatchUpdater', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should batch multiple updates', () => {
    const callback = vi.fn()
    const batcher = createBatchUpdater<number>(callback, 16)

    batcher.add(1)
    batcher.add(2)
    batcher.add(3)

    expect(callback).not.toHaveBeenCalled()

    vi.advanceTimersByTime(16)

    expect(callback).toHaveBeenCalledTimes(1)
    expect(callback).toHaveBeenCalledWith([1, 2, 3])
  })

  it('should flush immediately when max batch size reached', () => {
    const callback = vi.fn()
    const batcher = createBatchUpdater<number>(callback, 1000, 3)

    batcher.add(1)
    batcher.add(2)
    expect(callback).not.toHaveBeenCalled()

    batcher.add(3) // Triggers flush
    expect(callback).toHaveBeenCalledTimes(1)
    expect(callback).toHaveBeenCalledWith([1, 2, 3])
  })

  it('should allow manual flush', () => {
    const callback = vi.fn()
    const batcher = createBatchUpdater<number>(callback, 1000)

    batcher.add(1)
    batcher.add(2)
    batcher.flush()

    expect(callback).toHaveBeenCalledWith([1, 2])
  })

  it('should cancel pending updates', () => {
    const callback = vi.fn()
    const batcher = createBatchUpdater<number>(callback, 16)

    batcher.add(1)
    batcher.add(2)
    batcher.cancel()

    vi.advanceTimersByTime(100)

    expect(callback).not.toHaveBeenCalled()
  })

  it('should not call callback for empty batch', () => {
    const callback = vi.fn()
    const batcher = createBatchUpdater<number>(callback, 16)

    batcher.flush()

    expect(callback).not.toHaveBeenCalled()
  })
})

describe('debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should debounce function calls', () => {
    const fn = vi.fn()
    const debouncedFn = debounce(fn, 100)

    debouncedFn('a')
    debouncedFn('b')
    debouncedFn('c')

    expect(fn).not.toHaveBeenCalled()

    vi.advanceTimersByTime(100)

    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenCalledWith('c')
  })

  it('should allow cancellation', () => {
    const fn = vi.fn()
    const debouncedFn = debounce(fn, 100)

    debouncedFn('test')
    debouncedFn.cancel()

    vi.advanceTimersByTime(200)

    expect(fn).not.toHaveBeenCalled()
  })

  it('should allow immediate flush', () => {
    const fn = vi.fn()
    const debouncedFn = debounce(fn, 100)

    debouncedFn('test')
    debouncedFn.flush()

    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenCalledWith('test')
  })

  it('should reset timer on new calls', () => {
    const fn = vi.fn()
    const debouncedFn = debounce(fn, 100)

    debouncedFn('a')
    vi.advanceTimersByTime(50)
    debouncedFn('b')
    vi.advanceTimersByTime(50)
    debouncedFn('c')
    vi.advanceTimersByTime(100)

    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenCalledWith('c')
  })
})

describe('throttle', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should throttle function calls', () => {
    const fn = vi.fn()
    const throttledFn = throttle(fn, 100)

    throttledFn('a') // Executes immediately
    throttledFn('b') // Queued

    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenCalledWith('a')

    vi.advanceTimersByTime(100)

    expect(fn).toHaveBeenCalledTimes(2)
    expect(fn).toHaveBeenLastCalledWith('b')
  })

  it('should allow cancellation', () => {
    const fn = vi.fn()
    const throttledFn = throttle(fn, 100)

    throttledFn('a')
    throttledFn('b')
    throttledFn.cancel()

    vi.advanceTimersByTime(200)

    expect(fn).toHaveBeenCalledTimes(1) // Only initial call
  })

  it('should execute immediately if limit passed', () => {
    const fn = vi.fn()
    const throttledFn = throttle(fn, 100)

    throttledFn('a')
    expect(fn).toHaveBeenCalledTimes(1)

    vi.advanceTimersByTime(100)

    throttledFn('b')
    expect(fn).toHaveBeenCalledTimes(2)
  })
})
