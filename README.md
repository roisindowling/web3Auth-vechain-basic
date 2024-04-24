<p align="center">
  <a href="https://web3auth.io/docs/sdk/pnp/web/modal">
    <img alt="Web3Auth SDK" src="https://img.shields.io/badge/Web3Auth-SDK-blue">
  </a>
  <a href="https://community.web3auth.io">
    <img alt="Web3Auth Community" src="https://img.shields.io/badge/Web3Auth-Community-cyan">
  </a>
</p>

<h1 align="center">
  Web3Auth (`@web3auth/modal`) x vechain Example
</h1>

<p align="center">
  This example demonstrates how to create an account using Web3Auth with vechain in a React application using an RPC-Proxy.
</p>

## 🚀 How to Use

To get started with the example, follow these steps:

1. **Configure Web3Auth Client:**
   <br>Go to https://dashboard.web3auth.io/ and create a create a new project.
2. **Add .env file:**
   Create `.env` file and add in your client ID generated in step 1.
2. **Install dependencies:**
   ```sh
   cd web3Auth-vechain
   yarn
3. **Run RPC-Proxy:**
   - For the Testnet environment, use the following command:
     ```sh
     yarn docker:start:testnet
     ```
   - For the Mainnet environment, use the following command:
     ```sh
     yarn docker:start:mainnet
     ```
4. **Start App**
     ```sh
     yarn start
     ```