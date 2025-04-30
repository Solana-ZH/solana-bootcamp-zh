# 项目一：Favorites Application

这是一个使用 Anchor 和程序派生地址（PDA）构建的基础应用，用于为用户存储数据。该项目还使用 Anchor 的账户检查功能，确保每位用户只能修改属于自己的数据。

---

## 🚀 运行本项目

我们强烈建议你[创建一个属于自己的 GitHub 仓库](https://github.com/new)，并跟随教学视频逐步构建项目。这样不仅能帮助你更好地学习，也方便你日后查阅。

如果你想直接查看项目最终效果，可以克隆本仓库，并运行以下命令：

npm i
anchor build
anchor test

测试通过后，你将会看到成功的测试结果。

---

## 📚 教程文档
> 我们要制作的第一个智能合约会非常简单。
> 它的功能是：**把我们最喜欢的东西存储到区块链上**。
> 
> 通过这个项目，我们将学习：
> 
- 如何在区块链上保存、更新和读取数据；
- 以及如何通过签名控制智能合约的数据访问权限。

在上一节中，我们学习了每个用户都会有一对**密钥对（Key Pair）**：

- 公钥（Public Key）：可以当作地址，别人可以向这个地址转账。
- 私钥（Private Key）：自己持有，用来**对交易进行签名**，证明是本人发起的。

而在 Solana 上，

**智能合约（也叫 Program）可以通过“程序派生地址（PDA，Program Derived Address）”来存储额外的数据**。

PDA 和普通账户有个很大不同：

- **普通账户**是通过私钥生成的；
- **PDA账户**不是从私钥推导出来的，而是由你编程时自定义的一组**种子（Seed）**生成的。

比如说：

- 想保存智能合约的配置信息？可以用种子 `"config"` 生成一个 PDA，存储配置信息。
- 想保存 Alice 对电影《泰坦尼克号》的评论？
    
    就可以把 `"Alice的钱包地址"` + `"Titanic"` 字符串，组合成种子，生成一个 PDA 存储她的评论。
    
- 想保存 Bob 对同一部电影的评论？
    
    那就用 `"Bob的钱包地址"` + `"Titanic"` 来生成属于 Bob 的评论 PDA。
    

如果你以前用过**键值对存储（Key-Value Store）**，会发现 PDA 的思路很像。

如果没用过，也可以简单理解：

- **PDA 就像数据库中的一行数据**，
- **seed就是这行数据的主键（Primary Key）**，
    
    通过这个主键，我们能快速定位并访问特定的数据。
    

---

> 接下来，我们就来动手，
> 
> 
> 搭建一个**可以把用户最喜欢的东西保存到区块链上**的小程序，
> 
> 并且通过数字签名，确保**只有钱包持有者自己可以更新自己的数据**。
> 

为了开发方便，

我们会使用：

- **Solana Playground**：一个可以直接在浏览器上编写 Solana 智能合约的平台；
- **Anchor**：目前最流行的 Solana 智能合约开发框架。

步骤如下：

1. 打开Solana Playground网站 [beta.solpg.io](https://beta.solpg.io/)；
2. 点击 **"Create a New Project"**；
3. 给你的项目起个名字，比如我这里就取名叫 **"favorites"**，因为我们要保存最喜欢的东西；
4. 记得选择 **Anchor** 作为项目类型；
5. 点击 **Create** 创建项目。

创建完成后，系统会自动生成一个初始文件 `lib.rs`。

不过为了从零开始学习，

我们这里会**把 `lib.rs` 文件中的内容全部删除**，

自己一步步手动编写合约。

### 📖 中文翻译（中文讲解版）

> 在任何一个 Anchor 智能合约项目中，
> 
> 
> 通常我们写的第一行代码都是导入所谓的 **Anchor Prelude（前置库）**。
> 

这段代码是这样的：

```rust
use anchor_lang::prelude::*;
```

作用是：

- 把 Anchor 框架中常用的类型、宏（macro）等工具一次性导入进来；
- 这样后续我们写代码时就可以直接调用这些工具，而不用每次都写完整路径，非常方便。
    
    

> 在 Solana 中，每一个智能合约（Program）都有一个Program ID（也就是合约地址）。
> 
> 不过在 **Solana Playground** 里，这个地址**不需要手动填写**
> 
> 当我们部署程序的时候，系统会自动帮我们生成并填好。
> 

为了让代码更整洁，我们还要先定义一个常量：

```rust
const ANCHOR_DISCRIMINATOR_SIZE: usize = 8;
```

这行代码的含义是：

- 在 Anchor 中，每一个链上账户，系统都会预留 8 字节，
    
    用来存放 **Discriminator**，也就是**账户类型标识符**；
    
- 当我们在链上保存数据时，
    
    **存储空间 = 8 字节 Discriminator + 实际数据大小**。
    

这个定义，后续在计算空间大小时会非常有用。

> Anchor 有一个很棒的设计：
> 
> 
> **可以把普通的 Rust 模块（Module），通过一个宏（macro）直接变成 Solana 智能合约（Program）**。
> 

基本的结构是这样的：

```rust
#[program]
pub mod favorites {
    use super::*;

    pub fn set_favorites() -> Result<()> {
        // 函数体后面再写
    }
}

```

这一段代码的含义是：

- 创建了一个模块，名字叫做 `favorites`；
- 在模块上加了一个 `#[program]` 宏，
    
    这就告诉 Anchor：「这个模块是一个 Solana 智能合约」；
    
- 在模块内部，每一个函数（比如 `set_favorites`）都会被当成一条**指令处理器（Instruction Handler）**。

而 `set_favorites` 这个函数的作用是：

**让用户能够把自己最喜欢的数字、颜色和爱好列表，保存到区块链上**。

> 接下来，我们要定义一个数据结构，
> 
> 专门用来保存用户上传的最爱信息。
> 

代码如下：

```rust
#[account]
#[derive(InitSpace)]
pub struct Favorites {
    pub number: u64,
    #[max_len(50)]
    pub color: String,
    #[max_len(5, 50)]
    pub hobbies: Vec<String>,
}

```

解释一下：

- `#[account]`：告诉 Anchor，这个结构体是要存到链上的账户数据；
- `#[derive(InitSpace)]`：让 Anchor 能自动计算这个结构体需要预留多少存储空间；
- `#[max_len(N)]`：对于字符串（String）或字符串数组（Vec<String>）这种长度可变的数据，
    
    我们需要提前指定一个**最大长度**，以便 Anchor 在分配空间时留足。
    

在这里：

- `color` 最多可以存 50 个字符；
- `hobbies` 最多可以存 5 个字符串（每个字符串也有最大长度限制，这后面还会细化）。

> 当用户调用 set_favorites 这个函数时，
> 
> 
> **需要提前告诉链上：这次交易会读取或修改哪些账户**。
> 

Solana 有一个很特别的设计：

- 所有交易在发起之前，必须列出会用到的所有账户（无论是读还是写）；
- 这样 Solana 可以实现**高并发处理**，
    
    只要两个交易操作的账户不同，就可以**同时并行执行**。
    

为了定义指令需要哪些账户，

我们要写一个结构体（Struct），并加上 `#[derive(Accounts)]` 标注。

针对 `set_favorites` 指令，账户列表结构如下：

```jsx
#[derive(Accounts)]
pub struct SetFavorites<'info> {
    #[account(mut, signer)]
    pub user: Signer<'info>,

    #[account(
        init_if_needed,
        payer = user,
        space = ANCHOR_DISCRIMINATOR_SIZE + Favorites::INIT_SPACE,
        seeds = [b"favorites", user.key().as_ref()],
        bump,
    )]
    pub favorites: Account<'info, Favorites>,

    pub system_program: Program<'info, System>,
}
```

详细解释一下：

- `‘info`: 这些账户信息会在Solana账户info对象的生命周期内存在 - 因为rust对内存中需要存多久有要求
- `user`：
    - `mut`：表示这个账户在交易过程中会被修改；设置这个账户的signer来pay，在链上创建favourate account
    - `signer`：表示必须由这个账户的私钥签名确认。
- `favorites`：
    - 这是调用favourate的钱包账户需要指定要写入到哪个favourate账户，；
    - 保存用户最喜欢信息的账户；
    - `init_if_needed`：如果账户不存在，就自动初始化；
    - `payer = user`：新账户的创建费用由 `user` 支付；
    - `space`：分配的存储空间是 8 字节 Discriminator + Favorites结构需要的空间；
    - `seeds`：生成 PDA 的种子为 `"favorites"` 字符串 和 用户钱包地址；
    - `bump`：用于确保 PDA 地址生成时能避开碰撞。
- `system_program`：
    - 系统程序账户，用来支持账户创建等基础操作。

> 现在我们来完成 set_favorites 函数的具体实现。
> 
> 在函数体中，我们会：
> 
- 打印两条日志；
- 输出用户的钱包公钥地址
- 输出用户设置的 favorites 数据

具体代码如下：

```rust
#[program]
pub mod favorites {
    use super::*;

    pub fn set_favorites(ctx: Context<SetFavorites>, number: u64, color: String, hobbies: Vec<String>) -> Result<()> {
        // 函数体后面再写
        msg!("Greetings from {}", context.program_id);
        let user_public_key = context.accounts.user.key();
        
          msg!(
            "User {}'s favourite number is {}, favourite color is {}, and their hobbies are {:?}",
            user_public_key,
            number,
            color,
            hobbies
        );
        
        Ok(()) // Ok 写信息上链
    }
}
```

解释一下：

- `msg!`：是 Anchor 提供的日志宏，可以把信息打印到链上交易日志（可以在 Solana Explorer 上看到）；
- `favorites`：通过 `&mut` 关键字获取到可修改引用，然后把新的 `number`、`color`、`hobbies` 赋值进去；
- `Ok(())`：表示函数执行成功，没有错误。

通过这一段代码，

**用户就可以通过调用 set_favorites，上传自己的最爱信息到链上了！**

> 现在我们的智能合约代码已经写好了，
> 
> 下一步就是 **编译并部署到链上**！
> 

步骤如下：

1. 在 Solana Playground 中点击 **"Build"** 按钮。
    - 这一步会把我们用 Rust 写的智能合约，编译成可以在 Solana 链上运行的二进制程序。
    - 如果代码里有语法错误或者逻辑错误，编译时会报错。
    - 编译成功的话，界面上会显示成功提示。
2. 然后点击 **"Deploy"** 按钮。
    - 这一步会把编译好的程序部署到 **Devnet（开发测试网络）**。
    - 注意，Devnet 是 Solana 官方提供的测试链，不用消耗真正的 SOL。
    - 部署过程中，会生成一笔链上交易：
        - 为你的程序分配一个唯一的 Program ID；
        - 把合约的二进制文件上传到链上。
    - 部署完成后，Solana Playground 会自动把新的 Program ID 填入项目设置中。

> 合约部署完成后，
> 
> 
> 我们可以开始**测试**啦！
> 

测试步骤如下：

1. 在 Playground 中切换到 **"Explorer"** 标签页；
2. 点击 **"Create Transaction"** 按钮；
3. 在弹出的界面中，选择方法（Method）为 `set_favorites`；
4. 填入需要传入的参数，比如：
    - number：7
    - color："Blue"
    - hobbies：["Hiking", "Chess"]
5. 填好后，点击 **"Execute Transaction"** 执行交易。

执行时，系统会：

- 自动帮你用钱包签名；
- 把交易发送到你刚才部署的 Program；
- 调用 `set_favorites` 方法，把你的最爱信息保存到链上。

如果一切顺利，

- 你会看到交易成功；
- 还会在链上生成一个新的账户，用来保存你上传的 Favorites 数据！

通过这个小项目，你学到了：

- 如何定义一个 Solana 智能合约（Program）；
- 如何使用 PDA（程序派生地址）来保存每个用户的数据；
- 如何通过 Anchor 框架，把数据写入链上，并从链上读取数据。

接下来，你可以尝试自己动手扩展一下这个项目，比如：

- 增加一个字段记录“最喜欢的食物”；
- 给用户增加“修改自己数据”的功能；
- 或者练习不同长度、不同类型的数据字段定义。

不要担心第一次没有完全成功 —— **调试（Debug）也是开发中非常重要的一部分**。

在下一个项目中，我们将一起构建一个**简单的投票应用**，

它将教你如何管理多个账户类型，以及实现用户之间的交互逻辑。

继续加油！