import { DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb";
import {
  // This command supersedes the ListObjectsCommand and is the recommended way to list objects.
  ListObjectsV2Command,
  S3Client,
} from "@aws-sdk/client-s3";
import { trace } from '@opentelemetry/api';
import { Bucket } from "sst/node/bucket";
import { Table } from "sst/node/table";

const tracer = trace.getTracer('helloWorld');


const s3 = new S3Client({});
const dynamodb = new DynamoDBClient({});
export const handler = async (event: any) => {


  
  const r = tracer.startActiveSpan('test trace', async (masterSpan) => {
    
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

    await tracer.startActiveSpan("getSSTConfig", async (sstConfigTrace) => {

      const sstConfig = await import('sst/node/config');

      const c = (sstConfig).Config;

      sstConfigTrace.setAttribute("VersionConfigSST", c.VERSION)
      
      sstConfigTrace.end()

    })


    masterSpan.end()


    return `Hello world. The time is ${new Date().toISOString()}`
  })
 
  //await new Promise(r => setTimeout(r, 5000));
  return r

};
