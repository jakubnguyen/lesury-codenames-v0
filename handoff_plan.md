# Image Generation Handoff Plan

## Current Status
- Images generated and pushed to GitHub:
  - Weight category (`W01` - `W50`)
  - Speed category (`S01` - `S50`)
  - Population category (`P01` - `P50`)
- **COMPLETED!** All currently planned image batches are finished.

## Image Generation Prompt
To continue, you should use the following prompt format:

> Minimalistic hand-drawn line art of **[Card Subject]**, single continuous black line feeling. The background behind the line art features organic abstract pastel watercolor washes and brush strokes in assorted colors suitable for the specific subject. The shading should feel connected to the picture, but somewhat loose so it is not perfectly within the lines. Pure uniform clean white background overall, NO borders, NO paper frame, NO canvas edges, NO drop shadows, no geometric shapes. vector style icon.

## Important Note
- The image generation service has a strict quota. If you see a `429 Too Many Requests` error with a reset timer, you will need to pause generation and wait until the quota resets.
- If you see a `503 Service Unavailable` error, it means the server is temporarily out of capacity. Wait 60 seconds and try again.
