use crate::*;
use near_sdk::{ext_contract, Gas};

const GAS_FOR_RESOLVE_TRANSFER: Gas = Gas(10_000_000_000_000);
const GAS_FOR_NFT_TRANSFER_CALL: Gas = Gas(25_000_000_000_000 + GAS_FOR_RESOLVE_TRANSFER.0);
const DEPOSIT: Balance = 1;
pub const GAS_RESERVED_FOR_CURRENT_CALL: Gas = Gas(80_000_000_000_000);

const fn tgas(n: u64) -> Gas {
    Gas(n * 10u64.pow(12))
}

#[ext_contract(ext_nft)]
trait NFT {
    fn nft_transfer(
        &mut self,
        receiver_id: AccountId,
        token_id: TokenId,
        //we introduce an approval ID so that people with that approval ID can transfer the token
        approval_id: u64,
        memo: Option<String>,
    );

    fn multiple_nft_approve(&mut self, token_ids: Vec<String>, account_id: AccountId) -> Vec<u64>;
}

// define methods we'll use as callbacks on our contract
#[ext_contract(ext_self)]
pub trait MyContract {
    fn my_callback(
        &self,
        token_id: TokenId,
        metadata: TokenMetadata,
        bundles: Vec<Bundle>,
        perpetual_royalties: Option<HashMap<AccountId, u32>>,
    );
}

#[near_bindgen]
impl Contract {
    pub fn nft_bundle(
        &mut self,
        token_id: TokenId,
        metadata: TokenMetadata,
        bundles: Vec<Bundle>,
        //we add an optional parameter for perpetual royalties
        perpetual_royalties: Option<HashMap<AccountId, u32>>,
    ) {
        env::log_str(&format!("nft_bundle: {:?}", bundles));
        let caller_id = env::current_account_id();
        //measure the initial storage being used on the contract
        // let initial_storage_usage = env::storage_usage();
        env::log_str(&format!("caller_id: {:?}", caller_id));

        // create a royalty map to store in the token
        let mut royalty = HashMap::new();

        // if perpetual royalties were passed into the function: 
        if let Some(perpetual_royalties) = perpetual_royalties {
            //make sure that the length of the perpetual royalties is below 7 since we won't have enough GAS to pay out that many people
            assert!(perpetual_royalties.len() < 7, "Cannot add more than 6 perpetual royalty amounts");

            //iterate through the perpetual royalties and insert the account and amount in the royalty map
            for (account, amount) in perpetual_royalties {
                royalty.insert(account, amount);
            }
        }

        //specify the token struct that contains the owner ID 
        let token = Token {
            //set the owner ID equal to the receiver ID passed into the function
            owner_id: caller_id.clone(),
            //we set the approved account IDs to the default value (an empty map)
            approved_account_ids: Default::default(),
            //the next approval ID is set to 0
            next_approval_id: 0,
            //the map of perpetual royalties for the token (The owner will get 100% - total perpetual royalties)
            royalty,
            bundles: bundles.clone(),
        };

        let mut range_iterator = bundles.iter();
        while let Some(bundle) = range_iterator.next() {
            ext_nft::nft_transfer(
                env::current_account_id(),
                bundle.token_id.clone(),
                bundle.approval_id.clone(),
                None,
                bundle.contract.clone(), // contract account id
                DEPOSIT, // yocto NEAR to attach
                GAS_FOR_NFT_TRANSFER_CALL // gas to attach
            );
        }

        //insert the token ID and token struct and make sure that the token doesn't exist
        assert!(
            self.tokens_by_id.insert(&token_id, &token).is_none(),
            "Token already exists"
        );

        //insert the token ID and metadata
        self.token_metadata_by_id.insert(&token_id, &metadata);

        //call the internal method for adding the token to the owner
        self.internal_add_token_to_owner(&token.owner_id, &token_id);
        env::log_str(&format!("self.tokens_per_owner: {:?}", self.tokens_per_owner));
        env::log_str(&format!("self.token_metadata_by_id: {:?}", self.token_metadata_by_id));
        env::log_str(&format!("self.tokens_by_id: {:?}", self.tokens_by_id));

        // Construct the mint log as per the events standard.
        let nft_mint_log: EventLog = EventLog {
            // Standard name ("nep171").
            standard: NFT_STANDARD_NAME.to_string(),
            // Version of the standard.
            version: NFT_METADATA_SPEC.to_string(),
            // The data related with the event stored in a vector.
            event: EventLogVariant::NftMint(vec![NftMintLog {
                // Owner of the token.
                owner_id: token.owner_id.to_string(),
                // Vector of token IDs that were minted.
                token_ids: vec![token_id.to_string()],
                // An optional memo to include.
                memo: None,
            }]),
        };

        // Log the serialized json.
        env::log_str(&nft_mint_log.to_string());

        //calculate the required storage which was the used - initial
        // let required_storage_in_bytes = env::storage_usage() - initial_storage_usage;

        //refund any excess storage if the user attached too much. Panic if they didn't attach enough to cover the required.
        // refund_deposit(required_storage_in_bytes);
    }

    #[payable]
    pub fn nft_bundle_with_approve(
        &mut self,
        tokens_for_approve: Vec<String>,
        account_for_approve: AccountId,
        contract_of_tokens: AccountId,
        token_id: TokenId,
        metadata: TokenMetadata,
        bundles: Vec<Bundle>,
        //we add an optional parameter for perpetual royalties
        perpetual_royalties: Option<HashMap<AccountId, u32>>,
    ) {
        //measure the initial storage being used on the contract
        let initial_storage_usage = env::storage_usage();

        // Storage 80 bytes for some common components:
        // - a single royalty
        // - a single approval
        // - an entry in the `tokens_per_account` map
        // - an entry in the `composables` map

        let storage_stake = 80 * tokens_for_approve.len() as u128;
        env::log_str(&format!("storage_usage 2: {}", initial_storage_usage));

        let storage_for_approve: Gas = tgas(60);
        env::log_str(&format!("storage_for_approve: {:?}", storage_for_approve));
        let gas_before_call = env::used_gas();
        env::log_str(&format!("gas_before_call: {:?}", gas_before_call));
        let call = ext_nft::multiple_nft_approve(
            tokens_for_approve,
            account_for_approve.clone(),
            contract_of_tokens.clone(),
            env::attached_deposit(), // yocto NEAR to attach, for approving tokens
            storage_for_approve // gas to attach
        );
        let gas_before_callback = env::used_gas();
        env::log_str(&format!("gas_before_callback: {:?}", gas_before_callback));
        let REMAINING_GAS: Gas = env::prepaid_gas()
        - env::used_gas()
        - storage_for_approve
        - GAS_RESERVED_FOR_CURRENT_CALL;
        let callback = ext_self::my_callback(
            token_id,
            metadata,
            bundles,
            perpetual_royalties,
            env::current_account_id(),
            5, // yocto NEAR to attach
            REMAINING_GAS // gas to attach
        );
        env::log_str(&format!("REMAINING_GAS: {:?}", REMAINING_GAS));
        let gas_after_callback = env::used_gas();
        env::log_str(&format!("gas_after_callback: {:?}", gas_after_callback));
        call.then(callback);

        //calculate the required storage which was the used - initial
        let required_storage_in_bytes = env::storage_usage() - initial_storage_usage;

        //refund any excess storage if the user attached too much. Panic if they didn't attach enough to cover the required.
        refund_deposit(required_storage_in_bytes);
    }

    pub fn my_callback(
        mut self,
        token_id: TokenId,
        metadata: TokenMetadata,
        mut bundles: Vec<Bundle>,
        perpetual_royalties: Option<HashMap<AccountId, u32>>,
    ) {
        assert_eq!(
            env::promise_results_count(),
            1,
            "This is a callback method"
        );

        // handle the result from the cross contract call this method is a callback for
        match env::promise_result(0) {
            PromiseResult::NotReady => unreachable!(),
            PromiseResult::Failed => panic!("failed promise"),
            PromiseResult::Successful(result) => {
                env::log_str(&format!("result promise 1: {:?}", result));
                let approved_ids = near_sdk::serde_json::from_slice::<Vec<u64>>(&result).unwrap();

                env::log_str(&format!("bundles 1: {:?}", bundles));
                for i in 0..approved_ids.len() {
                    bundles[i].approval_id = approved_ids[i]
                };

                env::log_str(&format!("bundles 2: {:?}", bundles));
                env::log_str(&format!("result promise 3: {:?}", approved_ids));
                self.nft_bundle(token_id, metadata, bundles, perpetual_royalties);
            },
        }
    }
}