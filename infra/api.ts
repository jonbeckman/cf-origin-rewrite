import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { Worker } from "alchemy/cloudflare"

export async function createApiWorker(
  appName: string,
  stage: string,
  fromRoute: string,
  toRoute: string,
) {
  const __filename = fileURLToPath(import.meta.url)
  const __dirname = dirname(__filename)
  const entrypoint = resolve(__dirname, "../src/index.ts")
  const name = `${appName}-${stage}`
  console.log(`Creating worker ${name} to rewrite requests from ${fromRoute} to ${toRoute}`)

  // Check if fromRoute is simply a domain, or does it contain a path
  const isDomainProxy = !fromRoute.includes("/")
  if (isDomainProxy) {
    console.log(`fromRoute is a domain, ${fromRoute} will be added to the Worker's \`domains\` property`)
  } else {
    console.log(`fromRoute is not strictly a domain, ${fromRoute} will be added to the Worker's \`routes\` property`)
  }

  const api = await Worker(name, {
    name,
    entrypoint,
    compatibilityDate: "2025-06-20",
    compatibilityFlags: ["nodejs_compat"],

    ...(isDomainProxy ? { domains: [fromRoute] } : { routes: [fromRoute] }),

    bindings: {
      FROM_ROUTE: fromRoute,
      TO_ROUTE: toRoute,
    },
  })
  console.log(`Worker available at ${fromRoute}`)

  return api
}
export type ApiWorkerResource = Awaited<ReturnType<typeof createApiWorker>>
