const fs = require('fs');
const path = require('path');

const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

function parseMultipartFormData(buffer, boundary) {
  const result = { fields: {}, file: null };
  const boundaryBuffer = Buffer.from(`--${boundary}`);
  const endBoundaryBuffer = Buffer.from(`--${boundary}--`);

  let startIndex = 0;
  while (startIndex < buffer.length) {
    const boundaryPos = buffer.indexOf(boundaryBuffer, startIndex);
    if (boundaryPos === -1) break;

    const nextBoundaryPos = buffer.indexOf(boundaryBuffer, boundaryPos + boundaryBuffer.length);
    if (nextBoundaryPos === -1) break;

    const partBuffer = buffer.subarray(boundaryPos + boundaryBuffer.length, nextBoundaryPos);
    const headerEndPos = partBuffer.indexOf(Buffer.from('\r\n\r\n'));
    if (headerEndPos === -1) {
      startIndex = nextBoundaryPos;
      continue;
    }

    const headerString = partBuffer.subarray(0, headerEndPos).toString('utf8');
    let bodyBuffer = partBuffer.subarray(headerEndPos + 4);

    // Strip trailing \r\n before next boundary
    if (bodyBuffer.length >= 2 && bodyBuffer[bodyBuffer.length - 2] === 13 && bodyBuffer[bodyBuffer.length - 1] === 10) {
      bodyBuffer = bodyBuffer.subarray(0, bodyBuffer.length - 2);
    }

    const nameMatch = headerString.match(/name="([^"]+)"/);
    const filenameMatch = headerString.match(/filename="([^"]+)"/);
    const contentTypeMatch = headerString.match(/Content-Type:\s*([^\r\n]+)/i);

    if (nameMatch) {
      const fieldName = nameMatch[1];
      if (filenameMatch) {
        const originalname = filenameMatch[1];
        if (originalname && originalname.trim().length > 0) {
          const ext = path.extname(originalname).toLowerCase();
          const ALLOWED_EXTS = ['.pdf', '.docx', '.doc', '.png', '.jpg', '.jpeg'];
          const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB limit

          if (!ALLOWED_EXTS.includes(ext)) {
            result.fileError = `Invalid file type "${ext}". Only PDF, DOCX, PNG, and JPG files are allowed.`;
            return result;
          }

          if (bodyBuffer.length > MAX_FILE_SIZE) {
            result.fileError = 'File size exceeds maximum allowed limit of 10MB.';
            return result;
          }

          const safeName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
          const filePath = path.join(uploadsDir, safeName);
          fs.writeFileSync(filePath, bodyBuffer);

          result.file = {
            fieldname: fieldName,
            originalname,
            filename: safeName,
            path: filePath,
            size: bodyBuffer.length,
            mimetype: contentTypeMatch ? contentTypeMatch[1].trim() : 'application/octet-stream'
          };
        }
      } else {
        result.fields[fieldName] = bodyBuffer.toString('utf8');
      }
    }

    startIndex = nextBoundaryPos;
  }

  return result;
}

// Upload middleware (single file)
function uploadSingle(fieldName = 'report_file') {
  return (req, res, next) => {
    if (req.isMultipart) {
      const boundaryMatch = req.headers['content-type']?.match(/boundary=([^;]+)/i);
      if (boundaryMatch && req.rawBodyBuffer) {
        const boundary = boundaryMatch[1].trim().replace(/^["']|["']$/g, '');
        const { fields, file, fileError } = parseMultipartFormData(req.rawBodyBuffer, boundary);
        if (fileError) {
          return res.status(400).json({ success: false, message: fileError });
        }
        req.body = { ...req.body, ...fields };
        req.file = file;
      }
    }
    next();
  };
}

module.exports = {
  single: uploadSingle,
  parseMultipartFormData
};
