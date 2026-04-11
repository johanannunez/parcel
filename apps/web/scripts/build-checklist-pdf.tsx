/**
 * Build the downloadable Parcel cleaning checklist PDF.
 *
 * Run with: pnpm --filter web gen:checklist-pdf
 *
 * Source: `src/app/(portal)/portal/cleaning-checklist/modules.ts`
 * Output: `public/cleaning-checklist.pdf`
 *
 * This is a TSX script (not a Next.js server component) executed via
 * `tsx`. It imports the shared MODULES data, renders a React PDF
 * document with Parcel branding, and writes it to disk. Re-run after
 * any edit to modules.ts to keep the PDF in sync with the web page.
 */

import path from "node:path";
import { fileURLToPath } from "node:url";
import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  renderToFile,
} from "@react-pdf/renderer";
import { MODULES, TOTAL_ITEMS } from "../src/app/(portal)/portal/cleaning-checklist/modules";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const outputPath = path.resolve(
  __dirname,
  "..",
  "public",
  "cleaning-checklist.pdf",
);

/* ───── Brand tokens ───── */

const BRAND_BLUE = "#02aaeb";
const BRAND_BLUE_DARK = "#1b77be";
const TEXT_PRIMARY = "#141414";
const TEXT_SECONDARY = "#4a4a4a";
const TEXT_TERTIARY = "#7a7a7a";
const BORDER = "#e5e5e5";
const ACCENT_TINT = "#e7f7fd";

const styles = StyleSheet.create({
  page: {
    paddingTop: 48,
    paddingBottom: 60,
    paddingHorizontal: 48,
    fontSize: 10,
    color: TEXT_PRIMARY,
    lineHeight: 1.45,
    fontFamily: "Helvetica",
  },

  /* Cover / header */
  cover: {
    /* Slightly reduced top margin: the running header at the very
       top of the page renders an empty string on page 1, but still
       reserves ~15px of vertical space. So we compensate here. */
    marginTop: 48,
    marginBottom: 0,
  },
  eyebrow: {
    fontSize: 8,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: BRAND_BLUE_DARK,
    fontFamily: "Helvetica-Bold",
    marginBottom: 14,
  },
  title: {
    fontSize: 30,
    fontFamily: "Helvetica-Bold",
    color: TEXT_PRIMARY,
    letterSpacing: -0.4,
    lineHeight: 1.15,
    marginBottom: 18,
  },
  lede: {
    fontSize: 11.5,
    color: TEXT_SECONDARY,
    lineHeight: 1.55,
    marginBottom: 22,
    maxWidth: 440,
  },
  statRow: {
    flexDirection: "row",
    alignItems: "center",
    borderTop: `1px solid ${BORDER}`,
    borderBottom: `1px solid ${BORDER}`,
    paddingVertical: 10,
    gap: 16,
  },
  stat: {
    flexDirection: "column",
  },
  statLabel: {
    fontSize: 7,
    color: TEXT_TERTIARY,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    fontFamily: "Helvetica-Bold",
    marginBottom: 2,
  },
  statValue: {
    fontSize: 11,
    color: TEXT_PRIMARY,
    fontFamily: "Helvetica-Bold",
  },
  statDivider: {
    width: 1,
    height: 22,
    backgroundColor: BORDER,
  },

  /* Quick rules box */
  rules: {
    marginTop: 18,
    padding: 14,
    backgroundColor: ACCENT_TINT,
    borderRadius: 6,
    borderLeft: `3px solid ${BRAND_BLUE}`,
  },
  rulesTitle: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: BRAND_BLUE_DARK,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  rulesItem: {
    fontSize: 10,
    color: TEXT_PRIMARY,
    marginBottom: 3,
  },

  /* Module section */
  module: {
    marginTop: 20,
  },
  moduleHeader: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
    marginBottom: 4,
    borderBottom: `1px solid ${BORDER}`,
    paddingBottom: 6,
  },
  moduleNumber: {
    fontSize: 8,
    color: BRAND_BLUE_DARK,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1,
  },
  moduleTitle: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: TEXT_PRIMARY,
    letterSpacing: -0.2,
    flex: 1,
  },
  moduleCount: {
    fontSize: 8,
    color: TEXT_TERTIARY,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  moduleSubtitle: {
    fontSize: 9.5,
    color: TEXT_SECONDARY,
    marginTop: 4,
    marginBottom: 8,
    fontStyle: "italic",
  },

  /* Item row */
  itemRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginBottom: 4,
    paddingVertical: 3,
  },
  checkbox: {
    width: 9,
    height: 9,
    borderWidth: 0.8,
    borderStyle: "solid",
    borderColor: TEXT_PRIMARY,
    borderRadius: 1,
    marginTop: 2,
  },
  itemText: {
    fontSize: 9.5,
    color: TEXT_PRIMARY,
    flex: 1,
    lineHeight: 1.4,
  },
  itemOnlyIf: {
    fontSize: 7.5,
    color: TEXT_TERTIARY,
    fontStyle: "italic",
    marginLeft: 4,
  },

  /* Running header — subtle brand line at the top of every page
     (except the cover which has its own big eyebrow). Uses the
     `fixed` + `render` pattern which is the only reliable way to
     repeat an element across pages in react-pdf. */
  runningHeader: {
    fontSize: 7,
    color: TEXT_TERTIARY,
    textAlign: "center",
    letterSpacing: 1.2,
    marginBottom: 24,
    fontFamily: "Helvetica-Bold",
  },
});

function ChecklistDocument() {
  return (
    <Document
      title="Parcel Turnover Cleaning Checklist"
      author="The Parcel Company"
      subject="Turnover cleaning standards"
      creator="Parcel Portal"
    >
      <Page size="LETTER" style={styles.page} wrap>
        {/* Running header — hidden on page 1 (cover has its own big
            eyebrow), visible on every subsequent page as a subtle
            brand + page number line. */}
        <Text
          style={styles.runningHeader}
          fixed
          render={({ pageNumber, totalPages }) =>
            pageNumber === 1
              ? ""
              : `THE PARCEL COMPANY     ·     CLEANING CHECKLIST     ·     PAGE ${pageNumber} OF ${totalPages}`
          }
        />

        {/* Cover — its own page, forced break before module 01 below */}
        <View style={styles.cover}>
          <Text style={styles.eyebrow}>THE PARCEL COMPANY</Text>
          <Text style={styles.title}>
            Turnover cleaning{"\n"}checklist
          </Text>
          <Text style={styles.lede}>
            Every step we expect a Parcel home to meet before the next
            guest checks in. Use this when you&apos;re turning over the
            home yourself instead of scheduling our cleaning team. Some
            items only apply to certain properties, and those are
            marked.
          </Text>

          {/* Stats row */}
          <View style={styles.statRow}>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>Items</Text>
              <Text style={styles.statValue}>{TOTAL_ITEMS}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statLabel}>Modules</Text>
              <Text style={styles.statValue}>{MODULES.length}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statLabel}>Thermostat</Text>
              <Text style={styles.statValue}>70°F on exit</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statLabel}>Last step</Text>
              <Text style={styles.statValue}>Photo of locked door</Text>
            </View>
          </View>

          {/* House rules (owner-framed) */}
          <View style={styles.rules}>
            <Text style={styles.rulesTitle}>THE FEW RULES THAT MATTER</Text>
            <Text style={styles.rulesItem}>
              • Refill every supply to 100%. Nothing should drop below
              75% before a guest arrives.
            </Text>
            <Text style={styles.rulesItem}>
              • Check sheets and pillowcases carefully. Even one hair
              makes the bed feel unclean to a guest.
            </Text>
            <Text style={styles.rulesItem}>
              • Thermostat to 70°F, lights off, windows closed, and all
              doors locked when you leave.
            </Text>
            <Text style={styles.rulesItem}>
              • Before and after photos are optional, but helpful if
              anything gets flagged later.
            </Text>
          </View>
        </View>

        {/* Modules — first one forces a new page so the cover stands alone */}
        {MODULES.map((module, i) => (
          <View
            key={module.id}
            style={styles.module}
            wrap={false}
            break={i === 0}
          >
            <View style={styles.moduleHeader}>
              <Text style={styles.moduleNumber}>
                {String(i + 1).padStart(2, "0")}
              </Text>
              <Text style={styles.moduleTitle}>{module.title}</Text>
              <Text style={styles.moduleCount}>
                {module.items.length} items
              </Text>
            </View>
            <Text style={styles.moduleSubtitle}>{module.subtitle}</Text>
            {module.items.map((item) => (
              <View key={item.id} style={styles.itemRow}>
                <View style={styles.checkbox} />
                <Text style={styles.itemText}>
                  {item.text}
                  {item.onlyIf ? (
                    <Text style={styles.itemOnlyIf}>
                      {"  "}(only if {item.onlyIf})
                    </Text>
                  ) : null}
                </Text>
              </View>
            ))}
          </View>
        ))}

      </Page>
    </Document>
  );
}

async function main() {
  // Suppress the noisy React 19 warning about renderToStream
  const originalWarn = console.warn;
  console.warn = (...args: unknown[]) => {
    const msg = String(args[0] ?? "");
    if (msg.includes("renderToStream")) return;
    originalWarn(...args);
  };

  console.log(`[checklist-pdf] writing ${outputPath}`);
  await renderToFile(<ChecklistDocument />, outputPath);
  console.log(
    `[checklist-pdf] done · ${TOTAL_ITEMS} items across ${MODULES.length} modules`,
  );
  console.warn = originalWarn;
}

main().catch((err) => {
  console.error("[checklist-pdf] failed:", err);
  process.exit(1);
});
