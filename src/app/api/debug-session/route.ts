// src/app/api/debug-session/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/src/lib/auth/auth'

export async function GET() {
    const session = await getServerSession(authOptions)
    return NextResponse.json({
        hasSession: !!session,
        user: session?.user ? {
            email: session.user.email,
            role: session.user.role,
            centrosCusto: session.user.centrosCusto,
            centrosCustoType: typeof session.user.centrosCusto,
            isArray: Array.isArray(session.user.centrosCusto),
            length: session.user.centrosCusto?.length
        } : null
    })
}