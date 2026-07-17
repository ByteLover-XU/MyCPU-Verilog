# Verilog `generate`、计数电路与可变选择学习笔记

日期：2026-07-17  
当前阶段：Verilog 入门——组合逻辑应用与规则化硬件生成

## 一、今天的新内容

今天在已有的向量、运算符、模块例化、`always`、`case` 和全加器基础上，继续学习了以下新内容：

1. 使用组合逻辑统计向量中 `1` 的数量（Population Count）
2. 使用 `genvar` 和 `generate for` 批量例化硬件模块
3. 构造 100 位串行进位加法器的进位链
4. 将自然语言控制需求转换为布尔表达式
5. 使用向量切片批量处理相邻位关系
6. 使用变量进行位选择和定宽部分选择
7. 区分过程型 `for` 与生成型 `for`

本文只记录这些新增内容，不再重复前面笔记中已经整理过的基础运算符、`assign`、`wire/reg`、模块例化和 `case` 基本语法。

---

## 二、Population Count：统计输入中有多少个 `1`

Population Count（简称 popcount）电路的功能是：

> 输入一个二进制向量，输出其中值为 `1` 的位数。

例如：

```text
in = 8'b1011_0010
```

其中有 4 个 `1`，所以输出为 4。

### 1. 255 位输入的写法

```verilog
module top_module (
    input      [254:0] in,
    output reg [7:0]   out
);

    integer i;

    always @(*) begin
        out = 8'd0;

        for (i = 0; i < 255; i = i + 1) begin
            out = out + in[i];
        end
    end

endmodule
```

这里 `in[i]` 只能是 `0` 或 `1`：

- `in[i] = 0`：计数不变
- `in[i] = 1`：计数加一

最大计数结果为 255，因此输出使用 8 位：

```text
8 位无符号数可以表示 0～255
```

### 2. 3 位输入的写法

```verilog
module top_module (
    input      [2:0] in,
    output reg [1:0] out
);

    integer i;

    always @(*) begin
        out = 2'd0;

        for (i = 0; i < 3; i = i + 1) begin
            out = out + in[i];
        end
    end

endmodule
```

3 位输入最多包含 3 个 `1`，因此 2 位输出已经足够表示 `0～3`。

### 3. `for` 循环的硬件含义

这里的 `for` 并不是让同一个加法器按照时间顺序运行 255 次。

综合工具会根据循环描述生成一组组合加法逻辑。输入变化以后，整条组合逻辑重新计算输出。

---

## 三、过程型 `for` 与生成型 `for`

今天遇到了两种用途完全不同的 `for`。

### 1. 过程型 `for`

过程型 `for` 写在 `always` 块中，用于重复描述赋值或运算：

```verilog
always @(*) begin
    out = 0;

    for (i = 0; i < 255; i = i + 1) begin
        out = out + in[i];
    end
end
```

它适合 popcount、位反转、批量赋值等操作。

### 2. 生成型 `for`

生成型 `for` 用于批量创建硬件实例：

```verilog
genvar i;

generate
    for (i = 0; i < 100; i = i + 1) begin : adder_chain
        adder u_adder (
            .a   (a[i]),
            .b   (b[i]),
            .cin (carry[i]),
            .sum (sum[i]),
            .cout(carry[i+1])
        );
    end
endgenerate
```

这段代码会生成 100 个真实存在的 `adder` 实例，而不是让一个 `adder` 重复工作 100 次。

### 3. `genvar`

```verilog
genvar i;
```

`genvar` 是生成阶段使用的循环变量，不是电路运行时变化的寄存器或信号。

### 4. 命名生成块

```verilog
begin : adder_chain
```

冒号后面的 `adder_chain` 是生成块名称。

生成后的层次名称类似：

```text
adder_chain[0].u_adder
adder_chain[1].u_adder
...
adder_chain[99].u_adder
```

命名块便于编译器区分实例，也方便在仿真层次结构中定位模块。

---

## 四、100 位串行进位加法器

题目要求例化 100 个一位全加器，并把前一级的输出进位送给后一级。

### 1. 进位链

```verilog
wire [100:0] carry;

assign carry[0] = cin;
assign cout = carry[100:1];
```

进位对应关系：

```text
carry[0]   = 外部输入进位 cin
carry[1]   = 第 0 位全加器的输出进位
carry[2]   = 第 1 位全加器的输出进位
...
carry[100] = 第 99 位全加器的最终输出进位
```

因此：

```text
cout[0]  = carry[1]
cout[1]  = carry[2]
...
cout[99] = carry[100]
```

### 2. 顶层代码

下面只展示本题新增的批量例化和进位连接；一位全加器本身已经在前面的笔记中整理过。

```verilog
module top_module (
    input  [99:0] a,
    input  [99:0] b,
    input         cin,
    output [99:0] cout,
    output [99:0] sum
);

    wire [100:0] carry;

    assign carry[0] = cin;
    assign cout = carry[100:1];

    genvar i;
    generate
        for (i = 0; i < 100; i = i + 1) begin : adder_chain
            adder u_adder (
                .a   (a[i]),
                .b   (b[i]),
                .cin (carry[i]),
                .sum (sum[i]),
                .cout(carry[i+1])
            );
        end
    endgenerate

endmodule
```

这个结构称为 Ripple-Carry Adder（串行进位加法器）。进位从最低位开始，一级一级传播到最高位。

---

## 五、从自然语言需求推导组合逻辑

今天练习了一个重要方法：

> 不要先想程序执行步骤，而要先问“某个输出在什么条件下应该为 1”。

然后把这些条件直接写成布尔表达式。

### 1. 手机响铃与振动控制

输入：

```text
ring          是否有来电
vibrate_mode  是否处于振动模式
```

输出条件：

```verilog
assign ringer = ring & ~vibrate_mode;
assign motor  = ring &  vibrate_mode;
```

含义：

- 有来电且不是振动模式：响铃
- 有来电且是振动模式：启动振动电机
- 没有来电：两个输出都关闭

### 2. 恒温器控制

```verilog
assign heater = mode & too_cold;
assign aircon = ~mode & too_hot;
assign fan    = heater | aircon | fan_on;
```

推导过程：

- `heater=1`：制热模式并且温度过低
- `aircon=1`：制冷模式并且温度过高
- `fan=1`：加热器开启、空调开启或用户手动要求风扇开启

这种“从输出为 1 的条件反推表达式”的方法，后续可以用于 CPU 控制信号设计。

---

## 六、使用向量切片处理相邻位

对于 100 位输入：

```verilog
input [99:0] in;
```

可以一次处理 99 组相邻位，不需要逐项手写。

### 1. 当前位与左侧相邻位同时为 1

```verilog
assign out_both = in[98:0] & in[99:1];
```

对应：

```text
out_both[0]  = in[0]  & in[1]
out_both[1]  = in[1]  & in[2]
...
out_both[98] = in[98] & in[99]
```

### 2. 当前位与右侧相邻位至少一个为 1

```verilog
assign out_any = in[99:1] | in[98:0];
```

对应：

```text
out_any[1]  = in[1]  | in[0]
out_any[2]  = in[2]  | in[1]
...
out_any[99] = in[99] | in[98]
```

### 3. 与左侧相邻位不同，并首尾相连

```verilog
assign out_different =
    {in[99] ^ in[0], in[98:0] ^ in[99:1]};
```

最高位单独处理首尾连接：

```text
out_different[99] = in[99] ^ in[0]
```

其余 99 位使用向量异或一次完成。

---

## 七、变量位选择与定宽部分选择

### 1. 256 选 1：变量位选择

```verilog
input  [255:0] in;
input  [7:0]   sel;
output         out;
```

可以直接写：

```verilog
assign out = in[sel];
```

`sel` 的值决定读取 `in` 中的哪一位：

```text
sel = 0   → out = in[0]
sel = 1   → out = in[1]
...
sel = 255 → out = in[255]
```

### 2. 从 1024 位输入中选择一组 4 位数据

输入中打包了 256 组 4 位数据：

```verilog
input [1023:0] in;
input [7:0]    sel;
```

正确写法：

```verilog
assign out = in[sel*4 +: 4];
```

语法：

```verilog
向量[起始位置 +: 固定位宽]
```

具体对应：

```text
sel = 0 → in[3:0]
sel = 1 → in[7:4]
sel = 2 → in[11:8]
```

这里的起始位置可以变化，但选择宽度必须固定为 4。

普通写法：

```verilog
in[sel*4+3 : sel*4]
```

不能用于传统 Verilog 的可变范围选择，因为上下边界都会随 `sel` 改变。

---

## 八、9 选 1 多路选择器中的无效选择

9 个 16 位输入使用 4 位 `sel` 选择：

```text
sel = 0～8  → 选择 a～i
sel = 9～15 → 输出全部为 1
```

无效情况的默认输出为：

```verilog
16'hffff
```

这题可以使用 `case` 或嵌套条件运算符实现。由于两种语法已经在前面的笔记中学习，本次重点是识别有效选择范围和设置无效输入的确定输出。

---

## 九、今天出现的错误与修正

### 1. 清零时把赋值号写成减号

错误：

```verilog
out - 0;
```

正确：

```verilog
out = 0;
```

### 2. 在 `always` 中重复声明输出

端口已经声明：

```verilog
output reg [1:0] out;
```

过程块中只需赋值：

```verilog
out = 2'b00;
```

不能再次写：

```verilog
reg out = 2'b00;
```

### 3. 循环上界与向量位宽不一致

对于：

```verilog
input [2:0] in;
```

合法下标只有 `0、1、2`，因此循环条件应为：

```verilog
for (i = 0; i < 3; i = i + 1)
```

不能访问不存在的 `in[3]`。

### 4. 把进位向量写成了单比特输入

错误：

```verilog
assign cout = cin[100:1];
```

`cin` 只有 1 位。正确写法：

```verilog
assign cout = carry[100:1];
```

### 5. 给错误的输出信号赋值

相邻位异或结果应赋给：

```verilog
out_different
```

不能再次赋给已经使用过的：

```verilog
out_both
```

### 6. 使用可变普通范围选择

错误：

```verilog
in[sel*4+3 : sel*4]
```

正确：

```verilog
in[sel*4 +: 4]
```

### 7. Verilog 循环递增写法

当前以 Verilog 为主，统一写成：

```verilog
i = i + 1
```

暂不使用偏 SystemVerilog 风格的：

```verilog
i++
```

---

## 十、与简易 CPU 项目的联系

今天的内容与后续 CPU 设计有直接联系：

- `generate for`：适合构造重复位级结构，例如加法器链和寄存器阵列
- 进位链：帮助理解 ALU 中多位加法器的内部结构
- 自然语言到布尔表达式：用于推导控制器的使能、跳转和读写控制信号
- 向量切片：用于批量处理总线和指令字段
- 变量位选择：可用于从打包数据或寄存器集合中选择目标数据
- `+:` 定宽选择：适合从宽总线中按编号读取固定宽度字段

今天相比前几天的进步是：不再只学习单个语法，而是开始用已有语法描述更大、更规则的组合电路。