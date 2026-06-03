#!/usr/bin/env python3
"""Generate ER Diagram SVG for Continuum platform database (Рисунок 3.4)"""
import os

OUT = os.path.dirname(os.path.abspath(__file__))

W, H = 950, 650
BW  = 210   # box width
RH  = 15    # field row height
HDR = 22    # header height
PAD = 7     # bottom padding
GAP = 18    # gap between boxes in a column
BLUE = "#3a5f9a"

def bh(n): return HDR + n * RH + PAD

def ent(p, x, y, name, fields):
    """Draw entity box; returns (x, y, width, height) for port helpers."""
    h = bh(len(fields))
    p.append(f'<rect x="{x}" y="{y}" width="{BW}" height="{h}" rx="2" '
             f'fill="white" stroke="{BLUE}" stroke-width="1.5"/>')
    p.append(f'<rect x="{x}" y="{y}" width="{BW}" height="{HDR}" rx="2" fill="{BLUE}"/>')
    p.append(f'<rect x="{x}" y="{y+HDR//2}" width="{BW}" height="{HDR//2+1}" fill="{BLUE}"/>')
    p.append(f'<text x="{x+BW//2}" y="{y+15}" text-anchor="middle" '
             f'font-size="11" font-weight="bold" fill="white">{name}</text>')
    p.append(f'<line x1="{x}" y1="{y+HDR}" x2="{x+BW}" y2="{y+HDR}" '
             f'stroke="{BLUE}" stroke-width="0.8"/>')
    for i, (kd, fn, ft) in enumerate(fields):
        fy = y + HDR + 4 + i * RH + RH - 4
        if kd == 'PK':
            col, fw = '#8b0000', 'bold'
            tag = 'PK'
        elif kd == 'FK':
            col, fw = '#004494', 'normal'
            tag = 'FK'
        else:
            col, fw = '#222', 'normal'
            tag = '  '
        p.append(f'<text x="{x+5}" y="{fy}" font-size="9" fill="{col}" font-weight="{fw}">'
                 f'{tag} {fn}  <tspan fill="#888" font-style="italic">{ft}</tspan></text>')
    return x, y, BW, h

# Port helpers
def L(b, frac=0.5): return b[0],          b[1] + int(b[3]*frac)
def R(b, frac=0.5): return b[0]+b[2],     b[1] + int(b[3]*frac)
def T(b, frac=0.5): return b[0]+int(b[2]*frac), b[1]
def B(b, frac=0.5): return b[0]+int(b[2]*frac), b[1]+b[3]

def seg(p, x1, y1, x2, y2, dash=False):
    d = ' stroke-dasharray="5,3"' if dash else ''
    p.append(f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" '
             f'stroke="#999" stroke-width="1.1"{d}/>')

def hv(p, x1, y1, x2, y2, dash=False):
    """Horizontal then vertical elbow."""
    seg(p, x1, y1, x2, y1, dash)
    seg(p, x2, y1, x2, y2, dash)

def vh(p, x1, y1, x2, y2, dash=False):
    """Vertical then horizontal elbow."""
    seg(p, x1, y1, x1, y2, dash)
    seg(p, x1, y2, x2, y2, dash)

def lbl(p, x, y, text, anchor='middle', color='#555'):
    p.append(f'<text x="{x}" y="{y}" text-anchor="{anchor}" '
             f'font-size="8" fill="{color}">{text}</text>')

def caption(p, cx, y, text):
    p.append(f'<text x="{cx}" y="{y}" text-anchor="middle" font-size="12" fill="#000">{text}</text>')


def diagram_er():
    p = ['<?xml version="1.0" encoding="UTF-8"?>',
         f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" '
         f'viewBox="0 0 {W} {H}" font-family="Arial, sans-serif">',
         f'<rect width="{W}" height="{H}" fill="white" stroke="#000" stroke-width="1.5"/>']

    # ── Column x positions ──────────────────────────────────────────
    xA, xB, xC, xD = 10, 240, 470, 700

    # ── Col A: Content ──────────────────────────────────────────────
    yA = 18
    a_topics = ent(p, xA, yA, "topics", [
        ('PK', 'id',          'uuid'),
        ('',   'title',       'text'),
        ('',   'description', 'text'),
        ('',   'icon',        'text'),
        ('',   'slug',        'text'),
    ]); yA += a_topics[3] + GAP

    a_materials = ent(p, xA, yA, "materials", [
        ('PK', 'id',          'uuid'),
        ('FK', 'topic_id',    '→ topics'),
        ('FK', 'created_by',  '→ profiles'),
        ('',   'title',       'text'),
        ('',   'type',        'material_type'),
        ('',   'content/url', 'text'),
        ('',   'is_published','bool'),
    ]); yA += a_materials[3] + GAP

    a_tasks = ent(p, xA, yA, "tasks", [
        ('PK', 'id',          'uuid'),
        ('FK', 'topic_id',    '→ topics'),
        ('FK', 'created_by',  '→ profiles'),
        ('',   'title',       'text'),
        ('',   'type',        'task_type'),
        ('',   'difficulty',  'difficulty'),
        ('',   'xp_reward',   'int'),
        ('',   'is_published','bool'),
    ]); yA += a_tasks[3] + GAP

    a_opts = ent(p, xA, yA, "task_options", [
        ('PK', 'id',         'uuid'),
        ('FK', 'task_id',    '→ tasks'),
        ('',   'text',       'text'),
        ('',   'is_correct', 'bool'),
    ]); yA += a_opts[3] + GAP

    # ── Col B: Profiles + progress ─────────────────────────────────
    yB = 18
    b_profiles = ent(p, xB, yB, "profiles", [
        ('PK', 'id',         'uuid'),
        ('',   'role',       'user_role'),
        ('',   'full_name',  'text'),
        ('',   'avatar_url', 'text'),
        ('',   'xp',         'int'),
        ('',   'level',      'int'),
        ('',   'language',   'text'),
    ]); yB += b_profiles[3] + GAP

    b_progress = ent(p, xB, yB, "student_progress", [
        ('PK', 'id',          'uuid'),
        ('FK', 'user_id',     '→ profiles'),
        ('FK', 'task_id',     '→ tasks'),
        ('',   'is_correct',  'bool'),
        ('',   'attempt_num', 'int'),
    ]); yB += b_progress[3] + GAP

    b_achiev = ent(p, xB, yB, "achievements", [
        ('PK', 'id',          'uuid'),
        ('',   'title',       'text'),
        ('',   'description', 'text'),
        ('',   'icon',        'text'),
        ('',   'xp_reward',   'int'),
    ]); yB += b_achiev[3] + GAP

    b_user_ach = ent(p, xB, yB, "user_achievements", [
        ('FK', 'user_id',       '→ profiles'),
        ('FK', 'achievement_id','→ achievements'),
        ('',   'earned_at',     'timestamptz'),
    ]); yB += b_user_ach[3] + GAP

    # ── Col C: Personal tools ───────────────────────────────────────
    yC = 18
    c_coll = ent(p, xC, yC, "collections", [
        ('PK', 'id',      'uuid'),
        ('FK', 'user_id', '→ profiles'),
        ('',   'title',   'text'),
    ]); yC += c_coll[3] + GAP

    c_cm = ent(p, xC, yC, "collection_materials", [
        ('FK', 'collection_id', '→ collections'),
        ('FK', 'material_id',   '→ materials'),
        ('',   'added_at',      'timestamptz'),
    ]); yC += c_cm[3] + GAP

    c_notes = ent(p, xC, yC, "notes", [
        ('PK', 'id',          'uuid'),
        ('FK', 'user_id',     '→ profiles'),
        ('FK', 'topic_id',    '→ topics'),
        ('FK', 'material_id', '→ materials'),
        ('FK', 'task_id',     '→ tasks'),
        ('',   'title',       'text'),
        ('',   'content',     'text'),
    ]); yC += c_notes[3] + GAP

    c_focus = ent(p, xC, yC, "focus_sessions", [
        ('PK', 'id',                  'uuid'),
        ('FK', 'user_id',             '→ profiles'),
        ('',   'started_at/ended_at', 'timestamptz'),
        ('',   'focus_seconds',       'int'),
        ('',   'pomodoros_completed', 'int'),
        ('',   'mode',                'text'),
        ('',   'status',              'text'),
    ]); yC += c_focus[3] + GAP

    # ── Col D: Social + System ──────────────────────────────────────
    yD = 18
    d_posts = ent(p, xD, yD, "posts", [
        ('PK', 'id',      'uuid'),
        ('FK', 'user_id', '→ profiles'),
        ('',   'content', 'text'),
        ('',   'url',     'text'),
    ]); yD += d_posts[3] + GAP

    d_comments = ent(p, xD, yD, "comments", [
        ('PK', 'id',          'uuid'),
        ('FK', 'user_id',     '→ profiles'),
        ('FK', 'material_id', '→ materials'),
        ('FK', 'task_id',     '→ tasks'),
        ('FK', 'post_id',     '→ posts'),
        ('',   'content',     'text'),
    ]); yD += d_comments[3] + GAP

    d_reactions = ent(p, xD, yD, "reactions", [
        ('PK', 'id',          'uuid'),
        ('FK', 'user_id',     '→ profiles'),
        ('FK', 'material_id', '→ materials'),
        ('FK', 'comment_id',  '→ comments'),
        ('FK', 'post_id',     '→ posts'),
    ]); yD += d_reactions[3] + GAP

    d_notif = ent(p, xD, yD, "notifications", [
        ('PK', 'id',      'uuid'),
        ('FK', 'user_id', '→ profiles'),
        ('',   'type',    'notification_type'),
        ('',   'title',   'text'),
        ('',   'is_read', 'bool'),
    ]); yD += d_notif[3] + GAP

    # ══ Relationships ════════════════════════════════════════════════

    # ── Col A internal ─────────────────────
    # topics → materials
    b0 = B(a_topics, 0.35); t0 = T(a_materials, 0.35)
    seg(p, *b0, *t0)

    # topics → tasks
    bx, by = B(a_topics, 0.65); tx, ty = T(a_tasks, 0.65)
    vh(p, bx, by, tx, ty)

    # tasks → task_options
    seg(p, *B(a_tasks, 0.5), *T(a_opts, 0.5))

    # ── Col B internal ─────────────────────
    # profiles → student_progress
    seg(p, *B(b_profiles, 0.4), *T(b_progress, 0.4))

    # achievements → user_achievements
    seg(p, *B(b_achiev, 0.6), *T(b_user_ach, 0.6))

    # profiles → user_achievements (left side)
    px, py = B(b_profiles, 0.2)
    ux, uy = T(b_user_ach, 0.2)
    hv(p, px, py, xB - 10, py)
    seg(p, xB - 10, py, xB - 10, uy)
    hv(p, xB - 10, uy, ux, uy)

    # ── Col C internal ─────────────────────
    # collections → collection_materials
    seg(p, *B(c_coll, 0.4), *T(c_cm, 0.4))

    # ── Col D internal ─────────────────────
    # posts → comments
    seg(p, *B(d_posts, 0.6), *T(d_comments, 0.6))

    # posts → reactions
    rx1, ry1 = B(d_posts, 0.8)
    rx2, ry2 = T(d_reactions, 0.8)
    hv(p, rx1, ry1, xD + BW + 8, ry1)
    seg(p, xD + BW + 8, ry1, xD + BW + 8, ry2)
    hv(p, xD + BW + 8, ry2, rx2, ry2)

    # comments → reactions
    seg(p, *B(d_comments, 0.4), *T(d_reactions, 0.4))

    # ── A → B connections ──────────────────
    # tasks → student_progress
    ax, ay = R(a_tasks, 0.5)
    bx, by = L(b_progress, 0.5)
    mid = (ax + bx) // 2
    hv(p, ax, ay, mid, ay)
    seg(p, mid, ay, mid, by)
    hv(p, mid, by, bx, by)

    # materials → notes (A right → C left via waypoint)
    # skip for clarity — noted in FK column in notes table

    # ── B → C connections ──────────────────
    # profiles → collections
    seg(p, *R(b_profiles, 0.2), *L(c_coll, 0.5))

    # profiles → notes
    px, py = R(b_profiles, 0.5)
    nx, ny = L(c_notes, 0.5)
    seg(p, px, py, nx, ny)

    # profiles → focus_sessions
    px, py = R(b_profiles, 0.75)
    fx, fy = L(c_focus, 0.5)
    hv(p, px, py, xC - 8, py)
    seg(p, xC - 8, py, xC - 8, fy)
    hv(p, xC - 8, fy, fx, fy)

    # ── B → D connections ──────────────────
    # profiles → posts
    px2, py2 = R(b_profiles, 0.3)
    dx, dy = L(d_posts, 0.3)
    hv(p, px2, py2, xD - 8, py2)
    seg(p, xD - 8, py2, xD - 8, dy)
    hv(p, xD - 8, dy, dx, dy)

    # profiles → comments
    px2, py2 = R(b_profiles, 0.65)
    dx, dy = L(d_comments, 0.35)
    hv(p, px2, py2, xD - 14, py2)
    seg(p, xD - 14, py2, xD - 14, dy)
    hv(p, xD - 14, dy, dx, dy)

    # profiles → notifications
    px2, py2 = R(b_profiles, 0.8)
    dx, dy = L(d_notif, 0.5)
    hv(p, px2, py2, xD - 20, py2)
    seg(p, xD - 20, py2, xD - 20, dy)
    hv(p, xD - 20, dy, dx, dy)

    # ── C: collection_materials → materials (A) ─────────────────────
    mx, my = L(c_cm, 0.5)
    ax2, ay2 = R(a_materials, 0.7)
    midx = (mx + ax2) // 2
    seg(p, mx, my, ax2, my)

    # ── Caption ────────────────────────────────────────────────────
    caption(p, W // 2, H - 8,
            "Рисунок 3.4 – Схема реляційної бази даних системи (виконано самостійно)")

    p.append('</svg>')
    return "\n".join(p)


svg = diagram_er()
fpath = os.path.join(OUT, "diagram_er.svg")
with open(fpath, "w", encoding="utf-8") as f:
    f.write(svg)
print("Generated: diagram_er.svg")
