use donft_bundle::near_sdk::borsh::{self, BorshDeserialize, BorshSerialize};
use donft_bundle::near_sdk::{
    self,
    env,
    PanicOnDefault,
    AccountId,
    near_bindgen,
};
use donft_bundle::near_sdk::json_types::{U128};

use donft_bundle::internal::refund_deposit;
use donft_bundle::metadata::EffectInfo;
use donft_bundle::NFTContractMetadata;
use donft_bundle::near_sdk::collections::{UnorderedSet, LazyOption};

#[near_bindgen]
#[derive(BorshDeserialize, BorshSerialize, PanicOnDefault)]
pub struct DonftEffects {
    //contract owner
    pub owner_id: AccountId,
    pub effect_info: UnorderedSet<EffectInfo>,
}

/// Helper structure for keys of the persistent collections.
#[derive(BorshSerialize)]
pub enum StorageEffectsKey {
    EffectsInfo,
    EffectDataKey,
}

#[near_bindgen]
impl DonftEffects {

    #[payable]
    pub fn add_effect_contract_to_list(
        &mut self,
        effect_data: EffectInfo,
    ) {
        let initial_storage_usage = env::storage_usage();
        env::log_str(&format!("effect_data 1: {:?}", effect_data.clone()));
        self.effect_info.insert(&effect_data);
        env::log_str(&format!("effect_data 2: {:?}", effect_data.clone()));
        let required_storage_in_bytes = env::storage_usage() - initial_storage_usage;

        refund_deposit(required_storage_in_bytes);
    }

    #[payable]
    pub fn remove_effect_contract_from_list(
        &mut self,
        effect_info_address: AccountId,
    ) {
        let effects_vec = self.effect_info.to_vec();

        let effect_index = self.effect_info
            .to_vec()
            .iter()
            .position(|x| x.original_contract == effect_info_address)
            .unwrap();

        self.effect_info.remove(&effects_vec[effect_index]);
    }

    pub fn get_effects_list(
        &self,
        from_index: Option<U128>,
        limit: Option<u64>
    ) -> Vec<EffectInfo> {
        let start = u128::from(from_index.unwrap_or(U128(0)));

        self.effect_info.iter()
            .skip(start as usize)
            .take(limit.unwrap_or(50) as usize) 
            .collect()
    }

    /*
        initialization function (can only be called once).
        this initializes the contract with metadata that was passed in and
        the owner_id. 
    */
    #[init(ignore_state)]
    pub fn new_effects_meta() -> Self {
        assert!(!env::state_exists());
        //create a variable of type Self with all the fields initialized.
        Self {
            owner_id: env::predecessor_account_id(),
            effect_info: UnorderedSet::new(StorageEffectsKey::EffectDataKey.try_to_vec().unwrap(),),
        }
    }

}