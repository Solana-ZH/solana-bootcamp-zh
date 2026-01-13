# 项目二：Voting dApp

使用 create-solana-dapp构建的anchor应用，并使用solana-test-validator和bankrun进行本地开发和测试。Voting dApp 是一个基于 Solana 的投票应用程序，允许用户创建投票并进行投票。

---

## 🚀 运行本项目

```
npm i
anchor build
anchor test
```

---

## 📚 教程文档
与之前你构建的Favorites应用程序不同，我们将本地构建而非全部在Solana Playground中完成。在开始之前，我们需要先搭建本地环境来真正地构建我们的投票应用。

### **安装Rust与Solana工具链**

访问[Anchor文档](https://www.anchor-lang.com/docs/installation)中的安装页面，该页面列出了所有需要安装的不同组件。
1. 安装Rust
2. 安装Solana CLI
3. 安装JavaScript包管理器（如Yarn、NPM、Pnpm或Bun）
4. 安转Anchor版本管理器AVM
5. 安装Anchor

### **✅ 创建投票应用程序项目**

在开始编写投票智能合约之前，我们需要先搭建好项目的框架。这一步骤将使用 `create-solana-dapp` 工具来生成一个基础的 Solana DApp 项目。

```bash
npx create-solana-dapp voting-dapp

```
- 这条命令会引导你完成项目的初始化过程，并生成一个基本的 Solana DApp 项目结构。

### **步骤详解：**

1. **输入项目名称**：我们将其命名为 `voting-dapp`
2. **选择前端框架**：选择 `Next.js`
3. **选择 CSS 框架**：选择 `Tailwind CSS`
4. **是否添加计数器程序**：选择了默认选项（可以保留）

执行上述命令后，系统会自动下载并安装所有必要的依赖项，并为你生成一个基础的项目目录结构。

---

### **🛠️ 检查并运行项目**

一旦项目创建完成，你可以通过以下步骤检查和运行项目：

1. **进入项目目录**：
    
    ```bash
    cd voting-dapp
    
    ```
    
2. **安装 npm 包**：
    
    ```bash
    npm install
    
    ```
    
3. **启动开发服务器**：
    
    ```bash
    npm run dev
    
    ```

---

### **💻 设置本地 Solana 验证节点**

为了测试我们的智能合约，我们需要运行一个本地 Solana 验证节点。这样可以在不依赖外部网络的情况下快速迭代和调试代码。

**运行 Solana 测试验证节点**：
    
```bash
solana-test-validator

```
    
这个命令会在本地启动一个模拟 Solana 网络的验证节点。
    
  
---

### **🧪 编写 Poll 账户结构**

现在我们有了一个基本的应用程序框架，并且本地验证节点也已经启动，接下来就可以开始编写智能合约了。首先定义 `Poll` 账户结构。

### **定义 Poll 结构体**

打开 `programs/src/lib.rs` 文件，在其中添加如下代码：

```rust

useanchor_lang::prelude::*;

declare_id!("FqzkXZdwYjurnUKetJCAvaUw5WAqbwzU6gZEwydeEfqS");

#[account]
#[derive(InitSpace)]
pub struct Poll {
    pub poll_id: u64,
    #[max_len(280)]
    pub description:String,
    pub poll_start: i64,
    pub poll_end: i64,
    pub candidates_amount: u64,
}

```

- `poll_id`:投票的唯一标识符
- `description`: 投票描述信息
- `poll_start`: 投票开始时间戳
- `poll_end`: 投票结束时间戳
- `candidates_amount`: 选项数量

### **🛠️ 实现 InitializePoll 上下文结构**

在定义了 `Poll` 账户结构之后，下一步是创建一个上下文结构来处理初始化投票的操作。这一步骤将帮助我们确保在创建新投票时所有必要的账户和参数都已正确设置。

### **定义 InitializePoll 上下文结构**

打开 `programs/src/lib.rs` 文件，并添加以下代码：

```rust

#[derive(Accounts)]
#[instruction(poll_id: u64)]
pub struct InitializePoll<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(
        init,
        payer = signer,
        space = 8 + Poll::INIT_SPACE,
        seeds = [poll_id.to_le_bytes().as_ref()],
        bump
    )]
    pub poll: Account<'info, Poll>,

    pub system_program: Program<'info, System>,
}

```

### **字段说明：**

- `signer`: 发起交易的钱包签名者（用户）
- `poll`: 我们要初始化的投票账户
    - 使用 PDA（程序派生地址）机制，通过 `poll_id` 作为种子生成唯一地址
    - `space = 8 + Poll::INIT_SPACE` 表示预留空间，其中 8 是账户头的固定长度
    - `bump` 表示该地址是 PDA 并自动处理 bump seed
- `system_program`: Solana 系统程序，用于支付账户创建费用

---

### **💡 编写 initialize_poll 指令**

现在我们已经有了上下文结构，接下来需要编写实际的指令函数来初始化投票。

### **编写 `initialize_poll` 函数**

在 `lib.rs` 文件中继续添加以下代码：

```rust

#[program]
pub mod voting {
use super::*;

    pub fn initialize_poll(ctx: Context<InitializePoll>, poll_id: u64, description:String, poll_start: u64, poll_end: u64) ->Result<()> {
        let poll = &mut ctx.accounts.poll;
        poll.poll_id = poll_id;
        poll.description = description;
        poll.poll_start = poll_start as i64;
        poll.poll_end = poll_end as i64;
        poll.candidates_amount = 0;
        Ok(())
    }
}

```

### **参数说明：**

- `poll_id`: 投票的唯一标识符
- `description`: 投票描述信息
- `poll_start`: 投票开始时间戳（秒级）
- `poll_end`: 投票结束时间戳（秒级）

---

### **🧪 测试 InitializePoll 功能**

为了确保我们的 `initialize_poll` 指令能够正常工作，我们需要编写一些测试用例来进行验证。

### **编写测试用例**

在 `tests` 目录下的 `voting.js` 文件中，添加以下测试代码：

```jsx

import *as anchorfrom '@coral-xyz/anchor'
import { Program }from '@coral-xyz/anchor'
import { Keypair, PublicKey }from '@solana/web3.js'
import { Voting }from '../target/types/voting'
import { BankrunProvider, startAnchor }from "anchor-bankrun";
import { beforeAll, it, describe, expect }from '@jest/globals'

const IDL = require('../target/idl/voting.json')

const votingAddress =new PublicKey("FqzkXZdwYjurnUKetJCAvaUw5WAqbwzU6gZEwydeEfqS");

describe('Voting', () => {

let context;
let provider;
let votingProgram: anchor.Program<Voting>;

  beforeAll(async () => {
    context =await startAnchor("", [{name: "voting", programId: votingAddress}], []);

    provider =new BankrunProvider(context);

    votingProgram =new Program<Voting>(
      IDL,
      provider,
    );
  })

  it('Initialize Poll',async () => {
await votingProgram.methods.initializePoll(
new anchor.BN(1), // 1000 seconds
      "What is your favorite color?",
new anchor.BN(0), // 0 for no limit
new anchor.BN(1759468874),
    ).rpc();

const [pollAddress] = PublicKey.findProgramAddressSync(
      [new anchor.BN(1).toArrayLike(Buffer, 'le', 8)],
      votingAddress,
    );

const poll =await votingProgram.account.poll.fetch(pollAddress);

    console.log(poll);

    expect(poll.pollId.toNumber()).toEqual(1);
    expect(poll.pollStart.toNumber()).toBeLessThan(poll.pollEnd.toNumber());
  });
});

```
 **运行测试**：
    
```bash
anchor test

```
  

### **🛠️ 定义 Candidate 账户结构**

在完成了 `Poll` 账户的初始化之后，接下来我们需要定义 `Candidate` 账户结构。这个账户将存储每个选项的相关信息。

### **定义 Candidate 结构体**

打开 `programs/src/lib.rs` 文件，并添加以下代码来定义 `Candidate` 账户结构：

```rust

#[account]
#[derive(InitSpace)]
pub struct Candidate {
    #[max_len(32)]
    pub candidate_name:String,
    pub candidate_votes: u64,
}

```

### **字段说明：**

- `candidate_name`: 选项的名字（最多 32 个字符）
- `candidate_votes`: 选项获得的票数

---

### **💡 实现 InitializeCandidate 上下文结构**

现在我们有了 `Candidate` 账户结构，下一步是创建一个上下文结构来处理初始化选项操作。

### **定义 InitializeCandidate 上下文结构**

继续在 `lib.rs` 文件中添加以下代码：

```rust

#[derive(Accounts)]
#[instruction(candidate_name: String, poll_id: u64)]
pub struct InitializeCandidate<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(
        mut,
        seeds = [poll_id.to_le_bytes().as_ref()],
        bump
    )]
    pub poll: Account<'info, Poll>,

    #[account(
        init,
        payer = signer,
        space = 8 + Candidate::INIT_SPACE,
        seeds = [poll_id.to_le_bytes().as_ref(), candidate_name.as_bytes()],
        bump
    )]
    pub candidate: Account<'info, Candidate>,

    pub system_program: Program<'info, System>,
}

```

npm install solana-bankrun --legacy-peer-deps

### **字段说明：**

- `signer`: 发起交易的钱包签名者（用户）
- `poll`: 相关的投票账户，用于更新选项数量
- `candidate`: 我们要初始化的选项账户
    - 使用 PDA 地址机制，通过 `poll_id` 和 `candidate_name` 作为种子生成唯一地址
    - `space = 8 + Candidate::INIT_SPACE` 表示预留空间，其中 8 是账户头的固定长度
    - `bump` 表示该地址是 PDA 并自动处理 bump seed
- `system_program`: Solana 系统程序，用于支付账户创建费用

---

### **💻 编写 initialize_candidate 指令**

在定义了上下文结构后，我们需要编写实际的指令函数来初始化选项。

### **编写 `initialize_candidate` 函数**

在 `lib.rs` 文件中继续添加以下代码：

```rust

pubfninitialize_candidate(ctx: Context<InitializeCandidate>, candidate_name:String, _poll_id: u64) ->Result<()> {
    let candidate = &mut ctx.accounts.candidate;
    let poll = &mut ctx.accounts.poll;
    poll.candidates_amount += 1;

    candidate.candidate_name = candidate_name;
    candidate.candidate_votes = 0;
    Ok(())
}

```

### **参数说明：**

- `candidate_name`: 选项的名字
- `_poll_id`: 投票的唯一标识符（虽然未直接使用，但需要传递以确保正确生成 PDA）

---

### **🧪 测试 InitializeCandidate 功能**

为了验证我们的 `initialize_candidate` 指令是否能够正常工作，我们需要编写一些测试用例来进行验证。

### **编写测试用例**

在 `tests` 目录下的 `voting.js` 文件中，继续添加以下测试代码：

```jsx

it('Initialize Candidate',async () => {
await votingProgram.methods.initializeCandidate(
        "Red",
new anchor.BN(1), // poll_id
    ).rpc();
await votingProgram.methods.initializeCandidate(
        "Blue",
new anchor.BN(1), // poll_id
    ).rpc();

const [blueAddress] = PublicKey.findProgramAddressSync(
        [new anchor.BN(1).toArrayLike(Buffer, 'le', 8), Buffer.from("Blue")],
        votingAddress,
    );

const blueCandidate =await votingProgram.account.candidate.fetch(blueAddress);
    console.log(blueCandidate);

    expect(blueCandidate.candidateVotes.toNumber()).toEqual(0);

const [redAddress] = PublicKey.findProgramAddressSync(
        [new anchor.BN(1).toArrayLike(Buffer, 'le', 8), Buffer.from("Red")],
        votingAddress,
    );

const redCandidate =await votingProgram.account.candidate.fetch(redAddress);
    console.log(redCandidate);
    expect(redCandidate.candidateVotes.toNumber()).toEqual(0);
});

```
    
**运行测试**：
    
```bash
anchor test

```

### **💡 实现投票功能**

现在我们已经能够初始化投票和选项，接下来我们需要实现实际的投票功能。这一步骤将允许用户为特定选项投票。

### **编写 `vote` 指令**

在 `lib.rs` 文件中继续添加以下代码来实现 `vote` 函数：

```rust

pubfnvote(ctx: Context<Vote>, _candidate_name:String, _poll_id: u64) ->Result<()> {
    let candidate = &mut ctx.accounts.candidate;
    // Increment the candidate's votes
    candidate.candidate_votes += 1;
    Ok(())
}

```

### **参数说明：**

- `_candidate_name`: 选项的名字（虽然未直接使用，但需要传递以确保正确生成 PDA）
- `_poll_id`: 投票的唯一标识符（虽然未直接使用，但需要传递以确保正确生成 PDA）

---

### **🛠️ 定义 Vote 上下文结构**

为了处理投票操作，我们需要定义一个上下文结构 `Vote` 来确保所有必要的账户和参数都已正确设置。

### **定义 Vote 上下文结构**

继续在 `lib.rs` 文件中添加以下代码：

```rust

#[derive(Accounts)]
#[instruction(candidate_name: String, poll_id: u64)]
pub struct Vote<'info> {
    pub signer: Signer<'info>,

    #[account(
        seeds = [poll_id.to_le_bytes().as_ref()],
        bump
    )]
    pub poll: Account<'info, Poll>,

    #[account(
        mut,
        seeds = [poll_id.to_le_bytes().as_ref(), candidate_name.as_bytes()],
        bump
    )]
    pub candidate: Account<'info, Candidate>,
}

```

### **字段说明：**

- `signer`: 发起交易的钱包签名者（用户）
- `poll`: 相关的投票账户，用于验证投票的有效性
- `candidate`: 我们要为其增加票数的选项账户
    - 使用 PDA 地址机制，通过 `poll_id` 和 `candidate_name` 作为种子生成唯一地址
    - `mut` 表示该账户是可变的，因为我们将在其中更新票数

---

### **🧪 测试投票功能**

为了验证我们的 `vote` 指令是否能够正常工作，我们需要编写一些测试用例来进行验证。

### **编写测试用例**

在 `tests` 目录下的 `voting.js` 文件中，继续添加以下测试代码：

```jsx

it('Vote',async () => {
await votingProgram.methods
      .vote(
        "Red",
new anchor.BN(1)
      ).rpc();

const [redAddress] = PublicKey.findProgramAddressSync(
        [new anchor.BN(1).toArrayLike(Buffer, 'le', 8), Buffer.from("Red")],
        votingAddress,
    );

const redCandidate =await votingProgram.account.candidate.fetch(redAddress);
    console.log(redCandidate);
    expect(redCandidate.candidateVotes.toNumber()).toEqual(1);
});

```
---


### **总结**

我们现在已经完成了投票智能合约的核心功能开发。以下是我们在整个过程中完成的主要步骤和要点：

1. **创建项目**：
    - 使用 `create-solana-dapp` 创建了一个新的 Solana DApp 项目。
    - 设置了本地开发环境，并确保所有依赖项已正确安装。
2. **定义账户结构**：
    - 定义了 `Poll` 和 `Candidate` 账户结构，用于存储投票信息和选项信息。
    - 使用 PDA（程序派生地址）机制生成唯一地址，以便于查找和管理这些账户。
3. **实现指令集**：
    - 实现了三个主要指令：
        - `initialize_poll`: 初始化一个新的投票。
        - `initialize_candidate`: 在特定投票中添加选项。
        - `vote`: 允许用户为特定选项投票，并更新其票数。
4. **测试功能**：
    - 编写了单元测试来验证每个指令的功能是否正常工作。
    - 在本地环境中完成了所有测试，使用的是 Solana 的本地测试节点。