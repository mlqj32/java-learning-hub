/* ═══════════════════════════════════════════════════════════
   模块:MySQL 数据库内核(8 章)
   ═══════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  window.CONTENT = window.CONTENT || {};

  window.CONTENT.mysql = {
    id: 'mysql',
    title: 'MySQL 数据库内核',
    en: 'MYSQL KERNEL',
    icon: 'database',
    color: '#38bdf8',
    tagline: '从第一行 SQL 到 B+ 树内核',
    description: '从零基础讲起:先学会建表、增删改查、数据类型与约束,再进入架构、索引、事务、MVCC、锁与日志的内核世界。像教材一样层层递进,B+ 树容量推导、版本链走查、死锁复现、EXPLAIN 实战都配真实输出,统一示例表前后呼应。',
    minutes: '≈ 20 小时',
    chapters: [
      /* ─────────────────────────────────────────── */
      {
        id: 'ch00',
        title: '数据库与 SQL 入门:一切从一张表说起',
        minutes: 35,
        points: ['关系模型', 'CRUD', '数据类型', '执行顺序'],
        content: `
> [!info] 本章导读 · 先讲个故事
> 你帮朋友的奶茶店用 Excel 记订单:第一天 50 单,挺好。一个月后 3000 单,麻烦来了 —— 店员 A 和 B 同时改第 88 行,谁后保存谁覆盖谁;电脑一蓝屏,今天的账全没了;老板问"这周卖得最好的三种奶茶",你筛了两小时还怕漏。**并发冲突、数据丢失、查询低效 —— 这三个痛点,正是数据库存在的理由。**
> - 读完本章你将能:独立建库建表,写出常见的增删改查
> - 分清 DDL / DML / DQL,看懂一条 SQL 的执行顺序
> - 知道金额字段为什么绝不能用 float
> - 带着一张真正有数据的表,进入下一章的索引世界

> [!tip] 日常电脑现场 · 超市收银小票
> 收银员扫一下条码,屏幕上跳出商品名、单价、数量,结完账打出一张带时间的小票,晚上再汇总成当天营业报表。数据库里的一行就是一张小票,列是商品名和金额,建表就是先把这张票的栏目定下来。

## 从 Excel 到数据库:一次必要的进化

Excel 不是不好,是它解决不了"很多人同时用 + 数据不能丢 + 查询要快"这三件事。数据库(DBMS)把这三件事做成了基础设施:

- **并发控制**:用锁和事务把"同时改同一行"变得有秩序(第 6、8 章展开)。
- **持久化**:写进磁盘 + 日志,断电也不丢(第 9 章的 redo log 就是干这个的)。
- **高效查询**:用索引把"翻 3000 行"变成"翻 3 页"(第 3 章的 B+ 树)。
- **结构化与约束**:字段类型、主键、唯一约束,让脏数据在入口就被拦下。

MySQL 是**关系型数据库(RDBMS)**,核心模型只有几个词:

| 概念 | 是什么 | 奶茶店例子 |
| --- | --- | --- |
| 表 Table | 同类数据的集合(二维表) | 订单表、用户表 |
| 行 Row | 一条记录 | 一笔订单 |
| 列 Column | 一个字段,有类型和约束 | 金额、下单时间 |
| 主键 Primary Key | 唯一标识一行的那一列 | 订单号 id |

一堆表放在一起叫**数据库(Database)**,MySQL 一台服务器可以管很多个数据库。你之后在 Java 里写的每一行 MyBatis 代码,最终都是在和这些表打交道。

## 连上 MySQL:第一步不是写代码

装好 MySQL(或用 Docker 起一个)之后,先在终端连上去,建立"手感":

\`\`\`shell
# -u 用户名,-p 表示稍后输入密码
mysql -u root -p
\`\`\`

\`\`\`output
Welcome to the MySQL monitor.  Commands end with ; or \\g.
Server version: 8.0.36 MySQL Community Server - GPL
mysql>
\`\`\`

然后创建今天要用的数据库(注意字符集):

\`\`\`sql
CREATE DATABASE IF NOT EXISTS shop DEFAULT CHARACTER SET utf8mb4;
USE shop;
SELECT VERSION();
\`\`\`

\`\`\`output
Query OK, 1 row affected (0.01 sec)
Database changed
+-----------+
| VERSION() |
+-----------+
| 8.0.36    |
+-----------+
1 row in set (0.00 sec)
\`\`\`

> [!warn] utf8 和 utf8mb4 不是一回事
> MySQL 的 ==utf8== 是"残缺版",最多 3 字节,存不了 emoji 和部分生僻字;==utf8mb4== 才是完整的 UTF-8(4 字节)。建库建表一律用 **utf8mb4**,否则用户昵称里一个 😀 就能让插入报 ==Incorrect string value==。

## SQL 的常见分类:先认清工具箱

| 分类 | 全称 | 管什么 | 代表关键字 |
| --- | --- | --- | --- |
| DDL | Data Definition Language | 定义结构(库/表/索引) | CREATE、ALTER、DROP、TRUNCATE |
| DML | Data Manipulation Language | 增删改数据 | INSERT、UPDATE、DELETE |
| DQL | Data Query Language | 查询数据 | SELECT |
| DCL | Data Control Language | 权限控制 | GRANT、REVOKE |
| TCL | Transaction Control Language | 事务控制 | COMMIT、ROLLBACK、SAVEPOINT |

> [!interview] 顺手一个笔试常客
> "DELETE、TRUNCATE、DROP 有什么区别?" 记住三层:**DELETE 是 DML**,逐行删、可加 WHERE、可回滚(事务内)、会触发触发器;**TRUNCATE 是 DDL**,清空整表、不可加 WHERE、隐式提交不可回滚、速度更快;**DROP 连表结构一起删**。回答时按"数据/结构/事务/速度"四维对比,条理满分。

## 第一张表:设计 users

建表本质是三件事:**定字段名、定类型、定约束**。先看一个能直接用的版本:

\`\`\`sql
CREATE TABLE users (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '用户ID',
  username    VARCHAR(32)  NOT NULL UNIQUE COMMENT '用户名',
  phone       CHAR(11)     DEFAULT NULL COMMENT '手机号',
  balance     DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT '余额(元)',
  status      TINYINT      NOT NULL DEFAULT 1 COMMENT '1正常 0禁用',
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '注册时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';
\`\`\`

\`\`\`output
Query OK, 0 rows affected (0.02 sec)
\`\`\`

### 数据类型怎么选(面试常考)

| 类型 | 选它的理由 | 坑 |
| --- | --- | --- |
| INT / BIGINT | 整数;id 用 BIGINT 防溢出,加 UNSIGNED 扩大正数范围 | 别用字符串存 id,占空间且索引慢 |
| VARCHAR(n) | 变长字符串,按实际长度存 | n 不是越大越好,索引有长度限制 |
| CHAR(n) | 定长,适合手机号/身份证等长度固定的 | 长度不够会截断(严格模式报错) |
| DECIMAL(10,2) | **金额专用**,精确十进制 | 别用 FLOAT/DOUBLE,二进制浮点存不准 |
| DATETIME / TIMESTAMP | 时间;TIMESTAMP 只到 2038 年且受时区影响 | 存"未来时间"用 DATETIME 更稳 |
| TINYINT | 状态位(0/1/2),省空间 | 别用 ENUM 做状态,加值要改表结构 |

> [!danger] 金额用 float,账就对不上
> \`\`\`java
> double a = 0.1 + 0.2;
> System.out.println(a);          // 0.30000000000000004
> System.out.println(0.1 + 0.2 == 0.3);  // false
> \`\`\`
> \`\`\`output
> 0.30000000000000004
> false
> \`\`\`
> 二进制浮点表示不了 0.1 这种十进制小数。所以数据库用 **DECIMAL(定点数)**,Java 里对应 **BigDecimal**;比较 BigDecimal 要用 ==compareTo== 而不是 equals(后者连精度 1.0 和 1.00 都算不等)。这条从数据库一直贯穿到支付系统,面试官非常爱问。

### 约束:数据库的"门禁系统"

| 约束 | 作用 | 一句提醒 |
| --- | --- | --- |
| PRIMARY KEY | 唯一 + 非空,一表一个 | InnoDB 会用它组织聚簇索引(第 3 章) |
| UNIQUE | 唯一,允许多个 NULL | 别用它当业务主键,业务值可能变 |
| NOT NULL | 不许为空 | 尽量加,减少 NULL 带来的判断分支 |
| DEFAULT | 不填时的默认值 | 配合 NOT NULL 使用体验最好 |
| FOREIGN KEY | 引用另一张表的主键 | 互联网高并发场景常"逻辑外键",不建物理外键 |
| AUTO_INCREMENT | 自增,常配主键 | 分库分表后会冲突,见第 9 章雪花算法 |

> [!pitfall] NULL 的三个连环坑
> ① ==NULL = NULL== 结果是 NULL 不是 true,查空值必须 ==IS NULL==;② ==COUNT(列)== 会跳过 NULL,==COUNT(*)== 才数行;③ 唯一索引允许多行 NULL。面试问"NULL 和空字符串的区别",就按"三值逻辑 + IS NULL 可使用索引 + 聚合跳过"三点答。

## 增删改查:CRUD 四板斧

\`\`\`sql
-- 增:一次插三行(生产环境必用批量插入,比三次单插快数倍)
INSERT INTO users (username, phone, balance) VALUES
('zhen', '18200001111', 100.00),
('zhangsan', '18200002222', 0.00),
('lisi', NULL, 66.60);

-- 查:WHERE 组合条件
SELECT id, username, balance FROM users WHERE status = 1 AND balance > 10;
\`\`\`

\`\`\`output
Query OK, 3 rows affected (0.01 sec)
Records: 3  Duplicates: 0  Warnings: 0

+----+----------+---------+
| id | username | balance |
+----+----------+---------+
|  1 | zhen     |  100.00 |
|  3 | lisi     |   66.60 |
+----+----------+---------+
2 rows in set (0.00 sec)
\`\`\`

\`\`\`sql
-- 改:务必带 WHERE!
UPDATE users SET balance = balance - 20 WHERE id = 1;

-- 删:同样务必带 WHERE
DELETE FROM users WHERE id = 3;
\`\`\`

\`\`\`output
Query OK, 1 row affected (0.01 sec)
Query OK, 1 row affected (0.00 sec)
\`\`\`

> [!danger] 忘写 WHERE 的 UPDATE,是删库跑路的一半
> ==UPDATE users SET status = 0== 会把全表用户禁用。生产上执行前先用同条件 SELECT 确认行数,再开事务执行;大厂规范通常要求 UPDATE/DELETE 必须走审批 + 备份。

## 排序 · 分页 · 聚合:让数据开口说话

\`\`\`sql
-- 按余额从高到低,取前 2 条(排行榜/分页的基础)
SELECT username, balance FROM users ORDER BY balance DESC LIMIT 2;

-- 聚合 + 分组:统计每个状态的用户数
SELECT status, COUNT(*) AS cnt, SUM(balance) AS total
FROM users
GROUP BY status
HAVING total > 0;
\`\`\`

\`\`\`output
+----------+---------+
| username | balance |
+----------+---------+
| zhen     |   80.00 |
| zhangsan |    0.00 |
+----------+---------+
2 rows in set (0.00 sec)

+--------+-----+--------+
| status | cnt | total  |
+--------+-----+--------+
|      1 |   2 |  80.00 |
+--------+-----+--------+
1 row in set (0.00 sec)
\`\`\`

> [!tip] LIMIT 分页的深坑(第 5 章会展开)
> ==LIMIT 100000, 20== 不是"跳到 10 万行",而是**扫描前 10 万零 20 行再丢掉 10 万行**。深分页要用"延迟关联"或游标(记住 where id > 上次最大 id),这是面试高频。

### 书写顺序 vs 执行顺序(笔试必考)

| 你写 SQL 的顺序(书写) | 数据库真正执行的顺序 |
| --- | --- |
| SELECT | ① FROM(先找到表) |
| FROM | ② WHERE(过滤行) |
| WHERE | ③ GROUP BY(分组) |
| GROUP BY | ④ HAVING(过滤组) |
| HAVING | ⑤ SELECT(算列、起别名) |
| ORDER BY | ⑥ ORDER BY(排序) |
| LIMIT | ⑦ LIMIT(截断) |

看懂这张表,两个经典问题就通了:**为什么 WHERE 不能用 SELECT 里的别名**(WHERE 执行时别名还没出生)、**为什么 MySQL 的 HAVING 可以引用 SELECT 别名**:这是 MySQL 的名称解析扩展,不能用"HAVING 在 SELECT 之后"解释,上表中它的逻辑位置仍在 SELECT 之前。逻辑处理顺序是理解语义的模型,也不是优化器实际执行的每一步。

## 多表查询入门:JOIN 把两张表拼起来

订单不可能只有金额,还要知道"谁下的单"。真实世界的数据天然分散在多张表里,JOIN 就是把它们按关系拼回来:

\`\`\`sql
CREATE TABLE orders (
  id       BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id  BIGINT UNSIGNED NOT NULL COMMENT '下单用户',
  amount   DECIMAL(10,2) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='订单表';

INSERT INTO orders (user_id, amount) VALUES (1, 35.50), (1, 12.00), (2, 99.90);

-- 内连接:只保留"有订单的用户"
SELECT u.username, o.amount
FROM users u INNER JOIN orders o ON u.id = o.user_id;

-- 左连接:所有用户都保留,没下单的订单列为 NULL
SELECT u.username, o.amount
FROM users u LEFT JOIN orders o ON u.id = o.user_id;
\`\`\`

\`\`\`output
+----------+--------+
| username | amount |
+----------+--------+
| zhen     |  35.50 |
| zhen     |  12.00 |
| zhangsan |  99.90 |
+----------+--------+

+----------+--------+
| username | amount |
+----------+--------+
| zhen     |  35.50 |
| zhen     |  12.00 |
| zhangsan |  99.90 |
+----------+--------+
3 rows in set (0.00 sec)
\`\`\`

\`\`\`text
内连接 INNER JOIN          左连接 LEFT JOIN
   users ∩ orders             users ⊇ 匹配的 orders
   (两边都有才留下)            (左表全留,右表没有则补 NULL)
\`\`\`

> [!pitfall] JOIN 忘写 ON 条件 = 灾难
> ==FROM users, orders== 不加条件会得到**笛卡尔积**:1000 用户 × 10000 订单 = 一千万行。SQL 不会报错,只会慢到把数据库打挂。写 JOIN 的第一件事永远是确认 ON 连接条件。

## 设计第一课:让表经得起时间考验

- **主键**:单表用 BIGINT 自增;分库分表用雪花算法(第 9 章详解);别用业务字段(手机号会换)当主键。
- **范式**:三范式的目标是"一份数据只存一处、改一处全生效";但订单里的"商品快照价格"属于**刻意反范式** —— 商品改价了,历史订单必须保留当时价格。范式是默认值,反范式是业务决策。
- **字符集/排序规则**:建库定 utf8mb4 与 utf8mb4_general_ci,避免后续逐表改。
- **命名与注释**:表名小写下划线(==t_order==),字段必须有 COMMENT —— 半年后的你会感谢现在的你。
- **索引预告**:本章的表只有几行,怎么查都快。当数据涨到百万级,==WHERE user_id = ?== 会从 0.01 秒变成 2 秒 —— 因为你还在**逐行扫全表**。下一章我们就讲 MySQL 用 B+ 树把"扫全表"变成"查目录"。

> [!tip] 本章在整个模块的位置
> 你刚学的是"**怎么用 MySQL**";从下一章开始才是"**MySQL 为什么这样工作**"(架构 → 索引 → 事务 → 锁 → 日志)。面试官问的 80% 是后者,但后者全部建立在本章的 SQL 直觉之上 —— 比如 B+ 树优化的是 WHERE,事务保护的是 UPDATE,MVCC 决定的是 SELECT 看到什么。

## 本章小结

- 数据库解决三件事:并发、持久、查询;关系模型 = 表/行/列/主键。
- SQL 四分类:DDL 改结构、DML 改数据、DQL 查数据、DCL 管权限与事务。
- 建表三要素:字段名、类型、约束;金额 DECIMAL,字符集 utf8mb4。
- NULL 有三坑:!= NULL、COUNT(列)、唯一索引。
- **执行顺序:FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY → LIMIT**。
- JOIN 必须写 ON;LEFT JOIN 保留左表全部行。

## 面试速记

- 执行顺序口诀:"**从表开始,过滤分组,再选列排序截断**";WHERE 在 SELECT 前,故不能用别名;HAVING 在 SELECT 后,可以。
- 金额:数据库 DECIMAL,Java BigDecimal,比较用 compareTo;float/double 只用于科学计算。
- DELETE(逐行可回滚)/ TRUNCATE(清空不可回滚)/ DROP(删结构)。
- 左连接保留左表,右连接保留右表,内连接取交集。
- COUNT(*) 数行;COUNT(列) 跳过 NULL;COUNT(1) 与 COUNT(*) 在 InnoDB 里基本等价。
`
      },
      /* ─────────────────────────────────────────── */
      {
        id: 'ch01',
        title: 'MySQL 架构与 InnoDB 存储引擎',
        minutes: 35,
        points: ['三层架构', 'InnoDB vs MyISAM', 'Buffer Pool', 'LRU 改良'],
        content: `
> [!interview] 面试开场定位
> "MySQL 你了解它的整体架构吗?一条 SQL 从客户端到返回数据经历了什么?"——按**连接层 → 服务层 → 存储引擎层**三层讲,每一层说清"谁在里面、干什么活",最后落到 InnoDB 的 Buffer Pool。本章同时建立整个模块的统一示例表 t_order,后面七章的 SQL 都在它身上跑。

> [!info] 本章导读 · 你敲下回车之后,那条 SQL 去了哪里
> 在餐厅点菜,你只说了一句宫保鸡丁,后厨却要经过前台、传菜、配菜、掌勺好几道手,才把盘子端回来。一条 SQL 从客户端发出,到结果集返回,同样要穿过连接管理、解析优化、存储引擎三层。本章把这条路线走一遍,顺便认识后面所有实验都要用的那张订单表。
> - 读完本章你将能:说出连接层、服务层、存储引擎层各自由谁负责
> - 沿着一条查询语句,标出解析、优化、执行分别发生在哪一层
> - 在自己的库里建好订单表,并确认它使用的是 InnoDB 引擎

> [!tip] 日常电脑现场 · 餐厅前厅后厨
> 你坐下只跟服务员说要一份套餐,前厅记单、后厨配菜、洗碗间收拾,中间还有传菜员跑腿,他们怎么分工你完全看不见。MySQL 也是这样:连接层接客、服务层解析优化、InnoDB 真正存取数据,而你只发了一条 SQL。

## 三层架构:一条 SQL 的旅程

\`\`\`diagram:d-mysqlarch
\`\`\`

**MySQL 就是一座三层楼的餐厅**:一楼迎宾负责接待客人、安排座位(连接池),二楼厨房先看懂菜单再决定怎么做最划算(解析器/优化器),后厨还按菜系分区开工(存储引擎插件式,InnoDB 是招牌档口)。你要的菜,终究是从后厨端出来的。

\`\`\`text
客户端(JDBC / mysql 命令行 / Navicat)
        │  TCP 握手 + 用户名密码认证
┌───────▼──────────────────────────────────┐
│ 连接层  连接器 · 连接池 · 线程管理          │
├──────────────────────────────────────────┤
│ 服务层  SQL接口 → 解析器 → 优化器 → 执行器   │   ← 8.0 已删除查询缓存
├──────────────────────────────────────────┤
│ 引擎层  InnoDB(默认) / MyISAM / Memory     │   ← 插件式,可按表指定
├──────────────────────────────────────────┤
│ 文件层  .ibd 数据文件 · redo · undo · binlog│
└──────────────────────────────────────────┘
\`\`\`

**SELECT 语句完整走一遍(面试要求能口述):**

1. **连接器**:建立连接、校验账号密码、加载权限(权限在连接建立时读入,改权限要对重连生效)。
2. **解析器**:词法 + 语法分析,生成解析树;你见过的 ==You have an error in your SQL syntax== 就是它报的。
3. **优化器**:决定用哪个索引、多表 JOIN 谁做驱动表,产出执行计划 —— ==EXPLAIN== 看的就是它的产出。
4. **执行器**:先判断你对这张表有没有查询权限,再调用存储引擎接口一行行取数。

> [!pitfall] 查询缓存为什么被删了
> 8.0 之前的查询缓存:SQL 完全相同才命中,而且**表里任何一行数据变了,这张表的所有缓存全部失效**。业务写多读少时命中率惨不忍睹,还有并发竞争 —— 所以 8.0 直接砍掉。面试主动提"8.0 移除查询缓存"是版本跟踪能力的加分项。

## 建立统一示例表(后面七章都用它)

\`\`\`sql
CREATE TABLE t_order (
    id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
    user_id     INT             NOT NULL                COMMENT '下单用户ID',
    order_no    VARCHAR(32)     NOT NULL                COMMENT '订单号(纯数字字符串)',
    amount      DECIMAL(10,2)   NOT NULL                COMMENT '订单金额',
    status      TINYINT         NOT NULL DEFAULT 0      COMMENT '0待支付 1已支付 2已取消',
    remark      VARCHAR(200)    NULL DEFAULT NULL       COMMENT '备注(前缀索引演示用)',
    create_time DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '下单时间',
    PRIMARY KEY (id),
    UNIQUE KEY uk_order_no (order_no),
    KEY idx_user_id_create_time (user_id, create_time)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COMMENT '订单表(本模块统一示例)';
\`\`\`

\`\`\`output
Query OK, 0 rows affected (0.04 sec)
\`\`\`

## InnoDB vs MyISAM(必考对比)

| 维度 | InnoDB | MyISAM |
| --- | --- | --- |
| 事务 | 支持(ACID) | 不支持 |
| 锁粒度 | 行锁 + 表锁 | 只有表锁 |
| 索引结构 | 聚簇索引,数据即索引 | 非聚簇,叶子存物理地址 |
| 崩溃恢复 | redo log 支持 crash-safe | 不支持,表易损坏 |
| 外键 | 支持(生产一般不用) | 不支持 |
| count(*) | 需要遍历(原因见下) | 直接存了总行数,瞬间返回 |
| 定位 | OLTP 事务型业务默认 | 5.5 之前默认,现仅剩只读旧表 |

> [!interview] 高频追问:为什么 InnoDB 的 count(*) 不能像 MyISAM 存个总数?
> 因为 ==MVCC==:同一时刻不同事务看到的行数可能不同(有的行对你是可见的、对别人不可见),**不存在一个全局唯一正确的总数**。MyISAM 没有事务,一个数字存住就永远对。这也解释了大表 count(*) 为什么慢、要用计数表或缓存优化(第 5 章)。

## Buffer Pool:InnoDB 性能的心脏

磁盘随机读一次约 10ms,内存读一次约 100ns,差 **10 万倍**。InnoDB 的读写尽量都在内存完成:以 ==页== 为单位(默认 16KB)缓存热点数据。

Buffer Pool 内部几大结构:

| 结构 | 作用 |
| --- | --- |
| LRU 链表 | 缓存数据页,分 young(热)与 old(冷)两段 |
| Free 链表 | 记录空闲页 |
| Flush 链表 | 记录脏页(改了还没刷盘) |
| Change Buffer | 写二级索引时页不在内存,先攒着,等页被读到再合并 |
| 自适应哈希索引 | 引擎自动为热点页建哈希,等值查询 O(1) |

**为什么 InnoDB 的 LRU 不是教科书 LRU?** 一次全表扫描就会把真正的热点页全部挤出缓存(缓存污染)。InnoDB 的改良:

\`\`\`text
新页读入 → 先放进 old 区头部(old 区占 3/8)
         → 1 秒内(innodb_old_blocks_time)再次访问不晋升
         → 停留超过 1 秒后再次被访问 → 晋升 young 区(占 5/8)
扫描类一次性页:在 old 区待一下就被挤出,污染不了 young 区
\`\`\`

查看与设置(生产建议给到物理内存的 50%~70%):

\`\`\`sql
SELECT @@innodb_buffer_pool_size / 1024 / 1024 / 1024 AS buffer_pool_gb;
SHOW VARIABLES LIKE 'innodb_old_blocks_time';
\`\`\`

\`\`\`output
buffer_pool_gb
8.00000000
Variable_name           Value
innodb_old_blocks_time  1000
\`\`\`

**脏页什么时候刷盘?** 四个时机:redo log 写满(此时所有写必须停下,线上最怕)、Buffer Pool 不够用要淘汰脏页、后台线程定期刷、MySQL 正常关闭。

> [!warn] 连接层的两个生产参数
> ==max_connections== 默认 151,高并发要调大,连不上报 ==ERROR 1040 Too many connections==。另外 MySQL 社区版是**一个连接一个线程**,Java 连接池(如 HikariCP)的最大连接数不要盲目拉到几百 —— 线程池(thread pool)是商业版特性,社区版靠应用侧连接池控制。

## UPDATE 为什么更复杂(为第 9 章埋伏笔)

\`\`\`text
UPDATE t_order SET amount = 600 WHERE id = 1;
  1. 执行器调 InnoDB 接口读取 id=1 这一行(Buffer Pool 命中最好)
  2. 写 undo log(记录旧值,用于回滚)           ← 第 7 章 MVCC 也要用它
  3. 在 Buffer Pool 中修改数据页(此时是脏页)
  4. 写 redo log buffer,事务提交时 fsync        ← WAL,保证持久性
  5. 写 binlog,然后 redo log 打上 commit 标记    ← 两阶段提交,第 9 章展开
\`\`\`

一个 UPDATE 牵动 undo、redo、binlog 三大日志 —— 这就是第 9 章要讲透的日志体系。

## Buffer Pool 进阶:预读·自适应哈希与组提交

前面讲了 Buffer Pool 的 LRU 与脏页刷盘,这一段补三块高频追问:**预读怎么把页提前拉进来、AHI 怎么把等值查询变成 O(1)、组提交怎么把多次 fsync 合并成一次**。

### 预读:提前把"下一页"搬进内存

InnoDB 按区(extent,64 页 = 1MB)管理磁盘。顺序访问时,读完一页大概率还要读下一块,于是有两种预读:

| 类型 | 触发条件 | 参数 | 默认 |
| --- | --- | --- | --- |
| 线性预读 | 一个 extent 内顺序访问的页数达到阈值,预取下一个 extent | innodb_read_ahead_threshold | 56(范围 0~64) |
| 随机预读 | 一个 extent 内已缓存页数达到阈值,预取整个 extent | innodb_random_read_ahead | OFF |

\`\`\`sql
SHOW VARIABLES LIKE 'innodb_read_ahead_threshold';
SHOW VARIABLES LIKE 'innodb_random_read_ahead';
\`\`\`

\`\`\`output
Variable_name                   Value
innodb_read_ahead_threshold     56
innodb_random_read_ahead        OFF
\`\`\`

收益是**顺序扫描少等几次 IO**,代价是可能**污染 Buffer Pool**:范围查询/全表扫描触发的预读页,如果不被再次访问,会把真正的热页挤到 old 区甚至淘汰。

- OLTP 点查为主:保持默认,别把阈值调太小(比如 8),否则一点顺序访问就狂预读;
- 大表全表扫描多:考虑关掉随机预读,或把扫描放到从库/离线库;
- 预读页同样进 old 区,靠 ==innodb_old_blocks_time== 兜底,但兜不住大量一次性页。

### 自适应哈希索引 AHI

InnoDB 观察索引页的访问模式:同一个索引页被**等值查询**反复命中且模式稳定时,自动在内存里建哈希表,键是"索引 + 查询条件",值是页地址,查询从 B+ 树的 O(log n) 变成 O(1)。

\`\`\`sql
SHOW VARIABLES LIKE 'innodb_adaptive_hash_index';
SHOW VARIABLES LIKE 'innodb_adaptive_hash_index_parts';
SHOW ENGINE INNODB STATUS;   -- 输出里搜 INSERT BUFFER AND ADAPTIVE HASH INDEX
\`\`\`

\`\`\`output
Variable_name                     Value
innodb_adaptive_hash_index        ON
innodb_adaptive_hash_index_parts  8

-------------------------------------
INSERT BUFFER AND ADAPTIVE HASH INDEX
-------------------------------------
Hash table size 22679, node heap has 3 buffer(s)
0.00 hash searches/s, 0.00 non-hash searches/s
\`\`\`

| 场景 | AHI 表现 | 建议 |
| --- | --- | --- |
| 等值点查多、热点集中 | 命中率高,省 B+ 树下降 | 保持 ON |
| 范围查询、排序为主 | 用不上,只增加维护开销 | 可关 |
| 超高并发 + 大量索引页 | 争用 btr_search_latch,CPU sys 飙高 | 压测对比后考虑 OFF |

> [!warn] AHI 的坑:高并发下它可能变成瓶颈
> AHI 的查找要拿 ==btr_search_latch==,虽然 5.7 起按 ==innodb_adaptive_hash_index_parts== 分区(默认 8),但热点集中时仍会争用。现象:QPS 上不去、CPU 的 sys 占比高、==SHOW ENGINE INNODB STATUS== 里 hash searches 很高。处理:先压测对比,确认是 AHI 争用再关闭 —— 关掉后每次仍走 B+ 树,内存中的 3 层查找并不慢。AHI 只加速等值与 IN,不支持范围,别把它当万能索引。

### 组提交:把 N 次 fsync 合成 1 次

双 1(==sync_binlog=1== + ==innodb_flush_log_at_trx_commit=1==)意味着每次提交都要 fsync。若 1000 TPS 每个事务各 fsync 两次,磁盘根本扛不住。组提交(group commit)让多个事务**排队共享一次 fsync**:

\`\`\`text
redo 组提交:
  T1,T2,T3 依次进入 flush 队列
  第一个进入的成为 leader,负责把三者的 redo 一起 write + fsync
  follower 等 leader 完成后一起返回 → 3 次 fsync 变 1 次

binlog 组提交三阶段(每阶段各有 leader):
  flush  : 各事务 binlog 写入文件缓冲
  sync   : leader 对 binlog 做一次 fsync(受 sync_binlog 控制)
  commit : 按顺序调用引擎层提交,保证 redo/binlog 顺序一致
\`\`\`

==binlog_order_commits=ON==(默认)保证引擎层提交顺序与 binlog 一致,这是崩溃恢复与从库重放正确性的前提;关掉能提升并发,但一致性风险自负。

| 参数 | 取值 | 含义 | 生产建议 |
| --- | --- | --- | --- |
| sync_binlog | 0 | 由 OS 决定刷盘 | 不推荐,宕机丢 binlog |
| | 1 | 每次提交 fsync,组提交合并 | 金融级默认 |
| | N | 每 N 次提交 fsync | 可容忍少量丢失时 |
| innodb_flush_log_at_trx_commit | 0 | 每秒刷一次 | 最快,宕机丢 1 秒 |
| | 1 | 每次提交 fsync | 默认,最安全 |
| | 2 | 写入 OS cache,每秒 fsync | 掉电丢,进程挂不丢 |

> [!interview] 一句话回答"组提交怎么降低 fsync"
> 多个事务的 redo/binlog 在队列里攒批,由 leader 统一执行一次 write + fsync,其余事务等这一次结果 —— fsync 次数从"事务数"降为"批次数",磁盘 IOPS 压力骤降,而持久性语义不变(提交返回前数据已落盘)。

## 面试速记

- 三层:连接层(认证/连接管理)→ 服务层(解析/优化/执行)→ 引擎层(插件式,InnoDB 默认)。
- 8.0 删除查询缓存:写多读少命中率低,表一更新全部失效。
- InnoDB vs MyISAM 一句话:前者有事务、行锁、聚簇索引,后者无事务、只有表锁、存总行数。
- count(*) 慢的根因是 MVCC:并发下不存在全局唯一正确的行数。
- Buffer Pool 的 LRU 分 young/old 两段,扫描页先进 old 区观察 1 秒,防缓存污染。
`,
      },
      /* ─────────────────────────────────────────── */
      {
        id: 'ch02',
        title: '索引原理:B+ 树',
        minutes: 35,
        points: ['B+ 树', '聚簇索引', '回表', '覆盖索引', '页分裂'],
        content: `
> [!interview] 本章面试锚点
> "为什么 InnoDB 用 B+ 树?"是 MySQL 面试的第一道分水岭。答法用**排除法**:哈希不支持范围,二叉树太瘦高 IO 次数多,B 树非叶子存数据拉高树高 —— 推出 B+ 树。再补一句"3 层 B+ 树能存约 2000 万行,主键查询最多 3 次磁盘 IO",面试官立刻知道你是懂的。先点演示直观感受树高差异。

\`\`\`demo:bptree
\`\`\`

> [!info] 本章导读 · 两千万行数据,为什么查一行只要几次磁盘 IO
> 在 800 页的书里找一个词,一页页翻要翻到天黑;有目录和索引,你几步就能定位。数据库面对两千万行,道理完全一样:它把数据按顺序组织成一棵矮胖的树,让每次查找只需跳几层。本章从为什么不能选哈希和二叉树讲起,把索引的结构、分类和代价一次说透。
> - 读完本章你将能:手算出三层 B+ 树大约能装下多少行数据
> - 说清聚簇索引与二级索引的叶子节点分别存了什么
> - 给一张表设计出合理的索引,并解释为什么不是越多越好

> [!tip] 日常电脑现场 · 图书馆索书号
> 在图书馆找一本书,你不会从第一排书架一本本翻,而是先查电脑拿到 I247.5/123 这样的索书号,再直奔那一排那一格。索引就是这张号码牌:把全表翻一遍,变成按编号跳几步。

## 排除法:其他结构为什么不行

磁盘 IO 按"页"进行,一次至少读 16KB —— **树越矮,IO 越少**。逐个排除:

| 结构 | 问题 |
| --- | --- |
| 哈希表 | 等值 O(1) 很快,但**范围查询、排序、最左前缀全部无能为力**;Memory 引擎默认哈希 |
| AVL / 红黑树 | 二叉"瘦高":500 万数据高约 23 层 = 23 次磁盘 IO;每节点只放一个键,浪费 16KB 页 |
| B 树 | 多叉了,但**非叶子节点也存数据** → 一个 16KB 页能放的键变少 → 树变高;数据散布全树,范围查询要中序回溯 |
| B+ 树 | 非叶子**只存键**(路标),叶子才存数据且用**双向链表**串起来:矮胖 + 天然支持范围扫描 |

> [!tip] B+ 树比 B 树多出来的两个杀招
> ① 非叶子节点不存数据,同样 16KB 能放近千个"路标",树高骤降;② 叶子节点双向链表,范围查询定位起点后沿链表顺序扫即可 —— ==WHERE amount BETWEEN 100 AND 200== 这类需求哈希和 B 树都没有它优雅。

## 算一笔账:3 层 B+ 树能存多少行(必背推导)

\`\`\`diagram:d-bptree
\`\`\`

**B+ 树查数据就像翻字典**:目录页(非叶子节点)只告诉你目标在哪页的字母范围,正文页(叶子节点)才是真内容;目录之间还串着"下一页"的链接,查范围时顺着翻页就行,快得很。

设主键 BIGINT(8 字节),InnoDB 指针 6 字节:

\`\`\`text
非叶子节点一个键 + 指针 = 8 + 6 = 14 字节
一页 16KB = 16384 字节 → 扇出 ≈ 16384 / 14 ≈ 1170
假设一行数据 1KB → 叶子节点每页放 16 行

高度为 3 的 B+ 树:
   根(1 页)→ 1170 个非叶子节点
   第二层 1170 页 → 1170 × 1170 ≈ 137 万个叶子页
   叶子 137 万页 × 16 行 ≈ 2190 万行
\`\`\`

结论:**2000 万行的表,按主键查一条数据最多 3 次磁盘 IO**;而根节点与非叶子节点长期驻留内存,实际常常只需 1 次 IO。面试能把 1170 × 1170 × 16 推出来,是硬通货。

> [!warn] "单表不超过 2000 万行"的出处就在这
> 数据量再涨,树高从 3 变 4,IO 多一次,同时二级索引回表更频繁。这个经验值不是拍脑袋,是 B+ 树结构算出来的 —— 能说出这个推导,比背结论值钱十倍。

## 聚簇索引与二级索引

InnoDB 的表本身就是一棵按主键组织的 B+ 树 —— **索引即数据,数据即索引**:

\`\`\`text
聚簇索引(主键树)                      二级索引 idx_user_id_create_time
┌──────────────┐                     ┌───────────────────┐
│ 叶子 = 完整行  │                     │ 叶子 = 索引列 + 主键 │
│ (id,user_id,  │                     │ (user_id,          │
│  amount, ...) │                     │  create_time, id)  │
└──────────────┘                     └─────────┬─────────┘
                                               │ 拿到 id 后回主键树再查一次
                                               ▼ = 回表
\`\`\`

**为什么二级索引存主键值而不是行的物理地址?** 页分裂会让行"搬家",若存物理地址,每次页分裂都要维护所有二级索引;存主键则只有主键树自己管自己。代价是查二级索引后可能要回表 —— 所以**主键要尽量短**:主键越长,所有二级索引的叶子就越大。

数量关系记牢:**聚簇索引一张表只有一棵**(主键),二级索引可以有很多棵,每多一个索引就多一棵要维护的 B+ 树 —— 这正是"索引不是越多越好"的结构性原因。

## 回表与覆盖索引

\`\`\`sql
-- 回表查询:idx_user_id_create_time 里没有 amount,要回主键树取整行
EXPLAIN SELECT * FROM t_order WHERE user_id = 1001;
\`\`\`

\`\`\`output
id  select_type  table    type  possible_keys            key                      key_len  ref    rows  filtered  Extra
1   SIMPLE       t_order  ref   idx_user_id_create_time  idx_user_id_create_time  4        const  18    100.00    NULL
\`\`\`

\`\`\`sql
-- 覆盖索引:要的列索引里全有,Extra 显示 Using index,零回表
EXPLAIN SELECT id, user_id, create_time FROM t_order WHERE user_id = 1001;
\`\`\`

\`\`\`output
id  select_type  table    type  possible_keys            key                      key_len  ref    rows  filtered  Extra
1   SIMPLE       t_order  ref   idx_user_id_create_time  idx_user_id_create_time  4        const  18    100.00    Using index
\`\`\`

> [!best] 用好覆盖索引的三板斧
> ① 不用 SELECT *,按需取列;② 把高频查询组合建成联合索引,让"查的列"被"索引的列"覆盖;③ 注意上面 rows=18 的回表无所谓,如果是 rows=18000 的批量回表,优化器可能**直接放弃索引改走全表扫描** —— 回表是随机 IO,批量回表的代价可能比顺序扫表还高。

## 主键为什么一定要自增

建表时主键用 ==AUTO_INCREMENT BIGINT== 还是 UUID,决定了聚簇索引在写入时是"顺着写"还是"拆着写"。

原理:InnoDB 的数据页固定 16KB,叶子页里的记录按主键有序排列。自增主键的新行永远落在最右页末尾,页满就申请新页继续追加,几乎不碰已有的页。随机主键则要插到"它该在的位置",若目标页已满,InnoDB 不能简单开新页(那会破坏有序),只能把该页约一半记录搬到新页、再更新父节点指针——这就是**页分裂**。

\`\`\`text
页 P(已满,主键 10~100)插入 id=55:
  分裂前:P [10 20 30 40 50 60 70 80 90 100]
  分裂后:P [10 20 30 40 50]   Q [55 60 70 80 90 100]
  代价:搬半页数据 + 两页利用率各约 50% + 父节点也要写
\`\`\`

分裂的代价是四重的:数据搬移消耗 CPU 与随机 IO;页利用率掉到 50%~70%,表文件虚胖;树变高,查询多一次页访问;热页被挤进挤出 buffer pool,缓存命中率下降。分裂的反向是**页合并**,所以按时间批量删历史数据后,必要时用 ==OPTIMIZE TABLE== 重建表收回空间。

UUID 还要再加两笔代价:36 字节字符串是 BIGINT 的 4 倍多,而主键会被塞进**每一棵二级索引的叶子**,索引体积随之膨胀;字符串比较也更慢。UUID v4 完全随机,分裂是常态;v7/ULID 把时间戳放高位,趋势递增,能大幅缓解。

自增的软肋在分布式:分库分表后各表都从 1 开始必然冲突。解法是号段模式(一次取 1000 个)或**雪花算法**——1 位符号 + 41 位毫秒时间戳 + 10 位机器号 + 12 位序列号,趋势递增且全局唯一,但不能保证严格连续,页分裂仍会有,只是远好于 UUID。

| 主键 | 长度 | 有序性 | 写入 | 分库分表 |
| --- | --- | --- | --- | --- |
| 自增 BIGINT | 8B | 严格递增 | 最优 | 要步长/号段 |
| UUID v4 | 36B | 完全随机 | 差 | 天然唯一 |
| 雪花 ID | 8B | 趋势递增 | 接近自增 | 依赖机器号 |

结论:**主键要短、要趋势递增**。单机用自增,分布式用雪花或号段,别拿 UUID 当聚簇索引。

## 顺着主键读:ORDER BY id 天然免排序

聚簇索引本身就是按主键有序的双向链表,所以按 id 排序、按 id 范围查都不需要额外排序:

\`\`\`sql
EXPLAIN SELECT * FROM t_order WHERE id BETWEEN 100 AND 200 ORDER BY id;
EXPLAIN SELECT * FROM t_order WHERE user_id = 1001 ORDER BY status;
\`\`\`

\`\`\`output
id  select_type  table    type   possible_keys  key      key_len  ref   rows  filtered  Extra
1   SIMPLE       t_order  range  PRIMARY        PRIMARY  8        NULL  101   100.00    NULL            ← 顺着主键读,无 filesort
1   SIMPLE       t_order  ref    NULL           NULL     NULL     NULL  18    100.00    Using filesort  ← status 不在索引里,要额外排序
\`\`\`

这是"索引即顺序"的另一面:**表数据按主键物理有序**。订单流水这类时间线需求,直接按 id 游标翻页,比按 create_time 排序便宜得多 —— 主键自增,插入顺序就是时间顺序。

> [!pitfall] 业务号与主键的取舍
> 订单号这种业务号建唯一键 ==uk_order_no== 保证幂等,但**不要拿它当主键**;主键用自增 BIGINT。如果必须用分布式 ID(如雪花算法),注意它趋势递增,页分裂远好于 UUID,可以接受。

## InnoDB 行格式与数据页:索引的物理底座

B+ 树讲完,追问往往落到"一行数据到底长什么样、一个页里能装多少行"。行格式决定**一行怎么排布**,数据页决定**一页怎么装**,两者一起决定了树的高度和磁盘 IO 次数。

### 行格式演进:从 REDUNDANT 到 DYNAMIC

| 行格式 | 引入版本 | 变长字段处理 | 大字段溢出方式 | 现状 |
| --- | --- | --- | --- | --- |
| REDUNDANT | 5.0 之前 | 长度 + 偏移数组,头部开销大 | 768 字节前缀 + 溢出页 | 老表遗留 |
| COMPACT | 5.0 | 变长长度列表 + NULL 位图 | 768 字节前缀 + 溢出页 | 仍可显式指定 |
| DYNAMIC | 5.5+(Barracuda) | 同 COMPACT | 20 字节指针,整列放溢出页 | **5.7 起默认** |
| COMPRESSED | 5.5 | 同 COMPACT | 同 DYNAMIC,页内再做 zlib 压缩 | 压缩场景专用 |

DYNAMIC 成为默认的关键:它把长变长列**整列搬到溢出页**,聚簇索引叶子只留 20 字节指针,一页能放更多行、树更矮。COMPACT 则是"前 768 字节留在页内 + 剩余去溢出页",大字段下页内被塞满,行数骤减。

### COMPACT 的一行:四个部分

\`\`\`text
┌────────────────────────────────────────────────────────────────┐
│ 变长字段长度列表 │ NULL 位图 │ 记录头(5字节) │ 列数据 ...        │
│ 逆序存放各 VARCHAR │ 1 bit/可空列 │ 见下方字段   │ id,user_id...  │
│ 的实际字节数        │ 1 = NULL     │              │                │
└────────────────────────────────────────────────────────────────┘
记录头 5 字节的位分配:
  deleted_flag 1bit | min_rec_flag 1bit | n_owned 4bit
  heap_no 13bit | record_type 3bit | next_record 16bit
next_record 是页内单链表指针,n_owned 是 Page Directory 分组的关键。
\`\`\`

变长长度列表**逆序**存放、NULL 位图**只标记可空列**——这两个细节是区分"背过"和"看过"的地方。CHAR(10) 在 utf8mb4 这类变长字符集下同样按变长处理。

查询表的真实行格式:

\`\`\`sql
SELECT TABLE_NAME, ROW_FORMAT, AVG_ROW_LENGTH, DATA_LENGTH
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = 'shop' AND TABLE_NAME = 't_order';

SHOW VARIABLES LIKE 'innodb_default_row_format';
\`\`\`

\`\`\`output
TABLE_NAME  ROW_FORMAT  AVG_ROW_LENGTH  DATA_LENGTH
t_order     Dynamic     96              16384

Variable_name               Value
innodb_default_row_format   dynamic
\`\`\`

### 行溢出:DYNAMIC 的 20 字节指针

InnoDB 规定**一页至少放两行**,所以单行可用空间约 8KB。TEXT/BLOB 或超长 VARCHAR 存不下时:

\`\`\`text
COMPACT:  叶子页 [ 768 字节前缀 | 20 字节溢出指针 ] ──> 溢出页(Uncompressed BLOB Page)
DYNAMIC:  叶子页 [ 20 字节溢出指针 ] ───────────────> 溢出页链(整列数据在这里)
\`\`\`

\`\`\`sql
-- 造一张带超长列的表观察行溢出
CREATE TABLE t_article (
    id    BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    title VARCHAR(100) NOT NULL,
    body  LONGTEXT,
    PRIMARY KEY (id)
) ENGINE = InnoDB ROW_FORMAT = DYNAMIC;

INSERT INTO t_article(title, body) VALUES ('行溢出演示', REPEAT('数据库', 5000));
SELECT id, title, LENGTH(body) AS body_bytes FROM t_article;
\`\`\`

\`\`\`output
Query OK, 0 rows affected (0.05 sec)
Query OK, 1 row affected (0.03 sec)
id  title        body_bytes
1   行溢出演示   45000
\`\`\`

3 个汉字 × 3 字节 × 5000 次 = 45000 字节,远超单行 8KB 上限,==body== 这一列因此被搬进溢出页;叶子页里的记录只保留指针。

### 数据页:16KB 的七段结构

| 区段 | 大小 | 作用 |
| --- | --- | --- |
| File Header | 38 字节 | 页号、页类型、上一页/下一页、校验和、LSN |
| Page Header | 56 字节 | 页内记录数、堆顶位置、槽位数等 |
| Infimum + Supremum | 26 字节 | 页内最小/最大伪记录,单链表头尾 |
| User Records | 动态 | 真实行记录,按主键顺序用 next_record 串成链表 |
| Free Space | 动态 | 尚未使用的空洞 |
| Page Directory | 动态 | 每 4~8 条记录一个槽,槽存组内最大记录偏移 |
| File Trailer | 8 字节 | 校验和 + LSN 低 32 位,防页只写一半 |

\`\`\`text
Page Directory: [slot0 -> 组1最大记录] [slot1 -> 组2最大记录] ... [slotN]
页内查找 id = 150:
  ① 对槽位做二分(log2 槽数),定位到可能包含 150 的组
  ② 从该组最小记录沿 next_record 顺序走(组内最多 8 条)
  ③ 命中返回;跨页由 B+ 树父节点决定,页内不解决
\`\`\`

**为什么一页约 16 行、三层能存 2000 万?** 按面试常用的"单行约 1KB"口径:16384 字节去掉页头、目录、伪记录和预留空间,一页约 16 行。

\`\`\`text
叶子层:2000 万行 / 16 行每页 ≈ 125 万页
中间层:125 万 / 1170(非叶子一页可放的 主键8+页号6=14 字节条目)≈ 1069 页
根层:1069 / 1170 < 1,正好一个根页
→ 三层刚好装下 2000 万行,主键查询最多 3 次页访问
\`\`\`

实际 t_order 这种窄行(约 96 字节)一页能放一两百行,同样三层装下的行数远不止 2000 万 —— **16 行/页是保守口径**,面试报 2000 万就够,别把窄行表的真实容量说死。

> [!interview] 行格式三连问
> ① 为什么 5.7 默认 DYNAMIC?长列整列进溢出页,叶子页只留 20 字节指针,页内行数多、树矮、IO 少。② COMPACT 和 DYNAMIC 的差别?COMPACT 留 768 字节前缀;DYNAMIC 全溢出,适合 TEXT/BLOB。③ 一页为什么至少两行?否则 B+ 树退化成链表,查找失去意义。

> [!pitfall] 别把行格式和字符集混为一谈
> ROW_FORMAT 管**物理行布局**,CHARSET 管**字节编码**。utf8mb4 下 VARCHAR(255) 最多 1020 字节,多列累加可能超过 65535 字节的行长限制,报 ==ERROR 1118 Row size too large==。这时不是改行格式就能解决,要拆表或改用 TEXT。

## 面试速记

- 排除法:哈希不支持范围排序;二叉树瘦高 IO 多;B 树非叶子存数据、树更高、范围查询要回溯。
- B+ 树:非叶子只存路标 + 叶子双向链表;16KB 页 × 1170 扇出 × 3 层 ≈ 2000 万行,最多 3 次 IO。
- 聚簇索引叶子存整行,二级索引叶子存主键值 → 回表;覆盖索引(Extra: Using index)免回表。
- 二级索引存主键不存物理地址:页分裂不用维护二级索引;主键越短,二级索引越小。
- 自增主键顺序追加不分裂;UUID 随机插入导致页分裂、碎片、缓存命中率下降。
`,
      },
      /* ─────────────────────────────────────────── */
      {
        id: 'ch03',
        title: '索引使用与失效场景',
        minutes: 35,
        points: ['最左前缀', '索引失效', '隐式转换', '前缀索引', '设计规范'],
        content: `
> [!interview] 本章面试锚点
> "你建的索引什么情况下会失效?"几乎每场必问,面试官还喜欢现场给一条 SQL 让你判断走不走索引。答题套路:**先讲最左前缀原理,再按"函数运算、隐式转换、模糊匹配、or、优化器放弃"逐条列**,每条配一个反例。本章所有 EXPLAIN 都在 t_order 上运行,可与前后章对照。

> [!info] 本章导读 · 索引明明建了,为什么查询还是慢
> 家里装了最快的宽带,视频却还是卡,多半是路由器摆错了位置。索引失效就是这么回事:索引在那儿,可优化器用不上,或者干脆被你的写法绕过去了。本章收集了线上最常见的几种失效写法,每条配一个能复现的反例,让你以后写 SQL 时条件反射地避开。
> - 读完本章你将能:看到一条 SQL 就判断出它会不会命中索引
> - 列出五种最常见的失效场景,并给出每一种的改写方式
> - 解释隐式类型转换和函数运算为什么能让索引直接作废

> [!tip] 日常电脑现场 · 查字典查错了页
> 明明知道一个字的部首,却按拼音去翻检字表,翻半天还是找不到;不是字典没收录,是你走的这条路它没建目录。索引失效就是这样:字段上明明有索引,可你在它外面套了函数或做了类型转换,优化器只好改用全表扫描。

## 最左前缀:联合索引的排序逻辑

联合索引 ==idx_user_id_create_time== 内部的排序:**先按 user_id 排,user_id 相同时再按 create_time 排** —— 就像电话本先按姓排、同姓再按名排。由此推导它能支撑与不能支撑的查询:

| 查询条件 | 走不走?走多远 |
| --- | --- |
| user_id = 1001 | 走,用到 1 列(key_len=4) |
| user_id = 1001 AND create_time = '...' | 走,两列都参与定位(key_len=9) |
| user_id = 1001 AND create_time > '...' | 走,等值+范围,两列都参与(key_len=9) |
| 只查 create_time | 不走(create_time 在索引内是"乱序"的) |
| user_id > 2000 AND create_time > '...' | 部分走,只有 user_id 参与定位(key_len=4) |

key_len 的算法(int NOT NULL = 4;datetime NOT NULL = 5)第 5 章详解。**key_len 是面试官验证"联合索引用了几列"的关键证据**。

\`\`\`sql
EXPLAIN SELECT * FROM t_order WHERE user_id = 1001 AND create_time > '2026-01-01';
\`\`\`

\`\`\`output
id  select_type  table    type   possible_keys            key                      key_len  ref   rows  filtered  Extra
1   SIMPLE       t_order  range  idx_user_id_create_time  idx_user_id_create_time  9        NULL  7     100.00    Using index condition
\`\`\`

> [!tip] 等值 + 范围可以两列全用
> 很多资料笼统说"范围查询右边的列失效",不准确:==user_id = 1001 AND create_time > 'x'== 中,user_id 等值定位后 create_time 仍继续参与范围定位(key_len=9 为证)。真正失效的是**范围列再右边**的列。

## 范围查询右侧失效(精确版)

\`\`\`sql
-- user_id 用了范围,create_time 无法参与定位:key_len 只剩 4
EXPLAIN SELECT * FROM t_order WHERE user_id > 2000 AND create_time > '2026-01-01';
\`\`\`

\`\`\`output
id  select_type  table    type   possible_keys            key                      key_len  ref    rows    filtered  Extra
1   SIMPLE       t_order  range  idx_user_id_create_time  idx_user_id_create_time  4        NULL   102400  11.11     Using index condition
\`\`\`

记忆:**范围列自己还能用,范围列右边的列废了**。所以设计联合索引的铁律 —— ==等值列放前面,范围列放最后==(见本章末尾设计规范)。

## 函数与运算失效

对"列"套函数或做运算,索引里存的还是原始值的顺序,自然失效:

\`\`\`sql
-- 反例:对列套函数 → 全表扫描
EXPLAIN SELECT * FROM t_order WHERE DATE(create_time) = '2026-06-01';
-- 改写:对常量做范围,索引可用
EXPLAIN SELECT * FROM t_order
 WHERE create_time >= '2026-06-01' AND create_time < '2026-06-02';
\`\`\`

\`\`\`output
-- 反例输出
id  select_type  table    type  possible_keys  key   key_len  ref   rows    filtered  Extra
1   SIMPLE       t_order  ALL   NULL           NULL  NULL     NULL  512000  100.00    Using where

-- 改写后输出
id  select_type  table    type   possible_keys            key                      key_len  ref   rows  filtered  Extra
1   SIMPLE       t_order  range  idx_user_id_create_time  idx_user_id_create_time  9        NULL  43    100.00    Using index condition
\`\`\`

同理还有 ==WHERE id + 1 = 1001==、==CONCAT(order_no, '-x') = ...==。**8.0.13 起可用函数索引**给表达式建索引,作为改写不了的兜底:

\`\`\`sql
ALTER TABLE t_order ADD KEY idx_create_date ((DATE(create_time)));
EXPLAIN SELECT * FROM t_order WHERE DATE(create_time) = '2026-06-01';
\`\`\`

\`\`\`output
id  select_type  table    type   possible_keys     key              key_len  ref   rows  filtered  Extra
1   SIMPLE       t_order  range  idx_create_date   idx_create_date  6        NULL  43    100.00    Using index condition
\`\`\`

## 隐式转换:谁转谁决定生死

规则只有一条:**字符串与数字比较时,MySQL 把字符串转成数字**。

- INT 列 ==user_id = '1001'==:转的是**常量**,索引不受影响 → 不失效。
- VARCHAR 列 ==order_no = 20260601000001==(不加引号):比较时**每一行的 order_no 都被转成数字**(相当于对列套了 CAST)→ 索引失效。

\`\`\`sql
-- 加引号:走唯一索引,type 直接是最快级别 const
EXPLAIN SELECT * FROM t_order WHERE order_no = '20260601000001';
-- 不加引号:列被转型,全表扫描
EXPLAIN SELECT * FROM t_order WHERE order_no = 20260601000001;
\`\`\`

\`\`\`output
-- 加引号
id  select_type  table    type   possible_keys  key          key_len  ref    rows  filtered  Extra
1   SIMPLE       t_order  const  uk_order_no    uk_order_no  130      const  1     100.00    NULL

-- 不加引号
id  select_type  table    type  possible_keys  key   key_len  ref   rows    filtered  Extra
1   SIMPLE       t_order  ALL   uk_order_no    NULL  NULL     NULL  512000  100.00    Using where
\`\`\`

> [!danger] MyBatis 里最常见的翻车点
> ==#{orderNo}== 实参被前端传成了 Number(精度丢失),或 ==status == '1'== 与 ==status == 1== 混用 —— 测试环境数据少看不出问题,上线后数据量一大 type 从 const 掉到 ALL,RT 从 1ms 变 800ms。

## 其他失效场景速查

> [!tip] 一句话记忆
> 索引能不能用,只看一件事:优化器能否从**最左列开始、连续地**做等值或范围定位;一旦对索引列"动了手脚",它就退化成全表扫描。

| 场景 | 例子 | 为什么失效 | 补救 |
| --- | --- | --- | --- |
| 函数运算 | where date(create_time) = 2026-11-01 | 对列做函数,无法用 B+ 树有序性 | 改成范围:create_time >= 当天零点 and < 次日零点 |
| 隐式转换 | phone 是 varchar,where phone = 13800000000 | 字符串列被转成数字比较,等价于函数 | 参数加引号,类型与列一致 |
| 前导模糊 | like %达海 | 左边不确定,无法定位起点 | 改成 达海% 或使用全文索引/ES |
| or 混用 | a = 1 or b = 2,b 无索引 | 一侧无索引,整体只能全表 | 给 b 建索引,或拆成两次查询 union |
| 不等于 | where status != 1 | 通常要扫描大部分行,优化器判断不走索引更便宜 | 改成 in (0,2) 或按业务拆分 |
| 范围后失效 | (a,b,c) 索引 where a=1 and b>2 and c=3 | b 是范围,c 无法继续精确定位 | 调整索引顺序,或把 c 变成覆盖列 |

\`\`\`sql
EXPLAIN SELECT * FROM t_order WHERE DATE(create_time) = "2026-11-01";
\`\`\`output
type: ALL  key: NULL  rows: 998231  Extra: Using where

看到 ==type=ALL== 且 rows 接近全表,基本就是"索引白建了"。先改写 SQL,再考虑加索引——**顺序反了会越加越慢**。

## 前缀索引:长字符串的省空间方案

给 ==remark VARCHAR(200)== 全量建索引又大又慢,前缀索引只索引前 N 个字符。N 怎么选?**用区分度试探**:

\`\`\`sql
SELECT
  COUNT(DISTINCT LEFT(remark, 10)) / COUNT(*) AS sel_10,
  COUNT(DISTINCT LEFT(remark, 20)) / COUNT(*) AS sel_20,
  COUNT(DISTINCT LEFT(remark, 30)) / COUNT(*) AS sel_30,
  COUNT(DISTINCT remark)           / COUNT(*) AS sel_all
FROM t_order;
\`\`\`

\`\`\`output
sel_10     sel_20     sel_30     sel_all
0.3124     0.3481     0.3502     0.3502
\`\`\`

sel_20 已逼近全量区分度,选 20:

\`\`\`sql
ALTER TABLE t_order ADD KEY idx_remark_p20 (remark(20));
\`\`\`

\`\`\`output
Query OK, 0 rows affected (0.62 sec)
Records: 0  Duplicates: 0  Warnings: 0
\`\`\`

前缀索引的两个天然缺陷:① **无法做覆盖索引**(索引里只有前缀,不知道完整值);② 无法用于 ORDER BY。

## 索引设计规范(背诵版)

- 联合索引顺序:**等值列在前,范围列在后**;区分度高的列优先。
- 单表索引建议 **5 个以内**:每个索引都是一棵 B+ 树,写操作要全部维护(写放大),冗余索引及时清理。
- 主键用自增 BIGINT;业务号做唯一键,不做主键。
- 长字符串用前缀索引;TEXT 大字段不建索引。
- 8.0 加分特性:**降序索引**、**函数索引**、**不可见索引**(==ALTER TABLE t_order ALTER INDEX idx_x INVISIBLE==,先隐形观察再删除,安全下线)。

> [!best] 上线前自查 SQL 走没走索引
> 开发环境数据量小,EXPLAIN 的 rows 都是几十,看不出问题。规范做法:**按生产量级灌一遍测试库再 EXPLAIN**,重点看 type(≥ range)、key(非 NULL)、key_len(是否用满联合索引)、Extra(有没有 Using filesort / Using temporary)。

## 索引下推(ICP)与 Change Buffer

> [!interview] 本节面试锚点
> EXPLAIN 的 Extra 里冒出 ==Using index condition== 是什么意思?还有那道高频选型题:"唯一索引和普通索引怎么选?" —— 前者靠 **ICP 索引下推**(读优化)作答,后者靠 **Change Buffer**(写优化)作答。这一节补齐索引读写两侧的深水区。

### 索引下推 ICP(Index Condition Pushdown)

5.6+ 特性。以用户表 t_user(name VARCHAR(32), age INT,联合索引 idx_name_age)为例,查"姓张的 20 岁用户":

\`\`\`sql
SELECT * FROM t_user WHERE name LIKE '张%' AND age = 20;
\`\`\`

\`\`\`text
索引内部先按 name 排、name 相同再按 age 排
name LIKE '张%' 是范围 → 只能靠 name 定位,age 无法参与定位。剩下不满足 age 的怎么办?

无 ICP(5.6 之前):                      有 ICP(5.6+):
① 引擎按 name 范围扫,取回 10 条索引记录   ① 引擎按 name 范围扫,取回 10 条索引记录
② 每条都回表 → 10 次随机 IO               ② 引擎直接看索引里自带的 age,当场扔掉 8 条
③ server 层过滤 age = 20,留 2 条          ③ 只对留下的 2 条回表 → 2 次随机 IO
\`\`\`

本质:**把 server 层的 WHERE 过滤下推给存储引擎,回表之前先在索引记录上判断**。前提是过滤列必须在索引里(age 就存在 idx_name_age 的叶子中),否则引擎无从判断;省的是回表次数,即随机 IO。

\`\`\`sql
EXPLAIN SELECT * FROM t_user WHERE name LIKE '张%' AND age = 20;
\`\`\`

\`\`\`output
id  select_type  table   type   possible_keys  key           key_len  ref   rows  filtered  Extra
1   SIMPLE       t_user  range  idx_name_age   idx_name_age  130      NULL  10    20.00     Using index condition
\`\`\`

ICP 由 optimizer_switch 控制,默认开启,可关掉做 A/B 对比:

\`\`\`sql
SELECT @@optimizer_switch LIKE '%index_condition_pushdown=on%' AS icp_on;
SET optimizer_switch = 'index_condition_pushdown=off';
\`\`\`

\`\`\`output
icp_on
1
\`\`\`

> [!tip] Using index condition ≠ Using index
> ==Using index== 是**覆盖索引**:索引里拿全所有列,零回表;==Using index condition== 是 **ICP**:照常回表,但回表前引擎先用索引记录过滤,**少回表**。两个词一字之差,面试要能一句话区分:前者不回表,后者少回表。

### Change Buffer:写给二级索引的"记账本"

第 2 章在 Buffer Pool 的结构表里见过它的名字,这里说透。INSERT / UPDATE 涉及二级索引时,如果目标索引页**不在 Buffer Pool**:

\`\`\`text
唯一索引:必须把页读回来校验唯一性 → 这次磁盘读绕不开
普通索引:无需校验 → 把"这条变更"先记进 Change Buffer,零磁盘读
          之后的合并(merge)时机:该页被读到时 / 后台线程定期 / 崩溃恢复阶段
\`\`\`

效果:把"每次写都随机读一个索引页"变成"先记账后补课",高频写入场景写性能提升明显。占比参数:

\`\`\`sql
SHOW VARIABLES LIKE 'innodb_change_buffer_max';   -- Change Buffer 最大占 Buffer Pool 的百分比
\`\`\`

\`\`\`output
Variable_name              Value
innodb_change_buffer_max   25
\`\`\`

限制记牢:**写多读少的表收益最大** —— 写完没人立刻查,merge 可以攒着批量做(日志表、订单流水);写完马上要读的表(用户余额、库存)每次写都触发读页 merge,反而多一层开销。

### 唯一索引 vs 普通索引怎么选(高频面试题)

| 维度 | 普通索引 | 唯一索引 |
| --- | --- | --- |
| 查询性能 | 命中后要多扫下一条确认"到头了" | 命中即返回 —— 差异在同一页内存内,可忽略 |
| 写入性能 | 页不在内存可记 Change Buffer,**免读盘** | 必须读页校验唯一,Change Buffer 用不上 |
| merge 开销 | 页被读到时一次性合并 | 无(页本来就被读了) |
| 结论 | **业务能保证唯一 → 尽量普通索引** | 唯一性必须数据库兜底 → 该用还得用 |

> [!pitfall] 高频追问:t_order 的 uk_order_no 能不能改成普通索引换写入性能?
> **不能。**订单号唯一是幂等底线,业务层"先查后插"在并发下有窗口期(都查到没有、然后都插入)→ 必须唯一索引兜底,冲突时捕获 ==1062 Duplicate entry== 做幂等处理。选型口诀:**可错的性能用普通,不可错的约束用唯一**;写入特别大的表,把唯一性校验上移到 Redis / 分布式锁之后,再用普通索引换写入吞吐。

## 索引跳跃扫描·索引合并与 MRR(8.0 优化器)

最左前缀是规则,不是铁律。8.0 的优化器会在代价合适时绕开最左前缀(skip scan),会把两个索引的力量合起来(index merge),还会把回表排序后再批量读(MRR)。三者的共同点:**省的是随机 IO**。

### Skip Scan:缺了最左列也能用联合索引

8.0.13 引入。联合索引 (status, amount),查询只带 amount:

\`\`\`sql
ALTER TABLE t_order ADD INDEX idx_status_amount (status, amount);

-- 缺最左列 status,按旧结论应该失效,但优化器可以逐值跳跃
EXPLAIN SELECT id, status, amount FROM t_order WHERE amount = 500;
\`\`\`

\`\`\`output
id  select_type  table    type   possible_keys       key                key_len  ref   rows  filtered  Extra
1   SIMPLE       t_order  range  idx_status_amount   idx_status_amount  6        NULL  92    10.00     Using where; Using index for skip scan
\`\`\`

原理:status 只有 0/1/2 三个值,优化器把 "amount = 500" 拆成 "status = 0 AND amount = 500" OR "status = 1 AND ..." OR "status = 2 AND ...",对每个 status 值做一次索引定位 —— 相当于在最左列的**每个枚举值上跳跃**,所以叫 skip scan。

适用条件(**缺一不可**):

- 最左列**基数很低**(枚举/状态/类型),枚举几次成本可控;
- 后续列选择性好,能过滤掉大部分行;
- 查询的列尽量被索引覆盖(Extra 里常同时出现 Using index),否则回表成本会把优化器吓退。

\`\`\`sql
-- 关掉对比:同一条 SQL 退回全表扫描
SET optimizer_switch = 'skip_scan=off';
EXPLAIN SELECT id, status, amount FROM t_order WHERE amount = 500;
\`\`\`

\`\`\`output
id  select_type  table    type  possible_keys  key   key_len  ref   rows      filtered  Extra
1   SIMPLE       t_order  ALL   NULL           NULL  NULL     NULL  1000000   10.00     Using where
\`\`\`

> [!warn] skip scan 不是万能钥匙
> 最左列基数高(比如 user_id 有几十万值)时,枚举几十万次比全表扫描还慢,优化器会自己放弃。看到 ==Using index for skip scan== 先问一句:最左列有几个不同值?少才是好事。参数开关是 ==optimizer_switch== 里的 ==skip_scan==,压测时可关掉做对照。

### Index Merge:两个索引的临时联合

OR 的两边各走各的索引,优化器可以分别扫描再把主键集合合并。EXPLAIN 的 type 显示 ==index_merge==,Extra 告诉你是哪一种:

| Extra | 合并方式 | 典型场景 | 代价 |
| --- | --- | --- | --- |
| Using intersect(...) | 交集 | AND 两个单列索引,各自过滤性强 | 两棵树都扫,主键求交 |
| Using union(...) | 并集 | OR 两边各有索引 | 两边都扫 + 去重 |
| Using sort_union(...) | 排序后并集 | OR + 范围条件 | 先按主键排序再归并,更贵 |

\`\`\`sql
-- 演示:先移除上文的联合索引,只留两个单列索引
ALTER TABLE t_order DROP INDEX idx_status_amount,
                    ADD INDEX idx_status (status),
                    ADD INDEX idx_amount (amount);

EXPLAIN SELECT * FROM t_order WHERE status = 1 AND amount = 500;
EXPLAIN SELECT * FROM t_order WHERE status = 1 OR amount = 500;
\`\`\`

\`\`\`output
id  select_type  table    type         possible_keys         key                     key_len  ref   rows  Extra
1   SIMPLE       t_order  index_merge  idx_status,idx_amount idx_status,idx_amount   1,6      NULL  12    Using intersect(idx_status,idx_amount); Using where
1   SIMPLE       t_order  index_merge  idx_status,idx_amount idx_status,idx_amount   1,6      NULL  214   Using union(idx_status,idx_amount); Using where
\`\`\`

陷阱:

- **索引合并通常不如一个合适的联合索引**:它要扫两棵树、对主键去重,EXPLAIN 的 rows 只是估算,真实回表可能翻倍;
- OR 两边只要有一边没索引,整个条件退化为全表扫描;
- Using intersect 要求两边都是**等值**且过滤性强,范围条件容易退化成 sort_union 甚至被放弃。

### MRR:把随机回表排成顺序读

二级索引按索引列有序,但拿到的主键是**跳着的** —— 回表就是随机读盘。MRR(Multi-Range Read)把一批主键先收集起来排序,再按主键顺序批量回表,把随机 IO 变成接近顺序 IO:

\`\`\`sql
SET optimizer_switch = 'mrr=on,mrr_cost_based=off';   -- 强制开启,便于观察
EXPLAIN SELECT * FROM t_order WHERE amount BETWEEN 100 AND 500;
\`\`\`

\`\`\`output
id  select_type  table    type   possible_keys  key         key_len  ref   rows  filtered  Extra
1   SIMPLE       t_order  range  idx_amount     idx_amount  6        NULL  386   100.00    Using MRR
\`\`\`

开关与代价:

\`\`\`sql
SELECT @@optimizer_switch LIKE '%mrr=on%' AS mrr_on,
       @@optimizer_switch LIKE '%skip_scan=on%' AS skip_scan_on;

-- 生产建议:让优化器按代价决定,别长期强制
SET optimizer_switch = 'mrr=on,mrr_cost_based=on';
\`\`\`

\`\`\`output
mrr_on  skip_scan_on
1       1
\`\`\`

> [!best] 三个优化的统一口径
> skip scan 用"枚举最左列"换最左前缀;index merge 用"多扫一棵树"换 OR 可用索引;MRR 用"内存排序"换顺序回表。三者都是**优化器按代价选择**的结果,SQL 写法无法强制 —— 执行计划不对时先看统计信息和代价,再考虑改写 SQL 或补联合索引,别急着加 hint。

## 面试速记

- 最左前缀:先按第一列排、相同再按第二列排;只查第二列不走索引。
- 等值+范围可以两列全用;范围列右边的列废了 → 等值在前、范围在后。
- 失效四件套:列上函数/运算、隐式转换(varchar 列遇数字)、前模糊、or 混入无索引列。
- 隐式转换口诀:**字符串和数字比,字符串转数字**;转的是列就失效,转的是常量就不失效。
- 前缀索引用区分度试探选长度,代价是不能覆盖、不能排序。
`,
      },
      /* ─────────────────────────────────────────── */
      {
        id: 'ch04',
        title: 'SQL 优化与 EXPLAIN 实战',
        minutes: 40,
        points: ['EXPLAIN 逐列', 'key_len', '慢查询日志', 'optimizer_trace', '深分页'],
        content: `
> [!interview] 本章面试锚点
> "线上一条 SQL 慢,你的排查步骤是什么?"这是 MySQL 面试的终极大题。标准流程:**慢日志定位 → EXPLAIN 分析(type/key/key_len/rows/Extra)→ 改 SQL 或改索引 → optimizer_trace 验证**。按流程答题,条理分比知识点分更高。

> [!info] 本章导读 · 一条 SQL 为什么突然慢 10 倍
> 半夜告警响了,某个接口的响应时间从 20 毫秒涨到 200 毫秒,数据库 CPU 打满,而你手上只有一条看上去毫无问题的 SQL。靠猜是没用的,得有一套从慢日志到执行计划的排查路径。本章教你读懂 EXPLAIN 的每一列,把"我觉得这里慢"变成"证据显示这里慢"。
> - 读完本章你将能:打开慢查询日志,捞出耗时最高的几条语句
> - 读懂 EXPLAIN 输出里的 type、key、rows、Extra 四列并给出结论
> - 用 optimizer_trace 验证优化器为什么放弃了某个索引

> [!tip] 日常电脑现场 · 导航给你三条路
> 出发前导航列出三条路线:高速快但可能堵、国道稳但绕远、小巷近却红绿灯多,它按实时路况替你选一条,还报出预计耗时。EXPLAIN 就是数据库递给你的这张路线表:走哪个索引、扫多少行、要不要临时表,一眼看清。

## 第一步:慢查询日志把慢 SQL 抓出来

\`\`\`sql
SET GLOBAL slow_query_log = ON;    -- 开慢日志
SET GLOBAL long_query_time = 0.5;  -- 超过 500ms 记录
\`\`\`

\`\`\`output
Query OK, 0 rows affected (0.00 sec)   # 两条 SET 的返回相同
\`\`\`

\`\`\`shell
# 分析慢日志文件:按总耗时排序,取前 3 条
mysqldumpslow -s t -t 3 /var/lib/mysql/db01-slow.log
\`\`\`

\`\`\`output
Count: 1284  Time=1.86s (2389s)  Lock=0.00s (0s)  Rows=18.2 (23369)
  SELECT * FROM t_order WHERE user_id = N ORDER BY amount DESC LIMIT N, N
\`\`\`

一条 ORDER BY amount 的查询霸榜,下面就拿它当靶子。

## EXPLAIN 逐列解读(表格背诵版)

\`\`\`sql
EXPLAIN SELECT * FROM t_order WHERE user_id = 1001 AND create_time = '2026-06-01 10:00:00';
\`\`\`

\`\`\`output
id  select_type  table    type  possible_keys            key                      key_len  ref            rows  filtered  Extra
1   SIMPLE       t_order  ref   idx_user_id_create_time  idx_user_id_create_time  9        const,const    1     100.00    NULL
\`\`\`

| 列 | 看什么 | 常见值 |
| --- | --- | --- |
| id | 执行顺序:同 id 自上而下,不同 id 大者先执行 | 子查询会多行 |
| select_type | 查询类型 | SIMPLE / PRIMARY / SUBQUERY / DERIVED(派生表) |
| type | **访问类型,性能核心** | 见下方等级表 |
| possible_keys | 优化器认为可用的索引 | 可能为 NULL 但 key 有值(覆盖索引) |
| key | 实际使用的索引 | NULL = 没走索引,危险 |
| key_len | 索引实际用到的字节数,**判断联合索引用了几列** | 越接近索引全长越好 |
| ref | 与索引比较的对象 | const / 列名 / NULL |
| rows | 预估扫描行数 | 越小越好 |
| filtered | 剩余行再被条件过滤的比例 | rows × filtered 才是真正参与的行数 |
| Extra | 附加动作 | 见下方重点项 |

type 从好到坏:**system > const > eq_ref > ref > range > index > ALL**。生产红线:至少 ==range==;出现 ==ALL== 要结合 rows 判断(表小无所谓,大表必改)。

| type | 含义 | 出现场景 |
| --- | --- | --- |
| const | 唯一索引等值,最多 1 行 | order_no = '202606...' |
| eq_ref | JOIN 时被驱动表走主键/唯一索引 | JOIN t_user u ON o.user_id = u.id |
| ref | 普通索引等值 | user_id = 1001 |
| range | 索引范围扫描 | user_id > 2000、BETWEEN、IN |
| index | 扫全索引树(比 ALL 好在索引小) | 借最小索引树做 COUNT(*) |
| ALL | 全表扫描 | 无索引可用或优化器放弃 |

**key_len 计算规则**(int=4,bigint=8,datetime=5,varchar=utf8mb4 每字符 4 字节再 +2 长度;列允许 NULL 再 +1):
==idx_user_id_create_time== 两列全用 = 4 + 5 = **9**;只用 user_id = **4**。看到 9 就是两列都参与了定位。

**Extra 四大重点:**

| Extra | 含义 | 处理 |
| --- | --- | --- |
| Using index | 覆盖索引,零回表 | 好事 |
| Using index condition | ICP:引擎层先用索引过滤再回表 | 正常 |
| Using filesort | 额外排序(内存或磁盘) | 大结果集要优化 |
| Using temporary | 建临时表(GROUP BY / DISTINCT 常见) | 要优化 |

> [!warn] EXPLAIN 的 rows 是估算值
> 它基于索引**基数(cardinality)的抽样统计**,不是精确数。统计信息太旧会导致优化器选错索引,生产上"同样的 SQL 今天突然不走索引",先执行 ==ANALYZE TABLE t_order== 重新采样。

## 实战:消灭一次 filesort

\`\`\`sql
EXPLAIN SELECT * FROM t_order WHERE user_id = 1001 ORDER BY amount DESC LIMIT 10;
\`\`\`

\`\`\`output
id  select_type  table    type  possible_keys            key                      key_len  ref    rows  filtered  Extra
1   SIMPLE       t_order  ref   idx_user_id_create_time  idx_user_id_create_time  4        const  18    100.00    Using filesort
\`\`\`

索引里有 user_id、create_time,没有 amount → 排不了,得先回表取数再排序。改建一个把"查 + 排"全覆盖的索引:

\`\`\`sql
ALTER TABLE t_order ADD KEY idx_user_id_amount (user_id, amount);
EXPLAIN SELECT id, user_id, amount FROM t_order WHERE user_id = 1001 ORDER BY amount DESC LIMIT 10;
\`\`\`

\`\`\`output
id  select_type  table    type  possible_keys       key                 key_len  ref    rows  filtered  Extra
1   SIMPLE       t_order  ref   idx_user_id_amount  idx_user_id_amount  4        const  10    100.00    Using index
\`\`\`

rows 直接变 10(沿索引序读前 10 条即停),filesort 消失,还顺带覆盖索引。这就是**索引即排序**的思想:ORDER BY 想免排序,排序顺序必须与索引顺序一致。

## optimizer_trace:看优化器的心思

EXPLAIN 给结论,==optimizer_trace== 给决策过程(为什么放弃这个索引、每个方案的代价):

\`\`\`sql
SET optimizer_trace = 'enabled=on';
SELECT * FROM t_order WHERE user_id = 1001 AND amount > 500;
SELECT * FROM information_schema.OPTIMIZER_TRACE;
\`\`\`

\`\`\`output
{
  "join_optimization": {
    "rows_estimation": [
      { "table_scan": { "rows": 512000, "cost": 102437 } },
      { "potential_range_indexes": [
        { "index": "idx_user_id_amount", "usable": true } ] }
    ],
    "considered_execution_plans": [
      { "table": "t_order",
        "best_access_path": {
          "considered_access_paths": [
            { "access_type": "ref", "index": "idx_user_id_amount",
              "rows": 18, "cost": 21.6, "chosen": true } ] } }
    ]
  }
}
\`\`\`

全表扫 10 万代价 vs 索引访问 21.6 代价,优化器选了后者 —— 代价模型一目了然。

## 深分页:LIMIT 1000000, 10 的问题

==LIMIT 1000000, 10== 不是取 10 条,而是**取 1000010 条再丢掉前 100 万条**:

\`\`\`sql
EXPLAIN SELECT * FROM t_order ORDER BY id LIMIT 1000000, 10;
\`\`\`

\`\`\`output
id  select_type  table    type   possible_keys  key      key_len  ref   rows     filtered  Extra
1   SIMPLE       t_order  index  NULL           PRIMARY  8        NULL  1000010  100.00    NULL
\`\`\`

两种治法:

\`\`\`sql
-- 方案一:游标分页(连续翻页,记录上一页末尾 id,恒定只取 10 行)
SELECT id, order_no, amount FROM t_order WHERE id > 1000000 ORDER BY id LIMIT 10;
-- 方案二:延迟关联(支持跳页:子查询走覆盖索引翻页,外层只回表 10 行)
SELECT o.* FROM t_order o
JOIN (SELECT id FROM t_order ORDER BY id LIMIT 1000000, 10) t ON o.id = t.id;
\`\`\`

延迟关联的实际执行计划:DERIVED 子查询层显示 ==Using index==(覆盖索引顺序翻页),外层对 t_order 是 ==eq_ref== 精确回表,真正的回表只有 10 次。扫描行数没变,但翻页全程走**覆盖索引顺序扫**(不回表,索引页小、顺序 IO),512 万行的表实测耗时从 1.2s 降到 0.15s。应用层游标分页的完整写法:

\`\`\`java
import java.sql.*;

public class DeepPageDemo {
    public static void main(String[] args) throws Exception {
        try (Connection conn = DriverManager.getConnection(
                "jdbc:mysql://127.0.0.1:3306/mall?useSSL=false", "root", "123456")) {
            long lastId = 0;   // 游标:上一页最后一条的 id
            String sql = "SELECT id, order_no, amount FROM t_order WHERE id > ? ORDER BY id LIMIT 1000";
            try (PreparedStatement ps = conn.prepareStatement(sql)) {
                while (true) {
                    ps.setLong(1, lastId);
                    int count = 0;
                    try (ResultSet rs = ps.executeQuery()) {
                        while (rs.next()) { lastId = rs.getLong("id"); count++; }
                    }
                    if (count < 1000) break;   // 不足一页,导出完毕
                }
            }
            System.out.println("导出完成,最后 id = " + lastId);
        }
    }
}
\`\`\`

\`\`\`output
导出完成,最后 id = 5120000
\`\`\`

> [!best] 排查慢 SQL 的完整话术(面试直接背)
> "① 开慢日志,long_query_time 设 0.5s,先用 mysqldumpslow 找最高频的;② EXPLAIN 看五要素:type 是否 ≥ range、key 是否 NULL、key_len 是否用满、rows 是否过大、Extra 是否 filesort/temporary;③ 按'改写 SQL → 加改索引 → 上缓存/读写分离'顺序逐级处理;④ 改完用 optimizer_trace 或压测对比确认收益。"

## Join 算法·聚合排序与窗口函数

> [!interview] 本节面试锚点
> EXPLAIN 看懂之后,面试官会连追三层:"join 底层怎么执行?"(三算法 + 8.0 Hash Join)→ "filesort 内部怎么排?"(单路/双路)→ "8.0 窗口函数用过吗?"(组内排名)。这一节把执行器的算法摊开讲,例子全部在 t_order 上跑。

### Join 三种经典算法

驱动表 t1(100 行)× 被驱动表 t2(10 万行):

\`\`\`text
Simple NLJ(朴素嵌套循环):t2 关联列无索引
  t1 的每一行 → 全表扫一遍 t2 = 100 × 100000 次比较,纯灾难

Index NLJ(索引嵌套循环):t2 关联列有索引
  t1 的每一行 → 走 B+ 树精确定位 t2 = 100 次树查找,基本一次 IO 内完成

Block NLJ(块嵌套循环):t2 无索引时的旧优化
  把 t1 分块读入 join buffer,整块与 t2 全表比对
  t2 扫描次数从 100 次 → ceil(100 / 每块可容行数),块越大扫得越少
\`\`\`

| 算法 | 触发条件 | t2 全表扫描次数 | 优化方向 |
| --- | --- | --- | --- |
| Simple NLJ | 无任何优化 | = 外层行数(100) | 教科书基线 |
| Index NLJ | 被驱动表关联列有索引 | 0 次 | ==给被驱动表关联列建索引==,第一要务 |
| Block NLJ | 无索引,join buffer 分块 | ≈ 外层行数 / 块容量 | 8.0.20 已移除,由 Hash Join 接替 |

走 Index NLJ 的真实计划(user_id 有联合索引,t_user 为小驱动表):

\`\`\`sql
EXPLAIN SELECT o.order_no, u.name
FROM t_user u JOIN t_order o ON o.user_id = u.id
WHERE u.city = '上海';
\`\`\`

\`\`\`output
id  select_type  table  type  possible_keys            key                      key_len  ref    rows  filtered  Extra
1   SIMPLE       u      ALL   NULL                     NULL                     NULL     NULL   100   10.00     Using where
1   SIMPLE       o      ref   idx_user_id_create_time  idx_user_id_create_time  4        u.id   18    100.00    NULL
\`\`\`

u 全扫 100 行(小表驱动),o 每次按索引 ref 精确定位 —— 这就是 Index NLJ 的标准长相。

### Hash Join:8.0.18 的无索引等值 join

\`\`\`sql
-- 明细表 t_order_item 漏给 order_id 建索引(真实生产事故:订单查详情越查越慢)
EXPLAIN SELECT o.order_no, i.sku_id
FROM t_order o JOIN t_order_item i ON i.order_id = o.id;
\`\`\`

\`\`\`output
id  select_type  table         type  possible_keys  key   key_len  ref   rows     filtered  Extra
1   SIMPLE       o             ALL   PRIMARY        NULL  NULL     NULL  512000   100.00    NULL
1   SIMPLE       i             ALL   NULL           NULL  NULL     NULL  1024000  100.00    Using join buffer (hash join)
\`\`\`

原理一句话:**把驱动表整表读进 join buffer 构建哈希表,再扫被驱动表逐行探测哈希表,O(m+n) 一趟完成**,替代 BNL 的多趟扫描。要点:8.0.18 起无索引等值 join 自动走 Hash Join,8.0.20 彻底移除 BNL;8.0.20 起 Hash Join 也扩展到无等值条件、外连接、半连接与反连接等场景,具体以版本和执行计划为准;内存不够会分片落盘(spill)性能骤降 —— 所以结论不变:**等值 join 的关联列必须建索引**。

### ORDER BY:filesort 单路 vs 双路

\`\`\`sql
-- 走索引序:idx_user_id_amount (user_id, amount),等值前导 + 排序列正好接上
EXPLAIN SELECT id, user_id, amount FROM t_order WHERE user_id = 1001 ORDER BY amount DESC LIMIT 10;
-- 没有等值前导:status 条件与 amount 排序连不成索引序 → filesort
EXPLAIN SELECT id, user_id, amount FROM t_order WHERE status = 1 ORDER BY amount DESC LIMIT 10;
\`\`\`

\`\`\`output
-- 第一条:沿索引序读前 10 行即停
id  select_type  table    type  possible_keys       key                 key_len  ref    rows  filtered  Extra
1   SIMPLE       t_order  ref   idx_user_id_amount  idx_user_id_amount  4        const  10    100.00    Using index

-- 第二条:取数进 sort buffer 排序
id  select_type  table    type  possible_keys  key   key_len  ref   rows    filtered  Extra
1   SIMPLE       t_order  ALL   NULL           NULL  NULL     NULL  512000  10.00     Using where; Using filesort
\`\`\`

filesort 内部两种排法(背诵版):

| 维度 | 双路排序(回表排序) | 单路排序(默认) |
| --- | --- | --- |
| 取数 | 两次:先取"排序列 + 行指针"排好序,再按指针回表取整行 | 一次:SELECT 列 + 排序列整行读进 sort buffer |
| IO 特征 | 排完再随机回表,行多时很伤 | 数据一次读齐 |
| 内存 | sort buffer 只放键,省内存 | 行太长吃内存,装不下落盘临时文件 |
| 触发条件 | 行总长 > max_length_for_sort_data | 行总长 ≤ max_length_for_sort_data |

\`\`\`sql
SHOW VARIABLES LIKE 'max_length_for_sort_data';   -- 8.0 默认 4096,行更长就退化成双路
SHOW VARIABLES LIKE 'sort_buffer_size';           -- 每个连接独占,别调太大:500 连接 x 4M 就是 2G
\`\`\`

\`\`\`output
Variable_name               Value
max_length_for_sort_data    4096
sort_buffer_size            262144
\`\`\`

让排序走索引的判定:WHERE 等值列 + ORDER BY 列**连起来**正好等于某联合索引的前缀顺序;两列排序方向相反时,5.7 及以前用不了索引序,8.0 用降序索引解决(第 4 章)。

### GROUP BY:松散索引 · 紧凑索引 · 临时表

\`\`\`text
松散索引扫描:GROUP BY 列是索引最左前缀,聚合只用 MIN / MAX / COUNT(*)
  → 每组直接跳到"组内第一条",代价 ≈ 组数,与总行数无关
紧凑索引扫描:GROUP BY 列可沿索引序读,但还带其他条件或其他聚合
  → 沿索引顺序扫,边读边聚合,代价 ≈ 扫描行数
临时表:GROUP BY 列无索引可用
  → 所有行灌进临时表(内存不够落盘),再聚合,大表上最贵
\`\`\`

\`\`\`sql
-- user_id 是 idx_user_id_amount 前导列 → 松散索引扫描
EXPLAIN SELECT user_id, COUNT(*) FROM t_order GROUP BY user_id;
-- status 无索引 → 临时表
EXPLAIN SELECT status, COUNT(*) FROM t_order GROUP BY status;
\`\`\`

\`\`\`output
-- 松散索引扫描
id  select_type  table    type   possible_keys       key                 key_len  ref   rows  filtered  Extra
1   SIMPLE       t_order  range  idx_user_id_amount  idx_user_id_amount  4        NULL  3200  100.00    Using index for group-by

-- 临时表
id  select_type  table    type  possible_keys  key   key_len  ref   rows    filtered  Extra
1   SIMPLE       t_order  ALL   NULL           NULL  NULL     NULL  512000  100.00    Using temporary
\`\`\`

> [!pitfall] 8.0 的 GROUP BY 不再隐式排序
> 5.7 之前 GROUP BY 默认按分组列排好序,8.0 起取消:**要有序必须显式写 ORDER BY**。老项目升级 8.0 后"结果顺序变了"的兼容性问题多半出在这里。大 GROUP BY 出现 ==Using temporary== 时,第一反应是给分组列补索引消灭临时表。

### 窗口函数(8.0):组内排名的标准答案

高频题:"每个订单组内按金额排名""取每个用户金额最高的订单"。8.0 之前靠相关子查询或自连接,8.0 窗口函数一遍扫完:

\`\`\`sql
SELECT
  user_id,
  order_no,
  amount,
  ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY amount DESC) AS rn,
  RANK()       OVER (PARTITION BY user_id ORDER BY amount DESC) AS rk,
  DENSE_RANK() OVER (PARTITION BY user_id ORDER BY amount DESC) AS drk,
  SUM(amount)  OVER (PARTITION BY user_id ORDER BY amount DESC
                     ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS run_total
FROM t_order
WHERE user_id IN (1001, 1002);
\`\`\`

\`\`\`output
user_id  order_no        amount  rn  rk  drk  run_total
1001     20260601000001  600.00  1   1   1    600.00
1001     20260601000005  500.00  2   2   2    1100.00
1001     20260601000012  500.00  3   2   2    1600.00
1001     20260601000018  300.00  4   4   3    1900.00
1002     20260601000003  980.00  1   1   1    980.00
1002     20260601000009  200.00  2   2   2    1180.00
\`\`\`

三个排名函数的差异看 1001 组的两个 500 就够:**ROW_NUMBER 连续不并列**(2、3),**RANK 并列同名次但跳号**(2、2、下一个跳到 4),**DENSE_RANK 并列不跳号**(2、2、下一个仍是 3)。==SUM(...) OVER== 加上 ==ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW== 就变成累计值(流水累计对账常用)。"每组取第一条"的新旧写法对比:

\`\`\`sql
-- 8.0 之前:相关子查询,外层每一行都要跑一遍 MAX,写法绕、执行慢
SELECT o.* FROM t_order o
WHERE o.amount = (SELECT MAX(o2.amount) FROM t_order o2 WHERE o2.user_id = o.user_id);
-- 8.0:窗口函数 + CTE,一遍扫描出结果
WITH ranked AS (
  SELECT id, user_id, order_no, amount,
         ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY amount DESC) AS rn
  FROM t_order
)
SELECT id, user_id, order_no, amount FROM ranked WHERE rn = 1;
\`\`\`

> [!best] join / 排序 / 分组优化收敛成两句话
> ① **小结果集驱动大表**;② **让被驱动表的关联列、ORDER BY / GROUP BY 的列都落到索引序上** —— join 变 Index NLJ、排序免 filesort、分组免 temporary,一张联合索引常常同时解决三件事。

## 面试速记

- 慢 SQL 四步:慢日志定位 → EXPLAIN 分析 → 改 SQL/索引 → trace 或压测验证。
- type 等级:const > eq_ref > ref > range > index > ALL;生产至少 range。
- key_len 是"联合索引用了几列"的铁证:int 4 / bigint 8 / datetime 5 / varchar 4n+2 / NULL 再 +1。
- Extra:Using index 是好事;Using filesort、Using temporary 要优化。
- 深分页:游标分页(连续翻页)或延迟关联(跳页),本质都是"覆盖索引翻页,只回表最后一小段"。
`,
      },
      /* ─────────────────────────────────────────── */
      {
        id: 'ch05',
        title: '事务与隔离级别',
        minutes: 30,
        points: ['ACID 实现', '隔离级别', '脏读/幻读', '默认 RR', '快照读'],
        content: `
> [!interview] 本章面试锚点
> 事务是 MySQL 面试的第二道分水岭。两个必考问题:① "ACID 分别是怎么实现的?" —— 考每个字母对应哪个机制(undo / redo / MVCC+锁);② "MySQL 为什么默认 RR 而不是 RC?" —— 考 binlog 复制的历史。先点演示,直观看到不同隔离级别下并发的差异。

\`\`\`demo:tx-isolation
\`\`\`

> [!info] 本章导读 · 转账转到一半,机房断电了怎么办
> 钱从 A 账户扣掉、还没加进 B 账户的那一刻,整栋楼跳闸了。数据库重启之后,这笔钱算转了还是没转?这就是事务要回答的问题:一组操作要么全成,要么全败,没有中间状态。本章从 ACID 四个字母讲起,一路讲到隔离级别和线上最怕的幻读。
> - 读完本章你将能:写出一个真实回滚的事务,并观察提交前后的数据差异
> - 把 ACID 四个字母分别对应到具体的实现机制
> - 复现脏读、不可重复读、幻读三种异常,并说明隔离级别如何拦住它们

> [!tip] 日常电脑现场 · 抢票时锁住座位
> 选好座位点"提交订单",那几排座位立刻变成灰色,别人再点就提示已被占用;十分钟内没付款,座位又悄悄放出来。事务就是一段被围起来的操作:扣款、减库存、写订单一起生效,中途失败就整体撤销。

## ACID:三个手段 + 一个目的

| 字母 | 含义 | 靠什么实现 |
| --- | --- | --- |
| A 原子性 | 事务内操作要么全成功要么全失败 | **undo log**:回滚时按反向日志撤销 |
| C 一致性 | 事务前后数据满足业务约束 | **前三者 + 应用层约束**共同达成的结果 |
| I 隔离性 | 并发事务互不干扰 | **MVCC(快照读)+ 锁(当前读)** |
| D 持久性 | 提交后断电不丢 | **redo log**:WAL 先写日志,宕机后重放 |

> [!interview] 高频追问:一致性到底是靠什么保证的?
> 这题考层次感。标准答案:**一致性是目的,AID 是手段** —— undo 保证不出半截、redo 保证不丢、锁与 MVCC 保证并发不乱,再叠加应用层的唯一键、外键与业务校验,才换来"从一个一致状态到另一个一致状态"。只答"靠 undo log"是不完整的。

## 三大并发读异常

用同一段剧本看三个异常:账户余额 500,事务 A 在读,事务 B 在改。

\`\`\`text
① 脏读:A 读到 B 未提交的 400;B 回滚 → A 拿着从未存在过的数据继续算
② 不可重复读:A 第一次读 500;B 提交 400;A 再读变成 400(同一行值变了)
③ 幻读:A 查 status=1 有 10 条;B 插入 1 条并提交;A 再查变 11 条(结果集行数变了)

| 异常 | 本质 | 谁允许它 | 谁解决它 |
| --- | --- | --- | --- |
| 脏读 | 读了未提交数据 | READ UNCOMMITTED | READ COMMITTED 起 |
| 不可重复读 | 同一行两次读值不同 | READ COMMITTED | REPEATABLE READ(MVCC 快照) |
| 幻读 | 同一条件两次查行数不同 | REPEATABLE READ 的当前读 | 间隙锁 / Serializable |

> [!warn] 一个常见误解
> "RR 解决了幻读"只对**快照读**成立:普通 SELECT 复用 ReadView,看不到新插入的行。但 ==SELECT ... FOR UPDATE== 是当前读,会看到新行,必须靠**间隙锁(Next-Key Lock)**阻止别人插入。面试答"RR 靠 MVCC 防幻读"要补这一句,否则被追问就露馅。

## 四种隔离级别

| 隔离级别 | 脏读 | 不可重复读 | 幻读 | 说明 |
| --- | --- | --- | --- | --- |
| READ UNCOMMITTED | 可能 | 可能 | 可能 | 几乎不用 |
| READ COMMITTED | 避免 | 可能 | 可能 | **Oracle / PostgreSQL 默认**,互联网公司常用 |
| REPEATABLE READ | 避免 | 避免 | 基本避免(InnoDB) | **MySQL 默认** |
| SERIALIZABLE | 避免 | 避免 | 避免 | 读也加锁,并发最差 |

验证 RC 与 RR 的行为差异(两个会话,统一用 t_order):

\`\`\`sql
-- 会话 B:改数据并提交
START TRANSACTION;
UPDATE t_order SET amount = 600 WHERE id = 1;
COMMIT;
\`\`\`

\`\`\`sql
-- 会话 A:两次读之间夹着 B 的提交
START TRANSACTION;
SELECT amount FROM t_order WHERE id = 1;   -- 第一次读
-- 此时会话 B 执行了 UPDATE 并 COMMIT
SELECT amount FROM t_order WHERE id = 1;   -- 第二次读
COMMIT;
\`\`\`

\`\`\`output
# REPEATABLE READ(默认):
amount
500.00        ← 第一次读
amount
500.00        ← 第二次读仍是 500:RR 只认第一次的 ReadView

# READ COMMITTED(SET SESSION transaction_isolation = 'READ-COMMITTED'):
amount
500.00
amount
600.00        ← 读到了 B 提交的新值:RC 每次读都刷新 ReadView
\`\`\`

## 为什么默认 RR 而不是 RC(历史题,加分点)

- 早期 MySQL 的 binlog 只有 ==STATEMENT== 格式:主库把 SQL 原文抄给从库重放。
- RC 下主从**执行顺序可能不同**:主库事务按 A→B 提交,从库重放时语句交错,造成主从数据不一致(官方早期 bug)。
- RR 下语句按事务先后执行,STATEMENT 复制才安全 → 默认 RR 沿用至今。
- **反转加分**:5.0 之后 ==binlog_format=ROW== 按行记录,RC 下复制也安全了,所以**互联网公司大量改用 RC**(如阿里系默认 RC)—— RC 没有间隙锁,并发好、死锁少,代价是放弃 RR 对幻读的防护。

\`\`\`sql
SHOW VARIABLES LIKE 'transaction_isolation';
SHOW VARIABLES LIKE 'binlog_format';
\`\`\`

\`\`\`output
Variable_name           Value
transaction_isolation   REPEATABLE-READ
binlog_format           ROW
\`\`\`

## RR 到底防没防住幻读(高频陷阱题)

分三种情况,答全才满分:

- **纯快照读**:防住。事务内所有普通 SELECT 复用第一次的 ReadView,别人插入的行对它不可见。
- **纯当前读**:防住。==SELECT ... FOR UPDATE / UPDATE / DELETE== 用临键锁把区间锁死,别人插不进去(第 8 章详解)。
- **快照读与当前读混用**:破功。经典时序:

\`\`\`text
事务 A(RR)                            事务 B
BEGIN;
SELECT * FROM t_order WHERE id = 5;    -- 快照读:无此行
                                       INSERT INTO t_order(id,...) VALUES(5,...); COMMIT;
UPDATE t_order SET status=1 WHERE id=5; -- 当前读:能改到 B 插入的行!
SELECT * FROM t_order WHERE id = 5;    -- 快照读:竟然看到了 id=5(幻影行)
\`\`\`

UPDATE 是当前读,把 B 插入的行改成了自己事务的版本,快照读顺藤摸瓜看到了它。**防御:关键业务先 ==SELECT ... FOR UPDATE== 固定成当前读,全程读法一致。**

## 顺带补一个实操细节:SAVEPOINT 部分回滚

面试问"事务能不能回滚一半",答案是 SAVEPOINT(存档点):

\`\`\`sql
START TRANSACTION;
INSERT INTO t_order(user_id, order_no, amount) VALUES(1001, '20260602A', 9.90);
SAVEPOINT sp1;
UPDATE t_order SET status = 1 WHERE id = 1;
ROLLBACK TO sp1;   -- 只撤销 UPDATE,INSERT 保留
COMMIT;            -- 最终只有 INSERT 生效
\`\`\`

\`\`\`output
Query OK, 0 rows affected (0.00 sec)
\`\`\`

存档点可以设多个,逐层回退;RELEASE SAVEPOINT 可显式释放。它是数据库层的"游戏存档",复杂业务里能把"全成功或全失败"细化成"分阶段失败回退"。

> [!pitfall] 只说"RR 完全防住了幻读"会被追杀
> 正确话术:==**InnoDB 在 RR 下通过 MVCC + 临键锁"很大程度上"避免了幻读,但快照读与当前读混用仍会出现幻影行**==。这句限定词就是专业度本身。

## 面试速记

- ACID 来源:undo→原子、redo→持久、MVCC+锁→隔离;一致性是三者 + 应用约束共同达成的目的。
- 三异常:脏读读未提交;不可重复读是值变(update);幻读是行数变(insert)。
- 级别:RU 全裸 → RC 防脏读(Oracle/PG 默认)→ RR 基本防幻读(MySQL 默认)→ Serializable 全锁。
- 默认 RR 的历史:STATEMENT binlog 下 RC 复制会乱序;ROW 格式后已无此顾虑,阿里系改 RC 换并发。
- RR 防幻读:快照读靠 ReadView、当前读靠临键锁;两者混用会出现幻影行。
`,
      },
      /* ─────────────────────────────────────────── */
      {
        id: 'ch06',
        title: 'MVCC 实现原理',
        minutes: 35,
        points: ['隐藏字段', '版本链', 'ReadView', 'RC vs RR', '当前读'],
        content: `
> [!interview] 本章面试锚点
> MVCC 是 MySQL 面试区分"背题者"与"理解者"的试金石。答题框架必须完整:**隐藏字段 → undo log 版本链 → ReadView 四要素 → 可见性判断 → RC 与 RR 生成时机差异 → 快照读 vs 当前读**。少说一环就会被连环追问。先点演示把版本链玩一遍。

\`\`\`demo:mvcc
\`\`\`

> [!info] 本章导读 · 别人改了数据,为什么我这边还能读到旧值
> 你在打印一份报表,同事同时修改了其中几行,可你手里的纸一个字都没变,因为你拿到的是那一刻的快照。数据库里的多版本并发控制做的就是这件事:每次修改留一个旧版本,读的人各看各的,读写互不阻塞。本章沿着版本链一路追下去,把读到的到底是谁的数据彻底搞清。
> - 读完本章你将能:画出隐藏字段与 undo 版本链的结构图
> - 按 ReadView 的四个要素,一步步判断某一行对当前事务是否可见
> - 解释同一段代码在 RC 和 RR 下为什么读到不同结果

> [!tip] 日常电脑现场 · 引用回复的旧消息
> 微信里长按一条旧消息点"引用",哪怕对方早已撤回,你引用的框里还是原来那段文字。数据库的快照读也一样:事务启动那一刻拍一张照片,之后别人怎么改,你读到的都是照片里的样子。

## 三大隐藏字段

InnoDB 在每行记录后面偷偷加了三个字段,它们是 MVCC 和聚簇索引的基石:

| 字段 | 长度 | 作用 |
| --- | --- | --- |
| DB_TRX_ID | 6 字节 | 最近一次修改该行的事务 ID,ReadView 用它判断版本可见性 |
| DB_ROLL_PTR | 7 字节 | 回滚指针,指向 undo log 中的上一个版本,串成版本链 |
| DB_ROW_ID | 6 字节 | 表没有主键时生成的隐藏主键,用作聚簇索引键 |

两点延伸:① 有主键时聚簇索引用主键,==DB_ROW_ID 不会出现==;② **二级索引的叶子节点存的是"索引列 + 主键值"**,所以按二级索引查非索引列必须"回表"——拿主键再查一次聚簇索引。覆盖索引之所以快,就是因为它要的列全在二级索引里,省掉了这次回表。

## undo log 版本链

初始 amount=500 由事务 50 写入。随后:

\`\`\`sql
-- 事务 100(未提交)
UPDATE t_order SET amount = 600 WHERE id = 1;
-- 事务 200(已提交)
UPDATE t_order SET amount = 700 WHERE id = 1;
\`\`\`

\`\`\`output
amount
700.00     ← 任意一个新事务的快照读:链头 trx_id=200 已提交,判定可见
\`\`\`

版本链(从新到旧):

\`\`\`text
最新行 [trx_id=200, amount=700]
   │ DB_ROLL_PTR
   ▼
undo [trx_id=100, amount=600]
   │ DB_ROLL_PTR
   ▼
undo [trx_id=50,  amount=500]
\`\`\`

ReadView 的工作就是**从链头开始,沿 roll_ptr 往回找"对我可见的第一个版本"**。

## ReadView 四要素(必背)

| 字段 | 含义 |
| --- | --- |
| m_ids | 生成 ReadView 时**还在活跃(未提交)**的事务 id 列表 |
| min_trx_id | m_ids 中的最小值 |
| max_trx_id | 系统**下一个将要分配**的事务 id(注意不是 m_ids 最大值) |
| creator_trx_id | 创建这个 ReadView 的事务自己 |

可见性判断(对版本链上某个版本的 trx_id):

\`\`\`text
1. trx_id == creator_trx_id   → 可见(自己改的,当然可见)
2. trx_id < min_trx_id        → 可见(生成快照前就已提交)
3. trx_id >= max_trx_id       → 不可见(快照之后才开启的事务)
4. min ≤ trx_id < max:
     在 m_ids 里   → 不可见(还没提交)
     不在 m_ids 里 → 可见(已提交)
不可见就沿 roll_ptr 找上一个版本,直到找到可见版本或走到链尽头。
\`\`\`

走一遍实例:事务 300 发起查询,此时事务 100 未提交、事务 200 已提交:

\`\`\`text
ReadView:m_ids={100}, min=100, max=201, creator=300

链头 trx_id=200:100 ≤ 200 < 201,且不在 m_ids → 可见 → 返回 amount=700
\`\`\`

假如事务 100 也未提交就查询(m_ids={100,200}):链头 200 在 m_ids → 不可见 → 回退到 trx 100,也在 m_ids → 不可见 → 再回退到 trx 50,50 < 100 → 可见 → 返回 500。

> [!tip] 为什么 max_trx_id 不是 m_ids 的最大值
> 活跃事务可能同时挂着 100 和 200,而系统已把 300 分配出去(300 已提交、200 还没完)。==max_trx_id 是"下一个将分配"==,保证"生成 ReadView 之后才开启的事务"无论提交与否一律不可见 —— 这是快照语义的边界。

## RC 与 RR:唯一区别是 ReadView 生成时机

| 级别 | ReadView 生成时机 | 效果 |
| --- | --- | --- |
| RC | **每次快照读**都生成新的 | 能读到"查询那一刻已提交"的最新值 |
| RR | **第一次快照读**生成,之后复用 | 整个事务看到的都是开启事务那一刻的快照 |

就这一处差异,其余规则完全相同。上面第 6 章的实验结果直接顺推出来:RR 里"别人提交了你也看不见",是因为 ReadView 没刷新,m_ids 冻结在开局时刻。

\`\`\`sql
-- RR 下事务 A 的时序
START TRANSACTION;
SELECT amount FROM t_order WHERE id = 1;  -- 生成 ReadView:m_ids={200}
-- 事务 200 此刻提交
SELECT amount FROM t_order WHERE id = 1;  -- 复用旧 ReadView → 仍读旧值
\`\`\`

\`\`\`output
amount
500.00     ← RR:复用开局 ReadView,m_ids 冻结,读到的还是快照
\`\`\`

## 快照读 vs 当前读

| 读取方式 | 语句 | 加不加锁 | 读哪个版本 |
| --- | --- | --- | --- |
| 快照读 | 普通 SELECT | 不加锁,MVCC | ReadView 可见的版本 |
| 当前读 | SELECT ... FOR UPDATE / FOR SHARE / UPDATE / DELETE / INSERT | 加锁(第 8 章) | **最新已提交版本** |

\`\`\`sql
SELECT amount FROM t_order WHERE id = 1;                  -- 快照读:走版本链
SELECT amount FROM t_order WHERE id = 1 FOR UPDATE;       -- 当前读:读最新 + 加 X 锁
\`\`\`

> [!interview] 高频追问:为什么当前读必须读最新版本?
> 因为要改数据:如果改的是快照里的旧值,提交时会与别人的新值冲突(丢失更新)。所以 ==UPDATE / DELETE / FOR UPDATE== 必须**拿到最新版本再加锁修改** —— 这就是"当前读"名字的由来:读"现在",不读"快照"。

## MVCC 只在 RC / RR 下存在

四个隔离级别里,MVCC 只服务其中两个,原因各不相同:

| 级别 | 读的方式 | 为什么这样设计 |
| --- | --- | --- |
| READ UNCOMMITTED | 不生成 ReadView,直接读最新数据 | 连未提交的都能读,自然不需要版本链 |
| READ COMMITTED | 每条语句生成新 ReadView | 只读已提交,语句间能看到别人的提交 |
| REPEATABLE READ | 事务第一次快照读时生成,全程复用 | 同事务多次读一致 |
| SERIALIZABLE | 快照读也加共享锁,退化为当前读 | 用锁换绝对一致,MVCC 名存实亡 |

所以 MVCC 的本质是:**给 RC/RR 的普通读开了一条"不加锁的快车道"**,写操作仍然靠行锁。RC 与 RR 的差别不在版本链,只在 **ReadView 的生成时机**。

## 面试速记

- 三件套:隐藏字段(trx_id / roll_ptr)+ undo 版本链 + ReadView,从链头找第一个可见版本。
- ReadView 四要素:m_ids / min / max(下一个将分配!)/ creator;在 m_ids = 未提交 = 不可见。
- RC 每次读新 ReadView,RR 第一次读生成后复用 —— 一句话记住全部差异。
- 快照读不加锁读快照;当前读(FOR UPDATE / UPDATE / DELETE)加锁读最新。
- MVCC 只在 RC/RR:RU 不需要,Serializable 全锁化;读写不阻塞是高并发的来源。
`,
      },
      /* ─────────────────────────────────────────── */
      {
        id: 'ch07',
        title: '锁机制详解',
        minutes: 35,
        points: ['记录锁', '间隙锁', '临键锁', '加锁规则', '死锁排查'],
        content: `
> [!interview] 本章面试锚点
> 锁的面试套路是三连击:"MySQL 有哪些锁?" → 从**粒度**(全局/表/行)答起;"InnoDB 行锁有几种?" → 钻进**三兄弟**(记录/间隙/临键);"死锁遇到过吗怎么排查?" → 落到实战。间隙锁是 RR 的灵魂,也是死锁的头号惯犯,必须讲透。

> [!info] 本章导读 · 两个人同时抢最后一张票,数据库怎么判
> 售票窗口只剩一张票,两个柜台同时按下确认。如果没人管,两边都会看到还剩一张,然后把同一张票卖两次。数据库用锁来避免这种荒唐事:谁先碰到这行数据,谁就把它按住,另一个只能排队。本章从锁的粒度讲到间隙锁和死锁,把并发写入的秩序还原出来。
> - 读完本章你将能:开两个会话复现一次行锁等待,并观察超时报错
> - 说清记录锁、间隙锁、临键锁各自锁住的范围
> - 在死锁日志里找到互相冲突的两条 SQL,并给出降低死锁概率的改法

> [!tip] 日常电脑现场 · 共享单车扫码开锁
> 扫码后车锁"咔"一声弹开,这辆车在系统里立刻被标成骑行中,旁边的人再扫只会提示已被使用;等你锁车结账,它才重新可借。行锁就是这样:谁先拿到这一行的锁谁先办事,后来的人排队等。

## 按粒度分:全局锁 · 表级锁 · 行级锁

| 粒度 | 加锁方式 | 用途 |
| --- | --- | --- |
| 全局锁 | FLUSH TABLES WITH READ LOCK(FTWRL) | 全库逻辑备份,库只读 |
| 表级锁 | LOCK TABLES ... READ / WRITE | MyISAM 时代的主力 |
| 表级 MDL | 元数据锁(系统自动加) | 增删改查持 MDL 读锁,DDL 要 MDL 写锁 |
| 表级意向锁 | IS / IX(自动) | 标记"表里有行锁",加表锁前快速判断 |
| 行级锁 | Record / Gap / Next-Key | InnoDB 专属,**加在索引上** |

两个高频细节:

- **备份不用 FTWRL**:InnoDB 有事务,==mysqldump --single-transaction== 借 MVCC 拿到一致快照,全程不锁库(前提引擎是 InnoDB)。
- **MDL 写锁等待的经典事故**:一个长事务没提交,一直持有 MDL 读锁;此时 ==ALTER TABLE== 要 MDL 写锁,被阻塞;**后面所有对这个表的查询也要排在 ALTER 后面** → 全表瘫痪。解法:DDL 前先查长事务、给 DDL 设 ==lock_wait_timeout==。

\`\`\`sql
-- 看当前未提交的事务(MDL 事故排查第一步)
SELECT trx_id, trx_mysql_thread_id, trx_started, trx_query
FROM information_schema.innodb_trx;
\`\`\`

\`\`\`output
trx_id   trx_mysql_thread_id  trx_started          trx_query
421905   88                   2026-06-01 15:02:11  NULL      ← 线程 88 挂着不提交
\`\`\`

## 行级三兄弟:记录锁 · 间隙锁 · 临键锁

| 锁 | 锁什么 | 表示 |
| --- | --- | --- |
| Record Lock 记录锁 | 索引记录本身 | 记录 |
| Gap Lock 间隙锁 | 记录之间的**开区间**,防止插入 | (a, b) |
| Next-Key Lock 临键锁 | 记录 + 它前面的间隙,**左开右闭** | (a, b] |

\`\`\`text
索引 user_id 现有值:1, 5, 10, 20
临键锁视角下可被锁住的区间:(-∞,1] (1,5] (5,10] (10,20] (20,+∞)
\`\`\`

> [!tip] 8.0 的退化优化(答出来是亮点)
> RR 下唯一索引(含主键)**等值查询且记录存在**时,临键锁退化为纯记录锁 —— 值既然唯一,间隙锁就没有防幻读的意义。面试补一句"InnoDB 新版本在不断减少间隙锁的滥用",直接体现版本跟踪能力。

## 什么时候加锁:快照读不加锁,当前读才加锁

**普通 SELECT 是快照读,靠 MVCC,一行锁都不加。** 加锁的全是当前读:

\`\`\`sql
SELECT * FROM t_order WHERE id = 1;                      -- 快照读:无锁
SELECT * FROM t_order WHERE id = 1 FOR UPDATE;           -- 当前读:X 锁
SELECT * FROM t_order WHERE id = 1 FOR SHARE;            -- 当前读:S 锁(旧写法 LOCK IN SHARE MODE)
UPDATE t_order SET status = 1 WHERE id = 1;              -- 当前读:X 锁
DELETE FROM t_order WHERE id = 1;                        -- 当前读:X 锁
\`\`\`

当前读的加锁规则(RR,必背):

- 条件是**唯一索引等值且命中** → 退化为记录锁;
- **唯一索引等值未命中** → 加命中位置附近一条记录前后的**间隙锁**;
- **普通索引等值** → 临键锁,并向右扫到第一个不匹配的值(该间隙也锁住);
- **范围查询**(>、<、BETWEEN)→ 扫过的区间全部上临键锁;
- **条件列没有索引** → 全表扫描,所有记录与间隙都加锁 = **锁全表效果**。

\`\`\`sql
-- 条件列 remark 无索引:当前读锁全表(行锁升级的元凶)
SELECT * FROM t_order WHERE remark = 'x' FOR UPDATE;

-- 8.0 查看当前锁:performance_schema.data_locks
SELECT INDEX_NAME, LOCK_TYPE, LOCK_MODE, LOCK_DATA
FROM performance_schema.data_locks;
\`\`\`

\`\`\`output
INDEX_NAME               LOCK_TYPE  LOCK_MODE   LOCK_DATA
PRIMARY                  RECORD     X           supremum pseudo-record
PRIMARY                  RECORD     X           1
PRIMARY                  RECORD     X           2
PRIMARY                  RECORD     X           ...      ← 全表每行都被 X 锁住
\`\`\`

> [!danger] 行锁只在索引上加
> "行锁"锁的永远是**索引项**。条件没有索引 → 只能全表扫描并锁住全部记录,行锁退化成表锁效果。生产教训:UPDATE / DELETE 的 WHERE 必须走索引,否则一个批量更新就能卡死整张表。

## 死锁:间隙锁的经典互杀

复现步骤(两个会话,RR 隔离):

\`\`\`sql
-- 会话 A
START TRANSACTION;
SELECT * FROM t_order WHERE user_id = 1005 FOR UPDATE;  -- 1005 不存在 → 加间隙锁 (1002,1008)
-- 会话 B
START TRANSACTION;
SELECT * FROM t_order WHERE user_id = 1006 FOR UPDATE;  -- 也不存在 → 同一间隙再上锁,间隙锁之间兼容!
-- 会话 A
INSERT INTO t_order(user_id, order_no, amount) VALUES(1005, '20260601A', 9.90);  -- 被 B 的间隙锁挡住,等待
-- 会话 B
INSERT INTO t_order(user_id, order_no, amount) VALUES(1006, '20260601B', 9.90);  -- 被 A 的间隙锁挡住 → 死锁!
\`\`\`

\`\`\`output
ERROR 1213 (40001): Deadlock found when trying to get lock; try restarting transaction
\`\`\`

死锁链条:**间隙锁之间互相兼容(都能加),但插入意向锁会被对方的间隙锁阻塞** —— 双方各持间隙锁再互插,必然互等。InnoDB 自动检测死锁,回滚代价小(undo 量小)的一方。

排查与治理:

\`\`\`sql
SHOW ENGINE INNODB STATUS;                    -- LATEST DETECTED DEADLOCK 段(只保留最近一次)
SET GLOBAL innodb_print_all_deadlocks = ON;   -- 全部死锁记入错误日志
\`\`\`

\`\`\`output
------------------------
LATEST DETECTED DEADLOCK
------------------------
2026-06-01 16:20:33 0x7f8a2c1e4700
*** (1) TRANSACTION:
TRANSACTION 421873, ACTIVE 0 sec inserting
mysql tables in use 1, locked 1
LOCK WAIT 3 lock struct(s)
*** (2) TRANSACTION:
TRANSACTION 421874, ACTIVE 0 sec inserting
*** WE ROLL BACK TRANSACTION (1)
\`\`\`

避免死锁五条:① 多事务**固定加锁顺序**(如都按 id 升序);② 事务尽量小、尽快提交;③ WHERE 条件建好索引,避免无索引锁全表;④ 高并发热点场景改 **RC**(无间隙锁,死锁率骤降),前提 binlog 为 ROW;⑤ 应用层捕获 ==1213== 错误自动重试。

## 悲观锁与乐观锁(业务视角)

| 思路 | 实现 | 适用 |
| --- | --- | --- |
| 悲观锁 | SELECT ... FOR UPDATE 先锁再改 | 冲突高,如秒杀扣库存 |
| 乐观锁 | 表加 version 字段,==UPDATE ... SET version = version + 1 WHERE id = ? AND version = ?== | 冲突低,读多写少 |

> [!best] 乐观锁必须检查受影响行数
> UPDATE 的 ==affected_rows == 0== 说明版本已被别人改过,业务要**重试或报错**,绝不能当成功处理。MyBatis 写法里拿 update 语句的返回值接住。

## 自增锁·插入意向锁与锁参数

> [!interview] 本节面试锚点
> "行级三兄弟"答完,面试官常补两刀:"自增主键的 AUTO-INC 锁说一下?""为什么 8.0 默认 autoinc_lock_mode = 2?"再深挖就是插入意向锁与间隙锁的配合(死锁元凶)与两个超时参数。这一节把剩下的锁补齐。

### AUTO-INC 锁与 innodb_autoinc_lock_mode

自增计数器的并发安全由 AUTO-INC 锁保护,三种模式:

| 模式 | 名称 | 加锁方式 | 自增值 | 并发 |
| --- | --- | --- | --- | --- |
| 0 | traditional | 每条 INSERT 拿表级 AUTO-INC 锁,语句结束即释放(不等到事务结束) | 严格连续 | 最差 |
| 1 | consecutive(5.7 默认) | 行数已知的 insert 用轻量级互斥;行数未知的批量(insert-select、load data)才拿表级锁 | 连续 | 中 |
| 2 | interleaved(**8.0 默认**) | 一律轻量级互斥,不拿表锁 | 并发语句交错取号,可能出现空洞 | 最好 |

\`\`\`sql
SHOW VARIABLES LIKE 'innodb_autoinc_lock_mode';
SHOW VARIABLES LIKE 'binlog_format';
\`\`\`

\`\`\`output
Variable_name               Value
innodb_autoinc_lock_mode    2
binlog_format               ROW
\`\`\`

**为什么 8.0 默认 2,并且必须搭配 binlog_format=ROW?** STATEMENT 复制重放的是 SQL 原文,mode 2 下并发语句交错取号,从库重放时分配的 id 可能与主库不同 → 主从不一致;mode 0/1 的表级锁又牺牲并发。ROW 复制记录**行的最终值**(生成的 id 已写在行镜像里),不依赖执行时序 → mode 2 从此安全。==8.0 的"默认 2 + 默认 ROW"是一套配套设计==,能讲出这层因果就是版本跟踪的加分项。代价也要知道:mode 2 下自增值可能空洞(事务回滚、交错取号都算),==自增 id 只保证唯一和递增方向,不保证连续==。

### 插入意向锁(Insert Intention Lock)

INSERT 真正写入前,先对目标位置所在的间隙加一把**插入意向锁**,两条规则:

\`\`\`text
① 插入意向锁彼此兼容:同一间隙里多个 insert 各插各的位置,互不阻塞
   → "查询锁得死、插入排得欢",高并发写单表互不卡的原因之一
② 插入意向锁与 Gap Lock 冲突:目标间隙被别人加了间隙锁(当前读未命中 / 范围锁)
   → INSERT 必须等待;等待中的插入意向锁在 data_locks 里显示 INSERT_INTENTION
\`\`\`

本章前面的经典死锁正是这条规则的产物:双方各持同一间隙的间隙锁(间隙锁之间兼容),再互相 INSERT → 插入意向锁被对方的间隙锁挡住 → 互等死锁。现场观察:

\`\`\`sql
-- 会话 A:当前读 user_id = 1007(不存在)→ 加间隙锁 (1002,1008)
SELECT * FROM t_order WHERE user_id = 1007 FOR UPDATE;
-- 会话 B:插入落在同一间隙 → 插入意向锁被 A 的间隙锁阻塞
INSERT INTO t_order(user_id, order_no, amount) VALUES(1006, '20260603A', 9.90);
-- 会话 C(排查):
SELECT INDEX_NAME, LOCK_TYPE, LOCK_MODE, LOCK_STATUS, LOCK_DATA
FROM performance_schema.data_locks;
\`\`\`

\`\`\`output
INDEX_NAME               LOCK_TYPE  LOCK_MODE             LOCK_STATUS  LOCK_DATA
idx_user_id_create_time  RECORD     X,GAP                 GRANTED      1008, 421901   ← A 的间隙锁 (1002,1008)
idx_user_id_create_time  RECORD     X,INSERT_INTENTION    WAITING      1008, 421901   ← B 的插入被挡
\`\`\`

> [!tip] 插入意向锁不是意向锁
> IS / IX 意向锁是**表级**标记("表里有行锁了");插入意向锁是**间隙上的行级锁**,"意向"指"我打算往这个间隙插入"。重名不同物,面试别混为一谈。

### 两个必背参数与 FOR UPDATE / FOR SHARE

\`\`\`sql
SHOW VARIABLES LIKE 'innodb_lock_wait_timeout';
SHOW STATUS LIKE 'Innodb_row_lock%';
\`\`\`

\`\`\`output
Variable_name                   Value
innodb_lock_wait_timeout        50

Innodb_row_lock_current_waits   2
Innodb_row_lock_time            96125
Innodb_row_lock_time_avg        2136
Innodb_row_lock_time_max        50207
Innodb_row_lock_waits           45
\`\`\`

- ==innodb_lock_wait_timeout== 默认 **50 秒**,行锁等待超时报 ==ERROR 1205==;且默认 ==innodb_rollback_on_timeout=OFF==,**超时只回滚当前语句、事务不回滚**,必须显式 ROLLBACK,否则后续语句还在原事务里。
- 区分两个错误:**1213 死锁是引擎立刻检测、自动回滚一方;1205 是干等 50 秒后失败**。线上大量 1205 → 先查长事务、再查缺失索引的 UPDATE / DELETE。

| 维度 | SELECT ... FOR UPDATE | SELECT ... FOR SHARE(旧写法 LOCK IN SHARE MODE) |
| --- | --- | --- |
| 加的锁 | 排他锁 X | 共享锁 S |
| 别的事务写这行 | 阻塞 | 阻塞 |
| 别的事务再加 S 锁读 | 可以(S 与 S 兼容) | 可以 |
| 典型场景 | 先读后改:扣库存、扣余额 | 读校验期间不许被改:转账前核对对方账户 |
| 坑 | 长事务持 X,业务全部排队 | 死锁高发:都持 S 再都想 UPDATE 升级 X → 互等 |

\`\`\`sql
-- S 锁升级死锁时序:A、B 两个会话各自先拿到 S 锁,再各自 UPDATE
SELECT * FROM t_order WHERE id = 1 FOR SHARE;   -- A、B 都成功:S 与 S 兼容
UPDATE t_order SET status = 1 WHERE id = 1;     -- 双方同时执行:X 被对方的 S 挡住 → 互等 → 1213
\`\`\`

> [!best] 选型一句话
> 读完就要改 → 毫不犹豫 ==FOR UPDATE==;只是想要"读的时候不被改" → 大多数情况普通 SELECT 的 MVCC 快照读就够了,**FOR SHARE 只在读出结果立刻要当修改依据、又容忍不了读后被改的场景用**。

## 面试速记

- 粒度:全局锁(备份,InnoDB 用 --single-transaction 替代)、表级(MDL / 意向锁)、行级三兄弟。
- 行锁加在索引上;条件无索引 → 锁全表;MDL 长事务会让 ALTER 卡死全表。
- RR 当前读规则:唯一等值命中退化记录锁、未命中间隙锁、普通索引与范围上临键锁。
- 死锁经典案:双方间隙锁兼容 → 互插互等;排查 show engine innodb status + print_all_deadlocks。
- 悲观 for update,乐观 version 字段;affected_rows = 0 必须处理。
`,
      },
      /* ─────────────────────────────────────────── */
      {
        id: 'ch08',
        title: '日志体系与主从复制',
        minutes: 35,
        points: ['redo/undo/binlog', '两阶段提交', 'crash-safe', '主从延迟', '分库分表'],
        content: `
> [!interview] 本章面试锚点
> 日志体系是 MySQL 面试的收口大题:"redo log 和 binlog 有什么区别?""为什么要有两阶段提交?""主从延迟怎么办?" —— 三问一条线:**redo 保证不丢,binlog 保证同步,两阶段提交保证两者一致**。最后用分库分表收尾,衔接大表优化话术。

> [!info] 本章导读 · 数据库崩了,刚提交的数据还在吗
> 银行柜台办完业务会给你一张回执,同时自己留一份底账,万一账本丢了还能凭底账补回来。数据库也同时记两本账:一本管崩溃恢复,一本管主从同步,两者还得保证对得上,于是有了两阶段提交。本章把这几本账的关系理清,最后延伸到主从延迟和分库分表。
> - 读完本章你将能:说清 redo log 和 binlog 各解决什么问题、为什么不能只留一个
> - 按两阶段提交的顺序复述一次事务提交,并指出崩溃可能发生在哪几步
> - 判断主从延迟的常见成因,并给出至少两种缓解手段

> [!tip] 日常电脑现场 · 银行流水与底账
> 柜台给你一张回执,柜员同时在系统里记一笔流水,晚上还有一份备份账本从主机同步到机房另一头。数据库也一样:redo log 管崩溃后能恢复,binlog 管另一台机器照着抄,两本账还得对得上。

## 三大日志一张表(先建立全局地图)

| 日志 | 所属层 | 类型 | 写入方式 | 核心作用 |
| --- | --- | --- | --- | --- |
| undo log | InnoDB | 逻辑日志(反向操作) | 随事务写 | 回滚(原子性)+ MVCC 版本链 |
| redo log | InnoDB | 物理日志(页级修改) | **循环写**,固定大小 | 崩溃恢复(持久性,crash-safe) |
| binlog | Server 层 | 逻辑日志(statement/row) | **追加写**,写满换文件 | 主从复制 + 按时间点恢复 |

> [!tip] undo log 已经见过它两次
> 第 6 章它保证原子性(回滚),第 7 章它串成 MVCC 版本链。redo 与 undo 一句话区分:**undo 记"怎么撤销",redo 记"做了什么"**;前者事务失败时用,后者宕机恢复时用。

## redo log:WAL 与循环写

**WAL(Write-Ahead Logging)**:直接改数据页是随机 IO 且慢,所以先把修改**顺序**追加到 redo log(顺序 IO 快得多),再择机把脏页刷盘 —— 用日志的顺序写换数据页的随机写,这是 crash-safe 的工程基础。

redo log 是**固定大小的文件组**(默认两组、每组 48MB),循环写:

\`\`\`text
        write pos → 当前写到哪
   ┌──────────────────────────────┐
   │ ████ 已写 ████████░░░░ 未写 ░░ │
   └──────────────────────────────┘
        ↑ checkpoint → 已刷盘推进到哪
write pos 追上 checkpoint → 必须停下来推进 checkpoint(刷脏页)→ 线上卡顿元凶之一
\`\`\`

落盘策略 ==innodb_flush_log_at_trx_commit==(高频):

| 值 | 行为 | 最多丢 |
| --- | --- | --- |
| 0 | 每秒由后台线程刷盘 | 1 秒 |
| **1(默认)** | **事务提交时即 fsync** | 0 |
| 2 | 提交只写到 OS page cache,每秒刷盘 | 1 秒(整机不掉电则不丢) |

\`\`\`sql
SHOW VARIABLES LIKE 'innodb_flush_log_at_trx_commit';
\`\`\`

\`\`\`output
Variable_name                    Value
innodb_flush_log_at_trx_commit   1
\`\`\`

## binlog:三种格式与 sync_binlog

| 格式 | 记录什么 | 优 | 劣 |
| --- | --- | --- | --- |
| STATEMENT | SQL 原文 | 日志小 | NOW()/UUID() 主从重放结果不一致;RC 下语句乱序 |
| **ROW(5.7.7+ 默认)** | 行变更前后镜像 | 复制绝对一致,RC 可用 | 日志大(批量删一行记一条) |
| MIXED | 自动在两者间切换 | 折中 | 仍有边界场景 |

==sync_binlog==(0 = 交给 OS,N = 攒 N 个事务刷一次,1 = 每事务刷):与上面的 redo 参数合称 **"双 1 配置"**,金融级不丢数的标准姿势;代价是每次提交两次 fsync,高并发靠**组提交**(攒一批事务一起 fsync)缓解。

\`\`\`sql
-- 查看与清理 binlog
SHOW BINARY LOGS;
PURGE BINARY LOGS BEFORE '2026-06-01 00:00:00';
\`\`\`

\`\`\`output
Log_name        File_size   Encrypted
binlog.000301   1073742177  No
binlog.000302   52428902    No
Query OK, 0 rows affected (0.01 sec)
\`\`\`

## 两阶段提交(2PC):必考反证法

一条 UPDATE 的提交路径:

\`\`\`text
1. redo log 写入,标记 prepare
2. 写 binlog
3. redo log 打上 commit 标记
\`\`\`

**为什么顺序不能乱?反证:**

\`\`\`text
若先写 redo、后写 binlog,中间宕机:
  重启恢复:redo 完整 → 主库保留修改;binlog 没写 → 从库没有 → 主从不一致

若先写 binlog、后打 redo commit,中间宕机:
  binlog 完整 → 从库重放了;主库恢复时按"无 commit 标记"回滚 → 主从不一致
\`\`\`

崩溃恢复的判定规则:**commit 标记在 → 直接提交;不在 → 看 binlog,完整则补 commit,不完整则回滚**。一句话总结:**redo 保证自己不丢,binlog 保证从库一致,两阶段提交保证"这单要么两边都有,要么两边都没有"**。

## 主从复制:一主两从的数据流

\`\`\`text
主库                                 从库
┌──────────┐  binlog  ┌──────────┐          ┌──────────┐
│ 事务提交  ├─────────>│ dump 线程 ├────────>│ IO 线程   │──> relay log(中继日志)
└──────────┘          └──────────┘          └────┬─────┘
                                                 ▼
                                            SQL 线程重放 → 数据一致
\`\`\`

\`\`\`sql
-- 从库查看复制状态(8.0.22+ 用 SHOW REPLICA STATUS)
SHOW REPLICA STATUS\\G
\`\`\`

\`\`\`output
             Replica_IO_State: Waiting for source to send event
              Source_Host: 10.0.0.11
              Replica_SQL_Running_State: Replica has read all relay log...
         Seconds_Behind_Master: 3          ← 主从延迟秒数,监控核心指标
\`\`\`

三种复制模式:

| 模式 | 主库何时返回客户端 | 丢数据风险 |
| --- | --- | --- |
| 异步(默认) | 写完 binlog 就返回 | 主库宕机时未同步的部分丢 |
| 半同步 | 至少 1 个从库收到 binlog 才返回 | 几乎不丢(性能下降) |
| 组复制 MGR | 多数派提交 | Paxos 级强一致(运维复杂) |

## 主从延迟:原因与应对

四个原因:**① 从库 SQL 线程单线程重放**(主库多线程写,重放追不上);② **大事务**(主库一条删 100 万行的 DELETE,从库重放同样慢);③ 从库机器配置差、热点行集中;④ 从库上的大查询抢资源。

应对手段(按工程顺序):

- **并行复制**:5.7 ==LOGICAL_CLOCK==(按事务组并行)、8.0 ==WRITESET==(按行冲突检测并行,效果最好);
- **大事务拆小**:批量操作按 id 分批,每批几千行;
- **业务路由**:关键路径读强制走主库(如"下单后立刻查订单"),非关键读走从库;
- 从库升配、监控 ==Seconds_Behind_Master== 告警。

> [!warn] 半同步解决的是"丢数据"不是"延迟"
> 半同步只保证 binlog 到达从库,**不保证重放完成**。面试里说"开了半同步所以没有延迟"是硬伤 —— 延迟是重放速度问题,只有并行复制和路由策略能治。

## 分库分表:最后的手段

演进顺序背下来:**索引与 SQL 优化 → 读写分离 → 缓存 → 冷热分离(归档)→ 分库分表**。前面的都不够用了才拆:

| 拆法 | 做法 | 解决什么 |
| --- | --- | --- |
| 垂直分库 | 按业务拆:订单库、用户库、商品库 | 单实例瓶颈、业务解耦 |
| 垂直分表 | 大字段拆出(详情、长 remark) | 单行变小,热数据集中 |
| 水平分库分表 | 同结构表按分片键拆 N 份:==user_id % 16== | 数据量与 QPS 的横向扩展 |

分片键选择:优先 **user_id**(同一用户的数据落同一库,用户维度查询不跨库);按时间分片适合日志类冷热分明的数据。

拆完的代价(面试必须主动说):

- **分布式 ID**:自增主键失效 → 雪花算法(1 符号 + 41 时间戳 + 10 机器 + 12 序列)或号段模式;
- **跨库 JOIN 与聚合**:应用层内存聚合,或宽表 / 异构索引;
- **分布式事务**:尽量单库内闭环,必须跨库用消息最终一致 / Seata;
- **扩容迁移**:一致性哈希减少迁移量,双写迁移 + 灰度切流。中间件主流 ==ShardingSphere==。

大事务拆小的完整代码(可直接搬进项目):

\`\`\`java
import java.sql.*;

public class BatchDeleteDemo {
    public static void main(String[] args) throws Exception {
        try (Connection conn = DriverManager.getConnection(
                "jdbc:mysql://127.0.0.1:3306/mall?useSSL=false", "root", "123456")) {
            conn.setAutoCommit(true);              // 每批一个隐式小事务
            String sql = "DELETE FROM t_order WHERE create_time < ? LIMIT 5000";
            int total = 0, batch;
            do {
                try (PreparedStatement ps = conn.prepareStatement(sql)) {
                    ps.setString(1, "2024-01-01");
                    batch = ps.executeUpdate();    // 本批实际删除行数
                    total += batch;
                }
            } while (batch == 5000);               // 删满了说明可能还有,继续下一批
            System.out.println("共删除 " + total + " 行,分批完成,主从延迟平稳");
        }
    }
}
\`\`\`

\`\`\`output
共删除 231000 行,分批完成,主从延迟平稳
\`\`\`

> [!best] 面试收口话术
> "我们表 5000 万行,先做了**慢 SQL 治理和覆盖索引**,读写分离分流了 80% 读流量,历史订单**按年归档**;继续增长才考虑按 user_id 水平分片,用雪花 ID 解决主键问题。" —— **先讲优化再讲拆分**,体现的是"不过度设计"的工程判断。

## 大表变更·字段设计与分布式 ID

> [!interview] 本节面试锚点
> "线上 5000 万行的表怎么加一个字段?"是 DBA 视角的高频实战题,一条线串起:Online DDL 算法 → gh-ost / pt-osc 选型 → 范式与反范式 → 分布式 ID → 连接池与字符集。这一节全是落地干货,答完体现的是"变更安全"意识。

### Online DDL:INSTANT 与 INPLACE

\`\`\`sql
-- 8.0.12+ 加列首选 INSTANT:只改元数据,秒级完成,不碰任何数据行
ALTER TABLE t_order
  ADD COLUMN channel TINYINT NOT NULL DEFAULT 0 COMMENT '渠道 0App 1小程序',
  ALGORITHM=INSTANT;
-- INSTANT 覆盖不了的(如扩列长度)退 INPLACE:引擎层原地变更,期间可并发读写
ALTER TABLE t_order
  MODIFY COLUMN remark VARCHAR(500) NOT NULL DEFAULT '',
  ALGORITHM=INPLACE, LOCK=NONE;
\`\`\`

\`\`\`output
Query OK, 0 rows affected (0.02 sec)
Records: 0  Duplicates: 0  Warnings: 0
Query OK, 0 rows affected (2 min 18.53 sec)
Records: 0  Duplicates: 0  Warnings: 0
\`\`\`

显式声明 ==ALGORITHM== 的好处:**算法不支持就直接报错,而不是偷偷降级成 COPY 锁表** —— 这是变更脚本安全的第一道闸。

| 算法 | 做什么 | 并发 | 典型操作 |
| --- | --- | --- | --- |
| INSTANT | 只改元数据,不碰数据行 | 秒级,零阻塞 | 8.0.12+ 末尾加列、8.0.29+ 任意位置加列、改列名 |
| INPLACE | 引擎层原地变更 / 重建 | 期间 DML 走 online log,不阻塞读写 | 加索引、扩列长度、转字符集 |
| COPY | 建临时表逐行拷贝 | **锁写**,最慢 | 兜底路径,生产避免 |

> [!warn] Online DDL 不是百分百"在线"
> INPLACE 不阻塞 DML,但 DDL 开始与结束仍要**短暂持有 MDL 排他锁**。若有长事务或慢查询压着表,ALTER 拿不到 MDL,还会把后面所有查询堵死(第 8 章的 MDL 事故)。铁律:**DDL 前查 innodb_trx 清长事务、设 lock_wait_timeout、低峰执行**。

### 大表加字段三方案

| 方案 | 原理 | 优点 | 风险与代价 | 适用 |
| --- | --- | --- | --- | --- |
| 直接 Online DDL | INSTANT / INPLACE 引擎层变更 | 无第三方依赖 | INPLACE 大表耗时长,失败回滚同样耗时,有 MDL 风险 | 8.0 加列(INSTANT)直接用 |
| pt-osc(pt-online-schema-change) | 建**影子表** → 原表挂**触发器**同步增量 → 拷完 RENAME 原子切换 | 成熟稳定,支持 5.7 | 触发器使原表每次写放大,拷贝期主从延迟 | 中等规模表、老版本库 |
| gh-ost | 建**影子表** → **解析 binlog 回放**增量(无触发器)→ 原子切换 | 主库压力小,可限流、暂停、动态调速 | 依赖 ROW binlog,存在数据追平窗口 | 千万级以上大表 |

记忆钩子:**pt-osc 靠触发器,gh-ost 靠 binlog 回放** —— gh-ost 正是看中触发器的写放大才改吃 binlog,与本章日志体系呼应。

### 三大范式与何时反范式

一句话版:**第一范式**列不可再分;**第二范式**非主键列必须完全依赖主键(消除部分依赖);**第三范式**非主键列不能传递依赖另一个非主键列。

什么时候故意违反(反范式)?高频并发**列表页**要展示的数据:订单列表要展示买家昵称、评论区要展示评论者昵称头像,严格范式就得 JOIN t_user,高并发下 join 是放大器。反范式做法:

\`\`\`sql
-- 冗余展示字段,列表页零 JOIN;注意语义:存的是"下单那一刻"的快照
ALTER TABLE t_order
  ADD COLUMN user_nickname VARCHAR(64) NOT NULL DEFAULT '' COMMENT '冗余:下单时昵称快照',
  ALGORITHM=INSTANT;
-- 一致性:核心数据实时双写;昵称这类快照字段允许与当前值不一致,免刷历史
\`\`\`

原则:**读多改少的展示字段才冗余,可变的核心数据不冗余**;冗余省下的 join 和多出的一致性维护成本(双写、刷新任务)要一起算进设计账。

### 分布式 ID:分库分表的第一道坎

自增 ID 在分库分表下的死结:各分片独立自增**跨片撞号**,集中发号则发号库成单点瓶颈。UUID 能全局唯一但当不了 InnoDB 主键(第 3 章):36 字符太长(**所有二级索引跟着变胖**)+ 完全无序(**随机插入页分裂**)。业界标配雪花算法(Snowflake):

\`\`\`text
64 bit:
┌─┬───────────────────────┬───────────┬────────────┐
│0│   41 bit 时间戳(ms)    │ 10 bit 机器│ 12 bit 序列 │
└─┴───────────────────────┴───────────┴────────────┘
 符号位恒 0 │ 相对纪元可用 69 年 │ 1024 台机器 │ 单机每毫秒 4096 个
时间戳在高位 → 整体趋势递增;单机每秒约 400 万个
\`\`\`

完整 Java 实现(含时钟回拨处理,可直接搬):

\`\`\`java
public class SnowflakeId {
    private static final long EPOCH = 1704038400000L;   // 起始纪元 2024-01-01
    private final long machineId;                       // 0~1023,由注册中心 / 配置分配
    private long sequence = 0L;
    private long lastTimestamp = -1L;

    public SnowflakeId(long machineId) {
        if (machineId < 0 || machineId > 1023) {
            throw new IllegalArgumentException("machineId 必须在 0~1023");
        }
        this.machineId = machineId;
    }

    public synchronized long nextId() {
        long now = System.currentTimeMillis();
        if (now < lastTimestamp) {                        // 时钟回拨检测
            long offset = lastTimestamp - now;
            if (offset <= 5) {                            // 小回拨:等时间追平
                try {
                    wait(offset * 2);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
                now = System.currentTimeMillis();
                if (now < lastTimestamp) {
                    throw new IllegalStateException("时钟回拨未恢复,停止发号");
                }
            } else {                                      // 大回拨:拒绝发号,交运维校时
                throw new IllegalStateException("时钟回拨 " + offset + "ms,停止发号");
            }
        }
        if (now == lastTimestamp) {
            sequence = (sequence + 1) & 4095;             // 12 bit 序列号 0~4095
            if (sequence == 0) {                          // 本毫秒发满,自旋等下一毫秒
                while ((now = System.currentTimeMillis()) <= lastTimestamp) { }
            }
        } else {
            sequence = 0;
        }
        lastTimestamp = now;
        return ((now - EPOCH) << 22) | (machineId << 12) | sequence;
    }

    public static void main(String[] args) {
        SnowflakeId gen = new SnowflakeId(1L);
        for (int i = 0; i < 3; i++) {
            System.out.println(gen.nextId());
        }
    }
}
\`\`\`

\`\`\`output
319625803132235776
319625803132235777
319625803132235778
\`\`\`

同一毫秒内三次发号:高位时间戳相同,低位序列号连续 +1。回拨策略两手准备:**小回拨(≤5ms)等待追平,大回拨直接抛异常拒绝发号** —— 宁可暂停服务也不能发出重复 ID。生产一般不造轮子:美团 **Leaf**(号段模式批量取号 + 雪花双模式)、百度 **UidGenerator**(RingBuffer 预生成),了解一句话即可。

### 连接池 Druid 与 wait_timeout 断连

\`\`\`properties
# Druid 生产参考配置
initialSize=5
minIdle=5
maxActive=20
maxWait=60000
validationQuery=SELECT 1
testWhileIdle=true
testOnBorrow=false
timeBetweenEvictionRunsMillis=60000
minEvictableIdleTimeMillis=300000
\`\`\`

- ==initialSize== 启动预热连接,避免首批请求集中建连抖动;==maxActive== 是池上限,参考值 20 上下 —— **别拉到几百**,MySQL 社区版一个连接一个线程,连接数先冲垮的是数据库;==maxWait== 拿不到连接的等待上限,超时抛 GetConnectionTimeout。
- **wait_timeout 断连**:MySQL 服务端默认 ==wait_timeout=28800==(8 小时),闲置超时由服务端掐线;池里的老连接下次取用报 ==CommunicationsException: The last packet successfully received...==。解法:靠 ==testWhileIdle== + 周期驱逐配置让连接池在取用前验活重建,而不是调大 wait_timeout 硬扛。
- Druid 的 **WallFilter** 是内置 SQL 防火墙(注入语句检测),灰度环境先观察误杀再决定是否全量开启。

### utf8mb4 陷阱

MySQL 的 utf8 是历史遗留的**阉割版**(每字符最多 3 字节),存不了 emoji(4 字节):

\`\`\`sql
-- 老表 t_comment 还建在 3 字节 utf8 上,用户评论带 emoji 直接翻车
INSERT INTO t_comment(content) VALUES('这个订单真好用 👍');

-- 整表连列一起转到 utf8mb4
ALTER TABLE t_comment CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
\`\`\`

\`\`\`output
ERROR 1366 (HY000): Incorrect string value: '\\xF0\\x9F\\x91\\x8D' for column 'content' at row 1
Query OK, 1 row affected (0.32 sec)
\`\`\`

规范:**库、表、连接三处都要 utf8mb4** —— 建表带 ==DEFAULT CHARSET=utf8mb4==(模块统一表 t_order 就是这么建的);JDBC 8.x 驱动默认即 utf8mb4,老驱动连接串补 ==characterEncoding=utf8==。老表转字符集要重建全部索引,大表上按前面的 Online DDL / gh-ost 流程走。

> [!best] 结构变更统一话术
> "任何线上结构变更:**先查长事务防 MDL → 显式 ALGORITHM 声明 → 加列走 8.0 INSTANT,其余大变更低峰用 gh-ost → 变更前后校验行数与抽样数据**。"这套流程背下来,比单个工具的参数值钱。

## 半同步·并行复制·GTID 与备份

异步复制像寄平信:主库写完 binlog 就返回,信丢没丢它不管。半同步是挂号信(至少一个从库签收),GTID 给每封信编了全球唯一号,并行复制则让收信方多窗口同时拆信。本节把这四件事一次说透。

### 半同步复制:至少一个从库确认

\`\`\`sql
-- 主库安装插件并开启(从库装 semisync_slave 并开启 rpl_semi_sync_slave_enabled)
INSTALL PLUGIN rpl_semi_sync_master SONAME 'semisync_master.so';
SET GLOBAL rpl_semi_sync_master_enabled = ON;
SET GLOBAL rpl_semi_sync_master_timeout = 1000;       -- 毫秒,超时退化为异步
SET GLOBAL rpl_semi_sync_master_wait_point = AFTER_SYNC;
SHOW STATUS LIKE 'Rpl_semi_sync_master%';
\`\`\`

\`\`\`output
Variable_name                        Value
Rpl_semi_sync_master_clients         1
Rpl_semi_sync_master_status          ON
Rpl_semi_sync_master_yes_tx          1024
Rpl_semi_sync_master_no_tx           3
Rpl_semi_sync_master_wait_sessions   0
\`\`\`

两种等待点:

| 等待点 | 提交顺序 | 数据可见性 | 风险 |
| --- | --- | --- | --- |
| AFTER_COMMIT | 引擎提交 → 等 ACK → 返回客户端 | 其它会话可能先看到未确认数据 | 主库崩溃切从库,可能丢已提交事务 |
| AFTER_SYNC(5.7+ 默认) | 写 binlog → 等 ACK → 引擎提交 → 返回 | ACK 前对所有会话不可见 | 延迟更高,但切换不丢数据 |

与异步复制的对比:

| 维度 | 异步复制 | 半同步复制 |
| --- | --- | --- |
| 主库返回时机 | 写完 binlog 立即返回 | 至少一个从库 ACK 后返回 |
| 数据丢失窗口 | 主库崩溃可能丢最后一段 | AFTER_SYNC 下不丢已返回的事务 |
| 延迟 | 最低 | 受从库网络与磁盘影响 |
| 降级 | 无此概念 | 超时(默认 10s)自动退化异步,恢复后自动切回 |
| 适用 | 普通读扩展 | 支付/订单等不能丢数据的库 |

> [!warn] 半同步不是强一致
> ACK 只代表从库**收到并写入了 relay log**,不代表 SQL 线程已执行完;主库超时退化异步的那段时间,数据仍然可能丢。半同步解决"丢数据",不解决"读不到最新"(延迟) —— 两个问题别混答。

### 并行复制:从库为什么能多线程重放

主库多线程写,从库 SQL 线程单线程重放 → 延迟。演进主线:

| 版本 | 并行维度 | 并行的依据 | 局限 |
| --- | --- | --- | --- |
| 5.6 | 库级(schema) | 不同 database 的事务互不冲突 | 单库业务完全串行 |
| 5.7 | LOGICAL_CLOCK | 同一 commit 组内、锁不冲突的事务可在从库并行 | 组大小受主库并发影响 |
| 8.0 | WRITESET | 每行计算的 hash 集合不重叠即可并行 | 内存开销,超大事务退化为单线程 |

原理一句话:判断两个事务**有没有修改同一行**,没有就可以并行重放,因为执行顺序不影响最终结果。LOGICAL_CLOCK 用"是否同一时刻提交"近似判断,WRITESET 直接算行级 hash,判断更准。

\`\`\`sql
-- 从库配置(8.0 语法)
SET GLOBAL replica_parallel_type = 'LOGICAL_CLOCK';
SET GLOBAL replica_parallel_workers = 8;
SET GLOBAL replica_preserve_commit_order = ON;                    -- 提交顺序与主库一致
SET GLOBAL binlog_transaction_dependency_tracking = 'WRITESET';   -- 主库侧(8.0 默认)
SHOW VARIABLES LIKE 'replica_parallel%';
\`\`\`

\`\`\`output
Variable_name             Value
replica_parallel_type     LOGICAL_CLOCK
replica_parallel_workers  8
\`\`\`

> [!tip] 并行复制调优的两个前提
> ① ==replica_preserve_commit_order=ON== 是安全底线:保证从库提交顺序与主库 binlog 一致,否则基于 binlog 的恢复和级联复制会乱序;代价是并行度被提交顺序约束。② 大事务是并行的天敌:一个删 100 万行的事务只能由一个 worker 重放,拆小才吃得到并行红利。

### GTID:给每个事务发一张全球身份证

GTID = ==source_uuid:transaction_id==,主库每个事务提交时分配,全局唯一且单调。开启:

\`\`\`sql
-- 主从都要开,先保证一致性检查再切模式
SET GLOBAL enforce_gtid_consistency = ON;
SET GLOBAL gtid_mode = ON;        -- OFF → OFF_PERMISSIVE → ON_PERMISSIVE → ON 逐步切换

-- 从库不再需要 binlog 文件名和偏移量
CHANGE REPLICATION SOURCE TO
  SOURCE_HOST = '192.168.1.10',
  SOURCE_PORT = 3306,
  SOURCE_USER = 'repl',
  SOURCE_PASSWORD = 'Repl@2026',
  SOURCE_AUTO_POSITION = 1;
START REPLICA;
\`\`\`

解决 file + pos 的三个痛点:

- 换主库要重新算 ==MASTER_LOG_FILE== 和 ==MASTER_LOG_POS==,算错一位就 1032/1236 报错;GTID 只需 ==SOURCE_AUTO_POSITION=1==,从库自己上报"我有哪些 GTID",主库补差额;
- 从库执行过的事务按 GTID 去重,**failover 后不会重复写**;
- 一主多从、级联复制、在线加从库都用同一套坐标,运维脚本不用维护位点。

| 维度 | file + pos | GTID |
| --- | --- | --- |
| 定位方式 | 文件名 + 字节偏移 | source_uuid:transaction_id 集合 |
| 切主操作 | 手工算位点,易错 | AUTO_POSITION 自动补齐 |
| 重复执行 | 需人工保证 | 自动跳过已执行 GTID |
| 限制 | 无 | 少数非事务写法受 enforce_gtid_consistency 约束 |

### 备份:mysqldump 与 xtrabackup

| 维度 | mysqldump(逻辑) | xtrabackup(物理) |
| --- | --- | --- |
| 备份内容 | SQL 语句/TSV | 数据文件页副本 |
| 一致性 | --single-transaction 用 RR 快照,不锁表(InnoDB) | 热备,拷贝 + 记录 LSN,不阻塞 DML |
| 速度 | 慢(导出/导入都要解析 SQL) | 快(文件级拷贝) |
| 体积 | 较小(纯数据) | 较大(含索引与碎片) |
| 恢复 | 直接导入,可跨版本/跨平台 | prepare 后 copy-back,要求版本与页大小一致 |
| 适用 | 小库、单表、跨版本迁移 | 大库、TB 级、要求短 RTO |

\`\`\`shell
# 逻辑备份:一致性快照 + 记录 GTID 位点,便于搭新从库
mysqldump -uroot -p --single-transaction --source-data=2 --set-gtid-purged=ON --databases shop > /backup/shop_20261114.sql

# 物理备份:全量 + prepare(回放未提交事务)
xtrabackup --backup --target-dir=/backup/full --user=root --password=Root@2026
xtrabackup --prepare --target-dir=/backup/full
\`\`\`

\`\`\`output
mysqldump: [Warning] Using a password on the command line interface can be insecure.
-- GTID state at the beginning of the backup
SET @@GLOBAL.GTID_PURGED=/*!80000 '+'*/ '3f2b8c1e-6a7d-11ef-9c2a-0242ac120002:1-10240';

xtrabackup: Transaction log of lsn (28461023) to (28461190) was copied.
xtrabackup: completed OK!
\`\`\`

> [!best] 备份三句话
> ① 逻辑备份看**一致性**(--single-transaction)和**可恢复性**(定期做恢复演练),不是看备份命令成功;② 物理备份必须 **prepare** 后才能启动,否则数据文件处于崩溃状态;③ 备份要和 binlog 一起保留,才能做**时间点恢复**(PITR):全量 + binlog 重放到误删前一秒。

## 面试速记

- 三日志:undo 回滚 + 版本链;redo 页级物理循环写保 crash-safe;binlog Server 层追加写管复制与恢复。
- 双 1:innodb_flush_log_at_trx_commit = 1 + sync_binlog = 1,组提交缓解 fsync 压力。
- 2PC:prepare redo → 写 binlog → commit;恢复时以 binlog 是否完整为最终判定。
- 复制三线程:dump → IO → SQL;延迟靠并行复制(WRITESET)+ 大事务拆小 + 关键读走主。
- 分库分表是最后手段:先索引、读写分离、缓存、归档;代价是分布式 ID / JOIN / 事务 / 扩容。
`,
      }
    ],
    interview: [
      { q: '为什么 InnoDB 索引用 B+ 树,而不是哈希表、红黑树或 B 树?', a: '排除法:**哈希**等值 O(1) 但范围查询、排序、最左前缀全废;**红黑树**二叉瘦高,500 万数据约 23 层 = 23 次磁盘 IO;**B 树**非叶子也存数据,单页放的键变少树更高,范围查询要中序回溯。**B+ 树**:非叶子只存键(16KB 页约 1170 扇出),叶子存数据 + 双向链表,3 层约存 2000 万行,主键查询最多 3 次 IO,范围查询沿链表顺序扫。加分:InnoDB 还有自适应哈希做等值加速。' },
      { q: '聚簇索引和非聚簇索引的区别?为什么二级索引叶子存主键而不是行地址?', a: '**聚簇索引**叶子存整行,InnoDB 的表本身就是按主键组织的 B+ 树(索引即数据,一张表只有一个);**二级索引**叶子存"索引列 + 主键值",查到后还要回表。存主键的原因:① 行因页分裂搬家时二级索引不用维护;② 节省空间;③ 靠主键能回表拿整行。MyISAM 才存物理地址,所以表损坏后难恢复。主键越长所有二级索引越大,这也是主键要用自增 BIGINT 的原因。' },
      { q: '什么是回表?怎么避免?什么是覆盖索引?', a: '**回表**:二级索引叶子只存主键值,还要回聚簇索引查整行,可能回表几十次。**避免 = 覆盖索引**:查询列全在索引里,Extra 显示 ==Using index==。做法:① 不用 SELECT *,按需取列;② 高频列建联合索引,如 (user_id, create_time) 查这两列零回表。注意:前缀索引无法覆盖;回表代价太高时优化器可能直接放弃索引改走全表扫描。' },
      { q: '最左前缀原则是什么?联合索引 (user_id, create_time) 能支撑哪些查询?', a: '索引先按 user_id 排、相同再按 create_time 排。**能支撑**:user_id 等值;user_id + create_time 等值;user_id 等值 + create_time 范围;按 user_id 排序。**不能**:只查 create_time(索引内它是乱序的)。**范围规则**:范围列自己能用,右边列不能用 → 等值在前、范围在后。EXPLAIN 用 key_len 验证到底用了几列。' },
      { q: '常见的索引失效场景有哪些?', a: '分点:① 不满足最左前缀;② 列上函数或运算:DATE(create_time)、id+1(8.0 可建函数索引兜底);③ 隐式转换:varchar 列与数字比较失效,int 列与字符串比较不失效;④ 前模糊 LIKE %x(x% 是范围,不失效);⑤ or 连接了无索引列;⑥ 区分度低或回表太多,优化器按代价主动放弃 —— EXPLAIN 看 type=ALL、key=NULL 判断。' },
      { q: 'count(*)、count(1)、count(id)、count(字段) 的区别?哪个最快?', a: '**count(字段)** 要取值且跳过 NULL,最慢;**count(id)** 取主键;**count(*) 与 count(1) 一样**,官方明确 count(*) 被特化优化,不取值只数行:count(*) ≈ count(1) ≥ count(id) > count(字段)。InnoDB 不存总行数,因为 MVCC 下没有全局唯一正确的总数,count(*) 只能遍历;大表统计用计数表或缓存,MyISAM 才直接存总数。' },
      { q: 'ACID 分别是怎么实现的?', a: '分点:**原子性** — undo log,回滚按反向日志撤销未提交修改;**持久性** — redo log,WAL 先写日志再刷数据页,宕机后重放恢复;**隔离性** — MVCC(快照读不加锁)+ 锁(当前读加锁);**一致性** — 不是独立机制,是前三个手段 + 应用层约束(唯一键、外键、业务校验)共同达成的目的。背诵版:U 保原子、R 保持久、MVCC+锁保隔离,一致性是结果。追问"一致性靠什么"时必须答出这个层次。' },
      { q: '四种隔离级别分别解决什么?MySQL 为什么默认 REPEATABLE READ?', a: '级别:RU 全裸 → RC 防脏读(Oracle/PG 默认)→ RR 基本防幻读(MySQL 默认)→ Serializable 全加锁。默认 RR 的历史:早期 binlog 只有 STATEMENT 格式,RC 下从库重放语句乱序会主从不一致,RR 才安全;ROW 格式出现后已无此顾虑。加分:互联网公司常改 RC(阿里系),RC 无间隙锁并发好死锁少,前提 binlog 为 ROW。' },
      { q: 'MVCC 的实现原理?', a: '三件套:**隐藏字段**(trx_id、roll_pointer)+ **undo 版本链** + **ReadView**(m_ids、min、max、creator)。从链头找第一个可见版本:trx_id < min 可见、≥ max 不可见、中间看在不在 m_ids(在 = 未提交 = 不可见)。**RC 每次读生成新 ReadView,RR 只在第一次读生成并复用** —— 两级别唯一差异。快照读走 MVCC,当前读加锁读最新。' },
      { q: 'RR 隔离级别下到底能不能防住幻读?', a: '分三种情况:① **纯快照读**:防住,事务内复用第一次 ReadView,新插入的行不可见;② **纯当前读**:防住,临键锁锁住区间别人插不进;③ **混用会破功**:先快照读再当前读(比如 update 了别人插入的行),快照读顺着新版本就能看见幻影行。标准话术:**RR 下靠 MVCC + 临键锁很大程度上避免了幻读,但混用仍可能出现幻影**。防御:关键业务读法保持一致。' },
      { q: '间隙锁是什么?什么时候产生?有什么坑?', a: 'RR 特有,锁**索引记录之间的开区间**,防止插入,是当前读防幻读的手段。产生:当前读中唯一索引等值未命中(锁附近间隙)或范围查询(临键锁 = 记录 + 间隙,左开右闭)。**坑**:① 间隙锁之间互相兼容,但插入会被对方间隙锁阻塞 → "先查后插"经典死锁;② 条件列无索引时当前读锁全表间隙;③ RC 没有间隙锁,并发好但防不了幻读。8.0 优化:唯一索引等值命中退化为纯记录锁。' },
      { q: 'redo log、undo log、binlog 的作用与区别?', a: '分点:**undo log** — InnoDB 层逻辑日志,记反向操作,负责回滚(原子性)与 MVCC 版本链;**redo log** — InnoDB 层物理日志,固定大小循环写,WAL 保证宕机后重放不丢已提交数据(持久性、crash-safe);**binlog** — Server 层逻辑日志,追加写,用于主从复制与按时间点恢复。一句话:undo 管撤销,redo 管自己不丢,binlog 管从库同步。' },
      { q: '两阶段提交是什么?为什么必须有?', a: 'UPDATE 提交三步:① redo 标 **prepare**;② 写 binlog;③ redo 打 **commit**。目的:让 redo 与 binlog 一致。反证:先 redo 后 binlog 中间宕机 → 主库有从库没有;先 binlog 后 redo → 从库有主库没有。恢复判定:有 commit 标记直接提交;否则看 binlog,完整补提交、不完整回滚。一句话:这单要么两边都有,要么两边都没有。' },
      { q: '主从延迟的原因是什么?怎么处理?', a: '原因:① 从库 SQL 线程单线程重放,追不上主库多线程写;② 大事务,主库删 100 万行从库重放同样慢;③ 从库机器差、热点行集中;④ 从库大查询抢资源。处理:并行复制(8.0 WRITESET 效果最好)、大事务按 id 分批拆小、关键读强制走主库、从库升配并监控 Seconds_Behind_Master。注意:半同步只防丢数据,不解决延迟。' },
      { q: '一张千万级/亿级大表,你的优化思路是什么?', a: '按顺序分四层,体现"不过度设计":① **SQL 与索引**:慢日志定位、覆盖索引、深分页优化(游标/延迟关联);② **架构**:读写分离分流读、缓存挡热点;③ **冷热分离**:历史数据按时间归档,主表瘦身;④ **分库分表**:垂直(按业务拆库拆表)+ 水平(按 user_id 取模/范围),中间件 ShardingSphere;代价要主动说:分布式 ID(雪花)、跨库 JOIN、分布式事务、扩容迁移。核心话术:前面的都不够用了才拆。' },
      { q: '线上死锁怎么排查?怎么避免?', a: '**排查**:① SHOW ENGINE INNODB STATUS 看最近死锁记录;② 开 innodb_print_all_deadlocks 记日志;③ 查 INNODB_TRX 找长事务。**案例**:两事务当前读不存在的值各拿间隙锁,互插被对方阻塞 → 死锁,InnoDB 回滚代价小的一方。**避免**:固定加锁顺序、小事务快提交、WHERE 走索引防锁全表、热点改 RC、捕获 1213 自动重试。' },
      { q: '索引下推(ICP)是什么?解决什么问题?', a: '5.6+ 特性:联合索引里**无法参与定位的列**(如范围列后面的列),把过滤条件**下推到存储引擎层**,回表之前先在索引记录上判断。例:(name, age) 查 name LIKE "张%" AND age = 20:name 只能定位出所有张姓;无 ICP 要逐条回表再由 server 层过滤(10 条回表 10 次);有 ICP 引擎直接用索引里的 age 过滤,只回表命中的 2 次,随机 IO 大减。EXPLAIN 的 Extra 显示 **Using index condition**。与覆盖索引 Using index 的区别:前者少回表,后者零回表。' },
      { q: '唯一索引和普通索引怎么选?', a: '分三点:**① 查询性能几乎无差异** —— 唯一索引命中即停,普通索引要多扫一条确认,都在同一页内存内完成,可忽略;**② 写入差异大** —— 唯一索引每次写必须读索引页做唯一性校验,Change Buffer 用不上;普通索引页不在内存可先记 Change Buffer,免一次随机读盘;**③ 看业务能否保证唯一** —— 能保证就用普通索引换写入性能;唯一性必须数据库兜底(如订单号幂等)就坚持唯一索引,"先查后插"在并发下有窗口期漏洞,替代不了约束。口诀:可错的性能用普通,不可错的约束用唯一。' },
      { q: 'MySQL 的 join 算法有哪些?8.0 有什么变化?', a: '三种:**Simple NLJ** 朴素嵌套循环,驱动表每行都全表扫被驱动表,m × n 次;**Index NLJ** 被驱动表关联列走索引,每行一次 B+ 树查找,最优;**Block NLJ** 无索引时把驱动表分块读入 join buffer,被驱动表扫描次数从"外层行数"降为"块数"。**8.0.18 起**:无索引等值 join 改用 **Hash Join** —— 驱动表建哈希表、被驱动表一趟探测,EXPLAIN Extra 显示 Using join buffer (hash join);8.0.20 移除 BNL。优化两板斧:小表驱动 + 被驱动表关联列建索引。' },
      { q: '雪花算法的结构?时钟回拨怎么办?', a: '64 位 = **1 符号位恒 0 + 41 位毫秒时间戳**(相对纪元,可用 69 年)+ **10 位机器 ID**(1024 台)+ **12 位序列号**(单机每毫秒 4096 个);本地生成不依赖 DB,整体趋势递增。**时钟回拨**:小回拨(几毫秒内)等待追平再发号;大回拨直接抛异常拒绝发号 —— 宁可暂停发号也不能发出重复 ID,交运维校时,也有备用机器位等方案。生产直接用美团 **Leaf**(号段 + 雪花双模式)或百度 **UidGenerator**(RingBuffer 预生成),别重复造轮子。' },
      { q: '千万级大表怎么安全加字段?', a: '分场景:**首选 8.0 的 INSTANT 算法** —— 加列只改元数据秒级完成,显式写 ALGORITHM=INSTANT,不支持直接报错而不偷偷降级锁表。INSTANT 覆盖不了的变更用第三方工具:**pt-osc** 建影子表、原表挂**触发器**同步增量、RENAME 原子切换;**gh-ost** 同样影子表但改**解析 binlog 回放**,无触发器写放大,可限流可暂停,大表首选。共同纪律:变更前查 innodb_trx 清长事务防 MDL 卡全表、低峰执行、备好回滚预案。' },
      { q: 'count(*)、count(1)、count(列名)有什么区别?哪个最快?', a: '语义不同:**COUNT(*)** 与 **COUNT(1)** 统计行数,包含 NULL 行;**COUNT(列)** 只统计该列非 NULL 的行数。InnoDB 层面 COUNT(*) 与 COUNT(1) 走同一优化路径,性能基本一致;COUNT(主键) 也快但没必要。真正慢的原因是 **InnoDB 无法像 MyISAM 那样维护总行数**(MVCC 下每行能否可见依赖 ReadView),只能扫最小的二级索引逐行计数。亿级表实时总数用 Redis 计数器或单独统计表,别用 COUNT(*) 硬查。' },
      { q: 'WHERE 和 HAVING 有什么区别?为什么 WHERE 不能用 SELECT 的别名?', a: '执行顺序决定一切:**FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY → LIMIT**。WHERE 在分组**前**过滤行,不能使用聚合函数、不能用 SELECT 的列别名(此时 SELECT 还没执行);HAVING 在分组**后**过滤组,可以使用聚合函数和别名。能用 WHERE 就别用 HAVING(先缩小数据量再分组性能更好)。典型场景:HAVING COUNT(*) > 5 是 WHERE 无法表达的组级过滤。' },
      { q: '为什么金额必须用 DECIMAL 而不是 FLOAT/DOUBLE?Java 里怎么配合?', a: 'FLOAT/DOUBLE 是**二进制浮点数**,无法精确表示 0.1 这类十进制小数(0.1+0.2=0.30000000000000004),累计或比较会出现分毫不差的对账错误。**DECIMAL 是定点数**,按十进制精确存储,MySQL 用 DECIMAL(10,2) 表示两位小数金额。Java 侧对应 **BigDecimal**,构造必须用字符串或 BigDecimal.valueOf(不要 new BigDecimal(double));比较用 **compareTo == 0**(equals 会把 1.0 和 1.00 判为不等);除法必须指定精度和舍入模式,如 divide(d, 2, RoundingMode.HALF_UP)。' },
      { q: 'NULL 和空字符串有什么区别?使用 NULL 有哪些坑?', a: '区别:NULL 表示**未知**,空字符串是**已知的空值**;NULL 需要额外的空值标记与索引统计开销。三坑:**① 三值逻辑** —— NULL = NULL 结果是 NULL,必须用 IS NULL / IS NOT NULL;**② 聚合跳过** —— COUNT(列) 直接跳过 NULL;**③ 唯一索引** 允许多条 NULL。设计建议:字段尽量 NOT NULL + DEFAULT,避免业务代码到处判空;空串与 NULL 只选一种语义表示"无"。' },
      { q: 'InnoDB 的行格式有哪些?什么是行溢出?COMPACT 与 DYNAMIC 有什么区别?', a: '**演进**:REDUNDANT→COMPACT(5.0)→DYNAMIC(5.7 默认)→COMPRESSED。**COMPACT**:变长长度列表+NULL 位图+5 字节头+列数据。**行溢出**:一页至少两行、单行约 8KB;COMPACT 前 768 字节留页内;DYNAMIC 整列进溢出页只留 20 字节指针,页内行更多、树更矮。行格式管物理布局,与字符集无关。' },
      { q: 'skip scan(索引跳跃扫描)是什么?什么场景下才有效?', a: '**8.0.13**:联合索引 (a,b) 缺最左列 a、且 a 基数低时,优化器枚举 a 的每个值,拆成多段 (a=x AND b=...) 定位;Extra 显示 **Using index for skip scan**。**有效**:a 基数低、b 选择性好、查询列被覆盖;**反例**:a 基数高时成本超过全表,优化器放弃。开关是 skip_scan,可关闭做对照。' },
      { q: '半同步复制和 GTID 分别解决了什么问题?', a: '**半同步**:提交要等至少一个从库 ACK。AFTER_SYNC(5.7 默认)先写 binlog、等 ACK、再引擎提交,已返回事务不丢;AFTER_COMMIT 先提交再等,切主可能丢;超时退化异步。**GTID**:全局唯一事务号,替代 file+pos;SOURCE_AUTO_POSITION=1 自动补齐差额,切主不算位点、已执行事务去重。一句话:半同步保不丢,GTID 让切换自动化。' }
    ]
  };
})();
