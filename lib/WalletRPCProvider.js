"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
class WalletRPCProvider {
    constructor(wallet) {
        this.wallet = wallet;
    }
    rawCall(method, params = [], opts = {}) {
        const [contractAddress, encodedData, 
        // these are optionals
        amount, gasLimit, gasPrice,] = params;
        // The underlying bcsjs-wallet API expects gasPrice and amount to be specified in sat
        const gasPriceInSatoshi = Math.floor((gasPrice || 0.0000004) * 1e8);
        const amountInSatoshi = Math.floor((amount || 0) * 1e8);
        opts = Object.assign({}, opts, { amount: amountInSatoshi, gasLimit: gasLimit || 200000, gasPrice: gasPriceInSatoshi });
        switch (method.toLowerCase()) {
            case "sendtocontract":
                return this.wallet.contractSend(contractAddress, encodedData, opts);
            case "callcontract":
                return this.wallet.contractCall(contractAddress, encodedData, opts);
            default:
                throw new Error("Unknow method call");
        }
    }
    cancelTokenSource() {
        return axios_1.default.CancelToken.source();
    }
}
exports.WalletRPCProvider = WalletRPCProvider;
//# sourceMappingURL=WalletRPCProvider.js.map