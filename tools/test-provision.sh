# Send a request to add/delete a device to Azure IoT Hub. Requires NodeJS 14+.
#
# Params:
#    * method -- POST (to create), or DELETE
#
#    $ test-provision.sh <POST|DELETE>
#
#    Use your values for variables of the form '<your-*>'.

BALENA_DEVICE_UUID=<your-device-UUID>
# URL for local server from run-local-server.sh
PROVISION_URL="http://localhost:7071/api/provision"
# URL for Azure Function
#PROVISION_URL=<your-azure-function-url>

curl $PROVISION_URL -H "Content-Type:application/json" \
   -d '{ "uuid": "'$BALENA_DEVICE_UUID'", "method": "'$1'" }' -v
