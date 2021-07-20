import RpcClient, { IConfig } from "bcsd-rpc";
import { Network } from "./Network";
export default class bcsRPC {
    rpc: RpcClient;
    constructor(config?: IConfig);
    generate(nblocks: number): Promise<any>;
}
export declare const rpcClient: bcsRPC;
export declare function generateBlock(network: Network): Promise<void>;
