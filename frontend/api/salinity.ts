const API_URL: string | undefined = process.env.SALINITY_API_URL;

export default async function handler(
  _request: any,
  response: any
) {
  // 1. 管理画面から環境変数（本当のURL）を読み込む
  const targetUrl: string | undefined = API_URL;

  if (!targetUrl) {
    return response.status(500).json({ error: "API URLが設定されていません。" });
  }

  try {
    // 2. Vercelのサーバーが、身代わりになって本当のAPIを叩く
    const apiResponse = await fetch(targetUrl, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'api_test/1.0',
      },
    });
    
    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();

      return response.status(apiResponse.status).json({
        error: "外部APIからのデータ取得に失敗しました。",
        upstreamStatus: apiResponse.status,
        upstreamBody: errorText.slice(0, 500),
      });
    }

    const data = await apiResponse.text();

    // CORSを回避するためのヘッダーを付与
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Methods', 'GET');
    response.setHeader('Content-Type', apiResponse.headers.get('content-type') ?? 'text/plain; charset=utf-8');

    // 3. ブラウザにデータを返す
    return response.status(200).send(data);
  } catch (_error) {
    return response.status(500).json({ error: "通信エラーが発生しました。" });
  }
}