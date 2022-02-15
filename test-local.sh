# Create or delete provisioning with Azure IoT Hub.
#
# Params:
#    * method -- POST (to create), or DELETE
#
#    $ test-local.sh <POST|DELETE>

export RESIN_EMAIL=<your-balena-email-name>
export RESIN_PASSWORD=<your-password-for-balena-email>
export CONNECTION_STRING=<your-iot-hub-connection-string>

BALENA_DEVICE_UUID=<your-uuid>

npm start $1 $BALENA_DEVICE_UUID
