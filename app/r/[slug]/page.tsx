import { redirect } from 'next/navigation'
import { NextRequest } from 'next/server'

const SUPABASE_URL = 'https://qnpjawyeekhkzvrorqyv.supabase.co'

export default async function RedirectPage({ params }: { params: { slug: string } }) {
  const slug = params.slug

  try {
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!serviceKey) {
      console.warn('[redirect] No service key — redirecting to home')
      redirect('/')
    }

    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(SUPABASE_URL, serviceKey!, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    console.warn('[redirect] Looking up slug:', slug)

    const { data, error } = await supabase
      .from('promotion_redirects')
      .select('promotion_id')
      .eq('slug', slug)
      .single()

    console.warn('[redirect] Result:', JSON.stringify({ data, error: error?.message }))

    if (data?.promotion_id) {
      console.warn('[redirect] Redirecting to:', `/enter/${data.promotion_id}`)
      redirect(`/enter/${data.promotion_id}`)
    }
  } catch (e: any) {
    console.warn('[redirect] Error:', e.message)
    // If it's a redirect error (NEXT_REDIRECT), rethrow it
    if (e.message === 'NEXT_REDIRECT' || e.digest?.startsWith('NEXT_REDIRECT')) {
      throw e
    }
  }

  console.warn('[redirect] Slug not found, going home')
  redirect('/')
}
