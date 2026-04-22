#!/usr/bin/env python3
"""Create a Lightning Email Template (UiType=SFX) in the NHS Email Templates folder via REST API.

Why this exists:
    The Salesforce SFDX `EmailTemplate` metadata type only deploys to Classic (UiType=Aloha)
    folders. Lightning Email Templates (UiType=SFX) — which is the modern editor and the
    folder our 01-09 templates live in — cannot be created via SFDX, nor via Apex DML
    (throws FIELD_INTEGRITY_EXCEPTION: invalid folder). The **only** programmatic path is a
    direct REST API POST that includes `UiType: "SFX"` + `RelatedEntityType`.

Usage:
    # 1. Prep credentials:
    sf org display --target-org <alias> --json > /tmp/org.json

    # 2. Set variables at the top of this file (or pass as args).

    # 3. Run:
    python3 scripts/create_lightning_email_template.py
"""

import json
import urllib.request
import urllib.error

# ── Config ────────────────────────────────────────────────────────────
SF_ORG_ALIAS = 'deepak-nhs-ee@crmmates.com.training'
TARGET_FOLDER_ID = '00l7Z000000Vw1RQAS'  # Lightning folder "NHS Email Templates"
TEMPLATE_NAME = '10 - Valuation Figure Return (Timeline)'
TEMPLATE_DEV_NAME = 'NHS_10_Valuation_Figure_Return_Timeline'
TEMPLATE_SUBJECT = 'Valuation Recommendations - {{{Opportunity.Property_Address__c}}}'
RELATED_ENTITY = 'Opportunity'
HTML_SOURCE_FILE = '/Users/deepakkrana/Dropbox/GitHub/NHS-Training-App/email-templates/10_Valuation_Figure_Return_Timeline.html'


def get_creds():
    """Resolve SF instance URL + access token via the sf CLI."""
    import subprocess, re
    out = subprocess.check_output(
        ['sf', 'org', 'display', '--target-org', SF_ORG_ALIAS, '--json'],
        stderr=subprocess.STDOUT
    ).decode('utf-8')
    # Strip any warnings that might precede the JSON
    json_text = re.sub(r'^[^{]*', '', out, flags=re.DOTALL)
    data = json.loads(json_text)['result']
    return data['instanceUrl'], data['accessToken']


def create_template(instance: str, token: str) -> str:
    html = open(HTML_SOURCE_FILE).read()
    payload = {
        'Name': TEMPLATE_NAME,
        'DeveloperName': TEMPLATE_DEV_NAME,
        'FolderId': TARGET_FOLDER_ID,
        'TemplateType': 'custom',
        'TemplateStyle': 'none',
        'UiType': 'SFX',               # LIGHTNING Email Template Builder (not Classic/Aloha)
        'RelatedEntityType': RELATED_ENTITY,
        'IsActive': True,
        'Subject': TEMPLATE_SUBJECT,
        'HtmlValue': html,
    }
    url = f'{instance}/services/data/v59.0/sobjects/EmailTemplate/'
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode('utf-8'),
        headers={'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'},
        method='POST'
    )
    try:
        with urllib.request.urlopen(req) as resp:
            result = json.loads(resp.read())
            return result['id']
    except urllib.error.HTTPError as e:
        body = e.read().decode('utf-8', errors='replace')
        raise SystemExit(f'HTTP {e.code}: {body}')


if __name__ == '__main__':
    instance, token = get_creds()
    new_id = create_template(instance, token)
    print(f'Created Lightning Email Template: {new_id}')
    print(f'Map it into NHS_API_Config__c via anonymous Apex if needed.')
