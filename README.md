Remove-Item .openclaw-docker\agents\main\sessions\sessions.json -ErrorAction SilentlyContinue
docker compose down
docker compose build
docker compose up -d --force-recreate openclaw-gateway