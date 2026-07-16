# -*- coding: utf-8 -*-
target = "src/components/Clock/litclock.csv"
newf = "/tmp/claude-0/-home-user-quoting-clock/c8dee9f0-fb35-56c0-bf01-c97d5963e59a/scratchpad/newquotes.txt"

raw = open(target, encoding="utf-8").read()
had_trailing_nl = raw.endswith("\n")
lines = raw.split("\n")
if had_trailing_nl:
    lines = lines[:-1]  # drop empty last element

new_lines = [l for l in open(newf, encoding="utf-8").read().split("\n") if l.strip()]

# validate 6 fields
for l in new_lines:
    assert l.count("|") == 5, "bad field count: %r" % l

existing_set = set(lines)
existing_quotes = {}
for l in lines:
    parts = l.split("|")
    existing_quotes.setdefault(parts[2], []).append(parts[0])

# duplicate reporting
for l in new_lines:
    if l in existing_set:
        print("EXACT-DUP (skipping):", l[:60])
    q = l.split("|")[2]
    if q in existing_quotes:
        print("QUOTE-ALREADY-PRESENT at", existing_quotes[q], "->", l.split("|")[0], q[:50])

# filter out exact dups
to_add = [l for l in new_lines if l not in existing_set]

def key(l):
    return l.split("|")[0]

# insert each new line after the last existing line with key <= new key
for nl in to_add:
    k = key(nl)
    idx = 0
    for i, l in enumerate(lines):
        if key(l) <= k:
            idx = i + 1
    lines.insert(idx, nl)

out = "\n".join(lines)
if had_trailing_nl:
    out += "\n"
open(target, "w", encoding="utf-8").write(out)
print("added", len(to_add), "lines; total now", len(lines))
