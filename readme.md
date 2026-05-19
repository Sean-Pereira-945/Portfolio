# Sean Pereira · Immersive Portfolio

This repository powers the 3D, WebGL-driven portfolio experience for **Sean Pereira**—a Mumbai-based full-stack and
ML engineer focused on telecom R&D, AI/ML optimization, and scalable product systems. The scene blends a cinematic
studio environment, BIOS-style intro, and an interactive in-world operating system (SeanOS) that surfaces resume data
and flagship projects.

## Feature Highlights

- **SeanOS monitor experience** – `static/os` hosts a retro-futuristic desktop that mirrors Sean's resume, skills, and
	achievements with filterable project cards and live telemetry.
- **Immersive BIOS loader** – Updated copy, branding, and motion cues tie directly to Sean's academic and incubator
	milestones.
- **Realtime controls** – In-world UI exposes mute/free-cam toggles plus contextual prompts that keep the experience
	interactive on desktop and mobile.
- **Contact ready** – The Express server relays contact form submissions to Sean's inbox via configurable SMTP creds.

## Getting Started

```bash
# Install dependencies
npm install

# Start the Webpack dev server
npm run dev

# Build the production bundle
npm run build

# Serve the compiled app with Express (uses /public output)

```

The `static` directory is copied as-is into the build output, so updates to `static/os` or media assets require only a
rebuild.

## Environment Variables

The contact endpoint (`server/index.ts`) expects the following values:

- `FOLIO_EMAIL` – Gmail/SMTP username used to send portfolio emails.
- `FOLIO_PASSWORD` – Corresponding app password or SMTP secret.
- `FOLIO_NOTIFICATION_EMAILS` (optional) – Comma-separated list of recipients. Defaults to Sean's inbox.

## Contact

Questions, collaboration ideas, or opportunities? Reach out at
[seanpereira945@gmail.com](mailto:seanpereira945@gmail.com) or connect via
[LinkedIn](https://www.linkedin.com/in/sean-pereira-8aa29b2ab/).
