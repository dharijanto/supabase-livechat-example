// import { Message, ChatData } from "@/app/data";
import ChatTopbar from "./chat-topbar";
import { ChatList } from "./chat-list";
import React from "react";
import { Message, User } from "@/lib/supabase";

interface ChatProps {
  messages: Message[];
  currentUser: User;
  isMobile: boolean;
  onSendMessage: (newMessage: string) => void;
}

export function Chat({ messages, onSendMessage, currentUser, isMobile }: ChatProps) {
  return (
    <div className="flex flex-col justify-between w-full h-full">
      {/* <ChatTopbar currentUser={currentUser} /> */}

      <ChatList
        messages={messages}
        currentUser={currentUser}
        sendMessage={onSendMessage}
        isMobile={isMobile}
      />
    </div>
  );
}
