/**
 * GitHub API Interaction Layer 🏺
 * "The Eternal Archive" - Persists analysis results directly to the repository.
 */

const GITHUB_OWNER = "pwcosmos-create";
const GITHUB_REPO = "palm-reader";
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

export async function commitToRepo(path: string, content: string, message: string) {
  if (!GITHUB_TOKEN) {
    console.warn("GITHUB_TOKEN is missing. Simulation mode active.");
    return { success: true, simulated: true };
  }

  try {
    // 1. Get the current file SHA if it exists (for updates)
    const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${path}`;
    const getRes = await fetch(url, {
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github.v3+json",
      },
    });

    let sha: string | undefined;
    if (getRes.ok) {
      const data = await getRes.json();
      sha = data.sha;
    }

    // 2. Put (Create or Update) the file
    const putRes = await fetch(url, {
      method: "PUT",
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message,
        content: Buffer.from(content).toString("base64"),
        sha,
      }),
    });

    if (!putRes.ok) {
      const err = await putRes.json();
      throw new Error(err.message || "Failed to commit to GitHub");
    }

    return { success: true, sha: (await putRes.json()).content.sha };
  } catch (error) {
    console.error("GitHub Commit Error:", error);
    return { success: false, error: (error as Error).message };
  }
}

export async function getRepoContents(path: string) {
  if (!GITHUB_TOKEN) return [];
  
  try {
    const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${path}`;
    const res = await fetch(url, {
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github.v3+json",
      },
    });

    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}
