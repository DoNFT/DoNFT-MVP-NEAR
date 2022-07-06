import {
  failPromiseRejection,
  BUNDLE_WORKSPACE,
  mNEAR,
} from "./test_utils/workspaces";


BUNDLE_WORKSPACE.test(
  "core:approval",
  async (test, { root, alice, bob, bundle }) => {
    const getTokens1 = await bundle
      .view('nft_supply_for_owner', {account_id:  alice.accountId})
      .catch(failPromiseRejection(test, "getTokens1"));

    await alice.call(
      bundle,
      "nft_mint",
      {
        token_id: 'token1',
        receiver_id: alice.accountId,
        metadata: {},
      },
      { attachedDeposit: "7000000000000000000000", gas: '300000000000000'  }
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
      { attachedDeposit: "7000000000000000000000", gas: '300000000000000'  }
    )
    .catch(failPromiseRejection(test, "nft_mint"));
    
    const getTokens2 = await bundle
      .view('nft_supply_for_owner', {account_id:  alice.accountId})
      .catch(failPromiseRejection(test, "getTokens2"));

    const approveCall = await alice
      .call_raw(
        bundle,
        "multiple_nft_approve",
        { token_ids: ["token1", "token2"], account_id: bob.accountId },
        { attachedDeposit: mNEAR(0.8) }
      )
      .catch(failPromiseRejection(test, "approving"));

    // checking is Token approved actually
    const getAllToken = await bundle
      .view('nft_tokens_for_owner', {account_id:  alice.accountId})
      .catch(failPromiseRejection(test, "getAllToken"));
})