type WalletCoin = {
  id: number,
  privateKey: string
}

type TransactionRecord = {
  amount: number,
  id: number,
  height: number
}

type CurrentTX = {
  id: number,
  privateKey: string
}

type Wallet = {
  coins: WalletCoin[],
  transactionRecord: TransactionRecord[],
  currentTx: CurrentTX | null
}

export default Wallet;
export { WalletCoin, TransactionRecord };