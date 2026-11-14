# usage: python3 fulltheme.py <id> "<world comment>"  — replaces the borrowed icons/foods/furniture of a theme with its own world
import re, sys
cid, comment = sys.argv[1], sys.argv[2]
p = 'src/data/themes.js'; s = open(p).read()
start = s.index(f"\n  {cid}: {{\n")
# the comment line(s) right above the entry
cstart = start
while s[:cstart].split('\n')[-1].strip().startswith('//'):
    cstart = s.rindex('\n', 0, cstart)
end = s.index("\n  },\n", start) + len("\n  },")
block = s[start:end]
palette = re.search(r"    palette: \{.*?\n    \},", block, re.S).group(0)
items = ['banner','painting','trophy','bed','nest','lamp','chest','shelf','imp','hatchling','cushion','bird']
icons = ['coin','shop','settings','sound','lair','record','break']
new = f"""
  // {comment}
  {cid}: {{
{palette}
    icons: {{
""" + ''.join(f"      {k}: '/art/icons/{cid}-{k}.webp',\n" for k in icons) + """    },
    foods: {
""" + ''.join(f"      {k}: '/art/foods/{cid}-{k}.webp',\n" for k in ['apple','meat','cake']) + f"""    }},
    room: '/art/lair/{cid}-room.webp',
    backdrop: '/art/backdrops/{cid}.webp',
    furniture: {{
""" + ''.join(f"      {k}: '/art/lair/{cid}-{k}.webp',\n" for k in items) + """    },
  },"""
s = s[:cstart] + new + s[end:]
open(p, 'w').write(s)
t = 'src/data/themes.test.js'; u = open(t).read()
u = re.sub(r"(const fullWorlds = \[[^\]]*)\]", lambda m: m.group(1) + f", '{cid}']", u, 1)
open(t, 'w').write(u)
print('ok', cid)
