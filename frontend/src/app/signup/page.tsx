// This is a server component shell that renders the client component.
// Mark dynamic to avoid static prerender.
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import SignupClient from './SignupClient';

export default function Page() {
  return <SignupClient />;
}
