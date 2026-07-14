# Verilog `always`、`case` 与优先编码器学习笔记

日期：2026-07-14  
当前阶段：Verilog 入门——组合逻辑的过程化描述

## 一、今天学习了什么

今天主要学习了以下内容：

1. `always @(*)` 组合逻辑块
2. `assign` 与 `always` 的区别
3. `wire` 与 `reg` 的使用规则
4. `if-else` 与二选一多路选择器
5. 按位与 `&` 和逻辑与 `&&`
6. 组合逻辑中锁存器 `latch` 的产生原因
7. 使用完整分支或默认值避免锁存器
8. `case` 语句的基本语法
9. 使用 `case` 实现多路选择器和译码器
10. 优先编码器的含义与优先级
11. `casez`、通配符 `z` 和 `?`
12. 使用 `casez` 实现 8 位优先编码器
13. 使用默认赋值实现 PS/2 方向键扫描码译码器
14. 组合逻辑不会自动保存上一次输出

---

## 二、`always` 过程块

Verilog 中常见的两类 `always` 块是：

```verilog
// 组合逻辑
always @(*) begin
    ...
end

// 时序逻辑
always @(posedge clk) begin
    ...
end
```

### 1. `always @(*)`

`always @(*)` 用于描述组合逻辑。

```verilog
always @(*) begin
    out = a & b;
end
```

其中 `(*)` 表示：只要代码块中读取的任意输入信号发生变化，就重新计算输出。

组合逻辑的典型特点：

- 没有时钟；
- 当前输出只由当前输入决定；
- 不应该记住以前的状态；
- 一般使用阻塞赋值 `=`。

### 2. 时钟触发的 `always`

```verilog
always @(posedge clk) begin
    q <= d;
end
```

这段代码在时钟上升沿更新 `q`，通常会综合出触发器或寄存器。

时序逻辑一般使用非阻塞赋值 `<=`。

---

## 三、`assign` 与 `always @(*)`

下面两种写法可以描述相同的组合逻辑：

```verilog
assign out1 = a & b | c ^ d;
```

```verilog
always @(*) begin
    out2 = a & b | c ^ d;
end
```

它们最终都可以综合成一组组合逻辑门。

### 使用场景

简单表达式通常使用 `assign`：

```verilog
assign y = a & b;
```

需要使用 `if`、`case` 等过程语句时，通常使用 `always @(*)`：

```verilog
always @(*) begin
    if (sel)
        y = b;
    else
        y = a;
end
```

---

## 四、`wire` 与 `reg`

在 Verilog-2001 中：

- 被 `assign` 驱动的信号通常声明为 `wire`；
- 在 `always` 块中被赋值的信号必须声明为 `reg`。

```verilog
module top_module (
    input  a,
    input  b,
    output wire out_assign,
    output reg  out_always
);

    assign out_assign = a & b;

    always @(*) begin
        out_always = a & b;
    end

endmodule
```

注意：`reg` 只是 Verilog 的变量类型，不代表一定综合出寄存器。

```verilog
always @(*) begin
    out_always = a & b;
end
```

虽然 `out_always` 声明为 `reg`，但这仍然只是组合逻辑。

是否产生寄存器，主要取决于是否使用时钟以及是否需要保存状态。

---

## 五、`if-else` 与二选一多路选择器

一个完整的组合逻辑 `if-else` 通常对应一个二选一多路选择器。

```verilog
always @(*) begin
    if (condition)
        out = x;
    else
        out = y;
end
```

等价于条件运算符：

```verilog
assign out = condition ? x : y;
```

含义是：

- `condition = 1` 时选择 `x`；
- `condition = 0` 时选择 `y`。

### 练习：两个选择信号同时为 1 时选择 `b`

```verilog
module top_module (
    input  a,
    input  b,
    input  sel_b1,
    input  sel_b2,
    output wire out_assign,
    output reg  out_always
);

    assign out_assign = (sel_b1 && sel_b2) ? b : a;

    always @(*) begin
        if (sel_b1 && sel_b2)
            out_always = b;
        else
            out_always = a;
    end

endmodule
```

也可以先设置默认值：

```verilog
always @(*) begin
    out_always = a;

    if (sel_b1 && sel_b2)
        out_always = b;
end
```

---

## 六、按位与 `&` 和逻辑与 `&&`

### 1. `&`：按位与

对两个向量的对应位分别进行与运算。

```verilog
4'b1100 & 4'b1010   // 结果：4'b1000
```

适合处理位向量和总线。

### 2. `&&`：逻辑与

先判断两边整体是否为真，结果只有 1 位。

```verilog
4'b1100 && 4'b0010  // 两边都非零，结果为 1'b1
4'b0000 && 4'b1010  // 左边为零，结果为 1'b0
```

### 3. 在条件判断中的选择

在 `if` 条件中，一般使用逻辑与：

```verilog
if (sel_b1 && sel_b2)
```

记忆：

- `&`：每一位分别相与；
- `&&`：两个条件同时成立。

### 4. 缩位与

`&` 还可以作为一元运算符：

```verilog
&4'b1111   // 结果为 1
&4'b1101   // 结果为 0
```

只有向量中的每一位都是 1，缩位与结果才是 1。

---

## 七、锁存器 `latch` 是怎样产生的

组合逻辑要求输出在每一种输入情况下都有确定值。

下面代码存在问题：

```verilog
always @(*) begin
    if (cpu_overheated)
        shut_off_computer = 1'b1;
end
```

代码只规定了 `cpu_overheated = 1` 时的输出，却没有规定 `cpu_overheated = 0` 时输出是多少。

综合工具只能把未赋值理解为：

```text
保持上一次的值
```

要保持上一次的值，电路就需要记忆功能，因此会产生锁存器。

### 正确写法一：补全 `else`

```verilog
always @(*) begin
    if (cpu_overheated)
        shut_off_computer = 1'b1;
    else
        shut_off_computer = 1'b0;
end
```

### 正确写法二：先设置默认值

```verilog
always @(*) begin
    shut_off_computer = 1'b0;

    if (cpu_overheated)
        shut_off_computer = 1'b1;
end
```

两种写法都保证输出在所有条件下得到赋值。

### 行驶控制示例

只有“尚未到达”并且“油箱不空”时继续行驶：

```verilog
always @(*) begin
    keep_driving = (~arrived) & (~gas_tank_empty);
end
```

也可以写成：

```verilog
always @(*) begin
    if (~arrived)
        keep_driving = ~gas_tank_empty;
    else
        keep_driving = 1'b0;
end
```

核心规则：

> 在组合逻辑中，每一个输出必须在所有可能路径上被赋值。

---

## 八、`case` 语句

`case` 适合对一个表达式的多个可能取值进行选择，相当于一串 `if-else if-else`。

基本格式：

```verilog
always @(*) begin
    case (sel)
        2'b00: out = a;
        2'b01: out = b;
        2'b10: out = c;
        default: out = d;
    endcase
end
```

### 语法要点

1. 使用 `case (表达式)`，没有 C 语言中的 `switch`；
2. 每个匹配值后面使用冒号 `:`；
3. 不需要写 `break`；
4. 一个分支有多条语句时，使用 `begin ... end`；
5. 使用 `endcase` 结束整个 `case`；
6. `case` 后面不能直接加 `begin`。

错误：

```verilog
case (sel) begin
```

正确：

```verilog
case (sel)
```

### 多条语句

```verilog
case (sel)
    2'b00: begin
        out  = a;
        flag = 1'b1;
    end

    default: begin
        out  = 1'b0;
        flag = 1'b0;
    end
endcase
```

---

## 九、使用 `case` 实现 6 选 1 多路选择器

当 `sel` 为 0 到 5 时，选择对应数据；其他情况输出 0。

```verilog
always @(*) begin
    case (sel)
        3'd0: out = data0;
        3'd1: out = data1;
        3'd2: out = data2;
        3'd3: out = data3;
        3'd4: out = data4;
        3'd5: out = data5;
        default: out = 4'b0000;
    endcase
end
```

`3'd5` 表示：

- 位宽是 3 位；
- 使用十进制；
- 数值是 5。

`default` 可以覆盖未列出的输入，防止锁存器。

---

## 十、优先编码器

优先编码器用于在输入向量中寻找第一个为 1 的位，并输出它的位置编号。

本次题目规定：从最低位开始寻找。

对于 4 位输入：

```text
in[0] 的优先级最高
in[1] 次之
in[2] 次之
in[3] 最低
```

例如：

```text
in = 4'b1010
```

`in[1]` 和 `in[3]` 都是 1，但从最低位开始寻找时，先遇到 `in[1]`，所以输出：

```text
pos = 2'd1
```

### 使用 `if-else` 实现

```verilog
always @(*) begin
    if (in[0])
        pos = 2'd0;
    else if (in[1])
        pos = 2'd1;
    else if (in[2])
        pos = 2'd2;
    else if (in[3])
        pos = 2'd3;
    else
        pos = 2'd0;
end
```

`if-else if` 的检查顺序体现了优先级。

---

## 十一、`casez` 与无关位

8 位输入一共有 256 种组合，若使用普通 `case` 全部列出会非常繁琐。

`casez` 允许使用通配符来表示“不关心这一位”。

```verilog
casez (in)
    8'b???????1: ...
endcase
```

其中 `?` 表示这一位可以是 0，也可以是 1。

在 `casez` 的匹配项中，`z` 也可以作为无关位：

```verilog
8'bzzzzzzz1
```

它与下面写法作用相同：

```verilog
8'b???????1
```

### 示例

```verilog
4'bzzz1
```

可以匹配所有最低位为 1 的输入，例如：

```text
0001
0011
0101
1111
```

---

## 十二、使用 `casez` 实现 8 位优先编码器

题目要求寻找最低有效位中的第一个 1。

```verilog
module top_module (
    input      [7:0] in,
    output reg [2:0] pos
);

    always @(*) begin
        casez (in)
            8'b???????1: pos = 3'd0;
            8'b??????10: pos = 3'd1;
            8'b?????100: pos = 3'd2;
            8'b????1000: pos = 3'd3;
            8'b???10000: pos = 3'd4;
            8'b??100000: pos = 3'd5;
            8'b?1000000: pos = 3'd6;
            8'b10000000: pos = 3'd7;
            default:     pos = 3'd0;
        endcase
    end

endmodule
```

### 为什么推荐这种不重叠写法

例如：

```verilog
8'b??????10
```

表示：

- `in[0] = 0`；
- `in[1] = 1`；
- 更高位不关心。

因此它明确表示第一个 1 位于 `in[1]`。

如果写成：

```verilog
8'b??????1?
```

那么它可能和其他分支同时匹配，结果会依赖分支排列顺序。

使用不重叠的匹配模式更加清晰，也不容易写错。

### 本次练习中的易错点

1. `casez (in)` 后面不能写 `begin`；
2. `in[0]` 的位置编号是 `0`，不是 `1`；
3. 8 位输入应覆盖 `in[0]` 到 `in[7]`；
4. 不要漏掉 `in[6]` 对应的分支；
5. `pos` 需要 3 位，才能表示 0 到 7；
6. 必须提供 `default` 或在 `casez` 前先给 `pos` 默认值。

---

## 十三、`case`、`casez` 与 `casex`

| 语句 | 匹配规则 |
|---|---|
| `case` | 每一位严格匹配，包括 `x` 和 `z` |
| `casez` | 将模式中的 `z` 或 `?` 当作无关位 |
| `casex` | 将 `x` 和 `z` 都当作无关位 |

一般建议：

- 普通多路选择使用 `case`；
- 需要通配符时使用 `casez`；
- 谨慎使用 `casex`，因为它可能掩盖未知值 `x`，使仿真错误不容易被发现。

---

## 十四、PS/2 方向键扫描码译码器

题目背景是：使用 PS/2 键盘控制游戏，根据最近收到的两个扫描码字节识别方向键。

| 16 位扫描码 | 方向键 |
|---|---|
| `16'hE06B` | 左 |
| `16'hE072` | 下 |
| `16'hE074` | 右 |
| `16'hE075` | 上 |
| 其他值 | 没有方向键 |

电路有一个 16 位输入和四个输出：

```verilog
input [15:0] scancode;
output reg up;
output reg down;
output reg left;
output reg right;
```

### 推荐写法：先给所有输出默认值

```verilog
always @(*) begin
    up    = 1'b0;
    down  = 1'b0;
    left  = 1'b0;
    right = 1'b0;

    case (scancode)
        16'hE06B: left  = 1'b1;
        16'hE072: down  = 1'b1;
        16'hE074: right = 1'b1;
        16'hE075: up    = 1'b1;
    endcase
end
```

这种写法有两个优点：

1. 所有输出在任何情况下都有值，不会产生锁存器；
2. 每个 `case` 分支只需要把对应方向改成 1，减少重复代码。

由于 `case` 之前已经设置了默认值，所以即使没有写 `default`，未匹配时四个输出仍然都是 0。

也可以显式写出空的默认分支：

```verilog
default: ;
```

但不是必须的。

---

## 十五、`case` 结束后输出会不会一直保持为 1

组合逻辑不会因为一次匹配完成就自动保存 1。

```verilog
always @(*) begin
    left = 1'b0;

    case (scancode)
        16'hE06B: left = 1'b1;
    endcase
end
```

输出关系是：

```text
scancode = 16'hE06B  → left = 1
scancode = 16'h1234  → left = 0
```

如果 `scancode` 一直保持 `16'hE06B`，那么 `left` 也会一直为 1。

这不是 `case` 保存了输出，而是因为输入条件一直成立。

只有寄存器、触发器或锁存器等时序/存储电路才能保存状态。

---

## 十六、硬件描述语言与普通程序的区别

下面代码看起来像是“先赋 0，再改成 1”：

```verilog
always @(*) begin
    up = 1'b0;

    if (scancode == 16'hE075)
        up = 1'b1;
end
```

但综合后的硬件不会像 CPU 执行软件一样，一行一行长期运行。

综合工具会根据这段描述建立一个等价组合电路：

```text
up = 1 当且仅当 scancode == 16'hE075
```

过程语句的书写顺序用于描述优先关系和覆盖关系，最终结果仍然是实际的逻辑门电路。

---

## 十七、今天最重要的规则

### 规则 1：组合逻辑使用完整赋值

```verilog
always @(*) begin
    // 所有输出必须在所有路径上有值
end
```

### 规则 2：复杂组合逻辑可以先设置默认值

```verilog
always @(*) begin
    out = default_value;

    if (condition)
        out = another_value;
end
```

### 规则 3：简单表达式优先使用 `assign`

```verilog
assign out = condition ? x : y;
```

### 规则 4：组合逻辑使用 `=`，时序逻辑使用 `<=`

```verilog
always @(*)
    out = expression;

always @(posedge clk)
    q <= d;
```

### 规则 5：`case` 使用 `endcase`，不是 `end`

```verilog
case (sel)
    ...
endcase
```

### 规则 6：优先编码器的顺序代表优先级

寻找最低位第一个 1 时，应先检查 `in[0]`，再检查更高位。

---

## 十八、今日总结

今天从简单的 `always @(*)` 开始，进一步学习了如何使用 `if`、`case` 和 `casez` 描述组合逻辑。

最核心的理解是：

1. Verilog 代码描述的是电路，不是普通软件执行流程；
2. `assign` 和 `always @(*)` 都可以描述组合逻辑；
3. `if` 通常对应多路选择器；
4. `case` 适合多分支选择；
5. `casez` 适合具有无关位的匹配；
6. 优先编码器通过分支顺序或不重叠模式体现优先级；
7. 组合逻辑中若输出没有在所有情况下赋值，就可能意外产生锁存器；
8. 给所有输出先设置默认值，是编写组合逻辑时非常实用的习惯。
