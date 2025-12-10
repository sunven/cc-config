/**
 * CI Memory Usage Monitor
 *
 * Monitors memory usage during CI builds and tests
 * to detect memory leaks and excessive usage
 */

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

// Memory thresholds (in MB)
const MEMORY_THRESHOLDS = {
  BUILD: 500,      // Max 500 MB during build
  TEST: 300,       // Max 300 MB during tests
  WARN: 200,       // Warn at 200 MB
  CRITICAL: 400,   // Critical at 400 MB
}

// Get memory usage of current process
function getMemoryUsage() {
  const used = process.memoryUsage()
  return {
    rss: Math.round(used.rss / 1024 / 1024), // Resident Set Size
    heapUsed: Math.round(used.heapUsed / 1024 / 1024),
    heapTotal: Math.round(used.heapTotal / 1024 / 1024),
    external: Math.round(used.external / 1024 / 1024),
  }
}

// Format memory usage for display
function formatMemoryUsage(mem) {
  return `RSS: ${mem.rss}MB | Heap: ${mem.heapUsed}/${mem.heapTotal}MB | External: ${mem.external}MB`
}

// Check if memory usage exceeds threshold
function checkMemoryThreshold(memory, threshold) {
  return memory.rss > threshold || memory.heapUsed > threshold
}

// Log memory usage with status
function logMemoryUsage(stage, memory, threshold) {
  const status = checkMemoryThreshold(memory, threshold)
    ? '⚠️  EXCEEDED'
    : '✅ OK'

  console.log(`[${stage}] ${status} Memory: ${formatMemoryUsage(memory)} (Limit: ${threshold}MB)`)

  if (checkMemoryThreshold(memory, threshold)) {
    console.error(`[${stage}] ERROR: Memory usage exceeds threshold of ${threshold}MB`)
    return false
  }
  return true
}

// Monitor memory over time
function monitorMemory(durationMs, intervalMs, stage, threshold) {
  return new Promise((resolve) => {
    const startTime = Date.now()
    const measurements = []

    const interval = setInterval(() => {
      const memory = getMemoryUsage()
      measurements.push({ timestamp: Date.now(), ...memory })
      logMemoryUsage(stage, memory, threshold)

      // Check for critical memory usage
      if (memory.rss > MEMORY_THRESHOLDS.CRITICAL || memory.heapUsed > MEMORY_THRESHOLDS.CRITICAL) {
        console.error(`[${stage}] CRITICAL: Memory usage critically high!`)
        clearInterval(interval)
        resolve({ measurements, critical: true })
      }
    }, intervalMs)

    setTimeout(() => {
      clearInterval(interval)
      resolve({ measurements, critical: false })
    }, durationMs)
  })
}

// Run memory monitoring during a command
async function monitorCommand(command, stage, threshold, durationMs = 60000) {
  console.log(`\n[${stage}] Starting: ${command}`)
  console.log(`[${stage}] Monitoring memory for ${durationMs / 1000}s...\n`)

  const memoryMonitor = monitorMemory(durationMs, 1000, stage, threshold)

  // Start the command
  try {
    execSync(command, { stdio: 'inherit' })
  } catch (error) {
    console.error(`[${stage}] Command failed:`, error.message)
  }

  const result = await memoryMonitor
  return result
}

// Analyze memory measurements
function analyzeMemoryMeasurements(measurements, stage) {
  if (measurements.length === 0) {
    console.log(`[${stage}] No memory measurements recorded`)
    return
  }

  const rssValues = measurements.map(m => m.rss)
  const heapValues = measurements.map(m => m.heapUsed)

  const stats = {
    rss: {
      min: Math.min(...rssValues),
      max: Math.max(...rssValues),
      avg: Math.round(rssValues.reduce((a, b) => a + b, 0) / rssValues.length),
      final: rssValues[rssValues.length - 1],
    },
    heap: {
      min: Math.min(...heapValues),
      max: Math.max(...heapValues),
      avg: Math.round(heapValues.reduce((a, b) => a + b, 0) / heapValues.length),
      final: heapValues[heapValues.length - 1],
    },
  }

  console.log(`\n[${stage}] Memory Analysis:`)
  console.log(`  RSS: Min=${stats.rss.min}MB Avg=${stats.rss.avg}MB Max=${stats.rss.max}MB Final=${stats.rss.final}MB`)
  console.log(`  Heap: Min=${stats.heap.min}MB Avg=${stats.heap.avg}MB Max=${stats.heap.max}MB Final=${stats.heap.final}MB`)

  // Detect memory growth
  const rssGrowth = stats.rss.final - stats.rss.min
  const heapGrowth = stats.heap.final - stats.heap.min

  console.log(`  Growth: RSS=${rssGrowth}MB Heap=${heapGrowth}MB`)

  if (rssGrowth > 50) {
    console.warn(`[${stage}] WARNING: Significant RSS growth detected (${rssGrowth}MB)`)
  }

  if (heapGrowth > 50) {
    console.warn(`[${stage}] WARNING: Significant heap growth detected (${heapGrowth}MB)`)
  }

  return stats
}

// Save memory report to file
function saveMemoryReport(report, outputPath) {
  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2))
  console.log(`[Memory Report] Saved to ${outputPath}`)
}

// Main monitoring function
async function main() {
  console.log('=== CI Memory Monitoring ===\n')

  const report = {
    timestamp: new Date().toISOString(),
    system: {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
    },
    stages: {},
  }

  // Stage 1: Build monitoring
  console.log('\n--- Stage 1: Build ---')
  const buildResult = await monitorCommand('npm run build', 'Build', MEMORY_THRESHOLDS.BUILD, 120000)
  report.stages.build = analyzeMemoryMeasurements(buildResult.measurements, 'Build')

  // Stage 2: Test monitoring
  console.log('\n--- Stage 2: Tests ---')
  const testResult = await monitorCommand('npm test -- --run', 'Test', MEMORY_THRESHOLDS.TEST, 180000)
  report.stages.tests = analyzeMemoryMeasurements(testResult.measurements, 'Test')

  // Stage 3: Type checking
  console.log('\n--- Stage 3: Type Check ---')
  const typeResult = await monitorCommand('npx tsc --noEmit', 'TypeCheck', MEMORY_THRESHOLDS.TEST, 60000)
  report.stages.typecheck = analyzeMemoryMeasurements(typeResult.measurements, 'TypeCheck')

  // Summary
  console.log('\n=== Memory Monitoring Summary ===')
  const allMeasurements = [
    ...(buildResult.measurements || []),
    ...(testResult.measurements || []),
    ...(typeResult.measurements || []),
  ]

  if (allMeasurements.length > 0) {
    const allRSS = allMeasurements.map(m => m.rss)
    const maxMemory = Math.max(...allRSS)
    const avgMemory = Math.round(allRSS.reduce((a, b) => a + b, 0) / allRSS.length)

    console.log(`Peak Memory: ${maxMemory}MB`)
    console.log(`Average Memory: ${avgMemory}MB`)
    console.log(`Threshold: ${MEMORY_THRESHOLDS.TEST}MB`)

    if (maxMemory > MEMORY_THRESHOLDS.TEST) {
      console.error('❌ FAILED: Memory usage exceeded threshold')
      process.exit(1)
    } else {
      console.log('✅ PASSED: Memory usage within threshold')
    }
  }

  // Save report
  const outputPath = path.join(process.cwd(), 'memory-report.json')
  saveMemoryReport(report, outputPath)

  console.log('\n=== Memory Monitoring Complete ===\n')
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('Memory monitoring failed:', error)
    process.exit(1)
  })
}

module.exports = {
  getMemoryUsage,
  monitorCommand,
  monitorMemory,
  MEMORY_THRESHOLDS,
}
