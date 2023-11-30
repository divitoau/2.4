const {
  S3Client,
  ListObjectsV2Command,
  PutObjectCommand,
  GetObjectCommand,
} = require("@aws-sdk/client-s3");
const fileUpload = require("express-fileupload");
const fs = require("fs-extra");
const express = require("express");
const app = express();

app.use(fileUpload());

const bucketName = "my-cool-local-bucket";

const s3Client = new S3Client({
  region: "us-east-1",
  endpoint: "http://localhost:4566",
  forcePathStyle: true,
});

app.get("/images", (req, res) => {
  const listObjectsParams = {
    Bucket: bucketName,
  };
  s3Client
    .send(new ListObjectsV2Command(listObjectsParams))
    .then((listObjectsResponse) => {
      res.send(listObjectsResponse.Contents);
    });
});

app.get("/images/:imageName", (req, res) => {
  fs.emptyDir("downloads");
  const file = req.params.imageName;
  const downloadPath = `downloads/${file}`;
  const getObjectParams = {
    Bucket: bucketName,
    Key: file,
  };
  s3Client
    .send(new GetObjectCommand(getObjectParams))
    .then((getObjectResponse) => {
      getObjectResponse.Body.pipe(fs.createWriteStream(downloadPath));
    });
  res.sendFile(__dirname + "/" + downloadPath);
});

app.post("/images", (req, res) => {
  fs.emptyDir("uploads");
  const file = req.files.image;
  const tempPath = `uploads/${file.name}`;
  file.mv(tempPath, (err) => {
    res.status(500);
  });
  const putObjectsParams = {
    Body: file.data,
    Bucket: bucketName,
    Key: file.name,
  };
  s3Client.send(new PutObjectCommand(putObjectsParams)).then(
    (putObjectsResponse) => {
      res.send(putObjectsResponse);
    },
    () => {
      res.status(500);
    }
  );
});

const port = process.env.PORT || 8080;
app.listen(port, "0.0.0.0", () => {
  console.log("Listening on Port " + port);
});
