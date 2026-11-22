/* Pure, deterministic teaching models. The lesson source and browser labs share these functions. */
(function () {
  'use strict';
  var models = {};
  models.boot = function simulate(settings) {
    if (typeof settings.rtos !== 'boolean' || typeof settings.interrupts !== 'boolean' || typeof settings.validImage !== 'boolean') throw Error('三个开关必须为 true 或 false。');
    const ticks = Number(settings.ticks);
    if (!Number.isInteger(ticks) || ticks < 1 || ticks > 6) throw Error('采样轮数须为 1～6 的整数。');
    const mode = settings.rtos ? 'RTOS' : 'bare-metal';
    let ramReady = false, outputRegister = 0, servicedEvents = 0, pendingEvent = false;
    const frames = [{at: 'let ramReady =', note: '处理器复位后从硬件规定的入口取指。本模型记录阶段，不模拟具体指令集或复位地址；入口不需要由操作系统创建。', state: {stage: '复位入口', mode, ramReady, outputRegister}, value: 0}];
    if (!settings.validImage) {
      frames.push({at: 'if (!settings.validImage)', note: '本模型的启动检查拒绝无效镜像，停在恢复阶段，不进入应用。镜像校验或恢复引导不是所有芯片天然自带的能力。', state: {stage: '镜像拒绝', mode, ramReady, outputRegister}, value: 0});
      return {frames, summary: {mode, booted: false, samples: 0, servicedEvents, pendingEvent, outputRegister, ramReady}};
    }
    ramReady = true;
    frames.push({at: 'ramReady = true;', note: '启动例程按目标平台准备栈、初始化需复制的数据区、清零约定的零初始化区，并配置必要硬件。不是把全部 RAM 清空，也不要求操作系统代劳。', state: {stage: '启动例程', mode, ramReady, outputRegister}, value: 1});
    frames.push({at: "const mode =", note: settings.rtos ? '应用初始化任务后启动内核调度，后续任务在调度器安排下运行。这里不实现真实 RTOS 的抢占和截止期分析。' : '进入应用主循环，由应用自行安排采样、计算和输出。没有进程管理器，CPU 依旧能够执行这些机器指令。', state: {stage: settings.rtos ? '任务调度' : '应用主循环', mode, ramReady, outputRegister}, value: 2});
    for (let tick = 1; tick <= ticks; tick++) {
      if (tick === 2) pendingEvent = true;
      if (settings.interrupts && pendingEvent) { servicedEvents++; pendingEvent = false; }
      frames.push({at: 'if (settings.interrupts', note: settings.interrupts && tick === 2 ? '第二轮注入一个外部事件。教学中断服务记录事件后返回，主流程继续；中断机制不依赖是否有操作系统。' : !settings.interrupts && pendingEvent ? '事件仍待处理，但本模型关闭了中断服务。主循环或任务仍能继续；关闭中断不等于 CPU 停止执行。' : '检查本轮事件；没有待服务的外部事件。真实系统也可以轮询设备状态，这里不另加轮询服务。', state: {stage: '事件检查', mode, tick, pendingEvent, servicedEvents, outputRegister}, value: outputRegister});
      const sensor = 20 + tick;
      frames.push({at: 'const sensor =', note: '从虚拟外设取得本轮测量。真实驱动通过寄存器、总线或接口读取外设；数值不是从屏幕里产生的。', state: {stage: '采样', mode, tick, sensor, outputRegister}, value: sensor});
      const decision = sensor >= 23;
      frames.push({at: 'const decision =', note: 'CPU 执行比较，得到逻辑结果。相同输入与规则，在本模型的裸机和 RTOS 路径上得到相同结果。', state: {stage: '计算', mode, tick, sensor, decision, outputRegister}, value: sensor});
      outputRegister = decision ? 1 : 0;
      frames.push({at: 'outputRegister = decision', note: '写入虚拟输出寄存器。真实芯片可将相应写操作交给外设，再通过驱动电路改变信号；不是 CPU 用代码直接提供机械能。', state: {stage: '外设输出', mode, tick, sensor, decision, outputRegister}, value: outputRegister});
    }
    return {frames, summary: {mode, booted: true, samples: ticks, servicedEvents, pendingEvent, outputRegister, ramReady}};
  };
  models.control = function simulate(settings) {
    const target = Number(settings.target), gain = Number(settings.gain), delay = Number(settings.delay);
    if (!Number.isFinite(target) || target < 18 || target > 30 || !Number.isFinite(gain) || gain < 0 || gain > 3 || !Number.isInteger(delay) || delay < 0 || delay > 3) throw Error('目标 18～30，增益 0～3，延迟为 0～3 个采样。');
    let temperature = 18;
    const history = [18], frames = [];
    for (let tick = 0; tick < 16; tick++) {
      const sensed = history[Math.max(0, history.length - 1 - delay)];
      const error = target - sensed;
      const power = Math.max(-4, Math.min(4, gain * error));
      temperature += 0.5 * power - 0.07 * (temperature - 18);
      history.push(temperature);
      frames.push({at: 'const error =', note: '读取的是延迟后的温度；误差乘增益，再限制执行器输出。环境散热也在改变温度。', state: {'采样': tick, '传感器读数': sensed.toFixed(2), '目标': target, '功率': power.toFixed(2), '实际温度': temperature.toFixed(2)}, value: temperature, reference: target});
    }
    return {frames, summary: {finalTemperature: Number(temperature.toFixed(2)), target, samples: 16}};
  };
  models.pacer = function simulate(settings) {
    if (typeof settings.confirmed !== 'boolean' || typeof settings.sensing !== 'boolean') throw Error('开关参数必须为 true 或 false。');
    const requested = Number(settings.interval);
    if (!Number.isInteger(requested) || requested < 1 || requested > 12) throw Error('请输入 1～12 个虚拟节拍。');
    const accepted = settings.confirmed === true && requested >= 3 && requested <= 8;
    const interval = accepted ? requested : 6;
    let lastEvent = 0, pulses = 0;
    const frames = [{at: 'const accepted =', note: accepted ? '模拟授权确认与参数检查通过，原子提交新间隔。' : '未确认或越过教学范围：拒绝修改，保留间隔 6。不是把参数默默截断。', state: {'请求间隔': requested, '已提交间隔': interval, '事务': accepted ? '提交' : '拒绝'}, value: 0, kind: 'commit'}];
    for (let tick = 1; tick <= 24; tick++) {
      const sensed = settings.sensing === true && [3, 9, 15, 21].includes(tick);
      let kind = 'wait';
      if (sensed) { lastEvent = tick; kind = 'sense'; }
      if (tick - lastEvent >= interval) { pulses++; lastEvent = tick; kind = 'pulse'; }
      frames.push({at: sensed ? 'if (sensed)' : 'if (tick - lastEvent', note: kind === 'pulse' ? '等待超时，模型输出一个虚拟脉冲并重置计时。' : kind === 'sense' ? '检测到自身事件，抑制本次起搏并重置等待。' : '尚未超时，继续等待；不是每次循环都刺激。', state: {'虚拟时刻': tick, '事件': kind, '距上次事件': tick - lastEvent, '累计脉冲': pulses}, value: kind === 'pulse' ? 1 : kind === 'sense' ? 0.6 : 0, kind});
    }
    return {frames, summary: {accepted, interval, pulses, unit: 'virtual ticks'}};
  };
  models.interlock = function simulate(settings) {
    if (typeof settings.protected !== 'boolean') throw Error('开关参数必须为 true 或 false。');
    const protectedMode = settings.protected === true;
    let desired = 'X', physical = 'X', validatedVersion = -1, version = 0;
    const frames = [];
    const events = ['edit', 'validate', 'edit-again', 'start', 'hardware-ready', 'validate', 'start'];
    let blocked = 0, unsafeStarts = 0;
    for (const event of events) {
      if (event === 'edit' || event === 'edit-again') { desired = event === 'edit' ? 'X' : 'E'; version++; }
      if (event === 'validate') validatedVersion = version;
      if (event === 'hardware-ready') physical = desired;
      if (event === 'start') {
        const allowed = !protectedMode || (validatedVersion === version && physical === desired);
        if (!allowed) blocked++;
        if (allowed && physical !== desired) unsafeStarts++;
        frames.push({at: 'const allowed =', note: allowed ? (physical === desired ? '配置、验证与硬件状态一致，教学模型允许启动。' : '旧验证被错误复用，逻辑认为已就绪，实际装置仍是旧模式。') : '版本或硬件状态不匹配，互锁阻止启动。', state: {event, desired, physical, version, validatedVersion, allowed}, value: allowed ? (physical === desired ? 1 : -1) : 0});
      } else frames.push({at: event === 'validate' ? "if (event === 'validate')" : event === 'hardware-ready' ? "if (event === 'hardware-ready')" : "if (event === 'edit'", note: '按照确定的交错顺序推进；这能复现条件，不靠随机等待碰运气。', state: {event, desired, physical, version, validatedVersion}, value: 0});
    }
    return {frames, summary: {protectedMode, blocked, unsafeStarts}};
  };
  models.calendar = function simulate(settings) {
    const start = Number(settings.start), end = Number(settings.end), bits = Number(settings.bits);
    if (!Number.isInteger(start) || !Number.isInteger(end) || start < 1900 || end > 2199 || end < start || end - start > 110 || ![8, 32].includes(bits)) throw Error('年份须在 1900～2199、跨度 0～110；位宽选 8 或 32。');
    const yyStart = start % 100, yyEnd = end % 100;
    const naive = yyEnd - yyStart, correct = end - start;
    const limit = 2 ** (bits - 1) - 1;
    const wrapped = (limit + 1) - 2 ** bits;
    const frames = [
      {at: 'const yyStart =', note: '取模只保存末两位。1999 与 2099 都写成 99，世纪信息已丢失。', state: {start, end, yyStart, yyEnd}, value: yyStart, reference: yyEnd},
      {at: 'const naive =', note: '直接相减可能变成负数；自动加 100 只是假定了一种时间范围，不是普遍修复。', state: {naive, correct}, value: naive, reference: correct},
      {at: 'const limit =', note: '有符号整数只有一半编码对应非负数，最大值为 2^(位宽−1)−1。', state: {bits, limit}, value: limit},
      {at: 'const wrapped =', note: '这里显式模拟补码回绕；JavaScript 自己并没有把普通 Number 自动变成该位宽整数。', state: {nextMathematical: limit + 1, simulatedSigned: wrapped}, value: wrapped}
    ];
    return {frames, summary: {naive, correct, bits, limit, wrapped}};
  };
  models.overflow = function simulate(settings) {
    if (typeof settings.sameBackup !== 'boolean') throw Error('开关参数必须为 true 或 false。');
    const value = Number(settings.value);
    if (!Number.isFinite(value) || Math.abs(value) > 1000000) throw Error('输入有限数，绝对值不超过 1,000,000。');
    const integer = Math.trunc(value);
    const inRange = integer >= -32768 && integer <= 32767;
    const backupUsesSameCode = settings.sameBackup === true;
    const frames = [
      {at: 'const integer =', note: '本例选择向零截断，再检查整数目标范围。这是教学转换规则，不是声称 Ada 原事故采用此舍入规则。', state: {value, integer}, value: integer},
      {at: 'const inRange =', note: '16 位有符号整数的范围固定，换一个更快的 CPU 不会扩大这个类型。', state: {minimum: -32768, maximum: 32767, inRange}, value: integer},
      {at: 'const backupUsesSameCode =', note: inRange ? '本次输入可表示；不能据此证明所有轨迹输入都合法。' : backupUsesSameCode ? '相同输入命中相同设计缺陷，两个副本都失败；冗余不等于独立。' : '示意：独立校验通道报告无效，阻止把诊断数据当作正常姿态。', state: {'主通道': inRange ? '有效' : '转换拒绝', '备用通道': inRange ? '有效' : backupUsesSameCode ? '同因失败' : '独立拒绝/隔离'}, value: inRange ? 1 : -1}
    ];
    return {frames, summary: {integer, inRange, commonModeFailure: !inRange && backupUsesSameCode}};
  };
  models.units = function simulate(settings) {
    const impulseLbfS = Number(settings.impulse), massKg = Number(settings.mass), coastSeconds = Number(settings.coast);
    if (![impulseLbfS, massKg, coastSeconds].every(Number.isFinite) || impulseLbfS < 0 || impulseLbfS > 100 || massKg < 100 || massKg > 2000 || coastSeconds < 1 || coastSeconds > 100000) throw Error('冲量 0～100 lbf·s，质量 100～2000 kg，漂移时间 1～100000 s。');
    const impulseNs = impulseLbfS * 4.4482216152605;
    const trueDeltaV = impulseNs / massKg;
    const mistakenDeltaV = impulseLbfS / massKg;
    const frames = [];
    for (let step = 0; step <= 10; step++) {
      const time = coastSeconds * step / 10;
      const truePosition = trueDeltaV * time, predictedPosition = mistakenDeltaV * time;
      frames.push({at: step === 0 ? 'const impulseNs =' : 'const truePosition =', note: '只模拟一次冲量之后的一维匀速漂移：x=Δv·t。单位错误使预测与实际分开；没有求解火星引力或真实轨道。', state: {'时间/s': time, '真实Δv/(m/s)': trueDeltaV.toFixed(6), '错误Δv/(m/s)': mistakenDeltaV.toFixed(6), '真实位置/m': truePosition.toFixed(2), '预测位置/m': predictedPosition.toFixed(2)}, value: truePosition, reference: predictedPosition});
    }
    return {frames, summary: {impulseNs, trueDeltaV, mistakenDeltaV, positionErrorMetres: (trueDeltaV - mistakenDeltaV) * coastSeconds}};
  };
  models.clock = function simulate(settings) {
    const hours = Number(settings.hours), fractionBits = Number(settings.fractionBits);
    if (!Number.isFinite(hours) || hours < 0 || hours > 200 || !Number.isInteger(fractionBits) || fractionBits < 8 || fractionBits > 32) throw Error('时长 0～200 小时，小数位数 8～32。');
    const storedTenth = Math.floor(0.1 * 2 ** fractionBits) / 2 ** fractionBits;
    const errorPerTick = 0.1 - storedTenth;
    const frames = [];
    for (let step = 0; step <= 10; step++) {
      const elapsed = hours * 3600 * step / 10;
      const ticks = Math.round(elapsed * 10);
      const drift = ticks * errorPerTick;
      frames.push({at: step === 0 ? 'const storedTenth =' : 'const drift =', note: '0.1 的二进制展开无限；本例使用截断的定点近似。连续计时越久，系统性误差越大。', state: {'运行小时': elapsed / 3600, fractionBits, storedTenth, '每滴答误差/s': errorPerTick, '累计误差/s': drift.toFixed(9)}, value: drift});
    }
    return {frames, summary: {storedTenth, errorPerTick, driftSeconds: frames[frames.length - 1].value, model: 'fixed point truncation'}};
  };
  models.scheduler = function simulate(settings) {
    if (typeof settings.priority !== 'boolean') throw Error('开关参数必须为 true 或 false。');
    const extra = Number(settings.extra), priority = settings.priority === true;
    if (!Number.isInteger(extra) || extra < 0 || extra > 10) throw Error('额外工作量为 0～10。');
    const tasks = [{name: '显示', work: 2, priority: 3}, {name: '额外事件', work: extra, priority: 2}, {name: '制导', work: 3, priority: 0}];
    const ordered = priority ? tasks.slice().sort((a, b) => a.priority - b.priority) : tasks;
    let used = 0, guidance = false;
    const frames = [];
    for (const task of ordered) {
      const admitted = used + task.work <= 6;
      if (admitted) { used += task.work; if (task.name === '制导') guidance = true; }
      frames.push({at: admitted ? 'if (admitted)' : 'const admitted =', note: admitted ? '本轮预算允许执行该完整任务。' : '预算不足，显式丢弃该次工作；真实实时系统还需处理抢占、截止期和不可丢任务。', state: {'任务': task.name, '所需预算': task.work, '已用预算': used, '剩余预算': 6 - used, '本次执行': admitted}, value: used, reference: 6});
    }
    return {frames, summary: {priority, guidanceExecuted: guidance, used, budget: 6}};
  };
  models.link = function simulate(settings) {
    if (typeof settings.deduplicate !== 'boolean') throw Error('开关参数必须为 true 或 false。');
    const distanceKm = Number(settings.distance), waitMinutes = Number(settings.wait), deduplicate = settings.deduplicate === true;
    if (![distanceKm, waitMinutes].every(Number.isFinite) || distanceKm < 1000000 || distanceKm > 400000000 || waitMinutes < 0.1 || waitMinutes > 60) throw Error('距离 100万～4亿 km，重试等待 0.1～60 分钟。');
    const oneWay = distanceKm / 299792.458, roundTrip = 2 * oneWay;
    const retrySent = waitMinutes * 60 < roundTrip;
    const arrivals = retrySent ? [oneWay, oneWay + waitMinutes * 60] : [oneWay];
    const seen = new Set(), frames = [];
    let executions = 0;
    for (const arrival of arrivals) {
      const commandId = 'TURN-001';
      const execute = !deduplicate || !seen.has(commandId);
      if (execute) { executions++; seen.add(commandId); }
      frames.push({at: 'const execute =', note: execute ? '命令到达探测器，执行一次并记录命令号。' : '重试的是同一命令号，返回原结果，避免重复改变状态。', state: {'到达时刻/s': arrival.toFixed(2), commandId, '是否执行': execute, '累计执行': executions, '往返光时/s': roundTrip.toFixed(2)}, value: arrival, reference: roundTrip});
    }
    frames.push({at: 'const retrySent =', note: '超时表示尚未收到确认，不证明原命令没有执行。本模型不含丢包与排队，重试策略在真实系统中更复杂。', state: {retrySent, '首次确认返回/s': roundTrip.toFixed(2), '重试等待/s': waitMinutes * 60, executions}, value: roundTrip, reference: roundTrip});
    return {frames, summary: {oneWaySeconds: oneWay, roundTripSeconds: roundTrip, retrySent, executions}};
  };
  models.radiation = function simulate(settings) {
    if (typeof settings.protected !== 'boolean') throw Error('开关参数必须为 true 或 false。');
    const flips = Number(settings.flips), protectedMode = settings.protected === true;
    if (![0, 1, 2].includes(flips)) throw Error('请选择 0、1、2 位翻转。');
    const original = [1, 0, 1, 1];
    // Hamming(7,4), parity at positions 1,2,4. Even parity.
    const bits = [0, 0, 0, original[0], 0, original[1], original[2], original[3]];
    for (const p of [1, 2, 4]) for (let i = 1; i <= 7; i++) if ((i & p) && i !== p) bits[p] ^= bits[i];
    const frames = [{at: 'const bits =', note: '4 个数据位加 3 个校验位。这里不是复制三份数据。', state: {'数据': original.join(''), '编码': bits.slice(1).join('')}, value: 0}];
    for (let i = 0; i < flips; i++) bits[i === 0 ? 3 : 5] ^= 1;
    const received = bits.slice(1).join('');
    let syndrome = 0;
    for (const p of [1, 2, 4]) { let parity = 0; for (let i = 1; i <= 7; i++) if (i & p) parity ^= bits[i]; if (parity) syndrome += p; }
    frames.push({at: 'let syndrome =', note: '综合症把违反的校验方程组合成一个位置。只有单比特错误时，它才可靠指向错误位。', state: {received, syndrome, flips}, value: syndrome});
    if (protectedMode && syndrome !== 0) bits[syndrome] ^= 1;
    const decoded = [bits[3], bits[5], bits[6], bits[7]].join('');
    frames.push({at: 'if (protectedMode', note: flips <= 1 ? '对 0/1 位错误，本例能正确恢复；关闭纠错可观察受损结果。' : '两位翻转可能被误纠正。普通 Hamming(7,4) 不具备 SECDED 的双错检测保证。', state: {decoded, expected: original.join(''), matches: decoded === original.join('')}, value: decoded === original.join('') ? 1 : -1});
    return {frames, summary: {received, syndrome, decoded, matches: decoded === original.join(''), guaranteed: flips <= 1}};
  };
  models.transit = function simulate(settings) {
    const ratio = Number(settings.ratio), noise = Number(settings.noise), baseRate = Number(settings.baseRate);
    if (![ratio, noise, baseRate].every(Number.isFinite) || ratio < 0.01 || ratio > 0.2 || noise < 0 || noise > 0.02 || baseRate <= 0 || baseRate >= 1) throw Error('半径比 0.01～0.2，噪声 0～0.02，基础率大于 0 小于 1。');
    const depth = ratio * ratio, frames = [];
    const flux = [];
    for (let t = 0; t < 48; t++) {
      const inTransit = t % 16 >= 6 && t % 16 <= 9;
      const observed = 1 - (inTransit ? depth : 0) + noise * Math.sin(t * 2.399);
      flux.push(observed);
      frames.push({at: 'const observed =', note: '固定正弦噪声使结果可复现；周期性下降提示候选，还要排除食双星、恒星活动和仪器误差。', state: {'样本': t, inTransit, observed: observed.toFixed(6), '理想深度': depth}, value: observed, reference: 1});
    }
    // Illustrative classifier rates, not a probability model of extraterrestrial life.
    const posterior = 0.9 * baseRate / (0.9 * baseRate + 0.01 * (1 - baseRate));
    return {frames, summary: {depth, samples: flux.length, illustrativePosterior: posterior, conclusion: 'candidate, not life detection'}};
  };
  models.spectrum = function simulate(settings) {
    if (typeof settings.terrestrial !== 'boolean') throw Error('开关参数必须为 true 或 false。');
    const bin = Number(settings.bin), noise = Number(settings.noise), terrestrial = settings.terrestrial === true;
    if (!Number.isInteger(bin) || bin < 1 || bin > 14 || !Number.isFinite(noise) || noise < 0 || noise > 2) throw Error('频率格点 1～14，干扰幅度 0～2。');
    const count = 32, signal = [];
    for (let n = 0; n < count; n++) signal.push(Math.sin(2 * Math.PI * bin * n / count) + noise * Math.sin(2 * Math.PI * 11 * n / count + 0.4));
    const frames = [], powers = [];
    for (let k = 0; k < count / 2; k++) {
      let real = 0, imaginary = 0;
      for (let n = 0; n < count; n++) { real += signal[n] * Math.cos(2 * Math.PI * k * n / count); imaginary -= signal[n] * Math.sin(2 * Math.PI * k * n / count); }
      const power = (real * real + imaginary * imaginary) / (count * count);
      powers.push(power);
      frames.push({at: 'const power =', note: '把时域信号投影到一组频率。窄带峰既可能是目标，也可能是人造干扰；本例两者可具有相同的数学波形。', state: {'频率格点': k, real: real.toFixed(3), imaginary: imaginary.toFixed(3), power: power.toFixed(6)}, value: power});
    }
    const peak = powers.indexOf(Math.max(...powers));
    return {frames, summary: {peak, syntheticOrigin: terrestrial ? 'terrestrial test transmitter' : 'unspecified synthetic source', evidenceOfAliens: false}};
  };
  models.archive = function simulate(settings) {
    if (typeof settings.specification !== 'boolean' || typeof settings.flipped !== 'boolean') throw Error('开关参数必须为 true 或 false。');
    const specification = settings.specification === true, flipped = settings.flipped === true;
    // Tiny finite teaching VM: 1=ADD operand, 2=OUTPUT, 0=HALT.
    const program = [1, 2, 1, 3, 2, 0];
    if (flipped) program[3] ^= 1;
    const frames = [], outputs = [];
    let accumulator = 0, pc = 0;
    if (!specification) return {frames: [{at: 'if (!specification)', note: '字节仍在，但本例接收者没有指令表。不能从“我们解释不出”推出宇宙中任何文明都不可能解释。', state: {bytes: program.join(' '), readable: false}, value: 0}], summary: {bytesSurvive: true, interpretableInModel: false}};
    while (pc < program.length) {
      const opcode = program[pc++];
      if (opcode === 0) break;
      if (opcode === 1) accumulator += program[pc++];
      else if (opcode === 2) outputs.push(accumulator);
      else throw Error('未知指令，拒绝猜测执行。');
      frames.push({at: opcode === 1 ? 'if (opcode === 1)' : 'else if (opcode === 2)', note: '解码器按公开指令表恢复操作。源代码、解释器规格与测试向量共同保存，比只留一串字节更容易恢复。', state: {pc, opcode, accumulator, outputs: outputs.join(',')}, value: accumulator});
    }
    return {frames, summary: {bytesSurvive: true, interpretableInModel: true, outputs, expected: 5, correct: outputs[0] === 5}};
  };
  models.mission = function simulate(settings) {
    if (typeof settings.validUnit !== 'boolean' || typeof settings.freshness !== 'boolean') throw Error('开关参数必须为 true 或 false。');
    const validUnit = settings.validUnit === true, checkFreshness = settings.freshness === true;
    const maxAge = Number(settings.maxAge);
    if (!Number.isFinite(maxAge) || maxAge < 1 || maxAge > 10) throw Error('新鲜度上限为 1～10 个虚拟时间单位。');
    const records = [{time: 0, age: 0, value: 6, unit: 'model'}, {time: 1, age: 0, value: 5, unit: 'model'}, {time: 2, age: 8, value: 9, unit: 'model'}, {time: 3, age: 0, value: 4, unit: validUnit ? 'model' : 'unknown'}];
    const frames = [];
    let unsafe = 0, holds = 0;
    for (const record of records) {
      const usable = record.unit === 'model' && (!checkFreshness || record.age <= maxAge);
      const action = !usable ? 'HOLD' : record.value > 7 ? 'MOVE' : 'WAIT';
      if (action === 'MOVE' && record.age > maxAge) unsafe++;
      if (action === 'HOLD') holds++;
      frames.push({at: 'const usable =', note: action === 'HOLD' ? '先验证单位和时间戳；数据无效时选择任务定义的保持策略，不伪造一个新测量。' : '本例只是探测器教学状态机，阈值不是飞行或医疗控制参数。', state: {...record, usable, action}, value: record.value, reference: 7});
    }
    return {frames, summary: {unsafeStaleMoves: unsafe, holds, validUnit, checkFreshness}};
  };
  window.HUB_WORLD_MODELS = models;
})();
