/* ═══════════════════════════════════════════════════════════
   模块:消息队列 MQ(4 章)
   ═══════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  window.CONTENT = window.CONTENT || {};

  window.CONTENT.mq = {
    id: 'mq',
    title: '消息队列 MQ',
    en: 'MESSAGE QUEUE',
    icon: 'layers',
    color: '#fbbf24',
    tagline: '异步解耦削峰背后的可靠投递之道',
    description: '从"为什么用 MQ"的三大价值讲到 RabbitMQ 五种 Exchange、Kafka 分区与 ISR,再到不丢失、幂等、顺序、积压、事务消息五大可靠性难题 —— 每一节都配 Spring Boot 实战代码与面试背诵版。',
    minutes: '≈ 10 小时',
    chapters: [
      /* ─────────────────────────────────────────── */
      {
        id: 'ch01',
        title: '消息队列核心概念与应用场景',
        minutes: 30,
        points: ['解耦/异步/削峰', '队列vs发布订阅', '三大选型', 'MQ的代价'],
        content: `
> [!interview] 面试开场定位
> "为什么用 MQ?"标准答案是三大价值:**解耦、异步、削峰**;高手会立刻补一句代价:"引入 MQ 就要解决**消息丢失、重复消费、顺序性、积压**四个新问题"。价值 + 代价一起说,直接把面试引向你的主场(第 4 章)。

> [!info] 本章导读 · 下单接口为什么能从 600ms 降到 55ms
> 中午高峰的奶茶店,收银台每接一单都要跑去仓库拿杯、去后厨报单、再跑回来找零,三件事串着做,队伍立刻排到门外。系统里的同步调用一模一样:一个下单请求要等库存、积分、短信全部回完才给用户答复,任何一环卡住,整条链路都陪着卡。本章先讲清 MQ 到底替我们挡住了什么,再讲清它带来的新麻烦。
> - 读完本章你将能:画出一条同步下单链路,标出每个环节的耗时与故障点
> - 用解耦、异步、削峰三个词,解释一个真实业务为什么该上 MQ
> - 说出引入 MQ 后新增的四个麻烦,并判断自己的项目是否真的需要它

> [!tip] 日常电脑现场 · 快递驿站与取件码
> 快递不直接送到你手上,而是先进驿站,你收到一条取件码,下班顺路去取,寄件的人和收件的人不用同时在场。点外卖也一样,你下单,商家接单、骑手接单,谁有空谁接,你不需要在电话这头一直等着。MQ 干的就是这个驿站和取件码的活。

## 同步调用的三宗罪:为什么需要 MQ

以最经典的下单链路为例,订单服务要串行调用三个下游:

\`\`\`text
用户请求 ──> 订单服务 ──> 库存服务(150ms)
                     ──> 积分服务(100ms)
                     ──> 短信服务(300ms)
接口总耗时 ≈ 50 + 150 + 100 + 300 = 600ms
任何一环超时或宕机 → 整个下单失败
\`\`\`

\`\`\`java OrderService.java
// 反面教材:同步串联,耦合、慢、脆弱
public String createOrder(Order order) {
    orderMapper.insert(order);                     // 50ms
    inventoryClient.deduct(order.getSkuId());      // 150ms:库存抖动,下单失败
    pointClient.add(order.getUserId(), 100);       // 100ms:积分挂了,也失败
    smsClient.send(order.getPhone(), "下单成功");  // 300ms:最慢却最不重要
    return "ok";
}
\`\`\`

\`\`\`output
压测报告(200 并发):
  avg=601ms  p99=1240ms
  库存服务 502 超时 3 次 → 同步链路整体失败 3 单 ✗
\`\`\`

三宗罪:**耦合**(新增"发优惠券"要改订单代码重新发版)、**慢**(总耗时是各环节之和)、**脆弱**(非核心环节的故障拖垮核心链路)。

## 三大价值:解耦 · 异步 · 削峰

MQ(Message Queue)把"发消息"与"处理消息"拆开,中间用队列做缓冲:

- **解耦**:订单服务只发一条"订单已创建"事件,库存/积分/短信各自订阅。新增下游 = 加一个订阅者,上游零改动。
- **异步**:订单服务发出消息立即返回,响应时间与下游数量解绑,耗时操作全部后台消化。
- **削峰填谷**:秒杀 8000 QPS 洪峰先灌进队列,消费端按自身能力 2000 QPS 匀速消费,队列变"蓄水池",数据库不再被瞬时流量打死。

先点开下面的演示,亲手制造一次流量洪峰,看 MQ 是怎么把尖刺削平的:

\`\`\`demo:mq-peak
\`\`\`

\`\`\`java OrderProducer.java
// MQ 异步版:核心链路只做"落库 + 发消息"
public String createOrder(Order order) {
    orderMapper.insert(order);                            // 50ms
    eventPublisher.publish(new OrderCreatedEvent(order)); // <5ms,只保证消息发出
    return "ok";                                          // 接口耗时 ≈ 55ms
}
\`\`\`

\`\`\`text
洪峰 8000 QPS(持续 10 秒)
   │ ╭──╮
   │ │  │                MQ 队列(蓄水池,峰值堆约 6 万条)
   │─│  │─────────╮   ╭──────────╮
   └─┘  └─────────╰──>│ 消费端   │──> DB 恒定 2000 QPS,约 30 秒消化完
\`\`\`

> [!warn] 削峰不是免费的
> 消费有延迟,用户要"实时看到结果"(如查实时库存)的链路不能全异步;队列堆积过长还会拉大最终一致的时间窗口。==核心链路同步、非核心链路异步==是分界原则,不是无脑全上 MQ。

## 消息模型:点对点 vs 发布订阅

| 维度 | 点对点(Queue 队列模型) | 发布订阅(Pub/Sub) |
| --- | --- | --- |
| 一条消息 | 只被**一个**消费者消费 | 被**所有订阅者**各消费一次 |
| 消费关系 | 组内竞争(负载均衡) | 订阅即广播 |
| 典型实现 | RabbitMQ Queue、RocketMQ 集群模式 | Kafka 消费组、RabbitMQ Exchange |
| 场景 | 订单逐单处理 | 一条订单事件同时驱动库存/积分/短信 |

两大主流产品的模型哲学不同:RabbitMQ 是队列模型,但用 Exchange(交换机)按规则把消息分发到多个队列实现发布订阅(第 2 章);Kafka 只有"主题 + 分区",用**消费组**统一两种模型 —— 同组内点对点,不同组之间发布订阅(第 3 章)。

亲手感受一次消息的发出与接收(60 秒上手 Kafka):

\`\`\`shell
# 终端 1:起一个消费者订阅 topic
kafka-console-consumer.sh --bootstrap-server localhost:9092 --topic order-events
# 终端 2:发一条消息
kafka-console-producer.sh --bootstrap-server localhost:9092 --topic order-events
\`\`\`

\`\`\`output
# 终端 2 输入并回车
>order-1001,CREATED
# 终端 1 几乎同时打印
order-1001,CREATED
\`\`\`

## 选型对比:Kafka · RabbitMQ · RocketMQ

| 维度 | Kafka | RabbitMQ | RocketMQ |
| --- | --- | --- | --- |
| 开发语言 | Scala/Java | Erlang | Java |
| 单机吞吐 | **百万级** | 万级 | 十万级 |
| 消息时效 | ms 级 | μs~ms 级(最快) | ms 级 |
| 事务消息 | 弱(仅单分区) | 不支持 | **支持(半消息+回查)** |
| 延迟消息 | 无原生 | TTL+死信 / 插件 | **原生(固定级别)** |
| 消息回溯 | **支持(offset 重放)** | 不支持 | 支持 |
| 路由灵活性 | 弱(纯流) | **最强(五种 Exchange)** | 中 |
| 典型场景 | 日志采集、大数据流 | 中小系统、复杂路由 | 电商、金融事务 |

> [!tip] 选型记忆钩子
> **要吞吐找 Kafka,要路由灵活找 RabbitMQ,要事务和延迟找 RocketMQ。** 日志与大数据链路无脑 Kafka;业务量不大、需要灵活分发用 RabbitMQ;电商交易与一致性敏感链路 RocketMQ。

> [!best] 面试选型话术
> "订单事件链路我们选了 Kafka:一是日志与业务事件统一平台,消费组机制让 BI、风控同时订阅互不干扰;二是吞吐冗余大。而内部一个需要复杂路由、日消息量几十万的任务分发系统用了 RabbitMQ —— ==选型看消息量级、功能需求与团队运维能力,不看流行度=="。

## 引入 MQ 的四个新问题(第 4 章逐一击破)

MQ 把一次同步调用拆成生产 → Broker → 消费三段,**每段都可能掉链子**,还都是异步:

- **消息丢失**:生产端没发到 Broker、Broker 没落盘、消费者没处理完就 ack,三个断点任一处失守都丢。→ 第 4 章用 confirm/事务消息 + 持久化 + 手动 ack 堵全链路。
- **重复消费**:重试、超时重投、重启都会让消息来第二遍,at-least-once 是物理上限。→ 第 4 章给唯一键、状态机、乐观锁三套幂等方案。
- **顺序性**:为吞吐把消息分散到多分区、多消费者并行,后发可能先到。→ 第 4 章用同 key 同分区 + 串行消费做局部有序。
- **积压**:生产长期快于消费,或一次 Full GC 就堆出几千万条。→ 第 4 章给扩消费者 + 批量提吞吐 + 降级丢弃的处置顺序。

| 问题 | 根因 | 本章解法 |
| --- | --- | --- |
| 丢失 | 生产/存储/消费三段任一断点 | confirm + 持久化 + 手动 ack |
| 重复 | at-least-once,重试必重投 | 唯一键 / 状态机 / 乐观锁 |
| 乱序 | 多分区并行消费 | 同 key 同分区 + 串行消费 |
| 积压 | 消费能力 < 生产能力 | 扩消费者 + 批量 + 降级 |

> [!interview] 面试点
> 四连答:丢失 → 重复 → 顺序 → 积压。收尾补一句"为了不丢要重试,重试必然重复,所以幂等是绕不开的成本"。

## 面试速记

- 为什么用 MQ:解耦(下游增减不动上游)、异步(响应与下游解绑)、削峰(队列当蓄水池)。
- 代价四件套:丢失、重复、顺序、积压,每个都要能展开讲方案。
- 模型两分法:队列(一条消息一个消费者)vs 发布订阅(一条消息广播全部订阅者)。
- 选型口诀:吞吐 Kafka、路由 RabbitMQ、事务延迟 RocketMQ。
- 衔接:RabbitMQ 见第 2 章,Kafka 见第 3 章,可靠性全景见第 4 章。
`
      },
      /* ─────────────────────────────────────────── */
      {
        id: 'ch02',
        title: 'RabbitMQ 实战',
        minutes: 40,
        points: ['五种Exchange', 'Spring AMQP', 'confirm+return', '死信队列', '延迟队列'],
        content: `
> [!interview] 本章面试锚点
> RabbitMQ 四连问:五种 Exchange 区别?confirm 和 return 回调有什么区别?消息什么情况进死信?延迟队列怎么做?本章按"模型 → 代码 → 可靠投递 → 死信 → 延迟"一条线讲完,所有代码 Spring Boot 可直接运行。

> [!info] 本章导读 · 消息发出去之后,到底去了哪儿
> 你在快递 App 上点了已发货,包裹并不会凭空出现,而是先进分拨中心,再按地址分到不同网点。RabbitMQ 就是这样一座分拨中心:生产者只管把消息交给交换机,交换机按规则投进队列,消费者从队列取件。本章把这套分拣流程拆开,顺便回答新手最常问的那句:我明明发了消息,为什么没人收到?
> - 读完本章你将能:用 Spring Boot 跑通一个生产者加消费者的完整收发流程
> - 给五种 Exchange 各配一个路由场景,并预测消息最终落进哪个队列
> - 独立配出死信队列与延迟队列,处理超时未支付的订单

> [!tip] 日常电脑现场 · 按地址分拣的包裹
> 快递到了分拨中心,工作人员看面单上的省市区,把包裹扔进对应的格口,再由不同的车拉走。同一个包裹可能先进省城分拨、再进区县网点,但路线由地址决定,寄件人完全不用管。交换机、队列和路由键,就是这套格口和面单。

## 五种 Exchange:消息先到交换机,再到队列

\`\`\`diagram:d-rabbit-route
\`\`\`

把 Exchange 想成一个**快递分拨中心**:Direct 是按精确地址投递,门牌号一字不差才送;Topic 是按通配符的小区投递,填了片区规则就整片派送;Fanout 是小区全体广播,每家每户都塞一份;Headers 则是翻看包裹面单上的标签再决定送给谁。生产者只管把包裹交给分拨中心,怎么分、分给谁,全由 Binding 这张"派送规则表"说了算。

RabbitMQ 里生产者**从不直接发消息给队列**,而是发给 Exchange,由 Binding(绑定规则)决定路由:

| 类型 | 路由规则 | 典型场景 |
| --- | --- | --- |
| direct | RoutingKey **精确匹配** | 单一任务定向投递 |
| topic | 模式匹配:星号通配一个词、井号通配零或多个词 | 日志按级别/模块分发 |
| fanout | 广播到所有绑定队列,无视 RoutingKey | 配置刷新、缓存失效广播 |
| headers | 按消息 header 匹配(性能差,少用) | 复杂多条件路由 |
| 默认交换机("") | RoutingKey 即队列名,直投 | demo 与简单队列 |

\`\`\`text
Producer ──(rk=order.pay)──> [topic.exchange] ──┬─> queue.pay   ✓ 精确命中
                                                └─> queue.audit ✓ order.# 通配命中
Producer ──(rk=refund.done)──> 无匹配 binding → 消息被直接丢弃 ✗
\`\`\`

## Spring AMQP:声明、发送、消费三板斧

\`\`\`yml application.yml
spring:
  rabbitmq:
    host: localhost                       # 端口 5672、账号密码按环境注入,略
    publisher-confirm-type: correlated   # 异步 confirm,回调带 CorrelationData
    publisher-returns: true              # 路由失败触发 ReturnCallback
    template:
      mandatory: true                    # 路由不到队列必须回调(否则静默丢弃)
    listener:
      simple:
        acknowledge-mode: manual         # 手动 ack(可靠性关键)
        default-requeue-rejected: false  # 异常后不重回队列(转死信)
\`\`\`

\`\`\`java RabbitConfig.java
@Configuration
public class RabbitConfig {
    @Bean
    public DirectExchange orderExchange() {
        return new DirectExchange("order.exchange", true, false); // 持久化交换机
    }
    @Bean
    public Queue orderQueue() {
        return QueueBuilder.durable("order.queue").build();       // 持久化队列
    }
    @Bean
    public Binding orderBinding() {
        return BindingBuilder.bind(orderQueue()).to(orderExchange()).with("order.pay");
    }
}
\`\`\`

\`\`\`java OrderProducer.java
// RabbitTemplate 构造注入,import 略(下一个类给出完整 import)
public void send(OrderCreatedEvent event) {
    // CorrelationData 携带唯一标记,confirm 回调时带回,失败补偿全靠它
    rabbitTemplate.convertAndSend("order.exchange", "order.pay", event,
            new CorrelationData(event.getOrderId()));
}
\`\`\`

\`\`\`java OrderConsumer.java
import com.rabbitmq.client.Channel;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.amqp.support.AmqpHeaders;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.stereotype.Component;
import java.io.IOException;
@Component
public class OrderConsumer {

    @RabbitListener(queues = "order.queue")
    public void onMessage(OrderCreatedEvent event, Channel channel,
                          @Header(AmqpHeaders.DELIVERY_TAG) long tag) throws IOException {
        try {
            handle(event);
            channel.basicAck(tag, false);                  // 处理成功才确认
        } catch (Exception e) {
            channel.basicNack(tag, false, false);          // requeue=false → 转死信
        }
    }
}
\`\`\`

## 可靠投递:confirm 与 return 两个回调

| 回调 | 触发时机 | 回答的问题 |
| --- | --- | --- |
| ConfirmCallback | 消息**到达 Broker**(ack 成功 / nack 失败) | Broker 收到没有? |
| ReturnCallback | 到达 Exchange 但**路由不到任何队列** | 路由成功了吗? |

\`\`\`java RabbitConfirmConfig.java
@Configuration
public class RabbitConfirmConfig {

    // 构造注入 template 后立即注册回调(Spring Boot 推荐写法之一)
    public RabbitConfirmConfig(RabbitTemplate rabbit) {
        // ① confirm:Broker 是否收到消息(异步 ack/nack)
        rabbit.setConfirmCallback((correlation, ack, cause) -> System.out.println(ack
                ? "confirm 到达: " + correlation.getId()
                : "confirm 失败: " + cause + ", 补偿重发"));
        // ② return:交换机收到但路由不到队列
        rabbit.setReturnsCallback(returned ->
            System.err.println("路由失败: replyCode=" + returned.getReplyCode()));
    }
}
\`\`\`

\`\`\`output
confirm 到达: order-1001
路由失败: replyCode=312   # 312=NO_ROUTE,触发告警与重发
\`\`\`

> [!tip] confirm + return 只覆盖生产端一段
> 它们保证的是**生产端 → Broker** 这一段;消息在 Broker 里落盘(交换机/队列/消息三者都要持久化)以及**消费端手动 ack** 才构成完整链路,第 4 章串讲全景。

## 死信队列 DLX:失败消息的收容所

消息进入死信队列(Dead Letter Exchange)的三种条件:

1. 消息被 ==basicNack/basicReject== 且 ==requeue=false==;
2. 消息 TTL 过期(队列级或消息级);
3. 队列长度达到上限(x-max-length,挤出最旧消息)。

\`\`\`java DeadLetterConfig.java
@Configuration
public class DeadLetterConfig {
    @Bean
    public Queue orderQueue() {                      // 业务队列挂上死信交换机
        return QueueBuilder.durable("order.queue")
                .deadLetterExchange("dlx.exchange")
                .deadLetterRoutingKey("dlk.order")
                .build();
    }
    @Bean
    public Queue dlqQueue() {   // 死信收容队列;另需声明 dlx.exchange 并把它绑定到 dlk.order
        return QueueBuilder.durable("order.dlq").build();
    }
}
\`\`\`

\`\`\`java DlqConsumer.java
@RabbitListener(queues = "order.dlq")
public void onDeadLetter(OrderCreatedEvent event) {
    // 消息头 x-death 带着原队列、原路由键与死信原因,排查全靠它
    System.out.println("死信: " + event.getOrderId());
    // 只做:记录入库 + 告警 + 转人工/补偿,绝不再重回业务队列
}
\`\`\`

\`\`\`output
死信: order-1002
\`\`\`

> [!pitfall] 别让死信队列再死信
> DLQ 消费者如果继续 nack 且 DLQ 也绑了 DLX,会形成死信循环。DLQ 的定位是**收容与兜底**,处理失败就落库告警,不要 requeue 回业务队列。

## 延迟队列:订单 30 分钟未支付自动取消

**方案一:TTL + 死信**(零插件依赖):消息先进"等死队列"躺 30 分钟,过期后由死信机制路由到真正的消费队列。

\`\`\`java OrderDelayConfig.java
@Bean
public Queue orderDelayQueue() {
    return QueueBuilder.durable("order.delay.queue")
            .withArgument("x-dead-letter-exchange", "order.exchange") // 过期后投回
            .withArgument("x-dead-letter-routing-key", "order.pay")
            .withArgument("x-message-ttl", 1800000)                   // 30 分钟
            .build();
}
\`\`\`

缺陷:RabbitMQ **只检查队首消息**,队列里各消息 TTL 不同时,前面 60 分钟的会阻塞后面 1 分钟的 —— **队头阻塞**。

**方案二:延迟插件**(推荐):安装 ==rabbitmq_delayed_message_exchange==,交换机类型用 ==x-delayed-message==,每条消息独立延迟:

\`\`\`java DelayedProducer.java
public void sendDelay(OrderCreatedEvent event, int delayMs) {
    rabbitTemplate.convertAndSend("delay.exchange", "order.pay", event, msg -> {
        msg.getMessageProperties().setDelay(delayMs);   // 消息级延迟,互不阻塞
        return msg;
    });
}
\`\`\`

> [!best] 延迟方案选型
> 延迟粒度统一(全是 30 分钟)→ TTL + 死信足够,零依赖;延迟时间各不相同(超时取消、预约提醒混在一起)→ 上延迟插件根治队头阻塞。精度要求极高的定时调度,别用 MQ 硬扛,交给时间轮或调度系统。

## 高可用与特殊队列

经典镜像队列 3.9 起废弃、4.0 移除,仲裁队列(Quorum,基于 Raft)已是 RabbitMQ 高可用的默认答案;惰性、优先级、prefetch 则是消息堆积与消费调优的三件套 —— 新老版本差异能说出来,直接区分背旧资料的人。

### 镜像队列 vs 仲裁队列

| 维度 | 镜像队列(Classic Mirrored) | 仲裁队列(Quorum Queue) |
| --- | --- | --- |
| 复制协议 | 主从广播,无共识算法 | **Raft**:日志复制 + 多数派确认 |
| 一致性 | 异步复制,主挂可能丢未同步消息;网络分区可能脑裂 | 强一致,leader 由 Raft 选举,少数派写不进来 |
| 同步方式 | ha-sync-mode=automatic 全量同步,期间队列阻塞 | append entries 增量复制,落后副本自动追赶 |
| 性能 | 吞吐高、延迟低;但每队列一份全量副本,队列多时吃内存 | 每条消息多一轮多数派落盘,吞吐约低 20%~30% |
| 适用版本 | 2.x~3.x 经典队列;3.9 废弃,4.0 移除 | 3.8 引入,3.12 起官方推荐 |
| 选型 | 老集群存量、可丢的低价值队列 | 订单/支付等不能丢的核心队列 |

\`\`\`java
@Bean
public Queue orderQueue() {                 // 新项目:直接声明仲裁队列
    return QueueBuilder.durable("order.queue")
            .quorum()                       // 类型 quorum:强一致 + 自动选主
            .build();
}
\`\`\`

\`\`\`shell
# 存量老集群的镜像策略(仅维护老集群,新集群不要再用)
rabbitmqctl set_policy ha-all "^order" '{"ha-mode":"all","ha-sync-mode":"automatic"}'
rabbitmqctl list_queues name type messages
\`\`\`

\`\`\`output
name         type    messages
order.queue  quorum  1200
\`\`\`

> [!warn] 仲裁队列的硬限制
> quorum 队列**始终持久化**,不支持 exclusive、auto-delete 与非持久化消息,声明参数不匹配会直接报错;3.x 里也不支持优先级。迁移前先确认业务没用这些特性,别在生产上现场踩。

### 惰性队列 Lazy Queue:用磁盘换内存

默认队列尽量把消息留在内存(只在内存紧张时换出),百万级积压会直接把 Broker 内存打爆。惰性队列在消息入队时就写盘,内存只保留索引:

\`\`\`shell
# 用 policy 动态设置:对 order 开头的队列生效,无需重建队列
rabbitmqctl set_policy lazy-backlog "^order" '{"queue-mode":"lazy"}' --apply-to queues
rabbitmqctl list_queues name mode messages messages_ready
\`\`\`

\`\`\`output
name          mode  messages  messages_ready
order.queue   lazy  1850000   1850000
\`\`\`

185 万条消息若按 1KB 估算约 1.8G,全放内存足以压垮 8G 的 Broker;lazy 模式内存里只剩索引,主进程稳稳的。代价是消费要从磁盘读,吞吐下降、延迟升高 —— 它是**抗积压的止血方案**,不是常态配置。RabbitMQ 3.12 起经典队列 lazy 模式被标记废弃,官方建议用 Quorum 队列(天然以磁盘为主);存量 3.x 集群仍常用它顶积压。

### 优先级队列:VIP 任务插队

\`\`\`java
@Bean
public Queue taskQueue() {
    return QueueBuilder.durable("task.priority.queue")
            .withArgument("x-max-priority", 10)   // 0~9 共 10 档,数字越大越优先
            .build();
}
\`\`\`

\`\`\`java
public void send(String task, int priority) {
    rabbitTemplate.convertAndSend("task.exchange", "task.run", task, msg -> {
        msg.getMessageProperties().setPriority(priority);   // 0~9
        return msg;
    });
}
\`\`\`

\`\`\`output
入队顺序: task-A(prio 1) → task-B(prio 9) → task-C(prio 5)
消费顺序: task-B(9) → task-C(5) → task-A(1)
\`\`\`

> [!pitfall] 优先级只在"有积压"时生效
> 队列空闲时来一条消费一条,顺序仍是到达顺序;只有消息排队时 Broker 才会挑高优先级先投。且优先级队列**不要配惰性模式**(磁盘上按优先级扫描代价极高),档位也别开太大(每档一条内部队列,10 档以上收益递减)。

### push / pull 与 prefetch 预取调优

RabbitMQ 是 **push 模型**:消费端订阅后 Broker 主动推;prefetch(QoS,quality of service)限制"每个消费者最多有多少条未 ack 的消息",是消费端唯一的流控阀门。Spring AMQP 默认 prefetch=250,长耗时任务必须调小,否则一个消费者一次霸占几百条,其他消费者空闲饿死。

\`\`\`yml
spring:
  rabbitmq:
    listener:
      simple:
        prefetch: 1              # 一次只发一条:长耗时/任务不均时最公平
        concurrency: 4           # 初始消费者数
        max-concurrency: 8       # 堆积时自动扩容上限
        acknowledge-mode: manual
\`\`\`

\`\`\`shell
rabbitmqctl list_queues name consumers messages_ready messages_unacknowledged
\`\`\`

\`\`\`output
name          consumers  messages_ready  messages_unacknowledged
order.queue   4          1200            8
\`\`\`

未 ack 数 ≈ prefetch × 消费者数(上面 8 = 2 × 4):这个数字长期贴顶,说明消费能力到极限、该扩容或提速;prefetch 过大导致 unacked 虚高,一旦消费者崩溃,这些消息要等连接断开才重回队列。

> [!tip] push 还是 pull?面试一句话
> RabbitMQ 主推 push(basic.consume),吞吐高、实时性好,靠 prefetch 流控;pull(basic.get)是应用轮询,只在调试或特殊调度时用,空轮询浪费连接。Kafka/RocketMQ 则是 pull 模型,由消费端自己控制拉取节奏(第 3 章)。

## 面试速记

- 五种交换机:direct 精确、topic 模式(星号一词、井号多词)、fanout 广播、headers 少用、默认交换机直投。
- confirm 回答"到没到 Broker",return 回答"路由没路由到队列";可靠投递 = confirm/return + 三件套持久化 + 手动 ack,三段合谋缺一不可。
- 死信三条件:nack/reject 且不重回、TTL 过期、队列超长;DLQ 只做记录补偿,不再重回。
- 延迟队列:TTL + 死信有队头阻塞,消息延迟各不相同就上延迟插件。
`
      },
      /* ─────────────────────────────────────────── */
      {
        id: 'ch03',
        title: 'Kafka 实战',
        minutes: 35,
        points: ['架构与角色', '分区与消费组', '副本与ISR', '分区内有序', 'Spring Kafka'],
        content: `
> [!interview] 本章面试锚点
> Kafka 高频五连:架构与角色?消费组怎么分配分区?ISR 是什么、acks 三档区别?怎么保证顺序?Spring Kafka 怎么写可靠消费?学会本章还能顺带答"Kafka 为什么快"(顺序写 + 零拷贝,见面试速记)。

> [!info] 本章导读 · 为什么 Kafka 能把百万条消息梳理成一条流水线
> 早高峰的收费站,如果每辆车都要停下来登记、盖章、开票,队伍必然堵死;Kafka 的做法更像给每辆车发一张编号票,按车道顺序放行,入口只管往里灌,出口各自凭票号取。它把写日志这件朴素的事做到了极致,吞吐量于是高得不像话。本章从分区、副本讲到消费组,再落到 Spring Kafka 怎么写。
> - 读完本章你将能:在本地起一套 Kafka,用命令行完成发消息与消费验证
> - 说清分区、副本、消费组三者的关系,并指出一条消息会被哪个消费者拿走
> - 为 acks 选一个档位,并说明这个选择在哪种故障下会丢消息

> [!tip] 日常电脑现场 · 多车道高速入口
> 早高峰的高速开了八个入口车道,每辆车拿一张带编号的票,按车道顺序往里走,谁也不挤谁。出口各自按票号取车,互不干扰,一条车道堵了,别的车道照常放行。Kafka 的分区就是这些车道,偏移量就是那张票。

## 架构与角色:一张图记住 Kafka 世界观

\`\`\`diagram:d-kafka-arch
\`\`\`

把 Kafka 想成一座**中央仓库**:每个 Topic 被隔成一排排**编号货架**(Partition),Producer 是理货员,只管往对应货架补货;Consumer Group 像各个采购小组,各取所需地搬货,组内分货架、组间各拿一套。每取走一件就在货架上贴一张"已消费到此"(offset)的标签,下次来接着标签位置继续,不重拿也不漏拿。

\`\`\`text
Producer ──┐                        ┌── Consumer Group A(组内竞争:一条消息组内只消费一次)
Producer ──┼──> Kafka 集群           │
           │    Broker0 / 1 / 2     ├── Consumer Group B(组间广播:每组拿全量)
           │    Topic: order-log    │
           │    ├─ Partition0 [Leader@B0, Follower@B1]
           │    ├─ Partition1 [Leader@B1, Follower@B2]
           │    └─ Partition2 [Leader@B2, Follower@B0]
\`\`\`

| 角色 | 职责 |
| --- | --- |
| Broker | 一个 Kafka 服务节点,集群由多个 Broker 组成 |
| Topic | 消息的逻辑分类,物理上拆成多个 Partition |
| Partition | 分区:顺序追加的日志文件,**并行度与顺序性的最小单位** |
| Replica | 副本:Leader 负责读写,Follower 只拉取同步(高可用) |
| Consumer Group | 消费组:组内竞争、组间广播;offset 按组独立维护 |
| Coordinator | 组协调器:管理组成员、rebalance 与 offset 提交 |

\`\`\`shell
# 创建 3 分区 2 副本的 topic,并查看分布
kafka-topics.sh --create --topic order-log \\
  --partitions 3 --replication-factor 2 \\
  --bootstrap-server localhost:9092
kafka-topics.sh --describe --topic order-log --bootstrap-server localhost:9092
\`\`\`

\`\`\`output
Created topic order-log.
Topic: order-log  PartitionCount: 3  ReplicationFactor: 2
    Topic: order-log  Partition: 0  Leader: 1  Replicas: 1,2  Isr: 1,2
    Topic: order-log  Partition: 1  Leader: 2  Replicas: 2,3  Isr: 2,3
    Topic: order-log  Partition: 2  Leader: 3  Replicas: 3,1  Isr: 3,1
\`\`\`

## 分区与消费组:并行度游戏

三条铁律:

- **一个分区在同一消费组内,同时只能被一个消费者消费** —— 组内竞争的基本盘。
- 消费者数 **>** 分区数 → 多出的消费者闲置(分区数要预留余量规划)。
- 成员变化触发 **rebalance(重平衡)**:分区所有权在组内重新分配。

| 触发 rebalance 的场景 | 例子 |
| --- | --- |
| 消费组成员增减 | 新实例上线、旧实例宕机、心跳超时被踢 |
| 订阅的 Topic 数变化 | 正则订阅匹配到新 topic |
| 分区数变化 | 运维扩容分区 |

rebalance 期间**整组停止消费(类 STOP THE WORLD)**,几分钟的 rebalance 就是生产事故;分区分配策略选 ==CooperativeSticky==(增量式)可只迁移受影响的分区。offset 按 (group, topic, partition) 存在内部 topic ==__consumer_offsets== 里;自动提交每 5 秒一次,**可能丢消息也可能重复**,可靠场景必须手动提交。

> [!tip] 分区数怎么定
> 先估吞吐:目标 TPS ÷ 单消费者处理能力 = 最少分区数,再乘 2~3 倍余量给未来扩容(分区只能加不能减)。记住上限关系:**消费者数 ≤ 分区数**,分区不足时加机器只会闲置。

## 副本与 ISR:数据可靠性的基石

- 每个分区一个 **Leader** 副本处理读写,其余 **Follower** 从 Leader 拉取同步。
- **ISR(In-Sync Replicas)**:与 Leader 保持同步的副本集合(含 Leader 自己);落后超过 ==replica.lag.time.max.ms==(默认 30s)的副本被踢出 ISR。
- 生产者可靠性由 ==acks== 决定:

| acks | 含义 | 丢失风险 | 性能 |
| --- | --- | --- | --- |
| 0 | 发出去就算成功,不等确认 | 最高 | 最快 |
| 1 | Leader 落盘即确认 | Leader 挂且未同步 → 丢 | 中 |
| **all/-1** | **ISR 全部落盘才确认** | 配合 min.insync.replicas 基本不丢 | 最慢 |

真可靠的黄金组合:==acks=all + min.insync.replicas=2 + replication.factor=3==。ISR 收缩到只剩 1 个时写入直接报 ==NotEnoughReplicasException== —— 宁可短暂不可用,不丢数据。再配 ==unclean.leader.election.enable=false== 禁止落后副本竞选 Leader。

> [!warn] acks=all 必须搭配 min.insync.replicas
> ==min.insync.replicas=2== 表示"ISR 至少 2 个才允许写"。若设成 1,acks=all 退化成只等 Leader 确认,形同虚设。**acks=all 搭配 min.insync.replicas>=2 才有意义**,这是高频追问点。

## 顺序性:Kafka 只保证分区内有序

全局无序、分区内 FIFO,保序三板斧:

- 同一业务键的消息发**同一分区**(默认按 key 的 hash 路由);
- 分区内的消息**串行处理**(单线程,或按 key 哈希到固定内存队列再串行);
- 生产端防重试乱序:开启幂等生产者 ==enable.idempotence==(in-flight ≤5 仍有序),或 ==max.in.flight.requests.per.connection=1==。

\`\`\`java OrderedProducer.java
@Service
public class OrderedProducer {

    private final KafkaTemplate<String, String> kafkaTemplate;

    public OrderedProducer(KafkaTemplate<String, String> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
    }

    // 同一订单的全部事件路由到同一分区 → 分区内严格有序
    public void sendOrderEvent(String orderId, String event) {
        kafkaTemplate.send("order-log", orderId, event);   // key = orderId
    }
}
\`\`\`

\`\`\`output
send(order-1001, CREATED) -> partition 2
send(order-1001, PAID)    -> partition 2   # 同 key 同分区,消费侧顺序一致
send(order-1002, CREATED) -> partition 0   # 不同 key 可并行
\`\`\`

## Spring Kafka 实战:可靠的生产与消费

\`\`\`yml application.yml
spring:
  kafka:
    bootstrap-servers: localhost:9092
    producer:
      acks: all
      retries: 3
      properties:
        enable.idempotence: true
        max.in.flight.requests.per.connection: 5
      key-serializer: org.apache.kafka.common.serialization.StringSerializer
      value-serializer: org.springframework.kafka.support.serializer.JsonSerializer
    consumer:
      group-id: order-group
      enable-auto-commit: false              # 关闭自动提交
      auto-offset-reset: earliest
      key-deserializer: org.apache.kafka.common.serialization.StringDeserializer
      value-deserializer: org.springframework.kafka.support.serializer.JsonDeserializer
      properties:
        spring.json.trusted.packages: "*"
    listener:
      ack-mode: manual_immediate             # 调 ack.acknowledge() 立即提交
\`\`\`

\`\`\`java OrderListener.java
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.Acknowledgment;
import org.springframework.stereotype.Component;

@Component
public class OrderListener {

    @KafkaListener(topics = "order-log", groupId = "order-group")
    public void onMessage(ConsumerRecord<String, String> record, Acknowledgment ack) {
        try {
            System.out.println("partition=" + record.partition()
                    + " offset=" + record.offset() + " value=" + record.value());
            handle(record.value());
            ack.acknowledge();                  // 业务成功才提交 offset
        } catch (Exception e) {
            System.err.println("处理失败, 不提交 offset: " + record.offset());
        }
    }
}
\`\`\`

\`\`\`output
partition=2 offset=10500 value={"orderId":"order-1001","status":"PAID"}
partition=2 offset=10501 value={"orderId":"order-1001","status":"SHIPPED"}
partition=0 offset=8800  value={"orderId":"order-1002","status":"CREATED"}
\`\`\`

> [!pitfall] 不 ack 的隐含动作是"重新消费"
> ==manual_immediate== 模式下不调用 acknowledge(),offset 不提交,重新拉取会**再消费这条消息** —— 这正是 at-least-once 的来源,所以业务侧幂等(第 4 章)不是可选项而是必选项。

## 精确一次:EOS 与位点管理

Kafka 的"精确一次"分三层:幂等生产者管**单分区单会话**的重试去重;事务生产者把**多分区写入 + 消费位点**打包成原子操作;位点管理决定消费端是 at-least-once 还是可能丢。三层都答到,才算 EOS(exactly-once semantics)过关。

### 幂等生产者:PID + 分区序列号

开启 ==enable.idempotence=true== 后,Producer 启动时向 Broker 申请 **PID(Producer ID)**,发送的每个批次携带 <PID, 分区, 序列号>;Broker 按 (PID, 分区) 缓存最近 5 个批次的序列号:

- 序号重复(重试导致)→ 直接回成功,**不重复写**;
- 序号跳跃(中间丢批)→ 抛 ==OutOfOrderSequenceException==,防止乱序落盘;
- 序号连续 → 正常追加。

\`\`\`yml
spring:
  kafka:
    producer:
      acks: all
      properties:
        enable.idempotence: true                        # 幂等开关
        max.in.flight.requests.per.connection: 5        # <=5 才保证重试不乱序
\`\`\`

开启幂等后,Kafka 强制要求 ==acks=all==、==retries>0==、==max.in.flight<=5==,配错会直接抛 ConfigException。但它的边界很硬:① 只保证**单个分区**;② 只保证**单会话**,Producer 重启换新 PID,认不出上个会话的重复。跨分区、跨重启的重复,要靠事务或业务幂等。

### 事务生产者:consume-transform-produce

事务把"写多个分区 + 提交消费位点"变成一个原子单元。核心 API 四步:**initTransactions → beginTransaction → send/sendOffsetsToTransaction → commitTransaction / abortTransaction**。==transactional.id== 必须全局唯一且稳定,重启后用同一个 id 初始化,Broker 会 fence(隔离)掉旧实例,防止僵尸生产者双写。

\`\`\`java ExactlyOnceWorker.java
import org.apache.kafka.clients.consumer.*;
import org.apache.kafka.clients.producer.*;
import org.apache.kafka.common.TopicPartition;
import java.time.Duration;
import java.util.*;

public class ExactlyOnceWorker {
    public static void main(String[] args) {
        Properties pp = new Properties();
        pp.put("bootstrap.servers", "localhost:9092");
        pp.put("transactional.id", "order-etl-1");       // 稳定唯一,重启复用
        pp.put("key.serializer", "org.apache.kafka.common.serialization.StringSerializer");
        pp.put("value.serializer", "org.apache.kafka.common.serialization.StringSerializer");
        KafkaProducer<String, String> producer = new KafkaProducer<>(pp);
        producer.initTransactions();                      // ① 注册事务 id,隔离旧实例

        Properties cp = new Properties();
        cp.put("bootstrap.servers", "localhost:9092");
        cp.put("group.id", "etl-group");
        cp.put("enable.auto.commit", "false");            // ② 位点交给事务管
        cp.put("auto.offset.reset", "earliest");
        cp.put("key.deserializer", "org.apache.kafka.common.serialization.StringDeserializer");
        cp.put("value.deserializer", "org.apache.kafka.common.serialization.StringDeserializer");
        KafkaConsumer<String, String> consumer = new KafkaConsumer<>(cp);
        consumer.subscribe(List.of("order-raw"));

        while (true) {
            ConsumerRecords<String, String> records = consumer.poll(Duration.ofMillis(500));
            if (records.isEmpty()) continue;
            producer.beginTransaction();                  // ③ 开事务
            try {
                for (ConsumerRecord<String, String> r : records) {
                    producer.send(new ProducerRecord<>("order-clean", r.key(), r.value().trim()));
                }
                Map<TopicPartition, OffsetAndMetadata> offsets = new HashMap<>();
                for (TopicPartition tp : records.partitions()) {
                    List<ConsumerRecord<String, String>> list = records.records(tp);
                    offsets.put(tp, new OffsetAndMetadata(list.get(list.size() - 1).offset() + 1));
                }
                producer.sendOffsetsToTransaction(offsets, consumer.groupMetadata());  // ④ 位点入事务
                producer.commitTransaction();             // ⑤ 消息与位点原子生效
            } catch (Exception e) {
                producer.abortTransaction();              // ⑥ 整体回滚,位点不前进
            }
        }
    }
}
\`\`\`

\`\`\`output
[tx-1] poll 3 条 → 写入 order-clean 3 条 + 位点提交至 10501/8801 → commit ✓
[tx-2] 转换异常 → abort:order-clean 无新记录,位点仍停在 10501/8801
[tx-2 重放] 成功 → 下游恰好看到每条一次,不重不漏
\`\`\`

> [!warn] 事务的两个坑
> ① 事务有超时(transaction.timeout.ms 默认 60s),超时 Broker 自动 abort,**事务内不要做 RPC、大批量计算**;② 事务只覆盖 Kafka 内的读写,若下游是数据库,send 与 DB 写入仍无法原子 —— 跨系统只能靠本地消息表/Outbox 或业务幂等。

### 位点管理:自动提交 vs commitSync / commitAsync

自动提交的致命细节:提交发生在 **poll 时**,提交的是"上一批拉取的位点",不是"处理完的位点" —— 先提交后处理,崩溃就丢;处理完还没到提交间隔就崩,就重复。

\`\`\`java OffsetCommitDemo.java
import org.apache.kafka.clients.consumer.*;
import java.time.Duration;
import java.util.Collections;
import java.util.Properties;

public class OffsetCommitDemo {
    public static void main(String[] args) {
        Properties p = new Properties();
        p.put("bootstrap.servers", "localhost:9092");
        p.put("group.id", "order-group");
        p.put("enable.auto.commit", "false");           // 手动提交的前提
        p.put("key.deserializer", "org.apache.kafka.common.serialization.StringDeserializer");
        p.put("value.deserializer", "org.apache.kafka.common.serialization.StringDeserializer");
        KafkaConsumer<String, String> consumer = new KafkaConsumer<>(p);
        consumer.subscribe(Collections.singletonList("order-log"));

        while (true) {
            ConsumerRecords<String, String> records = consumer.poll(Duration.ofMillis(500));
            for (ConsumerRecord<String, String> r : records) {
                handle(r);                                // 业务成功后才允许提交
            }
            consumer.commitAsync((offsets, e) -> {        // 正常路径:异步提吞吐
                if (e != null) System.err.println("提交失败,下次重试: " + e.getMessage());
            });
        }
    }
    static void handle(ConsumerRecord<String, String> r) { /* 业务处理 */ }
}
\`\`\`

\`\`\`output
poll 100 条 → 处理 180ms → commitAsync offset=10500 ✓
poll 100 条 → 第 37 条抛异常 → 不提交 → 重启后从 10501 重放(重复 37 条)
\`\`\`

| 提交方式 | 提交时机 | 崩溃后果 | 语义 |
| --- | --- | --- | --- |
| 自动提交(默认) | poll 时每 5s | 已提交未处理 → **丢**;已处理未提交 → 重复 | at-most-once 倾向 |
| commitSync | 处理成功后同步提交 | 提交前崩溃 → 重复,不丢 | at-least-once |
| commitAsync | 处理成功后异步提交 | 同 sync,但失败可能没感知 | at-least-once(需兜底) |
| 事务位点 | 与下游写入同一事务 | 位点与消息同生共死 | exactly-once(单流) |

最佳实践:正常循环用 commitAsync(不阻塞),在 ==finally== 关闭消费者、再均衡回调里用 commitSync 兜底;不要"async 提交小位点 + sync 提交大位点"混用,否则位点可能回退导致重复。

### HW 与 LEO:消费者只能读到高水位之前

\`\`\`text
Partition0 三副本:
  Leader    LEO=10501  ─────────────┐  已写入但尚未被所有 ISR 确认
            HW =10480  ─────┐        │
  Follower  LEO=10480  ─────┴────────┘
消费者可见范围:offset < HW(0 ~ 10479)
\`\`\`

- **LEO(Log End Offset)**:每个副本自己的"下一条待写位置",各副本可能不同。
- **HW(High Watermark)**:ISR 中所有副本 LEO 的**最小值**,即"已被多数副本确认"的边界;消费者只能读到 HW 之前,保证读到的数据不会因 leader 切换而消失。
- **Leader Epoch**:每次 leader 变更 epoch+1,副本记录 (epoch, startOffset);新 leader 用它校正截断点,避免旧 leader 的 HW 滞后把已同步数据误截断 —— 0.11 引入,专治副本间日志分叉。

\`\`\`shell
kafka-consumer-groups.sh --describe --group etl-group --bootstrap-server localhost:9092
\`\`\`

\`\`\`output
GROUP      TOPIC      PARTITION  CURRENT-OFFSET  LOG-END-OFFSET  LAG
etl-group  order-raw  0          10480           10501           21
\`\`\`

LAG = LEO - 已提交位点(21 条);注意日志尾部可能有 21 条已写入未到 HW 的消息,实际能消费的比 LAG 更少 —— 这也是"lag 为 0 但消费者没读到最新消息"的原因。

### 零拷贝:sendfile(Kafka)vs mmap(RocketMQ)

| 维度 | sendfile(Kafka 消费) | mmap(RocketMQ CommitLog) |
| --- | --- | --- |
| 数据路径 | 页缓存 → 网卡,DMA gather 直接发送 | 文件映射进用户地址空间,用户态直接读写页缓存 |
| CPU 拷贝 | **0 次**(仅 2 次 DMA) | 省去内核到用户的拷贝,读写都在映射区 |
| 上下文切换 | 2 次 | mmap 建立后读写无切换 |
| 适用 | 纯转发:文件 → socket | 需要读写内容:顺序写 + 随机读 |
| Java API | FileChannel.transferTo | FileChannel.map(MappedByteBuffer) |
| 局限 | 数据不能被修改 | 大文件页表开销、写回时机不可控 |

传统 read + write 要 4 次拷贝(2 次 DMA + 2 次 CPU)、4 次上下文切换;Kafka 消费端用 transferTo 走 sendfile,数据从页缓存直达网卡,只剩 2 次 DMA。RocketMQ 用 mmap,是因为它还要**写** CommitLog(顺序写)与读消息内容,mmap 让读写都命中页缓存。==零拷贝不是不拷贝,而是消除 CPU 参与的那次缓冲区拷贝。==

> [!tip] EOS 一句话背诵
> 幂等生产者 = 单分区单会话去重(配置即得);事务生产者 = 跨分区 + 位点原子提交(代码控制);真正端到端 EOS 还要求下游支持事务或幂等。**Kafka 只能保证 Kafka 内部,出了 Kafka 边界,业务幂等永远兜底。**

## 面试速记

- 角色链:Topic 拆 Partition,Partition 多副本,Leader 读写 Follower 同步;消费组组内竞争、组间广播。
- 消费者数超过分区数会闲置;rebalance 全组停止消费,用 CooperativeSticky 增量分配缓解。
- ISR = 与 Leader 同步的副本集合;acks=all + min.insync.replicas=2 + 3 副本才是真可靠。
- 顺序 = 同 key 同分区 + 分区内串行消费 + 幂等生产者防重试乱序。
- Kafka 快:磁盘顺序写、页缓存、零拷贝 sendfile、批量压缩,四大件。
`
      },
      /* ─────────────────────────────────────────── */
      {
        id: 'ch04',
        title: '消息可靠性架构设计',
        minutes: 40,
        points: ['三段不丢', '幂等消费', '顺序消费', '积压处理', '事务消息'],
        content: `
> [!interview] 本章面试锚点
> "怎么保证消息不丢失?"是 MQ 面试头号大题。标准框架:**生产端、Broker、消费端三段各给方案 → 再补一句"重复不可避免,业务幂等兜底"**。本章按这条主线讲完,再加顺序消费、积压处理、事务消息三个衍生大题。

> [!info] 本章导读 · 消息在半路蒸发了,该找谁负责
> 快递丢了,你得先弄清是商家没发、分拨中心漏扫、还是快递员放错了柜子,三段各查一遍才能定位。消息可靠性同理:生产端、Broker、消费端三段各有各的漏洞,只答一句开了确认机制远远不够。本章按这三段逐层加固,最后补上重复消费的兜底方案。
> - 读完本章你将能:给生产、存储、消费三段各写一种防丢配置,并说明它挡住了哪种故障
> - 用一张表判断消息重复、乱序、积压分别该在哪一层解决
> - 设计一个幂等消费方案,让同一条消息处理十次结果也不变

> [!tip] 日常电脑现场 · 快递丢件怎么查
> 快递显示已签收,你却翻遍门口没找到,或者同一个包裹被送了两趟,这两件事的处理方式完全不同。前者要一段一段查:商家发没发、分拨漏没漏扫、快递员放错柜子没有;后者只要保证再送一次结果一样。消息队列的可靠性也就这两道题:别丢,别重复生效。

## 全链路视角:消息只可能丢在三段

一条消息从生产者到消费者,只可能丢在三个位置,逐段对照排查才叫"保证可靠":

| 环节 | 可能丢的原因 | 兜底手段 |
| --- | --- | --- |
| 生产者 → Broker | 发送成功但未落盘、网络超时 | confirm 回调 + 失败重试 + 本地消息表 |
| Broker 内部 | 未持久化、主从异步复制丢数据 | 消息持久化 + 同步复制/仲裁队列 + 刷盘策略 |
| Broker → 消费者 | 先 ack 后处理、处理异常未重试 | 手动 ack + 消费重试 + 死信队列 |

所以回答"如何保证消息不丢",不是一句"持久化"就完了,而是**三段分别给手段**;紧接着补一句"消费端还要做幂等,因为重试必然带来重复"——不丢与不重,是一对必须一起回答的问题。

## 生产端不丢:同步确认 + 失败重试 + 兜底记录

\`\`\`java ReliableProducer.java
// kafka 与 failureLog 均由构造注入,import 与字段声明略
public void send(String topic, String key, String value) {
    kafka.send(topic, key, value).whenComplete((result, ex) -> {
        if (ex != null) {
            // 拿不到确认就落库,定时任务补偿重发(终极兜底)
            failureLog.save(topic, key, value, ex.getMessage());
        }
    });
}
\`\`\`

三道防线:① ==acks=all / RabbitMQ confirm== 拿到确定回执;② ==retries== 自动重试;③ 重试耗尽仍失败 → **失败表 + 定时补偿**。面试官听到"发送失败落库补偿"就知道你真做过生产级设计。

## Broker 不丢:刷盘与复制,都要"同步"才算数

| 策略 | 异步(默认,快) | 同步(不丢,慢) |
| --- | --- | --- |
| 刷盘(RocketMQ flushDiskType) | 写 page cache 即返回,宕机丢页 | ==SYNC_FLUSH== 落盘才返回 |
| 复制(RocketMQ brokerRole) | ==ASYNC_MASTER== 异步复制 | ==SYNC_MASTER== 副本写入才返回 |

- **RocketMQ 金融级**:同步刷盘 + 同步复制,单条延迟上升换不丢。
- **Kafka 思路不同**:不强制刷盘(信任页缓存与多副本),靠 ==acks=all + min.insync.replicas=2 + 3 副本==,一台宕机数据还在其他两台上。
- **RabbitMQ**:交换机、队列、消息**三者都要持久化** + 消费端手动 ack,缺一不可。

## 消费端不丢:关闭自动提交,处理完再确认

\`\`\`java ManualAckConsumer.java
// RabbitMQ:成功 basicAck,失败 basicNack 转死信(不重回队列)
@RabbitListener(queues = "order.queue")
public void onMessage(OrderEvent event, Channel channel,
                      @Header(AmqpHeaders.DELIVERY_TAG) long tag) throws IOException {
    try {
        handle(event);
        channel.basicAck(tag, false);
    } catch (Exception e) {
        channel.basicNack(tag, false, false);   // requeue=false → 死信人工处理
    }
}
\`\`\`

> [!danger] 自动提交丢消息的经典现场
> Kafka ==enable.auto.commit=true==(默认)时,拉取后每 5 秒自动提交 offset;若提交后、处理完成前进程崩溃 → **offset 已提交但业务没做完 = 丢消息**。可靠性场景一律 ==enable-auto-commit: false== + 手动 ack。

## 幂等消费:重复不可避免,业务必须防重

为什么必然重复?生产端重试、at-least-once 语义、rebalance 后 offset 未提交重新拉取。**与其追求不重复,不如让重复无害。**

| 方案 | 做法 | 适用 |
| --- | --- | --- |
| 数据库唯一约束 | 业务单号唯一索引,重复插入报错 | 插入类(订单、流水) |
| 去重表 | 消费前按 msgId 插判重表(同事务) | 通用,强一致 |
| Redis SETNX | ==set msgId 1 NX EX 86400== 成功才处理 | 高并发,允许极小概率穿透 |
| 状态机 | ==update ... where status='INIT'== 改不动即重复 | 单据流转 |
| 乐观锁版本号 | ==update ... set v=v+1 where v=n== | 更新类 |

\`\`\`java IdempotentConsumer.java
@Component
public class IdempotentConsumer {

    private final StringRedisTemplate redis;
    private final OrderService orderService;

    public IdempotentConsumer(StringRedisTemplate redis, OrderService orderService) {
        this.redis = redis;
        this.orderService = orderService;
    }

    @KafkaListener(topics = "order-log", groupId = "order-group")
    public void onMessage(ConsumerRecord<String, String> record, Acknowledgment ack) {
        String msgId = record.key() + ":" + record.offset();
        Boolean first = redis.opsForValue()
                .setIfAbsent("dedup:" + msgId, "1", java.time.Duration.ofHours(24));
        if (Boolean.FALSE.equals(first)) {
            ack.acknowledge();                     // 重复消息,直接确认跳过
            return;
        }
        try {
            orderService.handle(record.value());   // 真正业务
            ack.acknowledge();
        } catch (Exception e) {
            redis.delete("dedup:" + msgId);        // 失败删标记,允许下次重试
        }
    }
}
\`\`\`

\`\`\`output
首次消费 order-1003: 处理成功, ack
rebalance 重拉 order-1003: 命中去重标记, 直接 ack 跳过
\`\`\`

> [!tip] 强一致场景把判重放进数据库事务
> Redis 判重与业务落库是两个动作,极端情况(处理成功但 offset 未提交即崩溃)仍可能重复。金额类操作把 ==msgId 唯一索引==与业务写在**同一个数据库事务**里,一劳永逸。

## 顺序消费:分区有序 + 单线程 + 失败不跳过

- **Kafka**:同 key 同分区(第 3 章)+ 每分区单线程串行处理;失败不能跳过(跳过即破坏顺序),阻塞重试该分区。
- **RocketMQ**:==ConsumeMode.ORDERLY==,队列加锁 + 单线程,失败挂起重试。
- **RabbitMQ**:单队列单消费者,或按业务键串行。

\`\`\`java OrderedListener.java
@KafkaListener(topics = "order-log", groupId = "order-group",
               concurrency = "3", properties = {"max.poll.records=1"})  // 并发数 = 分区数,分区内天然串行
public void onMessage(ConsumerRecord<String, String> record, Acknowledgment ack) {
    orderService.handleInOrder(record.key(), record.value());  // 同 key 串行
    ack.acknowledge();
}
\`\`\`

## 消息积压:急救 SOP

\`\`\`shell
# 第一步:看 lag(积压量),确定严重程度
kafka-consumer-groups.sh --describe --group order-group \\
  --bootstrap-server localhost:9092
\`\`\`

\`\`\`output
GROUP        TOPIC      PARTITION  CURRENT-OFFSET  LOG-END-OFFSET  LAG
order-group  order-log  0          10500           980000          969500
order-group  order-log  1          99000           975000          876000
order-group  order-log  2          100000          970000          870000
\`\`\`

四步急救,按序执行:

1. **定位根因**:消费端慢 SQL、外部接口超时、GC 停顿?看消费耗时与错误日志 —— 不修根因,扩容也是白扩。
2. **紧急扩容**:消费者扩到 ==分区数== 上限;分区不够 → **临时方案**:建 10 倍分区的临时 topic,写一个"只搬运不处理"的消费者把积压转投,再起 10 倍消费者并行消费临时 topic。
3. **消费侧提速**:批量拉取(max.poll.records 调大)、耗时操作异步化、非核心逻辑降级跳过。
4. **极端兜底**:可丢弃场景(推送类)重置 offset 跳过旧消息事后补偿;交易类绝不能丢,必须走第 2 步。

> [!warn] 积压的连锁反应
> 积压 → 消息超时被 Broker 丢弃(RabbitMQ TTL)或触发 rebalance(max.poll.interval.ms 超时,消费者被踢出组)→ 雪上加霜。处理积压时同步调大 ==max.poll.interval.ms==。

## 事务消息:先本地事务,还是先发消息?

场景:下单要"落订单库 + 发扣库存消息",两步必须同生共死。

**方案一:本地消息表**(任何 MQ 都能做,通用答案):

\`\`\`java LocalMessageTable.java
@Service
public class OrderTxService {
    @Transactional                                        // 业务与消息记录同库同事务
    public void createOrder(Order order) {
        orderMapper.insert(order);
        localMessageMapper.insert(new LocalMessage(order.getId(), "ORDER_CREATED",
                JSON.toJSONBytes(order), "PENDING"));     // 不直接发 MQ,先落"待发送"
    }
    @Scheduled(fixedDelay = 5000)                          // 定时补偿
    public void flushPendingMessages() {
        for (LocalMessage msg : localMessageMapper.selectPending()) {
            kafka.send("order-log", msg.getBusinessKey(), new String(msg.getPayload()))
                 .whenComplete((r, ex) -> {
                     if (ex == null) localMessageMapper.markSent(msg.getId()); // 成功才标完成
                 });
        }
    }
}
\`\`\`

**方案二:RocketMQ 事务消息**(半消息 + 回查):

\`\`\`text
1. 生产者发 half 消息(Broker 落盘,对消费者不可见)
2. 生产者执行本地事务(落订单库)
3. 按本地事务结果 commit(消息可见)/ rollback(删除半消息)
4. Broker 没等到第 3 步 → 定时回查"本地事务成功吗?" → 按回查结果裁决
\`\`\`

> [!best] 两方案怎么选
> 本地消息表:零 MQ 依赖、逻辑直观,代价是多一张表 + 定时任务;RocketMQ 事务消息:框架代劳补偿,代价是绑死 RocketMQ。==面试先讲本地消息表(通用),再补 RocketMQ 半消息(加分)==,收尾补一句"消息侧只保证最终一致,消费失败仍要重试 + 幂等"。

## RocketMQ 架构与事务消息全解

RocketMQ 的面试分水岭在细节:NameServer 为什么不要 ZooKeeper、顺序消息的队列锁怎么加、18 个延迟级别怎么背、事务消息回查怎么写 —— 这一节按"架构 → 顺序 → 延迟 → 事务 → 重试死信"一次讲透。

### 架构:NameServer 无状态路由 + Broker 复制

\`\`\`text
Producer ──① 取路由──> NameServer 集群(无状态、节点互不通信,各存全量路由)
Broker   ──② 每 30s 心跳注册 Topic/队列──> 所有 NameServer
Consumer ──③ 取路由──> NameServer ──④ 直连 Broker 拉消息/上报位点
\`\`\`

| 维度 | RocketMQ NameServer | ZooKeeper(Kafka 旧架构 / RocketMQ 3.x 前) |
| --- | --- | --- |
| 定位 | 轻量路由注册中心,AP 设计 | 分布式协调,CP(ZAB 强一致) |
| 节点关系 | **互不通信**,各存一份全量路由 | 选举 + 数据同步,有 leader |
| 容灾 | 单节点挂换一个即可,不影响整体 | 过半节点不可用则集群瘫痪 |
| 一致性 | 最终一致(心跳有延迟) | 强一致 |
| 运维成本 | 极低,无状态水平扩展 | 需专职维护 ZK 集群 |
| 趋势 | RocketMQ 自带,不依赖外部组件 | Kafka 也在用 KRaft 去掉 ZK |

Broker 高可用三种形态:

| 部署形态 | 写入确认 | 故障切换 | 数据风险 | 典型场景 |
| --- | --- | --- | --- | --- |
| 异步复制 ASYNC_MASTER | Master 落盘即返回 | 不支持自动切主(4.5 前) | 主挂丢未同步消息 | 普通业务,默认 |
| 同步复制 SYNC_MASTER | Master + Slave 都成功才返回 | 同上 | 基本不丢 | 金融、支付 |
| DLedger(Raft) | 多数派副本落盘 | **自动选主**,秒级恢复 | 不丢 | 核心交易链路 |

> [!tip] DLedger 的本质
> DLedger 把 CommitLog 的复制交给 Raft:3 副本多数派确认才返回,Leader 挂由 Raft 自动选举新 Leader,不用人工切主。代价是每次写入多一轮网络往返,吞吐略降 —— **用一致性换可用性**,和 Kafka 的 ISR + acks=all 是同一思路。

### 顺序消息:同 key 同队列 + 队列加锁串行

RocketMQ 只保证**队列内**有序:同一订单的消息用 ==MessageQueueSelector== 投到同一队列,消费端用 ==ConsumeMode.ORDERLY== 对队列加锁、串行消费;不同队列之间并行。

\`\`\`java OrderedProducer.java
import org.apache.rocketmq.client.producer.DefaultMQProducer;
import org.apache.rocketmq.client.producer.MessageQueueSelector;
import org.apache.rocketmq.common.message.Message;
import org.apache.rocketmq.common.message.MessageQueue;
import java.nio.charset.StandardCharsets;
import java.util.List;

public class OrderedProducer {
    public static void main(String[] args) throws Exception {
        DefaultMQProducer producer = new DefaultMQProducer("order-producer-group");
        producer.setNamesrvAddr("localhost:9876");
        producer.start();

        for (String event : List.of("CREATED", "PAID", "SHIPPED")) {
            Message msg = new Message("OrderTopic", event,
                    ("order-1001:" + event).getBytes(StandardCharsets.UTF_8));
            producer.send(msg, new MessageQueueSelector() {
                public MessageQueue select(List<MessageQueue> mqs, Message m, Object arg) {
                    return mqs.get(Math.abs(arg.hashCode()) % mqs.size());   // 同 key 同队列
                }
            }, "order-1001");
        }
        producer.shutdown();
    }
}
\`\`\`

\`\`\`java OrderedConsumer.java
import org.apache.rocketmq.client.consumer.DefaultMQPushConsumer;
import org.apache.rocketmq.client.consumer.listener.ConsumeOrderlyStatus;
import org.apache.rocketmq.client.consumer.listener.MessageListenerOrderly;
import org.apache.rocketmq.common.message.MessageExt;

public class OrderedConsumer {
    public static void main(String[] args) throws Exception {
        DefaultMQPushConsumer consumer = new DefaultMQPushConsumer("order-consumer-group");
        consumer.setNamesrvAddr("localhost:9876");
        consumer.subscribe("OrderTopic", "*");
        consumer.registerMessageListener((MessageListenerOrderly) (msgs, ctx) -> {
            for (MessageExt m : msgs) {
                System.out.println(ctx.getMessageQueue().getQueueId() + " "
                        + new String(m.getBody()));
            }
            return ConsumeOrderlyStatus.SUCCESS;   // 失败返回 SUSPEND_CURRENT_QUEUE_A_MOMENT
        });
        consumer.start();
    }
}
\`\`\`

\`\`\`output
queue=2 order-1001:CREATED
queue=2 order-1001:PAID
queue=2 order-1001:SHIPPED
\`\`\`

> [!warn] 顺序消费失败不能跳过
> 返回 ==SUSPEND_CURRENT_QUEUE_A_MOMENT== 会让当前队列挂起、按间隔重试(默认 2s,可调 suspendCurrentQueueTimeMillis),**其他队列不受影响**。跳过即乱序,所以顺序队列的一个毒消息会阻塞整条队列 —— 消费逻辑必须做异常隔离与超时控制,必要时人工介入。

### 延迟消息:18 个固定级别

RocketMQ 4.x 只支持固定延迟级别(==delayTimeLevel== 1~18,0 表示不延迟):

| level | 延迟 | level | 延迟 | level | 延迟 |
| --- | --- | --- | --- | --- | --- |
| 1 | 1s | 7 | 3m | 13 | 9m |
| 2 | 5s | 8 | 4m | 14 | 10m |
| 3 | 10s | 9 | 5m | 15 | 20m |
| 4 | 30s | 10 | 6m | 16 | 30m |
| 5 | 1m | 11 | 7m | 17 | 1h |
| 6 | 2m | 12 | 8m | 18 | 2h |

原理:生产者发延迟消息时,Broker 把 topic 改为内部主题 ==SCHEDULE_TOPIC_XXXX==、queueId = delayLevel - 1 写入;ScheduleMessageService 为每个级别起一个定时任务,扫描到期消息后**恢复原 topic 与原 queueId** 再投递。所以延迟精度取决于定时器扫描周期(默认 1s),不是精确定时器。

\`\`\`java
Message msg = new Message("OrderTopic", "ORDER_CANCEL_CHECK",
        "order-1001".getBytes(StandardCharsets.UTF_8));
msg.setDelayTimeLevel(16);          // 30 分钟后投递(取消未支付订单)
producer.send(msg);
\`\`\`

\`\`\`output
[15:00:00] 下单 order-1001,设置延迟级别 16(30m)
[15:30:00] 消费者收到 ORDER_CANCEL_CHECK:order-1001,校验支付状态
\`\`\`

> [!tip] 5.x 的任意时间延迟
> RocketMQ 5.x 支持 ==setDeliveryTimestamp== 任意时间(定时消息),不再受 18 档限制;4.x 若需要"17 分钟"这种非标准值,只能选择就近级别或用外部调度。面试回答:4.x 固定 18 级、5.x 任意时间,内部靠定时任务扫描 + 重新投递。

### 事务消息:half message + 回查

\`\`\`text
Producer                          Broker                           Consumer
   │ ① send half message ─────────>│ 写入 RMQ_SYS_TRANS_HALF_TOPIC
   │<── half 发送成功 ─────────────│ (消费者不可见)
   │ ② 执行本地事务(落订单库)      │
   │ ③ commit / rollback ─────────>│ commit:恢复真实 Topic,消息可见
   │                               │ rollback:删除半消息
   │ ④ 若 Broker 迟迟没收到 ③      │
   │<── 定时回查(默认 60s)─────────│ 调用 checkLocalTransaction
   │ ⑤ 返回 COMMIT / ROLLBACK / UNKNOW
   │                               │ UNKNOW 下次再查,默认最多 15 次
\`\`\`

\`\`\`java TxProducer.java
import org.apache.rocketmq.client.producer.TransactionMQProducer;
import org.apache.rocketmq.common.message.Message;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.Executors;

public class TxProducer {
    public static void main(String[] args) throws Exception {
        TransactionMQProducer producer = new TransactionMQProducer("tx-order-group");
        producer.setNamesrvAddr("localhost:9876");
        producer.setExecutorService(Executors.newFixedThreadPool(4));  // 回查线程池
        producer.setTransactionListener(new OrderTxListener());
        producer.start();

        Message msg = new Message("OrderTopic", "ORDER_CREATED",
                "order-1001".getBytes(StandardCharsets.UTF_8));
        // 内部流程:发 half → 回调 executeLocalTransaction → 按结果 commit/rollback
        producer.sendMessageInTransaction(msg, "order-1001");
        producer.shutdown();
    }
}
\`\`\`

\`\`\`java OrderTxListener.java
import org.apache.rocketmq.client.producer.LocalTransactionState;
import org.apache.rocketmq.client.producer.TransactionListener;
import org.apache.rocketmq.common.message.Message;
import org.apache.rocketmq.common.message.MessageExt;

public class OrderTxListener implements TransactionListener {
    // ② 半消息落盘后执行本地事务,返回值决定 commit 还是 rollback
    public LocalTransactionState executeLocalTransaction(Message msg, Object arg) {
        try {
            orderMapper.insert(new Order((String) arg));      // 本地事务:订单落库
            return LocalTransactionState.COMMIT_MESSAGE;
        } catch (Exception e) {
            return LocalTransactionState.ROLLBACK_MESSAGE;
        }
    }

    // ④ 回查:Broker 没等到提交结果时回调,按本地库状态裁决
    public LocalTransactionState checkLocalTransaction(MessageExt msg) {
        String orderId = new String(msg.getBody());
        return orderMapper.existsByOrderId(orderId)
                ? LocalTransactionState.COMMIT_MESSAGE
                : LocalTransactionState.ROLLBACK_MESSAGE;
    }
}
\`\`\`

\`\`\`output
[tx] half message 写入成功,msgId=AC1400A11F2C18B4A6F800000000
[tx] 本地事务:order-1001 落库成功 → COMMIT_MESSAGE
[tx] Broker 恢复真实 Topic,消息对消费者可见
[check] 另一笔回查 order-1002:本地库不存在 → ROLLBACK_MESSAGE,半消息删除
\`\`\`

> [!best] 事务消息的边界(面试必补)
> 它保证的是"**本地事务 + 消息发送**"的最终一致,不保证消费者幂等,也不保证实时性(回查最长等 60s)。==executeLocalTransaction 返回 UNKNOW 或抛异常时,消息不会被删,等回查兜底==;回查次数上限 ==transactionCheckMax=15==,仍 UNKNOW 则丢弃(可配日志/告警)。生产实践:本地事务要能按业务键查状态,回查逻辑必须幂等且快速。

### 重试队列 %RETRY% 与死信 %DLQ%

并发消费失败(RECONSUME_LATER)时,Broker 把消息投到 ==%RETRY%消费组名== 的内部主题,按重试次数递增延迟(10s、30s、1m、2m ... 共 16 次);超过 ==maxReconsumeTimes==(默认 16)后转入 ==%DLQ%消费组名==,DLQ 只读,必须人工或控制台重投。

\`\`\`java
consumer.registerMessageListener((MessageListenerConcurrently) (msgs, ctx) -> {
    try {
        handle(msgs);
        return ConsumeConcurrentlyStatus.CONSUME_SUCCESS;
    } catch (Exception e) {
        System.out.println("第 " + msgs.get(0).getReconsumeTimes() + " 次失败,稍后重试");
        return ConsumeConcurrentlyStatus.RECONSUME_LATER;   // 进 %RETRY%
    }
});
\`\`\`

\`\`\`shell
# 查看某个消费组的重试与死信 topic
mqadmin topicList -n localhost:9876 | grep -E "RETRY|DLQ"
\`\`\`

\`\`\`output
%RETRY%order-consumer-group
%DLQ%order-consumer-group
\`\`\`

| 机制 | 触发 | 默认行为 | 处理建议 |
| --- | --- | --- | --- |
| %RETRY% | 并发消费返回 RECONSUME_LATER | 延迟递增重试,最多 16 次 | 修根因,别用重试掩盖坏数据 |
| %DLQ% | 超过最大重试次数 | 只读保留,等待人工 | 告警 + 控制台重投或归档 |
| 顺序消费失败 | 返回 SUSPEND | 当前队列挂起重试,**不进 %RETRY%** | 控制单条处理耗时,防毒消息阻塞 |

> [!danger] 死信不是垃圾桶
> 进 DLQ 意味着"自动重试已放弃",必须接告警与处理平台:先看消息体与异常栈,修复后按原 topic 重投。若放任不管,DLQ 会持续堆积并最终撑爆磁盘 —— 生产上要给 %DLQ% 配监控和保留策略。

## 消息过滤·消息轨迹与 Exactly-Once 术语对照

前四章解决"消息怎么可靠地到",这一节补三块工程细节:**只让该收的人收到**(过滤)、**出了问题能复盘**(轨迹),以及把 at-most / at-least / exactly-once 三个术语按 MQ 横向对齐 —— 面试常拿它们判断你是"用过"还是"懂过"。

### 消息过滤:过滤越靠近 Broker,省下的网络与 CPU 越多

| MQ | 服务端过滤能力 | 写法 | 过滤位置 | 代价与坑 |
| --- | --- | --- | --- | --- |
| RabbitMQ | routingKey 路由 + headers 匹配 | direct/topic 交换机按 routingKey;headers 交换机按 \`x-match=all/any\` 比对消息头 | Broker 路由阶段 | 只能按路由键/头部,不能按消息体;绑定关系爆炸会拖高内存 |
| RocketMQ | Tag + SQL92 属性 | \`TagA \\|\\| TagB\`;\`amount > 1000 AND region = 'sh'\` | Broker 先按 Tag 哈希过滤 ConsumeQueue,SQL92 再读属性 | Tag 是单层字符串,别当多维度标签;SQL92 需 \`enablePropertyFilter=true\`,扫属性成本高 |
| Kafka | **无** broker 端过滤 | 消费端 \`filter()\` 或读 header 判断 | 客户端拉取之后 | 拉全量再丢,带宽与反序列化照付;分区 key 只决定落哪个分区,不是过滤 |

\`\`\`java RabbitHeadersFilter.java
// 省略 import:com.rabbitmq.client.*、java.util.*
Map<String, Object> args = new HashMap<>();
args.put("x-match", "all");            // all:全部条件命中;any:任一命中
args.put("region", "sh");
args.put("level", "vip");
channel.queueDeclare("q.order.vip.sh", true, false, false, args);
channel.queueBind("q.order.vip.sh", "ex.order.headers", "");

AMQP.BasicProperties props = new AMQP.BasicProperties.Builder()
        .headers(Map.of("region", "sh", "level", "vip"))
        .build();
channel.basicPublish("ex.order.headers", "", props, "order-1001".getBytes());
\`\`\`

Kafka 的过滤则是反过来的:Broker 只按 key 算分区,**不解析消息内容**,所以 \`filter()\` 写在消费端,消息已经穿过网络、进过反序列化,只是没进业务方法。

\`\`\`java KafkaClientFilter.java
// Kafka 没有服务端过滤:poll 已经把整批消息拉下来了,过滤只是少做业务
while (running) {
    ConsumerRecords<String, String> records = consumer.poll(Duration.ofMillis(500));
    for (ConsumerRecord<String, String> r : records) {
        Header h = r.headers().lastHeader("region");
        String region = h == null ? "" : new String(h.value(), StandardCharsets.UTF_8);
        if (!"sh".equals(region)) {
            continue;                    // 丢弃不需要的消息
        }
        handle(r);
    }
    consumer.commitSync();               // 被过滤的消息也要提交位点,否则下次重复拉
}
\`\`\`

> [!pitfall] Tag 不是标签系统
> RocketMQ 的 Tag 在 ConsumeQueue 里只存**哈希**,Broker 先按哈希粗筛,消费者再按字符串精确匹配。所以 Tag 数量要克制(常用 1~3 个业务标签),别把地区、渠道、等级全塞进 Tag;多维度条件用 SQL92 属性,但要做好 Broker 多一次属性读取的性能预算。

### 消息轨迹:一条消息的完整病历

消息轨迹(trace)把"生产 → 存储 → 消费"的每个节点都记到内部主题 \`RMQ_SYS_TRACE_TOPIC\`,按 msgId 一查,就能看到它到底卡在哪一段。开启只需两步:

\`\`\`properties broker.conf
traceTopicEnable=true
\`\`\`

\`\`\`java TraceProducer.java
DefaultMQProducer producer = new DefaultMQProducer("order-producer");
producer.setNamesrvAddr("127.0.0.1:9876");
producer.setEnableMsgTrace(true);       // 生产者开启轨迹
producer.setCustomizedTraceTopic(null); // null 表示用系统主题 RMQ_SYS_TRACE_TOPIC
producer.start();
\`\`\`

\`\`\`text
producer(10.0.0.5) ──send──▶ broker-a ──store──▶ commitlog
        │                        │
        └──── trace 上报 ────────┴──▶ RMQ_SYS_TRACE_TOPIC ──▶ 控制台按 msgId 查询

一条轨迹的四个关键时间点:
  produce 发送 ──▶ store 落盘 ──▶ consume 拉取 ──▶ consume_ack 消费结果
\`\`\`

\`\`\`output
msgId: AC1400A69E1C18B4F9C0DEAD0000
topic: order-topic   tags: create   key: order-1001
produce   10.0.0.5  21:00:01.120  cost 3ms   SEND_OK
store     broker-a  21:00:01.123  cost 1ms   commitlog offset 123456
consume   10.0.0.6  21:00:01.980  cost 12ms  group=order-consumer  CONSUME_SUCCESS
\`\`\`

> [!tip] 轨迹不是业务日志
> 业务日志记"代码执行到哪",轨迹记"这条 msgId 在 MQ 里的生命周期":发送耗时、落盘 Broker、消费组、重试次数、最终 ack。排查"消息丢在哪段"时,先看轨迹定位环节,再翻应用日志找异常栈,能省一半时间。

### 术语对照:At-Most / At-Least / Exactly-Once

| 语义 | 核心承诺 | RabbitMQ 实现手段 | RocketMQ 实现手段 | Kafka 实现手段 |
| --- | --- | --- | --- | --- |
| At-Most-Once | 至多一次,可能丢,绝不重 | \`autoAck=true\`,消息投出即删 | 先返回 CONSUME_SUCCESS 再执行业务(反例) | 自动提交,或先提交 offset 再处理 |
| At-Least-Once | 至少一次,可能重,绝不丢 | 手动 ack,业务成功后 \`basicAck\` | 业务成功后返回 CONSUME_SUCCESS | 关闭自动提交,处理完 \`commitSync\` |
| Exactly-Once | 端到端恰好一次的效果 | 无原生:confirm + 手动 ack + 业务幂等 | 事务消息 + 消费幂等(不是真正 EOS) | 幂等生产者 + 事务 + \`read_committed\` + 位点入事务 |

> [!interview] 一句话背诵
> 可靠传输的工程默认是 **at-least-once**;Exactly-Once 不是"网络上只发一次",而是"**至少一次投递 + 消费端幂等**",或者 Kafka 用事务把"读 - 处理 - 写 - 提交位点"包成一个原子单元。跨库、跨系统时,最后一定回到幂等。

三条结论收束:① 过滤优先用 routingKey/Tag,别让消费者拉全量再丢;② 轨迹与业务日志互补,一个定位 MQ 环节,一个定位代码行;③ 看到 Exactly-Once 先问"范围是 Kafka 内部还是跨系统",答案立刻分层。

## 面试速记

- 不丢 = 生产端(confirm/acks + 重试 + 失败补偿表)、Broker(同步刷盘/复制,Kafka 靠 acks=all + min.insync.replicas)、消费端(手动 ack)三段合围。
- 重复不可避免(at-least-once),幂等五板斧:唯一约束、去重表、Redis SETNX、状态机、乐观锁。
- 顺序 = 分区有序 + 单线程消费 + 失败不跳过。
- 积压 SOP:定位根因 → 扩容到分区上限(不够就临时 topic 搬运)→ 消费提速 → 可丢场景重置 offset 兜底。
- 事务消息两条路:本地消息表(通用)/ RocketMQ 半消息 + 回查;都只到最终一致,消费端仍要幂等。
`
      }
    ],
    interview: [
      { q: '为什么用 MQ?用了会带来什么问题?', a: '三大价值:**解耦**(下游增减上游零改动)、**异步**(接口耗时与下游数量解绑,下单 600ms 降到 55ms)、**削峰**(队列当蓄水池,8000 QPS 洪峰按 2000 QPS 匀速消费)。代价四件套:消息丢失、重复消费、顺序性、消息积压 —— 回答时主动把问题抛出来,顺势展示你有一整套解决方案。' },
      { q: '如何保证消息不丢失?', a: '三段防线。**生产端**:同步或回调确认(Kafka acks=all、RabbitMQ confirm+return)+ 失败重试 + 重试耗尽落失败表定时补偿。**Broker**:RocketMQ 同步刷盘 + 同步复制;Kafka 靠副本机制 acks=all + min.insync.replicas=2 + 3 副本;RabbitMQ 交换机/队列/消息三者持久化。**消费端**:关闭自动提交,业务处理成功后再 ack/提交 offset,失败进死信人工处理。' },
      { q: '消息重复消费怎么处理?幂等怎么实现?', a: '重复不可避免:生产端重试、at-least-once 语义、rebalance 后 offset 未提交重新拉取都会导致重复。幂等五板斧:**数据库唯一约束**(业务单号唯一索引)、**去重表**(msgId 与业务同一事务插入)、**Redis SETNX**(set msgId NX EX,高并发场景)、**状态机**(update ... where status=INIT,改不动就是重复)、**乐观锁版本号**。金额类强一致场景,判重要放进与业务同一个数据库事务。' },
      { q: '怎么保证消息顺序性?', a: '全局有序代价大(单分区单消费者),生产常用**分区有序**:① 同一业务键(订单号)路由到同一分区(Kafka 按 key hash,RocketMQ 用 MessageQueueSelector);② 分区内单线程串行消费,失败不跳过(跳过即乱序);③ 生产端开启幂等生产者或 max.in.flight=1,避免重试导致分区内乱序。RocketMQ 用 ConsumeMode.ORDERLY,RabbitMQ 用单队列单消费者。' },
      { q: '消息积压了几百万条,怎么办?', a: '四步 SOP:① 定位根因(慢 SQL、外部接口超时、GC),不修根因扩容无效;② 紧急扩容:消费者扩到分区数上限,不够就建 10 倍分区的临时 topic,写搬运消费者把积压转投后用 10 倍消费者并行消费;③ 消费提速:批量拉取、异步化、非核心逻辑降级;④ 兜底:可丢弃场景(推送类)重置 offset 跳过旧消息事后补偿,交易类绝不丢。同时调大 max.poll.interval.ms 防止消费者被踢出组引发 rebalance。' },
      { q: '事务消息的原理?不用 RocketMQ 怎么实现?', a: 'RocketMQ 四步:① 发 half 消息(Broker 落盘但消费者不可见)→ ② 执行本地事务 → ③ 按结果 commit/rollback → ④ Broker 未收到结果就定时**回查**生产者本地事务状态并裁决。通用方案是**本地消息表**:业务数据与"待发送消息"记录在同一个数据库事务里,定时任务扫描补偿发送,发送成功才标记完成。两者都只保证最终一致,消费端仍需重试 + 幂等兜底。' },
      { q: 'Kafka 为什么快?', a: '① **顺序写**:每个分区只追加(append)日志文件,磁盘顺序写接近内存速度;② **零拷贝**:消费者拉取用 sendfile,数据从页缓存直达网卡,省去用户态两次拷贝与上下文切换;③ **页缓存**:写入先落 OS page cache,读热数据全部命中内存;④ **批量与压缩**:多条消息攒成 batch 发送并压缩,摊薄网络与请求开销。另有分区并行、稀疏索引加速定位等辅助设计。' },
      { q: '消费组机制?rebalance 什么时候发生?', a: '组内竞争(一个分区同一时刻只被组内一个消费者消费)、组间广播(每组各自消费全量)。消费者数超过分区数时多余的闲置。rebalance 触发:成员增减(上线/宕机/心跳超时被踢)、订阅 topic 变化、分区数变化。rebalance 期间整组停止消费,是生产事故高发点 —— 用 CooperativeSticky 增量分配缓解,并调好心跳与 max.poll.interval.ms 防止消费者被误踢。' },
      { q: 'RabbitMQ 的重试与死信队列怎么设计?', a: '死信三条件:消费端 basicNack/basicReject 且 requeue=false、消息 TTL 过期、队列超过最大长度。设计要点:重试不要用 requeue=true 无限重入(风暴),用 Spring Retry 本地重试 3 次,仍失败才 nack 进死信;DLQ 消费者只做**记录 + 告警 + 补偿**,绝不再重回业务队列(防死信循环);x-death 头里保留原队列、路由键与死信原因,排查全靠它。' },
      { q: 'Kafka、RabbitMQ、RocketMQ 怎么选型?', a: '**Kafka**:百万级吞吐,适合日志采集、大数据流、事件溯源,生态最强但路由弱;**RabbitMQ**:延迟最低(μs~ms)、路由最灵活(五种 Exchange),适合中小消息量、复杂分发,吞吐是短板;**RocketMQ**:十万级吞吐,原生事务消息、延迟消息、消息回溯,适合电商交易与金融一致性。口诀:吞吐 Kafka、路由 RabbitMQ、事务延迟 RocketMQ;同时要考虑团队运维能力。' },
      { q: '延迟消息有哪些实现方式?', a: '① **RabbitMQ TTL+死信**:过期死信到消费队列,零依赖,缺陷是队头阻塞(RabbitMQ 只检查队首);② **RabbitMQ 延迟插件** x-delayed-message:每条消息独立延迟,推荐;③ **RocketMQ 原生延迟**:默认 18 个固定级别(1s~2h),5.x 支持任意时间;④ **Kafka 无原生**:按延迟档位分层转 topic,或配合时间轮/调度系统;⑤ 简单场景数据库定时扫描也够用。订单超时取消这类统一延迟,TTL+死信即可。' },
      { q: '为什么会重复消费?重复的根源在哪几处?', a: '**at-least-once 语义**决定了必然重复。生产端:确认丢失触发重发,消息其实已写入;Broker:副本同步未完成时主从切换,分区重新分配;消费端:处理完成但 offset 提交前崩溃或被 rebalance 踢出组,重启后从旧 offset 重新拉取。所以工程上不追求 exactly-once,而是 **at-least-once + 业务幂等**;Kafka 幂等生产者 + 事务能做到单流 EOS,但跨库场景仍要业务幂等兜底。' },
      { q: 'Kafka 幂等生产者和事务生产者的区别?', a: '**幂等生产者**:PID + <分区, 序列号> 去重,只保证**单分区、单会话**内重试不重复写,开 enable.idempotence=true 即得。**事务生产者**:额外用 transactional.id,把**跨分区写入 + 位点提交**包成一个原子事务,还能 fence 旧实例。一句话:幂等管单条不重,事务管一批全成或全败。' },
      { q: 'RocketMQ 事务消息的流程?回查是怎么做的?', a: '① 发 **half message** 到 RMQ_SYS_TRANS_HALF_TOPIC,消费者不可见;② 执行本地事务;③ 按结果 commit(消息可见)或 rollback;④ Broker 未收到结果就**定时回查**(默认 60s),调用 checkLocalTransaction;⑤ 生产者按业务键查本地库,返回 COMMIT / ROLLBACK / UNKNOW。回查必须幂等快速。' },
      { q: 'RabbitMQ 镜像队列和仲裁队列怎么选?', a: '**镜像队列**:主从异步复制、无共识算法,主挂可能丢消息、分区可能脑裂;3.9 废弃、4.0 移除,只留存量。**仲裁队列**:Raft 多数派确认,强一致、自动选主,3.8+ 支持、3.12 起推荐,吞吐约低 20%~30%。结论:**新项目核心队列用 quorum**,存量逐步迁移。' },
      { q: '消息过滤有哪些实现方式?各自适合什么场景?', a: '分三层看。**RabbitMQ** 用 routingKey(direct 精确、topic 通配)或 headers 交换机(按消息头 x-match=all/any),过滤发生在 Broker 路由阶段。**RocketMQ** 用 Tag(订阅表达式 TagA || TagB)或 SQL92 属性过滤(amount > 1000 AND region = \'sh\',需 Broker 开 enablePropertyFilter)。**Kafka** 没有 Broker 端过滤,只能消费者拉到本地后 filter(),带宽与反序列化开销照付。选型:能用 routingKey/Tag 就别用 SQL 或 headers,表达式越简单 Broker 越省;Kafka 想省流量只能靠分区 key 预先分流,或生产端按维度拆 topic。' },
      { q: 'Exactly-Once 在主流 MQ 里怎么实现?', a: '先纠正:传输层只有 at-most-once 和 at-least-once 两种可靠档,Exactly-Once 是**端到端效果**,靠"至少一次投递 + 幂等"或事务实现。**RabbitMQ** 无原生 EOS:confirm 保证到达、手动 ack 保证消费,业务侧用唯一键或去重表兜底。**RocketMQ** 事务消息保证"本地事务 + 发消息"原子,消费端仍要幂等,没有跨库 EOS。**Kafka** 最完整:幂等生产者(PID + 分区序列号)防重试重复,事务生产者把多分区写入与 offset 提交放进一个事务,消费端 read_committed 只读已提交,构成 Kafka 内部的 EOS;一旦写外部数据库,仍回到 at-least-once + 幂等。' }
    ]
  };
})();
