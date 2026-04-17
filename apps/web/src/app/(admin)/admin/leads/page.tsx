import { redirect } from 'next/navigation';

export default function LeadsRedirect() {
  redirect('/admin/contacts?view=lead-pipeline');
}
