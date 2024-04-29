# Welcome vapper-formdata
### What do you often do when creating an api to create an entity with upload a file?
- Call an upload api first? grab the file url? submit it along with the post entity api? If so this package is not for you :D
- Create a formdata api to allow submitting files and data at a time then this package is for you. However, that always upload file even the sending data is not valid. One normal way is removing the file whenever the api got something wrong that cannot create the entity.
### This package will help you validate the data, all logics first to make sure they are all fine to start uploading file.
Please note that the package now only support s3Storage which will stream files directly to s3 or digitalocean spaces.

# Usage - example in express

```
const vapperFormdata = require('vapper-formdata');
const { Joi: joi, celebrate } = require('celebrate'); // Using joi to validate data from client

// Define storage
const s3Storage = {
    bucket: 'bucket-name',
    preKey: 'production/creator-videos', // The preKey will be attach right before file name before sending to s3
    client: new S3Client({
        region: 'spg1',
        endpoint: 'https://sgp1.digitaloceanspaces.com',
        credentials: {
            secretAccessKey: process.env.DO_SECRET_ACCESS_KEY,
            accessKeyId: process.env.DO_ACCESS_KEY_ID,
        },
    }),
};

// Create your validator
const creatorCreationValidator = celebrate({
  body: joi()
  .object()
  .keys({
    nickName: this.Joi().string().trim().max(100).required(),
    fullName: this.Joi().string().trim().max(100).required(),
    files: this.Joi()
      .array()
      .max(20)
      .custom((value, helper) => {
        value.map((item) => {
          const fileMime = mime.lookup(item.path);
          if (!FILE_MIMES.includes(fileMime)) {
            throw new Error(`Invalid file mimetype ${FILE_MIMES}`);
          }
          const { size } = fs.statSync(item.path);
          if (size > MAX_FILE_SIZE) {
            throw new Error(`Max file size is ${MAX_FILE_SIZE}`);
          }
        });
        return value;
      })
      .required(),
      }),
});

// Start router
router.route('/creators/create').post(
  vapperFormdata({
    s3Storage,
    validator: creatorCreationValidator,
  }),
  createCreatorController
);

// Start your controller

function createCreatorController(req, res, next) {
  try {
    // Check any logics before create the creator to db
    // ...
    // Call upload task to upload file to s3
    const uploadResponse = await req.executeUpload();
    // ['production/creator-videos/file-name.jpg', 'production/creator-videos/file-name-2.mp4']
  } catch(err) {
    
  }
}

```

