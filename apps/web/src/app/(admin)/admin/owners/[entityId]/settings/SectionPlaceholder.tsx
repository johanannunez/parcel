import { Wrench } from "@phosphor-icons/react/dist/ssr";
import sharedStyles from "./PersonalInfoSection.module.css";

/**
 * Generic "Coming soon" placeholder for settings sections that haven't
 * been built yet. Uses the same header + card styling as real sections
 * so the right rail feels consistent while admins click around.
 */
export function SectionPlaceholder({
  title,
  subtitle,
  teaser,
}: {
  title: string;
  subtitle: string;
  teaser: string;
}) {
  return (
    <div>
      <div className={sharedStyles.sectionHeader}>
        <h2 className={sharedStyles.sectionTitle}>{title}</h2>
        <p className={sharedStyles.sectionSubtitle}>{subtitle}</p>
      </div>
      <div className={sharedStyles.placeholderCard}>
        <div className={sharedStyles.placeholderIcon}>
          <Wrench size={18} weight="duotone" />
        </div>
        <div className={sharedStyles.placeholderTitle}>Coming soon</div>
        <div className={sharedStyles.placeholderBody}>{teaser}</div>
      </div>
    </div>
  );
}
