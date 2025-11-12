import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

export async function GET() {
  try {
    // Read categories only from local JSON; do not call WooCommerce
    const filePath = path.join(process.cwd(), 'public', 'categories.json')
    const raw = await fs.readFile(filePath, 'utf-8')
    const parsed = JSON.parse(raw)
    const data = Array.isArray(parsed) ? parsed : (parsed?.data ?? [])
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
