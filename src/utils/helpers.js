import { Connection, clusterApiUrl } from "@solana/web3.js";
import { Provider } from "@project-serum/anchor";

// Set our network to devnet.
const network = clusterApiUrl("devnet");

// Controls how we want to acknowledge when a transaction is "done".
const opts = {
  preflightCommitment: "processed",
};

const checkIfWalletConnected = async (setWalletAddress) => {
  try {
    if (typeof window !== "undefined") {
      const { solana } = window;

      if (solana && solana.isPhantom) {
        console.log("solana phantom found");
        const response = await solana.connect({ onlyIfTrusted: true });
        console.log(
          "Connected with Public Key:",
          response.publicKey.toString()
        );
        setWalletAddress(response.publicKey.toString());
        return;
      }

      alert("Solana object not found! Get a Phantom Wallet 👻");
      return;
    }
  } catch (error) {
    console.log(error);
  }
};

const connectWallet = async (setWalletAddress) => {
  const { solana } = window;
  if (solana) {
    const response = await solana.connect();
    console.log("Connected with Public Key:", response.publicKey.toString());
    setWalletAddress(response.publicKey.toString());
  }
};

const getProvider = () => {
  const connection = new Connection(network, opts.preflightCommitment);
  const provider = new Provider(
    connection,
    window.solana,
    opts.preflightCommitment
  );
  return provider;
};

export { checkIfWalletConnected, connectWallet, getProvider };
