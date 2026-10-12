import { buildApp } from './server.js'

const PORT = parseInt(process.env.PORT ?? '3000')
const HOST = process.env.HOST ?? '0.0.0.0'

async function start() {
  const app = await buildApp()

  try {
    await app.listen({ port: PORT, host: HOST })
    app.log.info(`API server listening on ${HOST}:${PORT}`)
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

start()
