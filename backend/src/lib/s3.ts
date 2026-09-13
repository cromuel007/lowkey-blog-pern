import { S3Client } from "@aws-sdk/client-s3";

export const s3 = new S3Client({
  region: process.env.SUPABASE_S3_REGION,
  endpoint: process.env.SUPABASE_S3_ENDPOINT,
  credentials: {
    accessKeyId: process.env.SUPABASE_S3_ACCESS_KEY_ID!,
    secretAccessKey: process.env.SUPABASE_S3_SECRET_ACCESS_KEY!,
  },
  forcePathStyle: true,
});

export const STORAGE_BUCKET =
  process.env.SUPABASE_STORAGE_BUCKET || "blog";