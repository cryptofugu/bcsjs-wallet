import axios, { AxiosInstance } from "axios"

import { INetworkInfo } from "./Network"
import { NetworkNames } from "./constants"

const INSIGHT_BASEURLS: { [key: string]: string } = {
  [NetworkNames.MAINNET]: "http://bcschain.info/api",
  [NetworkNames.TESTNET]: "http://testnet.bcschain.info/api",
  [NetworkNames.REGTEST]: "http://localhost:3001/insight-api",
}

export class Insight {
  // public static mainnet(): Insight {
  //   return new Insight(MAINNET_API_BASEURL)
  // }

  // public static testnet(): Insight {
  //   return new Insight(TESTNET_API_BASEURL)
  // }

  public static forNetwork(network: INetworkInfo): Insight {
    const baseURL = INSIGHT_BASEURLS[network.name]
    if (baseURL == null) {
      throw new Error(`No Insight API defined for network: ${network.name}`)
    }

    return new Insight(baseURL)
  }

  private axios: AxiosInstance

  constructor(private baseURL: string) {
    this.axios = axios.create({
      baseURL,
      // don't throw on non-200 response
      // validateStatus: () => true,
    })
  }

  public async listUTXOs(address: string): Promise<Insight.IUTXO[]> {
    const res = await this.axios.get(`/address/${address}/utxo`)
    return res.data
  }

  public async getInfo(address: string): Promise<Insight.IGetInfo> {
    const res = await this.axios.get(`/address/${address}`)
    return res.data
  }

  public async sendRawTx(rawtx: string): Promise<Insight.ISendRawTxResult> {
    const res = await this.axios.post('/tx/send', {
      rawtx,
    }).then((response: {data: Promise<Insight.ISendRawTxResult>}) => {
      return response.data
    })
    return res
  }

  public async contractCall(
    address: string,
    encodedData: string,
  ): Promise<Insight.IContractCall> {
    // FIXME wow, what a weird API design... maybe we should just host the RPC
    // server, with limited API exposed.
    const res = await this.axios.get(
      `/contract/${address}/call?data=${encodedData}`,
    )

    return res.data
  }

  /**
   * Estimate the fee per KB of txdata, in satoshi. Returns -1 if no estimate is
   * available. It always return -1 for testnet.
   *
   * @param nblocks
   */
  public async estimateFee(nblocks: number = 6): Promise<any> {
    const res = await this.axios.get('/info').then(function (response: {data: {feeRate: number}}) {
      return response.data.feeRate
  })
    const feeRate: number = res
    if (typeof feeRate !== "number" || feeRate < 0) {
      return -1
    }

    return Math.ceil(feeRate * 1e8)
  }

  /**
   * Estimate the fee per byte of txdata, in satoshi. Returns -1 if no estimate is
   * available. It always return -1 for testnet.
   *
   * @param nblocks
   */
  public async estimateFeePerByte(nblocks: number = 6): Promise<any> {
    const feeRate = await this.estimateFee()

    if (feeRate < 0) {
      return feeRate
    }

    return Math.ceil(feeRate / 1024)
  }

  /**
   * Get single transaction's info
   * @param id
   */
  public async getTransactionInfo(
    id: string,
  ): Promise<Insight.IRawTransactionInfo> {
    const res = await this.axios.get(`/tx/${id}`)
    return res.data as Insight.IRawTransactionInfo
  }

  /**
   * Get multiple Transaction info (paginated)
   * @param address
   * @param pageNum
   */
  public async getTransactions(
    address: string,
    pageNum: number = 0,
  ): Promise<Insight.IRawTransactions> {
    const result = await this.axios.get(`/address/${address}/basic-txs?pageSize=10&page=${pageNum}`)
    return result.data as Insight.IRawTransactions
  }
}

export namespace Insight {
  export type Foo = string

  export interface ISendRawTxResult {
    id: string
    status: number
  }

  export interface IUTXO {
    address: string
    transactionId: string
    outputIndex: number

    /**
     * Public key that controls this UXTO, as hex string.
     */
    scriptPubKey: string

    value: number

    isStake: boolean
    height: number
    confirmations: number
  }

  export interface IExecutionResult {
    gasUsed: number
    excepted: string
    newAddress: string
    output: string
    codeDeposit: number
    gasRefunded: number
    depositSize: number
    gasForDeposit: number
  }

  export interface ITransactionReceipt {
    sender: string
    gasUsed: number
    contractAddress: string
    excepted: string
    log: any[]
  }

  export interface IContractCall {
    address: string
    executionResult: any
  }

  export interface IGetInfo {
    addrStr: string

    balance: number
    coinBalance: number;
    totalReceived: number
    totalCoinReceived: number
    totalSent: number
    totalCoinSent: number
    unconfirmed: number
  }

  export interface IVin {
    prevTxId: string
    address: string
  }

  export interface IVout {
    value: string
    scriptPubKey: IScriptPubKey
    receipt: ITransactionReceipt
  }

  export interface IScriptPubKey {
    addresses: string[]
  }

  export interface IQRC20Transfer {
    address: string
    name: string
    symbol: string
    decimals: number
    from: string
    to: string
    value: string
  }

  export interface IRawTransactionInfo {
    id: string
    version: number
    locktime: number
    inputs: IVin[]
    outputs: IVout[]
    confirmations: number
    timestamp: number
    outputValue: number
    inputValue: number
    fees: number
    blockhash: string
    blockheight: number
    qrc20TokenTransfers: IQRC20Transfer[]
  }

  export interface IRawTransactionBasicInfo {
    id: string
    blockheight: number
    blockhash: string
    timestamp: number
    confirmations: number
    amount: number
    inputvalue: number
    outputvalue: number
    fees: number
    type: string
  }

  export interface IRawTransactions {
    totalCount: number
    transactions: IRawTransactionBasicInfo[]
  }
}
