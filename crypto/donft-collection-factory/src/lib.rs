use std::str::FromStr;

use donft_bundle::near_sdk::borsh::{self, BorshDeserialize, BorshSerialize};

use donft_bundle::near_sdk::{
    self,
    AccountId,
    Balance,
    PublicKey,
    Promise,
    env,
    near_bindgen,
    assert_one_yocto,
    is_promise_success,
};


use donft_bundle::{
    NFTContractMetadata,
};

use donft_bundle::{
    CollectionInitArgs,
};

use donft_bundle::factory_interfaces::factory_self;
use donft_bundle::serde_json;
use donft_bundle::near_sdk::collections::LookupSet;
use donft_bundle::near_sdk::json_types::U128;

/// Current price for one byte of on-chain storage, denominated in yoctoNEAR.
pub const YOCTO_PER_BYTE: Balance = 10_000_000_000_000_000_000;

/// The argument for non-payable cross contract calls.
/// ref: https://github.com/near/core-contracts/blob/master/staking-pool/src/lib.rs#L26
pub const NO_DEPOSIT: Balance = 0;

pub mod gas {
    use donft_bundle::near_sdk::Gas;

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

// ----------------------------- smart contract ----------------------------- //
#[near_bindgen]
#[derive(BorshDeserialize, BorshSerialize)]
pub struct DonftCollectionFactory {
    /// The `Store`s this `Factory` has produced.
    pub stores: LookupSet<String>,
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

#[near_bindgen]
impl DonftCollectionFactory {
    pub fn assert_only_owner(&self) {
        assert_one_yocto();
        assert_eq!(
            env::predecessor_account_id(),
            self.owner_id,
            "Only contract owner can call this method"
        );
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
        if is_promise_success() {
            // pay out self and update contract state
            self.stores.insert(&metadata.name);
            Promise::new(self.owner_id.to_string().parse().unwrap())
                .transfer(attached_deposit - self.store_cost);
            #[cfg(feature = "panic-test")]
            env::panic_str("event.near_json_event().as_str()");
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
            stores: LookupSet::new(b"t".to_vec()),
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
        Promise::new(store_account_id.clone())
            .create_account()
            .transfer(self.store_cost)
            .add_full_access_key(self.admin_public_key.clone())
            .deploy_contract(include_bytes!("../../out/donft_bundle.wasm").to_vec())
            .function_call("new".to_string(), init_args, 0, gas::CREATE_STORE)
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
