const nodemailer = require('nodemailer');

// Configure email transporter (using environment variables for security)
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
    return res.status(405).send('Invalid request.');
  }

  try {
    const { name, email, message, subject } = req.body;

    if (!name || !email || !message) {
      return res.status(400).send('Missing required fields.');
    }

    const to = process.env.CONTACT_EMAIL || 'subinwhitecloud@gmail.com';
    const mailSubject = 'New Contact Form Submission';
    
    const mailBody = `Name: ${name}\nEmail: ${email}\n\nSubject: ${subject || 'N/A'}\n\nMessage:\n${message}`;

    const mailOptions = {
      from: email,
      to: to,
      replyTo: email,
      subject: mailSubject,
      text: mailBody
    };

    await transporter.sendMail(mailOptions);
    res.status(200).send('Submitted Successfully !');
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).send('Something went wrong!.');
  }
};

