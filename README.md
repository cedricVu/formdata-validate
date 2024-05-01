# Welcome vapper-formdata - validate all data before uploading file using formdata
### What do you often do when creating an api to create an entity with upload a file?
- Call an upload api first? grab the file url? submit it along with the post entity api? If so this package is not for you :D
- Create a formdata api to allow submitting files and data at a time then this package is for you. However, that always upload file even the sending data is not valid. One normal way is removing the file whenever the api got something wrong that cannot create the entity.
### This package will help you validate the data, all logics first to make sure they are all fine to start uploading file.
Please note that the package now only support for digitalocean spaces.
Feel free to upgrade this package to have more types of storage, ex: localStorage, awsS3Storage...
# Usage - example in express

```
const express = require('express');
const fs = require('fs');
const vapperFormdata = require('vapper-formdata');
const mime = require('mime-types');
const { Joi: joi, celebrate } = require('celebrate'); // Using joi to validate data from client

const app = express();

// Define storage
const doS3Config = {
    bucket: 'bucket-name',
    preKey: 'production/creator-videos', // The preKey will be attached right before file name before sending to s3
    region: 'sgp1',
    credentials: {
        secretAccessKey: process.env.DO_SECRET_ACCESS_KEY,
        accessKeyId: process.env.DO_ACCESS_KEY_ID,
    },
};
// Define your validator
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10Mb
const FILE_MIMES = ['image/jpeg'];
const creatorCreationValidator = celebrate({
    body: joi.object().keys({
        nickName: joi.string().trim().max(100).required(),
        files: joi
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
app.route('/creators/create').post(
    vapperFormdata({
        doS3Config,
        validator: creatorCreationValidator,
    }),
    async function (req, res, next) {
        try {
            // Check any logics before creating the creator to db
            // ...
            // Call upload task to upload file to s3
            const uploadResponse = await req.executeUpload();
            console.log({ uploadResponse });
            return res.json(uploadResponse);
            // ['production/creator-videos/file-name.jpg', 'production/creator-videos/file-name-2.mp4']
        } catch (err) {
            console.log(err);
        }
    }
);

```

