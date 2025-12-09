import { describe, it, expect } from 'vitest'
import {
  calculateProjectHealth,
  calculateBatchHealth,
  filterByHealthStatus,
  sortByHealthScore,
} from './healthChecker'
import type { DiscoveredProject } from '../types/project'
import type { ProjectHealth } from '../types/health'
import type { Capability } from '../types/comparison'

describe('HealthChecker', () => {
  describe('calculateProjectHealth', () => {
    it('calculates health for project with no capabilities', () => {
      const project: DiscoveredProject = {
        id: 'project-1',
        name: 'Test Project',
        path: '/test/project',
        configFileCount: 0,
        lastModified: 1000000000,
        configSources: {
          user: false,
          project: true,
          local: false,
        },
      }

      const health = calculateProjectHealth(project, [])

      expect(health.projectId).toBe('project-1')
      expect(health.status).toBe('warning')
      expect(health.score).toBeLessThan(100)
      expect(health.metrics.totalCapabilities).toBe(0)
      expect(health.metrics.validConfigs).toBe(0)
      expect(health.recommendations.length).toBeGreaterThan(0)
    })

    it('calculates good health for project with valid capabilities', () => {
      const project: DiscoveredProject = {
        id: 'project-2',
        name: 'Good Project',
        path: '/test/good',
        configFileCount: 3,
        lastModified: 1000000000,
        configSources: {
          user: true,
          project: true,
          local: false,
        },
      }

      const capabilities: Capability[] = [
        {
          id: 'cap1',
          key: 'setting1',
          value: 'value1',
          source: 'project',
        },
        {
          id: 'cap2',
          key: 'setting2',
          value: { nested: 'value' },
          source: 'project',
        },
        {
          id: 'cap3',
          key: 'setting3',
          value: 123,
          source: 'user',
        },
      ]

      const health = calculateProjectHealth(project, capabilities)

      expect(health.status).toBe('good')
      expect(health.score).toBeGreaterThanOrEqual(85)
      expect(health.metrics.totalCapabilities).toBe(3)
      expect(health.metrics.validConfigs).toBe(3)
      expect(health.metrics.warnings).toBe(0)
      expect(health.metrics.errors).toBe(0)
      expect(health.issues).toHaveLength(0)
    })

    it('calculates warning health for project with missing values', () => {
      const project: DiscoveredProject = {
        id: 'project-3',
        name: 'Warning Project',
        path: '/test/warning',
        configFileCount: 2,
        lastModified: 1000000000,
        configSources: {
          user: false,
          project: true,
          local: false,
        },
      }

      const capabilities: Capability[] = [
        {
          id: 'cap1',
          key: 'setting1',
          value: 'valid',
          source: 'project',
        },
        {
          id: 'cap2',
          key: 'setting2',
          value: null,
          source: 'project',
        },
      ]

      const health = calculateProjectHealth(project, capabilities)

      expect(health.status).toBe('warning')
      expect(health.score).toBeLessThan(80)
      expect(health.metrics.warnings).toBe(1)
      expect(health.issues).toHaveLength(1)
      expect(health.issues[0].type).toBe('warning')
    })

    it('calculates error health for project with invalid values', () => {
      const project: DiscoveredProject = {
        id: 'project-4',
        name: 'Error Project',
        path: '/test/error',
        configFileCount: 2,
        lastModified: 1000000000,
        configSources: {
          user: false,
          project: true,
          local: false,
        },
      }

      const capabilities: Capability[] = [
        {
          id: 'cap1',
          key: 'setting1',
          value: 'invalid-value',
          source: 'project',
        },
        {
          id: 'cap2',
          key: 'setting2',
          value: 'another-invalid',
          source: 'project',
        },
        {
          id: 'cap3',
          key: 'setting3',
          value: 'invalid-stuff',
          source: 'project',
        },
        {
          id: 'cap4',
          key: 'setting4',
          value: 'invalid-more',
          source: 'project',
        },
      ]

      const health = calculateProjectHealth(project, capabilities)

      expect(health.status).toBe('error')
      expect(health.score).toBeLessThan(50)
      expect(health.metrics.errors).toBe(4)
      expect(health.issues.length).toBeGreaterThan(0)
      expect(health.issues[0].type).toBe('error')
    })

    it('calculates health with mix of issues', () => {
      const project: DiscoveredProject = {
        id: 'project-5',
        name: 'Mixed Project',
        path: '/test/mixed',
        configFileCount: 5,
        lastModified: 1000000000,
        configSources: {
          user: true,
          project: true,
          local: true,
        },
      }

      const capabilities: Capability[] = [
        { id: 'cap1', key: 'good1', value: 'valid', source: 'project' },
        { id: 'cap2', key: 'good2', value: null, source: 'project' },
        { id: 'cap3', key: 'bad1', value: 'invalid', source: 'project' },
        { id: 'cap4', key: 'good3', value: 'valid', source: 'user' },
        { id: 'cap5', key: 'bad2', value: 'invalid-data', source: 'local' },
      ]

      const health = calculateProjectHealth(project, capabilities)

      expect(health.status).toBe('warning')
      expect(health.metrics.warnings).toBe(1)
      expect(health.metrics.errors).toBe(2)
      expect(health.metrics.invalidConfigs).toBe(2)
    })
  })

  describe('calculateBatchHealth', () => {
    it('calculates health for multiple projects', () => {
      const projects: DiscoveredProject[] = [
        {
          id: 'project-1',
          name: 'Project 1',
          path: '/test/1',
          configFileCount: 1,
          lastModified: 1000000000,
          configSources: { user: false, project: true, local: false },
        },
        {
          id: 'project-2',
          name: 'Project 2',
          path: '/test/2',
          configFileCount: 3,
          lastModified: 1000000000,
          configSources: { user: false, project: true, local: false },
        },
      ]

      const capabilities1: Capability[] = [
        { id: 'cap1', key: 'setting1', value: 'value1', source: 'project' },
      ]

      const capabilities2: Capability[] = [
        { id: 'cap1', key: 'setting1', value: 'value1', source: 'project' },
        { id: 'cap2', key: 'setting2', value: 'value2', source: 'project' },
        { id: 'cap3', key: 'setting3', value: 'value3', source: 'project' },
      ]

      const projectCapabilities = new Map<string, Capability[]>()
      projectCapabilities.set('project-1', capabilities1)
      projectCapabilities.set('project-2', capabilities2)

      const healthResults = calculateBatchHealth(projects, projectCapabilities)

      expect(healthResults).toHaveLength(2)
      expect(healthResults[0].status).toBe('warning')
      expect(healthResults[1].status).toBe('good')
    })

    it('handles missing capabilities for a project', () => {
      const projects: DiscoveredProject[] = [
        {
          id: 'project-1',
          name: 'Project 1',
          path: '/test/1',
          configFileCount: 1,
          lastModified: 1000000000,
          configSources: { user: false, project: true, local: false },
        },
      ]

      const projectCapabilities = new Map<string, Capability[]>()

      const healthResults = calculateBatchHealth(projects, projectCapabilities)

      expect(healthResults).toHaveLength(1)
      expect(healthResults[0].metrics.totalCapabilities).toBe(0)
    })
  })

  describe('filterByHealthStatus', () => {
    it('filters projects by health status', () => {
      const healthResults: ProjectHealth[] = [
        {
          projectId: 'p1',
          status: 'good',
          score: 90,
          metrics: {
            totalCapabilities: 3,
            validConfigs: 3,
            invalidConfigs: 0,
            warnings: 0,
            errors: 0,
            lastChecked: new Date(),
          },
          issues: [],
          recommendations: [],
        },
        {
          projectId: 'p2',
          status: 'warning',
          score: 70,
          metrics: {
            totalCapabilities: 2,
            validConfigs: 1,
            invalidConfigs: 1,
            warnings: 1,
            errors: 0,
            lastChecked: new Date(),
          },
          issues: [],
          recommendations: [],
        },
        {
          projectId: 'p3',
          status: 'error',
          score: 30,
          metrics: {
            totalCapabilities: 2,
            validConfigs: 0,
            invalidConfigs: 2,
            warnings: 0,
            errors: 2,
            lastChecked: new Date(),
          },
          issues: [],
          recommendations: [],
        },
      ]

      const goodProjects = filterByHealthStatus(healthResults, 'good')
      expect(goodProjects).toHaveLength(1)
      expect(goodProjects[0].projectId).toBe('p1')

      const warningProjects = filterByHealthStatus(healthResults, 'warning')
      expect(warningProjects).toHaveLength(1)
      expect(warningProjects[0].projectId).toBe('p2')

      const errorProjects = filterByHealthStatus(healthResults, 'error')
      expect(errorProjects).toHaveLength(1)
      expect(errorProjects[0].projectId).toBe('p3')

      const allProjects = filterByHealthStatus(healthResults, 'all')
      expect(allProjects).toHaveLength(3)
    })
  })

  describe('sortByHealthScore', () => {
    it('sorts projects by health score descending', () => {
      const healthResults: ProjectHealth[] = [
        {
          projectId: 'p1',
          status: 'warning',
          score: 60,
          metrics: {
            totalCapabilities: 2,
            validConfigs: 1,
            invalidConfigs: 1,
            warnings: 1,
            errors: 0,
            lastChecked: new Date(),
          },
          issues: [],
          recommendations: [],
        },
        {
          projectId: 'p2',
          status: 'good',
          score: 95,
          metrics: {
            totalCapabilities: 5,
            validConfigs: 5,
            invalidConfigs: 0,
            warnings: 0,
            errors: 0,
            lastChecked: new Date(),
          },
          issues: [],
          recommendations: [],
        },
        {
          projectId: 'p3',
          status: 'warning',
          score: 75,
          metrics: {
            totalCapabilities: 3,
            validConfigs: 2,
            invalidConfigs: 1,
            warnings: 1,
            errors: 0,
            lastChecked: new Date(),
          },
          issues: [],
          recommendations: [],
        },
      ]

      const sorted = sortByHealthScore(healthResults)

      expect(sorted[0].projectId).toBe('p2')
      expect(sorted[0].score).toBe(95)
      expect(sorted[1].projectId).toBe('p3')
      expect(sorted[1].score).toBe(75)
      expect(sorted[2].projectId).toBe('p1')
      expect(sorted[2].score).toBe(60)
    })
  })
})