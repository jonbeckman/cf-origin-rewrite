#!/usr/bin/env tsx

import "alchemy/esbuild"
import alchemy, { type Phase } from "alchemy"
import { CloudflareStateStore } from "alchemy/state"
import { createApiWorker } from "./api"

export interface CreateInfraOptions {
  appName: string
  stage: string
  phase: Phase
  quiet: boolean
  password: string
  dev: boolean
  fromRoute: string
  toRoute: string
}

export async function createInfra(options: CreateInfraOptions) {
  const { appName, stage, phase, quiet, password, dev, fromRoute, toRoute } =
    options

  const infra = await alchemy(appName, {
    stage,
    phase,
    quiet,
    password: password,
    ...(dev
      ? {
          dev: "prefer-local",
        }
      : {
          stateStore: (scope) => new CloudflareStateStore(scope),
        }),
  })

  await createApiWorker(appName, stage, fromRoute, toRoute)

  await infra.finalize()
}
