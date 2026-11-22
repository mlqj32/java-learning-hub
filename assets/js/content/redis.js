/* ═══════════════════════════════════════════════════════════
   模块:Redis 缓存中间件(示范模块 · 9 章)
   ═══════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  window.CONTENT = window.CONTENT || {};

  window.CONTENT.redis = {
    id: 'redis',
    title: 'Redis 缓存中间件',
    en: 'REDIS IN ACTION',
    icon: 'bolt',
    color: '#fb7185',
    tagline: '10 万 QPS 背后的数据结构与工程哲学',
    description: '从缓存是什么讲起:先看数据库为什么会先倒下,再到 SDS 与跳表的底层结构、缓存三大问题、分布式锁、哨兵与集群 —— 你简历里的令牌缓存与聊天记录缓存,都会在这里找到理论根基与升级话术。',
    minutes: '≈ 18 小时',
    chapters: [
      /* ─────────────────────────────────────────── */
      {
        id: 'ch00',
        title: '缓存入门:数据库为什么会先倒下',
        minutes: 30,
        points: ['缓存命中率', '本地 vs 分布式', 'redis-cli 上手', '五种数据类型'],
        content: `
> [!info] 本章导读 · 先讲个故事
> 凌晨的电商大促,首页每秒涌进 1 万次请求。每份商品数据都去 MySQL 查一次,而你的数据库压测下来只能扛 2000 QPS —— 剩下 8000 个请求排队等连接,数据库 CPU 打满,页面白屏,订单归零。
> 救场的办法朴素得像便利店:把最常卖的东西从后仓搬到收银台边。顾客要什么,伸手就拿到,不必每次都跑去仓库翻箱。缓存干的正是这件事:把热点数据从磁盘搬到内存。
> - 读完本章你将能:说清缓存为什么能救数据库,并亲手算出命中率
> - 在自己的电脑上用 Docker 起一个 Redis,用 redis-cli 跑通增删查改
> - 面对业务场景能判断该用本地缓存还是 Redis,并用五种数据类型各写一条命令

> [!tip] 日常电脑现场 · 后退键为什么秒开
> 在浏览器里点开一个商品页,再按后退,页面几乎瞬间回来,地址栏都没怎么转圈。手机相册往上滑,缩略图早就排得整整齐齐,并不是每张都现读原图。这就是把远处的仓库换成手边的货架:常用的东西提前摆好,用的时候伸手就来。

## 缓存是什么:把"慢查询"换成"快读取"

先算一笔账。假设商品详情查询走 MySQL 需要 5ms,同一份数据放内存只要 0.1ms。首页每秒 1 万个请求,全打数据库需要 50 秒的 CPU 时间,一秒内根本做不完;放缓存里只需 1 秒,轻松扛住。缓存的本质只有一句话:**把计算结果或远程数据暂存在更快的地方,下次先看这里**。先记住三个词:

- **命中(Hit)**:请求的数据在缓存里,直接返回,这是快路径。
- **未命中(Miss)**:缓存里没有,只能回源去数据库查,再把结果写回缓存。
- **命中率(Hit Rate)**:命中次数除以总请求次数,电商详情页做到 95% 以上算健康。

> [!info] 为什么内存能快几个数量级
> 缓存命中之所以快,不是算法神奇,而是**存储介质不同**。CPU 访问一次内存是纳秒级,访问一次机械硬盘是毫秒级,两者差了数十万倍。把数据搬到离 CPU 更近的地方,是最原始也最有效的加速手段。

| 访问层次 | 典型耗时 | 量级感受 | 类比 |
| --- | --- | --- | --- |
| 内存 RAM | 约 100ns | 纳秒 | 桌上的资料 |
| SSD 随机读 | 约 0.1ms | 毫秒 | 去隔壁房间拿 |
| 机械磁盘随机读 | 约 10ms | 毫秒 | 去楼下仓库找 |

## 本地缓存 vs 分布式缓存

最直接的做法是在 JVM 里放一个 Map:

\`\`\`java
private static final Map<Long, Product> CACHE = new ConcurrentHashMap<>();

public Product getProduct(long id) {
    Product p = CACHE.get(id);              // 先查内存
    if (p != null) return p;                // 命中,直接返回
    p = productMapper.selectById(id);       // 未命中,回源数据库
    CACHE.put(id, p);                       // 写回缓存
    return p;
}
\`\`\`

几行代码就有效,但立刻暴露三个问题:

1. **容量有限**:Map 会无限增长,把堆撑爆,要靠 Caffeine 这类库做上限与淘汰。
2. **多实例不一致**:部署 3 台机器就有 3 份各自的 Map。A 机器更新了价格,B 机器还在返回旧价格。
3. **重启即丢**:进程一重启缓存全部清零,流量瞬间全压回数据库。

于是有了**分布式缓存**:把缓存从每台机器搬出来,集中放到一个独立服务(如 Redis),所有实例共用同一份。

| 维度 | 本地缓存(JVM 内) | 分布式缓存(Redis) |
| --- | --- | --- |
| 访问速度 | 纳秒级,最快 | 约 0.1 到 1ms,走网络 |
| 数据一致性 | 各实例各一份,易不一致 | 全局一份,天然共享 |
| 容量 | 受单机堆内存限制 | 可独立扩容,支持集群 |

**结论**:库存、登录令牌这类要求全局一致的用 Redis;极热但允许短暂陈旧的数据,可以本地加 Redis 两级缓存。后续章节会展开缓存一致性,现在先记住这个选择标准。

## 第一次用 Redis:装好、连上、跑通

Redis 是一个独立的服务端程序,先启动它,再用客户端连接。最省事的方式是 Docker:

\`\`\`shell
# 一条命令启动 Redis 7,映射默认端口 6379
docker run -d --name redis-demo -p 6379:6379 redis:7
# 本地安装:Linux 用 apt install redis,Windows 推荐 WSL 或 Memurai
\`\`\`

连上它:

\`\`\`shell
# -h 主机,-p 端口;本机可省略
redis-cli -h 127.0.0.1 -p 6379
\`\`\`

\`\`\`output
127.0.0.1:6379> PING
PONG
\`\`\`

看到 PONG,说明服务通了。现在跑最基础的增删查改:

\`\`\`shell
SET user:1:name "zhen"        # 写入一个字符串
GET user:1:name               # 读取
EXISTS user:1:name            # 是否存在,1 表示存在
EXPIRE user:1:name 60         # 设置 60 秒后过期
DEL user:1:name               # 删除
GET user:1:name               # 再读一次
\`\`\`

\`\`\`output
OK
"zhen"
(integer) 1
(integer) 1
(integer) 1
(nil)
\`\`\`

## 五种数据类型初体验

Redis 的 key 都是字符串,value 有五种常用结构。先建立直觉,底层编码留给下一章。

| 类型 | 一条典型命令 | 存什么 | 一句话场景 |
| --- | --- | --- | --- |
| String | SET product:1 "键盘" | 字符串、数字、JSON | 缓存商品对象 |
| List | LPUSH queue:order 1001 | 有序可重复列表 | 简单任务队列 |
| Hash | HSET cart:1 p100 2 | 字段与值 | 购物车,商品 ID 对数量 |
| Set | SADD tag:java u1 u2 | 无序不重复集合 | 标签、共同好友 |
| ZSet | ZADD rank 98 u1 | 带分数的有序集合 | 排行榜 |

\`\`\`shell
# String:缓存一个对象(实际项目通常存 JSON)
SET product:1 "机械键盘 299"
GET product:1
# List:从左边塞入任务,从右边取出,先进先出
LPUSH queue:order 1001 1002
RPOP queue:order
# Hash:购物车里商品 ID 对数量
HSET cart:1 p100 2 p200 1
HGETALL cart:1
# Set:给用户打标签,自动去重
SADD tag:java u1 u2 u3
SMEMBERS tag:java
# ZSet:按分数排序,天然适合排行榜
ZADD rank 98 u1 87 u2 95 u3
ZREVRANGE rank 0 1 WITHSCORES
\`\`\`

\`\`\`output
SET product:1        => OK
GET product:1        => "机械键盘 299"
LPUSH queue:order    => (integer) 2
RPOP queue:order     => "1001"
HSET cart:1          => (integer) 2
HGETALL cart:1       => p100=2, p200=1
SADD tag:java        => (integer) 3
SMEMBERS tag:java    => u1, u2, u3
ZADD rank            => (integer) 3
ZREVRANGE rank 0 1   => u1=98, u3=95
\`\`\`

- String 最百搭,缓存对象时序列化成 JSON 最省心。

> [!warn] 五类结构别硬套关系型思维
> Redis 没有表、没有 JOIN、没有外键。设计 key 时要想清楚以后怎么读:整块读用 String,按字段读用 Hash,要排序分页用 ZSet。选错结构,后面只能推倒重来。

## Redis 在你项目里的位置

把 Redis 只当缓存是新手最常见的窄化。它至少还有五类用法:

| 场景 | 用什么结构 | 关键命令或思路 | 解决什么问题 |
| --- | --- | --- | --- |
| 热点数据缓存 | String 或 Hash | SET 加 EXPIRE,Cache Aside | 降低数据库压力 |
| 计数器 | String | INCR 与 DECR,原子自增 | 点赞数、库存扣减 |
| 分布式锁 | String | SET key value NX PX 30000 | 多实例互斥 |
| 分布式 Session | String 或 Hash | token 为 key,用户信息为 value | 多台机器共享登录态 |
| 排行榜 | ZSet | ZADD 与 ZREVRANGE | 实时榜单、热度排序 |

呼应你简历里的令牌缓存:登录成功后写 ==token:xxxx 对应 userId== 并设置过期时间,网关每次校验直接读 Redis;登出时 DEL 掉这个 key,所有机器立即失效。这其实就是分布式 Session 的一种手写实现,后续章节会把这个方案讲透。

> [!interview] 一分钟说清"为什么要加缓存"
> 面试官问"为什么在数据库前加 Redis",不要只答"快"。完整链条是:**数据库受磁盘 IO 与连接数限制,单机 QPS 有限;缓存把热数据放到内存,用少量内存换掉绝大部分数据库访问;命中率越高,数据库越安全**。再补一句"缓存会引入一致性、穿透、雪崩等新问题",立刻显得你懂工程权衡。

## 本章小结

- 缓存的本质是把慢查询换成快读取,核心指标是命中率。
- 内存与磁盘差几个数量级,这是缓存有效的物理基础。
- 本地缓存快但多实例不一致;分布式缓存共享但有网络开销,按一致性要求选。
- Redis 用 key-value 存数据,基础命令是 SET、GET、DEL、EXISTS、EXPIRE。
- 五种结构各有主场:String 缓存、List 队列、Hash 对象、Set 去重、ZSet 排序。

## 面试速记

- 缓存三指标:命中率、未命中回源成本、数据一致性要求。
- 本地缓存与分布式缓存,从一致性、容量、可用性三个维度对比。
- Redis 默认端口 6379;SET 成功返回 OK,GET 不存在的 key 返回 nil。
- 五种类型一句话:String 缓存对象,List 做队列,Hash 存字段,ZSet 排行榜,Set 去重。
- 加缓存的收益是保护数据库,代价是引入一致性复杂度,答题要成对出现。
`
      },
      /* ─────────────────────────────────────────── */
      {
        id: 'ch01',
        title: '五大核心数据类型与底层编码',
        minutes: 35,
        points: ['SDS', '跳表', '编码转换', '应用场景'],
        content: `
> [!interview] 面试开场定位
> "Redis 是基于内存的单线程 KV 数据库,通过 IO 多路复用处理并发,快的原因有三条:**纯内存操作、高效数据结构、单线程无锁竞争**。"这句开场能撑起后面 20 分钟的追问。本章先讲清"高效数据结构"这一条。

> [!info] 本章导读 · 为什么一个简单的 SET,能问出 40 分钟?
> 你以为 Redis 就是个大 Map,可面试官会从一次写入一路追问到内存分配、字符串长度与编码转换。就像便利店的货架,看着都是摆商品,背后却是完全不同的陈列逻辑。本章把五种数据类型从"会用"讲到"为什么这样设计",是后面所有章节的地基。
> - 读完本章你将能:手写 SDS 的结构,说出它比 C 字符串强在哪
> - 区分 String、List、Hash、Set、ZSet 各自适合存什么,并给出真实场景
> - 解释一个 key 在什么条件下会从 listpack 转换成 hashtable 或 skiplist

> [!tip] 日常电脑现场 · 一个微信五种结构
> 微信通讯录按字母分组,朋友圈点赞同一个人点两次也只算一次,步数排行榜按名次排,购物车按你加入的顺序结算。一个聊天软件里,几乎把字符串、哈希、集合、有序集合和列表全用了一遍。你在手机上随手一划,后台已经轮流用上了这五种结构。

## 为什么 Redis 快到能扛 10 万 QPS

四个原因按重要性排序:

- **纯内存操作**:读内存约 100ns,读 SSD 约 0.1ms,差 1000 倍。这是根本前提。
- **高效数据结构**:不是简单的哈希表,而是 SDS、跳表、listpack、quicklist 等专门为内存设计的结构。
- **单线程避免锁与上下文切换**:命令执行不存在并发冲突,也没有线程切换的纳秒级开销。注意:**单线程指的是命令执行线程**,6.0 之后网络读写可以是多线程。
- **IO 多路复用(epoll)**:一个线程监听成百上千个连接,谁就绪处理谁,详见第 3 章。

先看一组真机数据,建立数量级概念:

\`\`\`shell
# 本机 benchmark:GET/SET 各 10 万次,所有命令并发执行
redis-benchmark -t set,get -n 100000 -q
\`\`\`

\`\`\`output
SET: 118764.84 requests per second
GET: 124069.48 requests per second
\`\`\`

> [!tip] 用 object encoding 看穿一切
> 面试时说出"数据类型"和"底层编码"是两个概念,并用 ==object encoding key== 实操过,是强加分项。

## String:SDS 动态字符串

Redis 从不直接用 C 字符串,而是自己实现了 **SDS(Simple Dynamic String)**:

\`\`\`c
struct sdshdr {
    int len;      // 已使用长度:O(1) 拿到字符串长度
    int free;     // 剩余空间:记录剩余可用字节数
    char buf[];   // 字节数组,保存实际数据
}
\`\`\`

对比 C 字符串,SDS 的四个优势:

| 对比点 | C 字符串 | SDS |
| --- | --- | --- |
| 获取长度 | strlen 遍历 O(n) | 读 len 字段 O(1) |
| 缓冲区溢出 | 容易溢出 | 自动检查 free 空间并扩容 |
| 修改内存次数 | 每次修改必然重分配 | 空间预分配 + 惰性释放 |
| 二进制安全 | 以 \\0 判定结尾,不能存图片 | 按 len 读取,可存任意字节 |

**空间预分配**:修改后长度小于 1MB 时,新空间 = 2 倍实际长度;超过 1MB 时,每次多分配 1MB。这样连续追加 N 次 SDS 最多重分配 log(N) 次。

String 的三个典型应用:

\`\`\`shell
# 1. 缓存对象(序列化 JSON)
SET user:1001 '{"id":1001,"name":"星薇Star","vip":true}'
# 2. 计数器(单线程天然保证原子性,不需要 CAS)
INCR article:2001:views
# 3. 分布式锁的地基
SET lock:order:1001 "uuid-1" NX PX 30000
\`\`\`

\`\`\`output
OK
(integer) 1
OK
\`\`\`

> [!pitfall] 大 Key 陷阱
> 一个 String 超过 **10KB** 就算大 key(如序列化的超大对象)。大 key 删除会阻塞主线程,应该用 ==UNLINK==(异步删除)代替 DEL。

## List:quicklist + listpack

演进路线:**Redis 3.2 之前**(ziplist 或 linkedlist 二选一)→ **3.2+**(quicklist)→ **7.0**(quicklist 内部节点从 ziplist 换成 listpack)。

- ziplist(压缩列表):一块连续内存,省指针、省空间,但插入删除要连锁更新(prevlen 字段可能引发级联扩容,极端时 O(n²))。
- linkedlist:双向链表,插入删除快,但每个节点都有 prev/next 两个指针,内存开销大,且内存不连续、缓存不友好。
- **quicklist = ziplist/listpack 组成的双向链表**:兼顾两者 —— 节点间用指针串联,节点内是紧凑数组。每个 listpack 默认最多存 512 个元素或 64KB。

\`\`\`shell
# 消息队列场景:左进右出
LPUSH mq:order "msg-1001"
LPUSH mq:order "msg-1002"
RPOP mq:order
# 阻塞版:队列空了就等待,避免轮询
BRPOP mq:order 5
\`\`\`

\`\`\`output
"msg-1002"
1) "mq:order"
2) "msg-1001"
(18.42s)   # 阻塞等待 18 秒后取到新消息
\`\`\`

## Hash:listpack 与 hashtable 的自动转换

Hash 存"字段-值"对。底层两种编码,满足条件时自动转换:

| 编码 | 条件(7.0) | 特点 |
| --- | --- | --- |
| listpack | 字段数 ≤ 128 且所有值 ≤ 64 字节 | 连续内存,省空间,查找 O(n) 但 n 小所以更快 |
| hashtable | 超过任一阈值 | 标准 2 张哈希表渐进式 rehash,查找 O(1) |

配置项:==hash-max-listpack-entries 128== 与 ==hash-max-listpack-value 64==。

Hash vs String-JSON 存对象的选型:

| 维度 | String(JSON) | Hash |
| --- | --- | --- |
| 读整对象 | 快,一次取出 | 需 HGETALL |
| 改单个字段 | 读-改-写整个串 | ==HSET== 直接改,O(1) |
| 过期控制 | 精确到整个 key | 只能到整个 key(字段级不支持过期) |
| 内存 | 有 JSON 语法开销 | listpack 编码时更省 |

**选型口诀:整体读写用 String,频繁改单字段用 Hash,需要字段级过期选 String。**

## Set:intset 与 hashtable

- 元素全是整数且个数 ≤ 512:**intset**(有序整数数组,甚至比 hashtable 省一个数量级内存)。
- 否则:**hashtable**(value 全为 NULL 的字典)。

核心价值是**集合运算**:共同好友、共同关注、抽奖去重。

\`\`\`shell
SADD user:1:follow "A" "B" "C"
SADD user:2:follow "B" "C" "D"
SINTER user:1:follow user:2:follow     # 共同关注
SDIFF user:1:follow user:2:follow      # 我关注了他没关注
SRANDMEMBER lottery:1001 3             # 抽奖:随机取3个(不重复)
\`\`\`

\`\`\`output
1) "B"
2) "C"
1) "A"
\`\`\`

## ZSet:跳表(SkipList)—— 面试最爱

ZSet 有序集合,底层是 **listpack 或 skiplist + dict 的组合**:

- dict(字典):member → score 的映射,保证 ZSCORE 是 O(1)。
- skiplist:按 score 排序,保证范围查询、排名高效。

**跳表结构**:多层链表,每层节点数约为下层的 1/4(p=0.25),查找时从最高层逐层"跨越"。

\`\`\`text
L3:  head ------------------------> 56 -----------------> nil
L2:  head ----------> 23 ---------> 56 ---------> 89 ---> nil
L1:  head --> 7 ---> 23 --> 34 ---> 56 --> 72 --> 89 ---> nil
\`\`\`

查找 72:从 L3 的 56 → 大于 72,退到 L2 → 56 后面是 89,退到 L1 → 56 后面是 72,命中。期望复杂度 **O(log n)**。

> [!interview] 高频追问:为什么用跳表不用红黑树?
> ① 范围查询:跳表找到起点后沿底层链表顺序遍历即可,红黑树需要中序遍历、实现复杂;② 实现简单:插入删除只需改前后指针,红黑树要旋转变色;③ 概率均衡:跳表通过随机层数天然平衡,不需要强制维护平衡因子。这一问几乎必考,背熟这三个点。

排行榜完整实战(可直接搬进项目):

\`\`\`java
import redis.clients.jedis.Jedis;
import java.util.Set;

public class RankBoard {
    public static void main(String[] args) {
        try (Jedis jedis = new Jedis("127.0.0.1", 6379)) {
            // 三个玩家提交成绩:ZADD key score member
            jedis.zadd("rank:game1", 98.5, "星薇Star");
            jedis.zadd("rank:game1", 92.0, "张三");
            jedis.zadd("rank:game1", 99.0, "李四");

            // 分数从高到低,带分数输出
            Set<String> tops = jedis.zrevrange("rank:game1", 0, 2);
            System.out.println("Top3: " + tops);

            // 查我的排名(从0开始,转成第几名)
            long myRank = jedis.zrevrank("rank:game1", "星薇Star");
            System.out.println("我的名次: 第 " + (myRank + 1) + " 名");
        }
    }
}
\`\`\`

\`\`\`output
Top3: [李四, 星薇Star, 张三]
我的名次: 第 2 名
\`\`\`

## 五大类型编码速查表(面试默写级)

| 类型 | 底层编码 | 转换阈值(7.0 默认) |
| --- | --- | --- |
| String | int / embstr / raw | ≤ 44 字节 embstr,超过 raw,int 仅纯数字 |
| List | listpack / quicklist | 元素 ≤ 128 且 ≤ 64 字节用 listpack |
| Hash | listpack / hashtable | 字段 ≤ 128 且值 ≤ 64 字节 |
| Set | intset / hashtable | 全整数且个数 ≤ 512 |
| ZSet | listpack / skiplist | 元素 ≤ 128 且 member ≤ 64 字节 |

> [!tip] String 的 embstr 是什么?
> ≤44 字节时,RedisObject 头与 SDS 一次分配在同一块连续内存(embstr=embedded),只需一次 malloc、缓存友好;超过 44 字节则两次分配(raw)。==44 = 64 字节 CPU 缓存行 − RedisObject 头部 20 字节 − SDS 头 3 字节==,这个推导说出来面试官会眼前一亮。

## 高级数据类型:Bitmap·HyperLogLog·GEO·Stream

\`\`\`diagram:d-redis5
\`\`\`

Redis 的类型系统像一套瑞士军刀:日常开瓶盖用五大基础款,但遇到"统计签到 / 亿级 UV / 附近的人"这些刁钻场景,就得掏出特化刀头。选型时先问自己"数据长什么样、要支持什么查法",答案自然浮现。

五大基本类型之外,Redis 还有四个"特化结构",每一个都对应一道高频场景题:**亿级 UV 用 HyperLogLog、签到用 Bitmap、附近的人用 GEO、消息队列新方案用 Stream**。

### Bitmap:一个 bit 存一天的签到

底层就是 String(SDS),但以 bit 为单位操作。**1 亿用户的签到表只要约 12.5MB**,比存 Set 省一个数量级:

\`\`\`shell
# uid=1001 在 11 月的第 13 天签到(偏移量从 0 开始)
SETBIT check:202611:1001 13 1
BITCOUNT check:202611:1001        # 本月累计签到天数
BITPOS check:202611:1001 1        # 第一次签到的日期位置
# 统计"当天活跃用户":每个用户一个 bit
SETBIT active:2026-11-14 1001 1
BITCOUNT active:2026-11-14        # 当日活跃数
# 连续签到:多天做 AND 运算
BITOP AND check:week:1001 check:202611:1001 check:202610:1001
\`\`\`

\`\`\`output
(integer) 0
(integer) 1
(integer) 13
(integer) 0
(integer) 1
(integer) 1
\`\`\`

> [!pitfall] Bitmap 的偏移量计算
> SETBIT 的 offset 上限是 2^32(512MB),按 uid 直接做偏移要求 id 连续;稀疏 id 先做映射(哈希或自增序号),否则 12.5MB 会膨胀成"为 1 个 bit 分配 512MB"。

### HyperLogLog:12KB 数亿级 UV

Set 精确去重的代价是 O(n) 内存;UV 这种**允许 0.81% 误差**的场景,HyperLogLog 用固定 12KB 搞定 2^64 个基数:

\`\`\`shell
PFADD uv:page:home "user-1001" "user-1002" "user-1001"   # 重复自动去重
PFCOUNT uv:page:home
PFADD uv:page:detail "user-1002" "user-1003"
PFMERGE uv:page:total uv:page:home uv:page:detail        # 合并多页
PFCOUNT uv:page:total
\`\`\`

\`\`\`output
(integer) 2
(integer) 2
OK
(integer) 3
\`\`\`

> [!interview] 标准答案口径
> "亿级 UV 用 HyperLogLog:每个元素哈希后取前 14 位定位 16384 个寄存器,寄存器记录对应低位串的最大前导零数,调和平均估算基数 —— 误差 0.81%,内存固定 12KB(16384 × 6bit)。"能说到 16384 个寄存器这一层,基本就压不住了。

### GEO:附近的人

底层是 ZSet:把经纬度 Geohash 编码成 52bit 作为 score,范围查询就是 score 范围扫描:

\`\`\`shell
GEOADD stores 106.65471 26.62463 "店A" 106.66102 26.61833 "店B"
GEOSEARCH stores FROMLONLAT 106.65 26.62 BYRADIUS 5 km ASC COUNT 10
GEOPOS stores "店A"
\`\`\`

\`\`\`output
1) 1) "\\xe5\\xba\\x97A"
   2) "1238.5204"
2) 1) "\\xe5\\xba\\x97B"
   2) "1513.8107"
1) 1) 106.65470916
   2) 26.62462806
\`\`\`

### Stream:Redis 自带的"小 Kafka"

5.0 引入,消息 ID 形如 ==时间戳-序号==(单调递增),支持消费者组、消息确认与待处理列表(PEL):

\`\`\`shell
XADD mq:order * product p-1001 amount 99      # * 让 Redis 自动生成 ID
XLEN mq:order
XRANGE mq:order - + COUNT 2
XGROUP CREATE mq:order grp1 0                  # 创建消费者组
XREADGROUP GROUP grp1 consumer-A COUNT 10 BLOCK 5000 STREAMS mq:order >
XACK mq:order grp1 1731562800000-0             # 处理成功后确认
XPENDING mq:order grp1                          # 查未确认消息(重投依据)
\`\`\`

四种"消息队列方案"终选表:

| 方案 | 有序 | 消费确认 | 消费者组 | 阻塞读 | 适用 |
| --- | --- | --- | --- | --- | --- |
| List(LPUSH/BRPOP) | ✓ | ✗(取出即丢) | ✗ | ✓ | 极简任务队列 |
| ZSet(score=时间戳) | ✓ | ✗ | ✗ | ✗ | 延迟队列 |
| **Stream** | ✓ | **✓(XACK/PEL)** | **✓** | ✓ | 日程内的可靠队列 |
| Pub/Sub | ✗(即发即弃) | ✗ | 分区✗ | ✓ | 实时通知,可丢 |

> [!tip] Feed 流推拉一句话
> 大 V 场景的 Feed 流:发件箱用 Stream/List 存,"推模式"(写时扩散到粉丝收件箱)适合粉丝少的,读时拉取 + 合并排序适合大 V —— 这就是"推拉结合"。

## 面试速记

- 快的原因:内存 + 数据结构 + 单线程 + epoll。
- SDS:O(1) 长度、防溢出、预分配、二进制安全。
- 跳表:多层索引概率平衡,O(log n),范围查询简单,故不用红黑树。
- 编码转换都是为了**小数据用紧凑结构省内存,大数据换标准结构保性能**。
- 大 key:String>10KB / 集合元素>5000,删除用 UNLINK。
`,
      },
      /* ─────────────────────────────────────────── */
      {
        id: 'ch02',
        title: '线程模型与 IO 多路复用',
        minutes: 30,
        points: ['单线程', 'epoll', 'Redis 6.0 多线程', 'RESP 协议'],
        content: `
> [!interview] 本章面试锚点
> "Redis 单线程为什么还这么快?Redis 6.0 引入多线程是不是推翻了单线程?"——这两个问题几乎每场 Java 面试都会出现。标准答案:**单线程指的是命令执行,网络 IO 在 6.0 后可以多线程,但命令执行仍然是单线程,不存在并发安全问题的质变**。

> [!info] 本章导读 · 一个线程,怎么同时招呼一万个客户端?
> 餐厅只有一个服务员,却能照看几十桌,靠的不是分身,而是谁举手就去谁那桌。Redis 的快,一半来自内存,另一半来自这套 IO 多路复用加单线程执行的组合。本章把这条为什么快的主线讲透。
> - 读完本章你将能:画出 epoll 的注册、就绪、处理三步流程
> - 说清 Redis 6.0 多线程到底多在哪里,命令执行为什么仍是单线程
> - 判断哪些慢命令会阻塞整个实例,并给出替代写法

> [!tip] 日常电脑现场 · 一个收银员叫号
> 奶茶店只开一个收银窗口,顾客点完单拿号去旁边等,收银员手上不停,只在有人喊单好了的时候抬头递杯子。食堂单窗口打饭也一样,一个阿姨招呼一整条队伍,谁到窗口就先给谁打。Redis 的主线程就是这样,不为每个客人配一个服务员,而是一个线程轮着处理所有连接。

## 单线程为什么反而快

\`\`\`diagram:d-eventloop
\`\`\`

Redis 的机房像一家只请一位大厨的私房菜:所有订单都塞进一个"就绪队列",大厨手速极快(内存操作微秒级),炒菜期间没有任何人抢灶台(无锁)。唯一的命门是:一道菜炒太久(慢命令),整间店都得等。

反直觉但成立的四个理由:

- **内存操作为主**:一条命令的 CPU 耗时通常在微秒级,瓶颈不在 CPU 而在网络。
- **无锁**:多个线程读写共享数据结构才需要锁,单线程彻底消灭锁开销与死锁。
- **无上下文切换**:线程切换一次约 1-10 微秒,还伴随缓存失效;单线程一直热在同一份代码与数据上,CPU 缓存命中率极高。
- **实现简单**:epoll 事件驱动模型,代码路径短,可预测性强。

> [!warn] 单线程的阿喀琉斯之踵
> **任何一条慢命令都会阻塞所有请求**:KEYS *(全量扫描)、HGETALL 大 hash、SAVE(同步 RDB)、大 key 删除。生产事故排查时,先查 ==slowlog get== 看慢命令,是第一反应。

## IO 多路复用:一个线程管一千个连接

先理解三个模型的进化:

| 模型 | 工作方式 | 问题 |
| --- | --- | --- |
| BIO(阻塞) | 每个连接一个线程,read() 阻塞等待 | 1000 连接 = 1000 线程,内存与切换爆炸 |
| NIO(非阻塞轮询) | 线程不停轮询所有连接问"就绪了吗" | 轮询空转,CPU 打满 |
| **IO 多路复用** | 把连接都注册给 epoll,线程阻塞在 epoll_wait,内核在连接就绪时唤醒线程 | 无 |

epoll 三个核心 API:

\`\`\`c
epfd = epoll_create();                    // 创建 epoll 实例(内核事件表)
epoll_ctl(epfd, EPOLL_CTL_ADD, fd, ev);   // 注册/修改/删除监听的 fd 与事件
epoll_wait(epfd, events, maxevents, timeout); // 阻塞等待,只返回"就绪"的 fd 列表
\`\`\`

**为什么 select/poll 不行而 epoll 行?**

| 维度 | select/poll | epoll |
| --- | --- | --- |
| fd 拷贝 | 每次调用全量从用户态拷入内核 | epoll_ctl 注册一次,共享内核事件表 |
| 就绪检测 | 内核线性扫描全部 fd O(n) | 回调机制,只把就绪 fd 放入就绪链表 O(1) |
| 返回 | 返回全部 fd,用户态再遍历 | 只返回就绪 fd |
| 上限 | select 1024 / poll 无硬限 | 无硬上限 |

Redis 事件循环伪代码(Reactor 模式):

\`\`\`c
while (true) {
    n = epoll_wait(epfd, events, 1024, -1);  // 没事件就一直睡,不耗 CPU
    for (i = 0; i < n; i++) {
        if (events[i] 是读事件) {
            命令 = read_and_parse(fd);
            结果 = 执行命令();               // 单线程串行执行,天然原子
            注册写事件;
        } else {
            write(fd, 结果);
        }
    }
}
\`\`\`

> [!tip] 与 Java NIO 对上号
> 你在 JavaSE 学的 ==Selector== 就是 Java 版的 epoll 封装:==ServerSocketChannel.register(selector, OP_ACCEPT)== 等价于 ==epoll_ctl==,==selector.select()== 等价于 ==epoll_wait==。面试官问到 Netty、Redis、Nginx 的共同点时,答"都是 Reactor + epoll"。

## Redis 6.0 的多线程:只多在"搬运"上

5.x 及以前:读请求、执行命令、写响应全在一个线程。
6.0 之后:**网络读取与协议解析、响应回写可以由多个 IO 线程并行**,命令执行依旧单线程。

\`\`\`text
[连接1] ─┐
[连接2] ─┼──> IO线程池(并行读+解析) ──> 命令排队 ──> 单线程执行 ──> IO线程池(并行回写)
[连接3] ─┘
\`\`\`

三个关键结论:

- **仍然线程安全**:因为执行阶段单线程,数据结构没有任何锁。
- 默认关闭,开启方式:\`io-threads-do-reads yes\`,\`io-threads 4\`(4核机器建议 2-3,8核建议 6)。
- 收益来源:大 value、高吞吐场景下,解析与拷贝占 CPU 的比例才值得并行。

## RESP 协议:Redis 的"普通话"

客户端与服务端用 RESP(Redis Serialization Protocol)通信,规则极简:

- 简单字符串:+OK
- 错误:-ERR unknown command
- 整数::1000
- 批量字符串:$5\\r\\nhello
- 数组:*3

亲眼看一次握手与命令(面试时的"我看过协议原文"底气):

\`\`\`shell
# 用 nc 直接连上 6379,手工发送一条 SET 命令的 RESP 报文
printf 'SET name zhen\\r\\n' | nc 127.0.0.1 6379
\`\`\`

\`\`\`output
+OK
\`\`\`

等价于客户端实际发送的字节流:

\`\`\`text
*3\\r\\n        # 数组,共3个元素(命令名+2个参数)
$3\\r\\n        # 元素1长度3字节
SET\\r\\n
$4\\r\\n        # 元素2长度4字节
name\\r\\n
$4\\r\\n
zhen\\r\\n
\`\`\`

## 批量与原子:pipeline·事务·Lua

### pipeline:一次网络往返发 N 条命令

单条命令的耗时 = 网络往返(RTT,内网约 0.2ms)+ 执行(微秒级)。10 万条命令逐条发,99% 的时间浪费在路上。pipeline 把一批命令打包一次发送:

\`\`\`java
try (Jedis jedis = new Jedis("127.0.0.1", 6379)) {
    long t1 = System.currentTimeMillis();
    for (int i = 0; i < 10000; i++) {
        jedis.set("k:" + i, "v" + i);            // 逐条:1 万次 RTT
    }
    long t2 = System.currentTimeMillis();

    Pipeline pipe = jedis.pipelined();            // 管道:1 次 RTT
    for (int i = 0; i < 10000; i++) {
        pipe.set("pk:" + i, "v" + i);
    }
    pipe.sync();                                  // 统一收响应
    long t3 = System.currentTimeMillis();
    System.out.println("逐条: " + (t2 - t1) + "ms");
    System.out.println("管道: " + (t3 - t2) + "ms");
}
\`\`\`

\`\`\`output
逐条: 842ms
管道: 31ms
\`\`\`

> [!warn] pipeline 不是原子操作
> 管道只是**省网络往返**,命令仍是逐条执行的,中途会穿插其他客户端的命令。需要"一包命令原子执行"时,用事务或 Lua。

### 事务:MULTI/EXEC 入队 + WATCH 乐观锁

MULTI 之后所有命令**入队不执行**,EXEC 时一次性串行执行(执行中不会被其他客户端插队):

\`\`\`shell
MULTI
SET order:1001 status "PAID"
DECR stock:1001
EXEC
\`\`\`

\`\`\`output
OK
QUEUED
QUEUED
1) OK
2) (integer) 99
\`\`\`

Redis 事务**不支持回滚**:入队阶段的语法错误会让整个事务拒绝执行;但 EXEC 阶段某条命令运行出错(如对 String 做 INCR),其余命令照常执行 —— 官方的取舍:Redis 层面运行时错误极其罕见,回滚场景少。

WATCH 是乐观锁:监控的 key 在 EXEC 前被别人改过,整个事务放弃:

\`\`\`shell
WATCH stock:1001
GET stock:1001          # 读到 1,判断还够
MULTI
DECR stock:1001
EXEC                    # 若期间别人改了 stock:1001,这里返回 nil
\`\`\`

\`\`\`output
1) (nil)      # WATCH 失败,事务作废,业务侧重试
\`\`\`

三种方案对比(场景题的决策表):

| 方案 | 原子性 | 省网络 | 回滚 | 适用 |
| --- | --- | --- | --- | --- |
| pipeline | ✗ | ✓ | ✗ | 纯批量读写(批量导入) |
| MULTI/EXEC | ✓(串行执行) | ✓(一次提交) | ✗ | 简单命令组的原子提交 |
| **Lua 脚本** | **✓(脚本整体原子)** | ✓ | ✗ | **带判断逻辑的原子操作(分布式锁解锁)** |

> [!best] 实战口径
> 需要原子性 + 条件逻辑 → 首选 Lua;纯批量 → pipeline;MULTI/EXEC 实际生产用得少,面试时主动说"Lua 可读性和调试成本更高,简单入队场景我会用事务",显得有工程判断。

### Redis vs Memcached:经典选型题

| 维度 | Redis | Memcached |
| --- | --- | --- |
| 数据结构 | 5 大类型 + Bitmap/HLL/Stream | 只有 String |
| 持久化 | RDB/AOF/混合 | 无 |
| 高可用 | 主从/哨兵/Cluster | 客户端分片,无内置 |
| 线程模型 | 命令单线程(6.0 IO 多线程) | 多线程(互斥锁竞争) |
| 值上限 | 512MB | 1MB |

一句话:**Memcached 是"纯缓存"的极致简单;Redis 是数据结构服务器**。新项目默认 Redis,除非只存极简 KV 且多线程吞吐是瓶颈。

## ACL 与 Redis 7 新特性速览

6.0 之前 Redis 只有一个 default 用户,密码即全部权限;6.0 引入 ACL,7.0 又把脚本、AOF、Pub/Sub 三块补强。这几项是"版本跟踪"加分题,知道命令长什么样就够用。

### ACL:用户、权限与命令白名单

ACL 管三个维度:**能登录(用户/密码)、能碰哪些 key(key pattern)、能执行哪些命令**。

\`\`\`shell
# 只读账号:只能读 cache: 前缀的 key,禁掉危险命令
ACL SETUSER app_ro on >App@2026 -@all +@read -@dangerous ~cache:*

# 读写账号:只允许 get/set/expire 三个命令
ACL SETUSER app_rw on >App@2026 -@all +get +set +expire ~cache:*

ACL WHOAMI
ACL LIST
ACL GETUSER app_rw
\`\`\`

\`\`\`output
OK
OK
"default"
1) "user default on nopass sanitize-payload ~* &* +@all"
2) "user app_ro on #2a59e6f49915a5cfbe957b3e8c58d4bc55d0b4c584a37bc7f8d68696935c2362 ~cache:* &* -@all +@read -@dangerous"
3) "user app_rw on #2a59e6f49915a5cfbe957b3e8c58d4bc55d0b4c584a37bc7f8d68696935c2362 ~cache:* &* -@all +get +set +expire"
1) "flags"
2) 1) "on"
3) "passwords"
4) 1) "2a59e6f49915a5cfbe957b3e8c58d4bc55d0b4c584a37bc7f8d68696935c2362"
5) "commands"
6) "-@all +get +set +expire"
7) "keys"
8) "~cache:*"
9) "channels"
10) "&*"
11) "selectors"
12) (empty array)
\`\`\`

要点:

- ==+@read== 是命令类别,==+get +set== 是单命令,==-@dangerous== 从类别里再抠掉危险命令,后者优先;
- 新用户的权限是**从零开始**的,不写 ==-@all== 也默认没有任何命令权限,写上是让配置自解释;
- 密码在 ACL LIST 里只显示 SHA256,不落明文;持久化用 ==ACL SAVE==(需配 aclfile),审计用 ==ACL LOG==,查类别用 ==ACL CAT==。

> [!warn] ACL 不是万能的网络隔离
> ACL 能限制命令与 key,但挡不住"知道密码的人在允许范围内搞破坏";生产还要配合 ==rename-command== 改名高危命令(或直接用 ACL 禁用)、bind 内网地址、TLS 与安全组。ACL 是纵深防御的一层,不是替代品。

### Redis 7:Function、Multi-Part AOF、Sharded Pub/Sub

**Function(7.0)**:把 Lua 脚本注册成服务端的"库",有名字、可持久化、可随复制传播,不再每次 EVAL 传整段脚本文本。

\`\`\`lua
#!lua name=mylib
redis.register_function('myget', function(keys, args)
    return redis.call('GET', keys[1])
end)
\`\`\`

\`\`\`shell
redis-cli SET user:1 zhen
# 从标准输入加载(文件内容见上),REPLACE 覆盖同名库
cat mylib.lua | redis-cli -x FUNCTION LOAD REPLACE
FCALL myget 1 user:1
FUNCTION LIST
\`\`\`

\`\`\`output
OK
"mylib"
"zhen"
1) 1) "library_name"
   2) "mylib"
   3) "engine"
   4) "LUA"
   5) "functions"
   6) 1) 1) "name"
         2) "myget"
         3) "description"
         4) (nil)
         5) "flags"
         6) (empty array)
\`\`\`

**Multi-Part AOF(7.0)**:AOF 从单文件变成 ==appendonlydir== 目录:一个 base 文件 + 多个 incr 增量文件 + manifest 清单。好处是重写不再需要一个巨大的临时文件做原子替换,base 与增量分离后重写/恢复更稳;==aof-use-rdb-preamble==(默认 yes)让 base 用 RDB 格式,恢复更快。开启后不要手工删目录里的文件,交给 manifest 管理。

\`\`\`shell
redis-cli CONFIG SET appendonly yes
redis-cli CONFIG GET appenddirname
redis-cli INFO persistence | grep aof
\`\`\`

\`\`\`output
OK
1) "appenddirname"
2) "appendonlydir"
aof_enabled:1
aof_rewrite_in_progress:0
aof_last_bgrewrite_status:ok
\`\`\`

**Sharded Pub/Sub(7.0)**:普通 Pub/Sub 在集群里要把消息广播到所有节点;==SSUBSCRIBE/SPUBLISH== 按 channel 的槽位路由,消息只发给负责该槽的分片,扩展性更好。注意它和普通 ==SUBSCRIBE/PUBLISH== **不互通**,是两套频道。

\`\`\`shell
SSUBSCRIBE order:created
SPUBLISH order:created "1001"     # 只会路由到 order:created 所在槽的节点
\`\`\`

| 特性 | 版本 | 解决什么 | 关键命令 |
| --- | --- | --- | --- |
| ACL | 6.0 | 多租户/最小权限,替代单一 requirepass | ACL SETUSER / ACL LIST / ACL LOG |
| Function | 7.0 | Lua 脚本集中管理、持久化、可命名调用 | FUNCTION LOAD / FCALL / FUNCTION LIST |
| Multi-Part AOF | 7.0 | 单文件 AOF 重写与恢复的稳定性 | appenddirname / appendonlydir |
| Sharded Pub/Sub | 7.0 | 集群下 Pub/Sub 全节点广播的带宽浪费 | SSUBSCRIBE / SPUBLISH |

> [!interview] Function 与 EVAL 的区别(一句话)
> EVAL 每次把整段脚本发过去,EVALSHA 还要客户端自己管 SHA;Function 把脚本注册成有名字、可持久化、可复制的库,用 ==FCALL 库名.函数名== 直接调,重启和主从都不丢 —— 相当于把脚本"存储过程化"了。

## 面试速记

- 单线程快的本质:**瓶颈在内存与网络,不在 CPU**;单线程消灭了锁与切换开销。
- epoll vs select:注册一次 + 就绪链表 + O(1),不再全量拷贝与扫描。
- 6.0 多线程只管网络 IO,命令执行仍单线程,安全性质不变。
- 慢命令阻塞是单线程模型的唯一软肋:KEYS、大 key、SAVE 是三大元凶。
`,
      },
      /* ─────────────────────────────────────────── */
      {
        id: 'ch03',
        title: '持久化:RDB 与 AOF',
        minutes: 30,
        points: ['fork+COW', 'AOF重写', '混合持久化', '选型'],
        content: `
> [!interview] 章节定位
> "内存数据库断电数据怎么办?RDB 和 AOF 怎么选?"——先给结论:**RDB 是某一时刻的全量快照(二进制,恢复快,可能丢分钟级数据);AOF 是每条写命令的追加日志(丢数据少,文件大恢复慢)**;4.0+ 支持混合持久化兼得两者。

> [!info] 本章导读 · 内存数据库断电了,数据还在吗?
> 手机没电前会自动保存草稿,Redis 也要给自己留后路。RDB 像定期拍全景照,AOF 像把每一步操作记成流水账,两者的取舍决定了你最多能丢多少数据、恢复要等多久。本章把这两条路线与混合持久化讲清楚。
> - 读完本章你将能:配置 bgsave 与 AOF everysec,并说出各自可能丢多少数据
> - 解释 fork 与写时复制在快照期间对内存的影响
> - 面对能丢几秒数据与恢复要多快这两个需求,做出选型

> [!tip] 日常电脑现场 · 存档点与自动恢复
> 打游戏刷副本刷到一半突然断电,重开时进度停在上一个存档点,中间那半小时的经验就没了,这个损失对应 RDB 能丢的数据量。Word 崩溃后重开提示恢复未保存的文档,那是它把每一步编辑都记成了流水账。自动保存隔多久一次,直接决定你敢不敢赌下一次掉线。

## RDB:定时快照

把某一时刻内存中**全部数据**以紧凑二进制写进 dump.rdb。

三种触发方式:

- ==save==:主线程同步执行,**阻塞所有请求**,生产禁用。
- ==bgsave==:fork 子进程异步生成快照,主线程只在 fork 瞬间阻塞(毫秒级)。
- 自动触发:配置 ==save 900 1== 表示 900 秒内至少 1 次修改就自动 bgsave。

\`\`\`shell
# 手动触发并观察后台进程
redis-cli BGSAVE
redis-cli info persistence | grep rdb_
\`\`\`

\`\`\`output
Background saving started by pid 12345
rdb_bgsave_in_progress:0
rdb_last_save_time:1731562800
rdb_last_bgsave_status:ok
rdb_last_bgsave_time_sec:1
\`\`\`

### 核心机制:fork + 写时复制(COW)

bgsave 的精髓:==fork()== 创建子进程后,父子进程**共享同一份物理内存页**;只有当某页数据被主线程**修改**时,操作系统才复制那一页给写者。

\`\`\`text
bgsave 时刻:
  主线程(继续服务写请求)──┐
                          ├── 共享物理内存页(此刻的快照视角)
  子进程(遍历内存写 RDB)──┘
  之后主线程改了页 X → 内核复制页 X 给主线程新写,子进程仍读旧页
\`\`\`

这就是"瞬时快照"的秘密:**子进程永远读到的 fork 那一瞬间的数据**。

> [!pitfall] 写入量大 = 内存翻倍风险
> bgsave 期间如果写请求集中在不同数据页,最多可能接近复制全量内存。==**同时 fork 本身也要复制页表**(GB 级实例的页表就有几十 MB,会瞬时阻塞主线程)==。大实例(10GB+)要评估影响,调低 save 频率或改用 AOF。

## AOF:写命令日志

每条写命令追加到 appendonly.aof。注意执行顺序:**先执行命令,再写日志** —— 避免记录执行失败的命令。

\`\`\`text
SET a 1      ──> 内存执行 ──> aof_buf 缓冲区 ──> write() 内核缓冲 ──> fsync() 磁盘
\`\`\`

三种刷盘策略(appendsync 参数),这是必考对比:

| 策略 | 含义 | 最多丢 | 性能 |
| --- | --- | --- | --- |
| always | 每条命令都 fsync | 1 条 | 最差,约 2000-5000 QPS |
| everysec(默认) | 后台线程每秒 fsync | **1 秒** | 折中,生产推荐 |
| no | 交给操作系统(约30s) | 30 秒 | 最好 |

### AOF 太大怎么办:重写(rewrite)

日志里存的是命令,天然冗余:同一个 key 改了 100 次,重写后只留最终值的**一条等价命令**。

\`\`\`text
重写前 100 条: SET count 1; INCR count; ...; SET count 100
重写后 1 条:   SET count 100
\`\`\`

触发:文件超过 ==auto-aof-rewrite-min-size 64mb== 且比上次重写后增长 ==auto-aof-rewrite-percentage 100==(翻倍)。

重写原理(与 bgsave 同款 COW):fork 子进程按**当前内存**生成等价命令;期间新写入同时进 AOF 缓冲区与 AOF **重写**缓冲区;子进程完成后,把重写缓冲区增量追加进新文件,原子替换旧文件。

> [!warn] fork 的第二次出现
> AOF 重写同样要 fork + 复制页表。**RDB 与 AOF 重写不要同时进行**:配置 ==aof-use-rdb-preamble== 时 Redis 会自动错峰调度。

## 4.0+ 混合持久化(生产标配)

开启 ==aof-use-rdb-preamble yes== 后,AOF 重写不再写纯命令流,而是:**前半段放当前内存的 RDB 二进制快照,后半段追加重写期间的增量命令**。

\`\`\`text
[ RDB 全量二进制(前导) ][ 增量 AOF 命令 ][ 之后的持续追加 ]

恢复时先加载 RDB(毫秒级),再重放尾部少量命令,启动速度和数据完整度兼得。代价是 AOF 文件不再是纯文本,人工排查不方便;且要求 Redis 4.0+。

> [!best] 生产组合拳
> RDB 定时做**备份归档**,AOF everysec + 混合持久化负责**重启恢复**——一个保"能找回",一个保"少丢数据"。

## 选型决策表

| 场景 | 推荐 | 理由 |
| --- | --- | --- |
| 纯缓存,数据可重建 | 只开 RDB 或干脆关闭持久化 | 性能优先,重启重新预热即可 |
| 重要业务数据(订单/会话) | AOF everysec + 混合持久化 | 最多丢 1 秒,恢复也快 |
| 当主数据库用 | AOF always + 主从 + 哨兵 | 可靠性优先,接受写入性能下降 |
| 既要备份又要快速恢复 | RDB 定时归档 + AOF 混合 | 各取所长,互为兜底 |

一句话:**能丢数据的场景谈性能,不能丢数据的场景谈组合**;只选一种方案就选"AOF everysec + 混合"。

## 面试速记

- RDB:bgsave = fork + COW,恢复快但可能丢较长时间数据;save 阻塞禁用。
- AOF:先执行后记日志;always/everysec/no 三档;重写消除冗余。
- 混合持久化 = RDB 前导 + AOF 增量,4.0+ 默认。
- fork 两大代价:页表复制(阻塞主线程)+ 写时复制的内存上限。
`,
      },
      /* ─────────────────────────────────────────── */
      {
        id: 'ch04',
        title: '缓存穿透 · 击穿 · 雪崩',
        minutes: 35,
        points: ['布隆过滤器', '互斥锁', '逻辑过期', '多级缓存'],
        content: `
> [!interview] 章节定位
> 这是 Redis 面试的**必考三连**,而且经常要求现场手写方案。回答框架:**现象 → 原因 → 方案(短期止血 + 长期根治)→ 方案代价**。本页配一个可交互演示,点击模拟三种事故,看流量是怎么把数据库打挂的。

> [!info] 本章导读 · 数据库是怎么被自己的缓存害死的?
> 缓存本来是用来保护数据库的,配置不当却会在某一秒把请求全部放回数据库,像水库突然开闸。穿透、击穿、雪崩是三种不同的开闸方式,对应的药方也完全不同。本章配可交互演示,让你亲眼看到流量如何压垮数据库。
> - 读完本章你将能:用一句话区分穿透、击穿、雪崩,不再答混
> - 为每种问题各写出至少两套方案,并说明代价
> - 手写一个带互斥锁的缓存回源逻辑,守住热点 key 失效的瞬间

> [!tip] 日常电脑现场 · 秒杀页白屏那一秒
> 零点抢购时页面一直转圈,十秒后白屏,刷新还是白屏,这不是你的网差,是同一秒几万人都在查同一件商品。热搜爆掉的时候新闻站打不开、评论区刷不出来,也是同一幅画面。缓存里那份数据刚好过期,请求整批砸到数据库上,谁也接不住。

\`\`\`demo:cache-3
\`\`\`

## 穿透(Penetration):查"根本不存在的数据"

**现象**:请求的 key 在缓存和数据库里都==不存在==,每次都穿透到 DB。攻击者可恶意构造海量不存在的 id,把 DB 打垮。

**方案矩阵:**

| 方案 | 做法 | 优点 | 代价 |
| --- | --- | --- | --- |
| 缓存空值 | 查不到也 ==SET key "" EX 60== | 实现最简单 | 内存浪费;需短 TTL |
| **布隆过滤器** | 启动时把全部合法 id 灌入;请求先过过滤器 | 内存极省(1亿数据约100MB) | 有误判率;删除困难 |
| 参数校验 | id<=0 直接拒绝 | 零成本 | 只能挡低级攻击 |

布隆过滤器原理:一个 bit 数组 + k 个哈希函数。写入时把 k 个哈希位置置 1;查询时 k 个位置**全为 1 才可能存在,有一个 0 就一定不存在**。

\`\`\`java
/** 手写布隆过滤器(面试手写版,理解原理) */
public class SimpleBloomFilter {
    private final long[] bits;           // 用 long 数组模拟 bit 数组
    private final int size;

    public SimpleBloomFilter(int expectedInsertions) {
        this.size = expectedInsertions * 8;   // 简化:每元素8个bit
        this.bits = new long[(size + 63) / 64];
    }

    private int[] hashPositions(String key) {
        int h1 = Math.abs(key.hashCode());
        int h2 = Math.abs(java.util.Objects.hashCode(key, 31));
        return new int[]{ h1 % size, h2 % size };
    }

    public void add(String key) {
        for (int p : hashPositions(key)) {
            bits[p / 64] |= (1L << (p % 64));   // 对应bit置1
        }
    }

    public boolean mightContain(String key) {
        for (int p : hashPositions(key)) {
            if ((bits[p / 64] & (1L << (p % 64))) == 0) {
                return false;                    // 有一个0 → 一定不存在
            }
        }
        return true;                             // 全1 → 可能存在(有误判)
    }
}
\`\`\`

生产上不手写,直接用 Google Guava 或 Redisson:

\`\`\`java
// Redisson 布隆过滤器,支持过期
RBloomFilter<String> filter = redisson.getBloomFilter("bloom:userId");
filter.tryInit(100_000_000L, 0.01);   // 预期1亿,误判率1%
filter.add("1001");
boolean pass = filter.contains("999999");  // false → 直接拦截,不查库
\`\`\`

## 击穿(Breakdown):热点 key 过期瞬间

**现象**:某个**热点 key** 在过期的一瞬间,成千上万请求同时 miss,同时去查 DB。

与穿透的区别:穿透是"数据不存在",击穿是"数据存在但恰好过期"。

**两种方案对比(必考):**

| 方案 | 做法 | 一致性 | 代价 |
| --- | --- | --- | --- |
| 互斥锁 | 第一个 miss 的请求拿分布式锁查库回填,其余请求自旋重试 | 强 | 有锁开销与等待 |
| **逻辑过期** | value 里带过期字段,发现逻辑过期后异步刷新,期间返回旧值 | 弱(短暂旧值) | 无阻塞,但要改造 value 结构 |

\`\`\`java
/** 方案一:互斥锁重建缓存 */
public String getWithMutex(String key) {
    String val = redis.get(key);
    if (val != null) return val;

    String lockKey = "lock:cache:" + key;
    String token = UUID.randomUUID().toString();
    try {
        // 拿不到锁的请求:短暂等待后重试读缓存
        if (!"OK".equals(redis.set(lockKey, token, "NX", "PX", 5000))) {
            Thread.sleep(50);
            return getWithMutex(key);           // 递归重试
        }
        val = db.query(key);                    // 双重检查:拿锁后再查一次缓存
        val = (val != null) ? val : db.query(key);
        if (val == null) { redis.set(key, "", "EX", 60); return null; }  // 空值防穿透
        redis.set(key, val, "EX", 600);
        return val;
    } finally {
        releaseLock(lockKey, token);            // 只能删自己的锁(Lua 保证原子)
    }
}

/** 方案二:逻辑过期(热点数据推荐) */
class CacheData {
    String data;
    long expireAt;                              // 逻辑过期时间戳
}

public String getWithLogicalExpire(String key) {
    CacheData cd = JSON.parseObject(redis.get(key), CacheData.class);
    if (cd == null) return null;                        // 没预热过,直接返回
    if (cd.expireAt > System.currentTimeMillis()) {
        return cd.data;                                 // 未逻辑过期,返回
    }
    // 逻辑过期:尝试拿锁异步刷新,拿不到锁就返回旧值(高可用优先)
    if ("OK".equals(redis.set("lock:refresh:" + key, "1", "NX", "PX", 5000))) {
        threadPool.execute(() -> refreshCache(key));    // 异步重建
    }
    return cd.data;                                     // 无论刷新与否,先返回旧数据
}
\`\`\`

\`\`\`output
[请求1] 缓存 miss → 抢锁成功 → 查库 120ms → 回填缓存 → 返回
[请求2] 缓存 miss → 抢锁失败 → sleep(50) 重试读缓存 → 命中 ✓ (121ms)
[请求3] 命中 → 发现逻辑过期 → 异步线程刷新 → 立即返回旧数据 (0ms)
[请求4] 命中 → 未过期 → 直接返回 (0ms)
\`\`\`

> [!best] 选型口诀
> **能容忍短暂旧值的大促热点 → 逻辑过期(不阻塞、体验好);一致性敏感 → 互斥锁。** 两套都要会写,面试看场景选。

## 雪崩(Avalanche):大面积同时失效

**现象**与击穿的区别:击穿是**一个**热点 key,雪崩是**大量** key 同时失效(或 Redis 实例整体宕机)。

**三层防御:**

- **过期时间打散**:TTL = 基础值 + 随机偏移,例如 ==300 + random(0, 300)== 秒。
- **多级缓存**:本地缓存(Caffeine)挡第一波 → Redis 挡第二波 → DB 兜底。
- **高可用**:哨兵/集群避免单点;限流降级兜底(Sentinel 对 DB 前置限流)。

\`\`\`java
/** 过期时间打散:一行代码解决 80% 的雪崩 */
int base = 300, offset = ThreadLocalRandom.current().nextInt(300);
redis.setex(key, base + offset, value);
\`\`\`

## 三兄弟对比总结(默写级)

| 维度 | 穿透 | 击穿 | 雪崩 |
| --- | --- | --- | --- |
| 现象 | 查不存在的数据,缓存永远 miss | 单个热点 key 过期瞬间,高并发全部回源 | 大量 key 同时失效,或 Redis 整体宕机 |
| 根因 | 恶意/异常请求绕过缓存 | 热点 key 恰好过期 + 无并发控制 | TTL 集中 + 无高可用 + 无兜底 |
| 方案 | 布隆过滤器 + 缓存空值 + 参数校验 | 互斥锁重建 / 逻辑过期 | TTL 加随机值 + 多级缓存 + 哨兵集群 + 限流降级 |
| 代价 | 布隆有误判;空值占内存 | 锁有等待;逻辑过期返回旧值 | 架构复杂,要维护本地缓存一致性 |

> [!interview] 面试 30 秒版
> "穿透查没有,布隆挡;击穿死一个,锁或逻辑过期;雪崩塌一片,TTL 打散加多级缓存和高可用。三者都还要有最后的熔断限流兜底。"

## 面试速记

- 穿透查"没有",击穿死"一个",雪崩塌"一片"。
- 布隆过滤器:命中≠存在,不命中=一定不存在,误判率与 bit 数、哈希个数有关。
- 逻辑过期 vs 互斥锁:高可用优先选逻辑过期,一致性优先选互斥锁。
- 附加分:说出==缓存预热==(上线前提前灌热点数据)与==熔断限流==兜底。
`,
      },
      /* ─────────────────────────────────────────── */
      {
        id: 'ch05',
        title: '缓存一致性与更新策略',
        minutes: 25,
        points: ['Cache Aside', '延迟双删', 'Canal', '先库后缓存'],
        content: `
> [!interview] 章节定位
> "数据库和缓存怎么保持一致?先删缓存还是先更新数据库?"——先给终极结论:**没有绝对一致,只有"最终一致 + 选择性出错窗口"。生产标准答案是 Cache Aside 模式:先更新数据库,再删除缓存**。

> [!info] 本章导读 · 先删缓存还是先更新数据库?答错就是事故
> 缓存和数据库是两份数据,只要写操作发生,就存在一个两边对不上的时间窗口。就像两个人同时改同一份文档,总有一瞬间版本不一致。本章不承诺绝对一致,而是教你把不一致窗口压到最小,并留好兜底。
> - 读完本章你将能:复述 Cache Aside 的推荐顺序,并解释为什么
> - 说清延迟双删、订阅 binlog 各自解决什么问题
> - 判断自己的业务能否接受最终一致,不能接受时该换什么方案

> [!tip] 日常电脑现场 · 昵称改了还是旧的
> 你把微信昵称和头像换掉,自己的主页立刻变了,好友那边却还显示旧头像,过一会儿刷新才对。原因是缓存和数据库各存了一份,写入之后有一小段时间两边对不上。系统能做的不是消灭这个窗口,而是把它压到最短,再留一个兜底。

## 四种模式推演(面试的加分点在于"推演"而不是背结论)

**模式一:先删缓存,再更新数据库**

\`\`\`text
线程A(写):  删缓存 ──────> 更新DB
线程B(读):        读缓存miss ──> 读DB(旧值)──> 回填旧值 ✗
\`\`\`

问题:B 在 A 删缓存与更新 DB 之间读到旧值并回填,缓存里留下了**旧数据且长期不失效**。

**模式二:先更新数据库,再删缓存(Cache Aside,推荐)**

\`\`\`text
线程A(写):  更新DB ──> 删缓存
线程B(读):            读缓存(命中旧值,短暂) ──> 下次读已删除,重新加载新值 ✓
\`\`\`

仍有一个极小概率的不一致:A 更新 DB 后、删缓存前,B 读到旧缓存。但要求"B 的读发生在那个毫秒间隙且缓存恰好未过期",概率极低且可用 TTL 兜底。

**为什么是"删除"而不是"更新"缓存?** 写多读少时更新是浪费;并发写时两个写线程乱序更新缓存会造成永久脏数据;删除是惰性加载,简单且安全。

> [!tip] 用 TTL 兜底一切
> 无论哪种方案,缓存必须设过期时间作为**最终一致性的最后防线**。一致性要求越高,TTL 越短;完全不允许不一致 → 不要用缓存,直接读库加优化。

## 延迟双删:给"先删后更"模式打补丁

如果业务被迫采用"先删缓存,再更新 DB",用延迟双删降低脏数据窗口:

\`\`\`java
public void updateWithDoubleDelete(String key, Object data) {
    redis.delete(key);                          // 第一次删
    db.update(data);                            // 更新数据库
    // 延迟 500ms 再删一次:把"读旧值回填"的脏缓存清掉
    scheduler.schedule(() -> redis.delete(key), 500, TimeUnit.MILLISECONDS);
}
\`\`\`

\`\`\`output
[14:00:00.102] 第一次 DEL product:1001 → 1
[14:00:00.105] DB UPDATE product:1001 → OK
[14:00:00.608] 延迟双删触发 → 第二次 DEL product:1001 → 1   # 清掉并发读回填的旧值
\`\`\`

延迟时间 = 读请求耗时 + 余量(常见 500ms~1s)。缺点:延迟时间靠拍脑袋;第二次删除失败仍脏(可上消息队列重试)。

## 订阅 binlog 异步同步(Canal):解耦的正确姿势

把"删缓存"从业务代码里剥离:MySQL 主库写 binlog → Canal 伪 slave 拉取 → 投递 MQ → 消费者删除/更新缓存。

\`\`\`text
┌────────┐  binlog   ┌───────┐   msg    ┌─────────┐   DEL/SET   ┌───────┐
│ MySQL  │ ────────> │ Canal │ ───────> │ RocketMQ │ ──────────> │ Redis │
└────────┘           └───────┘          └─────────┘             └───────┘
\`\`\`

优点:业务零侵入、天然重试、可消费积压。代价:引入两个组件,一致性延迟从毫秒升到百毫秒级。**适合最终一致性场景(商品详情、排行榜底表)**;不适合秒杀库存这类强一致场景。

## 方案选型决策表

| 方案 | 一致性强度 | 实现复杂度 | 适用业务 |
| --- | --- | --- | --- |
| Cache Aside + TTL | 最终一致(秒~分钟) | 低 | 商品详情、用户资料等 90% 场景 |
| Canal/MQ 异步删除 | 最终一致(百毫秒~秒) | 中 | 业务零侵入、多系统共用缓存 |
| 延迟双删 | 较弱,窗口靠经验值 | 中 | 被迫"先删后更"的遗留系统 |
| 不用缓存,Redis 原子操作 | 强一致 | 低(仅限原子场景) | 库存扣减、余额、秒杀 |

> [!warn] 什么时候必须绕开"数据库+缓存"这套
> ① 金额、库存这类**不能读到旧值**的字段;② 需要"检查再执行"的原子逻辑(用 Lua 或数据库行锁);③ 对账、风控等强一致链路。这些场景的正确做法不是"把缓存做一致",而是**压根不让缓存参与判定**。

## 结合你的简历项目

面试官大概率会这样追问,提前准备两段答法:

**Q1:你说令牌存 Redis,那 JWT 和 Redis 会话到底怎么配合?**
答:登录成功后生成 token 作为 key、userId 作为 value,\`SET token:xxx userId EX 7200\`;每次请求拦截器查 Redis 校验并顺延 TTL(滑动过期)。JWT 只负责携带身份,不承担状态;Redis 才是会话的"开关"——登出直接 DEL,改密批量 DEL 该用户全部 token,实现"主动失效",这是纯 JWT 做不到的。

**Q2:聊天记录为什么用 ZSet 而不是 List?**
答:消息需要按时间排序、支持分页、还要防止重复投递。ZSet 的 score 用消息时间戳(或自增 ID),member 存消息体哈希,天然有序且去重;取最近 N 条用 \`ZREVRANGE 0 N-1\`,清理用 \`ZREMRANGEBYRANK\`。List 只能两端进出,分页和去重都费劲。

> [!tip] 一个加分细节
> 主动说出代价:Redis 挂了会话会整体不可用,所以项目里给 token 校验加了**本地降级开关**(短时放行 + 告警),而不是让登录链路跟着 Redis 一起死。面试官听到"降级"两个字,基本就认可你真做过线上系统。

## 面试速记

- 标准答案:**先更新 DB,再删缓存**(Cache Aside)。
- 为什么删不更:并发写乱序会永久脏;删除是惰性、幂等、简单。
- 延迟双删是"先删后更"的补丁,时间窗靠经验值。
- 强一致场景直接绕开缓存,用 Redis 原子命令或干脆读库。
`,
      },
      /* ─────────────────────────────────────────── */
      {
        id: 'ch06',
        title: '分布式锁实战',
        minutes: 35,
        points: ['SETNX', '误删问题', 'Lua原子续期', 'Redisson看门狗'],
        content: `
> [!interview] 章节定位
> 分布式锁是 Redis 工程题之王,面试从"怎么加锁"一路追问到"RedLock 靠谱吗"。本章按**问题的演进史**讲解,每一版解决上一版的漏洞 —— 面试时按这个演进顺序讲,层次感直接拉满。先点下面的演示,直观感受锁竞争。

> [!info] 本章导读 · 两个线程抢同一件库存,锁为什么没锁住?
> 单机加锁靠 synchronized,多台机器就各锁各的,等于没锁。分布式锁要解决的是跨进程互斥,而网络分区、超时、主从切换会让看似正确的锁随时失效。本章沿着漏洞演进史,一步步把锁补到生产可用。
> - 读完本章你将能:用 SET NX PX 写出不会死锁的加锁命令
> - 解释解锁为什么必须用 Lua 校验持有者
> - 说清 Redisson 看门狗何时续期、何时失效,并给出兜底方案

> [!tip] 日常电脑现场 · 扫码开锁那两秒钟
> 两辆共享单车停在一起,你和路人同时扫同一辆,只有一个人的手机跳出开锁成功,另一个提示车辆已被使用。电影院选座也是,你点下去的那一秒,那个座位变成灰色,别人再也选不了。这中间隔着的,就是一把跨机器的锁。

\`\`\`demo:redis-lock
\`\`\`

## 第一版:SETNX 的三个漏洞

\`\`\`shell
SETNX lock:order:1001 "1"     # 只在不存在时设置,拿到锁返回1
EXPIRE lock:order:1001 30     # 设置过期时间防死锁
DEL  lock:order:1001          # 释放
\`\`\`

漏洞清单:

- **非原子**:SETNX 与 EXPIRE 是两条命令,中途宕机 → 锁永远不释放 → 死锁。
- **误删他人的锁**:A 执行超时锁自动过期,B 拿到锁,A 执行完 DEL 把 B 的锁删了。
- **锁超时但业务没完**:30 秒过期了业务还没跑完,锁形同虚设。

## 第二版:一条命令 + 身份校验

\`\`\`shell
# 原子加锁:NX(不存在才设) + PX(毫秒过期) 一气呵成
SET lock:order:1001 "uuid-A" NX PX 30000
\`\`\`

\`\`\`output
OK
\`\`\`

SET 的四个参数语义(面试默写级):

| 参数 | 含义 | 解决的漏洞 |
| --- | --- | --- |
| NX | Not eXists,不存在才设置 | 与 EXPIRE 两步合一,解决"非原子" |
| XX | 存在才设置 | 用于续期场景 |
| PX 30000 | 毫秒级过期时间 | 防宕机死锁 |
| EX 30 | 秒级过期时间 | 同上 |
| 值 = uuid-A | 持有者身份标识 | 配合 Lua,防误删他人锁 |

解锁必须**校验身份 + 删除**两步原子完成,靠 Lua 脚本:

\`\`\`lua
-- unlock.lua: 只有锁里存的值是自己(uuid)才能删
if redis.call("GET", KEYS[1]) == ARGV[1] then
    return redis.call("DEL", KEYS[1])
else
    return 0
end
\`\`\`

\`\`\`java
// Java 侧执行
String result = jedis.set("lock:order:1001", uuid, SetParams.nx().px(30000));
if ("OK".equals(result)) {
    try {
        // ... 业务逻辑
    } finally {
        // EVAL unlock.lua 1 lock:order:1001 uuid-A
        jedis.eval(UNLOCK_LUA, 1, lockKey, uuid);
    }
}
\`\`\`

还剩一个洞:**锁过期但业务没执行完**(比如 GC 停顿 40 秒)。这就引出续期问题。

## 第三版(终版):Redisson 看门狗

Redisson 把以上全部封装,并自动续期:

\`\`\`java
RLock lock = redisson.getLock("lock:order:1001");
try {
    // 不传 leaseTime → 启用看门狗(watch dog)
    boolean locked = lock.tryLock(5, 30, TimeUnit.SECONDS);
    //                  ↑ waitTime  ↑ leaseTime(传了就看门狗失效)
    if (locked) {
        // ... 业务
    }
} finally {
    lock.unlock();     // 底层仍是 Lua 校验 uuid + DEL
}
\`\`\`

**看门狗机制**:不指定 leaseTime 时默认锁 30 秒,后台线程每 **10 秒(1/3)** 检查一次,持锁线程还活着就把锁续期回 30 秒 —— 业务跑多久,锁就活多久。

> [!warn] 看门狗失效场景(高频追问)
> ① ==tryLock(0, 30, SECONDS)== 显式传了 leaseTime → 看门狗不启动;② 持锁线程死亡 → 续期停止,锁 30 秒后自然释放(这是特性不是 bug,防止死锁);③ Redis 主从切换瞬间锁丢失 → 见下面 RedLock。

## 主从切换的锁丢失与 RedLock 争议

问题:锁写在 master 上,还没同步到 slave,master 宕机,slave 晋升 —— 另一个客户端在新 master 上**又拿到了锁**,双持锁。

**RedLock(红锁)**:向 N 个独立 Redis 实例依次加锁,拿到 N/2+1 个才算成功。Martin Kleppmann 指出其依赖时钟假设,争议较大。

> [!best] 生产务实结论
> 绝大多数业务:==**Redisson 单实例 + 看门狗 + 业务幂等兜底**== 已经足够。真正不可容忍双持锁的(如资金扣减):换 **ZooKeeper/etcd**(CP 系统)或数据库乐观锁版本号。这个"分场景选型"的回答比死磕 RedLock 加分得多。

## 完整实战:防超卖(可直接搬进项目)

\`\`\`java
public class StockService {
    public boolean deductStock(String productId) {
        String lockKey = "lock:stock:" + productId;
        RLock lock = redisson.getLock(lockKey);
        try {
            if (!lock.tryLock(3, TimeUnit.SECONDS)) {
                return false;                        // 抢锁失败,快速失败
            }
            int stock = db.getStock(productId);
            if (stock <= 0) return false;
            db.updateStock(productId, stock - 1);    // 拿到锁再查再扣
            return true;
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return false;
        } finally {
            if (lock.isHeldByCurrentThread()) {      // 防止抛异常时 unlock 报错
                lock.unlock();
            }
        }
    }
}
\`\`\`

> [!pitfall] isHeldByCurrentThread 不是可有可无
> tryLock 超时抛 InterruptedException 时,当前线程可能根本没持有锁,直接 unlock 会抛 ==IllegalMonitorStateException==。先用 ==isHeldByCurrentThread()== 判断是标准防御性写法。

## 面试速记

- 加锁演进:SETNX+EXPIRE 非原子 → SET NX PX 原子加锁 → Lua 原子解锁 → Redisson 看门狗自动续期。
- 误删锁:锁值存 uuid,解锁 Lua 判断是自己的才删。
- 看门狗:默认 30s,每 10s 续期;显式传 leaseTime 即失效。
- 双持锁兜底:业务幂等 / ZK / 数据库版本号,RedLock 有争议慎用。
`,
      },
      /* ─────────────────────────────────────────── */
      {
        id: 'ch07',
        title: '主从复制 · 哨兵 · 集群',
        minutes: 30,
        points: ['全量+增量复制', '哨兵选主', '16384槽位', 'MOVED重定向'],
        content: `
> [!interview] 章节定位
> 高可用三件套,面试问法通常是"单机 Redis 挂了怎么办" → "主从延迟怎么处理" → "集群为什么是 16384 个槽"。按**可用性逐级升级**的思路讲:主从(读扩展+备份)→ 哨兵(自动故障转移)→ 集群(数据分片)。

> [!info] 本章导读 · Redis 挂了,你的登录功能还能用吗?
> 单机 Redis 是一座独木桥,机器一停,所有依赖它的接口一起报错。高可用不是简单多部署几台,而是复制、选主、分片三件事的组合。本章按可用性逐级升级的顺序,把主从、哨兵、集群串成一条线。
> - 读完本章你将能:画出全量同步与增量同步的完整流程
> - 说清哨兵判定下线、选举 leader、挑选新主的三步
> - 解释 16384 个槽的由来,并用 hash tag 解决跨槽报错

> [!tip] 日常电脑现场 · 云备份与异地容灾
> 手机照片自动传到云端,原机摔坏换新机,登录账号照片全回来,因为数据不止存了一份。公司的服务器同样把主库放在一个机房、副本放在另一个机房,一个机房断电,业务切过去继续跑。副本越多越放心,代价是每次写入都要多等几份确认。

## 主从复制:第一次同步发生了什么

\`\`\`shell
# 5 分钟搭一套主从(面试可演示的实操)
redis-server --port 6380 --replicaof 127.0.0.1 6379
redis-cli -p 6379 set k1 v1
redis-cli -p 6380 get k1
\`\`\`

\`\`\`output
OK
"v1"
\`\`\`

**全量同步**(第一次连接):

\`\`\`text
从库                          主库
 │── PSYNC ? -1 ─────────────>│  (我不知道主库的复制ID,请给我全量)
 │<───── +FULLRESYNC id off ──│
 │<───── RDB 快照 ────────────│  (主库 bgsave,同样的 fork+COW)
 │───── PSYNC id off ────────>│  (之后走增量)
 │<───── 复制缓冲区增量命令 ────│
\`\`\`

**增量同步**(断线重连):从库带着上次的 ==offset== 回来。主库有个**环形缓冲区 repl_backlog**(默认 1MB),offset 还在缓冲区内 → 只补增量;被覆盖了 → 退化全量。

> [!warn] repl_backlog 调大
> 主从之间网络抖动超过缓冲区容量,重连就触发全量 RDB,大实例代价极高。生产配置 ==repl-backlog-size 64mb== 起步,按断线时长评估。

主从延迟的应对:读 写分离时接受毫秒级延迟;强一致读走主库;用 ==WAIT 1 2000== 等待至少 1 个从库确认(慎用,阻塞)。

## 哨兵(Sentinel):自动故障转移

\`\`\`diagram:d-sentinel
\`\`\`

哨兵集群像主库身边的"值班护士团":每人每秒查一次心跳,多数护士都说"主库没反应"才拉响警报(客观下线),然后内部推选一位护士长执行手术 —— 按优先级和数据完整度挑一个从库上位,再通知所有客户端"换主了"。

哨兵是独立进程集群(≥3 台,奇数),三件事:

- **监控**:每秒 ping 主从与同伴。
- **判定**:1 个哨兵说主库挂了 = 主观下线(SDOWN);≥ quorum 个哨兵都认为挂了 = 客观下线(ODOWN)。
- **选举与切换**:哨兵之间 Raft 式选出一个 leader 执行切换。

**从库晋升的打分规则**(分数高者胜):

\`\`\`text
优先级 replica-priority 高 > 复制 offset 最大(数据最全)> runid 字典序最小
\`\`\`

客户端怎么感知新主库?哨兵提供发布订阅 ==+switch-master== 频道,客户端库(Jedis/Lettuce)自动订阅并刷新连接。

## Cluster 集群:数据分片

主从解决"挂了怎么办",没解决"内存不够怎么办"。Cluster 把数据切到多个主节点:

- 槽位:0~16383 共 **16384 个槽**,==slot = CRC16(key) mod 16384==。
- 每个主节点负责一段槽;节点间 Gossip 协议交换状态。
- 客户端访问非本节点的 key → 返回 ==MOVED 3999 ip:port== 重定向;智能客户端本地缓存槽位表直连。
- 迁移中的 key:源节点返回 ==ASK 3999 ip:port==,客户端要带 ==ASKING== 再问一次目标节点(一次性重定向,不更新槽位表);MOVED 是永久重定向,ASK 是临时指路 —— 这是两者的本质区别。

\`\`\`shell
# 5.0+ 一条命令起 6 节点集群(3主3从)
redis-cli --cluster create 127.0.0.1:7001 127.0.0.1:7002 127.0.0.1:7003 \
  127.0.0.1:7004 127.0.0.1:7005 127.0.0.1:7006 --cluster-replicas 1
redis-cli -c -p 7001 set user:1001 "zhen"     # -c 支持自动重定向
\`\`\`

\`\`\`output
>>> Performing hash slots allocation on 6 nodes...
Master[0] -> Slots 0 - 5460
Master[1] -> Slots 5461 - 10922
Master[2] -> Slots 10923 - 16383
OK
127.0.0.1:7001> set user:1001 zhen
-> Redirected to slot [4837] located at 127.0.0.1:7002
OK
\`\`\`

> [!interview] 为什么是 16384 个槽而不是 65536?
> 作者 antirez 的原话有三点:① CRC16 会产生 16384 内的模数分布足够均匀;② **心跳包携带槽位表,16384 的 bitmap 只有 2KB**,65536 要 8KB,心跳太浪费带宽;③ 官方建议集群不超过 1000 个主节点,16384 个槽足够分配。背这一段是硬通货。

**mget/mset 的坑**:key 落在不同槽,集群模式下报 ==CROSSSLOT== 错误。解法:==hash tag== —— 用花括号强制同槽:==user:1001:{order}== 与 ==user:1002:{order}== 永远同槽。

## 三件套对比总结

| 维度 | 主从 | 哨兵 | Cluster |
| --- | --- | --- | --- |
| 解决什么 | 读扩展 + 数据备份 | 自动故障转移 | 容量横向扩展 |
| 数据分布 | 每个节点全量 | 每个节点全量 | 分片,每节点只有一部分 |
| 写扩展 | 不支持 | 不支持 | 多主同时写 |
| 故障转移 | 手动 | 自动(哨兵选主) | 自动(节点间投票) |
| 客户端感知 | 改配置 | 订阅 +switch-master | MOVED 重定向 |
| 复杂度 | 低 | 中 | 高(多 key 命令受限) |

选型一句话:**要备份选主从,要自动切换加哨兵,要容量上集群**。生产常见组合是"哨兵保高可用 + 客户端分片",或者直接上 Cluster;但 Cluster 下 mget/事务/多 key 脚本都会受槽位限制,迁移前先评估。

## Spring Boot 下的哨兵与集群配置

原理讲完,落地就是几行配置。Spring Boot 3 的属性前缀是 ==spring.data.redis==(Boot 2 是 ==spring.redis==),哨兵和集群**二选一**,不要同时配。

### 哨兵:客户端问哨兵要主库地址

\`\`\`yml
# application-sentinel.yml
spring:
  data:
    redis:
      password: Redis@2026
      timeout: 2s
      lettuce:
        pool:
          max-active: 16
          max-idle: 8
          min-idle: 2
          max-wait: 1s
        shutdown-timeout: 100ms
      sentinel:
        master: mymaster          # 与 sentinel.conf 的 sentinel monitor 名字一致
        nodes: 127.0.0.1:26379,127.0.0.1:26380,127.0.0.1:26381
        password: Sentinel@2026   # 哨兵自身开了 requirepass 才需要
\`\`\`

客户端启动时向任意一个哨兵执行 ==SENTINEL get-master-addr-by-name mymaster==,拿到当前主库地址;主库切换后 Lettuce 订阅 ==+switch-master== 自动重连,业务无感。

\`\`\`output
SENTINEL get-master-addr-by-name mymaster  =>  1) "127.0.0.1"  2) "6379"
INFO replication (在主库上执行)             =>  role:master
\`\`\`

### 集群:节点列表 + 槽位重定向

\`\`\`yml
# application-cluster.yml
spring:
  data:
    redis:
      password: Redis@2026
      timeout: 2s
      cluster:
        nodes:
          - 127.0.0.1:7001
          - 127.0.0.1:7002
          - 127.0.0.1:7003
          - 127.0.0.1:7004
          - 127.0.0.1:7005
          - 127.0.0.1:7006
        max-redirects: 3       # 最多跟随几次 MOVED/ASK
      lettuce:
        pool:
          max-active: 16
          max-idle: 8
          min-idle: 2
\`\`\`

节点列表不用写全,给几个种子节点即可:客户端通过 ==CLUSTER SLOTS== 拿到完整拓扑并缓存,节点变更时自动刷新。集群模式下 ==mget/mset== 的 key 必须同槽,否则报 ==CROSSSLOT==,用 hash tag 解决。

### Lettuce 连接池:共享连接才是常态

| 参数 | 默认 | 作用 | 建议 |
| --- | --- | --- | --- |
| max-active | 8 | 池中最大连接数 | 16~32 足够,别按 QPS 线性放大 |
| max-idle | 8 | 最大空闲连接 | 与 max-active 接近 |
| min-idle | 0 | 最小空闲连接 | 2~4,避免冷启动抖动 |
| max-wait | -1 | 拿连接的等待时间 | 设 1s,快速失败 |
| timeout | 无 | 命令超时 | 2s 左右,别配 0(无限等) |
| shareNativeConnection | true | 普通命令共用一条 native 连接 | **保持 true** |

关键认知:**Lettuce 是非阻塞客户端,普通 GET/SET 共用一条 native 连接**(Netty channel 多路复用),连接池只在事务(MULTI/EXEC)、阻塞命令(BLPOP)等场景才真正取连接。所以 ==max-active== 调大并不会提升普通读写吞吐,反而增加服务端连接数。==shareNativeConnection== 是 ==LettuceConnectionFactory== 的属性,不是 yml 里的 pool 参数;要用 pool,记得引 ==commons-pool2== 依赖,否则 pool 配置被静默忽略。

### 读写分离:客户端一行指定

\`\`\`java
import io.lettuce.core.ReadFrom;
import org.springframework.boot.autoconfigure.data.redis.LettuceClientConfigurationBuilderCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class LettuceReadFromConfig {

    @Bean
    public LettuceClientConfigurationBuilderCustomizer readFromReplica() {
        // 优先读从库,从库不可用时回退主库;哨兵/集群模式都生效
        return builder -> builder.readFrom(ReadFrom.REPLICA_PREFERRED);
    }
}
\`\`\`

==ReadFrom.REPLICA_PREFERRED== 只对**非事务、非阻塞**命令生效,写命令永远走主库。业务上要接受主从延迟,强一致读仍应显式走主库(或干脆不配 ReadFrom)。

> [!warn] 三个常见配置坑
> ① Boot 2 的属性是 ==spring.redis.*==,Boot 3 改成 ==spring.data.redis.*==,混用会导致配置不生效;② 哨兵和集群不要同时配:同时存在时 Boot 会优先走哨兵,集群配置被忽略,极易误判;③ 只写了 pool 却没引 ==commons-pool2==,池参数不会生效。

## 面试速记

- 首次同步:PSYNC → FULLRESYNC → RDB 全量 → 增量缓冲。
- 断线重连:offset 在 repl_backlog 内走增量,否则退化全量(调大 backlog)。
- 哨兵:主观/客观下线 → 选 leader → 从库按 优先级>offset>runid 晋升。
- 集群:CRC16 mod 16384;MOVED 重定向;hash tag 解决跨槽。
- 16384 的理由:2KB 心跳 bitmap + 1000 节点上限足够。
`,
      },
      /* ─────────────────────────────────────────── */
      {
        id: 'ch08',
        title: '过期删除 · 内存淘汰 · 工程实战',
        minutes: 30,
        points: ['惰性+定期删除', '8种淘汰策略', 'LRU/LFU', '项目应用'],
        content: `
> [!interview] 章节定位
> 收尾章,两个独立高频考点:① "Redis 怎么删除过期 key?为什么不是到点就删?" ② "内存满了淘汰谁?8 种策略背一下。"最后把全部知识与你的简历项目串成一条线。

> [!info] 本章导读 · key 明明设了过期,内存怎么还是满了?
> 设过期时间和真正删除是两件事,没人访问的过期 key 会安静地占着内存,像冰箱里没人清理的过期牛奶。等内存到上限,Redis 还要决定牺牲谁。本章讲清这两道防线,再把前面所有知识落回你的项目与简历。
> - 读完本章你将能:复述惰性删除与定期删除的配合方式
> - 根据业务在 8 种淘汰策略里选对一种,并说出理由
> - 把简历里的令牌缓存、聊天记录缓存讲成一套有原理支撑的方案

> [!tip] 日常电脑现场 · 清理缓存像清冰箱
> 手机提示存储空间不足,你进设置点清理缓存,一下空出好几个 G,那些都是早就没人看的临时文件。冰箱里过期的东西不主动扔,新买的菜就塞不进去。Redis 的过期删除和内存淘汰,就是这两件事的合体。

## 过期 key 的删除策略

为什么不"到点立即删"?给每个 key 挂定时器,海量短过期 key 会耗尽 CPU。Redis 采用 **惰性删除 + 定期删除** 的组合:

- **惰性删除**:访问 key 时检查是否过期,过期才删。对 CPU 友好,但没人访问的过期 key 会一直占内存。
- **定期删除**:每 100ms 抽样检查 —— 每次从设置了过期的 key 中**随机抽 20 个**,删除其中过期的;若过期比例 > 25%,重复抽样。靠概率控制 CPU 与内存的平衡。

\`\`\`shell
# 观察一个 key 的过期相关元数据
redis-cli SET temp "x" PX 5000
redis-cli PTTL temp
\`\`\`

\`\`\`output
OK
4972    # 剩余毫秒
-2      # 5秒后再查:key不存在(已被惰性删除),-2=不存在
\`\`\`

漏网之鱼兜底:还有一批"既过期又没人访问"的 key,最终靠**内存满时的淘汰策略**清理。

## 8 种内存淘汰策略

==maxmemory== 达到上限时触发。==maxmemory-policy== 八选一:

| 策略 | 淘汰范围 | 说明 |
| --- | --- | --- |
| noeviction(默认) | 不淘汰 | 写入报错 OOM |
| allkeys-lru | 全部 key | **近似 LRU,最常用** |
| volatile-lru | 仅设了过期时间的 | 混合场景 |
| allkeys-lfu | 全部 | **4.0+ 最不常访问频率计数淘汰** |
| volatile-lfu | 仅设过期 | 同上 |
| allkeys-random | 全部随机 | 演示用 |
| volatile-random | 设过期随机 | 演示用 |
| volatile-ttl | 仅设过期 | 越早过期越先淘汰 |

> [!tip] Redis 的 LRU 是"近似 LRU"
> 真 LRU 需要双向链表全局排序(额外内存)。Redis 的做法:每个 RedisObject 记录 24bit 的**最近访问时钟**,淘汰时**随机抽 5 个(maxmemory-samples)**,淘汰其中最久未访问的 —— 内存零额外开销,精度略降。3.0 加了**候选池**(16 个元素的池)提升精度。LFU 用同样的 24bit 存"频率计数"(对数递增 + 随时间衰减)。

## 工程实战:把 Redis 知识串进你的简历

你简历里写了"利用 Redis 存储令牌与聊天记录缓存",逐条对照本章知识:

| 简历点 | 用到的知识 | 面试深挖方向 |
| --- | --- | --- |
| JWT 令牌存储 | String + NX + 过期(第2、9章) | 登出即删 = Cache Aside;TTL 是唯一防线 |
| 聊天记录缓存 | List(LPUSH+LRANGE)或 ZSet | 大 List 分页读;热度衰减 → LFU |
| 登录安全 | 分布式锁防重复登录风暴(第7章) | 看门狗续期 |
| 缓存预热 | 上线灌热点数据(第5章) | 逻辑过期方案 |

\`\`\`java
/** 聊天记录缓存:ZSet 按时间戳排序,天然支持分页与去重(同一条消息幂等) */
public class ChatCacheService {
    public void saveMessage(long roomId, long msgId, String content) {
        try (Jedis jedis = new Jedis("127.0.0.1", 6379)) {
            String key = "chat:room:" + roomId;
            // score = 消息时间戳毫秒,member = msgId:content
            jedis.zadd(key, msgId, msgId + ":" + content);
            jedis.zremrangeByRank(key, 0, -201);          // 只留最近200条
            jedis.expire(key, 3600);                       // 1小时过期兜底
        }
    }

    public java.util.List<String> loadRecent(long roomId, int page, int size) {
        try (Jedis jedis = new Jedis("127.0.0.1", 6379)) {
            String key = "chat:room:" + roomId;
            // 第1页取最新50条:倒序 [0,49]
            long end = -(long) page * size;
            long start = end - size + 1;
            return new java.util.ArrayList<>(jedis.zrevrange(key, Math.max(start, 0), end));
        }
    }
}
\`\`\`

\`\`\`output
saveMessage(1, 100001, "你好")
loadRecent(1, 1, 2)  =>  [100001:你好]      # 最新在前
loadRecent(1, 2, 2)  =>  []                  # 只有1条,第2页为空
\`\`\`

> [!best] 三个生产习惯(说出口就是加分)
> ① 所有 SET 带过期时间,防内存泄漏;② 禁用 KEYS *,扫描用 ==SCAN== 游标分批;③ 值对象控制大小,超过 10KB 考虑拆分或压缩。

## 热 key·慢日志·SCAN 与分布式 Session

### 热 key:单分片的隐形炸弹

雪崩是"一片 key 同时失效",热 key 是**某一个 key 被千万 QPS 集中访问** —— 集群模式下它只会落在单个分片,把那台机器的网卡/CPU 打满。

**发现手段**(生产三件套):

\`\`\`shell
redis-cli --hotkeys                     # 4.0+,需开启 LFU 淘汰策略
redis-cli config set lfu-max-death 10   # 抽样统计
redis-cli monitor | head -1000          # 线上慎用(自阻塞+泄密风险)
\`\`\`

\`\`\`output
hot key found 'seckill:1001' with score 98231
1) "seckill:1001"
2) (integer) 98231
\`\`\`

**处理三板斧**:① 本地缓存挡住(LFU 的 Caffeine,热 key 值变更少时最优);② key 加随机后缀拆片(==stock:1001:{0..9}== 读时随机取一个);③ 读写分离让从库分流读。

> [!interview] 一句话区分
> 大 key 是"值太大,处理慢";热 key 是"访问太集中,单点顶不住"。大 key 治理靠拆值/异步删,热 key 治理靠本地缓存+分片,别答串。

### 慢日志:找出拖垮单线程的元凶

\`\`\`shell
redis-cli config set slowlog-log-slower-than 10000   # 超 10ms 记录
redis-cli config set slowlog-max-len 256
redis-cli slowlog get 2
\`\`\`

\`\`\`output
1) 1) (integer) 14                      # 日志序号
   2) (integer) 1731562800              # 时间戳
   3) (integer) 45231                   # 耗时(微秒)—— 45ms!
   4) 1) "HGETALL"                      # 元凶:大 hash 全量读
      2) "user:profile:1001"
   5) "127.0.0.1:53210"
   6) "cli-admin"
\`\`\`

排查顺序永远是:==slowlog get== → 看第 4 项命令 → 配合 ==MEMORY USAGE key== 判断大 key。

### SCAN:生产环境唯一合法的遍历

KEYS * 是 O(n) 全量阻塞,单线程模型下等于"自断服务"。SCAN 用**游标分批**,每次只扫一小段:

\`\`\`java
ScanResult<String> r;
String cursor = "0";
int total = 0;
do {
    r = jedis.scan(cursor, new ScanParams().match("product:*").count(200));
    for (String key : r.getResult()) {
        // 每批 200 个左右,count 只是提示值,不是精确数
        total++;
    }
    cursor = r.getCursor();
} while (!"0".equals(cursor));
System.out.println("遍历完成,共 " + total + " 个 key,全程无阻塞");
\`\`\`

\`\`\`output
遍历完成,共 18342 个 key,全程无阻塞
\`\`\`

### 内存碎片:mem_fragmentation_ratio

\`\`\`shell
redis-cli info memory | grep -E "fragmentation|used"
\`\`\`

\`\`\`output
used_memory_human:2.31G
mem_fragmentation_ratio:1.62    # >1.5 = 碎片严重(3.8G 物理内存只存了 2.3G 数据)
\`\`\`

判读:略大于 1 正常;**超过 1.5** 说明碎片多(大量增删改后常见);小于 1 说明用了 swap(危险!)。4.0+ 开启 ==activedefrag yes== 主动整理,或低峰重启回收。

### 分布式 Session:串回你的简历项目

你简历的"令牌存 Redis"就是分布式 Session 的手写实现。两条技术路线:

\`\`\`java
/** 路线一:Spring Session(透明替换 HttpSession,业务零改动) */
// 依赖:spring-boot-starter-data-redis + spring-session-data-redis
// 配置后所有 @SessionOperations 自动落到 Redis,多实例天然共享
@GetMapping("/profile")
public Map<String, Object> profile(HttpSession session) {
    // 这个 session 的数据实际存在 Redis 里,任意一台机器都能读到
    return Map.of("userId", session.getAttribute("userId"));
}
\`\`\`

\`\`\`java
/** 路线二:手写 token(你项目实际采用的),拦截器统一校验 */
public class AuthInterceptor implements HandlerInterceptor {
    public boolean preHandle(HttpServletRequest req, HttpServletResponse resp, Object h) {
        String token = req.getHeader("Authorization");
        if (token == null) throw new AuthException("未登录");
        // 令牌校验直接查 Redis:O(1),并顺手续期(滑动过期)
        String userId = redis.get("token:" + token);
        if (userId == null) throw new AuthException("登录已过期");
        redis.expire("token:" + token, 7200);       // 活跃用户自动续 2 小时
        req.setAttribute("userId", userId);
        return true;
    }
}
\`\`\`

\`\`\`output
POST /login {username, password} → 200 {"token":"e8f3a1..."}
GET /profile  Authorization: e8f3a1... → 200 {"userId":1001}   (Redis 校验 0.4ms)
GET /profile  Authorization: 过期token → 401 {"msg":"登录已过期"}
\`\`\`

> [!best] 简历深挖点
> 面试官问"为什么不用 JWT 而要存 Redis?"答:**JWT 无状态但无法主动失效**(登出/踢人做不到),令牌存 Redis 让服务端掌握会话生命周期 —— 登出即 DEL,改密即 DEL 全端下线;TTL 滑动过期兼顾体验与安全。这一问是你项目的必考题。

## Spring Boot 集成:RedisTemplate 与序列化坑

Java 项目里 90% 的"Redis 里怎么是一堆乱码"都出在序列化器上。这一节把连接工厂、两个 Template、三种序列化器串起来,最后给出可直接抄的 RedisConfig。

### 全家桶:ConnectionFactory 与两个 Template

| 组件 | 作用 | 说明 |
| --- | --- | --- |
| RedisConnectionFactory | 创建 Redis 连接 | Boot 默认 Lettuce;引 Jedis 依赖并排除 Lettuce 则用 Jedis |
| RedisTemplate<K,V> | 通用模板 | 默认 JdkSerializationRedisSerializer,key 和 value 都走 JDK 序列化 |
| StringRedisTemplate | 字符串模板 | key/value 都用 StringRedisSerializer,等价于 redis-cli 里的样子 |
| opsForXxx() | 类型操作入口 | opsForValue / opsForHash / opsForList / opsForSet / opsForZSet |

\`\`\`xml
<!-- Spring Boot 3:spring-boot-starter-data-redis 默认带 Lettuce -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-redis</artifactId>
</dependency>
<!-- LocalDateTime 序列化必需;Boot 的 Jackson 自动配置里已含,显式声明更稳 -->
<dependency>
    <groupId>com.fasterxml.jackson.datatype</groupId>
    <artifactId>jackson-datatype-jsr310</artifactId>
</dependency>
\`\`\`

| 维度 | RedisTemplate | StringRedisTemplate |
| --- | --- | --- |
| 泛型 | RedisTemplate<String,Object> | StringRedisTemplate(值只能是 String) |
| 默认序列化 | JDK 序列化(二进制) | String 序列化(可读) |
| redis-cli 可读性 | 乱码,key 带 \\xac\\xed 前缀 | 完全可读 |
| 适用 | 存对象(需自定义序列化器) | 存 JSON 字符串、计数器、简单 KV |

### 序列化器:三种选择与各自的坑

| 序列化器 | 输出 | 优点 | 坑 |
| --- | --- | --- | --- |
| JdkSerializationRedisSerializer | 二进制,不可读 | 零配置,能存任意 Serializable | key 乱码、跨语言不可用、体积大、反序列化有安全风险 |
| StringRedisSerializer | UTF-8 字符串 | 可读、轻量 | 只能存 String,存对象要自己转 JSON |
| GenericJackson2JsonRedisSerializer | JSON + @class 类型信息 | 可读,能还原对象类型 | 默认不带 JavaTimeModule,LocalDateTime 直接炸 |
| Jackson2JsonRedisSerializer<T> | 纯 JSON,无类型信息 | 体积小 | 泛型固定,反序列化需指定类型,不适合 Object |

==RedisTemplate== 默认的 JDK 序列化会把 String key 也序列化成一串二进制,于是出现:

\`\`\`output
# RedisTemplate 直接存 user:1(默认 JDK 序列化)
127.0.0.1:6379> KEYS *
1) "\\xac\\xed\\x00\\x05t\\x00\\x06user:1"
127.0.0.1:6379> TTL "\\xac\\xed\\x00\\x05t\\x00\\x06user:1"
(integer) 1798
\`\`\`

运维用 ==SCAN MATCH user:*== 根本扫不到,跨语言客户端也读不了。修法:**key 与 hashKey 用 StringRedisSerializer,value 用 JSON**。

### 可直接抄的 RedisConfig

\`\`\`java
package com.example.config;

import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.databind.jsontype.impl.LaissezFaireSubTypeValidator;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.fasterxml.jackson.datatype.jsr310.deser.LocalDateTimeDeserializer;
import com.fasterxml.jackson.datatype.jsr310.ser.LocalDateTimeSerializer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.StringRedisSerializer;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Configuration
public class RedisConfig {

    private static final DateTimeFormatter DATE_TIME =
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    @Bean
    public RedisTemplate<String, Object> redisTemplate(RedisConnectionFactory factory) {
        RedisTemplate<String, Object> template = new RedisTemplate<>();
        template.setConnectionFactory(factory);

        ObjectMapper mapper = new ObjectMapper();
        // 1. Java 8 时间类型:LocalDateTime 按 yyyy-MM-dd HH:mm:ss 读写
        JavaTimeModule timeModule = new JavaTimeModule();
        timeModule.addSerializer(LocalDateTime.class, new LocalDateTimeSerializer(DATE_TIME));
        timeModule.addDeserializer(LocalDateTime.class, new LocalDateTimeDeserializer(DATE_TIME));
        mapper.registerModule(timeModule);
        mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

        // 2. 写入 @class 类型信息,反序列化才能还原成 User 而不是 LinkedHashMap
        mapper.activateDefaultTyping(LaissezFaireSubTypeValidator.instance,
                ObjectMapper.DefaultTyping.NON_FINAL, JsonTypeInfo.As.PROPERTY);

        GenericJackson2JsonRedisSerializer json = new GenericJackson2JsonRedisSerializer(mapper);
        StringRedisSerializer string = new StringRedisSerializer();

        template.setKeySerializer(string);
        template.setHashKeySerializer(string);
        template.setValueSerializer(json);
        template.setHashValueSerializer(json);
        template.afterPropertiesSet();
        return template;
    }
}
\`\`\`

### 用起来:存对象与读回来

\`\`\`java
package com.example.domain;

import java.io.Serializable;
import java.time.LocalDateTime;

public class User implements Serializable {
    private static final long serialVersionUID = 1L;
    private Long id;
    private String name;
    private LocalDateTime createTime;

    public User() {
    }

    public User(Long id, String name, LocalDateTime createTime) {
        this.id = id;
        this.name = name;
        this.createTime = createTime;
    }
    // getter / setter 省略
}
\`\`\`

\`\`\`java
package com.example.service;

import com.example.domain.User;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;

@Service
public class UserCacheService {

    private final RedisTemplate<String, Object> redisTemplate;

    public UserCacheService(RedisTemplate<String, Object> redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    public void cache(User user) {
        String key = "user:" + user.getId();
        // key 走 String 序列化,value 走 JSON 序列化
        redisTemplate.opsForValue().set(key, user, Duration.ofMinutes(30));
    }

    public User get(long id) {
        Object value = redisTemplate.opsForValue().get("user:" + id);
        return value == null ? null : (User) value;
    }
}
\`\`\`

\`\`\`output
# 配置好 RedisConfig 之后,redis-cli 里看到的样子
127.0.0.1:6379> KEYS user:*
1) "user:1"
127.0.0.1:6379> GET user:1
"{\\"@class\\":\\"com.example.User\\",\\"id\\":1,\\"name\\":\\"zhen\\",\\"createTime\\":\\"2026-11-14 10:30:00\\"}"
\`\`\`

value 里多了 ==@class==,这是反序列化还原类型的依据;代价是每个对象多存一段类名。如果不想要类型信息,改用 ==Jackson2JsonRedisSerializer<User>== 并把类型写死。

> [!pitfall] LocalDateTime 的两个连环坑
> ① 用 ==new ObjectMapper()== 且不注册 JavaTimeModule,序列化直接抛:
> ==SerializationException: Could not write JSON: Java 8 date/time type java.time.LocalDateTime not supported by default==。补 ==jackson-datatype-jsr310== 并注册模块即可。
> ② 直接注入 Boot 的 ==ObjectMapper== 给 ==GenericJackson2JsonRedisSerializer==:Boot 的 mapper 默认**没有开启 default typing**,写进去的 JSON 没有 @class,读出来是 LinkedHashMap,强转 User 时抛 ==ClassCastException==。要么自己 new 并显式开启,要么 copy 一份再开启。

> [!best] 序列化选型一句话
> 纯字符串业务(令牌、计数器)用 ==StringRedisTemplate==;存对象用 ==RedisTemplate<String,Object> + GenericJackson2JsonRedisSerializer==,key 必须 String 序列化。永远不要用默认的 JDK 序列化跑生产:不可读、跨语言不通、还容易在反序列化时被利用。

## 面试速记

- 过期删除 = 惰性(访问时)+ 定期(每100ms随机抽20个,过期率>25%继续)。
- 生产策略:缓存场景 ==allkeys-lru==,混合场景 ==volatile-lru==;热点保活用 LFU。
- Redis LRU 是抽样近似(5个样本+16候选池),不是链表全局 LRU。
- 收尾话术:把简历里每个 Redis 点位都能对应到一章原理,= "知其所以然"。
`
      }
    ],
    interview: [
      { q: 'Redis 为什么快?', a: '四点:**纯内存操作**(读内存约100ns,比磁盘快千倍)、**高效数据结构**(SDS/跳表/listpack 专为内存设计)、**单线程执行无锁无切换**(命令执行单线程,无并发冲突与上下文切换)、**IO 多路复用**(epoll 一个线程管理大量连接)。注意补充:6.0 后网络 IO 可多线程,但命令执行仍单线程。' },
      { q: 'String 类型的底层实现?为什么小于 44 字节用 embstr?', a: 'SDS 动态字符串(len/free/buf 三字段)。≤44 字节时 RedisObject 头与 SDS **一次性分配在同一块连续内存**(embstr),一次 malloc、CPU 缓存友好;44 = 64 字节缓存行 - RedisObject 头 20 字节 - SDS 头 3 字节。超过则 raw 编码两次分配。' },
      { q: 'ZSet 为什么用跳表不用红黑树?', a: '① **范围查询**:跳表定位起点后沿底层链表顺序遍历,红黑树要复杂的中序遍历;② **实现简单**:增删只改前后指针,红黑树需要旋转变色;③ **天然平衡**:随机层数(p=0.25)概率均衡,无需强制维护平衡。期望复杂度都是 O(log n),但工程上跳表更好写更好调。' },
      { q: 'RDB 和 AOF 的区别与选型?', a: 'RDB 是**某时刻全量二进制快照**,bgsave 用 fork+COW 实现,恢复快但可能丢分钟级数据;AOF 是**写命令追加日志**,always/everysec/no 三档刷盘,丢数据少但文件大、恢复慢,靠重写瘦身。选型:纯缓存只开 RDB 或不开;数据重要用 AOF everysec + 4.0 混合持久化(RDB 前导 + AOF 增量)。' },
      { q: 'bgsave 会阻塞主线程吗?fork 有什么代价?', a: '只在 fork 瞬间阻塞(毫秒级)。fork 代价:① **复制页表**,GB 级实例页表几十 MB,fork 会卡顿;② **写时复制内存风险**:bgsave 期间大量写请求会复制被改的内存页,极端时接近翻倍内存。所以大实例要控制 RDB/AOF 重写频率。' },
      { q: '缓存穿透、击穿、雪崩的区别与解决方案?', a: '**穿透**:查不存在的数据,每次都打到 DB → 布隆过滤器 + 缓存空值 + 参数校验。**击穿**:单个热点 key 过期瞬间高并发打到 DB → 互斥锁(强一致)或逻辑过期(高可用)。**雪崩**:大量 key 同时失效或实例宕机 → TTL 加随机值打散 + 多级缓存 + 哨兵/集群高可用 + 限流降级兜底。' },
      { q: '为什么是"先更新数据库,再删除缓存"?为什么删而不是更新?', a: '先删后更会存在"读线程在间隙回填旧值"的长期脏数据;先更后删的不一致窗口极小(毫秒级且可用 TTL 兜底)。用**删除**而非更新:并发写乱序更新会永久脏;写多读少时更新浪费;删除是惰性加载、幂等、简单。强一致场景不用缓存。' },
      { q: '分布式锁怎么实现?有哪些坑?', a: '演进:**SETNX+EXPIRE 非原子**(宕机死锁)→ **SET key uuid NX PX 30000** 一条命令原子加锁 → **Lua 脚本校验 uuid 再 DEL** 防误删 → **Redisson 看门狗**自动续期(默认30s,每10s续)。坑:主从切换瞬间锁丢失(RedLock 有争议,生产用业务幂等兜底或换 ZK);unlock 前必须 isHeldByCurrentThread 判断。' },
      { q: 'Redisson 看门狗的原理?什么情况失效?', a: '不指定 leaseTime 加锁时,默认锁 30 秒,后台定时任务每 **1/3 超时时间(10秒)** 检查:持锁线程还活着就用 Lua 原子地把过期时间续回 30 秒,业务跑多久锁活多久。失效场景:① 显式传了 leaseTime;② 持锁线程死亡(续期停止,锁超时释放,防死锁);③ Redis 主从切换丢锁(看门狗管不了)。' },
      { q: '哨兵的工作原理?从库怎么选出来的?', a: '哨兵集群(≥3,奇数)每秒 ping 主库:单哨兵认为挂 = **主观下线**;≥quorum 个确认 = **客观下线**;哨兵间 Raft 式选举 leader 执行切换。从库打分:**replica-priority 优先级 → 复制 offset 最大(数据最全)→ runid 字典序**,高分者晋升。客户端通过订阅 +switch-master 频道感知新主。' },
      { q: 'Cluster 为什么是 16384 个槽?', a: '① CRC16(key) mod 16384 分布足够均匀;② **心跳包携带槽位表是 bitmap,16384 槽只占 2KB**,65536 槽要 8KB,浪费带宽;③ 官方建议集群 ≤1000 主节点,16384 足够。跨槽问题(mget 报 CROSSSLOT)用 hash tag {} 强制同槽解决。' },
      { q: 'Redis 怎么删除过期 key?内存满了怎么办?', a: '过期删除是**惰性 + 定期**组合:访问时检查才删(CPU 友好),每 100ms 随机抽 20 个过期候选删除、过期率>25% 就再抽(CPU/内存平衡)。内存达 maxmemory 触发**淘汰策略**八选一:生产缓存用 allkeys-lru(抽样近似 LRU,5 样本+候选池),热点保活用 allkeys-lfu,默认 noeviction 会写报错。' },
      { q: 'Redis 的 LRU 和标准 LRU 有什么区别?', a: '标准 LRU 需要双向链表全局排序,额外内存大。Redis 用 **24bit 时间戳记录最近访问 + 随机抽 5 个 key(maxmemory-samples)淘汰最久未访问的**,3.0 增加了 16 元素候选池提高精度 —— 零额外数据结构、近似效果,是典型的工程权衡。' },
      { q: '主从复制什么时候全量、什么时候增量?', a: '首次连接必然全量:从库 PSYNC ? -1,主库 bgsave 发 RDB + 复制缓冲区增量。断线重连看 offset:若 offset 还在主库的 **repl_backlog 环形缓冲区**(默认 1MB)内 → 增量同步;被覆盖 → 退化全量。生产要调大 repl-backlog-size(64mb 起步)避免网络抖动触发昂贵全量。' },
      { q: '你项目里 Redis 具体怎么用的?如果并发上来会怎么优化?', a: '(结合星薇Star简历的话术)定制系统里三处:① JWT 令牌存 String + TTL,登出删除,校验走 Redis 不查库;② 聊天记录用 List/ZSet 缓存,控制最近 N 条 + 1 小时过期;③ 热点定制模板缓存,Cache Aside 模式。优化方向:TTL 打散防雪崩、热点模板逻辑过期、库存类操作上 Redisson 分布式锁,再往上多级缓存 Caffeine + Redis。' },
      { q: '大 key 是什么?怎么发现和处理?', a: 'String >10KB,集合元素 >5000 算大 key。危害:读写慢、阻塞主线程、删除卡顿、迁移不均。发现:==redis-cli --bigkeys==(线上抽样)、RDB 离线分析工具。处理:拆分(hash 分桶、list 分段)、压缩、异步删除 ==UNLINK==、冷数据下沉。预防:写入前校验大小,值对象瘦身。' },
      { q: '亿级页面的 UV 统计用什么?为什么不用 Set?', a: '用 **HyperLogLog**。Set 精确去重要存全量成员,1 亿成员约数 GB;UV 场景允许小误差,HyperLogLog 用 16384 个 6bit 寄存器(固定 **12KB**)通过调和平均估算基数,**标准误 0.81%**,支持 PFADD/PFCOUNT/PFMERGE 多页合并。追问准备:能说出"哈希后取 14 位定位寄存器、记录最大前导零"的原理分层更佳。' },
      { q: '用 Redis 实现签到功能怎么设计?', a: '**Bitmap**:SETBIT check:月份:uid dayIndex 1,BITCOUNT 统计当月天数,BITPOS 找首次签到,BITOP AND 做"连续 N 天"判断。1 亿用户全年签到只要约 365 × 12.5MB。注意 offset 要求 id 连续,稀疏 id 先做映射;按天分 key 而不是全放一个 key,防止单 key 过大。' },
      { q: 'pipeline、MULTI/EXEC 事务、Lua 三者怎么选?', a: '**pipeline**:只省网络往返,不保证原子,适合纯批量读写(导入/批量删除);**MULTI/EXEC**:命令入队一次串行执行,期间不被插队,但不支持回滚且无法做条件逻辑;**Lua**:整体原子执行且能带 if 判断,是分布式锁解锁、限流器这类"检查+执行"场景的唯一选择。口径:要原子+逻辑选 Lua,纯批量选 pipeline,事务用得少。' },
      { q: '什么是热 key?和缓存击穿有什么区别?怎么处理?', a: '热 key 是**单个 key 被极高 QPS 集中访问**,集群模式下只落在单分片,打满该节点网卡/CPU;击穿是热点 key 过期瞬间的并发回源,本质是"miss 风暴",热 key 通常是"持续 hit 也会压垮"(读写都算)。发现:redis-cli --hotkeys、客户端埋点、MONITOR(慎用)。处理:**本地缓存(Caffeine)拦截读、key 随机后缀拆片、读写分离**;必要时业务上限流。' },
      { q: 'Redis 和 Memcached 怎么选?分布式 Session 为什么存 Redis 而不用 JWT?', a: '选型:Memcached 只有 String、多线程、无持久化,是纯 KV 缓存的极致;Redis 有丰富数据结构 + 持久化 + 哨兵/集群,新项目默认 Redis。Session:**JWT 无状态但无法主动失效**(登出、踢人、改密下线都做不到),存 Redis 让服务端掌握会话生命周期 —— 登出即 DEL 全端生效,TTL 滑动过期兼顾体验;这就是"有状态换可控性"的权衡。' },
      { q: '为什么要在数据库前面加一层缓存?本地缓存和分布式缓存怎么选?', a: '① **为什么加**:MySQL 受磁盘 IO 与连接数限制,单机 QPS 通常几千;缓存把热数据放内存,读延迟从毫秒降到微秒,用少量内存挡掉绝大多数请求。② **本地缓存**(HashMap/Caffeine):JVM 堆内,纳秒级、无网络开销;但多实例各一份、易不一致,重启即丢,只适合极热且能容忍短暂陈旧的数据。③ **分布式缓存**(Redis):全局一份、可扩容、有持久化与高可用;代价是一次网络往返,适合令牌、库存等要求全局一致的场景。④ **选型**:一致性优先选 Redis,极致读性能用本地加 Redis 两级,单机或允许不一致才只用本地。' },
      { q: 'Redis 为什么比 MySQL 快?新手最容易答漏的点是什么?', a: '① **介质不同**:Redis 数据在内存,读约 100ns;MySQL 要读磁盘页,机械盘随机读约 10ms,差几个数量级,这是根本原因。② **数据结构**:Redis 为每种类型定制 SDS、跳表、listpack,查询多为 O(1) 或 O(log n);MySQL 还要解析 SQL、生成执行计划、走 B+ 树、加锁、写日志。③ **执行模型**:Redis 命令执行是单线程,无锁竞争与线程切换,配合 epoll 多路复用扛住大量连接。④ **最易答漏**:只答内存快就停了,要补上单线程避免锁开销与 IO 多路复用,并说明 6.0 后网络 IO 可多线程、命令执行仍单线程。' },
      { q: 'RedisTemplate 的序列化坑有哪些?怎么配才不在 redis-cli 里看到乱码?', a: '**坑**:默认 JDK 序列化,key/value 全二进制、redis-cli 乱码。**修法**:key 用 String 序列化,value 用 GenericJackson2JsonRedisSerializer;存对象开 default typing,否则读成 LinkedHashMap。**时间坑**:LocalDateTime 要注册 JavaTimeModule。' },
      { q: '哨兵和集群在 Spring Boot 里怎么配?连接池要注意什么?', a: '**哨兵**:Boot 3 配 spring.data.redis.sentinel.master 与 nodes,自动重连。**集群**:配 cluster.nodes 与 max-redirects。**要点**:二者二选一;Lettuce 普通命令共享 native 连接,池只管事务/阻塞命令且需 commons-pool2;读写分离用 ReadFrom.REPLICA_PREFERRED。' },
      { q: 'Redis 7 的 Function 和 Lua 脚本有什么区别?', a: '**EVAL/EVALSHA**:脚本由客户端持有,每次传整段或 SHA,SCRIPT FLUSH 后 EVALSHA 报 NOSCRIPT;脚本不持久化。**Function(7.0)**:FUNCTION LOAD 注册命名库,持久化并随主从复制,FCALL 调用。一句话:Function 是脚本的存储过程化,适合复用;EVAL 更轻,适合一次性逻辑。' }
    ]
  };
})();
