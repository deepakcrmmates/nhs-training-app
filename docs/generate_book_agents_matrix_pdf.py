#!/usr/bin/env python3
"""Generate BOOK_AGENTS_MATRIX.pdf — a four-matrix audit of the Book Agents
module in nhsApplicationDetailV2: every action the user can take, what it
triggers, what gets persisted, and which lightbox surfaces which controls.

Audience: NHS technical stakeholders + any reviewer needing a single-page
view of the Book Agents behaviour contract before a release.
"""

import os
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.lib.colors import HexColor, white
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, Preformatted
)
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
from reportlab.pdfgen import canvas

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                   'BOOK_AGENTS_MATRIX.pdf')

# NHS brand palette
BRAND_DK     = HexColor('#075F50')
BRAND_MID    = HexColor('#4A6B5E')
BRAND_SAGE   = HexColor('#C9D5CB')
BRAND_PALE   = HexColor('#EAF4EF')
BRAND_BORDER = HexColor('#C5DCCC')
AMBER        = HexColor('#C9A84C')
AMBER_PALE   = HexColor('#FFF8E7')
AMBER_DK     = HexColor('#7A5A00')
INK          = HexColor('#0F172A')
MUTED        = HexColor('#64748B')
DIVIDER      = HexColor('#E2E8F0')
SUCCESS      = HexColor('#10B981')
SUCCESS_PALE = HexColor('#DCFCE7')
DANGER       = HexColor('#EF4444')
WARN         = HexColor('#F59E0B')
WARN_PALE    = HexColor('#FEF3C7')
INFO         = HexColor('#3B82F6')
INFO_PALE    = HexColor('#DBEAFE')

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
CELL = ParagraphStyle('Cell', parent=ss['Normal'],
    fontName='Helvetica', fontSize=8, textColor=INK, leading=10.5, alignment=TA_LEFT)
CELL_BOLD = ParagraphStyle('CellBold', parent=CELL,
    fontName='Helvetica-Bold', textColor=BRAND_DK)
CELL_CODE = ParagraphStyle('CellCode', parent=CELL,
    fontName='Courier', fontSize=7.5, leading=10, textColor=INK)
CELL_CENTRE = ParagraphStyle('CellCentre', parent=CELL,
    alignment=TA_CENTER)
CELL_HEADER = ParagraphStyle('CellHeader', parent=CELL_BOLD,
    fontSize=8.5, textColor=white, alignment=TA_LEFT, leading=11)
CELL_HEADER_C = ParagraphStyle('CellHeaderC', parent=CELL_HEADER, alignment=TA_CENTER)
CALLOUT = ParagraphStyle('Callout', parent=BODY,
    fontSize=9.5, textColor=INK, leftIndent=8, rightIndent=8,
    spaceBefore=6, spaceAfter=8, leading=13)

# Check / cross / dash glyphs for matrix cells
def tick(): return Paragraph('<font color="#10B981"><b>✓</b></font>', CELL_CENTRE)
def dash(): return Paragraph('<font color="#94A3B8">—</font>', CELL_CENTRE)
def bold(txt): return Paragraph(f'<b>{txt}</b>', CELL_BOLD)
def code(txt): return Paragraph(txt, CELL_CODE)
def p(txt, style=CELL): return Paragraph(txt, style)


def on_later_page(canv, doc):
    canv.saveState()
    w, h = doc.pagesize
    canv.setFillColor(BRAND_DK)
    canv.rect(0, h - 4*mm, w, 4*mm, stroke=0, fill=1)
    canv.setFillColor(MUTED)
    canv.setFont('Helvetica', 8)
    canv.drawString(15*mm, h - 10*mm,
        'New Home Solutions · Book Agents Module — Behaviour Matrix')
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
    w, h = doc.pagesize
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
    canv.drawRightString(w - 12*mm, 13*mm, 'Behaviour Matrix · v1.0')
    canv.drawRightString(w - 12*mm, 8*mm, '23 April 2026')
    canv.restoreState()


def matrix_table(header, rows, col_widths, header_bg=BRAND_DK, zebra=True,
                 header_align_centre_cols=None):
    """Build a branded matrix table. All cells are Paragraphs so word-wrap works.
    header_align_centre_cols: list of column indices whose header text should be centred
    (useful for tick/cross columns)."""
    header_align_centre_cols = header_align_centre_cols or []
    wrapped = [[]]
    for idx, h in enumerate(header):
        style = CELL_HEADER_C if idx in header_align_centre_cols else CELL_HEADER
        wrapped[0].append(Paragraph(h, style))
    for row in rows:
        wrapped.append(row)
    t = Table(wrapped, colWidths=col_widths, repeatRows=1)
    style_cmds = [
        ('BACKGROUND', (0,0), (-1,0), header_bg),
        ('TEXTCOLOR', (0,0), (-1,0), white),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LINEBELOW', (0,0), (-1,0), 0.8, BRAND_DK),
        ('GRID', (0,1), (-1,-1), 0.3, DIVIDER),
    ]
    if zebra:
        for i in range(1, len(wrapped)):
            if i % 2 == 0:
                style_cmds.append(('BACKGROUND', (0,i), (-1,i), BRAND_PALE))
    t.setStyle(TableStyle(style_cmds))
    return t


def build():
    # Landscape A4 so matrices with many columns have room to breathe.
    doc = SimpleDocTemplate(OUT, pagesize=landscape(A4),
        leftMargin=15*mm, rightMargin=15*mm,
        topMargin=18*mm, bottomMargin=18*mm,
        title='Book Agents — Behaviour Matrix',
        author='Deepak K Rana, CRM Mates Ltd')
    story = []

    # ── Cover ──
    story.append(Spacer(1, 40*mm))
    story.append(p('BEHAVIOUR MATRIX · APRIL 2026', COVER_KICK))
    story.append(p('Book Agents Module', COVER_TITLE))
    story.append(p('Every action, every lightbox, every audit trail — pivoted four ways for a single-page behaviour contract of the merged Book Agents card, the Assign/Reassign wizard, the Book/Amend Appointment lightbox and the Email Agent modal.', COVER_SUB))

    meta = Table([
        [p('<b>Module</b>', CELL), p('nhsApplicationDetailV2 · Stage 3 (Book Agents)', CELL)],
        [p('<b>Related LWC</b>', CELL), p('nhsBookAppointmentModal — 2-step slot + email lightbox', CELL)],
        [p('<b>Linked Kanban tasks</b>', CELL), p('TSK-00083, TSK-00084, TSK-00085, TSK-00087, TSK-00088, TSK-00089', CELL)],
        [p('<b>Sandbox org</b>', CELL), p('deepak-nhs-ee@crmmates.com.training (00D7a0000005DDNEA2)', CELL)],
        [p('<b>Author</b>', CELL), p('Deepak K Rana, Founder, CRM Mates Ltd', CELL)],
        [p('<b>Date</b>', CELL), p('23 April 2026', CELL)],
    ], colWidths=[40*mm, 185*mm])
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

    # ── Executive summary ──
    story.append(p('Executive Summary', H1))
    story.append(p(
        'The Book Agents module is the busiest part of the application detail page — users can assign, reassign, '
        'unassign, book, amend, cancel, email per-agent, toggle desktop valuation, and send a combined vendor '
        'confirmation when all three slots are settled. This document pivots every one of those actions across '
        'four dimensions so any inconsistency or missing audit entry is obvious at a glance.',
        BODY_LEAD))

    story.append(p('At-a-glance status', H3))
    story.append(p('• <b>6 Kanban tasks</b> involved — 3 Done, 3 In Progress pending user sign-off.', BULLET))
    story.append(p('• <b>9 distinct user actions</b> across the card and its lightboxes.', BULLET))
    story.append(p('• <b>3 dialog surfaces</b> reach full feature parity on CC / BCC / Phonebook / Edit.', BULLET))
    story.append(p('• <b>3 events</b> trigger auto-save of a Vendor Note (reassign · amend · cancel).', BULLET))
    story.append(p('• <b>1 vendor CTA</b> — "Send Vendor Email" — gated by all-three-settled (booked OR desktop).', BULLET))
    story.append(Spacer(1, 4*mm))

    # ── Matrix 1: Action x Behaviour ──
    story.append(p('1. Action × Behaviour matrix', H1))
    story.append(p('Every Book Agents entry point, what it does, and the guardrails around it.', BODY))

    rows_m1 = [
        [p('<b>✎ Pencil</b> (Reassign)', CELL_BOLD),
         p('Slot assigned', CELL),
         p('Assign/Reassign wizard (5-step)', CELL),
         p('<b>Reason for Change</b> (Step 1)', CELL),
         code('assignAgent'),
         p('Agent_N__c + clears Appt / Last Emailed', CELL),
         p('✓ Step 4 email', CELL_CENTRE),
         p('TSK-00083, 00085, 00087', CELL)],
        [p('<b>+ Assign Agent</b> (per-card)', CELL_BOLD),
         p('Slot unassigned', CELL),
         p('Assign/Reassign wizard', CELL),
         p('—', CELL),
         code('assignAgent'),
         p('Agent_N__c', CELL),
         p('✓ Step 4 email', CELL_CENTRE),
         p('TSK-00083', CELL)],
        [p('<b>+ Book Appointment</b>', CELL_BOLD),
         p('Assigned · no booking · not desktop', CELL),
         p('nhsBookAppointmentModal (Book mode)', CELL),
         p('—', CELL),
         code('bookAppointment'),
         p('Agent_N_Appointment__c', CELL),
         p('✓ Step 2 (per-agent)', CELL_CENTRE),
         p('TSK-00084, 00088', CELL)],
        [p('<b>✏ Amend Booking</b>', CELL_BOLD),
         p('Assigned · booked', CELL),
         p('nhsBookAppointmentModal (Amend mode)', CELL),
         p('<b>Reason for Amendment</b> (Step 1)', CELL),
         code('bookAppointment'),
         p('Agent_N_Appointment__c overwritten', CELL),
         p('✓ Step 2 (per-agent)', CELL_CENTRE),
         p('TSK-00089', CELL)],
        [p('<b>🗑 Cancel Booking</b>', CELL_BOLD),
         p('Assigned · booked', CELL),
         p('Inline 2-step confirm', CELL),
         p('Cancellation reason (step 2)', CELL),
         code('cancelBooking'),
         p('Clears Agent_N_Appointment__c', CELL),
         p('—', CELL_CENTRE),
         p('Pre-existing', CELL)],
        [p('<b>[X] Unassign</b> (wizard)', CELL_BOLD),
         p('Agent matches reassignSlot', CELL),
         p('— (inline in wizard)', CELL),
         p('—', CELL),
         code('assignAgent(null)'),
         p('Clears Agent_N__c + Appt + Last Emailed', CELL),
         p('—', CELL_CENTRE),
         p('TSK-00085', CELL)],
        [p('<b>☑ Desktop Valuation</b>', CELL_BOLD),
         p('Slot assigned', CELL),
         p('— (inline toggle)', CELL),
         p('—', CELL),
         code('saveDesktopValuation'),
         p('Agent_N_Desktop_Valuation__c', CELL),
         p('—', CELL_CENTRE),
         p('Pre-existing', CELL)],
        [p('<b>✉ Email Agent N</b>', CELL_BOLD),
         p('Assigned · booked', CELL),
         p('Email Agent modal (ba-email-*)', CELL),
         p('—', CELL),
         code('sendEmailComplete'),
         p('Stamps Last_Agent_N_Emailed_On__c', CELL),
         p('Is the email', CELL_CENTRE),
         p('TSK-00083', CELL)],
        [p('<b>✉ Send Vendor Email</b>', CELL_BOLD),
         p('All 3 slots settled (booked OR desktop)', CELL),
         p('Email Agent modal (vendor mode)', CELL),
         p('—', CELL),
         code('sendEmailComplete'),
         p('— (no per-slot stamp)', CELL),
         p('<b>Template 05</b>', CELL_CENTRE),
         p('Latest', CELL)],
    ]
    story.append(matrix_table(
        ['Action (button)', 'Visible when', 'Opens', 'Gate before proceed', 'Apex call', 'Persists', 'Email?', 'Source TSK'],
        rows_m1,
        col_widths=[34*mm, 38*mm, 42*mm, 34*mm, 28*mm, 40*mm, 18*mm, 33*mm],
        header_align_centre_cols=[6]))
    story.append(PageBreak())

    # ── Matrix 2: Lightbox capability ──
    story.append(p('2. Lightbox capability matrix', H1))
    story.append(p('What is in each dialog — spot parity gaps across the three surfaces.', BODY))
    rows_m2 = [
        [p('<b>Modal width</b>', CELL_BOLD), p('960px', CELL_CENTRE), p('960px', CELL_CENTRE), p('960px', CELL_CENTRE)],
        [p('<b>Sage gradient header</b>', CELL_BOLD), tick(), tick(), p('pale', CELL_CENTRE)],
        [p('<b>Tinted body background</b>', CELL_BOLD), tick(), tick(), dash()],
        [p('<b>Step indicator</b>', CELL_BOLD), p('5 steps', CELL_CENTRE), p('2 steps', CELL_CENTRE), dash()],
        [p('<b>Reason gate</b>', CELL_BOLD), p('✓ (reassign · Step 1)', CELL_CENTRE), p('✓ (amend · Step 1)', CELL_CENTRE), dash()],
        [p('<b>Previous appointment strip</b>', CELL_BOLD), dash(), p('✓ (amend only)', CELL_CENTRE), dash()],
        [p('<b>Slot picker (15-min)</b>', CELL_BOLD), p('✓ (Step 3 inline table)', CELL_CENTRE), p('✓ (Step 1 grid cards)', CELL_CENTRE), dash()],
        [p('<b>Mini calendar + dot filter</b>', CELL_BOLD), dash(), tick(), dash()],
        [p('<b>To / Subject</b>', CELL_BOLD), p('✓ (Step 4)', CELL_CENTRE), p('✓ (Step 2)', CELL_CENTRE), tick()],
        [p('<b>CC</b>', CELL_BOLD), tick(), tick(), tick()],
        [p('<b>BCC</b>', CELL_BOLD), tick(), tick(), tick()],
        [p('<b>Phonebook (📇)</b>', CELL_BOLD), tick(), tick(), tick()],
        [p('<b>Body Edit toggle (preview ↔ rich-text)</b>', CELL_BOLD), tick(), tick(), tick()],
        [p('<b>Send button location</b>', CELL_BOLD), p('Step 5 submit', CELL_CENTRE), p('Step 2 Send ✉', CELL_CENTRE), p('Send ✉', CELL_CENTRE)],
    ]
    story.append(matrix_table(
        ['Feature', 'Assign/Reassign wizard (5-step)', 'Book/Amend modal', 'Email Agent modal'],
        rows_m2,
        col_widths=[70*mm, 67*mm, 65*mm, 65*mm],
        header_align_centre_cols=[1,2,3]))

    story.append(Spacer(1, 3*mm))
    story.append(p(
        '<b>Parity note:</b> the Assign/Reassign wizard is the only 5-step dialog; the other two are single-action. '
        'Slot-picker UX differs (chip grid vs weekly inline table) but both use 15-min granularity. '
        'CC / BCC / Phonebook / Edit are uniform across all three.', CALLOUT))
    story.append(PageBreak())

    # ── Matrix 3: Audit trail ──
    story.append(p('3. Audit-trail matrix', H1))
    story.append(p('What gets logged, cleared, or stamped — so nothing goes dark.', BODY))
    rows_m3 = [
        [p('<b>Reassign agent</b>', CELL_BOLD),
         p('✓ "Agent N reassigned. Previous / New / Last appt / Last email / Reason"', CELL),
         p('Agent_N_Appointment__c, Last_Agent_N_Emailed_On__c', CELL_CODE),
         dash()],
        [p('<b>Unassign agent</b> (wizard X)', CELL_BOLD),
         dash(),
         p('Agent_N__c, Agent_N_Appointment__c, Last_Agent_N_Emailed_On__c', CELL_CODE),
         dash()],
        [p('<b>Amend booking</b>', CELL_BOLD),
         p('✓ "Appointment for Agent N amended. Previous / New / Reason"', CELL),
         p('— (overwrite)', CELL),
         dash()],
        [p('<b>New booking (first time)</b>', CELL_BOLD),
         dash(), dash(),
         p('Agent_N_Appointment__c', CELL_CODE)],
        [p('<b>Cancel booking</b>', CELL_BOLD),
         p('✓ Cancellation reason (existing flow)', CELL),
         p('Agent_N_Appointment__c', CELL_CODE),
         dash()],
        [p('<b>Send Email Agent N</b>', CELL_BOLD),
         dash(), dash(),
         p('Last_Agent_N_Emailed_On__c', CELL_CODE)],
        [p('<b>Send Vendor Email</b>', CELL_BOLD),
         dash(), dash(),
         p('— (no per-slot stamp)', CELL)],
    ]
    story.append(matrix_table(
        ['Event', 'Vendor Note auto-saved?', 'Fields cleared', 'Fields stamped'],
        rows_m3,
        col_widths=[45*mm, 85*mm, 78*mm, 60*mm]))

    story.append(Spacer(1, 3*mm))
    story.append(p('4. State-gating matrix (merged card)', H1))
    story.append(p('Per-card UI states in the Book Agents merged card — combinatorial view.', BODY))
    rows_m4 = [
        [p('<b>Unassigned</b>', CELL_BOLD),
         p('disabled', CELL_CENTRE), dash(), p('hidden', CELL_CENTRE),
         p('visible (primary CTA)', CELL_CENTRE), p('disabled placeholder', CELL_CENTRE), dash()],
        [p('<b>Assigned · not desktop · no booking</b>', CELL_BOLD),
         p('active', CELL_CENTRE), p('"No appointment booked yet"', CELL),
         p('visible', CELL_CENTRE), dash(), p('visible (primary)', CELL_CENTRE), dash()],
        [p('<b>Assigned · not desktop · booked</b>', CELL_BOLD),
         p('active', CELL_CENTRE), p('Date + Time display', CELL),
         p('visible', CELL_CENTRE), dash(), dash(), tick()],
        [p('<b>Assigned · desktop</b>', CELL_BOLD),
         p('active (ticked)', CELL_CENTRE), p('"No visit required" pill', CELL),
         p('visible', CELL_CENTRE), dash(), p('disabled', CELL_CENTRE), dash()],
    ]
    story.append(matrix_table(
        ['State', 'Desktop checkbox', 'Appointment block', 'Pencil', '+ Assign', '+ Book Appt', 'Amend/Cancel/Email'],
        rows_m4,
        col_widths=[58*mm, 30*mm, 48*mm, 22*mm, 34*mm, 32*mm, 38*mm],
        header_align_centre_cols=[1,3,4,5,6]))
    story.append(PageBreak())

    # ── Matrix 5: Related TSKs ──
    story.append(p('5. Related Kanban tasks', H1))
    story.append(p('Chronological view of work delivered to shape the current Book Agents behaviour.', BODY))
    rows_m5 = [
        [p('<b>TSK-00083</b>', CELL_BOLD),
         p('<font color="#10B981"><b>Done</b></font> 2026-04-23', CELL),
         p('Merge Book Agents + Agent Details into single per-agent card (Stage 3)', CELL),
         p('Plus drive-by getters + FIELD_MAP aliases', CELL)],
        [p('<b>TSK-00084</b>', CELL_BOLD),
         p('<font color="#10B981"><b>Done</b></font> 2026-04-23', CELL),
         p('Book Appointment lightbox — vendor slot picker + agent booking email', CELL),
         p('Calendar filter + visual polish iterations', CELL)],
        [p('<b>TSK-00085</b>', CELL_BOLD),
         p('<font color="#10B981"><b>Done</b></font> 2026-04-23', CELL),
         p('Reassign Agent modal — hide [X] remove icon on other agents', CELL),
         p('Per-row showRemoveX flag', CELL)],
        [p('<b>TSK-00087</b>', CELL_BOLD),
         p('<font color="#F59E0B"><b>In Progress</b></font>', CELL),
         p('Agent reassignment audit trail — Reason for Change + auto-Note + field reset', CELL),
         p('Ready to close pending sign-off', CELL)],
        [p('<b>TSK-00088</b>', CELL_BOLD),
         p('<font color="#F59E0B"><b>In Progress</b></font>', CELL),
         p('Book Appointment + Amend Booking email consistency — CC/BCC/Phonebook/Edit parity', CELL),
         p('Implementation complete', CELL)],
        [p('<b>TSK-00089</b>', CELL_BOLD),
         p('<font color="#F59E0B"><b>In Progress</b></font>', CELL),
         p('Amend Booking uses Book Appointment lightbox + Reason captured in Vendor Notes', CELL),
         p('Implementation complete', CELL)],
    ]
    story.append(matrix_table(
        ['Task', 'Status', 'Title', 'Notes'],
        rows_m5,
        col_widths=[25*mm, 32*mm, 130*mm, 68*mm]))

    story.append(Spacer(1, 6*mm))
    story.append(p('6. Key findings', H1))
    story.append(p('<b>Three lightbox surfaces, consistent feature contract.</b> CC / BCC / Phonebook / Edit are '
                   'implemented identically across the Assign-Reassign wizard, the Book/Amend modal and the Email '
                   'Agent modal — reducing cognitive load and training surface.', BODY))
    story.append(p('<b>Three audit-emitting actions.</b> Reassign, amend and cancel each auto-write a Vendor Note '
                   'capturing who / when / why — giving a traceable audit trail visible in the app\'s Notes feed '
                   'without manual upkeep.', BODY))
    story.append(p('<b>Stale-state hygiene.</b> Every lookup change (reassign, unassign) now clears the related '
                   'Appointment + Last-Emailed fields so the "ghost Booked" state observed earlier cannot recur.', BODY))
    story.append(p('<b>Vendor CTA is gated correctly.</b> "Send Vendor Email" uses allAgentsSettled which treats '
                   'Desktop Valuation as equivalent to a booking — so the CTA appears as soon as every agent has '
                   'been dealt with, not only when every agent has a physical slot.', BODY))
    story.append(Spacer(1, 3*mm))
    story.append(p(
        '<b>Recommended next step:</b> once Deepak verifies the "Send Vendor Email" flow end-to-end (Template 05 '
        'renders with all three agents\' appointment times via merge fields), close TSK-00087 / 00088 / 00089 in a '
        'single batch and commit the six deliverables to main.', CALLOUT))

    # Build
    doc.build(story, onFirstPage=on_cover_page, onLaterPages=on_later_page)
    print(f'Generated: {OUT}')


if __name__ == '__main__':
    build()
