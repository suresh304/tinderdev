
const {transporter} = require('../configs/nodemail_config.js')


 const sendMail = async(info)=>{
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

module.exports = {sendMail}