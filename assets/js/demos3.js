/* ═══════════════════════════════════════════════════
   交互演示 · 第三批:逆向工程(内存扫描 / 透视原理 / APK 解包 / 字节码)
   ═══════════════════════════════════════════════════ */
(function () {
  'use strict';
  var D = window.DEMOS = window.DEMOS || {};
  var U = window.DUTIL;
  var el = U.el, btn = U.btn, logArea = U.logArea, counters = U.counters, tabs = U.tabs;
  function dlog(box, msg, cls) { U.log(box, msg, cls); }

  /* ═══════════ 1. 内存扫描小游戏(PVZ 金币) ═══════════ */
  D['memory-scan'] = {
    title: '内存扫描小游戏:金币藏哪一格?',
    subtitle: '模拟 Cheat Engine:精确扫描 → 花点钱再扫 → 改写',
    icon: 'target',
    mount: function (body) {
      var setTimeout = window.HUB_DEMO_SYSTEM.scheduler(body);
      var N = 16, coins = 925, realIdx = 3, mem = [];
      var lastMatches = [], found = false, spent = false, scanned = false;
      var goldChip = el('div', 'dm-chip c-amber', '🍉 当前金币:<b>925</b>');
      var grid = el('div', 'dm-mem');
      grid.style.gridTemplateColumns = 'repeat(8, 1fr)';
      var log = logArea();
      var counter = counters([{ key: 'scan', label: '扫描次数' }, { key: 'match', label: '命中地址' }, { key: 'state', label: '状态' }]);

      function addr(i) { return '0x' + (0x18A0 + i * 4).toString(16).toUpperCase(); }
      function reset() {
        coins = 925; spent = false; lastMatches = []; found = false; scanned = false;
        goldChip.innerHTML = '🍉 当前金币:<b>925</b>';
        counter._n = 0;
        realIdx = 2 + Math.floor(Math.random() * 12);
        mem = [];
        for (var i = 0; i < N; i++) {
          var v = [0, 4, 13, 77, 120, 450, 21, 366][Math.floor(Math.random() * 8)];
          mem.push(v);
        }
        hackBtn.disabled = true;
        mem[realIdx] = 925;
        mem[(realIdx + 5) % N] = 925;      // 干扰项 1
        mem[(realIdx + 11) % N] = 925;     // 干扰项 2
        paint();
        counter.set('scan', 0); counter.set('match', 0); counter.set('state', '待扫描');
        log.innerHTML = '';
        dlog(log, '游戏进程已加载:金币是内存里一个 <b>4 字节整数</b>。现在内存里有很多数字,金币混在其中 —— 先按 925 扫一遍。', 'l-info');
      }
      function paint(hl) {
        grid.innerHTML = '';
        mem.forEach(function (v, i) {
          var hit = hl && hl.indexOf(i) >= 0;
          var real = found && i === realIdx;
          var c = el('div', 'dm-mem-cell' + (real ? ' live' : (hit ? ' hot' : '')));
          c.innerHTML = '<div style="font-size:8.5px;opacity:.65">' + addr(i) + '</div><div style="font-size:13px;font-weight:700">' + v + '</div>';
          c.style.height = '44px';
          c.style.flexDirection = 'column';
          grid.appendChild(c);
        });
      }
      function scan(val) {
        if (val === '' || !Number.isFinite(Number(val))) return;
        counter._n++;
        counter.set('scan', counter._n);
        var hits = [];
        mem.forEach(function (v, i) { if ((!scanned || lastMatches.indexOf(i) >= 0) && v === +val) hits.push(i); });
        lastMatches = hits;
        scanned = true;
        hackBtn.disabled = hits.length !== 1;
        counter.set('match', hits.length);
        paint(hits);
        if (hits.length > 3) {
          dlog(log, '扫描 <b>' + val + '</b> → 命中 ' + hits.length + ' 个地址,还是太多。去花掉 25 金币,让金币数<b>变化</b>,再用新数值扫一次。', 'l-hl');
        } else if (hits.length > 1) {
          dlog(log, '扫描 <b>' + val + '</b> → 命中 ' + hits.length + ' 个地址(有干扰项!)。金币变了数值后,再扫新值把干扰项筛掉。', 'l-hl');
        } else if (hits.length === 1) {
          dlog(log, '扫描 <b>' + Number(val) + '</b> → <span class="l-ok">只剩 1 个候选地址。</span>唯一命中不等于已证明含义；改写并观察金币是否同步变化。', 'l-ok');
          counter.set('state', '待验证');
        } else {
          dlog(log, '扫描 <b>' + val + '</b> → 0 命中。想想当前金币到底是多少?', 'l-err');
        }
      }
      var scanInput = el('input', '');
      scanInput.type = 'number';
      scanInput.placeholder = '想搜的数值,如 925';
      scanInput.style.cssText = 'width:150px;padding:8px 12px;border-radius:9px;border:1px solid rgba(148,163,184,.3);background:rgba(4,8,16,.7);color:#e2e8f0;font-family:var(--font-mono);font-size:13px;outline:none';
      var bar = el('div', 'dm-toolbar');
      bar.appendChild(goldChip);
      bar.appendChild(scanInput);
      bar.appendChild(btn('🔍 扫描这个值', function () { scan(scanInput.value); }));
      bar.appendChild(btn('💸 花 25 金币(买颗豌豆)', function () {
        if (coins < 25) { dlog(log, '金币不够了…', 'l-err'); return; }
        coins -= 25;
        mem[realIdx] = coins;
        spent = true;
        goldChip.innerHTML = '🍉 当前金币:<b>' + coins + '</b>';
        dlog(log, '金币 -25 → 现在是 <b>' + coins + '</b>。游戏画面变了,内存里金币那个格子也同步变了 —— 用新数值再扫一次。', 'l-info');
        paint();
      }));
      var hackBtn = btn('✏️ 改写为 9999', function () {
        if (lastMatches.length !== 1) { dlog(log, '地址还没定位唯一,别乱改(这正是"改错地址导致游戏崩溃"的原因)。', 'l-err'); return; }
        mem[lastMatches[0]] = 9999;
        found = lastMatches[0] === realIdx;
        if (found) { coins = 9999; goldChip.innerHTML = '🍉 当前金币:<b style="color:#34d399">9999</b> 💰'; }
        counter.set('state', found ? '已验证' : '候选不符');
        paint();
        dlog(log, found ? '候选地址写入成功，金币同步变化；支持这是金币字段的判断。' : '候选地址改变，但金币没变：推断不成立，重开后重新验证。', found ? 'l-ok' : 'l-err');
        dlog(log, '这里只改写一次，不是持续锁定数值；不读取真实进程。', 'l-info');
      });
      hackBtn.disabled = true;
      bar.appendChild(hackBtn);
      bar.appendChild(btn('↺ 重开一局', reset, true));
      body.appendChild(bar);
      body.appendChild(el('div', 'dm-panel-title', '进程内存(简化示意 · 每格 4 字节)'));
      body.appendChild(grid);
      body.appendChild(counter);
      body.appendChild(log);
      reset();
    }
  };

  /* ═══════════ 2. 透视原理与反作弊 ═══════════ */
  D['esp-principle'] = {
    title: '透视原理实验台:开启 ESP 会发生什么?',
    subtitle: '读内存 → 坐标转换 → 覆盖绘制 · 再观察候选检测证据',
    icon: 'search',
    mount: function (body) {
      var setTimeout = window.HUB_DEMO_SYSTEM.scheduler(body);
      var espOn = false, acOn = false, banned = false;
      var stage = el('div', '');
      stage.style.cssText = 'position:relative;height:270px;border-radius:12px;background:linear-gradient(180deg,#0a1224,#050810);border:1px solid rgba(148,163,184,.15);overflow:hidden';
      /* 地图元素 */
      function block(x, y, w, h, label, color) {
        var b = el('div', '', label || '');
        b.style.cssText = 'position:absolute;left:' + x + '%;top:' + y + '%;width:' + w + '%;height:' + h + '%;background:' + color + ';border-radius:4px;display:flex;align-items:center;justify-content:center;font-size:10px;color:rgba(226,232,240,.55);font-family:var(--font-mono)';
        stage.appendChild(b);
        return b;
      }
      block(10, 55, 18, 30, '墙体', 'linear-gradient(135deg,#1e293b,#334155)');
      block(42, 20, 16, 38, '掩体', 'linear-gradient(135deg,#1e293b,#334155)');
      block(70, 60, 16, 30, '墙体', 'linear-gradient(135deg,#1e293b,#334155)');
      /* 玩家 */
      var player = el('div', '', '🧍');
      player.style.cssText = 'position:absolute;left:48%;top:78%;font-size:24px;filter:drop-shadow(0 0 8px rgba(34,211,238,.8))';
      stage.appendChild(player);
      /* 敌人 */
      var enemies = [
        { x: 22, y: 30, name: '敌人A', hidden: false, dist: '18m' },
        { x: 60, y: 42, name: '敌人B', hidden: true, dist: '26m' },
        { x: 84, y: 22, name: '敌人C', hidden: true, dist: '34m' }
      ];
      var enemyEls = [];
      enemies.forEach(function (e) {
        var d = el('div', '', '🔫');
        d.style.cssText = 'position:absolute;left:' + e.x + '%;top:' + e.y + '%;font-size:20px;opacity:' + (e.hidden ? '0.12' : '1') + ';transition:opacity .4s';
        stage.appendChild(d);
        var box = el('div', '', '<span style="position:absolute;top:-16px;left:0;font-size:9px;color:#fb7185;white-space:nowrap;font-family:var(--font-mono)">' + e.name + ' · ' + e.dist + '</span>');
        box.style.cssText = 'position:absolute;left:calc(' + Math.min(e.x, 70) + '% - 8px);top:calc(' + e.y + '% - 10px);width:40px;height:52px;border:1.5px dashed rgba(251,113,133,.9);border-radius:4px;box-shadow:0 0 12px rgba(251,113,133,.4);display:none;pointer-events:none';
        stage.appendChild(box);
        enemyEls.push({ dot: d, box: box, e: e });
      });
      var alarm = el('div', '', '');
      alarm.style.cssText = 'position:absolute;left:50%;top:42%;transform:translate(-50%,-50%);display:none;padding:14px 26px;border-radius:12px;background:rgba(251,113,133,.15);border:2px solid #fb7185;color:#fda4af;font-weight:700;font-size:15px;text-align:center;backdrop-filter:blur(6px);z-index:5';
      stage.appendChild(alarm);
      var log = logArea();
      var bar = el('div', 'dm-toolbar');
      var espSwitch = el('span', 'dm-switch', '<span class="track"><span class="knob"></span></span><span>开启透视(ESP)</span>');
      var acSwitch = el('span', 'dm-switch', '<span class="track"><span class="knob"></span></span><span>启动反作弊检测</span>');
      function refresh() {
        enemyEls.forEach(function (it) {
          it.dot.style.opacity = espOn ? '1' : (it.e.hidden ? '0.12' : '1');
          it.box.style.display = espOn ? 'block' : 'none';
          it.dot.style.filter = espOn ? 'drop-shadow(0 0 6px rgba(251,113,133,.8))' : 'none';
        });
        if (espOn && acOn && !banned) {
          banned = true;
          alarm.style.display = 'block';
          alarm.innerHTML = '🚨 反作弊警报<br><span style="font-size:11px;font-weight:400">检测到外部进程读取游戏内存 / 覆盖窗口创建<br>→ 记录候选证据，仍需核实</span>';
          dlog(log, '<span class="l-err">【反作弊】模型提示:① 非授权句柄 ② 覆盖窗口。此演示没有命中率数据，不能据此推断真实处罚。</span>', 'l-err');
        }
        if (!espOn || !acOn) { alarm.style.display = 'none'; banned = false; }
      }
      espSwitch.addEventListener('click', function () {
        espOn = !espOn;
        espSwitch.classList.toggle('on', espOn);
        if (espOn) {
          dlog(log, '<b>步骤 1</b>:外挂进程 OpenProcess 拿到游戏句柄,遍历实体链表读内存 → 拿到三个敌人的世界坐标(x,y,z)', 'l-info');
          dlog(log, '<b>步骤 2</b>:真实三维投影还需视图/投影矩阵、透视除法与视口变换；此图直接使用预设的二维坐标', 'l-info');
          dlog(log, '<b>步骤 3</b>:创建透明 Overlay 窗口盖在游戏上,在算出的位置画红框 —— 隔墙的敌人也被"看见"了 👁️', 'l-hl');
          dlog(log, '注意:游戏画面本身没变,红框是另一层窗口画的。<span class="l-err">截图/录像是否包含覆盖层，取决于捕获方式、窗口与平台策略</span>。', 'l-hl');
        } else {
          dlog(log, '透视已关闭 —— 世界清静了。', 'l-info');
        }
        refresh();
      });
      acSwitch.addEventListener('click', function () {
        acOn = !acOn;
        acSwitch.classList.toggle('on', acOn);
        dlog(log, acOn ? '<b>反作弊开启</b>:开始检测句柄授权、窗口层级、内存完整性、行为统计…' : '反作弊已关闭。', acOn ? 'l-ok' : 'l-info');
        refresh();
      });
      bar.appendChild(espSwitch);
      bar.appendChild(acSwitch);
      bar.appendChild(btn('↺ 重置现场', function () {
        espOn = acOn = banned = false;
        espSwitch.classList.remove('on'); acSwitch.classList.remove('on');
        alarm.style.display = 'none';
        log.innerHTML = '';
        dlog(log, '现场已重置。先开检测、再开覆盖层，比较可观察证据:', 'l-info');
        refresh();
      }, true));
      body.appendChild(bar);
      body.appendChild(stage);
      var legend = el('div', 'dm-legend',
        '<span class="lg"><i style="background:#fb7185"></i>ESP 红框(外挂绘制层)</span>' +
        '<span class="lg"><i style="background:#334155"></i>墙体/掩体(正常看不到后面)</span>' +
        '<span class="lg"><i style="background:#22d3ee"></i>你自己</span>');
      body.appendChild(legend);
      body.appendChild(log);
      dlog(log, '游戏里"看不见"是因为渲染层只画视野内物体;外挂绕过渲染,直接读数据层 —— <b>数据 > 画面</b>。', 'l-info');
    }
  };

  /* ═══════════ 3. APK 解包流水线 ═══════════ */
  D['apk-unpack'] = {
    title: 'APK 解包重打包流水线',
    subtitle: '从 zip 到 smali 再到重新签名 · 8 步走完',
    icon: 'layers',
    mount: function (body) {
      var setTimeout = window.HUB_DEMO_SYSTEM.scheduler(body);
      var step = 0;
      var tree = el('div', 'demo-log');
      tree.style.cssText = 'max-height:250px;min-height:250px;white-space:pre;font-size:11.5px;line-height:1.7';
      var term = el('div', 'demo-log');
      term.style.cssText = 'max-height:250px;min-height:250px;white-space:pre-wrap;font-size:11.5px;line-height:1.7';
      var counter = counters([{ key: 'step', label: '进度' }, { key: 'stage', label: '当前阶段' }]);
      var STEPS = [
        {
          tree: 'app.apk  (ZIP, PK\\x03\\x04)',
          cmd: 'file app.apk\nunzip -l app.apk | head -8',
          out: 'app.apk: Zip archive data\na   AndroidManifest.xml\na   classes.dex\na   resources.arsc\na   res/layout/activity_main.xml\na   lib/arm64-v8a/libgame.so\na   META-INF/CERT.RSA',
          stage: '识别格式'
        },
        {
          tree: 'app.apk/\n  AndroidManifest.xml\n  classes.dex\n  resources.arsc\n  res/\n  lib/arm64-v8a/libgame.so\n  META-INF/',
          cmd: 'apktool d app.apk -o out --only-main-classes',
          out: 'I: Using Apktool 2.9.3\nI: Loading resource table...\nI: Decoding AndroidManifest.xml...\nI: Baksmaling classes.dex...\nI: Copying assets and libs...',
          stage: '反编译资源+smali'
        },
        {
          tree: 'out/\n  AndroidManifest.xml   ← 可读 XML\n  smali/                ← dex 的汇编\n  res/values/strings.xml\n  res/drawable/...\n  unknown/',
          cmd: 'ls out/smali/com/game/ | head\nhead -20 out/res/values/strings.xml',
          out: 'CoinManager.smali\nGameActivity.smali\n...\n<string name="coin_tip">金币: %d</string>',
          stage: '查看产出'
        },
        {
          tree: 'out/smali/com/game/CoinManager.smali\n\n.method public getCoin()I\n  .registers 2\n  iget v0, p0, LCoinManager;->coin:I\n  return v0\n.end method',
          cmd: 'grep -rn "coin" out/smali/com/game/ | head -3',
          out: 'CoinManager.smali:12: .field private coin:I\nCoinManager.smali:31: iget v0, p0, LCoinManager;->coin:I',
          stage: '定位关键逻辑'
        },
        {
          tree: '修改前: iget v0, p0, ->coin:I\n修改后: const v0, 0x270F   (0x270F = 9999)',
          cmd: '# 手动编辑 smali:把读取 coin 字段改成常量 9999\nvim out/smali/com/game/CoinManager.smali',
          out: '-  iget v0, p0, LCoinManager;->coin:I\n+  const v0, 0x270F',
          stage: '改 smali(教学示例)'
        },
        {
          tree: 'out/  → 重新编译\n  build/apk/app.apk(未签名)\n  dist/app.apk',
          cmd: 'apktool b out -o app_unsigned.apk',
          out: 'I: Using Apktool 2.9.3\nI: Smaling smali folder into classes.dex...\nI: Building resources...\nI: Building apk file...',
          stage: '重打包'
        },
        {
          tree: 'app_unsigned.apk\n  → zipalign 对齐\n  → apksigner 签名\n  → app-signed.apk ✅',
          cmd: 'zipalign -v 4 app_unsigned.apk app_aligned.apk\napksigner sign --ks my.keystore --out app-signed.apk app_aligned.apk',
          out: 'Verification successful\nSigner #1 certificate DN: CN=Test\nerrors: 0',
          stage: '对齐+签名'
        },
        {
          tree: 'app-signed.apk\n  → adb install\n  → 启动,金币显示 9999 🎉',
          cmd: 'adb install -r app-signed.apk',
          out: 'Performing Streamed Install\nSuccess\n# 若跳过签名:INSTALL_PARSE_FAILED_NO_CERTIFICATES ❌',
          stage: '安装验证'
        }
      ];
      var bar = el('div', 'dm-toolbar');
      bar.appendChild(btn('▶ 下一步', function () {
        if (step >= STEPS.length) { dlog(term, '<span class="l-ok">全流程演示完毕 —— 记住:每一步都有对应的对抗手段(加固/签名校验/反调试)</span>', 'l-ok'); return; }
        var s = STEPS[step];
        tree.textContent = s.tree;
        function escHtml(x) { return x.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
        term.innerHTML += '<div style="color:#7dd3fc">$ ' + escHtml(s.cmd).replace(/\n/g, '\n$ ') + '</div><div style="color:#9fe8c8">' + escHtml(s.out) + '</div><div class="l-t">— ' + s.stage + ' —</div>';
        term.scrollTop = term.scrollHeight;
        counter.set('step', (step + 1) + ' / ' + STEPS.length);
        counter.set('stage', s.stage);
        step++;
      }));
      bar.appendChild(btn('↺ 重置', function () {
        step = 0; tree.textContent = 'app.apk  (ZIP, PK\\x03\\x04)'; term.innerHTML = '';
        counter.set('step', '0 / 8'); counter.set('stage', '待开始');
      }, true));
      body.appendChild(bar);
      var row = el('div', 'dm-row');
      var p1 = el('div', 'dm-panel'); p1.style.flex = '1';
      p1.appendChild(el('div', 'dm-panel-title', '📁 文件树 / 关键片段'));
      p1.appendChild(tree);
      var p2 = el('div', 'dm-panel'); p2.style.flex = '1';
      p2.appendChild(el('div', 'dm-panel-title', '⌨️ 终端输出'));
      p2.appendChild(term);
      row.appendChild(p1); row.appendChild(p2);
      body.appendChild(row);
      body.appendChild(counter);
      body.appendChild(el('div', 'dm-legend', '<span class="lg"><i style="background:#fb7185"></i>仅供学习:只对自己的 App / 授权样本操作</span><span class="lg"><i style="background:#22d3ee"></i>修改内容会使原签名失效；后续行为取决于校验策略</span>'));
      tree.textContent = 'app.apk  (ZIP, PK\\x03\\x04)';
      counter.set('step', '0 / 8'); counter.set('stage', '待开始');
    }
  };

  /* ═══════════ 4. 源码 ↔ 字节码对照 ═══════════ */
})();
