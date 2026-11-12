import { checkLayout, formatLayoutReport } from './lib/layout.js';
const html = `<!doctype html><meta charset=utf-8><style>
body{margin:0;background:#0b0d12;color:#e8ecf5;font:16px/1.5 system-ui;width:1000px}
.wrap{position:relative;width:1000px;height:640px}
.card{position:absolute;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.14);border-radius:16px;padding:20px}
.a{left:40px;top:40px;width:380px;height:200px}
.b{left:320px;top:120px;width:380px;height:220px}
.c{left:760px;top:60px;width:300px;height:180px}
.d{left:60px;top:330px;width:420px;height:190px}
.txt{position:absolute;left:100px;top:250px;font-size:28px}
.txt2{position:absolute;left:140px;top:268px;font-size:28px}
</style><div class=wrap>
<div class="card a">Card A<p>alpha block</p></div>
<div class="card b">Card B<p>beta block overlapping</p></div>
<div class="card c" style="left:820px">Card C overflowing</div>
<div class="card d">Card D</div>
<div class=txt>重叠的文字</div>
<div class=txt2>另一行字</div>
</div>`;
const r = await checkLayout({ html, viewport:{width:1000,height:700} });
console.log(formatLayoutReport(r));
