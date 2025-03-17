import {
  type Message,
  createDataStreamResponse,
  smoothStream,
  streamText,
} from 'ai';

import { auth } from '@/app/(auth)/auth';
import { myProvider } from '@/lib/ai/models';
import { invoiceExtractionPrompt, systemPrompt } from '@/lib/ai/prompts';
import {
  deleteChatById,
  getChatById,
  saveChat,
  saveMessages, 
  saveInvoice,
} from '@/lib/db/queries';
import {
  generateUUID,
  getMostRecentUserMessage,
  sanitizeResponseMessages,
} from '@/lib/utils';
import { db } from '@/lib/db';
import { invoice } from '@/lib/db/schema';
import { generateTitleFromUserMessage } from '../../actions';
import { createDocument } from '@/lib/ai/tools/create-document';
import { updateDocument } from '@/lib/ai/tools/update-document';
import { requestSuggestions } from '@/lib/ai/tools/request-suggestions';
import { getWeather } from '@/lib/ai/tools/get-weather';
import { getEncoding } from 'js-tiktoken';

export const maxDuration = 60;

const modelMapping: Record<string, string> = {
  'chat-model-large': 'cl100k_base',
  'chat-model-small': 'gpt2',
  'chat-model-reasoning': 'cl100k_base',
  'title-model': 'gpt2',
  'block-model': 'gpt2',
};

type TiktokenEncoding = any;
type Tiktoken = any;


function countTokens(text: string, modelKey: string = 'chat-model-large'): number {
  const modelName = modelMapping[modelKey];
  if (!modelName) {
    throw new Error(`no support model: ${modelKey}`);
  }
  const encoder = getEncoding(modelName as TiktokenEncoding) as Tiktoken;
  const tokens = encoder.encode(text);
  if (typeof (encoder as any).free === 'function') {
    (encoder as any).free();
  }
  return tokens.length;
}

export async function POST(request: Request) {
  const { id, messages, selectedChatModel } = await request.json();

  const session = await auth();
  if (!session || !session.user || !session.user.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  const userMessage = getMostRecentUserMessage(messages);
  if (!userMessage) {
    return new Response('No user message found', { status: 400 });
  }

  // Retrieve or create a chat record
  const chat = await getChatById({ id });
  if (!chat) {
    const title = await generateTitleFromUserMessage({ message: userMessage });
    await saveChat({ id, userId: session.user.id, title });
  }

  // Save the most recent user message
  await saveMessages({
    messages: [{ ...userMessage, createdAt: new Date(), chatId: id }],
  });

  // Remove PDF attachments from messages and append extracted text to the message content
  // @ts-ignore
  messages.forEach((message) => {
    if (message.experimental_attachments) {
      // Collect extracted text from all PDF attachments
      const pdfExtractedTexts = message.experimental_attachments
        .filter((attachment: any) => attachment.contentType === 'application/pdf')
        .map((attachment: any) => attachment.extractedText)
        .join('\n');

      // If there's PDF text, append it to the message content
      if (pdfExtractedTexts) {
        message.content += `\n\n[PDF EXTRACTED TEXT]:\n${pdfExtractedTexts}`;
      }

      // Remove PDF attachments, keep others (e.g., images)
      message.experimental_attachments = message.experimental_attachments.filter(
        (attachment: any) => attachment.contentType !== 'application/pdf'
      );
    }
  });

  console.log('messages', messages);

  // Gather all PDF extracted text into invoiceText
  let invoiceText = '';
  messages.forEach((message) => {
    if (message.content.includes('[PDF EXTRACTED TEXT]')) {
      const parts = message.content.split('[PDF EXTRACTED TEXT]:');
      if (parts.length > 1) {
        invoiceText += parts[1].trim() + '\n';
      }
    }
  });

  // Fetch existing invoices from DB for duplicate checks
  const existingInvoices = await db.select().from(invoice).all();

  // Decide which system prompt to use (with or without invoice extraction)
  const systemMessage = invoiceText
    ? invoiceExtractionPrompt(invoiceText, existingInvoices)
    : systemPrompt({ selectedChatModel });

  console.log('systemMessage:', systemMessage);

  // 3) Count input tokens (system + user messages)
  const userContents = messages.map((m) => m.content).join('\n');
  const inputText = systemMessage + '\n' + userContents;
  const inputTokens = countTokens(inputText, selectedChatModel);
  const inputCostPerToken = 0.00002; // Example cost rate
  const inputCost = inputTokens * inputCostPerToken;
  console.log('Input tokens:', inputTokens, 'Input cost:', inputCost);

  const DEBUG_MODE = false; // Turn this on if you want to debug without calling the LLM

  if (DEBUG_MODE) {
    return new Response(
      JSON.stringify({
        debug: true,
        uiMessages: messages,
        inputTokens,
        inputCost,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }

  return createDataStreamResponse({
    execute: (dataStream) => {
      const result = streamText({
        model: myProvider.languageModel(selectedChatModel),
        system: systemMessage,
        messages,
        maxSteps: 5,
        experimental_activeTools:
          selectedChatModel === 'chat-model-reasoning'
            ? []
            : [
                'getWeather',
                'createDocument',
                'updateDocument',
                'requestSuggestions',
              ],
        experimental_transform: smoothStream({ chunking: 'word' }),
        experimental_generateMessageId: generateUUID,
        tools: {
          getWeather,
          createDocument: createDocument({ session, dataStream }),
          updateDocument: updateDocument({ session, dataStream }),
          requestSuggestions: requestSuggestions({ session, dataStream }),
        },
        onFinish: async ({ response, reasoning }) => {
          const assistantMessage = response.messages[0];
          const contentText = assistantMessage.content[0].text;

          // 4) Count output tokens (assistant response)
          const outputTokens = countTokens(contentText, selectedChatModel);
          const outputCost = outputTokens * inputCostPerToken;
          console.log('Output tokens:', outputTokens, 'Output cost:', outputCost);

          // Total cost for this invoice process
          const totalCost = inputCost + outputCost;
          console.log('Total cost for this invoice process:', totalCost);

          // Attempt to extract JSON block from the assistant's response
          const jsonRegex = /```json\s*([\s\S]*?)\s*```/;
          const match = jsonRegex.exec(contentText);
          if (match && match[1]) {
            const jsonStr = match[1];
            try {
              const invoiceDataParsed = JSON.parse(jsonStr);
              console.log('Parsed invoice data:', invoiceDataParsed);

              // If isDuplicate is true, do not save it
              if (invoiceDataParsed.isDuplicate) {
                console.error('Duplicate invoice, not saved:', invoiceDataParsed);
              } else {
                const invoiceToSave = {
                  id: generateUUID(),
                  customer_name: invoiceDataParsed.customer_name,
                  vendor_name: invoiceDataParsed.vendor_name,
                  invoice_number: invoiceDataParsed.invoice_number,
                  invoice_date: invoiceDataParsed.invoice_date,
                  due_date: invoiceDataParsed.due_date,
                  amount: invoiceDataParsed.amount,
                  line_items: invoiceDataParsed.line_items,
                };

                try {
                  await saveInvoice(invoiceToSave);
                  console.log('Invoice saved:', invoiceToSave);
                } catch (error: any) {
                  console.error('Failed to save invoice:', error);
                }
              }
            } catch (error) {
              console.error('JSON parse error:', error);
            }
          } else {
            console.error('No JSON block found in assistant response');
          }

          // Save the conversation messages
          if (session.user?.id) {
            try {
              const sanitizedResponseMessages = sanitizeResponseMessages({
                messages: response.messages,
                reasoning,
              });
              await saveMessages({
                messages: sanitizedResponseMessages.map((message) => {
                  return {
                    id: message.id,
                    chatId: id,
                    role: message.role,
                    content: message.content,
                    createdAt: new Date(),
                  };
                }),
              });
            } catch (error) {
              console.error('Failed to save chat messages:', error);
            }
          }
        },
        experimental_telemetry: {
          isEnabled: true,
          functionId: 'stream-text',
        },
      });

      result.mergeIntoDataStream(dataStream, {
        sendReasoning: true,
      });
    },
    onError: (error: any) => {
      console.error('Chat error:', error);
      return 'Oops, an error occurred!';
    },
  });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) {
    return new Response('Not Found', { status: 404 });
  }
  const session = await auth();
  if (!session || !session.user) {
    return new Response('Unauthorized', { status: 401 });
  }
  try {
    const chat = await getChatById({ id });
    await deleteChatById({ id });
    return new Response('Chat deleted', { status: 200 });
  } catch (error) {
    return new Response('An error occurred while processing your request', {
      status: 500,
    });
  }
}
