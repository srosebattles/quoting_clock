# -*- coding: utf-8 -*-
p = "src/components/Clock/litclock.csv"
s = open(p, encoding="utf-8").read()
for old, new, n in [
    ("|Josh McDowell and Ed Stewert|", "|Josh McDowell and Ed Stewart|", 5),
    ("|O.E. Rolvaag|", "|O. E. Rolvaag|", 1),
]:
    c = s.count(old)
    assert c == n, "expected %d of %r, found %d" % (n, old, c)
    s = s.replace(old, new)
open(p, "w", encoding="utf-8").write(s)
print("normalized")
