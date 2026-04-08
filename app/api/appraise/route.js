export async function POST(request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "APIキーが設定されていません" }, { status: 500 });
  }

  try {
    const body = await request.json();
    const { content } = body;

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2000,
        tools: [{ type: "web_search_20250305", name: "web_search" }],
        messages: [{ role: "user", content }],
      }),
    });

    const data = await res.json();
    return Response.json(data);
  } catch (err) {
    return Response.json({ error: "査定APIの呼び出しに失敗しました" }, { status: 500 });
  }
}
