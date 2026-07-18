#!/usr/bin/env python3
"""
render_heatmap_svg.py
"""

import json
from pathlib import Path

CELL=11
GAP=3
RADIUS=2
LEFT=40
TOP=40
PALETTE=["#161B22","#0E4429","#006D32","#26A641","#39D353"]

ROOT=Path(__file__).resolve().parent.parent
DATA=ROOT/"data"/"contributions.json"
OUTDIR=ROOT/"assets"/"terminal"
OUTDIR.mkdir(parents=True,exist_ok=True)
OUTFILE=OUTDIR/"contribution-grid.svg"

with open(DATA,"r",encoding="utf-8") as f:
    obj=json.load(f)

days=obj["days"]
stats=obj["stats"]

weeks=[]
w=[]
for d in days:
    w.append(d)
    if len(w)==7:
        weeks.append(w)
        w=[]
if w:
    while len(w)<7:
        w.append({"level":0,"count":0,"date":""})
    weeks.append(w)

width=LEFT*2+len(weeks)*(CELL+GAP)
height=180

parts=[]
parts.append(f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}">')
parts.append("""
<style>
.bg{fill:#0D1117;}
.title{fill:#E6EDF3;font:600 16px monospace;}
.small{fill:#8B949E;font:13px monospace;}
.cell{opacity:0;animation:appear .45s ease forwards;}
@keyframes appear{
from{opacity:0;transform:translateY(6px);}
to{opacity:1;transform:translateY(0);}
}
</style>
""")
parts.append('<rect class="bg" width="100%" height="100%" rx="10"/>')
parts.append('<text x="20" y="22" class="title">GitHub Contributions</text>')

delay=0.0
for x,week in enumerate(weeks):
    for y,day in enumerate(week):
        color=PALETTE[max(0,min(4,int(day["level"])))]
        px=LEFT+x*(CELL+GAP)
        py=TOP+y*(CELL+GAP)
        parts.append(
            f'<rect x="{px}" y="{py}" width="{CELL}" height="{CELL}" rx="{RADIUS}" fill="{color}" class="cell" style="animation-delay:{delay:.2f}s"><title>{day["date"]} : {day["count"]}</title></rect>'
        )
        delay+=0.008

ly=TOP+7*(CELL+GAP)+18
parts.append(f'<text x="20" y="{ly}" class="small">Less</text>')
for i,c in enumerate(PALETTE):
    parts.append(f'<rect x="{58+i*18}" y="{ly-11}" width="11" height="11" rx="2" fill="{c}"/>')
parts.append(f'<text x="{58+len(PALETTE)*18+10}" y="{ly}" class="small">More</text>')
parts.append(f'<text x="20" y="{height-18}" class="small">{stats["total_contributions"]:,} contributions • Current streak: {stats["current_streak"]} • Longest streak: {stats["longest_streak"]}</text>')
parts.append("</svg>")
OUTFILE.write_text("\n".join(parts),encoding="utf-8")
