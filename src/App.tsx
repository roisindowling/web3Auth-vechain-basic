import { useEffect, useState } from "react";
import Modal from "react-modal";
import { Web3Auth } from "@web3auth/modal";
import { CHAIN_NAMESPACES, IProvider, WEB3AUTH_NETWORK, ADAPTER_EVENTS, CONNECTED_EVENT_DATA } from "@web3auth/base";
import { Connex } from "@vechain/connex";
import { ethers } from '@vechain/ethers';
import bent from "bent";
import "./App.css";
import { EthereumPrivateKeyProvider } from "@web3auth/ethereum-provider";
import { BigNumberish } from "@vechain/ethers/utils";
import { Transaction, secp256k1 } from "thor-devkit";

const clientId = process.env.REACT_APP_CLIENT_ID as string;

const connex = new Connex({
  node: process.env.REACT_APP_VECHAIN_NODE as string,
  network: process.env.REACT_APP_NET as 'main' | 'test'
});

const chainConfig = {
  chainId: connex.thor.genesis.id,
  rpcTarget: "http://127.0.0.1:8545",
  chainNamespace: CHAIN_NAMESPACES.EIP155,
  displayName: "Vechain",
  blockExplorerUrl: "https://explore-testnet.vechain.org/",
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

Modal.setAppElement("#root");

function App() {
  const [provider, setProvider] = useState<IProvider | null>(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [txId, setTxId] = useState<string>('');
  const [privateKey, setPrivateKey] = useState<string>('');
  const [toAddress, setToAddress] = useState<string>('');
  const [value, setValue] = useState<string>('');
  const [modalIsOpen, setModalIsOpen] = useState<boolean>(false);

  useEffect(() => {
    const init = async () => {
      try {
        await web3auth.initModal();
        setProvider(web3auth.provider);

        if (web3auth.connected) {
          setLoggedIn(true);
        }
      } catch (error) {
        console.error(error);
      }
    };

    init();
    subscribeAuthEvents(web3auth);
  }, []);

  const login = async () => {
    try {
      const web3authProvider = await web3auth.connect();
      setProvider(web3authProvider);
      if (web3auth.connected) {
        setLoggedIn(true);
        clearConsole();
      }
    } catch (error) {
      console.error("Login error:", error);
      uiConsole("Login canceled or failed. Please try again.");
    }
  };

  const getUserInfo = async () => {
    const user = await web3auth.getUserInfo();
    uiConsole(user);
  };

  const logout = async () => {
    await web3auth.logout();
    setProvider(null);
    setLoggedIn(false);
    uiConsole("logged out");
  };

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

  const handleTransaction = async (): Promise<void> => {
    setLoading(true);
    const clause = connex.thor.account("0x2f072a50815d026105281e84533775de7cc9c063")
      .method({
        "inputs": [
          {
            "internalType": "address",
            "name": "to",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "value",
            "type": "uint256"
          }
        ],
        "name": "transfer",
        "outputs": [
          {
            "internalType": "bool",
            "name": "",
            "type": "bool"
          }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
      })
      .asClause(toAddress, value);

    const txId = await signTransactionWithPrivateKey([clause], new ethers.Wallet(privateKey));
    setTxId(txId);

    do {
      const tx = connex.thor.transaction(txId);
      const receipt = await tx.getReceipt();
      if (receipt) {
        break;
      }
      await connex.thor.ticker().next();
    } while (true);
    setLoading(false);
  };

  function uiConsole(...args: any[]): void {
    const el = document.querySelector("#console>p");
    if (el) {
      el.innerHTML = JSON.stringify(args || {}, null, 2);
    }
    console.log(...args);
  }

  function clearConsole(): void {
    const el = document.querySelector("#console>p");
    if (el) {
      el.innerHTML = '';
    }
    console.clear();
  }

  const loggedInView = (
    <>
      <div className="flex-container">
        <button onClick={getUserInfo} className="card">Get User Info</button>
        <button onClick={getAccounts} className="card">Get Accounts</button>
        <button onClick={getBalance} className="card">Get Balance</button>
        <button onClick={logout} className="card">Log Out</button>
        <button onClick={() => setModalIsOpen(true)} className="card">Transfer Tokens</button>
      </div>
      <Modal
        isOpen={modalIsOpen}
        onRequestClose={() => setModalIsOpen(false)}
        contentLabel="Transaction Modal"
        className="ReactModal__Content"
        overlayClassName="ReactModal__Overlay"
      >
        <h2>Enter Transaction Details</h2>
        <div className="input-group">
          <input
            type="text"
            placeholder="Recipient Address"
            value={toAddress}
            onChange={(e) => setToAddress(e.target.value)}
          />
          <input
            type="text"
            placeholder="Value"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
          <button onClick={handleTransaction} className="card">Submit Transaction</button>
          <button onClick={() => setModalIsOpen(false)} className="card">Cancel</button>
        </div>
      </Modal>
      {loading && <p>Transaction in progress...</p>}
      {txId && <p>Transaction ID: {txId}</p>}
    </>
  );

  const unloggedInView = (
    <button onClick={login} className="card">
      Login
    </button>
  );

  const subscribeAuthEvents = (web3auth: Web3Auth) => {
    web3auth.on(ADAPTER_EVENTS.CONNECTED, (data: CONNECTED_EVENT_DATA) => {
      console.log("connected to wallet", data);

      if (web3auth.provider) {
        web3auth.provider.request({ method: "private_key" })
          .then(privateKey => setPrivateKey(String(privateKey)));
      } else {
        setPrivateKey('');
      }
    });

    web3auth.on(ADAPTER_EVENTS.CONNECTING, () => {
      console.log("connecting");
      setPrivateKey('');
    });

    web3auth.on(ADAPTER_EVENTS.DISCONNECTED, () => {
      console.log("disconnected");
      setPrivateKey('');
    });

    web3auth.on(ADAPTER_EVENTS.ERRORED, (error) => {
      console.log("error", error);
    });

    web3auth.on(ADAPTER_EVENTS.ERRORED, (error) => {
      console.log("error", error);
    });
  };

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

async function signTransactionWithPrivateKey(clauses: { to: string | null; value: string; data: string; }[], wallet: ethers.Wallet): Promise<string> {
  const post = bent("POST", "json");

  const transaction = new Transaction({
    chainTag: Number.parseInt(connex.thor.genesis.id.slice(-2), 16),
    blockRef: connex.thor.status.head.id.slice(0, 18),
    expiration: 32,
    clauses,
    gas: 100000,
    gasPriceCoef: 128,
    dependsOn: null,
    nonce: +new Date(),
    reserved: {
      features: 1 // this enables the fee delegation feature
    }
  });

  const rawTransaction = `0x${transaction.encode().toString("hex")}`;

  const sponsorRequest = {
    origin: wallet.address,
    raw: rawTransaction
  };

  const { signature, error } = await post('https://sponsor-testnet.vechain.energy/by/90', sponsorRequest);

  if (error) {
    console.error(error);
    throw new Error(error);
  }

  const signingHash = transaction.signingHash();
  const originSignature = secp256k1.sign(
    signingHash,
    Buffer.from(wallet.privateKey.slice(2), "hex")
  );

  const sponsorSignature = Buffer.from(signature.substr(2), "hex");
  transaction.signature = Buffer.concat([originSignature, sponsorSignature]);

  const signedTransaction = `0x${transaction.encode().toString("hex")}`;
  const { id } = await post(`${process.env.REACT_APP_VECHAIN_NODE}transactions`, {
    raw: signedTransaction
  });

  return id;
}

export default App;
