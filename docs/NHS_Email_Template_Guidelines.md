# New Home Solutions - Email Template Guidelines

**Part Exchange & Assisted Move Specialists**
Version 1.0 | Prepared by CRM Mates Ltd

---

## 1. Typography

### Logo Font - Futura LT Light

The brand name **"NEW HOME SOLUTIONS"** must always use:

| Property | Value |
|---|---|
| Font Family | `futura-lt-w01-light, futura-lt-w05-light, 'Futura LT Light', 'Century Gothic', sans-serif` |
| Font Size | `27px` |
| Font Weight | `300` (Light) |
| Letter Spacing | `0.06em` |
| Word Spacing | `0.3em` |
| Text Transform | `uppercase` |
| Usage | Logo / brand name in email header **only** |

### Content Font - Aptos

All body text, headings, labels, and content must use:

| Property | Value |
|---|---|
| Font Family | `Aptos, 'Segoe UI', Arial, Helvetica, sans-serif` |
| Body Text | `14px`, Regular (400), colour `#374151`, line-height `1.65` |
| Section Heading | `20px`, Bold (700), colour `#0D1E4A` |
| Sub-section Label | `14px`, Bold, Uppercase, colour `#4A6B5E`, letter-spacing `0.06em` |
| Caption / Footer | `11px`, Semibold (600), Uppercase, colour `#6B7280` |
| Hyperlinks | `14px`, Bold, colour `#1A4FCC`, no underline |

> **Rule:** No other fonts are permitted. Futura LT Light is exclusively for the logo. Aptos is for everything else.

---

## 2. Colour Palette

### Primary - Sage Green

| Name | Hex | Usage |
|---|---|---|
| Sage Dark | `#4A6B5E` | Table headers, accent stripe, email header border |
| Sage | `#6B9080` | Signature job titles, secondary text |
| Sage Background | `#C9D5CB` | Email header bar, outer page background |
| Sage Tint | `#EAF4EF` | Table label cells, section labels, footer background |

### Secondary - Navy

| Name | Hex | Usage |
|---|---|---|
| Navy | `#0D1E4A` | Data values in tables, signature name |
| Navy Link | `#1A4FCC` | Hyperlinks, email addresses |

### Neutrals

| Name | Hex | Usage |
|---|---|---|
| Body Text | `#374151` | Paragraph text |
| Muted Text | `#6B7280` | Footer, captions, contact labels |
| Border | `#C5DCCC` | Table borders, dividers |
| Row Alternate | `#EDF1ED` | Alternating table row backgrounds (if needed) |

---

## 3. Email Structure

All emails use a **640px fixed-width**, table-based layout with inline styles only.

### Structure Order

```
1. Header Bar          - #C9D5CB background, "NEW HOME SOLUTIONS" in Futura LT Light
2. Accent Stripe       - 3px height, #4A6B5E
3. Email Body          - #FFFFFF background, 28px 32px padding
4. Signature Block     - within body, separated by 2px solid #CCE3D8
5. Disclaimer          - within body, 10.5px muted text
6. Footer              - #EAF4EF background, centred, 11px text
```

### Layout Specifications

| Element | Specification |
|---|---|
| Email Width | `640px` fixed, centred |
| Body Background | `#C9D5CB` |
| Content Background | `#FFFFFF` |
| Body Padding | `28px 32px` |
| Header Bar | `#C9D5CB`, padding `23px 24px`, logo text |
| Accent Stripe | `3px` height, `#4A6B5E` |
| Footer | `#EAF4EF`, centred, `11px` |
| Signature Divider | `2px solid #CCE3D8` |

> **Important:** All styles must be inline. CSS classes, `<style>` blocks, and CSS variables are not supported by most email clients.

---

## 4. Table Styling

All tables use `border-radius: 10px` with `border-collapse: separate` and `overflow: hidden`.

### Agent Details Table

| Element | Style |
|---|---|
| Container | `border-radius: 10px`, `border-collapse: separate`, `overflow: hidden` |
| Header Row | Background `#4A6B5E`, white text, `12px` bold |
| Price Guide Header | Left-aligned |
| Agent Headers | **Centre-aligned** (Agent 1, Agent 2, Agent 3, Average) |
| Label Column (1st) | Background `#EAF4EF`, colour `#4A6B5E`, semibold, left-aligned |
| Value Columns | Background `#FFFFFF`, colour `#0D1E4A`, bold, **centre-aligned** |
| Borders | `1px solid #C5DCCC` |
| Cell Padding | `9px 14px` |

### NHS Recommendation Table

| Element | Style |
|---|---|
| Container | `border-radius: 10px`, `border-collapse: separate`, `overflow: hidden` |
| Header Row | **Merged single cell** (`colspan="2"`), background `#4A6B5E`, white text, centre-aligned, text: "New Home Solutions Recommendation" |
| Label Cells (left) | Background `#EAF4EF`, colour `#4A6B5E`, bold, left-aligned, `width: 50%` |
| Value Cells (right) | Background `#FFFFFF`, colour `#0D1E4A`, `14px` bold, **centre-aligned**, `width: 50%` |
| Borders | `1px solid #C5DCCC` |

### Section Label (above tables)

```
Background: #EAF4EF
Border: 1px solid #CCE3D8
Padding: 4px 12px
Font: 11px, bold, uppercase
Colour: #4A6B5E
Letter-spacing: 0.08em
```

---

## 5. Department Signatures

All signatures share the same structure. Separated from body by `2px solid #CCE3D8`.

### Signature Structure

```
[Name]                    - 14px Bold, #0D1E4A
[DEPARTMENT TITLE]        - 12px Bold Uppercase, #6B9080, letter-spacing 0.06em
T: 03330 068 058 (Option X)
F: 08456 729 310
E: [department]@newhomesolutions.co.uk    - #1A4FCC, no underline
W: www.newhomesolutions.co.uk             - #1A4FCC, no underline

PART EXCHANGE & ASSISTED MOVE SPECIALISTS - 11px Semibold Uppercase, #4A6B5E, letter-spacing 0.10em
```

### Department Directory

| # | Department | Phone Option | Email |
|---|---|---|---|
| 1 | Sales | Option 1 | info@newhomesolutions.co.uk |
| 2 | Offers | Option 1 | offers@newhomesolutions.co.uk |
| 3 | Valuations | Option 2 | valuations@newhomesolutions.co.uk |
| 4 | Sales Progression | Option 3 | *\<tba\>*@newhomesolutions.co.uk |
| 5 | Accounts | Option 4 | accounts@newhomesolutions.co.uk |

---

## 6. Footer & Disclaimer

### Footer Bar

```
Background: #EAF4EF
Padding: 14px 24px
Text: 11px, centred, #6B7280
Border-top: 1px solid #CCE3D8
```

Must include:
- **"P: SAVE THE TREES - Think Before You Print"** (bold, `#4A6B5E`)
- Copyright line with registered office link

### Disclaimer (mandatory)

> This E-mail message & any attachment is confidential and for the exclusive use of the intended recipient(s). If you have received this message in error, please return it in its entirety to the sender by reply & then delete the message. This message &/or attachment(s) may be subject to legal, professional or other privileges. Any views or opinions expressed by the author do not necessarily represent those of New Homes Solutions Ltd. Any information contained in this email must not be disclosed, copied, distributed or retained by any person without our express authority.

> **HEAD OFFICE:** New Home Solutions, Unit 3 Hepton Court, York Road, Leeds, LS9 6PW (Registration Number 7970313). Registered in England at Hutton House, Sheriff Hutton Industrial Park, York Road, Sheriff Hutton, York, YO60 6RZ.

---

## 7. Do & Don't

### Do

- Use Futura LT Light for the "NEW HOME SOLUTIONS" logo only
- Use Aptos for all body, headings, and content text
- Use inline styles on every HTML element
- Use table-based layouts (`<table>`) for email compatibility
- Use the sage/navy colour palette consistently
- Include the header bar, accent stripe, and footer in every email
- Include the disclaimer and registered office text
- Use the "Save the Trees" message in the footer
- Maintain 640px email width
- Use rounded corners (`border-radius: 10px`) on data tables
- Centre-align agent value columns and recommendation values
- Keep label columns on sage tint (`#EAF4EF`), value columns on white
- Test in Outlook, Gmail, and Apple Mail before sending

### Don't

- Use Futura LT Light for anything other than the logo
- Use Arial, Times New Roman, or any other unapproved font
- Use CSS variables, classes, or `<style>` blocks in email HTML
- Use `<div>`-based layouts (use `<table>` instead)
- Use colours outside the approved palette
- Omit the NHS logo header or footer
- Use bright or neon colours for emphasis
- Exceed 640px width or use fluid/responsive widths
- Use background images (not reliable in Outlook)
- Send without including the legal disclaimer
- Use navy (`#0D1E4A`) for table headers (use sage dark `#4A6B5E`)

---

## 8. Quick Reference - Inline Style Snippets

### Email Header (Logo)

```html
<td style="background-color: #C9D5CB; padding: 23px 24px; border-bottom: 2px solid #C5DCCC;">
    <span style="font-family: futura-lt-w01-light, 'Century Gothic', sans-serif;
        font-size: 27px; font-weight: 300; color: #4A6B5E;
        letter-spacing: 0.06em; word-spacing: 0.3em;
        text-transform: uppercase;">NEW HOME SOLUTIONS</span>
</td>
```

### Table Header Row

```html
<tr style="background-color: #4A6B5E;">
    <th style="padding: 10px 14px; border: 1px solid #4A6B5E;
        text-align: left; color: #ffffff; font-size: 12px;
        font-weight: 600;">Label</th>
    <th style="padding: 10px 14px; border: 1px solid #4A6B5E;
        text-align: center; color: #ffffff; font-size: 12px;
        font-weight: 600;">Value</th>
</tr>
```

### Label Cell (Sage Tint)

```html
<td style="padding: 9px 14px; border: 1px solid #C5DCCC;
    background-color: #EAF4EF; font-size: 13px; color: #4A6B5E;
    font-weight: bold;">Open Market</td>
```

### Value Cell (White, Centred)

```html
<td style="padding: 9px 14px; border: 1px solid #C5DCCC;
    background-color: #ffffff; font-size: 14px; color: #0D1E4A;
    font-weight: bold; text-align: center;">£200,000</td>
```

### Recommendation Merged Header

```html
<tr style="background-color: #4A6B5E;">
    <th colspan="2" style="padding: 10px 14px; border: 1px solid #4A6B5E;
        text-align: center; color: #ffffff; font-size: 12px;
        font-weight: 600;">New Home Solutions Recommendation</th>
</tr>
```

### Signature Block

```html
<table cellpadding="0" cellspacing="0" width="100%" style="border-top: 2px solid #CCE3D8;">
    <tr><td style="padding-top: 16px;">
        <p style="margin: 0 0 2px; font-size: 14px; font-weight: bold; color: #0D1E4A;">[Name]</p>
        <p style="margin: 0 0 12px; font-size: 12px; color: #6B9080; font-weight: bold;
            text-transform: uppercase; letter-spacing: 0.06em;">[Department]</p>
        <p style="margin: 2px 0; font-size: 13px; color: #6B7280;">T: 03330 068 058 (Option X)</p>
        <p style="margin: 2px 0; font-size: 13px; color: #6B7280;">F: 08456 729 310</p>
        <p style="margin: 2px 0; font-size: 13px;">E:
            <a href="mailto:[dept]@newhomesolutions.co.uk"
                style="color: #1A4FCC; text-decoration: none;">[dept]@newhomesolutions.co.uk</a></p>
        <p style="margin: 2px 0; font-size: 13px;">W:
            <a href="https://www.newhomesolutions.co.uk"
                style="color: #1A4FCC; text-decoration: none;">www.newhomesolutions.co.uk</a></p>
        <p style="margin: 16px 0 4px; font-size: 11px; font-weight: 600;
            letter-spacing: 0.10em; text-transform: uppercase;
            color: #4A6B5E;">Part Exchange & Assisted Move Specialists</p>
    </td></tr>
</table>
```

---

*New Home Solutions Ltd | Confidential*
*Newsletter Branding Guidelines v1.0 | Prepared by CRM Mates Ltd*
