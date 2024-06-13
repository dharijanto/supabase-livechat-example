import Supabase from '../lib/supabase'

Supabase.clearAllData().then(() => {
  console.log('Successfully cleared all data')
  return Supabase.createUser('Jane Doe').then((user) => {
    console.log(`Successfully created new user. user=${JSON.stringify(user)}`)
    return Supabase.newChat('Trip to Bali').then((chat) => {
      console.log(`Successfully created new chat. chat=${JSON.stringify(chat)}`)
      return Supabase.postMessage(chat.id, user.id, 'Hey, Jakob').then((message) => {
        console.log(`Successfully posted message. message=${JSON.stringify(message)}`)
        return Supabase.getMessages(chat.id).then((messages) => {
          console.log(`Successfully retrieved messages. messages=${JSON.stringify(messages)}`)
        })
      })
    })  
  })
}).catch(err => {
  console.error(err)
})
