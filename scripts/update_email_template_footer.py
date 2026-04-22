#!/usr/bin/env python3
"""Push Unit 7 → Unit 3 change to every live NHS_ email template in the org.

Reads HtmlValue, replaces 'Unit 7 Hepton Court' → 'Unit 3 Hepton Court',
PATCHes the record if changed. Reports per-template status."""

import json, subprocess, urllib.request, urllib.error, re

ORG = 'deepak-nhs-ee@crmmates.com.training'

def sf_creds():
    out = subprocess.check_output(['sf', 'org', 'display', '--target-org', ORG, '--json']).decode('utf-8')
    out = re.sub(r'^[^{]*', '', out, flags=re.DOTALL)
    d = json.loads(out)['result']
    return d['instanceUrl'], d['accessToken']


def query_templates(instance, token):
    import urllib.parse
    q = "SELECT Id, Name, DeveloperName FROM EmailTemplate WHERE DeveloperName LIKE 'NHS_%' AND IsActive = true"
    url = f'{instance}/services/data/v59.0/query/?q=' + urllib.parse.quote(q)
    req = urllib.request.Request(url, headers={'Authorization': f'Bearer {token}'})
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read())['records']


def get_html(instance, token, tpl_id):
    url = f'{instance}/services/data/v59.0/sobjects/EmailTemplate/{tpl_id}?fields=HtmlValue'
    req = urllib.request.Request(url, headers={'Authorization': f'Bearer {token}'})
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read()).get('HtmlValue') or ''


def patch_html(instance, token, tpl_id, html):
    url = f'{instance}/services/data/v59.0/sobjects/EmailTemplate/{tpl_id}'
    req = urllib.request.Request(
        url,
        data=json.dumps({'HtmlValue': html}).encode('utf-8'),
        headers={'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'},
        method='PATCH'
    )
    with urllib.request.urlopen(req) as resp:
        return resp.status


def main():
    instance, token = sf_creds()
    tpls = query_templates(instance, token)
    print(f'Found {len(tpls)} NHS_ templates.')
    for t in tpls:
        html = get_html(instance, token, t['Id'])
        if 'Unit 7 Hepton Court' in html:
            new_html = html.replace('Unit 7 Hepton Court', 'Unit 3 Hepton Court')
            status = patch_html(instance, token, t['Id'], new_html)
            print(f'  ✓ {t["Name"]:60s} updated (HTTP {status})')
        else:
            print(f'  · {t["Name"]:60s} no match — skipped')


if __name__ == '__main__':
    main()
