import * as anchor from "@coral-xyz/anchor";
import * as web3 from "@solana/web3.js";
import type { Favourites } from "../target/types/favourites";

// Configure the client to use the local cluster
anchor.setProvider(anchor.AnchorProvider.env());

const program = anchor.workspace.Favourites as anchor.Program<Favourites>;

// Client
console.log("My address:", program.provider.publicKey.toString());
const balance = await program.provider.connection.getBalance(program.provider.publicKey);
console.log(`My balance: ${balance / web3.LAMPORTS_PER_SOL} SOL`);
