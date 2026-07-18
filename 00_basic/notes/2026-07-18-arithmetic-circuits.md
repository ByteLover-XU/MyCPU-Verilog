# Verilog 算术电路学习笔记

**学习日期：2026-07-18**

---

# 第一部分：总体说明

今天学习的主题是 **Verilog 中的组合逻辑算术电路**，内容围绕“加法器”逐步展开：

```text
半加器
  ↓
全加器
  ↓
3 位行波进位加法器
  ↓
有符号数加法溢出
  ↓
100 位二进制加法器
  ↓
4 位 BCD 加法器
```

今天需要建立的核心认识有三点：

1. 全加器计算的是：

   ```text
   a + b + cin
   ```

2. 多位加法器中，前一级的进位输出要连接到后一级的进位输入：

   ```text
   前一级 cout → 后一级 cin
   ```

3. 普通二进制进位、有符号数溢出和 BCD 加法不是同一个问题：

   ```text
   无符号加法：关注最终进位
   有符号加法：关注符号是否异常变化
   BCD 加法：每 4 位表示一个十进制数字
   ```

---

# 第二部分：题目、知识点与过程中出现的错误

## 题目一：半加器

半加器计算两个 1 位二进制数：

```text
a + b
```

输出：

- `sum`：本位结果
- `cout`：向高位产生的进位

逻辑表达式：

```text
sum  = a XOR b
cout = a AND b
```

Verilog 代码：

```verilog
module half_adder (
    input  a,
    input  b,
    output sum,
    output cout
);

    assign sum  = a ^ b;
    assign cout = a & b;

endmodule
```

半加器没有 `cin`，因此只能完成两个 1 位数的相加。

---

## 题目二：全加器

全加器除了计算 `a + b`，还要加上来自低位的进位 `cin`：

```text
a + b + cin
```

逻辑表达式：

```text
sum  = a XOR b XOR cin
cout = (a AND b) OR (cin AND (a XOR b))
```

Verilog 代码：

```verilog
module full_adder (
    input  a,
    input  b,
    input  cin,
    output sum,
    output cout
);

    assign sum  = a ^ b ^ cin;
    assign cout = (a & b) | (cin & (a ^ b));

endmodule
```

**过程中出现的错误：漏写 `assign`**

错误：

```verilog
sum = a ^ b ^ cin;
cout = (a & b) | (cin & (a ^ b));
```

正确：

```verilog
assign sum  = a ^ b ^ cin;
assign cout = (a & b) | (cin & (a ^ b));
```

这里描述的是组合逻辑连续赋值，因此需要使用 `assign`。

---

## 题目三：3 位行波进位加法器

题目要求例化 3 个全加器，完成：

```text
a + b + cin
```

进位关系：

```text
cin
 ↓
第 0 位全加器 → cout[0]
                 ↓
第 1 位全加器 → cout[1]
                 ↓
第 2 位全加器 → cout[2]
```

各位计算关系：

```text
第 0 位：a[0] + b[0] + cin
第 1 位：a[1] + b[1] + cout[0]
第 2 位：a[2] + b[2] + cout[1]
```

正确代码：

```verilog
module top_module (
    input  [2:0] a,
    input  [2:0] b,
    input        cin,
    output [2:0] cout,
    output [2:0] sum
);

    full_adder u0 (
        .a    (a[0]),
        .b    (b[0]),
        .cin  (cin),
        .sum  (sum[0]),
        .cout (cout[0])
    );

    full_adder u1 (
        .a    (a[1]),
        .b    (b[1]),
        .cin  (cout[0]),
        .sum  (sum[1]),
        .cout (cout[1])
    );

    full_adder u2 (
        .a    (a[2]),
        .b    (b[2]),
        .cin  (cout[1]),
        .sum  (sum[2]),
        .cout (cout[2])
    );

endmodule


module full_adder (
    input  a,
    input  b,
    input  cin,
    output sum,
    output cout
);

    assign sum  = a ^ b ^ cin;
    assign cout = (a & b) | (cin & (a ^ b));

endmodule
```

**过程中出现的错误一：最低位 `cin` 被固定为 0**

错误：

```verilog
.cin(1'b0)
```

这样会忽略顶层模块提供的 `cin`。

正确：

```verilog
.cin(cin)
```

**过程中出现的错误二：进位链连接错误**

正确连接方式：

```text
u0 的 cout → u1 的 cin
u1 的 cout → u2 的 cin
```

也就是：

```verilog
u1 的 cin 接 cout[0]
u2 的 cin 接 cout[1]
```

这种进位逐级向高位传播的结构，叫作：

```text
Ripple-Carry Adder
行波进位加法器
```

---

## 题目四：有符号数加法溢出

8 位有符号数的表示范围是：

```text
-128 到 127
```

最高位是符号位：

```text
0：正数或 0
1：负数
```

有符号加法发生溢出的两种情况：

```text
正数 + 正数，结果变成负数
负数 + 负数，结果变成正数
```

可以记成：

> 同号相加，结果变号，就是溢出。

例如：

```text
127 + 1 = 128
```

但 8 位有符号数最大只能表示 127：

```text
  01111111
+ 00000001
----------
  10000000
```

`10000000` 在 8 位补码中表示 `-128`，说明正确结果已经超出表示范围。

推荐代码：

```verilog
module top_module (
    input  [7:0] a,
    input  [7:0] b,
    output [7:0] s,
    output       overflow
);

    assign s = a + b;

    assign overflow =
        (a[7] == b[7]) &&
        (s[7] != a[7]);

endmodule
```

判断逻辑：

```text
a 和 b 的符号相同
并且
结果 s 的符号与输入不同
```

**过程中出现的错误：把最终进位直接当成 `overflow`**

错误理解：

```verilog
assign overflow = cout;
```

最终进位主要用于判断无符号加法是否超出位宽，不能直接表示有符号溢出。

区别：

```text
无符号加法：看最终进位
有符号加法：看符号是否异常变化
```

---

## 题目五：100 位二进制加法器

题目要求计算：

```text
a + b + cin
```

两个 100 位数相加，结果最多需要 101 位。

其中：

```text
cout：最高位进位
sum ：低 100 位结果
```

正确代码：

```verilog
module top_module (
    input  [99:0] a,
    input  [99:0] b,
    input         cin,
    output        cout,
    output [99:0] sum
);

    assign {cout, sum} = a + b + cin;

endmodule
```

这里使用了拼接运算符：

```verilog
{cout, sum}
```

表示：

```text
1 位 cout + 100 位 sum = 101 位完整结果
```

这道题不需要手动例化 100 个全加器。

---

## 题目六：4 位 BCD 加法器

BCD 的全称是：

```text
Binary-Coded Decimal
二进制编码的十进制数
```

每个十进制数字使用 4 位二进制表示。

例如十进制 `1234`：

```text
0001 0010 0011 0100
  1    2    3    4
```

一个合法 BCD 数字只能是：

```text
0000 到 1001
```

也就是十进制 `0` 到 `9`。

16 位 BCD 数据的分组方式：

```text
a[15:12]  a[11:8]  a[7:4]  a[3:0]
 千位       百位      十位     个位
```

加法必须从个位开始：

```text
cin
 ↓
个位 → c1
       ↓
十位 → c2
       ↓
百位 → c3
       ↓
千位 → cout
```

正确代码：

```verilog
module top_module (
    input  [15:0] a,
    input  [15:0] b,
    input         cin,
    output        cout,
    output [15:0] sum
);

    wire c1, c2, c3;

    bcd_fadd u0 (
        .a    (a[3:0]),
        .b    (b[3:0]),
        .cin  (cin),
        .cout (c1),
        .sum  (sum[3:0])
    );

    bcd_fadd u1 (
        .a    (a[7:4]),
        .b    (b[7:4]),
        .cin  (c1),
        .cout (c2),
        .sum  (sum[7:4])
    );

    bcd_fadd u2 (
        .a    (a[11:8]),
        .b    (b[11:8]),
        .cin  (c2),
        .cout (c3),
        .sum  (sum[11:8])
    );

    bcd_fadd u3 (
        .a    (a[15:12]),
        .b    (b[15:12]),
        .cin  (c3),
        .cout (cout),
        .sum  (sum[15:12])
    );

endmodule
```

**过程中出现的错误一：忽略顶层输入 `cin`**

错误：

```verilog
.cin(1'b0)
```

正确：

```verilog
.cin(cin)
```

题目已经给出了 `cin`，最低位 BCD 加法器必须使用它。

**过程中出现的错误二：括号和分号位置错误**

错误：

```verilog
.sum(sum[3:0]);
```

正确：

```verilog
.sum(sum[3:0])
);
```

也可以写成：

```verilog
.sum(sum[3:0]));
```

模块例化格式：

```verilog
模块名 实例名 (
    .端口名(连接信号)
);
```

必须先关闭端口连接括号，再关闭整个模块例化。

---

# 第三部分：总结与反思

今天已经掌握或接触了：

- 半加器与全加器
- 全加器逻辑表达式
- 模块例化
- 行波进位结构
- 多位二进制加法
- 有符号数加法溢出
- 拼接运算符
- BCD 编码与 BCD 加法器

今天最重要的结论是：

```text
全加器计算 a + b + cin。
前一级 cout 连接后一级 cin。
同号相加结果变号，说明有符号溢出。
普通二进制加法可以使用 {cout, sum} 接收完整结果。
BCD 每 4 位表示一个十进制数字。
```

今天暴露出的主要问题：

- 容易忽略题目已经提供的输入端口
- 对模块之间的进位连接还不够熟练
- 容易混淆 `cout` 和 `overflow`
- 模块例化时容易写错括号和分号
- 组合逻辑赋值容易漏写 `assign`

以后遇到模块例化题，可以按照下面的顺序处理：

```text
先看输入和输出
  ↓
判断每个模块负责哪一部分
  ↓
画出信号连接关系
  ↓
确定最低位和最高位
  ↓
再写模块例化代码
  ↓
最后检查括号、逗号和分号
```

后续复习时，应尝试独立完成：

1. 写出一个全加器。
2. 画出 3 位行波进位加法器。
3. 解释 `cout` 与 `overflow` 的区别。
4. 写出 `{cout, sum} = a + b + cin`。
5. 连接 4 个 `bcd_fadd`。

今天最需要形成的思维是：

> 先理解信号从哪里来、到哪里去，再把连接关系写成 Verilog。
