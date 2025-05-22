const multer = require('multer');
const path = require('path');

const uploadFile = multer.diskStorage({});

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname);
  if (ext !== '.jpg' && ext !== '.jpeg' && ext !== '.png') {
    cb(new Error('File not supported'), false);
    return;
  }
  cb(null, true);
};

const Upload = (req, res, next) => {
  const upload = multer({
    storage: uploadFile,
    fileFilter,
  }).single('image');

  upload(req, res, (err) => {
    if (err) {
      res.status(500).send(`Unknown error: ${err.message}`);
    } else {
      next();
    }
  });
};


module.exports = Upload;