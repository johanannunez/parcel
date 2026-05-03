type ParentType = 'contact' | 'property' | 'project' | null;

export function parentLinkFor(args: {
  type: ParentType;
  id: string | null;
  contactProfileId?: string | null;
  fallbackLabel?: string | null;
}): { href: string | null; label: string; color: 'blue' | 'green' | 'purple' | 'gray' } {
  if (!args.type || !args.id) {
    return { href: null, label: args.fallbackLabel ?? 'Standalone', color: 'gray' };
  }
  switch (args.type) {
    case 'contact':
      return {
        href: `/admin/people/${args.id}`,
        label: args.fallbackLabel ?? 'Person',
        color: 'blue',
      };
    case 'property':
      return {
        href: `/admin/properties/${args.id}`,
        label: args.fallbackLabel ?? 'Property',
        color: 'green',
      };
    case 'project':
      return {
        href: `/admin/projects/${args.id}`,
        label: args.fallbackLabel ?? 'Project',
        color: 'purple',
      };
  }
}
