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
  { prefix: "/admin/tasks", title: "Tasks", subtitle: "Your work across every contact, property, and project." },
  { prefix: "/admin/help", title: "Help Center", subtitle: "Articles and onboarding content." },
  { prefix: "/admin/treasury", title: "Treasury", subtitle: "Cash, accounts, and financial health." },
  { prefix: "/admin/calendar", title: "Calendar", subtitle: "Meetings, tasks, and scheduled events." },
  { prefix: "/admin/timeline", title: "Timeline", subtitle: "Activity across every owner and property." },
  { prefix: "/admin/projects", title: "Projects", subtitle: "Internal initiatives, onboardings, and ideas." },
  { prefix: "/admin/payouts", title: "Payouts", subtitle: "All payout records across every owner and property." },
  { prefix: "/admin/block-requests", title: "Owner Reservations", subtitle: "Owner-requested blocks pending your review." },
  { prefix: "/admin/account", title: "Account", subtitle: "Profile, security, and preferences." },
  { prefix: "/admin/map", title: "Map", subtitle: "Properties and owners by location." },
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
