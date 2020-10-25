const AWS = require("aws-sdk");
const { handlerWrapper } = require("aws-lambda-fusion");

exports.handler = async (event, context, callback) => {
  const traceId = event.traceId;
  return handlerWrapper({
    event,
    context,
    callback,
    handler: internalHandler,
    lambdaName: "saveS3",
    traceId,
  });
};

const internalHandler = async (event) => {
  const s3 = new AWS.S3();
  const base64String = event.args[0];
  const buffer = Buffer.from(base64String, "base64");
  const now = Date.now();

  const params = {
    Bucket: "files-bucket-jun",
    Key: `${
      new Date(Date.now()).toISOString().split("T")[0]
    }/resized-${now}.jpeg`, // type is not required
    Body: buffer,
    ContentEncoding: "base64", // required
    ContentType: `image/jpeg`,
    // required. Notice the back ticks
  };

  let location = "";
  let key = "";
  try {
    const { Location, Key } = await s3.upload(params).promise();
    location = Location;
    key = Key;
  } catch (error) {
    throw error;
  }

  console.log(location, key);

  return location;
};
