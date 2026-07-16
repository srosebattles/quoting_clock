# -*- coding: utf-8 -*-
p = "src/components/Clock/litclock.csv"
lines = open(p, encoding="utf-8").read().split("\n")
n = 0
for i, line in enumerate(lines):
    if line.startswith("17:") and line.endswith("|unknown"):
        lines[i] = line[:-len("|unknown")] + "|sfw"
        n += 1
assert n == 76, "expected 76, got %d" % n
open(p, "w", encoding="utf-8").write("\n".join(lines))
print("rated", n, "rows sfw")
