# Microsoft Azure Function for IoT Device Provisioning
WIP -- Can test locally; deployment to Azure TBD

This Azure Function allows you to provision and synchronize a balena device with Azure IoT in a secure and automated way via an HTTP endpoint. The Azure Function may be called by a balena device, as seen in the [cloud-relay](https://github.com/balena-io-examples/cloud-relay) example.

| Command | Actions |
|---------|---------|
| POST | Provisions a balena device with Azure IoT. First the function verifies the device UUID with balenaCloud. ... |
| DELETE | Removes a balena device from the IoT Hub and removes the balena device environment variable. Essentially reverses the actions from provisioning with POST. |

## Setup and Testing
### Azure setup
You only need to set up an IoT Hub in a resource group in Azure. See the IoT Hub [Getting started guide](https://docs.microsoft.com/en-us/azure/iot-hub/iot-hub-node-node-device-management-get-started), specifically the section *Create an IoT Hub*, to setup an IoT Hub in the Azure portal. Alternatively, see [this quickstart](https://docs.microsoft.com/en-us/azure/iot-develop/quickstart-send-telemetry-iot-hub) to setup an IoT Hub with the Azure CLI.

### Development setup
Clone this repo
```
$ git clone https://github.com/balena-io-examples/azure-iot-provision
```

The sections below show how to test the Azure Function on a local test server and deploy to Azure Functions. In either case you must provide the environment variables from the table below as described in the sections below.

| Key         |    Value    |
|-------------|-------------|
| RESIN_EMAIL | for balena login |
| RESIN_PASSWORD | for balena email address |
| CONNECTION_STRING | Found in the Azure Portal at: IoT Hub -> Shared access policies -> registryReadWrite -> Primary connection string |

### Test locally
You can test provisioning before deploying it. First, see the Azure Functions [JavaScript quickstart](https://docs.microsoft.com/en-us/azure/azure-functions/create-first-function-cli-node) for tools you must install. You'll need NodeJS including npm, Azure Functions Core Tools, and Azure CLI (or Az module for PowerShell).

Then create a Core Tools function project with these CLI commands:

```
func init provision-test --javascript
cd provision-test
func new --name provision --template "HTTP trigger" --authlevel "anonymous"
```

Next copy files from the `azure-iot-provision` project clone into the `provision-test` directory hierarchy:
```
cp <clone-dir>/src/package.json .
# copy in dependencies
npm install
cp <clone-dir>/src/index.js provision
cp <clone-dir>/tools/run-local-server.sh .
cp <clone-dir>/tools/test-provision.sh .
```

See the two shell script files. You must customize them with values for environment variables from the table above, specific to your setup. Also use a valid balena device UUID so you can validate the provisioning. Then run `run-local-server.sh` to start the local function server, and run `test-provision.sh` to send an HTTP request to add/delete provisioning in Azure IoT for the device.

After a successful POST, you should see the device appear in your IoT Core registry, and `AZURE_CERT` and `AZURE_PRIVATE_KEY` variables appear in balenaCloud for the device. After a successful DELETE, those variables disappear.

## Deploy
TBD
