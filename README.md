M3D Studio — Backend (dev)

Quick start

1. Copy env example and adjust values (or set env vars directly):

   - `S3_ENDPOINT` (for MinIO: `http://localhost:9000`)
   - `S3_ACCESS_KEY_ID` (default for compose: `minioadmin`)
   - `S3_SECRET_ACCESS_KEY` (default for compose: `minioadmin`)
   - `S3_BUCKET` (e.g. `m3d-bucket`)
   - `REDIS_URL` (default: `redis://127.0.0.1:6379`)
   - `MONGODB_URI` (default: `mongodb://127.0.0.1:27017/m3d`)
   - `PUPPETEER_EXECUTABLE_PATH` (optional)

2. Start dev infra (Mongo, Redis, MinIO):

```bash
docker-compose up -d
```

3. Install dependencies and run API/server and worker:

```bash
npm install
npm run dev      # starts express server
npm run worker   # runs the contract worker (Puppeteer)
```

Notes
- The project uses `aws-sdk` configured to talk to MinIO when `S3_ENDPOINT` is set.
- Worker uses `bull` + Redis. Ensure `REDIS_URL` is reachable.
- For production, configure a real S3 bucket and secure credentials.

Proposals API (list/detail) - local dev

1. Configure Mongo (env `MONGO_URI` for server, `MONGO_URI_TEST` for tests) or run local Mongo via docker-compose.

2. Seed example proposals:

```bash
npm run seed
```

3. Start server (dev):

```bash
npm install
npm run dev
```

4. Run tests (requires test Mongo at `MONGO_URI_TEST` or default `mongodb://localhost:27017/backendm3d_test`):

```bash
npm test
```

5. OpenAPI spec: see `openapi.yaml` at project root.
