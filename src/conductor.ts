
import {spawn, execSync} from 'child_process'
import * as fs from 'fs-extra'
import * as path from 'path'
import * as rimraf from 'rimraf'
import * as Config from './config'


export const cleanConductorStorage = (baseDir) => {
  rimraf.sync(Config.chainStorageDir(baseDir))
  rimraf.sync(Config.uiStorageDir(baseDir))
}

export const initializeConductorConfig = (baseDir) => {
  console.log("Creating conductor config at: ", Config.conductorConfigPath(baseDir))
  try {
    fs.mkdirSync(baseDir, {recursive: true})
  } catch(e) {}
  try {
    fs.mkdirSync(Config.uiStorageDir(baseDir), {recursive: true})
  } catch(e) {}
  let toml = initialTomlConfig(baseDir)
  fs.writeFileSync(Config.conductorConfigPath(baseDir), toml)
}

// TODO: allow optional temp path
export const spawnConductor = (baseDir) => {
  console.log("Using conductor binary: ", execSync('which holochain').toString())
  const conductor = spawn('holochain', ['-c', baseDir])
  conductor.stdout.on('data', data => console.log('(HC)', data.toString('utf8')))
  conductor.stderr.on('data', data => console.error('(HC) <E>', data.toString('utf8')))
  conductor.on('close', code => console.log('Conductor closed with code: ', code))
  return conductor
}

const initialTomlConfig = (baseDir) => {

  // const keyFile = 'what it is'
  // const publicAddress = execSync(`hc keygen --path $STANDARD_KEY_PATH --silent`)

  // TODO: generate key here and use generated key path
  // this is temporary hard-coded config for now
  const {keyFile, publicAddress} = JSON.parse(fs.readFileSync(Config.keyConfigFile, 'utf8'))

  // TODO: add DNA for HCHC when available
  return `
bridges = []

persistence_dir = "${baseDir}"
signing_service_uri = "http://localhost:${Config.PORTS.wormhole}"

[[agents]]
id = "${Config.hostAgentId}"
name = "Intrceptr Host"
keystore_file = "${keyFile}"
public_address = "${publicAddress}"

[[dnas]]
file = "${Config.DNAS.holoHosting.path}"
hash = "${Config.DNAS.holoHosting.hash}"
id = "${Config.DNAS.holoHosting.hash}"

[[instances]]
agent = "${Config.hostAgentId}"
dna = "${Config.DNAS.holoHosting.hash}"
id = "${Config.holoHostingAppId}"

[instances.storage]
path = "${path.join(Config.chainStorageDir(baseDir), Config.holoHostingAppId)}"
type = "file"

[[interfaces]]
id = "${Config.ConductorInterface.Master}"
admin = true

[[interfaces.instances]]
id = "${Config.holoHostingAppId}"

[interfaces.driver]
port = ${Config.PORTS.masterInterface}
type = "websocket"

[[interfaces]]
id = "${Config.ConductorInterface.Public}"

[interfaces.driver]
port = ${Config.PORTS.publicInterface}
type = "websocket"

[[interfaces]]
id = "${Config.ConductorInterface.Internal}"

[interfaces.driver]
port = ${Config.PORTS.internalInterface}
type = "websocket"

[logger]
type = "debug"
[[logger.rules.rules]]
color = "red"
exclude = false
pattern = "^err/"

[[logger.rules.rules]]
color = "white"
exclude = false
pattern = "^debug/dna"

[[logger.rules.rules]]
exclude = false
pattern = ".*"
`
}
