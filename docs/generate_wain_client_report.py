#!/usr/bin/env python3
"""Generate WAIN_TIMELINE_CLIENT_REPORT.pdf — a client-facing delivery report for
NHS on the Wain Homes Timeline Valuations rollout.

Audience: NHS leadership (Will Smith & team), Wain Homes stakeholders.
Tone: business-value first, delivery confidence, minimal jargon, branded.
"""

import os
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.lib.colors import HexColor, white
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, Flowable
)
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
from reportlab.pdfgen import canvas

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'WAIN_TIMELINE_CLIENT_REPORT.pdf')

# NHS brand palette
BRAND_DK = HexColor('#075F50')
BRAND_MID = HexColor('#4A6B5E')
BRAND_SAGE = HexColor('#C9D5CB')
BRAND_PALE = HexColor('#EAF4EF')
BRAND_BORDER = HexColor('#C5DCCC')
AMBER = HexColor('#C9A84C')
AMBER_PALE = HexColor('#FFF8E7')
AMBER_DK = HexColor('#7A5A00')
INK = HexColor('#0F172A')
INK_NAVY = HexColor('#0D1E4A')
MUTED = HexColor('#64748B')
MUTED_LT = HexColor('#94A3B8')
DIVIDER = HexColor('#E2E8F0')
STD_BLUE = HexColor('#2563EB')
STD_BLUE_PALE = HexColor('#DBEAFE')
TL_AMBER = HexColor('#B45309')
TL_AMBER_PALE = HexColor('#FEF3C7')
SUCCESS = HexColor('#10B981')


# ── Styles ─────────────────────────────────────────────────────────────
ss = getSampleStyleSheet()

COVER_TITLE = ParagraphStyle('CoverTitle', parent=ss['Title'],
    fontName='Helvetica-Bold', fontSize=32, textColor=BRAND_DK,
    spaceAfter=4, alignment=TA_LEFT, leading=36)
COVER_SUB = ParagraphStyle('CoverSub', parent=ss['Normal'],
    fontName='Helvetica', fontSize=14, textColor=MUTED,
    spaceAfter=30, alignment=TA_LEFT, leading=20)
COVER_KICK = ParagraphStyle('CoverKick', parent=ss['Normal'],
    fontName='Helvetica-Bold', fontSize=10, textColor=AMBER_DK,
    spaceAfter=4, alignment=TA_LEFT, letterSpacing=2)

H1 = ParagraphStyle('H1', parent=ss['Heading1'],
    fontName='Helvetica-Bold', fontSize=18, textColor=BRAND_DK,
    spaceBefore=18, spaceAfter=10, leading=22)
H2 = ParagraphStyle('H2', parent=ss['Heading2'],
    fontName='Helvetica-Bold', fontSize=13, textColor=BRAND_MID,
    spaceBefore=14, spaceAfter=6, leading=16)
H3 = ParagraphStyle('H3', parent=ss['Heading3'],
    fontName='Helvetica-Bold', fontSize=10, textColor=BRAND_DK,
    spaceBefore=8, spaceAfter=4, leading=13)

BODY = ParagraphStyle('Body', parent=ss['BodyText'],
    fontName='Helvetica', fontSize=10.5, textColor=INK,
    spaceAfter=7, leading=15, alignment=TA_JUSTIFY)
BODY_LEAD = ParagraphStyle('BodyLead', parent=BODY,
    fontSize=11, leading=17, textColor=INK)
BULLET = ParagraphStyle('Bullet', parent=BODY,
    leftIndent=16, bulletIndent=4, spaceAfter=4, alignment=TA_LEFT, leading=14)
QUOTE = ParagraphStyle('Quote', parent=BODY,
    fontSize=11, fontName='Helvetica-Oblique', textColor=BRAND_DK,
    leftIndent=14, rightIndent=14, spaceAfter=10, leading=17, alignment=TA_LEFT)
SMALL = ParagraphStyle('Small', parent=ss['Normal'],
    fontName='Helvetica', fontSize=8.5, textColor=MUTED, alignment=TA_LEFT, leading=12)
CAPTION = ParagraphStyle('Caption', parent=SMALL,
    fontName='Helvetica-Oblique', alignment=TA_CENTER, spaceAfter=12)


# ── Header / Footer ─────────────────────────────────────────────────────
def on_later_page(canv: canvas.Canvas, doc):
    canv.saveState()
    w, h = A4
    # slim green rule at top
    canv.setFillColor(BRAND_DK)
    canv.rect(0, h - 4*mm, w, 4*mm, stroke=0, fill=1)
    canv.setFillColor(MUTED)
    canv.setFont('Helvetica', 8.5)
    canv.drawString(15*mm, h - 10*mm, 'New Home Solutions · Wain Homes Timeline Valuations · Delivery Report')
    canv.drawRightString(w - 15*mm, h - 10*mm, 'Confidential · April 2026')
    # Footer
    canv.setStrokeColor(DIVIDER)
    canv.setLineWidth(0.5)
    canv.line(15*mm, 13*mm, w - 15*mm, 13*mm)
    canv.setFillColor(MUTED)
    canv.setFont('Helvetica', 8)
    canv.drawString(15*mm, 8*mm, 'Delivered by CRM Mates Ltd — Deepak K Rana, Lead Consultant')
    canv.drawRightString(w - 15*mm, 8*mm, f'Page {doc.page}')
    canv.restoreState()


def on_cover_page(canv: canvas.Canvas, doc):
    canv.saveState()
    w, h = A4
    # Left accent bar
    canv.setFillColor(BRAND_DK)
    canv.rect(0, 0, 8*mm, h, stroke=0, fill=1)
    # Top sage band
    canv.setFillColor(BRAND_SAGE)
    canv.rect(8*mm, h - 55*mm, w - 8*mm, 55*mm, stroke=0, fill=1)
    # NHS wordmark
    canv.setFillColor(BRAND_DK)
    canv.setFont('Helvetica-Bold', 14)
    canv.drawString(20*mm, h - 22*mm, 'NEW HOME SOLUTIONS')
    canv.setFillColor(MUTED)
    canv.setFont('Helvetica', 9)
    canv.drawString(20*mm, h - 28*mm, 'Part Exchange & Assisted Move Specialists')
    # Footer block
    canv.setFillColor(BRAND_DK)
    canv.rect(8*mm, 0, w - 8*mm, 22*mm, stroke=0, fill=1)
    canv.setFillColor(white)
    canv.setFont('Helvetica-Bold', 10)
    canv.drawString(20*mm, 13*mm, 'CRM MATES LTD — London')
    canv.setFont('Helvetica', 8.5)
    canv.drawString(20*mm, 8*mm, 'deepak@crmmates.com · 07443 340401 · crmmates.com')
    canv.drawRightString(w - 12*mm, 13*mm, 'Delivery Report · v1.0')
    canv.drawRightString(w - 12*mm, 8*mm, '22 April 2026')
    canv.restoreState()


# ── 3-vs-4 comparison diagram (reused from technical PDF, polished) ────
class ComparisonDiagram(Flowable):
    WIDTH = 180 * mm
    HEIGHT = 95 * mm

    def wrap(self, availWidth, availHeight):
        return self.WIDTH, self.HEIGHT

    def draw(self):
        c = self.canv
        col_w = 85 * mm
        gap = 10 * mm
        header_h = 11 * mm
        row_h = 8 * mm

        # Standard — Left
        self._draw_model(
            c, x=0, y=0, w=col_w, header_h=header_h, row_h=row_h,
            title='Standard Model',
            subtitle='Used by every other housebuilder',
            title_bg=STD_BLUE, title_bg_pale=STD_BLUE_PALE,
            rows=[
                ('Initial Asking', '£395,000', '£390,000', '£400,000'),
                ('Target Sale',    '£380,000', '£378,000', '£385,000'),
                ('Bottom Price',   '£365,000', '£360,000', '£370,000'),
            ],
            nhs_rows=[
                ('Market', '£385,000'),
                ('Target', '£375,000'),
                ('Forced', '£360,000'),
            ],
            pill='3 FIGURES'
        )

        # Timeline — Right
        self._draw_model(
            c, x=col_w + gap, y=0, w=col_w, header_h=header_h, row_h=row_h,
            title='Timeline Model',
            subtitle='New — for Wain Homes',
            title_bg=TL_AMBER, title_bg_pale=TL_AMBER_PALE,
            rows=[
                ('Open Market', '£410,000', '£405,000', '£415,000'),
                ('6 – 8 Week',  '£395,000', '£392,000', '£400,000'),
                ('4 – 6 Week',  '£380,000', '£377,000', '£385,000'),
                ('2 – 4 Week',  '£365,000', '£360,000', '£370,000'),
            ],
            nhs_rows=[
                ('Open Market', '£405,000'),
                ('6 – 8 Week',  '£393,000'),
                ('4 – 6 Week',  '£380,000'),
                ('2 – 4 Week',  '£362,000'),
            ],
            pill='4 TIMEFRAMES'
        )

    def _draw_model(self, c, x, y, w, header_h, row_h, title, subtitle,
                    title_bg, title_bg_pale, rows, nhs_rows, pill):
        top_y = self.HEIGHT - header_h
        # Title band
        c.setFillColor(title_bg)
        c.roundRect(x, top_y, w, header_h, 2*mm, stroke=0, fill=1)
        c.setFillColor(white)
        c.setFont('Helvetica-Bold', 11)
        c.drawString(x + 4*mm, top_y + 4.5*mm, title)
        c.setFont('Helvetica', 8.5)
        c.drawString(x + 4*mm, top_y + 1.5*mm, subtitle)
        # Pill in header
        c.setFillColor(white)
        c.roundRect(x + w - 28*mm, top_y + 2.5*mm, 24*mm, 6*mm, 2*mm, stroke=0, fill=1)
        c.setFillColor(title_bg)
        c.setFont('Helvetica-Bold', 7.5)
        c.drawCentredString(x + w - 16*mm, top_y + 4.3*mm, pill)

        # Agent header row
        label_w = w * 0.34
        agent_w = (w - label_w) / 3
        agent_hdr_y = top_y - (header_h - 2*mm)
        c.setFillColor(BRAND_PALE)
        c.setStrokeColor(BRAND_BORDER)
        c.setLineWidth(0.5)
        c.rect(x, agent_hdr_y, w, header_h - 2*mm, stroke=1, fill=1)
        c.setFillColor(BRAND_DK)
        c.setFont('Helvetica-Bold', 7.5)
        for i, name in enumerate(['Agent 1', 'Agent 2', 'Agent 3']):
            cx = x + label_w + agent_w * i + agent_w / 2
            c.drawCentredString(cx, agent_hdr_y + 2.8*mm, name)

        # Figure rows
        cur_y = agent_hdr_y
        for row in rows:
            cur_y -= row_h
            c.setStrokeColor(BRAND_BORDER)
            c.setFillColor(white)
            c.rect(x, cur_y, w, row_h, stroke=1, fill=1)
            c.setFillColor(title_bg_pale)
            c.rect(x, cur_y, label_w, row_h, stroke=1, fill=1)
            c.setFillColor(INK)
            c.setFont('Helvetica-Bold', 7.5)
            c.drawString(x + 3*mm, cur_y + 2.7*mm, row[0])
            c.setFont('Helvetica', 7.5)
            for i, val in enumerate(row[1:]):
                cx = x + label_w + agent_w * i + agent_w / 2
                c.drawCentredString(cx, cur_y + 2.7*mm, val)

        # NHS header
        cur_y -= 2*mm
        cur_y -= row_h
        c.setFillColor(BRAND_DK)
        c.rect(x, cur_y, w, row_h, stroke=0, fill=1)
        c.setFillColor(white)
        c.setFont('Helvetica-Bold', 7.5)
        c.drawString(x + 3*mm, cur_y + 2.7*mm, 'NHS Recommendation')

        # NHS rows
        for (lbl, val) in nhs_rows:
            cur_y -= row_h
            c.setStrokeColor(BRAND_BORDER)
            c.setFillColor(white)
            c.rect(x, cur_y, w, row_h, stroke=1, fill=1)
            c.setFillColor(title_bg_pale)
            c.rect(x, cur_y, label_w, row_h, stroke=1, fill=1)
            c.setFillColor(INK)
            c.setFont('Helvetica-Bold', 7.5)
            c.drawString(x + 3*mm, cur_y + 2.7*mm, lbl)
            c.setFillColor(BRAND_DK)
            c.setFont('Helvetica-Bold', 8.5)
            c.drawCentredString(x + label_w + (w - label_w)/2, cur_y + 2.7*mm, val)


# ── Feature strip: icon + title + description row ──────────────────────
class FeatureStrip(Flowable):
    def __init__(self, items, width=180*mm):
        super().__init__()
        self.items = items
        self.width = width
        self.row_h = 22*mm
        self.height = self.row_h * len(items) + 3*mm

    def wrap(self, availWidth, availHeight):
        return self.width, self.height

    def draw(self):
        c = self.canv
        y = self.height
        for (tag, title, desc) in self.items:
            y -= self.row_h
            # Tag pill (left)
            c.setFillColor(BRAND_PALE)
            c.roundRect(0, y + 2*mm, 22*mm, 18*mm, 2*mm, stroke=0, fill=1)
            c.setFillColor(BRAND_DK)
            c.setFont('Helvetica-Bold', 8.5)
            c.drawCentredString(11*mm, y + 9.5*mm, tag)
            # Title + description
            c.setFillColor(BRAND_DK)
            c.setFont('Helvetica-Bold', 11)
            c.drawString(26*mm, y + 14*mm, title)
            c.setFillColor(INK)
            c.setFont('Helvetica', 9.5)
            # Wrap desc at ~110 chars
            line1 = desc
            if len(desc) > 115:
                # split at nearest space before char 110
                split_at = desc.rfind(' ', 0, 110)
                line1 = desc[:split_at]
                line2 = desc[split_at+1:]
                c.drawString(26*mm, y + 8*mm, line1)
                c.drawString(26*mm, y + 3*mm, line2)
            else:
                c.drawString(26*mm, y + 8*mm, line1)
            # Separator line
            c.setStrokeColor(DIVIDER)
            c.setLineWidth(0.3)
            c.line(0, y + 1*mm, self.width, y + 1*mm)


# ── Helpers ─────────────────────────────────────────────────────────────
def bullet(story, text):
    story.append(Paragraph(f'•&nbsp;&nbsp;{text}', BULLET))


def kv_table(story, rows, col_widths=None):
    t = Table(rows, colWidths=col_widths or [45*mm, 125*mm], hAlign='LEFT')
    t.setStyle(TableStyle([
        ('FONT',        (0, 0), (-1, -1), 'Helvetica', 10),
        ('FONT',        (0, 0), (0, -1),  'Helvetica-Bold', 10),
        ('TEXTCOLOR',   (0, 0), (0, -1),  BRAND_DK),
        ('BACKGROUND',  (0, 0), (0, -1),  BRAND_PALE),
        ('LINEBELOW',   (0, 0), (-1, -1), 0.3, DIVIDER),
        ('VALIGN',      (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 10),
        ('RIGHTPADDING',(0, 0), (-1, -1), 10),
        ('TOPPADDING',  (0, 0), (-1, -1), 7),
        ('BOTTOMPADDING',(0, 0),(-1, -1), 7),
    ]))
    story.append(t)
    story.append(Spacer(1, 10))


def scorecard_table(story, rows):
    header = [['Area', 'Delivered', 'Status']]
    data = header + rows
    t = Table(data, colWidths=[55*mm, 95*mm, 25*mm], hAlign='LEFT')
    t.setStyle(TableStyle([
        ('BACKGROUND',  (0, 0), (-1, 0), BRAND_DK),
        ('TEXTCOLOR',   (0, 0), (-1, 0), white),
        ('FONT',        (0, 0), (-1, 0), 'Helvetica-Bold', 9),
        ('FONT',        (0, 1), (-1, -1), 'Helvetica', 9),
        ('FONT',        (0, 1), (0, -1), 'Helvetica-Bold', 9),
        ('TEXTCOLOR',   (0, 1), (0, -1), BRAND_DK),
        ('GRID',        (0, 0), (-1, -1), 0.3, DIVIDER),
        ('VALIGN',      (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING',(0, 0), (-1, -1), 8),
        ('TOPPADDING',  (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING',(0, 0),(-1, -1), 6),
        ('ROWBACKGROUNDS',(0, 1), (-1, -1), [white, BRAND_PALE]),
        ('ALIGN',       (2, 1), (2, -1), 'CENTER'),
        ('TEXTCOLOR',   (2, 1), (2, -1), SUCCESS),
        ('FONT',        (2, 1), (2, -1), 'Helvetica-Bold', 9),
    ]))
    story.append(t)
    story.append(Spacer(1, 10))


# ── Build document ──────────────────────────────────────────────────────
def build():
    doc = SimpleDocTemplate(OUT, pagesize=A4,
        leftMargin=15*mm, rightMargin=15*mm,
        topMargin=20*mm, bottomMargin=20*mm,
        title='Wain Homes Timeline Valuations — Delivery Report',
        author='CRM Mates Ltd — Deepak K Rana')

    story = []

    # ── Cover page ──
    story.append(Spacer(1, 55*mm))
    story.append(Paragraph('DELIVERY REPORT', COVER_KICK))
    story.append(Paragraph('Wain Homes<br/>Timeline Valuations', COVER_TITLE))
    story.append(Paragraph('A new valuation model — delivered, tested and live.', COVER_SUB))

    kv_table(story, [
        ['Client',           'New Home Solutions Ltd'],
        ['Housebuilder',     'Wain Homes (North West, Severn Valley, South West)'],
        ['Platform',         'Salesforce Lightning — New Home Solutions CRM'],
        ['Delivered by',     'CRM Mates Ltd — Deepak K Rana, Lead Salesforce Consultant'],
        ['Rollout window',   'April 2026'],
        ['Status',           'Live in production · All scope complete'],
    ], col_widths=[40*mm, 130*mm])

    story.append(Spacer(1, 10*mm))
    story.append(Paragraph(
        '<b>In one sentence:</b> Wain Homes agents now return valuations across four sale-timeline '
        'windows instead of three fixed figures — and every downstream system (application page, '
        'pipeline, generated PDF, vendor email, list views) renders the right model automatically, '
        'with zero change to how every other housebuilder on the platform currently works.',
        BODY_LEAD))

    story.append(PageBreak())

    # ── Executive summary ──
    story.append(Paragraph('Executive Summary', H1))

    story.append(Paragraph(
        'Wain Homes needed a different conversation with their vendors than every other '
        'housebuilder NHS supports. Where the standard process returns three valuation figures per agent '
        '— <b>Initial Asking Price</b>, <b>Target Sale</b>, and <b>Bottom Price</b> — Wain wanted their '
        'agents to return valuations against <b>four sale-timeline windows</b>: <b>Open Market</b>, '
        '<b>6–8 Week</b>, <b>4–6 Week</b>, and <b>2–4 Week</b>. The NHS Recommendation that ultimately '
        'reaches the vendor needed to mirror the same four-timeframe structure.',
        BODY_LEAD))

    story.append(Paragraph(
        'The rollout was delivered across three phases in April 2026 and is now live in production. '
        'Every touchpoint the NHS team works with — from first application through final vendor email — '
        'now adapts automatically to the housebuilder\'s valuation model, driven by a single checkbox '
        'on the housebuilder\'s Account record.',
        BODY))

    story.append(Paragraph('Key outcomes', H2))
    bullet(story, '<b>Zero disruption to other housebuilders.</b> All existing housebuilders continue to '
                 'use the familiar three-figure flow with no code or process changes visible to their users.')
    bullet(story, '<b>One-flag onboarding.</b> If another housebuilder ever needs timeline valuations in '
                 'future, enabling them is a single tick-box on their Account record — no developer release required.')
    bullet(story, '<b>End-to-end coverage.</b> Every artefact the vendor or NHS team sees — the on-screen '
                 'detail page, the downloadable valuation PDF, the final email, the pipeline-stage list views — '
                 'reflects the correct four-timeframe model for Wain applications.')
    bullet(story, '<b>Production-verified.</b> The four Wain Homes Accounts (parent + 3 regions) are '
                 'pre-flagged and the system handles live Wain applications correctly.')

    story.append(Paragraph('The comparison at a glance', H2))
    story.append(Paragraph(
        'The same three agents, the same NHS Recommendation — but the NHS team now sees the valuation '
        'model each housebuilder actually uses:',
        BODY))
    story.append(Spacer(1, 6))
    story.append(ComparisonDiagram())
    story.append(Paragraph(
        'Left: the standard three-figure view used by every housebuilder other than Wain. '
        'Right: the new four-timeframe view that appears automatically on Wain Homes applications.',
        CAPTION))

    story.append(PageBreak())

    # ── Delivered scope ──
    story.append(Paragraph('What we delivered', H1))
    story.append(Paragraph(
        'The delivery was organised across three phases. Each phase had a clear exit criterion and each '
        'item below is live in your production environment as of 22 April 2026.',
        BODY))

    story.append(Paragraph('Phase A — Foundations', H2))
    story.append(Paragraph(
        'We extended the data model to carry both valuation structures side-by-side so no existing data is '
        'disturbed. A checkbox on each Housebuilder Account — <i>Use Timeline Valuations</i> — tells the '
        'system which model to present. Sixteen new valuation fields were added (four new fields per agent × '
        'three agents, plus four for the NHS Recommendation). Field-level security was rolled out to all '
        'five system administrators automatically via a permission set. The pipeline rules that move an '
        'application into <b>Valuations Ready</b> were rewritten so Wain applications only progress when '
        'all four timeframes are captured for every agent.',
        BODY))

    story.append(Paragraph('Phase B — The on-screen experience', H2))
    story.append(Paragraph(
        'The Application Detail page now renders the Agent Valuation and NHS Recommendation cards in the '
        'right shape for the housebuilder attached to the application. Per-agent field locking means the '
        'NHS team can start entering valuations for each agent as soon as that agent is assigned — without '
        'waiting for all three. The "figures waiting" flags that drive the Figures-to-Chase list and the '
        'Outstanding Figures card now branch on the model too, so Wain applications are only flagged '
        'incomplete when any of the four timeframes is genuinely missing.',
        BODY))

    story.append(Paragraph('Phase C — Downstream artefacts', H2))
    story.append(Paragraph(
        'Everything that sits behind the on-screen experience was updated to match:',
        BODY))

    story.append(Spacer(1, 4))
    story.append(FeatureStrip([
        ('PDF',     'Valuation Report PDF',       'The generated PDF sent to vendors now renders a 4-row agent table and a 4-column NHS Recommendation section for Wain applications.'),
        ('EMAIL',   'Final Checks email template', 'A new branded template "10 — Valuation Figure Return (Timeline)" is auto-selected for Wain housebuilders; the existing template #09 continues to serve all other housebuilders untouched.'),
        ('KANBAN',  'List-view visual tag',        'A gold "Timeline" pill appears next to Wain applications on the Valuations Ready and Final Checks list views for at-a-glance identification.'),
        ('TOOLTIP', 'Hover-to-see what\'s missing', 'Chasing an agent? Hover any missing-figure badge to see exactly which timeframes are outstanding — no more clicking into the record to find out.'),
        ('CONFIG',  'NHS Config page',             'Two template mappings now sit on the NHS Config page (Standard and Timeline), each with a green/red health indicator showing whether the mapped template is live.'),
        ('REPORTS', 'Dashboards & reports audit',   'The existing NHS custom report was reviewed and confirmed safe — no field dependencies on the old valuation-only model.'),
    ]))

    story.append(PageBreak())

    # ── How it works in practice ──
    story.append(Paragraph('How the team experiences it day-to-day', H1))

    story.append(Paragraph('For the NHS operational team', H2))
    bullet(story, 'Open any Wain Homes application and the Agent Valuation cards automatically show '
                 '<b>4 rows</b> (Open Market / 6–8 Week / 4–6 Week / 2–4 Week).')
    bullet(story, 'Every other housebuilder still shows the familiar <b>3 rows</b> '
                 '(Initial Asking / Target Sale / Bottom Price). No training needed.')
    bullet(story, 'The Figures-to-Chase list shows exactly what to chase for each agent — hover for a '
                 'precise list of the missing timeframes.')
    bullet(story, 'At Final Checks, the email composer pre-loads the right template '
                 '(timeline or standard) based on the housebuilder — one less decision to make.')

    story.append(Paragraph('For the NHS admin team', H2))
    bullet(story, '<b>To onboard another timeline-model housebuilder in the future:</b> open the '
                 'Housebuilder record, tick <i>Use Timeline Valuations</i> in the Settings cog, save. '
                 'Every subsequent application for that housebuilder uses the new model.')
    bullet(story, '<b>To update either email template:</b> edit directly in '
                 'Salesforce Setup → Email Templates. The config page shows a green bulb when the template is '
                 'wired correctly, red if its Id is missing, grey if unmapped.')
    bullet(story, '<b>To see which applications are timeline applications at a glance:</b> the gold '
                 '"Timeline" pill on list views answers that without opening the record.')

    story.append(Paragraph('For Wain Homes', H2))
    story.append(Paragraph(
        'Wain Homes will experience the valuation figures through two artefacts:',
        BODY))
    bullet(story, 'The <b>Valuation Report PDF</b> attached to each application reflects the four-timeframe '
                 'structure throughout — agent table, NHS Recommendation, and the summary figures.')
    bullet(story, 'The <b>Final email</b> sent to the vendor (cc Wain Homes) contains the four-timeframe '
                 'price guide table and the four-row NHS Recommendation — nothing pointing to an obsolete '
                 'three-figure model remains.')

    story.append(PageBreak())

    # ── Delivery scorecard ──
    story.append(Paragraph('Delivery scorecard', H1))
    story.append(Paragraph(
        'Every scoped item below is delivered, tested on live data, and live in production.',
        BODY))
    scorecard_table(story, [
        ['Data model',              'Account checkbox + 16 Opportunity fields + permission set auto-assigned', '✓ Live'],
        ['Pipeline rules',          'Four-timeframe completeness check gates the Valuations Ready stage', '✓ Live'],
        ['Application Detail page', 'Cards automatically render 3-row or 4-row layout based on housebuilder', '✓ Live'],
        ['Per-agent field unlock',  'Valuation fields enable as each agent is assigned, in any order', '✓ Live'],
        ['Final Checks page',       'Agent Valuations + NHS Recommendation panels branch per housebuilder', '✓ Live'],
        ['Valuation Report PDF',    '4-row agent table + separate 4-column NHS Recommendation block', '✓ Live'],
        ['Final Checks email',      'New branded timeline template + auto-selection per housebuilder', '✓ Live'],
        ['List view — Timeline pill', 'Gold identifier on Valuations Ready + Final Checks rows', '✓ Live'],
        ['Missing-figure tooltips', 'Hover a chase badge to see exactly which timeframes are outstanding', '✓ Live'],
        ['NHS Config cards',        'Two mappable Final Checks email slots with health indicators', '✓ Live'],
        ['Reports & dashboards',    'Audit complete — no impact on existing NHS report', '✓ Live'],
    ])

    story.append(Paragraph('Quality safeguards', H2))
    bullet(story, '<b>Non-regression:</b> every view the team already uses renders identically for '
                 'every non-Wain housebuilder. The flag defaults to off.')
    bullet(story, '<b>Safe fallback on email:</b> if the timeline template ever becomes unmapped, the system '
                 'falls back to the standard template automatically rather than failing the send.')
    bullet(story, '<b>Field-level security is formally granted</b> via a permission set that was auto-assigned '
                 'to all five system administrators — no manual per-user configuration was required.')
    bullet(story, '<b>Branching is centralised:</b> the four-vs-three decision lives in a single flag, '
                 'read once per view. That means consistency across the detail page, PDF, email, and list views '
                 'is structurally enforced rather than requiring vigilance.')

    story.append(PageBreak())

    # ── Change log / support / next steps ──
    story.append(Paragraph('Operational notes', H1))

    story.append(Paragraph('Preloaded housebuilders', H2))
    bullet(story, 'Wain Homes (parent Account) — timeline model <b>enabled</b>.')
    bullet(story, 'Wain Homes — North West — timeline model <b>enabled</b>.')
    bullet(story, 'Wain Homes — Severn Valley — timeline model <b>enabled</b>.')
    bullet(story, 'Wain Homes — South West — timeline model <b>enabled</b>.')

    story.append(Paragraph('Extending to another housebuilder', H2))
    story.append(Paragraph(
        'In the event another housebuilder adopts a similar four-timeframe model in future, onboarding is '
        'self-service — no code release is needed. From the Housebuilder record, open the Settings cog, '
        'tick <b>Use Timeline Valuations</b>, and save. All applications subsequently created or edited '
        'for that housebuilder will automatically use the new model, end-to-end.',
        BODY))

    story.append(Paragraph('Documentation & source of truth', H2))
    bullet(story, 'Full technical change log is maintained in the project\'s '
                 '<font face="Courier" size="9">docs/TECHNICAL_DOCUMENT.md</font> with per-item commits tagged '
                 '<font face="Courier" size="9">WAIN-TL-C-01</font> through <font face="Courier" size="9">WAIN-TL-C-07</font>.')
    bullet(story, 'Design reference HTML for the Wain timeline email is archived at '
                 '<font face="Courier" size="9">email-templates/10_Valuation_Figure_Return_Timeline.html</font>.')
    bullet(story, 'A reusable script for creating further Lightning email templates in the correct folder is '
                 'committed at <font face="Courier" size="9">scripts/create_lightning_email_template.py</font>.')

    story.append(Paragraph('Support', H2))
    story.append(Paragraph(
        'For any questions, enhancements, or to flag a rough edge, please contact CRM Mates Ltd directly:',
        BODY))
    kv_table(story, [
        ['Lead consultant',  'Deepak K Rana'],
        ['Email',            'deepak@crmmates.com'],
        ['Phone',            '07443 340401'],
        ['Company',          'CRM Mates Ltd, London'],
        ['Web',              'crmmates.com'],
    ], col_widths=[40*mm, 130*mm])

    story.append(Spacer(1, 14))
    story.append(Paragraph(
        '<i>Thank you for the opportunity to deliver this. We hope the new valuation flow serves Wain Homes '
        'and the NHS team well for many applications to come.</i>',
        QUOTE))

    # Build
    doc.build(story,
              onFirstPage=on_cover_page,
              onLaterPages=on_later_page)
    print(f'Wrote {OUT}')


if __name__ == '__main__':
    build()
