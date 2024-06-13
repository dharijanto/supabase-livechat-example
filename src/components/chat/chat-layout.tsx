"use client";

// import { chatData } from "@/app/data";
import React, { useEffect, useState } from "react";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { cn } from "@/lib/utils";
import { Sidebar } from "../sidebar";
import { Chat } from "./chat";
import supabase, { Chat as ChatModel, Message, User } from "../../lib/supabase"
import { toast } from "../ui/use-toast";

interface ChatLayoutProps {
  defaultLayout: number[] | undefined;
  defaultCollapsed?: boolean;
  navCollapsedSize: number;
  currentUser: User
}

export function ChatLayout({
  defaultLayout = [320, 480],
  defaultCollapsed = false,
  currentUser,
  navCollapsedSize,
}: ChatLayoutProps) {
  const [chats, setChats] = useState<ChatModel[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isCollapsed, setIsCollapsed] = React.useState(defaultCollapsed);
  const [selectedChat, setSelectedChat] = React.useState<ChatModel>();
  const [isMobile, setIsMobile] = useState(false);

  const onNewRealtimeChat = (chat: ChatModel) => {
    console.log('onNewRealtimeChat(): chat=', chat)
    setChats((prev) => [...prev, chat])
  }

  const onNewRealtimeMessage = (msg: Message) => {
    console.log(`onNewRealtimeMessage(): selectedChat.id=${selectedChat?.id || ""} msg=${msg}`)
    if (msg.chatId === selectedChat?.id) {
      setMessages((prev) => [...prev, msg])
    }
  }

  const onChatSelected = (chatId: string) => {
    console.log('onChatSelected(): chatId=', chatId)
    const val = chats.find((chat) => chat.id === chatId)
    if (val) {
      setSelectedChat(val)
    }

    supabase.getMessages(chatId).then((messages) => {
      console.log(`getMessages(): messages=${JSON.stringify(messages)}`)
      setMessages(messages)
    })
  }

  const onSendMessage = (message: string) => {
    console.log('onSendMessage(): message=', message)
    if (selectedChat) {
      supabase.postMessage(selectedChat?.id, currentUser.id, message).then(() => {
        console.log("Message sent successfully")
      }).catch((error) => {
        console.error("Failed to send message: " + error)
        toast({
          title: "Error sending message",
          description: error.message,
        })
      })
    } 
  }

  useEffect(() => {
    console.log('currentUser=', currentUser)
    const checkScreenWidth = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    supabase.getChats().then((chats) => {
      setChats(chats)
      supabase.subscribeToChat(onNewRealtimeChat)
    })

    // Initial check
    checkScreenWidth();

    // Event listener for screen width changes
    window.addEventListener("resize", checkScreenWidth);

    // Cleanup the event listener on component unmount
    return () => {
      window.removeEventListener("resize", checkScreenWidth);
    };

  }, []);

  useEffect(() => {
    if (selectedChat) {
      supabase.subscribeToMessages(onNewRealtimeMessage)
    }
  }, [selectedChat])

  return (
    <ResizablePanelGroup
      direction="horizontal"
      onLayout={(sizes: number[]) => {
        document.cookie = `react-resizable-panels:layout=${JSON.stringify(
          sizes
        )}`;
      }}
      className="h-full items-stretch"
    >
      <ResizablePanel
        defaultSize={defaultLayout[0]}
        collapsedSize={navCollapsedSize}
        collapsible={true}
        minSize={isMobile ? 0 : 24}
        maxSize={isMobile ? 8 : 30}
        onCollapse={() => {
          setIsCollapsed(true);
          document.cookie = `react-resizable-panels:collapsed=${JSON.stringify(
            true
          )}`;
        }}
        onExpand={() => {
          setIsCollapsed(false);
          document.cookie = `react-resizable-panels:collapsed=${JSON.stringify(
            false
          )}`;
        }}
        className={cn(
          isCollapsed && "min-w-[50px] md:min-w-[70px] transition-all duration-300 ease-in-out"
        )}
      >
        <Sidebar
          isCollapsed={isCollapsed || isMobile}
          currentUser={currentUser}
          chats={chats}
          isMobile={isMobile}
          selectedChat={selectedChat}
          onClick={onChatSelected}
        />
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={defaultLayout[1]} minSize={30}>
        {selectedChat ? 
          <Chat
            onSendMessage={onSendMessage}
            messages={messages}
            currentUser={currentUser}
            isMobile={isMobile}
          /> :
          <div className="w-full h-full text-center">
            <p className="text-lg text-gray-500 p-10 mx-auto my-auto">Select a chat to start messaging</p>
          </div>
        }
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
