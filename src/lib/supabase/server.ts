import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export const createClient = () => {
  return createServerComponentClient({ cookies })
}

export const createRouteClient = () => {
  return createRouteHandlerClient({ cookies })
}
