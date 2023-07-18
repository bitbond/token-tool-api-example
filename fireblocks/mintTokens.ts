import { FireblocksSDK, PeerType, TransactionOperation } from "fireblocks-sdk";
import { ethers } from "ethers";
import fs from "fs";
import tokenArtifact from "../assets/FullFeatureToken.json";

// Edit the values below according to your needs
// Details of the token to be minted
const token = {
  contractAddress: "0x...",
  decimals: 18 // The number of decimals the token uses
};
// The amount of tokens to mint
const amount = "1.0";
// The address which will receive the minted tokens
const recipientAddress = "0x...";

const fireblocksParams = {
  // Vault ID that is used to sign the transaction,
  // Could be any vault with enough balance to cover the transaction fee
  vaultId: "0",
  // Determines the network where transaction is executed,
  // refer to Fireblocks documentation for other native asset codes
  assetId: "MATIC_POLYGON_MUMBAI",
  // Any string, will be visible in Fireblocks console
  note: "Minting tokens",
};

const fireblocks = () => {
  const fireblocksApiKey = fs.readFileSync("./fireblocks_api_key", "utf-8").trim();
  const fireblocksPrivateKey = fs.readFileSync("./fireblocks_private_key", "utf-8").trim();

  if (!fireblocksApiKey || !fireblocksPrivateKey) {
    throw new Error("Missing Fireblocks API key or secret");
  }
  return new FireblocksSDK(fireblocksPrivateKey, fireblocksApiKey);
};

(async() => {
  // Initialize contract interface
  const contractInterface = new ethers.utils.Interface(tokenArtifact.abi);

  // Encode function and parameters to be used as calldata
  const parsedAmount = ethers.utils.parseUnits(amount, token.decimals);
  const calldata = contractInterface.encodeFunctionData(
    "mint",
    [recipientAddress, parsedAmount]
  );

  // Send the transaction to Fireblocks API
  const tx = await fireblocks().createTransaction({
    operation: TransactionOperation.CONTRACT_CALL,
    assetId: fireblocksParams.assetId,
    source: {
      type: PeerType.VAULT_ACCOUNT,
      id: fireblocksParams.vaultId,
    },
    destination: {
      type: PeerType.ONE_TIME_ADDRESS,
      oneTimeAddress: {
        address: token.contractAddress,
      },
    },
    note: fireblocksParams.note,
    amount: "0", // Amount of native currency to send with the call
    extraParameters: {
      contractCallData: calldata,
    },
  });

  console.log(JSON.stringify(tx, null, 2));
})().catch(error => {
  console.log(error);
});
