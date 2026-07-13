# Verilog 模块例化与加法器层次设计学习笔记

> 日期：2026-07-13  
> 当前阶段：Verilog 入门——模块层次、端口连接与组合电路设计

## 一、今天学习了什么

今天主要学习了以下内容：

1. 模块例化与层次化设计
2. 按位置连接和按名称连接端口
3. 使用多个 D 触发器构成移位寄存器
4. 8 位向量端口与多路选择器
5. 使用两个 `add16` 构成 32 位加法器
6. 使用 `add1` 全加器实现两层模块层次
7. 进位选择加法器 Carry-Select Adder
8. 使用异或门构成加减法器
9. 模块例化中常见的语法错误和连接错误

---

## 二、模块例化

### 1. 什么是模块例化

Verilog 可以把一个较大的电路拆成多个小模块，再在顶层模块中调用这些小模块。

假设题目已经提供：

```verilog
module mod_a (
    input  in1,
    input  in2,
    output out
);
```

在顶层模块中使用它：

```verilog
module top_module (
    input  a,
    input  b,
    output out
);

    mod_a u1 (
        .in1(a),
        .in2(b),
        .out(out)
    );

endmodule
```

其中：

- `mod_a`：被调用的模块名
- `u1`：实例名，可以自己命名，但同一模块内不能重复
- `.in1(a)`：把顶层信号 `a` 连接到子模块端口 `in1`

按名称连接的一般格式：

```verilog
模块名 实例名 (
    .子模块端口名(当前模块中的信号名)
);
```

---

### 2. 模块不能嵌套定义

错误写法：

```verilog
module top_module (...);

    module mod_a (...);
    endmodule

endmodule
```

Verilog 不允许在一个模块内部再定义另一个模块。

正确结构：

```verilog
module top_module (...);
    // 例化其他模块
endmodule

module add1 (...);
    // 另一个模块的定义
endmodule
```

多个模块应当并列定义，而不是嵌套定义。

---

## 三、模块端口的两种连接方式

### 1. 按位置连接

```verilog
mod_a u1 (a, b, out);
```

连接顺序必须严格对应模块声明中的端口顺序。

若模块声明是：

```verilog
module mod_a (
    input  in1,
    input  in2,
    output out
);
```

则：

```text
a   → in1
b   → in2
out → out
```

优点是代码较短，缺点是容易因为顺序错误而接错。

---

### 2. 按名称连接

```verilog
mod_a u1 (
    .in1(a),
    .in2(b),
    .out(out)
);
```

按名称连接时，书写顺序可以改变：

```verilog
mod_a u1 (
    .out(out),
    .in2(b),
    .in1(a)
);
```

因为编译器根据端口名匹配，而不是根据位置匹配。

实际学习和项目中优先使用按名称连接，可读性更高，也不容易接错。

---

## 四、三级移位寄存器

题目提供一个 D 触发器模块：

```verilog
module my_dff (
    input  clk,
    input  d,
    output q
);
```

需要例化三个，并首尾相连：

```text
d → 第一级 → 第二级 → 第三级 → q
```

代码：

```verilog
module top_module (
    input  clk,
    input  d,
    output q
);

    wire q0;
    wire q1;

    my_dff u1 (
        .clk(clk),
        .d(d),
        .q(q0)
    );

    my_dff u2 (
        .clk(clk),
        .d(q0),
        .q(q1)
    );

    my_dff u3 (
        .clk(clk),
        .d(q1),
        .q(q)
    );

endmodule
```

### 易错点

如果写成：

```verilog
wire q0, q1, q2;

my_dff u3 (
    .clk(clk),
    .d(q1),
    .q(q2)
);
```

而没有把 `q2` 再连接给顶层输出 `q`，那么真正的输出 `q` 会悬空。

最直接的写法是让最后一级直接输出到 `q`：

```verilog
.q(q)
```

---

## 五、8 位三级移位寄存器与四选一多路选择器

题目提供：

```verilog
module my_dff8 (
    input        clk,
    input  [7:0] d,
    output [7:0] q
);
```

每个 `my_dff8` 相当于一组 8 位寄存器。

串联三个以后：

```text
d → q1 → q2 → q3
```

使用 `sel[1:0]` 选择不同延迟的输出：

| `sel` | 输出 | 延迟 |
|---|---|---|
| `2'b00` | `d` | 0 个时钟周期 |
| `2'b01` | `q1` | 1 个时钟周期 |
| `2'b10` | `q2` | 2 个时钟周期 |
| `2'b11` | `q3` | 3 个时钟周期 |

完整代码：

```verilog
module top_module (
    input        clk,
    input  [7:0] d,
    input  [1:0] sel,
    output reg [7:0] q
);

    wire [7:0] q1;
    wire [7:0] q2;
    wire [7:0] q3;

    my_dff8 u1 (
        .clk(clk),
        .d(d),
        .q(q1)
    );

    my_dff8 u2 (
        .clk(clk),
        .d(q1),
        .q(q2)
    );

    my_dff8 u3 (
        .clk(clk),
        .d(q2),
        .q(q3)
    );

    always @(*) begin
        case (sel)
            2'b00: q = d;
            2'b01: q = q1;
            2'b10: q = q2;
            2'b11: q = q3;
        endcase
    end

endmodule
```

因为 `q` 在 `always` 块中被赋值，所以应声明为：

```verilog
output reg [7:0] q
```

也可以用连续赋值：

```verilog
assign q = (sel == 2'b00) ? d  :
           (sel == 2'b01) ? q1 :
           (sel == 2'b10) ? q2 :
                            q3;
```

此时 `q` 不需要声明为 `reg`。

---

## 六、使用两个 16 位加法器构成 32 位加法器

题目提供：

```verilog
module add16 (
    input  [15:0] a,
    input  [15:0] b,
    input         cin,
    output [15:0] sum,
    output        cout
);
```

32 位加法可以拆成：

```text
低 16 位相加
      ↓ 进位
高 16 位相加
```

代码：

```verilog
module top_module (
    input  [31:0] a,
    input  [31:0] b,
    output [31:0] sum
);

    wire carry;

    add16 u_low (
        .a   (a[15:0]),
        .b   (b[15:0]),
        .cin (1'b0),
        .sum (sum[15:0]),
        .cout(carry)
    );

    add16 u_high (
        .a   (a[31:16]),
        .b   (b[31:16]),
        .cin (carry),
        .sum (sum[31:16]),
        .cout()
    );

endmodule
```

### 关键连接

低位加法器：

```verilog
.cin(1'b0)
.cout(carry)
```

高位加法器：

```verilog
.cin(carry)
```

高位加法器最终产生的 `cout` 题目不需要，可以留空：

```verilog
.cout()
```

---

### 位选择的正确写法

错误：

```verilog
.a([15:0]a)
```

正确：

```verilog
.a(a[15:0])
```

一般格式：

```text
信号名[最高位:最低位]
```

---

## 七、两层模块层次与 1 位全加器

这一题的层次结构是：

```text
top_module
├── add16
│   └── add1 × 16
└── add16
    └── add1 × 16
```

其中：

- `top_module`：需要编写
- `add16`：题目提供
- `add1`：需要编写

### 1 位全加器

全加器计算：

```text
a + b + cin
```

输出：

- `sum`：当前位的和
- `cout`：向下一位传递的进位

逻辑表达式：

```verilog
assign sum  = a ^ b ^ cin;
assign cout = (a & b) | (a & cin) | (b & cin);
```

完整代码：

```verilog
module add1 (
    input  a,
    input  b,
    input  cin,
    output sum,
    output cout
);

    assign sum  = a ^ b ^ cin;
    assign cout = (a & b) | (a & cin) | (b & cin);

endmodule
```

最终提交中，`top_module` 和 `add1` 应当并列：

```verilog
module top_module (...);
    // 例化两个 add16
endmodule

module add1 (...);
    // 全加器逻辑
endmodule
```

只需要定义一次 `add1`，题目提供的 `add16` 会自动例化它。

---

## 八、模块不能在 `always` 或 `case` 中例化

错误写法：

```verilog
always @(*) begin
    case (carry)
        1'b0: add16 u2 (...);
        1'b1: add16 u3 (...);
    endcase
end
```

模块例化代表实际存在的一块硬件，必须在电路生成时固定下来。

因此模块实例不能放在以下过程结构中：

- `always`
- `if`
- `case`
- 过程型 `for`

正确思路是：

1. 先把需要的模块全部例化出来；
2. 再用多路选择器选择模块输出。

---

## 九、进位选择加法器

普通串行进位加法器中，高 16 位必须等待低 16 位产生进位，速度较慢。

进位选择加法器的思路是：

1. 低 16 位正常计算；
2. 高 16 位假设 `cin=0`，提前算一份；
3. 高 16 位假设 `cin=1`，再提前算一份；
4. 等低位进位产生后，选择正确结果。

结构：

```text
                    ┌→ 高位结果0：假设 cin=0
低16位产生 carry ──┤
                    └→ 高位结果1：假设 cin=1

carry 决定选择哪一个高位结果
```

代码：

```verilog
module top_module (
    input  [31:0] a,
    input  [31:0] b,
    output [31:0] sum
);

    wire carry;
    wire [15:0] high_sum0;
    wire [15:0] high_sum1;

    add16 u_low (
        .a   (a[15:0]),
        .b   (b[15:0]),
        .cin (1'b0),
        .sum (sum[15:0]),
        .cout(carry)
    );

    add16 u_high0 (
        .a   (a[31:16]),
        .b   (b[31:16]),
        .cin (1'b0),
        .sum (high_sum0),
        .cout()
    );

    add16 u_high1 (
        .a   (a[31:16]),
        .b   (b[31:16]),
        .cin (1'b1),
        .sum (high_sum1),
        .cout()
    );

    assign sum[31:16] = carry ? high_sum1 : high_sum0;

endmodule
```

三目运算符：

```verilog
条件 ? 条件为真时的值 : 条件为假时的值
```

因此：

```verilog
carry ? high_sum1 : high_sum0
```

表示：

- `carry=1`：选择 `high_sum1`
- `carry=0`：选择 `high_sum0`

---

## 十、32 位加减法器

补码减法原理：

```text
a - b = a + (~b) + 1
```

所以要实现加减法切换，需要：

1. `sub=0` 时，`b` 保持不变，最低位进位为 `0`
2. `sub=1` 时，`b` 按位取反，最低位进位为 `1`

---

### 1. 为什么使用异或门

异或门有以下规律：

```text
x ^ 0 = x
x ^ 1 = ~x
```

因此异或门可以当作受控反相器：

| `sub` | `b ^ sub` 的效果 |
|---|---|
| `0` | `b` 不变 |
| `1` | `b` 取反 |

对于 32 位的 `b`：

```verilog
assign b_modified = b ^ {32{sub}};
```

复制运算符：

```verilog
{32{sub}}
```

表示把 `sub` 复制 32 次。

当 `sub=0`：

```text
b ^ 32'b000...000 = b
```

当 `sub=1`：

```text
b ^ 32'b111...111 = ~b
```

---

### 2. 完整加减法器

```verilog
module top_module (
    input  [31:0] a,
    input  [31:0] b,
    input         sub,
    output [31:0] sum
);

    wire [31:0] b_modified;
    wire carry;

    assign b_modified = b ^ {32{sub}};

    add16 u_low (
        .a   (a[15:0]),
        .b   (b_modified[15:0]),
        .cin (sub),
        .sum (sum[15:0]),
        .cout(carry)
    );

    add16 u_high (
        .a   (a[31:16]),
        .b   (b_modified[31:16]),
        .cin (carry),
        .sum (sum[31:16]),
        .cout()
    );

endmodule
```

运算规律：

| `sub` | 实际计算 |
|---|---|
| `0` | `a + b + 0` |
| `1` | `a + ~b + 1 = a - b` |

注意：

- 只有低 16 位加法器的 `cin` 直接接 `sub`
- 高 16 位加法器的 `cin` 必须接低位产生的 `carry`

---

## 十一、今天遇到的典型错误

### 错误 1：重复定义题目已提供的模块

如果题目明确说某个模块已经提供，只需要例化它，不要再次定义。

---

### 错误 2：在模块内部定义另一个模块

```verilog
module top_module (...);
    module add1 (...);   // 错误
    endmodule
endmodule
```

模块应并列定义。

---

### 错误 3：最后一级没有连接到顶层输出

内部信号虽然有结果，但如果没有连接到顶层输出，测试仍然会失败。

---

### 错误 4：中间连线没有声明

例如：

```verilog
wire carry;
wire [15:0] high_sum0;
wire [15:0] high_sum1;
```

模块之间传递数据时，需要使用内部连线。

---

### 错误 5：多个模块同时驱动同一个信号

错误示例：

```verilog
add16 u1 (..., .sum(sum[31:16]), ...);
add16 u2 (..., .sum(sum[31:16]), ...);
```

两个模块不能同时直接输出到同一根信号。

应先分别输出到内部信号，再通过多路选择器选择：

```verilog
assign sum[31:16] = carry ? high_sum1 : high_sum0;
```

---

### 错误 6：模块例化写在 `always` 或 `case` 里面

模块实例必须固定存在，不能由过程语句临时创建或删除。

---

### 错误 7：高位输入没有真正参与运算

如果编译器提示：

```text
No output dependent on input pin a[17]
```

说明某些输入位没有影响任何输出，通常是：

- 高位端口接错
- 高位结果未连接
- 多路选择器输出写错
- 某部分信号被固定为常量

---

## 十二、今天最重要的理解

### 1. Verilog 描述的是硬件连接

模块例化不是普通编程语言中的“调用函数”，而是在电路中放置一块真实硬件。

---

### 2. 端口连接就是接线

```verilog
.in1(a)
```

表示把当前模块中的信号 `a` 接到子模块端口 `in1`。

---

### 3. 层次化设计可以逐级搭建复杂电路

```text
1 位全加器 add1
        ↓
16 位加法器 add16
        ↓
32 位加法器 top_module
        ↓
加减法器、进位选择加法器
```

复杂数字电路通常不是一次写完，而是由较小、可复用的模块逐级组合。

---

### 4. 控制信号通常通过选择器或门电路改变数据通路

今天的两个典型例子：

```verilog
assign sum[31:16] = carry ? high_sum1 : high_sum0;
```

用 `carry` 控制多路选择器。

```verilog
assign b_modified = b ^ {32{sub}};
```

用 `sub` 控制 `b` 是否取反。

---

## 十三、下一步需要巩固

1. 独立写出按名称连接的模块例化
2. 熟练声明模块间的 `wire`
3. 分清顶层端口、子模块端口和内部信号
4. 独立画出三级移位寄存器的数据流
5. 手算全加器的 `sum` 和 `cout`
6. 理解串行进位与进位选择加法器的速度差异
7. 继续练习 `always @(*)`、`case` 和多路选择器
