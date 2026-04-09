export async function POST(request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "APIキーが設定されていません。Vercelの環境変数を確認してください。" }, { status: 500 });
  }
  try {
    const body = await request.json();
    const { content } = body;
    if (!content || !Array.isArray(content)) {
      return Response.json({ error: "リクエストの形式が正しくありません" }, { status: 400 });
    }
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        tools: [{ type: "web_search_20250305", name: "web_search" }],
        messages: [{ role: "user", content }],
      }),
    });
    if (!res.ok) {
      const errText = await res.text();
      return Response.json({ error: "APIエラー(" + res.status + "): " + errText.slice(0, 300) }, { status: 500 });
    }
    const data = await res.json();
    if (data.error) {
      return Response.json({ error: "APIエラー: " + (data.error.message || JSON.stringify(data.error)) }, { status: 500 });
    }
    return Response.json(data);
  } catch (err) {
    return Response.json({ error: "サーバーエラー: " + (err.message || "不明") }, { status: 500 });
  }
}
