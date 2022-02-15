# Microsoft Azure Function for IoT Device Provisioning
WIP -- only able to test locally at present

This Azure Function allows you to provision and synchronize a balena device with Azure IoT in a secure and automated way via an HTTP endpoint. The Azure Function may be called by a balena device, as seen in the [cloud-relay](https://github.com/balena-io-examples/cloud-relay) example.

| Method | Actions |
|-------------|--------|
| POST | Provisions a balena device with Azure IoT. First the function verifies the device UUID with balenaCloud. ... |
| DELETE | Removes a balena device from the IoT Hub and removes the balena device environment variable. Essentially reverses the actions from provisioning with POST. |

## Setup and Testing
### Azure setup
TBD

### Development setup
Clone this repo
```
$ git clone https://github.com/balena-io-examples/azure-iot-provision
```

The sections below show how to test the Azure Function on a local test server and deploy to Azure Functions. In either case you must provide the environment variables in the table below as instructed for the test/deployment.

| Key         |    Value    |
|-------------|-------------|
| RESIN_EMAIL | for balena login |
| RESIN_PASSWORD | for balena email address |
| CONNECTION_STRING | Found at: IoT Hub -> Shared access policies -> registryReadWrite -> Primary connection string |

### Test locally
TBD, but see `test-local.sh`

## Deploy
TBD
