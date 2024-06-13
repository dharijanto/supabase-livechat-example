import { RealtimeChannel, RealtimePostgresInsertPayload, SupabaseClient, createClient } from '@supabase/supabase-js'

export interface User {
  id: string
  username: string
  createdAt: string
}

export interface Chat {
  id: string
  title: string
  createdAt: string
}

export interface Message {
  id: string
  chatId: string
  message: string
  createdAt: number
  userId: string
  Users: {
    username: string
  }
}

class Supabase {
  private supabaseUrl: string = 'https://bhythdtntgmoytzgvpzn.supabase.co'
  private supabaseKey: string = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJoeXRoZHRudGdtb3l0emd2cHpuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTgyNTA1OTgsImV4cCI6MjAzMzgyNjU5OH0.cVZmYiiKqgeReII7vl8OtQRhp6Bo3YmjkfvK1B7gByE'
  public supabase: SupabaseClient

  public userCache: { [uuid: string]: User } = {}

  constructor() {
    this.supabase = createClient(this.supabaseUrl, this.supabaseKey);
  }

  async getChats(): Promise<Chat[]> {
    const resp = await this.supabase.from("Chats").select().order('createdAt', { ascending: true });
    if (resp.error) {
      throw new Error(resp.error.message).message
    }

    if (resp.data[0] === 0) {
      throw new Error('chat not found')
    }

    return resp.data
  }

  async getChat(chatId: string): Promise<Chat> {
    const resp = await this.supabase.from("Chats").select().eq('id', chatId);
    if (resp.error) {
      throw new Error(resp.error.message)
    }

    if (resp.data[0] === 0) {
      throw new Error('chat not found')
    }

    return resp.data[0] as Chat
  }

  async newChat(title: string): Promise<Chat> {
    const resp = await this.supabase.from("Chats").insert({ title }).select();
    if (resp.error) {
      throw new Error(resp.error.message)
    }

    if (resp.data.length > 0) {
      return resp.data[0] as Chat
    }
    throw new Error('chat not created unexpectedly')
  }

  /*
  sample response:
  {"messages":[{"id":8,"message":null,"createdAt":"2024-06-13T09:42:04.871242+00:00","userId":"f60bb846-9166-42d9-b888-8c046d73a93e","Users":{"username":"Jane Doe"}}],"latestTimestamp":"2024-06-13T09:42:04.871242+00:00"}
  */
  async getMessages(chatId: string): Promise<Message[]> {
    const resp = await this.supabase.from("Messages").select(`id, chatId, message, createdAt, userId, Users (username)`).eq('chatId', chatId).order('createdAt', { ascending: true });
    if (resp.error) {
      throw new Error(resp.error.message)
    }
    return resp.data as any // WAR for a bug in 1-1 join
  }

  async getUsers(): Promise<User[]> {
    const resp = await this.supabase.from("Users").select().order('createdAt', { ascending: true });
    if (resp.error) {
      throw new Error(resp.error.message)
    }

    return resp.data
  }

  async getMessage(id: string): Promise<Message> {
    const resp = await this.supabase.from("Messages").select(`id, chatId, message, createdAt, userId, Users (username)`).eq('id', id);
    if (resp.error) {
      throw new Error(resp.error.message)
    }

    if (resp.data.length === 0) {
      throw new Error('message not found')
    }

    return resp.data[0] as any // WAR for a bug in 1-1 join
  }

  async postMessage(chatId: string, userId: string, message: string): Promise<Message> {
    const resp = await this.supabase.from("Messages").insert({ chatId, userId, message }).select();
    if (resp.error) {
      throw new Error(resp.error.message).message
    }

    if (resp.data) {
      return resp.data[0] as Message
    }

    throw new Error('message not created unexpectedly')
  }

  async getUser(uuid: string): Promise<User> {
    const resp = await this.supabase.from("Users").select().eq('id', uuid);
    if (resp.error) {
      throw new Error(resp.error.message)
    }
    if (resp.data) {
      return resp.data[0] as User
    }
    throw new Error('user with specified uuid not found')
  }

  async createUser(username: string): Promise<User> {
    // if uuid is not specified, we create a new user
    const resp = await this.supabase.from("Users").insert({ username }).select();

    if (resp.status === 409) {
      throw new Error('User already existed!')
    }

    // TODO: copy this error handling to the rest of the functions
    if (resp.status > 299 || resp.status < 200) {
      throw new Error('Failed to execute command with http status code=' + resp.status)
    }

    if (resp.error) {
      throw new Error(resp.error.message)
    }
    if (resp.data) {
      return resp.data[0] as User
    }
    throw new Error('user not created unexpectedly')
  }

  async clearAllData(): Promise<undefined> {
    // TODO: figure out why these aren't working
    // Delete all from table users
    await this.supabase.from("Messages").delete().neq('id', '0')
    await this.supabase.from("Chats").delete().neq('id', '0')
    await this.supabase.from("Users").delete().neq('id', '0')
  }

  async subscribeToMessages(callback: (msg: Message) => void): Promise<RealtimeChannel> {
    return this.supabase
      .channel('Messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'Messages' }, (payload: RealtimePostgresInsertPayload<Message>) => {
       if (payload.new) {
         // We need to call the API again because the payload isn't joined with the Users table
         this.getMessage(payload.new.id).then((msg) => {
           callback(msg)
         }).catch((err) => {
           // TODO: percolate this up to the UI
           console.error('Failed to get message: ' + err)
         })
       } else {
         // TODO: percolate this up to the UI
        console.error(`Error on listening for chat from subscriptions: ${payload.errors}`)
       }
      })
      .subscribe()
  }

  async subscribeToChat(callback: (chat: Chat) => void): Promise<RealtimeChannel> {
    return this.supabase
    .channel('Chats')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'Chats' }, (payload: RealtimePostgresInsertPayload<Chat>) => {
      if (payload.errors && payload.errors.length > 0) {
        console.error(`Error on listening for chat from subscriptions: ${payload.errors}`)
        // TODO: percolate this up to the UI
      }
      if (payload.new) {
        callback(payload.new)
      } else {
        // TODO: percolate this up to the UI
        console.error(`Error on listening for chat from subscriptions: ${payload.errors}`)
      }
    })
    .subscribe()
  }
}

export default new Supabase()