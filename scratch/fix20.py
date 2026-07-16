# -*- coding: utf-8 -*-
p = "src/components/Clock/litclock.csv"
raw = open(p, encoding="utf-8").read()
had_nl = raw.endswith("\n")
lines = raw.split("\n")
if had_nl: lines = lines[:-1]

fixes = [
    # (time-prefix guard, old author field, new author field, expected count)
    ("20:37", "|The Great Train Robbery|Micheal Crichton|", "|The Great Train Robbery|Michael Crichton|", 1),
    ("20:26", "|The Temptress|William Le Quex|",            "|The Temptress|William Le Queux|",         1),
    ("20:38", "|While the Women Are Sleeping|Javier Marais|", "|While the Women Are Sleeping|Javier Marías|", 1),
]

for prefix, old, new, exp in fixes:
    c = 0
    for i, line in enumerate(lines):
        if line.startswith(prefix) and old in line:
            lines[i] = line.replace(old, new)
            c += 1
    assert c == exp, (prefix, old, c, exp)
    print("fixed", prefix, "->", new.strip("|"), "x", c)

out = "\n".join(lines) + ("\n" if had_nl else "")
open(p, "w", encoding="utf-8").write(out)
