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
      //you can pass a list of uuids instead  e.g. { gateways: ["uud1","uuid2"] }
      meshblu.devices({ gateways: ["*"] }, function(response) {
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
  const uuid = req.body.ownerUuid;
  const token = req.body.ownerToken;
  const gateway = req.body.gateway;
  const hostname = req.body.hostname;
  const port = req.body.port;

  if (uuid === "" || token === "" || gateway === "")
    res.send({ status: "Please provide all required values." });
  meshblu["_options"].hostname = hostname;
  meshblu["_options"].port = port;
  meshblu["_options"].uuid = uuid;
  meshblu["_options"].token = token;

  console.log(meshblu["_options"]);

  if (responses[uuid]) {
    responses[uuid].push({ res, gateway });
  } else {
    responses[uuid] = [{ res, gateway }];
  }
  meshblu.connect();
});

module.exports = router;
