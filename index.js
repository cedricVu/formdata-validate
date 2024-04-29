const formData = require('express-form-data');
const os = require('os');
const { PutObjectCommand } = require('@aws-sdk/client-s3');

const options = {
    uploadDir: os.tmpdir(),
    autoClean: true,
};

module.exports = function ({ validator, s3Storage }) {
    return [
        formData.parse(options),
        formData.format(options),
        formData.stream(options),
        formData.union(options),
        validator,
        function (req, res, next) {
            req.executeUpload = () => {
                if (req.body && req.body.files && req.body.files.length > 0) {
                    return Promise.all(
                        req.body.files.map(async (item) => {
                            const key = `${s3Storage.preKey}/${item.path.split('/').pop()}`;
                            await s3Storage.client.send(
                                new PutObjectCommand({
                                    Body: item,
                                    Bucket: s3Storage.bucket,
                                    Key: key,
                                    ACL: 'public-read',
                                    // ContentType: 'image/png',
                                })
                            );
                            return key;
                        })
                    );
                } else {
                    throw new Error('no files to upload');
                }
            };
            next();
        },
    ];
};
