# -*- coding: utf-8 -*-
p = "src/components/Clock/litclock.csv"
s = open(p, encoding="utf-8").read()

fixes = [
    ("he’d by home by five", "he’d be home by five", 1),   # 17:00 The Body Lies
    ("walk with my on the sand", "walk with me on the sand", 1),     # 17:00 Joyland
    ("mimicking a meteoriod", "mimicking a meteoroid", 1),           # 17:10 The Shadow and Night
    ("|Malcom|George MacDonald|", "|Malcolm|George MacDonald|", 1),  # 17:10 title
    ("Staff Segeant Beyn", "Staff Sergeant Beyn", 1),                # 17:41 The Heart of Valor
    ("|Bone Clocks|David Mitchell|", "|The Bone Clocks|David Mitchell|", 1),  # 17:58 title
]
for old, new, n in fixes:
    c = s.count(old)
    assert c == n, "expected %d of %r, found %d" % (n, old, c)
    s = s.replace(old, new)

open(p, "w", encoding="utf-8").write(s)
print("all fixes applied")
