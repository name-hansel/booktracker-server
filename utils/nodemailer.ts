import nodemailer from "nodemailer";

export const sendEmail = (to: string, hash: string) => {
  const transporter = nodemailer.createTransport({
    host: "smtp-mail.outlook.com",
    port: 587,
    secure: false,
    requireTLS: true,
    auth: {
      user: "hansel-name@outlook.com",
      pass: process.env.EMAILPASSWORD,
    },
  });

  let mailOptions = {
    from: '"Booktracker " <hansel-name@outlook.com>',
    to,
    html: `
    <p>Click on the link given below to verify your account</p>
    <a href='http://localhost:5000/auth/verify/${hash}'>Verify account</a>
    `,
    subject: "Booktracker Account Validation",
  };

  let result: string = "";

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      throw new Error("Error in sending mail...");
    } else {
      console.log("Email sent");
    }
  });

  return result;
};
