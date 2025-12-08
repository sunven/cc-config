import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ViewToggle } from '../ViewToggle'
import { useUiStore } from '../../stores/uiStore'

// Mock the store
vi.mock('../../stores/uiStore', () => ({
  useUiStore: vi.fn(),
}))

describe('ViewToggle', () => {
  it('should render merged and split view options', () => {
    const mockSetViewMode = vi.fn()
    ;(useUiStore as vi.MockedFunction<typeof useUiStore>).mockReturnValue({
      viewMode: 'merged',
      setViewMode: mockSetViewMode,
    } as any)

    render(<ViewToggle />)

    expect(screen.getByText('Merged View')).toBeInTheDocument()
    expect(screen.getByText('Split View')).toBeInTheDocument()
  })

  it('should call setViewMode when tab is clicked', async () => {
    const user = userEvent.setup()
    const mockSetViewMode = vi.fn()
    ;(useUiStore as vi.MockedFunction<typeof useUiStore>).mockReturnValue({
      viewMode: 'merged',
      setViewMode: mockSetViewMode,
    } as any)

    render(<ViewToggle />)

    await user.click(screen.getByText('Split View'))

    expect(mockSetViewMode).toHaveBeenCalledWith('split')
  })

  it('should show merged as active when viewMode is merged', () => {
    const mockSetViewMode = vi.fn()
    ;(useUiStore as vi.MockedFunction<typeof useUiStore>).mockReturnValue({
      viewMode: 'merged',
      setViewMode: mockSetViewMode,
    } as any)

    render(<ViewToggle />)

    const mergedTab = screen.getByText('Merged View')
    const splitTab = screen.getByText('Split View')

    expect(mergedTab).toHaveAttribute('data-state', 'active')
    expect(splitTab).toHaveAttribute('data-state', 'inactive')
  })

  it('should show split as active when viewMode is split', () => {
    const mockSetViewMode = vi.fn()
    ;(useUiStore as vi.MockedFunction<typeof useUiStore>).mockReturnValue({
      viewMode: 'split',
      setViewMode: mockSetViewMode,
    } as any)

    render(<ViewToggle />)

    const mergedTab = screen.getByText('Merged View')
    const splitTab = screen.getByText('Split View')

    expect(mergedTab).toHaveAttribute('data-state', 'inactive')
    expect(splitTab).toHaveAttribute('data-state', 'active')
  })

  it('should persist view preference to localStorage', async () => {
    const user = userEvent.setup()
    const mockSetViewMode = vi.fn()
    ;(useUiStore as vi.MockedFunction<typeof useUiStore>).mockReturnValue({
      viewMode: 'merged',
      setViewMode: mockSetViewMode,
    } as any)

    render(<ViewToggle />)

    await user.click(screen.getByText('Split View'))

    // The store uses persist middleware which should save to localStorage
    expect(mockSetViewMode).toHaveBeenCalledWith('split')
  })
})
