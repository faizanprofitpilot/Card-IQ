import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    console.log('Test API route called')
    return NextResponse.json({ 
      success: true, 
      message: 'Test API route working',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Test API error:', error)
    return NextResponse.json(
      { error: 'Test API failed' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('Test POST API route called')
    const body = await request.json()
    console.log('Test POST body:', body)
    
    return NextResponse.json({ 
      success: true, 
      message: 'Test POST API route working',
      receivedData: body,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Test POST API error:', error)
    return NextResponse.json(
      { error: 'Test POST API failed' },
      { status: 500 }
    )
  }
}
