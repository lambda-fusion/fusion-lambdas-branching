const sharp = require("sharp");
const { FunctionFusion, handlerWrapper } = require("aws-lambda-fusion");
const fetch = require("node-fetch");

let traceId;
exports.handler = async (event, context, callback) => {
  traceId = event.traceId;
  return handlerWrapper({
    event,
    context,
    callback,
    handler: internalHandler,
    traceId,
    lambdaName: "flip",
  });
};

const internalHandler = async (event, context) => {
  const response = await fetch(
    "https://fusion-config.s3.eu-central-1.amazonaws.com/fusionConfiguration.json"
  );
  const fusionConfiguration = await response.json();

  const fusion = new FunctionFusion(
    fusionConfiguration,
    {
      region: "eu-central-1",
    },
    __dirname
  );

  const base64String = event.args[0];
  const base64Buffer = Buffer.from(base64String, "base64");

  const resizedBase64 = (
    await sharp(base64Buffer)
      .resize(null, 1200)
      .flip(true)
      .sharpen()
      .trim()
      .toBuffer()
  ).toString("base64");

  result = await fusion.invokeFunctionSync(
    { source: "flip", target: "saveS3", context, traceId },
    resizedBase64,
    traceId
  );

  if (result.FunctionError) {
    throw Error(result.Payload);
  }
  return {
    status: 200,
    result,
  };
};
