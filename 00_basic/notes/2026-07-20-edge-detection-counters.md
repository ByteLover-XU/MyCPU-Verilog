# Verilog 学习笔记：边沿检测与计数器

日期：2026-07-20

## 一、总体说明

今天继续学习 HDLBits 的时序逻辑电路，完成了边沿检测、边沿捕获、双边沿触发电路以及计数器部分的若干题目。

今天最重要的主线是：时序逻辑不仅要计算当前输入，还要依靠寄存器保存过去的状态。边沿检测需要比较“当前值”和“上一周期的值”，计数器则需要在每个时钟上升沿根据复位、使能和当前计数值决定下一个状态。

今天涉及的主要内容如下：

- 8 位输入的上升沿检测
- 8 位输入的任意边沿检测
- 32 位输入的下降沿捕获
- SR 触发器的置位、复位和保持行为
- 使用两个单边沿触发器模拟双边沿触发器
- RTL 仿真中的 delta cycle 与真实硬件延迟
- 0～9、1～10以及带使能端的十进制计数器
- 使用题目提供的 `count4` 模块设计1～12计数器

## 二、题目、知识点与过程中出现的问题

### 边沿检测的核心：保存上一周期输入

只看当前输入，无法判断它是刚刚变成 `1`，还是已经保持 `1` 很久。因此，需要使用寄存器保存上一周期的输入。

```verilog
reg [7:0] in_d;

always @(posedge clk) begin
    in_d <= in;
end
```

其中：

- `in` 表示当前输入。
- `in_d` 表示上一个时钟周期保存的输入。
- 每个 `clk` 上升沿到来时，电路采样当前的 `in`。

边沿检测发生在 `clk` 的上升沿。输入可以在两个时钟沿之间变化，但电路只比较相邻两次时钟采样到的值。如果输入在两个时钟沿之间变化多次，电路无法知道中间具体变化了几次。

### `begin...end` 与非阻塞赋值

`begin...end` 的作用只是把多条语句组合到同一个过程块中，它不会让语句自动“同时执行”。

真正让时序逻辑中的多个寄存器在时钟沿后统一更新的是非阻塞赋值 `<=`。

```verilog
always @(posedge clk) begin
    in_d  <= in;
    pedge <= in & ~in_d;
end
```

在时钟上升沿到来时，所有 `<=` 右侧表达式先使用旧值计算，然后寄存器统一更新。因此，第二行读取的 `in_d` 仍然是上一周期的值。

如果错误地使用阻塞赋值：

```verilog
in_d = in;
pedge = in & ~in_d;
```

第一行会立刻修改 `in_d`，第二行就可能比较两个相同的当前值，从而无法正确检测边沿。

### 上升沿检测

上升沿表示：

```text
上一周期为0，当前周期为1
```

对应表达式：

```verilog
in & ~in_d
```

完整代码：

```verilog
module top_module (
    input clk,
    input [7:0] in,
    output reg [7:0] pedge
);

    reg [7:0] in_d;

    always @(posedge clk) begin
        in_d  <= in;
        pedge <= in & ~in_d;
    end

endmodule
```

过程中曾认为只写下面一行就足够：

```verilog
pedge <= in & ~in_d;
```

但这行代码依赖 `in_d`。如果没有 `in_d <= in`，`in_d` 就无法持续保存新的历史输入，边沿检测也就失去了“上一周期”的参照值。

### 任意边沿检测

任意边沿包括：

- `0 → 1` 上升沿
- `1 → 0` 下降沿

两个值不同时异或结果为 `1`，因此可以使用：

```verilog
in ^ in_d
```

完整代码：

```verilog
module top_module (
    input clk,
    input [7:0] in,
    output reg [7:0] anyedge
);

    reg [7:0] in_d;

    always @(posedge clk) begin
        in_d    <= in;
        anyedge <= in ^ in_d;
    end

endmodule
```

三种边沿检测表达式可以统一记忆：

```verilog
// 上升沿：过去为0，现在为1
in & ~in_d

// 下降沿：过去为1，现在为0
in_d & ~in

// 任意边沿：过去和现在不同
in ^ in_d
```

### 下降沿捕获与 SR 触发器

边沿检测通常只输出一个时钟周期；边沿捕获则要求检测到事件后一直保存结果，直到复位。

SR 触发器的基本行为如下：

| S | R | Q的行为 |
|---:|---:|---|
| 0 | 0 | 保持原值 |
| 1 | 0 | 置为1 |
| 0 | 1 | 清零 |
| 1 | 1 | 基本SR触发器中通常不允许 |

在 HDLBits 的边沿捕获题中：

- 下降沿检测结果相当于 `S`。
- `reset` 相当于 `R`。
- 题目明确规定两者同时出现时，复位优先。

下降沿检测表达式：

```verilog
in_d & ~in
```

为了让已经置为 `1` 的输出继续保持，使用：

```verilog
out | (in_d & ~in)
```

完整代码：

```verilog
module top_module (
    input clk,
    input reset,
    input [31:0] in,
    output reg [31:0] out
);

    reg [31:0] in_d;

    always @(posedge clk) begin
        in_d <= in;

        if (reset)
            out <= 32'd0;
        else
            out <= out | (in_d & ~in);
    end

endmodule
```

这里的 `out | ...` 相当于保留过去已经发现的事件。只要 `out` 的某一位已经是 `1`，它与 `0` 相或仍然为 `1`。

同步复位只会在 `clk` 上升沿检查 `reset`：

```verilog
always @(posedge clk)
```

### 双边沿触发电路

双边沿触发表示在 `clk` 的上升沿和下降沿都采样输入 `d`。

题目不允许直接写：

```verilog
always @(posedge clk or negedge clk)
```

也不应该让两个 `always` 块同时驱动同一个 `q`。可以分别使用一个上升沿寄存器和一个下降沿寄存器，再通过二选一选择器输出。

```verilog
module top_module (
    input clk,
    input d,
    output q
);

    reg q_pos;
    reg q_neg;

    always @(posedge clk) begin
        q_pos <= d;
    end

    always @(negedge clk) begin
        q_neg <= d;
    end

    assign q = clk ? q_pos : q_neg;

endmodule
```

选择规则：

| 当前 `clk` | 最近发生的边沿 | 输出选择 |
|---:|---|---|
| 1 | 上升沿 | `q_pos` |
| 0 | 下降沿 | `q_neg` |

### `always`、`assign`与延迟

RTL 代码中没有使用 `#` 时，没有人为指定的仿真时间延迟。但是 Verilog 仿真器仍然有同一时刻内部的事件调度顺序，也就是 delta cycle。

在上升沿到来时，可能发生以下过程：

- `clk` 先变成 `1`，`assign` 暂时选择旧的 `q_pos`。
- `always @(posedge clk)` 采样 `d`，并安排更新 `q_pos`。
- `q_pos` 更新后，连续赋值再次计算 `q`。
- 最终 `q` 稳定为正确值。

`assign` 不是只执行一次，而是持续监视右侧信号。右侧任意信号变化时，它都会重新计算。

在真实 FPGA 中，触发器、组合逻辑和导线都存在实际传播延迟，所以这种结构可能出现短暂毛刺。当前 HDLBits 题目明确要求忽略这一细节。

`#` 延迟主要用于 testbench，例如：

```verilog
#5 clk = ~clk;
```

可综合 RTL 通常不依靠 `#` 描述真实硬件延迟。真实硬件的建立时间、保持时间、关键路径和最大时钟频率属于数字电路时序分析与 FPGA 静态时序分析。

### 0～9十进制计数器

计数器在每个时钟上升沿更新：

- `reset = 1`：清零。
- 当前值为9：下一个周期回到0。
- 其他情况：加1。

```verilog
module top_module (
    input clk,
    input reset,
    output reg [3:0] q
);

    always @(posedge clk) begin
        if (reset)
            q <= 4'd0;
        else if (q >= 4'd9)
            q <= 4'd0;
        else
            q <= q + 4'd1;
    end

endmodule
```

因为 `q` 在 `always` 块中赋值，所以必须声明为：

```verilog
output reg [3:0] q;
```

如果只写 `output [3:0] q`，它默认是 `wire`，不能在过程块中赋值。

### 1～10计数器

计数序列：

```text
1 → 2 → 3 → ... → 9 → 10 → 1
```

```verilog
module top_module (
    input clk,
    input reset,
    output reg [3:0] q
);

    always @(posedge clk) begin
        if (reset)
            q <= 4'd1;
        else if (q >= 4'd10)
            q <= 4'd1;
        else
            q <= q + 4'd1;
    end

endmodule
```

不能在模块内部直接写：

```verilog
q = 4'd1;
```

过程赋值必须位于 `always` 或 `initial` 等过程块中。当前题目通过同步 `reset` 在时钟上升沿把计数器设置为1。

使用 `q >= 4'd10` 比只判断 `q == 4'd10` 更容易让计数器从已知的错误状态恢复。例如，`q` 意外进入11～15时，下一个时钟也会回到1。

如果使用 `q == 4'd10`，而 `q` 从11开始，4位计数器会经历：

```text
11 → 12 → 13 → 14 → 15 → 0 → 1
```

因为4位无符号数最大为15，`15 + 1` 会溢出为0。

### 带暂停功能的0～9计数器

`slowena` 是计数使能信号：

- `slowena = 1`：允许计数。
- `slowena = 0`：暂停并保持当前值。

```verilog
module top_module (
    input clk,
    input slowena,
    input reset,
    output reg [3:0] q
);

    always @(posedge clk) begin
        if (reset)
            q <= 4'd0;
        else if (slowena) begin
            if (q >= 4'd9)
                q <= 4'd0;
            else
                q <= q + 4'd1;
        end
    end

endmodule
```

当 `slowena = 0` 时，没有给 `q` 赋新值。在时序逻辑中，这表示寄存器保持原值，不必额外写：

```verilog
q <= q;
```

### 使用 `count4` 模块设计1～12计数器

题目已经提供一个4位二进制计数器 `count4`。它的行为可以理解为：

```verilog
if (load)
    Q <= d;
else if (enable)
    Q <= Q + 1;
else
    Q <= Q;
```

`load` 的优先级高于 `enable`。

顶层模块的任务不是重新编写计数器，而是产生三个控制信号：

| 控制信号 | 作用 |
|---|---|
| `c_enable` | 是否允许内部计数器加1 |
| `c_load` | 是否让内部计数器直接加载数据 |
| `c_d` | 要加载到内部计数器的数据 |

控制逻辑：

```verilog
assign c_enable = enable;
assign c_d = 4'd1;
assign c_load = reset | ((Q == 4'd12) & enable);
```

必须在 `Q == 12` 的条件中加入 `enable`。如果计数器已经停在12，但 `enable = 0`，它应该继续保持12，而不是自动回到1。

完整代码：

```verilog
module top_module (
    input clk,
    input reset,
    input enable,
    output [3:0] Q,
    output c_enable,
    output c_load,
    output [3:0] c_d
);

    assign c_enable = enable;
    assign c_d = 4'd1;
    assign c_load = reset | ((Q == 4'd12) & enable);

    count4 the_counter (
        .clk    (clk),
        .enable (c_enable),
        .load   (c_load),
        .d      (c_d),
        .Q      (Q)
    );

endmodule
```

模块例化中的：

```verilog
.enable(c_enable)
```

表示把顶层模块的 `c_enable` 信号连接到 `count4` 的 `enable` 端口。`Q` 由内部 `count4` 产生，并直接连接到顶层输出。

对应状态：

| 当前情况 | `c_enable` | `c_load` | 下一个 `Q` |
|---|---:|---:|---:|
| `Q=5, enable=1` | 1 | 0 | 6 |
| `Q=12, enable=1` | 1 | 1 | 1 |
| `Q=7, enable=0` | 0 | 0 | 7 |
| `reset=1` | 不影响加载结果 | 1 | 1 |

## 三、总结与反思

今天学习的内容比昨天更强调“状态”和“历史值”。组合逻辑只根据当前输入计算，而时序逻辑需要寄存器保存过去的信息。边沿检测中的 `in_d`、边沿捕获中的 `out`、计数器中的 `q` 都属于状态。

今天需要重点巩固以下内容：

- `begin...end` 只负责组合语句，非阻塞赋值 `<=` 才使寄存器在时钟沿后统一更新。
- 边沿检测必须同时拥有当前输入和上一周期输入。
- `assign` 是连续赋值，右侧信号变化后会重新计算。
- 在 `always` 块中赋值的输出要声明为 `reg`。
- 同步复位只在时钟有效边沿生效。
- 计数使能无效时，寄存器不赋值就表示保持原值。
- 模块例化本质上是在顶层模块中连接一个已经存在的子电路。

目前最需要继续复习的是 `count4` 题中的控制思路。下一次看到类似题目时，应先把现成模块当成一个具有 `enable`、`load`、`d` 和 `Q` 引脚的芯片，再根据目标计数序列决定每根控制线在什么条件下为1，而不是急着直接写完整计数器。

今天已经从单个寄存器推进到边沿检测和计数器控制，这些内容会直接用于之后的程序计数器、状态机、控制器和简易 CPU 设计。
