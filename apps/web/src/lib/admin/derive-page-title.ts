export type PageTitleInfo = {
  title: string;
  subtitle?: string;
  backHref?: string;
  backLabel?: string;
};

const STATIC_ROUTES: Array<{ prefix: string; title: string; subtitle?: string }> = [
  { prefix: "/admin/contacts", title: "Contacts", subtitle: "Leads and owners under Parcel management." },
  { prefix: "/admin/properties", title: "Properties", subtitle: "Every home under Parcel management." },
  { prefix: "/admin/inbox", title: "Inbox", subtitle: "All owner and guest conversations." },
  { prefix: "/admin/tasks", title: "Tasks", subtitle: "What you owe, what owners owe you." },
  { prefix: "/admin/help", title: "Help Center", subtitle: "Articles and onboarding content." },
  { prefix: "/admin/treasury", title: "Treasury", subtitle: "Cash, accounts, and financial health." },
  { prefix: "/admin/calendar", title: "Calendar", subtitle: "Bookings, blocks, and scheduling." },
  { prefix: "/admin/timeline", title: "Timeline", subtitle: "Activity across every owner and property." },
];

export function derivePageTitle(pathname: string): PageTitleInfo {
  if (pathname === "/admin" || pathname === "/admin/") {
    return { title: "Dashboard", subtitle: "Your command center." };
  }
  for (const r of STATIC_ROUTES) {
    if (pathname.startsWith(r.prefix)) {
      return { title: r.title, subtitle: r.subtitle };
    }
  }
  return { title: "" };
}
