import nodemailer from "nodemailer";

export const sendEmail = (to: string, html: string, subject: string) => {
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
    html,
    subject,
  };

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      throw new Error("Error in sending mail...");
    } else {
      console.log("Email sent");
    }
  });
};
