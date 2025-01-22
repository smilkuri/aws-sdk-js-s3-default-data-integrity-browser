import { S3, PutObjectCommand } from "@aws-sdk/client-s3";
import { fromCognitoIdentityPool } from "@aws-sdk/credential-provider-cognito-identity";
import { CognitoIdentity } from "@aws-sdk/client-cognito-identity";

const getHTMLElement = (title, content) => {
  const element = document.createElement("div");
  element.style.margin = "30px";

  const titleDiv = document.createElement("div");
  titleDiv.innerHTML = title;
  const contentDiv = document.createElement("textarea");
  contentDiv.rows = 20;
  contentDiv.cols = 50;
  contentDiv.innerHTML = content;

  element.appendChild(titleDiv);
  element.appendChild(contentDiv);
  return element;
};

const component = async (filename = "test.txt", data = "bar", folder = "uploads") => {
  const region = import.meta.env.VITE_AWS_REGION;
  const client = new S3({
    region,
    credentials: fromCognitoIdentityPool({
      client: new CognitoIdentity({ region }),
      identityPoolId: import.meta.env.VITE_AWS_IDENTITY_POOL_ID,
    }),
  });
  const key = `${folder}/${filename}`;
  try {
    const command = new PutObjectCommand({
      Bucket: import.meta.env.VITE_AWS_S3_BUCKET_NAME,
      Key: key,
      Body: data,
      // ACL: 'public-read',
    });
    const response = await client.send(command);

    if (response.$metadata.httpStatusCode < 200 || response.$metadata.httpStatusCode > 299) {
      throw new Error(`HTTP Status ${response.$metadata.httpStatusCode}`);
    }

    return getHTMLElement(
      "Upload Success:", 
      JSON.stringify({ response, uploadedKey: key }, null, 2)
    );
  } catch (error) {
    console.error(`Error storing file at path ${key}: ${error}`);
    return getHTMLElement(
      "Upload Failed:", 
      JSON.stringify({ error: error.message, path: key }, null, 2)
    );
  }
};

(async () => {
  document.body.appendChild(await component("example.txt", "This is the file content", "my-folder"));
})();
