import * as ava from "near-workspaces-ava";
import { Gas, BN, NearAccount } from "near-workspaces-ava";

/**
 * Interprets a float as NEAR and builds the corresponding string.
 * Rounded to closest milliNEAR.
 */
 export function NEAR(x: number): ava.NEAR {
  return mNEAR(x).mul(new ava.NEAR(1e3));
}

/**
 * Interprets a float as milliNEAR and builds the corresponding string.
 * Rounded to closest microNEAR.
 */
export function mNEAR(x: number): ava.NEAR {
  return uNEAR(x).mul(new ava.NEAR(1e3));
}

/**
 * Interprets a float as microNEAR and builds the corresponding string.
 * Rounded to closest nanoNEAR.
 */
 export function uNEAR(x: number): ava.NEAR {
  return nNEAR(x).mul(new ava.NEAR(1e3));
}

/**
 * Interprets a float as nanoNEAR and builds the corresponding string.
 * Rounded to closest picoNEAR.
 */
export function nNEAR(x: number): ava.NEAR {
  return new ava.NEAR((x * 1e3).toString() + "0".repeat(12));
}

/**
 * Interprets a float as Teragas and builds the corresponding string.
 * Rounded to closest Gigagas.
 */
 export function Tgas(x: number): ava.Gas {
  return new ava.Gas((x * 1e3).toString() + "0".repeat(9));
}

/** Maximum possible gas (will be serialized to a u64) */
export const MAX_U64 = new BN("ffffffffffffffff", 16);
/** Gas cost for deploying a store (taken from mintbase-js) */
export const DEPLOY_STORE_GAS = Tgas(200);
/** Storage rent for deploying a store (taken from mintbase-js) */
export const DEPLOY_STORE_RENT = NEAR(7);

// TODO::testing::low: use this function consistently
export function failPromiseRejection(
  test,
  msg
) {
  return (e) => {
    test.log(`Promise rejected while ${msg}:`);
    test.log(e);
    test.fail();
  };
}

export async function createAccounts(root) {
  // const alice = await root.createAccount("alice", { initialBalance: NEAR(20) });
  // const bob = await root.createAccount("bob", { initialBalance: NEAR(20) });
  // const carol = await root.createAccount("carol", { initialBalance: NEAR(20) });
  // return [alice, bob, carol];
  return Promise.all([
    root.createAccount("alice", { initialBalance: NEAR(50).toString() }),
    root.createAccount("bob", { initialBalance: NEAR(20).toString() }),
    root.createAccount("carol", { initialBalance: NEAR(20).toString() }),
    root.createAccount("dave", { initialBalance: NEAR(20).toString() }),
  ]);
}

/** deploys the factory to a subaccount `factory` of `root` */
export async function deployFactory(root) {
  return root.createAndDeploy(
    "factory", // subaccount name
    "../../../out/donft_collection_factory.wasm", // path to wasm
    { method: "new", args: {} }
  );
}

/**
 * deploys the store to a subaccount `name` of `factory`, setting the store
 * owner to `owner`
 */
export async function deployStore({
  factory,
  owner,
  name,
}) {
  await owner.call(
    factory,
    "create_store",
    {
      owner_id: owner.accountId,
      metadata: {
        spec: "nft-1.0.0",
        name,
        symbol: "ALICE",
      },
    },
    { attachedDeposit: DEPLOY_STORE_RENT, gas: DEPLOY_STORE_GAS }
  );
  return factory.getFullAccount(`${name}.${factory.accountId}`);
}

/** A workspace with the factory deployed by root, no store deployed */
export const STORE_WORKSPACE = ava.Workspace.init(async ({ root }) => {
  const [alice, bob, carol, dave] = await createAccounts(root);

  const factory = await deployFactory(root);
  const store = await deployStore({ factory, owner: alice, name: "alice_store" });

  console.log(factory, 'FACTORY')
  console.log(store, 'store')

  return { alice, bob, carol, dave, factory, store };
});