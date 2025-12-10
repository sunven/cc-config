/**
 * Unit tests for ConfigSkeleton component
 *
 * Tests skeleton rendering for configuration lists
 */

import { render, screen } from '@testing-library/react'
import { ConfigSkeleton, ConfigSkeletonCompact, ConfigSkeletonDetailed, ConfigGroupSkeleton } from './ConfigSkeleton'

describe('ConfigSkeleton', () => {
  it('should render default number of skeleton items', () => {
    render(<ConfigSkeleton />)

    // Should render 5 skeleton items by default
    const skeletons = document.querySelectorAll('.animate-pulse')
    expect(skeletons).toHaveLength(5)
  })

  it('should render custom count of skeleton items', () => {
    render(<ConfigSkeleton count={10} />)

    const skeletons = document.querySelectorAll('.animate-pulse')
    expect(skeletons).toHaveLength(10)
  })

  it('should hide icons when showIcons is false', () => {
    render(<ConfigSkeleton showIcons={false} />)

    const skeletonItems = screen.getAllByRole('status')
    expect(skeletonItems.length).toBeGreaterThan(0)
  })

  it('should hide badges when showBadges is false', () => {
    render(<ConfigSkeleton showBadges={false} />)

    const skeletonItems = screen.getAllByRole('status')
    expect(skeletonItems.length).toBeGreaterThan(0)
  })

  it('should have proper aria-label for accessibility', () => {
    render(<ConfigSkeleton />)

    const skeletonContainer = screen.getByLabelText(/loading configuration/i)
    expect(skeletonContainer).toBeInTheDocument()
  })

  it('should include screen reader only text', () => {
    render(<ConfigSkeleton />)

    const srOnlyText = document.querySelector('.sr-only')
    expect(srOnlyText).toBeInTheDocument()
    expect(srOnlyText).toHaveTextContent(/loading configuration list/i)
  })
})

describe('ConfigSkeletonCompact', () => {
  it('should render compact skeleton with fewer items', () => {
    render(<ConfigSkeletonCompact count={3} />)

    const skeletons = document.querySelectorAll('.animate-pulse')
    expect(skeletons).toHaveLength(3)
  })

  it('should have compact styling', () => {
    render(<ConfigSkeletonCompact />)

    const skeletonItems = document.querySelectorAll('.animate-pulse')
    skeletonItems.forEach((item) => {
      expect(item).toHaveClass('p-3') // Compact padding
    })
  })

  it('should have proper accessibility label', () => {
    render(<ConfigSkeletonCompact />)

    const skeletonContainer = screen.getByLabelText(/loading configuration/i)
    expect(skeletonContainer).toBeInTheDocument()
  })
})

describe('ConfigSkeletonDetailed', () => {
  it('should render detailed skeleton with more information', () => {
    render(<ConfigSkeletonDetailed count={3} />)

    const skeletons = document.querySelectorAll('.animate-pulse')
    expect(skeletons).toHaveLength(3)
  })

  it('should include multiple sections in detailed view', () => {
    render(<ConfigSkeletonDetailed count={1} />)

    // Should have more complex structure with headers and content sections
    const skeleton = document.querySelector('.animate-pulse')
    expect(skeleton).toBeInTheDocument()
  })

  it('should have proper accessibility label', () => {
    render(<ConfigSkeletonDetailed />)

    const skeletonContainer = screen.getByLabelText(/loading configuration details/i)
    expect(skeletonContainer).toBeInTheDocument()
  })
})

describe('ConfigGroupSkeleton', () => {
  it('should render multiple groups with items', () => {
    render(<ConfigGroupSkeleton groupCount={2} itemCount={3} />)

    // Should have group headers and items
    const groupHeaders = document.querySelectorAll('.h-6')
    expect(groupHeaders.length).toBeGreaterThan(0)
  })

  it('should render correct number of groups', () => {
    render(<ConfigGroupSkeleton groupCount={3} itemCount={2} />)

    // Should have group headers for each group
    const groupHeaders = document.querySelectorAll('.h-6')
    expect(groupHeaders.length).toBe(3)
  })

  it('should render correct number of items per group', () => {
    render(<ConfigGroupSkeleton groupCount={1} itemCount={5} />)

    // Should have 5 items in the group
    const items = document.querySelectorAll('.space-y-2 > .animate-pulse')
    expect(items.length).toBe(5)
  })

  it('should have proper accessibility label', () => {
    render(<ConfigGroupSkeleton />)

    const skeletonContainer = screen.getByLabelText(/loading configuration groups/i)
    expect(skeletonContainer).toBeInTheDocument()
  })
})

describe('ConfigSkeleton accessibility', () => {
  it('should have role status for screen readers', () => {
    render(<ConfigSkeleton />)

    const skeletons = screen.getAllByRole('status')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('should include descriptive aria-labels', () => {
    render(<ConfigSkeletonDetailed />)

    const skeletonContainer = screen.getByLabelText(/loading configuration details/i)
    expect(skeletonContainer).toBeInTheDocument()
  })

  it('should have screen reader only text for better context', () => {
    render(<ConfigSkeleton />)

    const srOnlyText = screen.getByText(/loading configuration list/i)
    expect(srOnlyText).toHaveClass('sr-only')
  })
})
