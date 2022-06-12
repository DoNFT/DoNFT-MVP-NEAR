use std::str::FromStr;
use donft_bundle::near_sdk::borsh::{self, BorshDeserialize, BorshSerialize};
use donft_bundle::near_sdk::{
    self,
    AccountId,
    Balance,
    PublicKey,
    Promise,
    CryptoHash,
    env,
    near_bindgen,
    assert_one_yocto,
    is_promise_success,
};

use donft_bundle::{
    NFTContractMetadata,
    gas,
};

use donft_bundle::{
    CollectionInitArgs,
};

use donft_bundle::near_sdk::collections::{LookupMap, UnorderedSet, LookupSet};
use donft_bundle::factory_interfaces::factory_self;
use donft_bundle::serde_json;
use donft_bundle::serde::{Serialize, Deserialize};
use donft_bundle::near_sdk::json_types::U128;

/// Current price for one byte of on-chain storage, denominated in yoctoNEAR.
pub const YOCTO_PER_BYTE: Balance = 10_000_000_000_000_000_000;

/// The argument for non-payable cross contract calls.
/// ref: https://github.com/near/core-contracts/blob/master/staking-pool/src/lib.rs#L26
pub const NO_DEPOSIT: Balance = 0;

pub mod storage_bytes {
    use donft_bundle::near_sdk::StorageUsage;
    /// Storage bytes that a raw store occupies, about 499 KB.
    pub const STORE: StorageUsage = 550_000;

    /// Storage bytes for a maximum size token without any metadata and without
    /// any royalties.
    pub const TOKEN: StorageUsage = 360;

    /// Storage bytes for some common components:
    ///
    /// - a single royalty
    /// - a single approval
    /// - an entry in the `tokens_per_account` map
    /// - an entry in the `composeables` map
    pub const COMMON: StorageUsage = 80;
}

pub mod storage_stake {
    use donft_bundle::near_sdk::Balance;
    use super::YOCTO_PER_BYTE;

    const fn bytes_to_stake(bytes: u64) -> Balance {
        (bytes as Balance) * YOCTO_PER_BYTE
    }

    /// Storage stake required to deploy a store.
    pub const STORE: Balance = bytes_to_stake(super::storage_bytes::STORE);

    /// Storage stake required to hold a maximum size token without any metadata
    /// and without any royalties.
    pub const TOKEN: Balance = bytes_to_stake(super::storage_bytes::TOKEN);

    /// Storage stake required for some common components:
    ///
    /// - adding a single royalty
    /// - adding a single approval
    /// - adding a new entry to the `tokens_per_account` map
    /// - adding a new entry to the `composeables` map
    pub const COMMON: Balance = bytes_to_stake(super::storage_bytes::COMMON);

    /// Require 0.1 NEAR of storage stake to remain unused.
    pub const CUSHION: Balance = 10u128.pow(23);
}

// ----------------------- contract interface modules ----------------------- //
impl Default for DonftCollectionFactory {
    fn default() -> Self {
        env::panic_str("Not initialized yet.");
    }
}

// ----------------------------- smart contract ----------------------------- //
#[near_bindgen]
#[derive(BorshDeserialize, BorshSerialize)]
pub struct DonftCollectionFactory {
    /// The `Store`s this `Factory` has produced.
    pub stores: LookupMap<AccountId, UnorderedSet<String>>,
    pub stores_without_owner: LookupSet<String>,
    /// Fee taken by Mintbase for `Store` deployment.
    pub mintbase_fee: Balance,
    /// The owner may update the `mintbase_fee`.
    pub owner_id: AccountId,
    /// The Near-denominated price-per-byte of storage. As of April 2021, the
    /// price per bytes is set by default to 10^19, but this may change in the
    /// future, thus this future-proofing field.
    pub storage_price_per_byte: u128,
    /// Cost in yoctoNear to deploy a store. Changes if `storage_price_per_byte`
    /// changes.
    pub store_cost: u128,
    /// The public key to give a full access key to
    pub admin_public_key: PublicKey,
}

#[derive(Serialize, Deserialize)]
#[serde(crate = "near_sdk::serde")]
pub struct StoreData {
    //owner of the token
    pub store_owner_id: AccountId,
    //store id
    pub store_id: String,
}

/// Helper structure for keys of the persistent collections.
#[derive(BorshSerialize)]
pub enum StoreKey {
    TokensPerOwner,
    TokenPerOwnerInner { account_id_hash: CryptoHash },
}

//used to generate a unique prefix in our storage collections (this is to avoid data collisions)
pub(crate) fn hash_account_id(account_id: &AccountId) -> CryptoHash {
    //get the default hash
    let mut hash = CryptoHash::default();
    //we hash the account ID and return it
    hash.copy_from_slice(&env::sha256(account_id.as_bytes()));
    hash
}

#[near_bindgen]
impl DonftCollectionFactory {
    fn get_store_data(
        &self,
        token_id: String,
        account_id: AccountId,
    ) -> Option<StoreData> {
        Some(StoreData {
            store_owner_id: account_id,
            store_id: token_id,
        })
    }

    //add a token to the set of tokens an owner has
    pub(crate) fn internal_add_store_to_owner(
        &mut self,
        account_id: &AccountId,
        token_id: &String,
    ) {
        //get the set of tokens for the given account
        let mut tokens_set = self.stores.get(account_id).unwrap_or_else(|| {
            //if the account doesn't have any tokens, we create a new unordered set
            UnorderedSet::new(
                StoreKey::TokenPerOwnerInner {
                    //we get a new unique prefix for the collection
                    account_id_hash: hash_account_id(&account_id),
                }
                .try_to_vec()
                .unwrap(),
            )
        });

        //we insert the token ID into the set
        tokens_set.insert(token_id);

        //we insert that set for the given account ID. 
        self.stores.insert(account_id, &tokens_set);
    }

    // todo: map return values in the next view, change to store_id ARRAY
    // { store_owner_id: 'alice.test.near', store_id: 'alice_store' },
    // { store_owner_id: 'alice.test.near', store_id: 'alice_store1' },
    // { store_owner_id: 'alice.test.near', store_id: 'alice_store2' }
  
    //Query for all get_stores_collection
    pub fn get_stores_collection(
        &self,
        account_id: AccountId,
        from_index: Option<U128>,
        limit: Option<u64>,
    ) -> Vec<StoreData> {
        //get the set of tokens for the passed in owner
        let store_for_owner_set = self.stores.get(&account_id);
        //if there is some set of tokens, we'll set the tokens variable equal to that set
        let stores_list = if let Some(store_for_owner_set) = store_for_owner_set {
            store_for_owner_set
        } else {
            //if there is no set of tokens, we'll simply return an empty vector. 
            return vec![];
        };

        //where to start pagination - if we have a from_index, we'll use that - otherwise start from 0 index
        let start = u128::from(from_index.unwrap_or(U128(0)));

        //iterate through the keys vector
        stores_list.iter()
            //skip to the index we specified in the start variable
            .skip(start as usize) 
            //take the first "limit" elements in the vector. If we didn't specify a limit, use 50
            .take(limit.unwrap_or(50) as usize) 
            //we'll map the token IDs which are strings into Json Tokens
            .map(|token_id| self.get_store_data(token_id.clone(), account_id.clone()).unwrap())
            //since we turned the keys into an iterator, we need to turn it back into a vector to return
            .collect()
    }

    pub fn assert_only_owner(&self) {
        assert_one_yocto();
        assert_eq!(
            env::predecessor_account_id(),
            self.owner_id,
            "Only contract owner can call this method"
        );
    }

    /// If a `Store` with `store_id` has been produced by this `Factory`, return `true`.
    pub fn check_contains_store(
        &self,
        store_id: String,
    ) -> bool {
        self.stores_without_owner.contains(&store_id)
    }


    #[private]
    pub fn on_create(
        &mut self,
        store_creator_id: AccountId,
        metadata: NFTContractMetadata,
        owner_id: AccountId,
        store_account_id: AccountId,
        attached_deposit: U128,
    ) {
        let attached_deposit: u128 = attached_deposit.into();
        env::log_str("on_create");
        if is_promise_success() {
            env::log_str("on_create is_promise_success");
            // pay out self and update contract state
            self.internal_add_store_to_owner(&owner_id, &metadata.name);
            self.stores_without_owner.insert(&metadata.name);

            Promise::new(self.owner_id.to_string().parse().unwrap())
                .transfer(attached_deposit - self.store_cost);
        } else {
            // Refunding store cost creation to the store creator
            Promise::new(store_creator_id).transfer(attached_deposit - self.store_cost);
            env::log_str("failed store deployment");
        }
    }

    #[init(ignore_state)]
    pub fn new() -> Self {
        assert!(!env::state_exists());
        let storage_price_per_byte = YOCTO_PER_BYTE; // 10^19
        Self {
            stores: LookupMap::new(StoreKey::TokensPerOwner.try_to_vec().unwrap()),
            stores_without_owner: LookupSet::new(b"t".to_vec()),
            mintbase_fee: 0, // 0 by default
            owner_id: env::predecessor_account_id(),
            storage_price_per_byte,
            store_cost: storage_stake::STORE,
            admin_public_key: env::signer_account_pk(),
        }
    }

    /// Contract metadata and methods in the API may be updated. All other
    /// elements of the state should be copied over. This method may only be
    /// called by the holder of the contract private key.
    #[private]
    #[init(ignore_state)]
    pub fn migrate() -> Self {
        let old = env::state_read().expect("ohno ohno state");
        Self { ..old }
    }

    /// `create_store` checks that the attached deposit is sufficient before
    /// parsing the given store_id, validating no such store subaccount exists yet
    /// and generates a new store from the store metadata.
    #[payable]
    pub fn create_store(
        &mut self,
        metadata: NFTContractMetadata,
        owner_id: AccountId,
    ) -> Promise {
        assert_ne!(&metadata.name, "market"); // marketplace lives here
        assert_ne!(&metadata.name, "loan"); // loan lives here
        env::log_str(&format!("Current ID: {}", env::current_account_id()).to_string());
        env::log_str("create_store deployment");
        let metadata = NFTContractMetadata::new(metadata);
        let init_args = serde_json::to_vec(&CollectionInitArgs {
            metadata: metadata.clone(),
            owner_id: owner_id.clone(),
        })
        .unwrap();
        // StoreId is only the subaccount. store_account_id is the full near qualified name.
        // Note, validity checked in `NFTContractMetadata::new;` above.

        let store_account_id =
            AccountId::from_str(&*format!("{}.{}", metadata.name, env::current_account_id()))
                .unwrap();

        let store_account = format!("{}.{}", metadata.name, env::current_account_id());
        assert!(
            env::is_valid_account_id(store_account.as_bytes()),
            "Invalid character in store id"
        );

        Promise::new(store_account_id.clone())
            .create_account()
            .transfer(self.store_cost)
            .add_full_access_key(self.admin_public_key.clone())
            .deploy_contract(include_bytes!("../../out/donft_bundle.wasm").to_vec())
            .function_call("new_meta".to_string(), init_args, 0, gas::CREATE_STORE)
            .then(factory_self::on_create(
                env::predecessor_account_id(),
                metadata,
                owner_id,
                store_account_id,
                env::attached_deposit().into(),
                env::current_account_id(),
                NO_DEPOSIT,
                gas::ON_CREATE_CALLBACK,
            ))
    }
}

// ------------------------ impls on external types ------------------------- //
// TODO: Why the trait? -> to be able to impl it in this crate
pub trait New {
    fn new(arg: Self) -> Self;
}

impl New for NFTContractMetadata {
    fn new(args: NFTContractMetadata) -> Self {
        let store_account = format!("{}.{}", args.name, env::current_account_id());
        assert!(
            env::is_valid_account_id(store_account.as_bytes()),
            "Invalid character in store id"
        );
        assert!(args.symbol.len() <= 6);

        Self {
            spec: args.spec,
            name: args.name,
            symbol: args.symbol,
            icon: args.icon,
            base_uri: args.base_uri,
            reference: args.reference,
            reference_hash: args.reference_hash,
        }
    }
}
