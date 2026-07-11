# MyCPU-Verilog

## 项目简介

本项目用于学习数字 IC / FPGA 方向的 RTL 设计。

目标是使用 Verilog HDL 从零设计一个可仿真的简易 CPU，并通过模块化设计理解数字系统的数据通路、控制逻辑以及硬件描述语言开发流程。

---

## 当前基础

- 已学习数字电路基础
- 理解基本组合逻辑和时序逻辑概念
- 有 Multisim 简易 CPU 设计经验
- Verilog 处于入门阶段
- 开发环境：
  - VS Code
  - Icarus Verilog
  - GTKWave

---

## 项目目标

最终完成一个 16 位简易 CPU。

主要模块：

- Program Counter (PC)
- Instruction ROM
- Instruction Register (IR)
- ALU
- ACC / Register
- RAM
- Control Unit
- FSM Controller

支持基础指令：

- LOAD
- ADD
- SUB
- STORE
- JMP
- BZ
- HALT

能够运行简单程序，并通过仿真波形验证运行结果。

---

## 学习路线

### Phase 1：Verilog 基础

目标：掌握 Verilog 基本语法和模块描述方式。

内容：

- `module`
- `input` / `output`
- `wire` / `reg`
- `assign`
- `always`
- `if` / `case`

练习：

- 与门
- 或门
- 非门
- 多路选择器
- 半加器
- 全加器
- 4 位加法器

### Phase 2：数字逻辑模块

目标：能够独立设计常用数字模块。

内容：

- ALU
- Comparator
- Encoder
- Decoder
- MUX

### Phase 3：时序逻辑

目标：理解时钟驱动的硬件设计。

内容：

- D 触发器
- 寄存器
- 计数器
- 移位寄存器
- 带使能寄存器

### Phase 4：CPU 组件设计

实现：

- PC
- ROM
- RAM
- IR
- ACC
- ALU
- Controller

### Phase 5：CPU 系统集成

完成：

- 指令格式设计
- 数据通路连接
- 控制状态机
- CPU 仿真

---

## 开发规范

### 1. 模块化设计

每个硬件模块使用独立文件，例如：

```text
rtl/
├── alu.v
├── pc.v
├── rom.v
└── controller.v
```

禁止将整个 CPU 写在一个文件中。

### 2. 每个模块必须有测试文件

例如：

```text
rtl/alu.v
tb/alu_tb.v
```

所有模块必须经过仿真验证。

### 3. 提交记录

Git commit 尽量描述具体内容，例如：

```text
add 4-bit adder module
implement ALU add operation
finish PC counter
```

---

## 当前任务

当前阶段：Verilog 入门。

第一阶段任务：

1. 完成基础逻辑门模块
2. 学习 testbench
3. 使用 GTKWave 查看波形
4. 完成 MUX 和加法器

暂不开始 CPU 编写。

---

## 项目原则

不要直接复制 CPU 代码。

目标是理解每一个模块为什么存在，以及它如何组成完整处理器。

Codex 在协作时应负责讲解、提示、检查、排错和验证，不应替学习者直接决定 CPU 架构或跳过当前学习阶段。
