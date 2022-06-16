use near_sdk::collections::Vector;
use near_sdk::{Gas};
//use serde_derive::{Serialize, Deserialize};
use crate::*;

const GAS_FOR_RESOLVE_TRANSFER: Gas = Gas(10_000_000_000_000);
const GAS_FOR_NFT_TRANSFER_CALL: Gas = Gas(25_000_000_000_000 + GAS_FOR_RESOLVE_TRANSFER.0);
const DEPOSIT: Balance = 1;

#[near_bindgen]
impl Contract {
    #[payable]
    pub fn nft_unbundle(
        &mut self,
        token_id: TokenId,
    ) {
        assert_one_yocto();
        //get the sender to transfer the token from the sender to the receiver
        let caller_id = env::predecessor_account_id();
        //get the token object if there is some token object
        if let Some(token) = self.tokens_by_id.get(&token_id) {
            if token.owner_id != caller_id {
                //we refund the owner for releasing the storage used up by the approved account IDs
                //refund_approved_account_ids(owner_id, &approved_account_ids);
                // The token is not owner by the receiver anymore. Can't return it.
            }
            
            let mut range_iterator = token.bundles.iter();
            while let Some(bundle) = range_iterator.next() {
                ext_nft::nft_transfer(
                    caller_id.clone(),
                    bundle.token_id.clone(),
                    bundle.approval_id.clone(),
                    None,
                    bundle.contract.clone(), // contract account id
                    DEPOSIT, // yocto NEAR to attach
                    GAS_FOR_NFT_TRANSFER_CALL // gas to attach
                );
            }

            //we remove the token from the receiver
            self.internal_remove_token_from_owner(&caller_id.clone(), &token_id);
        } else {
            //we refund the owner for releasing the storage used up by the approved account IDs
           // refund_approved_account_ids(self.owner_id, &approved_account_ids);
        };

    }
}