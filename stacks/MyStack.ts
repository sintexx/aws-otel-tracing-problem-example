import { LayerVersion } from "aws-cdk-lib/aws-lambda";
import { AppSyncApi, Bucket, Config, Queue, StackContext, Table } from "sst/constructs";

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

  const appSync = new AppSyncApi(stack, "endpoint", {
    defaults: {
      function: {
        bind: [sampleBucket, t, VERSION],
        layers: [
          LayerVersion.fromLayerVersionArn(
            stack,
            'otelBaseLayer',
            `arn:aws:lambda:eu-central-1:901920570463:layer:aws-otel-nodejs-amd64-ver-1-17-1:1`,
          ),
        ],
        nodejs: {
          esbuild: {
            external: [
              '@opentelemetry/sdk-node',
              '@opentelemetry/auto-instrumentations-node',
              '@opentelemetry/instrumentation-http',
          '@opentelemetry/instrumentation-express',
          '@opentelemetry/instrumentation',
          '@opentelemetry/instrumentation-graphql',
          '@opentelemetry/instrumentation-aws-lambda',
          '@opentelemetry/api',
          '@opentelemetry/core',
          '@opentelemetry/resources',
          '@opentelemetry/tracing',
          '@opentelemetry/node',
          '@opentelemetry/exporter-collector',
          'http',
          'graphql'
            ]
          }
        }
      },
      
    },
    schema: 'graphql/schema.graphql',
    resolvers: {
      "Query    root": "packages/functions/src/lambda.handler",
    },
  })

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

  stack.addOutputs({
    ApiEndpoint: appSync.url,
  });
}
