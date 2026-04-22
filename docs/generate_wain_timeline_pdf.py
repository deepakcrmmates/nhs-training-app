#!/usr/bin/env python3
"""Generate WAIN_TIMELINE_SUMMARY.pdf — a developer-to-client summary of the
Wain Homes timeline valuations rollout (Phase A + B + C).

Covers: what was done, how it was done, and a side-by-side diagram comparing
the 3-value (standard) and 4-value (timeline) valuation models."""

import os
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.lib.colors import HexColor, white, black
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak,
    KeepTogether, Flowable
)
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
from reportlab.pdfgen import canvas

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'WAIN_TIMELINE_SUMMARY.pdf')

# NHS brand colours
BRAND_DK = HexColor('#075F50')
BRAND_MID = HexColor('#4A6B5E')
BRAND_PALE = HexColor('#EAF4EF')
BRAND_BORDER = HexColor('#C5DCCC')
AMBER = HexColor('#F59E0B')
AMBER_PALE = HexColor('#FFF8E7')
AMBER_BORDER = HexColor('#E8D18A')
INK = HexColor('#0F172A')
MUTED = HexColor('#64748B')
DIVIDER = HexColor('#E2E8F0')
STD_BLUE = HexColor('#2563EB')
STD_BLUE_PALE = HexColor('#DBEAFE')
TL_AMBER = HexColor('#B45309')
TL_AMBER_PALE = HexColor('#FEF3C7')


# ── Styles ──────────────────────────────────────────────────────────────
styles = getSampleStyleSheet()

TITLE = ParagraphStyle('Title', parent=styles['Title'],
    fontName='Helvetica-Bold', fontSize=24, textColor=BRAND_DK,
    spaceAfter=6, alignment=TA_LEFT, leading=28)

SUBTITLE = ParagraphStyle('Subtitle', parent=styles['Normal'],
    fontName='Helvetica', fontSize=11, textColor=MUTED,
    spaceAfter=20, alignment=TA_LEFT)

H1 = ParagraphStyle('H1', parent=styles['Heading1'],
    fontName='Helvetica-Bold', fontSize=16, textColor=BRAND_DK,
    spaceBefore=18, spaceAfter=8, leading=20)

H2 = ParagraphStyle('H2', parent=styles['Heading2'],
    fontName='Helvetica-Bold', fontSize=12, textColor=BRAND_MID,
    spaceBefore=12, spaceAfter=6, leading=15)

BODY = ParagraphStyle('Body', parent=styles['BodyText'],
    fontName='Helvetica', fontSize=10, textColor=INK,
    spaceAfter=6, leading=14, alignment=TA_JUSTIFY)

BULLET = ParagraphStyle('Bullet', parent=BODY,
    leftIndent=14, bulletIndent=2, spaceAfter=3, alignment=TA_LEFT)

CODE = ParagraphStyle('Code', parent=styles['Code'],
    fontName='Courier', fontSize=9, textColor=INK, leftIndent=8,
    backColor=BRAND_PALE, spaceAfter=6, leading=12)

SMALL = ParagraphStyle('Small', parent=styles['Normal'],
    fontName='Helvetica', fontSize=8, textColor=MUTED, alignment=TA_LEFT)

TAG_LABEL = ParagraphStyle('TagLabel', parent=styles['Normal'],
    fontName='Helvetica-Bold', fontSize=8, textColor=INK, alignment=TA_CENTER)


# ── Header / Footer ──────────────────────────────────────────────────────
def on_page(canv: canvas.Canvas, doc):
    canv.saveState()
    w, h = A4
    # Header bar
    canv.setFillColor(BRAND_DK)
    canv.rect(0, h - 12*mm, w, 12*mm, stroke=0, fill=1)
    canv.setFillColor(white)
    canv.setFont('Helvetica-Bold', 9)
    canv.drawString(15*mm, h - 8*mm, 'NEW HOME SOLUTIONS')
    canv.setFont('Helvetica', 9)
    canv.drawRightString(w - 15*mm, h - 8*mm, 'Wain Homes Timeline Valuations — Rollout Summary')
    # Footer
    canv.setStrokeColor(DIVIDER)
    canv.setLineWidth(0.5)
    canv.line(15*mm, 12*mm, w - 15*mm, 12*mm)
    canv.setFillColor(MUTED)
    canv.setFont('Helvetica', 8)
    canv.drawString(15*mm, 7*mm, 'CRM Mates Ltd · Deepak K Rana, Lead Consultant')
    canv.drawRightString(w - 15*mm, 7*mm, f'Page {doc.page}')
    canv.restoreState()


# ── Custom diagram: 3-value vs 4-value comparison ──────────────────────
class ComparisonDiagram(Flowable):
    """Side-by-side diagram showing the two valuation models with agent columns
    and the NHS Recommendation row, visually highlighting row counts."""

    WIDTH = 180 * mm
    HEIGHT = 90 * mm

    def wrap(self, availWidth, availHeight):
        return self.WIDTH, self.HEIGHT

    def draw(self):
        c = self.canv
        # Box dimensions
        col_w = 85 * mm
        gap = 10 * mm
        header_h = 10 * mm
        row_h = 8 * mm

        # ── Left: Standard (3 rows) ──────────────────────────────────
        self._draw_model(
            c, x=0, y=0, w=col_w, header_h=header_h, row_h=row_h,
            title='STANDARD MODEL',
            subtitle='Default housebuilders — 3 figures',
            title_bg=STD_BLUE, title_bg_pale=STD_BLUE_PALE,
            rows=[
                ('Initial Asking Price', '£395,000', '£390,000', '£400,000'),
                ('Target Sale Price',    '£380,000', '£378,000', '£385,000'),
                ('Bottom Price',         '£365,000', '£360,000', '£370,000'),
            ],
            nhs_rows=[
                ('Market', '£385,000'),
                ('Target', '£375,000'),
                ('Forced', '£360,000'),
            ]
        )

        # ── Right: Timeline (4 rows) ─────────────────────────────────
        self._draw_model(
            c, x=col_w + gap, y=0, w=col_w, header_h=header_h, row_h=row_h,
            title='TIMELINE MODEL',
            subtitle='Wain Homes — 4 timeframes',
            title_bg=TL_AMBER, title_bg_pale=TL_AMBER_PALE,
            rows=[
                ('Open Market',  '£410,000', '£405,000', '£415,000'),
                ('6 – 8 Week',   '£395,000', '£392,000', '£400,000'),
                ('4 – 6 Week',   '£380,000', '£377,000', '£385,000'),
                ('2 – 4 Week',   '£365,000', '£360,000', '£370,000'),
            ],
            nhs_rows=[
                ('Open Market', '£405,000'),
                ('6 – 8 Week',  '£393,000'),
                ('4 – 6 Week',  '£380,000'),
                ('2 – 4 Week',  '£362,000'),
            ]
        )

    def _draw_model(self, c, x, y, w, header_h, row_h, title, subtitle,
                    title_bg, title_bg_pale, rows, nhs_rows):
        # Title band
        top_y = self.HEIGHT - header_h
        c.setFillColor(title_bg)
        c.roundRect(x, top_y, w, header_h, 2*mm, stroke=0, fill=1)
        c.setFillColor(white)
        c.setFont('Helvetica-Bold', 10)
        c.drawString(x + 4*mm, top_y + 3.5*mm, title)
        c.setFont('Helvetica', 8)
        c.drawRightString(x + w - 4*mm, top_y + 3.5*mm, subtitle)

        # Agent header row
        agent_hdr_y = top_y - (header_h - 2*mm)
        c.setFillColor(BRAND_PALE)
        c.setStrokeColor(BRAND_BORDER)
        c.setLineWidth(0.5)
        label_w = w * 0.34
        agent_w = (w - label_w) / 3
        c.rect(x, agent_hdr_y, w, header_h - 2*mm, stroke=1, fill=1)
        c.setFillColor(BRAND_DK)
        c.setFont('Helvetica-Bold', 7)
        for i, name in enumerate(['Agent 1', 'Agent 2', 'Agent 3']):
            cx = x + label_w + agent_w * i + agent_w / 2
            c.drawCentredString(cx, agent_hdr_y + 2.5*mm, name)

        # Figure rows
        cur_y = agent_hdr_y
        for row in rows:
            cur_y -= row_h
            c.setStrokeColor(BRAND_BORDER)
            c.setFillColor(white)
            c.rect(x, cur_y, w, row_h, stroke=1, fill=1)
            # Label cell tint
            c.setFillColor(title_bg_pale)
            c.rect(x, cur_y, label_w, row_h, stroke=1, fill=1)
            c.setFillColor(INK)
            c.setFont('Helvetica-Bold', 7.5)
            c.drawString(x + 3*mm, cur_y + 2.7*mm, row[0])
            c.setFont('Helvetica', 7.5)
            for i, val in enumerate(row[1:]):
                cx = x + label_w + agent_w * i + agent_w / 2
                c.drawCentredString(cx, cur_y + 2.7*mm, val)

        # NHS Recommendation strip header
        cur_y -= 2 * mm
        cur_y -= row_h
        c.setFillColor(BRAND_DK)
        c.rect(x, cur_y, w, row_h, stroke=0, fill=1)
        c.setFillColor(white)
        c.setFont('Helvetica-Bold', 7.5)
        c.drawString(x + 3*mm, cur_y + 2.7*mm, 'NHS Recommendation')
        # count pill
        count_text = f'{len(nhs_rows)} rows'
        c.setFillColor(title_bg_pale)
        pill_w = 14*mm
        c.roundRect(x + w - pill_w - 3*mm, cur_y + 1.5*mm, pill_w, row_h - 3*mm, 1.5*mm, stroke=0, fill=1)
        c.setFillColor(title_bg)
        c.drawCentredString(x + w - pill_w/2 - 3*mm, cur_y + 2.7*mm, count_text)

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
            c.setFont('Helvetica-Bold', 8)
            c.setFillColor(BRAND_DK)
            c.drawCentredString(x + label_w + (w - label_w)/2, cur_y + 2.7*mm, val)


# ── Content helpers ────────────────────────────────────────────────────
def bullet(story, text):
    story.append(Paragraph(f'•&nbsp;&nbsp;{text}', BULLET))


def kv_table(story, rows):
    t = Table(rows, colWidths=[40*mm, 130*mm], hAlign='LEFT')
    t.setStyle(TableStyle([
        ('FONT',        (0, 0), (-1, -1), 'Helvetica', 9),
        ('FONT',        (0, 0), (0, -1),  'Helvetica-Bold', 9),
        ('TEXTCOLOR',   (0, 0), (0, -1),  BRAND_DK),
        ('BACKGROUND',  (0, 0), (0, -1),  BRAND_PALE),
        ('LINEBELOW',   (0, 0), (-1, -1), 0.3, DIVIDER),
        ('VALIGN',      (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING',(0, 0), (-1, -1), 8),
        ('TOPPADDING',  (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING',(0, 0),(-1, -1), 6),
    ]))
    story.append(t)
    story.append(Spacer(1, 8))


def task_table(story, rows):
    header = [['Ref', 'Task', 'Status']]
    data = header + rows
    t = Table(data, colWidths=[22*mm, 125*mm, 25*mm], hAlign='LEFT')
    t.setStyle(TableStyle([
        ('BACKGROUND',  (0, 0), (-1, 0), BRAND_DK),
        ('TEXTCOLOR',   (0, 0), (-1, 0), white),
        ('FONT',        (0, 0), (-1, 0), 'Helvetica-Bold', 9),
        ('FONT',        (0, 1), (-1, -1), 'Helvetica', 9),
        ('FONT',        (0, 1), (0, -1), 'Helvetica-Bold', 9),
        ('TEXTCOLOR',   (0, 1), (0, -1), BRAND_DK),
        ('GRID',        (0, 0), (-1, -1), 0.3, DIVIDER),
        ('VALIGN',      (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING',(0, 0), (-1, -1), 6),
        ('TOPPADDING',  (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING',(0, 0),(-1, -1), 5),
        ('ROWBACKGROUNDS',(0, 1), (-1, -1), [white, BRAND_PALE]),
    ]))
    story.append(t)
    story.append(Spacer(1, 8))


# ── Document ────────────────────────────────────────────────────────────
def build():
    doc = SimpleDocTemplate(OUT, pagesize=A4,
        leftMargin=15*mm, rightMargin=15*mm,
        topMargin=20*mm, bottomMargin=18*mm,
        title='Wain Homes Timeline Valuations — Rollout Summary',
        author='Deepak K Rana, CRM Mates')

    story = []

    # ── Cover ──
    story.append(Spacer(1, 12))
    story.append(Paragraph('Wain Homes Timeline Valuations', TITLE))
    story.append(Paragraph('Rollout summary — what we delivered and how', SUBTITLE))

    kv_table(story, [
        ['Client',           'New Home Solutions (NHS)'],
        ['Housebuilder',     'Wain Homes (+ 3 regional accounts)'],
        ['Delivery partner', 'CRM Mates Ltd — Lead Consultant: Deepak K Rana'],
        ['Rollout dates',    'April 2026 (Phase A → Phase C complete)'],
        ['Platform',         'Salesforce Lightning (LWC + Apex)'],
    ])

    # ── Executive summary ──
    story.append(Paragraph('Executive Summary', H1))
    story.append(Paragraph(
        'Wain Homes needed a different way of reporting property valuations to their vendors: '
        'instead of the standard three figures (<b>Initial Asking Price</b>, <b>Target Sale</b>, '
        '<b>Bottom Price</b>) used by every other housebuilder on the platform, Wain wanted their '
        'agents to return valuations across four time-pressure windows — <b>Open Market</b>, '
        '<b>6&ndash;8 Week</b>, <b>4&ndash;6 Week</b>, and <b>2&ndash;4 Week</b> sale timelines. '
        'The same four-row structure was required for the NHS internal Recommendation the vendor '
        'ultimately sees.',
        BODY))
    story.append(Paragraph(
        'The rollout was delivered in three phases over April 2026. The core principle throughout was '
        '<b>a single per-housebuilder flag</b> drives every stage-specific UI, PDF, and email output — '
        'without touching how the standard housebuilders currently work.',
        BODY))

    # ── The comparison diagram ──
    story.append(Paragraph('3 values vs 4 values — at a glance', H1))
    story.append(Paragraph(
        'The same three agents, the same NHS Recommendation — but each housebuilder sees the '
        'model their business needs:',
        BODY))
    story.append(Spacer(1, 6))
    story.append(ComparisonDiagram())
    story.append(Spacer(1, 6))
    story.append(Paragraph(
        '<i>Left: standard 3-figure model used by 99% of housebuilders. '
        'Right: the new 4-timeframe model used when a housebuilder has '
        '<font face="Courier" size="8">Account.Use_Timeline_Valuations__c = true</font>.</i>',
        SMALL))

    story.append(PageBreak())

    # ── What we did ──
    story.append(Paragraph('What we delivered', H1))
    story.append(Paragraph(
        'The work was structured in three phases, each with a clear exit criterion.', BODY))

    story.append(Paragraph('Phase A — Data model &amp; pipeline rules', H2))
    bullet(story, 'Added <font face="Courier" size="9">Account.Use_Timeline_Valuations__c</font> '
                 'checkbox — the single source of truth for whether a housebuilder uses the '
                 'timeline model.')
    bullet(story, '16 new Currency fields on Opportunity: '
                 '<font face="Courier" size="9">Agent_1/2/3_Open_Market__c</font>, '
                 '<font face="Courier" size="9">Agent_1/2/3_6_8_Week__c</font>, '
                 '<font face="Courier" size="9">Agent_1/2/3_4_6_Week__c</font>, '
                 '<font face="Courier" size="9">Agent_1/2/3_2_4_Week__c</font> '
                 'plus four matching <font face="Courier" size="9">NHS_Rec_*</font> mirrors.')
    bullet(story, 'New permission set <font face="Courier" size="9">NHS_Wain_Timeline_Access</font> '
                 'granting FLS on all 17 fields, auto-assigned to all 5 System Administrators.')
    bullet(story, 'Pipeline gate rewritten in <font face="Courier" size="9">ValuationsReadyController</font> — '
                 'records only qualify for the <b>Valuations Ready</b> stage when all four '
                 'timeline figures are populated per agent (vs all three standard figures).')
    bullet(story, 'Wain Homes + 3 regional accounts (North West / Severn Valley / South West) created and pre-flagged.')

    story.append(Paragraph('Phase B — Conditional UI on the Application Detail page', H2))
    bullet(story, '<b>Agent Valuation</b> and <b>NHS Recommendation</b> cards now swap between '
                 '3-row and 4-row layouts based on the housebuilder flag.')
    bullet(story, 'Extracted four dedicated LWCs (rather than inline <font face="Courier" size="9">&lt;template if&gt;</font> '
                 'twins): <font face="Courier" size="9">nhsAgentValuationStandard</font>, '
                 '<font face="Courier" size="9">nhsAgentValuationTimeline</font>, '
                 '<font face="Courier" size="9">nhsRecommendationsStandard</font>, '
                 '<font face="Courier" size="9">nhsRecommendationsTimeline</font>. The parent decides which to render.')
    bullet(story, 'Per-agent valuation gating: each agent\'s fields unlock when <i>that</i> agent is assigned; '
                 'NHS Recommendation still requires all three agents to be assigned.')
    bullet(story, 'Outstanding Figures card + Figures-to-Chase list both branch on the model so '
                 'Wain applications are no longer flagged as "figures waiting" once all four '
                 'timeline values are in.')

    story.append(Paragraph('Phase C — Downstream artefacts (reference <font face="Courier" size="9">WAIN-TL-C</font>)', H2))
    task_table(story, [
        ['C-01', 'Valuation Report PDF — conditional 3-row / 4-row figures table + separate 4-col NHS Rec table for timeline model.', 'Done'],
        ['C-02', 'Final Checks email — new timeline template + Custom Setting for the Timeline template Id + auto-pick in the controller based on the model.', 'Done'],
        ['C-03', 'Vendor Discussions page — investigation confirmed no valuations shown; V2 detail already covers timeline. No code change.', 'Closed (no-op)'],
        ['C-04', '"Timeline" pill — gold-tinted badge next to the Application name on Valuations Ready + Final Checks list rows.', 'Done'],
        ['C-05', 'Hover tooltips listing exactly what\'s missing per agent — e.g. "Missing: 6–8 Week, 4–6 Week" on Chase badges and Outstanding NHS labels.', 'Done'],
        ['C-06', 'Reports/dashboards audit — zero NHS dashboards, one NHS report with no valuation fields. Nothing to migrate.', 'Closed (no-op)'],
    ])

    story.append(PageBreak())

    # ── How we did it ──
    story.append(Paragraph('How we did it', H1))

    story.append(Paragraph('The flag-driven branching pattern', H2))
    story.append(Paragraph(
        'Every downstream surface (detail page, PDF, email, pipeline, list views) reads a single '
        'Boolean — <font face="Courier" size="9">House_Builder__r.Use_Timeline_Valuations__c</font> — '
        'to decide whether to render the 3-row standard view or the 4-row timeline view. '
        'This means onboarding a second timeline-model housebuilder (if one ever emerges) '
        'takes one checkbox tick, no code changes.',
        BODY))

    story.append(Paragraph('Two components per condition — no inline twins', H2))
    story.append(Paragraph(
        'On the original approach review, we chose to extract each conditional branch into its own '
        'LWC rather than writing inline <font face="Courier" size="9">if:true</font> / '
        '<font face="Courier" size="9">if:false</font> twins inside a single parent. Standard and '
        'timeline views are truly different layouts (3 rows vs 4 rows; 3 cards vs 4 cards) and '
        'forcing one template to express both would bloat the markup and couple the two evolutions. '
        'Twelve dedicated sub-components were created across the rollout:',
        BODY))
    bullet(story, '<font face="Courier" size="9">nhsAgentValuationStandard</font> / '
                 '<font face="Courier" size="9">nhsAgentValuationTimeline</font> — '
                 'editable agent figures on the Application Detail page.')
    bullet(story, '<font face="Courier" size="9">nhsRecommendationsStandard</font> / '
                 '<font face="Courier" size="9">nhsRecommendationsTimeline</font> — '
                 'editable NHS Recommendation card on the Application Detail page.')
    bullet(story, '<font face="Courier" size="9">nhsFinalChecksAgentTableStandard</font> / '
                 '<font face="Courier" size="9">nhsFinalChecksAgentTableTimeline</font> — '
                 'read-only summary tables on the Final Checks page.')
    bullet(story, '<font face="Courier" size="9">nhsFinalChecksNhsRecStandard</font> / '
                 '<font face="Courier" size="9">nhsFinalChecksNhsRecTimeline</font> — '
                 'read-only NHS Recommendation cards on the Final Checks page.')

    story.append(Paragraph('Apex shape', H2))
    story.append(Paragraph(
        'Each stage-specific controller '
        '(<font face="Courier" size="9">ValuationsReadyController</font>, '
        '<font face="Courier" size="9">FiguresToChaseController</font>, '
        '<font face="Courier" size="9">FinalChecksController</font>, '
        '<font face="Courier" size="9">PdfGeneratorPageController</font>) reads the housebuilder '
        'flag as part of its primary SOQL and branches its figures-completeness checks and its '
        'wrapper population accordingly. Two small helpers — '
        '<font face="Courier" size="9">buildTimelineMissing()</font> and '
        '<font face="Courier" size="9">buildStandardMissing()</font> — generate the human-readable '
        '"Missing: Open Market, 6–8 Week" strings used for tooltips and blocker panels.',
        BODY))

    story.append(Paragraph('Configuration surface', H2))
    story.append(Paragraph(
        'Two new Custom Setting fields were added to '
        '<font face="Courier" size="9">NHS_API_Config__c</font>:',
        BODY))
    bullet(story, '<font face="Courier" size="9">Final_Checks_Email_Template_Id__c</font> — '
                 'standard Final Checks email template (existing).')
    bullet(story, '<font face="Courier" size="9">Final_Checks_Email_Template_Timeline_Id__c</font> — '
                 'timeline variant (new). <font face="Courier" size="9">FinalChecksController</font> '
                 'auto-picks the right Id per housebuilder, falling back to the standard template if '
                 'the timeline variant isn\'t mapped.')
    story.append(Paragraph(
        'Both template Ids are surfaced as editable cards on the NHS Config page with green/red/grey '
        'health bulbs — green when mapped and the template still exists, red when the mapped Id has '
        'been deleted, grey when unmapped.',
        BODY))

    story.append(PageBreak())

    # ── Scorecard + next ──
    story.append(Paragraph('Rollout scorecard', H1))
    task_table(story, [
        ['Phase A', 'Data model (Account checkbox + 16 fields + FLS + pipeline rules)', 'Done'],
        ['Phase B', 'Conditional UI on Application Detail + per-agent gating + Outstanding/Chase branching', 'Done'],
        ['C-01',    'Valuation Report PDF — 4-row timeline branching', 'Done'],
        ['C-02',    'Final Email template + config + auto-pick controller', 'Done'],
        ['C-03',    'Vendor Discussions audit — no valuations shown, no change', 'Closed'],
        ['C-04',    'Timeline pill on Val Ready / Final Checks rows', 'Done'],
        ['C-05',    'Per-agent "Missing: …" hover tooltips', 'Done'],
        ['C-06',    'Reports / dashboards audit — nothing to migrate', 'Closed'],
    ])

    story.append(Paragraph('Manual follow-up', H1))
    story.append(Paragraph(
        'One manual step outside code remains:',
        BODY))
    bullet(story, 'In Salesforce → <b>Email Templates</b> → <b>NHS Email Templates</b> folder → <b>New</b> → '
                 'paste the HTML from <font face="Courier" size="9">email-templates/10_Valuation_Figure_Return_Timeline.html</font> → save.')
    bullet(story, 'Copy the new template\'s 18-char Id.')
    bullet(story, 'Open the <b>NHS Config</b> app page → "Final Checks Email (Timeline)" card → Edit → '
                 'pick the template → Save. The bulb will turn green when mapped.')

    story.append(Paragraph('Extending the model', H1))
    story.append(Paragraph(
        'Because the entire pipeline branches on one Boolean, adding a second timeline-model housebuilder '
        'is a one-click operation: tick <font face="Courier" size="9">Use Timeline Valuations</font> on '
        'that housebuilder\'s Account record — no code release required. Adding a <b>third</b> valuation '
        'model (e.g. a five-row or a hybrid model) would require revisiting the conditional components, '
        'but the codebase is organised so this extension is localised rather than structural.',
        BODY))

    story.append(Paragraph('Source references', H1))
    bullet(story, 'Technical document with full change-log: <font face="Courier" size="9">docs/TECHNICAL_DOCUMENT.md</font>')
    bullet(story, 'Reference email template HTML: <font face="Courier" size="9">email-templates/10_Valuation_Figure_Return_Timeline.html</font>')
    bullet(story, 'Git history, commits tagged <font face="Courier" size="9">WAIN-TL-C-01</font> through <font face="Courier" size="9">WAIN-TL-C-06</font>')

    doc.build(story, onFirstPage=on_page, onLaterPages=on_page)
    print(f'Wrote {OUT}')


if __name__ == '__main__':
    build()
