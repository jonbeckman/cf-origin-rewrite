# cf-origin-rewrite

A lightweight worker that rewrites requests from a vanity domain to a different, origin domain while preserving the path and query parameters.

This is a work around for free plans. Cloudflare natively supports this via origin rewrite rules or via Snippets, but those are both part of paid plans.

## Local Dev

### Init
Create a `.dev.vars` and `.env` file from the example files:
```sh
cp .dev.vars.example .dev.vars
cp .env.example .env
```

Install dependencies:
```sh
pnpm i
```

Fill out the env files and run to confirm you're using the correct CF account:
```sh
pnpm exec wrangler whoami
```

### Dev
```sh
# Start the development server
pnpm dev
```

### Deployment
```sh
# Deploy to production
pnpm deploy:production
```

### Maintenance
Update dependencies
```sh
pnpm exec ncu -t minor -u
pnpm i
```
