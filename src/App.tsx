import { useEffect, useState } from "react";
// IMP START - Quick Start
import { Web3Auth } from "@web3auth/modal";
import { CHAIN_NAMESPACES, IProvider, WEB3AUTH_NETWORK } from "@web3auth/base";
import { Connex } from "@vechain/connex";
import { ethers } from '@vechain/ethers';

import "./App.css";
import { EthereumPrivateKeyProvider } from "@web3auth/ethereum-provider";
import { BigNumberish } from "@vechain/ethers/utils";

// IMP START - SDK Initialization
// IMP START - Dashboard Registration
// Register your app at https://web3auth.io/dashboard
const clientId = process.env.REACT_APP_CLIENT_ID as string;

const connex = new Connex({
  node: process.env.REACT_APP_VECHAIN_NODE as string, // Node URL
  network: process.env.REACT_APP_NET as 'main' | 'test'
});

const chainConfig = {
  chainId: connex.thor.genesis.id,
  rpcTarget: "http://127.0.0.1:8545", // RPC proxy URL - need docker container running
  chainNamespace: CHAIN_NAMESPACES.EIP155,
  displayName: "Vechain",
  blockExplorerUrl: "https://explore-testnet.vechain.org/", // Update with the correct block explorer URL
  ticker: "VET",
  tickerName: "VeChain",
};


const privateKeyProvider = new EthereumPrivateKeyProvider({
  config: { chainConfig: chainConfig }
});

const web3auth = new Web3Auth({
  clientId,
  web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_DEVNET,
  privateKeyProvider: privateKeyProvider,
});
// IMP END - SDK Initialization

function App() {
  const [provider, setProvider] = useState<IProvider | null>(null);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        // IMP START - SDK Initialization
        await web3auth.initModal();
        // IMP END - SDK Initialization
        setProvider(web3auth.provider);

        if (web3auth.connected) {
          setLoggedIn(true);
        }
      } catch (error) {
        console.error(error);
      }
    };

    init();
  }, []);

  const login = async () => {
    // IMP START - Login
    const web3authProvider = await web3auth.connect();
    // IMP END - Login
    setProvider(web3authProvider);
    if (web3auth.connected) {
      setLoggedIn(true);
    }
  };

  const getUserInfo = async () => {
    // IMP START - Get User Information
    const user = await web3auth.getUserInfo();
    // IMP END - Get User Information
    uiConsole(user);
  };

  const logout = async () => {
    // IMP START - Logout
    await web3auth.logout();
    // IMP END - Logout
    setProvider(null);
    setLoggedIn(false);
    uiConsole("logged out");
  };

  // IMP START - Blockchain Calls
  const getAccounts = async () => {
    if (!provider) {
      uiConsole("provider not initialized yet");
      return;
    }
    const [address] = (await web3auth.provider!.sendAsync({
			method: 'eth_accounts',
		})) as string[];
    uiConsole(address);
  };

  const getBalance = async () => {
    if (!provider) {
      uiConsole("provider not initialized yet");
      return;
    }

    const [address] = (await web3auth.provider!.sendAsync({
			method: 'eth_accounts',
		})) as string[];

    const balance = (await provider.sendAsync({
      method: 'eth_getBalance',
      params: [address, 'latest'],
    })) as BigNumberish;

    uiConsole(ethers.utils.formatEther(balance));
  };

  function uiConsole(...args: any[]): void {
    const el = document.querySelector("#console>p");
    if (el) {
      el.innerHTML = JSON.stringify(args || {}, null, 2);
    }
    console.log(...args);
  }

  const loggedInView = (
    <>
      <div className="flex-container">
        <div>
          <button onClick={getUserInfo} className="card">
            Get User Info
          </button>
        </div>
        <div>
          <button onClick={getAccounts} className="card">
            Get Accounts
          </button>
        </div>
        <div>
          <button onClick={getBalance} className="card">
            Get Balance
          </button>
        </div>
        <div>
          <button onClick={logout} className="card">
            Log Out
          </button>
        </div>
      </div>
    </>
  );

  const unloggedInView = (
    <button onClick={login} className="card">
      Login
    </button>
  );

  return (
    <div className="container">
      <h1 className="title">
        <a target="_blank" href="https://web3auth.io/docs/sdk/pnp/web/modal" rel="noreferrer">
          Web3Auth{" "}
        </a>
        & vechain
      </h1>

      <div className="grid">{loggedIn ? loggedInView : unloggedInView}</div>
      <div id="console" style={{ whiteSpace: "pre-line" }}>
        <p style={{ whiteSpace: "pre-line" }}></p>
      </div>
    </div>
  );
}

export default App;
