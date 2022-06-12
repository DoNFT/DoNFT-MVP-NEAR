import {
  failPromiseRejection,
  BUNDLE_WORKSPACE,
  mNEAR,
} from "./test_utils/workspaces";


BUNDLE_WORKSPACE.test(
  "core:approval",
  async (test, { root, alice, bob, bundle }) => {
    console.log(bundle, 'bundle 2')
    console.log(alice.accountId, 'alice.accountId 2')
    
    const getTokens1 = await bundle
      .view('nft_supply_for_owner', {account_id:  alice.accountId})
      .catch(failPromiseRejection(test, "getTokens1"));

    console.log(getTokens1, 'getTokens1')
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

    console.log(getTokens2, 'getTokens2')
    // -------------------------------- approve --------------------------------
    // const approveCall = await alice
    //   .call_raw(
    //     bundle,
    //     "nft_approve",
    //     { token_id: "token1", account_id: bob.accountId },
    //     { attachedDeposit: mNEAR(0.8) }
    //   )
    //   .catch(failPromiseRejection(test, "approving"));

    const approveCall = await alice
      .call_raw(
        bundle,
        "multiple_nft_approve",
        { token_ids: ["token1", "token2"], account_id: bob.accountId },
        { attachedDeposit: mNEAR(0.8) }
      )
      .catch(failPromiseRejection(test, "approving"));

    console.log(approveCall, 'approveCall')

    // checking is Token approved actually
    const getAllToken = await bundle
      .view('nft_tokens_for_owner', {account_id:  alice.accountId})
      .catch(failPromiseRejection(test, "getAllToken"));

    console.log(getAllToken, 'getAllToken')
})