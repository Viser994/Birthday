# RTR Rail Lab — client demo video

Presentation walkthrough of the Payments Canada Real-Time Rail sandbox explorer.

## Generated files

| File | Purpose |
| --- | --- |
| `output/rtr-rail-lab-client-demo.mp4` | Full HD demo (~58s) with captions |
| `output/rtr-rail-lab-client-demo-1280.mp4` | Smaller 1280px shareable copy |
| `output/rtr-rail-lab-demo-poster.png` | Thumbnail / poster frame |
| `output/rtr-rail-lab-home.png` | Home screenshot |
| `output/rtr-rail-lab-readable-results.png` | Readable results screenshot |

Also published under `/opt/cursor/artifacts/rtr-demo/` for this agent run.

## What the video covers

1. Live sandbox workspace overview  
2. Consumer Key / Secret connection  
3. Guided happy path (token → heartbeat → payment → status)  
4. Plain-language ISO 20022 results (ACSP, UETR, etc.)  
5. Session activity + “Check this payment’s status”  
6. Interest report and status glossary  

## Regenerate

With the app running (`npm run dev` in `rtr-sandbox-app`):

```bash
cd /tmp && rm -rf rtr-demo-build && mkdir rtr-demo-build && cd rtr-demo-build
npm init -y
npm install puppeteer@24.2.0
node /workspace/rtr-sandbox-app/demo/scripts/capture-demo.mjs
bash /workspace/rtr-sandbox-app/demo/scripts/build-video.sh
```

Requires Google Chrome, ffmpeg, and the app on `http://localhost:3000`.
