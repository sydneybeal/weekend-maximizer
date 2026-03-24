# SkySpotter

A real-time flight tracking app built with React + Vite (frontend) and Express (backend), served as a single Docker container.

## Local development

```bash
npm install --legacy-peer-deps
npm run dev
```

## Deploy to Google Cloud Run

**Option A — build and deploy in one shot (recommended):**

```
export GCP_PROJECT_ID=<your-project>
export AMADEUS_CLIENT_ID=<your-id>
export AMADEUS_CLIENT_SECRET=<your-secret>
export AMADEUS_BASE_URL=https://test.api.amadeus.com
```

```bash
gcloud run deploy weekend-max \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --port 8080 \
  --set-env-vars "NODE_ENV=production,AMADEUS_CLIENT_ID=${AMADEUS_CLIENT_ID},AMADEUS_CLIENT_SECRET=${AMADEUS_CLIENT_SECRET},AMADEUS_BASE_URL=${AMADEUS_BASE_URL}"
```

> Set your default project first if needed:
> ```bash
> gcloud config set project YOUR_PROJECT_ID
> ```
