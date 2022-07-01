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
    fn nft_approve(&mut self, token_id: TokenId, account_id: AccountId, msg: Option<String>) -> u64;
}

// define methods we'll use as callbacks on our contract
#[ext_contract(ext_self)]
pub trait CallbacksContract {
    fn bundle_on_approve_callback(
        &mut self,
        token_id: TokenId,
        metadata: TokenMetadata,
        bundles: Vec<Bundle>,
        owner_id: AccountId,
        perpetual_royalties: Option<HashMap<AccountId, u32>>,
    );

    fn add_to_bundle_on_callback(
        &mut self,
        mut approved_token_data: Bundle,
        mut bundle_token_data: Token,
        bundle_token_id: TokenId,
    );
}

#[near_bindgen]
impl Contract {
    #[payable]
    pub fn remove_token_from_bundle(
        &mut self,
        bundle_token_id: TokenId,
        remove_token_data: Bundle,
    ) -> Option<Token> {
        if let Some(mut token_data) = self.tokens_by_id.get(&bundle_token_id) {
            //we'll get the metadata for that token
            token_data.bundles.retain(|x| x.token_id != remove_token_data.token_id);

            ext_nft::nft_transfer(
                env::predecessor_account_id(),
                remove_token_data.token_id.clone(),
                remove_token_data.approval_id.clone(),
                None,
                remove_token_data.contract.clone(), // contract account id
                DEPOSIT, // yocto NEAR to attach
                GAS_FOR_NFT_TRANSFER_CALL // gas to attach
            );

            Some(token_data)
        } else { //if there wasn't a token ID in the tokens_by_id collection, we return None
            None
        }
    }

    #[payable]
    pub fn add_token_to_bundle(
        &mut self,
        token_to_add_data: JsonToken,
        // contract of minted token, which we gonna approve
        contract_of_mint: AccountId,
        bundle_token_id: TokenId,
    ) -> Option<Token> {
        let storage_for_approve: Gas = tgas(80);

        if let Some(mut bundle_token_data) = self.tokens_by_id.get(&bundle_token_id) {
            //specify the token struct that contains the owner ID 
            let approved_token_data = Bundle {
                contract: contract_of_mint.clone(),
                //list of approved account IDs that have access to transfer the token. This maps an account ID to an approval ID
                token_id: token_to_add_data.token_id.clone(),
                //the next approval ID to give out. 
                approval_id: 0,
            };

            ext_nft::nft_approve(
                token_to_add_data.token_id.clone(),
                env::current_account_id(),
                None,
                contract_of_mint.clone(),
                env::attached_deposit(), // yocto NEAR to attach, for approving tokens
                storage_for_approve // gas to attach
            )
            .then(
                ext_self::add_to_bundle_on_callback(
                    approved_token_data,
                    bundle_token_data.clone(),
                    bundle_token_id,
                    env::current_account_id(),
                    0, // yocto NEAR to attach
                    env::prepaid_gas()
                    - env::used_gas()
                    - storage_for_approve
                    - GAS_RESERVED_FOR_CURRENT_CALL // gas to attach
                )
            );

            Some(bundle_token_data)
        } else { //if there wasn't a token ID in the tokens_by_id collection, we return None
            None
        }

    }

    #[payable]
    pub fn nft_bundle(
        &mut self,
        token_id: TokenId,
        metadata: TokenMetadata,
        bundles: Vec<Bundle>,
        owner_id: AccountId,
        //we add an optional parameter for perpetual royalties
        perpetual_royalties: Option<HashMap<AccountId, u32>>,
    ) {
        let caller_id = owner_id;

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
        owner_id: AccountId,
        //we add an optional parameter for perpetual royalties
        perpetual_royalties: Option<HashMap<AccountId, u32>>,
    ) {
        let initial_storage_usage = env::storage_usage();
        // Storage 80 bytes for some common components:
        // - a single royalty
        // - a single approval
        // - an entry in the `tokens_per_account` map
        // - an entry in the `composables` map
        let storage_stake = 80 * tokens_for_approve.len() as u128;

        let storage_for_approve: Gas = tgas(80);

        ext_nft::multiple_nft_approve(
            tokens_for_approve,
            account_for_approve.clone(),
            contract_of_tokens.clone(),
            env::attached_deposit(), // yocto NEAR to attach, for approving tokens
            storage_for_approve // gas to attach
        )
        .then(
            ext_self::bundle_on_approve_callback(
                token_id,
                metadata,
                bundles,
                owner_id,
                perpetual_royalties,
                env::current_account_id(),
                0, // yocto NEAR to attach
                env::prepaid_gas()
                - env::used_gas()
                - storage_for_approve
                - GAS_RESERVED_FOR_CURRENT_CALL // gas to attach
            )
        );

        //calculate the required storage which was the used - initial
        let required_storage_in_bytes = env::storage_usage() - initial_storage_usage;

        //refund any excess storage if the user attached too much. Panic if they didn't attach enough to cover the required.
        refund_deposit(required_storage_in_bytes);
    }

    #[private]
    pub fn bundle_on_approve_callback(
        &mut self,
        token_id: TokenId,
        metadata: TokenMetadata,
        mut bundles: Vec<Bundle>,
        owner_id: AccountId,
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
                let approved_ids = near_sdk::serde_json::from_slice::<Vec<u64>>(&result).unwrap();

                for i in 0..approved_ids.len() {
                    bundles[i].approval_id = approved_ids[i]
                };

                self.nft_bundle(token_id, metadata, bundles, owner_id, perpetual_royalties);
            },
        }
    }

    #[private]
    pub fn add_to_bundle_on_callback(
        &mut self,
        mut approved_token_data: Bundle,
        mut bundle_token_data: Token,
        bundle_token_id: TokenId,
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
                let approved_id = near_sdk::serde_json::from_slice::<u64>(&result).unwrap();
                env::log_str(&format!("approved_id 2: {:?}", approved_id.clone()));
                env::log_str(&format!("token_data 1: {:?}", bundle_token_data.clone()));

                approved_token_data.approval_id = approved_id;

                // token_data.bundles.push(token_for_bundle);
                bundle_token_data.bundles.insert(bundle_token_data.bundles.len() - 1, approved_token_data.clone());
                self.tokens_by_id.insert(&bundle_token_id, &bundle_token_data);
                env::log_str(&format!("token_data 2: {:?}", bundle_token_data.clone()));

                ext_nft::nft_transfer(
                    env::current_account_id(),
                    approved_token_data.token_id,
                    approved_token_data.approval_id,
                    None,
                    approved_token_data.contract, // contract account id
                    DEPOSIT, // yocto NEAR to attach
                    GAS_FOR_NFT_TRANSFER_CALL // gas to attach
                );

            },
        }
    }
}