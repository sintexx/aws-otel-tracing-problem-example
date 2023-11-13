import {
  // This command supersedes the ListObjectsCommand and is the recommended way to list objects.
  ListObjectsV2Command,
  S3Client,
} from "@aws-sdk/client-s3";
import { trace } from '@opentelemetry/api';
import { ApiHandler } from "sst/node/api";
import { Bucket } from "sst/node/bucket";
import { Table } from "sst/node/table";

import { DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb";

const tracer = trace.getTracer('helloWorld');

const s3 = new S3Client({});
const dynamodb = new DynamoDBClient({});

export const handler = ApiHandler(async (_evt) => {
  return tracer.startActiveSpan('helloWorld2', async (masterSpan) => {
    
    masterSpan.setAttribute("test", "hello world")




    await tracer.startActiveSpan("listBucket", async (listBucket) => {
      const command = new ListObjectsV2Command({
        Bucket: Bucket.sampleBucket.bucketName,
        MaxKeys: 1,
      });
  
      const res = await s3.send(command)

      listBucket.setAttribute("res", JSON.stringify(res))

      console.log("LIST BUCKT")

      await tracer.startActiveSpan("Scan Dynamo", async (scanDynamo) => {

        const scanC = new ScanCommand({TableName: Table.Notes.tableName})

        const response = await dynamodb.send(scanC);

        scanDynamo.setAttribute("res", JSON.stringify(response))


        scanDynamo.end()
      })

      listBucket.end()
    })


    const r = {
      statusCode: 200,
      body: `Hello world. The time is ${new Date().toISOString()}`,
    };

    masterSpan.end()
    return r
  })

});
