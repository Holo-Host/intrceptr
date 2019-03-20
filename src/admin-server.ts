import * as express from 'express'
import * as bodyParser from 'body-parser'
import {Client} from 'rpc-websockets'

import * as C from './config'
import installHapp, {InstallHappRequest} from './flows/install-happ'

export default (port, masterClient) => {
  const app = express()
  app.use(bodyParser.json())

  app.post('/holo/happs/install', async (req, res, next) => {
    const {happId}: InstallHappRequest = req.body
    installHapp(masterClient)({happId})
      .then(() => res.send("Installation successful"))
      .catch(catchHttp(next))
  })

  app.listen(port, () => console.log(`Admin HTTP server listening on port ${port}`))

  return app
}

const catchHttp = next => e => {
  console.error("HTTP error caught:")
  next(e)
}
