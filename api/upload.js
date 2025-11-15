const nodemailer = require('nodemailer');

// Configure email transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Invalid request' });
  }

  try {
    // For Vercel serverless, the body might come as base64 or buffer
    let body = req.body;
    
    // Handle base64 encoded body
    if (typeof body === 'string' && !body.includes('--')) {
      body = Buffer.from(body, 'base64').toString();
    }
    
    // Get boundary from content-type header
    const contentType = req.headers['content-type'] || '';
    const boundaryMatch = contentType.match(/boundary=([^;]+)/);
    
    if (!boundaryMatch) {
      return res.status(400).json({ success: false, error: 'Invalid content type' });
    }
    
    const boundary = boundaryMatch[1];
    const parts = body.split(`--${boundary}`);
    
    let fname = '', lname = '', email = '', mobile = '', message = '';
    let fileContent = null;
    let fileName = '';

    for (const part of parts) {
      if (!part.trim() || part.trim() === '--') continue;
      
      const headerEnd = part.indexOf('\r\n\r\n');
      if (headerEnd === -1) continue;
      
      const headers = part.substring(0, headerEnd);
      const content = part.substring(headerEnd + 4).replace(/\r\n--$/, '');
      
      if (headers.includes('Content-Disposition')) {
        if (headers.includes('name="fname"')) {
          fname = content.trim();
        } else if (headers.includes('name="lname"')) {
          lname = content.trim();
        } else if (headers.includes('name="email"')) {
          email = content.trim();
        } else if (headers.includes('name="mobile"')) {
          mobile = content.trim();
        } else if (headers.includes('name="message"')) {
          message = content.trim();
        } else if (headers.includes('name="file"')) {
          const filenameMatch = headers.match(/filename="([^"]+)"/);
          if (filenameMatch) {
            fileName = filenameMatch[1];
          }
          // File content - keep as buffer
          fileContent = Buffer.from(content, 'binary');
        }
      }
    }

    if (!fileContent || !fileName) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    const recipient = process.env.CAREER_EMAIL || 'subinwhitecloud@gmail.com';
    const subject = `New Job Application - ${fname} ${lname}`;

    const htmlMessage = `
      <p><strong>Name:</strong> ${fname} ${lname}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Mobile:</strong> ${mobile}</p>
      <p><strong>About:</strong> ${message}</p>
      <p><strong>Resume:</strong> Attached</p>
    `;

    const mailOptions = {
      from: process.env.SMTP_FROM || 'info@wisbato.com',
      to: recipient,
      subject: subject,
      html: htmlMessage,
      attachments: [
        {
          filename: fileName,
          content: fileContent
        }
      ]
    };

    await transporter.sendMail(mailOptions);
    res.status(200).json({ success: true, fileName: fileName });
  } catch (error) {
    console.error('Error processing upload:', error);
    res.status(500).json({ success: false, error: 'File upload failed: ' + error.message });
  }
};
