import type { Connect, Plugin } from 'vite'

/**
 * Mount the local ops API on the Vite dev server so the dashboard can
 * POST /ops/:id/run on the same origin. Loaded via ssrLoadModule so Vite
 * compiles the API TypeScript instead of Node trying to import .ts files.
 */
export function cpOpsApiPlugin(): Plugin {
  return {
    name: 'cp-ops-api',
    configureServer(server) {
      let api: ((req: unknown, res: unknown) => void) | undefined
      const load = async () => {
        if (api) return api
        const mod = (await server.ssrLoadModule('../api/src/server.ts')) as {
          createServer: () => (req: unknown, res: unknown) => void
        }
        api = mod.createServer()
        return api
      }
      const handler: Connect.NextHandleFunction = (req, res, next) => {
        const path = (req.url ?? '').split('?')[0]
        if (path !== '/health' && path !== '/ops' && !path.startsWith('/ops/')) {
          next()
          return
        }
        void load()
          .then((app) => {
            app(req, res)
          })
          .catch((err: unknown) => {
            next(err)
          })
      }
      server.middlewares.use(handler)
    },
  }
}
