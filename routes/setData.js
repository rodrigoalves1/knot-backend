var express = require("express");
var MeshbluSocketIO = require("meshblu");
var router = express.Router();

var meshblu = new MeshbluSocketIO({
  resolveSvr: false,
  hostname: "knot-test.cesar.org.br",
  port: 3000,
  uuid: "",
  token: "",
  protocol: "ws"
});
var responses = {};

meshblu.on("ready", function(response) {
  if (!meshblu.uuid) {
    meshblu.uuid = response.uuid;
    meshblu.token = response.token;
  }

  const uuid = response.uuid;

  if (responses[uuid]) {
    responses[uuid].forEach((info, i) => {
      var updateValues = {};
      if (info.itemData === "true") {
        updateValues = {
          uuid: info.thingUuid,
          set_data: [
            {
              sensor_id: parseInt(info.itemId),
              value: true
            }
          ]
        };
      } else if (info.itemData === "false") {
        updateValues = {
          uuid: info.thingUuid,
          set_data: [
            {
              sensor_id: parseInt(info.itemId),
              value: false
            }
          ]
        };
      } else {
        updateValues = {
          uuid: info.thingUuid,
          set_data: [
            {
              sensor_id: parseInt(info.itemId),
              value: parseInt(info.itemData)
            }
          ]
        };
      }
      meshblu.update(updateValues, function(response) {
        info.res.send(response);
        delete responses[uuid][i];
      });
    });
  }
});

meshblu.on("notReady", function(response) {
  const uuid = response.uuid;
  if (responses[uuid]) {
    responses[uuid].forEach((info, i) => {
      info.res.send(response);
      delete responses[uuid][i];
    });
  }
});
/* GET Devices from a gateway. */
router.post("/", function(req, res, next) {
  const hostname = req.body.hostname;
  const port = req.body.port;
  const uuid = req.body.ownerUuid;
  const token = req.body.ownerToken;
  const thingUuid = req.body.thingUuid;
  const itemId = req.body.itemId;
  const itemData = req.body.itemData;

  if (uuid === "" || token === "" || thingUuid === "" || itemId === ""
    || itemData === "")
    res.send({ status: "Please provide all required values." });

  meshblu["_options"].hostname = hostname;
  meshblu["_options"].port = port;
  meshblu["_options"].uuid = uuid;
  meshblu["_options"].token = token;

  if (responses[uuid]) {
    responses[uuid].push({ res, thingUuid, itemId, itemData });
  } else {
    responses[uuid] = [{ res, thingUuid, itemId, itemData }];
  }
  meshblu.connect();
});

module.exports = router;
