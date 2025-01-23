import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { CognitoIdentityClient } from "@aws-sdk/client-cognito-identity";
import { fromCognitoIdentityPool } from "@aws-sdk/credential-provider-cognito-identity";

const store = async (filename, data, folder) => {
  const region = import.meta.env.VITE_AWS_REGION;
  const client = new S3Client({
    region,
    credentials: fromCognitoIdentityPool({
      client: new CognitoIdentityClient({ region }),
      identityPoolId: import.meta.env.VITE_AWS_IDENTITY_POOL_ID,
    }),
  });

  const key = `${folder}/${filename}`;

  try {
    // Converting data to ArrayBuffer
    const fileBuffer = await data.arrayBuffer();

    const command = new PutObjectCommand({
      Bucket: import.meta.env.VITE_AWS_BUCKET_NAME,
      Key: key,
      Body: new Uint8Array(fileBuffer),
      ContentType: data.type,
      //ACL: 'public-read'
    });

    const response = await client.send(command);
    return {
      success: true,
      content: JSON.stringify({ response, uploadedKey: key }, null, 2)
    };
  } catch (error) {
    console.error('Upload failed:', error);
    return {
      success: false,
      content: JSON.stringify({ error: error.message, path: key }, null, 2)
    };
  }
};

const setupFileUpload = () => {
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  
  const uploadButton = document.createElement('button');
  uploadButton.textContent = 'Upload';
  uploadButton.disabled = true;
  
  const status = document.createElement('pre');
  
  document.body.appendChild(fileInput);
  document.body.appendChild(uploadButton);
  document.body.appendChild(status);

  fileInput.addEventListener('change', () => {
    uploadButton.disabled = !fileInput.files?.length;
  });

  uploadButton.addEventListener('click', async () => {
    const file = fileInput.files?.[0];
    if (!file) return;

    status.textContent = 'Uploading...';
    uploadButton.disabled = true;

    try {
      const result = await store(file.name, file, 'uploads');
      status.textContent = result.success ? 
        `Upload successful!\n${result.content}` : 
        `Upload failed:\n${result.content}`;
    } catch (error) {
      status.textContent = JSON.stringify({ 
        error: error.message, 
        path: `uploads/${file.name}` 
      }, null, 2);
    } finally {
      uploadButton.disabled = false;
    }
  });
};

setupFileUpload();
