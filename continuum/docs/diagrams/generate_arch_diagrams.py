#!/usr/bin/env python3
"""Generate Architecture Diagrams (SVG) for Continuum platform thesis.

diagram_deployment.svg  — UML Component/Deployment diagram (Рисунок 3.2)
diagram_layers.svg      — Layered Architecture concentric circles (Рисунок 3.3)
"""

import os

OUT = os.path.dirname(os.path.abspath(__file__))

# ─── shared SVG helpers ────────────────────────────────────────

DEFS = """<defs>
  <marker id="arr" markerWidth="9" markerHeight="6" refX="8" refY="3" orient="auto">
    <polygon points="0 0,9 3,0 6" fill="#000"/>
  </marker>
</defs>"""


def svg_open(w, h):
    return (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" '
        f'viewBox="0 0 {w} {h}" font-family="Arial, sans-serif">\n'
        + DEFS + "\n"
        + f'<rect width="{w}" height="{h}" fill="white" stroke="#000" stroke-width="1.5"/>\n'
    )


def svg_close():
    return "</svg>\n"


def stereo_box(x, y, w, h, stereotype, name, dashed=False):
    """Outer device or execution-environment box."""
    dash = ' stroke-dasharray="7 4"' if dashed else ""
    s = (
        f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="3" '
        f'fill="white" stroke="#000" stroke-width="1.5"{dash}/>\n'
        f'<text x="{x + w//2}" y="{y + 14}" text-anchor="middle" '
        f'font-size="10" font-style="italic" fill="#000">«{stereotype}»</text>\n'
        f'<text x="{x + w//2}" y="{y + 27}" text-anchor="middle" '
        f'font-size="12" font-weight="bold" fill="#000">{name}</text>\n'
    )
    return s


def comp_box(x, y, w, h, name, lines=None):
    """UML component rectangle with component icon and optional detail lines."""
    lines = lines or []
    s = (
        f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="2" '
        f'fill="white" stroke="#000" stroke-width="1.5"/>\n'
    )
    # Component icon (top-right corner)
    ix, iy = x + w - 20, y + 5
    s += (
        f'<rect x="{ix}" y="{iy}" width="14" height="10" rx="1" '
        f'fill="white" stroke="#000" stroke-width="1"/>\n'
        f'<rect x="{ix-5}" y="{iy+1}" width="6" height="3" rx="1" '
        f'fill="white" stroke="#000" stroke-width="1"/>\n'
        f'<rect x="{ix-5}" y="{iy+6}" width="6" height="3" rx="1" '
        f'fill="white" stroke="#000" stroke-width="1"/>\n'
    )
    # stereotype + name
    s += (
        f'<text x="{x + w//2}" y="{y + 15}" text-anchor="middle" '
        f'font-size="9" font-style="italic" fill="#555">«component»</text>\n'
        f'<text x="{x + w//2}" y="{y + 28}" text-anchor="middle" '
        f'font-size="11" font-weight="bold" fill="#000">{name}</text>\n'
    )
    for i, ln in enumerate(lines):
        s += (
            f'<text x="{x + w//2}" y="{y + 42 + i * 14}" text-anchor="middle" '
            f'font-size="9" fill="#444">{ln}</text>\n'
        )
    return s


def arrow(x1, y1, x2, y2, label="", lx=None, ly=None):
    s = (
        f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" '
        f'stroke="#000" stroke-width="1.5" marker-end="url(#arr)"/>\n'
    )
    if label:
        tx = lx if lx is not None else (x1 + x2) // 2
        ty = ly if ly is not None else (y1 + y2) // 2 - 7
        s += f'<text x="{tx}" y="{ty}" text-anchor="middle" font-size="11" fill="#000">{label}</text>\n'
    return s


def caption(cx, y, text):
    return (
        f'<text x="{cx}" y="{y}" text-anchor="middle" '
        f'font-size="12" fill="#000">{text}</text>\n'
    )


# ════════════════════════════════════════════════════════════════
#  Diagram 1: Deployment / Component  (Рисунок 3.2)
# ════════════════════════════════════════════════════════════════
def diagram_deployment():
    W, H = 700, 430

    p = [svg_open(W, H)]

    # ── Client Host (left column) ────────────────────────────────
    CX, CY, CW, CH = 12, 60, 152, 265
    p.append(stereo_box(CX, CY, CW, CH, "device", "Client Host", dashed=True))

    BX, BY, BW, BH = CX+10, CY+38, CW-20, CH-48
    p.append(stereo_box(BX, BY, BW, BH, "execution environment", "Браузер"))

    CCW, CCH = BW-16, BH-50
    p.append(comp_box(BX+8, BY+38, CCW, CCH, "Next.js Client",
                      ["React Components", "Client-side логіка"]))

    # ── Vercel Cloud (centre column) ────────────────────────────
    VX, VY, VW, VH = 185, 18, 330, 307
    p.append(stereo_box(VX, VY, VW, VH, "device", "Vercel Cloud", dashed=True))

    NX, NY, NW, NH = VX+12, VY+38, VW-24, VH-50
    p.append(stereo_box(NX, NY, NW, NH, "execution environment", "Node.js Runtime"))

    NCW, NCH = NW-20, NH-50
    p.append(comp_box(NX+10, NY+38, NCW, NCH, "Next.js Application",
                      ["Server Components", "Server Actions",
                       "API Routes · Middleware"]))

    # ── Supabase Cloud (right column) ───────────────────────────
    SX, SY, SW, SH = 535, 60, 152, 265
    p.append(stereo_box(SX, SY, SW, SH, "device", "Supabase Cloud", dashed=True))

    # PostgreSQL sub-env
    PX, PY, PW, PH = SX+10, SY+38, SW-20, 108
    p.append(stereo_box(PX, PY, PW, PH, "execution environment", "PostgreSQL Server"))
    p.append(comp_box(PX+8, PY+38, PW-16, PH-50, "База даних"))

    # Auth sub-env
    AX, AY, AW, AH = SX+10, SY+38+108+10, SW-20, 108
    p.append(stereo_box(AX, AY, AW, AH, "execution environment", "Auth Service"))
    p.append(comp_box(AX+8, AY+38, AW-16, AH-50, "Автентифікація"))

    # ── HTTPS arrows ─────────────────────────────────────────────
    # Client → Vercel
    a1x1, a1y = CX + CW, CY + CH // 2
    a1x2 = VX
    p.append(arrow(a1x1, a1y, a1x2, a1y, "HTTPS",
                   lx=(a1x1 + a1x2) // 2, ly=a1y - 9))

    # Vercel → Supabase
    a2x1, a2y = VX + VW, VY + VH // 2
    a2x2 = SX
    p.append(arrow(a2x1, a2y, a2x2, a2y, "HTTPS",
                   lx=(a2x1 + a2x2) // 2, ly=a2y - 9))

    # ── Caption ──────────────────────────────────────────────────
    p.append(caption(W // 2, H - 8,
                     "Рисунок 3.2 – Взаємодія основних компонентів системи"
                     " (виконано самостійно)"))

    p.append(svg_close())
    return "".join(p)


# ════════════════════════════════════════════════════════════════
#  Diagram 2: Layered Architecture  (Рисунок 3.3)
# ════════════════════════════════════════════════════════════════
def diagram_layers():
    W, H = 530, 560
    CX, CY = W // 2, 270   # centre of ellipses

    p = [svg_open(W, H)]

    # Rings (outside → inside), each ~54 units wide
    rings = [
        (248, 242),   # API
        (194, 188),   # Persistence
        (140, 134),   # Application
        (86,  80),    # Domain
    ]

    # Draw from largest to smallest so inner covers outer
    fills = ["white", "white", "white", "white"]
    for (rx, ry), fill in zip(rings, fills):
        p.append(
            f'<ellipse cx="{CX}" cy="{CY}" rx="{rx}" ry="{ry}" '
            f'fill="{fill}" stroke="#000" stroke-width="1.5"/>\n'
        )

    # ── API ring text (top region between ry=242 and ry=188) ────
    p.append(
        f'<text x="{CX}" y="{CY-212}" text-anchor="middle" '
        f'font-size="16" font-weight="bold" fill="#000">API</text>\n'
        f'<text x="{CX}" y="{CY-194}" text-anchor="middle" '
        f'font-size="10" fill="#444">Server Components · Server Actions</text>\n'
        f'<text x="{CX}" y="{CY-180}" text-anchor="middle" '
        f'font-size="10" fill="#444">Middleware · Route Handlers</text>\n'
    )

    # ── Persistence ring text ────────────────────────────────────
    p.append(
        f'<text x="{CX}" y="{CY-158}" text-anchor="middle" '
        f'font-size="14" font-weight="bold" fill="#000">Persistence</text>\n'
        f'<text x="{CX}" y="{CY-141}" text-anchor="middle" '
        f'font-size="10" fill="#444">Supabase JS Client · Data Access Layer</text>\n'
    )

    # ── Application ring text ────────────────────────────────────
    p.append(
        f'<text x="{CX}" y="{CY-104}" text-anchor="middle" '
        f'font-size="13" font-weight="bold" fill="#000">Application</text>\n'
        f'<text x="{CX}" y="{CY-88}" text-anchor="middle" '
        f'font-size="10" fill="#444">Recommendation · Analytics</text>\n'
        f'<text x="{CX}" y="{CY-74}" text-anchor="middle" '
        f'font-size="10" fill="#444">Progress Services</text>\n'
    )

    # ── Domain core text ─────────────────────────────────────────
    p.append(
        f'<text x="{CX}" y="{CY-18}" text-anchor="middle" '
        f'font-size="13" font-weight="bold" fill="#000">Domain</text>\n'
        f'<text x="{CX}" y="{CY}" text-anchor="middle" '
        f'font-size="10" fill="#444">Profile · Topic · Material · Task</text>\n'
        f'<text x="{CX}" y="{CY+15}" text-anchor="middle" '
        f'font-size="10" fill="#444">Note · Post · Collection · FocusSession</text>\n'
    )

    p.append(caption(W // 2, H - 8,
                     "Рисунок 3.3 – Структура архітектурних шарів системи"
                     " (виконано самостійно)"))

    p.append(svg_close())
    return "".join(p)


# ─── Write files ────────────────────────────────────────────────
diagrams = [
    ("diagram_deployment.svg", diagram_deployment()),
    ("diagram_layers.svg",     diagram_layers()),
]

for filename, content in diagrams:
    fpath = os.path.join(OUT, filename)
    with open(fpath, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"Generated: {filename}")

print("Done.")
