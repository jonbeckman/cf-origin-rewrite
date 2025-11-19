#!/usr/bin/env tsx

import { randomBytes } from "node:crypto"
import fs from "node:fs"
import path from "node:path"
import { Command, Options } from "@effect/cli"
import { NodeContext, NodeRuntime } from "@effect/platform-node"
import dotenv from "dotenv"
import { Console, Effect, Option, pipe } from "effect"
import packageJson from "../package.json" with { type: "json" }
import { createInfra } from "."

export const PhaseOptions = ["up", "destroy", "read"] as const
export type Phase = (typeof PhaseOptions)[number]

// Load .env file if it exists for IaC env vars
const envPath = path.resolve(process.cwd(), ".env")
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath })
}

/**
 * Required options that are defined as optional CLI parameters with .env file fallback
 */
const cloudflareAccountId = Options.text("cloudflare-account-id").pipe(
  Options.withDescription("Cloudflare Account ID"),
  Options.optional,
)

const cloudflareApiToken = Options.text("cloudflare-api-token").pipe(
  Options.withDescription("Cloudflare API Token"),
  Options.optional,
)

const secretAlchemyPassphrase = Options.text("secret-alchemy-passphrase").pipe(
  Options.withDescription("Alchemy Passphrase for state secrets"),
  Options.optional,
)

const fromRoute = Options.text("from-route").pipe(
  Options.withDescription(
    "Your vanity domain, aka the domain you want to rewrite requests from",
  ),
  Options.optional,
)

const toRoute = Options.text("to-route").pipe(
  Options.withDescription(
    "The origin domain, aka the domain you want to rewrite requests to",
  ),
  Options.optional,
)

/**
 * Optional CLI options with defaults
 */
const phase = Options.choice("phase", ["destroy", "up", "read"]).pipe(
  Options.withDescription("Phase to execute"),
  Options.withDefault("up"),
)

const stage = Options.text("stage").pipe(
  Options.withDescription("Deployment stage (default: dev)"),
  Options.withDefault("dev"),
)

const quiet = Options.boolean("quiet").pipe(
  Options.withDescription("Run in quiet mode"),
  Options.withDefault(false),
)

const dev = Options.boolean("dev").pipe(
  Options.withDescription(
    "Run in dev mode (use miniflare with choice of local and/or remote binding)",
  ),
  Options.withDefault(false),
)

const appName = Options.text("app-name").pipe(
  Options.withDescription("Application name (default: cf-origin-rewrite)"),
  Options.withDefault("cf-origin-rewrite"),
)

// Main command
const main = Command.make(
  "infra",
  {
    appName,
    phase,
    stage,
    quiet,
    dev,
    cloudflareAccountId,
    cloudflareApiToken,
    secretAlchemyPassphrase,
    fromRoute,
    toRoute,
  },
  (config) =>
    Effect.gen(function* () {
      const accountId = Option.getOrElse(
        config.cloudflareAccountId,
        () => process.env.CLOUDFLARE_ACCOUNT_ID || "",
      )
      if (!accountId) {
        yield* Console.error(
          "CLOUDFLARE_ACCOUNT_ID is not set. Provide with --cloudflare-account-id or in .env file",
        )
        return yield* Effect.fail(1)
      }

      const apiToken = Option.getOrElse(
        config.cloudflareApiToken,
        () => process.env.CLOUDFLARE_API_TOKEN || "",
      )
      if (!apiToken) {
        yield* Console.error(
          "CLOUDFLARE_API_TOKEN is not set. Provide with --cloudflare-api-token or in .env file",
        )
        return yield* Effect.fail(1)
      }

      const passphrase = Option.getOrElse(
        config.secretAlchemyPassphrase,
        () => process.env.SECRET_ALCHEMY_PASSPHRASE || "",
      )
      if (!passphrase) {
        const newPassphrase = randomBytes(16).toString("hex")
        yield* Console.error(
          "SECRET_ALCHEMY_PASSPHRASE is not set. Provide with --secret-alchemy-passphrase or in .env file",
        )
        yield* Console.log(
          `\nHere's a generated passphrase you can use:\n\nSECRET_ALCHEMY_PASSPHRASE="${newPassphrase}"\n`,
        )
        return yield* Effect.fail(1)
      }

      const fromRoute = Option.getOrElse(
        config.fromRoute,
        () => process.env.FROM_ROUTE || "",
      )
      if (!fromRoute) {
        yield* Console.error(
          "FROM_ROUTE is not set. Provide with --from-route or in .env file",
        )
        return yield* Effect.fail(1)
      }

      const toRoute = Option.getOrElse(
        config.toRoute,
        () => process.env.TO_ROUTE || "",
      )
      if (!toRoute) {
        yield* Console.error(
          "TO_ROUTE is not set. Provide with --to-route or in .env file",
        )
        return yield* Effect.fail(1)
      }

      yield* Effect.tryPromise({
        try: () =>
          createInfra({
            appName: config.appName,
            phase: config.phase,
            stage: config.stage,
            quiet: config.quiet,
            dev: config.dev,
            password: passphrase,
            fromRoute,
            toRoute,
          }),
        catch: (e) => {
          if (e instanceof Error) {
            return e
          }
          return new Error(`Infrastructure operation failed: ${e}`)
        },
      })
    }),
)

// Run the CLI
const cli = Command.run(main, {
  name: packageJson.name,
  version: packageJson.version,
})

pipe(cli(process.argv), Effect.provide(NodeContext.layer), NodeRuntime.runMain)
