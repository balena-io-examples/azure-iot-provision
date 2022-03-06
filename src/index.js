/*
 * See Azure Functions JavaScript developer guide for reference:
 * https://docs.microsoft.com/en-us/azure/azure-functions/functions-reference-node
 */
const sdk = require('balena-sdk');
const balena = sdk.fromSharedOptions()
const iothub = require('azure-iothub')
const shell = require('shelljs')
const fs = require('fs/promises')
const os = require('os');
const path = require('path');

let registry

/**
 * Provides creation and deletion of Azure IoT Hub device, and updates balena environment
 * vars. Expects JSON formatted event like: { uuid: <device-uuid>, method: <POST|DELETE>,
 * balena_service: <service-name> }.
 */
module.exports = async function (context, req) {
    try {
        const badBodyCode = 'provision.request.bad-body'
        const creds = { email: process.env.BALENA_EMAIL, password: process.env.BALENA_PASSWORD }
        await balena.auth.login(creds)

        // Validate device with balenaCloud
        context.log('event:', JSON.stringify(req))
        if (!req || !req.body) {
            throw { code: 'provision.request.no-body' }
        }
        const body = req.body;
        if (!body.uuid) {
            throw { code: badBodyCode }
        }
        // lookup device; throws error if not found
        const device = await balena.models.device.get(body.uuid)

        // lookup service, if name provided
        let service
        if (body.balena_service) {
            const allServices = await balena.models.service.getAllByApplication(device.belongs_to__application.__id)
            for (service of allServices) {
                //console.debug("service_name:", service.service_name)
                if (service.service_name == body.balena_service) {
                    break
                }
            }
            if (!service) {
                throw { code: badBodyCode }
            }
        }

        // provided in Azure portal at IoT Hub -> Shared access policies -> registryReadWrite
        const connectionString = process.env.CONNECTION_STRING
        registry = iothub.Registry.fromConnectionString(connectionString)

        let resObj = null
        let deviceText = `${body.uuid} for service ${body.balena_service}`
        switch (body.method) {
            case 'POST':
                context.log(`Creating device: ${deviceText} ...`)
                resObj = await handlePost(context, device, service)
                context.res.status = resObj.status
                context.res.body = resObj.body
                break
            case 'DELETE':
                context.log(`Deleting device: ${deviceText} ...`)
                resObj = await handleDelete(context, device, service)
                context.res.status = resObj.status
                context.res.body = resObj.body
                break
            default:
                throw { code: 'provision.request.bad-method' }
        }

    } catch (error) {
        context.log.warn("Error: ", error)
        let statusCode = 500
        let resBody = ""
        if (error.code) {
            // balena error
            if (error.code === balena.errors.BalenaDeviceNotFound.prototype.code
                    || error.code === balena.errors.BalenaInvalidLoginCredentials.prototype.code
                    || error.code.startsWith('provision.request')) {
                statusCode = 400
            }
            resBody = error.code
        } else {
            // other error
            if (error.name) {
                resBody = error.name
            }
        }
        if (error.message) {
            resBody = `${resBody} ${error.message}`
        }

        context.res.status = statusCode
        context.res.body = resBody
    }
}

/**
 * Adds device to IoT Hub registry with new key pair and certificate, and sets
 * balena environment vars.
 *
 * service: Service on the balena device for which variables are created. If service
 * is undefined, creates device level environment variables.
 *
 * Returns a 400 response if thing already exists. Throws an error on failure to
 * create the device.
 */
async function handlePost(context, device, service) {
    // Create self-signed cert by:
    //   1. generate private key
    //   2. create certificate signing request
    //   3. create self-signed cert signed with private key
    //   4. print fingerprint
    const tmpdir = await fs.mkdtemp(path.join(os.tmpdir(), 'provision-'))
    let fingerprint, privateKey, cert
    try {
        const cmd = `openssl genpkey -out ${tmpdir}/device_private.pem -algorithm RSA -pkeyopt rsa_keygen_bits:2048 \
         && openssl req -new -key ${tmpdir}/device_private.pem -out ${tmpdir}/device_csr.pem -subj "/CN=${device.uuid}" \
         && openssl x509 -req -in ${tmpdir}/device_csr.pem -signkey ${tmpdir}/device_private.pem -out ${tmpdir}/device_cert.pem -days 3650 \
         && openssl x509 -in ${tmpdir}/device_cert.pem -noout -fingerprint`

        execRes = shell.exec(cmd)
        // 'SHA1 Fingerprint=73:86:AC:AE:DA:B8:B1:D1:33:36:0A:1D:38:F5:A7:18:DF:C4:44:8D\n'
        fingerprint = execRes.stdout.substr(17, 59).replace(/:/g, '')
        privateKey = await fs.readFile(`${tmpdir}/device_private.pem`)
        cert = await fs.readFile(`${tmpdir}/device_cert.pem`)
    } finally {
        if (process.version.match(/^v(\d+)/)[1] > 14) {
            await fs.rm(tmpdir, {recursive: true})
        } else {
            await fs.rmdir(tmpdir, {recursive: true})
        }
    }

    // Create a new device
    let deviceInfo = {
        deviceId: device.uuid,
        authentication: {
            x509Thumbprint: {
                primaryThumbprint: fingerprint,
                secondaryThumbprint: fingerprint
            }
        }
    }

    const response = await registry.create(deviceInfo)
    context.log.verbose("device:", response.responseBody)

    if (service) {
        await balena.models.device.serviceVar.set(device.id, service.id, 'AZURE_PRIVATE_KEY',
                privateKey.toString('base64'))
        await balena.models.device.serviceVar.set(device.id, service.id, 'AZURE_CERT',
                cert.toString('base64'))
    } else {
        await balena.models.device.envVar.set(device.uuid, 'AZURE_PRIVATE_KEY',
                privateKey.toString('base64'))
        await balena.models.device.envVar.set(device.uuid, 'AZURE_CERT',
                cert.toString('base64'))
    }

    context.log("Created device")
    return {
        status: 201,
        body: "device created"
    }
}

/**
 * Removes device and certificate from IoT hub registry, and also removes balena
 * environment vars. Cleans up resources as available; accommodates missing resources.
 *
 * service: Service on the balena device for which variables are removed. If service
 * is undefined, removes device level environment variables.
 * 
 * Throws an error on failure to delete the device or certificate.
 */
async function handleDelete(context, device, service) {
    try {
        await registry.delete(device.uuid)
    } catch (error) {
        if (!error.name || error.name != "DeviceNotFoundError") {
            throw error
        } else {
            context.log("Device not found in Azure registry")
        }
    }

    if (service) {
        await balena.models.device.serviceVar.remove(device.uuid, service.id, 'AZURE_CERT')
        await balena.models.device.serviceVar.remove(device.uuid, service.id, 'AZURE_PRIVATE_KEY')
    } else {
        await balena.models.device.envVar.remove(device.uuid, 'AZURE_CERT')
        await balena.models.device.envVar.remove(device.uuid, 'AZURE_PRIVATE_KEY')
    }

    context.log("Deleted device")
    return {
        status: 200,
        body: "device deleted"
    }
}
