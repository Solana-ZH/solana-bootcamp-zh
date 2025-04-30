use anchor_lang::prelude::*;
// Our program's address!
// This matches the key in the target/deploy directory
declare_id!("2Fq9BjSHMLcEH8wX4JfgU6mxa1TWouwh21jvp1r34A86");

pub const ANCHOR_DISCRIMINATOR_SIZE: usize = 8;

// Our Solana program! 
#[program]
pub mod favourites {
    use super::*;

    // Our instruction handler! It sets the user's favorite number and color
    pub fn set_favorates(
        ctx: Context<SetFavorites>,
        number: u64,
        color: String,
        hobbies: Vec<String>,
    ) -> Result<()> {
        // add later
        msg!("Greetings from {}", ctx.program_id);
        let user_public_key = ctx.accounts.user.key();

        msg!(
            "User {}'s favourite number is {}, favourite color is {}, and their hobbies are {:?}",
            user_public_key,
            number,
            color,
            hobbies
        );

        ctx.accounts.favorites.set_inner(Favorites {
            number,
            color,
            hobbies,
        });

        Ok(())
    }

    // We can also add a get_favorites instruction handler to return the user's favorite number and color
}

// What we will put inside the Favorites PDA
#[account]
#[derive(InitSpace)]
pub struct Favorites {
    pub number: u64,
    #[max_len(50)]
    pub color: String,
    #[max_len(5, 50)]
    pub hobbies: Vec<String>,
}

// When people call the set_favorites instruction, they will need to provide the accounts that will be modifed. This keeps Solana fast!
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
