import type { LifecycleStage } from "@/lib/admin/contact-types";
import styles from "./EntityStagePill.module.css";

const STAGE_CONFIG: Record<LifecycleStage, { label: string; variant: string }> = {
  lead_new:      { label: "New Lead",      variant: "gray"   },
  qualified:     { label: "Qualified",     variant: "gray"   },
  in_discussion: { label: "In Discussion", variant: "gray"   },
  contract_sent: { label: "Contract Sent", variant: "gray"   },
  onboarding:    { label: "Onboarding",    variant: "amber"  },
  active_owner:  { label: "Active Owner",  variant: "green"  },
  offboarding:   { label: "Offboarding",   variant: "orange" },
  lead_cold:     { label: "Cold Lead",     variant: "slate"  },
  paused:        { label: "Paused",        variant: "slate"  },
  churned:       { label: "Churned",       variant: "slate"  },
};

export function EntityStagePill({ stage }: { stage: LifecycleStage }) {
  const config = STAGE_CONFIG[stage];
  return (
    <span className={`${styles.pill} ${styles[config.variant]}`}>
      {config.label}
    </span>
  );
}
