#!/usr/bin/env python3
"""
Upload Parcel Co legal PDFs to BoldSign as templates with form fields placed.

Run via:
  doppler run --project parcel --config dev -- \
    python3 /Users/johanannunez/workspace/parcel/scripts/upload_boldsign_templates.py

Idempotent: skips templates whose title already exists in the account.
"""

from __future__ import annotations

import json
import os
import sys
from pathlib import Path

import requests

API_BASE = "https://api.boldsign.com/v1"
LEGAL_DIR = Path("/Users/johanannunez/workspace/parcel/legal")
OUT_IDS = LEGAL_DIR / "boldsign-template-ids.json"
REPORT = LEGAL_DIR / "redesign-report.md"

PT_PER_IN = 72.0
PAGE_HEIGHT_PT = 11 * PT_PER_IN  # US Letter

# Field type map: report-type -> BoldSign API fieldType enum
TYPE_MAP = {
    "text": "TextBox",
    "date": "DateSigned",
    "signature": "Signature",
    "initials": "Initial",
    "checkbox": "CheckBox",
}

# (name, page, x_in, y_in, w_in, h_in, type)
HOST_RENTAL_FIELDS = [
    ("effective_date",         2, 2.0,  2.78, 3.0, 0.22, "date"),
    ("owner_name_intro",       2, 1.95, 3.08, 4.5, 0.22, "text"),
    ("owner_address",          2, 2.09, 3.39, 4.8, 0.22, "text"),
    ("rental_address",         2, 2.08, 3.69, 4.6, 0.22, "text"),
    ("initials_furnishing",    4, 5.0,  2.56, 1.0, 0.22, "initials"),
    ("initials_onboarding",    8, 5.0,  6.43, 1.0, 0.22, "initials"),
    ("owner_company",         10, 1.71, 6.21, 4.5, 0.22, "text"),
    ("owner_company_title",   10, 2.03, 6.51, 4.5, 0.22, "text"),
    ("owner_name",            10, 1.48, 6.82, 4.5, 0.22, "text"),
    ("owner_email",           10, 1.44, 7.12, 4.5, 0.22, "text"),
    ("owner_phone",           10, 2.07, 7.43, 4.5, 0.22, "text"),
    ("signature",             10, 1.0,  7.9,  3.2, 0.42, "signature"),
    ("date_signed",           10, 4.6,  8.07, 2.5, 0.25, "date"),
]

ACH_FIELDS = [
    ("first_name",                 2, 1.79, 7.49, 4.0, 0.22, "text"),
    ("last_name",                  2, 1.79, 7.79, 4.0, 0.22, "text"),
    ("phone_number",               2, 2.07, 8.1,  4.0, 0.22, "text"),
    ("email_address",              2, 2.02, 8.4,  4.0, 0.22, "text"),
    ("date_of_birth",              2, 2.99, 8.71, 4.0, 0.22, "text"),
    ("country_of_birth",           2, 2.11, 9.01, 4.0, 0.22, "text"),
    ("country_of_citizenship",     2, 2.51, 9.32, 4.0, 0.22, "text"),
    ("business_name",              3, 2.09, 1.44, 4.5, 0.22, "text"),
    ("business_role",              3, 2.39, 1.75, 4.5, 0.22, "text"),
    ("acct_type_checking",         3, 1.17, 3.49, 0.14, 0.14, "checkbox"),
    ("acct_type_savings",          3, 1.17, 3.71, 0.14, 0.14, "checkbox"),
    ("billing_street",             3, 2.05, 4.14, 4.5, 0.22, "text"),
    ("billing_unit",               3, 1.92, 4.44, 2.5, 0.22, "text"),
    ("billing_city",               3, 1.33, 4.75, 3.5, 0.22, "text"),
    ("billing_state",              3, 1.42, 5.06, 2.0, 0.22, "text"),
    ("billing_zip",                3, 1.67, 5.36, 2.0, 0.22, "text"),
    ("bank_name",                  3, 2.01, 5.93, 4.5, 0.22, "text"),
    ("routing_number",             3, 3.01, 6.24, 3.0, 0.22, "text"),
    ("account_number",             3, 2.2,  6.54, 3.5, 0.22, "text"),
    ("confirm_account_number",     3, 2.76, 6.85, 3.5, 0.22, "text"),
    ("deposits_authorizer_name",   4, 1.11, 1.93, 3.5, 0.19, "text"),
    ("withdrawals_authorizer_name",4, 1.11, 3.5,  3.5, 0.19, "text"),
    ("owner_company",              6, 1.71, 1.78, 4.5, 0.22, "text"),
    ("owner_company_title",        6, 2.03, 2.08, 4.5, 0.22, "text"),
    ("owner_name",                 6, 1.48, 2.39, 4.5, 0.22, "text"),
    ("owner_email",                6, 1.44, 2.69, 4.5, 0.22, "text"),
    ("owner_phone",                6, 2.07, 3.0,  4.5, 0.22, "text"),
    ("signature",                  6, 1.0,  3.47, 3.2, 0.42, "signature"),
    ("date_signed",                6, 4.6,  3.64, 2.5, 0.25, "date"),
]

CARD_FIELDS = [
    ("first_name",             2, 1.79, 7.69, 4.0, 0.22, "text"),
    ("last_name",              2, 1.79, 8.0,  4.0, 0.22, "text"),
    ("phone_number",           2, 2.07, 8.31, 4.0, 0.22, "text"),
    ("email_address",          2, 2.02, 8.61, 4.0, 0.22, "text"),
    ("date_of_birth",          2, 2.99, 8.92, 4.0, 0.22, "text"),
    ("country_of_birth",       2, 2.11, 9.22, 4.0, 0.22, "text"),
    ("country_of_citizenship", 2, 2.51, 9.53, 4.0, 0.22, "text"),
    ("business_name",          3, 2.09, 1.89, 4.5, 0.22, "text"),
    ("business_role",          3, 2.39, 2.19, 4.5, 0.22, "text"),
    ("billing_street",         3, 2.05, 3.42, 4.5, 0.22, "text"),
    ("billing_unit",           3, 1.92, 3.72, 2.5, 0.22, "text"),
    ("billing_city",           3, 1.33, 4.03, 3.5, 0.22, "text"),
    ("billing_state",          3, 1.42, 4.33, 2.0, 0.22, "text"),
    ("billing_zip",            3, 1.67, 4.64, 2.0, 0.22, "text"),
    ("bank_name",              3, 2.01, 5.15, 4.5, 0.22, "text"),
    ("card_number",            3, 2.51, 5.46, 3.5, 0.22, "text"),
    ("card_exp",               3, 2.7,  5.76, 2.0, 0.22, "text"),
    ("card_cvv",               3, 2.84, 6.07, 2.0, 0.22, "text"),
    ("card_type_visa",         3, 1.17, 6.65, 0.14, 0.14, "checkbox"),
    ("card_type_mastercard",   3, 1.17, 6.88, 0.14, 0.14, "checkbox"),
    ("card_type_amex",         3, 1.17, 7.1,  0.14, 0.14, "checkbox"),
    ("card_type_discover",     3, 1.17, 7.32, 0.14, 0.14, "checkbox"),
    ("card_type_other_check",  3, 1.17, 7.54, 0.14, 0.14, "checkbox"),
    ("card_type_other_text",   3, 2.0,  7.53, 2.5, 0.19, "text"),
    ("acct_type_personal",     3, 1.17, 8.04, 0.14, 0.14, "checkbox"),
    ("acct_type_business",     3, 1.17, 8.26, 0.14, 0.14, "checkbox"),
    ("authorizer_name",        4, 1.11, 1.93, 4.0, 0.19, "text"),
    ("owner_company",          5, 1.71, 6.81, 4.5, 0.22, "text"),
    ("owner_company_title",    5, 2.03, 7.11, 4.5, 0.22, "text"),
    ("owner_name",             5, 1.48, 7.42, 4.5, 0.22, "text"),
    ("owner_email",            5, 1.44, 7.72, 4.5, 0.22, "text"),
    ("owner_phone",            5, 2.07, 8.03, 4.5, 0.22, "text"),
    ("signature",              5, 1.0,  8.5,  3.2, 0.42, "signature"),
    ("date_signed",            5, 4.6,  8.67, 2.5, 0.25, "date"),
]

DOCS = [
    {
        "key": "hostRentalAgreement",
        "title": "Host Rental Agreement",
        "file": "host-rental-agreement-v3.pdf",
        "description": "The Parcel Company. Host rental agreement defining the co-hosting relationship between Parcel and the property owner.",
        "fields": HOST_RENTAL_FIELDS,
    },
    {
        "key": "achAuthorization",
        "title": "ACH Authorization",
        "file": "ach-authorization-v2.pdf",
        "description": "The Parcel Company. ACH authorization granting Parcel permission to deposit and withdraw funds via the owner's bank account.",
        "fields": ACH_FIELDS,
    },
    {
        "key": "cardAuthorization",
        "title": "Card Authorization",
        "file": "card-authorization-v2.pdf",
        "description": "The Parcel Company. Credit card authorization granting Parcel permission to charge the owner's card for fees and reimbursements.",
        "fields": CARD_FIELDS,
    },
]


def headers(api_key: str) -> dict:
    return {"X-API-KEY": api_key, "accept": "application/json"}


def list_templates(api_key: str) -> list[dict]:
    out = []
    page = 1
    while True:
        r = requests.get(
            f"{API_BASE}/template/list",
            params={"Page": page, "PageSize": 50},
            headers=headers(api_key),
            timeout=30,
        )
        r.raise_for_status()
        data = r.json()
        items = data.get("result") or data.get("results") or []
        if not items:
            break
        out.extend(items)
        if len(items) < 50:
            break
        page += 1
    return out


def get_default_brand_id(api_key: str) -> str | None:
    try:
        r = requests.get(f"{API_BASE}/brand/list", params={"Page": 1, "PageSize": 50},
                         headers=headers(api_key), timeout=30)
        if r.status_code != 200:
            return None
        data = r.json()
        brands = data.get("result") or data.get("results") or []
        if not brands:
            return None
        for b in brands:
            if b.get("isDefault"):
                return b.get("brandId") or b.get("id")
        return brands[0].get("brandId") or brands[0].get("id")
    except Exception:
        return None


def build_form_fields(fields: list[tuple]) -> list[dict]:
    out = []
    for idx, (name, page, x_in, y_in, w_in, h_in, ftype) in enumerate(fields):
        bs_type = TYPE_MAP[ftype]
        is_required = name != "card_type_other_text"
        out.append({
            "id": name,
            "name": name,
            "fieldType": bs_type,
            "pageNumber": page,
            "bounds": {
                "x": round(x_in * PT_PER_IN, 2),
                "y": round(y_in * PT_PER_IN, 2),
                "width": round(w_in * PT_PER_IN, 2),
                "height": round(h_in * PT_PER_IN, 2),
            },
            "isRequired": is_required,
            "signerIndex": 1,
        })
    return out


def create_template(api_key: str, doc: dict, brand_id: str | None) -> str:
    pdf_path = LEGAL_DIR / doc["file"]
    if not pdf_path.exists():
        raise FileNotFoundError(pdf_path)

    data = [
        ("Title", (None, doc["title"])),
        ("DocumentTitle", (None, doc["title"])),
        ("Description", (None, doc["description"])),
        ("DocumentMessage", (None, "")),
        ("ExpiryDays", (None, "14")),
        ("AutoReminderDays", (None, "3")),
        ("AutoReminderCount", (None, "3")),
        ("EnableAutoReminder", (None, "true")),
        ("Roles[0][index]", (None, "1")),
        ("Roles[0][signerOrder]", (None, "1")),
        ("Roles[0][signerType]", (None, "Signer")),
        ("Roles[0][name]", (None, "Owner")),
    ]
    # Nest form fields under the role using bracketed multipart keys.
    for i, (name, page, x_in, y_in, w_in, h_in, ftype) in enumerate(doc["fields"]):
        prefix = f"Roles[0][formFields][{i}]"
        bs_type = TYPE_MAP[ftype]
        is_required = "true" if name != "card_type_other_text" else "false"
        data += [
            (f"{prefix}[id]", (None, name)),
            (f"{prefix}[name]", (None, name)),
            (f"{prefix}[type]", (None, bs_type)),
            (f"{prefix}[pageNumber]", (None, str(page))),
            (f"{prefix}[isRequired]", (None, is_required)),
            (f"{prefix}[bounds][x]", (None, str(round(x_in * PT_PER_IN, 2)))),
            (f"{prefix}[bounds][y]", (None, str(round(y_in * PT_PER_IN, 2)))),
            (f"{prefix}[bounds][width]", (None, str(round(w_in * PT_PER_IN, 2)))),
            (f"{prefix}[bounds][height]", (None, str(round(h_in * PT_PER_IN, 2)))),
        ]
    if brand_id:
        data.append(("BrandId", (None, brand_id)))

    with open(pdf_path, "rb") as f:
        files = data + [("Files", (doc["file"], f.read(), "application/pdf"))]

    r = requests.post(
        f"{API_BASE}/template/create",
        headers=headers(api_key),
        files=files,
        timeout=120,
    )
    if r.status_code >= 300:
        raise RuntimeError(f"Create failed [{r.status_code}]: {r.text}")
    body = r.json()
    return body.get("templateId") or body.get("documentId") or body.get("id")


def main() -> int:
    api_key = os.environ.get("BOLDSIGN_API_KEY")
    if not api_key:
        print("ERROR: BOLDSIGN_API_KEY not set. Run via doppler run.", file=sys.stderr)
        return 1

    print("Listing existing templates...")
    existing = list_templates(api_key)
    by_title = {}
    for t in existing:
        title = t.get("title") or t.get("documentTitle")
        tid = t.get("templateId") or t.get("documentId") or t.get("id")
        if title and tid:
            by_title[title] = tid
    print(f"  Found {len(by_title)} existing templates")

    print("Fetching default brand...")
    brand_id = get_default_brand_id(api_key)
    print(f"  brandId={brand_id}")

    results = {}
    if OUT_IDS.exists():
        try:
            results = json.loads(OUT_IDS.read_text())
        except Exception:
            results = {}

    for doc in DOCS:
        if doc["title"] in by_title:
            tid = by_title[doc["title"]]
            print(f"SKIP {doc['title']} (exists, id={tid})")
            results[doc["key"]] = tid
            continue
        print(f"CREATE {doc['title']} ({len(doc['fields'])} fields)...")
        tid = create_template(api_key, doc, brand_id)
        print(f"  -> {tid}")
        results[doc["key"]] = tid

    OUT_IDS.write_text(json.dumps(results, indent=2) + "\n")
    print(f"Wrote {OUT_IDS}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
