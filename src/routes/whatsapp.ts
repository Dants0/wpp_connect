import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import * as httpResponse from "http-status-codes"
import { sendWhatsappMessage } from '../services/metaApi';
import * as qrcode from "qrcode-terminal";
import { client } from "../services/whatsappClient";


export async function wppRoutes(app: FastifyInstance) {


  app.get("/", async (req: FastifyRequest, reply: FastifyReply) => {
    reply.status(httpResponse.StatusCodes.OK).send({
      code: httpResponse.StatusCodes.OK,
      message: "Server is online",
    })
  })

  app.post("/message", async (req: FastifyRequest, reply: FastifyReply) => {



  })


  app.post("/send", async (req: FastifyRequest, reply: FastifyReply) => {
    const { to, message } = req.body as { to: string, message: string }

    try {

      const result = await sendWhatsappMessage(to, message)
      reply.status(httpResponse.StatusCodes.OK).send({
        success: true,
        data: result
      })
    } catch (err) {
      reply.status(httpResponse.StatusCodes.INTERNAL_SERVER_ERROR).send({
        success: false,
        error: err
      })
    }
  })

  app.get("/webhook", async (req: FastifyRequest, reply: FastifyReply) => {
    const { ['hub.mode']: mode, ['hub.verify_token']: token, ['hub.challenge']: challenge } = req.query as any;

    if (mode === 'subscribe' && token === process.env.VERIFY_TOKEN) {
      reply.status(200).send(challenge);
    } else {
      reply.status(403).send('Forbidden');
    }
  })

  app.post('/webhook', async (req: FastifyRequest, reply: FastifyReply) => {
    const body = req.body as any;

    console.log('Webhook recebido:', JSON.stringify(body, null, 2));

    try {
      const message = body.entry[0].changes[0].value.messages?.[0];
      const from = message.from;
      const text = message.text?.body;

      console.log(`Mensagem recebida de ${from}: ${text}`);
    } catch (e) {
      console.log('Evento não é mensagem');
    }

    reply.status(httpResponse.StatusCodes.OK).send('EVENT_RECEIVED');
  });
}
