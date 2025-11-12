import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { cacheService } from '@/lib/cache-service'

export async function GET() {
  try {
    // Try local cache first
    const filePath = path.join(process.cwd(), '.next', 'cache', 'wordpress', 'site-info.json')
    let siteInfo: any = null
    
    try {
      const raw = await fs.readFile(filePath, 'utf-8')
      const parsed = JSON.parse(raw)
      siteInfo = parsed?.data ?? null
    } catch {}

    // If cache is missing or empty, fetch from WordPress and cache it
    if (!siteInfo || !siteInfo.title) {
      try {
        siteInfo = await cacheService.cacheSiteInfo()
      } catch (e) {
        console.error('Failed to fetch site info from WordPress:', e)
        // Return empty data if WordPress fetch fails (avoid dummy values)
        siteInfo = {
          title: '',
          description: '',
          logo: null
        }
      }
    }

    return NextResponse.json({ success: true, data: siteInfo })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
