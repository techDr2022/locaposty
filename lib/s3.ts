import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || "";

/**
 * Uploads a file to S3 and returns the URL
 *
 * @param file The file to upload
 * @param folder Optional folder path within the bucket
 * @returns The URL of the uploaded file
 */
export async function uploadToS3(
  file: File,
  folder = "posts"
): Promise<string> {
  // Generate a unique filename
  const timestamp = Date.now();
  const fileExtension = file.name.split(".").pop() || "";
  const sanitizedFileName = file.name
    .split(".")[0]
    .replace(/[^a-zA-Z0-9]/g, "-")
    .toLowerCase();
  const fileName = `${folder}/${sanitizedFileName}-${timestamp}.${fileExtension}`;

  // Convert file to buffer
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Upload to S3
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: fileName,
    Body: buffer,
    ContentType: file.type,
    ACL: "public-read", // Make the file publicly accessible
  });

  await s3Client.send(command);

  // Return the URL of the uploaded file
  return `https://${BUCKET_NAME}.s3.amazonaws.com/${fileName}`;
}

/**
 * Extracts filename from S3 URL
 *
 * @param url S3 URL
 * @returns Filename
 */
export function getFileNameFromS3Url(url: string): string {
  const urlObj = new URL(url);
  const pathname = urlObj.pathname;
  return pathname.split("/").pop() || "";
}

/**
 * Creates a presigned URL for direct browser uploads to S3
 *
 * @param fileName Destination filename in S3
 * @param contentType MIME type of the file
 * @param folder Optional folder path within the bucket
 * @returns Presigned URL and the final S3 URL of the file
 */
export async function getPresignedUrl(
  fileName: string,
  contentType: string,
  folder = "posts"
): Promise<{
  presignedUrl: string;
  fileUrl: string;
}> {
  // Generate a unique filename
  const timestamp = Date.now();
  const fileExtension = fileName.split(".").pop() || "";
  const sanitizedFileName = fileName
    .split(".")[0]
    .replace(/[^a-zA-Z0-9]/g, "-")
    .toLowerCase();
  const key = `${folder}/${sanitizedFileName}-${timestamp}.${fileExtension}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ContentType: contentType,
    ACL: "public-read",
  });

  // Generate the presigned URL
  const signedUrl = await s3Client.send(command);

  return {
    presignedUrl: signedUrl.toString(),
    fileUrl: `https://${BUCKET_NAME}.s3.amazonaws.com/${key}`,
  };
}
