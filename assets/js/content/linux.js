/* ═══════════════════════════════════════════════════════════
   模块:Linux 工程实战(6 章)
   ═══════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  window.CONTENT = window.CONTENT || {};

  window.CONTENT.linux = {
    id: 'linux',
    title: 'Linux 工程实战',
    en: 'LINUX ENGINEERING',
    icon: 'terminal',
    color: '#2dd4bf',
    tagline: '从命令行到生产排障的一线功夫',
    description: '从第一次登录服务器讲起:把每天要敲的命令练成肌肉记忆 —— 文件与权限、三剑客日志分析、进程与性能排查、网络诊断与服务部署、Shell 脚本三件套。每个知识点都配真实可运行命令与真实格式输出,重点沉淀 CPU 飙高定位、Top10 IP 统计这类排查 SOP。',
    minutes: '≈ 12 小时',
    chapters: [
      /* ─────────────────────────────────────────── */
      {
        id: 'ch00',
        title: 'Linux 入门:你写的 jar 最后跑在哪',
        minutes: 35,
        points: ['内核与发行版', 'Shell 与 SSH', '目录职责', '命令语法'],
        content: `
> [!info] 本章导读 · 先讲个故事
> 你在 IDEA 里点了无数次绿色三角,接口返回 200,日志干净漂亮。上线那天,运维把服务器地址和账号丢给你:"jar 包传上去,起一下。"你登录,面对一个黑底白字的窗口,连文件在哪都不知道;试着敲 cd 桌面,只等来一句 No such file or directory。
> 那一刻你才明白:==代码写得再好,最后都要落在 Linux 上==。本章不讲命令大全,只讲清三件事:Linux 是什么、登录后看到的是什么、一条命令由哪几部分组成。
> - 读完本章你将能:说清内核、发行版与 Shell 的关系
> - 用 ssh 登录一台服务器并看懂登录信息
> - 认出 /etc /var /home 这些目录各自装什么

> [!tip] 日常电脑现场 · 第一次连上服务器
> 你在家点开远程桌面,连上公司那台电脑,看到的还是熟悉的窗口,可那台机器在二十公里外的机房里,键盘鼠标的信号全靠网线传过去。第一次用 ssh 登录 Linux 服务器,感觉一模一样:同样是一个窗口,只是这台机器你摸不到。机房里的服务器往往连显示器都没有,插上电、连上网,就靠命令行管着。

## Linux 是什么:内核、发行版与服务器世界

严格说,Linux 只是**内核(Kernel)**:管理 CPU、内存、磁盘、网络这些硬件资源,对上提供系统调用。你装的"Linux"其实是**发行版(Distribution)** = 内核 + GNU 工具 + 包管理器 + 软件仓库 + 安装程序。

| 发行版 | 包管理器 | 常见场景 |
| --- | --- | --- |
| CentOS / Rocky Linux | yum / dnf | 国内传统企业服务器,资料最多 |
| Ubuntu | apt | 云服务器、容器环境,新手友好 |
| Debian | apt | 追求稳定的老牌发行版,Ubuntu 的祖先 |
| Alpine | apk | 容器镜像,体积极小 |

为什么服务器几乎都是 Linux?四句话:**稳定**(连续跑几个月很常见)、**免费开源**(上千台机器不用买授权)、**生态**(Nginx、MySQL、Redis、Docker 都优先支持)、**轻量**(没有图形界面,内存全留给业务)。

| 维度 | Windows | Linux |
| --- | --- | --- |
| 操作方式 | 图形界面为主 | 命令行(Shell)为主 |
| 文件系统 | C 盘 D 盘,各自为政 | 单一根目录,全部挂在下面 |
| 路径写法 | 以盘符开头,用反斜杠分隔 | 以斜杠开头,用正斜杠分隔 |
| 权限模型 | 用户 + ACL | 属主/属组/其他人 + rwx |
| 软件安装 | 下载安装包双击 | 包管理器一条命令 |
| 配置位置 | 注册表 + 图形界面 | 纯文本,集中在 /etc |

> [!tip] 别被"没有桌面"吓到
> 服务器的图形界面不是必需品,反而是负担:多占内存、多开端口、多一个被攻击面。真正的操作界面是 Shell —— 一条命令能完成的事,点鼠标可能要十下。

## 终端、Shell 与 SSH:第一次登录服务器

三个词经常混着说,其实分工明确:

- **终端 Terminal**:你看到的窗口,负责显示内容和接收键盘输入。
- **Shell**:窗口里运行的程序,负责解析命令,提供变量、管道、重定向(常见的是 bash、zsh)。
- **SSH**:Secure Shell,加密的远程登录协议,让你本机的终端连上远方服务器的 Shell。

一句话:==终端是窗口,Shell 是翻译官,SSH 是加密电话线==。

\`\`\`shell
# 用户名@服务器地址;首次连接会提示确认指纹
ssh root@192.168.10.21
\`\`\`

\`\`\`output
The authenticity of host '192.168.10.21' can't be established.
ED25519 key fingerprint is SHA256:5mZ1kJ8pQx3n7vR2sT9wY4bC6dF0gH1jL2mN3oP4qR8.
Are you sure you want to continue connecting (yes/no)? yes
Warning: Permanently added '192.168.10.21' (ED25519) to the list of known hosts.
root@192.168.10.21's password:
Last login: Fri Nov 14 09:12:03 2026 from 192.168.1.8
[root@prod-web01 ~]#
\`\`\`

看到 ==[root@prod-web01 ~]#== 就表示登录成功:当前用户 root、主机名 prod-web01、所在目录 ~(家目录),==#== 代表超级用户,普通用户是 ==$==。

> [!warn] 首次连接的指纹提示不是报错
> 它是在防"中间人攻击":确认指纹与运维给的一致后再输 yes。指纹突然变化要警惕,可能是服务器重装,也可能是有人冒充。生产环境建议配置公钥登录并关闭密码登录。

## 登录后第一眼:文件系统长什么样

Linux 没有 C 盘 D 盘,所有东西都挂在唯一的根目录 ==/== 下面:

\`\`\`text
/
├── etc      配置文件
├── var      会变化的数据(日志、数据库、缓存)
├── home     普通用户的家目录
├── root     超级用户的家目录
├── opt      第三方软件(自建服务常放这)
├── usr      系统程序与库
├── tmp      临时文件,重启可能被清
└── proc     内核与进程的虚拟视图(不占磁盘)
\`\`\`

| 目录 | 装什么 | 你什么时候会去 |
| --- | --- | --- |
| /etc | 系统与软件的配置文件 | 改 nginx.conf、配环境变量 |
| /var | 可变数据:日志、数据库、队列 | 查 /var/log 排障 |
| /home | 普通用户目录 | 放脚本、上传 jar |
| /opt | 第三方应用 | 部署自建服务 |
| /usr | 系统命令与库 | 找 java、看命令装在哪 |
| /tmp | 临时文件 | 解压、传包,别放重要东西 |

登录后先确认"我是谁、我在哪":

\`\`\`shell
pwd        # 当前目录
whoami     # 当前用户
\`\`\`

\`\`\`output
/root
root
\`\`\`

**一切皆文件**是 Linux 的核心哲学:硬盘是文件、网卡是文件、进程信息也是文件。所以你能用同一套命令(cat、ls、grep)读配置、看日志、查内核参数 —— 学会一套,处处能用。

## 命令的语法结构

绝大多数命令都长这样:

\`\`\`text
命令        [选项]              [参数]
ls          -lh                 /var/log
│            │                   │
要做什么     怎么做(可组合)       对谁做
\`\`\`

\`\`\`shell
ls -lh /var/log
\`\`\`

\`\`\`output
total 1.8M
-rw-r--r-- 1 root root  182K Nov 14 09:40 messages
-rw-r----- 1 root adm   1.1M Nov 14 10:02 syslog
drwxr-xr-x 2 root root  4.0K Nov 13 23:10 nginx
\`\`\`

- ==-l==:长格式,一行一个文件,带权限、属主、大小、时间。
- ==-h==:human-readable,把字节数换算成 K/M/G。
- 短选项可以合并写 ==-lh==,也可以分开写 ==-l -h==;长选项用双横线,如 ==--help==。

> [!tip] 两个不用背的入口
> 忘了参数就敲 ==man ls== 看手册(按 q 退出),或者 ==ls --help== 看精简版。高手不是记住所有参数,而是知道去哪查。

| 快捷键 | 作用 | 典型场景 |
| --- | --- | --- |
| Tab | 自动补全命令或路径 | 少打错字,连按两次列出候选 |
| Ctrl + C | 中断当前前台程序 | 命令卡住、ping 不停 |
| Ctrl + L | 清屏(等于 clear) | 输出刷满一屏 |

> [!best] 新手最该养成的三个习惯
> ① 路径先敲两个字母再按 Tab;② 不熟的命令先看 ==--help==;③ 删除或覆盖前先 ==ls== 确认目标。这三条能省下大量手抖事故。

## 这个模块怎么学

Linux 命令两千多个,常用的不到一百,==不要背参数表,要按场景查==:查日志想 tail -f,找文件想 find,看端口想 ss,看磁盘想 df/du,改权限想 chmod。先记住"我要解决什么问题",再记住对应的那一条命令,参数交给 \`man\` 和 \`--help\`。

三条练习建议,按投入从低到高:

1. **装一台虚拟机**:VMware/VirtualBox 装 Ubuntu Server,故意把网络配错、把权限改坏,再自己救回来 —— 破坏与恢复比重装学得快。
2. **每天五条命令**:用 \`history | tail -20\` 回看当天敲过的命令,挑五条用 \`man\` 读一遍参数,一个月覆盖日常八成场景。
3. **用 SSH 连一次真实服务器**:买一台最低配云主机,从改 sshd 端口、配密钥登录、装 Nginx 到看日志排障走一遍,真实环境才有"手抖"的记忆。

每章带走一个 SOP:文件与权限、日志三剑客、CPU 飙高排查、服务部署、脚本三件套;命令会忘,查命令的方法不会忘。

## 本章小结

- Linux 内核管资源,发行版负责把它组装成能用的系统;服务器选它因为稳定、免费、生态好、够轻。
- 终端是窗口、Shell 是解释器、SSH 是加密的远程通道;登录成功的标志是提示符里的用户名和主机名。
- 文件系统是单根树:/etc 放配置、/var 放变化的数据、/home 放用户文件、/opt 放第三方软件。
- 命令的骨架是"命令 + 选项 + 参数",短选项可合并,忘了就查 man 或 --help。
- Tab 补全、Ctrl + C 中断、Ctrl + L 清屏,是命令行里最值钱的三个按键。

## 面试速记

- Linux 严格指内核;CentOS、Ubuntu、Debian、Alpine 都是发行版,差别在包管理器和生态。
- 服务器用 Linux 的四个理由:稳定、免费开源、生态完善、资源占用低。
- 终端(窗口)、Shell(命令解释器)、SSH(加密远程登录)三者不是一回事。
- 一切皆文件:配置、设备、进程信息都能用同一套文本命令查看。
- 命令语法 = 命令 + 选项 + 参数;man 查手册,Tab 补全,Ctrl + C 中断。
`
      },
      /* ─────────────────────────────────────────── */
      {
        id: 'ch01',
        title: '文件与目录操作',
        minutes: 25,
        points: ['chmod/755', 'find 检索', 'tar 打包', '软硬链接'],
        content: `
> [!interview] 章节定位
> Linux 面试第一关:"755 是什么意思?软链接和硬链接的区别?怎么找出 7 天前的日志删掉?"本章全部给出真实可运行命令与真实输出 —— 命令不用背,理解参数、亲手敲过一遍就是你的。

> [!info] 本章导读 · 登录服务器后,第一件事是认清东西放在哪
> 在黑窗口里迷路,是每个新手的必经之路:配置文件找不到、日志不知道在哪、改个权限就报错。
> 本章从最常用的目录、权限与打包命令开始,是整个模块的基本功。
> - 读完本章你将能:熟练穿梭目录并看懂长格式列表
> - 用数字和字母两种方式修改权限
> - 用 find、tar 完成日常的查找与打包

> [!tip] 日常电脑现场 · C盘里的目录树
> 打开资源管理器,左边一排树:C 盘下面有 Users、Program Files、Windows,每个文件夹放什么基本有规矩。不小心改错系统盘的文件夹权限,再点进去就弹你当前无权访问此文件夹。Linux 的 /etc、/var、/home 就是这套规矩的另一个版本。

## 目录导航与查看:cd / ls / cp / rm

\`\`\`shell
cd /opt/app && pwd          # 进入并确认当前位置
ls -lht logs                # -l 长格式 -h 人类可读 -t 按时间倒序
cp -a conf conf.bak         # -a 归档复制:保留权限/时间戳/软链接
mkdir -p logs/2026/11       # -p 连带创建缺失的父目录
mv app.jar app.jar.bak      # 同分区移动即改名
rm -rf logs/2025            # -r 目录 -f 免确认,删前再三确认路径
\`\`\`

\`\`\`output
/opt/app
total 2.1G
-rw-r--r-- 1 app app 412M Nov 13 23:59 app.log
-rw-r--r-- 1 app app 1.2G Nov 12 23:59 app.log.1
drwxr-xr-x 2 app app 4.0K Nov 10 10:00 archive
\`\`\`

读懂 -l 的七列:==权限、硬链接数、属主、属组、大小、修改时间、文件名==。首字符 ==-== 是文件、==d== 是目录、==l== 是链接。

> [!danger] rm -rf 的保命习惯
> 删目录前先 ==ls 目标路径== 确认;变量拼路径必须判空:==[ -n "$dir" ] && rm -rf "$dir"==。变量为空时 ==rm -rf $dir/sub== 会退化成删根目录,每年都有公司上演这一幕。高危操作先备份,是工程素养也是面试素养。

## 权限体系:rwx 与 chmod / chown

权限九位分三组(属主/属组/其他人),每组 ==r=4, w=2, x=1== 相加:

| 数字 | 字母 | 含义 | 典型用途 |
| --- | --- | --- | --- |
| 7 | rwx | 读+写+执行 | 属主全权 |
| 6 | rw- | 读+写 | 配置文件属主 |
| 5 | r-x | 读+执行 | 组/其他人的脚本权限 |
| 4 | r-- | 只读 | 日志对外只读 |

\`\`\`shell
chmod 755 deploy.sh         # 属主 rwx,属组和其他人 r-x
chmod +x health.sh          # 三方都加执行位
chown app:app /opt/app      # 同时改属主和属组
ls -l deploy.sh
\`\`\`

\`\`\`output
-rwxr-xr-x 1 app app 1024 Nov 13 20:00 deploy.sh
\`\`\`

> [!interview] 高频追问:755 到底什么意思?
> ==rwxr-xr-x==:属主可读可写可执行;同组用户和其他人可读可执行、**不可写**。典型场景:**脚本自己要执行、但不想被别人改**。同类:644(配置文件,自己可写他人只读)、700(私有目录,如 ~/.ssh)、600(私钥)。注意目录的 x 表示"可进入",没有 x 即使有 r 也进不去。

## find:文件检索瑞士军刀

\`\`\`shell
# 经典考题:删 7 天前的日志(-mtime +7 = 修改时间在 7 天以前)
find /opt/app/logs -name "*.log" -mtime +7 -exec rm -f {} \\;

# 找大于 100M 的文件(排查磁盘爆满第一步)
find / -type f -size +100M 2>/dev/null | head -5

# 按名字模糊 + 按内容过滤
find /opt/app -name "*.yml" -exec grep -l "redis" {} \\;

# 30 分钟内被改过的文件(应急排查谁动了配置)
find /opt/app -mmin -30 -type f
\`\`\`

\`\`\`output
/opt/app/logs/app.log.1        # +100M 的部分结果
/var/lib/mysql/ibdata1
/var/log/journal/a1b2/system.journal
/opt/app/conf/application.yml  # 含 redis 配置的 yml
/opt/app/conf/application-prod.yml
\`\`\`

> [!tip] -exec 与 xargs 的取舍
> -exec 对每个文件启动一次命令(安全、逐个执行);管道接 xargs 批量执行(更快)。文件名可能带空格时用 ==-exec ... {} \\;== 或 ==xargs -0==,裸管道会按空白切错词。==2>/dev/null== 用来吞掉无权限目录的报错。

## tar:打包与压缩四件套

\`\`\`shell
cd /opt/app
tar -czvf conf-backup.tar.gz conf              # c 创建 z=gzip v 显示 f 文件名
tar -tzf conf-backup.tar.gz | head -3          # t 只看内容不解压
tar -xzvf conf-backup.tar.gz -C /tmp/restore   # x 解压,-C 指定目标目录
\`\`\`

\`\`\`output
conf/
conf/application.yml
conf/logback-spring.xml
\`\`\`

记忆:c 创建、x 解压、t 查看,z 走 gzip(v 显示 f 文件名)。解压陌生包前先 ==tar -tzf== 看一眼有没有藏路径穿越,工程习惯加分。

## ln:软链接与硬链接(必考)

\`\`\`shell
echo hello > a.txt
ln  a.txt b.txt          # 硬链接:同一 inode 的第二个名字
ln -s a.txt c.txt        # 软链接:新建 inode,内容是目标路径
ls -li a.txt b.txt c.txt # -i 显示 inode 号
\`\`\`

\`\`\`output
131074 -rw-r--r-- 2 root root 6 Nov 13 20:01 a.txt
131074 -rw-r--r-- 2 root root 6 Nov 13 20:01 b.txt    # inode 相同,链接数 2
131075 lrwxrwxrwx 1 root root 6 Nov 13 20:01 c.txt -> a.txt
\`\`\`

| 维度 | 硬链接 | 软链接 |
| --- | --- | --- |
| inode | 与源文件**同一个** inode | 自己的 inode,内容是**目标路径** |
| 跨文件系统/分区 | 不允许 | 允许 |
| 链接目录 | 不允许(防止环) | 允许 |
| 删除源文件后 | 数据仍在(链接数减 1,减到 0 才真删) | 变悬空链接,访问报错 |
| 本质 | 文件的多个名字 | 路径的快捷方式 |

> [!interview] 一句话背诵版
> 硬链接是"一个文件的多个名字":共享 inode、不能跨分区、不能链目录,删源文件数据还在;软链接是"存路径的快捷方式":有自己的 inode,可跨分区可链目录,源删即悬空。验证手段 ==ls -i== 看 inode 是否相同。生产经典应用:nginx 的 sites-enabled 指向 sites-available、多版本 JDK 用软链接切换。

## 用户管理与环境变量

上线第一课:应用不要用 root 跑。建专用用户、按组授权、把环境变量写进正确的配置文件,是"部署规范"里最先被问到的一节。

### 用户与组:useradd / passwd / id

\`\`\`shell
useradd -m -s /bin/bash -G docker,app deploy   # -m 建家目录 -s 指定登录 shell -G 附加组
passwd deploy                                  # 交互式设置密码
id deploy                                      # 看 uid/gid/附加组
usermod -aG docker deploy                      # 追加组:-a 不能省,否则覆盖原有附加组
userdel -r olduser                             # -r 连家目录、邮件一起删
\`\`\`

\`\`\`output
uid=1002(deploy) gid=1002(deploy) groups=1002(deploy),999(docker),1001(app)
\`\`\`

| 文件 | 内容 | 关键字段 |
| --- | --- | --- |
| /etc/passwd | 用户账号(所有人可读) | 用户名:密码占位x:UID:GID:描述:家目录:登录shell |
| /etc/shadow | 密码哈希(仅 root 可读) | 用户名:哈希:最后修改天数:... |
| /etc/group | 组与成员 | 组名:密码:GID:成员列表 |
| /etc/sudoers | sudo 授权 | 用 visudo 修改,别直接编辑 |

UID 规矩:**0 是 root**;系统服务账号通常 1~999,普通用户从 1000 起。给只跑服务的账号加 ==-r -s /sbin/nologin==,不允许登录,被攻破也拿不到 shell。

> [!warn] -aG 少写 a 的后果
> ==usermod -G docker deploy== 会把 deploy 的附加组**重置**为只有 docker,原有 app 组直接丢失,应用突然读不了文件。追加组一律 ==usermod -aG==,改完用 ==id deploy== 复核。

### which / whereis / history:定位命令与翻旧账

\`\`\`shell
which java               # PATH 中第一个匹配的可执行文件
whereis java             # 二进制、源码、man 手册的位置
type -a java             # 所有同名命令(别名/内建/函数都能看见)
history | grep useradd   # 翻历史,找当初怎么建的账号
history -c               # 清空当前会话历史
\`\`\`

\`\`\`output
/usr/bin/java
java: /usr/bin/java /usr/lib/jvm/java-17-openjdk-amd64 /usr/share/man/man1/java.1.gz
java is /usr/bin/java
  512  useradd -m -s /bin/bash -G docker,app deploy
  513  id deploy
\`\`\`

==which== 只看 PATH,找不到 shell 内建命令(如 cd)和别名;排查"命令到底走的哪个版本"用 ==type -a==,比 which 更可靠。

### 环境变量:export 与加载顺序

\`\`\`shell
export APP_ENV=prod                 # 当前 shell 及子进程生效
echo $APP_ENV
env | grep APP_                     # 查看所有环境变量里的 APP_ 前缀
printenv APP_ENV                    # 只取值
unset APP_ENV                       # 删除变量
echo 'export APP_ENV=prod' >> ~/.bashrc   # 永久生效
source ~/.bashrc                    # 立即生效(等价 . ~/.bashrc)
\`\`\`

\`\`\`output
prod
APP_ENV=prod
prod
\`\`\`

加载顺序是必考题,先分清 shell 类型:

\`\`\`text
登录 shell(ssh 登录、su -、bash -l)
  /etc/profile
    ├─ /etc/profile.d/*.sh
    └─ ~/.bash_profile(或 ~/.profile)
          └─ ~/.bashrc → /etc/bashrc(RHEL)/ /etc/bash.bashrc(Debian)

非登录交互 shell(已登录后新开终端、直接敲 bash)
  ~/.bashrc → /etc/bashrc

非交互 shell(执行脚本、cron、ssh host "cmd")
  只读 BASH_ENV(若设置),上面这些文件一个都不加载!
\`\`\`

一句话:**登录 shell 先 /etc/profile 后 ~/.bash_profile;交互非登录只读 ~/.bashrc;cron 与 ssh 远程单命令什么都不读**。所以脚本里不能假设 PATH、JAVA_HOME 存在。

> [!best] 环境变量放哪:一张决策表
> 对所有用户生效的系统级变量(如 JAVA_HOME)→ /etc/profile.d/app.sh;只对某用户 → ~/.bashrc;systemd 服务 → service 文件里的 ==Environment== 或 ==EnvironmentFile==;容器 → Dockerfile ENV / compose environment。**应用配置永远不要依赖 ~/.bashrc**,因为服务进程根本不会加载它。

> [!interview] 高频追问:为什么 crontab 里 java: command not found?
> cron 用非交互、非登录 shell 执行任务,不加载 /etc/profile 与 ~/.bashrc,PATH 只有 /usr/bin:/bin。解法:脚本里写绝对路径(==/usr/bin/java==)、或在 crontab 顶部 ==PATH=/usr/local/bin:/usr/bin:/bin==、或在脚本内 ==source /etc/profile==。同理 ==ssh host "java -version"== 也可能找不到命令。

## vim 与软件包管理:服务器上的编辑器与装软件

服务器上没有 IDE,改配置、看日志、修脚本全靠 vim;装软件也不是下载 exe 双击,而是包管理器或源码编译。这一节把两件"每天都要做"的事练成肌肉记忆。

### vim:三种模式与十个救命键

\`\`\`text
        ┌────────────────┐   i / a / o / I / A / O   ┌──────────────────┐
        │ Normal 普通模式  │ ─────────────────────────▶ │ Insert 插入模式    │
        │ 移动 · 删除 · 复制 │ ◀───────────────────────── │ 打字 · 回车 · 退格  │
        └────────────────┘            Esc             └──────────────────┘
              │
              │  :  /  ?
              ▼
        ┌──────────────────┐
        │ Command 命令模式   │  :w 保存  :q 退出  :wq 保存退出  :q! 放弃
        └──────────────────┘
\`\`\`

打开文件默认在 **Normal**,所有移动、删除、复制都在这层完成;按 i/a/o 才进 Insert 打字,Esc 回 Normal,再按 : 进 Command 执行保存退出。新手最常见的事故是"打开 vim 拼命打字没反应",因为还停在 Normal。

| 按键 | 作用 | 典型场景 |
| --- | --- | --- |
| \`dd\` | 删除(剪切)当前行 | 删掉配置里多出来的一行 |
| \`yy\` | 复制当前行 | 复制一段配置再粘贴 |
| \`p\` | 粘贴到光标后/下一行 | 配合 yy、dd 使用 |
| \`u\` | 撤销 | 改错了立刻救回 |
| \`gg\` | 跳到文件第一行 | 从头读配置 |
| \`G\` | 跳到文件最后一行 | 看最新追加的日志 |
| \`/keyword\` | 向下搜索 | 定位 server_name、worker_connections |
| \`n\` / \`N\` | 下一个 / 上一个匹配 | 连续跳转同类配置项 |
| \`:wq\` | 保存并退出 | 改完收工 |
| \`:q!\` | 强制退出不保存 | 改乱了放弃,不污染文件 |

前缀数字是效率关键:\`5dd\` 删 5 行、\`3yy\` 复制 3 行、\`10G\` 跳到第 10 行、\`:%s/old/new/g\` 全文替换。

改配置的完整流程(以 nginx 为例):

\`\`\`shell
cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.$(date +%Y%m%d)   # 1. 先备份
vim /etc/nginx/nginx.conf
# 2. 进入 vim 后:gg 到顶 → /worker_connections 搜索 → n 下一个 → i 插入 → 改数字
#    → Esc 回普通模式 → :wq 保存退出
nginx -t                        # 3. 语法校验,失败绝不 reload
systemctl reload nginx          # 4. 平滑重载
\`\`\`

\`\`\`output
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
\`\`\`

> [!warn] 三个新手事故
> ① 没按 Esc 就敲 \`:wq\`,结果把冒号写进了正文;② 改了文件却用 \`:q\`,vim 不让退出,正确是 \`:wq\` 或 \`:q!\`;③ 直接覆盖生产配置且没备份,改错无从回滚 —— 先 cp,再校验,最后 reload。最小化安装只有 \`vi\`,vim 是其增强版,快捷键通用。

### 包管理:yum/dnf 与 apt 对照

| 动作 | RHEL / CentOS(yum,8+ 用 dnf) | Ubuntu / Debian(apt) |
| --- | --- | --- |
| 安装 | \`yum install -y nginx\` | \`apt install -y nginx\` |
| 卸载 | \`yum remove -y nginx\` | \`apt remove -y nginx\`(purge 连配置删) |
| 搜索 | \`yum search redis\` | \`apt search redis\` |
| 包详情 | \`yum info nginx\` | \`apt show nginx\` |
| 更新索引 | \`yum makecache\` | \`apt update\` |
| 升级全部 | \`yum update -y\` | \`apt upgrade -y\` |
| 已安装列表 | \`rpm -qa \\| grep nginx\` | \`dpkg -l \\| grep nginx\` |
| 文件属于哪个包 | \`rpm -qf /usr/sbin/nginx\` | \`dpkg -S /usr/sbin/nginx\` |
| 清缓存 | \`yum clean all\` | \`apt clean\` |

\`\`\`shell
yum install -y nginx              # -y 免交互,适合脚本
yum search redis                  # 按包名和描述搜索
yum info nginx                    # 版本、仓库、大小
yum remove -y telnet              # 卸载
yum clean all && yum makecache    # 清缓存并重建索引
rpm -qa | grep nginx              # rpm 层看已安装的包(不装 yum 也能用)
\`\`\`

\`\`\`output
Loaded plugins: fastestmirror
Resolving Dependencies
--> Running transaction check
---> Package nginx.x86_64 1:1.20.1-10.el7 will be installed
--> Finished Dependency Resolution
Complete!
nginx-1.20.1-10.el7.x86_64
\`\`\`

> [!tip] dnf 与 apt 的两个坑
> \`dnf\` 是 yum 的下一代(RHEL 8+ / Fedora),命令基本兼容,依赖解析更快、支持事务回滚;CentOS 7 仍是 yum。Ubuntu 的 \`apt update\` 只更新**索引**,\`apt upgrade\` 才真正升级软件 —— 把 update 当升级是新手高频误解。

### 源码编译:仓库里没有的版本与模块

\`\`\`shell
# 1) 装编译工具链与依赖(缺一个都会在 configure 阶段报错)
yum install -y gcc make pcre-devel zlib-devel openssl-devel
# 2) 下载并解压
wget https://nginx.org/download/nginx-1.24.0.tar.gz
tar -zxvf nginx-1.24.0.tar.gz && cd nginx-1.24.0
# 3) 配置 → 编译 → 安装
./configure --prefix=/usr/local/nginx --with-http_ssl_module
make -j$(nproc)
make install
\`\`\`

\`\`\`output
Configuration summary
  + using system PCRE library
  + using system OpenSSL library
  + using system zlib library

  nginx path prefix: "/usr/local/nginx"
  nginx binary file: "/usr/local/nginx/sbin/nginx"
  nginx configuration prefix: "/usr/local/nginx/conf"
\`\`\`

为什么有的软件必须编译:① 官方仓库版本太旧,需要新特性或安全补丁;② 需要仓库默认没编进去的模块(如 \`--with-http_ssl_module\`、\`--add-module\` 第三方模块);③ 要指定安装路径、裁剪功能或打补丁。代价是依赖、升级、卸载全得自己管,**能用包管理器就别编译**。

### 权限补充:umask 与用户组

\`\`\`shell
umask                          # 0022:新文件 644,新目录 755
umask 027                      # 临时收紧:新文件 640,新目录 750
groupadd devops                # 建组
usermod -aG devops deploy      # 追加附加组,-a 不能省
id deploy                      # 验证 groups 里要有 devops
\`\`\`

\`\`\`output
0022
uid=1001(deploy) gid=1001(deploy) groups=1001(deploy),1002(devops)
\`\`\`

新建文件默认 \`666 & ~umask\`、目录默认 \`777 & ~umask\`:umask 022 得到 644/755,umask 027 得到 640/750。umask 只影响当前 shell 及子进程,要永久生效写进 \`/etc/profile\` 或 \`~/.bashrc\`;用户组改完必须重新登录(或 \`newgrp\`)才在新会话生效。

> [!interview] 本节串成一道题
> "线上怎么快速改配置?"标准答法:**备份 → vim 定位修改 → 语法校验 → reload**,而不是 restart。补一句"vim 三模式 + 十个快捷键"和"yum 装包、rpm 查包、源码编译补仓库没有的版本",就是完整的运维基本功。

## 面试速记

- 权限 755 = rwxr-xr-x:自己全权,他人可读可执行不可写;目录的 x 是"进入"权。
- find 三板斧:按名 -name、按大小 -size、按时间 -mtime/-mmin;-exec 逐个安全,xargs 批量快。
- tar 四件套:c 创建 x 解压 t 查看 z 压缩;解压前先 -t 预览。
- 硬链接同 inode、跨不了分区链不了目录;软链接存路径,源删即悬空。
- rm -rf 前先 ls 确认、变量判空 —— 这是习惯,也是面试官暗中观察的素养。
`
      },
      /* ─────────────────────────────────────────── */
      {
        id: 'ch02',
        title: '文本处理三剑客',
        minutes: 35,
        points: ['grep 找行', 'awk 切列', 'sed 改文', 'Top10 IP 实战'],
        content: `
> [!interview] 章节定位
> 三剑客是 Linux 面试的实操大题,几乎必考"统计 access.log 里访问量 Top10 的 IP"。回答套路一句话:**grep 找行、awk 切列、sed 改文**,然后现场推组合命令。本章所有命令真实可运行,输出都是真实格式。

> [!info] 本章导读 · 几百万行日志,怎么捞出你要的那一行
> 线上出问题第一反应是看日志,可日志动辄几个 G,打开就卡死。
> 三剑客为此而生:一个找、一个切、一个改,再用管道串成流水线;本章是排障能力的第一块拼图。
> - 读完本章你将能:用 grep 按关键字和上下文定位异常
> - 用 awk 取列、过滤、做分组统计
> - 用 sed 完成批量替换与指定行提取

> [!tip] 日常电脑现场 · 筛选与查找替换
> 一张几万行的表格,你按列筛选出状态为失败的行,再用查找替换把旧域名批量换成新的,几秒钟就搞定。服务器上的日志就是这张表,只是它大到 Excel 根本打不开。grep 负责筛选,awk 负责取列,sed 负责替换。

## grep:精准找到那一行

\`\`\`diagram:d-pipeline
\`\`\`

把三剑客的组合想象成一条**工厂流水线**:grep 是筛选员,从成堆零件里挑出含油的那几个;awk 是车床,对准位置只切第 3 列;sed 是喷漆工,负责查找替换、给零件翻新外观。串起它们的竖线(|)就是**传送带**,上一道工序的输出原样滚进下一道工序,一条命令就跑完整条产线。

\`\`\`shell
grep -n "ERROR" app.log                # -n 带行号
grep -c "ERROR" app.log                # -c 只统计条数
grep -C 3 "OutOfMemoryError" app.log   # -C 3 前后各 3 行上下文
grep -E "ERROR|WARN" app.log           # -E 扩展正则,多关键词
grep -rn "server.port" /opt/app/conf   # -r 递归目录
grep -v DEBUG app.log | grep ERROR     # -v 反向排除,管道叠加
\`\`\`

\`\`\`output
1245:2026-11-13 14:02:11.331 ERROR [http-nio-8080-exec-4] c.d.s.OrderService - 下单失败 sku=88
6
1242:... (OutOfMemoryError 前 3 行)
1245:... (命中行)
1248:... (后 3 行)
1245:... ERROR 下单失败 sku=88
1247:... WARN  库存告警 sku=88
/opt/app/conf/application.yml:12:  port: 8080
\`\`\`

排查线上问题的黄金组合:==grep -C 3 关键词== 看上下文,比单行信息量大得多;目录里找配置用 ==grep -rn==。

## awk:按列切分与统计(核心)

工作原理:逐行读入,按分隔符(默认连续空白)切列;==模式 {动作}== 逐行执行,END 块收尾统计。

| 内置变量 | 含义 | 示例 |
| --- | --- | --- |
| $0 | 整行 | print $0 |
| $1..$N | 第 N 列 | print $1 |
| $NF | 最后一列 | print $NF |
| NF | 当前行列数 | print NF |
| NR | 当前行号(跨文件累计) | NR>=10 && NR<=20 |
| FNR | 当前文件内行号 | 多文件时区分 |

\`\`\`shell
awk '{print $1}' access.log               # 取第一列(IP)
awk -F: '{print $1, $3}' /etc/passwd      # -F 指定分隔符,取用户名和 UID
awk '$9==500 {print $7}' access.log       # 模式过滤:第 9 列是 500 的第 7 列
awk 'NR>=10 && NR<=20 {print NR, $0}' app.log   # 取 10-20 行并带行号
\`\`\`

\`\`\`output
203.0.113.45
198.51.100.12
root 0
bin 1
/api/order
/api/pay
10 2026-11-13 14:02:10.201 INFO  ...
\`\`\`

**必背题:统计访问 Top10 IP**(两种写法都要会):

\`\`\`shell
# 写法一:awk 数组统计,一次扫描完(推荐)
awk '{ip[$1]++} END {for (i in ip) print ip[i], i}' access.log | sort -rn | head -10
# 写法二:sort + uniq -c 管道流
awk '{print $1}' access.log | sort | uniq -c | sort -rn | head -10
\`\`\`

\`\`\`output
   4821 203.0.113.45
   2310 198.51.100.12
   1877 192.0.2.77
   1204 203.0.113.101
    986 198.51.100.53
    812 192.0.2.9
    774 203.0.113.66
    653 198.51.100.200
    599 192.0.2.31
    541 203.0.113.90
\`\`\`

写法一拆解:==ip[$1]++== 以 IP 为下标累加 → END 块遍历输出"次数 IP" → ==sort -rn== 按数值倒序 → ==head -10==。面试官问"为什么写法二要先 sort",标准答案:**uniq 只折叠相邻重复行,不 sort 统计出的是碎片**。

## sed:流编辑器,改文利器

\`\`\`shell
sed -n '100,120p' app.log                     # -n 抑制默认输出,p 打印 100-120 行
sed -n '/ERROR/p' app.log                     # 按模式打印(等价 grep)
sed 's/port: 8080/port: 9090/' application.yml    # s 替换(不写回,先预览)
sed -i.bak 's/port: 8080/port: 9090/' application.yml  # -i 写回,自动留 .bak
sed -i '/2026-11-10/d' app.log                # d 删除匹配行
sed -n '50p;100p' app.log                     # 打印第 50 和 100 行
\`\`\`

\`\`\`output
server:
  port: 9090
\`\`\`

改配置的标准动作:先不带 -i 预览替换结果,确认后再 ==-i.bak== 写回(自动备份),最后 grep 验证 —— 三步走,手滑不背锅。

## 组合技:日志分析四连实战

Nginx 日志样例(记住列位就不用背结论):

\`\`\`text
203.0.113.45 - - [13/Nov/2026:14:02:11 +0800] "GET /api/order HTTP/1.1" 200 187 "-" "Mozilla/5.0"
\`\`\`

列位:$1 是 IP,$7 是 URL,$9 是状态码。四条 SOP:

\`\`\`shell
# SOP1:Top10 IP(防 CC 攻击第一反应)
awk '{print $1}' /var/log/nginx/access.log | sort | uniq -c | sort -rn | head -10

# SOP2:访问量 Top5 接口
awk '{print $7}' /var/log/nginx/access.log | sort | uniq -c | sort -rn | head -5

# SOP3:5xx 错误占比(一行算出百分比)
awk '$9>=500 {n++} END {printf "%.2f%% (%d/%d)\\n", n*100/NR, n, NR}' /var/log/nginx/access.log

# SOP4:14 点这一小时的请求量(排查异常定时任务)
awk '$4 ~ /:14:/ {c++} END {print c+0}' /var/log/nginx/access.log
\`\`\`

\`\`\`output
   4821 203.0.113.45
   2310 198.51.100.12
   1877 192.0.2.77
   1877 /api/order
   1204 /api/sku
    986 /api/pay
0.42% (156/37250)
3120
\`\`\`

> [!pitfall] 生产环境别直接 cat 大文件
> 10G 日志先缩小范围再统计:==tail -n 100000== 取最近、按日期 grep 过滤、或定位到切割后的具体文件 ==/var/log/nginx/access.log-20261113==。awk 扫 10G 也就十几秒,但 cat 输出到终端会把会话卡死,还会误伤同屏的人。

> [!best] 面试现场推公式
> 别背结论,背列位:IP 在 $1、URL 在 $7、状态码在 $9。被问"统计 4xx 的 Top IP"也能现场推:==awk '$9>=400 {print $1}' access.log | sort | uniq -c | sort -rn | head==。展示"管道组合思维"比背答案高一档。

## 重定向·通配符与 find 组合技

三剑客解决"文本进来怎么处理",这一节解决"数据从哪来、到哪去"和"文件怎么批量找":重定向决定流向,通配符决定批量,find 决定按条件精确筛选。三者串起来,就是运维脚本的骨架。

### 重定向:文件描述符的搬运工

| 写法 | 作用 | 典型场景 |
| --- | --- | --- |
| \`> file\` | stdout 覆盖写入 | 生成报告 |
| \`>> file\` | stdout 追加 | 日志追加 |
| \`2> file\` | stderr 覆盖写入 | 单独收集错误 |
| \`2>> file\` | stderr 追加 | 错误日志长期保留 |
| \`2>&1\` | stderr 并入 stdout 当前去向 | 合并两个输出流 |
| \`&> file\` | stdout + stderr 一起写(bash) | 一键全收 |
| \`< file\` | stdin 来自文件 | while read 逐行处理 |
| \`> /dev/null 2>&1\` | 全部丢弃 | 静默 cron、健康检查 |

顺序陷阱:\`cmd > all.log 2>&1\` 正确,\`cmd 2>&1 > all.log\` 错误。重定向从左到右执行,\`2>&1\` 的含义是"把 fd2 复制到 fd1 **当前**指向的地方";写反了,stderr 先复制到终端,再把 stdout 改到文件,错误仍然刷屏。

\`\`\`shell
java -jar app.jar > app.log 2>&1 &        # 标准写法:两个流进同一文件
java -jar app.jar > out.log 2> err.log &  # 分开收集,排错更清晰
./deploy.sh >> deploy.log 2>&1            # 追加,保留历史
ls /root 2>/dev/null                      # 权限错误不刷屏
curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8080/health   # 丢弃响应体只看状态码
\`\`\`

管道把上一条命令的 stdout 接到下一条的 stdin,默认只看**最后一个命令**的退出码。\`tee\` 像三通管:一边接屏幕,一边落文件。

\`\`\`shell
./deploy.sh 2>&1 | tee deploy.log          # 屏幕看得见,同时落盘
./deploy.sh 2>&1 | tee -a deploy.log       # 追加,不覆盖
set -o pipefail                            # 管道任一环失败,整体退出码非 0
grep -c "ERROR" app.log | tee error.count  # 统计结果同时留档
\`\`\`

\`\`\`output
[deploy] pulling image app:2026.11.14
[deploy] restart app ...
[deploy] health check: UP
\`\`\`

> [!warn] 管道最坑的一条
> \`false | tee log\` 的退出码是 0,因为管道返回最后一环的状态。脚本里 \`cmd | tee log || exit 1\` 会**误判成功**;必须在脚本开头 \`set -o pipefail\`,让任一环失败都向上传递。同理 \`set -e\` 只管简单命令,和 pipefail 要一起用。

### 通配符:shell 先展开,再交给命令

| 通配符 | 匹配规则 | 示例 | 展开结果 |
| --- | --- | --- | --- |
| \`*\` | 任意长度任意字符(不含 /) | \`*.log\` | app.log、error.log |
| \`?\` | 恰好一个字符 | \`app-?.log\` | app-1.log、app-a.log |
| \`[abc]\` / \`[0-9]\` | 集合或范围内的一个字符 | \`app-[0-9].log\` | app-1.log … app-9.log |
| \`[!0-9]\` | 排除指定字符 | \`app-[!0-9].log\` | app-a.log |
| \`{a,b}\` | 大括号展开(不是 glob,可嵌套) | \`app.{log,jar}\` | app.log app.jar |
| \`**\` | 递归匹配(需 \`shopt -s globstar\`) | \`**/*.java\` | 所有层级的 java 文件 |

\`\`\`shell
ls *.log                            # 当前目录所有日志
ls app-?.log                        # 单字符
ls app-[0-9].log                    # 数字结尾
cp config.yml{,.bak}                # 展开为 config.yml config.yml.bak
mkdir -p logs/{2025,2026}/{01,02}   # 一次建 4 个目录
shopt -s globstar && ls **/*.java   # 递归匹配
\`\`\`

\`\`\`output
app.log  app-1.log  app-2.log  error.log
config.yml  config.yml.bak
logs/2025/01  logs/2025/02  logs/2026/01  logs/2026/02
\`\`\`

> [!pitfall] 没匹配到不等于没风险
> bash 默认把没匹配的模式**原样**传给命令,\`rm *.tmp\` 在没有 .tmp 文件时实际执行 \`rm "*.tmp"\` 并报 No such file;脚本里可 \`shopt -s nullglob\` 让空匹配展开为空。反过来,引号会阻止通配符展开:\`"*.log"\` 是字面量,不是文件列表。

### find 组合技:按条件筛,再批量动手

| 需求 | 参数 | 示例 |
| --- | --- | --- |
| 按名 | \`-name\` / \`-iname\` | \`find /opt -name "*.log"\` |
| 按类型 | \`-type f/d/l\` | \`find /opt -type f\` |
| 按大小 | \`-size +100M\` / \`-size -1k\` | 找大文件或空文件 |
| 按时间 | \`-mtime +7\` / \`-mmin -30\` / \`-newermt\` | 7 天前 / 30 分钟内 |
| 按权限 | \`-perm 644\` / \`-perm -4000\` | 配置权限 / SUID 排查 |
| 按属主 | \`-user app\` / \`-group app\` | 定位归属 |
| 动作 | \`-delete\` / \`-exec\` / \`-print0\` | 删除 / 执行 / 安全管道 |

\`\`\`shell
find /opt/app/logs -type f -name "*.log" -size +100M -print
find /opt/app/logs -type f -mtime +7 -name "*.log.*" -print
find /opt/app -type f -newermt "2026-11-01" ! -newermt "2026-11-14"
find /opt/app -type f -perm -4000 2>/dev/null        # 找 SUID 文件
find /opt/app/logs -type f -name "*.log.*" -mtime +7 -print | wc -l
find /opt/app/logs -type f -name "*.log.*" -mtime +7 -print0 | xargs -0 du -ch | tail -1

# 清理 7 天前日志:先 print 确认,再删
find /opt/app/logs -type f -name "*.log.*" -mtime +7 -exec rm -f {} \\;
find /opt/app/logs -type f -name "*.log.*" -mtime +7 -print0 | xargs -0 rm -f
\`\`\`

\`\`\`output
/opt/app/logs/app.log.20261001
/opt/app/logs/app.log.20261002
/opt/app/logs/app.log.20261003
3
1.9G    total
\`\`\`

读法:\`-mtime +7\` 是"修改时间在 7 天**以前**"(按 24 小时向下取整),不是"最近 7 天";最近 7 天用 \`-mtime -7\`。\`-exec ... {} \\;\` 每个文件启动一次进程,安全但慢;\`-exec ... {} +\` 或 \`xargs\` 批量执行更快。文件名可能带空格或换行,必须 \`-print0 | xargs -0\`,裸 \`| xargs\` 会按空白切错。\`-delete\` 自带 \`-depth\`,同样建议先用 \`-print\` 验证。

> [!best] 删除前的三秒原则
> 先用 \`-print\` 或 \`-ls\` 把命中列表看一遍,确认路径与数量;再执行删除。生产清理脚本还要加锁(防两个 cron 同时跑)、限制 \`-maxdepth\`、日志记录删除清单 —— 面试问"怎么删 7 天前日志",答出"先查后删 + print0/xargs"就是加分项。

## 面试速记

- 三剑客分工:grep 找行(-n/-c/-C/-E/-v)、awk 切列($1/$NF/NR/NF)、sed 改文(s 替换、d 删除、-i 写回)。
- Top10 IP 两法:awk 数组法(一次扫描不用 sort)与 sort+uniq -c 法(uniq 只折叠相邻行,必须先 sort)。
- Nginx 日志列位:$1 IP、$7 URL、$9 状态码,记住列位现场推任何统计。
- sed 改配置三步走:先预览再 -i.bak 写回最后 grep 验证。
- 大文件先缩小范围再统计,管道组合是 Linux 的核心思维。
`
      },
      /* ─────────────────────────────────────────── */
      {
        id: 'ch03',
        title: '进程管理与性能排查',
        minutes: 30,
        points: ['ps/top', 'CPU 100% SOP', 'free/df/du', 'vmstat/iostat'],
        content: `
> [!interview] 章节定位
> "服务器 CPU 100% 怎么排查?"是 Java 面试的招牌题,本章给完整 SOP(四步定位到代码行);顺带把 ps/top/free/df/du/vmstat/iostat 的关键参数一次讲清,输出全部是真实格式。

> [!info] 本章导读 · CPU 突然打满,十分钟内怎么找到元凶
> 半夜告警响起,监控显示 CPU 100%,你登录服务器后先敲什么?
> 本章给你一套可复用的排查动作:先看整体负载,再定位进程,再下钻到线程和代码行。
> - 读完本章你将能:读懂 top 与 ps 的关键列
> - 按四步流程定位到具体线程和代码
> - 判断瓶颈在 CPU、内存、磁盘还是 IO

> [!tip] 日常电脑现场 · 风扇突然狂转
> 笔记本风扇突然狂转,你打开任务管理器,某个进程占着九成 CPU,结束它,世界立刻安静。服务器上没有任务管理器,只有黑窗口,你敲 top 看到的其实是同一张表,只是列名换成了英文。排查的第一步永远是:先看谁在吃资源,再看它在干什么。

## ps:进程快照

\`\`\`shell
ps -ef | grep java                    # 全格式列出再过滤
ps aux --sort=-%mem | head -5         # 按内存占用降序前 5
ps -eo pid,ppid,user,%cpu,%mem,stat,cmd --sort=-%cpu | head -6
\`\`\`

\`\`\`output
app   1234     1  1.2  8.5 ?  Sl Nov09 12:30 java -jar /opt/app/app.jar
root   987     1  0.0  0.1 ?  Ss Nov09  0:00 /usr/sbin/sshd

  PID  PPID USER  %CPU %MEM STAT COMMAND
 1234     1 app  385.2  8.2 Ssl  java -jar /opt/app/app.jar
  987     1 root   0.0  0.1 Ss   /usr/sbin/sshd
\`\`\`

进程状态 STAT 是常考点:

| 状态 | 含义 | 面试要点 |
| --- | --- | --- |
| R | 运行或就绪 | 正在 CPU 上跑或排队 |
| S | 可中断睡眠 | 等事件,大多数进程的常态 |
| D | 不可中断睡眠 | 通常在等 IO;kill -9 都杀不掉,查存储 |
| Z | 僵尸 | 进程已死等父进程收尸;杀父进程回收 |
| T | 暂停 | SIGSTOP 或调试断点所致 |

> [!warn] D 状态不是"卡死"是"等 IO"
> D 状态进程连 SIGKILL 都不理,因为内核保证它不收任何信号直到系统调用返回。一堆 D 进程 = 存储层出问题(NFS 掉线、磁盘故障),杀进程没用,修存储才是根。

## top:动态仪表盘(字段必考)

\`\`\`shell
top    # 交互键:P 按 CPU 排序 M 按内存排序 1 展开每核 q 退出
\`\`\`

\`\`\`output
top - 14:32:01 up 15 days,  1 user,  load average: 2.35, 1.80, 1.42
Tasks: 189 total,   2 running, 186 sleeping,   0 stopped,   1 zombie
%Cpu(s): 62.5 us,  8.0 sy,  0.0 ni, 28.5 id,  0.5 wa,  0.0 hi,  0.5 si,  0.0 st
MiB Mem :   7821.0 total,    512.0 free,   5230.0 used,   2079.0 buff/cache
MiB Swap:   2048.0 total,   2048.0 free,      0.0 used.   2295.0 avail Mem

  PID USER   PR  NI    VIRT    RES   SHR S  %CPU  %MEM     TIME+ COMMAND
 1234 app    20   0 8192000 640000 12000 S 385.7   8.2 130:12.55 java
  987 root   20   0 168424   9800  4200 S   0.3   0.1   0:21.03 sshd
\`\`\`

- **load average 2.35/1.80/1.42**:最近 1/5/15 分钟平均负载(运行 + 不可中断进程数);经验值:持续高于 CPU 核数 = 任务在排队,4 核机器 load 恒在 4 以上就该查了。
- **%Cpu(s)**:us 用户态(高 = 代码在算)、sy 内核态(高 = 系统调用频繁)、wa 等待 IO(高 = 磁盘瓶颈)、id 空闲、st 被虚拟化层偷走。
- **VIRT/RES/SHR**:虚拟内存/常驻物理内存/共享内存。判断真实占用==看 RES 不是 VIRT==(JVM 的 VIRT 虚高是正常现象,预留地址空间而已)。
- **%CPU 385.7**:超过 100% 是多核叠加,8 核机器单进程理论最高 800%。

## CPU 100% 排查 SOP(Java 版,必背四步)

\`\`\`shell
# ① top 按 P 找到吃 CPU 的进程(记下 PID,如 1234)
top
# ② 看进程内的线程,记下最吃 CPU 的线程 TID(如 1290)
top -Hp 1234
# ③ 线程号转 16 进制
printf "%x\\n" 1290
# ④ jstack 按 nid 过滤,直捣代码行
jstack 1234 | grep -A 30 "nid=0x50a"
\`\`\`

\`\`\`output
50a
"http-nio-8080-exec-8" #34 daemon prio=5 os_prio=0 tid=0x00007f8a1c0e2000 nid=0x50a runnable
   java.lang.Thread.State: RUNNABLE
        at com.demo.service.OrderService.calcPrice(OrderService.java:88)
        at com.demo.controller.OrderController.create(OrderController.java:42)
\`\`\`

四步口诀:**进程 → 线程 → 十六进制 → jstack 定位行号**。死循环、正则回溯爆炸、频繁 Full GC(GC 线程吃 CPU)都能这样一竿子捅到行号。

> [!tip] CPU 高不一定是死循环
> 先看吃 CPU 的是不是 ==GC 线程==(jstack 里搜 GC task thread):配合 ==jstat -gcutil 1234 1000== 看每秒 GC 情况,FGC 次数一直涨就是内存问题,切到 JVM 排查路线(堆 dump + MAT 分析),别在业务线程里死磕。

## 内存与磁盘:free / df / du

\`\`\`shell
free -h                                   # -h 人类可读
df -h                                     # 各挂载点磁盘使用率
du -sh /opt/app/*                         # 目录实际占用汇总
du -h --max-depth=1 /var | sort -rh | head -5
\`\`\`

\`\`\`output
              total    used    free    shared  buff/cache   available
Mem:          7.6Gi   5.1Gi    501Mi     88Mi       2.0Gi       2.2Gi
Swap:         2.0Gi      0B    2.0Gi

Filesystem      Size  Used Avail Use% Mounted on
/dev/vda1        40G   36G  1.8G  96% /
tmpfs           3.8G     0  3.8G   0% /dev/shm

1.2G    /var/log
640M    /var/lib
88M     /var/cache
\`\`\`

两个必考点:

- **available 不等于 free**:buff/cache 是内核借给磁盘缓存的,随时可回收;判断内存紧不紧张看 ==available==,看 free 会被吓到。
- **df 满、du 小**:文件被删除但进程还握着句柄,空间不释放;==lsof | grep deleted== 找到进程,重启或 ==> app.log== 清空句柄对应的文件。

## vmstat / iostat:瓶颈在 CPU 还是在 IO

\`\`\`shell
vmstat 1 3          # 每 1 秒采样,共 3 次
iostat -x 1 2       # -x 扩展统计
\`\`\`

\`\`\`output
procs -----------memory---------- ---swap-- -----io---- -system-- ------cpu-----
 r  b   swpd   free   buff  cache   si   so    bi    bo   in   cs us sy id wa
 3  0      0 512000 204800 2000000    0    0    12   240 1200 3500 62  8 28  2
 2  1      0 508000 204800 2000000    0    0     8 15600 1180 3600 55 10 20 15

Device   r/s   w/s   rkB/s   wkB/s await  %util
vda      2.0  88.0   16.0  15600.0  12.5   95.6
\`\`\`

- ==r== 运行队列长度:持续大于 CPU 核数 = CPU 瓶颈;==b== 阻塞在 IO 的进程数。
- ==wa== 高 + iostat ==%util== 接近 100% + ==await== 大 = 磁盘瓶颈(上面这组就是:应用在狂刷日志)。
- ==si/so== 非零 = 正在换页(swapping),物理内存不够了,先加内存或限堆。

> [!pitfall] 僵尸进程为什么杀不动?
> Z 状态进程已经死了,kill 对它毫无意义,它只是在等父进程 wait() 收尸。处理:==ps -o ppid= -p 1234== 找父进程,重启父进程让 init 接管回收;若僵尸持续产生,是父进程代码没有回收子进程,属于代码 bug。

## 负载速览:uptime · dmesg · watch

排障第一分钟不需要复杂工具,三条命令回答三个问题:机器忙不忙?有没有进程被系统杀掉?指标在怎么变?

### uptime:load average 三个数字怎么读

\`\`\`shell
uptime
nproc                    # 先看几核,负载才有参照系
cat /proc/loadavg        # 更精确:1/5/15 分钟 + 运行/总线程 + 最近 PID
\`\`\`

\`\`\`output
 14:32:01 up 15 days,  1 user,  load average: 7.82, 5.40, 2.10
8
7.82 5.40 2.10 3/412 12345
\`\`\`

三个数分别是最近 **1 / 5 / 15 分钟**的平均负载,统计的是"运行中 + 不可中断睡眠(D 状态)"的进程数,不是 CPU 使用率。判读看**趋势与核数**:

| 观察 | 含义 | 结论 |
| --- | --- | --- |
| load 持续 < 核数 × 0.7 | 有余量 | 健康 |
| load ≈ 核数 | 基本跑满 | 临界,扩容预警 |
| load 持续 > 核数 | 任务在排队 | 已过载,查 CPU 或 IO |
| 1min 突然高、15min 低 | 刚发生的突发 | 查流量/慢查询/GC |
| 15min 一直高 | 长期容量不足 | 扩容或优化 |

这台 8 核机器 1 分钟 7.82 接近满载,但 15 分钟只有 2.10 —— 说明是**刚刚起来的突发压力**,先查最近几分钟的发布、定时任务、慢 SQL,而不是急着加机器。

> [!pitfall] load 高不等于 CPU 忙
> D 状态(等磁盘/NFS)进程也计入 load:磁盘坏了 load 能飙到几十而 CPU 空闲(id 很高、wa 很高)。判断方法看 ==vmstat 1== 的 r/b 列与 wa:r 高是 CPU 排队,b 高是 IO 阻塞 —— 一个指标高就下结论,十有八九排错方向。

### dmesg:OOM kill 的案发现场

Java 进程"突然消失、没有 OOM 日志、没有 heap dump",第一反应就是被内核 OOM killer 杀了 —— 它是 SIGKILL,应用来不及留任何遗言,证据只在系统日志里。

\`\`\`shell
dmesg -T | grep -i -E "oom|killed process"     # -T 人类可读时间
dmesg -T | tail -50                            # 看被杀前后上下文
journalctl -k --since "1 hour ago" | grep -i oom   # 持久化内核日志
journalctl -k -b -1 | grep -i "killed process"     # 上一次启动(崩溃那轮)
\`\`\`

\`\`\`output
[Thu Nov 13 14:02:11 2026] java invoked oom-killer: gfp_mask=0x100cca(GFP_HIGHUSER_MOVABLE), order=0, oom_score_adj=0
[Thu Nov 13 14:02:11 2026] Out of memory: Killed process 1234 (java) total-vm:8192000kB, anon-rss:6400000kB, file-rss:0kB, shmem-rss:0kB, UID:1001 pgtables:12500kB oom_score_adj:0
\`\`\`

读法:被点名的是 **java(pid 1234)**,anon-rss 6.4G 是它实际占的物理内存,total-vm 8.1G 是虚拟地址空间;内核按 oom_score(可用 ==oom_score_adj== 微调)挑"最该杀"的进程,往往就是内存最大的 Java。容器里则是 cgroup OOM,关键字 ==Memory cgroup out of memory==,宿主 dmesg 同样能看到。

> [!tip] 三种"内存爆"要分清
> ① **Java 堆 OOM**:抛 OutOfMemoryError,有异常栈和 heap dump,查 ==-Xmx== 与泄漏;② **堆外/元空间**:DirectByteBuffer、Metaspace 撑爆,同样抛 OOM 但堆 dump 看不出;③ **系统 OOM killer**:进程直接 SIGKILL,无异常、无 dump,只能看 dmesg/journalctl。第 ③ 种先查容器 limit 与 ==-Xmx + 堆外== 是否超过 limit。

### watch:让指标自己刷新

\`\`\`shell
watch -n 1 uptime                          # 每秒刷新负载
watch -n 2 'ss -s'                         # 观察连接数变化
watch -n 1 'free -h; df -h /'              # 多条命令用引号包住
watch -d -n 1 'ps -eo pid,%cpu,%mem,cmd --sort=-%cpu | head -6'   # -d 高亮差异
\`\`\`

\`\`\`output
Every 1.0s: uptime                          Fri Nov 13 14:32:01 2026

 14:32:01 up 15 days,  1 user,  load average: 7.82, 5.40, 2.10
\`\`\`

==-n== 最小可到 0.1 秒(高版本支持),==-d== 只高亮变化部分,盯"哪个进程的 CPU 在跳"特别直观。压测或发布观察期,用 watch 比反复手敲 top 更适合大屏与远程会话。

## 深入性能排查:sar·strace·perf

top 回答"现在怎么样",但事故往往发生在你登录之前;strace 回答"程序卡在哪个系统调用",perf 回答"CPU 到底烧在哪个函数"。这一节补上事后复盘与下钻的两把刀。

| 工具 | 数据来源 | 时间维度 | 适合回答 | 局限 |
| --- | --- | --- | --- | --- |
| top / htop | /proc 实时 | 当下 | 现在谁在吃 CPU | 退出即无,无法回看 |
| sar | sysstat 定时采集 | 历史任意时段 | 昨晚 2 点为什么卡 | 需提前安装并开启 |
| strace | ptrace 跟踪系统调用 | 实时 | 卡在哪个 syscall | 开销大,不能长期开 |
| perf | 硬件/软件采样 | 实时或录制 | 热点函数、火焰图 | 需符号与权限 |

### sar:把性能数据留成历史

\`\`\`shell
yum install -y sysstat
systemctl enable --now sysstat
sar -u -f /var/log/sa/sa14          # 14 号全天 CPU
sar -r -f /var/log/sa/sa14          # 内存历史
sar -d -p 1 5                       # 磁盘 IO:每秒 1 次,共 5 次
sar -n DEV 1 3                      # 网卡吞吐
sar -u -s 02:00:00 -e 03:00:00 -f /var/log/sa/sa14   # 只回看凌晨 2-3 点
\`\`\`

\`\`\`output
Linux 5.14.0-362.el9.x86_64 (prod-app-01)  11/14/2026  _x86_64_  (8 CPU)

14:00:01        CPU     %user     %system    %iowait      %idle
14:10:01        all      3.12       1.05       0.42      95.41
14:20:01        all     62.30       8.71      12.55      16.44
14:30:01        all     91.02       4.33       0.88       3.77
Average:        all     52.15       4.70       4.62      38.53
\`\`\`

\`sa14\` 是当月 14 日的二进制数据:sysstat 的 sa1 每 10 分钟采一次,sa2 每天汇总成文本报告。**为什么比 top 更适合事后复盘**:top 只有当下,故障恢复后现场就没了;sar 把数据落盘,能对齐告警时间、发布记录、定时任务,回答"昨晚 2:10 那波 CPU 尖刺是谁"。\`%user\` 高 = 应用在算,\`%system\` 高 = 系统调用/中断多,\`%iowait\` 高 = 磁盘等得久。

### strace:程序到底卡在哪一步

\`\`\`shell
strace -p 1234 -T -tt -e trace=network        # 附加进程,只看网络系统调用
strace -f -T -tt -o /tmp/app.strace java -jar app.jar   # 从启动跟,含所有线程
strace -c -p 1234                             # 统计各 syscall 次数与总耗时
\`\`\`

\`\`\`output
21:02:11.120123 connect(12, {sa_family=AF_INET, sin_port=htons(3306), sin_addr=inet_addr("10.0.0.8")}, 16) = -1 EINPROGRESS (Operation now in progress) <0.000021>
21:02:14.120456 poll([{fd=12, events=POLLOUT}], 1, 3000) = 0 (Timeout) <3.000338>
\`\`\`

读法:\`connect\` 发出后立刻返回 EINPROGRESS(非阻塞连接),随后 \`poll\` 等 3 秒超时 —— 卡点是"连 MySQL 连不上",不是 CPU 也不是 GC。\`-T\` 每次调用耗时,\`-tt\` 时间戳,\`-f\` 跟线程,\`-p\` 附加,\`-e trace=\` 过滤。常见卡点:\`connect\`(网络/防火墙)、\`read\`(等下游)、\`futex\`(锁竞争)、\`open\`(文件不存在或权限不足)。

> [!warn] strace 不能当监控开
> 它通过 ptrace 让目标进程在每次系统调用时停一下,高并发服务会慢数倍,生产只做**短时定位**。Java 应用先 \`jstack\` 看线程栈,确认是 native/IO 层再上 strace;容器里还需要 \`cap-add SYS_PTRACE\`。

### perf:CPU 热点与火焰图

\`\`\`shell
perf top -p 1234                          # 实时看用户态+内核态热点函数
perf record -F 99 -p 1234 -g -- sleep 30  # 99Hz 采样 30 秒
perf report                               # 文本界面看调用链占比
# 火焰图:perf script | stackcollapse-perf.pl | flamegraph.pl > cpu.svg
\`\`\`

\`perf top\` 直接回答"CPU 烧在哪个函数",采样频率越高越准、开销越大;火焰图把 \`perf record\` 的数据画成 SVG:**横轴是采样占比(越宽越耗时),纵轴是调用栈**,找最宽的"平顶"就是热点。非 root 或容器里常需调整 \`kernel.perf_event_paranoid\` 或加 \`SYS_ADMIN\` 权限。

### htop 与守护进程

\`htop\` 可以理解为 top 的增强版:彩色、树形、鼠标与 F 键操作、横向滚动,功能更强但**默认不一定安装**;两者都只看实时,历史复盘仍然靠 sar。

| 维度 | 前台进程 | 守护进程(daemon) |
| --- | --- | --- |
| 控制终端 | 绑定当前 tty | 脱离 tty(setsid) |
| 终端关闭 | 收到 SIGHUP 可能退出 | 不受影响 |
| 标准输入输出 | 终端 | /dev/null 或日志文件 |
| 启动方式 | shell 直接运行 | systemd / init 托管 |
| 适用场景 | 调试、临时命令 | 生产常驻服务 |

守护进程的核心是"三脱":脱离控制终端、脱离会话、重定向标准流,所以关掉 SSH 也不会死。生产服务不自己写 daemon 逻辑,而是交给 **systemd**:开机自启、崩溃自动拉起、依赖顺序、cgroup 资源限制、日志统一进 journal、\`systemctl status\` 一眼看状态。自己 \`nohup ... &\` 只能算临时方案,进程挂了没人管。

> [!best] 排查工具箱的一句话总结
> 先 \`sar\` 回看历史确定时间点,再 \`top/htop\` 看当下,然后 \`strace\` 定位阻塞的系统调用、\`perf\` 定位 CPU 热点;Java 层再补 \`jstack\`、\`jstat\`、\`async-profiler\`。工具是手术刀,顺序是:先圈时间,再圈进程,再圈线程,最后到代码行。

## 面试速记

- CPU 100% 四步:top 找进程 → top -Hp 找线程 → printf 转 16 进制 → jstack 按 nid 定位到代码行。
- STAT:D 不可中断(IO)kill -9 都杀不掉;Z 僵尸是父进程没收尸,重启父进程解决。
- top:load average 看趋势、持续超核数即排队;us 高查代码、wa 高查磁盘;真实占用看 RES 别看 VIRT。
- free 看 available 列;df 满 du 小 = 已删文件还被进程握着,lsof | grep deleted 定位。
- vmstat r 超核数 = CPU 瓶颈;wa 高 + %util 近 100% = 磁盘瓶颈;si/so 非零 = 内存不足。
`
      },
      /* ─────────────────────────────────────────── */
      {
        id: 'ch04',
        title: '网络工具与服务部署',
        minutes: 30,
        points: ['ss/lsof', '连通性诊断', 'firewalld', 'systemd 部署'],
        content: `
> [!interview] 章节定位
> 后端部署是每天的日常,也是面试实操题:"端口被占用怎么查?后台起服务有哪几种方式?systemd 怎么配开机自启?"本章从网络诊断工具一路讲到 Spring Boot jar 上生产的完整 SOP。

> [!info] 本章导读 · jar 传上去了,怎么让它稳稳跑着
> 很多人第一次部署的方式是敲 java -jar 然后不敢关窗口,一断线服务就没了。
> 本章从端口排查讲到后台运行、开机自启和反向代理,把能跑升级成跑得住。
> - 读完本章你将能:查出端口被谁占用并妥善处理
> - 用 nohup、systemd 等方式托管 Java 服务
> - 配好 Nginx 反向代理并验证整条链路

> [!tip] 日常电脑现场 · 网站是怎么上线的
> 你在地址栏输入一个域名回车,页面出来了,这中间域名先被解析成 IP 地址,请求再穿过公网落到某台机器上。手机开热点给别人连,对方就能上网,用的也是同一套地址与转发。部署要做的事,就是让这条链路的每一环都通,而不是把 jar 传上去就算完。

## 查端口与连接:ss / netstat / lsof

\`\`\`shell
ss -tlnp | grep 8080          # t=tcp l=监听 n=数字端口 p=进程(必背)
lsof -i :8080                 # 谁占着 8080
netstat -tlnp | grep 8080     # 老命令,部分新系统已移除
ss -ant | awk '{print $1}' | sort | uniq -c    # 各连接状态统计
\`\`\`

\`\`\`output
State   Recv-Q  Send-Q  Local Address:Port  Peer Address:Port  Process
LISTEN  0       100     *:8080              *:*                users:(("java",pid=1234,fd=9))

COMMAND  PID  USER  FD   TYPE  DEVICE SIZE/OFF NODE NAME
java     1234 app   9u   IPv6  45231      0t0  TCP *:http-alt (LISTEN)
\`\`\`

排查"Address already in use"三连:==ss -tlnp | grep 端口== → 拿到 pid → 是旧进程就 kill,是别的服务就改自己端口。==ss -ant | awk== 统计里 TIME_WAIT 突增 = 短连接风暴,该上连接池了。

## 连通性诊断四板斧

| 工具 | 回答的问题 | 用法 |
| --- | --- | --- |
| ping | 网络层通不通(ICMP) | ping -c 4 host |
| nc / telnet | 端口通不通(TCP) | nc -zv host 6379 |
| curl | HTTP 应用正常吗 | curl -v http://host:8080/health |
| traceroute | 路由在哪一跳断的 | traceroute -n host |

\`\`\`shell
ping -c 4 redis.example.com
nc -zv 127.0.0.1 6379
curl -s -o /dev/null -w "%{http_code} %{time_total}s\\n" http://localhost:8080/actuator/health
traceroute -n www.example.com
\`\`\`

\`\`\`output
64 bytes from redis.example.com (10.0.0.8): icmp_seq=1 ttl=64 time=0.31 ms
Connection to 127.0.0.1 6379 port [tcp/*] succeeded!
200 0.045s
 1  10.0.0.1  1.2 ms
 2  211.10.2.1  3.4 ms
 3  * * *
\`\`\`

curl 那行输出 = 状态码 + 总耗时,健康检查与接口耗时速查两用;==time_total== 接近下游超时阈值就要警惕。

## 防火墙:firewalld 常用五连

\`\`\`shell
firewall-cmd --state                          # 是否运行
firewall-cmd --permanent --add-port=8080/tcp  # 永久放行
firewall-cmd --reload                         # 重载生效
firewall-cmd --list-ports                     # 已放行列表
firewall-cmd --permanent --remove-port=8080/tcp && firewall-cmd --reload
\`\`\`

\`\`\`output
running
success
success
8080/tcp
success
\`\`\`

"服务起了但外部访问不通"的第一反应:**先查防火墙,再查云安全组**,最后才怀疑应用。顺序反了会白白排查半小时应用。

## 部署 Spring Boot jar:从手动到 systemd

方式一:nohup 手动后台跑(应急与临时环境):

\`\`\`shell
cd /opt/app
nohup java -jar app.jar --server.port=8080 > app.out 2>&1 &
echo $!          # 记下后台进程 PID($! 是上一条后台命令的 PID)
\`\`\`

\`\`\`output
3120
\`\`\`

参数逐个拆:**nohup** 免疫挂断信号(退出终端不杀进程)、**> app.out** stdout 落文件、**2>&1** stderr 并入 stdout、结尾 **&** 放后台。只写 & 不写 nohup,退出终端发 SIGHUP 可能直接把进程带走。

方式二:systemd 服务化(生产标准):

\`\`\`text /etc/systemd/system/app.service
[Unit]
Description=order app service
After=network.target

[Service]
User=app
WorkingDirectory=/opt/app
ExecStart=/usr/bin/java -Xms1g -Xmx1g -jar /opt/app/app.jar
Restart=always
RestartSec=5
SuccessExitStatus=143

[Install]
WantedBy=multi-user.target
\`\`\`

\`\`\`shell
systemctl daemon-reload     # 改过 service 文件必须先重载
systemctl start app
systemctl enable app        # 开机自启:链接到 multi-user.target.wants
systemctl status app
\`\`\`

\`\`\`output
● app.service - order app service
   Loaded: loaded (/etc/systemd/system/app.service; enabled; preset: disabled)
   Active: active (running) since Fri 2026-11-13 21:00:12 CST; 5s ago
 Main PID: 3120 (java)
   Memory: 1.1G
\`\`\`

> [!tip] SuccessExitStatus=143 是给 kill 的台阶
> ==systemctl stop== 发 SIGTERM,JVM 优雅关机退出码 143(128+15);不声明的话 systemd 会当"失败退出"又拉起一次。==Restart=always + RestartSec=5== 负责崩溃自动拉起,==enable== 负责开机自启,三者配齐才算生产级。

## 部署后必做三件事

\`\`\`shell
ss -tlnp | grep 8080                 # ① 确认端口真的起来了
curl -s http://localhost:8080/actuator/health   # ② 健康检查
tail -f app.out | grep -i error      # ③ 实时盯 1 分钟日志
\`\`\`

\`\`\`output
LISTEN 0 100 *:8080 users:(("java",pid=3120,fd=9))
{"status":"UP"}
\`\`\`

> [!best] 部署检查清单(背下来就是 SOP)
> ① 杀旧进程(pkill -f)→ ② 旧包备份、换新包 → ③ 启动(nohup 或 systemctl start)→ ④ ss 确认端口 → ⑤ curl 健康检查 → ⑥ tail -f 盯 1 分钟日志 → ⑦ 防火墙/安全组放行。面试聊部署,按这个顺序讲就是"生产经验"四个字。

## 文件传输与抓包

发布包怎么最快传上去、日志怎么拉回来、线上不通怎么抓包 —— 这三件事覆盖了后端与服务器打交道的日常。

### scp 与 rsync:别再全量硬拷

| 维度 | scp | rsync |
| --- | --- | --- |
| 传输方式 | 基于 SSH 的全量复制 | 基于 SSH 的差异同步(按块传) |
| 增量 | 不支持,每次全量 | 默认按"大小 + 修改时间"判断,只传变化文件 |
| 断点续传 | 不支持 | ==--partial== 保留半截文件,==--append-verify== 续传 |
| 保留属性 | -p 保留时间戳与权限 | -a 归档:权限/时间/软链接/属主全保留 |
| 删除多余文件 | 不支持 | ==--delete== 镜像删除(危险) |
| 典型场景 | 临时传一个包 | 部署目录、备份、日志拉取 |

\`\`\`shell
# scp:单个文件/整个目录
scp -P 2222 app.jar deploy@10.0.0.8:/opt/app/
scp -r deploy@10.0.0.8:/opt/app/logs ./logs-20261113

# rsync:只传差异 + 断点续传 + 保留属性
rsync -avz --partial --progress app/ deploy@10.0.0.8:/opt/app/
# 镜像同步并排除日志目录
rsync -avz --delete --exclude "logs/" /opt/app/ backup@10.0.0.9:/data/backup/app/
# 预演:只打印将做什么,不真传(改 --delete 前必做)
rsync -avzn --delete /opt/app/ deploy@10.0.0.8:/opt/app/
\`\`\`

\`\`\`output
sending incremental file list
app.jar
     41,205,760 100%   38.21MB/s    0:00:01 (xfr#1, to-chk=0/2)
sent 41,262,331 bytes  received 35 bytes  16,504,946.40 bytes/sec
total size is 41,205,760  speedup is 1.00
\`\`\`

\`\`\`shell
# 每日备份:--link-dest 让未变化文件走硬链接,磁盘只占增量
rsync -avz --delete --link-dest=/data/backup/app-yesterday /opt/app/ /data/backup/app-today/
# 跨机房限速 20MB/s + 超时 60s,避免打满专线
rsync -avz --bwlimit=20M --timeout=60 app/ deploy@10.0.0.8:/opt/app/
\`\`\`

> [!pitfall] 源路径结尾的斜杠会改变语义
> ==rsync -a app/ host:/opt/app/== 同步的是 app **目录里的内容**;==rsync -a app host:/opt/app/== 会在目标下再建一层 app。加不加斜杠结果完全不同,这是 rsync 最高频的翻车点。==--delete== 会删目标端多余文件,永远先用 ==-n== 预演。

> [!tip] 为什么 rsync 大目录快
> 它先对比文件列表(大小 + mtime),只传有变化的文件,传输时再用滚动校验(rolling checksum)按块比对,只传差异块。第一次同步与 scp 差不多,第二次起差距巨大;加 ==-c== 按内容校验更准但更慢。

### journalctl -u:服务日志实时追踪

\`\`\`shell
journalctl -u app -f                                  # 跟踪服务(systemd 单元)
journalctl -u app --since "10 min ago" -p err         # 最近 10 分钟 error 及以上
journalctl -u app -n 100 --no-pager                   # 最近 100 行,不分页
journalctl -u app -b                                  # 只看本次开机
\`\`\`

\`\`\`output
Nov 13 21:00:12 host app[3120]: Started order app service.
Nov 13 21:00:27 host app[3120]: Tomcat started on port 8080 (http)
Nov 13 21:02:11 host app[3120]: ERROR c.d.s.OrderService - 下单失败 sku=88
\`\`\`

systemd 服务写到 stdout/stderr 的内容会自动进 journal,==-f== 等价 tail -f,==-p err== 按 syslog 级别过滤(0 emerg ~ 7 debug)。注意默认日志在 ==/run/log/journal==,**重启即丢**;要留存必须在 ==/etc/systemd/journald.conf== 设 ==Storage=persistent==,再用 ==journalctl --vacuum-time=7d== 控制占用。

### tcpdump:抓包定位"到底通没通"

\`\`\`shell
tcpdump -i any -nn port 8080                    # 指定网卡与端口,-nn 不解析域名/服务名
tcpdump -i eth0 -nn host 10.0.0.8 and port 3306 # 主机 + 端口组合
tcpdump -i any -nn -s 0 -w /tmp/8080.pcap port 8080   # -s 0 抓完整包,存 pcap
tcpdump -r /tmp/8080.pcap -nn -A | head -40     # 读回文件,ASCII 展示内容
\`\`\`

\`\`\`output
14:32:01.123456 IP 10.0.0.5.54321 > 10.0.0.8.8080: Flags [S], seq 123456789, win 64240, length 0
14:32:01.123789 IP 10.0.0.8.8080 > 10.0.0.5.54321: Flags [S.], seq 987654321, ack 123456790, win 65160, length 0
14:32:01.124001 IP 10.0.0.5.54321 > 10.0.0.8.8080: Flags [.], ack 1, win 502, length 0
\`\`\`

三行就是 TCP 三次握手:[S] SYN → [S.] SYN+ACK → [.] ACK。判读口诀:**只有 SYN 没有 SYN+ACK** = 防火墙拦截或对端没监听;**回 RST** = 端口关闭/被拒绝;**有握手但 HTTP 无响应** = 应用层卡住,接着看 ==-A== 的请求内容。抓包要在**两端同时抓**对比,才能分清是"没发出去"还是"没收到"。

> [!warn] 抓包的三条军规
> ① 限流:必须加 ==host== / ==port== 过滤,高流量下裸抓会丢包甚至拖慢机器;② 落盘:用 ==-w== 写 pcap 再拉回 Wireshark,别在终端狂刷;③ 脱敏:==-s 0== 会抓到完整报文(含 Cookie/密码),文件权限与保留时间要管住。

## Nginx 反向代理与负载均衡入门

到上一节为止,服务已经能被 systemd 管住;但真实流量不会直接打 Java 进程,前面通常要有一层 Nginx 做 TLS 终止、静态资源、限流与负载均衡。这一节把"正向/反向代理"和最小可用配置一次讲清。

### 正向代理 vs 反向代理

\`\`\`text
正向代理:客户端知道自己要访问谁,让代理替它去访问
  [浏览器] ──请求 example.com──▶ [正向代理] ──▶ [example.com]
  代理代表客户端:统一出口、访问控制、缓存;服务端只看到代理 IP

反向代理:客户端以为在访问一个地址,实际由代理转发到后端
  [浏览器] ──请求 api.shop.com──▶ [Nginx] ──┬──▶ [Java 10.0.0.5:8080]
                                              └──▶ [Java 10.0.0.6:8080]
  代理代表服务端:隐藏后端拓扑、负载均衡、TLS、限流、静态资源
\`\`\`

| 维度 | 正向代理 | 反向代理 |
| --- | --- | --- |
| 代理谁 | 客户端 | 服务端 |
| 客户端是否知情 | 知道,需在浏览器/系统配代理 | 通常不知道,以为直连 |
| 部署位置 | 客户端或内网出口 | 服务端入口 |
| 主要目的 | 统一出口、访问控制、缓存 | 负载均衡、隐藏后端、TLS 终止 |
| 典型产品 | Squid、公司上网代理 | Nginx、HAProxy、F5 |

判断口诀:**代理帮谁撒谎** —— 帮客户端隐藏"我要访问谁"是正向,帮服务端隐藏"真正是谁在处理"是反向。Nginx 默认做反向代理,配置核心就是 \`upstream\` + \`proxy_pass\`。

### 最小可用配置:两台后端 + 负载均衡

\`\`\`text nginx.conf
worker_processes auto;
events { worker_connections 1024; }

http {
    upstream order_backend {
        least_conn;                       # 负载策略:活跃连接最少者优先
        server 10.0.0.5:8080 max_fails=2 fail_timeout=10s;
        server 10.0.0.6:8080 max_fails=2 fail_timeout=10s;
        keepalive 32;                     # 与后端复用长连接
    }

    server {
        listen 80;
        server_name api.shop.com;

        gzip on;
        gzip_types application/json text/css application/javascript;

        client_max_body_size 10m;         # 请求体上限,默认 1m 是 413 的元凶
        proxy_connect_timeout 3s;         # 连后端超时:快速失败
        proxy_read_timeout 30s;           # 等后端响应超时

        location /api/ {
            proxy_pass http://order_backend;
            proxy_http_version 1.1;
            proxy_set_header Connection "";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        }
    }
}
\`\`\`

| 负载策略 | 配置 | 行为 | 适用场景 |
| --- | --- | --- | --- |
| round-robin(默认) | 不写策略 | 按顺序轮流 | 后端同质、无状态 |
| weight | \`server ... weight=3\` | 加权轮询 | 机器配置不同 |
| ip_hash | \`ip_hash;\` | 按客户端 IP 哈希 | 需要会话粘滞(旧方案) |
| least_conn | \`least_conn;\` | 活跃连接最少者优先 | 请求耗时差异大 |
| hash key | \`hash $request_uri consistent;\` | 按 key 一致性哈希 | 缓存命中率优先 |
| random | \`random two;\` | 随机两台再择优 | 大规模集群 |

### 改完怎么生效:先校验,再平滑重载

\`\`\`shell
nginx -t                       # 语法检查,失败绝不 reload
nginx -s reload                # 平滑重载:旧 worker 处理完存量再退出
systemctl reload nginx         # systemd 安装的等价写法
ss -tlnp | grep :80            # 确认监听
curl -s -o /dev/null -w "%{http_code} %{time_total}s\\n" -H "Host: api.shop.com" http://127.0.0.1/api/order
\`\`\`

\`\`\`output
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
200 0.032s
\`\`\`

\`\`\`shell
curl -sI -H "Host: api.shop.com" http://127.0.0.1/api/order | head -5
\`\`\`

\`\`\`output
HTTP/1.1 200 OK
Server: nginx/1.24.0
Content-Type: application/json
X-Real-IP: 127.0.0.1
\`\`\`

| 常用指令 | 作用 | 默认/建议 |
| --- | --- | --- |
| \`gzip on\` + \`gzip_types\` | 压缩响应体 | JSON/JS/CSS 必开,图片视频别压 |
| \`client_max_body_size\` | 请求体上限 | 默认 1m,上传业务调到 10m~100m |
| \`proxy_read_timeout\` | 等后端响应 | 默认 60s,长任务单独放大 |
| \`proxy_connect_timeout\` | 连后端超时 | 3s,快速失败并切换 |
| \`proxy_next_upstream\` | 失败后换一台 | \`error timeout http_502\` |
| \`proxy_set_header X-Forwarded-For\` | 传真实客户端 IP | 后端日志、限流依赖它 |

> [!pitfall] 413 与 504 先看谁
> **413 Request Entity Too Large** = \`client_max_body_size\` 太小,调 Nginx 而不是改代码;**504 Gateway Timeout** = \`proxy_read_timeout\` 到了后端还没返回,先看后端慢在哪,别盲目把超时调大。502 才是后端连不上或进程挂了。

> [!warn] reload 不是 restart
> \`reload\` 由 master 校验配置后拉起新 worker,旧 worker 处理完存量连接再退出,**不丢请求**;\`restart\` 会中断连接。配置语法错时 reload 会失败,但旧进程继续跑 —— 这是保护,也是为什么改配置必须 \`nginx -t\` 先行。回滚同样只需把备份文件换回来再 reload。

## 面试速记

- 端口占用:ss -tlnp | grep 端口 拿 pid 再 kill;lsof -i :端口 同效;TIME_WAIT 突增查短连接。
- 诊断链路:ping(网络)→ nc -zv(端口)→ curl(应用)→ traceroute(断点路由)。
- 访问不通三查顺序:防火墙 → 云安全组 → 应用监听,顺序反了浪费半天。
- 后台四式:&(裸跑危险)、nohup cmd &(临时)、systemd(生产标准)、容器 -d;> file 2>&1 合流输出。
- systemd 三件套:Restart=always 崩溃拉起、enable 开机自启、SuccessExitStatus=143 防 stop 误判。
`
      },
      /* ─────────────────────────────────────────── */
      {
        id: 'ch05',
        title: 'Shell 脚本编程',
        minutes: 30,
        points: ['变量/条件/循环', '函数', '一键部署', '日志清理+crontab', '健康检查'],
        content: `
> [!interview] 章节定位
> Shell 面试考"你写过什么脚本",直接甩三个能落地的案例:一键部署、日志清理(配 crontab)、健康检查自动拉起。语法快速过一遍,重点在案例里的工程细节。

> [!info] 本章导读 · 同一串命令敲第三遍,就该写成脚本
> 部署、备份、清日志,这些动作每天重复,手工执行迟早出错。
> Shell 脚本把步骤固化下来,再交给定时任务,你就有了一个不知疲倦的助手;本章是前面所有命令的组合运用。
> - 读完本章你将能:写出带参数、判断和循环的脚本
> - 处理命令执行失败与信号中断
> - 用 crontab 定时调度并留下可查的日志

> [!tip] 日常电脑现场 · 一键执行的批处理
> 装软件时双击一个 bat 文件,黑窗口一闪一闪滚过几十行字,环境变量、目录、服务全配好了。你平时在命令行里敲的那一长串命令,其实就写在这个文件里,一行一行往下执行。Shell 脚本干的是同一件事,只是换了个操作系统和一套语法。

## 变量与命令替换

\`\`\`shell
#!/bin/bash
app="order-app"                  # 等号两边不能有空格!
echo "deploy $app"               # 双引号内变量才展开,单引号原样输出
cur_dir=$(pwd)                   # $() 命令替换(比老旧的反引号写法安全可读)
echo "now at $cur_dir, args: $# first: $1"
exit_code=$?                     # 上一条命令退出码:0 即成功
\`\`\`

\`\`\`output
deploy order-app
now at /opt/app, args: 2 first: dev
\`\`\`

特殊变量速记:==$?== 退出码、==$#== 参数个数、==$1 $2== 位置参数、==$!== 后台进程 PID、==$0== 脚本名。

## 条件判断与循环

\`\`\`shell
if [ -f /opt/app/app.jar ]; then        # 文件测试
  echo "jar exists"
elif [ -d /opt/app/conf ]; then         # 目录测试
  echo "only conf"
else
  echo "nothing found"
fi

[ "$env" = "prod" ] && echo "prod mode" # 字符串比较(等号两边要空格)
[ "$count" -gt 10 ] && echo "too many"  # 数字比较 -gt -lt -eq -ne

for f in /opt/app/logs/*.log; do        # for 遍历通配结果
  echo "$f => $(du -h "$f" | cut -f1)"
done

i=0
while [ $i -lt 3 ]; do                  # while 循环
  echo "retry $i"
  i=$((i+1))                            # 算术展开
done

while read -r line; do                  # 逐行读文件
  echo "line: $line"
done < ip.list
\`\`\`

\`\`\`output
jar exists
/opt/app/logs/app.log => 412M
retry 0
retry 1
retry 2
line: 203.0.113.45
line: 198.51.100.12
\`\`\`

| 测试符 | 含义 | 测试符 | 含义 |
| --- | --- | --- | --- |
| -f | 是普通文件 | -z | 字符串为空 |
| -d | 是目录 | -n | 字符串非空 |
| -e | 路径存在 | -eq / -ne | 数字相等 / 不等 |
| -r | 可读 | -gt / -lt | 数字大于 / 小于 |

==A && B || C== 可以当三目表达式用;数字自增用 ==$((i+1))==,不用老式 expr。

## 函数与脚本骨架

\`\`\`shell
#!/bin/bash
set -e                                  # 任何命令失败立即退出(脚本标配)
set -u                                  # 使用未定义变量直接报错

log() { echo "[$(date '+%F %T')] $*"; } # $* 代表全部参数

health_check() {
  local url=$1                          # local 声明局部变量
  local code
  code=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 3 "$url")
  echo "$code"                          # 返回值用 echo 输出,调用方 $() 接收
}

code=$(health_check http://localhost:8080/actuator/health)
if [ "$code" = "200" ]; then log "UP $code"; else log "DOWN $code"; fi
\`\`\`

\`\`\`output
[2026-11-13 21:00:01] UP 200
\`\`\`

==curl -w %{http_code}== 只取状态码、==-o /dev/null== 丢弃响应体,是健康检查的标准写法。

## 案例一:一键部署脚本

\`\`\`shell deploy.sh
#!/bin/bash
set -e
APP_DIR=/opt/app
JAR_SRC=dist/app-1.0.0.jar

log() { echo "[$(date '+%F %T')] $*"; }

log "1/4 备份旧包"
[ -f $APP_DIR/app.jar ] && cp $APP_DIR/app.jar $APP_DIR/app.jar.bak

log "2/4 停旧进程"
pkill -f "java -jar $APP_DIR/app.jar" || true    # 首次部署无旧进程也不报错
sleep 2

log "3/4 换包启动"
cp $JAR_SRC $APP_DIR/app.jar
nohup java -jar $APP_DIR/app.jar > $APP_DIR/app.out 2>&1 &

log "4/4 健康检查"
sleep 15
for i in 1 2 3; do
  code=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/actuator/health)
  [ "$code" = "200" ] && { log "deploy success"; exit 0; }
  log "not ready ($code), retry $i"
  sleep 10
done
log "deploy failed, check app.out"
exit 1
\`\`\`

\`\`\`output
[2026-11-13 21:00:01] 1/4 备份旧包
[2026-11-13 21:00:01] 2/4 停旧进程
[2026-11-13 21:00:01] 3/4 换包启动
[2026-11-13 21:00:01] 4/4 健康检查
[2026-11-13 21:00:16] deploy success
\`\`\`

工程细节:==pkill -f || true== 容忍首次部署;健康检查**带重试**才不会把"启动慢"误判成失败;失败时 exit 1 让 CI 感知并中止流水线。

## 案例二:日志清理脚本 + crontab

\`\`\`shell clean-logs.sh
#!/bin/bash
LOG_DIR=/opt/app/logs
# 1 天前的原始日志压成 gz,7 天前的压缩包直接删(分级清理)
find $LOG_DIR -name "*.log" -mtime +1 -exec gzip -f {} \\;
find $LOG_DIR -name "*.log.gz" -mtime +7 -delete
echo "$(date '+%F %T') done, $(ls $LOG_DIR | wc -l) files left"
\`\`\`

\`\`\`output
2026-11-13 02:00:01 done, 14 files left
\`\`\`

\`\`\`shell
crontab -e    # 加入一行:每天凌晨 2 点执行
0 2 * * * /opt/app/bin/clean-logs.sh >> /opt/app/logs/clean.log 2>&1
crontab -l    # 查看已配置的任务
\`\`\`

> [!warn] crontab 五个星别记反
> 分 时 日 月 周:==0 2 * * *== 每天 02:00;==*/5 * * * *== 每 5 分钟;==0 2 * * 1== 每周一。crontab 的 PATH 很短,脚本里一律用绝对路径;输出必须重定向,否则每次执行的输出都会堆进邮件队列。

## 案例三:健康检查 + 自动拉起

\`\`\`shell health.sh
#!/bin/bash
URL=http://localhost:8080/actuator/health
SERVICE=app

code=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 3 "$URL")
if [ "$code" = "200" ]; then
  echo "$(date '+%F %T') UP"
  exit 0
fi
echo "$(date '+%F %T') DOWN($code), restarting $SERVICE"
systemctl restart $SERVICE
echo "$(date '+%F %T') restarted" >> /var/log/health-check.log
\`\`\`

\`\`\`output
2026-11-13 03:00:01 DOWN(000), restarting app
2026-11-13 03:00:09 restarted
\`\`\`

code 为 000 表示 curl 根本连不上(超时),恰恰是最需要拉起的状态;配 ==*/1 * * * *== 每分钟一查,与 systemd 的 Restart=always 形成双保险。

> [!tip] 调试脚本三板斧
> ==bash -n script.sh== 只查语法不执行;==bash -x script.sh== 逐行回显执行过程,变量展开一目了然;头部 ==set -e -u== 之外再加 ==set -o pipefail==,让管道中段失败不被最终命令的成功掩盖。面试说"我用 -x 调脚本",工程感立刻拉满。

## 面试速记

- 变量赋值等号两边不能有空格;命令替换用 $();$?/$#/$1/$! 四个特殊变量必背。
- 测试符:-f 文件、-d 目录、-z 空串;字符串比较 = 两边要空格;数字用 -gt/-eq 系列。
- set -e -u 是脚本标配;函数"返回值"用 echo 输出、调用方 $() 接收,而不是 return。
- 部署脚本三要素:旧进程容错(pkill || true)、健康检查重试、失败 exit 1 让 CI 感知。
- crontab 记"分 时 日 月 周",脚本用绝对路径、输出重定向;日志清理用 find -mtime 分级压缩删除。
`
      }
    ],
    interview: [
      { q: '软链接和硬链接的区别?', a: '硬链接与源文件共用**同一个 inode**,是"一个文件的多个名字":不能跨文件系统、不能对目录创建;删除源文件数据仍在,链接数减到 0 才真正释放空间。软链接是独立 inode,内容存的是**目标路径**(快捷方式):可以跨分区、可以链目录,源文件删除后变悬空链接,访问报 No such file。验证手段:ls -li 对比 inode 号。生产应用:nginx sites-enabled、多版本 JDK 切换都是软链接。' },
      { q: 'chmod 755 是什么意思?', a: '九位权限分属主/属组/其他三组,每组 r=4、w=2、x=1 相加:7=rwx 完全控制,5=r-x 读+执行。755 = 属主可读写执行,组和其他人可读可执行**不可写** —— 适合"自己要执行、不想被别人改"的脚本。同类:644 配置文件(自己可写他人只读)、700 私有目录(~/.ssh)、600 私钥文件。追问点:目录的 x 表示可进入(cd),没有 x 即使有 r 也进不去。' },
      { q: '磁盘满了怎么找到大文件?', a: '两层下钻:① ==df -h== 先看哪个挂载点满;② ==du -h --max-depth=1 /var | sort -rh | head== 逐层定位目录,或 ==find / -type f -size +100M 2>/dev/null== 直接搜大文件。经典陷阱:df 显示满但 du 加起来不大 = 有文件被删除但进程仍持有句柄,空间未释放;用 ==lsof | grep deleted== 找到进程,重启进程或对文件做清空(> file)释放。' },
      { q: '怎么统计日志中访问频率最高的 10 个 IP?', a: "管道法:awk '{print $1}' access.log | sort | uniq -c | sort -rn | head -10。数组法(更高效,一次扫描):awk '{ip[$1]++} END {for (i in ip) print ip[i], i}' access.log | sort -rn | head -10。高频追问:为什么先 sort —— **uniq 只折叠相邻重复行**,不 sort 统计出的是碎片;sort -rn 是按数值倒序。变体:统计 4xx 的 Top IP 加模式过滤 awk '$9>=400 {print $1}'。" },
      { q: 'Linux 进程有哪些状态?', a: 'ps 的 STAT 列:**R** 运行/就绪(在运行队列);**S** 可中断睡眠(等事件,大多数进程);**D** 不可中断睡眠(通常在等 IO,kill -9 都杀不掉,出现一堆 D 要查存储);**Z** 僵尸(进程已死、父进程没 wait 收尸,占着 PID;处理:重启父进程让 init 接管);**T** 暂停(SIGSTOP 或调试断点)。top 的 S 列含义相同,zombie 计数就出现在 Tasks 行。' },
      { q: 'top 里 load average 和 CPU 各字段什么含义?', a: 'load average 三个数是最近 **1/5/15 分钟**的平均负载(运行 + 不可中断进程数),持续超过 CPU 核数说明任务在排队。%Cpu(s):**us** 用户态(高 = 应用在算)、**sy** 内核态(高 = 系统调用频繁)、**id** 空闲、**wa** 等待 IO(高 = 磁盘瓶颈)、**st** 被虚拟化层偷走。进程区:VIRT 虚拟内存、RES 常驻物理内存(**看这个**)、SHR 共享内存;%CPU 可超 100%,是多核叠加。' },
      { q: 'kill -9 和 kill -15 的区别?', a: 'kill 默认发 **SIGTERM(15)**:可捕获可忽略,进程能执行清理逻辑后优雅退出(JVM 会跑 shutdown hook 释放资源);**SIGKILL(9)**:内核直接终止,不可捕获不可忽略,可能丢数据、留半成品。规范操作:先 kill -15,等几秒未退再 kill -9。其他常用:SIGTERM 对应 systemctl stop;SIGHUP(1) 用于 nginx -s reload 重载配置;SIGINT(2) 就是 Ctrl+C;SIGSTOP/SIGCONT 暂停与恢复。' },
      { q: '端口被占用怎么排查?', a: '报 Address already in use 时:① ==ss -tlnp | grep 8080==(或 lsof -i :8080)找到监听进程和 pid;② 确认身份:是旧实例就 kill,是别的服务就改自己端口;③ 看不到监听但起不来 = 主动关闭方的 TIME_WAIT 残留,等 60 秒或开启端口复用。延伸:ss 基于 netlink 比 netstat 快,新系统 netstat 已默认移除;ss -ant | awk 统计连接状态分布可发现 TIME_WAIT 突增(短连接风暴)。' },
      { q: 'Linux 下后台运行程序有哪几种方式?', a: '① **&**:放后台,但退出终端收到 SIGHUP 可能被杀;② **nohup cmd &**:免疫 SIGHUP,输出重定向到文件,临时环境够用;③ **screen/tmux**:会话托管,断线重连后继续交互;④ **systemd 服务**(生产标准):Restart=always 崩溃自动拉起、enable 开机自启、journalctl 统一日志;⑤ 容器 -d 部署。高频追问"为什么裸 & 退出终端进程可能死":终端关闭发 SIGHUP,且 stdout 挂断导致写输出失败。' },
      { q: 'awk 怎么取列和统计?NR 和 NF 是什么?', a: "awk 逐行读入按分隔符切列:==$1== 第一列、==$NF== 最后一列、==NF== 当前行列数、==NR== 当前行号(多文件时全局累计,==FNR== 是各文件内行号)。==-F:== 指定分隔符,如取 passwd 的用户名列。统计用关联数组:awk '{ip[$1]++} END {for (i in ip) print i, ip[i]}';==-v== 传外部变量;printf 格式化输出。常见变体:条件过滤($9==500)、行号范围(NR>=10 && NR<=20)、多列拼接输出。" },
      { q: 'scp 和 rsync 有什么区别?', a: '**scp**:SSH 全量复制,简单,适合临时传单文件,无增量、无断点续传。**rsync**:按“大小 + mtime”比对,只传变化文件,传输时按块校验,大目录重复同步快一个量级;==-a== 保留属性,==--partial== 断点续传,==--delete== 镜像删除,==-n== 预演。首次两者接近,第二次起 rsync 明显更快。' },
      { q: '线程被 OOM kill 了,怎么从系统日志确认?', a: '先纠正:OOM killer 杀的是**进程**,进程内线程一起消失,应用不会抛 OutOfMemoryError。确认:==dmesg -T | grep -i "killed process"==;日志被刷掉用 ==journalctl -k | grep -i oom==,崩溃那轮加 ==-b -1==;容器找 Memory cgroup out of memory。再核对 ==-Xmx + 堆外== 是否超 limit。' },
      { q: 'Linux 内核和发行版有什么区别?常见发行版有哪些?', a: '**内核(Kernel)是操作系统的心脏**:负责进程调度、内存管理、文件系统、网络协议栈与驱动,本身不带包管理器和常用命令。**发行版 = 内核 + GNU 工具 + 包管理器 + 软件仓库 + 安装程序**,是能直接使用的整套系统。常见发行版:① **RHEL / CentOS / Rocky / AlmaLinux**,用 yum 或 dnf,企业服务器主流;② **Ubuntu**,基于 Debian,用 apt,云主机与开发环境最常用;③ **Debian**,以稳定著称;④ **Alpine**,用 apk,镜像极小,容器常见。一句话:内核管资源,发行版管交付。' },
      { q: 'SSH 是什么?为什么服务器运维几乎都用命令行而不是图形界面?', a: '**SSH 是加密的远程登录协议**,默认 22 端口:客户端与服务器之间的输入输出都加密传输,支持密码与公钥认证,还能做端口转发和文件传输。**运维偏用命令行的原因**:① **省资源**:图形界面占内存与 CPU,资源应留给业务;② **可远程**:低带宽、高延迟也能用,断线可用 tmux、screen 恢复;③ **可自动化**:命令能写脚本、接入 CI/CD、批量分发到上千台机器;④ **更安全**:少装图形组件就少一批漏洞和端口;⑤ **可审计**:操作有历史记录,可追溯、可复现。一句话:命令行是可编程的操作方式,运维的本质是批量与自动化。' },
      { q: 'vim 常用操作有哪些?线上怎么快速改服务器配置?', a: '三种模式:**Normal**(移动/删除/复制)、**Insert**(i/a/o 进入,Esc 返回)、**Command**(: 开头)。十个救命键:dd 删行、yy 复制行、p 粘贴、u 撤销、gg 到首行、G 到尾行、/keyword 搜索、n/N 下一个/上一个、:wq 保存退出、:q! 强制不保存退出。线上改配置 SOP:先 cp 备份 → vim 打开 → gg 到顶、/ 定位关键行、i 进入插入、改完 Esc → :wq → 用 nginx -t、sshd -t 做语法校验 → reload 而不是 restart。改乱了用 :q! 放弃,别硬存;最小化系统只有 vi,快捷键通用。' },
      { q: '正向代理和反向代理的区别?Nginx 属于哪一种?', a: '**正向代理代表客户端**:浏览器配置代理地址,由代理替客户端访问外部服务,服务端只看到代理 IP;用途是统一出口、访问控制、缓存、科学上网。**反向代理代表服务端**:客户端以为在访问同一个域名,请求到 Nginx 后由它按 upstream 转发到多台后端;用途是负载均衡、隐藏后端拓扑、TLS 终止、静态资源、限流。判断口诀:代理帮谁撒谎 —— 帮客户端是正向,帮服务端是反向。Nginx 默认是反向代理,核心配置 upstream + proxy_pass;它也能配正向代理,但不是主流用法。' }
    ]
  };
})();
