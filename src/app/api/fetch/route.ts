import { NextResponse } from 'next/server';
import { getRepoContents } from '@/lib/github';

/**
 * API Route: Fetch Analysis Records from GitHub 🏺
 * Used for History and Community feeds.
 */

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'palm';

    // 1. Get the list of files in records/{type}
    const path = `records/${type}`;
    const files = await getRepoContents(path);

    if (!Array.isArray(files)) {
      return NextResponse.json({ success: true, records: [] });
    }

    // 2. Fetch the actual content of each JSON file
    // Note: For a high-scale app, we'd use a single cache file or database,
    // but for "The Eternal Archive", we read the git-tree.
    // Limiting to last 20 for performance in this prototype.
    const recordPromises = files.slice(-20).reverse().map(async (file: any) => {
      const res = await fetch(file.download_url);
      if (res.ok) return await res.json();
      return null;
    });

    const records = (await Promise.all(recordPromises)).filter(r => r !== null);

    return NextResponse.json({ success: true, records });
  } catch (error) {
    console.error("API Fetch Error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch from GitHub" }, { status: 500 });
  }
}
