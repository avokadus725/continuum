#!/usr/bin/env python3
"""Generate UML Activity Diagrams (SVG) for Continuum platform thesis."""

import os

OUT = os.path.dirname(os.path.abspath(__file__))

DEFS = """  <defs>
    <marker id="arr" markerWidth="9" markerHeight="6" refX="8" refY="3" orient="auto">
      <polygon points="0 0, 9 3, 0 6" fill="#000"/>
    </marker>
  </defs>"""


def svg_open(w, h):
    return (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" '
        f'viewBox="0 0 {w} {h}" font-family="Arial, sans-serif">\n'
        + DEFS + "\n"
        + f'  <rect width="{w}" height="{h}" fill="white" stroke="#000" stroke-width="1.5"/>\n'
    )


def svg_close():
    return "</svg>\n"


def start_node(cx, cy):
    return f'  <circle cx="{cx}" cy="{cy}" r="11" fill="#000"/>\n'


def end_node(cx, cy):
    return (
        f'  <circle cx="{cx}" cy="{cy}" r="13" fill="white" stroke="#000" stroke-width="3"/>\n'
        f'  <circle cx="{cx}" cy="{cy}" r="7" fill="#000"/>\n'
    )


def act(cx, cy, w, h, lines):
    x, y = cx - w // 2, cy - h // 2
    out = f'  <rect x="{x}" y="{y}" width="{w}" height="{h}" rx="4" fill="white" stroke="#000" stroke-width="1.5"/>\n'
    n, step = len(lines), 16
    sy = cy - (n - 1) * step / 2
    for i, ln in enumerate(lines):
        out += f'  <text x="{cx}" y="{sy + i*step + 4:.1f}" text-anchor="middle" font-size="13" fill="#000">{ln}</text>\n'
    return out


def dec(cx, cy, hw, hh, lines):
    pts = f"{cx},{cy-hh} {cx+hw},{cy} {cx},{cy+hh} {cx-hw},{cy}"
    out = f'  <polygon points="{pts}" fill="white" stroke="#000" stroke-width="1.5"/>\n'
    n, step = len(lines), 15
    sy = cy - (n - 1) * step / 2
    for i, ln in enumerate(lines):
        out += f'  <text x="{cx}" y="{sy + i*step + 4:.1f}" text-anchor="middle" font-size="12" fill="#000">{ln}</text>\n'
    return out


def arr(x1, y1, x2, y2, label="", lx=None, ly=None):
    out = f'  <line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="#000" stroke-width="1.5" marker-end="url(#arr)"/>\n'
    if label:
        tx = lx if lx is not None else (x1 + x2) / 2 + 5
        ty = ly if ly is not None else (y1 + y2) / 2 - 6
        out += f'  <text x="{tx}" y="{ty}" font-size="11" fill="#000">{label}</text>\n'
    return out


def ln(x1, y1, x2, y2):
    return f'  <line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="#000" stroke-width="1.5"/>\n'


def join_bar(x1, x2, y, label="Join"):
    out = f'  <line x1="{x1}" y1="{y}" x2="{x2}" y2="{y}" stroke="#c00" stroke-width="3"/>\n'
    out += f'  <text x="{(x1+x2)/2}" y="{y-5}" text-anchor="middle" font-size="11" fill="#000">{label}</text>\n'
    return out


def cap(cx, y, text):
    return f'  <text x="{cx}" y="{y}" text-anchor="middle" font-size="12" fill="#000">{text}</text>\n'


def lbl(x, y, text, anchor="start", size=11):
    return f'  <text x="{x}" y="{y}" text-anchor="{anchor}" font-size="{size}" fill="#000">{text}</text>\n'


# ─── convenient shortcuts ──────────────────────────────────────
AH = 46   # standard activity height

def bot(cy, h=AH): return cy + h // 2
def top(cy, h=AH): return cy - h // 2
def bot_d(cy, hh): return cy + hh
def top_d(cy, hh): return cy - hh


# ════════════════════════════════════════════════════════════════
# Diagram 1 – Автентифікація
# ════════════════════════════════════════════════════════════════
def diagram_auth():
    W, H = 560, 870
    MX   = 245   # main column
    LX   = 82    # left branch: error
    RX   = 440   # right branch: create profile
    GAP  = 18    # vertical gap between elements

    p = [svg_open(W, H)]

    # START
    SY = 38
    p += [start_node(MX, SY)]

    # ── Activities (main path) ──
    # navigate
    A1Y = SY + 11 + GAP + AH // 2
    p += [arr(MX, SY + 11, MX, top(A1Y))]
    p += [act(MX, A1Y, 215, AH, ["Перехід на сторінку входу"])]

    # click Google
    A2Y = bot(A1Y) + GAP + AH // 2
    p += [arr(MX, bot(A1Y), MX, top(A2Y))]
    p += [act(MX, A2Y, 220, AH, ["Натискання кнопки", "входу через Google"])]

    # redirect OAuth
    A3Y = bot(A2Y) + GAP + AH // 2
    p += [arr(MX, bot(A2Y), MX, top(A3Y))]
    p += [act(MX, A3Y, 225, AH, ["Перенаправлення на", "сторінку Google OAuth"])]

    # ── Decision 1: auth OK? ──
    D1Y, HW1, HH1 = bot(A3Y) + 42, 120, 40
    p += [arr(MX, bot(A3Y), MX, top_d(D1Y, HH1))]
    p += [dec(MX, D1Y, HW1, HH1, ["Авторизація", "успішна?"])]

    # НІ → LEFT branch → error → left end node
    ERR_Y = D1Y + 68
    END1_Y = bot(ERR_Y) + 42
    p += [ln(MX - HW1, D1Y, LX, D1Y)]
    p += [lbl(LX + 2, D1Y - 6, "Ні")]
    p += [arr(LX, D1Y, LX, top(ERR_Y))]
    p += [act(LX, ERR_Y, 148, AH, ["Відображення", "помилки входу"])]
    p += [arr(LX, bot(ERR_Y), LX, END1_Y - 13)]
    p += [end_node(LX, END1_Y)]

    # ТАК → straight down to Decision 2
    # D2 must start BELOW the left end node bottom (END1_Y + 13)
    D2_top_min = END1_Y + 13 + 18
    D2Y, HW2, HH2 = max(bot_d(D1Y, HH1) + 115, D2_top_min + 38), 118, 38
    p += [arr(MX, bot_d(D1Y, HH1), MX, top_d(D2Y, HH2),
              "Так", MX + 4, bot_d(D1Y, HH1) + 12)]
    p += [dec(MX, D2Y, HW2, HH2, ["Профіль існує", "в базі даних?"])]

    # НІ → RIGHT branch → create profile
    CRE_Y = D2Y + 72
    p += [ln(MX + HW2, D2Y, RX, D2Y)]
    p += [lbl(MX + HW2 + 3, D2Y - 6, "Ні")]
    p += [arr(RX, D2Y, RX, top(CRE_Y))]
    p += [act(RX, CRE_Y, 148, AH, ["Створення профілю", "користувача"])]

    # Both branches meet at JOIN_Y
    JOIN_Y = bot(CRE_Y) + 45
    # ТАК: straight down
    p += [ln(MX, bot_d(D2Y, HH2), MX, JOIN_Y)]
    p += [lbl(MX + 4, bot_d(D2Y, HH2) + 13, "Так")]
    # НІ: down from create profile → left to MX
    p += [ln(RX, bot(CRE_Y), RX, JOIN_Y)]
    p += [ln(RX, JOIN_Y, MX, JOIN_Y)]

    p += [join_bar(LX + 70, RX + 74, JOIN_Y)]
    p += [arr(MX, JOIN_Y, MX, JOIN_Y + GAP)]

    # ── Remaining main path ──
    A4Y = JOIN_Y + GAP + AH // 2
    p += [act(MX, A4Y, 225, AH, ["Завантаження профілю", "та налаштувань"])]

    A5Y = bot(A4Y) + GAP + AH // 2
    p += [arr(MX, bot(A4Y), MX, top(A5Y))]
    p += [act(MX, A5Y, 225, AH, ["Перенаправлення", "на дашборд"])]

    END_Y = bot(A5Y) + 40
    p += [arr(MX, bot(A5Y), MX, END_Y - 13)]
    p += [end_node(MX, END_Y)]

    p += [cap(W // 2, H - 8,
              "Рисунок X.1 – UML діаграма діяльності процесу автентифікації користувача")]
    p += [svg_close()]
    return "".join(p)


# ════════════════════════════════════════════════════════════════
# Diagram 2 – Виконання завдання
# ════════════════════════════════════════════════════════════════
def diagram_task():
    W, H = 590, 900
    MX  = 225
    RX  = 455   # right branches
    LX  = 46    # loop-back column
    GAP = 22

    p = [svg_open(W, H)]

    SY = 38
    p += [start_node(MX, SY)]

    A1Y = SY + 11 + GAP + AH // 2
    p += [arr(MX, SY + 11, MX, top(A1Y))]
    p += [act(MX, A1Y, 220, AH, ["Перехід на сторінку завдання"])]

    # Decision: already done?
    D1Y, HW1, HH1 = bot(A1Y) + 42, 120, 38
    p += [arr(MX, bot(A1Y), MX, top_d(D1Y, HH1))]
    p += [dec(MX, D1Y, HW1, HH1, ["Завдання вже", "виконано?"])]

    # ТАК → right → "Виконано" → right end node
    DONE_Y = D1Y + 68
    END1_Y = bot(DONE_Y) + 40
    p += [ln(MX + HW1, D1Y, RX, D1Y)]
    p += [lbl(MX + HW1 + 3, D1Y - 6, "Так")]
    p += [arr(RX, D1Y, RX, top(DONE_Y))]
    p += [act(RX, DONE_Y, 148, AH, ["Відображення статусу", "'Виконано'"])]
    p += [arr(RX, bot(DONE_Y), RX, END1_Y - 13)]
    p += [end_node(RX, END1_Y)]

    # НІ ↓ – read, enter, send, check
    A2Y = bot_d(D1Y, HH1) + GAP + AH // 2
    p += [arr(MX, bot_d(D1Y, HH1), MX, top(A2Y), "Ні", MX + 4, bot_d(D1Y, HH1) + 12)]
    p += [act(MX, A2Y, 220, AH, ["Ознайомлення з умовою", "завдання"])]

    # ← CALLBACK RETURN TARGET
    A3Y = bot(A2Y) + GAP + AH // 2
    p += [arr(MX, bot(A2Y), MX, top(A3Y))]
    p += [act(MX, A3Y, 220, AH, ["Введення або вибір відповіді"])]

    A4Y = bot(A3Y) + GAP + AH // 2
    p += [arr(MX, bot(A3Y), MX, top(A4Y))]
    p += [act(MX, A4Y, 220, AH, ["Надсилання відповіді", "на сервер"])]

    A5Y = bot(A4Y) + GAP + AH // 2
    p += [arr(MX, bot(A4Y), MX, top(A5Y))]
    p += [act(MX, A5Y, 220, AH, ["Перевірка відповіді", "на сервері"])]

    # Decision: correct?
    D2Y, HW2, HH2 = bot(A5Y) + 42, 118, 38
    p += [arr(MX, bot(A5Y), MX, top_d(D2Y, HH2))]
    p += [dec(MX, D2Y, HW2, HH2, ["Відповідь", "правильна?"])]

    # НІ → right → error → loop back
    ERR_X = 448
    ERR_Y = D2Y + 62
    p += [ln(MX + HW2, D2Y, ERR_X, D2Y)]
    p += [lbl(MX + HW2 + 3, D2Y - 6, "Ні")]
    p += [arr(ERR_X, D2Y, ERR_X, top(ERR_Y))]
    p += [act(ERR_X, ERR_Y, 158, AH, ["Відображення повідомлення", "про помилку"])]
    # loop: down → left column → up → right to A3Y
    p += [ln(ERR_X, bot(ERR_Y), ERR_X, D2Y + 115)]
    p += [ln(ERR_X, D2Y + 115, LX, D2Y + 115)]
    p += [ln(LX, D2Y + 115, LX, A3Y)]
    p += [arr(LX, A3Y, MX - 110, A3Y)]
    p += [lbl(LX + 2, A3Y - 7, "Callback", size=10)]

    # ТАК ↓ – XP
    A6Y = bot_d(D2Y, HH2) + GAP + AH // 2
    p += [arr(MX, bot_d(D2Y, HH2), MX, top(A6Y), "Так", MX + 4, bot_d(D2Y, HH2) + 12)]
    p += [act(MX, A6Y, 220, AH, ["Нарахування XP балів", "та оновлення прогресу"])]

    # Decision: explanation?
    D3Y, HW3, HH3 = bot(A6Y) + 42, 112, 34
    p += [arr(MX, bot(A6Y), MX, top_d(D3Y, HH3))]
    p += [dec(MX, D3Y, HW3, HH3, ["Є пояснення?"])]

    # ТАК ↓ – show explanation
    A7Y = bot_d(D3Y, HH3) + GAP + AH // 2
    p += [arr(MX, bot_d(D3Y, HH3), MX, top(A7Y), "Так", MX + 4, bot_d(D3Y, HH3) + 12)]
    p += [act(MX, A7Y, 220, AH, ["Відображення пояснення", "до завдання"])]

    # НІ → right → skip → join
    SKIP_X = 415
    JOIN2_Y = bot(A7Y) + 35
    p += [ln(MX + HW3, D3Y, SKIP_X, D3Y)]
    p += [lbl(MX + HW3 + 3, D3Y - 6, "Ні")]
    p += [ln(SKIP_X, D3Y, SKIP_X, JOIN2_Y)]
    p += [ln(SKIP_X, JOIN2_Y, MX, JOIN2_Y)]
    p += [ln(MX, bot(A7Y), MX, JOIN2_Y)]

    END2_Y = JOIN2_Y + 42
    p += [arr(MX, JOIN2_Y, MX, END2_Y - 13)]
    p += [end_node(MX, END2_Y)]

    p += [cap(W // 2, H - 8,
              "Рисунок X.2 – UML діаграма діяльності процесу виконання навчального завдання")]
    p += [svg_close()]
    return "".join(p)


# ════════════════════════════════════════════════════════════════
# Diagram 3 – Фокус-сесія
# ════════════════════════════════════════════════════════════════
def diagram_focus():
    W, H = 570, 895
    MX  = 225
    RPX = 435   # Pomodoro right column
    LX  = 46    # Return loop column
    GAP = 22

    p = [svg_open(W, H)]

    SY = 38
    p += [start_node(MX, SY)]

    A1Y = SY + 11 + GAP + AH // 2
    p += [arr(MX, SY + 11, MX, top(A1Y))]
    p += [act(MX, A1Y, 220, AH, ["Налаштування параметрів", "сесії (режим, тривалість)"])]

    A2Y = bot(A1Y) + GAP + AH // 2
    p += [arr(MX, bot(A1Y), MX, top(A2Y))]
    p += [act(MX, A2Y, 220, AH, ["Вибір звукового супроводу", "та фону"])]

    # ← RETURN TARGET
    A3Y = bot(A2Y) + GAP + AH // 2
    p += [arr(MX, bot(A2Y), MX, top(A3Y))]
    p += [act(MX, A3Y, 220, AH, ["Запуск таймера"])]

    # Decision: Pomodoro?
    D1Y, HW1, HH1 = bot(A3Y) + 44, 118, 38
    p += [arr(MX, bot(A3Y), MX, top_d(D1Y, HH1))]
    p += [dec(MX, D1Y, HW1, HH1, ["Режим", "Pomodoro?"])]

    # ТАК → right: work → notify → break
    p += [ln(MX + HW1, D1Y, RPX, D1Y)]
    p += [lbl(MX + HW1 + 3, D1Y - 6, "Так")]

    WRK_Y = D1Y + 68
    p += [arr(RPX, D1Y, RPX, top(WRK_Y))]
    p += [act(RPX, WRK_Y, 152, AH, ["Відлік робочого", "інтервалу (25 хв)"])]

    NTF_Y = bot(WRK_Y) + GAP + AH // 2
    p += [arr(RPX, bot(WRK_Y), RPX, top(NTF_Y))]
    p += [act(RPX, NTF_Y, 152, AH, ["Сповіщення про", "початок перерви"])]

    BRK_Y = bot(NTF_Y) + GAP + AH // 2
    p += [arr(RPX, bot(NTF_Y), RPX, top(BRK_Y))]
    p += [act(RPX, BRK_Y, 152, AH, ["Відлік перерви (5 хв)"])]

    JOIN_Y = bot(BRK_Y) + 45
    p += [ln(RPX, bot(BRK_Y), RPX, JOIN_Y)]
    p += [ln(RPX, JOIN_Y, MX, JOIN_Y)]

    # НІ ↓: custom timer
    CST_Y = bot_d(D1Y, HH1) + GAP + AH // 2
    p += [arr(MX, bot_d(D1Y, HH1), MX, top(CST_Y), "Ні", MX + 4, bot_d(D1Y, HH1) + 12)]
    p += [act(MX, CST_Y, 220, AH, ["Відлік довільного", "таймера"])]
    p += [ln(MX, bot(CST_Y), MX, JOIN_Y)]

    p += [join_bar(MX - 105, RPX + 76, JOIN_Y)]
    p += [arr(MX, JOIN_Y, MX, JOIN_Y + GAP)]

    # Decision: stopped?
    D2Y, HW2, HH2 = JOIN_Y + GAP + 40, 118, 38
    p += [arr(MX, JOIN_Y + GAP, MX, top_d(D2Y, HH2))]
    p += [dec(MX, D2Y, HW2, HH2, ["Сесію", "зупинено?"])]

    # НІ → left loop back to A3Y (timer start)
    p += [ln(MX - HW2, D2Y, LX, D2Y)]
    p += [lbl(LX - 2, D2Y - 6, "Ні", anchor="end")]
    p += [ln(LX, D2Y, LX, A3Y)]
    p += [arr(LX, A3Y, MX - 110, A3Y)]
    p += [lbl(LX + 2, A3Y - 7, "Return", size=10)]

    # ТАК ↓ – save
    A4Y = bot_d(D2Y, HH2) + GAP + AH // 2
    p += [arr(MX, bot_d(D2Y, HH2), MX, top(A4Y), "Так", MX + 4, bot_d(D2Y, HH2) + 12)]
    p += [act(MX, A4Y, 220, AH, ["Збереження статистики", "фокус-сесії"])]

    END_Y = bot(A4Y) + 42
    p += [arr(MX, bot(A4Y), MX, END_Y - 13)]
    p += [end_node(MX, END_Y)]

    p += [cap(W // 2, H - 8,
              "Рисунок X.3 – UML діаграма діяльності процесу роботи у кімнаті концентрації")]
    p += [svg_close()]
    return "".join(p)


# ─── Write files ────────────────────────────────────────────────
diagrams = [
    ("diagram_auth.svg",  diagram_auth()),
    ("diagram_task.svg",  diagram_task()),
    ("diagram_focus.svg", diagram_focus()),
]

for filename, content in diagrams:
    fpath = os.path.join(OUT, filename)
    with open(fpath, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"Generated: {filename}")

print("Done.")
