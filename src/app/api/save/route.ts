import { NextResponse } from 'next/server';
import { commitToRepo } from '@/lib/github';

/**
 * API Route: Save Analysis Record to GitHub 🏺
 * "The Eternal Archive" Orchestrator
 */

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id, data, type } = body;

    if (!id || !data) {
      return NextResponse.json({ success: false, error: "Missing data" }, { status: 400 });
    }

    // Path: records/{type}/{id}.json
    const path = `records/${type || 'general'}/${id}.json`;
    const content = JSON.stringify(data, null, 2);
    const message = `Consensus Reached: ${type} - ${id}`;

    const result = await commitToRepo(path, content, message);

    if (result.success) {
      return NextResponse.json({ 
        success: true, 
        message: "Data permanently archived to GitHub",
        simulated: result.simulated
      });
    } else {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }
  } catch (error) {
    console.error("API Save Error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
