#!/usr/bin/env python3
"""Generate PROPERTY_IMAGES_CLOUDFLARE_PROPOSAL.pdf — a technical architectural
proposal for syncing property photos from Box to Cloudflare Images, enabling
public CDN delivery without changing the photographers' existing Box workflow.

Audience: NHS technical stakeholders (Will, Gina) + any architecture reviewer.
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

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                   'PROPERTY_IMAGES_CLOUDFLARE_PROPOSAL.pdf')

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
BOX_BLUE = HexColor('#0061D5')
BOX_PALE = HexColor('#E3F2FD')
CF_ORANGE = HexColor('#F6821F')
CF_PALE = HexColor('#FEF3E6')
SF_BLUE = HexColor('#00A1E0')
SF_PALE = HexColor('#E0F4FC')
SUCCESS = HexColor('#10B981')
DANGER = HexColor('#EF4444')
PHOTOGRAPHER_PURPLE = HexColor('#7C3AED')   # Box / existing channel + the "Photographer" role across other diagrams
PHOTOGRAPHER_PALE = HexColor('#EDE9FE')
MOBILE_TEAL = HexColor('#0D9488')           # Mobile-app future channel — distinct hue within §4
MOBILE_TEAL_PALE = HexColor('#CCFBF1')

ss = getSampleStyleSheet()

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
    spaceBefore=16, spaceAfter=8, leading=21)
H2 = ParagraphStyle('H2', parent=ss['Heading2'],
    fontName='Helvetica-Bold', fontSize=12.5, textColor=BRAND_MID,
    spaceBefore=12, spaceAfter=5, leading=16)
H3 = ParagraphStyle('H3', parent=ss['Heading3'],
    fontName='Helvetica-Bold', fontSize=10, textColor=BRAND_DK,
    spaceBefore=6, spaceAfter=3, leading=13)
BODY = ParagraphStyle('Body', parent=ss['BodyText'],
    fontName='Helvetica', fontSize=10, textColor=INK,
    spaceAfter=6, leading=14, alignment=TA_JUSTIFY)
BODY_LEAD = ParagraphStyle('BodyLead', parent=BODY, fontSize=10.5, leading=15)
BULLET = ParagraphStyle('Bullet', parent=BODY,
    leftIndent=14, bulletIndent=4, spaceAfter=3, alignment=TA_LEFT, leading=13.5)
MONO = ParagraphStyle('Mono', parent=ss['Code'],
    fontName='Courier', fontSize=8.5, textColor=INK, leftIndent=8,
    backColor=BRAND_PALE, spaceAfter=5, leading=11)
SMALL = ParagraphStyle('Small', parent=ss['Normal'],
    fontName='Helvetica', fontSize=8, textColor=MUTED, alignment=TA_LEFT, leading=11)
CAPTION = ParagraphStyle('Caption', parent=SMALL,
    fontName='Helvetica-Oblique', alignment=TA_CENTER, spaceAfter=10)


# ── Page frame ──────────────────────────────────────────────────────────
def on_later_page(canv: canvas.Canvas, doc):
    canv.saveState()
    w, h = A4
    canv.setFillColor(BRAND_DK)
    canv.rect(0, h - 4*mm, w, 4*mm, stroke=0, fill=1)
    canv.setFillColor(MUTED)
    canv.setFont('Helvetica', 8)
    canv.drawString(15*mm, h - 10*mm,
        'New Home Solutions · Platform Images — Cloudflare CDN · Architecture Proposal')
    canv.drawRightString(w - 15*mm, h - 10*mm, 'Confidential · April 2026')
    canv.setStrokeColor(DIVIDER)
    canv.setLineWidth(0.5)
    canv.line(15*mm, 13*mm, w - 15*mm, 13*mm)
    canv.setFillColor(MUTED)
    canv.setFont('Helvetica', 8)
    canv.drawString(15*mm, 8*mm, 'CRM Mates Ltd — Deepak K Rana, Lead Consultant')
    canv.drawRightString(w - 15*mm, 8*mm, f'Page {doc.page}')
    canv.restoreState()


def on_cover_page(canv: canvas.Canvas, doc):
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
    canv.drawRightString(w - 12*mm, 13*mm, 'Architecture Proposal · v1.0')
    canv.drawRightString(w - 12*mm, 8*mm, '23 April 2026')
    canv.restoreState()


# ── Channels diagram — five upload upstreams fanning in to Cloudflare ──
class ChannelsDiagram(Flowable):
    WIDTH = 180 * mm
    HEIGHT = 110 * mm

    def wrap(self, availWidth, availHeight):
        return self.WIDTH, self.HEIGHT

    def draw(self):
        c = self.canv
        row_h = 14 * mm
        row_gap = 4 * mm
        src_x = 4 * mm
        src_w = 60 * mm
        trigger_x = 74 * mm
        trigger_w = 56 * mm
        cf_x = 140 * mm
        cf_w = 34 * mm
        cf_h = 5 * row_h + 4 * row_gap
        # Vertical centre of the diagram
        top_y = self.HEIGHT - 5 * mm

        # Cloudflare column on the right (one tall box)
        cf_y = top_y - cf_h
        c.setStrokeColor(CF_ORANGE); c.setLineWidth(1.2)
        c.setFillColor(CF_PALE)
        c.roundRect(cf_x, cf_y, cf_w, cf_h, 2*mm, stroke=1, fill=1)
        c.setFillColor(CF_ORANGE); c.setFont('Helvetica-Bold', 10)
        c.drawCentredString(cf_x + cf_w/2, cf_y + cf_h - 6*mm, 'Cloudflare')
        c.drawCentredString(cf_x + cf_w/2, cf_y + cf_h - 11*mm, 'Images')
        c.setFillColor(MUTED); c.setFont('Helvetica', 7)
        c.drawCentredString(cf_x + cf_w/2, cf_y + 5*mm, 'CDN delivery')

        rows = [
            # (source_label, source_sub, trigger_label, color, sub_stroke)
            ('Photographer — Box',  'Existing workflow',       'Schedulable sync (15 min)',      PHOTOGRAPHER_PURPLE, PHOTOGRAPHER_PALE),
            ('Photographer — Mobile App', 'Future channel',    'Direct Creator Upload URL',      MOBILE_TEAL,         MOBILE_TEAL_PALE),
            ('Housebuilder Admin',  'Settings cog · logo',     'Real-time push on replaceLogo()', BRAND_MID,   BRAND_PALE),
            ('Property Data API',   'streetDataService',       'Real-time push on storeImages()', SF_BLUE,     SF_PALE),
            ('NHS Brand Admin',     'One-off upload',          'NHS Config admin action',         AMBER,       AMBER_PALE),
        ]

        y = top_y
        for i, (src, src_sub, trigger, stroke_c, fill_c) in enumerate(rows):
            y_row = y - row_h
            # Source box (left column)
            c.setStrokeColor(stroke_c); c.setLineWidth(1)
            c.setFillColor(fill_c)
            c.roundRect(src_x, y_row, src_w, row_h, 2*mm, stroke=1, fill=1)
            c.setFillColor(stroke_c); c.setFont('Helvetica-Bold', 9)
            c.drawString(src_x + 3*mm, y_row + row_h - 5*mm, src)
            c.setFillColor(MUTED); c.setFont('Helvetica', 7)
            c.drawString(src_x + 3*mm, y_row + 3*mm, src_sub)

            # Trigger box (middle column)
            c.setStrokeColor(DIVIDER); c.setLineWidth(0.8)
            c.setFillColor(white)
            c.roundRect(trigger_x, y_row, trigger_w, row_h, 2*mm, stroke=1, fill=1)
            c.setFillColor(INK); c.setFont('Helvetica-Bold', 8)
            c.drawCentredString(trigger_x + trigger_w/2, y_row + row_h/2 - 1*mm, trigger)

            # Arrow: source → trigger
            c.setStrokeColor(stroke_c); c.setLineWidth(0.9)
            sx = src_x + src_w + 1*mm
            ex = trigger_x - 1.5*mm
            mid_y = y_row + row_h / 2
            c.line(sx, mid_y, ex, mid_y)
            c.line(ex, mid_y, ex - 2*mm, mid_y + 1.3*mm)
            c.line(ex, mid_y, ex - 2*mm, mid_y - 1.3*mm)

            # Arrow: trigger → Cloudflare (converging)
            c.setStrokeColor(stroke_c); c.setLineWidth(0.9)
            sx2 = trigger_x + trigger_w + 1*mm
            ex2 = cf_x - 1.5*mm
            c.line(sx2, mid_y, ex2, mid_y)
            c.line(ex2, mid_y, ex2 - 2*mm, mid_y + 1.3*mm)
            c.line(ex2, mid_y, ex2 - 2*mm, mid_y - 1.3*mm)

            y = y_row - row_gap


# ── Architecture diagram — top-down flow, no crossing arrows ──────────
# Layout (top → bottom, left-to-right flow):
#
#   Photographer ──▶ Box  ──▶ Sync Job ──▶ Cloudflare Images
#                                │                │
#                                ▼                │
#                          Salesforce             │
#                          (Property_Image__c)    │
#                                │                │
#                                ▼                ▼
#                          LWCs / Portal ◀────────┘
#
# All arrows go LEFT→RIGHT or TOP→BOTTOM. Nothing crosses.
class ArchDiagram(Flowable):
    WIDTH = 180 * mm
    HEIGHT = 130 * mm

    def wrap(self, availWidth, availHeight):
        return self.WIDTH, self.HEIGHT

    def draw(self):
        c = self.canv

        # ── Column positions (four equal columns for the top row) ──
        # Must fit inside WIDTH=180mm: 4*box_w + 3*gap_x + 2*outer_margin <= 180
        box_w = 34 * mm
        box_h = 18 * mm
        gap_x = 10 * mm
        col1_x = 4 * mm
        col2_x = col1_x + box_w + gap_x   # 48
        col3_x = col2_x + box_w + gap_x   # 92
        col4_x = col3_x + box_w + gap_x   # 136  — right edge at 170, safely < 180

        top_y = 105 * mm
        mid_y = 60 * mm
        bot_y = 14 * mm

        # ── TOP ROW — write path ────────────────────────────────────
        self._actor(c, col1_x, top_y, box_w, box_h,
                    'Photographer', PHOTOGRAPHER_PURPLE, PHOTOGRAPHER_PALE, sub='Uploads JPG')
        self._actor(c, col2_x, top_y, box_w, box_h,
                    'Box', BOX_BLUE, BOX_PALE, sub='Source of truth')
        self._actor(c, col3_x, top_y, box_w, box_h,
                    'Sync Job', BRAND_DK, BRAND_PALE, sub='Every 15 min · Queueable')
        self._actor(c, col4_x, top_y, box_w, box_h,
                    'Cloudflare Images', CF_ORANGE, CF_PALE, sub='CDN delivery')

        arr_y = top_y + box_h / 2
        # Labels drawn ABOVE the top row (10mm gap between columns is too narrow for labels)
        label_y = top_y + box_h + 3*mm
        self._harrow(c, col1_x + box_w, col2_x, arr_y,
                     '1. Upload to Photos/', label_y=label_y)
        self._harrow(c, col2_x + box_w, col3_x, arr_y,
                     '2. List + download',   label_y=label_y)
        self._harrow(c, col3_x + box_w, col4_x, arr_y,
                     '3. POST /images/v1',   label_y=label_y)

        # ── MIDDLE — Salesforce persistence (under Sync Job) ────────
        self._actor(c, col3_x, mid_y, box_w, box_h,
                    'Salesforce', SF_BLUE, SF_PALE,
                    sub='Property_Image__c junction')

        # Arrow: Sync Job (top) → Salesforce (mid) — vertical down
        sync_cx = col3_x + box_w / 2
        self._varrow_down(c, sync_cx, top_y, sync_cx, mid_y + box_h,
                          '4. Write junction (Box Id + CF Id)')

        # ── BOTTOM — display layer (under Salesforce) ───────────────
        lwc_w = box_w * 2 + gap_x
        lwc_x = col2_x
        self._actor(c, lwc_x, bot_y, lwc_w, box_h,
                    'LWCs / Housebuilder Portal', BRAND_MID, BRAND_PALE,
                    sub='primaryImageDisplay · customCarousel · external portal')

        # Arrow: Salesforce (mid) → LWCs (bot) — vertical down, offset left so
        # it doesn't collide with the Cloudflare-to-LWC arrow on the right
        sf_read_cx = col3_x + box_w * 0.35
        self._varrow_down(c, sf_read_cx, mid_y, sf_read_cx, bot_y + box_h,
                          '5. Read refs', dashed=True)

        # Arrow: Cloudflare (top-right) → LWCs (bottom) — vertical down then
        # left to meet the LWC right edge. Runs in empty space to the right
        # of Salesforce; label placed on the LEFT of the vertical so it
        # doesn't overflow the page margin.
        cf_cx = col4_x + box_w / 2           # vertical-segment x
        lwc_right = lwc_x + lwc_w            # horizontal-segment end x
        c.setStrokeColor(CF_ORANGE); c.setLineWidth(0.9)
        # Vertical segment (Cloudflare → down)
        c.line(cf_cx, top_y - 1.5*mm, cf_cx, bot_y + box_h / 2)
        # Horizontal segment (right → left, into LWC box)
        c.line(cf_cx, bot_y + box_h / 2, lwc_right + 1.5*mm, bot_y + box_h / 2)
        # Arrowhead points LEFT into LWC right edge
        hx = lwc_right + 1.5*mm
        hy = bot_y + box_h / 2
        c.line(hx, hy, hx + 2*mm, hy + 1.3*mm)
        c.line(hx, hy, hx + 2*mm, hy - 1.3*mm)
        # Label for arrow 6 — sit in the safe rectangle between Salesforce's
        # right edge (126mm) and the vertical CDN line (153mm), below Salesforce
        # (mid_y = 60mm) and above the LWC top (32mm). That's ~27mm × ~28mm of
        # empty space where nothing else is drawn.
        c.setFillColor(INK); c.setFont('Helvetica', 7)
        label_x = col3_x + box_w + 3*mm            # = 129mm, just right of Salesforce
        label_y_top = mid_y - 8*mm                 # = 52mm, below Salesforce bottom
        c.drawString(label_x, label_y_top,          '6. Public CDN fetch')
        c.drawString(label_x, label_y_top - 3.5*mm, '   (no SF session)')

    def _actor(self, c, x, y, w, h, label, stroke_color, fill_color, sub=None):
        c.setStrokeColor(stroke_color); c.setLineWidth(1.2)
        c.setFillColor(fill_color)
        c.roundRect(x, y, w, h, 2*mm, stroke=1, fill=1)
        c.setFillColor(stroke_color); c.setFont('Helvetica-Bold', 9.5)
        text_y = y + h - 7*mm if sub else y + h/2 - 2*mm
        c.drawCentredString(x + w/2, text_y, label)
        if sub:
            c.setFont('Helvetica', 6.8); c.setFillColor(MUTED)
            c.drawCentredString(x + w/2, y + 3.5*mm, sub)

    def _harrow(self, c, x1, x2, y, label='', dashed=False, label_y=None):
        """Horizontal arrow. If label_y is supplied, the label is drawn at that Y
        (e.g. above the row of boxes); otherwise it hugs the arrow line."""
        c.setStrokeColor(BRAND_MID); c.setLineWidth(0.9)
        if dashed: c.setDash([2, 2])
        sx = x1 + 1.5*mm
        ex = x2 - 1.5*mm
        c.line(sx, y, ex, y)
        c.setDash()
        c.line(ex, y, ex - 2*mm, y + 1.3*mm)
        c.line(ex, y, ex - 2*mm, y - 1.3*mm)
        if label:
            c.setFillColor(INK); c.setFont('Helvetica', 7)
            ly = label_y if label_y is not None else y + 1.8*mm
            c.drawCentredString((sx + ex) / 2, ly, label)

    def _varrow_down(self, c, x1, y1, x2, y2, label='', dashed=False):
        """Draw an arrow going DOWN from (x1, y1) to (x2, y2)."""
        c.setStrokeColor(BRAND_MID); c.setLineWidth(0.9)
        if dashed: c.setDash([2, 2])
        sy = y1 - 1.5*mm  # start just below top box
        ey = y2 + 1.5*mm  # end just above bottom box
        c.line(x1, sy, x2, ey)
        c.setDash()
        c.line(x2, ey, x2 - 1.3*mm, ey + 2*mm)
        c.line(x2, ey, x2 + 1.3*mm, ey + 2*mm)
        if label:
            c.setFillColor(INK); c.setFont('Helvetica', 7)
            c.drawString(x1 + 2*mm, (sy + ey) / 2, label)


# ── Sequence diagram (Photo sync flow) ─────────────────────────────────
class SequenceDiagram(Flowable):
    WIDTH = 180 * mm
    HEIGHT = 100 * mm

    def wrap(self, availWidth, availHeight):
        return self.WIDTH, self.HEIGHT

    def draw(self):
        c = self.canv
        # Actor columns
        lanes = [
            ('Photographer', 20*mm, PHOTOGRAPHER_PURPLE),
            ('Box', 55*mm, BOX_BLUE),
            ('Sync Job', 95*mm, BRAND_DK),
            ('Cloudflare', 135*mm, CF_ORANGE),
            ('Salesforce', 170*mm, SF_BLUE),
        ]
        top_y = self.HEIGHT - 8*mm
        bottom_y = 6*mm

        # Draw actor headers + lifelines
        for (name, x, color) in lanes:
            c.setFillColor(color); c.setStrokeColor(color); c.setLineWidth(1)
            c.roundRect(x - 14*mm, top_y, 28*mm, 6*mm, 1*mm, stroke=1, fill=1)
            c.setFillColor(white); c.setFont('Helvetica-Bold', 8)
            c.drawCentredString(x, top_y + 1.5*mm, name)
            # Dashed lifeline
            c.setStrokeColor(MUTED_LT); c.setLineWidth(0.4); c.setDash([1.5, 2])
            c.line(x, top_y, x, bottom_y)
            c.setDash()

        # Sequence messages (y decreases)
        y = top_y - 8*mm
        messages = [
            (lanes[0][1], lanes[1][1], 'Upload foo.jpg → /Photos/', MUTED),
            (lanes[2][1], lanes[1][1], 'GET /folders/{id}/items?modified_after=T-1', BRAND_DK),
            (lanes[1][1], lanes[2][1], '[{id, name, size}, …]', BOX_BLUE),
            (lanes[2][1], lanes[1][1], 'GET /files/{id}/content (bytes)', BRAND_DK),
            (lanes[1][1], lanes[2][1], 'JPG binary', BOX_BLUE),
            (lanes[2][1], lanes[3][1], 'POST /images/v1 (multipart)', BRAND_DK),
            (lanes[3][1], lanes[2][1], '{id, variants: [hero, thumb, public]}', CF_ORANGE),
            (lanes[2][1], lanes[4][1], 'insert Property_Image__c (refs + URLs)', BRAND_DK),
            (lanes[4][1], lanes[2][1], 'OK', SF_BLUE),
        ]
        row_h = 8*mm
        for (from_x, to_x, text, color) in messages:
            y -= row_h
            c.setStrokeColor(color); c.setLineWidth(0.8)
            c.line(from_x, y, to_x, y)
            # Arrow
            import math
            dx = to_x - from_x
            arr_size = 2*mm
            sign = 1 if dx > 0 else -1
            c.line(to_x, y, to_x - sign*arr_size*math.cos(math.pi/8), y + arr_size*math.sin(math.pi/8))
            c.line(to_x, y, to_x - sign*arr_size*math.cos(math.pi/8), y - arr_size*math.sin(math.pi/8))
            # Label on the line
            mx = (from_x + to_x) / 2
            c.setFillColor(INK); c.setFont('Helvetica', 7)
            c.drawCentredString(mx, y + 1.5*mm, text)

        # Explanation footer
        c.setFillColor(MUTED); c.setFont('Helvetica-Oblique', 7)
        c.drawCentredString(self.WIDTH/2, 2*mm,
            'Fig 2: End-to-end sync for a single newly uploaded photo. Entire sequence ≤ 3 sec per image.')


# ── Helpers ────────────────────────────────────────────────────────────
def bullet(story, text):
    story.append(Paragraph(f'•&nbsp;&nbsp;{text}', BULLET))


# Cell styles — wrapped versions so text reflows within narrow columns
CELL_LABEL = ParagraphStyle('CellLabel', parent=ss['Normal'],
    fontName='Helvetica-Bold', fontSize=9.5, textColor=BRAND_DK, leading=12)
CELL_BODY = ParagraphStyle('CellBody', parent=ss['Normal'],
    fontName='Helvetica', fontSize=9, textColor=INK, leading=12)
CELL_BODY_SM = ParagraphStyle('CellBodySm', parent=ss['Normal'],
    fontName='Helvetica', fontSize=8.5, textColor=INK, leading=11)
CELL_HEADER = ParagraphStyle('CellHeader', parent=ss['Normal'],
    fontName='Helvetica-Bold', fontSize=9, textColor=white, leading=12)


def _as_para(cell, style):
    """Turn any cell (str / Paragraph) into a Paragraph so Table will wrap text."""
    if isinstance(cell, Paragraph):
        return cell
    return Paragraph(str(cell) if cell is not None else '', style)


def kv_table(story, rows, col_widths=None):
    col_widths = col_widths or [45*mm, 125*mm]
    wrapped = [[_as_para(r[0], CELL_LABEL), _as_para(r[1], CELL_BODY)] for r in rows]
    t = Table(wrapped, colWidths=col_widths, hAlign='LEFT')
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), BRAND_PALE),
        ('LINEBELOW', (0, 0), (-1, -1), 0.3, DIVIDER),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 9),
        ('RIGHTPADDING', (0, 0), (-1, -1), 9),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(t)
    story.append(Spacer(1, 8))


def header_table(story, header, rows, col_widths, body_style=None):
    body_style = body_style or CELL_BODY_SM
    wrapped_header = [_as_para(c, CELL_HEADER) for c in header]
    wrapped_rows = [[_as_para(c, body_style) for c in row] for row in rows]
    data = [wrapped_header] + wrapped_rows
    t = Table(data, colWidths=col_widths, hAlign='LEFT', repeatRows=1)
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), BRAND_DK),
        ('GRID', (0, 0), (-1, -1), 0.3, DIVIDER),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [white, BRAND_PALE]),
    ]))
    story.append(t)
    story.append(Spacer(1, 8))


# ── Build document ──────────────────────────────────────────────────────
def build():
    doc = SimpleDocTemplate(OUT, pagesize=A4,
        leftMargin=15*mm, rightMargin=15*mm,
        topMargin=20*mm, bottomMargin=20*mm,
        title='Platform Images — Cloudflare CDN Integration — Architectural Proposal',
        author='CRM Mates Ltd — Deepak K Rana')
    story = []

    # ── Cover ──
    story.append(Spacer(1, 55*mm))
    story.append(Paragraph('ARCHITECTURAL PROPOSAL', COVER_KICK))
    story.append(Paragraph('Platform Images —<br/>Cloudflare CDN Integration', COVER_TITLE))
    story.append(Paragraph(
        'A multi-channel image pipeline that preserves the photographer workflow, delivers '
        'every property photo, housebuilder logo and brand asset from a public CDN, and '
        'unlocks external portal use cases.',
        COVER_SUB))

    kv_table(story, [
        ['Proposal reference', 'TSK-00017 — Cloudflare Images Integration'],
        ['Client', 'New Home Solutions Ltd'],
        ['Delivery partner', 'CRM Mates Ltd — Deepak K Rana'],
        ['Document version', '1.0 · 23 April 2026'],
        ['Status', 'Awaiting client approval (Cloudflare account + sign-off)'],
        ['Estimated effort', '≈ 2 engineering days (excl. Cloudflare account setup)'],
    ], col_widths=[45*mm, 125*mm])

    story.append(Spacer(1, 10*mm))
    story.append(Paragraph(
        '<b>In one sentence:</b> photographer uploads, housebuilder logos, API-sourced property '
        'images and NHS brand assets all converge on a single Cloudflare Images account; every '
        'consumer — internal Salesforce pages, generated PDFs, emails and the external '
        'Housebuilder Portal — renders from the CDN, with Box and Salesforce Files as silent '
        'backups.',
        BODY_LEAD))

    story.append(PageBreak())

    # ── 1. Executive Summary ──
    story.append(Paragraph('1. Executive Summary', H1))
    story.append(Paragraph(
        'The NHS platform currently stores property photographs in three disjoint locations: '
        'Salesforce Files (1,220 JPGs across 206 property records), the Box <i>Photos/</i> '
        'subfolder of each application, and externally hosted brand assets (the NHS logo on '
        'ImgBB). This fragmentation produces three concrete problems:',
        BODY))
    bullet(story, 'Rendering is <b>slow and authenticated</b> — every image fetch hits '
                 'Salesforce, burning session cycles and making the page feel sluggish.')
    bullet(story, 'There is <b>no public delivery path</b>, so the planned Housebuilder Portal '
                 '(Experience Cloud) cannot display property photos to external users without '
                 'building a bespoke authenticated-proxy endpoint.')
    bullet(story, 'Salesforce file storage is consumed (~120 MB today, growing with every '
                 'application) when a CDN-hosted solution is cheaper, faster, and scales '
                 'better.')
    story.append(Paragraph(
        'This proposal introduces <b>Cloudflare Images</b> as the delivery layer for property '
        'photography. The critical design constraint is that <b>photographers keep their current '
        'Box-based workflow unchanged</b>. Sync happens invisibly. Box remains the source of '
        'truth so nothing is lost if Cloudflare is ever deprecated or replaced.',
        BODY))

    story.append(Paragraph('Key outcomes', H2))
    bullet(story, '<b>Faster rendering</b> — Cloudflare CDN delivery in &lt; 100 ms vs. ~1 s on the '
                 'current Salesforce authenticated path.')
    bullet(story, '<b>Public-ready URLs</b> — unlocks the Housebuilder Portal and any future '
                 'external-facing property viewing scenarios.')
    bullet(story, '<b>Auto-generated variants</b> — thumbnail / hero / social sizes served from '
                 'one original, no Salesforce-side resizing.')
    bullet(story, '<b>Storage reclaimed</b> — ~120 MB of Salesforce Files freed.')
    bullet(story, '<b>Photographer workflow intact</b> — they continue uploading to Box.')

    story.append(PageBreak())

    # ── 2. Current State ──
    story.append(Paragraph('2. Current State Analysis', H1))
    story.append(Paragraph(
        'A full audit of image storage across the platform identified six distinct flows:',
        BODY))

    header_table(story,
        ['#', 'Image type', 'Stored in', 'Volume'],
        [
            ['1', 'Property photos (primary + gallery)', 'Salesforce Files (ContentVersion)', '1,220 JPGs · ~120 MB'],
            ['2', 'Property photos (uploaded by photographers)', 'Box — Photos/ subfolder per application', 'Growing; no central index'],
            ['3', 'Housebuilder logos', 'Box — Housebuilder/<Name>/Logo/', '≈ 20 files'],
            ['4', 'NHS brand logo', 'ImgBB external CDN (third-party)', '1 file · fragile link'],
            ['5', 'Valuation Report PDFs (embed images)', 'Box — Valuations/ subfolder', '≈ 200 files'],
            ['6', 'Comms Hub email attachments', 'Salesforce Files (inbound)', 'Incidental'],
        ],
        col_widths=[10*mm, 52*mm, 72*mm, 36*mm])

    story.append(Paragraph('Pain points observed in production', H2))
    bullet(story, '<b>Duplicate sources</b> — photographers sometimes upload the same shots to '
                 'Box and to the Salesforce Property record, leading to drift and confusion '
                 'over which set is canonical.')
    bullet(story, '<b>17/206 properties have a Primary_Image</b> — the Salesforce-native upload '
                 'UX is under-used, suggesting photographers gravitate to Box.')
    bullet(story, '<b>ImgBB-hosted brand logo</b> is a single point of failure for every email '
                 'the platform sends; it should be migrated to NHS-controlled CDN storage.')
    bullet(story, '<b>Authenticated rendering</b> on the Application Detail page means a '
                 'Wain-Homes-facing portal cannot share property images without complex '
                 'proxy logic.')

    story.append(PageBreak())

    # ── 3. Where Cloudflare Images will be used ──
    story.append(Paragraph('3. Where Cloudflare Images will be used', H1))
    story.append(Paragraph(
        'Cloudflare Images becomes the delivery layer for every property photo, housebuilder '
        'logo and brand asset across the NHS platform. The table below maps each surface — '
        'internal Salesforce pages, generated artefacts, emails, and the external Housebuilder '
        'Portal — to the image types it will serve via Cloudflare once the integration is live.',
        BODY))

    header_table(story,
        ['#', 'Surface', 'Image types served', 'Primary benefit'],
        [
            ['1',
             '<b>Property record page</b> (internal Lightning)',
             'Property hero + gallery (all photos per property)',
             'Fast CDN render vs. current authenticated Salesforce Files fetch'],
            ['2',
             '<b>Application Detail V2</b> — Quick Summary card',
             'Property hero + Housebuilder logo',
             'Dashboard loads with no flash of unstyled content'],
            ['3',
             '<b>Kanban pipeline cards</b> (Application Kanban)',
             'Property thumbnail variant',
             'Fast scroll through 100+ cards, tiny image payload'],
            ['4',
             '<b>Property Search results</b>',
             'Property thumbnail + map marker pin',
             'Responsive filter-and-scroll grid experience'],
            ['5',
             '<b>Create Application</b> form (public)',
             'Housebuilder logo (once builder is selected)',
             'Branded form header; no Salesforce session required'],
            ['6',
             '<b>Housebuilder Detail</b> page',
             'Housebuilder logo (hero) + preferred-agent logos (tab)',
             'Branded hero; optional agent branding alongside'],
            ['7',
             '<b>Valuation Report PDF</b> (generated for vendor)',
             'Housebuilder logo + NHS brand logo + property hero (optional)',
             'Faster PDF generation; reliable branding'],
            ['8',
             '<b>Email templates</b> (all 10 NHS_ templates)',
             'NHS brand logo (header band) + optional housebuilder logo',
             'Replaces fragile ImgBB link; adds per-housebuilder branding'],
            ['9',
             '<b>Housebuilder Portal</b> (Experience Cloud — EXTERNAL)',
             'Property photos, housebuilder logo, NHS brand',
             'Public URLs make the portal feasible without auth-proxy hacks'],
            ['10',
             '<b>Application Journey timeline</b> (on Portal)',
             'Property hero at each milestone card',
             'Rich visual timeline without Salesforce session cost'],
        ],
        col_widths=[10*mm, 45*mm, 60*mm, 55*mm])

    story.append(Paragraph('What stays on its current storage', H2))
    bullet(story, '<b>Box Valuation Reports</b> and <b>Will Reports</b> — these are multi-page '
                 'PDFs, not images; they stay in Box where photographers and valuers already '
                 'manage them.')
    bullet(story, '<b>Comms Hub inbound email attachments</b> — transient, vendor-sent images '
                 'that belong with their EmailMessage record in Salesforce Files.')
    bullet(story, '<b>Box <font face="Courier" size="9">Photos/</font> subfolders</b> remain as '
                 'the source of truth for photographer uploads — Cloudflare is the delivery '
                 'mirror, not a replacement.')

    story.append(Paragraph('Integration footprint', H2))
    story.append(Paragraph(
        'Across the ten surfaces above, a rough count: <b>3 LWC updates</b> '
        '(<font face="Courier" size="9">primaryImageDisplay</font>, '
        '<font face="Courier" size="9">customCarousel</font>, '
        '<font face="Courier" size="9">lightbox</font>), '
        '<b>1 new LWC</b> for the Housebuilder Portal image surfaces, '
        '<b>1 VF page</b> update for the Valuation Report PDF template, and '
        '<b>10 email templates</b> with the brand-logo URL swapped. '
        'Every one of those touch points continues to work on its current storage if the '
        'Cloudflare integration is disabled — the fallback chain described in §9 keeps them '
        'running from Salesforce Files or Box directly.',
        BODY))

    story.append(PageBreak())

    # ── 4. Upload Channels — how images enter Cloudflare ──
    story.append(Paragraph('4. Upload Channels — how images enter Cloudflare', H1))
    story.append(Paragraph(
        'The platform has <b>five distinct upload channels</b>. Each has its own user, trigger, '
        'and cadence. The channels converge on a single Cloudflare Images account — so consumers '
        '(listed in §3) render from one CDN regardless of how the image got there.',
        BODY))

    story.append(ChannelsDiagram())
    story.append(Paragraph(
        'Fig 1: five upload channels converging on Cloudflare Images. Box photographer sync is '
        'the only scheduled path — every other channel pushes in real-time.',
        CAPTION))

    story.append(Paragraph('4.1  Channel summary', H2))
    header_table(story,
        ['#', 'Channel', 'User', 'Trigger + cadence', 'Phase'],
        [
            ['1', '<b>Box — Photos/ folder</b>', 'Photographer (existing workflow)',
             'Schedulable sync · every 15 min', 'Day 1'],
            ['2', '<b>Mobile App</b> (future)', 'Photographer / on-site staff',
             'Direct Creator Upload (signed URL) · real-time', 'Future phase'],
            ['3', '<b>Housebuilder Logo</b>', 'NHS admin (settings cog)',
             'Real-time push inside <font face="Courier" size="8">replaceLogo()</font>', 'Day 1'],
            ['4', '<b>Property Data API</b>', 'Automated (<font face="Courier" size="8">streetDataService</font>)',
             'Real-time push inside <font face="Courier" size="8">storeImages()</font>', 'Day 1'],
            ['5', '<b>NHS Brand Logo</b>', 'NHS admin (one-off)',
             'Upload once via NHS Config · stored on <font face="Courier" size="8">NHS_API_Config__c</font>', 'Day 1'],
        ],
        col_widths=[8*mm, 38*mm, 40*mm, 60*mm, 24*mm])

    story.append(Paragraph('4.2  Channel details', H2))

    story.append(Paragraph('<b>Channel 1 — Box Photos/</b> (day 1, existing)', H3))
    story.append(Paragraph(
        'Photographers continue to upload JPGs to <font face="Courier" size="9">Housebuilder/'
        '&lt;Builder&gt;/&lt;Property&gt;/Photos/</font> in Box. The Schedulable Apex job scans '
        'each Opportunity\'s Photos/ subfolder every 15 minutes and pushes new files to '
        'Cloudflare. This is the canonical flow detailed in §6.',
        BODY))

    story.append(Paragraph('<b>Channel 2 — Mobile App</b> (future phase)', H3))
    story.append(Paragraph(
        'When the mobile app is built, it will use Cloudflare\'s <b>Direct Creator Upload</b> '
        'pattern. Flow: (a) app asks Salesforce for a one-time signed upload URL for a given '
        'Property Id; (b) Salesforce calls Cloudflare <font face="Courier" size="9">POST '
        '/images/v1/direct_upload</font> to mint the URL; (c) the app uploads the JPG directly '
        'to Cloudflare (no Salesforce governor limits, no bandwidth through the org); (d) the '
        'app calls back to Salesforce with the returned image Id; (e) Salesforce inserts a '
        '<font face="Courier" size="9">Property_Image__c</font> junction row. Seconds, not '
        'minutes; no Box detour. Scope-parked for Day 1 but the data model and Cloudflare '
        'configuration are forward-compatible.',
        BODY))

    story.append(Paragraph('<b>Channel 3 — Housebuilder Logo</b> (day 1)', H3))
    story.append(Paragraph(
        'When an NHS admin replaces a housebuilder logo via the Housebuilder Detail settings cog, '
        '<font face="Courier" size="9">NhsHousebuilderController.replaceLogo()</font> already '
        'uploads to Box for archival. We extend the same method to push to Cloudflare in parallel '
        'and store the resulting image Id on a new field '
        '<font face="Courier" size="9">Account.Cloudflare_Logo_Image_Id__c</font> and delivery '
        'URL on <font face="Courier" size="9">Account.Cloudflare_Logo_URL__c</font>. No sync lag; '
        'fallback chain (§9) still reads Box if Cloudflare is unreachable.',
        BODY))

    story.append(Paragraph('<b>Channel 4 — Property Data API</b> (day 1)', H3))
    story.append(Paragraph(
        'Currently, <font face="Courier" size="9">streetDataService</font> fetches property images '
        'from the Property Data API and calls '
        '<font face="Courier" size="9">ImageURLToFileObject.storeImages()</font>, which creates '
        'Salesforce ContentVersion rows on the Property record. We extend '
        '<font face="Courier" size="9">storeImages()</font> to additionally push each image to '
        'Cloudflare and create a <font face="Courier" size="9">Property_Image__c</font> junction '
        'row with <font face="Courier" size="9">Source__c = \'API\'</font>. During transition we '
        'keep the ContentVersion write for backward compatibility; a follow-up cleanup can drop it '
        'once Cloudflare delivery is trusted.',
        BODY))

    story.append(Paragraph('<b>Channel 5 — NHS Brand Logo</b> (day 1, one-off)', H3))
    story.append(Paragraph(
        'The NHS brand logo currently sits on the public ImgBB CDN — a third-party, fragile link '
        'used in every one of the 10 email templates. A one-off admin action uploads the logo to '
        'Cloudflare (NHS-owned account), stores the delivery URL on a new field '
        '<font face="Courier" size="9">NHS_API_Config__c.NHS_Brand_Logo_URL__c</font>, and a '
        'bulk REST update replaces the ImgBB URL in every email template (see '
        '<font face="Courier" size="9">scripts/update_email_template_footer.py</font> for the '
        'existing pattern). Same path supports any future brand asset (NHS mark, agent logos, '
        'partner branding) used on external portals.',
        BODY))

    story.append(Paragraph('4.3  Why mix scheduled sync with real-time push?', H2))
    story.append(Paragraph(
        'Photographer Box uploads are the only channel where NHS doesn\'t control the upload code '
        'path — they use Box\'s own UI/app. The 15-minute sync is the cost of not changing their '
        'workflow. Every other channel already flows through NHS Apex, so we can push to '
        'Cloudflare synchronously at the point of upload — immediate visibility, no stale state. '
        'The mobile app (when built) bypasses even this — direct-to-Cloudflare with Salesforce '
        'only acting as the authorisation broker.',
        BODY))

    story.append(PageBreak())

    # ── 5. Proposed Architecture ──
    story.append(Paragraph('5. Proposed Architecture', H1))
    story.append(Paragraph(
        'Three-tier architecture: <b>Box</b> (source of truth, photographer upload target) → '
        '<b>Salesforce sync layer</b> (Schedulable Apex job) → <b>Cloudflare Images</b> (public '
        'CDN). A junction object (<font face="Courier" size="9">Property_Image__c</font>) '
        'holds both references so either storage layer can be trusted independently.',
        BODY))
    story.append(Spacer(1, 4))
    story.append(ArchDiagram())
    story.append(Paragraph(
        'Fig 1: end-to-end flow. Solid arrows are write/update paths; dashed arrow is '
        'the read path used by display layer LWCs.',
        CAPTION))

    story.append(Paragraph('Why a sync-based (not proxy-based) design', H2))
    bullet(story, '<b>Decoupling</b> — Box outages don\'t bring down image rendering; Cloudflare '
                 'outages don\'t stop Box uploads. Either layer can be replaced in isolation.')
    bullet(story, '<b>Cache efficiency</b> — Cloudflare edge caches are warm; authenticated '
                 'proxies through Salesforce would re-authenticate every request.')
    bullet(story, '<b>Portal readiness</b> — public CDN URLs mean the Housebuilder Portal '
                 '(external users) works without session-passing hacks.')
    bullet(story, '<b>Photographer UX preserved</b> — no change to Box-based workflow; no '
                 'training, no new credentials, no new tool for them to learn.')

    story.append(PageBreak())

    # ── 6. Data Model ──
    story.append(Paragraph('6. Data Model Changes', H1))

    story.append(Paragraph('6.1  New junction object — Property_Image__c', H2))
    story.append(Paragraph(
        'One row per photo. Holds both the Box file reference <b>and</b> the Cloudflare image '
        'reference, so either layer remains independently queryable.',
        BODY))
    header_table(story,
        ['Field', 'Type', 'Purpose'],
        [
            ['Property__c', 'Lookup(NHS_Property__c)', 'Which property the photo belongs to'],
            ['Application__c', 'Lookup(Opportunity) (optional)', 'Source application that originated the upload'],
            ['Box_File_Id__c', 'Text(32) · unique · external Id', 'Source-of-truth reference'],
            ['Box_File_Name__c', 'Text(255)', 'Original filename from photographer'],
            ['Cloudflare_Image_Id__c', 'Text(64) · unique', 'Delivery-layer reference (e.g. 7abc…f21)'],
            ['Cloudflare_Hero_URL__c', 'URL(500)', 'Full-size CDN URL (e.g. .../public)'],
            ['Cloudflare_Thumb_URL__c', 'URL(500)', 'Thumbnail variant (e.g. .../thumb)'],
            ['Is_Primary__c', 'Checkbox', 'Marks the hero image of the property'],
            ['Uploaded_At__c', 'DateTime', 'Timestamp pulled from Box metadata'],
            ['Uploaded_By_Box_User__c', 'Text(255)', 'Audit — who took the photo'],
            ['Sync_Status__c', 'Picklist {Synced, Pending, Error}', 'Visibility on sync state'],
            ['Sync_Error__c', 'Long Text', 'Error message if sync failed'],
            ['Last_Sync_At__c', 'DateTime', 'When Cloudflare was last updated'],
        ],
        col_widths=[50*mm, 50*mm, 70*mm])

    story.append(Paragraph('6.2  New fields on NHS_API_Config__c', H2))
    header_table(story,
        ['Field', 'Type', 'Purpose'],
        [
            ['Cloudflare_API_Token__c', 'Text(255) · encrypted', 'Cloudflare Images API bearer token'],
            ['Cloudflare_Account_Id__c', 'Text(64)', 'Cloudflare account identifier'],
            ['Cloudflare_Delivery_URL__c', 'URL(255)', 'e.g. https://imagedelivery.net/<hash>'],
            ['Cloudflare_Last_Sync_At__c', 'DateTime', 'Watermark for incremental sync'],
            ['Cloudflare_Daily_Quota__c', 'Number', 'Soft limit to avoid runaway uploads'],
            ['Cloudflare_Sync_Enabled__c', 'Checkbox', 'Kill-switch for rollback'],
        ],
        col_widths=[55*mm, 40*mm, 75*mm])

    story.append(Paragraph('6.3  Existing artefacts — untouched', H2))
    bullet(story, '<font face="Courier" size="9">NHS_Property__c.Primary_Image__c</font> remains '
                 'for backward compatibility; the sync writes the equivalent URLs to '
                 '<font face="Courier" size="9">Property_Image__c.Cloudflare_Hero_URL__c</font> '
                 'alongside.')
    bullet(story, 'Existing <font face="Courier" size="9">ContentVersion</font> rows stay in '
                 'place during the migration; a one-shot backfill script uploads their bytes to '
                 'Cloudflare and creates matching junction rows.')
    bullet(story, 'Box folder structure — <i>no change</i>. The sync job is a read-only consumer.')

    story.append(PageBreak())

    # ── 7. Sync Workflow ──
    story.append(Paragraph('7. Sync Workflow (Channel 1 — Box)', H1))
    story.append(Paragraph(
        'The sync engine is a Salesforce Schedulable Apex class that delegates the heavy work '
        'to Queueable chains. It runs every 15 minutes by default (configurable). '
        'Idempotent — re-running over the same time window produces no duplicates.',
        BODY))

    story.append(SequenceDiagram())

    story.append(Paragraph('7.1  Sync algorithm', H2))
    bullet(story, '<b>Step 1</b> — read <font face="Courier" size="9">Cloudflare_Last_Sync_At__c</font> watermark.')
    bullet(story, '<b>Step 2</b> — for every Opportunity with a Box folder, list items in the '
                 'Photos/ subfolder where <font face="Courier" size="9">modified_at &gt; watermark</font>.')
    bullet(story, '<b>Step 3</b> — dedupe against existing '
                 '<font face="Courier" size="9">Property_Image__c.Box_File_Id__c</font>.')
    bullet(story, '<b>Step 4</b> — for each new file: download bytes (Box GET /files/{id}/content), '
                 'upload to Cloudflare (POST /images/v1), receive image Id + variant URLs.')
    bullet(story, '<b>Step 5</b> — insert <font face="Courier" size="9">Property_Image__c</font> '
                 'row linking property, Box file Id, and Cloudflare URLs.')
    bullet(story, '<b>Step 6</b> — update watermark to max(modified_at) across this batch.')

    story.append(Paragraph('7.2  Throttles &amp; limits', H2))
    header_table(story,
        ['Constraint', 'Strategy'],
        [
            ['Apex callout limit (100/tx)', 'Chunk by 40 files per Queueable; chain further Queueables until done'],
            ['Apex CPU limit', 'Download + upload in Queueable (async, 60 sec / 10 min for scheduled)'],
            ['Box rate limit (1000/min)', 'Well within — the schedule runs every 15 min'],
            ['Cloudflare rate limit', 'Handled; single uploads, no burst pattern'],
            ['Salesforce storage', 'Not impacted — we never create a ContentVersion for sync images'],
        ],
        col_widths=[60*mm, 110*mm])

    story.append(Paragraph('7.3  Manual "Sync Now" button', H2))
    story.append(Paragraph(
        'On the Property Detail and Application Detail pages, a <i>Sync Photos Now</i> button '
        'triggers the same Queueable against a single Box folder for ad-hoc immediate sync '
        '(for when the 15-minute cadence is too slow — e.g. during a live vendor visit).',
        BODY))

    story.append(PageBreak())

    # ── 8. Display Layer ──
    story.append(Paragraph('8. Display Layer Changes', H1))
    story.append(Paragraph(
        'Two LWCs today own image rendering: <font face="Courier" size="9">primaryImageDisplay</font> '
        '(the hero image on the Property record) and <font face="Courier" size="9">customCarousel</font> '
        '(the gallery). The change is subtle but important — prefer the Cloudflare URL if a '
        'junction row exists; fall back to the existing ContentVersion-based path otherwise.',
        BODY))

    story.append(Paragraph('8.1  Rendering precedence', H2))
    bullet(story, '<b>1st preference</b> — <font face="Courier" size="9">Property_Image__c.Cloudflare_Hero_URL__c</font> '
                 '(public CDN, fastest).')
    bullet(story, '<b>2nd preference</b> — Box authenticated proxy '
                 '(<font face="Courier" size="9">getBoxImageBase64(recordId)</font>) if Cloudflare is '
                 'configured but the sync hasn\'t caught up yet.')
    bullet(story, '<b>3rd preference</b> — Salesforce <font face="Courier" size="9">ContentVersion</font> '
                 'via <font face="Courier" size="9">/sfc/servlet.shepherd</font> (legacy path, '
                 'covers pre-migration images).')

    story.append(Paragraph('8.2  New consumers enabled by public URLs', H2))
    bullet(story, '<b>Housebuilder Portal</b> (Experience Cloud) — external users can see property '
                 'photos without needing a Salesforce session. This was a blocker on the mockup we '
                 'delivered yesterday; this proposal unblocks it. See §3 for the full consumer list.')
    bullet(story, '<b>Email templates</b> — Wain Homes and others can receive emails with inline '
                 'property photos rendered via stable public URLs.')
    bullet(story, '<b>Future public listings / portal widgets</b> — any third-party integration '
                 '(Rightmove, Zoopla feeds) can consume Cloudflare URLs directly.')

    story.append(Paragraph('8.3  LWCs requiring update', H2))
    header_table(story,
        ['LWC', 'Change'],
        [
            ['primaryImageDisplay', 'Check Property_Image__c first; fall back to Primary_Image__c'],
            ['customCarousel', 'Query Property_Image__c junction; render all CDN URLs'],
            ['lightbox', 'Accept pre-signed Cloudflare URL as input'],
            ['nhsBoxBrowser', '(No change) — still used by photographers via Box UI'],
            ['New: nhsHousebuilderPortal', 'Render photos via public CDN URLs only'],
        ],
        col_widths=[50*mm, 120*mm])

    story.append(PageBreak())

    # ── 9. Error Handling & Fallback ──
    story.append(Paragraph('9. Reliability, Error Handling &amp; Fallback', H1))
    story.append(Paragraph(
        'Given the silent-failure incidents this week on Box folder creation and PDF upload '
        '(both fixed), this proposal explicitly avoids fire-and-forget patterns. Every sync '
        'operation reports its status, and failures are visible and actionable.',
        BODY))

    story.append(Paragraph('9.1  Failure modes and behaviour', H2))
    header_table(story,
        ['Failure', 'Behaviour'],
        [
            ['Cloudflare API token invalid', 'Abort the Schedulable; raise Platform Event + notify admin; '
             'Sync_Enabled__c flipped to false'],
            ['Box download fails (transient)', 'Row marked Sync_Status__c = Pending with error detail; '
             'retried on next run (up to 3 attempts)'],
            ['Cloudflare upload fails (quota)', 'Row marked Error; quota alert'],
            ['Duplicate file at source (re-upload)', 'Idempotent — Box_File_Id__c unique, re-run skips'],
            ['Cloudflare account deleted', 'Display fallback chain kicks in — Box proxy / Salesforce files'],
        ],
        col_widths=[60*mm, 110*mm])

    story.append(Paragraph('9.2  Observability', H2))
    bullet(story, 'Every sync run writes a <font face="Courier" size="9">NHS_Sync_Log__c</font> record '
                 'with: run start/end, files scanned, files uploaded, failures, duration.')
    bullet(story, 'NHS Config page shows a green/red health bulb for Cloudflare with last-successful-sync '
                 'timestamp and 24-hour failure count.')
    bullet(story, 'Failed <font face="Courier" size="9">Property_Image__c</font> rows surface on a dedicated '
                 'list view so admins can diagnose + retry.')

    story.append(Paragraph('9.3  Kill-switch + rollback', H2))
    story.append(Paragraph(
        'The entire feature is gated behind <font face="Courier" size="9">Cloudflare_Sync_Enabled__c</font>. '
        'Untick it in NHS Config and: (a) the Schedulable job no-ops; (b) LWCs skip Cloudflare and render '
        'from Box/Salesforce directly. No data is lost; the system returns to the pre-rollout behaviour '
        'until the flag is re-enabled.',
        BODY))

    story.append(PageBreak())

    # ── 10. Security ──
    story.append(Paragraph('10. Security &amp; Compliance', H1))

    story.append(Paragraph('10.1  Token handling', H2))
    bullet(story, 'Cloudflare API token stored in <font face="Courier" size="9">NHS_API_Config__c</font> '
                 'as Text(255) with the field marked encrypted / shield-wrapped '
                 '(same pattern as existing Box and Mapbox tokens).')
    bullet(story, 'Token visible only to System Administrators via Permission Set '
                 '<font face="Courier" size="9">NHS_API_Admin</font>.')
    bullet(story, 'No tokens in LWC — LWCs only receive pre-signed delivery URLs.')

    story.append(Paragraph('10.2  Public image URLs', H2))
    bullet(story, 'Cloudflare Images supports <b>signed URLs</b> with expiry — recommended for any '
                 'image not intended for the housebuilder portal.')
    bullet(story, 'Default configuration: hero variant is public; sensitive photos can be toggled '
                 'per <font face="Courier" size="9">Property_Image__c</font> row via an Is_Public__c flag.')
    bullet(story, 'Vendors are informed that property photos may be displayed on the Housebuilder '
                 'Portal (privacy notice update recommended before go-live).')

    story.append(Paragraph('10.3  GDPR considerations', H2))
    bullet(story, '<b>Data minimisation</b> — only property photos migrate; no personal-identifier '
                 'metadata is sent to Cloudflare.')
    bullet(story, '<b>Right to erasure</b> — on vendor request, Apex can delete the Cloudflare image '
                 '(DELETE /images/v1/{id}) and the Property_Image__c row; the Box source file '
                 'remains for audit.')
    bullet(story, '<b>Data residency</b> — Cloudflare Images is globally distributed; '
                 'Cloudflare publishes its UK/EU data compliance posture. Review with legal before '
                 'go-live if vendor photos are considered PII.')

    story.append(PageBreak())

    # ── 11. Cost Analysis ──
    story.append(Paragraph('11. Cost Analysis', H1))
    story.append(Paragraph(
        'Cloudflare Images pricing is linear and predictable. Figures below based on NHS\'s current '
        'volume (1,220 property photos, ~200 applications/month growth).',
        BODY))
    header_table(story,
        ['Line item', 'Cloudflare Images unit cost', 'NHS monthly cost (est.)'],
        [
            ['Storage — first 100k images', '$5/month', '$5.00 (well inside tier)'],
            ['Delivery — per 100k image requests', '$1 per 100k', '≈ $1–3 / month at current traffic'],
            ['Variant transformations', 'Free', '— '],
            ['API calls (uploads)', 'Free', '— '],
            ['Projected total at current scale', '—', '≈ $6–8 / month'],
            ['Projected total at 10× growth (3 years)', '—', '≈ $10–15 / month'],
        ],
        col_widths=[70*mm, 50*mm, 50*mm])
    story.append(Paragraph(
        'For reference: the Salesforce file storage this displaces is valued at roughly '
        '£5/GB/month in Salesforce\'s own pricing. The ~120 MB freed is marginal today but '
        'avoids runaway storage cost as the platform scales.',
        SMALL))

    # ── 12. Rollout Plan ──
    story.append(Paragraph('12. Rollout Plan', H1))
    header_table(story,
        ['Phase', 'Scope', 'Duration', 'Gate'],
        [
            ['A — Account setup', 'NHS signs up for Cloudflare Images; shares API token + account Id', 'Client-side · 1 day',
             'Token received in NHS Config'],
            ['B — Schema + dry-run', 'Deploy junction object, config fields, sync Apex in DRY-RUN mode (logs what it would do)', '½ day',
             'Admin verifies candidate file list'],
            ['C — Live sync + backfill', 'Enable sync; one-shot backfill uploads 1,220 existing photos; watermark set',
             '½ day (+ 2 hr backfill)', 'All existing photos visible via CDN URL'],
            ['D — Display layer', 'Update 3 LWCs to prefer Cloudflare URLs', '½ day',
             'Manual QA on Property + Application pages'],
            ['E — Portal enablement', 'Wire the Housebuilder Portal mockup to consume CDN URLs', '½ day',
             'Portal render verified with non-Salesforce user'],
        ],
        col_widths=[26*mm, 86*mm, 28*mm, 30*mm])
    story.append(Paragraph(
        'Phases B → E run back-to-back after Phase A completes. Total elapsed time ≈ 2 engineering '
        'days plus client-side account setup.',
        BODY))

    story.append(PageBreak())

    # ── 13. Risks ──
    story.append(Paragraph('13. Risks &amp; Mitigations', H1))
    header_table(story,
        ['Risk', 'Likelihood', 'Mitigation'],
        [
            ['Cloudflare outage', 'Low', 'Display layer falls back to Box proxy then Salesforce Files; sync resumes on recovery (per §8)'],
            ['Cost overrun on Cloudflare', 'Low', 'Daily quota guard in Apex; alerts when 80% breached'],
            ['Sync falls behind (backlog)', 'Medium', 'Chained Queueables scale horizontally; "Sync Now" button for ad-hoc urgency'],
            ['Photographer uploads wrong file', 'Low', 'Box is source of truth — they delete from Box, sync deletes from Cloudflare on next run'],
            ['Vendor objects to public display', 'Medium', 'Is_Public__c flag; default-off for sensitive shots; privacy notice refreshed before Portal launch'],
            ['Salesforce API changes', 'Very low', 'Standard AuraEnabled + Schedulable patterns used; not reliant on unreleased features'],
        ],
        col_widths=[55*mm, 22*mm, 93*mm])

    # ── 14. Success Criteria ──
    story.append(Paragraph('14. Success Criteria', H1))
    bullet(story, '<b>Functional</b> — 100% of photos uploaded to Box Photos/ folders appear as '
                 'Property_Image__c records within 15 minutes (or on "Sync Now").')
    bullet(story, '<b>Performance</b> — hero image rendering reduces from ~1 s to &lt; 100 ms as '
                 'measured on the Application Detail page.')
    bullet(story, '<b>Portal-enabled</b> — a non-Salesforce user can open a Housebuilder Portal page '
                 'and see property photos.')
    bullet(story, '<b>Reliability</b> — 7-day soak test with no sync failures unreported; any failures '
                 'surface in NHS Config health bulb and on the failed-sync list view.')
    bullet(story, '<b>No regression</b> — existing Property records without Cloudflare-synced photos '
                 'continue to display via the Salesforce Files fallback, unchanged.')

    story.append(PageBreak())

    # ── 15. Approval & Next Steps ──
    story.append(Paragraph('15. Approval &amp; Next Steps', H1))
    story.append(Paragraph(
        'To proceed with implementation, the following are required:',
        BODY))
    bullet(story, '<b>Sign-off on the architecture</b> described in sections 3–6.')
    bullet(story, '<b>Cloudflare Images account</b> activated by NHS (approx. £4 setup, no '
                 'long-term commitment).')
    bullet(story, '<b>API token + account Id</b> shared with CRM Mates via NHS Config (admin-only '
                 'visibility).')
    bullet(story, '<b>Privacy notice review</b> for vendor-facing implications of public photo URLs.')

    story.append(Paragraph('Timeline once all blockers clear', H2))
    header_table(story,
        ['Item', 'Owner', 'Estimate'],
        [
            ['Cloudflare account + token', 'NHS', 'Day 0'],
            ['Schema + config fields + sync Apex (dry-run)', 'CRM Mates', 'Day 1 morning'],
            ['Live sync enabled + backfill', 'CRM Mates', 'Day 1 afternoon'],
            ['LWC display updates + Housebuilder Portal wiring', 'CRM Mates', 'Day 2'],
            ['QA + soak testing', 'NHS + CRM Mates', 'Day 3–9'],
            ['Go-live sign-off', 'Both', 'Day 10'],
        ],
        col_widths=[90*mm, 40*mm, 40*mm])

    story.append(Paragraph('Contact', H2))
    kv_table(story, [
        ['Document owner', 'Deepak K Rana, Lead Salesforce Consultant'],
        ['Company', 'CRM Mates Ltd, London'],
        ['Email', 'deepak@crmmates.com'],
        ['Phone', '07443 340401'],
        ['Project reference', 'NHS Training App / TSK-00017'],
    ], col_widths=[40*mm, 130*mm])

    story.append(Spacer(1, 12))
    story.append(Paragraph(
        '<i>This proposal is iterative — comments, concerns or alternative-design preferences welcome. '
        'Any material change requires a new version of this document.</i>',
        SMALL))

    doc.build(story, onFirstPage=on_cover_page, onLaterPages=on_later_page)
    print(f'Wrote {OUT}')


if __name__ == '__main__':
    build()
