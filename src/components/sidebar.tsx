"use client";

import Link from "next/link";
import { MoreHorizontal, SquarePen } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { Avatar, AvatarImage } from "./ui/avatar";
import supabase, { Chat, User } from "@/lib/supabase";
import { toast } from "./ui/use-toast";

interface SidebarProps {
  isCollapsed: boolean;
  chats: Chat[];
  onClick: (chatId: string) => void;
  selectedChat?: Chat
  currentUser: User
  isMobile: boolean;
}

export function Sidebar({ chats, currentUser, isCollapsed, selectedChat, onClick }: SidebarProps) {
  // TODO: Add UI effect
  const onNewChatButtonClicked = () => {
    const title = prompt("Enter a title for a new chat room: ")
    if (title) {
      supabase.newChat(title).then(() => {
        console.log("Chat created successfully")
      }).catch((error) => {
        console.error("onNewChatButtonClicked(): Failed to create chat: " + error)
        toast({
          title: "Error creating new chat",
          description: error.message,
        })
      })
    } else {
      console.error("onNewChatButtonClicked(): Title can't be empty!")
      toast({
        title: "Error creating new chat",
        description: "Title can't be empty!",
      })

    }
  }
  return (
    <div
      data-collapsed={isCollapsed}
      className="relative group flex flex-col h-full gap-4 p-2 data-[collapsed=true]:p-2 "
    >
      {!isCollapsed && (
        <div>
          <p className="p-2">Welcome, {currentUser.username}</p>
          <p className="p-2"> {currentUser.id}</p>
          <div className="flex justify-between p-2 items-center">
            <div className="flex gap-2 items-center text-2xl">
              
              <p className="font-medium">Chats</p>
              <span className="text-zinc-300">({chats.length})</span>
            </div>

            <div>

              <Link
                href="#"
                className={cn(
                  buttonVariants({ variant: "ghost", size: "icon" }),
                  "h-9 w-9"
                )}
                onClick={() => {
                  onNewChatButtonClicked()
                }}
              >
                <SquarePen size={20} />
              </Link>
            </div>
          </div>
        </div>
      )}
      <nav className="grid gap-1 px-2 group-[[data-collapsed=true]]:justify-center group-[[data-collapsed=true]]:px-2">
        {chats.map((chat, index) =>
          (
            <Link
              key={index}
              href="#"
              className={cn(
                buttonVariants({ variant: chat.id === selectedChat?.id ? "grey" : "ghost", size: "xl" }),
                chat.id === selectedChat?.id ? "dark:bg-muted dark:text-white dark:hover:bg-muted dark:hover:text-white shrink" : "",
                "ghost",
                "justify-start gap-4",
              )}
              onClick={() => {
                onClick(chat.id)
              }}
            >
              <Avatar className="flex justify-center items-center">
                <AvatarImage
                  src={"/bali.png"}
                  width={6}
                  height={6}
                  className="w-10 h-10 "
                />
              </Avatar>
              <div className="flex flex-col max-w-28">
                <span>{chat.title}</span>

                {/* // TODO: re-enable the message summary */}
                {/* <span>{chat.title}</span> */}
                {/* {link.messages.length > 0 && (
                  <span className="text-zinc-300 text-xs truncate ">
                    {link.messages[link.messages.length - 1].name.split(" ")[0]}
                    : {link.messages[link.messages.length - 1].message}
                  </span>
                )} */}
              </div>
            </Link>
          )
        )}
      </nav>
    </div>
  );
}
