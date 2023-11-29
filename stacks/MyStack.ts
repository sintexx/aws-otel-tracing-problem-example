import { LayerVersion } from "aws-cdk-lib/aws-lambda";
import { Bucket, Config, Queue, StackContext, Table } from "sst/constructs";

export function API({ stack }: StackContext) {

  const sampleBucket = new Bucket(stack, "sampleBucket")

  const t = new Table(stack, "Notes", {
    fields: {
      userId: "string",
      noteId: "string",
    },
    primaryIndex: { partitionKey: "noteId", sortKey: "userId" },
  });


  const VERSION = new Config.Parameter(stack, "VERSION", {
    value: "1.2.0",
  });


  new Queue(stack, "TestQueue", {
    consumer: {
      function: {
        handler: "packages/functions/src/lambda.handler",
        timeout: "1 minute",
        bind: [sampleBucket, t, VERSION],
        layers: [
          LayerVersion.fromLayerVersionArn(
            stack,
            'otelBaseLayer2',
            `arn:aws:lambda:eu-central-1:901920570463:layer:aws-otel-nodejs-amd64-ver-1-17-1:1`,
          ),
        ],
      },
    },
  });
}
