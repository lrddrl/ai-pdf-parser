// app/page.tsx
import { cookies } from 'next/headers';
import { Chat } from '@/components/chat';
import { DEFAULT_CHAT_MODEL } from '@/lib/ai/models';
import { generateUUID } from '@/lib/utils';
import { DataStreamHandler } from '@/components/data-stream-handler';

export default async function Page() {
  const id = generateUUID();

  const cookieStore = await cookies();
  const modelIdFromCookie = cookieStore.get('chat-model');

  const chatModel = modelIdFromCookie
    ? modelIdFromCookie.value
    : DEFAULT_CHAT_MODEL;

  return (
    <>
      <Chat
        key={id}
        id={id}
        initialMessages={[]}
        selectedChatModel={chatModel}
        selectedVisibilityType="private"
        isReadonly={false}
      />
      <DataStreamHandler id={id} />

  
    </>
  );
}
