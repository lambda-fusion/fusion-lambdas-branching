const chromium = require("chrome-aws-lambda");
const { FunctionFusion, handlerWrapper } = require("aws-lambda-fusion");
const fetch = require("node-fetch");
const { v4: uuid } = require("uuid");

const internalHandler = async (event, context) => {
  const traceId = event.traceId;
  let base64img = null;
  let browser = null;
  let result = null;
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

  try {
    browser = await chromium.puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath,
      headless: chromium.headless,
    });

    const page = await browser.newPage();

    await page.goto(event.url || "https://example.com");

    base64img = await page.screenshot({ encoding: "base64" });

    console.log("successfully captured screenshot");

    result = await fusion.invokeFunctionSync(
      { source: "screenshot", target: "resize", context, traceId },
      base64img
    );
  } catch (error) {
    throw error;
  } finally {
    if (browser !== null) {
      await browser.close();
    }
  }
  return result;
};

exports.handler = async (event, context, callback) => {
  const traceId = event.traceId;
  return handlerWrapper({
    event,
    context,
    callback,
    handler: internalHandler,
    traceId,
    lambdaName: "screenshot",
  });
};
