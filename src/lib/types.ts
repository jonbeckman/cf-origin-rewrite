import type { Context } from "hono"
import type { ApiEnv } from "infra/types/env"

export interface AppBindings {
  Bindings: ApiEnv
}

export type Env = ApiEnv

export type AppContext = Context<AppBindings>
