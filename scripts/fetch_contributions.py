#!/usr/bin/env python3
"""
Fetch GitHub contribution data from the public contributions page.

Output:
    data/contributions.json
"""

import json
from pathlib import Path

import requests
from bs4 import BeautifulSoup

# -------------------------
# CONFIG
# -------------------------

USERNAME = "Yashmalik2004"

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
DATA_DIR.mkdir(exist_ok=True)

OUTPUT_FILE = DATA_DIR / "contributions.json"

URL = f"https://github.com/users/{USERNAME}/contributions"

HEADERS = {
    "User-Agent": "Mozilla/5.0"
}

# -------------------------
# FETCH
# -------------------------

response = requests.get(URL, headers=HEADERS, timeout=20)
response.raise_for_status()

soup = BeautifulSoup(response.text, "lxml")

days = []

# -------------------------
# PARSE CELLS
# -------------------------

for rect in soup.select("rect[data-date]"):

    date = rect.get("data-date")

    count = int(rect.get("data-count", 0))

    level = int(rect.get("data-level", 0))

    days.append(
        {
            "date": date,
            "count": count,
            "level": level,
        }
    )

# -------------------------
# STATS
# -------------------------

total = sum(day["count"] for day in days)

best_day = max(days, key=lambda x: x["count"]) if days else None

# current streak

current_streak = 0

for day in reversed(days):
    if day["count"] > 0:
        current_streak += 1
    else:
        break

# longest streak

longest = 0
running = 0

for day in days:

    if day["count"] > 0:
        running += 1
        longest = max(longest, running)
    else:
        running = 0

# monthly totals

months = {}

for day in days:

    month = day["date"][:7]

    months.setdefault(month, 0)

    months[month] += day["count"]

# -------------------------
# SAVE
# -------------------------

output = {
    "username": USERNAME,
    "days": days,
    "stats": {
        "total_contributions": total,
        "current_streak": current_streak,
        "longest_streak": longest,
        "best_day": best_day,
        "monthly_totals": months,
    },
}

with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
    json.dump(output, f, indent=4)

print(f"Saved {len(days)} days")
print(f"Total contributions : {total}")
print(f"Current streak      : {current_streak}")
print(f"Longest streak      : {longest}")
print(f"Output              : {OUTPUT_FILE}")