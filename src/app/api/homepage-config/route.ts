import { NextResponse } from "next/server";
import { commitToRepo } from "@/lib/github";

const GITHUB_OWNER = "pwcosmos-create";
const GITHUB_REPO = "palm-reader";
const CONFIG_PATH = "config/homepage.json";

async function fetchFromGitHub() {
  const token = process.env.GITHUB_TOKEN;
  if (!token) return null;

  const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${CONFIG_PATH}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `token ${token}`,
      Accept: "application/vnd.github.v3+json",
    },
    cache: "no-store",
  });

  if (!res.ok) return null;

  const data = await res.json();
  const decoded = Buffer.from(data.content, "base64").toString("utf-8");
  return JSON.parse(decoded);
}

export async function GET() {
  try {
    const config = await fetchFromGitHub();
    if (config) {
      return NextResponse.json({ success: true, config });
    }
    return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  } catch (error) {
    console.error("Homepage config GET error:", error);
    return NextResponse.json({ success: false, error: "Failed to load" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { config } = await req.json();
    if (!config) {
      return NextResponse.json({ success: false, error: "Missing config" }, { status: 400 });
    }

    const content = JSON.stringify(config, null, 2);
    const result = await commitToRepo(
      CONFIG_PATH,
      content,
      "chore: update homepage content"
    );

    if (result.success) {
      return NextResponse.json({ success: true, simulated: result.simulated ?? false });
    }
    return NextResponse.json({ success: false, error: result.error }, { status: 500 });
  } catch (error) {
    console.error("Homepage config POST error:", error);
    return NextResponse.json({ success: false, error: "Failed to save" }, { status: 500 });
  }
}
