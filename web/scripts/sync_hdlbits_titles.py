from __future__ import annotations

import html
import json
import re
import urllib.request
from html.parser import HTMLParser
from pathlib import Path

SOURCE = "https://hdlbits.01xz.net/wiki/Problem_sets"
OUTPUT = Path(__file__).resolve().parents[1] / "app" / "hdlbits-titles.json"


class ProblemSetParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.heading_level: int | None = None
        self.heading_parts: list[str] = []
        self.category = ""
        self.section = ""
        self.subsection = ""
        self.started = False
        self.stopped = False
        self.li_depth = 0
        self.link_href: str | None = None
        self.link_parts: list[str] = []
        self.items: list[dict[str, str]] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag in {"h2", "h3", "h4"}:
            self.heading_level = int(tag[1])
            self.heading_parts = []
        elif tag == "li":
            self.li_depth += 1
        elif tag == "a" and self.started and not self.stopped and self.li_depth:
            href = dict(attrs).get("href") or ""
            if href.startswith("/wiki/") and not href.startswith("/wiki/Problem_sets"):
                self.link_href = href
                self.link_parts = []

    def handle_endtag(self, tag: str) -> None:
        if tag in {"h2", "h3", "h4"} and self.heading_level:
            title = " ".join("".join(self.heading_parts).split())
            if self.heading_level == 2:
                if title == "Getting Started":
                    self.started = True
                if title == "CS450":
                    self.stopped = True
                self.category = title
                self.section = ""
                self.subsection = ""
            elif self.heading_level == 3:
                self.section = title
                self.subsection = ""
            else:
                self.subsection = title
            self.heading_level = None
        elif tag == "a" and self.link_href:
            title = " ".join(html.unescape("".join(self.link_parts)).split())
            if title and title != ".":
                self.items.append(
                    {
                        "title": title,
                        "url": "https://hdlbits.01xz.net" + self.link_href,
                        "category": self.category,
                        "section": self.section or self.category,
                        "subsection": self.subsection,
                    }
                )
            self.link_href = None
            self.link_parts = []
        elif tag == "li":
            self.li_depth = max(0, self.li_depth - 1)

    def handle_data(self, data: str) -> None:
        if self.heading_level:
            self.heading_parts.append(data)
        if self.link_href:
            self.link_parts.append(data)


request = urllib.request.Request(SOURCE, headers={"User-Agent": "MyCPU-Verilog learning planner"})
with urllib.request.urlopen(request, timeout=30) as response:
    markup = response.read().decode("utf-8")

parser = ProblemSetParser()
parser.feed(markup)

seen: set[str] = set()
items = []
for item in parser.items:
    key = re.sub(r"/$", "", item["url"])
    if key not in seen:
        seen.add(key)
        items.append(item)

OUTPUT.write_text(json.dumps(items, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(f"saved {len(items)} HDLBits titles to {OUTPUT}")
