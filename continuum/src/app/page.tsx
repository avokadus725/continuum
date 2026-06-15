/* Root route — redirects to the dashboard (authenticated) or login (handled by proxy). */

import { redirect } from 'next/navigation'

export default function Home() {
  redirect('/dashboard')
}
