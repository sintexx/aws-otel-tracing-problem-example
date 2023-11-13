import { LayerVersion } from "aws-cdk-lib/aws-lambda";
import { Api, Bucket, EventBus, StackContext, Table } from "sst/constructs";

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

  const api = new Api(stack, "api", {
    defaults: {
      function: {
        bind: [bus, sampleBucket, t],
        layers: [
          LayerVersion.fromLayerVersionArn(
            stack,
            'otelBaseLayer',
            `arn:aws:lambda:eu-central-1:901920570463:layer:aws-otel-nodejs-arm64-ver-1-15-0:1`,
          ),
        ],
      },
    },
    routes: {
      "GET /": "packages/functions/src/lambda.handler",
      "GET /todo": "packages/functions/src/todo.list",
      "POST /todo": "packages/functions/src/todo.create",
    },
  });

  bus.subscribe("todo.created", {
    handler: "packages/functions/src/events/todo-created.handler",
  });

  stack.addOutputs({
    ApiEndpoint: api.url,
  });
}
