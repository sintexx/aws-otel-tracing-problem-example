import { SSTConfig } from "sst";
import { API } from "./stacks/MyStack";

function getMonitoringLayer(app: any) {
  if (!process.env.HONEY_API_KEY) {
    console.log('NO HONEYCOMB KEY Provided, Monitoring disabled');
    return {};
  }

  console.log('USE HONEYCOMB Monitoring');

  return {
    permissions: ['lambda:GetLayerVersion', 'lambda:GetLayerVersionPolicy'],
    enableLiveDev: false,
    environment: {
      HONEY_API_KEY: process.env.HONEY_API_KEY!,
      OTEL_SERVICE_NAME: 'smsf-dashboard',
      AWS_LAMBDA_EXEC_WRAPPER: '/opt/otel-handler',
      LIBHONEY_DATASET: 'smsf-dashboard',
      OTEL_PROPAGATORS: 'tracecontext',
      OTEL_NODE_RESOURCE_DETECTORS: 'none',
      OTEL_TRACES_SAMPLER: 'always_on',
      OPENTELEMETRY_COLLECTOR_CONFIG_FILE:
        'yaml:' +
        `{receivers: {otlp: {protocols: {grpc, http}}}, exporters: {otlp: {endpoint: 'api.honeycomb.io:443', headers: {x-honeycomb-team: '${process
          .env
          .HONEY_API_KEY!}'}}}, service: {pipelines: {traces: {receivers: [otlp], exporters: [otlp]}}}}`,
    },
  };
}

export default {
  config(_input) {
    return {
      name: "honeycomb-tracing-problem",
      region: "eu-central-1",
    };
  },
  stacks(app) {
    app.setDefaultFunctionProps({
      runtime: 'nodejs18.x',
      architecture: 'arm_64',
      tracing: 'disabled',
      ...getMonitoringLayer(app),
    });
    app.stack(API);
  }
} satisfies SSTConfig;
