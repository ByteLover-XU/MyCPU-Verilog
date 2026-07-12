# Verilog 向量与运算符学习笔记

> 日期：2026-07-12  
> 当前阶段：Verilog 入门——组合逻辑与向量操作

## 一、今天学习了什么

今天主要学习了以下内容：

1. Verilog 模块的基本结构与连续赋值 `assign`
2. 向量的声明、位选择和部分选择
3. 按位运算、逻辑运算和归约运算的区别
4. 拼接运算符 `{}` 的使用
5. 复制运算符 `{次数{内容}}` 的使用
6. 位顺序反转
7. 零扩展与符号扩展
8. 异或和同或
9. 使用拼接、复制和同或完成批量比较

---

## 二、Verilog 模块基本结构

一个简单的组合逻辑模块通常写成：

```verilog
module top_module(
    input  a,
    input  b,
    output out
);

    assign out = a & b;

endmodule
```

### 需要注意

- `module` 后面写模块名。
- 端口之间使用逗号分隔。
- 端口声明结束后只写一次 `);`。
- 每条 `assign` 语句末尾必须有分号。
- 模块最后使用 `endmodule` 结束。
- `endmodule` 后面不加分号。

### `assign` 的作用

```verilog
assign out = a & b;
```

表示 `out` 始终由右边的组合逻辑表达式驱动。

只要输入变化，输出就会自动重新计算。

---

## 三、向量 Vector

### 1. 向量声明

```verilog
input  [2:0] a;
output [5:0] out;
```

含义：

```text
a   包含 a[2]、a[1]、a[0]，共 3 位
out 包含 out[5] 到 out[0]，共 6 位
```

位宽计算方法：

```text
位宽 = 最高下标 - 最低下标 + 1
```

例如：

```verilog
input [7:0] in;
```

位宽为：

```text
7 - 0 + 1 = 8 位
```

其中：

- `in[7]` 是最高位
- `in[0]` 是最低位

---

### 2. 位选择 Bit Select

选择向量中的某一位：

```verilog
a[2]
```

例如：

```text
a = 3'b101
```

则：

```text
a[2] = 1
a[1] = 0
a[0] = 1
```

---

### 3. 部分选择 Part Select

选择向量中连续的若干位：

```verilog
data[7:4]
```

表示取出 `data` 的高 4 位。

```verilog
data[3:0]
```

表示取出 `data` 的低 4 位。

一般格式：

```verilog
向量名[最高位:最低位]
```

---

## 四、按位运算与逻辑运算

这是今天最容易混淆的知识点之一。

### 1. 按位或 `|`

```verilog
assign out_or_bitwise = a | b;
```

假设 `a` 和 `b` 都是 3 位，则每一位分别进行或运算：

```text
out[2] = a[2] | b[2]
out[1] = a[1] | b[1]
out[0] = a[0] | b[0]
```

例如：

```text
a = 101
b = 011

a | b = 111
```

输出仍然是 3 位。

---

### 2. 逻辑或 `||`

```verilog
assign out_or_logical = a || b;
```

逻辑运算会把整个向量看成一个真假值：

- 全部为 `0`：假
- 只要不是全 `0`：真

例如：

```text
a = 100  → 真
b = 001  → 真

a || b = 1
```

逻辑或的输出通常只有 1 位。

---

### 3. 按位取反 `~`

```verilog
assign out = ~a;
```

每一位分别取反：

```text
a  = 101
~a = 010
```

---

### 4. 逻辑非 `!`

```verilog
assign out = !a;
```

它判断的是整个向量是否为零：

```text
a = 000  → !a = 1
a = 101  → !a = 0
```

---

### 5. 对比总结

| 写法 | 含义 | 输出特点 |
|---|---|---|
| `a | b` | 按位或 | 与输入位宽相同 |
| `a || b` | 逻辑或 | 通常为 1 位 |
| `~a` | 每一位取反 | 与输入位宽相同 |
| `!a` | 判断整个向量是否为零 | 1 位 |
| `a ^ b` | 按位异或 | 不同为 1 |
| `a ~^ b` | 按位同或 | 相同为 1 |

---

## 五、归约运算符 Reduction Operator

当运算符前面只有一个向量时，它会把向量中的所有位运算成一个结果。

假设：

```verilog
input [3:0] in;
```

### 1. 归约与

```verilog
assign out_and = &in;
```

等价于：

```verilog
assign out_and = in[3] & in[2] & in[1] & in[0];
```

只有当 `in = 4'b1111` 时，输出才为 `1`。

---

### 2. 归约或

```verilog
assign out_or = |in;
```

等价于：

```verilog
assign out_or = in[3] | in[2] | in[1] | in[0];
```

只要有一位为 `1`，输出就为 `1`。

---

### 3. 归约异或

```verilog
assign out_xor = ^in;
```

等价于：

```verilog
assign out_xor = in[3] ^ in[2] ^ in[1] ^ in[0];
```

规律：

- `1` 的个数为奇数，输出为 `1`
- `1` 的个数为偶数，输出为 `0`

---

### 4. 按位运算与归约运算的区别

```verilog
a & b
```

有两个操作数，是按位与。

```verilog
&in
```

只有一个操作数，是归约与。

---

## 六、拼接运算符 `{}`

拼接运算符用于把多个较小的向量连接成一个更大的向量。

```verilog
{a, b}
```

最重要的规则：

> 拼接表达式中，左边放高位，右边放低位。

例如：

```verilog
a = 3'b101;
b = 2'b11;
```

则：

```verilog
{a, b} = 5'b10111;
```

这里不是加法，而是把二进制位直接连接起来。

---

### 1. 拼接写在赋值右边

```verilog
assign out = {a, b};
```

假设 `a` 和 `b` 各 4 位，`out` 为 8 位，则：

```text
out[7:4] = a
out[3:0] = b
```

---

### 2. 拼接写在赋值左边

```verilog
assign {a, b} = in;
```

假设 `a` 和 `b` 各 4 位，`in` 为 8 位，则：

```text
a = in[7:4]
b = in[3:0]
```

左边靠前的变量接收高位，靠后的变量接收低位。

---

### 3. 拼接并拆分多个向量

六个 5 位输入一共有 30 位：

```verilog
input [4:0] a, b, c, d, e, f;
```

四个 8 位输出一共有 32 位：

```verilog
output [7:0] w, x, y, z;
```

因此在输入后面补两个 `1`：

```verilog
assign {w, x, y, z} =
       {a, b, c, d, e, f, 2'b11};
```

左右两边的总位宽都是 32 位。

---

## 七、常量的写法

Verilog 常量的基本格式：

```text
位宽'进制数值
```

例如：

```verilog
4'b1010   // 4 位二进制
8'd10     // 8 位十进制 10
8'hA5     // 8 位十六进制 A5
3'd6      // 3 位十进制 6，即 3'b110
```

拼接中应尽量明确常量的位宽：

```verilog
2'b11
```

不要随意写成没有位宽的常量，因为拼接需要知道每一部分占多少位。

---

## 八、交换两个字节

假设：

```verilog
input  [15:0] in;
output [23:0] out;
```

`in` 可以分成：

```text
in[15:8]  高 8 位
in[7:0]   低 8 位
```

交换高、低两个字节：

```verilog
assign out[15:0] = {in[7:0], in[15:8]};
```

例如：

```text
in = 16'hABCD
```

则：

```text
in[15:8] = AB
in[7:0]  = CD
```

交换后：

```text
out[15:0] = CDAB
```

下面两种写法等价：

```verilog
assign {out[7:0], out[15:8]} = in;
```

```verilog
assign out[15:0] = {in[7:0], in[15:8]};
```

但下面这行给整个 24 位 `out` 赋值：

```verilog
assign out = {in[7:0], in[15:8]};
```

右边只有 16 位，赋给 24 位输出时，高 8 位补零：

```text
out = 24'h00CDAB
```

---

## 九、位顺序反转

题目要求把 8 位输入的位顺序反过来：

```text
out[7] = in[0]
out[6] = in[1]
out[5] = in[2]
out[4] = in[3]
out[3] = in[4]
out[2] = in[5]
out[1] = in[6]
out[0] = in[7]
```

使用拼接运算符：

```verilog
assign out = {
    in[0], in[1], in[2], in[3],
    in[4], in[5], in[6], in[7]
};
```

例如：

```text
in  = 11010010
out = 01001011
```

### 位反转与按位取反的区别

位顺序反转：

```verilog
{in[0], in[1], in[2], in[3],
 in[4], in[5], in[6], in[7]}
```

只改变各位的位置。

按位取反：

```verilog
~in
```

把每一位的 `0` 和 `1` 互换。

---

## 十、复制运算符

复制运算符的格式：

```verilog
{重复次数{重复内容}}
```

例如：

```verilog
{5{1'b1}}
```

等价于：

```verilog
5'b11111
```

再例如：

```verilog
{2{a, b, c}}
```

等价于：

```verilog
{a, b, c, a, b, c}
```

注意复制运算符有两层大括号：

```verilog
{5{a}}
```

外层表示整个结果，内层表示需要重复的内容。

---

## 十一、零扩展与符号扩展

### 1. 零扩展

将一个 8 位无符号数扩展到 32 位：

```verilog
assign out = {24'b0, in};
```

高 24 位全部补 `0`。

---

### 2. 符号扩展

对于补码有符号数，最高位是符号位：

```verilog
in[7]
```

把 8 位数扩展到 32 位，需要在高位补 24 个符号位：

```verilog
assign out = {{24{in[7]}}, in};
```

拆开理解：

```verilog
{24{in[7]}}
```

表示把符号位复制 24 次。

然后：

```verilog
{{24{in[7]}}, in}
```

表示：

```text
[24 个符号位][原来的 8 位数据]
```

---

### 3. 正数示例

```text
in = 8'b00000101
```

符号位为 `0`：

```text
out = 000000000000000000000000_00000101
```

数值仍然是 `5`。

---

### 4. 负数示例

```text
in = 8'b11111101
```

符号位为 `1`：

```text
out = 111111111111111111111111_11111101
```

扩展后的数仍表示相同的负数。

---

## 十二、异或与同或

### 1. 异或 XOR

```verilog
a ^ b
```

不同为 `1`，相同为 `0`。

| a | b | `a ^ b` |
|---|---|---|
| 0 | 0 | 0 |
| 0 | 1 | 1 |
| 1 | 0 | 1 |
| 1 | 1 | 0 |

---

### 2. 同或 XNOR

```verilog
a ~^ b
```

也可以写成：

```verilog
a ^~ b
```

相同为 `1`，不同为 `0`。

| a | b | `a ~^ b` |
|---|---|---|
| 0 | 0 | 1 |
| 0 | 1 | 0 |
| 1 | 0 | 0 |
| 1 | 1 | 1 |

同或常用于判断两个位是否相等。

---

## 十三、25 次两两比较

有五个 1 位输入：

```verilog
a, b, c, d, e
```

需要完成：

```text
a 与 a、b、c、d、e 比较
b 与 a、b、c、d、e 比较
c 与 a、b、c、d、e 比较
d 与 a、b、c、d、e 比较
e 与 a、b、c、d、e 比较
```

一共有：

```text
5 × 5 = 25 次比较
```

### 1. 构造第一个 25 位向量

```verilog
{{5{a}}, {5{b}}, {5{c}}, {5{d}}, {5{e}}}
```

结果：

```text
aaaaa_bbbbb_ccccc_ddddd_eeeee
```

### 2. 构造第二个 25 位向量

```verilog
{5{a, b, c, d, e}}
```

结果：

```text
abcde_abcde_abcde_abcde_abcde
```

### 3. 两个向量按位同或

```verilog
module top_module(
    input a, b, c, d, e,
    output [24:0] out
);

    assign out =
        {{5{a}}, {5{b}}, {5{c}}, {5{d}}, {5{e}}}
        ~^
        {5{a, b, c, d, e}};

endmodule
```

对应关系：

```text
a~^a  a~^b  a~^c  a~^d  a~^e
b~^a  b~^b  b~^c  b~^d  b~^e
c~^a  c~^b  c~^c  c~^d  c~^e
d~^a  d~^b  d~^c  d~^d  d~^e
e~^a  e~^b  e~^c  e~^d  e~^e
```

---

## 十四、今天完成的典型代码

### 1. 按位或、逻辑或和取反拼接

```verilog
module top_module(
    input  [2:0] a,
    input  [2:0] b,
    output [2:0] out_or_bitwise,
    output       out_or_logical,
    output [5:0] out_not
);

    assign out_or_bitwise = a | b;
    assign out_or_logical = a || b;
    assign out_not = {~b, ~a};

endmodule
```

---

### 2. 四输入与门、或门和异或门

```verilog
module top_module(
    input  [3:0] in,
    output out_and,
    output out_or,
    output out_xor
);

    assign out_and = &in;
    assign out_or  = |in;
    assign out_xor = ^in;

endmodule
```

---

### 3. 多向量拼接和拆分

```verilog
module top_module(
    input  [4:0] a, b, c, d, e, f,
    output [7:0] w, x, y, z
);

    assign {w, x, y, z} =
           {a, b, c, d, e, f, 2'b11};

endmodule
```

---

### 4. 8 位向量反转

```verilog
module top_module(
    input  [7:0] in,
    output [7:0] out
);

    assign out = {
        in[0], in[1], in[2], in[3],
        in[4], in[5], in[6], in[7]
    };

endmodule
```

---

### 5. 8 位符号扩展到 32 位

```verilog
module top_module(
    input  [7:0]  in,
    output [31:0] out
);

    assign out = {{24{in[7]}}, in};

endmodule
```

---

## 十五、常见错误整理

### 错误 1：多写一个 `);`

错误结构：

```verilog
module top_module(
    input a,
    output out
);

assign out = a;

);

endmodule
```

正确结构：

```verilog
module top_module(
    input a,
    output out
);

    assign out = a;

endmodule
```

---

### 错误 2：混淆 `|` 和 `||`

```verilog
a | b
```

是按位或。

```verilog
a || b
```

是逻辑或。

---

### 错误 3：混淆 `~` 和 `!`

```verilog
~a
```

是每一位取反。

```verilog
!a
```

是判断整个向量是否为零。

---

### 错误 4：混淆按位运算和归约运算

```verilog
a & b
```

是两个向量按位与。

```verilog
&a
```

是把 `a` 的所有位归约与。

---

### 错误 5：拼接顺序写反

```verilog
{a, b}
```

表示：

```text
a 在高位
b 在低位
```

题目要求 `~b` 放高位、`~a` 放低位时，应写：

```verilog
{~b, ~a}
```

---

### 错误 6：把位反转理解成按位取反

位反转改变位置：

```verilog
{in[0], in[1], ..., in[7]}
```

按位取反改变数值：

```verilog
~in
```

---

### 错误 7：拼接中的常量没有明确位宽

推荐：

```verilog
2'b11
```

而不是只写：

```verilog
11
```

---

## 十六、今日速记

```verilog
a | b                  // 按位或
a || b                 // 逻辑或
~a                     // 按位取反
!a                     // 逻辑非

&in                    // 归约与
|in                    // 归约或
^in                    // 归约异或

{a, b}                 // 拼接，a 在高位
{5{a}}                 // 把 a 复制 5 次
{{24{in[7]}}, in}      // 8 位符号扩展到 32 位

a ^ b                  // 异或：不同为 1
a ~^ b                 // 同或：相同为 1
```

---

## 十七、与后续 CPU 学习的联系

今天学习的内容并不是孤立的语法，在后续 CPU 设计中会频繁使用：

- **部分选择**：拆分指令中的操作码、寄存器编号和立即数
- **拼接**：组合地址、指令字段和数据
- **复制**：进行符号扩展
- **按位运算**：实现 ALU 的与、或、异或功能
- **归约运算**：判断一个数据是否全为零
- **同或比较**：实现相等判断
- **位宽处理**：避免模块连接时出现截断或补位错误

今天最需要熟练掌握的三种写法是：

```verilog
{a, b}
{5{a}}
{{24{in[7]}}, in}
```
