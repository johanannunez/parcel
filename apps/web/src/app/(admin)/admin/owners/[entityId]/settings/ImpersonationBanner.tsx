import { Shield } from "@phosphor-icons/react/dist/ssr";
import styles from "../SettingsTab.module.css";

/**
 * Amber banner shown at the top of the Settings tab to remind the admin
 * that they're editing another user's settings. Copy clarifies that
 * everything they do here is logged to the owner's activity timeline.
 */
export function ImpersonationBanner({ ownerName }: { ownerName: string }) {
  return (
    <div className={styles.impersonationBanner} role="status">
      <span className={styles.impersonationIcon} aria-hidden>
        <Shield size={14} weight="fill" />
      </span>
      <span>
        You are editing <strong>{ownerName}</strong>&rsquo;s settings as an
        admin. Changes are logged to their activity timeline.
      </span>
    </div>
  );
}
