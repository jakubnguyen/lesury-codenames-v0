import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    const scriptUrl = process.env.GOOGLE_APPS_SCRIPT_URL;
    if (!scriptUrl) {
        return NextResponse.json({ error: 'Lead capture not configured' }, { status: 503 });
    }

    const { email } = await req.json();
    if (!email || typeof email !== 'string' || !email.includes('@')) {
        return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    }

    const res = await fetch(scriptUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, timestamp: new Date().toISOString() }),
    });

    if (!res.ok) {
        return NextResponse.json({ error: 'Failed to save lead' }, { status: 502 });
    }

    return NextResponse.json({ ok: true });
}
