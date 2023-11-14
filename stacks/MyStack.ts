import { LayerVersion } from "aws-cdk-lib/aws-lambda";
import { AppSyncApi, Bucket, Config, EventBus, StackContext, Table } from "sst/constructs";

export function API({ stack }: StackContext) {

  const sampleBucket = new Bucket(stack, "sampleBucket")

  const t = new Table(stack, "Notes", {
    fields: {
      userId: "string",
      noteId: "string",
    },
    primaryIndex: { partitionKey: "noteId", sortKey: "userId" },
  });

  const bus = new EventBus(stack, "bus", {
    defaults: {
      retries: 10,
    },
  });

  const VERSION = new Config.Parameter(stack, "VERSION", {
    value: "1.2.0",
  });

  const appSync = new AppSyncApi(stack, "endpoint", {
    defaults: {
      function: {
        bind: [bus, sampleBucket, t, VERSION],
        layers: [
          LayerVersion.fromLayerVersionArn(
            stack,
            'otelBaseLayer',
            `arn:aws:lambda:eu-central-1:901920570463:layer:aws-otel-nodejs-arm64-ver-1-15-0:1`,
          ),
        ],
      },
    },
    schema: 'graphql/schema.graphql',
    resolvers: {
      "Query    root": "packages/functions/src/lambda.handler",
    },
  })

  bus.subscribe("todo.created", {
    handler: "packages/functions/src/events/todo-created.handler",
  });

  stack.addOutputs({
    ApiEndpoint: appSync.url,
  });
}
