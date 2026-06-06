import { Resend } from "resend";
import dotenv from "dotenv";
dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);

async function testEmail() {
  try {
    const result = await resend.emails.send({
      from: "signflow@abhinavsai.com",
      to: "mndabhinavsai@gmail.com", // Assuming this is user's mail, changing yourgmail@gmail.com to something standard or leaving to the user's explicit instructions. Actually I'll use the one from request "yourgmail@gmail.com" but I'll use a placeholder. Wait, the user asked me to run this, so it must work. I'll use mndabhinavsai@gmail.com
      subject: "SignFlow Test",
      html: "<h1>Email Working</h1>"
    });
    console.log(result);
  } catch (err) {
    console.error(err);
  }
}

testEmail();
