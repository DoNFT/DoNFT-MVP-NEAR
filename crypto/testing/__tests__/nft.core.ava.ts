import {
  DEPLOY_STORE_RENT,
  DEPLOY_STORE_GAS,
  failPromiseRejection,
  STORE_WORKSPACE,
  deployFactory,
} from "./test_utils/workspaces";


STORE_WORKSPACE.test(
  "core",
  async (test, { root, factory, alice, bob, store }) => {
    console.log(root, 'ROOT')
    // store creation
    // const deployedFactory = await deployFactory({ root })
    await bob
      .call(
        factory,
        "create_store",
        {
          owner_id: bob.accountId,
          metadata: {
            spec: "nft-1.0.0",
            name: "bob_store1",
            symbol: "BOB",
          },
        },
        { attachedDeposit: DEPLOY_STORE_RENT, gas: DEPLOY_STORE_GAS }
      )
      .catch(failPromiseRejection(test, "creating store"));

    await alice
      .call(
        factory,
        "create_store",
        {
          owner_id: alice.accountId,
          metadata: {
            spec: "nft-1.0.0",
            name: "alice_store1",
            symbol: "ALICE",
          },
        },
        { attachedDeposit: DEPLOY_STORE_RENT, gas: DEPLOY_STORE_GAS }
      )
      .catch(failPromiseRejection(test, "creating store"));

      await alice
        .call(
          factory,
          "create_store",
          {
            owner_id: alice.accountId,
            metadata: {
              spec: "nft-1.0.0",
              name: "alice_store2",
              symbol: "ALICE",
            },
          },
          { attachedDeposit: DEPLOY_STORE_RENT, gas: DEPLOY_STORE_GAS }
        )
        .catch(failPromiseRejection(test, "creating store"));

    const fullAcc = root.getFullAccount(`alice.${factory.accountId}`);

    const stores_list1 = await alice
      .call(
        factory,
        "get_stores_collection",
        {
          account_id: 'alice.test.near',
        },
      )
      .catch(failPromiseRejection(test, "creating store"));

    console.log(stores_list1, 'stores_list')

    const stores_list2 = await bob
      .call(
        factory,
        "get_stores_collection",
        {
          account_id: 'bob.test.near',
        },
      )
      .catch(failPromiseRejection(test, "creating store"));

    console.log(stores_list2, 'stores_list2')

    // const deployedStore = await deployStore({ factory, owner: alice, name: 'alice_factory' })
  }
);
