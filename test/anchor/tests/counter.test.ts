
import * as anchor from '@coral-xyz/anchor'
import { Program } from '@coral-xyz/anchor'
import { Keypair, PublicKey } from '@solana/web3.js'
import { Voting } from '../target/types/voting';
import { BankrunProvider, startAnchor } from "anchor-bankrun";
import { describe, beforeAll, it, expect} from '@jest/globals';

const IDL = require('../target/idl/voting.json');

const votingAddress = new PublicKey("FqzkXZdwYjurnUKetJCAvaUw5WAqbwzU6gZEwydeEfqS");


describe('counter', () => {
  let context;

  let provider;

  let votingProgram: anchor.Program<Voting>;

  beforeAll(async () => {
    context = await startAnchor("tests/anchor-example", [{name: "voting", programId: votingAddress}], []);
    

	  provider = new BankrunProvider(context);

	  votingProgram = new Program<Voting>(
      IDL,
      provider,
    );
  })

  it('Initialize Counter', async () => {
    await votingProgram.methods
      .initializePoll(
        new anchor.BN(1),
        "What is your favorite color?",
        new anchor.BN(0),
        new anchor.BN(1759470156)
      ).rpc();

      const [pollAddress] = PublicKey.findProgramAddressSync(
        [new anchor.BN(1).toArrayLike(Buffer, 'le', 8)],
        votingProgram.programId,
      );
      const poll = await votingProgram.account.poll.fetch(pollAddress);
      expect(poll.pollId.toNumber()).toBe(1);
      expect(poll.pollStart.toNumber()).toBeLessThan(poll.pollEnd.toNumber());
  });})
