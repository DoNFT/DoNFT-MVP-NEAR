use std::collections::HashMap;
use near_sdk::{
    env,
    near_bindgen,
    AccountId,
    Balance,
    CryptoHash,
    PanicOnDefault,
    Promise,
    PromiseOrValue,
    ext_contract,
};

pub use near_sdk::{
    self,
    serde,
    serde_json,
};

use near_sdk::collections::{LazyOption, LookupMap, UnorderedMap, UnorderedSet};
use near_sdk::borsh::{self, BorshDeserialize, BorshSerialize};
use near_sdk::json_types::{Base64VecU8, U128};
use near_sdk::serde::{Deserialize, Serialize};

use crate::internal::*;
pub use crate::metadata::*;
pub use crate::bundle::*;
pub use crate::mint::*;
pub use crate::nft_core::*;
pub use crate::approval::*;
pub use crate::royalty::*;
pub use crate::events::*;
pub use crate::unbundle::*;

pub mod internal;
pub mod approval; 
pub mod bundle;
pub mod enumeration; 
pub mod metadata; 
pub mod mint; 
pub mod nft_core; 
pub mod royalty; 
pub mod events;

/// This spec can be treated like a version of the standard.
pub const NFT_METADATA_SPEC: &str = "1.0.0";
/// This is the name of the NFT standard we're using
pub const NFT_STANDARD_NAME: &str = "nep171";

pub mod gas {
    use near_sdk::Gas;

    const fn tgas(n: u64) -> Gas {
        Gas(n * 10u64.pow(12))
    }

    /// Gas requirements for resolving a payout struct.
    pub const PAYOUT_RESOLVE: Gas = tgas(30);

    /// Gas requirements for transferring an NFT and obtaining the payout.
    pub const NFT_TRANSFER_PAYOUT: Gas = tgas(15);

    /// Gas requirements for creating a store.
    pub const CREATE_STORE: Gas = tgas(65 + 5);

    /// Gas requirements for
    pub const ON_CREATE_CALLBACK: Gas = tgas(10);

    /// Gas requirements for
    pub const NFT_BATCH_APPROVE: Gas = tgas(100);

    // ref: https://github.com/near-apps/nft-market/blob/main/contracts/nft-simple/src/nft_core.rs
    /// Gas requirements for resolving a `nft_transfer_call` XCC
    pub const RESOLVE_TRANSFER: Gas = tgas(10);

    /// Gas requirements for `nft_transfer_call`
    pub const NFT_TRANSFER_CALL: Gas = tgas(35);

    /// Gas requirements for `nft_transfer_call`
    pub const NFT_ON_APPROVE: Gas = tgas(25);
}

/// Interfaces that we need the factory to be aware of
#[cfg(feature = "factory-wasm")]
#[allow(clippy::too_many_arguments)]
pub mod factory_interfaces {
    use near_sdk::json_types::U128;
    use near_sdk::{
        self,
        ext_contract,
    };

    use crate::metadata::NFTContractMetadata;

    #[ext_contract(factory_self)]
    pub trait OnCreateCallback {
        fn on_create(
            &mut self,
            store_creator_id: AccountId,
            metadata: NFTContractMetadata,
            owner_id: AccountId,
            store_account_id: AccountId,
            attached_deposit: U128,
        );
    }
}

#[near_bindgen]
#[derive(BorshDeserialize, BorshSerialize, PanicOnDefault)]
pub struct Contract {
    //contract owner
    pub owner_id: AccountId,

    //keeps track of all the token IDs for a given account
    pub tokens_per_owner: LookupMap<AccountId, UnorderedSet<TokenId>>,

    //keeps track of the token struct for a given token ID
    pub tokens_by_id: LookupMap<TokenId, Token>,

    //keeps track of the token metadata for a given token ID
    pub token_metadata_by_id: UnorderedMap<TokenId, TokenMetadata>,

    //keeps track of the metadata for the contract
    pub metadata: LazyOption<NFTContractMetadata>,
}

/// Helper structure for keys of the persistent collections.
#[derive(BorshSerialize)]
pub enum StorageKey {
    TokensPerOwner,
    TokenPerOwnerInner { account_id_hash: CryptoHash },
    TokensById,
    TokenMetadataById,
    NFTContractMetadata,
    TokensPerType,
    TokensPerTypeInner { token_type_hash: CryptoHash },
    TokenTypesLocked,
}

#[near_bindgen]
impl Contract {
    /*
        initialization function (can only be called once).
        this initializes the contract with default metadata so the
        user doesn't have to manually type metadata.
    */
    #[init]
    pub fn new_default_meta(owner_id: AccountId) -> Self {
        //calls the other function "new: with some default metadata and the owner_id passed in 
        Self::new_meta(
            owner_id,
            NFTContractMetadata {
                spec: "nft-1.0.1".to_string(),
                name: "DoNFT Contract".to_string(),
                symbol: "DONFT".to_string(),
                icon: None,
                base_uri: Some(String::from("donft.io")),
                reference: None,
                reference_hash: None,
            },
        )
    }

    /*
        initialization function (can only be called once).
        this initializes the contract with metadata that was passed in and
        the owner_id. 
    */
    #[init]
    pub fn new_meta(owner_id: AccountId, metadata: NFTContractMetadata) -> Self {
        //create a variable of type Self with all the fields initialized. 
        let this = Self {
            //Storage keys are simply the prefixes used for the collections. This helps avoid data collision
            tokens_per_owner: LookupMap::new(StorageKey::TokensPerOwner.try_to_vec().unwrap()),
            tokens_by_id: LookupMap::new(StorageKey::TokensById.try_to_vec().unwrap()),
            token_metadata_by_id: UnorderedMap::new(
                StorageKey::TokenMetadataById.try_to_vec().unwrap(),
            ),
            //set the owner_id field equal to the passed in owner_id. 
            owner_id,
            metadata: LazyOption::new(
                StorageKey::NFTContractMetadata.try_to_vec().unwrap(),
                Some(&metadata),
            ),
        };

        //return the Contract object
        this
    }

}