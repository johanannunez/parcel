export type PortalRoute = { path: string; label: string };
export type PortalRouteGroup = { label: string; routes: PortalRoute[] };

export const PORTAL_ROUTE_GROUPS: PortalRouteGroup[] = [
  {
    label: "Main Portal",
    routes: [
      { path: "/portal/dashboard", label: "Dashboard" },
      { path: "/portal/properties", label: "Properties" },
      { path: "/portal/financials", label: "Financials" },
      { path: "/portal/documents", label: "Documents" },
      { path: "/portal/calendar", label: "Calendar" },
      { path: "/portal/messages", label: "Messages" },
      { path: "/portal/tasks", label: "Tasks" },
      { path: "/portal/timeline", label: "Timeline" },
      { path: "/portal/meetings", label: "Meetings" },
      { path: "/portal/members", label: "Members" },
      { path: "/portal/account", label: "Account" },
      { path: "/portal/notifications", label: "Notifications" },
      { path: "/portal/reserve", label: "Reserve" },
      { path: "/portal/cleaning-checklist", label: "Cleaning Checklist" },
      { path: "/portal/hospitable", label: "Hospitable" },
    ],
  },
  {
    label: "Setup",
    routes: [
      { path: "/portal/setup/welcome", label: "Welcome" },
      { path: "/portal/setup/basics", label: "Basics" },
      { path: "/portal/setup/address", label: "Address" },
      { path: "/portal/setup/space", label: "Space" },
      { path: "/portal/setup/amenities", label: "Amenities" },
      { path: "/portal/setup/photos", label: "Photos" },
      { path: "/portal/setup/rules", label: "Rules" },
      { path: "/portal/setup/wifi", label: "WiFi" },
      { path: "/portal/setup/cleaning", label: "Cleaning" },
      { path: "/portal/setup/financial", label: "Financial" },
      { path: "/portal/setup/payout", label: "Payout" },
      { path: "/portal/setup/identity", label: "Identity" },
      { path: "/portal/setup/w9", label: "W-9" },
      { path: "/portal/setup/compliance", label: "Compliance" },
      { path: "/portal/setup/host-agreement", label: "Host Agreement" },
      { path: "/portal/setup/account", label: "Account Setup" },
      { path: "/portal/setup/recommendations", label: "Recommendations" },
      { path: "/portal/setup/review", label: "Review" },
    ],
  },
  {
    label: "Onboarding",
    routes: [
      { path: "/portal/onboarding/property", label: "Property Onboarding" },
      { path: "/portal/onboarding/complete", label: "Onboarding Complete" },
    ],
  },
];

export const ALL_PORTAL_ROUTES = PORTAL_ROUTE_GROUPS.flatMap((g) => g.routes);
