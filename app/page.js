import { getCurrentUser } from './lib/auth';
import AuthHome from './components/auth-home';
import NotesPage from './components/notes-page';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const user = await getCurrentUser();
  return user ? <NotesPage user={user} /> : <AuthHome />;
}
