# Verilog 时序逻辑学习笔记

**学习日期：2026-07-19**

---

# 第一部分：总体说明

今天学习的主题是 **Verilog 中的时序逻辑**，主要围绕 D 触发器逐步展开：

```text
D 触发器
  ↓
多位 D 触发器
  ↓
同步复位与异步复位
  ↓
指定复位值与下降沿触发
  ↓
字节使能寄存器
  ↓
反馈电路
  ↓
MUX 与 DFF
  ↓
根据电路图描述时序电路
```

今天需要建立的核心认识有五点：

1. 组合逻辑的输出主要由当前输入决定，而时序逻辑能够保存以前的数据。

2. D 触发器只在指定的时钟边沿更新：

   ```verilog
   always @(posedge clk)
   ```

3. 时序逻辑通常使用非阻塞赋值：

   ```verilog
   q <= d;
   ```

4. 同步复位与异步复位的主要区别是：复位是否必须等待时钟边沿。

5. 阅读时序电路图时，应先写出每个 D 端的逻辑表达式，再写触发器和输出逻辑。

---

# 第二部分：题目、知识点与过程中出现的错误

## 题目一：8 个 D 触发器

题目要求创建 8 个 D 触发器，所有触发器都由 `clk` 的上升沿触发。

输入和输出都是 8 位向量：

```text
d[7:0]：8 个触发器的数据输入
q[7:0]：8 个触发器的输出
```

正确代码：

```verilog
module top_module (
    input clk,
    input [7:0] d,
    output reg [7:0] q
);

    always @(posedge clk) begin
        q <= d;
    end

endmodule
```

一句 `q <= d;` 就能同时描述 8 个并行的 D 触发器，不需要使用 `for` 循环。

**过程中出现的错误：把 `q` 重新赋给自己**

错误：

```verilog
q[i] <= q[i];
```

这表示触发器继续保存原来的 `q[i]`，不会接收输入 `d[i]`。

正确：

```verilog
q <= d;
```

只要输入和输出位宽相同，就可以直接进行向量赋值。

---

## 题目二：高电平有效的同步复位

题目要求创建 8 个带有高电平有效同步复位的 D 触发器，并在 `clk` 上升沿触发。

正确代码：

```verilog
module top_module (
    input clk,
    input reset,
    input [7:0] d,
    output reg [7:0] q
);

    always @(posedge clk) begin
        if (reset)
            q <= 8'b0;
        else
            q <= d;
    end

endmodule
```

同步复位的工作过程：

```text
clk 上升沿到来
  ↓
检查 reset
  ↓
reset=1：q 清零
reset=0：q 保存 d
```

如果没有时钟上升沿，即使 `reset` 变成 1，`q` 也不会立即改变。

**过程中出现的错误：把同步复位写进敏感列表**

错误：

```verilog
always @(posedge clk or reset)
```

同步复位的敏感列表中只有时钟：

```verilog
always @(posedge clk)
```

---

## 题目三：下降沿触发并复位到指定值

题目要求：

- 创建 8 个 D 触发器
- 使用高电平有效的同步复位
- 复位值为十六进制 `0x34`
- 在 `clk` 的下降沿触发

正确代码：

```verilog
module top_module (
    input clk,
    input reset,
    input [7:0] d,
    output reg [7:0] q
);

    always @(negedge clk) begin
        if (reset)
            q <= 8'h34;
        else
            q <= d;
    end

endmodule
```

下降沿表示时钟从 1 变成 0：

```verilog
negedge clk
```

数值写法：

```text
8'h34 = 8'b0011_0100
```

其中：

- `8`：数据宽度为 8 位
- `'h`：使用十六进制
- `34`：十六进制数值

**过程中出现的错误：在时序逻辑中使用阻塞赋值**

不推荐：

```verilog
q = 8'h34;
```

推荐：

```verilog
q <= 8'h34;
```

在描述触发器时，应优先使用非阻塞赋值 `<=`。

---

## 题目四：高电平有效的异步复位

题目要求创建 8 个带有高电平有效异步复位的 D 触发器，并在时钟上升沿触发。

正确代码：

```verilog
module top_module (
    input clk,
    input areset,
    input [7:0] d,
    output reg [7:0] q
);

    always @(posedge clk or posedge areset) begin
        if (areset)
            q <= 8'b0;
        else
            q <= d;
    end

endmodule
```

敏感列表中有两个触发条件：

```verilog
posedge clk
posedge areset
```

因此，只要 `areset` 从 0 变成 1，`q` 就立即清零，不需要等待时钟。

同步复位与异步复位对比：

```verilog
// 同步复位
always @(posedge clk)

// 异步复位
always @(posedge clk or posedge areset)
```

`areset` 中的字母 `a` 通常表示 `asynchronous`，也就是异步。

---

## 题目五：带字节使能的 16 位寄存器

题目要求创建 16 个 D 触发器，并使用两位字节使能信号 `byteena` 分别控制高 8 位和低 8 位：

```text
byteena[1] 控制 q[15:8]
byteena[0] 控制 q[7:0]
```

`resetn` 是同步、低电平有效复位。

正确代码：

```verilog
module top_module (
    input clk,
    input resetn,
    input [1:0] byteena,
    input [15:0] d,
    output reg [15:0] q
);

    always @(posedge clk) begin
        if (!resetn) begin
            q <= 16'b0;
        end
        else begin
            if (byteena[1])
                q[15:8] <= d[15:8];

            if (byteena[0])
                q[7:0] <= d[7:0];
        end
    end

endmodule
```

字节使能的工作情况：

| `byteena` | 写入效果 |
|---|---|
| `2'b00` | 高低 16 位全部保持原值 |
| `2'b01` | 只写入低 8 位 |
| `2'b10` | 只写入高 8 位 |
| `2'b11` | 高低 16 位全部写入 |

### 向量声明与位选择

声明：

```verilog
input [1:0] byteena;
```

表示 `byteena` 是一个 2 位向量：

```text
byteena[1]  byteena[0]
```

使用：

```verilog
byteena[1]
```

表示只选择 `byteena` 的第 1 位。

这个知识点与存储器声明类似：

```verilog
reg [7:0] mem [0:255];
```

其中：

```text
mem[5]    ：选择第 5 个 8 位存储单元
mem[5][2] ：选择第 5 个存储单元的第 2 位
```

方括号在声明时表示范围，在使用时表示选择。

**过程中出现的错误一：两个使能条件都写成 `byteena[1]`**

错误：

```verilog
if (byteena[1])
    q[15:8] <= d[15:8];

if (byteena[1])
    q[7:0] <= d[7:0];
```

正确：

```verilog
if (byteena[1])
    q[15:8] <= d[15:8];

if (byteena[0])
    q[7:0] <= d[7:0];
```

**过程中出现的错误二：没有用 `begin...end` 包住 `else` 后的多条语句**

Verilog 不根据缩进判断语句的范围。一个分支中存在多条语句时，应使用：

```verilog
else begin
    // 多条语句
end
```

**过程中出现的错误三：考虑使用 `else if`**

这里不能把两个字节使能写成 `if...else if`，因为 `byteena=2'b11` 时，高 8 位和低 8 位必须同时写入。

两个独立的控制条件应该使用两个独立的 `if`。

---

## 题目六：带异或反馈的 D 触发器

电路中，D 触发器的输出 `out` 反馈到异或门，另一个输入为 `in`。

D 端的逻辑表达式：

```text
D = in XOR out
```

正确代码：

```verilog
module top_module (
    input clk,
    input in,
    output reg out
);

    always @(posedge clk) begin
        out <= in ^ out;
    end

endmodule
```

工作规律：

| `in` | 时钟上升沿后 `out` 的变化 |
|---:|---|
| 0 | 保持原值 |
| 1 | 翻转 |

原因：

```text
out XOR 0 = out
out XOR 1 = NOT out
```

这里的反馈线表示，计算下一个状态时需要使用触发器当前保存的状态。

不能写成：

```verilog
assign out = in ^ out;
```

这种写法没有描述图中的 D 触发器，还会形成没有寄存器隔开的组合逻辑反馈。

---

## 题目七：二选一 MUX 与 D 触发器

二选一多路选择器有两个数据输入和一个选择信号：

```text
L=0：选择输入 0
L=1：选择输入 1
```

图中 MUX 内部标出的 `0` 和 `1`，不是固定的数据 0 和 1，而是表示选择信号取什么值时选择对应输入。

假设：

```text
输入 0：q_in
输入 1：r_in
选择信号：L
```

MUX 表达式为：

```verilog
L ? r_in : q_in
```

包含一个 MUX 和一个 D 触发器的子模块可以写成：

```verilog
module top_module (
    input clk,
    input L,
    input r_in,
    input q_in,
    output reg Q
);

    always @(posedge clk) begin
        Q <= L ? r_in : q_in;
    end

endmodule
```

MUX 负责选择数据，D 触发器负责在时钟上升沿保存被选中的数据。

---

## 题目八：两级 MUX 与 D 触发器

这道题使用两个二选一 MUX：

```text
第一个 MUX：E=1 选择 w，E=0 选择 Q
第二个 MUX：L=1 选择 R，L=0 选择第一个 MUX 的输出
```

分开描述组合逻辑和时序逻辑：

```verilog
module top_module (
    input clk,
    input w,
    input R,
    input E,
    input L,
    output reg Q
);

    wire a;

    assign a = E ? w : Q;

    always @(posedge clk) begin
        Q <= L ? R : a;
    end

endmodule
```

也可以合并成嵌套三目运算：

```verilog
module top_module (
    input clk,
    input w,
    input R,
    input E,
    input L,
    output reg Q
);

    always @(posedge clk) begin
        Q <= L ? R : (E ? w : Q);
    end

endmodule
```

工作情况：

| `L` | `E` | 时钟上升沿后 `Q` |
|---:|---:|---|
| 1 | 任意值 | 保存 `R` |
| 0 | 1 | 保存 `w` |
| 0 | 0 | 保持原来的 `Q` |

**过程中出现的错误一：把 `wire a` 放进时钟块赋值**

错误思路：

```verilog
wire a;

always @(posedge clk) begin
    a <= w;
end
```

`a` 是 MUX 的组合逻辑输出，不需要等待时钟，应使用：

```verilog
assign a = E ? w : Q;
```

**过程中出现的错误二：同一时钟块中先更新 `a`，再使用 `a`**

非阻塞赋值在时钟块结束后统一更新。因此下面代码中的 `Q` 会读到 `a` 的旧值：

```verilog
a <= w;
Q <= a;
```

需要把 MUX 写成组合逻辑，再让 D 触发器保存 MUX 的输出。

---

## 题目九：根据有限状态机电路图编写 Verilog

电路中包含三个 D 触发器。将它们的输出分别命名为：

```text
q0：上面的触发器
q1：中间的触发器
q2：下面的触发器
```

按照每个 D 端前面的门电路，可以写出：

```text
q0 的 D 端 = x XOR q0
q1 的 D 端 = x AND NOT q1
q2 的 D 端 = x OR NOT q2
```

输出 `z` 是三个状态输出的或非结果：

```text
z = NOT (q0 OR q1 OR q2)
```

正确代码：

```verilog
module top_module (
    input clk,
    input x,
    output z
);

    reg q0;
    reg q1;
    reg q2;

    always @(posedge clk) begin
        q0 <= x ^ q0;
        q1 <= x & ~q1;
        q2 <= x | ~q2;
    end

    assign z = ~(q0 | q1 | q2);

endmodule
```

三个非阻塞赋值右侧读取的都是时钟边沿到来前的旧状态，三个触发器在时钟边沿后同时更新。

输出也可以使用归约或非运算：

```verilog
assign z = ~|{q0, q1, q2};
```

题目说明触发器在状态机开始前已经复位为 0，但模块没有提供复位输入，因此代码中不需要自行增加复位端口。

### 电路图转 Verilog 的步骤

```text
先找出所有 D 触发器
  ↓
给每个触发器的 Q 输出命名
  ↓
沿导线向前寻找每个 D 端的数据来源
  ↓
写出每个 D 端的逻辑表达式
  ↓
放入 always @(posedge clk)
  ↓
最后单独处理组合逻辑输出
```

---

## 今天反复出现的语法规则

### 1. `output reg` 的使用

如果输出在 `always` 块中被赋值，在 Verilog 中应声明为：

```verilog
output reg q;
```

如果输出通过连续赋值驱动，可以声明为普通 `output`：

```verilog
output z;
assign z = a | b;
```

### 2. 非阻塞赋值

描述触发器时使用：

```verilog
q <= d;
```

不要把它写成组合逻辑常用的阻塞赋值：

```verilog
q = d;
```

### 3. `begin...end`

一个 `if` 或 `else` 分支中有多条语句时，必须使用：

```verilog
if (condition) begin
    statement_1;
    statement_2;
end
```

Verilog 不会根据代码缩进自动判断语句范围。

### 4. 保持原值

在时钟触发的 `always` 块中，如果某个寄存器在一个分支里没有被赋值，它会保持原值。

例如：

```verilog
if (enable)
    q <= d;
```

当 `enable=0` 时，`q` 保持原值。

---

# 第三部分：总结与反思

今天已经掌握或接触了：

- D 触发器的 Verilog 描述
- 多位 D 触发器
- 上升沿与下降沿触发
- 同步复位与异步复位
- 高电平有效与低电平有效复位
- 指定复位值
- 字节使能寄存器
- 向量声明与位选择
- 触发器反馈
- 二选一 MUX
- MUX 与 DFF 的组合
- 组合逻辑与时序逻辑的分离
- 根据电路图编写时序逻辑

今天最重要的结论是：

```text
D 触发器只在指定时钟边沿保存 D 端的数据。
时序逻辑使用 always @(posedge clk) 和非阻塞赋值 <=。
同步复位必须等待时钟，异步复位不需要等待时钟。
MUX 负责选择数据，DFF 负责保存数据。
阅读电路图时，要先写出每个 D 端的表达式。
```

今天暴露出的主要问题：

- 容易把输出 `q` 忘记声明成 `reg`
- 容易混淆同步复位和异步复位的敏感列表
- 时序逻辑中容易使用阻塞赋值 `=`
- 对向量声明和单个位选择的关系还不够熟练
- 容易把 `byteena[0]` 误写成 `byteena[1]`
- 一个分支中有多条语句时容易漏写 `begin...end`
- 容易把 MUX 的组合逻辑也放进时钟块
- 阅读反馈线和触发器反相输出时需要更加仔细

以后遇到时序逻辑题，可以按照下面的顺序处理：

```text
先找时钟边沿
  ↓
判断是否有复位以及复位类型
  ↓
找出所有需要保存数据的信号
  ↓
写出每个 D 端的输入表达式
  ↓
使用非阻塞赋值 <=
  ↓
最后检查 output reg、begin/end 和位宽
```

后续复习时，应尝试独立完成：

1. 写出一个 8 位上升沿触发的 D 触发器组。
2. 分别写出同步复位和异步复位代码。
3. 解释 `byteena[1]` 与 `byteena[0]` 各控制什么。
4. 根据 MUX 图写出三目运算表达式。
5. 解释为什么 `a <= w; Q <= a;` 中的 `Q` 会读取旧的 `a`。
6. 根据一张包含 D 触发器和反馈线的电路图写出 Verilog。

今天最需要形成的思维是：

**先把组合逻辑算出的“下一个数据”找出来，再让 D 触发器在时钟边沿保存它。**
