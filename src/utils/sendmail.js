import  {transporter}  from "../configs/nodemail_config.js";


export const sendMail = async(info)=>{
    const {from,to,subject,text,html} = info
   
const res = await transporter.sendMail(
    {
    from: "sureshallie@gmail.com",
    to: "allisureshchinna@gmail.com",
    subject: subject,
    text: text, // plain‑text body
    html: html, // HTML body
  }
)

console.log('this is mail res',res);



}