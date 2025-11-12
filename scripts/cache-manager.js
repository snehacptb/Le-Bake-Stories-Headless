#!/usr/bin/env node

/**
 * Cache Management Script
 * Command-line tool for managing the WordPress cache system
 */

const axios = require('axios')
const readline = require('readline')

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
const SECRET = process.env.CACHE_REFRESH_SECRET || 'your-cache-refresh-secret'

class CacheManager {
  constructor() {
    this.baseUrl = BASE_URL
    this.secret = SECRET
  }

  async makeRequest(endpoint, method = 'GET', data = null) {
    try {
      const url = `${this.baseUrl}${endpoint}`
      const config = {
        method,
        url,
        params: { secret: this.secret },
        headers: { 'Content-Type': 'application/json' }
      }

      if (data) {
        config.data = data
      }

      const response = await axios(config)
      return response.data
    } catch (error) {
      console.error('Request failed:', error.response?.data || error.message)
      throw error
    }
  }

  async refreshCache(type = 'all') {
    console.log(`Refreshing ${type} cache...`)
    const result = await this.makeRequest(`/api/cache/refresh?type=${type}`)
    console.log('✅', result.message)
    console.log('Duration:', result.duration)
    return result
  }

  async getStats() {
    console.log('Getting cache statistics...')
    const result = await this.makeRequest('/api/cache/refresh', 'POST', { action: 'stats' })
    console.log('📊 Cache Statistics:')
    console.log('  Total Requests:', result.stats.totalRequests)
    console.log('  Cache Hits:', result.stats.cacheHits)
    console.log('  Cache Misses:', result.stats.cacheMisses)
    console.log('  Hit Rate:', `${(result.stats.hitRate * 100).toFixed(2)}%`)
    console.log('  Last Refresh:', result.stats.lastRefresh)
    console.log('  Memory Usage:', `${(result.stats.memoryUsage / 1024 / 1024).toFixed(2)} MB`)
    return result
  }

  async clearCache(type = null) {
    const action = type ? 'invalidate' : 'invalidate'
    const data = type ? { action, type } : { action }
    
    console.log(`Clearing ${type || 'all'} cache...`)
    const result = await this.makeRequest('/api/cache/refresh', 'POST', data)
    console.log('✅', result.message)
    return result
  }

  async testWebhook(type = 'product', action = 'created', id = 123) {
    console.log(`Testing ${type} webhook...`)
    const webhookUrl = `${this.baseUrl}/api/webhooks/woocommerce?secret=${this.secret}`
    const payload = {
      action,
      type,
      id,
      timestamp: new Date().toISOString()
    }

    try {
      const response = await axios.post(webhookUrl, payload, {
        headers: { 'Content-Type': 'application/json' }
      })
      console.log('✅ Webhook test successful:', response.data.message)
    } catch (error) {
      console.error('❌ Webhook test failed:', error.response?.data || error.message)
    }
  }

  showMenu() {
    console.log('\n🔧 Cache Manager')
    console.log('================')
    console.log('1. Refresh all cache')
    console.log('2. Refresh products cache')
    console.log('3. Refresh categories cache')
    console.log('4. Refresh pages cache')
    console.log('5. Refresh posts cache')
    console.log('6. Refresh menus cache')
    console.log('7. Refresh site info cache')
    console.log('8. Get cache statistics')
    console.log('9. Clear all cache')
    console.log('10. Clear products cache')
    console.log('11. Clear categories cache')
    console.log('12. Test webhook')
    console.log('13. Exit')
    console.log('')
  }

  async handleChoice(choice) {
    switch (choice) {
      case '1':
        await this.refreshCache('all')
        break
      case '2':
        await this.refreshCache('products')
        break
      case '3':
        await this.refreshCache('categories')
        break
      case '4':
        await this.refreshCache('pages')
        break
      case '5':
        await this.refreshCache('posts')
        break
      case '6':
        await this.refreshCache('menus')
        break
      case '7':
        await this.refreshCache('site-info')
        break
      case '8':
        await this.getStats()
        break
      case '9':
        await this.clearCache()
        break
      case '10':
        await this.clearCache('products')
        break
      case '11':
        await this.clearCache('categories')
        break
      case '12':
        await this.testWebhook()
        break
      case '13':
        console.log('👋 Goodbye!')
        process.exit(0)
        break
      default:
        console.log('❌ Invalid choice. Please try again.')
    }
  }

  async run() {
    console.log('🚀 WordPress Cache Manager')
    console.log(`📍 Target: ${this.baseUrl}`)
    console.log(`🔑 Secret: ${this.secret.substring(0, 8)}...`)
    console.log('')

    while (true) {
      this.showMenu()
      
      const choice = await new Promise(resolve => {
        rl.question('Enter your choice (1-13): ', resolve)
      })

      try {
        await this.handleChoice(choice)
      } catch (error) {
        console.error('❌ Operation failed:', error.message)
      }

      if (choice !== '13') {
        await new Promise(resolve => {
          rl.question('\nPress Enter to continue...', resolve)
        })
      }
    }
  }
}

// Command line arguments
const args = process.argv.slice(2)
const command = args[0]

if (command) {
  const manager = new CacheManager()
  
  switch (command) {
    case 'refresh':
      const type = args[1] || 'all'
      manager.refreshCache(type).then(() => process.exit(0))
      break
    case 'stats':
      manager.getStats().then(() => process.exit(0))
      break
    case 'clear':
      const clearType = args[1] || null
      manager.clearCache(clearType).then(() => process.exit(0))
      break
    case 'test-webhook':
      const webhookType = args[1] || 'product'
      const webhookAction = args[2] || 'created'
      const webhookId = parseInt(args[3]) || 123
      manager.testWebhook(webhookType, webhookAction, webhookId).then(() => process.exit(0))
      break
    default:
      console.log('Usage:')
      console.log('  node cache-manager.js refresh [type]')
      console.log('  node cache-manager.js stats')
      console.log('  node cache-manager.js clear [type]')
      console.log('  node cache-manager.js test-webhook [type] [action] [id]')
      console.log('  node cache-manager.js (interactive mode)')
      process.exit(1)
  }
} else {
  // Interactive mode
  const manager = new CacheManager()
  manager.run().catch(console.error)
}
