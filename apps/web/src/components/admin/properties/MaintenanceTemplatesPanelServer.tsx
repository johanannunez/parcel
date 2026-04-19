import { createClient } from '@/lib/supabase/server';
import { fetchActiveTaskTemplates } from '@/lib/admin/template-actions';
import { MaintenanceTemplatesPanel } from './MaintenanceTemplatesPanel';

export async function MaintenanceTemplatesPanelServer({ propertyId }: { propertyId: string }) {
  const supabase = await createClient();
  const [templates, appliedRow] = await Promise.all([
    fetchActiveTaskTemplates('property'),
    supabase
      .from('property_task_templates')
      .select('template_id, is_active')
      .eq('property_id', propertyId)
      .eq('is_active', true),
  ]);
  const alreadyApplied = (appliedRow.data ?? []).map((r) => r.template_id);
  return (
    <MaintenanceTemplatesPanel
      propertyId={propertyId}
      templates={templates}
      alreadyAppliedIds={alreadyApplied}
    />
  );
}
