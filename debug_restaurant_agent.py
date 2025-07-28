import asyncio
import json
from google.auth import default
from google.auth.transport.requests import Request
import requests

async def test_restaurant_agent():
    # エージェントURL
    agent_url = "https://us-central1-aiplatform.googleapis.com/v1/projects/246970286644/locations/us-central1/reasoningEngines/4751957313852538880:streamQuery?alt=sse"
    
    # 認証取得
    credentials, project = default()
    credentials.refresh(Request())
    
    # セッション作成用URL
    session_url = agent_url.replace(':streamQuery?alt=sse', ':query')
    
    # 1. セッション作成
    session_data = {
        "class_method": "create_session",
        "input": {"user_id": "test-user"}
    }
    
    headers = {
        'Authorization': f'Bearer {credentials.token}',
        'Content-Type': 'application/json'
    }
    
    print("=== セッション作成 ===")
    response = requests.post(session_url, json=session_data, headers=headers)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.text}")
    
    if response.status_code != 200:
        print("セッション作成に失敗しました")
        return
    
    session_response = response.json()
    session_id = session_response.get('output', {}).get('id')
    
    if not session_id:
        print("セッションIDが取得できませんでした")
        return
    
    print(f"Session ID: {session_id}")
    
    # 2. レストラン検索リクエスト
    search_request = {
        "class_method": "stream_query",
        "input": {
            "message": "渋谷でデートにおすすめのディナーレストランを教えて",
            "session_id": session_id,
            "user_id": "test-user"
        }
    }
    
    print("\n=== レストラン検索実行 ===")
    headers['Accept'] = 'text/event-stream'
    
    response = requests.post(agent_url, json=search_request, headers=headers, stream=True)
    print(f"Status: {response.status_code}")
    
    if response.status_code != 200:
        print(f"Error: {response.text}")
        return
    
    # SSE応答を処理
    print("\n=== ストリーミング応答 ===")
    for line in response.iter_lines(decode_unicode=True):
        if line.startswith('data: '):
            data = line[6:]  # 'data: ' を除去
            if data == '[DONE]':
                print("=== 完了 ===")
                break
            try:
                json_data = json.loads(data)
                print(f"Event: {json.dumps(json_data, ensure_ascii=False, indent=2)}")
            except json.JSONDecodeError:
                print(f"Raw data: {data}")

if __name__ == "__main__":
    asyncio.run(test_restaurant_agent())