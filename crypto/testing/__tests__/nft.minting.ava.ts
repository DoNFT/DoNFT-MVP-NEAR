import {
  failPromiseRejection,
  BUNDLE_WORKSPACE,
  mNEAR,
} from "./test_utils/workspaces";


BUNDLE_WORKSPACE.test(
  "minting of NFT and bundles",
  async (test, { root, alice, bob, bundle, bundle2 }) => {
    await alice.call(
      bundle,
      "nft_mint",
      {
        token_id: 'token1',
        receiver_id: alice.accountId,
        metadata: {},
      },
      { attachedDeposit: "7000000000000000000000", gas: '300000000000000' }
    )
    .catch(failPromiseRejection(test, "nft_mint"));

    await alice.call(
      bundle,
      "nft_mint",
      {
        token_id: 'token2',
        receiver_id: alice.accountId,
        metadata: {},
      },
      { attachedDeposit: "7000000000000000000000", gas: '300000000000000' }
    )
    .catch(failPromiseRejection(test, "nft_mint"));

    const getTokens1 = await bundle
      .view('nft_tokens_for_owner', {account_id:  alice.accountId})
      .catch(failPromiseRejection(test, "getTokens1"));
    console.log(getTokens1, 'getTokens1')
    console.log(bundle.accountId, 'bundle')

    const mintBundleWithApprove = await bob
    .call_raw(
      bundle2,
      "nft_bundle_with_approve",
      {
        tokens_for_approve: ["token1", "token2"],
        account_for_approve: bundle2.accountId,
        contract_of_tokens: bundle.accountId,
        token_id: "token_bundle1",
        metadata: {},
        bundles: [
          {
            contract: bundle.accountId,
            token_id: 'token1',
            approval_id: 0,
          },
          {
            contract: bundle.accountId,
            token_id: 'token2',
            approval_id: 0,
          },
        ],
        owner_id: alice.accountId,
      },
      { attachedDeposit: mNEAR(0.8), gas: '300000000000000' }
    )
    .catch(failPromiseRejection(test, "approving"));

    const getTokens2 = await bundle2
      .view('nft_tokens_for_owner', {account_id:  alice.accountId})
      .catch(failPromiseRejection(test, "getTokens2 bundle2"));

    const getTokens3 = await bundle
      .view('nft_tokens_for_owner', {account_id:  alice.accountId})
      .catch(failPromiseRejection(test, "getTokens3 bundle1"));
    console.log(getTokens2, 'getTokens2 bundle2')
    console.log(getTokens3, 'getTokens3 bundle1')
})