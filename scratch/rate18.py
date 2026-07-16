# -*- coding: utf-8 -*-
p = "src/components/Clock/litclock.csv"
raw = open(p, encoding="utf-8").read()
had_nl = raw.endswith("\n")
lines = raw.split("\n")
if had_nl: lines = lines[:-1]
n = 0
for i, line in enumerate(lines):
    if line.startswith("18:") and line.endswith("|unknown"):
        if "|Le Club des Hachichins|" in line:   # hold for user rating call
            continue
        lines[i] = line[:-len("|unknown")] + "|sfw"
        n += 1
out = "\n".join(lines) + ("\n" if had_nl else "")
open(p, "w", encoding="utf-8").write(out)
print("rated", n, "rows sfw")
