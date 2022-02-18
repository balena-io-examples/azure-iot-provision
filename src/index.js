const sdk = require('balena-sdk');
const balena = sdk.fromSharedOptions()
const iothub = require('azure-iothub')
const shell = require('shelljs')
const fs = require('fs/promises')

let registry = null

module.exports = async function (context, req) {
    try {
        const creds = { email: process.env.RESIN_EMAIL, password: process.env.RESIN_PASSWORD }
        await balena.auth.login(creds)

        // Validate device with balenaCloud
        console.log('event:', JSON.stringify(req))
        if (!req || !req.body) {
            throw { code: 'provision.request.no-body' }
        }
        const body = req.body;
        if (!body.uuid) {
            throw { code: 'provision.request.no-uuid' }
        }
        await balena.models.device.get(body.uuid)


        // provided in Azure portal at IoT Hub -> Shared access policies -> registryReadWrite
        const connectionString = process.env.CONNECTION_STRING
        registry = iothub.Registry.fromConnectionString(connectionString)

        const method = body.method
        switch (method) {
            case 'POST':
                console.log(`Creating device: ${body.uuid} ...`)
                context.res = await handlePost(context, body.uuid)
                break
            case 'DELETE':
                console.log(`Deleting device: ${body.uuid} ...`)
                context.res = await handleDelete(context, body.uuid)
                break
            default:
                throw { code: 'provision.request.bad-method' }
        }

    } catch (error) {
        console.log("Error: ", error)
        let statusCode = 500
        let errorCode = String(error.code)
        if (errorCode) {
            if (errorCode === balena.errors.BalenaDeviceNotFound.prototype.code
                    || errorCode === balena.errors.BalenaInvalidLoginCredentials.prototype.code
                    || errorCode.startsWith('provision.request')) {
                statusCode = 400
            }
        }
        context.res = {
            status: statusCode,
            body: error
        }
    }
}

async function handlePost(context, uuid) {
    // Create self-signed cert by:
    //   1. generate private key
    //   2. create certificate signing request
    //   3. create self-signed cert signed with private key
    //   4. print fingerprint
    const cmd = `openssl genpkey -out device_private.pem -algorithm RSA -pkeyopt rsa_keygen_bits:2048 \
     && openssl req -new -key device_private.pem -out device_csr.pem -subj "/CN=${uuid}" \
     && openssl x509 -req -in device_csr.pem -signkey device_private.pem -out device_cert.pem -days 3650 \
     && openssl x509 -in device_cert.pem -noout -fingerprint`

    execRes = shell.exec(cmd)
    // 'SHA1 Fingerprint=73:86:AC:AE:DA:B8:B1:D1:33:36:0A:1D:38:F5:A7:18:DF:C4:44:8D\n'
    const fingerprint = execRes.stdout.substr(17, 59).replace(/:/g, '')
    const privateKey = await fs.readFile(`device_private.pem`)
    const cert = await fs.readFile(`device_cert.pem`)

    // Create a new device
    let deviceInfo = {
        deviceId: uuid,
        authentication: {
            x509Thumbprint: {
                primaryThumbprint: fingerprint,
                secondaryThumbprint: fingerprint
            }
        }
    }

    const response = await registry.create(deviceInfo)
    console.debug("device:", response.responseBody)

    await balena.models.device.envVar.set(uuid, 'AZURE_PRIVATE_KEY', privateKey.toString('base64'))
    await balena.models.device.envVar.set(uuid, 'AZURE_CERT', cert.toString('base64'))

    console.log("Created device")
    return {
        status: 201,
        body: "device created"
    }
}

async function handleDelete(context, uuid) {
    await registry.delete(uuid)

    await balena.models.device.envVar.remove(uuid, 'AZURE_CERT')
    await balena.models.device.envVar.remove(uuid, 'AZURE_PRIVATE_KEY')

    console.log("Deleted device")
    return {
        status: 200,
        body: "device deleted"
    }
}
