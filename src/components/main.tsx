"use client";

import { useEffect, useState } from "react";
import { ChatLayout } from "./chat/chat-layout";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import supabase, { User } from "@/lib/supabase";
import { Toaster } from "./ui/toaster";
import { useToast } from "./ui/use-toast";

interface MainLayoutProps {
  defaultLayout: number[] | undefined;
}

export function MainLayout(props: MainLayoutProps) {
  const { toast } = useToast()
  const [user, setUser] = useState<User>()
  const [newUser, setNewUser] = useState<string>()

  const [storedUserUUID, setStoredUserUUID] = useState<string>("")

  useEffect(() => {
    // Restore last used User SSID for ease of login
    const val = localStorage.getItem("userUUID")
    if (val) {
      setStoredUserUUID(val)
    }
  },[])

  return (
    <div className="w-full h-full content-center">
      <Toaster />

      {!user ? 
      <div>
        <div className="my-10 w-1/3">
          <h1 className="text-2xl font-semibold tracking-tight">Login</h1>
          <Input id="uuid" type="text" placeholder="User UUID" defaultValue={storedUserUUID} />
          <Button onClick={() => {
              const uuid = (document.getElementById("uuid") as HTMLInputElement).value
              supabase.getUser(uuid).then((user) => {
                // Store the user UUID for future login
                localStorage.setItem("userUUID", uuid)
                setUser(user)
              }).catch(err => {
                console.error(err)
                toast({
                  title: "Error logging in",
                  description: err.message,
                })
              })
            }}> Login </Button>
        </div>

        <h3 className="text-lg font-semibold tracking-tight mt-4">or</h3>

        <div className="my-10 w-1/3">
          <h1 className="text-2xl font-semibold tracking-tight">Create an account</h1>
          <Input id="newUsername" type="text" placeholder="Username" />
          <Button onClick={() => {
              const username = (document.getElementById("newUsername") as HTMLInputElement).value
              supabase.createUser(username).then((uuid) => {
                setNewUser(uuid.id)
              }).catch(err => {
                console.error(err)
                toast({
                  title: "Error creating user",
                  description: err.message,
                })
              })
            }}> Register </Button>
          <br />
          {newUser ? <span className="text-xs text-gray-500">User is created, please store this UUID for future login: {newUser}</span> : null}

        </div>
      </div> :
      <div className="z-10 border rounded-lg max-w-5xl w-full h-full text-sm lg:flex mx-auto">
        <ChatLayout defaultLayout={props.defaultLayout} navCollapsedSize={8} currentUser={user} />
      </div>
}
    </div>
  )
}