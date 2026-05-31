import { redirect } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://qnpjawyeekhkzvrorqyv.supabase.co'

export default async function RedirectPage({ params }: { params: { slug: string } }) {
  try {
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (serviceKey) {
      const supabase = createClient(SUPABASE_URL, serviceKey, {
        auth: { autoRefreshToken: false, persistSession: false }
      })
      const { data } = await supabase
        .from('promotion_redirects')
        .select('promotion_id')
        .eq('slug', params.slug)
        .single()

      if (data?.promotion_id) {
        redirect(`/enter/${data.promotion_id}`)
      }
    }
  } catch (e) {}

  // Slug not found — go to homepage
  redirect('/')
}
