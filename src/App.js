import { PublicKey } from "@solana/web3.js";
import { Program, web3 } from "@project-serum/anchor";

import {
  checkIfWalletConnected,
  connectWallet,
  getProvider,
} from "./utils/helpers";
import idl from "./idl.json";
import kp from "./utils/keypair.json";

import twitterLogo from "./assets/twitter-logo.svg";
import "./App.css";
import { useEffect, useState } from "react";

// SystemProgram is a reference to the Solana runtime!
const { SystemProgram } = web3;

// Create a keypair for the account that will hold the GIF data.
const arr = Object.values(kp._keypair.secretKey);
const secret = new Uint8Array(arr);
const baseAccount = web3.Keypair.fromSecretKey(secret);

// Get our program's id from the IDL file.
const programID = new PublicKey(idl.metadata.address);

// Constants
const TWITTER_HANDLE = "_buildspace";
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;

const handleLoadWallet = (setWalletAddress) => {
  const onLoad = async () => {
    await checkIfWalletConnected(setWalletAddress);
  };

  window.addEventListener("load", onLoad);
  return () => window.removeEventListener("load", onLoad);
};

const getGifList = async (setGifList) => {
  try {
    const provider = getProvider();
    const program = new Program(idl, programID, provider);
    const account = await program.account.baseAccount.fetch(
      baseAccount.publicKey
    );

    console.log("Got the account", account);
    setGifList(account.gifList);
  } catch (error) {
    console.log("Error in getGifList: ", error);
    setGifList(null);
  }
};

const createGifAccount = async (setGifList) => {
  try {
    const provider = getProvider();
    const program = new Program(idl, programID, provider);
    console.log("ping");
    await program.rpc.startStuffOff({
      accounts: {
        baseAccount: baseAccount.publicKey,
        user: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      },
      signers: [baseAccount],
    });
    console.log(
      "Created a new BaseAccount w/ address:",
      baseAccount.publicKey.toString()
    );
    await getGifList(setGifList);
  } catch (error) {
    console.log("Error creating BaseAccount account:", error);
  }
};

const handleFetchGif = (walletAddress, setGifList) => {
  if (walletAddress) {
    console.log("Fetching GIF list...");
    getGifList(setGifList);
  }
};

const sendGif = async (formData, setGifList) => {
  const inputGif = formData.get("inputGif");
  if (inputGif.length === 0) {
    console.log("No gif link given!");
    return;
  }

  if (inputGif.length > 0) {
    console.log("Gif link:", inputGif);
    document.getElementsByName("inputGif").value = "";

    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider);

      await program.rpc.addGif(inputGif, {
        accounts: {
          baseAccount: baseAccount.publicKey,
          user: provider.wallet.publicKey,
        },
      });
      console.log("GIF successfully sent to program", inputGif);

      await getGifList(setGifList);
    } catch (error) {
      console.log("Error sending GIF:", error);
    }
  } else {
    console.log("Empty input. Try again.");
  }
};

const App = () => {
  const [walletAddress, setWalletAddress] = useState(null);
  const [gifList, setGifList] = useState(null);

  const renderConnectedContainer = () => {
    if (!gifList) {
      return (
        <div className="connected-container">
          <button
            className="cta-button submit-gif-button"
            onClick={() => {
              createGifAccount(setGifList);
            }}
          >
            Do One-Time Initialization For GIF Program Account
          </button>
        </div>
      );
    }
    return (
      <div className="connected-container">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            const formData = new FormData(event.target);
            sendGif(formData, setGifList);
          }}
        >
          <input name="inputGif" type="text" placeholder="Enter gif link!" />
          <button type="submit" className="cta-button submit-gif-button">
            Submit
          </button>
        </form>

        <div className="gif-grid">
          {gifList.map((gif) => (
            <div className="gif-item" key={gif.gifLink}>
              <img src={gif.gifLink} alt={gif.gifLink} />
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderConnectButton = () => {
    return (
      <button
        className="cta-button connect-wallet-button"
        onClick={() => {
          connectWallet(setWalletAddress);
        }}
      >
        Connect to Wallet
      </button>
    );
  };

  useEffect(() => {
    handleLoadWallet(setWalletAddress);
  }, []);

  useEffect(() => {
    handleFetchGif(walletAddress, setGifList);
  }, [walletAddress]);

  return (
    <div className="App">
      <div className="container">
        <div className={walletAddress ? "authed-container" : "container"}>
          <div className="header-container">
            <p className="header">🖼 GIF Portal</p>
            <p className="sub-text">
              View your GIF collection in the metaverse ✨ How cool is that
            </p>
            {!walletAddress && renderConnectButton()}
          </div>
          {walletAddress && renderConnectedContainer()}
        </div>
        <div className="footer-container">
          <img alt="Twitter Logo" className="twitter-logo" src={twitterLogo} />
          <a
            className="footer-text"
            href={TWITTER_LINK}
            target="_blank"
            rel="noreferrer"
          >{`built on @${TWITTER_HANDLE}`}</a>
        </div>
      </div>
    </div>
  );
};

export default App;
