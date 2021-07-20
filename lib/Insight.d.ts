import { INetworkInfo } from "./Network";
export declare class Insight {
    private baseURL;
    static forNetwork(network: INetworkInfo): Insight;
    private axios;
    constructor(baseURL: string);
    listUTXOs(address: string): Promise<Insight.IUTXO[]>;
    getInfo(address: string): Promise<Insight.IGetInfo>;
    sendRawTx(rawtx: string): Promise<Insight.ISendRawTxResult>;
    contractCall(address: string, encodedData: string): Promise<Insight.IContractCall>;
    /**
     * Estimate the fee per KB of txdata, in satoshi. Returns -1 if no estimate is
     * available. It always return -1 for testnet.
     *
     * @param nblocks
     */
    estimateFee(nblocks?: number): Promise<any>;
    /**
     * Estimate the fee per byte of txdata, in satoshi. Returns -1 if no estimate is
     * available. It always return -1 for testnet.
     *
     * @param nblocks
     */
    estimateFeePerByte(nblocks?: number): Promise<any>;
    /**
     * Get single transaction's info
     * @param id
     */
    getTransactionInfo(id: string): Promise<Insight.IRawTransactionInfo>;
    /**
     * Get multiple Transaction info (paginated)
     * @param address
     * @param pageNum
     */
    getTransactions(address: string, pageNum?: number): Promise<Insight.IRawTransactions>;
}
export declare namespace Insight {
    type Foo = string;
    interface ISendRawTxResult {
        id: string;
        status: number;
    }
    interface IUTXO {
        address: string;
        transactionId: string;
        outputIndex: number;
        /**
         * Public key that controls this UXTO, as hex string.
         */
        scriptPubKey: string;
        value: number;
        isStake: boolean;
        height: number;
        confirmations: number;
    }
    interface IExecutionResult {
        gasUsed: number;
        excepted: string;
        newAddress: string;
        output: string;
        codeDeposit: number;
        gasRefunded: number;
        depositSize: number;
        gasForDeposit: number;
    }
    interface ITransactionReceipt {
        sender: string;
        gasUsed: number;
        contractAddress: string;
        excepted: string;
        log: any[];
    }
    interface IContractCall {
        address: string;
        executionResult: any;
    }
    interface IGetInfo {
        addrStr: string;
        balance: number;
        coinBalance: number;
        totalReceived: number;
        totalCoinReceived: number;
        totalSent: number;
        totalCoinSent: number;
        unconfirmed: number;
    }
    interface IVin {
        prevTxId: string;
        address: string;
    }
    interface IVout {
        value: string;
        scriptPubKey: IScriptPubKey;
        receipt: ITransactionReceipt;
    }
    interface IScriptPubKey {
        addresses: string[];
    }
    interface IQRC20Transfer {
        address: string;
        name: string;
        symbol: string;
        decimals: number;
        from: string;
        to: string;
        value: string;
    }
    interface IRawTransactionInfo {
        id: string;
        version: number;
        locktime: number;
        inputs: IVin[];
        outputs: IVout[];
        confirmations: number;
        timestamp: number;
        outputValue: number;
        inputValue: number;
        fees: number;
        blockhash: string;
        blockheight: number;
        qrc20TokenTransfers: IQRC20Transfer[];
    }
    interface IRawTransactionBasicInfo {
        id: string;
        blockheight: number;
        blockhash: string;
        timestamp: number;
        confirmations: number;
        amount: number;
        inputvalue: number;
        outputvalue: number;
        fees: number;
        type: string;
    }
    interface IRawTransactions {
        totalCount: number;
        transactions: IRawTransactionBasicInfo[];
    }
}
