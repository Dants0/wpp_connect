import dotenv from 'dotenv'
import axios from 'axios'

dotenv.config()

const token = process.env.WHATSAPP_TOKEN!;
const phoneNumberId = process.env.PHONE_NUMBER_ID!;

export async function sendWhatsappMessage(to: string, message: string) {
  const url = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`;

  const data = {
    messaging_product: "whatsapp",
    to,
    type: "text",
    text: {
      body: message
    }
  }

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": 'application/json'
  }

  const response = await axios.post(url, data, { headers })
  return response.data


}