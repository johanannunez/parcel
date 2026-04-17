import { redirect } from 'next/navigation';

export default function OwnersRedirect() {
  redirect('/admin/contacts?view=active-owners');
}
