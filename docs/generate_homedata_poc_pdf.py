#!/usr/bin/env python3
"""Generate HOMEDATA_API_POC_VALIDATION.pdf — branded NHS report of the
HomeData API Proof of Concept carried out against five real NHS addresses.

Audience: NHS stakeholders + HomeData vendor reviewers.
Author:   Deepak K Rana, Founder, CRM Mates Ltd (deepak@crmmates.com)
"""

import os
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.lib.colors import HexColor, white, black
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak,
    KeepTogether, Preformatted
)
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
from reportlab.pdfgen import canvas

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                   'HOMEDATA_API_POC_VALIDATION.pdf')

# NHS brand palette (same as CDN proposal for consistency)
BRAND_DK   = HexColor('#075F50')
BRAND_MID  = HexColor('#4A6B5E')
BRAND_SAGE = HexColor('#C9D5CB')
BRAND_PALE = HexColor('#EAF4EF')
BRAND_BORDER = HexColor('#C5DCCC')
AMBER      = HexColor('#C9A84C')
AMBER_PALE = HexColor('#FFF8E7')
AMBER_DK   = HexColor('#7A5A00')
INK        = HexColor('#0F172A')
MUTED      = HexColor('#64748B')
MUTED_LT   = HexColor('#94A3B8')
DIVIDER    = HexColor('#E2E8F0')
SUCCESS    = HexColor('#10B981')
SUCCESS_PALE = HexColor('#DCFCE7')
DANGER     = HexColor('#EF4444')
DANGER_PALE = HexColor('#FEE2E2')
WARN       = HexColor('#F59E0B')
WARN_PALE  = HexColor('#FEF3C7')

ss = getSampleStyleSheet()

# ── Styles ──────────────────────────────────────────────────────────────
COVER_TITLE = ParagraphStyle('CoverTitle', parent=ss['Title'],
    fontName='Helvetica-Bold', fontSize=30, textColor=BRAND_DK,
    spaceAfter=4, alignment=TA_LEFT, leading=34)
COVER_SUB = ParagraphStyle('CoverSub', parent=ss['Normal'],
    fontName='Helvetica', fontSize=13, textColor=MUTED,
    spaceAfter=30, alignment=TA_LEFT, leading=19)
COVER_KICK = ParagraphStyle('CoverKick', parent=ss['Normal'],
    fontName='Helvetica-Bold', fontSize=10, textColor=AMBER_DK,
    spaceAfter=4, alignment=TA_LEFT)
H1 = ParagraphStyle('H1', parent=ss['Heading1'],
    fontName='Helvetica-Bold', fontSize=17, textColor=BRAND_DK,
    spaceBefore=14, spaceAfter=8, leading=21, keepWithNext=True)
H2 = ParagraphStyle('H2', parent=ss['Heading2'],
    fontName='Helvetica-Bold', fontSize=12.5, textColor=BRAND_MID,
    spaceBefore=10, spaceAfter=5, leading=16, keepWithNext=True)
H3 = ParagraphStyle('H3', parent=ss['Heading3'],
    fontName='Helvetica-Bold', fontSize=10, textColor=BRAND_DK,
    spaceBefore=6, spaceAfter=3, leading=13, keepWithNext=True)
BODY = ParagraphStyle('Body', parent=ss['BodyText'],
    fontName='Helvetica', fontSize=10, textColor=INK,
    spaceAfter=6, leading=14, alignment=TA_JUSTIFY)
BODY_LEAD = ParagraphStyle('BodyLead', parent=BODY, fontSize=10.5, leading=15)
BULLET = ParagraphStyle('Bullet', parent=BODY,
    leftIndent=14, bulletIndent=4, spaceAfter=3, alignment=TA_LEFT, leading=13.5)
MONO = ParagraphStyle('Mono', parent=ss['Code'],
    fontName='Courier', fontSize=7.8, textColor=INK, leftIndent=6,
    backColor=BRAND_PALE, borderPadding=6, spaceAfter=6, leading=10)
MONO_SMALL = ParagraphStyle('MonoSmall', parent=MONO, fontSize=7.2, leading=9.5)
CELL = ParagraphStyle('Cell', parent=ss['Normal'],
    fontName='Helvetica', fontSize=8.5, textColor=INK, leading=11, alignment=TA_LEFT)
CELL_BOLD = ParagraphStyle('CellBold', parent=CELL,
    fontName='Helvetica-Bold', textColor=BRAND_DK)
CELL_CODE = ParagraphStyle('CellCode', parent=CELL,
    fontName='Courier', fontSize=8, leading=10.5)
CELL_HEADER = ParagraphStyle('CellHeader', parent=CELL_BOLD,
    fontSize=8.5, textColor=white, alignment=TA_LEFT)
CALLOUT = ParagraphStyle('Callout', parent=BODY,
    fontSize=9.5, textColor=INK, leftIndent=8, rightIndent=8,
    spaceBefore=6, spaceAfter=8, leading=13)

# ── Page frame ──────────────────────────────────────────────────────────
def on_later_page(canv, doc):
    canv.saveState()
    w, h = A4
    canv.setFillColor(BRAND_DK)
    canv.rect(0, h - 4*mm, w, 4*mm, stroke=0, fill=1)
    canv.setFillColor(MUTED)
    canv.setFont('Helvetica', 8)
    canv.drawString(15*mm, h - 10*mm,
        'New Home Solutions · HomeData API — POC Validation Report')
    canv.drawRightString(w - 15*mm, h - 10*mm, 'Confidential · April 2026')
    canv.setStrokeColor(DIVIDER)
    canv.setLineWidth(0.5)
    canv.line(15*mm, 13*mm, w - 15*mm, 13*mm)
    canv.setFillColor(MUTED)
    canv.setFont('Helvetica', 8)
    canv.drawString(15*mm, 8*mm, 'CRM Mates Ltd — Deepak K Rana, Founder')
    canv.drawRightString(w - 15*mm, 8*mm, f'Page {doc.page}')
    canv.restoreState()


def on_cover_page(canv, doc):
    canv.saveState()
    w, h = A4
    canv.setFillColor(BRAND_DK)
    canv.rect(0, 0, 8*mm, h, stroke=0, fill=1)
    canv.setFillColor(BRAND_SAGE)
    canv.rect(8*mm, h - 55*mm, w - 8*mm, 55*mm, stroke=0, fill=1)
    canv.setFillColor(BRAND_DK)
    canv.setFont('Helvetica-Bold', 14)
    canv.drawString(20*mm, h - 22*mm, 'NEW HOME SOLUTIONS')
    canv.setFillColor(MUTED)
    canv.setFont('Helvetica', 9)
    canv.drawString(20*mm, h - 28*mm, 'Part Exchange & Assisted Move Specialists')
    canv.setFillColor(BRAND_DK)
    canv.rect(8*mm, 0, w - 8*mm, 22*mm, stroke=0, fill=1)
    canv.setFillColor(white)
    canv.setFont('Helvetica-Bold', 10)
    canv.drawString(20*mm, 13*mm, 'CRM MATES LTD — London')
    canv.setFont('Helvetica', 8.5)
    canv.drawString(20*mm, 8*mm, 'deepak@crmmates.com · 07443 340401 · crmmates.com')
    canv.drawRightString(w - 12*mm, 13*mm, 'POC Validation Report · v2.1')
    canv.drawRightString(w - 12*mm, 8*mm, '24 April 2026')
    canv.restoreState()


# ── Helpers ─────────────────────────────────────────────────────────────
def P(text, style=BODY):
    return Paragraph(text, style)

def bullet(text):
    return Paragraph('• ' + text, BULLET)

def code_block(text):
    # Preformatted keeps newlines and indentation
    return Preformatted(text, MONO_SMALL)

def pill(text, fill, stroke, text_col=white):
    """Small coloured pill (for status badges)."""
    style = ParagraphStyle('Pill', parent=CELL, fontName='Helvetica-Bold',
        fontSize=8, textColor=text_col, alignment=TA_CENTER)
    t = Table([[Paragraph(text, style)]], colWidths=[28*mm], rowHeights=[6.5*mm])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), fill),
        ('BOX', (0,0), (-1,-1), 0.6, stroke),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('LEFTPADDING', (0,0), (-1,-1), 2),
        ('RIGHTPADDING', (0,0), (-1,-1), 2),
    ]))
    return t

def section_divider():
    """Thin sage rule used between sections."""
    t = Table([['']], colWidths=[180*mm], rowHeights=[0.6])
    t.setStyle(TableStyle([('BACKGROUND', (0,0), (-1,-1), BRAND_SAGE)]))
    return t


def _as_para(s, style=CELL):
    return s if hasattr(s, 'wrap') else Paragraph(str(s), style)


def data_table(header, rows, col_widths=None, header_bg=BRAND_DK,
               zebra=True, header_style=None):
    """Build a branded table. `rows` is a list of lists; strings are wrapped
    in CELL paragraphs so they word-break inside the cell."""
    hs = header_style or CELL_HEADER
    wrapped = [[_as_para(c, hs) for c in header]]
    for r in rows:
        wrapped.append([_as_para(c) for c in r])
    t = Table(wrapped, colWidths=col_widths, repeatRows=1)
    style = [
        ('BACKGROUND', (0,0), (-1,0), header_bg),
        ('TEXTCOLOR', (0,0), (-1,0), white),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('LINEBELOW', (0,0), (-1,0), 0.8, BRAND_DK),
        ('GRID', (0,1), (-1,-1), 0.3, DIVIDER),
    ]
    if zebra:
        for i in range(1, len(wrapped)):
            if i % 2 == 0:
                style.append(('BACKGROUND', (0,i), (-1,i), BRAND_PALE))
    t.setStyle(TableStyle(style))
    return t


# ── Document content ────────────────────────────────────────────────────
def build():
    doc = SimpleDocTemplate(OUT, pagesize=A4,
        leftMargin=15*mm, rightMargin=15*mm,
        topMargin=18*mm, bottomMargin=18*mm,
        title='HomeData API — POC Validation Report',
        author='Deepak K Rana, CRM Mates Ltd')
    story = []

    # ── Cover Page ──
    story.append(Spacer(1, 60*mm))
    story.append(P('POC VALIDATION REPORT · V2.1 · APRIL 2026', COVER_KICK))
    story.append(P('HomeData API', COVER_TITLE))
    story.append(P('Integration feasibility, endpoint validation and '
                   'recommended roll-out for New Home Solutions', COVER_SUB))

    meta = Table([
        [P('<b>Client</b>', CELL), P('New Home Solutions (NHS)', CELL)],
        [P('<b>Vendor</b>', CELL), P('HomeData — UK Property Data API (homedata.co.uk)', CELL)],
        [P('<b>Tier tested</b>', CELL), P('Free (100 calls / month), enabled on special request by Quinn Taylor', CELL)],
        [P('<b>Author</b>', CELL), P('Deepak K Rana, Founder, CRM Mates Ltd', CELL)],
        [P('<b>Version</b>', CELL), P('v2.1 — 24 April 2026 (multi-UPRN probe + NHS Sale-only decision; supersedes v2 and v1)', CELL)],
        [P('<b>Status</b>', CELL), P('Market Conflict Detector UNBLOCKED (Sale-only) · AVM server-side 500 pending Quinn', CELL)],
    ], colWidths=[35*mm, 140*mm])
    meta.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (0,-1), BRAND_PALE),
        ('GRID', (0,0), (-1,-1), 0.3, BRAND_BORDER),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(meta)
    story.append(PageBreak())

    # ── 1. Executive Summary ──
    story.append(P('1. Executive Summary', H1))
    story.append(P(
        "HomeData's UK property data API has been validated against "
        "<b>five real NHS application addresses</b> using the Free tier "
        "(100 calls / month) that Quinn Taylor enabled on special request. "
        "A second probing session on 24 April 2026 — after HomeData reopened "
        "access — reshaped the outcome materially.",
        BODY_LEAD))
    story.append(P('v2 outcome (24 April 2026):', H3))
    story.append(bullet('<b>Primary blocker cleared.</b> '
        '<font face="Courier">/api/property_listings/?uprn={uprn}</font> returns HTTP 200 with '
        'paginated listing history (live + historical, with '
        '<font face="Courier">latest_status</font>, '
        '<font face="Courier">latest_price</font>, '
        '<font face="Courier">is_live</font>, '
        '<font face="Courier">is_withdrawn</font>, '
        '<font face="Courier">source</font>, '
        '<font face="Courier">added_date</font>, portal description, images). '
        '<b>Market Conflict Detector is ready to build.</b> The original POC failed on '
        'this only because it probed the dash-form path-style URL '
        '(<font face="Courier">/listings/{uprn}/</font>) rather than the underscore-form '
        'query-string URL (<font face="Courier">/property_listings/?uprn=N</font>).'))
    story.append(bullet('<b>AVM endpoint exists but crashes.</b> '
        '<font face="Courier">/api/avm/?uprn={uprn}</font> returns HTTP 500 for every UPRN tested. '
        'UPRN is accepted as a valid integer (400 if omitted) so the bug is inside HomeData\'s '
        'AVM computation. Needs Quinn. Workaround: '
        '<font face="Courier">predicted_price</font> inside '
        '<font face="Courier">/api/properties/{uprn}/</font> remains usable.'))
    story.append(bullet('<b>/api/valuations/* still 404</b>, despite being in the allow-list. '
        'Likely deprecated — <font face="Courier">/api/avm/*</font> appears to have replaced it.'))
    story.append(bullet('<b>20+ additional endpoints discovered</b> via a 403 allow-list probe '
        'on <font face="Courier">/api/</font> itself. Notable: '
        '<font face="Courier">/crime/*</font>, '
        '<font face="Courier">/deprivation/*</font>, '
        '<font face="Courier">/comparables/*</font>, '
        '<font face="Courier">/agent_stats/*</font>, '
        '<font face="Courier">/solar-assessment/*</font>, '
        '<font face="Courier">/hmlr/*</font>, '
        '<font face="Courier">/boundaries/*</font>, '
        '<font face="Courier">/epc-checker/*</font>. Full list in §4.6.'))
    story.append(P('v1 outcome (23 April 2026, for reference):', H3))
    story.append(bullet('7 endpoints confirmed working; 1 in-spec endpoint returning 404 '
        '(<font face="Courier">/valuations/{uprn}/</font>); all '
        '<font face="Courier">/map/*</font> layers 404; Listings endpoint appeared absent '
        'from the OpenAPI spec.'))
    story.append(Spacer(1, 4*mm))
    story.append(P('<b>Calls consumed:</b> ~30 in v1 · ~30 in v2 · '
        '<b>~60 of 100 monthly allowance</b> used.', CALLOUT))
    story.append(Spacer(1, 2*mm))

    # ── 2. Original NHS Use Cases ──
    story.append(P('2. Original NHS Use Cases', H1))
    rows = [
        ['1 (primary)', 'Market Conflict Detector',
         'Detect when a vendor brings a property to NHS for part-exchange '
         'valuation while also listing it via a traditional estate agent on '
         'Rightmove / Zoopla / OnTheMarket. Nightly sweep across open and '
         'archived applications.'],
        ['2', 'Valuation Tracker (TSK-00047)',
         'Track AVM drift over time for every property in the pipeline; flag '
         'material movements.'],
        ['3', 'Property Enrichment on Create',
         'Pre-fill bedrooms, EPC, build era, sold history, predicted price '
         'when a new application is created from a UPRN.'],
        ['4', 'Vendor Report Area Intel',
         'Inject flood risk, schools, demographics, local price trend into '
         'Agent/Vendor reports.'],
    ]
    story.append(data_table(
        ['Priority', 'Use Case', 'Description'],
        rows, col_widths=[22*mm, 48*mm, 110*mm]))
    story.append(Spacer(1, 4*mm))

    # ── 3. Test Setup ──
    story.append(P('3. Test Setup', H1))

    story.append(P('3.1  API credentials', H2))
    story.append(bullet('<b>Key (Free tier):</b> '
        '<font face="Courier">PIswK2b1.TOGIfMSsAHDGGRh5ExTOPH5iAgMTOXOO</font>'))
    story.append(bullet('<b>Auth header:</b> '
        '<font face="Courier">Authorization: Api-Key PREFIX.SECRET</font> '
        '(single header, dot-separated prefix + secret)'))
    story.append(bullet('<b>Tier allowance:</b> 100 calls / month · 2 req/s · 120 req/min'))

    story.append(P('3.2  Base URL (critical)', H2))
    story.append(bullet('<b>Correct:</b> '
        '<font face="Courier">https://api.homedata.co.uk/api/</font>'))
    story.append(bullet('<b>Trailing slash required on every path.</b> Without it, '
        'the API returns HTTP 301 with <font face="Courier">Location: /api/{path}/</font> — '
        'and the <font face="Courier">Authorization</font> header is stripped on the redirect '
        'by Cloudflare, which means <font face="Courier">curl -L</font> works but most HTTP '
        'clients (including Salesforce <font face="Courier">HttpRequest</font>) will '
        'authenticate the second hop as anonymous.'))
    story.append(bullet('<b>Implication for Apex:</b> always build paths with a trailing '
        'slash; do not rely on follow-redirect behaviour.'))

    story.append(P('3.3  Test addresses — 5 UPRNs across geographic diversity', H2))
    rows = [
        ['10090306711', '4 Skelton Close, Boulton Moor, Derby', 'DE24 5BD', 'New-build estate'],
        ['10000904200', 'Studio 89, 89 Main Street, Egremont', 'CA22 2DJ', 'Pre-1919 rural flat'],
        ['200003320965', '654 Queslett Road, Great Barr, Birmingham', 'B43 7DU', 'Post-war suburban semi'],
        ['100080961272', '123 Hillfield, Hatfield', 'AL10 0TX', 'Commuter-belt flat — linked to live Opportunity'],
        ['10014057896', 'Apartment 9, 9 Meadowgate, Wigan', 'WN6 7QP', 'Modern flat with parking'],
    ]
    story.append(data_table(
        ['UPRN', 'Address', 'Postcode', 'Purpose'],
        rows, col_widths=[28*mm, 72*mm, 22*mm, 58*mm]))

    story.append(PageBreak())

    # ── 4. Endpoint Validation Matrix ──
    story.append(P('4. Endpoint Validation Matrix', H1))

    story.append(P('4.1  Confirmed WORKING (HTTP 200)', H2))
    rows = [
        ['1', '/address/find/?q={postcode|partial}', 'Free', 'Typeahead on application create',
         '5 UPRNs with address + town for DE24 5BD'],
        ['2', '/address/retrieve/{uprn}/', '5', 'Canonical address block',
         'UPRN, USRN, UDPRN, lat/lng, address split'],
        ['3', '/properties/{uprn}/', '1', 'Full property enrichment — 50+ fields',
         'See §5.1'],
        ['4', '/price-growth/{outcode}/', '1', 'YoY trend for vendor reports',
         'DE24 −6.15%, B43 +3.13%, AL10 +7.16%, WN6 −3.02%, CA22 +25.00%'],
        ['5', '/postcode-profile/?postcode=', '1', 'One-shot area summary for vendor reports',
         'Flood risk, census, sold-price median, property breakdown'],
        ['6', '/schools/nearby/?postcode=', '1', 'Schools block in vendor report',
         '20 schools within 3 km, Ofsted ratings, distance, head teacher'],
        ['7', '/demographics/?postcode=', '1', 'Census 2021 intel',
         'Tenure, age, ethnicity, occupation, car ownership'],
    ]
    hdr_working = ParagraphStyle('WorkHdr', parent=CELL_HEADER, textColor=white)
    t = data_table(
        ['#', 'Endpoint', 'Call\nWeight', 'NHS Use', 'Sample Data Returned'],
        rows, col_widths=[8*mm, 58*mm, 14*mm, 45*mm, 55*mm],
        header_bg=SUCCESS, header_style=hdr_working)
    # Monospace the endpoint column
    t.setStyle(TableStyle([
        ('FONTNAME', (1,1), (1,-1), 'Courier'),
        ('FONTSIZE', (1,1), (1,-1), 7.8),
    ]))
    story.append(t)
    story.append(Spacer(1, 3*mm))

    story.append(P('4.2  Endpoints in spec but returning 404', H2))
    rows = [
        ['/valuations/{uprn}/',
         '404 for all 5 UPRNs and all type variants '
         '(sale, rent, no param, query-string).',
         'Pending Quinn clarification. Workaround: predicted_price from /properties/{uprn}/ appears to be the same AVM output.'],
        ['/map/flood-risk/', '404', 'Not a blocker — /postcode-profile/ returns flood-risk band inline.'],
        ['/map/conservation-areas/', '404', 'Nice-to-have for due diligence; not a blocker.'],
        ['/map/listed-buildings/', '404', 'Nice-to-have for due diligence; not a blocker.'],
        ['/map/planning-designations/', '404', 'Nice-to-have; not a blocker.'],
        ['/map/landfill-sites/', '404', 'Nice-to-have; not a blocker.'],
        ['/map/schools/', '404', 'Redundant — /schools/nearby/ works.'],
        ['/map/transport/', '404', 'Not a blocker.'],
    ]
    hdr_warn = ParagraphStyle('WarnHdr', parent=CELL_HEADER)
    t = data_table(
        ['Endpoint', 'Observation', 'Impact'],
        rows, col_widths=[54*mm, 55*mm, 71*mm],
        header_bg=WARN, header_style=hdr_warn)
    t.setStyle(TableStyle([
        ('FONTNAME', (0,1), (0,-1), 'Courier'),
        ('FONTSIZE', (0,1), (0,-1), 7.8),
    ]))
    story.append(t)
    story.append(Spacer(1, 3*mm))

    story.append(P('4.3  Endpoints explicitly blocked (HTTP 403)', H2))
    rows = [[
        '/properties/?postcode=',
        '{"code":"INVALID_API_KEY","message":"Properties unavailable as a list view","status":403}',
        'Bulk list view gated off Free tier — forces per-UPRN lookup. Matches per-call pricing model.',
    ]]
    hdr_danger = ParagraphStyle('DangerHdr', parent=CELL_HEADER)
    t = data_table(
        ['Endpoint', 'Response', 'Note'],
        rows, col_widths=[40*mm, 82*mm, 58*mm],
        header_bg=DANGER, header_style=hdr_danger)
    t.setStyle(TableStyle([
        ('FONTNAME', (0,1), (1,-1), 'Courier'),
        ('FONTSIZE', (0,1), (1,-1), 7.6),
    ]))
    story.append(t)
    story.append(Spacer(1, 3*mm))

    story.append(P('4.4  Listings — original call pattern wrong (resolved in v2)', H2))
    story.append(P('<b>Superseded by §4.6 — retained here for historical context.</b>', CALLOUT))
    story.append(P('On 23 April 2026 the POC concluded that no Listings endpoint existed. '
        'All 10 probed URL variants returned 404:', BODY))
    story.append(code_block(
        'GET /listings/                    -> 404\n'
        'GET /listings/{uprn}/             -> 404\n'
        'GET /listings/?uprn={uprn}        -> 404\n'
        'GET /listings/?postcode={pc}      -> 404\n'
        'GET /property-listings/           -> 404\n'
        'GET /property-listings/?uprn=...  -> 404\n'
        'GET /live-listings/               -> 404\n'
        'GET /listings/search/             -> 404\n'
        'GET /market-listings/             -> 404\n'
        'GET /market-activity/             -> 404'))
    story.append(P('The v2 retest on 24 April 2026 revealed a <b>naming-convention mismatch</b> — '
        'HomeData uses the underscore-form (<font face="Courier">property_listings</font>) '
        'not the dash-form (<font face="Courier">property-listings</font>), and only the '
        'query-string variant is supported (not path-style). See §4.6 for the working call.', BODY))

    story.append(P('4.5  Endpoint valid but no data for tested postcode', H2))
    rows = [[
        '/broadband/?postcode=DE24%205BD',
        '{"error":{"code":"not_found","message":"No broadband data for postcode DE24 5BD"}} (HTTP 404 — genuine "no data", not a routing issue).',
    ]]
    t = data_table(['Endpoint', 'Response'], rows, col_widths=[60*mm, 120*mm])
    t.setStyle(TableStyle([
        ('FONTNAME', (0,1), (1,-1), 'Courier'),
        ('FONTSIZE', (0,1), (1,-1), 7.6),
    ]))
    story.append(t)
    story.append(PageBreak())

    # ── 4.6 Session 2 Retest ──
    story.append(P('4.6  Session 2 Retest — 24 April 2026 (new in v2)', H1))
    story.append(P('<b>Access confirmed restored.</b> Smoke-test of '
        '<font face="Courier">/api/properties/10090306711/</font> returned HTTP 200 with full '
        'property data — the Free-tier key is active.', BODY))

    story.append(P('4.6.1  Discovery mechanism — the 403 allow-list probe', H2))
    story.append(P('Calling the base <font face="Courier">/api/</font> path (with no endpoint) '
        'returned a 403 whose error message explicitly enumerates every endpoint the key is '
        'authorised for:', BODY))
    story.append(code_block(
        'GET /api/\n'
        '-> 403 {"error":{"code":"INVALID_API_KEY",\n'
        '        "message":"API key not authorized for endpoint: /api/.\n'
        '        Allowed: /api/flood-risk/*, /api/property_sale_events/*,\n'
        '        /api/image/*, /api/address/*, /api/avm/*,\n'
        '        /api/map/planning-designations/*, /api/map/conservation-areas/*,\n'
        '        /api/property_listings/*, /api/valuations/*, /api/map/schools/*,\n'
        '        /api/property_sales/*, /api/postcode-profile/*, /api/boundaries/*,\n'
        '        /api/conservation-areas/*, /api/solar-assessment/*,\n'
        '        /api/live-listings/*, /api/property_lr_titles/*, /api/calculators/*,\n'
        '        /api/price_distributions/*, /api/map/landfill-sites/*, /api/crime/*,\n'
        '        /api/council_tax_band/*, /api/price_trends/*, /api/schools/*,\n'
        '        /api/risks/*, /api/properties/*, /api/price-growth/*,\n'
        '        /api/listed-buildings/*, /api/planning-designations/*, /api/hmlr/*,\n'
        '        /api/transport/*, /api/property/*, /api/deprivation/*,\n'
        '        /api/epc-checker/*, /api/agent_stats/*, /api/broadband/*,\n'
        '        /api/furniture/*, /api/amenities/*, /api/map/transport/*,\n'
        '        /api/map/flood-risk/*, /api/planning/*, /api/comparables/*,\n'
        '        /api/map/listed-buildings/*, /api/demographics/*, /api/schema/*"}}'))
    story.append(P('<b>This is the authoritative list of endpoints available on the Free tier.</b> '
        'It supersedes the OpenAPI <font face="Courier">/api/schema/yaml/</font> document '
        '(which timed out during the retest with HTTP 524).', CALLOUT))

    story.append(P('4.6.2  Listings — WORKING (primary blocker cleared)', H2))
    rows_46_2 = [
        ['GET /api/property_listings/?uprn=10090306711',
         'HTTP 200 (11,803 bytes)',
         'Paginated: count=2, 2 listings returned'],
        ['GET /api/property_listings/?uprn=100080961272',
         'HTTP 200 (52 bytes)',
         'count=0 — Hatfield Opp is clean, no dual-listing'],
        ['GET /api/property_listings/10090306711/',
         'HTTP 404', 'Path-style not supported (query-string only)'],
        ['GET /api/live-listings/ (+variants)',
         'HTTP 404',
         'In allow-list but 404 — may be same data or not yet shipped'],
    ]
    hdr_succ = ParagraphStyle('SuccHdr', parent=CELL_HEADER, textColor=white)
    t = data_table(['Call', 'Status', 'Notes'],
        rows_46_2, col_widths=[70*mm, 35*mm, 75*mm],
        header_bg=SUCCESS, header_style=hdr_succ)
    t.setStyle(TableStyle([
        ('FONTNAME', (0,1), (0,-1), 'Courier'),
        ('FONTSIZE', (0,1), (0,-1), 7.6),
    ]))
    story.append(t)
    story.append(Spacer(1, 3*mm))

    story.append(P('Response shape (trimmed, Derby UPRN 10090306711):', BODY))
    story.append(code_block(
        '{\n'
        '  "count": 2,\n'
        '  "next": null,\n'
        '  "previous": null,\n'
        '  "results": [\n'
        '    {\n'
        '      "id": "51967c86-...",\n'
        '      "property": 10090306711,\n'
        '      "display_address": "Skelton Close, Boulton Moor",\n'
        '      "postcode": "DE24 5BD",\n'
        '      "transaction_type": "Sale",\n'
        '      "added_date": "2025-05-19",\n'
        '      "first_offer_date": null,\n'
        '      "first_sold_or_let_date": null,\n'
        '      "sale_cancelled_date": null,\n'
        '      "withdrawn_date": null,\n'
        '      "reduced_date": null,\n'
        '      "is_withdrawn": true,\n'
        '      "is_live": true,\n'
        '      "latest_status": "For sale",\n'
        '      "latest_price": 155000,\n'
        '      "is_new_build": false,\n'
        '      "listing_property_type": "Semi-Detached",\n'
        '      "bedrooms": 3,\n'
        '      "bathrooms": 2,\n'
        '      "ownership": "Freehold",\n'
        '      "source": "Home.co.uk",\n'
        '      "images": ["https://api.homedata.co.uk/api/images/p/...", "..."]\n'
        '    }\n'
        '  ]\n'
        '}'))
    story.append(Spacer(1, 2*mm))

    # ── Multi-UPRN probe (v2.1) ──
    story.append(P('Multi-UPRN probe — 24 April 2026 (v2.1 findings)', H3))
    rows_46_probe = [
        ['10090306711',  'Derby, Skelton Close',        '2',  'Home.co.uk x2', 'Sale x 2'],
        ['200003320965', 'Birmingham, Queslett Rd',     '0',  '—',             '—'],
        ['10014057896',  'Wigan, Meadowgate',           '2',  'Home.co.uk x2', 'For rent x 2'],
        ['10000904200',  'Egremont, Main St',           '0',  '—',             '—'],
        ['100080961272', 'Hatfield (live Opp 006KG...)','0',  '—',             '—'],
    ]
    t = data_table(
        ['UPRN', 'Property', 'count', 'source', 'transaction_type'],
        rows_46_probe, col_widths=[28*mm, 62*mm, 14*mm, 32*mm, 44*mm])
    t.setStyle(TableStyle([
        ('FONTNAME', (0,1), (0,-1), 'Courier'),
        ('FONTSIZE', (0,1), (0,-1), 7.6),
    ]))
    story.append(t)
    story.append(Spacer(1, 3*mm))

    story.append(P('Confirmed patterns:', H3))
    story.append(bullet('<b>1. source is uniformly <font face="Courier">"Home.co.uk"</font></b> '
        'across all 4 listings returned. HomeData is pulling from this single aggregator — '
        '<b>the endpoint does NOT tell us which specific portal</b> (Rightmove / Zoopla / '
        'OnTheMarket) the vendor listed on. Home.co.uk aggregates all three, so a match here '
        'means "appears on at least one of them."'))
    story.append(bullet('<b>2. <font face="Courier">is_live</font> AND '
        '<font face="Courier">is_withdrawn</font> are BOTH <font face="Courier">true</font></b> '
        'on every record. These flags are NOT simple opposites — <font face="Courier">is_live</font> '
        'likely means "in HomeData\'s current snapshot" and <font face="Courier">is_withdrawn</font> '
        'means "portal flagged withdrawn at last crawl." The original filter '
        '(<font face="Courier">is_live AND NOT is_withdrawn</font>) would match zero records. '
        '<b>Use <font face="Courier">latest_status</font> as the source of truth</b> instead.'))
    story.append(bullet('<b>3. Historical records included.</b> Wigan returned a 2008 listing '
        '(£425/mo) alongside a 2025 one. The API returns full lifetime history per UPRN — '
        'must filter by <font face="Courier">added_date</font> recency (≤180 days).'))
    story.append(bullet('<b>4. Both Sale and Rent listings returned.</b> Wigan came back as '
        '<font face="Courier">For rent x 2</font>. <b>Must filter '
        '<font face="Courier">transaction_type == "Sale"</font>.</b> Decision confirmed with '
        'NHS (Deepak/Will, 2026-04-24): rental conflicts are NOT in scope.'))
    story.append(bullet('<b>5. Agent data is patchy on older records.</b> The 2008 Wigan record '
        'has <font face="Courier">agent_name: null</font>. Modern (~2020+) records have '
        'populated agent fields. Recency filter naturally excludes sparse historical rows.'))
    story.append(bullet('<b>6. <font face="Courier">count=0</font> is common</b> — 3 of 5 test '
        'UPRNs had zero listings. For the Market Conflict Detector, this is a clean '
        '"no conflict" signal.'))

    story.append(P('Extra fields returned (not in the trimmed example above)', H3))
    story.append(P('The full response also includes <b>rich estate-agent detail</b> — arguably '
        'more useful than portal identity for NHS, because <font face="Courier">agent_branch_id</font> '
        'can be cross-referenced against NHS\'s Preferred Estate Agent list in Salesforce:', BODY))
    story.append(code_block(
        '{\n'
        '  "agent_name":              "Hannells Estate Agents",\n'
        '  "agent_branch_name":       "Chellaston",\n'
        '  "agent_sales_phone":       "01332 705505",\n'
        '  "agent_lettings_phone":    "01332 294396",\n'
        '  "agent_head_office_email": "chellaston@hannells.co.uk",\n'
        '  "agent_logo":              "agents/20735/logo.png",\n'
        '  "agent_group_name":        "Hannells Estate Agents",\n'
        '  "agent_branch_id":         53652,\n'
        '  "loki_property_type":      "Semi-Detached",\n'
        '  "audit_required":          false,\n'
        '  "is_commercial":           false,\n'
        '  "has_garden":              null,\n'
        '  "has_parking":             null\n'
        '}'))
    story.append(P('Redacted on Free tier (upsell to paid):', BODY))
    story.append(code_block(
        '{\n'
        '  "full_address": "Contact sales for full address data - hello@homedata.co.uk",\n'
        '  "uprn":         "Contact sales for UPRN - hello@homedata.co.uk"\n'
        '}'))
    story.append(P('The <font face="Courier">property</font> field already gives us the UPRN '
        'as an integer, so the redaction of the string <font face="Courier">uprn</font> '
        'does not cost us anything.', BODY))

    story.append(P('Market Conflict Detector — call pattern for nightly sweep '
        '(v2.1, NHS-confirmed Sale-only)', H3))
    story.append(code_block(
        'for each open Opportunity with a UPRN:\n'
        '    GET /api/property_listings/?uprn={uprn}\n'
        '    candidates = results filtered by:\n'
        '        - transaction_type == "Sale"      (NHS scope - excludes rental)\n'
        '        - latest_status    == "For sale"  (reliable live-listing signal)\n'
        '        - days_since(added_date) < 180    (recency guard vs stale history)\n'
        '    if candidates:\n'
        '        flag Opportunity with:\n'
        '          competitor_agent   = agent_name + " - " + agent_branch_name\n'
        '          agent_phone        = agent_sales_phone\n'
        '          agent_email        = agent_head_office_email\n'
        '          agent_branch_id    = agent_branch_id  (cross-ref vs NHS Preferred Agents)\n'
        '          external_price     = latest_price\n'
        '          listing_added_date = added_date\n'
        '          source             = source   (currently always "Home.co.uk")'))
    story.append(P('<b>Why agent identity beats portal identity for NHS:</b> a single listing '
        'appears on Rightmove + Zoopla + OnTheMarket simultaneously — knowing the portal tells '
        'us nothing new. Knowing <i>which estate agent</i> the vendor has engaged is the '
        'actionable signal, and <font face="Courier">agent_branch_id</font> lets us cross-reference '
        'against NHS\'s Preferred Estate Agent list in Salesforce.', CALLOUT))

    story.append(P('4.6.3  AVM — exists but server-side bug', H2))
    rows_46_3 = [
        ['GET /api/avm/', 'HTTP 400',
         '{"error":{"code":"invalid_uprn","message":"uprn is required and must be an integer"}}'],
        ['GET /api/avm/10090306711/', 'HTTP 404', 'Path-style not supported'],
        ['GET /api/avm/?uprn=10090306711', 'HTTP 500',
         'HTML error page — HomeData server-side crash'],
        ['GET /api/avm/?uprn=10090306711&postcode=DE24%205BD', 'HTTP 500', 'Same'],
        ['POST /api/avm/ (JSON body)', 'HTTP 405', 'Method "POST" not allowed'],
    ]
    hdr_warn = ParagraphStyle('WarnHdr2', parent=CELL_HEADER)
    t = data_table(['Call', 'Status', 'Body'],
        rows_46_3, col_widths=[70*mm, 20*mm, 90*mm],
        header_bg=WARN, header_style=hdr_warn)
    t.setStyle(TableStyle([
        ('FONTNAME', (0,1), (0,-1), 'Courier'),
        ('FONTNAME', (2,1), (2,-1), 'Courier'),
        ('FONTSIZE', (0,1), (-1,-1), 7.4),
    ]))
    story.append(t)
    story.append(Spacer(1, 2*mm))
    story.append(P('UPRN is accepted as valid (no 400 when supplied), so the bug is inside the '
        'AVM computation path. <b>This needs reporting to Quinn</b> — not a client-side '
        'call-pattern issue. Workaround: <font face="Courier">predicted_price</font> inside '
        '<font face="Courier">/api/properties/{uprn}/</font> remains available.', CALLOUT))

    story.append(P('4.6.4  /api/valuations/* — still 404 (likely deprecated)', H2))
    story.append(P('Same behaviour as v1: every variant returns '
        '<font face="Courier">RESOURCE_NOT_FOUND</font>. The path is in the allow-list but has '
        'no handler. Probable explanation: HomeData replaced '
        '<font face="Courier">/valuations/</font> with <font face="Courier">/avm/</font> but '
        'left the old path in the authorisation layer. Needs Quinn to confirm.', BODY))

    story.append(P('4.6.5  Newly-discovered endpoints — not probed yet', H2))
    story.append(P('20 endpoints surfaced by the 403 allow-list probe that were never tried '
        'in v1. These will need individual discovery (the OpenAPI schema endpoint was timing '
        'out during the retest):', BODY))
    rows_46_5 = [
        ['/api/crime/*',             'Vendor report — area crime stats'],
        ['/api/deprivation/*',       'Vendor report — IMD deprivation index'],
        ['/api/comparables/*',       'Valuation support — classic AVM comps'],
        ['/api/agent_stats/*',       'Estate-agent quality scoring — drives NHS agent-ranking'],
        ['/api/solar-assessment/*',  'EPC / renewables section of vendor report'],
        ['/api/hmlr/*',              'HM Land Registry — title data'],
        ['/api/boundaries/*',        'Parcel boundary geometry'],
        ['/api/epc-checker/*',       'EPC lookup (complement to /properties/{uprn}/)'],
        ['/api/council_tax_band/*',  'Area stats'],
        ['/api/price_trends/*',      'YoY trend (richer than /price-growth/?)'],
        ['/api/price_distributions/*','Price distribution bands per postcode'],
        ['/api/property_sales/*',    'Sold history per UPRN or postcode'],
        ['/api/property_sale_events/*','Individual sale events'],
        ['/api/property_lr_titles/*','Land Registry title docs'],
        ['/api/planning/*',          'Planning application history'],
        ['/api/calculators/*',       'SDLT, yield, rental calculators'],
        ['/api/amenities/*',         'Nearest shops, parks, transport'],
        ['/api/furniture/*',         'Furnishings/layout — unclear use'],
        ['/api/risks/*',             'Aggregate risk score'],
        ['/api/image/*',             'Image-by-id (used via images[] in listings)'],
    ]
    t = data_table(['Endpoint', 'Likely use for NHS'],
        rows_46_5, col_widths=[58*mm, 122*mm])
    t.setStyle(TableStyle([
        ('FONTNAME', (0,1), (0,-1), 'Courier'),
        ('FONTSIZE', (0,1), (0,-1), 7.6),
    ]))
    story.append(t)
    story.append(Spacer(1, 2*mm))
    story.append(P('<b>Recommend:</b> ask Quinn for docs, or ping each with a known UPRN once the '
        'proper OpenAPI schema is available.', BODY))
    story.append(PageBreak())

    # ── 5. Sample Responses ──
    story.append(P('5. Sample Responses (Real NHS Addresses)', H1))

    story.append(P('5.1  /properties/10090306711/ — 4 Skelton Close, Derby', H2))
    story.append(P('Trimmed highlights (full field list is 50+):', BODY))
    story.append(code_block(
        '{\n'
        '  "uprn": 10090306711,\n'
        '  "full_address": "4 SKELTON CLOSE, BOULTON MOOR, DERBY, DE24 5BD",\n'
        '  "property_type": "Semi-Detached",\n'
        '  "predicted_bedrooms": 3,\n'
        '  "floors": 2,\n'
        '  "construction_age_band": "2010-2019",\n'
        '  "construction_material": "Brick Or Block Or Stone",\n'
        '  "roof_material": "Tile Or Stone Or Slate",\n'
        '  "has_solar_panels": false,\n'
        '  "has_garden": true,\n'
        '  "has_parking": true,\n'
        '  "epc_floor_area": 63,\n'
        '  "current_energy_efficiency": 82,\n'
        '  "potential_energy_efficiency": 96,\n'
        '  "epc_potential_renovations": "Solar water heating; Solar PV, 2.5 kWp",\n'
        '  "last_sold_price": 130000,\n'
        '  "last_sold_date": "2020-02-01",\n'
        '  "last_sold_adjusted_price": 174962,\n'
        '  "predicted_price": 174962,\n'
        '  "latitude": 52.8811298,\n'
        '  "longitude": -1.4123722\n'
        '}'))

    story.append(P('5.2  /postcode-profile/?postcode=DE24%205BD', H2))
    story.append(code_block(
        '{\n'
        '  "postcode": "DE24 5BD",\n'
        '  "outcode": "DE24",\n'
        '  "sold_prices": {\n'
        '    "median_sold_price": 195000,\n'
        '    "sale_count": 1390,\n'
        '    "period_start": "2024-04-23",\n'
        '    "period_end":   "2026-02-20"\n'
        '  },\n'
        '  "census": { "population_total": 9295, "households_total": 3876, ... },\n'
        '  "environmental_risk": {\n'
        '    "flood": { "flood_surface_water": { "risk_band": "High" } },\n'
        '    "overall_risk": "High"\n'
        '  },\n'
        '  "properties": {\n'
        '    "total": 28774,\n'
        '    "type_breakdown": {\n'
        '      "Flat": 3456, "Semi-Detached": 10831, "Terraced": 7507,\n'
        '      "Detached": 4563, "Unknown": 2417\n'
        '    }\n'
        '  }\n'
        '}'))

    story.append(P('5.3  /price-growth/DE24/', H2))
    story.append(code_block(
        '{\n'
        '  "outcode": "DE24",\n'
        '  "current_period": { "from": "2025-04-23", "to": "2026-02-20",\n'
        '                      "median_sold_price": 185000, "sale_count": 460 },\n'
        '  "prior_period":   { "from": "2024-04-23", "to": "2025-04-17",\n'
        '                      "median_sold_price": 197125, "sale_count": 930 },\n'
        '  "yoy_change_pct": -6.15,\n'
        '  "yoy_change_gbp": -12125,\n'
        '  "trend": "falling",\n'
        '  "data_quality": "good"\n'
        '}'))

    story.append(PageBreak())

    # ── 6. NHS Use-Case Impact ──
    story.append(P('6. NHS Use-Case Impact (updated in v2)', H1))
    rows = [
        ['Market Conflict Detector (primary)', 'PROCEED — Sale-only (v2.1)',
         'Call pattern confirmed: GET /api/property_listings/?uprn={uprn}. '
         'Filter: transaction_type == "Sale" AND latest_status == "For sale" AND added_date '
         'within 180 days. NHS-confirmed (2026-04-24) that rental conflicts are NOT in scope. '
         'Key output fields: agent_name, agent_branch_name, agent_branch_id (cross-ref vs NHS '
         'Preferred Agents), latest_price, agent_head_office_email, agent_sales_phone.'],
        ['Valuation Tracker (TSK-00047)', 'Proceed with "lite"',
         'Use predicted_price from /properties/{uprn}/ as the AVM value. '
         '/api/avm/?uprn=N is in scope but currently 500s — use the properties-endpoint '
         'fallback until Quinn fixes.'],
        ['Property Enrichment on Create', 'PROCEED',
         '/properties/{uprn}/ returns everything we need in a single 1-weight call.'],
        ['Vendor Report Area Intel', 'PROCEED (baseline)',
         '/postcode-profile/ + /schools/nearby/ + /price-growth/{outcode}/ covers '
         'flood risk, schools, demographics, price trend. §4.6 identifies /crime/, '
         '/deprivation/, /amenities/, /comparables/, /agent_stats/ as v2 enrichments worth probing.'],
    ]
    story.append(data_table(
        ['Use Case', 'Status', 'Rationale'],
        rows, col_widths=[52*mm, 30*mm, 98*mm]))
    story.append(Spacer(1, 3*mm))

    # ── 7. Recommended Salesforce Implementation ──
    story.append(P('7. Recommended Salesforce Implementation', H1))

    story.append(P('7.1  Named Credential', H2))
    story.append(bullet('<b>Label:</b> HomeData API'))
    story.append(bullet('<b>Name:</b> HomeData_API'))
    story.append(bullet('<b>URL:</b> <font face="Courier">https://api.homedata.co.uk/api</font>'))
    story.append(bullet('<b>Identity Type:</b> Named Principal'))
    story.append(bullet('<b>Auth Protocol:</b> Password Authentication (or Custom Header)'))
    story.append(bullet('<b>Custom Header:</b> '
        '<font face="Courier">Authorization: Api-Key {!$Credential.Password}</font> — '
        'store the full <font face="Courier">PREFIX.SECRET</font> as password.'))

    story.append(P('7.2  Remote Site Setting', H2))
    story.append(bullet('<b>Name:</b> HomeData_API'))
    story.append(bullet('<b>URL:</b> <font face="Courier">https://api.homedata.co.uk</font>'))

    story.append(P('7.3  Custom Setting (NHS_API_Config__c) — new fields', H2))
    story.append(bullet('<font face="Courier">HomeData_Base_URL__c</font> '
        '(default <font face="Courier">https://api.homedata.co.uk/api</font>)'))
    story.append(bullet('<font face="Courier">HomeData_API_Key__c</font> '
        '(the full <font face="Courier">prefix.secret</font>)'))
    story.append(bullet('<font face="Courier">HomeData_Enabled__c</font> '
        '(Checkbox — kill-switch)'))
    story.append(bullet('<font face="Courier">HomeData_Monthly_Call_Budget__c</font> '
        '(Number — default 100, guards against tier overrun)'))

    story.append(P('7.4  Apex Callout Skeleton', H2))
    story.append(code_block(
        'public with sharing class NHSHomeDataService {\n'
        "    private static final String BASE_URL = 'https://api.homedata.co.uk/api';\n"
        '\n'
        '    public static Map<String, Object> getProperty(String uprn) {\n'
        '        HttpRequest req = new HttpRequest();\n'
        "        req.setEndpoint(BASE_URL + '/properties/' + uprn + '/');\n"
        "        req.setMethod('GET');\n"
        "        req.setHeader('Authorization', 'Api-Key ' + getApiKey());\n"
        "        req.setHeader('Accept', 'application/json');\n"
        '        req.setTimeout(15000);\n'
        '        HttpResponse res = new Http().send(req);\n'
        '        if (res.getStatusCode() != 200) {\n'
        "            throw new CalloutException('HomeData /properties/' + uprn\n"
        "                + '/ returned ' + res.getStatusCode() + ': ' + res.getBody());\n"
        '        }\n'
        '        return (Map<String, Object>) JSON.deserializeUntyped(res.getBody());\n'
        '    }\n'
        '\n'
        '    private static String getApiKey() {\n'
        '        NHS_API_Config__c cfg = NHS_API_Config__c.getOrgDefaults();\n'
        '        return cfg.HomeData_API_Key__c;\n'
        '    }\n'
        '}'))
    story.append(P('<b>Important:</b> the path MUST end with <font face="Courier">/</font>. '
        'Without it, the 301 redirect strips the <font face="Courier">Authorization</font> '
        'header — Salesforce <font face="Courier">Http</font> does not auto-follow redirects '
        'by default, so the call will fail with 301 rather than authenticating against the '
        'final URL.', CALLOUT))

    story.append(P('7.5  Call-budget guard', H2))
    story.append(P('Track monthly calls in a custom object '
        '(<font face="Courier">HomeData_Call_Log__c</font>) and refuse callouts when the '
        'counter hits <font face="Courier">HomeData_Monthly_Call_Budget__c</font>. Prevents '
        'silent overage charges once NHS upgrades beyond the Free tier.', BODY))

    story.append(PageBreak())

    # ── 8. Pricing ──
    story.append(P('8. Pricing (Tiers)', H1))
    rows = [
        ['Free',    '£0',    '100',     '2 req/s · 120 req/min'],
        ['Starter', '£49',   '5,000',   '—'],
        ['Growth',  '£149',  '25,000',  '—'],
        ['Pro',     '£349',  '100,000', '—'],
        ['Scale',   '£699',  '500,000', '—'],
    ]
    story.append(data_table(
        ['Tier', 'Monthly', 'Calls / month', 'Rate limit'],
        rows, col_widths=[30*mm, 30*mm, 50*mm, 70*mm]))

    story.append(Spacer(1, 3*mm))
    story.append(P('Call weighting', H2))
    story.append(bullet('Most endpoints = 1 call.'))
    story.append(bullet('<font face="Courier">/address/retrieve/</font> = 5.'))
    story.append(bullet('Comparables = 10 (endpoint not currently exposed).'))
    story.append(bullet('Solar = 5.'))

    story.append(P('NHS projected monthly volume (rough estimate, needs refinement)', H2))
    story.append(bullet('~200 new applications × 1 call (properties) = <b>200</b>'))
    story.append(bullet('~600 active applications × 1 call/week (valuation tracker) = <b>2,400</b>'))
    story.append(bullet('~50 vendor reports × 3 calls '
        '(postcode-profile + schools + price-growth) = <b>150</b>'))
    story.append(bullet('<b>Total: ~2,750 / month → Starter tier (£49) sufficient for v1.</b>'))
    story.append(Spacer(1, 2*mm))
    story.append(P('If Market Conflict Detector is unblocked and sweeps all properties nightly: '
        '~600 × 30 = 18,000 / month → Growth tier (£149).', CALLOUT))

    # ── 9. Open Questions with HomeData (v2.1) ──
    story.append(P('9. Open Questions with HomeData — v2.1 (to email Quinn, 24 April 2026)', H1))
    story.append(P('The v1 questions (sent 23 April) are resolved or reframed by the v2/v2.1 retests:', BODY))
    story.append(bullet('<strike>Listings endpoint — is it shipped?</strike> → <b>Resolved.</b> '
        '<font face="Courier">/api/property_listings/?uprn={uprn}</font> works. '
        'Retest confirmed against 5 UPRNs in v2.1.'))
    story.append(bullet('<strike>/valuations/{uprn}/ 404 — tier-gated or call pattern wrong?</strike> '
        '→ <b>Superseded.</b> <font face="Courier">/api/valuations/*</font> appears deprecated; '
        '<font face="Courier">/api/avm/*</font> has taken its place. See new Q3.'))
    story.append(Spacer(1, 3*mm))
    story.append(P('<b>New questions for Quinn:</b>', H3))
    story.append(bullet('<b>1. <font face="Courier">/api/avm/?uprn={uprn}</font> returns HTTP 500</b> '
        'for every UPRN tested (Derby 10090306711, Hatfield 100080961272, Birmingham '
        '200003320965). UPRN validates (400 if omitted) but the AVM computation crashes. '
        'Known server-side issue? ETA for fix?'))
    story.append(bullet('<b>2. <font face="Courier">/api/valuations/*</font> is in the Free-tier '
        'allow-list but every variant 404s.</b> Safe to treat as deprecated, or is there a '
        'required call shape we\'re missing?'))
    story.append(bullet('<b>3. <font face="Courier">/api/live-listings/*</font> is in the allow-list '
        'but 404s.</b> Same data as <font face="Courier">/api/property_listings/</font> or a '
        'separate feed? If separate, documentation please.'))
    story.append(bullet('<b>4. 20 newly-surfaced endpoints in the allow-list</b> (full list in §4.6.5) '
        '— please share OpenAPI docs or a concise schema. '
        '<font face="Courier">/api/schema/yaml/</font> is currently returning HTTP 524 '
        '(Cloudflare timeout).'))
    story.append(bullet('<b>5. <font face="Courier">predicted_price</font> inside '
        '<font face="Courier">/api/properties/{uprn}/</font></b> — is this the same underlying AVM '
        'that <font face="Courier">/api/avm/</font> will eventually surface, or a separate estimate?'))
    story.append(bullet('<b>6. <font face="Courier">is_live</font> and '
        '<font face="Courier">is_withdrawn</font> semantics on '
        '<font face="Courier">/api/property_listings/</font>.</b> Every record we probed '
        '(Derby x 2, Wigan x 2) has BOTH flags set to <font face="Courier">true</font> '
        'simultaneously. Our Market Conflict Detector logic originally assumed they were '
        'opposites (<font face="Courier">is_live AND NOT is_withdrawn</font>) but that would '
        'match zero records. Can you confirm the intended semantics? We are currently using '
        '<font face="Courier">latest_status == "For sale"</font> as the reliable live-listing '
        'signal — is that the recommended approach?'))
    story.append(bullet('<b>7. <font face="Courier">source</font> field returns '
        '<font face="Courier">"Home.co.uk"</font> on every record.</b> Do paid tiers surface '
        'the underlying portal identity (Rightmove / Zoopla / OnTheMarket), or is Home.co.uk '
        'the only feed HomeData ingests?'))

    # ── 10. Next Steps (v2.1) ──
    story.append(P('10. Next Steps (updated 24 April 2026)', H1))
    rows = [
        ['P1', 'Build Market Conflict Detector against /api/property_listings/?uprn={uprn} — '
               'nightly Schedulable Apex sweep across open Opportunities with a UPRN. '
               'Filter: transaction_type == "Sale" AND latest_status == "For sale" AND '
               'added_date within 180 days. Flag Opportunity with agent_name, agent_branch_name, '
               'agent_branch_id (Preferred-Agent cross-ref), latest_price, agent_sales_phone, '
               'agent_head_office_email, added_date. Sale-only confirmed with NHS 2026-04-24. '
               'TSK-00082 parent.',
         'Deepak', 'Unblocked — ready to build'],
        ['P1', 'Email Quinn with v2.1 questions (§9) — AVM 500, /valuations/* deprecation, '
               'live-listings semantics, is_live/is_withdrawn semantics, source/portal identity, '
               'schema docs',
         'Deepak', 'Draft pending'],
        ['P2', 'Wire /properties/{uprn}/ into NHS Application create flow (auto-enrichment)',
         'Deepak', 'Not started'],
        ['P2', 'Add HomeData intel block to Vendor Report template '
               '(/postcode-profile/ + /schools/nearby/ + /price-growth/{outcode}/)',
         'Deepak', 'Not started'],
        ['P2', 'Probe /api/crime/, /api/deprivation/, /api/comparables/, /api/agent_stats/ '
               'with a known UPRN — budget ~5 calls',
         'Deepak', 'Not started'],
        ['P3', 'Build Valuation Tracker "lite" using predicted_price from /properties/{uprn}/ '
               '(fallback until /api/avm/ is fixed)',
         'Deepak', 'Not started'],
        ['P3', 'Add NHS_API_Config__c fields for HomeData (base URL, API key, enabled kill-switch, monthly call budget)',
         'Deepak', 'Not started'],
        ['P4', 'Upgrade from Free tier to Starter (£49) once Market Conflict Detector '
               'volume estimates are firm',
         'Gina / Deepak', 'Pending v1 volume data'],
    ]
    story.append(data_table(
        ['Priority', 'Action', 'Owner', 'Status'],
        rows, col_widths=[18*mm, 92*mm, 28*mm, 42*mm]))

    # ── 11. Change Log ──
    story.append(P('11. Change Log', H1))
    rows = [
        ['2026-04-23',
         'Initial POC validation. 5 UPRNs tested against 15+ endpoints. Report v1 created. Quinn emailed.',
         'Deepak K Rana'],
        ['2026-04-24',
         'v2 retest after HomeData reopened API access. Market Conflict Detector UNBLOCKED — '
         'correct path is /api/property_listings/?uprn={uprn} (underscore, query-string form). '
         'AVM endpoint discovered but server-side 500 bug. /api/valuations/* still 404 — appears '
         'deprecated. 20 additional Free-tier endpoints surfaced via a 403 allow-list probe on '
         '/api/. Calls used: ~30 in v2 (~60/100 total this month).',
         'Deepak K Rana'],
        ['2026-04-24',
         'v2.1 — multi-UPRN probe + Sale-only decision. Probed 3 additional UPRNs (Birmingham, '
         'Wigan, Egremont) to confirm listings-endpoint behaviour. Key findings: (1) source is '
         'uniformly "Home.co.uk" — we do not get the specific portal (Rightmove / Zoopla / '
         'OnTheMarket). (2) is_live AND is_withdrawn are both true on every record — must use '
         'latest_status as the live-listing signal, not these booleans. (3) Endpoint returns '
         'full lifetime history; filter by added_date recency. (4) Both sale + rent listings '
         'returned. NHS confirmed rental conflicts are NOT in scope — Sale-only filter agreed. '
         '(5) Rich estate-agent fields available (agent_name, agent_branch_name, agent_branch_id, '
         'agent_sales_phone, agent_head_office_email) — more actionable than portal identity for '
         'NHS Preferred-Agent cross-ref. Revised MCD call pattern locked in. '
         'Calls used: ~3 in v2.1 (~63/100 total).',
         'Deepak K Rana'],
    ]
    story.append(data_table(
        ['Date', 'Change', 'Author'],
        rows, col_widths=[22*mm, 128*mm, 30*mm]))

    # ── Build ──
    doc.build(
        story,
        onFirstPage=on_cover_page,
        onLaterPages=on_later_page,
    )
    print(f'Generated: {OUT}')


if __name__ == '__main__':
    build()
