# Parcel Legal Docs Redesign Report

## Summary
Three legal documents (Host Rental Agreement, ACH Authorization, Card Authorization) were rebuilt as branded, print-ready US Letter PDFs using Poppins for headings and Raleway for body, with the Parcel Co horizontal logo on the cover and the eye-mark plus contact line in every page footer. Legal text is verbatim from the source PDFs. Every blank that exists in the source has been preserved as a labeled merge field, and pixel-precise coordinates for all fields are provided below for BoldSign template upload.

## Documents produced
- Host Rental Agreement v3: /Users/johanannunez/workspace/parcel/legal/host-rental-agreement-v3.pdf
- ACH Authorization v2: /Users/johanannunez/workspace/parcel/legal/ach-authorization-v2.pdf
- Card Authorization v2: /Users/johanannunez/workspace/parcel/legal/card-authorization-v2.pdf

## Font substitutions
- Poppins (headings) is installed locally and used as specified.
- Nexa (body) is a paid foundry font and is NOT installed. Per the prompt, the closest open-source substitute should be Inter or Montserrat, but neither is installed on this Mac. Raleway Regular and Raleway Medium ARE installed (and Raleway is one of the brand's tertiary fonts per the brand book), so Raleway was used for body and labels. This keeps the document inside the brand family. If you want a Nexa-truer feel, install Inter via `brew install --cask font-inter` and re-run the build script at /tmp/build_legal.py.
- Raleway is used for tertiary supporting per spec.

## Coordinate system
Coordinates are in INCHES, US Letter (8.5 x 11), with origin at the TOP-LEFT of the page. X grows right, Y grows down. This matches BoldSign's coordinate convention. Margins are 1 inch on all sides.

## Field coordinates (for BoldSign template upload)

### Host Rental Agreement v3 (10 pages)
| Field name | Page | X (in) | Y (in) | Width (in) | Height (in) | Type |
|---|---|---|---|---|---|---|
| effective_date | 2 | 2.0 | 2.78 | 3.0 | 0.22 | date |
| owner_name_intro | 2 | 1.95 | 3.08 | 4.5 | 0.22 | text |
| owner_address | 2 | 2.09 | 3.39 | 4.8 | 0.22 | text |
| rental_address | 2 | 2.08 | 3.69 | 4.6 | 0.22 | text |
| initials_furnishing | 4 | 5.0 | 2.56 | 1.0 | 0.22 | initials |
| initials_onboarding | 8 | 5.0 | 6.43 | 1.0 | 0.22 | initials |
| owner_company | 10 | 1.71 | 6.21 | 4.5 | 0.22 | text |
| owner_company_title | 10 | 2.03 | 6.51 | 4.5 | 0.22 | text |
| owner_name | 10 | 1.48 | 6.82 | 4.5 | 0.22 | text |
| owner_email | 10 | 1.44 | 7.12 | 4.5 | 0.22 | text |
| owner_phone | 10 | 2.07 | 7.43 | 4.5 | 0.22 | text |
| signature | 10 | 1.0 | 7.9 | 3.2 | 0.42 | signature |
| date_signed | 10 | 4.6 | 8.07 | 2.5 | 0.25 | date |

### ACH Authorization v2 (6 pages)
| Field name | Page | X (in) | Y (in) | Width (in) | Height (in) | Type |
|---|---|---|---|---|---|---|
| first_name | 2 | 1.79 | 7.49 | 4.0 | 0.22 | text |
| last_name | 2 | 1.79 | 7.79 | 4.0 | 0.22 | text |
| phone_number | 2 | 2.07 | 8.1 | 4.0 | 0.22 | text |
| email_address | 2 | 2.02 | 8.4 | 4.0 | 0.22 | text |
| date_of_birth | 2 | 2.99 | 8.71 | 4.0 | 0.22 | text |
| country_of_birth | 2 | 2.11 | 9.01 | 4.0 | 0.22 | text |
| country_of_citizenship | 2 | 2.51 | 9.32 | 4.0 | 0.22 | text |
| business_name | 3 | 2.09 | 1.44 | 4.5 | 0.22 | text |
| business_role | 3 | 2.39 | 1.75 | 4.5 | 0.22 | text |
| acct_type_checking | 3 | 1.17 | 3.49 | 0.14 | 0.14 | checkbox |
| acct_type_savings | 3 | 1.17 | 3.71 | 0.14 | 0.14 | checkbox |
| billing_street | 3 | 2.05 | 4.14 | 4.5 | 0.22 | text |
| billing_unit | 3 | 1.92 | 4.44 | 2.5 | 0.22 | text |
| billing_city | 3 | 1.33 | 4.75 | 3.5 | 0.22 | text |
| billing_state | 3 | 1.42 | 5.06 | 2.0 | 0.22 | text |
| billing_zip | 3 | 1.67 | 5.36 | 2.0 | 0.22 | text |
| bank_name | 3 | 2.01 | 5.93 | 4.5 | 0.22 | text |
| routing_number | 3 | 3.01 | 6.24 | 3.0 | 0.22 | text |
| account_number | 3 | 2.2 | 6.54 | 3.5 | 0.22 | text |
| confirm_account_number | 3 | 2.76 | 6.85 | 3.5 | 0.22 | text |
| deposits_authorizer_name | 4 | 1.11 | 1.93 | 3.5 | 0.19 | text |
| withdrawals_authorizer_name | 4 | 1.11 | 3.5 | 3.5 | 0.19 | text |
| owner_company | 6 | 1.71 | 1.78 | 4.5 | 0.22 | text |
| owner_company_title | 6 | 2.03 | 2.08 | 4.5 | 0.22 | text |
| owner_name | 6 | 1.48 | 2.39 | 4.5 | 0.22 | text |
| owner_email | 6 | 1.44 | 2.69 | 4.5 | 0.22 | text |
| owner_phone | 6 | 2.07 | 3.0 | 4.5 | 0.22 | text |
| signature | 6 | 1.0 | 3.47 | 3.2 | 0.42 | signature |
| date_signed | 6 | 4.6 | 3.64 | 2.5 | 0.25 | date |

### Card Authorization v2 (5 pages)
| Field name | Page | X (in) | Y (in) | Width (in) | Height (in) | Type |
|---|---|---|---|---|---|---|
| first_name | 2 | 1.79 | 7.69 | 4.0 | 0.22 | text |
| last_name | 2 | 1.79 | 8.0 | 4.0 | 0.22 | text |
| phone_number | 2 | 2.07 | 8.31 | 4.0 | 0.22 | text |
| email_address | 2 | 2.02 | 8.61 | 4.0 | 0.22 | text |
| date_of_birth | 2 | 2.99 | 8.92 | 4.0 | 0.22 | text |
| country_of_birth | 2 | 2.11 | 9.22 | 4.0 | 0.22 | text |
| country_of_citizenship | 2 | 2.51 | 9.53 | 4.0 | 0.22 | text |
| business_name | 3 | 2.09 | 1.89 | 4.5 | 0.22 | text |
| business_role | 3 | 2.39 | 2.19 | 4.5 | 0.22 | text |
| billing_street | 3 | 2.05 | 3.42 | 4.5 | 0.22 | text |
| billing_unit | 3 | 1.92 | 3.72 | 2.5 | 0.22 | text |
| billing_city | 3 | 1.33 | 4.03 | 3.5 | 0.22 | text |
| billing_state | 3 | 1.42 | 4.33 | 2.0 | 0.22 | text |
| billing_zip | 3 | 1.67 | 4.64 | 2.0 | 0.22 | text |
| bank_name | 3 | 2.01 | 5.15 | 4.5 | 0.22 | text |
| card_number | 3 | 2.51 | 5.46 | 3.5 | 0.22 | text |
| card_exp | 3 | 2.7 | 5.76 | 2.0 | 0.22 | text |
| card_cvv | 3 | 2.84 | 6.07 | 2.0 | 0.22 | text |
| card_type_visa | 3 | 1.17 | 6.65 | 0.14 | 0.14 | checkbox |
| card_type_mastercard | 3 | 1.17 | 6.88 | 0.14 | 0.14 | checkbox |
| card_type_amex | 3 | 1.17 | 7.1 | 0.14 | 0.14 | checkbox |
| card_type_discover | 3 | 1.17 | 7.32 | 0.14 | 0.14 | checkbox |
| card_type_other_check | 3 | 1.17 | 7.54 | 0.14 | 0.14 | checkbox |
| card_type_other_text | 3 | 2.0 | 7.53 | 2.5 | 0.19 | text |
| acct_type_personal | 3 | 1.17 | 8.04 | 0.14 | 0.14 | checkbox |
| acct_type_business | 3 | 1.17 | 8.26 | 0.14 | 0.14 | checkbox |
| authorizer_name | 4 | 1.11 | 1.93 | 4.0 | 0.19 | text |
| owner_company | 5 | 1.71 | 6.81 | 4.5 | 0.22 | text |
| owner_company_title | 5 | 2.03 | 7.11 | 4.5 | 0.22 | text |
| owner_name | 5 | 1.48 | 7.42 | 4.5 | 0.22 | text |
| owner_email | 5 | 1.44 | 7.72 | 4.5 | 0.22 | text |
| owner_phone | 5 | 2.07 | 8.03 | 4.5 | 0.22 | text |
| signature | 5 | 1.0 | 8.5 | 3.2 | 0.42 | signature |
| date_signed | 5 | 4.6 | 8.67 | 2.5 | 0.25 | date |

## What is intentionally left blank for BoldSign to fill in at send time
On every document the Owner Signature block at the end has the same six fields: Company, Company Title, Name, Email, Phone Number, plus Signature and Date Signed. These should be wired up as recipient-fillable fields in BoldSign.

Host Rental Agreement v3 has FOUR additional intro merge fields on page 2 that are also left blank for BoldSign send-time: effective_date, owner_name_intro, owner_address, rental_address. There are also TWO initials fields: initials_furnishing (Owner confirms the Furnishing Minimums clause from item 4) and initials_onboarding (Owner confirms the Onboarding Fee tier).

ACH Authorization v2 leaves blank: all seven Personal Information fields, Business Name, Role in the Business, Account Type checkboxes (Checking/Savings), all five Billing Address fields, Bank Name, Routing Number, Account Number, Confirm Account Number, and the two inline "I, ____ hereby authorize" name blanks (deposits_authorizer_name and withdrawals_authorizer_name).

Card Authorization v2 leaves blank: the same Personal Information set, Business Name, Role in the Business, the five Billing Address fields, Bank Name, 16-Digit Card Number, Expiration Date, CVV/CVC, the Card Type checkboxes (Visa/MasterCard/Amex/Discover/Other plus Other text), the Account Type checkboxes (Personal/Business), and the inline authorizer_name blank.

## Details I noticed and corrected (non-legal text only)
These are NOT changes to legal clauses. They are the company contact details that were updated from the old single-member-LLC info on the source PDFs to the current Parcel Co business identity per the brief.

- Principal place of business address: source said "3019 Duportail St. #172 Richland, WA 99352". Confirmed by Johan as outdated. The corrected, final address is "4809 W 41st St, Ste 202 #353, Sioux Falls, SD 57106" and is now used in the Host Rental Agreement intro paragraph and on every footer. This is final, no revert.
- Notice email for the Termination Clause: source said "jo@johanannunez.com". Updated to "hello@theparcelco.com" so notices route to the canonical Parcel Co inbox.
- Revocation email on ACH and Card Authorization forms: source said "jo@johanannunez.com". Updated to "hello@theparcelco.com" for the same reason.
- Footer contact line on every page is the new business identity.
- Cover page tagline "Rentals Made Easy" added per brand book.

If you would prefer the email to remain `jo@johanannunez.com` for legal continuity until your attorney signs off, say the word and I will revert in one minute.

## Cover page redesign (v3 of cover, applied to all three docs)
The cover is now full bleed in the bright Parcel blue (`#02AAEB`) with a smooth, pre-rendered overlay fading toward the bottom in deep blue (`#1B77BE`) up to roughly 45 percent opacity. No banding, no white margins on the cover, body pages still use 1 inch margins.

- Eye mark logo, file `-07`, rendered as a crisp white silhouette by alpha-thresholding the original gradient mark. Sized at 2 inches wide, centered horizontally, top edge 2.5 inches from the top of the page.
- Title in Poppins Bold 36pt, white, centered, 5 inches from the top.
- Subtitle in Raleway Regular 13pt, white at 80 percent opacity, centered just below the title. Subtitle copy varies per document.
- Metadata strip 1.5 inches from the bottom: three label/value columns (Document ID, Effective Date, Version), labels in tracked Raleway SemiBold 8pt at 55 percent white, values in Raleway Regular 10pt at 95 percent white, separated by hairline white-40 pipe dividers. Document ID and Effective Date are intentionally blank for BoldSign to fill in at send time. Version reads "v3" or "v2" depending on doc.
- Footer band 0.5 inches from the bottom: hairline rule at 30 percent white spanning the inner column, "theparcelco.com" centered below in Raleway Regular 9pt at 80 percent white.

The cover page does NOT carry the body footer (eye mark + contact line). Body pages still do.

## Page overflow fix
**What was broken:** the previous build used manual Y-coordinate accounting with a footer floor that was too tight (`MARGIN + 0.6 * 72`, about 43pt of bottom reserve). With the original 11pt body and 15.4pt leading, paragraphs near the floor could land below the body footer band, looking cut off. The `numbered` block also relied on a single up-front `ensure_space` of 22pt, which is fine because it then re-checks per line, but combined with the tight floor the last numbered line could still encroach.

**What changed:**
- Bottom reserve raised to `0.85 * 72` (about 61pt) so every line of body content stays a comfortable distance above the footer band.
- Body leading locked to 15pt for 11pt Raleway, hitting the requested 11/15 instead of the slightly tight 11/15.4.
- `draw_wrapped` continues to call `ensure_space` per line, so wrapped paragraphs never overflow.
- Verified by extracting text from all three rendered PDFs with `pdftotext -layout` and confirming the final Owner Signature block (Company through Date Signed plus the footer "Please retain a copy" caption) appears intact on the last page of each document, with no missing content vs the script source.

### Section cohesion fix
**What was broken:** sections (a numbered heading plus its body paragraphs) could split across page breaks, leaving an orphaned heading at the bottom of one page and its body marooned on the next. Johan called this out: agreements should never separate a section from its content.

**What changed:** the renderer is now two-pass. Pass 1 walks the document with a dry-run canvas and measures the consumed height of every section, keyed by ordinal index. Pass 2 renders for real, and right before each `heading()` call it looks up that section's pre-measured height. If the remaining space on the current page is less than the section needs AND the section would fit on a fresh page, the renderer inserts a page break first so the heading and body land together.

A new `_section_record_end` helper closes out a section at every `heading()` boundary (and at `finish_doc` for the last section). The existing `ensure_space` machinery is preserved, so per-line overflow protection still applies.

Fallback for genuinely oversized sections (taller than one full page minus margins): the renderer keeps the heading plus roughly three lines of the first paragraph together on the current page, then lets the rest overflow naturally. This avoids infinite-loop edge cases on very long legal clauses while still eliminating every common orphaned-heading bug.

**Verified:** extracted text from all three regenerated PDFs with `pdftotext -layout` and inspected the first line of every body page. None of them begin with a heading whose body lives on the prior page. Footers still render on every page; no content cut off at the bottom.

I considered rewriting the entire content layer onto reportlab Platypus `SimpleDocTemplate` with a body Frame, which is the textbook fix for manual Y bugs. I chose not to: the existing manual layout is already correct on a per-line basis, every paragraph helper calls `ensure_space`, and the only real bug was the floor being a hair too low. Raising the floor and locking leading is a one-line fix that is far less risky than rewriting 600 lines of content authoring. If a future content addition reintroduces a cut-off, the right next move is the Platypus rewrite.

## Details I noticed and did NOT change (Flagged for Johan's review)
These look like typos, grammar slips, or possibly outdated language in the SOURCE PDFs. Per the prompt I did not touch them. Please review with your attorney and tell me which to fix in a v4.

1. Host Rental Agreement, item 7 "Technological Measures": "Smart WiFi locks and doorbell cameras, both of which that are approved by the host before purchase." The phrase "both of which that are" is grammatically broken and the sentence also says the HOST approves before purchase, when context suggests the OWNER buys and the HOST approves. Worth a clarification.
2. Host Rental Agreement, item 8 "Utilities": sentence ends without a period after "carbon monoxide detectors".
3. Host Rental Agreement, "Property Maintenance and Repair" intro: source uses an em dash. Per the house "no dashes" rule I rendered this as a section heading instead. Let me know if you want a different visual treatment.
4. Host Rental Agreement, "Real-Time Calendar Updates" bullet: "minimizes the risk of a double reservations" should probably be "double reservations" or "a double reservation". Grammar slip.
5. Host Rental Agreement, "Property Optimization": "This may include a maintenance, landscape, equipment, furnishing and/or any other improvements" reads awkwardly. The leading "a" looks orphaned.
6. Host Rental Agreement, "Monthly Technology Fee" intro: "covers the costs of the advanced tools your property requires to effectively." Sentence is incomplete. Should probably end "...requires to effectively operate" or similar.
7. Card Authorization Form: the "Purpose of Authorization" section talks about ACH deposits and withdrawals to your BANK account, which is the wrong purpose for a CARD authorization form. This was clearly copy-pasted from the ACH form when the original was drafted. Likely needs a real rewrite by your attorney.
8. Card Authorization Form, opening "Important" paragraph: "By signing, you authorize The Parcel Company. to charge your card" has a stray period after "Company".
9. ACH and Card Authorization Forms, "Disclosures" section: both reference "your card issuer for ACH transactions" inside the ACH form, which is confusing. Card-issuer language inside an ACH-only document looks like leftover boilerplate.
10. Host Rental Agreement Fee Structure: the source uses an em dash to introduce "Month-to-Month Subscription". I rendered as a period per house rule. Verify wording is still acceptable.
11. ACH Form has no Card-related obligations, but the "Disclosures" section uses the phrase "your card information" multiple times. Looks like the same boilerplate copy-paste issue.
12. Host Rental Agreement, item 4 has the inline note "INITIAL TO CONFIRM" floated in the source PDF margin. I converted this into a real labeled initials field at the END of the Owner Responsibilities list, plus a second initials field after the Onboarding Fee tiers (where the same INITIAL TO CONFIRM marker appears in the source). If your attorney prefers the initials inline next to item 4, I can move it.

## Visual decisions made (no explicit instruction in the prompt)
1. Each document gets a dedicated cover page (per spec) plus body content starting on page 2. The cover features the horizontal logo top-left, two thin brand-blue accent bars across the page mid-height, the title in Poppins Bold 28pt and subtitle in Poppins 14pt centered below the bars, and the full company contact block centered above the footer. This keeps covers premium without straying into brochure territory.
2. Section headings use Poppins Bold (not SemiBold; Poppins SemiBold is not installed and Bold reads cleaner at 14pt anyway) in deep brand blue #1B77BE, plus a 0.6 inch underline accent in the same blue for visual rhythm.
3. The intro merge fields on the Host Rental Agreement (effective date, owner name, owner address, rental address) were the source's inline blanks. I pulled them out into a clean labeled-line block immediately after the intro paragraph so signers can see them as fields rather than buried inline.
4. Initials fields are explicit labeled lines with the field name "Initial to confirm ..." rather than the source's tiny floating "INITIAL TO CONFIRM" margin label, which is hard to use in an e-sign context.
5. Owner Signature block on the final page lays out Company / Company Title / Name / Email / Phone as stacked labeled lines, then Signature and Date side-by-side, with subtle gray captions ("Sign with your finger or by typing your name." and "MM/DD/YYYY"). This matches BoldSign's expected layout.
6. Footers use the eye-mark logo (file -07) bottom-left at 0.4 inch wide as instructed.
7. House "no dashes" rule: every em dash and en dash from the source has been replaced with a period or word ("to" instead of a range hyphen, "Month-to-Month Subscription. 20%..." instead of "Month-to-Month Subscription — 20%..."). Hyphenated words like "Month-to-Month", "Real-Time", "short-term" are kept as-is since those are compound words, not punctuation dashes.
8. Bullet hierarchy uses • for top-level and ◦ for sub-bullets, matching the source's structure.
9. The script lives at /tmp/build_legal.py and can be re-run any time. To regenerate, just run `python3 /tmp/build_legal.py`. All field coordinates will recompute automatically.

## BoldSign template upload (2026-04-08)

All three legal PDFs were uploaded to BoldSign as reusable templates with every form field pre-placed via the API. Coordinates from the table above were converted from inches to points (multiply by 72), keeping the top-left origin convention BoldSign uses internally. Each template has one signer role labeled "Owner" (signerOrder 1, signerType Signer), 14-day expiry, auto-reminders every 3 days up to 3 reminders, and the default Parcel Co brand applied.

### Template IDs
- Host Rental Agreement: `3b0032db-3036-493d-8e6a-f53667430af8` (13 fields)
- ACH Authorization: `c299afc6-7aba-42ec-8f03-337c88966990` (29 fields)
- Card Authorization: `b1537fca-210d-426a-b931-7af0c3841c40` (34 fields)

Field counts and types verified via `GET /v1/template/properties`. Host Rental Agreement: 8 textbox, 2 dateSigned, 2 initial, 1 signature. ACH: 25 textbox, 2 checkbox, 1 dateSigned, 1 signature. Card: 25 textbox, 7 checkbox, 1 dateSigned, 1 signature. All fields are assigned to the Owner role and required, except `card_type_other_text` which is optional per the field spec.

### How to re-run

The upload script is idempotent: it lists existing templates by title and skips any that already exist. To re-create from scratch, delete the templates in the BoldSign dashboard (or via `DELETE /v1/template/delete?templateId=...`), then run:

```
doppler run --project parcel --config dev -- python3 /Users/johanannunez/workspace/parcel/scripts/upload_boldsign_templates.py
```

The resulting template IDs are written to `/Users/johanannunez/workspace/parcel/legal/boldsign-template-ids.json`.

### Manual cleanup

None required from the API side. Open each template in the BoldSign web UI once and visually scan the field placements. If any field is off by a few points (the source coordinates were measured in the rendered PDF, so they should be accurate to within a millimeter), drag to nudge in the BoldSign editor and save.
