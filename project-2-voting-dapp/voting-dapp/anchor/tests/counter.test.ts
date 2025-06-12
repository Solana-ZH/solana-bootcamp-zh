import * as anchor from '@coral-xyz/anchor'
import { Program } from '@coral-xyz/anchor'
import { Keypair, PublicKey } from '@solana/web3.js'
import { Voting } from '../target/types/voting'
import { BankrunProvider, startAnchor } from "anchor-bankrun";
import { beforeAll, it, describe, expect } from '@jest/globals'

const IDL = require('../target/idl/voting.json')

const votingAddress = new PublicKey("FqzkXZdwYjurnUKetJCAvaUw5WAqbwzU6gZEwydeEfqS");

describe('Voting', () => {

  let context;
  let provider;
  let votingProgram: anchor.Program<Voting>;
  
  beforeAll(async () => {
    context = await startAnchor("", [{name: "voting", programId: votingAddress}], []);

	  provider = new BankrunProvider(context);

    votingProgram = new Program<Voting>(
      IDL,
      provider,
    );
  })

  it('Initialize Poll', async () => {
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

    const poll = await votingProgram.account.poll.fetch(pollAddress);

    console.log(poll);

    expect(poll.pollId.toNumber()).toEqual(1);
    expect(poll.pollStart.toNumber()).toBeLessThan(poll.pollEnd.toNumber());
  });

  it('Initialize Candidate', async () => {
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

    const blueCandidate = await votingProgram.account.candidate.fetch(blueAddress);
    console.log(blueCandidate);

    expect(blueCandidate.candidateVotes.toNumber()).toEqual(0);

    const [redAddress] = PublicKey.findProgramAddressSync(
      [new anchor.BN(1).toArrayLike(Buffer, 'le', 8), Buffer.from("Red")],
      votingAddress,
    );

    const redCandidate = await votingProgram.account.candidate.fetch(redAddress);
    console.log(redCandidate);
    expect(redCandidate.candidateVotes.toNumber()).toEqual(0);

  });

  it('Vote', async () => {
    await votingProgram.methods
      .vote(
        "Red",
        new anchor.BN(1)
      ).rpc();

      const [redAddress] = PublicKey.findProgramAddressSync(
        [new anchor.BN(1).toArrayLike(Buffer, 'le', 8), Buffer.from("Red")],
        votingAddress,
      );

      const redCandidate = await votingProgram.account.candidate.fetch(redAddress);
      console.log(redCandidate);
      expect(redCandidate.candidateVotes.toNumber()).toEqual(1);

  });

  

});