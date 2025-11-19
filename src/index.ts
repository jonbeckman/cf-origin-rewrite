import { WorkerEntrypoint } from "cloudflare:workers"
import type { ApiEnv } from "infra/types/env"

export default class Api extends WorkerEntrypoint {
  declare readonly env: ApiEnv

  // Based on the Cloudflare Snippet https://developers.cloudflare.com/rules/snippets/examples/route-and-rewrite/
  async fetch(request: Request) {
    const toUrl = new URL(this.env.TO_ROUTE)

    const fetchOptions = {
      redirect: "follow",
    };

    // Make the fetch request to the origin
    const response = await fetch(toUrl, fetchOptions)

    // const response = await fetch(toUrl, request)
    console.log(`Response from ${toUrl.toString()}`, response)
    // console.log(`Response headers:\n`, JSON.stringify(Object.fromEntries(response.headers.entries()), null, 2))
    // console.log(`Response body:\n`, await response.text())
    console.log(`Response status:\n`, response.status)

    return response
  }
}
