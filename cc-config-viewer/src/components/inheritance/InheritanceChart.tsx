/**
 * InheritanceChart component for Story 3.5
 *
 * Displays inheritance statistics visualization using Nivo charts.
 * Supports both pie chart and bar chart views with the established
 * color palette (Blue for inherited, Green for project-specific).
 */

import React from 'react'
import type { InheritanceStats } from '../../utils/statsCalculator'
import { ResponsivePie } from '@nivo/pie'
import { ResponsiveBar } from '@nivo/bar'

interface InheritanceChartProps {
  stats: InheritanceStats | null
  chartType?: 'pie' | 'bar'
  height?: number
  theme?: 'light' | 'dark'
  animate?: boolean
  showLegend?: boolean
}

// Color palette from Stories 3.1/3.3
const COLORS = {
  inherited: '#3B82F6', // Blue
  projectSpecific: '#10B981' // Green
}

export function InheritanceChart({
  stats,
  chartType = 'pie',
  height = 256,
  theme = 'light',
  animate = true,
  showLegend = false
}: InheritanceChartProps) {
  // Handle missing stats
  if (!stats) {
    return (
      <div
        data-testid="chart-container"
        className="flex items-center justify-center h-64 text-gray-500"
      >
        No data available
      </div>
    )
  }

  // Transform stats to pie chart data format
  const pieData = [
    {
      id: 'Inherited',
      label: 'Inherited',
      value: stats.inherited.count,
      color: COLORS.inherited
    },
    {
      id: 'Project-specific',
      label: 'Project-specific',
      value: stats.projectSpecific.count,
      color: COLORS.projectSpecific
    }
  ]

  // Transform stats to bar chart data format
  const barData = [
    {
      category: 'Inherited',
      count: stats.inherited.count,
      percentage: stats.inherited.percentage
    },
    {
      category: 'Project-specific',
      count: stats.projectSpecific.count,
      percentage: stats.projectSpecific.percentage
    }
  ]

  const heightClass = height <= 200 ? 'h-48' : height <= 300 ? 'h-64' : 'h-96'

  if (chartType === 'bar') {
    return (
      <div
        data-testid="chart-container"
        className={`${heightClass} ${theme === 'dark' ? 'dark' : ''}`}
        style={{ height }}
      >
        <ResponsiveBar
          data={barData}
          keys={['count']}
          indexBy="category"
          colors={({ data }) =>
            data.category === 'Inherited' ? COLORS.inherited : COLORS.projectSpecific
          }
          animate={animate}
          theme={{
            textColor: theme === 'dark' ? '#ffffff' : '#1f2937',
            tooltip: {
              container: {
                background: theme === 'dark' ? '#1f2937' : '#ffffff',
                color: theme === 'dark' ? '#ffffff' : '#1f2937'
              }
            }
          }}
          margin={{ top: 20, right: 20, bottom: 50, left: 60 }}
          padding={0.3}
          axisBottom={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: 0
          }}
          axisLeft={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: 0,
            legend: 'Count',
            legendPosition: 'middle',
            legendOffset: -50
          }}
          labelSkipWidth={12}
          labelSkipHeight={12}
        />
      </div>
    )
  }

  // Default pie chart
  return (
    <div
      data-testid="chart-container"
      className={`${heightClass} ${theme === 'dark' ? 'dark' : ''}`}
      style={{ height }}
    >
      <ResponsivePie
        data={pieData}
        innerRadius={0.5}
        padAngle={0.7}
        cornerRadius={3}
        activeOuterRadiusOffset={8}
        colors={({ datum }) => datum.data.color}
        borderWidth={1}
        borderColor={{ from: 'color', modifiers: [['darker', 0.2]] }}
        animate={animate}
        theme={{
          textColor: theme === 'dark' ? '#ffffff' : '#1f2937',
          tooltip: {
            container: {
              background: theme === 'dark' ? '#1f2937' : '#ffffff',
              color: theme === 'dark' ? '#ffffff' : '#1f2937'
            }
          }
        }}
        margin={{ top: 40, right: 80, bottom: 80, left: 80 }}
        arcLinkLabelsSkipAngle={10}
        arcLinkLabelsTextColor={{ from: 'color', modifiers: [['darker', 2]] }}
        arcLinkLabelsThickness={2}
        arcLinkLabelsColor={{ from: 'color' }}
        arcLabelsSkipAngle={10}
        arcLabelsTextColor={{ from: 'color', modifiers: [['darker', 2]] }}
        legends={showLegend ? [
          {
            anchor: 'bottom',
            direction: 'row',
            justify: false,
            translateX: 0,
            translateY: 56,
            itemsSpacing: 0,
            itemWidth: 100,
            itemHeight: 18,
            itemTextColor: theme === 'dark' ? '#ffffff' : '#1f2937',
            itemDirection: 'left-to-right',
            itemOpacity: 1,
            symbolSize: 18,
            symbolShape: 'circle'
          }
        ] : []}
      />
    </div>
  )
}