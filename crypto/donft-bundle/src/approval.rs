use crate::*;
use near_sdk::{ext_contract, Gas};

const GAS_FOR_NFT_APPROVE: Gas = Gas(10_000_000_000_000);
const NO_DEPOSIT: Balance = 0;

pub trait NonFungibleTokenCore {
    //approve an account ID to transfer a token on your behalf
    fn nft_approve(&mut self, token_id: TokenId, account_id: AccountId, msg: Option<String>) -> u64;

    //check if the passed in account has access to approve the token ID
	fn nft_is_approved(
        &self,
        token_id: TokenId,
        approved_account_id: AccountId,
        approval_id: Option<u64>,
    ) -> bool;

    //revoke a specific account from transferring the token on your behalf
    fn nft_revoke(&mut self, token_id: TokenId, account_id: AccountId);

    //revoke all accounts from transferring the token on your behalf
    fn nft_revoke_all(&mut self, token_id: TokenId);

    fn nft_approve_by_id(&mut self, token_id: String, account_id: &AccountId) -> u64;

    fn multiple_nft_approve(&mut self, token_ids: Vec<String>, account_id: AccountId) -> Vec<u64>;
}

#[ext_contract(ext_non_fungible_approval_receiver)]
trait NonFungibleTokenApprovalsReceiver {
    //cross contract call to an external contract that is initiated during nft_approve
    fn nft_on_approve(
        &mut self,
        token_id: TokenId,
        owner_id: AccountId,
        approval_id: u64,
        msg: String,
    );
}

#[macro_export]
macro_rules! near_panic {
    ($msg:literal) => {
        near_sdk::env::panic_str($msg)
    };

    ($msg:literal, $($arg:expr),*) => {
        near_sdk::env::panic_str(format!($msg, $($arg),*).as_str())
    };
}

#[macro_export]
macro_rules! assert_storage_deposit {
    ($required:expr) => {
        if env::attached_deposit() < $required {
            $crate::near_panic!(
                "Requires storage deposit of at least {} yoctoNEAR ({}, {}:{})",
                $required,
                file!(),
                line!(),
                column!()
            );
        }
    };
}

#[near_bindgen]
impl NonFungibleTokenCore for Contract {
    /// Called from nft_approve and nft_batch_approve.
    fn nft_approve_by_id(
        &mut self,
        token_id: String,
        account_id: &AccountId,
    ) -> u64 {
        let mut token = self.tokens_by_id
            .get(&token_id)
            .expect("token: doesn't exist");

        // assert_token_unloaned!(token);
        // assert_token_owned_by_predecessor!(token);
        env::log_str(&format!("approve_internal ID: {}", account_id));
        env::log_str(&format!("token: {:?}", token));
        let approval_id = token.next_approval_id;

        token.next_approval_id += 1;
        token
            .approved_account_ids
            .insert(account_id.clone(), approval_id);

        self.tokens_by_id.insert(&token_id, &token);
        env::log_str(&format!("token after insert: {:?}", token));

        approval_id
    }

    #[payable]
    fn multiple_nft_approve(
        &mut self,
        token_ids: Vec<String>,
        account_id: AccountId,
    ) -> Vec<u64> {
        let initial_storage_usage = env::storage_usage();

        env::log_str("multiple_nft_approve 1");
        let tlen = token_ids.len() as u128;
        assert!(tlen > 0);
        assert!(tlen <= 70);
        let storage_stake = 360 * tlen;
        // Note: This method only guarantees that the store-storage is covered.
        // The financial contract may still reject.
        assert_storage_deposit!(storage_stake);
        // assert!(
        //     env::attached_deposit() > store_approval_storage,
        //     "deposit less than: {}",
        //     store_approval_storage 
        // );
        env::log_str("multiple_nft_approve 2");
        let approval_ids: Vec<u64> = token_ids
            .iter()
            .map(|token_id| self.nft_approve_by_id(token_id.into(), &account_id))
            .collect();

        let required_storage_in_bytes = env::storage_usage() - initial_storage_usage;
        refund_deposit(required_storage_in_bytes);
        
        approval_ids
    }
    //allow a specific account ID to approve a token on your behalf
    #[payable]
    fn nft_approve(&mut self, token_id: TokenId, account_id: AccountId, msg: Option<String>) -> u64 {
        /*
            assert at least one yocto for security reasons - this will cause a redirect to the NEAR wallet.
            The user needs to attach enough to pay for storage on the contract
        */
        assert_at_least_one_yocto();

        //get the token object from the token ID
        let mut token = self.tokens_by_id.get(&token_id).expect("No token");

        // todo: REWORK CROSS CONTRACTS?
        
        //make sure that the person calling the function is the owner of the token
        // assert_eq!(
        //     &env::predecessor_account_id(),
        //     &token.owner_id,
        //     "Predecessor must be the token owner."
        // );

        //get the next approval ID if we need a new approval
        let approval_id: u64 = token.next_approval_id;

        //check if the account has been approved already for this token
        let is_new_approval = token
            .approved_account_ids
            //insert returns none if the key was not present.  
            .insert(account_id.clone(), approval_id)
            //if the key was not present, .is_none() will return true so it is a new approval.
            .is_none();

        //if it was a new approval, we need to calculate how much storage is being used to add the account.
        let storage_used = if is_new_approval {
            bytes_for_approved_account_id(&account_id)
        //if it was not a new approval, we used no storage.
        } else {
            0
        };

        //increment the token's next approval ID by 1
        token.next_approval_id += 1;
        //insert the token back into the tokens_by_id collection
        self.tokens_by_id.insert(&token_id, &token);

        //refund any excess storage attached by the user. If the user didn't attach enough, panic. 
        refund_deposit(storage_used);

        //if some message was passed into the function, we initiate a cross contract call on the
        //account we're giving access to. 
        if let Some(msg) = msg {
            ext_non_fungible_approval_receiver::nft_on_approve(
                token_id,
                token.owner_id,
                approval_id,
                msg,
                account_id, //contract account we're calling
                NO_DEPOSIT, //NEAR deposit we attach to the call
                env::prepaid_gas() - GAS_FOR_NFT_APPROVE, //GAS we're attaching
            )
            .as_return(); // Returning this promise
        }

        approval_id
    }

    //check if the passed in account has access to approve the token ID
	fn nft_is_approved(
        &self,
        token_id: TokenId,
        approved_account_id: AccountId,
        approval_id: Option<u64>,
    ) -> bool {
        //get the token object from the token_id
        let token = self.tokens_by_id.get(&token_id).expect("No token");

        //get the approval number for the passed in account ID
		let approval = token.approved_account_ids.get(&approved_account_id);

        //if there was some approval ID found for the account ID
        if let Some(approval) = approval {
            //if a specific approval_id was passed into the function
			if let Some(approval_id) = approval_id {
                //return if the approval ID passed in matches the actual approval ID for the account
				approval_id == *approval
            //if there was no approval_id passed into the function, we simply return true
			} else {
				true
			}
        //if there was no approval ID found for the account ID, we simply return false
		} else {
			false
		}
    }

    //revoke a specific account from transferring the token on your behalf 
    #[payable]
    fn nft_revoke(&mut self, token_id: TokenId, account_id: AccountId) {
        //assert that the user attached exactly 1 yoctoNEAR for security reasons
        assert_one_yocto();
        //get the token object using the passed in token_id
        let mut token = self.tokens_by_id.get(&token_id).expect("No token");

        //get the caller of the function and assert that they are the owner of the token
        let predecessor_account_id = env::predecessor_account_id();
        assert_eq!(&predecessor_account_id, &token.owner_id);

        //if the account ID was in the token's approval, we remove it and the if statement logic executes
        if token
            .approved_account_ids
            .remove(&account_id)
            .is_some()
        {
            //refund the funds released by removing the approved_account_id to the caller of the function
            refund_approved_account_ids_iter(predecessor_account_id, [account_id].iter());

            //insert the token back into the tokens_by_id collection with the account_id removed from the approval list
            self.tokens_by_id.insert(&token_id, &token);
        }
    }

    //revoke all accounts from transferring the token on your behalf
    #[payable]
    fn nft_revoke_all(&mut self, token_id: TokenId) {
        //assert that the caller attached exactly 1 yoctoNEAR for security
        assert_one_yocto();

        //get the token object from the passed in token ID
        let mut token = self.tokens_by_id.get(&token_id).expect("No token");
        //get the caller and make sure they are the owner of the tokens
        let predecessor_account_id = env::predecessor_account_id();
        assert_eq!(&predecessor_account_id, &token.owner_id);

        //only revoke if the approved account IDs for the token is not empty
        if !token.approved_account_ids.is_empty() {
            //refund the approved account IDs to the caller of the function
            refund_approved_account_ids(predecessor_account_id, &token.approved_account_ids);
            //clear the approved account IDs
            token.approved_account_ids.clear();
            //insert the token back into the tokens_by_id collection with the approved account IDs cleared
            self.tokens_by_id.insert(&token_id, &token);
        }
    }
}