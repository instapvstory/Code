# Cloudflare Pages Deployment Guide

This guide explains how to deploy your Next.js application to Cloudflare Pages using the OpenNext adapter.

## Prerequisites

1.  A Cloudflare account.
2.  Your project pushed to a GitHub or GitLab repository.
3.  A Supabase project (already set up).

## Local Testing

Before deploying, you can test the Cloudflare-compatible build locally:

```bash
# 1. Build the project for Cloudflare
npm run pages:build

# 2. Preview the build locally
npm run pages:preview
```

## Deployment via Cloudflare Dashboard (Recommended)

1.  Log in to the **Cloudflare Dashboard**.
2.  Go to **Workers & Pages** > **Create application** > **Pages** > **Connect to Git**.
3.  Select your repository.
4.  In the **Build settings** section:
    - **Framework preset**: `None` (We will use our custom command)
    - **Build command**: `npm run pages:build`
    - **Build output directory**: `.open-next/assets`
5.  In the **Environment variables** section, add the following variables:

| Variable | Value |
| :--- | :--- |
| `SUPABASE_URL` | Your Supabase URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase Service Role Key |
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase Anon Key |
| `INSTAGRAM_ACCESS_TOKEN` | Your Instagram Access Token |
| `CACHE_TTL_MINUTES` | `10` (default) |
| `MAX_CACHE_AGE_HOURS` | `24` (default) |
| `CDN_CACHE_DURATION_SECONDS` | `600` (default) |
| `BROWSER_CACHE_DURATION_SECONDS` | `300` (default) |

6.  Click **Save and Deploy**.

## Important Configuration

The project is configured via `wrangler.jsonc`. Key settings include:
- `compatibility_date`: `2025-01-01`
- `compatibility_flags`: `["nodejs_compat"]` (Required for Next.js features)

## Manual Deployment (CLI)

If you prefer to deploy from your terminal:

1.  Login to wrangler: `npx wrangler login`
2.  Build and deploy:
    ```bash
    npm run pages:build
    npm run pages:deploy
    ```

## Troubleshooting

- **Script too large**: If you exceed the 1MB limit on the Free plan, you may need to upgrade to the Workers Paid plan ($5/mo).
- **Environment Variables**: Ensure all variables are added to **both** "Production" and "Preview" environments in the Cloudflare dashboard.
