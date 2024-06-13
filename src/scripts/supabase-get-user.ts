import Supabase from '../lib/supabase'

Supabase.getMessages('6ee0a068-029f-401b-b5e9-d68a125331de').then((messages) => {
  console.log(`Successfully retrieved messages. messages=${JSON.stringify(messages)}`)
  
}).catch(err => {
  console.error(err)
})
