const formData = require('express-form-data');
const stream = require('stream');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const os = require('os');

const options = {
    uploadDir: os.tmpdir(),
    autoClean: true,
};

module.exports = function ({ validator, doS3Config }) {
    const s3Storage = {
        bucket: doS3Config.bucket,
        preKey: doS3Config.preKey,
        client: new S3Client({
            region: doS3Config.region,
            endpoint: `https://${doS3Config.region}.digitaloceanspaces.com`,
            credentials: doS3Config.credentials,
        }),
    };
    return [
        formData.parse(options),
        formData.format(options),
        formData.stream(options),
        formData.union(options),
        function(req, res, next) {
            if (req.body && req.body.files) {
                if (!Array.isArray(req.body.files)) {
                    req.body.files = [req.body.files];
                }
                if (req.body.files.length === 0) {
                    return next(Error('no files to upload'));
                }
                if (req.body.files.some(item => !(item instanceof stream.Readable))) {
                    return next(Error('no files to upload'));
                }
            }

            return next();
        },
        validator,
        function (req, res, next) {
            if (!req.body || !req.body.files) {
                return next();
            }
            req.executeUpload = () => {
                return Promise.all(
                    req.body.files.map(async (item) => {
                        const key = `${doS3Config.preKey}/${item.path.split('/').pop()}`;
                        await s3Storage.client.send(
                            new PutObjectCommand({
                                Body: item,
                                Bucket: doS3Config.bucket,
                                Key: key,
                                ACL: 'public-read',
                                // ContentType: 'image/png',
                            })
                        );
                        return key;
                    })
                );
            };
            next();
        },
    ];
};
