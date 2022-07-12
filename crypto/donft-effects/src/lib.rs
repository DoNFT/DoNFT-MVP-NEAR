use donft_bundle::near_sdk::borsh::{self, BorshDeserialize, BorshSerialize};
use donft_bundle::near_sdk::{
    self,
    AccountId,
    near_bindgen,
};

#[near_bindgen]
#[derive(BorshDeserialize, BorshSerialize)]
pub struct Contract {
    //contract owner
    pub owner_id: AccountId,
}


#[near_bindgen]
impl Contract {
    /*
        initialization function (can only be called once).
        this initializes the contract with default metadata so the
        user doesn't have to manually type metadata.
    */
    #[init]
    pub fn new_default_effects_meta(owner_id: AccountId) -> Self {
        //calls the other function "new: with some default metadata and the owner_id passed in 
        Self::new_effects_meta(
            owner_id,
        )
    }

    /*
        initialization function (can only be called once).
        this initializes the contract with metadata that was passed in and
        the owner_id. 
    */
    #[init]
    pub fn new_effects_meta(owner_id: AccountId) -> Self {
        //create a variable of type Self with all the fields initialized. 
        let this = Self {
            owner_id,
        };

        //return the Contract object
        this
    }

}